using System.Threading.Tasks;

namespace ProjectManagement.Services
{
    public interface INotificationService
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);

        Task SendOtpAsync(string to, string code, int ttlMinutes);
    }
}


