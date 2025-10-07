using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Net.Mail;
using ProjectManagement.Domain.Entities;

namespace ProjectManagement.Domain.Entities
{
    public enum SystemRole { SystemAdmin, Member }

    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        [Required, MaxLength(150)]
        public string Email { get; set; }

        [Required, MaxLength(255)]
        public string PasswordHash { get; set; }

        public SystemRole SystemRole { get; set; } = SystemRole.Member;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public ICollection<Project> CreatedProjects { get; set; }
        public ICollection<ProjectMember> ProjectMemberships { get; set; }
        public ICollection<Task> CreatedTasks { get; set; }
        public ICollection<Task> AssignedTasks { get; set; }
        public ICollection<Comment> Comments { get; set; }
        public ICollection<Attachment> UploadedAttachments { get; set; }
        public ICollection<TaskWatcher> WatchedTasks { get; set; }
        public ICollection<TaskUserTag> TaskUserTags { get; set; }
        public ICollection<Notification> Notifications { get; set; }
        public ICollection<ActivityLog> ActivityLogs { get; set; }
    }
}

