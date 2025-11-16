using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{

    // Controller quản lý Column trên Board; tạo cột (với position), liệt kê, lấy chi tiết, cập nhật, xóa.
    [ApiController]
    [Route("boards/{boardId:int}/columns")]
    [Authorize]
    public class ColumnController : ControllerBase
    {
        private readonly PMDbContext _db;

        public ColumnController(PMDbContext db)
        {
            _db = db;
        }

        public record CreateColumnDto(string Name, int? Position = null, int? WipLimit = null);
        public record UpdateColumnDto(string? Name = null, int? Position = null, int? WipLimit = null);

        // Tạo cột mới trên board.
        [HttpPost]
        public async Task<IActionResult> Create(int boardId, [FromBody] CreateColumnDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name required");

            var board = await _db.Boards.Include(b => b.Columns).FirstOrDefaultAsync(b => b.BoardId == boardId);
            if (board == null) return NotFound("Board not found");

            // Nếu không truyền position, thêm cuối
            var maxPos = board.Columns.Any() ? board.Columns.Max(c => c.Position) : -1;
            var position = dto.Position ?? (maxPos + 1);

            var column = new Column
            {
                BoardId = boardId,
                Name = dto.Name.Trim(),
                Position = position,
                WipLimit = dto.WipLimit,
                CreatedAt = DateTime.UtcNow
            };

            // - Nếu chèn vào giữa, các cột có position >= vị trí mới sẽ được dịch +1.
            if (board.Columns.Any(c => c.Position >= position))
            {
                var toShift = board.Columns.Where(c => c.Position >= position).ToList();
                foreach (var c in toShift) c.Position++;
            }

            _db.Columns.Add(column);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { boardId = boardId, columnId = column.ColumnId }, new { column.ColumnId, column.Name, column.Position, column.WipLimit });
        }

        // Liệt kê các cột của board theo thứ tự position.
        [HttpGet]
        public async Task<IActionResult> List(int boardId)
        {
            var cols = await _db.Columns
                .Where(c => c.BoardId == boardId)
                .OrderBy(c => c.Position)
                .Select(c => new { c.ColumnId, c.Name, c.Position, c.WipLimit })
                .ToListAsync();
            return Ok(cols);
        }

        // Lấy thông tin chi tiết 1 cột.
        [HttpGet("{columnId:int}")]
        public async Task<IActionResult> Get(int boardId, int columnId)
        {
            var col = await _db.Columns
                .Where(c => c.BoardId == boardId && c.ColumnId == columnId)
                .Select(c => new { c.ColumnId, c.Name, c.Position, c.WipLimit })
                .FirstOrDefaultAsync();
            if (col == null) return NotFound();
            return Ok(col);
        }

        // Cập nhật cột:

        [HttpPut("{columnId:int}")]
        public async Task<IActionResult> Update(int boardId, int columnId, [FromBody] UpdateColumnDto dto)
        {
            var column = await _db.Columns.Where(c => c.BoardId == boardId && c.ColumnId == columnId).FirstOrDefaultAsync();
            if (column == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Name)) column.Name = dto.Name.Trim();

            if (dto.WipLimit.HasValue) column.WipLimit = dto.WipLimit;

            // Nếu thay đổi position, điều chỉnh position các cột khác tương ứng.
            if (dto.Position.HasValue && dto.Position.Value != column.Position)
            {
                var oldPos = column.Position;
                var newPos = dto.Position.Value;
                if (newPos < 0) newPos = 0;

                var cols = await _db.Columns.Where(c => c.BoardId == boardId && c.ColumnId != columnId).ToListAsync();

                if (newPos < oldPos)
                {
                    var toShift = cols.Where(c => c.Position >= newPos && c.Position < oldPos);
                    foreach (var c in toShift) c.Position++;
                }
                else
                {
                    var toShift = cols.Where(c => c.Position <= newPos && c.Position > oldPos);
                    foreach (var c in toShift) c.Position--;
                }

                column.Position = newPos;
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Column updated" });
        }


        // Xóa cột và điều chỉnh position của các cột còn lại (dịch xuống -1).
        [HttpDelete("{columnId:int}")]
        public async Task<IActionResult> Delete(int boardId, int columnId)
        {
            var column = await _db.Columns.Where(c => c.BoardId == boardId && c.ColumnId == columnId).FirstOrDefaultAsync();
            if (column == null) return NotFound();

            var pos = column.Position;
            _db.Columns.Remove(column);

            // Dời các cột phía sau lên
            var toShift = await _db.Columns.Where(c => c.BoardId == boardId && c.Position > pos).ToListAsync();
            foreach (var c in toShift) c.Position--;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Column deleted" });
        }
    }
}