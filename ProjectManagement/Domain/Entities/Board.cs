using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public enum BoardType { Kanban, Scrum }

namespace ProjectManagement.Domain.Entities {
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

        [ForeignKey("ActiveSprint")]
        public int? ActiveSprintId { get; set; }  // For Scrum boards: which sprint to display
        public Sprint? ActiveSprint { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public ICollection<Column> Columns { get; set; }
    }
}
