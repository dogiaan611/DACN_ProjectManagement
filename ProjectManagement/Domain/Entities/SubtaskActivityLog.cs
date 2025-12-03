using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Identity;

namespace ProjectManagement.Domain.Entities
{
    public class SubtaskActivityLog
    {
        [Key]
        public int LogId { get; set; }

        [ForeignKey("Subtask")]
        public int SubtaskId { get; set; }
        public Subtask Subtask { get; set; }

        [ForeignKey("User")]
        public string? UserId { get; set; }
        public ApplicationUser? User { get; set; }

        [Required, MaxLength(100)]
        public string Action { get; set; }

        public string OldValue { get; set; } = string.Empty;
        public string NewValue { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
