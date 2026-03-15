using Microsoft.AspNetCore.Mvc;
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

// Controller quản lý dự án: tạo/xem/sửa/xóa project và quản lý thành viên (thêm, đổi vai trò, xóa, chuyển owner).
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


        // Tạo project mới. Người tạo được gán làm owner và ProjectAdmin mặc định.
        // Khi tạo project, tự động tạo 1 Board mặc định và 3 cột (To Do, In Progress, Done).
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
                    Name = "Board",
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

        // Thêm thành viên vào project (chỉ owner). Chặn thêm trùng.
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

        // Cập nhật vai trò thành viên (chỉ owner). Không cho đổi role của owner hiện tại.
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

        // Xóa thành viên khỏi project (chỉ owner). Không thể xóa owner.
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

        // Chuyển quyền owner sang thành viên khác (chỉ owner).
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

        // Liệt kê các project mà người dùng hiện tại là thành viên (kèm vai trò và trạng thái owner).
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

        // Lấy chi tiết project (khi là member) và danh sách members.
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

        // Cập nhật tên/mô tả project (owner hoặc ProjectAdmin).
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

        // Lấy thống kê dashboard cho project
        [HttpGet("{projectId:int}/dashboard")]
        public async Task<IActionResult> GetDashboard([FromRoute] int projectId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var project = await _db.Projects.FindAsync(projectId);
            if (project == null) return NotFound();

            var tasks = await _db.PojectTasks
                .Include(t => t.Column)
                .ThenInclude(c => c.Board)
                .Include(t => t.Assignee)
                .Where(t => t.Column!.Board.ProjectId == projectId)
                .ToListAsync();

            var mappings = await _db.ColumnStatusMappings
                .Include(m => m.Column)
                .Where(m => m.Column.Board.ProjectId == projectId)
                .ToListAsync();

            ColumnStatus GetStatus(ProjectTask t, List<ColumnStatusMapping> maps)
            {
                 var map = maps.FirstOrDefault(m => m.ColumnId == t.ColumnId);
                 if (map != null) return map.Status;
                 
                 var colName = t.Column?.Name?.Trim().ToLower() ?? "";
                 if (colName == "done" || colName == "completed" || colName == "finish" || colName == "finished")
                     return ColumnStatus.Done;
                 
                 return ColumnStatus.ToDo;
            }

            var taskData = tasks.Select(t => new { Task = t, Status = GetStatus(t, mappings) }).ToList();

            var totalTasks = taskData.Count;
            var completedTasks = taskData.Count(x => x.Status == ColumnStatus.Done);
            var incompleteTasks = totalTasks - completedTasks;
            var overdueTasks = taskData.Count(x => x.Status != ColumnStatus.Done && x.Task.DueDate < DateTime.UtcNow);

            var tasksByPriority = taskData
                .GroupBy(x => x.Task.Priority)
                .Select(g => new { Priority = g.Key.ToString(), Count = g.Count() })
                .ToDictionary(k => k.Priority, v => v.Count);

            var tasksByAssignee = taskData
                .Where(x => x.Task.AssigneeId != null)
                .GroupBy(x => x.Task.Assignee!.Name)
                .Select(g => new { Assignee = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();
            
            var unassignedCount = taskData.Count(x => x.Task.AssigneeId == null);

            var upcomingTasks = taskData
                .Where(x => x.Status != ColumnStatus.Done && x.Task.DueDate.HasValue)
                .OrderBy(x => x.Task.DueDate)
                .Take(5)
                .Select(x => new
                {
                    x.Task.TaskId,
                    Name = x.Task.Title,
                    x.Task.DueDate,
                    Priority = (int)x.Task.Priority,
                    AssigneeName = x.Task.Assignee?.Name,
                    AssigneeAvatar = x.Task.Assignee?.AvatarUrl
                })
                .ToList();

            return Ok(new
            {
                ProjectId = projectId,
                ProjectName = project.Name,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                IncompleteTasks = incompleteTasks,
                OverdueTasks = overdueTasks,
                TasksByPriority = tasksByPriority,
                TasksByAssignee = tasksByAssignee,
                UnassignedTasks = unassignedCount,
                UpcomingTasks = upcomingTasks
            });
        }

        // Lấy dữ liệu Gantt Chart cho project
        [HttpGet("{projectId:int}/gantt-chart")]
        public async Task<IActionResult> GetGanttChart([FromRoute] int projectId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var tasks = await _db.PojectTasks
                .Include(t => t.Column)
                .ThenInclude(c => c.Board)
                .Include(t => t.Assignee)
                .Where(t => t.Column!.Board.ProjectId == projectId)
                .ToListAsync();

            var mappings = await _db.ColumnStatusMappings
                .Include(m => m.Column)
                .Where(m => m.Column.Board.ProjectId == projectId)
                .ToListAsync();

            ColumnStatus GetStatus(ProjectTask t, List<ColumnStatusMapping> maps)
            {
                 var map = maps.FirstOrDefault(m => m.ColumnId == t.ColumnId);
                 if (map != null) return map.Status;
                 
                 var colName = t.Column?.Name?.Trim().ToLower() ?? "";
                 if (colName == "done" || colName == "completed" || colName == "finish" || colName == "finished")
                     return ColumnStatus.Done;
                 
                 return ColumnStatus.ToDo;
            }

            var ganttData = tasks.Select(t => {
                var status = GetStatus(t, mappings);
                int progress = 0;
                if (status == ColumnStatus.Done) progress = 100;
                if (progress == 0)
                {
                    var cName = t.Column?.Name?.ToLower() ?? "";
                    if (cName.Contains("progress") || cName.Contains("doing") || cName.Contains("working"))
                    {
                        progress = 50;
                    }
                }
                var start = t.CreatedAt;
                var end = t.DueDate ?? t.CreatedAt.AddDays(1);

                if (end < start) end = start.AddDays(1);

                return new
                {
                    id = "t" + t.TaskId,
                    realTaskId = t.TaskId,
                    name = t.Title,
                    start = start.ToString("yyyy-MM-dd"),
                    end = end.ToString("yyyy-MM-dd"),
                    progress = progress,
                    columnId = t.ColumnId,
                    boardId = t.Column?.BoardId,
                    priority = (int)t.Priority,
                    assignee = t.Assignee == null ? null : new {
                        name = t.Assignee.Name ?? t.Assignee.UserName,
                        avatarUrl = t.Assignee.AvatarUrl
                    }
                };
            }).ToList();

            return Ok(ganttData);
        }

        public record CreateGanttTaskDto(string Name, DateTime Start, DateTime End, int Progress);

        [HttpPost("{projectId:int}/gantt-chart/create")]
        public async Task<IActionResult> CreateGanttTask([FromRoute] int projectId, [FromBody] CreateGanttTaskDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var board = await _db.Boards.FirstOrDefaultAsync(b => b.ProjectId == projectId);
            if (board == null) return BadRequest("Project hasn't been set up with a board yet.");

            var columns = await _db.Columns
                .Where(c => c.BoardId == board.BoardId)
                .OrderBy(c => c.Position)
                .ToListAsync();

            if (!columns.Any()) return BadRequest("No columns found.");
            int targetColumnId = columns.First().ColumnId;

            if (dto.Progress >= 100)
            {
                var doneCol = columns.FirstOrDefault(c => 
                    c.Name.ToLower().Contains("done") || 
                    c.Name.ToLower().Contains("finish") || 
                    c.Name.ToLower().Contains("complet"));
                if (doneCol != null) targetColumnId = doneCol.ColumnId;
                else targetColumnId = columns.Last().ColumnId;
            }
            else if (dto.Progress > 0)
            {
                var progressCol = columns.FirstOrDefault(c => 
                    c.Name.ToLower().Contains("progress") || 
                    c.Name.ToLower().Contains("doing") || 
                    c.Name.ToLower().Contains("working"));
                if (progressCol != null) targetColumnId = progressCol.ColumnId;
            }

            var maxSort = await _db.PojectTasks.Where(t => t.ColumnId == targetColumnId).MaxAsync(t => (int?)t.SortOrder) ?? -1;

            var task = new ProjectTask
            {
                Title = dto.Name,
                Description = "", 
                CreatedById = userId,
                ColumnId = targetColumnId,
                CreatedAt = dto.Start,
                UpdatedAt = DateTime.UtcNow,
                DueDate = dto.End,     
                Priority = TaskPriority.Medium,
                IsLocked = false,
                SortOrder = maxSort + 1
            };

            _db.PojectTasks.Add(task);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = "t" + task.TaskId,
                name = task.Title,
                start = task.CreatedAt.ToString("yyyy-MM-dd"),
                end = task.DueDate?.ToString("yyyy-MM-dd") ?? "",
                progress = dto.Progress,
                realTaskId = task.TaskId,
                columnId = task.ColumnId,
                boardId = board.BoardId,
                priority = (int)task.Priority,
                assignee = (object)null
            });
        }

        // Xóa project (chỉ owner).
        [HttpDelete("{projectId:int}/Delete")]
        public async Task<IActionResult> Delete([FromRoute] int projectId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == currentUserId);
            if (membership == null || !membership.IsOwner) return Forbid();

            var project = await _db.Projects
                .Include(p => p.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.ProjectTasks)
                            .ThenInclude(t => t.Comments)
                .Include(p => p.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.ProjectTasks)
                            .ThenInclude(t => t.Subtasks)
                .Include(p => p.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.ProjectTasks)
                            .ThenInclude(t => t.Attachments)
                .Include(p => p.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.ProjectTasks)
                            .ThenInclude(t => t.ActivityLogs)
                .Include(p => p.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.ProjectTasks)
                            .ThenInclude(t => t.TaskTags)
                .Include(p => p.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.ProjectTasks)
                            .ThenInclude(t => t.TaskUserTags)
                .Include(p => p.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.ProjectTasks)
                            .ThenInclude(t => t.Watchers)
                .Include(p => p.Sprints)
                .Include(p => p.Tags)
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);
                
            if (project == null) return NotFound();

            try
            {
                // Manually delete all tasks in all columns to avoid cascade path conflicts
                var allTasks = project.Boards
                    .SelectMany(b => b.Columns)
                    .SelectMany(c => c.ProjectTasks)
                    .ToList();

                if (allTasks.Any())
                {
                    _db.PojectTasks.RemoveRange(allTasks);
                    await _db.SaveChangesAsync();
                }

                // Now delete the project (which will cascade delete boards, columns, sprints, tags, members)
                _db.Projects.Remove(project);
                await _db.SaveChangesAsync();
                
                _logger.LogInformation($"Project {projectId} '{project.Name}' deleted by user {currentUserId}");
                return Ok(new { message = "Đã xóa project" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting project {projectId}");
                return StatusCode(500, new { message = "Lỗi khi xóa project", error = ex.Message });
            }
        }
    }
}
