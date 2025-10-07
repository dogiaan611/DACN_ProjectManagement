using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Identity;

public enum ProjectRole { ProjectAdmin, ProjectMember, Viewer }

public class ProjectMember
{
    [Key, Column(Order = 0)]
    public int ProjectId { get; set; }
    public Project Project { get; set; }

    [Key, Column(Order = 1)]
    public string UserId { get; set; }
    public ApplicationUser User { get; set; }

    public ProjectRole Role { get; set; } = ProjectRole.ProjectMember;

    public bool IsOwner { get; set; } = false;
}
