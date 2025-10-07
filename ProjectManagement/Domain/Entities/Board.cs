using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Entities;


public enum BoardType { Kanban, Scrum }

public class Board
{
    [Key]
    public int BoardId { get; set; }

    [ForeignKey("Project")]
    public int ProjectId { get; set; }
    public Project Project { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; }

    public BoardType Type { get; set; } = BoardType.Kanban;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<Column> Columns { get; set; }
}
