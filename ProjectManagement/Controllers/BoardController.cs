using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Domain.Identity;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{
    /// Controller quản lý Board trong một Project: Tạo(tự động tạo 3 board mặc định), Liệt kê, Xóa
    [ApiController]
    [Route("projects/{projectId:int}/boards")]
    [Authorize]
    public class BoardController : ControllerBase
    {
        private readonly PMDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public BoardController(PMDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public record CreateBoardDto(string Name, BoardType? Type = null);

        /// Tạo board mới cho project. Nếu thành công sẽ auto-create 3 cột mặc định: To Do, In Progress, Done.
        [HttpPost]
        public async Task<IActionResult> CreateBoard(int projectId, [FromBody] CreateBoardDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Tên đã tồn tại");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // Kiểm tra project tồn tại và user là member
            var project = await _db.Projects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);
            if (project == null) return NotFound("Không tìm thấy project");

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var board = new Board
            {
                ProjectId = projectId,
                Name = dto.Name.Trim(),
                Type = dto.Type ?? BoardType.Kanban,
                CreatedAt = DateTime.UtcNow
            };

            // Dùng transaction để đảm bảo board và các cột mặc định được tạo đồng bộ
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                _db.Boards.Add(board);
                await _db.SaveChangesAsync();

                // Auto-create 3 default columns for new board
                var defaultColumns = new[]
                {
                    new Column { BoardId = board.BoardId, Name = "To Do", Position = 0, CreatedAt = DateTime.UtcNow },
                    new Column { BoardId = board.BoardId, Name = "In Progress", Position = 1, CreatedAt = DateTime.UtcNow },
                    new Column { BoardId = board.BoardId, Name = "Done", Position = 2, CreatedAt = DateTime.UtcNow }
                };
                _db.Columns.AddRange(defaultColumns);
                await _db.SaveChangesAsync();

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            // Trả về board đã tạo kèm cột (theo position)
            var created = await _db.Boards
                .Where(b => b.BoardId == board.BoardId)
                .Include(b => b.Columns.OrderBy(c => c.Position))
                .Select(b => new
                {
                    b.BoardId,
                    b.Name,
                    b.Type,
                    Columns = b.Columns.Select(c => new { c.ColumnId, c.Name, c.Position, c.WipLimit })
                })
                .FirstAsync();

            return CreatedAtAction(nameof(GetBoard), new { projectId = projectId, boardId = board.BoardId }, created);
        }

        /// Liệt kê các board của project.
        [HttpGet]
        public async Task<IActionResult> ListBoards(int projectId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var boards = await _db.Boards
                .Where(b => b.ProjectId == projectId)
                .Select(b => new { b.BoardId, b.Name, b.Type, b.CreatedAt })
                .ToListAsync();

            return Ok(boards);
        }

        /// Lấy chi tiết board kèm danh sách cột (theo position).
        [HttpGet("{boardId:int}")]
        public async Task<IActionResult> GetBoard(int projectId, int boardId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var board = await _db.Boards
                .Where(b => b.ProjectId == projectId && b.BoardId == boardId)
                .Include(b => b.Columns.OrderBy(c => c.Position))
                .Select(b => new
                {
                    b.BoardId,
                    b.Name,
                    b.Type,
                    Columns = b.Columns.Select(c => new { c.ColumnId, c.Name, c.Position, c.WipLimit })
                })
                .FirstOrDefaultAsync();

            if (board == null) return NotFound();
            return Ok(board);
        }

        /// Xóa board. Kiểm tra membership trước khi xóa.
        [HttpDelete("{boardId:int}")]
        public async Task<IActionResult> DeleteBoard(int projectId, int boardId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            //Kiểm tra user là member của project
            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var board = await _db.Boards.FirstOrDefaultAsync(b => b.ProjectId == projectId && b.BoardId == boardId);
            if (board == null) return NotFound();

            _db.Boards.Remove(board);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Board deleted" });
        }
    }
}