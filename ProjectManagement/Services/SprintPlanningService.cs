using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using System.Text.Json;

namespace ProjectManagement.Services
{
    public interface ISprintPlanningService
    {
        Task<AutoAssignResult> AutoAssignTasks(int sprintId);
        Task<SprintPredictionResult> PredictSprintCompletion(int sprintId);
        Task<WorkloadBalanceResult> AnalyzeWorkloadBalance(int sprintId);
        Task<RiskDetectionResult> DetectRisks(int sprintId);
    }

    public class SprintPlanningService : ISprintPlanningService
    {
        private readonly PMDbContext _db;
        private readonly IAIService _aiService;
        private readonly ILogger<SprintPlanningService> _logger;

        public SprintPlanningService(PMDbContext db, IAIService aiService, ILogger<SprintPlanningService> logger)
        {
            _db = db;
            _aiService = aiService;
            _logger = logger;
        }

        public async Task<AutoAssignResult> AutoAssignTasks(int sprintId)
        {
            try
            {
                var sprint = await _db.Sprints
                    .Include(s => s.Project)
                        .ThenInclude(p => p.Members)
                            .ThenInclude(pm => pm.User)
                    .FirstOrDefaultAsync(s => s.SprintId == sprintId);

                if (sprint == null)
                    return new AutoAssignResult { Success = false, Message = "Sprint not found" };

                // Get unassigned tasks in sprint
                var unassignedTasks = await _db.PojectTasks
                    .Where(t => t.SprintId == sprintId && t.AssigneeId == null)
                    .ToListAsync();

                if (!unassignedTasks.Any())
                    return new AutoAssignResult { Success = true, Message = "No unassigned tasks", AssignedCount = 0 };

                var projectMembers = sprint.Project.Members.ToList();
                if (!projectMembers.Any())
                    return new AutoAssignResult { Success = false, Message = "No members in project" };

                // Calculate current workload for each member
                var memberWorkloads = new Dictionary<string, int>();
                foreach (var member in projectMembers)
                {
                    var workload = await _db.PojectTasks
                        .Where(t => t.SprintId == sprintId && t.AssigneeId == member.UserId)
                        .SumAsync(t => t.StoryPoints ?? 0);
                    memberWorkloads[member.UserId] = workload;
                }

                int assignedCount = 0;
                var assignments = new List<TaskAssignment>();

                // Auto-assign tasks
                foreach (var task in unassignedTasks)
                {
                    // Find member with lowest workload
                    var assignee = memberWorkloads.OrderBy(kv => kv.Value).First();
                    
                    task.AssigneeId = assignee.Key;
                    memberWorkloads[assignee.Key] += task.StoryPoints ?? 0;
                    assignedCount++;

                    var memberName = projectMembers.First(m => m.UserId == assignee.Key).User.Name;
                    assignments.Add(new TaskAssignment
                    {
                        TaskId = task.TaskId,
                        TaskTitle = task.Title,
                        AssigneeId = assignee.Key,
                        AssigneeName = memberName,
                        StoryPoints = task.StoryPoints ?? 0
                    });
                }

                await _db.SaveChangesAsync();

                return new AutoAssignResult
                {
                    Success = true,
                    Message = $"Successfully assigned {assignedCount} tasks",
                    AssignedCount = assignedCount,
                    Assignments = assignments
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error auto-assigning tasks");
                return new AutoAssignResult { Success = false, Message = ex.Message };
            }
        }

        public async Task<SprintPredictionResult> PredictSprintCompletion(int sprintId)
        {
            try
            {
                var sprint = await _db.Sprints.FindAsync(sprintId);
                if (sprint == null)
                    return new SprintPredictionResult { Success = false, Message = "Sprint not found" };

                // Get all tasks in sprint
                var tasks = await _db.PojectTasks
                    .Include(t => t.Column)
                    .Where(t => t.SprintId == sprintId)
                    .ToListAsync();

                if (!tasks.Any())
                    return new SprintPredictionResult 
                    { 
                        Success = true, 
                        CompletionProbability = 100, 
                        Message = "No tasks in sprint" 
                    };

                // Calculate metrics
                var totalPoints = tasks.Sum(t => t.StoryPoints ?? 0);
                var completedPoints = tasks.Where(t => t.Column.Name.ToLower() == "done")
                    .Sum(t => t.StoryPoints ?? 0);
                var inProgressPoints = tasks.Where(t => t.Column.Name.ToLower() == "in progress")
                    .Sum(t => t.StoryPoints ?? 0);
                var todoPoints = totalPoints - completedPoints - inProgressPoints;

                // Calculate days remaining
                if (!sprint.StartDate.HasValue || !sprint.EndDate.HasValue)
                    return new SprintPredictionResult { Success = false, Message = "Sprint dates not set" };

                var daysRemaining = (sprint.EndDate.Value - DateTime.UtcNow).Days;
                var totalDays = (sprint.EndDate.Value - sprint.StartDate.Value).Days;
                var daysElapsed = totalDays - daysRemaining;

                // Calculate velocity
                var velocity = daysElapsed > 0 ? (double)completedPoints / daysElapsed : 0;
                var projectedCompletion = velocity > 0 ? completedPoints + (velocity * daysRemaining) : completedPoints;

                // Calculate completion probability
                var completionProbability = totalPoints > 0 
                    ? Math.Min(100, (int)((projectedCompletion / totalPoints) * 100))
                    : 100;

                // Determine status
                string status;
                if (completionProbability >= 90) status = "On Track";
                else if (completionProbability >= 70) status = "At Risk";
                else status = "Behind Schedule";

                return new SprintPredictionResult
                {
                    Success = true,
                    CompletionProbability = completionProbability,
                    Status = status,
                    TotalPoints = totalPoints,
                    CompletedPoints = completedPoints,
                    InProgressPoints = inProgressPoints,
                    TodoPoints = todoPoints,
                    DaysRemaining = daysRemaining,
                    Velocity = Math.Round(velocity, 2),
                    ProjectedCompletion = (int)projectedCompletion,
                    Message = $"Sprint is {status.ToLower()} with {completionProbability}% completion probability"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting sprint completion");
                return new SprintPredictionResult { Success = false, Message = ex.Message };
            }
        }

        public async Task<WorkloadBalanceResult> AnalyzeWorkloadBalance(int sprintId)
        {
            try
            {
                var sprint = await _db.Sprints
                    .Include(s => s.Project)
                        .ThenInclude(p => p.Members)
                            .ThenInclude(pm => pm.User)
                    .FirstOrDefaultAsync(s => s.SprintId == sprintId);

                if (sprint == null)
                    return new WorkloadBalanceResult { Success = false, Message = "Sprint not found" };

                var projectMembers = sprint.Project.Members.ToList();
                if (!projectMembers.Any())
                    return new WorkloadBalanceResult { Success = false, Message = "No members in project" };

                var memberWorkloads = new List<MemberWorkload>();

                foreach (var member in projectMembers)
                {
                    var tasks = await _db.PojectTasks
                        .Where(t => t.SprintId == sprintId && t.AssigneeId == member.UserId)
                        .ToListAsync();

                    var totalPoints = tasks.Sum(t => t.StoryPoints ?? 0);
                    var taskCount = tasks.Count;

                    memberWorkloads.Add(new MemberWorkload
                    {
                        UserId = member.UserId,
                        UserName = member.User.Name,
                        Role = member.Role.ToString(),
                        TotalStoryPoints = totalPoints,
                        TaskCount = taskCount
                    });
                }

                // Calculate balance metrics
                var avgPoints = memberWorkloads.Any() ? memberWorkloads.Average(m => m.TotalStoryPoints) : 0;
                var maxPoints = memberWorkloads.Any() ? memberWorkloads.Max(m => m.TotalStoryPoints) : 0;
                var minPoints = memberWorkloads.Any() ? memberWorkloads.Min(m => m.TotalStoryPoints) : 0;
                var variance = maxPoints - minPoints;

                // Determine balance status
                string balanceStatus;
                if (variance <= 5) balanceStatus = "Well Balanced";
                else if (variance <= 10) balanceStatus = "Moderately Balanced";
                else balanceStatus = "Unbalanced";

                // Find overloaded and underutilized members
                var overloaded = memberWorkloads.Where(m => m.TotalStoryPoints > avgPoints * 1.3).ToList();
                var underutilized = memberWorkloads.Where(m => m.TotalStoryPoints < avgPoints * 0.7).ToList();

                return new WorkloadBalanceResult
                {
                    Success = true,
                    BalanceStatus = balanceStatus,
                    AverageStoryPoints = Math.Round(avgPoints, 2),
                    Variance = variance,
                    MemberWorkloads = memberWorkloads,
                    OverloadedMembers = overloaded,
                    UnderutilizedMembers = underutilized,
                    Message = $"Workload is {balanceStatus.ToLower()}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing workload balance");
                return new WorkloadBalanceResult { Success = false, Message = ex.Message };
            }
        }

        public async Task<RiskDetectionResult> DetectRisks(int sprintId)
        {
            try
            {
                var sprint = await _db.Sprints.FindAsync(sprintId);
                if (sprint == null)
                    return new RiskDetectionResult { Success = false, Message = "Sprint not found" };

                var tasks = await _db.PojectTasks
                    .Include(t => t.Column)
                    .Include(t => t.Assignee)
                    .Where(t => t.SprintId == sprintId)
                    .ToListAsync();

                var risks = new List<Risk>();

                // Risk 1: Unassigned tasks
                var unassignedTasks = tasks.Where(t => t.AssigneeId == null).ToList();
                if (unassignedTasks.Any())
                {
                    risks.Add(new Risk
                    {
                        Type = "Unassigned Tasks",
                        Severity = "High",
                        Count = unassignedTasks.Count,
                        Description = $"{unassignedTasks.Count} tasks have no assignee",
                        Recommendation = "Assign these tasks to team members"
                    });
                }

                // Risk 2: Overdue tasks
                var overdueTasks = tasks.Where(t => t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow 
                    && t.Column.Name.ToLower() != "done").ToList();
                if (overdueTasks.Any())
                {
                    risks.Add(new Risk
                    {
                        Type = "Overdue Tasks",
                        Severity = "Critical",
                        Count = overdueTasks.Count,
                        Description = $"{overdueTasks.Count} tasks are past their due date",
                        Recommendation = "Prioritize these tasks or extend deadlines"
                    });
                }

                // Risk 3: Tasks stuck in progress
                var stuckTasks = tasks.Where(t => t.Column.Name.ToLower() == "in progress" 
                    && (DateTime.UtcNow - t.UpdatedAt).Days > 3).ToList();
                if (stuckTasks.Any())
                {
                    risks.Add(new Risk
                    {
                        Type = "Stuck Tasks",
                        Severity = "Medium",
                        Count = stuckTasks.Count,
                        Description = $"{stuckTasks.Count} tasks haven't been updated in 3+ days",
                        Recommendation = "Check with assignees for blockers"
                    });
                }

                // Risk 4: Sprint end approaching
                if (sprint.EndDate.HasValue)
                {
                    var daysRemaining = (sprint.EndDate.Value - DateTime.UtcNow).Days;
                    var incompleteTasks = tasks.Where(t => t.Column.Name.ToLower() != "done").Count();
                    if (daysRemaining <= 2 && incompleteTasks > 0)
                    {
                        risks.Add(new Risk
                        {
                            Type = "Sprint Deadline",
                            Severity = "High",
                            Count = incompleteTasks,
                            Description = $"Sprint ends in {daysRemaining} days with {incompleteTasks} incomplete tasks",
                            Recommendation = "Consider moving low-priority tasks to next sprint"
                        });
                    }
                }

                // Risk 5: High complexity tasks
                var complexTasks = tasks.Where(t => t.StoryPoints >= 13 
                    && t.Column.Name.ToLower() != "done").ToList();
                if (complexTasks.Any())
                {
                    risks.Add(new Risk
                    {
                        Type = "High Complexity",
                        Severity = "Medium",
                        Count = complexTasks.Count,
                        Description = $"{complexTasks.Count} tasks have 13+ story points",
                        Recommendation = "Consider breaking down into smaller tasks"
                    });
                }

                // Calculate overall risk level
                var criticalCount = risks.Count(r => r.Severity == "Critical");
                var highCount = risks.Count(r => r.Severity == "High");
                
                string overallRisk;
                if (criticalCount > 0) overallRisk = "Critical";
                else if (highCount >= 2) overallRisk = "High";
                else if (risks.Any()) overallRisk = "Medium";
                else overallRisk = "Low";

                return new RiskDetectionResult
                {
                    Success = true,
                    OverallRisk = overallRisk,
                    RiskCount = risks.Count,
                    Risks = risks,
                    Message = $"Detected {risks.Count} risk(s) - Overall risk level: {overallRisk}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting risks");
                return new RiskDetectionResult { Success = false, Message = ex.Message };
            }
        }
    }

    // Result DTOs
    public class AutoAssignResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int AssignedCount { get; set; }
        public List<TaskAssignment> Assignments { get; set; } = new();
    }

