using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Entities;
public enum SprintStatus { Planned, Active, Closed }

public class Sprint
{
    [Key]
    public int SprintId { get; set; }

    [ForeignKey("Project")]
    public int ProjectId { get; set; }
    public Project Project { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public SprintStatus Status { get; set; } = SprintStatus.Planned;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<Task> Tasks { get; set; }
}
