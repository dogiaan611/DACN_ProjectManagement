using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Entities;

public enum ProjectRole { ProjectAdmin, ProjectMember, Viewer }

public class ProjectMember
{
    [Key, Column(Order = 0)]
    public int ProjectId { get; set; }
    public Project Project { get; set; }

    [Key, Column(Order = 1)]
    public int UserId { get; set; }
    public User User { get; set; }

    public ProjectRole Role { get; set; } = ProjectRole.ProjectMember;

    public bool IsOwner { get; set; } = false;
}
