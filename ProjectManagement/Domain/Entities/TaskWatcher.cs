using ProjectManagement.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class TaskWatcher
{
    [Key, Column(Order = 0)]
    public int TaskId { get; set; }
    public Task Task { get; set; }

    [Key, Column(Order = 1)]
    public int UserId { get; set; }
    public User User { get; set; }
}