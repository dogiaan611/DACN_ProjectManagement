using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Identity;

namespace ProjectManagement.Domain.Entities
{
    public enum SprintStatus 
    { 
        Planning,    // Sprint being planned, not started
        Active,      // Sprint in progress
        Completed,   // Sprint finished successfully
        Cancelled    // Sprint cancelled
    }

    public class Sprint
    {
        [Key]
        public int SprintId { get; set; }

        [ForeignKey("Project")]
        public int ProjectId { get; set; }
        public Project Project { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        public string? Goal { get; set; }  // Sprint goal description

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        
        public SprintStatus Status { get; set; } = SprintStatus.Planning;

        [ForeignKey("CreatedBy")]
        public string CreatedById { get; set; }
        public ApplicationUser CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<ProjectTask> ProjectTasks { get; set; }
    }
}
