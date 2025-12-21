using System.Text;
using System.Text.Json;

namespace ProjectManagement.Services
{
    public interface IAIService
    {
        Task<string> GenerateTaskDescription(string title);
        Task<List<string>> BreakdownTask(string title, string description);
        Task<int> EstimateStoryPoints(string title, string description);
        Task<string> SuggestAssignee(int projectId, string taskTitle, string taskDescription);
    }

    public class ProjectMemberDto
    {
        public string Name { get; set; }
        public string Role { get; set; }
    }

    public class GeminiAIService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<GeminiAIService> _logger;
        private readonly string _apiKey;

        public GeminiAIService(HttpClient httpClient, IConfiguration config, ILogger<GeminiAIService> logger)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
            _apiKey = config["Gemini:ApiKey"] ?? "";
        }

        public async Task<string> GenerateTaskDescription(string title)
        {
            try
            {
                var prompt = $@"You are a project management assistant. Generate a clear, concise task description for this task:

Task Title: {title}

Generate a description that includes:
1. What needs to be done (2-3 sentences)
2. Key acceptance criteria (2-3 bullet points)

Keep it professional and actionable. Return only the description text, no extra formatting.";

                var response = await CallGeminiAPI(prompt);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating task description");
                return $"A task to {title.ToLower()}. Please provide more details.";
            }
        }

        public async Task<List<string>> BreakdownTask(string title, string description)
        {
            try
            {
                var prompt = $@"Break down this task into 3-5 smaller subtasks:

Title: {title}
Description: {description}

Return ONLY a JSON array of subtask titles. Each subtask should be specific and actionable.
Format: [""Subtask 1"", ""Subtask 2"", ""Subtask 3""]

Example output:
[""Design database schema"", ""Implement API endpoint"", ""Write unit tests""]";

                var response = await CallGeminiAPI(prompt);
                
                // Try to parse JSON from response
                var jsonStart = response.IndexOf('[');
                var jsonEnd = response.LastIndexOf(']');
                
                if (jsonStart >= 0 && jsonEnd > jsonStart)
                {
                    var jsonStr = response.Substring(jsonStart, jsonEnd - jsonStart + 1);
                    return JsonSerializer.Deserialize<List<string>>(jsonStr) ?? new List<string>();
                }
                
                return new List<string> { title };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error breaking down task");
                return new List<string> { title };
            }
        }

        public async Task<int> EstimateStoryPoints(string title, string description)
        {
            try
            {
                var prompt = $@"You are a Scrum expert. Estimate story points for this task using Fibonacci sequence (1, 2, 3, 5, 8, 13, 21).

Task Title: {title}
Description: {description}

Consider:
- Complexity (technical difficulty)
- Uncertainty (unknowns, risks)
- Effort required (time to complete)

Story Points Guide:
- 1-2: Very simple, well-known task (few hours)
- 3-5: Medium complexity (1-2 days)
- 8-13: Complex task (3-5 days)
- 21: Very complex, should be broken down

Return ONLY the number (1, 2, 3, 5, 8, 13, or 21). No explanation.";

                var response = await CallGeminiAPI(prompt);
                
                // Extract number from response
                var numberStr = new string(response.Where(char.IsDigit).ToArray());
                if (int.TryParse(numberStr, out var points))
                {
                    // Validate it's a Fibonacci number
                    var validPoints = new[] { 1, 2, 3, 5, 8, 13, 21 };
                    if (validPoints.Contains(points))
                    {
                        return points;
                    }
                }
                
                // Default to 5 if parsing fails
                return 5;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error estimating story points");
                return 5; // Default medium complexity
            }
        }

        public async Task<string> SuggestAssignee(int projectId, string taskTitle, string taskDescription)
        {
            try
            {
                // Get project members from database
                var members = await _httpClient.GetFromJsonAsync<List<ProjectMemberDto>>(
                    $"http://localhost:5000/api/Project/{projectId}/members");

                if (members == null || !members.Any())
                {
                    return "No members available in this project";
                }

                var membersList = string.Join("\n", members.Select(m => 
                    $"- {m.Name} ({m.Role})"));

                var prompt = $@"You are a project management assistant. Suggest the best assignee for this task.

Task: {taskTitle}
Description: {taskDescription}

Available Team Members:
{membersList}

Based on the task requirements and team member roles, suggest who should work on this task.
Return ONLY the member's name, nothing else.";

                var response = await CallGeminiAPI(prompt);
                
                // Try to match response with actual member names
                var suggestedName = response.Trim();
                var matchedMember = members.FirstOrDefault(m => 
                    suggestedName.Contains(m.Name, StringComparison.OrdinalIgnoreCase));

                if (matchedMember != null)
                {
                    return $"{matchedMember.Name} - Suggested based on role: {matchedMember.Role}";
                }

                return suggestedName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error suggesting assignee");
                return "Unable to suggest assignee. Please assign manually.";
            }
        }

        private async Task<string> CallGeminiAPI(string prompt)
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                throw new Exception("Gemini API key not configured");
            }

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={_apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseJson);

            var text = result
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text ?? "";
        }
    }
}
