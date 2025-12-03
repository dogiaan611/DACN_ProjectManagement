using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Domain.Identity;
using Microsoft.AspNetCore.Identity;
using ProjectManagement.Services;
using System.Security.Claims;
using System.IO;

// Controller quản lý Attachment cho Task / Subtask / Comment: Upload file, liệt kê, tải về, xóa. 
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Authorize]
    public class AttachmentController : ControllerBase
    {
        private readonly PMDbContext _db;
        private readonly IWebHostEnvironment _env;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly FileExtensionContentTypeProvider _contentTypeProvider = new();

        // Giới hạn file: 25 MB
        private const long MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

        // Danh sách extension được chấp nhận. Điều chỉnh nếu cần.
        private static readonly string[] ALLOWED_EXT = new[]
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".csv", ".txt", ".md", ".zip", ".rar"
        };

        public AttachmentController(PMDbContext db, IWebHostEnvironment env, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _env = env;
            _userManager = userManager;
        }

        private string GetWebRoot() => _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        // Lưu file vào disk và trả về đường dẫn relative (ví dụ: /uploads/2025/11/{guid}_file.ext)
        private async Task<string> SaveFileAsync(IFormFile file)
        {
            var webRoot = GetWebRoot();
            var uploadsRoot = Path.Combine(webRoot, "uploads");
            var folder = Path.Combine(DateTime.UtcNow.Year.ToString(), DateTime.UtcNow.Month.ToString("D2"));
            var fullFolder = Path.Combine(uploadsRoot, folder);
            Directory.CreateDirectory(fullFolder);

            var storedName = $"{Guid.NewGuid():N}_{Path.GetFileName(file.FileName)}";
            var fullPath = Path.Combine(fullFolder, storedName);

            await using (var stream = System.IO.File.Create(fullPath))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = $"/uploads/{folder}/{storedName}";
            return relativePath;
        }

        // Map đường dẫn relative lưu trong DB -> đường dẫn vật lý trên disk.
        private string MapToPhysical(string relativePath)
        {
            var webRoot = GetWebRoot();
            var rel = relativePath.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar);
            return Path.Combine(webRoot, rel);
        }

        // Validate task tồn tại thuộc board/column và user là member của project.
        private async Task<(ProjectTask? task, int projectId)> ValidateTaskAndMembership(int boardId, int columnId, int taskId, string userId)
        {
            var task = await _db.PojectTasks
                .Include(t => t.Column!).ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);
            if (task == null) return (null, 0);

            var projectId = task.Column!.Board.ProjectId;
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return (null, 0);

            return (task, projectId);
        }


        /// Kiểm tra user có thể xóa attachment (uploader hoặc project owner/admin).
        private async Task<bool> CanDeleteAttachment(int projectId, string userId, Attachment attach)
        {
            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return false;
            if (attach.UploadedById == userId) return true;
            if (membership.IsOwner || membership.Role == ProjectRole.ProjectAdmin) return true;
            return false;
        }

        // Liệt kê các attachment trực tiếp gắn với Task (không bao gồm attachments gắn với subtask/comment).
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/attachments")]
        public async Task<IActionResult> ListForTask(int boardId, int columnId, int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var list = await _db.Attachments
                .Where(a => a.TaskId == taskId && a.CommentId == null && a.SubtaskId == null)
                .Include(a => a.UploadedBy)
                .OrderByDescending(a => a.UploadedAt)
                .Select(a => new
                {
                    a.AttachmentId,
                    a.FilePath,
                    FileName = Path.GetFileName(a.FilePath),
                    a.UploadedById,
                    UploadedByName = a.UploadedBy != null ? a.UploadedBy.Name : null,
                    a.UploadedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        // Upload file gắn trực tiếp vào Task.
        [HttpPost("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/attachments")]
        [RequestSizeLimit(MAX_FILE_BYTES)]
        public async Task<IActionResult> UploadToTask(int boardId, int columnId, int taskId, IFormFile file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();
            if (file == null) return BadRequest("No file provided");
            if (file.Length == 0) return BadRequest("Empty file");
            if (file.Length > MAX_FILE_BYTES) return BadRequest($"File too large. Max {MAX_FILE_BYTES / (1024 * 1024)} MB");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!ALLOWED_EXT.Contains(ext)) return BadRequest("File type not allowed");

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var relativePath = await SaveFileAsync(file);

            var attachment = new Attachment
            {
                TaskId = taskId,
                CommentId = null,
                SubtaskId = null,
                FilePath = relativePath,
                UploadedById = userId,
                UploadedAt = DateTime.UtcNow
            };
            _db.Attachments.Add(attachment);

            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Add Attachment",
                OldValue = string.Empty,
                NewValue = relativePath,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            // Notification: Event 15 File Attached to Task
            var uploaderName = (await _userManager.FindByIdAsync(userId))?.Name ?? "someone";
            await _db.NotifyTaskAttachmentAsync(task, userId, uploaderName);

            return CreatedAtAction(nameof(GetForTask), new { boardId, columnId, taskId, attachmentId = attachment.AttachmentId }, new
            {
                attachment.AttachmentId,
                attachment.FilePath,
                FileName = Path.GetFileName(attachment.FilePath),
                attachment.UploadedById,
                attachment.UploadedAt
            });
        }

        // Lấy metadata một attachment gắn với Task.
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> GetForTask(int boardId, int columnId, int taskId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.Include(a => a.UploadedBy)
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.TaskId == taskId && a.CommentId == null && a.SubtaskId == null);
            if (attach == null) return NotFound();

            return Ok(new
            {
                attach.AttachmentId,
                attach.FilePath,
                Url = $"{Request.Scheme}://{Request.Host}{attach.FilePath}",
                FileName = Path.GetFileName(attach.FilePath),
                attach.UploadedById,
                UploadedByName = attach.UploadedBy?.Name,
                attach.UploadedAt
            });
        }

        /// Tải file attachment gắn với Task.
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/attachments/{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadForTask(int boardId, int columnId, int taskId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.TaskId == taskId);
            if (attach == null) return NotFound();

            var physical = MapToPhysical(attach.FilePath);
            if (!System.IO.File.Exists(physical)) return NotFound("File not found");

            if (!_contentTypeProvider.TryGetContentType(physical, out var contentType)) contentType = "application/octet-stream";
            return PhysicalFile(physical, contentType, Path.GetFileName(physical));
        }

        // Xóa attachment gắn với Task.
        [HttpDelete("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> DeleteForTask(int boardId, int columnId, int taskId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.TaskId == taskId);
            if (attach == null) return NotFound();

            if (!await CanDeleteAttachment(projectId, userId, attach)) return Forbid();

            // Notification: Event 16 File Deleted From Task (before removing)
            var currentUserName = (await _userManager.FindByIdAsync(userId))?.Name ?? "someone";
            var fileName = Path.GetFileName(attach.FilePath);
            await _db.NotifyTaskAttachmentDeletedAsync(task, userId, currentUserName, fileName);

            var physical = MapToPhysical(attach.FilePath);
            try { if (System.IO.File.Exists(physical)) System.IO.File.Delete(physical); } catch { }

            _db.Attachments.Remove(attach);
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Delete Attachment",
                OldValue = attach.FilePath,
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Attachment deleted" });
        }

        // Liệt kê attachments gắn với Subtask.
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/subtasks/{subtaskId:int}/attachments")]
        public async Task<IActionResult> ListForSubtask(int boardId, int columnId, int taskId, int subtaskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var subtask = await _db.Subtasks.FirstOrDefaultAsync(s => s.SubtaskId == subtaskId && s.TaskId == taskId);
            if (subtask == null) return NotFound("Subtask not found");

            var list = await _db.Attachments
                .Where(a => a.SubtaskId == subtaskId)
                .Include(a => a.UploadedBy)
                .OrderByDescending(a => a.UploadedAt)
                .Select(a => new
                {
                    a.AttachmentId,
                    a.FilePath,
                    FileName = Path.GetFileName(a.FilePath),
                    a.UploadedById,
                    UploadedByName = a.UploadedBy != null ? a.UploadedBy.Name : null,
                    a.UploadedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        // Upload file gắn với Subtask.
        [HttpPost("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/subtasks/{subtaskId:int}/attachments")]
        [RequestSizeLimit(MAX_FILE_BYTES)]
        public async Task<IActionResult> UploadToSubtask(int boardId, int columnId, int taskId, int subtaskId, IFormFile file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();
            if (file == null) return BadRequest("No file provided");

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var subtask = await _db.Subtasks.FirstOrDefaultAsync(s => s.SubtaskId == subtaskId && s.TaskId == taskId);
            if (subtask == null) return NotFound("Subtask not found");

            if (file.Length == 0) return BadRequest("Empty file");
            if (file.Length > MAX_FILE_BYTES) return BadRequest($"File too large. Max {MAX_FILE_BYTES / (1024 * 1024)} MB");
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!ALLOWED_EXT.Contains(ext)) return BadRequest("File type not allowed");

            var relativePath = await SaveFileAsync(file);

            var attachment = new Attachment
            {
                TaskId = taskId,
                SubtaskId = subtaskId,
                CommentId = null,
                FilePath = relativePath,
                UploadedById = userId,
                UploadedAt = DateTime.UtcNow
            };
            _db.Attachments.Add(attachment);

            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Add Attachment to Subtask",
                OldValue = string.Empty,
                NewValue = $"Subtask:{subtaskId};{relativePath}",
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetForSubtask), new { boardId, columnId, taskId, subtaskId, attachmentId = attachment.AttachmentId }, new
            {
                attachment.AttachmentId,
                attachment.FilePath,
                FileName = Path.GetFileName(attachment.FilePath),
                attachment.UploadedById,
                attachment.UploadedAt
            });
        }

        // Lấy metadata attachment gắn với Subtask.
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/subtasks/{subtaskId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> GetForSubtask(int boardId, int columnId, int taskId, int subtaskId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.Include(a => a.UploadedBy)
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.SubtaskId == subtaskId);
            if (attach == null) return NotFound();

            return Ok(new
            {
                attach.AttachmentId,
                attach.FilePath,
                FileName = Path.GetFileName(attach.FilePath),
                attach.UploadedById,
                UploadedByName = attach.UploadedBy?.Name,
                attach.UploadedAt
            });
        }

        // Download attachment gắn với Subtask.
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/subtasks/{subtaskId:int}/attachments/{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadForSubtask(int boardId, int columnId, int taskId, int subtaskId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.SubtaskId == subtaskId);
            if (attach == null) return NotFound();

            var physical = MapToPhysical(attach.FilePath);
            if (!System.IO.File.Exists(physical)) return NotFound("File not found");

            if (!_contentTypeProvider.TryGetContentType(physical, out var contentType)) contentType = "application/octet-stream";
            return PhysicalFile(physical, contentType, Path.GetFileName(physical));
        }

        // Xóa attachment gắn với Subtask.
        [HttpDelete("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/subtasks/{subtaskId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> DeleteForSubtask(int boardId, int columnId, int taskId, int subtaskId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.SubtaskId == subtaskId);
            if (attach == null) return NotFound();

            if (!await CanDeleteAttachment(projectId, userId, attach)) return Forbid();

            var physical = MapToPhysical(attach.FilePath);
            try { if (System.IO.File.Exists(physical)) System.IO.File.Delete(physical); } catch { }

            _db.Attachments.Remove(attach);
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Delete Attachment from Subtask",
                OldValue = attach.FilePath,
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Attachment deleted" });
        }

        // Liệt kê attachments gắn với Comment.
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/comments/{commentId:int}/attachments")]
        public async Task<IActionResult> ListForComment(int boardId, int columnId, int taskId, int commentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var comment = await _db.Comments.FirstOrDefaultAsync(c => c.CommentId == commentId && c.TaskId == taskId);
            if (comment == null) return NotFound("Comment not found");

            var list = await _db.Attachments
                .Where(a => a.CommentId == commentId)
                .Include(a => a.UploadedBy)
                .OrderByDescending(a => a.UploadedAt)
                .Select(a => new
                {
                    a.AttachmentId,
                    a.FilePath,
                    FileName = Path.GetFileName(a.FilePath),
                    a.UploadedById,
                    UploadedByName = a.UploadedBy != null ? a.UploadedBy.Name : null,
                    a.UploadedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        // Upload file gắn với Comment.
        [HttpPost("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/comments/{commentId:int}/attachments")]
        [RequestSizeLimit(MAX_FILE_BYTES)]
        public async Task<IActionResult> UploadToComment(int boardId, int columnId, int taskId, int commentId, IFormFile file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();
            if (file == null) return BadRequest("No file provided");

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var comment = await _db.Comments.FirstOrDefaultAsync(c => c.CommentId == commentId && c.TaskId == taskId);
            if (comment == null) return NotFound("Comment not found");

            if (file.Length == 0) return BadRequest("Empty file");
            if (file.Length > MAX_FILE_BYTES) return BadRequest($"File too large. Max {MAX_FILE_BYTES / (1024 * 1024)} MB");
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!ALLOWED_EXT.Contains(ext)) return BadRequest("File type not allowed");

            var relativePath = await SaveFileAsync(file);

            var attachment = new Attachment
            {
                TaskId = taskId,
                SubtaskId = null,
                CommentId = commentId,
                FilePath = relativePath,
                UploadedById = userId,
                UploadedAt = DateTime.UtcNow
            };
            _db.Attachments.Add(attachment);

            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Add Attachment to Comment",
                OldValue = string.Empty,
                NewValue = $"Comment:{commentId};{relativePath}",
                CreatedAt = DateTime.UtcNow
            });

            // Notification: Event 10 Attachment in Comment
            var uploaderName = (await _userManager.FindByIdAsync(userId))?.Name ?? "someone";
            await _db.NotifyCommentAttachmentAsync(task, userId, uploaderName);

            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetForComment), new { boardId, columnId, taskId, commentId, attachmentId = attachment.AttachmentId }, new
            {
                attachment.AttachmentId,
                attachment.FilePath,
                FileName = Path.GetFileName(attachment.FilePath),
                attachment.UploadedById,
                attachment.UploadedAt
            });
        }

        // Lấy metadata một attachment gắn với Comment.
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/comments/{commentId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> GetForComment(int boardId, int columnId, int taskId, int commentId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.Include(a => a.UploadedBy)
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.CommentId == commentId);
            if (attach == null) return NotFound();

            return Ok(new
            {
                attach.AttachmentId,
                attach.FilePath,
                FileName = Path.GetFileName(attach.FilePath),
                attach.UploadedById,
                UploadedByName = attach.UploadedBy?.Name,
                attach.UploadedAt
            });
        }

        // Tải file attachment gắn với Comment.
        [HttpGet("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/comments/{commentId:int}/attachments/{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadForComment(int boardId, int columnId, int taskId, int commentId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.CommentId == commentId);
            if (attach == null) return NotFound();

            var physical = MapToPhysical(attach.FilePath);
            if (!System.IO.File.Exists(physical)) return NotFound("File not found");

            if (!_contentTypeProvider.TryGetContentType(physical, out var contentType)) contentType = "application/octet-stream";
            return PhysicalFile(physical, contentType, Path.GetFileName(physical));
        }

        // Xóa attachment gắn với Comment.
        [HttpDelete("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/comments/{commentId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> DeleteForComment(int boardId, int columnId, int taskId, int commentId, int attachmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var (task, projectId) = await ValidateTaskAndMembership(boardId, columnId, taskId, userId);
            if (task == null) return Forbid();

            var attach = await _db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId && a.CommentId == commentId);
            if (attach == null) return NotFound();

            if (!await CanDeleteAttachment(projectId, userId, attach)) return Forbid();

            var physical = MapToPhysical(attach.FilePath);
            try { if (System.IO.File.Exists(physical)) System.IO.File.Delete(physical); } catch { }

            _db.Attachments.Remove(attach);
            _db.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.TaskId,
                UserId = userId,
                Action = "Delete Attachment from Comment",
                OldValue = attach.FilePath,
                NewValue = string.Empty,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Attachment deleted" });
        }
    }
}