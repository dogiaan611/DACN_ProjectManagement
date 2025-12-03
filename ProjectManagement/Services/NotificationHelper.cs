using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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

        // 1. Task Created
        public static Task NotifyTaskCreatedAsync(this PMDbContext db, ProjectTask task, string actorName)
        {
            // Usually no one to notify on create unless we notify project members (too noisy).
            // But if assigned immediately:
            if (!string.IsNullOrWhiteSpace(task.AssigneeId))
            {
                var content = $"You have been assigned to a new task '{task.Title}' by {actorName}";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "TaskAssigned", content);
            }
            return Task.CompletedTask;
        }

        // 2. Task Updated
        public static Task NotifyTaskUpdatedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string changes)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"Task '{task.Title}' was updated by {actorName}: {changes}";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "TaskUpdated", content);
            }
            return Task.CompletedTask;
        }

        // 3. Task Assigned
        public static Task NotifyTaskAssignedAsync(this PMDbContext db, ProjectTask task, string assigneeId, string actorName)
        {
            if (string.IsNullOrWhiteSpace(assigneeId)) return Task.CompletedTask;
            var content = $"You have been assigned to task '{task.Title}' by {actorName}";
            return db.AddNotificationAsync(assigneeId, task.Column?.Board?.ProjectId, task.TaskId, "TaskAssigned", content);
        }

        // 4. Task Status Changed (Moved)
        public static Task NotifyTaskStatusChangedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string oldStatus, string newStatus)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"Task '{task.Title}' status changed from '{oldStatus}' to '{newStatus}' by {actorName}";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "TaskStatusChanged", content);
            }
            return Task.CompletedTask;
        }

        // 5. Task Deleted
        public static Task NotifyTaskDeletedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName)
        {
            // Notify assignee if they are not the deleter
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"Task '{task.Title}' was deleted by {actorName}";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, null, "TaskDeleted", content);
            }
            return Task.CompletedTask;
        }

        // 6, 7, 8. Comment Created / Edited / Replied
        public static Task NotifyCommentCreatedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string commentContent)
        {
            // Notify assignee if not actor
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} commented on task '{task.Title}': \"{Shorten(commentContent)}\"";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "CommentCreated", content);
            }
            return Task.CompletedTask;
        }

        public static Task NotifyCommentEditedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName)
        {
             if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} edited a comment on task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "CommentEdited", content);
            }
            return Task.CompletedTask;
        }

        // 9. Mention
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

        // 10. Attachment in Comment
        public static Task NotifyCommentAttachmentAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} attached a file to a comment on task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "CommentAttachment", content);
            }
            return Task.CompletedTask;
        }

        // 11. Subtask Created
        public static Task NotifySubtaskCreatedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string subtaskTitle)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} added subtask '{subtaskTitle}' to task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "SubtaskCreated", content);
            }
            return Task.CompletedTask;
        }

        // 12. Subtask Status Changed
        public static Task NotifySubtaskStatusChangedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string subtaskTitle, bool isDone)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var status = isDone ? "completed" : "reopened";
                var content = $"{actorName} {status} subtask '{subtaskTitle}' on task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "SubtaskStatusChanged", content);
            }
            return Task.CompletedTask;
        }

        // 14. Subtask Deleted
        public static Task NotifySubtaskDeletedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string subtaskTitle)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} deleted subtask '{subtaskTitle}' from task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "SubtaskDeleted", content);
            }
            return Task.CompletedTask;
        }

        // 15. File Attached to Task
        public static Task NotifyTaskAttachmentAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} attached a file to task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "TaskAttachment", content);
            }
            return Task.CompletedTask;
        }

        // 16. File Deleted From Task
        public static Task NotifyTaskAttachmentDeletedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string fileName)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} removed attachment '{fileName}' from task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "TaskAttachmentDeleted", content);
            }
            return Task.CompletedTask;
        }

        // 17. Tag Added
        public static Task NotifyTagAddedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string tagName)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} added tag '{tagName}' to task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "TagAdded", content);
            }
            return Task.CompletedTask;
        }

        // 18. Tag Removed
        public static Task NotifyTagRemovedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, string tagName)
        {
            if (!string.IsNullOrWhiteSpace(task.AssigneeId) && task.AssigneeId != actorId)
            {
                var content = $"{actorName} removed tag '{tagName}' from task '{task.Title}'";
                return db.AddNotificationAsync(task.AssigneeId, task.Column?.Board?.ProjectId, task.TaskId, "TagRemoved", content);
            }
            return Task.CompletedTask;
        }

        // Enhanced Feature 1: Notify Team Lead when Priority = Highest
        public static async Task NotifyTeamLeadHighestPriorityAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, int projectId)
        {
            // Find all ProjectAdmin members (team leads)
            var teamLeads = await db.ProjectMembers
                .Where(pm => pm.ProjectId == projectId && pm.Role == ProjectRole.ProjectAdmin && pm.UserId != actorId)
                .Select(pm => pm.UserId)
                .ToListAsync();

            if (!teamLeads.Any()) return;

            var content = $"⚠️ {actorName} created/updated HIGHEST priority task '{task.Title}'";
            
            foreach (var leadId in teamLeads)
            {
                db.Notifications.Add(new Notification
                {
                    UserId = leadId,
                    ProjectId = projectId,
                    TaskId = task.TaskId,
                    Type = "HighestPriority",
                    Content = content,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
            }
            await db.SaveChangesAsync();
        }

        // Enhanced Feature 2: Notify Creator when Task moves to Done
        public static Task NotifyCreatorTaskCompletedAsync(this PMDbContext db, ProjectTask task, string actorId, string actorName, int projectId)
        {
            // Don't notify if creator is the one completing the task
            if (string.IsNullOrWhiteSpace(task.CreatedById) || task.CreatedById == actorId)
                return Task.CompletedTask;

            var content = $"✅ {actorName} marked your task '{task.Title}' as Done";
            return db.AddNotificationAsync(task.CreatedById, projectId, task.TaskId, "TaskCompleted", content);
        }

        // Enhanced Feature 3: Due Date Reminder (to be called by background service)
        public static Task NotifyDueDateReminderAsync(this PMDbContext db, ProjectTask task, int projectId, int hoursUntilDue)
        {
            if (string.IsNullOrWhiteSpace(task.AssigneeId) || !task.DueDate.HasValue)
                return Task.CompletedTask;

            var content = $"⏰ Task '{task.Title}' is due in {hoursUntilDue} hours!";
            return db.AddNotificationAsync(task.AssigneeId, projectId, task.TaskId, "DueDateReminder", content);
        }

        private static string Shorten(string input, int length = 50)
        {
            if (string.IsNullOrEmpty(input)) return string.Empty;
            return input.Length <= length ? input : input.Substring(0, length) + "...";
        }
    }
}