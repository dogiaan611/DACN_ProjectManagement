using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Services;
using System.Security.Claims;

//Controller quản lý Subtask: tạo, cập nhật, xóa, liệt kê subtasks trong task
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/subtasks")]
    [Authorize]
    public class SubtaskController : ControllerBase
    {
        private readonly PMDbContext _db;

        public SubtaskController(PMDbContext db)
        {
            _db = db;
        }

        public record CreateSubtaskDto(
            string Title,
            string? Description = null,
            string? AssigneeId = null,
            TaskPriority Priority = TaskPriority.Medium,
            DateTime? DueDate = null
        );

        public record UpdateSubtaskDto(
            string? Title = null,
            string? Description = null,
            string? AssigneeId = null,
            TaskPriority? Priority = null,
            DateTime? DueDate = null,
            bool? IsDone = null
        );

        // Liệt kê subtask của task
        [HttpGet]
        public async Task<IActionResult> List(int boardId, int columnId, int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Task không tồn tại");

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var subtasks = await _db.Subtasks
                .Where(s => s.TaskId == taskId)
                .Include(s => s.Assignee)
                .Include(s => s.CreatedBy)
                .OrderBy(s => s.SubtaskId)
                .Select(s => new
                {
                    s.SubtaskId,
                    s.TaskId,
                    s.Title,
                    s.Description,
                    s.Priority,
                    s.DueDate,
                    s.IsDone,
                    Assignee = s.Assignee == null ? null : new
                    {
                        s.Assignee.Id,
                        s.Assignee.Name,
                        s.Assignee.AvatarUrl
                    },
                    CreatedBy = new
                    {
                        s.CreatedBy.Id,
                        s.CreatedBy.Name,
                        s.CreatedBy.AvatarUrl
                    },
                    s.CreatedAt,
                    s.UpdatedAt
                })
                .ToListAsync();

            return Ok(subtasks);
        }

        // Tạo subtask mới
        [HttpPost]
        public async Task<IActionResult> Create(int boardId, int columnId, int taskId, [FromBody] CreateSubtaskDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest("Title là bắt buộc");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Task không tồn tại");

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var subtask = new Subtask
            {
                TaskId = taskId,
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                AssigneeId = dto.AssigneeId,
                Priority = dto.Priority,
                DueDate = dto.DueDate,
                IsDone = false,
                CreatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Subtasks.Add(subtask);

            // Activity log for parent task
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Add Subtask",
                OldValue = string.Empty,
                NewValue = subtask.Title,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            // Subtask activity log
            _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
            {
                SubtaskId = subtask.SubtaskId,
                UserId = userId,
                Action = "Create Subtask",
                OldValue = string.Empty,
                NewValue = subtask.Title,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            // Notification: Event 11 Subtask Created
            var currentUserName = (await _db.Users.FindAsync(userId))?.Name ?? "someone";
            await _db.NotifySubtaskCreatedAsync(task, userId, currentUserName, subtask.Title);

            return CreatedAtAction(nameof(Get), new { boardId, columnId, taskId, subtaskId = subtask.SubtaskId }, new
            {
                subtask.SubtaskId,
                subtask.TaskId,
                subtask.Title,
                subtask.IsDone,
                subtask.CreatedAt
            });
        }

        // Lấy chi tiết subtask
        [HttpGet("{subtaskId:int}")]
        public async Task<IActionResult> Get(int boardId, int columnId, int taskId, int subtaskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var subtask = await _db.Subtasks
                .Include(s => s.Task)
                    .ThenInclude(t => t.Column!)
                        .ThenInclude(c => c.Board)
                .Include(s => s.Assignee)
                .Include(s => s.CreatedBy)
                .FirstOrDefaultAsync(s => s.SubtaskId == subtaskId && s.TaskId == taskId && s.Task.ColumnId == columnId && s.Task.Column!.BoardId == boardId);
            if (subtask == null) return NotFound();

            var projectId = subtask.Task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            return Ok(new
            {
                subtask.SubtaskId,
                subtask.TaskId,
                subtask.Title,
                subtask.Description,
                subtask.Priority,
                subtask.DueDate,
                subtask.IsDone,
                Assignee = subtask.Assignee == null ? null : new
                {
                    subtask.Assignee.Id,
                    subtask.Assignee.Name,
                    subtask.Assignee.AvatarUrl
                },
                CreatedBy = new
                {
                    subtask.CreatedBy.Id,
                    subtask.CreatedBy.Name,
                    subtask.CreatedBy.AvatarUrl
                },
                subtask.CreatedAt,
                subtask.UpdatedAt
            });
        }

        // Cập nhật subtask
        [HttpPut("{subtaskId:int}")]
        public async Task<IActionResult> Update(int boardId, int columnId, int taskId, int subtaskId, [FromBody] UpdateSubtaskDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var subtask = await _db.Subtasks
                .Include(s => s.Task)
                    .ThenInclude(t => t.Column!)
                        .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(s => s.SubtaskId == subtaskId && s.TaskId == taskId && s.Task.ColumnId == columnId && s.Task.Column!.BoardId == boardId);
            if (subtask == null) return NotFound();

            var projectId = subtask.Task.Column!.Board.ProjectId;
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Track old values for change detection
            var oldTitle = subtask.Title;
            var oldDescription = subtask.Description;
            var oldAssigneeId = subtask.AssigneeId;
            var oldPriority = subtask.Priority;
            var oldDueDate = subtask.DueDate;
            var oldIsDone = subtask.IsDone;

            var changed = new List<string>();

            // Update Title
            if (!string.IsNullOrWhiteSpace(dto.Title) && dto.Title.Trim() != oldTitle)
            {
                subtask.Title = dto.Title.Trim();
                changed.Add("Title");
                _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
                {
                    SubtaskId = subtaskId,
                    UserId = userId,
                    Action = "Update Title",
                    OldValue = oldTitle,
                    NewValue = subtask.Title,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Update Description
            if (dto.Description != null && dto.Description != oldDescription)
            {
                subtask.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
                changed.Add("Description");
                _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
                {
                    SubtaskId = subtaskId,
                    UserId = userId,
                    Action = "Update Description",
                    OldValue = oldDescription ?? string.Empty,
                    NewValue = subtask.Description ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Update Assignee
            if (dto.AssigneeId != null && dto.AssigneeId != oldAssigneeId)
            {
                subtask.AssigneeId = string.IsNullOrWhiteSpace(dto.AssigneeId) ? null : dto.AssigneeId;
                changed.Add("Assignee");
                _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
                {
                    SubtaskId = subtaskId,
                    UserId = userId,
                    Action = "Assign Subtask",
                    OldValue = oldAssigneeId ?? "Unassigned",
                    NewValue = subtask.AssigneeId ?? "Unassigned",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Update Priority
            if (dto.Priority.HasValue && dto.Priority.Value != oldPriority)
            {
                subtask.Priority = dto.Priority.Value;
                changed.Add("Priority");
                _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
                {
                    SubtaskId = subtaskId,
                    UserId = userId,
                    Action = "Update Priority",
                    OldValue = oldPriority.ToString(),
                    NewValue = subtask.Priority.ToString(),
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Update DueDate
            if (dto.DueDate != oldDueDate)
            {
                subtask.DueDate = dto.DueDate;
                changed.Add("DueDate");
                _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
                {
                    SubtaskId = subtaskId,
                    UserId = userId,
                    Action = "Update Due Date",
                    OldValue = oldDueDate?.ToString("yyyy-MM-dd") ?? "None",
                    NewValue = subtask.DueDate?.ToString("yyyy-MM-dd") ?? "None",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Update IsDone
            if (dto.IsDone.HasValue && dto.IsDone.Value != oldIsDone)
            {
                subtask.IsDone = dto.IsDone.Value;
                changed.Add("Status");
                _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
                {
                    SubtaskId = subtaskId,
                    UserId = userId,
                    Action = "Update Status",
                    OldValue = oldIsDone.ToString(),
                    NewValue = subtask.IsDone.ToString(),
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Update timestamp and create parent task activity log if any changes
            if (changed.Any())
            {
                subtask.UpdatedAt = DateTime.UtcNow;

                _db.ActivityLogs.Add(new ActivityLog
                {
                    TaskId = subtask.TaskId,
                    UserId = userId,
                    Action = "Update Subtask",
                    OldValue = $"Subtask: {oldTitle}",
                    NewValue = $"Changed: {string.Join(", ", changed)}",
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();

            // Notification: Event 12 Subtask Status Changed (if IsDone changed)
            if (oldIsDone != subtask.IsDone)
            {
                var currentUserName = (await _db.Users.FindAsync(userId))?.Name ?? "someone";
                await _db.NotifySubtaskStatusChangedAsync(subtask.Task, userId, currentUserName, subtask.Title, subtask.IsDone);
            }

            return Ok(new { message = "Subtask updated", changed });
        }

        // Chuyển trạng thái hoàn thành của subtask
        [HttpPatch("{subtaskId:int}/toggle")]
        public async Task<IActionResult> Toggle(int boardId, int columnId, int taskId, int subtaskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var subtask = await _db.Subtasks
                .Include(s => s.Task)
                    .ThenInclude(t => t.Column!)
                        .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(s => s.SubtaskId == subtaskId && s.TaskId == taskId && s.Task.ColumnId == columnId && s.Task.Column!.BoardId == boardId);
            if (subtask == null) return NotFound();

            var projectId = subtask.Task.Column!.Board.ProjectId;
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            var oldIsDone = subtask.IsDone;
            subtask.IsDone = !oldIsDone;

            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = subtask.TaskId,
                UserId = userId,
                Action = subtask.IsDone ? "Complete Subtask" : "Reopen Subtask",
                OldValue = $"IsDone:{oldIsDone}",
                NewValue = $"IsDone:{subtask.IsDone}",
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            // Notification: Event 12 Subtask Status Changed
            var currentUserName = (await _db.Users.FindAsync(userId))?.Name ?? "someone";
            await _db.NotifySubtaskStatusChangedAsync(subtask.Task, userId, currentUserName, subtask.Title, subtask.IsDone);

            return Ok(new { subtask.SubtaskId, subtask.IsDone });
        }

        // Xóa subtask
        [HttpDelete("{subtaskId:int}")]
        public async Task<IActionResult> Delete(int boardId, int columnId, int taskId, int subtaskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var subtask = await _db.Subtasks
                .Include(s => s.Task)
                    .ThenInclude(t => t.Column!)
                        .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(s => s.SubtaskId == subtaskId && s.TaskId == taskId && s.Task.ColumnId == columnId && s.Task.Column!.BoardId == boardId);
            if (subtask == null) return NotFound();

            var projectId = subtask.Task.Column!.Board.ProjectId;
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Notification: Event 14 Subtask Deleted (before removing)
            var currentUserName = (await _db.Users.FindAsync(userId))?.Name ?? "someone";
            await _db.NotifySubtaskDeletedAsync(subtask.Task, userId, currentUserName, subtask.Title);

            // Cho phép thành viên xóa, có thể giới hạn quyền nếu cần
            _db.Subtasks.Remove(subtask);

            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = subtask.TaskId,
                UserId = userId,
                Action = "Delete Subtask",
                OldValue = subtask.Title,
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Subtask deleted" });
        }

        // Get activity logs for subtask
        [HttpGet("{subtaskId:int}/activity")]
        public async Task<IActionResult> GetActivity(int boardId, int columnId, int taskId, int subtaskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var subtask = await _db.Subtasks
                .Include(s => s.Task)
                    .ThenInclude(t => t.Column!)
                        .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(s => s.SubtaskId == subtaskId && s.TaskId == taskId && 
                    s.Task.ColumnId == columnId && s.Task.Column!.BoardId == boardId);
            
            if (subtask == null) return NotFound("Subtask not found");

            var projectId = subtask.Task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var activities = await _db.SubtaskActivityLogs
                .Where(a => a.SubtaskId == subtaskId)
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.LogId,
                    a.SubtaskId,
                    User = a.User == null ? null : new
                    {
                        a.User.Id,
                        a.User.Name,
                        a.User.AvatarUrl
                    },
                    a.Action,
                    a.OldValue,
                    a.NewValue,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(activities);
        }
    }
}