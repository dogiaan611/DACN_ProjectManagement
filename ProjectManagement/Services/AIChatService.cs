using System.Text.Json;
using ProjectManagement.Data;
using Microsoft.EntityFrameworkCore;

namespace ProjectManagement.Services
{
    public interface IAIChatService
    {
        Task<ChatResponse> ProcessMessage(string userMessage, ChatContext context);
    }

    public class AIChatService : IAIChatService
    {
        private readonly IAIService _aiService;
        private readonly ISprintPlanningService _sprintPlanning;
        private readonly PMDbContext _db;
        private readonly ILogger<AIChatService> _logger;

        public AIChatService(
            IAIService aiService,
            ISprintPlanningService sprintPlanning,
            PMDbContext db,
            ILogger<AIChatService> logger)
        {
            _aiService = aiService;
            _sprintPlanning = sprintPlanning;
            _db = db;
            _logger = logger;
        }

        public async Task<ChatResponse> ProcessMessage(string userMessage, ChatContext context)
        {
            try
            {
                // 1. Analyze user intent
                var intent = await AnalyzeIntent(userMessage, context);

                // 2. Route to appropriate handler
                return intent.Type switch
                {
                    "generate_description" => await HandleGenerateDescription(intent, context),
                    "breakdown_task" => await HandleBreakdownTask(intent, context),
                    "estimate_points" => await HandleEstimatePoints(intent, context),
                    "suggest_assignee" => await HandleSuggestAssignee(intent, context),
                    "auto_assign" => await HandleAutoAssign(intent, context),
                    "predict_completion" => await HandlePredictCompletion(intent, context),
                    "workload_balance" => await HandleWorkloadBalance(intent, context),
                    "detect_risks" => await HandleDetectRisks(intent, context),
                    "help" => HandleHelp(),
                    "greeting" => HandleGreeting(),
                    _ => HandleUnknown(userMessage)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat message");
                return new ChatResponse
                {
                    Message = "Sorry, I encountered an error. Please try again.",
                    Type = "error"
                };
            }
        }

        private async Task<UserIntent> AnalyzeIntent(string userMessage, ChatContext context)
        {
            // TODO: Implement Gemini intent parsing
            // For now, use fallback detection directly
            _logger.LogInformation("Using fallback intent detection (Gemini integration pending)");
            return FallbackIntentDetection(userMessage, context);
            
            /* Gemini integration - to be implemented
            var prompt = $@"You are a PM AI Assistant. Analyze this user message and determine their intent.

User Message: ""{userMessage}""

Context:
- Current Page: {context.CurrentPage}
- Task Title: {context.TaskTitle ?? "N/A"}
- Sprint ID: {context.SprintId?.ToString() ?? "N/A"}
- Project ID: {context.ProjectId?.ToString() ?? "N/A"}

Available Intents:
1. generate_description - User wants to generate task description
2. breakdown_task - User wants to break task into subtasks
3. estimate_points - User wants to estimate story points
4. suggest_assignee - User wants assignee suggestion
5. auto_assign - User wants to auto-assign tasks in sprint
6. predict_completion - User wants sprint completion prediction
7. workload_balance - User wants workload analysis
8. detect_risks - User wants risk detection
9. help - User needs help/guidance
10. greeting - User is greeting

Return ONLY a JSON object with this format:
{{
  ""type"": ""intent_name"",
  ""confidence"": 0.95,
  ""entities"": {{
    ""taskTitle"": ""extracted task title if any"",
    ""sprintId"": ""extracted sprint id if any""
  }}
}}";

            var response = await CallGeminiForIntent(prompt);
            
            try
            {
                var intent = JsonSerializer.Deserialize<UserIntent>(response);
                return intent ?? new UserIntent { Type = "unknown", Confidence = 0.0 };
            }
            catch (Exception ex)
            {
                // Fallback: simple keyword matching
                _logger.LogWarning($"Gemini intent parsing failed: {ex.Message}. Using fallback detection.");
                return FallbackIntentDetection(userMessage, context);
            }
            */
        }

        private UserIntent FallbackIntentDetection(string message, ChatContext context)
        {
            var lower = message.ToLower();
            _logger.LogInformation($"Fallback detection for message: '{message}' (lower: '{lower}')");

            // Greetings - match whole words only to avoid false positives (e.g., "this" contains "hi")
            if (System.Text.RegularExpressions.Regex.IsMatch(lower, @"\b(hi|hello|hey|greetings)\b") && 
                !lower.Contains("task") && !lower.Contains("sprint"))
            {
                _logger.LogInformation("Detected intent: greeting");
                return new UserIntent { Type = "greeting", Confidence = 0.9 };
            }

            // Help
            if (lower.Contains("help") || lower.Contains("what can you") || lower.Contains("capabilities"))
            {
                _logger.LogInformation("Detected intent: help");
                return new UserIntent { Type = "help", Confidence = 0.9 };
            }

            // Sprint AI - Check first to avoid conflicts with task AI
            // Auto-assign (must check before suggest_assignee)
            if (lower.Contains("auto") && lower.Contains("assign"))
            {
                _logger.LogInformation("Detected intent: auto_assign");
                return new UserIntent { Type = "auto_assign", Confidence = 0.8 };
            }

            // Sprint status/prediction
            if ((lower.Contains("sprint") && (lower.Contains("how") || lower.Contains("status") || lower.Contains("doing"))) ||
                lower.Contains("predict") || lower.Contains("completion") || 
                (lower.Contains("will") && (lower.Contains("finish") || lower.Contains("complete"))))
            {
                _logger.LogInformation("Detected intent: predict_completion");
                return new UserIntent { Type = "predict_completion", Confidence = 0.8 };
            }

            // Workload balance
            if (lower.Contains("workload") || (lower.Contains("balance") && lower.Contains("team")))
            {
                _logger.LogInformation("Detected intent: workload_balance");
                return new UserIntent { Type = "workload_balance", Confidence = 0.8 };
            }

            // Risk detection
            if (lower.Contains("risk") || (lower.Contains("problem") && lower.Contains("sprint")))
            {
                _logger.LogInformation("Detected intent: detect_risks");
                return new UserIntent { Type = "detect_risks", Confidence = 0.8 };
            }

            // Task AI - More specific patterns
            // Generate description
            if (lower.Contains("description") || lower.Contains("describe") || 
                (lower.Contains("create") && lower.Contains("task")))
            {
                _logger.LogInformation("Detected intent: generate_description");
                return new UserIntent { Type = "generate_description", Confidence = 0.8 };
            }

            // Breakdown task
            if (lower.Contains("breakdown") || lower.Contains("break down") || 
                lower.Contains("break it down") || lower.Contains("subtask") || 
                lower.Contains("split") || lower.Contains("divide"))
            {
                _logger.LogInformation("Detected intent: breakdown_task");
                return new UserIntent { Type = "breakdown_task", Confidence = 0.8 };
            }

            // Estimate story points
            if (lower.Contains("estimate") || lower.Contains("story point") || 
                (lower.Contains("how many") && lower.Contains("point")) ||
                (lower.Contains("how") && lower.Contains("complex")))
            {
                _logger.LogInformation("Detected intent: estimate_points");
                return new UserIntent { Type = "estimate_points", Confidence = 0.8 };
            }

            // Suggest assignee
            if ((lower.Contains("who") && (lower.Contains("should") || lower.Contains("work"))) ||
                (lower.Contains("suggest") && lower.Contains("assign")) ||
                (lower.Contains("recommend") && lower.Contains("member")))
            {
                _logger.LogInformation("Detected intent: suggest_assignee");
                return new UserIntent { Type = "suggest_assignee", Confidence = 0.8 };
            }

            _logger.LogWarning($"No intent detected for message: '{message}'");
            return new UserIntent { Type = "unknown", Confidence = 0.0 };
        }

        // Handler methods
        private async Task<ChatResponse> HandleGenerateDescription(UserIntent intent, ChatContext context)
        {
            var title = intent.Entities?.TaskTitle ?? context.TaskTitle;
            
            if (string.IsNullOrEmpty(title))
            {
                return new ChatResponse
                {
                    Message = "I'd be happy to generate a task description! What's the task title?",
                    Type = "question",
                    SuggestedActions = new List<string> { "Cancel" }
                };
            }

            var description = await _aiService.GenerateTaskDescription(title);

            return new ChatResponse
            {
                Message = $"Here's a description for **{title}**:\n\n{description}",
                Type = "success",
                Data = new { description, title },
                SuggestedActions = new List<string>
                {
                    "Use this description",
                    "Regenerate",
                    "Estimate story points",
                    "Break into subtasks"
                }
            };
        }

        private async Task<ChatResponse> HandleBreakdownTask(UserIntent intent, ChatContext context)
        {
            var title = intent.Entities?.TaskTitle ?? context.TaskTitle;
            var description = context.TaskDescription;

            if (string.IsNullOrEmpty(title))
            {
                return new ChatResponse
                {
                    Message = "I can break down a task into subtasks! What's the task title?",
                    Type = "question"
                };
            }

            var subtasks = await _aiService.BreakdownTask(title, description ?? "");

            var subtasksList = string.Join("\n", subtasks.Select((s, i) => $"{i + 1}. {s}"));

            return new ChatResponse
            {
                Message = $"I've broken down **{title}** into {subtasks.Count} subtasks:\n\n{subtasksList}",
                Type = "success",
                Data = new { subtasks, title },
                SuggestedActions = new List<string>
                {
                    "Create these subtasks",
                    "Regenerate",
                    "Estimate story points"
                }
            };
        }

        private async Task<ChatResponse> HandleEstimatePoints(UserIntent intent, ChatContext context)
        {
            var title = intent.Entities?.TaskTitle ?? context.TaskTitle;
            var description = context.TaskDescription;

            if (string.IsNullOrEmpty(title))
            {
                return new ChatResponse
                {
                    Message = "I can estimate story points! What's the task?",
                    Type = "question"
                };
            }

            var points = await _aiService.EstimateStoryPoints(title, description ?? "");

            var complexity = points switch
            {
                <= 2 => "Very simple",
                <= 5 => "Medium complexity",
                <= 13 => "Complex",
                _ => "Very complex"
            };

            return new ChatResponse
            {
                Message = $"For **{title}**, I estimate **{points} story points** ({complexity}).",
                Type = "success",
                Data = new { storyPoints = points, title, complexity },
                SuggestedActions = new List<string>
                {
                    "Use this estimate",
                    "Re-estimate",
                    "Suggest assignee"
                }
            };
        }

        private async Task<ChatResponse> HandleSuggestAssignee(UserIntent intent, ChatContext context)
        {
            var title = intent.Entities?.TaskTitle ?? context.TaskTitle;
            var projectId = context.ProjectId;

            if (string.IsNullOrEmpty(title) || !projectId.HasValue)
            {
                return new ChatResponse
                {
                    Message = "I need the task title and project to suggest an assignee.",
                    Type = "question"
                };
            }

            var suggestion = await _aiService.SuggestAssignee(projectId.Value, title, context.TaskDescription ?? "");

            return new ChatResponse
            {
                Message = $"For **{title}**, I suggest: **{suggestion}**",
                Type = "success",
                Data = new { suggestion, title },
                SuggestedActions = new List<string>
                {
                    "Assign to this person",
                    "Suggest someone else"
                }
            };
        }

        private async Task<ChatResponse> HandleAutoAssign(UserIntent intent, ChatContext context)
        {
            var sprintId = intent.Entities?.SprintId ?? context.SprintId;

            if (!sprintId.HasValue)
            {
                return new ChatResponse
                {
                    Message = "Which sprint would you like me to auto-assign tasks for?",
                    Type = "question"
                };
            }

            var result = await _sprintPlanning.AutoAssignTasks(sprintId.Value);

            if (!result.Success)
            {
                return new ChatResponse
                {
                    Message = $"❌ {result.Message}",
                    Type = "error"
                };
            }

            if (result.AssignedCount == 0)
            {
                return new ChatResponse
                {
                    Message = "✅ All tasks are already assigned! The sprint is ready to go.",
                    Type = "success"
                };
            }

            var assignmentSummary = string.Join("\n", result.Assignments
                .GroupBy(a => a.AssigneeName)
                .Select(g => $"• **{g.Key}**: {g.Count()} tasks ({g.Sum(a => a.StoryPoints)} points)"));

            return new ChatResponse
            {
                Message = $"✅ Auto-assigned **{result.AssignedCount} tasks**:\n\n{assignmentSummary}",
                Type = "success",
                Data = result,
                SuggestedActions = new List<string>
                {
                    "Check workload balance",
                    "Predict completion",
                    "Detect risks"
                }
            };
        }

        private async Task<ChatResponse> HandlePredictCompletion(UserIntent intent, ChatContext context)
        {
            var sprintId = intent.Entities?.SprintId ?? context.SprintId;

            if (!sprintId.HasValue)
            {
                return new ChatResponse
                {
                    Message = "Which sprint would you like me to analyze?",
                    Type = "question"
                };
            }

            var result = await _sprintPlanning.PredictSprintCompletion(sprintId.Value);

            if (!result.Success)
            {
                return new ChatResponse
                {
                    Message = $"❌ {result.Message}",
                    Type = "error"
                };
            }

            var statusEmoji = result.Status switch
            {
                "On Track" => "✅",
                "At Risk" => "⚠️",
                "Behind Schedule" => "🔴",
                _ => "ℹ️"
            };

            var message = $@"{statusEmoji} **Sprint {sprintId} Status:**

• Completion: **{result.CompletionProbability}%** ({result.Status})
• Progress: {result.CompletedPoints}/{result.TotalPoints} points
• Velocity: **{result.Velocity} points/day**
• Days remaining: **{result.DaysRemaining} days**

{(result.CompletionProbability >= 90 ? "Great! You're on track to complete this sprint! 🎉" : 
  result.CompletionProbability >= 70 ? "Sprint is at risk. Consider prioritizing critical tasks." : 
  "Sprint is behind schedule. You may need to move some tasks to the next sprint.")}";

            return new ChatResponse
            {
                Message = message,
                Type = "success",
                Data = result,
                SuggestedActions = new List<string>
                {
                    "Check workload balance",
                    "Detect risks",
                    "Auto-assign tasks"
                }
            };
        }

        private async Task<ChatResponse> HandleWorkloadBalance(UserIntent intent, ChatContext context)
        {
            var sprintId = intent.Entities?.SprintId ?? context.SprintId;

            if (!sprintId.HasValue)
            {
                return new ChatResponse
                {
                    Message = "Which sprint should I analyze for workload balance?",
                    Type = "question"
                };
            }

            var result = await _sprintPlanning.AnalyzeWorkloadBalance(sprintId.Value);

            if (!result.Success)
            {
                return new ChatResponse
                {
                    Message = $"❌ {result.Message}",
                    Type = "error"
                };
            }

            var statusEmoji = result.BalanceStatus switch
            {
                "Well Balanced" => "✅",
                "Moderately Balanced" => "⚠️",
                _ => "🔴"
            };

            var workloadList = string.Join("\n", result.MemberWorkloads
                .Select(m => $"• **{m.UserName}**: {m.TotalStoryPoints} points ({m.TaskCount} tasks)"));

            var alerts = "";
            if (result.OverloadedMembers.Any())
                alerts += $"\n⚠️ Overloaded: {string.Join(", ", result.OverloadedMembers.Select(m => m.UserName))}";
            if (result.UnderutilizedMembers.Any())
                alerts += $"\nℹ️ Underutilized: {string.Join(", ", result.UnderutilizedMembers.Select(m => m.UserName))}";

            var message = $@"{statusEmoji} **Workload Balance: {result.BalanceStatus}**

Average: **{result.AverageStoryPoints} points/member**
Variance: **{result.Variance} points**

**Team Workload:**
{workloadList}{alerts}";

            return new ChatResponse
            {
                Message = message,
                Type = "success",
                Data = result,
                SuggestedActions = new List<string>
                {
                    "Rebalance workload",
                    "Detect risks",
                    "Predict completion"
                }
            };
        }

        private async Task<ChatResponse> HandleDetectRisks(UserIntent intent, ChatContext context)
        {
            var sprintId = intent.Entities?.SprintId ?? context.SprintId;

            if (!sprintId.HasValue)
            {
                return new ChatResponse
                {
                    Message = "Which sprint should I check for risks?",
                    Type = "question"
                };
            }

            var result = await _sprintPlanning.DetectRisks(sprintId.Value);

            if (!result.Success)
            {
                return new ChatResponse
                {
                    Message = $"❌ {result.Message}",
                    Type = "error"
                };
            }

            if (result.RiskCount == 0)
            {
                return new ChatResponse
                {
                    Message = "✅ Great news! No risks detected in this sprint. Everything looks good! 🎉",
                    Type = "success",
                    SuggestedActions = new List<string>
                    {
                        "Predict completion",
                        "Check workload balance"
                    }
                };
            }

            var riskEmoji = result.OverallRisk switch
            {
                "Critical" => "🔴",
                "High" => "🟠",
                "Medium" => "🟡",
                _ => "🟢"
            };

            var risksList = string.Join("\n\n", result.Risks.Select(r =>
                $"**{GetSeverityEmoji(r.Severity)} {r.Type}** ({r.Severity})\n" +
                $"{r.Description}\n" +
                $"💡 *{r.Recommendation}*"));

            var message = $@"{riskEmoji} **Overall Risk: {result.OverallRisk}**

Detected **{result.RiskCount} risk(s)**:

{risksList}";

            return new ChatResponse
            {
                Message = message,
                Type = result.OverallRisk == "Critical" ? "warning" : "success",
                Data = result,
                SuggestedActions = new List<string>
                {
                    "Auto-assign tasks",
                    "Predict completion",
                    "Check workload"
                }
            };
        }

        private ChatResponse HandleHelp()
        {
            var message = @"👋 Hi! I'm your PM AI Assistant. I can help you with:

**Task Management:**
• Generate task descriptions
• Break tasks into subtasks
• Estimate story points
• Suggest assignees

**Sprint Planning:**
• Auto-assign tasks
• Predict sprint completion
• Analyze workload balance
• Detect risks

**Just ask me naturally!** For example:
• ""Create description for implementing payment""
• ""How is sprint 5 doing?""
• ""Assign all tasks in sprint 3""
• ""What are the risks?""

What would you like help with?";

            return new ChatResponse
            {
                Message = message,
                Type = "info",
                SuggestedActions = new List<string>
                {
                    "Generate task description",
                    "Check sprint status",
                    "Auto-assign tasks",
                    "Detect risks"
                }
            };
        }

        private ChatResponse HandleGreeting()
        {
            var greetings = new[]
            {
                "Hi! 👋 How can I help you today?",
                "Hello! 😊 What would you like to work on?",
                "Hey there! 🤖 Ready to boost your productivity?",
                "Hi! I'm here to help with your project management tasks!"
            };

            var random = new Random();
            var greeting = greetings[random.Next(greetings.Length)];

            return new ChatResponse
            {
                Message = greeting,
                Type = "greeting",
                SuggestedActions = new List<string>
                {
                    "What can you do?",
                    "Check sprint status",
                    "Generate task description"
                }
            };
        }

        private ChatResponse HandleUnknown(string userMessage)
        {
            return new ChatResponse
            {
                Message = "I'm not sure I understand. Could you rephrase that? Or type 'help' to see what I can do!",
                Type = "unknown",
                SuggestedActions = new List<string>
                {
                    "Help",
                    "What can you do?"
                }
            };
        }

        private string GetSeverityEmoji(string severity) => severity switch
        {
            "Critical" => "🔴",
            "High" => "🟠",
            "Medium" => "🟡",
            "Low" => "🟢",
            _ => "ℹ️"
        };

        private async Task<string> CallGeminiForIntent(string prompt)
        {
            // Reuse existing Gemini API call logic
            // This is a simplified version - in production, inject GeminiAIService
            return await Task.FromResult("{}"); // Placeholder
        }
    }

    // DTOs
    public class ChatContext
    {
        public string CurrentPage { get; set; } = "";
        public string? TaskTitle { get; set; }
        public string? TaskDescription { get; set; }
        public int? SprintId { get; set; }
        public int? ProjectId { get; set; }
        public string UserId { get; set; } = "";
    }

    public class ChatResponse
    {
        public string Message { get; set; } = "";
        public string Type { get; set; } = ""; // success, error, question, info, warning
        public object? Data { get; set; }
        public List<string> SuggestedActions { get; set; } = new();
    }

    public class UserIntent
    {
        public string Type { get; set; } = "";
        public double Confidence { get; set; }
        public IntentEntities? Entities { get; set; }
    }

    public class IntentEntities
    {
        public string? TaskTitle { get; set; }
        public int? SprintId { get; set; }
        public int? ProjectId { get; set; }
    }
}
