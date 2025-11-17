using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{
    // Controller quản lý ActivityLog cho Task: Liệt kê, tạo activity log
    [ApiController]
    [Route("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/activity")]
    [Authorize]
    public class ActivityLogController : ControllerBase
    {
        private readonly PMDbContext _db;

        public ActivityLogController(PMDbContext db)
        {
            _db = db;
        }

        public record CreateActivityDto(string Action, string? OldValue = null, string? NewValue = null);

        // Liệt kê activity log của task (mới nhất trước).
        [HttpGet]
        public async Task<IActionResult> List(int boardId, int columnId, int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Kiểm tra task tồn tại và thuộc column+board
            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);

            if (task == null) return NotFound("Task không tồn tại");

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            // Include User để tránh vấn đề translation khi access navigation property trong projection
            var logs = await _db.ActivityLogs
                .Include(l => l.User)
                .Where(l => l.TaskId == taskId)
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new
                {
                    l.LogId,
                    l.TaskId,
                    l.UserId,
                    UserName = l.User != null ? l.User.Name : null,
                    l.Action,
                    l.OldValue,
                    l.NewValue,
                    l.CreatedAt
                })
                .ToListAsync();

            return Ok(logs);
        }

        // Tạo activity log cho task.
        [HttpPost]
        public async Task<IActionResult> Create(int boardId, int columnId, int taskId, [FromBody] CreateActivityDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Action)) return BadRequest("Action là bắt buộc");

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

            var log = new ActivityLog
            {
                TaskId = taskId,
                UserId = userId,
                Action = dto.Action.Trim(),
                OldValue = dto.OldValue ?? string.Empty,
                NewValue = dto.NewValue ?? string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            _db.ActivityLogs.Add(log);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(List), new { boardId, columnId, taskId }, new
            {
                log.LogId,
                log.TaskId,
                log.UserId,
                Action = log.Action,
                log.OldValue,
                log.NewValue,
                log.CreatedAt
            });
        }
    }
}