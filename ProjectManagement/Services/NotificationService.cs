using System;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Options;
using Task = System.Threading.Tasks.Task;

namespace ProjectManagement.Services
{
    public class NotificationService : INotificationService
    {
        private readonly SmtpOptions _options;
        private readonly PMDbContext _context;

        public NotificationService(IOptions<SmtpOptions> options, PMDbContext context)
        {
            _options = options.Value;
            _context = context;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                EnableSsl = _options.EnableSsl,
                Credentials = new NetworkCredential(_options.User, _options.Password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(_options.From, _options.FromDisplayName, Encoding.UTF8),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
                BodyEncoding = Encoding.UTF8,
                SubjectEncoding = Encoding.UTF8
            };
            message.To.Add(new MailAddress(to));

            await client.SendMailAsync(message);
        }

        public async Task SendOtpAsync(string to, string code, int ttlMinutes)
        {
            var subject = "Mã xác thực đăng ký";
            var body = $@"<div style='font-family:Segoe UI,Arial,sans-serif'>
                <h2>Mã xác thực</h2>
                <p>Mã của bạn là: <strong style='font-size:20px'>{WebUtility.HtmlEncode(code)}</strong></p>
                <p>Hiệu lực: {ttlMinutes} phút.</p>
                <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
            </div>";
            await SendEmailAsync(to, subject, body);
        }

        public async Task CreateNotificationAsync(string userId, string type, string content, int? projectId = null, int? taskId = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Content = content,
                ProjectId = projectId,
                TaskId = taskId,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Notification>> GetNotificationsAsync(string userId, int page = 1, int pageSize = 20)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(int notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (notifications.Any())
            {
                foreach (var n in notifications)
                {
                    n.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }
        }
    }
}


