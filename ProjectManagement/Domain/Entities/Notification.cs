using ProjectManagement.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Notification
{
    [Key]
    public int NotificationId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }
    public User User { get; set; }

    [ForeignKey("Project")]
    public int? ProjectId { get; set; }
    public Project Project { get; set; }

    [ForeignKey("Task")]
    public int? TaskId { get; set; }
    public Task Task { get; set; }

    [Required, MaxLength(50)]
    public string Type { get; set; }

    [Required]
    public string Content { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
