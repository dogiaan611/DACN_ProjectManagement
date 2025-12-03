using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("projects/{projectId:int}/sprints")]
    [Authorize]
    public class SprintController : ControllerBase
    {
        private readonly PMDbContext _db;

        public SprintController(PMDbContext db)
        {
            _db = db;
        }

        public record CreateSprintDto(
            string Name,
            string? Goal = null,
            DateTime? StartDate = null,
            DateTime? EndDate = null
        );

        public record UpdateSprintDto(
            string? Name = null,
            string? Goal = null,
            DateTime? StartDate = null,
            DateTime? EndDate = null
        );

        // List all sprints in project
        [HttpGet]
        public async Task<IActionResult> List(int projectId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var project = await _db.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var sprints = await _db.Sprints
                .Where(s => s.ProjectId == projectId)
                .Include(s => s.CreatedBy)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.SprintId,
                    s.ProjectId,
                    s.Name,
                    s.Goal,
                    s.StartDate,
                    s.EndDate,
                    s.Status,
                    CreatedBy = new
                    {
                        s.CreatedBy.Id,
                        s.CreatedBy.Name,
                        s.CreatedBy.AvatarUrl
                    },
                    s.CreatedAt,
                    TaskCount = s.ProjectTasks.Count,
                    CompletedTaskCount = s.ProjectTasks.Count(t => t.Column!.Name.Contains("Done")),
                    TotalStoryPoints = s.ProjectTasks.Sum(t => t.StoryPoints ?? 0),
                    CompletedStoryPoints = s.ProjectTasks.Where(t => t.Column!.Name.Contains("Done")).Sum(t => t.StoryPoints ?? 0)
                })
                .ToListAsync();

            return Ok(sprints);
        }

        // Get sprint details
        [HttpGet("{sprintId:int}")]
        public async Task<IActionResult> Get(int projectId, int sprintId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .Include(s => s.Project)
                .Include(s => s.CreatedBy)
                .Include(s => s.ProjectTasks)
                    .ThenInclude(t => t.Column)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);

            if (sprint == null) return NotFound("Sprint not found");

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            return Ok(new
            {
                sprint.SprintId,
                sprint.ProjectId,
                sprint.Name,
                sprint.Goal,
                sprint.StartDate,
                sprint.EndDate,
                sprint.Status,
                CreatedBy = new
                {
                    sprint.CreatedBy.Id,
                    sprint.CreatedBy.Name,
                    sprint.CreatedBy.AvatarUrl
                },
                sprint.CreatedAt,
                TaskCount = sprint.ProjectTasks.Count,
                CompletedTaskCount = sprint.ProjectTasks.Count(t => t.Column!.Name.Contains("Done")),
                TotalStoryPoints = sprint.ProjectTasks.Sum(t => t.StoryPoints ?? 0),
                CompletedStoryPoints = sprint.ProjectTasks.Where(t => t.Column!.Name.Contains("Done")).Sum(t => t.StoryPoints ?? 0)
            });
        }

        // Create sprint
        [HttpPost]
        public async Task<IActionResult> Create(int projectId, [FromBody] CreateSprintDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Sprint name is required");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var project = await _db.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Only project admin or owner can create sprints
            if (!membership.IsOwner && membership.Role != ProjectRole.ProjectAdmin)
                return Forbid();

            // Validate dates
            if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.EndDate.Value <= dto.StartDate.Value)
                return BadRequest("End date must be after start date");

            var sprint = new Sprint
            {
                ProjectId = projectId,
                Name = dto.Name.Trim(),
                Goal = dto.Goal?.Trim(),
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = SprintStatus.Planning,
                CreatedById = userId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Sprints.Add(sprint);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { projectId, sprintId = sprint.SprintId }, new
            {
                sprint.SprintId,
                sprint.ProjectId,
                sprint.Name,
                sprint.Goal,
                sprint.StartDate,
                sprint.EndDate,
                sprint.Status,
                sprint.CreatedAt
            });
        }

        // Update sprint
        [HttpPut("{sprintId:int}")]
        public async Task<IActionResult> Update(int projectId, int sprintId, [FromBody] UpdateSprintDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);

            if (sprint == null) return NotFound("Sprint not found");

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Only project admin or owner can update sprints
            if (!membership.IsOwner && membership.Role != ProjectRole.ProjectAdmin)
                return Forbid();

            // Cannot update completed or cancelled sprints
            if (sprint.Status == SprintStatus.Completed || sprint.Status == SprintStatus.Cancelled)
                return BadRequest("Cannot update completed or cancelled sprint");

            // Update fields
            if (!string.IsNullOrWhiteSpace(dto.Name))
                sprint.Name = dto.Name.Trim();

            if (dto.Goal != null)
                sprint.Goal = string.IsNullOrWhiteSpace(dto.Goal) ? null : dto.Goal.Trim();

            if (dto.StartDate.HasValue)
                sprint.StartDate = dto.StartDate;

            if (dto.EndDate.HasValue)
                sprint.EndDate = dto.EndDate;

            // Validate dates
            if (sprint.StartDate.HasValue && sprint.EndDate.HasValue && sprint.EndDate.Value <= sprint.StartDate.Value)
                return BadRequest("End date must be after start date");

            await _db.SaveChangesAsync();

            return Ok(new { message = "Sprint updated" });
        }

        // Delete sprint
        [HttpDelete("{sprintId:int}")]
        public async Task<IActionResult> Delete(int projectId, int sprintId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .Include(s => s.ProjectTasks)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);

            if (sprint == null) return NotFound("Sprint not found");

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Only project admin or owner can delete sprints
            if (!membership.IsOwner && membership.Role != ProjectRole.ProjectAdmin)
                return Forbid();

            // Cannot delete active or completed sprints
            if (sprint.Status == SprintStatus.Active)
                return BadRequest("Cannot delete active sprint. Please complete or cancel it first.");

            if (sprint.Status == SprintStatus.Completed)
                return BadRequest("Cannot delete completed sprint.");

            // Move tasks back to backlog (set SprintId to null)
            foreach (var task in sprint.ProjectTasks)
            {
                task.SprintId = null;
            }

            _db.Sprints.Remove(sprint);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Sprint deleted" });
        }

        // ========== SPRINT LIFECYCLE ==========

        // Start sprint
        [HttpPost("{sprintId:int}/start")]
        public async Task<IActionResult> Start(int projectId, int sprintId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .Include(s => s.ProjectTasks)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);

            if (sprint == null) return NotFound("Sprint not found");

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            if (!membership.IsOwner && membership.Role != ProjectRole.ProjectAdmin)
                return Forbid();

            // Validation
            if (sprint.Status != SprintStatus.Planning)
                return BadRequest("Only planning sprints can be started");

            // Check if another sprint is already active
            var hasActiveSprint = await _db.Sprints
                .AnyAsync(s => s.ProjectId == projectId && s.SprintId != sprintId && s.Status == SprintStatus.Active);
            if (hasActiveSprint)
                return BadRequest("Only one active sprint allowed per project");

            if (!sprint.ProjectTasks.Any())
                return BadRequest("Cannot start sprint without tasks");

            // Start sprint
            sprint.Status = SprintStatus.Active;
            if (!sprint.StartDate.HasValue)
                sprint.StartDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Sprint started", sprint.SprintId, sprint.Status });
        }

        public record CompleteSprintDto(
            List<TaskCarryOverAction> IncompleteTasks
        );

        public record TaskCarryOverAction(
            int TaskId,
            string Action  // "moveToNextSprint", "moveToBacklog", "markDone"
        );

        // Complete sprint
        [HttpPost("{sprintId:int}/complete")]
        public async Task<IActionResult> Complete(int projectId, int sprintId, [FromBody] CompleteSprintDto? dto = null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .Include(s => s.ProjectTasks)
                    .ThenInclude(t => t.Column)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);

            if (sprint == null) return NotFound("Sprint not found");

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            if (!membership.IsOwner && membership.Role != ProjectRole.ProjectAdmin)
                return Forbid();

            if (sprint.Status != SprintStatus.Active)
                return BadRequest("Only active sprints can be completed");

            // Get incomplete tasks
            var incompleteTasks = sprint.ProjectTasks
                .Where(t => !t.Column!.Name.Contains("Done"))
                .ToList();

            // Handle carry-over if provided
            if (dto != null && dto.IncompleteTasks.Any())
            {
                foreach (var action in dto.IncompleteTasks)
                {
                    var task = incompleteTasks.FirstOrDefault(t => t.TaskId == action.TaskId);
                    if (task == null) continue;

                    switch (action.Action.ToLower())
                    {
                        case "movetonextsprint":
                            // Find next planning sprint
                            var nextSprint = await _db.Sprints
                                .Where(s => s.ProjectId == projectId && s.Status == SprintStatus.Planning)
                                .OrderBy(s => s.CreatedAt)
                                .FirstOrDefaultAsync();
                            if (nextSprint != null)
                                task.SprintId = nextSprint.SprintId;
                            else
                                task.SprintId = null; // No next sprint, move to backlog
                            break;

                        case "movetobacklog":
                            task.SprintId = null;
                            break;

                        case "markdone":
                            // Find a "Done" column in the task's board
                            var doneColumn = await _db.Columns
                                .Where(c => c.BoardId == task.Column!.BoardId && c.Name.Contains("Done"))
                                .FirstOrDefaultAsync();
                            if (doneColumn != null)
                                task.ColumnId = doneColumn.ColumnId;
                            break;
                    }
                }
            }
            else
            {
                // Default: move all incomplete tasks to backlog
                foreach (var task in incompleteTasks)
                {
                    task.SprintId = null;
                }
            }

            // Complete sprint
            sprint.Status = SprintStatus.Completed;
            if (!sprint.EndDate.HasValue)
                sprint.EndDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Sprint completed", sprint.SprintId, sprint.Status });
        }

        // Cancel sprint
        [HttpPost("{sprintId:int}/cancel")]
        public async Task<IActionResult> Cancel(int projectId, int sprintId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .Include(s => s.ProjectTasks)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);

            if (sprint == null) return NotFound("Sprint not found");

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            if (!membership.IsOwner && membership.Role != ProjectRole.ProjectAdmin)
                return Forbid();

            if (sprint.Status == SprintStatus.Completed)
                return BadRequest("Cannot cancel completed sprint");

            // Move all tasks back to backlog
            foreach (var task in sprint.ProjectTasks)
            {
                task.SprintId = null;
            }

            sprint.Status = SprintStatus.Cancelled;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Sprint cancelled", sprint.SprintId, sprint.Status });
        }

        // Get incomplete tasks (for carry-over UI)
        [HttpGet("{sprintId:int}/incomplete")]
        public async Task<IActionResult> GetIncompleteTasks(int projectId, int sprintId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .Include(s => s.ProjectTasks)
                    .ThenInclude(t => t.Column)
                .Include(s => s.ProjectTasks)
                    .ThenInclude(t => t.Assignee)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);

            if (sprint == null) return NotFound("Sprint not found");

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var incompleteTasks = sprint.ProjectTasks
                .Where(t => !t.Column!.Name.Contains("Done"))
                .Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.StoryPoints,
                    Column = t.Column!.Name,
                    Assignee = t.Assignee == null ? null : new { t.Assignee.Id, t.Assignee.Name }
                })
                .ToList();

            return Ok(incompleteTasks);
        }

        // ========== BACKLOG MANAGEMENT ==========

        // Get product backlog (tasks not in any sprint)
        [HttpGet("~/projects/{projectId:int}/backlog")]
        public async Task<IActionResult> GetProductBacklog(int projectId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var backlogTasks = await _db.PojectTasks
                .Where(t => t.Column!.Board.ProjectId == projectId && t.SprintId == null)
                .Include(t => t.Assignee)
                .Include(t => t.Column)
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.SortOrder)
                .Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.Description,
                    t.Priority,
                    t.StoryPoints,
                    t.DueDate,
                    Column = new { t.Column!.ColumnId, t.Column.Name },
                    Assignee = t.Assignee == null ? null : new
                    {
                        t.Assignee.Id,
                        t.Assignee.Name,
                        t.Assignee.AvatarUrl
                    }
                })
                .ToListAsync();

            return Ok(backlogTasks);
        }

        // Get sprint backlog (tasks in specific sprint)
        [HttpGet("{sprintId:int}/backlog")]
        public async Task<IActionResult> GetSprintBacklog(int projectId, int sprintId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .Include(s => s.ProjectTasks)
                    .ThenInclude(t => t.Assignee)
                .Include(s => s.ProjectTasks)
                    .ThenInclude(t => t.Column)
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);

            if (sprint == null) return NotFound("Sprint not found");

            var isMember = await _db.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (!isMember) return Forbid();

            var sprintTasks = sprint.ProjectTasks
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.SortOrder)
                .Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.Description,
                    t.Priority,
                    t.StoryPoints,
                    t.DueDate,
                    Column = new { t.Column!.ColumnId, t.Column.Name },
                    Assignee = t.Assignee == null ? null : new
                    {
                        t.Assignee.Id,
                        t.Assignee.Name,
                        t.Assignee.AvatarUrl
                    }
                })
                .ToList();

            return Ok(new
            {
                Sprint = new
                {
                    sprint.SprintId,
                    sprint.Name,
                    sprint.Goal,
                    sprint.Status
                },
                Tasks = sprintTasks,
                TotalStoryPoints = sprintTasks.Sum(t => t.StoryPoints ?? 0),
                CompletedStoryPoints = sprint.ProjectTasks.Where(t => t.Column!.Name.Contains("Done")).Sum(t => t.StoryPoints ?? 0)
            });
        }

        // Add task to sprint
        [HttpPost("{sprintId:int}/tasks/{taskId:int}")]
        public async Task<IActionResult> AddTaskToSprint(int projectId, int sprintId, int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var sprint = await _db.Sprints
                .FirstOrDefaultAsync(s => s.SprintId == sprintId && s.ProjectId == projectId);
            if (sprint == null) return NotFound("Sprint not found");

            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.Column!.Board.ProjectId == projectId);
            if (task == null) return NotFound("Task not found");

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            // Validation
            if (sprint.Status == SprintStatus.Completed || sprint.Status == SprintStatus.Cancelled)
                return BadRequest("Cannot add tasks to completed or cancelled sprint");

            if (task.SprintId == sprintId)
                return BadRequest("Task already in this sprint");

            task.SprintId = sprintId;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Task added to sprint" });
        }

        // Remove task from sprint
        [HttpDelete("{sprintId:int}/tasks/{taskId:int}")]
        public async Task<IActionResult> RemoveTaskFromSprint(int projectId, int sprintId, int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var task = await _db.PojectTasks
                .Include(t => t.Column!)
                    .ThenInclude(c => c.Board)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.SprintId == sprintId && t.Column!.Board.ProjectId == projectId);

            if (task == null) return NotFound("Task not found in this sprint");

            var membership = await _db.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
            if (membership == null) return Forbid();

            task.SprintId = null;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Task removed from sprint" });
        }
    }
}
