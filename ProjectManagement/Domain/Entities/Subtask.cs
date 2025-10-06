using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Entities;

public class Subtask
{
    [Key]
    public int SubtaskId { get; set; }

    [ForeignKey("Task")]
    public int TaskId { get; set; }
    public Task Task { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; }

    public bool IsDone { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}