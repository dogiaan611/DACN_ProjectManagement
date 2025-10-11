using System;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using ProjectManagement.Options;
using Task = System.Threading.Tasks.Task;

namespace ProjectManagement.Services
{
    public class EmailNotificationService : INotificationService
    {
        private readonly SmtpOptions _options;

        public EmailNotificationService(IOptions<SmtpOptions> options)
        {
            _options = options.Value;
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
    }
}


