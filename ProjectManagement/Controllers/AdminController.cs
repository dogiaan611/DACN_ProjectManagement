using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Identity;
using ProjectManagement.Domain.Entities;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "system_admin")]
    public class AdminController : ControllerBase
    {
        private readonly PMDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            PMDbContext db,
            UserManager<ApplicationUser> userManager,
            ILogger<AdminController> logger)
        {
            _db = db;
            _userManager = userManager;
            _logger = logger;
        }

        // ==================== HOME / DASHBOARD ====================

        /// <summary>
        /// Lấy thống kê tổng quan cho dashboard
        /// </summary>
        [HttpGet("dashboard/statistics")]
        public async Task<IActionResult> GetDashboardStatistics()
        {
            var totalUsers = await _db.Users.CountAsync();
            var totalProjects = await _db.Projects.CountAsync();
            var totalTasks = await _db.PojectTasks.CountAsync();
            var totalSprints = await _db.Sprints.CountAsync();
            
            // User growth (last 30 days)
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var newUsersLast30Days = await _db.Users
                .Where(u => u.CreatedAt >= thirtyDaysAgo)
                .CountAsync();
            
            // Active projects (projects with activity in last 7 days)
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var activeProjectIds = await _db.ActivityLogs
                .Where(a => a.CreatedAt >= sevenDaysAgo)
                .Select(a => a.Task.Column.Board.ProjectId)
                .Distinct()
                .CountAsync();
            
            // System admins count
            var adminCount = await _db.Users
                .Where(u => u.SystemRole == SystemRole.SystemAdmin)
                .CountAsync();
            
            return Ok(new
            {
                totalUsers,
                totalProjects,
                totalTasks,
                totalSprints,
                newUsersLast30Days,
                activeProjects = activeProjectIds,
                adminCount
            });
        }

        /// <summary>
        /// Lấy dữ liệu user growth theo ngày cho chart
        /// </summary>
        [HttpGet("dashboard/user-growth")]
        public async Task<IActionResult> GetUserGrowth([FromQuery] int days = 30)
        {
            var startDate = DateTime.UtcNow.AddDays(-days).Date;
            
            var userGrowth = await _db.Users
                .Where(u => u.CreatedAt >= startDate)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new
                {
                    date = g.Key,
                    count = g.Count()
                })
                .OrderBy(x => x.date)
                .ToListAsync();
            
            return Ok(userGrowth);
        }

        /// <summary>
        /// Lấy thống kê projects
        /// </summary>
        [HttpGet("dashboard/projects")]
        public async Task<IActionResult> GetProjectStatistics()
        {
            var totalProjects = await _db.Projects.CountAsync();
            
            var projectsByType = await _db.Projects
                .GroupBy(p => p.Type)
                .Select(g => new
                {
                    type = g.Key.ToString(),
                    count = g.Count()
                })
                .ToListAsync();
            
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var recentProjects = await _db.Projects
                .Where(p => p.CreatedAt >= sevenDaysAgo)
                .CountAsync();
            
            return Ok(new
            {
                totalProjects,
                projectsByType,
                recentProjects
            });
        }

        // ==================== USER MANAGEMENT ====================

        /// <summary>
        /// Lấy danh sách users với pagination và filtering
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? role = null,
            [FromQuery] string? sortBy = "email",
            [FromQuery] string? sortOrder = "asc")
        {
            var query = _db.Users.AsQueryable();
            
            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(u =>
                    u.Email.ToLower().Contains(searchLower) ||
                    u.Name.ToLower().Contains(searchLower) ||
                    (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
            }
            
            // Role filter
            if (!string.IsNullOrWhiteSpace(role))
            {
                if (Enum.TryParse<SystemRole>(role, true, out var roleEnum))
                {
                    query = query.Where(u => u.SystemRole == roleEnum);
                }
            }
            
            // Sorting
            query = sortBy?.ToLower() switch
            {
                "name" => sortOrder == "desc" ? query.OrderByDescending(u => u.Name) : query.OrderBy(u => u.Name),
                "createdat" => sortOrder == "desc" ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
                "role" => sortOrder == "desc" ? query.OrderByDescending(u => u.SystemRole) : query.OrderBy(u => u.SystemRole),
                _ => sortOrder == "desc" ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email)
            };
            
            var total = await query.CountAsync();
            
            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.Name,
                    u.AvatarUrl,
                    u.PhoneNumber,
                    u.SystemRole,
                    u.CreatedAt,
                    u.EmailConfirmed,
                    projectCount = _db.ProjectMembers.Count(pm => pm.UserId == u.Id),
                    taskCount = _db.PojectTasks.Count(t => t.AssigneeId == u.Id)
                })
                .ToListAsync();
            
            return Ok(new
            {
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize),
                users
            });
        }

        /// <summary>
        /// Lấy chi tiết một user
        /// </summary>
        [HttpGet("users/{userId}")]
        public async Task<IActionResult> GetUserDetails(string userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found" });
            
            var projectCount = await _db.ProjectMembers.CountAsync(pm => pm.UserId == userId);
            var taskCount = await _db.PojectTasks.CountAsync(t => t.AssigneeId == userId);
            var activityCount = await _db.ActivityLogs.CountAsync(a => a.UserId == userId);
            
            var recentProjects = await _db.ProjectMembers
                .Where(pm => pm.UserId == userId)
                .Include(pm => pm.Project)
                .OrderByDescending(pm => pm.Project.CreatedAt)
                .Take(5)
                .Select(pm => new
                {
                    pm.Project.ProjectId,
                    pm.Project.Name,
                    pm.Project.Type,
                    pm.Role,
                    pm.IsOwner
                })
                .ToListAsync();
            
            return Ok(new
            {
                user = new
                {
                    user.Id,
                    user.Email,
                    user.Name,
                    user.AvatarUrl,
                    user.PhoneNumber,
                    user.SystemRole,
                    user.CreatedAt,
                    user.EmailConfirmed
                },
                statistics = new
                {
                    projectCount,
                    taskCount,
                    activityCount
                },
                recentProjects
            });
        }

        /// <summary>
        /// Xóa user (admin only)
        /// </summary>
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound(new { message = "User not found" });
            
            // Prevent deleting yourself
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == currentUserId)
            {
                return BadRequest(new { message = "Cannot delete your own account" });
            }
            
            // Check if user is owner of any projects
            var ownedProjects = await _db.ProjectMembers
                .Where(pm => pm.UserId == userId && pm.IsOwner)
                .CountAsync();
            
            if (ownedProjects > 0)
            {
                return BadRequest(new
                {
                    message = $"Cannot delete user. User is owner of {ownedProjects} project(s). Transfer ownership first."
                });
            }
            
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to delete user", errors = result.Errors });
            }
            
            _logger.LogInformation($"Admin {currentUserId} deleted user {user.Email} ({userId})");
            return Ok(new { message = "User deleted successfully" });
        }

        // ==================== NOTIFICATIONS ====================

        /// <summary>
        /// Lấy tất cả notifications trong hệ thống
        /// </summary>
        [HttpGet("notifications")]
        public async Task<IActionResult> GetAllNotifications(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] bool? isRead = null,
            [FromQuery] string? type = null)
        {
            var query = _db.Notifications.AsQueryable();
            
            // Filter by read status
            if (isRead.HasValue)
            {
                query = query.Where(n => n.IsRead == isRead.Value);
            }
            
            // Filter by type
            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(n => n.Type == type);
            }
            
            var total = await query.CountAsync();
            
            var notifications = await query
                .Include(n => n.User)
                .Include(n => n.Project)
                .Include(n => n.Task)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new
                {
                    n.NotificationId,
                    n.Type,
                    n.Content,
                    n.IsRead,
                    n.CreatedAt,
                    user = n.User != null ? new
                    {
                        n.User.Id,
                        n.User.Name,
                        n.User.Email
                    } : null,
                    project = n.Project != null ? new
                    {
                        n.Project.ProjectId,
                        n.Project.Name
                    } : null,
                    task = n.Task != null ? new
                    {
                        n.Task.TaskId,
                        n.Task.Title
                    } : null
                })
                .ToListAsync();
            
            return Ok(new
            {
                total,
                page,
                pageSize,
                notifications
            });
        }

        /// <summary>
        /// Lấy thống kê notifications
        /// </summary>
        [HttpGet("notifications/statistics")]
        public async Task<IActionResult> GetNotificationStatistics()
        {
            var total = await _db.Notifications.CountAsync();
            var unread = await _db.Notifications.CountAsync(n => !n.IsRead);
            var read = total - unread;
            
            var byType = await _db.Notifications
                .GroupBy(n => n.Type)
                .Select(g => new
                {
                    type = g.Key,
                    count = g.Count()
                })
                .ToListAsync();
            
            var last24Hours = await _db.Notifications
                .Where(n => n.CreatedAt >= DateTime.UtcNow.AddHours(-24))
                .CountAsync();
            
            return Ok(new
            {
                total,
                unread,
                read,
                byType,
                last24Hours
            });
        }

        // ==================== TASKS ====================

        /// <summary>
        /// Lấy tất cả tasks trong hệ thống
        /// </summary>
        [HttpGet("tasks")]
        public async Task<IActionResult> GetAllTasks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? priority = null,
            [FromQuery] string? search = null)
        {
            var query = _db.PojectTasks.AsQueryable();
            
            // Filter by priority
            if (!string.IsNullOrWhiteSpace(priority))
            {
                if (Enum.TryParse<TaskPriority>(priority, true, out var priorityEnum))
                {
                    query = query.Where(t => t.Priority == priorityEnum);
                }
            }
            
            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(t =>
                    t.Title.ToLower().Contains(searchLower) ||
                    (t.Description != null && t.Description.ToLower().Contains(searchLower)));
            }
            
            var total = await query.CountAsync();
            
            var tasks = await query
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Include(t => t.Column)
                    .ThenInclude(c => c.Board)
                        .ThenInclude(b => b.Project)
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.Description,
                    columnName = t.Column.Name,
                    priority = t.Priority.ToString(),
                    t.CreatedAt,
                    t.DueDate,
                    assignee = t.Assignee != null ? new
                    {
                        t.Assignee.Id,
                        t.Assignee.Name,
                        t.Assignee.Email
                    } : null,
                    createdBy = t.CreatedBy != null ? new
                    {
                        t.CreatedBy.Id,
                        t.CreatedBy.Name,
                        t.CreatedBy.Email
                    } : null,
                    project = t.Column != null && t.Column.Board != null && t.Column.Board.Project != null ? new
                    {
                        t.Column.Board.Project.ProjectId,
                        t.Column.Board.Project.Name
                    } : null
                })
                .ToListAsync();
            
            return Ok(new
            {
                total,
                page,
                pageSize,
                tasks
            });
        }

        /// <summary>
        /// Lấy thống kê tasks
        /// </summary>
        [HttpGet("tasks/statistics")]
        public async Task<IActionResult> GetTaskStatistics()
        {
            var total = await _db.PojectTasks.CountAsync();
            
            var byColumn = await _db.PojectTasks
                .Include(t => t.Column)
                .GroupBy(t => t.Column.Name)
                .Select(g => new
                {
                    columnName = g.Key,
                    count = g.Count()
                })
                .ToListAsync();
            
            var byPriority = await _db.PojectTasks
                .GroupBy(t => t.Priority)
                .Select(g => new
                {
                    priority = g.Key.ToString(),
                    count = g.Count()
                })
                .ToListAsync();
            
            var overdue = await _db.PojectTasks
                .Where(t => t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow)
                .CountAsync();
            
            return Ok(new
            {
                total,
                byColumn,
                byPriority,
                overdue
            });
        }

        // ==================== ACTIVITY ====================

        /// <summary>
        /// Lấy danh sách hoạt động gần đây
        /// </summary>
        [HttpGet("activities")]
        public async Task<IActionResult> GetRecentActivities(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? userId = null,
            [FromQuery] int? projectId = null)
        {
            var query = _db.ActivityLogs.AsQueryable();
            
            // Filter by user
            if (!string.IsNullOrWhiteSpace(userId))
            {
                query = query.Where(a => a.UserId == userId);
            }
            
            // Filter by project
            if (projectId.HasValue)
            {
                query = query.Where(a => a.Task.Column.Board.ProjectId == projectId.Value);
            }
            
            var total = await query.CountAsync();
            
            var activities = await query
                .Include(a => a.User)
                .Include(a => a.Task)
                    .ThenInclude(t => t.Column)
                        .ThenInclude(c => c.Board)
                            .ThenInclude(b => b.Project)
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    logId = a.LogId,
                    a.Action,
                    timestamp = a.CreatedAt,
                    oldValue = a.OldValue,
                    newValue = a.NewValue,
                    user = a.User != null ? new
                    {
                        a.User.Id,
                        a.User.Name,
                        a.User.Email,
                        a.User.AvatarUrl
                    } : null,
                    task = a.Task != null ? new
                    {
                        a.Task.TaskId,
                        a.Task.Title,
                        projectId = a.Task.Column.Board.ProjectId,
                        projectName = a.Task.Column.Board.Project.Name
                    } : null
                })
                .ToListAsync();
            
            return Ok(new
            {
                total,
                page,
                pageSize,
                activities
            });
        }

        /// <summary>
        /// Lấy thống kê activities
        /// </summary>
        [HttpGet("activities/statistics")]
        public async Task<IActionResult> GetActivityStatistics()
        {
            var total = await _db.ActivityLogs.CountAsync();
            
            var last24Hours = await _db.ActivityLogs
                .Where(a => a.CreatedAt >= DateTime.UtcNow.AddHours(-24))
                .CountAsync();
            
            var last7Days = await _db.ActivityLogs
                .Where(a => a.CreatedAt >= DateTime.UtcNow.AddDays(-7))
                .CountAsync();
            
            var byAction = await _db.ActivityLogs
                .GroupBy(a => a.Action)
                .Select(g => new
                {
                    action = g.Key,
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .Take(10)
                .ToListAsync();
            
            var mostActiveUsers = await _db.ActivityLogs
                .GroupBy(a => a.UserId)
                .Select(g => new
                {
                    userId = g.Key,
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .Take(10)
                .ToListAsync();
            
            return Ok(new
            {
                total,
                last24Hours,
                last7Days,
                byAction,
                mostActiveUsers
            });
        }

        // ==================== INBOX (System Messages/Logs) ====================

        /// <summary>
        /// Lấy system logs/messages
        /// </summary>
        [HttpGet("inbox")]
        public async Task<IActionResult> GetSystemInbox(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            // Combine recent activities and notifications as "inbox"
            var recentActivities = await _db.ActivityLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    id = a.LogId.ToString(),
                    type = "activity",
                    content = $"{a.User.Name} {a.Action}",
                    timestamp = a.CreatedAt,
                    user = new
                    {
                        a.User.Id,
                        a.User.Name,
                        a.User.AvatarUrl
                    }
                })
                .ToListAsync();
            
            return Ok(new
            {
                total = await _db.ActivityLogs.CountAsync(),
                page,
                pageSize,
                items = recentActivities
            });
        }

        // ==================== REGISTRATION CODES ====================

        /// <summary>
        /// Lấy danh sách registration codes
        /// </summary>
        [HttpGet("registration-codes")]
        public async Task<IActionResult> GetRegistrationCodes(
            [FromQuery] bool? isUsed = null,
            [FromQuery] bool? includeExpired = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.RegistrationCodes.AsQueryable();
            
            // Filter by usage
            if (isUsed.HasValue)
            {
                query = query.Where(rc => rc.IsUsed == isUsed.Value);
            }
            
            // Filter expired
            if (!includeExpired.Value)
            {
                query = query.Where(rc => rc.ExpiresAtUtc > DateTime.UtcNow || rc.IsUsed);
            }
            
            var total = await query.CountAsync();
            
            var codes = await query
                .Include(rc => rc.User)
                .OrderByDescending(rc => rc.CreatedAtUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(rc => new
                {
                    rc.Id,
                    rc.Email,
                    rc.Code,
                    rc.CreatedAtUtc,
                    rc.ExpiresAtUtc,
                    rc.IsUsed,
                    isExpired = rc.ExpiresAtUtc < DateTime.UtcNow && !rc.IsUsed,
                    user = rc.User != null ? new
                    {
                        rc.User.Id,
                        rc.User.Name,
                        rc.User.Email
                    } : null
                })
                .ToListAsync();
            
            return Ok(new
            {
                total,
                page,
                pageSize,
                codes
            });
        }

        /// <summary>
        /// Xóa registration code
        /// </summary>
        [HttpDelete("registration-codes/{id}")]
        public async Task<IActionResult> DeleteRegistrationCode(int id)
        {
            var code = await _db.RegistrationCodes.FindAsync(id);
            if (code == null) return NotFound(new { message = "Registration code not found" });
            
            if (code.IsUsed)
            {
                return BadRequest(new { message = "Cannot delete used registration code" });
            }
            
            _db.RegistrationCodes.Remove(code);
            await _db.SaveChangesAsync();
            
            _logger.LogInformation($"Admin deleted registration code {id} for email {code.Email}");
            return Ok(new { message = "Registration code deleted successfully" });
        }

        /// <summary>
        /// Lấy thống kê registration codes
        /// </summary>
        [HttpGet("registration-codes/statistics")]
        public async Task<IActionResult> GetRegistrationCodeStatistics()
        {
            var total = await _db.RegistrationCodes.CountAsync();
            var used = await _db.RegistrationCodes.CountAsync(rc => rc.IsUsed);
            var expired = await _db.RegistrationCodes
                .CountAsync(rc => rc.ExpiresAtUtc < DateTime.UtcNow && !rc.IsUsed);
            var active = total - used - expired;
            
            return Ok(new
            {
                total,
                used,
                expired,
                active
            });
        }

        /// <summary>
        /// Xóa tất cả expired registration codes
        /// </summary>
        [HttpDelete("registration-codes/cleanup-expired")]
        public async Task<IActionResult> CleanupExpiredCodes()
        {
            var expiredCodes = await _db.RegistrationCodes
                .Where(rc => rc.ExpiresAtUtc < DateTime.UtcNow && !rc.IsUsed)
                .ToListAsync();
            
            if (expiredCodes.Count == 0)
            {
                return Ok(new { message = "No expired codes to cleanup", count = 0 });
            }
            
            _db.RegistrationCodes.RemoveRange(expiredCodes);
            await _db.SaveChangesAsync();
            
            _logger.LogInformation($"Admin cleaned up {expiredCodes.Count} expired registration codes");
            return Ok(new
            {
                message = "Expired codes cleaned up successfully",
                count = expiredCodes.Count
            });
        }
    }
}
