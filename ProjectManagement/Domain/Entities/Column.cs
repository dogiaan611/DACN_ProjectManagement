using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagement.Domain.Entities
{
    public class Column
    {
        [Key]
        public int ColumnId { get; set; }

        [ForeignKey("Board")]
        public int BoardId { get; set; }
        public Board Board { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        public int Position { get; set; } = 0;
        public int? WipLimit { get; set; }

        [Required, MaxLength(20)]
        public string Color { get; set; } = "#ffffff";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public virtual ICollection<ProjectTask> ProjectTasks { get; set; }
    }
}
