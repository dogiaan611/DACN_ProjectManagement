using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Identity;

namespace ProjectManagement.Domain.Entities
{
    public class SubtaskComment
    {
        [Key]
        public int CommentId { get; set; }

        [ForeignKey("Subtask")]
        public int SubtaskId { get; set; }
        public Subtask Subtask { get; set; }

        [ForeignKey("User")]
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        [Required]
        public string Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<SubtaskCommentMention> Mentions { get; set; }
        public ICollection<Attachment> Attachments { get; set; }
    }
}
