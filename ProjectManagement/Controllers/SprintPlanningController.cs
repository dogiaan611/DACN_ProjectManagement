using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Services;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SprintPlanningController : ControllerBase
    {
        private readonly ISprintPlanningService _sprintPlanning;
        private readonly ILogger<SprintPlanningController> _logger;

        public SprintPlanningController(ISprintPlanningService sprintPlanning, ILogger<SprintPlanningController> logger)
        {
            _sprintPlanning = sprintPlanning;
            _logger = logger;
        }

        /// <summary>
        /// Auto-assign unassigned tasks in a sprint to team members
        /// </summary>
        [HttpPost("{sprintId}/auto-assign")]
        public async Task<IActionResult> AutoAssignTasks(int sprintId)
        {
            try
            {
                var result = await _sprintPlanning.AutoAssignTasks(sprintId);
                
                if (!result.Success)
                    return BadRequest(new { message = result.Message });

                _logger.LogInformation($"Auto-assigned {result.AssignedCount} tasks in sprint {sprintId}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error auto-assigning tasks");
                return StatusCode(500, new { message = "Failed to auto-assign tasks", error = ex.Message });
            }
        }

        /// <summary>
        /// Predict sprint completion probability
        /// </summary>
        [HttpGet("{sprintId}/predict-completion")]
        public async Task<IActionResult> PredictCompletion(int sprintId)
        {
            try
            {
                var result = await _sprintPlanning.PredictSprintCompletion(sprintId);
                
                if (!result.Success)
                    return BadRequest(new { message = result.Message });

                _logger.LogInformation($"Predicted sprint {sprintId} completion: {result.CompletionProbability}%");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting sprint completion");
                return StatusCode(500, new { message = "Failed to predict completion", error = ex.Message });
            }
        }

        /// <summary>
        /// Analyze workload balance across team members
        /// </summary>
        [HttpGet("{sprintId}/workload-balance")]
        public async Task<IActionResult> AnalyzeWorkloadBalance(int sprintId)
        {
            try
            {
                var result = await _sprintPlanning.AnalyzeWorkloadBalance(sprintId);
                
                if (!result.Success)
                    return BadRequest(new { message = result.Message });

                _logger.LogInformation($"Analyzed workload balance for sprint {sprintId}: {result.BalanceStatus}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing workload balance");
                return StatusCode(500, new { message = "Failed to analyze workload", error = ex.Message });
            }
        }

        /// <summary>
        /// Detect risks in sprint
        /// </summary>
        [HttpGet("{sprintId}/detect-risks")]
        public async Task<IActionResult> DetectRisks(int sprintId)
        {
            try
            {
                var result = await _sprintPlanning.DetectRisks(sprintId);
                
                if (!result.Success)
                    return BadRequest(new { message = result.Message });

                _logger.LogInformation($"Detected {result.RiskCount} risk(s) in sprint {sprintId}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting risks");
                return StatusCode(500, new { message = "Failed to detect risks", error = ex.Message });
            }
        }

        /// <summary>
        /// Get comprehensive sprint analysis (all features combined)
        /// </summary>
        [HttpGet("{sprintId}/comprehensive-analysis")]
        public async Task<IActionResult> GetComprehensiveAnalysis(int sprintId)
        {
            try
            {
                var prediction = await _sprintPlanning.PredictSprintCompletion(sprintId);
                var workload = await _sprintPlanning.AnalyzeWorkloadBalance(sprintId);
                var risks = await _sprintPlanning.DetectRisks(sprintId);

                return Ok(new
                {
                    sprintId,
                    prediction = new
                    {
                        prediction.CompletionProbability,
                        prediction.Status,
                        prediction.Velocity,
                        prediction.DaysRemaining
                    },
                    workload = new
                    {
                        workload.BalanceStatus,
                        workload.AverageStoryPoints,
                        workload.Variance,
                        overloadedCount = workload.OverloadedMembers.Count,
                        underutilizedCount = workload.UnderutilizedMembers.Count
                    },
                    risks = new
                    {
                        risks.OverallRisk,
                        risks.RiskCount,
                        criticalRisks = risks.Risks.Count(r => r.Severity == "Critical"),
                        highRisks = risks.Risks.Count(r => r.Severity == "High")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comprehensive analysis");
                return StatusCode(500, new { message = "Failed to get analysis", error = ex.Message });
            }
        }
    }
}
