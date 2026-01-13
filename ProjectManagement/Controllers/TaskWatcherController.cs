using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Domain.Identity;
using System.Security.Claims;

// Quản lý Watchers trên Task: Liệt kê, thêm, xóa watcher
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/watchers")]
    [Authorize]
    public class TaskWatcherController : ControllerBase
    {
        private readonly PMDbContext _db;

        public TaskWatcherController(PMDbContext db)
        {
            _db = db;
        }

        public record AddWatcherDto(string? UserId);

        // Liệt kê watchers của task
        [HttpGet]
        public async Task<IActionResult> List(int boardId, int columnId, int taskId)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (requesterId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!).ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Task không tồn tại");

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == requesterId);
            if (!isMember) return Forbid();

            var watchers = await _db.TaskWatchers
                .Where(w => w.TaskId == taskId)
                .Include(w => w.User)
                .Select(w => new
                {
                    w.UserId,
                    UserName = w.User != null ? w.User.Name : null,
                    AvatarUrl = w.User != null ? w.User.AvatarUrl : null
                })
                .ToListAsync();

            return Ok(watchers);
        }

        // Thêm watcher (mặc định thêm chính requester nếu không truyền userId)
        [HttpPost]
        public async Task<IActionResult> Add(int boardId, int columnId, int taskId, [FromBody] AddWatcherDto dto)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (requesterId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!).ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Task không tồn tại");

            var projectId = task.Column!.Board.ProjectId;
            var isMemberRequester = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == requesterId);
            if (!isMemberRequester) return Forbid();

            var targetUserId = string.IsNullOrWhiteSpace(dto?.UserId) ? requesterId : dto.UserId;

            // Đảm bảo user là member của project
            var isMemberTarget = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == targetUserId);
            if (!isMemberTarget) return BadRequest("Người dùng không phải là member của project");

            // Tránh thêm trùng
            var exists = await _db.TaskWatchers.AnyAsync(w => w.TaskId == taskId && w.UserId == targetUserId);
            if (exists) return BadRequest("Watcher đã được thêm");

            _db.TaskWatchers.Add(new TaskWatcher
            {
                TaskId = taskId,
                UserId = targetUserId
            });

            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = requesterId,
                Action = "Add Watcher",
                OldValue = string.Empty,
                NewValue = $"User:{targetUserId}",
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Thêm Watcher", userId = targetUserId });
        }

        // Xóa watcher: user tự xóa hoặc project owner/admin có quyền xóa người khác
        [HttpDelete("{userId}")]
        public async Task<IActionResult> Remove(int boardId, int columnId, int taskId, string userId)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (requesterId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!).ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Task không tồn tại");

            var projectId = task.Column!.Board.ProjectId;
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == requesterId);
            if (membership == null) return Forbid();

            // Chỉ cho phép xóa nếu là chính user đó hoặc requester là owner/admin
            if (requesterId != userId && !(membership.IsOwner || membership.Role == ProjectRole.ProjectAdmin))
                return Forbid();

            var mapping = await _db.TaskWatchers.FirstOrDefaultAsync(w => w.TaskId == taskId && w.UserId == userId);
            if (mapping == null) return NotFound();

            _db.TaskWatchers.Remove(mapping);

            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = requesterId,
                Action = "Remove Watcher",
                OldValue = $"User:{userId}",
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Xóa Watcher", userId });
        }
    }
}