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
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Unauthorized();

            // 1. User Info
            var userInfo = new {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl
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
                    ProjectId = pm.Project.ProjectId,
                    Name = pm.Project.Name,
                    Description = pm.Project.Description,
                    Type = pm.Project.Type,
                    CreatedAt = pm.Project.CreatedAt
                })
                .Take(5)
                .ToListAsync();

            var projectCount = await _context.ProjectMembers
                .Where(pm => pm.UserId == userId)
                .CountAsync();

            // 4. Completed vs Incomplete Tasks
            var allMyTasks = await _context.PojectTasks
                .Where(t => t.AssigneeId == userId)
                .Include(t => t.Column)
                .Include(t => t.Column.Board.Project)
                .ToListAsync();

            var allColumnMappings = await _context.ColumnStatusMappings.ToListAsync();

            var taskStatusList = allMyTasks.Select(t => {
                var mapping = allColumnMappings.FirstOrDefault(m => m.ColumnId == t.ColumnId);
                var status = mapping?.Status ?? ColumnStatus.ToDo;
                
                // Fallback: Check column name if no mapping
                if (mapping == null)
                {
                    var colName = t.Column?.Name?.Trim().ToLower() ?? "";
                    if (colName == "done" || colName == "completed" || colName == "finish" || colName == "finished")
                    {
                        status = ColumnStatus.Done;
                    }
                }
                
                return new { Task = t, Status = status };
            }).ToList();

            var completedTasks = taskStatusList.Count(x => x.Status == ColumnStatus.Done);
            var incompleteTasks = taskStatusList.Count(x => x.Status != ColumnStatus.Done);
            var overdueTasks = taskStatusList.Count(x => x.Task.DueDate < DateTime.Now && x.Status != ColumnStatus.Done);

            // 5. Incomplete tasks by Project (Section)
            var incompleteByProject = taskStatusList
                .Where(x => x.Status != ColumnStatus.Done)
                .GroupBy(x => x.Task.Column?.Board?.Project?.Name ?? "Unknown Project")
                .Select(g => new { Project = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToList();

            // 6. Upcoming Tasks (Due soon)
            var upcomingIncomplete = taskStatusList
                .Where(x => x.Status != ColumnStatus.Done && x.Task.DueDate != null && x.Task.DueDate >= DateTime.Now)
                .OrderBy(x => x.Task.DueDate)
                .Take(5)
                .Select(x => new {
                    TaskId = x.Task.TaskId,
                    Title = x.Task.Title,
                    DueDate = x.Task.DueDate,
                    Priority = (int)x.Task.Priority
                })
                .ToList();

            return Ok(new
            {
                user = userInfo,
                totalTasks = totalTasks,
                projectCount = projectCount,
                projects = projects,
                completedTasks = completedTasks,
                incompleteTasks = incompleteTasks,
                overdueTasks = overdueTasks,
                tasksByProject = incompleteByProject,
                upcomingTasks = upcomingIncomplete
            });
        }
    }
}
