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

namespace ProjectManagement.Controllers
{
    /// Controller xác thực người dùng: đăng ký, đăng nhập, xem/cập nhật hồ sơ,
    /// tự đổi vai trò và phát hành JWT.
    [ApiController]
    [Route("user")]
    public class UserController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _config;
        private readonly PMDbContext _db;

        public UserController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration config,
            PMDbContext db)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _config = config;
            _db = db;
        }

        public record RegisterDto(string Email, string Password, string? Name, string Otp);
        public record LoginDto(string Email, string Password);
        public record UpdateProfileDto(string? Name, string? AvatarUrl, string? PhoneNumber);
        public record SetRoleDto(string Role);

        /// Đăng ký tài khoản mới
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("Email và mật khẩu là bắt buộc");
            }

            // Kiểm tra OTP hợp lệ
            var otpNow = DateTime.UtcNow;
            var otp = await _db.RegistrationCodes
                .Where(r => r.Email == dto.Email && !r.IsUsed && r.ExpiresAtUtc >= otpNow)
                .OrderByDescending(r => r.Id)
                .FirstOrDefaultAsync();
            if (otp == null || !string.Equals(otp.Code, dto.Otp?.Trim(), StringComparison.Ordinal))
            {
                return BadRequest("Mã đăng ký không hợp lệ hoặc đã hết hạn");
            }

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                EmailConfirmed = true,
                Name = dto.Name ?? string.Empty
            };

            // Mặc định gán role cấp hệ thống là Member
            var roleEnum = SystemRole.Member;
            user.SystemRole = roleEnum;

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
            {
                return BadRequest(createResult.Errors);
            }

            var roleName = "member";
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
               var createRole = await _roleManager.CreateAsync(new IdentityRole(roleName));
               if (!createRole.Succeeded)
               {
                   return BadRequest(createRole.Errors);
               }
            }
            if (!await _userManager.IsInRoleAsync(user, roleName))
            {
               await _userManager.AddToRoleAsync(user, roleName);
            }

            // Đánh dấu dùng xong OTP
            otp.IsUsed = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đăng ký thành công" });
        }

        /// Gửi mã OTP đến email để đăng ký 2 bước
        [HttpPost("register/code")]
        [AllowAnonymous]
        public async Task<IActionResult> SendRegisterCode([FromBody] string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email không hợp lệ");
            var normalized = email.Trim().ToLowerInvariant();

            // Chặn gửi quá thường xuyên: 1 mã còn hiệu lực thì không tạo mới
            var now = DateTime.UtcNow;
            var existingActive = await _db.RegistrationCodes
                .Where(r => r.Email == normalized && !r.IsUsed && r.ExpiresAtUtc > now)
                .OrderByDescending(r => r.Id)
                .FirstOrDefaultAsync();
            if (existingActive != null)
            {
                return Ok(new { message = "Đã gửi mã, vui lòng kiểm tra email (mã còn hiệu lực)." });
            }

            // Tạo OTP 6 số
            var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var code = (BitConverter.ToUInt32(bytes, 0) % 1000000).ToString("D6");

            var ttlMinutes = 10;
            var reg = new RegistrationCode
            {
                Email = normalized,
                Code = code,
                CreatedAtUtc = now,
                ExpiresAtUtc = now.AddMinutes(ttlMinutes),
                IsUsed = false
            };
            _db.RegistrationCodes.Add(reg);
            await _db.SaveChangesAsync();

            // TODO: tích hợp dịch vụ email thực tế để gửi code

            return Ok(new { message = "Đã tạo mã đăng ký và tạm lưu. Tích hợp gửi email sau.", ttlMinutes });
        }


        /// Đăng nhập bằng email/mật khẩu.
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


        /// Lấy thông tin người dùng hiện tại
        [HttpGet("read")]
        [Authorize]
        public async Task<IActionResult> ReadMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();
            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new { user.Id, user.Email, user.Name, user.AvatarUrl, user.PhoneNumber, Roles = roles });
        }


        /// Cập nhật hồ sơ người dùng hiện tại
        [HttpPut("update")]
        [Authorize]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto)
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

        /// Xóa tài khoản của chính người dùng hiện tại.
        [HttpDelete("delete")]
        [Authorize]
        public async Task<IActionResult> DeleteMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);
            return Ok(new { message = "Xóa tài khoản thành công" });
        }

        /// Tự cập nhật role của người dùng hiện tại.
        [HttpPost("update/role")]
        [Authorize(Roles = "system_admin")]
        public async Task<IActionResult> SetMyRole([FromBody] SetRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Role)) return BadRequest("Role không hợp lệ");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            // Map input to enum
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

            // Remove current roles then add new one
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

        /// Tạo JWT cho người dùng kèm các claim vai trò; thời hạn token lấy từ cấu hình.
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


