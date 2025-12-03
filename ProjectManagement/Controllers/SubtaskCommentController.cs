using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using ProjectManagement.Domain.Identity;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/subtasks/{subtaskId:int}/comments")]
    [Authorize]
    public class SubtaskCommentController : ControllerBase
    {
        private readonly PMDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public SubtaskCommentController(PMDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public record CreateSubtaskCommentDto(string Content);
        public record UpdateSubtaskCommentDto(string Content);

        // List comments on subtask
        [HttpGet]
        public async Task<IActionResult> List(int boardId, int columnId, int taskId, int subtaskId)
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

            var comments = await _db.SubtaskComments
                .Where(c => c.SubtaskId == subtaskId)
                .Include(c => c.User)
                .Include(c => c.Mentions)
                    .ThenInclude(m => m.User)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.CommentId,
                    c.SubtaskId,
                    c.Content,
                    User = new
                    {
                        c.User.Id,
                        c.User.Name,
                        c.User.AvatarUrl
                    },
                    Mentions = c.Mentions.Select(m => new
                    {
                        m.User.Id,
                        m.User.Name
                    }).ToList(),
                    c.CreatedAt,
                    c.UpdatedAt
                })
                .ToListAsync();

            return Ok(comments);
        }

        // Create comment
        [HttpPost]
        public async Task<IActionResult> Create(int boardId, int columnId, int taskId, int subtaskId, [FromBody] CreateSubtaskCommentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Content is required");

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

            var comment = new SubtaskComment
            {
                SubtaskId = subtaskId,
                UserId = userId,
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _db.SubtaskComments.Add(comment);
            await _db.SaveChangesAsync();

            // Detect @mentions
            var mentionedUserIds = ExtractMentions(dto.Content);
            if (mentionedUserIds.Any())
            {
                foreach (var mentionedUserId in mentionedUserIds)
                {
                    _db.SubtaskCommentMentions.Add(new SubtaskCommentMention
                    {
                        CommentId = comment.CommentId,
                        UserId = mentionedUserId
                    });
                }
                await _db.SaveChangesAsync();
            }

            // Activity log
            _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
            {
                SubtaskId = subtaskId,
                UserId = userId,
                Action = "Add Comment",
                OldValue = string.Empty,
                NewValue = dto.Content.Length > 50 ? dto.Content.Substring(0, 50) + "..." : dto.Content,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(List), new { boardId, columnId, taskId, subtaskId }, new
            {
                comment.CommentId,
                comment.SubtaskId,
                comment.Content,
                comment.CreatedAt
            });
        }

        // Update comment
        [HttpPut("{commentId:int}")]
        public async Task<IActionResult> Update(int boardId, int columnId, int taskId, int subtaskId, int commentId, [FromBody] UpdateSubtaskCommentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Content is required");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var comment = await _db.SubtaskComments
                .Include(c => c.Subtask)
                    .ThenInclude(s => s.Task)
                        .ThenInclude(t => t.Column!)
                            .ThenInclude(col => col.Board)
                .FirstOrDefaultAsync(c => c.CommentId == commentId && c.SubtaskId == subtaskId);
            
            if (comment == null) return NotFound("Comment not found");

            var projectId = comment.Subtask.Task.Column!.Board.ProjectId;
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Only author or project admin can edit
            if (comment.UserId != userId && !(membership.IsOwner || membership.Role == ProjectRole.ProjectAdmin))
                return Forbid();

            var oldContent = comment.Content;
            comment.Content = dto.Content.Trim();
            comment.UpdatedAt = DateTime.UtcNow;

            // Update mentions
            var existingMentions = await _db.SubtaskCommentMentions.Where(m => m.CommentId == commentId).ToListAsync();
            _db.SubtaskCommentMentions.RemoveRange(existingMentions);

            var mentionedUserIds = ExtractMentions(dto.Content);
            if (mentionedUserIds.Any())
            {
                foreach (var mentionedUserId in mentionedUserIds)
                {
                    _db.SubtaskCommentMentions.Add(new SubtaskCommentMention
                    {
                        CommentId = commentId,
                        UserId = mentionedUserId
                    });
                }
            }

            // Activity log
            _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
            {
                SubtaskId = subtaskId,
                UserId = userId,
                Action = "Edit Comment",
                OldValue = oldContent.Length > 50 ? oldContent.Substring(0, 50) + "..." : oldContent,
                NewValue = comment.Content.Length > 50 ? comment.Content.Substring(0, 50) + "..." : comment.Content,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return Ok(new { message = "Comment updated" });
        }

        // Delete comment
        [HttpDelete("{commentId:int}")]
        public async Task<IActionResult> Delete(int boardId, int columnId, int taskId, int subtaskId, int commentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var comment = await _db.SubtaskComments
                .Include(c => c.Subtask)
                    .ThenInclude(s => s.Task)
                        .ThenInclude(t => t.Column!)
                            .ThenInclude(col => col.Board)
                .FirstOrDefaultAsync(c => c.CommentId == commentId && c.SubtaskId == subtaskId);
            
            if (comment == null) return NotFound("Comment not found");

            var projectId = comment.Subtask.Task.Column!.Board.ProjectId;
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Only author or project admin can delete
            if (comment.UserId != userId && !(membership.IsOwner || membership.Role == ProjectRole.ProjectAdmin))
                return Forbid();

            // Delete mentions
            var mentions = await _db.SubtaskCommentMentions.Where(m => m.CommentId == commentId).ToListAsync();
            _db.SubtaskCommentMentions.RemoveRange(mentions);

            _db.SubtaskComments.Remove(comment);

            // Activity log
            _db.SubtaskActivityLogs.Add(new SubtaskActivityLog
            {
                SubtaskId = subtaskId,
                UserId = userId,
                Action = "Delete Comment",
                OldValue = comment.Content.Length > 50 ? comment.Content.Substring(0, 50) + "..." : comment.Content,
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return Ok(new { message = "Comment deleted" });
        }

        // Helper: Extract @mentions from content
        private List<string> ExtractMentions(string content)
        {
            var mentions = new List<string>();
            var regex = new Regex(@"@(\w+(?:\.\w+)*)");
            var matches = regex.Matches(content);

            foreach (Match match in matches)
            {
                var username = match.Groups[1].Value;
                var user = _db.Users.FirstOrDefault(u => u.UserName == username);
                if (user != null && !mentions.Contains(user.Id))
                {
                    mentions.Add(user.Id);
                }
            }

            return mentions;
        }
    }
}
