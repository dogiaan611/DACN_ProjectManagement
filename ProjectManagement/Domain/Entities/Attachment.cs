using ProjectManagement.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Attachment
{
    [Key]
    public int AttachmentId { get; set; }

    [ForeignKey("Task")]
    public int TaskId { get; set; }
    public ProjectTask Task { get; set; }

    [Required, MaxLength(255)]
    public string FilePath { get; set; } = string.Empty;

    [ForeignKey("UploadedBy")]
    public string? UploadedById { get; set; }
    public ApplicationUser? UploadedBy { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.Now;
}