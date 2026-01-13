using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ProjectManagement.Domain.Identity;

namespace ProjectManagement.Domain.Entities
{
    public class SubtaskCommentMention
    {
        [Key, Column(Order = 0)]
        public int CommentId { get; set; }
        public SubtaskComment Comment { get; set; }

        [Key, Column(Order = 1)]
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
    }
}
