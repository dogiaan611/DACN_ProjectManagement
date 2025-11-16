using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Domain.Identity;
using System.Security.Claims;
using System.Text.Json;

namespace ProjectManagement.Controllers
{
    // Controller quản lý Task (ProjectTask): Tạo, lấy chi tiết, cập nhật, xóa task trong column của board.
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

        // UpdateDto expanded: cho phép thay đổi cột (move) bằng TargetColumnId/TargetPosition
        public record UpdateTaskDto(
            string? Title = null,
            string? Description = null,
            string? AssigneeId = null,
            TaskPriority? Priority = null,
            DateTime? DueDate = null,
            int? TargetColumnId = null,      // nếu muốn di chuyển sang cột khác
            int? TargetPosition = null       // position trong cột đích (optional)
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

            return CreatedAtAction(nameof(Get), new { boardId = boardId, columnId = columnId, taskId = task.TaskId }, new
            {
                task.TaskId,
                task.Title,
                task.Description,
                task.AssigneeId,
                AssigneeName = task.AssigneeId == null ? null : (await _userManager.FindByIdAsync(task.AssigneeId))?.Name,
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
                .Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.Description,
                    t.AssigneeId,
                    AssigneeName = t.AssigneeId == null ? null : _db.Users.Where(u => u.Id == t.AssigneeId).Select(u => u.Name).FirstOrDefault(),
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
            var oldColumnId = task.ColumnId;
            var oldSort = task.SortOrder;

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

            // Nếu không có TargetColumnId => chỉ cập nhật fields thông thường
            if (!dto.TargetColumnId.HasValue || dto.TargetColumnId.Value == task.ColumnId)
            {
                // chỉ cập nhật trường nội bộ
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
                }

                return Ok(new { message = "Task updated" });
            }

            // Nếu có TargetColumnId khác => thực hiện di chuyển task (move)
            var targetColumn = await _db.Columns.Include(c => c.Board).FirstOrDefaultAsync(c => c.ColumnId == dto.TargetColumnId.Value);
            if (targetColumn == null) return BadRequest("Target column không tồn tại");
            if (targetColumn.BoardId != boardId) return BadRequest("Target column không thuộc cùng board");

            // WIP check nếu chuyển sang cột khác
            if (task.ColumnId != targetColumn.ColumnId && targetColumn.WipLimit.HasValue)
            {
                var targetCount = await _db.PojectTasks.CountAsync(t => t.ColumnId == targetColumn.ColumnId);
                if (targetCount >= targetColumn.WipLimit.Value) return BadRequest("WIP limit của cột đích đã đầy");
            }

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                // 1) shift down tasks after old position in source column
                var sourceTasksToShift = await _db.PojectTasks
                    .Where(t => t.ColumnId == task.ColumnId && t.SortOrder > task.SortOrder)
                    .ToListAsync();
                foreach (var t in sourceTasksToShift) t.SortOrder--;

                // 2) compute insert position in target
                var targetTasks = await _db.PojectTasks.Where(t => t.ColumnId == targetColumn.ColumnId).ToListAsync();
                var maxTarget = targetTasks.Any() ? targetTasks.Max(t => t.SortOrder) : -1;
                var requested = dto.TargetPosition ?? (maxTarget + 1);
                var insertPos = Math.Max(0, Math.Min(requested, maxTarget + 1));

                // 3) shift up tasks in target with sort >= insertPos
                var toShiftUp = targetTasks.Where(t => t.SortOrder >= insertPos).ToList();
                foreach (var t in toShiftUp) t.SortOrder++;

                // 4) move task
                task.ColumnId = targetColumn.ColumnId;
                task.SortOrder = insertPos;
                task.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                var newSnapshot = JsonSerializer.Serialize(new
                {
                    task.TaskId,
                    OldColumn = oldColumnId,
                    NewColumn = task.ColumnId,
                    OldSort = oldSort,
                    NewSort = task.SortOrder
                });

                _db.ActivityLogs.Add(new ActivityLog
                {
                    TaskId = task.TaskId,
                    UserId = userId,
                    Action = $"Move Task from Column {oldColumnId} to {task.ColumnId}",
                    OldValue = oldJson,
                    NewValue = newSnapshot,
                    CreatedAt = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { message = "Task moved", taskId = task.TaskId, columnId = task.ColumnId, sortOrder = task.SortOrder });
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
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

            _db.PojectTasks.Remove(task);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Task deleted" });
        }
    }
}