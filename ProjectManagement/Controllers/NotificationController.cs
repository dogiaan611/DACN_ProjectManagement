using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Services;
using System.Threading.Tasks;

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
    }
}


