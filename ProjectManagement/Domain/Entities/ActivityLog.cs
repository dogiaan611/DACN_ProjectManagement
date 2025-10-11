using ProjectManagement.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class ActivityLog
{
    [Key]
    public int LogId { get; set; }

    [ForeignKey("Task")]
    public int TaskId { get; set; }
    public ProjectTask Task { get; set; }

    [ForeignKey("User")]
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    [Required, MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
