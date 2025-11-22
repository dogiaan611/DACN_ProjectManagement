using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using System.Security.Claims;

//Controller quản lý tag trong project: tạo, sửa, xóa, liệt kê tag
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("projects/{projectId:int}/tags")]
    [Authorize]
    public class TagController : ControllerBase
    {
        private readonly PMDbContext _db;

        public TagController(PMDbContext db)
        {
            _db = db;
        }

        public record CreateTagDto(string Name, string Color);
        public record UpdateTagDto(string? Name = null, string? Color = null);

        // Liệt kê tag của project
        [HttpGet]
        public async Task<IActionResult> List(int projectId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var tags = await _db.Tags
                .Where(t => t.ProjectId == projectId)
                .OrderBy(t => t.Name)
                .Select(t => new { t.TagId, t.Name, t.Color, t.CreatedAt })
                .ToListAsync();

            return Ok(tags);
        }

        // Tạo tag mới trong project
        [HttpPost]
        public async Task<IActionResult> Create(int projectId, [FromBody] CreateTagDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name đã tồn tại");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var name = dto.Name.Trim();

            var exists = await _db.Tags.AnyAsync(t => t.ProjectId == projectId && t.Name == name);
            if (exists) return BadRequest("Tag này đã tồn tại trong project");

            var tag = new Tag
            {
                Name = name,
                Color = string.IsNullOrWhiteSpace(dto.Color) ? "#cccccc" : dto.Color.Trim(),
                ProjectId = projectId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Tags.Add(tag);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { projectId = projectId, tagId = tag.TagId }, new { tag.TagId, tag.Name, tag.Color, tag.CreatedAt });
        }

        // Lấy chi tiết tag
        [HttpGet("{tagId:int}")]
        public async Task<IActionResult> Get(int projectId, int tagId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var tag = await _db.Tags
                .Where(t => t.ProjectId == projectId && t.TagId == tagId)
                .Select(t => new { t.TagId, t.Name, t.Color, t.CreatedAt })
                .FirstOrDefaultAsync();

            if (tag == null) return NotFound();
            return Ok(tag);
        }

        // Cập nhật tag
        [HttpPut("{tagId:int}")]
        public async Task<IActionResult> Update(int projectId, int tagId, [FromBody] UpdateTagDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var tag = await _db.Tags.FirstOrDefaultAsync(t => t.ProjectId == projectId && t.TagId == tagId);
            if (tag == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                var newName = dto.Name.Trim();
                var exists = await _db.Tags.AnyAsync(t => t.ProjectId == projectId && t.Name == newName && t.TagId != tagId);
                if (exists) return BadRequest("Tag này đã tồn tại trong project");
                tag.Name = newName;
            }

            if (dto.Color != null) tag.Color = dto.Color;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Cập nhập Tag thành công" });
        }

        // Xóa tag
        [HttpDelete("{tagId:int}")]
        public async Task<IActionResult> Delete(int projectId, int tagId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // require at least member; you can tighten to owner/admin if desired
            var tag = await _db.Tags.FirstOrDefaultAsync(t => t.ProjectId == projectId && t.TagId == tagId);
            if (tag == null) return NotFound();

            _db.Tags.Remove(tag);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Xóa Tag thành công" });
        }
    }
}