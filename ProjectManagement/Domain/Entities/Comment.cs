using ProjectManagement.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Comment
{
    [Key]
    public int CommentId { get; set; }

    [ForeignKey("Task")]
    public int TaskId { get; set; }
    public ProjectTask Task { get; set; }

    [ForeignKey("User")]
    public string UserId { get; set; }
    public ApplicationUser User { get; set; }

    [Required]
    public string Content { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<CommentMention> Mentions { get; set; } = new List<CommentMention>();
}
