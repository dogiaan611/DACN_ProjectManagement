﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Identity;
using ProjectManagement.Services;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;
using ProjectManagement.Domain.Entities;

/// Controller quản lý dự án: tạo/xem/sửa/xóa project và quản lý thành viên (thêm, đổi vai trò, xóa, chuyển owner).
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("projects")]
    [Authorize]

    public class ProjectController : ControllerBase
    {
        private readonly PMDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ProjectController> _logger;

        public ProjectController(
            PMDbContext db,
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService,
            ILogger<ProjectController> logger)
        {
            _db = db;
            _userManager = userManager;
            _notificationService = notificationService;
            _logger = logger;
        }

        public record CreateProjectDto(string Name, string? Description, ProjectType Type = ProjectType.Kanban);
        public record UpdateProjectDto(string? Name, string? Description);
        public record AddMemberDto(string UserId, ProjectRole Role);
        public record ChangeOwnerDto(string NewOwnerId);


        /// Tạo project mới. Người tạo được gán làm owner và ProjectAdmin mặc định.
        /// Khi tạo project, tự động tạo 1 Board mặc định và 3 cột (To Do, In Progress, Done).
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name là bắt buộc");

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            // Dùng transaction để đảm bảo project, member, board và columns được tạo đồng bộ
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var project = new Project
                {
                    Name = dto.Name.Trim(),
                    Description = dto.Description?.Trim() ?? string.Empty,
                    Type = dto.Type,
                    CreatedById = currentUserId,
                    CreatedAt = DateTime.UtcNow
                };

                _db.Projects.Add(project);
                await _db.SaveChangesAsync();

                var ownerMember = new ProjectMember
                {
                    ProjectId = project.ProjectId,
                    UserId = currentUserId,
                    Role = ProjectRole.ProjectAdmin,
                    IsOwner = true
                };
                _db.ProjectMembers.Add(ownerMember);
                await _db.SaveChangesAsync();

                // Tạo board mặc định cho project mới
                var board = new Board
                {
                    ProjectId = project.ProjectId,
                    Name = "Board", // hoặc $"{project.Name} Board"
                    Type = BoardType.Kanban,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Boards.Add(board);
                await _db.SaveChangesAsync();

                // Tạo 3 cột mặc định
                var defaultColumns = new[]
                {
                    new Column { BoardId = board.BoardId, Name = "To Do", Position = 0, CreatedAt = DateTime.UtcNow },
                    new Column { BoardId = board.BoardId, Name = "In Progress", Position = 1, CreatedAt = DateTime.UtcNow },
                    new Column { BoardId = board.BoardId, Name = "Done", Position = 2, CreatedAt = DateTime.UtcNow }
                };
                _db.Columns.AddRange(defaultColumns);
                await _db.SaveChangesAsync();

                await tx.CommitAsync();

                // Trả về thông tin project và board mặc định
                return Ok(new
                {
                    project.ProjectId,
                    project.Name,
                    project.Type,
                    DefaultBoard = new
                    {
                        board.BoardId,
                        board.Name,
                        Columns = defaultColumns.Select(c => new { c.ColumnId, c.Name, c.Position })
                    }
                });
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        /// Thêm thành viên vào project (chỉ owner). Chặn thêm trùng.
        [HttpPost("{projectId:int}/add/members")]
        public async Task<IActionResult> AddMember([FromRoute] int projectId, [FromBody] AddMemberDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == currentUserId);
            if (membership == null || !(membership.IsOwner)) return Forbid();

            var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
            if (project == null) return NotFound();

            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return BadRequest("User không tồn tại");

            var exists = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == dto.UserId);
            if (exists) return Conflict("Thành viên đã tồn tại trong project");

            var pmember = new ProjectMember
            {
                ProjectId = projectId,
                UserId = dto.UserId,
                Role = dto.Role,
                IsOwner = false
            };
            _db.ProjectMembers.Add(pmember);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đã thêm thành viên" });
        }

        /// Cập nhật vai trò thành viên (chỉ owner). Không cho đổi role của owner hiện tại.
        [HttpPut("{projectId:int}/update/members/{userId}")]
        public async Task<IActionResult> UpdateMemberRole([FromRoute] int projectId, [FromRoute] string userId, [FromBody] ProjectRole role)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == currentUserId);
            if (membership == null || !(membership.IsOwner)) return Forbid();

            var pmember = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (pmember == null) return NotFound();

            if (pmember.IsOwner) return BadRequest("Không thể đổi role của owner. Hãy chuyển owner trước.");

            pmember.Role = role;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã cập nhật vai trò" });
        }

        /// Xóa thành viên khỏi project (chỉ owner). Không thể xóa owner.
        [HttpDelete("{projectId:int}/delete/members/{userId}")]
        public async Task<IActionResult> RemoveMember([FromRoute] int projectId, [FromRoute] string userId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == currentUserId);
            if (membership == null || !(membership.IsOwner)) return Forbid();

            var pmember = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (pmember == null) return NotFound();
            if (pmember.IsOwner) return BadRequest("Không thể xóa owner. Hãy chuyển owner trước.");

            _db.ProjectMembers.Remove(pmember);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã xóa thành viên" });
        }

        /// Chuyển quyền owner sang thành viên khác (chỉ owner).
        [HttpPost("{projectId:int}/update/owner")]
        public async Task<IActionResult> ChangeOwner([FromRoute] int projectId, [FromBody] ChangeOwnerDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var currentOwner = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == currentUserId);
            if (currentOwner == null || !currentOwner.IsOwner) return Forbid();

            var newOwner = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == dto.NewOwnerId);
            if (newOwner == null)
            {
                // Không tự thêm mặc định để tránh set owner cho người chưa là member
                return BadRequest("Người nhận quyền owner phải là thành viên của project");
            }

            // Chuyển owner
            currentOwner.IsOwner = false;
            if (currentOwner.Role == ProjectRole.ProjectAdmin)
            {
                // giữ nguyên admin cho owner cũ (hoặc tùy chính sách bạn có thể hạ xuống Member)
            }
            newOwner.IsOwner = true;
            newOwner.Role = ProjectRole.ProjectAdmin;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã chuyển quyền owner" });
        }

        /// Liệt kê các project mà người dùng hiện tại là thành viên (kèm vai trò và trạng thái owner).
        [HttpGet("read")]
        public async Task<IActionResult> ListMine()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var projects = await _db.Projects
                .Where(p => p.Members.Any(m => m.UserId == currentUserId))
                .Include(p => p.CreatedBy) // Lấy thông tin người tạo
                .Include(p => p.Members) // Lấy danh sách thành viên
                    .ThenInclude(m => m.User) // Lấy thông tin chi tiết của từng thành viên
                .Select(p => new
                {
                    p.ProjectId,
                    p.Name,
                    p.Description,
                    p.Type,
                    p.CreatedAt,
                    CreatedBy = new { p.CreatedBy.Id, p.CreatedBy.AvatarUrl, p.CreatedBy.Name, p.CreatedBy.Email },
                    Members = p.Members.Select(m => new
                    {
                        m.UserId,
                        m.User.Name,
                        m.User.Email,
                        m.User.AvatarUrl,
                        m.Role,
                        m.IsOwner
                    }),
                    // Lấy vai trò và quyền owner của người dùng hiện tại trong project này
                    CurrentUserMembership = p.Members
                        .Where(m => m.UserId == currentUserId)
                        .Select(m => new { m.Role, m.IsOwner })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(projects);
        }

        /// Lấy chi tiết project (khi là member) và danh sách members.
        [HttpGet("{projectId:int}/readProject")]
        public async Task<IActionResult> GetById([FromRoute] int projectId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var currentUserMembership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == currentUserId);
            if (currentUserMembership == null) return Forbid();

            var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
            if (project == null) return NotFound();
            //Vào bảng để lấy user name và avt
            var members = await _db.ProjectMembers
                .Where(pm => pm.ProjectId == projectId)
                .Join(_db.Users,
                    pm => pm.UserId,
                    u => u.Id,
                    (pm, u) => new {
                        pm.UserId,
                        u.Name,
                        u.Email,
                        u.AvatarUrl,
                        pm.Role,
                        pm.IsOwner
                    })
                .ToListAsync();

            return Ok(new
            {
                project.ProjectId,
                project.Name,
                project.Description,
                project.Type,
                project.CreatedById,
                project.CreatedAt,
                Members = members,
                IsCurrentUserOwner = currentUserMembership.IsOwner,
                CurrentUserId = currentUserId
            });
        }

        /// Cập nhật tên/mô tả project (owner hoặc ProjectAdmin).
        [HttpPut("{projectId:int}/update")]
        public async Task<IActionResult> Update([FromRoute] int projectId, [FromBody] UpdateProjectDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == currentUserId);
            if (membership == null) return Forbid();
            if (!(membership.IsOwner || membership.Role == ProjectRole.ProjectAdmin)) return Forbid();

            var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
            if (project == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Name)) project.Name = dto.Name.Trim();
            if (dto.Description != null) project.Description = dto.Description.Trim();
            await _db.SaveChangesAsync();

            return Ok(new { message = "Cập nhật project thành công" });
        }

        /// Xóa project (chỉ owner).
        [HttpDelete("{projectId:int}/Delete")]
        public async Task<IActionResult> Delete([FromRoute] int projectId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var membership = await _db.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == currentUserId);
            if (membership == null || !membership.IsOwner) return Forbid();

            var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
            if (project == null) return NotFound();

            _db.Projects.Remove(project);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã xóa project" });
        }
    }
}
