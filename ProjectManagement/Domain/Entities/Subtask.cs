using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Identity;

namespace ProjectManagement.Domain.Entities
{
    public class Subtask
    {
        [Key]
        public int SubtaskId { get; set; }

        [ForeignKey("Task")]
        public int TaskId { get; set; }
        public ProjectTask Task { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; }

        public string? Description { get; set; }

        [ForeignKey("Assignee")]
        public string? AssigneeId { get; set; }
        public ApplicationUser? Assignee { get; set; }

        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        public DateTime? DueDate { get; set; }

        public bool IsDone { get; set; } = false;

        [ForeignKey("CreatedBy")]
        public string? CreatedById { get; set; }
        public ApplicationUser CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<SubtaskComment> Comments { get; set; }
        public ICollection<Attachment> Attachments { get; set; }
        public ICollection<SubtaskActivityLog> ActivityLogs { get; set; }
    }
}