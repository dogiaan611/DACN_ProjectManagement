using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;

namespace ProjectManagement.Services
{
    public static class NotificationHelper
    {
        public static async Task AddNotificationAsync(this PMDbContext db, string userId, int? projectId, int? taskId, string type, string content)
        {
            if (string.IsNullOrWhiteSpace(userId)) return;

            db.Notifications.Add(new Notification
            {
                UserId = userId,
                ProjectId = projectId,
                TaskId = taskId,
                Type = type,
                Content = content,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });

            await db.SaveChangesAsync();
        }

        public static Task NotifyAssigneeAsync(this PMDbContext db, string assigneeId, int projectId, int taskId, string taskTitle, string fromUserName)
        {
            if (string.IsNullOrWhiteSpace(assigneeId)) return Task.CompletedTask;
            var content = $"You have been assigned to task '{taskTitle}' by {fromUserName}";
            return db.AddNotificationAsync(assigneeId, projectId, taskId, "TaskAssigned", content);
        }

        public static Task NotifyMentionAsync(this PMDbContext db, string userId, int projectId, int taskId, string fromUserName, string taskTitle)
        {
            if (string.IsNullOrWhiteSpace(userId)) return Task.CompletedTask;
            var content = $"You were mentioned by {fromUserName} in a comment on task '{taskTitle}'";
            return db.AddNotificationAsync(userId, projectId, taskId, "Mention", content);
        }

        public static async Task AddMentionNotificationsBatchAsync(this PMDbContext db, IEnumerable<string> userIds, int projectId, int taskId, string fromUserName, string taskTitle)
        {
            foreach (var uid in userIds)
            {
                if (string.IsNullOrWhiteSpace(uid)) continue;
                db.Notifications.Add(new Notification
                {
                    UserId = uid,
                    ProjectId = projectId,
                    TaskId = taskId,
                    Type = "Mention",
                    Content = $"You were mentioned by {fromUserName} in a comment on task '{taskTitle}'",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
            }
            await db.SaveChangesAsync();
        }
    }
}