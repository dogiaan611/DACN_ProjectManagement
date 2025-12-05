using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class MakeSubtaskCreatedByIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Boards_Sprints_ActiveSprintId",
                table: "Boards");

            migrationBuilder.AlterColumn<string>(
                name: "CreatedById",
                table: "Subtasks",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddForeignKey(
                name: "FK_Boards_Sprints_ActiveSprintId",
                table: "Boards",
                column: "ActiveSprintId",
                principalTable: "Sprints",
                principalColumn: "SprintId",
                onDelete: ReferentialAction.NoAction);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Boards_Sprints_ActiveSprintId",
                table: "Boards");

            migrationBuilder.AlterColumn<string>(
                name: "CreatedById",
                table: "Subtasks",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Boards_Sprints_ActiveSprintId",
                table: "Boards",
                column: "ActiveSprintId",
                principalTable: "Sprints",
                principalColumn: "SprintId");
        }
    }
}
