using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Domain.Identity;
using ProjectManagement.Domain.Entities;

namespace ProjectManagement.Data
{
    public class PMDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
    {
        public PMDbContext(DbContextOptions<PMDbContext> options) : base(options)
        {
        }

        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<Board> Boards { get; set; }
        public DbSet<Column> Columns { get; set; }
        public DbSet<Sprint> Sprints { get; set; }
        public DbSet<Task> Tasks { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<TaskTag> TaskTags { get; set; }
        public DbSet<TaskUserTag> TaskUserTags { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<CommentMention> CommentMentions { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Subtask> Subtasks { get; set; }
        public DbSet<TaskWatcher> TaskWatchers { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<RegistrationCode> RegistrationCodes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Keys
            modelBuilder.Entity<ProjectMember>()
                .HasKey(pm => new { pm.ProjectId, pm.UserId });

            modelBuilder.Entity<TaskTag>()
                .HasKey(tt => new { tt.TaskId, tt.TagId });

            modelBuilder.Entity<TaskUserTag>()
                .HasKey(tut => new { tut.TaskId, tut.UserId, tut.TagId });

            modelBuilder.Entity<CommentMention>()
                .HasKey(cm => new { cm.CommentId, cm.UserId });

            modelBuilder.Entity<TaskWatcher>()
                .HasKey(tw => new { tw.TaskId, tw.UserId });

            // Relationships
            // User ↔ Project
            modelBuilder.Entity<Project>()
                .HasOne(p => p.CreatedBy)
                .WithMany()
                .HasForeignKey(p => p.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Project ↔ ProjectMember
            modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.Project)
                .WithMany(p => p.Members)
                .HasForeignKey(pm => pm.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.User)
                .WithMany()
                .HasForeignKey(pm => pm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Board ↔ Project
            modelBuilder.Entity<Board>()
                .HasOne(b => b.Project)
                .WithMany(p => p.Boards)
                .HasForeignKey(b => b.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // Column ↔ Board
            modelBuilder.Entity<Column>()
                .HasOne(c => c.Board)
                .WithMany(b => b.Columns)
                .HasForeignKey(c => c.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            // Sprint ↔ Project
            modelBuilder.Entity<Sprint>()
                .HasOne(s => s.Project)
                .WithMany(p => p.Sprints)
                .HasForeignKey(s => s.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // Task ↔ Column
            modelBuilder.Entity<Task>()
                .HasOne(t => t.Column)
                .WithMany(c => c.Tasks)
                .HasForeignKey(t => t.ColumnId)
                .OnDelete(DeleteBehavior.Restrict);

            // Task ↔ CreatedBy
            modelBuilder.Entity<Task>()
                .HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Task ↔ Assignee
            modelBuilder.Entity<Task>()
                .HasOne(t => t.Assignee)
                .WithMany()
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);

            // Task ↔ Sprint
            modelBuilder.Entity<Task>()
                .HasOne(t => t.Sprint)
                .WithMany(s => s.Tasks)
                .HasForeignKey(t => t.SprintId)
                .OnDelete(DeleteBehavior.SetNull);

            // Tag ↔ Project
            modelBuilder.Entity<Tag>()
                .HasOne(t => t.Project)
                .WithMany(p => p.Tags)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskTag
            modelBuilder.Entity<TaskTag>()
                .HasOne(tt => tt.Task)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(tt => tt.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskTag>()
                .HasOne(tt => tt.Tag)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(tt => tt.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskUserTag
            modelBuilder.Entity<TaskUserTag>()
                .HasOne(tut => tut.Task)
                .WithMany(t => t.TaskUserTags)
                .HasForeignKey(tut => tut.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskUserTag>()
                .HasOne(tut => tut.User)
                .WithMany()
                .HasForeignKey(tut => tut.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskUserTag>()
                .HasOne(tut => tut.Tag)
                .WithMany(t => t.TaskUserTags)
                .HasForeignKey(tut => tut.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            // Comments
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // CommentMentions
            modelBuilder.Entity<CommentMention>()
                .HasOne(cm => cm.Comment)
                .WithMany(c => c.Mentions)
                .HasForeignKey(cm => cm.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CommentMention>()
                .HasOne(cm => cm.User)
                .WithMany()
                .HasForeignKey(cm => cm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Attachments
            modelBuilder.Entity<Attachment>()
                .HasOne(a => a.Task)
                .WithMany(t => t.Attachments)
                .HasForeignKey(a => a.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Attachment>()
                .HasOne(a => a.UploadedBy)
                .WithMany()
                .HasForeignKey(a => a.UploadedById)
                .OnDelete(DeleteBehavior.SetNull);

            // Subtasks
            modelBuilder.Entity<Subtask>()
                .HasOne(s => s.Task)
                .WithMany(t => t.Subtasks)
                .HasForeignKey(s => s.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskWatchers
            modelBuilder.Entity<TaskWatcher>()
                .HasOne(tw => tw.Task)
                .WithMany(t => t.Watchers)
                .HasForeignKey(tw => tw.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskWatcher>()
                .HasOne(tw => tw.User)
                .WithMany()
                .HasForeignKey(tw => tw.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Notifications
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Project)
                .WithMany(p => p.Notifications)
                .HasForeignKey(n => n.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Task)
                .WithMany()
                .HasForeignKey(n => n.TaskId)
                .OnDelete(DeleteBehavior.SetNull);

            // ActivityLogs
            modelBuilder.Entity<ActivityLog>()
                .HasOne(a => a.Task)
                .WithMany(t => t.ActivityLogs)
                .HasForeignKey(a => a.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ActivityLog>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // RegistrationCode
            modelBuilder.Entity<RegistrationCode>()
                .HasIndex(r => new { r.Email, r.IsUsed, r.ExpiresAtUtc });
        }
    }
}

