using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSprint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedById",
                table: "Sprints",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Goal",
                table: "Sprints",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DefaultSprintDuration",
                table: "Projects",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "EstimationScale",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "StoryPoints",
                table: "PojectTasks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sprints_CreatedById",
                table: "Sprints",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Sprints_AspNetUsers_CreatedById",
                table: "Sprints",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sprints_AspNetUsers_CreatedById",
                table: "Sprints");

            migrationBuilder.DropIndex(
                name: "IX_Sprints_CreatedById",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "Goal",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "DefaultSprintDuration",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "EstimationScale",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "StoryPoints",
                table: "PojectTasks");
        }
    }
}
