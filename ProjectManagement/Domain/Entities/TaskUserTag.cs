using ProjectManagement.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class TaskUserTag
{
    [Key, Column(Order = 0)]
    public int TaskId { get; set; }
    public ProjectTask Task { get; set; }

    [Key, Column(Order = 1)]
    public string UserId { get; set; }
    public ApplicationUser User { get; set; }

    [Key, Column(Order = 2)]
    public int TagId { get; set; }
    public Tag Tag { get; set; }
}
