using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class FixBoardSprintCascade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Boards_Sprints_ActiveSprintId",
                table: "Boards");

            migrationBuilder.AddForeignKey(
                name: "FK_Boards_Sprints_ActiveSprintId",
                table: "Boards",
                column: "ActiveSprintId",
                principalTable: "Sprints",
                principalColumn: "SprintId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Boards_Sprints_ActiveSprintId",
                table: "Boards");

            migrationBuilder.AddForeignKey(
                name: "FK_Boards_Sprints_ActiveSprintId",
                table: "Boards",
                column: "ActiveSprintId",
                principalTable: "Sprints",
                principalColumn: "SprintId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
