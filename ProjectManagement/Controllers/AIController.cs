using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Services;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;
        private readonly ILogger<AIController> _logger;

        public AIController(IAIService aiService, ILogger<AIController> logger)
        {
            _aiService = aiService;
            _logger = logger;
        }

        /// <summary>
        /// Generate task description from title using AI
        /// </summary>
        [HttpPost("generate-description")]
        public async Task<IActionResult> GenerateDescription([FromBody] GenerateDescriptionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "Title is required" });
            }

            try
            {
                var description = await _aiService.GenerateTaskDescription(request.Title);
                
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"User {userId} generated AI description for task: {request.Title}");

                return Ok(new { description });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating description");
                return StatusCode(500, new { message = "Failed to generate description", error = ex.Message });
            }
        }

        /// <summary>
        /// Break down task into subtasks using AI
        /// </summary>
        [HttpPost("breakdown-task")]
        public async Task<IActionResult> BreakdownTask([FromBody] BreakdownTaskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "Title is required" });
            }

            try
            {
                var subtasks = await _aiService.BreakdownTask(request.Title, request.Description ?? "");
                
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"User {userId} generated AI breakdown for task: {request.Title}");

                return Ok(new { subtasks });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error breaking down task");
                return StatusCode(500, new { message = "Failed to breakdown task", error = ex.Message });
            }
        }

        /// <summary>
        /// Estimate story points for a task using AI
        /// </summary>
        [HttpPost("estimate-story-points")]
        public async Task<IActionResult> EstimateStoryPoints([FromBody] EstimateStoryPointsRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "Title is required" });
            }

            try
            {
                var storyPoints = await _aiService.EstimateStoryPoints(request.Title, request.Description ?? "");
                
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"User {userId} estimated story points for task: {request.Title} = {storyPoints}");

                return Ok(new { storyPoints });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error estimating story points");
                return StatusCode(500, new { message = "Failed to estimate story points", error = ex.Message });
            }
        }

        /// <summary>
        /// Suggest assignee for a task using AI
        /// </summary>
        [HttpPost("suggest-assignee")]
        public async Task<IActionResult> SuggestAssignee([FromBody] SuggestAssigneeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title) || request.ProjectId <= 0)
            {
                return BadRequest(new { message = "Title and ProjectId are required" });
            }

            try
            {
                var suggestion = await _aiService.SuggestAssignee(request.ProjectId, request.Title, request.Description ?? "");
                
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"User {userId} got assignee suggestion for task: {request.Title}");

                return Ok(new { suggestion });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error suggesting assignee");
                return StatusCode(500, new { message = "Failed to suggest assignee", error = ex.Message });
            }
        }

        /// <summary>
        /// Check if AI service is available
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new
            {
                available = true,
                provider = "Google Gemini",
                features = new[]
                {
                    "Generate Task Description",
                    "Breakdown Task into Subtasks",
                    "Estimate Story Points",
                    "Suggest Assignee"
                }
            });
        }
    }

    public class GenerateDescriptionRequest
    {
        public string Title { get; set; } = "";
    }

    public class BreakdownTaskRequest
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
    }

    public class EstimateStoryPointsRequest
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
    }

    public class SuggestAssigneeRequest
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = "";
        public string? Description { get; set; }
    }
}
