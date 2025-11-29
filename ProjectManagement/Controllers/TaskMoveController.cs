using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using System.Security.Claims;

// Move / reorder tasks (drag & drop).
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Authorize]
    public class TaskMoveController : ControllerBase
    {
        private readonly PMDbContext _db;

        public TaskMoveController(PMDbContext db)
        {
            _db = db;
        }

        public record MoveTaskDto(int ToColumnId, int? ToPosition = null);

        [HttpPost("boards/{boardId:int}/columns/{columnId:int}/tasks/{taskId:int}/move")]
        public async Task<IActionResult> Move(int boardId, int columnId, int taskId, [FromBody] MoveTaskDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Kiểm tra task tồn tại và thuộc cột, bảng chỉ định
            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.ColumnId == columnId && t.Column!.BoardId == boardId);

            if (task == null) return NotFound("Không tìm thấy Task hoặc không có trong column/board");

            var projectId = task.Column!.Board.ProjectId;
            // Kiểm tra user là thành viên dự án
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            // Kiểm tra cột đích tồn tại và thuộc cùng bảng
            var targetColumn = await _db.Columns.FirstOrDefaultAsync(c => c.ColumnId == dto.ToColumnId);
            if (targetColumn == null) return NotFound("Column được chỉ định không tồn tại");
            if (targetColumn.BoardId != boardId) return BadRequest("Column chỉ định không thuộc cũng một board");

            // Kiểm tra giới hạn WIP của cột đích (nếu có)
            if (dto.ToColumnId != columnId && targetColumn.WipLimit.HasValue)
            {
                var currentCount = await _db.PojectTasks.CountAsync(t => t.ColumnId == dto.ToColumnId);
                if (currentCount + 1 > targetColumn.WipLimit.Value)
                    return BadRequest($"WIP limit exceeded for target column (limit = {targetColumn.WipLimit.Value})");
            }

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var oldColumnId = task.ColumnId;
                var oldPos = task.SortOrder;

                // Giảm sort order của các task trong cột nguồn nằm sau task đang di chuyển
                var sourceGreater = await _db.PojectTasks
                    .Where(t => t.ColumnId == oldColumnId && t.TaskId != task.TaskId && t.SortOrder > oldPos)
                    .ToListAsync();
                foreach (var t in sourceGreater) t.SortOrder--;

                // Tính toán vị trí chèn trong cột đích
                var targetTasksQuery = _db.PojectTasks.Where(t => t.ColumnId == dto.ToColumnId && t.TaskId != task.TaskId);
                var maxTargetPos = await targetTasksQuery.Select(t => (int?)t.SortOrder).MaxAsync() ?? -1;

                int insertPos;
                if (dto.ToPosition.HasValue)
                {
                    insertPos = Math.Max(0, dto.ToPosition.Value);
                    insertPos = Math.Min(insertPos, maxTargetPos + 1);
                }
                else
                {
                    insertPos = maxTargetPos + 1;
                }

                if (dto.ToColumnId == oldColumnId)
                {
                    var toShift = await _db.PojectTasks
                        .Where(t => t.ColumnId == oldColumnId && t.TaskId != task.TaskId && t.SortOrder >= insertPos)
                        .ToListAsync();
                    foreach (var t in toShift) t.SortOrder++;
                }
                else
                {
                    var toShiftTarget = await _db.PojectTasks
                        .Where(t => t.ColumnId == dto.ToColumnId && t.SortOrder >= insertPos)
                        .ToListAsync();
                    foreach (var t in toShiftTarget) t.SortOrder++;
                }

                task.ColumnId = dto.ToColumnId;
                task.SortOrder = insertPos;
                task.UpdatedAt = DateTime.UtcNow;

                _db.ActivityLogs.Add(new ActivityLog
                {
                    TaskId = task.TaskId,
                    UserId = userId,
                    Action = "Move Task",
                    OldValue = $"Column:{oldColumnId};Pos:{oldPos}",
                    NewValue = $"Column:{dto.ToColumnId};Pos:{insertPos}",
                    CreatedAt = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new
                {
                    task.TaskId,
                    task.ColumnId,
                    task.SortOrder
                });
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
    }
}