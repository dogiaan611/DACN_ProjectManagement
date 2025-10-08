using Microsoft.AspNetCore.Identity;
using ProjectManagement.Domain.Identity;
using System;

namespace ProjectManagement.Domain.Identity
{
    public enum SystemRole { SystemAdmin, Member }

    public class ApplicationUser : IdentityUser
    {
        public string Name { get; set; } = string.Empty;
        public SystemRole SystemRole { get; set; } = SystemRole.Member;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? AvatarUrl { get; set; }
    }
}

