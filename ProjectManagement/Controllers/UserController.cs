using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ProjectManagement.Domain.Identity;
using ProjectManagement.Data;
using ProjectManagement.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Cryptography;
using ProjectManagement.Services;

// Controller xác thực người dùng: đăng ký, đăng nhập, xem/cập nhật hồ sơ, tự đổi vai trò và phát hành JWT.
namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("user")]
    public class UserController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly PMDbContext _db;
        private readonly IConfiguration _config;
        private readonly INotificationService _notificationService;

        public UserController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole> roleManager,
            PMDbContext db,
            IConfiguration config,
            INotificationService notificationService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _db = db;
            _config = config;
            _notificationService = notificationService;
        }

        public record RegisterRequestDto(string Name, string Email, string Password);
        public record RequestOtpDto(string Email); 
        public record RegisterOTPDto(string Otp, string Name, string Password); 
        public record LoginDto(string Email, string Password);
        public record UpdateDto(string? Name, string? AvatarUrl, string? PhoneNumber);
        public record SetRoleDto(string Role);
        public record ChangePasswordDto(string CurrentPassword, string NewPassword);
        public record ConfirmEmailDto(string Email);
        public record AdminUpdateUserDto(string? Password, string? Role);

        // Đăng ký tài khoản mới
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterRequestOtp([FromBody] RequestOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email là bắt buộc");

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            // Kiểm tra email đã tồn tại chưa
            if (await _userManager.FindByEmailAsync(normalizedEmail) != null)
                return BadRequest("Email đã tồn tại");

            // Kiểm tra đã có mã OTP còn hiệu lực không
            var now = DateTime.UtcNow;
            var existingActive = await _db.RegistrationCodes
                .Where(r => r.Email == normalizedEmail && !r.IsUsed && r.ExpiresAtUtc > now)
                .OrderByDescending(r => r.Id)
                .FirstOrDefaultAsync();
            if (existingActive != null)
                return Ok(new { message = "Đã gửi mã, vui lòng kiểm tra email (mã còn hiệu lực)." });

            // Tạo mã OTP mới
            var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var code = (BitConverter.ToUInt32(bytes, 0) % 1000000).ToString("D6");

            var ttlMinutes = 10;
            var reg = new RegistrationCode
            {
                Email = normalizedEmail,
                Code = code,
                CreatedAtUtc = now,
                ExpiresAtUtc = now.AddMinutes(ttlMinutes),
                IsUsed = false,
                TempUsername = dto.Email, // Username là email đăng ký
                TempPassword = null, // Password có thể nhập sausau
                TempName = null // Name có thể nhập sausau
            };
            _db.RegistrationCodes.Add(reg);
            await _db.SaveChangesAsync();

            await _notificationService.SendOtpAsync(normalizedEmail, code, ttlMinutes);

            return Ok(new { message = "Đã gửi mã đăng ký qua email.", ttlMinutes });
        }

        // Kiểm tra các trường thông tin và gửi mã OTP đến email để đăng ký 2 bước
        [HttpPost("register/otp")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterWithOtp([FromBody] RegisterOTPDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Otp) || string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Mã OTP, tên và mật khẩu là bắt buộc");

            var otpNow = DateTime.UtcNow;
            var otpRecord = await _db.RegistrationCodes
                .Where(r => !r.IsUsed && r.ExpiresAtUtc >= otpNow && r.Code == dto.Otp.Trim())
                .OrderByDescending(r => r.Id)
                .FirstOrDefaultAsync();

            if (otpRecord == null)
                return BadRequest("Mã đăng ký không hợp lệ hoặc đã hết hạn");

            // Kiểm tra email đã tồn tại chưa
            if (await _userManager.FindByEmailAsync(otpRecord.Email) != null)
                return BadRequest("Email đã tồn tại");
            if (await _userManager.Users.AnyAsync(u => u.Name == dto.Name))
                return BadRequest("Name đã tồn tại");

            var user = new ApplicationUser
            {
                UserName = otpRecord.Email,
                Email = otpRecord.Email,
                EmailConfirmed = true,
                Name = dto.Name
            };

            user.SystemRole = SystemRole.Member;

            var createResult = await _userManager.CreateAsync(user, dto.Password!);
            if (!createResult.Succeeded)
                return BadRequest(createResult.Errors);

            var roleName = "member";
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                var createRole = await _roleManager.CreateAsync(new IdentityRole(roleName));
                if (!createRole.Succeeded)
                    return BadRequest(createRole.Errors);
            }
            if (!await _userManager.IsInRoleAsync(user, roleName))
                await _userManager.AddToRoleAsync(user, roleName);

            otpRecord.IsUsed = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đăng ký thành công" });
        }

        // Đăng nhập
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                return Unauthorized();
            }

            var check = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);
            if (!check.Succeeded)
            {
                return Unauthorized();
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwt(user, roles);
            return Ok(new { access_token = token });
        }

        // Lấy thông tin người dùng hiện tại
        [HttpGet("read")]
        [Authorize]
        public async Task<IActionResult> ReadMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();
            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new { user.Id, user.Email, user.Name, user.AvatarUrl, user.PhoneNumber, user.SystemRole, Roles = roles });
        }

        // Upload ảnh đại diện
        [HttpPost("upload-avatar")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Không có file được chọn");

            // Kiểm tra loại file
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest("Chỉ cho phép file ảnh (JPG, PNG, GIF, WebP)");

            // Kiểm tra kích thước file (tối đa 5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest("File quá lớn. Kích thước tối đa là 5MB");

            try
            {
                // Tạo thư mục uploads nếu chưa có
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
                if (!Directory.Exists(uploadsPath))
                    Directory.CreateDirectory(uploadsPath);

                // Tạo tên file duy nhất
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"avatar_{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                // Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Cập nhật AvatarUrl trong database
                var user = await _userManager.FindByIdAsync(userId!);
                if (user != null)
                {
                    user.AvatarUrl = $"/uploads/avatars/{fileName}";
                    await _userManager.UpdateAsync(user);
                }

                return Ok(new {
                    message = "Upload ảnh thành công",
                    avatarUrl = $"/uploads/avatars/{fileName}"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi upload file: {ex.Message}");
            }
        }

        // Cập nhật hồ sơ người dùng hiện tại
        [HttpPut("update")]
        [Authorize]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();
            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                user.Name = dto.Name.Trim();
            }
            if (!string.IsNullOrWhiteSpace(dto.AvatarUrl))
            {
                user.AvatarUrl = dto.AvatarUrl.Trim();
            }
            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                user.PhoneNumber = dto.PhoneNumber.Trim();
            }
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);
            return Ok(new { message = "Cập nhật hồ sơ thành công" });
        }

        // Admin cập nhật thông tin user khác (Password, Role)
        [HttpPut("admin/update/{id}")]
        [Authorize(Roles = "system_admin")]
        public async Task<IActionResult> AdminUpdateUser(string id, [FromBody] AdminUpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound("User not found");

            // Update Password if provided
            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var result = await _userManager.ResetPasswordAsync(user, token, dto.Password);
                if (!result.Succeeded) return BadRequest(result.Errors);
            }

            // Update Role if provided
            if (!string.IsNullOrWhiteSpace(dto.Role))
            {
                var roleEnum = SystemRole.Member;
                var raw = dto.Role.Trim();
                if (Enum.TryParse<SystemRole>(raw, true, out var parsed))
                {
                    roleEnum = parsed;
                }
                else if (string.Equals(raw, "system_admin", StringComparison.OrdinalIgnoreCase) || string.Equals(raw, "system-admin", StringComparison.OrdinalIgnoreCase))
                {
                    roleEnum = SystemRole.SystemAdmin;
                }

                var roleName = roleEnum == SystemRole.SystemAdmin ? "system_admin" : "member";
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    await _roleManager.CreateAsync(new IdentityRole(roleName));
                }

                var currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, roleName);

                user.SystemRole = roleEnum;
                await _userManager.UpdateAsync(user);
            }

            return Ok(new { message = "User updated successfully" });
        }

        // Đổi mật khẩu
        [Authorize]
        [HttpPut("update-password")]
        public async Task<IActionResult> UpdatePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            // Dùng phương thức của UserManager để đổi mật khẩu an toàn
            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

            if (!result.Succeeded)
            {
                return BadRequest(new { 
                    errors = result.Errors.Select(e => e.Description) 
                });
            }

            return Ok(new { message = "Đổi mật khẩu thành công" });
        }

        // Xóa tài khoản của chính người dùng hiện tại
        [HttpDelete("delete")]
        [Authorize]
        public async Task<IActionResult> DeleteMe([FromBody] ConfirmEmailDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email xác nhận là bắt buộc");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            // So sánh email được nhập email tài khoản hiện tại
            var normalizedInput = dto.Email.Trim().ToLowerInvariant();
            var normalizedUserEmail = (user.Email ?? string.Empty).Trim().ToLowerInvariant();
            if (!string.Equals(normalizedInput, normalizedUserEmail, StringComparison.Ordinal))
            {
                return BadRequest("Email xác nhận không khớp với email tài khoản");
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);
            return Ok(new { message = "Xóa tài khoản thành công" });
        }

        // Tìm kiếm người dùng theo email
        [HttpGet("search")]
        [Authorize]
        public async Task<IActionResult> SearchByEmail([FromQuery] string q, [FromQuery] int limit = 5)
        {
            if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<object>());

            var term = q.Trim().ToLowerInvariant();

            var users = await _userManager.Users
                .Where(u => u.Email != null && u.Email.ToLower().Contains(term))
                .OrderBy(u => u.Email)
                .Take(Math.Clamp(limit, 1, 20))
                .Select(u => new { u.Id, u.Email, u.Name, u.AvatarUrl })
                .ToListAsync();

            return Ok(users);
        }

        // Lấy danh sách tất cả người dùng
        [HttpGet("read-all")]
        [Authorize(Roles = "system_admin")]
        public async Task<IActionResult> ReadAllUsers()
        {
            var users = await _userManager.Users
                .OrderBy(u => u.Email)
                .Select(u => new {
                    u.Id,
                    u.Email,
                    u.Name,
                    u.AvatarUrl,
                    u.PhoneNumber,
                    u.SystemRole
                }).ToListAsync();
            return Ok(users);
        }

        // Tự cập nhật role của người dùng hiện tại.
        [HttpPost("update/role")]
        [Authorize(Roles = "system_admin")]
        public async Task<IActionResult> SetMyRole([FromBody] SetRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Role)) return BadRequest("Role không hợp lệ");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            // Quy chiếu chuổi role sang enum
            var roleEnum = SystemRole.Member;
            var raw = dto.Role.Trim();
            if (Enum.TryParse<SystemRole>(raw, true, out var parsed))
            {
                roleEnum = parsed;
            }
            else if (string.Equals(raw, "system_admin", StringComparison.OrdinalIgnoreCase) || string.Equals(raw, "system-admin", StringComparison.OrdinalIgnoreCase) || string.Equals(raw, "system admin", StringComparison.OrdinalIgnoreCase))
            {
                roleEnum = SystemRole.SystemAdmin;
            }

            var roleName = roleEnum == SystemRole.SystemAdmin ? "system_admin" : "member";
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                var created = await _roleManager.CreateAsync(new IdentityRole(roleName));
                if (!created.Succeeded) return BadRequest(created.Errors);
            }

            // Xóa các role hiện có và thêm role mới
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
            }
            var addRes = await _userManager.AddToRoleAsync(user, roleName);
            if (!addRes.Succeeded) return BadRequest(addRes.Errors);

            user.SystemRole = roleEnum;
            await _userManager.UpdateAsync(user);

            return Ok(new { message = "Cập nhật role thành công", role = roleName });
        }

        // Tạo JWT cho người dùng kèm các claim vai trò; thời hạn token lấy từ cấu hình.
        private string GenerateJwt(ApplicationUser user, IList<string> roles)
        {
            var jwt = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: jwt["Issuer"],
                audience: jwt["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(int.Parse(jwt["AccessTokenMinutes"] ?? "60")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
