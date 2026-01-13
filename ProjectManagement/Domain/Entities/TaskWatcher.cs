using ProjectManagement.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagement.Domain.Entities {
    public class TaskWatcher
    {
        [Key, Column(Order = 0)]
        public int TaskId { get; set; }
        public ProjectTask Task { get; set; }

        [Key, Column(Order = 1)]
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
    }
}