    public class TaskAssignment
    {
        public int TaskId { get; set; }
        public string TaskTitle { get; set; }
        public string AssigneeId { get; set; }
        public string AssigneeName { get; set; }
        public int StoryPoints { get; set; }
    }

    public class SprintPredictionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int CompletionProbability { get; set; }
        public string Status { get; set; }
        public int TotalPoints { get; set; }
        public int CompletedPoints { get; set; }
        public int InProgressPoints { get; set; }
        public int TodoPoints { get; set; }
        public int DaysRemaining { get; set; }
        public double Velocity { get; set; }
        public int ProjectedCompletion { get; set; }
    }

    public class WorkloadBalanceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string BalanceStatus { get; set; }
        public double AverageStoryPoints { get; set; }
        public int Variance { get; set; }
        public List<MemberWorkload> MemberWorkloads { get; set; } = new();
        public List<MemberWorkload> OverloadedMembers { get; set; } = new();
        public List<MemberWorkload> UnderutilizedMembers { get; set; } = new();
    }

    public class MemberWorkload
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string Role { get; set; }
        public int TotalStoryPoints { get; set; }
        public int TaskCount { get; set; }
    }

    public class RiskDetectionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string OverallRisk { get; set; }
        public int RiskCount { get; set; }
        public List<Risk> Risks { get; set; } = new();
    }

    public class Risk
    {
        public string Type { get; set; }
        public string Severity { get; set; }
        public int Count { get; set; }
        public string Description { get; set; }
        public string Recommendation { get; set; }
    }
}
