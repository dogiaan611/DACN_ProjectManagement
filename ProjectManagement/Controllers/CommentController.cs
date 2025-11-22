using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Domain.Identity;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace ProjectManagement.Controllers
{
    // Controller quản lý Comment trên Task: tạo comment, liệt kê comment, xóa comment
    [ApiController]
    [Route("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/comments")]
    [Authorize]
    public class CommentController : ControllerBase
    {
        private readonly PMDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public CommentController(PMDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public record CreateCommentDto(string Content);

        // Liệt kê comment của task theo CreatedAt tăng dần.
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

            var comments = await _db.Comments
                .Where(c => c.TaskId == taskId)
                .OrderBy(c => c.CreatedAt)
                .Include(c => c.User)
                .Select(c => new
                {
                    c.CommentId,
                    c.TaskId,
                    c.UserId,
                    UserName = c.User.Name,
                    c.Content,
                    c.CreatedAt,
                    Mentions = c.Mentions.Select(m => new { m.UserId, UserName = m.User.Name })
                })
                .ToListAsync();

            return Ok(comments);
        }

        // Tạo comment mới cho task. Nếu có @mentions sẽ tạo CommentMention.
        [HttpPost]
        public async Task<IActionResult> Create(int boardId, int columnId, int taskId, [FromBody] CreateCommentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Content là bắt buộc");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Kiểm tra task tồn tại và user là member của project
            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return NotFound("Task không tồn tại");

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var now = DateTime.UtcNow;
            var comment = new Comment
            {
                TaskId = taskId,
                UserId = userId,
                Content = dto.Content.Trim(),
                CreatedAt = now
            };

            _db.Comments.Add(comment);
            await _db.SaveChangesAsync();

            // Tìm và tạo CommentMention cho các user được mention trong comment
            var mentionPattern = new Regex(@"@([^\s@,.:;!()\[\]\""'<>]+)", RegexOptions.Compiled);
            var matches = mentionPattern.Matches(dto.Content);
            var mentionedUserIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (Match m in matches)
            {
                var raw = m.Groups[1].Value.Trim();
                if (string.IsNullOrWhiteSpace(raw)) continue;

                // Thử tìm user theo email hoặc username/name
                ApplicationUser? mentioned = null;
                if (raw.Contains("@"))
                {
                    mentioned = await _userManager.FindByEmailAsync(raw);
                }
                if (mentioned == null)
                {
                    var normalized = raw.ToUpperInvariant();
                    mentioned = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedUserName == normalized || u.Name == raw);
                }

                if (mentioned == null) continue;
                if (mentioned.Id == userId) continue; // Bỏ qua tự mention chính mình
                if (mentionedUserIds.Add(mentioned.Id))
                {
                    // Tạo CommentMention nếu chưa có
                    var cm = new CommentMention
                    {
                        CommentId = comment.CommentId,
                        UserId = mentioned.Id
                    };
                    _db.CommentMentions.Add(cm);
                }
            }

            await _db.SaveChangesAsync();

            // Tạo log hoạt động
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Add Comment",
                OldValue = string.Empty,
                NewValue = comment.Content,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(List), new { boardId, columnId, taskId }, new
            {
                comment.CommentId,
                comment.TaskId,
                comment.UserId,
                UserName = (await _db.Users.Where(u => u.Id == comment.UserId).Select(u => u.Name).FirstOrDefaultAsync()),
                comment.Content,
                comment.CreatedAt
            });
        }

        // Xóa comment.
        [HttpDelete("{commentId:int}")]
        public async Task<IActionResult> Delete(int boardId, int columnId, int taskId, int commentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var comment = await _db.Comments
                .Include(c => c.Task)
                    .ThenInclude(t => t.Column!)
                        .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(c => c.CommentId == commentId && c.TaskId == taskId && c.Task.ColumnId == columnId && c.Task.Column!.BoardId == boardId);

            if (comment == null) return NotFound();

            var projectId = comment.Task.Column!.Board.ProjectId;
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Chỉ author hoặc project owner/ProjectAdmin được xóa comment
            if (comment.UserId != userId && !(membership.IsOwner || membership.Role == ProjectRole.ProjectAdmin))
                return Forbid();

            // Xóa các mention liên quan
            var mentions = await _db.CommentMentions.Where(cm => cm.CommentId == commentId).ToListAsync();
            _db.CommentMentions.RemoveRange(mentions);

            _db.Comments.Remove(comment);

            // Tạo log hoạt động
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = comment.TaskId,
                UserId = userId,
                Action = "Delete Comment",
                OldValue = comment.Content,
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Comment deleted" });
        }

        // Cập nhật comment.
        [HttpPut("{commentId:int}")]
        public async Task<IActionResult> Update(int boardId, int columnId, int taskId, int commentId, [FromBody] CreateCommentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Content is required");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Kiểm tra comment tồn tại và user là member của project
            var comment = await _db.Comments
                .Include(c => c.Task)
                    .ThenInclude(t => t.Column!)
                        .ThenInclude(c => c.Board)
                .Include(c => c.Mentions)
                .FirstOrDefaultAsync(c =>
                    c.CommentId == commentId &&
                    c.TaskId == taskId &&
                    c.Task.ColumnId == columnId &&
                    c.Task.Column!.BoardId == boardId);

            if (comment == null) return NotFound("Comment not found");

            var projectId = comment.Task.Column!.Board.ProjectId;
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Chỉ author hoặc project owner/ProjectAdmin được sửa comment
            if (comment.UserId != userId && !(membership.IsOwner || membership.Role == ProjectRole.ProjectAdmin))
                return Forbid();

            var oldContent = comment.Content ?? string.Empty;
            var newContent = dto.Content.Trim();
            if (oldContent == newContent) return Ok(new { message = "No changes" });

            // Cập nhật nội dung comment
            comment.Content = newContent;

            // Đánh dấu mentions mới và xóa mentions không còn tồn tại
            var mentionPattern = new Regex(@"@([^\s@,.:;!()\[\]\""'<>]+)", RegexOptions.Compiled);
            var matches = mentionPattern.Matches(newContent);
            var newMentionIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (Match m in matches)
            {
                var raw = m.Groups[1].Value.Trim();
                if (string.IsNullOrWhiteSpace(raw)) continue;

                ApplicationUser? mentioned = null;
                if (raw.Contains("@"))
                {
                    mentioned = await _userManager.FindByEmailAsync(raw);
                }
                if (mentioned == null)
                {
                    var normalized = raw.ToUpperInvariant();
                    mentioned = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedUserName == normalized || u.Name == raw);
                }

                if (mentioned == null) continue;
                if (mentioned.Id == userId) continue; // Bỏ qua tự mention chính mình
                newMentionIds.Add(mentioned.Id);
            }

            var existingMentionIds = comment.Mentions.Select(cm => cm.UserId).ToHashSet(StringComparer.OrdinalIgnoreCase);

            // Thêm mentions mới
            var toAdd = newMentionIds.Except(existingMentionIds).ToList();
            foreach (var uid in toAdd)
            {
                _db.CommentMentions.Add(new CommentMention { CommentId = comment.CommentId, UserId = uid });
            }

            // Xóa mentions không còn tồn tại
            var toRemove = existingMentionIds.Except(newMentionIds).ToList();
            if (toRemove.Any())
            {
                var removeRows = await _db.CommentMentions
                    .Where(cm => cm.CommentId == comment.CommentId && toRemove.Contains(cm.UserId))
                    .ToListAsync();
                _db.CommentMentions.RemoveRange(removeRows);
            }

            // Activity log cho việc sửa comment
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = comment.TaskId,
                UserId = userId,
                Action = "Edit Comment",
                OldValue = oldContent,
                NewValue = newContent,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            // Trở về comment đã cập nhật
            var updated = await _db.Comments
                .Where(c => c.CommentId == comment.CommentId)
                .Include(c => c.User)
                .Include(c => c.Mentions)
                    .ThenInclude(m => m.User)
                .Select(c => new
                {
                    c.CommentId,
                    c.TaskId,
                    c.UserId,
                    UserName = c.User.Name,
                    c.Content,
                    c.CreatedAt,
                    Mentions = c.Mentions.Select(m => new { m.UserId, UserName = m.User.Name })
                })
                .FirstAsync();

            return Ok(updated);
        }
    }
}