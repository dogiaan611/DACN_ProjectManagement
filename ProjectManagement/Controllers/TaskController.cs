using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Domain.Identity;
using ProjectManagement.Services;
using System.Security.Claims;
using System.Text.Json;

// Controller quản lý Task (ProjectTask): Tạo, lấy chi tiết, cập nhật, xóa task trong column của board.
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("boards/{boardId:int}/columns/{columnId:int}/tasks")]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly PMDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public TaskController(PMDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        // DTOs
        public record CreateTaskDto(string Title, string? Description, string? AssigneeId, TaskPriority? Priority = null, DateTime? DueDate = null);

        // UpdateDto simplified: chỉ cập nhật các trường cơ bản (không di chuyển cột)
        public record UpdateTaskDto(
            string? Title = null,
            string? Description = null,
            string? AssigneeId = null,
            TaskPriority? Priority = null,
            DateTime? DueDate = null
        );

        // Tạo task mới trong column. 
        [HttpPost]
        public async Task<IActionResult> Create(int boardId, int columnId, [FromBody] CreateTaskDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest("Title là bắt buộc");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Lấy column và kiểm tra boardId có đúng không
            var column = await _db.Columns.Include(c => c.Board).FirstOrDefaultAsync(c => c.ColumnId == columnId && c.BoardId == boardId);
            if (column == null) return NotFound("Column không tồn tại");

            var projectId = column.Board.ProjectId;

            // Kiểm tra user có phải member của project
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            // Kiểm tra assignee (nếu có) có phải member của project không
            if (!string.IsNullOrWhiteSpace(dto.AssigneeId))
            {
                var assigneeExists = await _userManager.FindByIdAsync(dto.AssigneeId);
                if (assigneeExists == null) return BadRequest("Assignee không tồn tại");
                var assigneeMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == dto.AssigneeId);
                if (!assigneeMember) return BadRequest("Assignee phải là thành viên của project");
            }

            // Sắp xếp sort order cho task mới
            var maxSort = await _db.PojectTasks.Where(t => t.ColumnId == columnId).MaxAsync(t => (int?)t.SortOrder) ?? -1;
            var sortOrder = maxSort + 1;

            var now = DateTime.UtcNow;
            var task = new ProjectTask
            {
                Title = dto.Title.Trim(),
                Description = dto.Description ?? string.Empty,
                AssigneeId = string.IsNullOrWhiteSpace(dto.AssigneeId) ? null : dto.AssigneeId,
                Priority = dto.Priority ?? TaskPriority.Medium,
                DueDate = dto.DueDate,
                ColumnId = columnId,
                CreatedById = userId,
                CreatedAt = now,
                UpdatedAt = now,
                SortOrder = sortOrder,
                IsLocked = false
            };

            _db.PojectTasks.Add(task);
            await _db.SaveChangesAsync();

            // Tạo activity log cho hành động tạo task
            var newSnapshot = JsonSerializer.Serialize(new
            {
                task.TaskId,
                task.Title,
                task.Description,
                task.AssigneeId,
                Priority = task.Priority.ToString(),
                task.DueDate,
                task.ColumnId,
                task.SortOrder
            });
            var createLog = new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Create Task",
                OldValue = string.Empty,
                NewValue = newSnapshot,
                CreatedAt = DateTime.UtcNow
            };
            _db.ActivityLogs.Add(createLog);
            await _db.SaveChangesAsync();

            // Notification: notify assignee (if assigned and not the creator)
            var currentUserName = (await _db.Users.FindAsync(userId))?.Name ?? "someone";
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != userId)
            {
                // Event 1 & 3: Task Created & Assigned
                await _db.NotifyTaskCreatedAsync(task, currentUserName);
            }

            // Enhanced Feature 1: Notify team leads if priority is Highest
            if (task.Priority == TaskPriority.Critical)
            {
                await _db.NotifyTeamLeadHighestPriorityAsync(task, userId, currentUserName, projectId);
            }

            var assignee = task.AssigneeId == null ? null : await _userManager.FindByIdAsync(task.AssigneeId);

            return CreatedAtAction(nameof(Get), new { boardId = boardId, columnId = columnId, taskId = task.TaskId }, new
            {
                task.TaskId,
                task.Title,
                task.Description,
                task.AssigneeId,
                AssigneeName = assignee?.Name,
                AssigneeAvatarUrl = assignee?.AvatarUrl,
                Priority = task.Priority,
                task.DueDate,
                task.ColumnId,
                task.SortOrder,
                task.CreatedAt,
                task.UpdatedAt
            });
        }

        // Liệt kê các task trong column theo sort order.
        [HttpGet]
        public async Task<IActionResult> List(int boardId, int columnId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var column = await _db.Columns.Include(c => c.Board).FirstOrDefaultAsync(c => c.ColumnId == columnId && c.BoardId == boardId);
            if (column == null) return NotFound("Column không tồn tại");

            var projectId = column.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var tasks = await _db.PojectTasks
                .Where(t => t.ColumnId == columnId)
                .OrderBy(t => t.SortOrder)
                .Include(t => t.Assignee) // Eager loading thông tin Assignee
                .Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.Description,
                    t.AssigneeId,
                    AssigneeName = t.Assignee.Name, // Truy cập trực tiếp sau khi Include
                    AssigneeAvatarUrl = t.Assignee.AvatarUrl, // Truy cập trực tiếp sau khi Include
                    Priority = t.Priority,
                    t.DueDate,
                    t.SortOrder,
                    t.CreatedAt,
                    t.UpdatedAt
                })
                .ToListAsync();

            return Ok(tasks);
        }

        // Lấy chi tiết task
        [HttpGet("{taskId:int}")]
        public async Task<IActionResult> Get(int boardId, int columnId, int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);

            if (task == null) return NotFound();

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            return Ok(new
            {
                task.TaskId,
                task.Title,
                task.Description,
                task.AssigneeId,
                AssigneeName = task.Assignee?.Name,
                AssigneeAvatarUrl = task.Assignee?.AvatarUrl,
                Priority = task.Priority,
                task.DueDate,
                task.ColumnId,
                task.SortOrder,
                task.IsLocked,
                task.CreatedById,
                CreatedByName = task.CreatedBy?.Name,
                task.CreatedAt,
                task.UpdatedAt
            });
        }

        // Cập nhật task (title, description, assignee, priority, dueDate).
        [HttpPut("{taskId:int}")]
        public async Task<IActionResult> Update(int boardId, int columnId, int taskId, [FromBody] UpdateTaskDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks.Include(t => t.Column).ThenInclude(c => c.Board).FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound();

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            // Snapshot cũ để log
            var oldSnapshot = new
            {
                task.Title,
                task.Description,
                task.AssigneeId,
                Priority = task.Priority.ToString(),
                task.DueDate,
                ColumnId = task.ColumnId,
                task.SortOrder
            };
            var oldJson = JsonSerializer.Serialize(oldSnapshot);

            // Lưu giá trị cũ để xác định trường thay đổi
            var oldTitle = task.Title;
            var oldDescription = task.Description;
            var oldAssignee = task.AssigneeId;
            var oldPriority = task.Priority;
            var oldDue = task.DueDate;

            // Thực hiện thay đổi nội bộ (title/desc/priority/due/assignee)
            if (!string.IsNullOrWhiteSpace(dto.Title)) task.Title = dto.Title.Trim();
            if (dto.Description != null) task.Description = dto.Description;
            if (dto.Priority.HasValue) task.Priority = dto.Priority.Value;
            task.DueDate = dto.DueDate;

            if (!string.IsNullOrWhiteSpace(dto.AssigneeId))
            {
                // Nếu có assigneeId, kiểm tra tồn tại và là member
                var assigneeExists = await _userManager.FindByIdAsync(dto.AssigneeId);
                if (assigneeExists == null) return BadRequest("Assignee không tồn tại");
                var assigneeMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == dto.AssigneeId);
                if (!assigneeMember) return BadRequest("Assignee phải là thành viên của project");
                task.AssigneeId = dto.AssigneeId;
            }
            else if (dto.AssigneeId != null)
            {
                // Nếu assigneeId là chuỗi rỗng, bỏ gán assignee
                task.AssigneeId = null;
            }

            task.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // Ghi log nếu có thay đổi
            var changed = new List<string>();
            if (oldTitle != task.Title) changed.Add("Title");
            if (oldDescription != task.Description) changed.Add("Description");
            if (oldAssignee != task.AssigneeId) changed.Add("AssigneeId");
            if (oldPriority != task.Priority) changed.Add("Priority");
            if (oldDue != task.DueDate) changed.Add("DueDate");

            if (changed.Count > 0)
            {
                var newSnapshot = JsonSerializer.Serialize(new
                {
                    task.Title,
                    task.Description,
                    task.AssigneeId,
                    Priority = task.Priority.ToString(),
                    task.DueDate,
                    ColumnId = task.ColumnId,
                    task.SortOrder
                });

                _db.ActivityLogs.Add(new ActivityLog
                {
                    TaskId = task.TaskId,
                    UserId = userId,
                    Action = "Update Task - " + string.Join(", ", changed),
                    OldValue = oldJson,
                    NewValue = newSnapshot,
                    CreatedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync();

                var currentUserName = (await _db.Users.FindAsync(userId))?.Name ?? "someone";

                // Notification: notify new assignee when changed (Event 3)
                if (oldAssignee != task.AssigneeId && !string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != userId)
                {
                    await _db.NotifyTaskAssignedAsync(task, task.AssigneeId, currentUserName);
                }

                // Notification: Event 2 Task Updated
                var changesStr = string.Join(", ", changed);
                await _db.NotifyTaskUpdatedAsync(task, userId, currentUserName, changesStr);

                // Enhanced Feature 1: Notify team leads if priority changed to Highest
                if (oldPriority != task.Priority && task.Priority == TaskPriority.Critical)
                {
                    await _db.NotifyTeamLeadHighestPriorityAsync(task, userId, currentUserName, projectId);
                }
            }

            return Ok(new { message = "Task updated" });
        }

        /// Xóa task.
        [HttpDelete("{taskId:int}")]
        public async Task<IActionResult> Delete(int boardId, int columnId, int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks.Include(t => t.Column).ThenInclude(c => c.Board).FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound();

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            // Snapshot trước khi xóa
            var oldSnapshot = JsonSerializer.Serialize(new
            {
                task.TaskId,
                task.Title,
                task.Description,
                task.AssigneeId,
                Priority = task.Priority.ToString(),
                task.DueDate,
                task.ColumnId,
                task.SortOrder
            });

            var deleteLog = new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Delete Task",
                OldValue = oldSnapshot,
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            };
            _db.ActivityLogs.Add(deleteLog);

            // Notification: Event 5 Task Deleted (before removing)
            var currentUserName = (await _db.Users.FindAsync(userId))?.Name ?? "someone";
            await _db.NotifyTaskDeletedAsync(task, userId, currentUserName);

            _db.PojectTasks.Remove(task);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Task deleted" });
        }
    }
}