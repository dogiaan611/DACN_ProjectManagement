using System.Threading.Tasks;

namespace ProjectManagement.Services
{
    public interface INotificationService
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);

        Task SendOtpAsync(string to, string code, int ttlMinutes);

        Task CreateNotificationAsync(string userId, string type, string content, int? projectId = null, int? taskId = null);

        Task<IEnumerable<Notification>> GetNotificationsAsync(string userId, int page = 1, int pageSize = 20);

        Task MarkAsReadAsync(int notificationId, string userId);

        Task MarkAllAsReadAsync(string userId);
    }
}


