using ProjectManagement.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public enum ProjectType { Kanban, Scrum }

public class Project
{
    [Key]
    public int ProjectId { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; }

    public string Description { get; set; }

    public ProjectType Type { get; set; } = ProjectType.Kanban;

    [ForeignKey("CreatedBy")]
    public string CreatedById { get; set; }
    public ApplicationUser CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<ProjectMember> Members { get; set; }
    public ICollection<Board> Boards { get; set; }
    public ICollection<Sprint> Sprints { get; set; }
    public ICollection<Tag> Tags { get; set; }
    public ICollection<Notification> Notifications { get; set; }
}
