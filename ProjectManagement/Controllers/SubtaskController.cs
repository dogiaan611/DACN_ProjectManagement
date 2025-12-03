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

        public record CreateSubtaskDto(string Title);
        public record UpdateSubtaskDto(string? Title = null, bool? IsDone = null);

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
                .OrderBy(s => s.SubtaskId)
                .Select(s => new
                {
                    s.SubtaskId,
                    s.TaskId,
                    s.Title,
                    s.IsDone,
                    s.CreatedAt
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
                IsDone = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.Subtasks.Add(subtask);

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
                subtask.IsDone,
                subtask.CreatedAt
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

            // Cho phép thành viên cập nhật, có thể giới hạn quyền nếu cần
            var oldTitle = subtask.Title;
            var oldIsDone = subtask.IsDone;

            if (!string.IsNullOrWhiteSpace(dto.Title)) subtask.Title = dto.Title.Trim();
            if (dto.IsDone.HasValue) subtask.IsDone = dto.IsDone.Value;

            // Tạo Activity Log nếu có thay đổi
            if (oldTitle != subtask.Title || oldIsDone != subtask.IsDone)
            {
                _db.ActivityLogs.Add(new ActivityLog
                {
                    TaskId = subtask.TaskId,
                    UserId = userId,
                    Action = "Update Subtask",
                    OldValue = $"Title:{oldTitle};IsDone:{oldIsDone}",
                    NewValue = $"Title:{subtask.Title};IsDone:{subtask.IsDone}",
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

            return Ok(new { message = "Subtask updated" });
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
    }
}