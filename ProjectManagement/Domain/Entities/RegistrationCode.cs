using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Domain.Entities
{
    public class RegistrationCode
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(12)]
        public string Code { get; set; } = string.Empty; // OTP 6 số

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAtUtc { get; set; }

        public bool IsUsed { get; set; } = false;
        public string? TempUsername { get; set; }

        public string? TempName { get; set; }
        public string? TempPassword { get; set; }
    }
}


