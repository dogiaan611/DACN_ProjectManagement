using ProjectManagement.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net.Mail;

public enum TaskPriority { Low, Medium, High, Critical }

public class ProjectTask
{
    [Key]
    public int TaskId { get; set; }

    [ForeignKey("Column")]
    public int ColumnId { get; set; }
    public Column Column { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; }
    public string Description { get; set; }

    [ForeignKey("CreatedBy")]
    public string CreatedById { get; set; }
    public ApplicationUser CreatedBy { get; set; }

    [ForeignKey("Assignee")]
    public string? AssigneeId { get; set; }
    public ApplicationUser? Assignee { get; set; }

    public bool IsLocked { get; set; } = false;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public DateTime? DueDate { get; set; }
    public int SortOrder { get; set; } = 0;

    [ForeignKey("Sprint")]
    public int? SprintId { get; set; }
    public Sprint Sprint { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<Subtask> Subtasks { get; set; } = new List<Subtask>();
    public ICollection<TaskWatcher> Watchers { get; set; } = new List<TaskWatcher>();
    public ICollection<TaskTag> TaskTags { get; set; } = new List<TaskTag>();
    public ICollection<TaskUserTag> TaskUserTags { get; set; } = new List<TaskUserTag>();
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}
