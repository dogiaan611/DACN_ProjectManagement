using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Identity;
using ProjectManagement.Domain.Entities;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace ProjectManagement.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class HomeController : ControllerBase
    {
        private readonly PMDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public HomeController(PMDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardData()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var userId = user.Id;

            // 1. User Info
            var userInfo = new {
                user.Id,
                user.Name,
                user.Email,
                user.AvatarUrl
            };

            // 2. Assigned Tasks (Total)
            var totalTasks = await _context.PojectTasks
                .Where(t => t.AssigneeId == userId)
                .CountAsync();

            // 3. Participating Projects
            var projects = await _context.ProjectMembers
                .Where(pm => pm.UserId == userId)
                .Include(pm => pm.Project)
                .OrderByDescending(pm => pm.Project.CreatedAt)
                .Select(pm => new {
                    pm.Project.ProjectId,
                    pm.Project.Name,
                    pm.Project.Description,
                    pm.Project.Type,
                    pm.Project.CreatedAt
                })
                .Take(5)
                .ToListAsync();

            var projectCount = await _context.ProjectMembers
                .Where(pm => pm.UserId == userId)
                .CountAsync();

            // 4. Completed vs Incomplete Tasks
            // Join ProjectTasks with ColumnStatusMappings to determine status
            // Note: Not all columns might have mappings, assume unmapped are 'Incomplete' or check specific logic.
            // But relying on ColumnStatusMapping is the best way here.
            
            // 4. Completed vs Incomplete Tasks
            // Robust logic: Fetch tasks with columns, then determining status in-memory
            var allMyTasks = await _context.PojectTasks
                .Where(t => t.AssigneeId == userId)
                .Include(t => t.Column)
                .Include(t => t.Column.Board.Project) // Added include for grouping
                .ToListAsync();

            var allColumnMappings = await _context.ColumnStatusMappings.ToListAsync();

            var taskStatusList = allMyTasks.Select(t => {
                var mapping = allColumnMappings.FirstOrDefault(m => m.ColumnId == t.ColumnId);
                if (mapping != null) 
                {
                    return new { Task = t, Status = mapping.Status };
                }
                
                // Fallback: Check column name if no mapping
                var colName = t.Column?.Name?.Trim().ToLower() ?? "";
                if (colName == "done" || colName == "completed" || colName == "finish" || colName == "finished")
                {
                    return new { Task = t, Status = ColumnStatus.Done };
                }
                
                return new { Task = t, Status = ColumnStatus.ToDo }; // Default
            }).ToList();

            var completedTasks = taskStatusList.Count(x => x.Status == ColumnStatus.Done);
            var incompleteTasks = taskStatusList.Count(x => x.Status != ColumnStatus.Done);
            var overdueTasks = taskStatusList.Count(x => x.Task.DueDate < DateTime.Now && x.Status != ColumnStatus.Done);

            // 5. Incomplete tasks by Project (Section)
            // Reuse the robust list from above to ensure consistency
            var incompleteByProject = taskStatusList
                .Where(x => x.Status != ColumnStatus.Done)
                .GroupBy(x => x.Task.Column?.Board?.Project?.Name ?? "Unknown Project")
                .Select(g => new { Project = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToList();

            // 6. Upcoming Tasks (Due soon, Incomplete)
            var upcomingTasks = await _context.PojectTasks
                 .Where(t => t.AssigneeId == userId && t.DueDate != null) // && t.DueDate >= DateTime.Now check status too
                 .Include(t => t.Column)
                 .ToListAsync();

             var upcomingIncomplete = upcomingTasks
                .Select(t => new { 
                    Task = t, 
                    Status = _context.ColumnStatusMappings
                                .FirstOrDefault(m => m.ColumnId == t.ColumnId)?.Status ?? ColumnStatus.ToDo 
                })
                .Where(x => x.Status != ColumnStatus.Done && x.Task.DueDate >= DateTime.Now)
                .OrderBy(x => x.Task.DueDate)
                .Take(5)
                .Select(x => new {
                    x.Task.TaskId,
                    x.Task.Title,
                    x.Task.DueDate,
                    Priority = x.Task.Priority.ToString(),
                    // ProjectName = x.Task.Column.Board.Project.Name // Need strict include or redundant join
                })
                .ToList();


            return Ok(new
            {
                User = userInfo,
                TotalTasks = totalTasks,
                ProjectCount = projectCount,
                Projects = projects, // Added list
                CompletedTasks = completedTasks,
                IncompleteTasks = incompleteTasks,
                OverdueTasks = overdueTasks,
                TasksByProject = incompleteByProject,
                UpcomingTasks = upcomingIncomplete
            });
        }
    }
}
