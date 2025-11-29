using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using System.Security.Claims;

// Quản lý tag của task: liệt kê, gán, gỡ tag
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/tags")]
    [Authorize]
    public class TaskTagController : ControllerBase
    {
        private readonly PMDbContext _db;

        public TaskTagController(PMDbContext db)
        {
            _db = db;
        }

        public record AssignTagDto(int TagId);

        // Liệt kê tag của task
        [HttpGet]
        public async Task<IActionResult> List(int boardId, int columnId, int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Không tìm thấy Task");

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var tags = await _db.TaskTags
                .Where(tt => tt.TaskId == taskId)
                .Include(tt => tt.Tag)
                .Select(tt => new { tt.TagId, tt.Tag.Name, tt.Tag.Color })
                .ToListAsync();

            return Ok(tags);
        }

        // Gán tag cho task
        [HttpPost]
        public async Task<IActionResult> Assign(int boardId, int columnId, int taskId, [FromBody] AssignTagDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Không tìm thấy Task");

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var tag = await _db.Tags.FirstOrDefaultAsync(t => t.TagId == dto.TagId);
            if (tag == null) return BadRequest("Không tìm thấyTag");
            if (tag.ProjectId != projectId) return BadRequest("Tag không thuộc Project");

            var exists = await _db.TaskTags.AnyAsync(tt => tt.TaskId == taskId && tt.TagId == dto.TagId);
            if (exists) return BadRequest("Tag đã được gán cho Task");

            _db.TaskTags.Add(new TaskTag { TaskId = taskId, TagId = dto.TagId });

            // Activity log for task-level change
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Assign Tag",
                OldValue = string.Empty,
                NewValue = $"TagId:{dto.TagId};TagName:{tag.Name}",
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return Ok(new { message = "Gán Tag thành công" });
        }

        // Gỡ tag khỏi task
        [HttpDelete("{tagId:int}")]
        public async Task<IActionResult> Unassign(int boardId, int columnId, int taskId, int tagId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Không tìm thấy Task");

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var mapping = await _db.TaskTags.FirstOrDefaultAsync(tt => tt.TaskId == taskId && tt.TagId == tagId);
            if (mapping == null) return NotFound();

            // Lấy tên tag để ghi log
            var tagName = (await _db.Tags.FindAsync(tagId))?.Name ?? string.Empty;

            _db.TaskTags.Remove(mapping);

            // Activity log for task-level change
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Unassign Tag",
                OldValue = $"TagId:{tagId};TagName:{tagName}",
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Tag đã được xóa khỏi Task" });
        }
    }
}