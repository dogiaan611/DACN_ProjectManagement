using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Services;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;

///Controler thông báo: Gửi email và OTP
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("notification")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        public record SendEmailDto(string To, string Subject, string HtmlBody);
        public record SendOtpDto(string To, string Code, int TtlMinutes);

        /// Gửi email chung (chỉ admin)
        [HttpPost("email/send")]
        [Authorize(Roles = "system_admin")]
        public async Task<IActionResult> SendEmail([FromBody] SendEmailDto dto)
        {
            await _notificationService.SendEmailAsync(dto.To, dto.Subject, dto.HtmlBody);
            return Ok(new { message = "Đã gửi email" });
        }

        /// Gửi OTP (chỉ admin hoặc hệ thống)
        [HttpPost("otp/send")]
        [Authorize(Roles = "system_admin")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpDto dto)
        {
            await _notificationService.SendOtpAsync(dto.To, dto.Code, dto.TtlMinutes);
            return Ok(new { message = "Đã gửi OTP" });
        }

        /// <summary>
        /// Lấy danh sách thông báo của user hiện tại
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var notifications = await _notificationService.GetNotificationsAsync(userId, page, pageSize);
            return Ok(notifications);
        }

        /// <summary>
        /// Đánh dấu 1 thông báo là đã đọc
        /// </summary>
        [HttpPut("{id}/read")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok(new { message = "Đã đánh dấu đã đọc" });
        }

        /// <summary>
        /// Đánh dấu tất cả là đã đọc
        /// </summary>
        [HttpPut("read-all")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(new { message = "Đã đánh dấu tất cả đã đọc" });
        }

        public record CreateNotificationDto(string UserId, string Type, string Content, int? ProjectId, int? TaskId);

        /// <summary>
        /// Tạo thông báo thủ công (Admin/System)
        /// </summary>
        [HttpPost("create")]
        [Authorize(Roles = "system_admin")]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            await _notificationService.CreateNotificationAsync(dto.UserId, dto.Type, dto.Content, dto.ProjectId, dto.TaskId);
            return Ok(new { message = "Đã tạo thông báo" });
        }
    }
}


