using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ProjectManagement.Domain.Identity;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ProjectManagement.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _config;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration config)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _config = config;
        }

        public record RegisterDto(string Email, string Password, string? Name, string? Role);
        public record LoginDto(string Email, string Password);
        public record UpdateProfileDto(string? Name);
        public record SetRoleDto(string Role);

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("Email và mật khẩu là bắt buộc");
            }

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                EmailConfirmed = true,
                Name = dto.Name ?? string.Empty
            };

            // Map incoming role string to enum SystemRole
            var roleEnum = SystemRole.Member;
            if (!string.IsNullOrWhiteSpace(dto.Role))
            {
                var raw = dto.Role.Trim();
                if (Enum.TryParse<SystemRole>(raw, true, out var parsed))
                {
                    roleEnum = parsed;
                }
                else if (string.Equals(raw, "system_admin", StringComparison.OrdinalIgnoreCase))
                {
                    roleEnum = SystemRole.SystemAdmin;
                }
                else if (string.Equals(raw, "member", StringComparison.OrdinalIgnoreCase))
                {
                    roleEnum = SystemRole.Member;
                }
            }
            user.SystemRole = roleEnum;

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
            {
                return BadRequest(createResult.Errors);
            }

            // Map enum to Identity role name
            var roleName = roleEnum == SystemRole.SystemAdmin ? "system_admin" : "member";
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

            return Ok(new { message = "Đăng ký thành công" });
        }

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

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();
            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new { user.Id, user.Email, user.Name, Roles = roles });
        }

        [HttpPut("me")]
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
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);
            return Ok(new { message = "Cập nhật hồ sơ thành công" });
        }

        [HttpDelete("me")]
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

        [HttpPost("me/role")]
        [Authorize]
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


