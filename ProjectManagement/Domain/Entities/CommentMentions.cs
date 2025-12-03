using ProjectManagement.Domain.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagement.Domain.Entities
{
    public class CommentMention
    {
        [Key, Column(Order = 0)]
        public int CommentId { get; set; }
        public Comment Comment { get; set; }

        [Key, Column(Order = 1)]
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
    }
}

