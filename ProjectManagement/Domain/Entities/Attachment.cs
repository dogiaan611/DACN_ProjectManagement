using ProjectManagement.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Attachment
{
    [Key]
    public int AttachmentId { get; set; }

    [ForeignKey("Task")]
    public int TaskId { get; set; }
    public Task Task { get; set; }

    [Required, MaxLength(255)]
    public string FilePath { get; set; }

    [ForeignKey("UploadedBy")]
    public int? UploadedById { get; set; }
    public User? UploadedBy { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.Now;
}