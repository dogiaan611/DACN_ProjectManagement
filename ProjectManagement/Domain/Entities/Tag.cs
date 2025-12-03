using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagement.Domain.Entities {
    public class Tag
    {
        [Key]
        public int TagId { get; set; }

        [ForeignKey("Project")]
        public int ProjectId { get; set; }
        public Project Project { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; }

        [MaxLength(20)]
        public string Color { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public ICollection<TaskTag> TaskTags { get; set; }
        public ICollection<TaskUserTag> TaskUserTags { get; set; }
    }
}