using Microsoft.AspNetCore.Identity;
using ProjectManagement.Domain.Entities;
using ProjectManagement.Domain.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagement.Data
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(PMDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            // 1. Seed Roles
            string[] roles = { "Admin", "Manager", "Member" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // 2. Seed Admin User
            var adminEmail = "admin@example.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    Name = "Quản trị viên",
                    EmailConfirmed = true,
                    SystemRole = SystemRole.SystemAdmin,
                    CreatedAt = DateTime.UtcNow
                };
                var result = await userManager.CreateAsync(adminUser, "Admin@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // 3. Seed Sample Project
            if (!context.Projects.Any())
            {
                var project = new Project
                {
                    Name = "Dự án Quản lý phần mềm mẫu",
                    Description = "Đây là dự án mẫu bao gồm các User Story và Task để người dùng mới có thể trải nghiệm hệ thống một cách nhanh chóng.",
                    Type = ProjectType.Scrum,
                    CreatedById = adminUser.Id,
                    CreatedAt = DateTime.Now
                };
                context.Projects.Add(project);
                await context.SaveChangesAsync();

                // 4. Seed Project Member
                var member = new ProjectMember
                {
                    ProjectId = project.ProjectId,
                    UserId = adminUser.Id,
                    Role = ProjectRole.ProjectAdmin,
                    IsOwner = true
                };
                context.ProjectMembers.Add(member);
                await context.SaveChangesAsync();

                // 5. Seed Board
                var board = new Board
                {
                    ProjectId = project.ProjectId,
                    Name = "Scrum Board",
                    Type = BoardType.Scrum,
                    CreatedAt = DateTime.Now
                };
                context.Boards.Add(board);
                await context.SaveChangesAsync();

                // 6. Seed Columns
                var columns = new List<Column>
                {
                    new Column { BoardId = board.BoardId, Name = "Backlog", Position = 0, Color = "#edf2f7" },
                    new Column { BoardId = board.BoardId, Name = "To Do", Position = 1, Color = "#e2e8f0" },
                    new Column { BoardId = board.BoardId, Name = "In Progress", Position = 2, Color = "#bee3f8" },
                    new Column { BoardId = board.BoardId, Name = "Done", Position = 3, Color = "#c6f6d5" }
                };
                context.Columns.AddRange(columns);
                await context.SaveChangesAsync();

                var toDoColumn = columns.First(c => c.Name == "To Do");
                var inProgressColumn = columns.First(c => c.Name == "In Progress");

                // 7. Seed Sprint
                var sprint = new Sprint
                {
                    ProjectId = project.ProjectId,
                    Name = "Sprint 1: Khởi động dự án",
                    Goal = "Hoàn thành các thiết lập cơ bản và nghiên cứu kiến trúc hệ thống.",
                    StartDate = DateTime.Now,
                    EndDate = DateTime.Now.AddDays(14),
                    Status = SprintStatus.Active,
                    CreatedById = adminUser.Id,
                    CreatedAt = DateTime.UtcNow
                };
                context.Sprints.Add(sprint);
                await context.SaveChangesAsync();

                // Set active sprint for board
                board.ActiveSprintId = sprint.SprintId;
                await context.SaveChangesAsync();

                // 8. Seed Tasks
                var tasks = new List<ProjectTask>
                {
                    new ProjectTask
                    {
                        ColumnId = toDoColumn.ColumnId,
                        Title = "Nghiên cứu kiến trúc hệ thống .NET Core 8",
                        Description = "Đọc tài liệu về Clean Architecture, Dependency Injection và Entity Framework Core để áp dụng chuẩn vào mã nguồn.",
                        CreatedById = adminUser.Id,
                        Priority = TaskPriority.High,
                        StoryPoints = 3,
                        SprintId = sprint.SprintId,
                        CreatedAt = DateTime.Now
                    },
                    new ProjectTask
                    {
                        ColumnId = inProgressColumn.ColumnId,
                        Title = "Thiết kế UI cho trang Dashboard chính",
                        Description = "Sử dụng React và Tailwind CSS để xây dựng giao diện thống kê dự án theo phong cách hiện đại (Glassmorphism).",
                        CreatedById = adminUser.Id,
                        AssigneeId = adminUser.Id,
                        Priority = TaskPriority.Medium,
                        StoryPoints = 5,
                        SprintId = sprint.SprintId,
                        CreatedAt = DateTime.Now
                    },
                    new ProjectTask
                    {
                        ColumnId = toDoColumn.ColumnId,
                        Title = "Cài đặt Docker và CI/CD Pipeline",
                        Description = "Viết Dockerfile và cấu hình GitHub Actions để tự động deploy dự án lên máy chủ Amazon EC2.",
                        CreatedById = adminUser.Id,
                        Priority = TaskPriority.Critical,
                        StoryPoints = 8,
                        SprintId = sprint.SprintId,
                        CreatedAt = DateTime.Now
                    },
                    new ProjectTask
                    {
                        ColumnId = toDoColumn.ColumnId,
                        Title = "Viết Unit Test cho tầng Service",
                        Description = "Đảm bảo logic nghiệp vụ được kiểm thử đầy đủ trước khi được merge vào nhánh chính.",
                        CreatedById = adminUser.Id,
                        Priority = TaskPriority.Low,
                        StoryPoints = 2,
                        SprintId = sprint.SprintId,
                        CreatedAt = DateTime.Now
                    }
                };
                context.PojectTasks.AddRange(tasks);
                await context.SaveChangesAsync();
            }
        }
    }
}
