using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagement.Domain.Entities
{
    public enum ColumnStatus
    {
        ToDo,
        InProgress,
        Done
    }

    public class ColumnStatusMapping
    {
        [Key]
        public int MappingId { get; set; }

        [ForeignKey("Column")]
        public int ColumnId { get; set; }
        public Column Column { get; set; }

        public ColumnStatus Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
