using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Services;
using System.Security.Claims;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IAIChatService _chatService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(IAIChatService chatService, ILogger<ChatController> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        /// <summary>
        /// Send a message to AI Chat Assistant
        /// </summary>
        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                // Add user ID to context
                request.Context.UserId = userId ?? "";

                var response = await _chatService.ProcessMessage(request.Message, request.Context);

                _logger.LogInformation($"User {userId} chat: {request.Message} -> {response.Type}");

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat message");
                return StatusCode(500, new
                {
                    message = "Failed to process message",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get AI Assistant capabilities
        /// </summary>
        [HttpGet("capabilities")]
        public IActionResult GetCapabilities()
        {
            var capabilities = new
            {
                features = new[]
                {
                    new
                    {
                        category = "Task Management",
                        items = new[]
                        {
                            "Generate task descriptions",
                            "Break tasks into subtasks",
                            "Estimate story points",
                            "Suggest assignees"
                        }
                    },
                    new
                    {
                        category = "Sprint Planning",
                        items = new[]
                        {
                            "Auto-assign tasks",
                            "Predict sprint completion",
                            "Analyze workload balance",
                            "Detect risks"
                        }
                    }
                },
                exampleQueries = new[]
                {
                    "Create description for implementing payment gateway",
                    "How many story points for this task?",
                    "How is sprint 5 doing?",
                    "Assign all tasks in sprint 3",
                    "What are the risks?",
                    "Is the workload balanced?"
                }
            };

            return Ok(capabilities);
        }

        /// <summary>
        /// Get conversation history (future feature)
        /// </summary>
        [HttpGet("history")]
        public IActionResult GetHistory()
        {
            // Placeholder for future implementation
            return Ok(new
            {
                message = "Conversation history feature coming soon!",
                conversations = new object[] { }
            });
        }
    }

    // Request DTO
    public class ChatRequest
    {
        public string Message { get; set; } = "";
        public ChatContext Context { get; set; } = new();
    }
}
