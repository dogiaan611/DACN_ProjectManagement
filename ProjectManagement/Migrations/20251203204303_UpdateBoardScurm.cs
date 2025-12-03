using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBoardScurm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActiveSprintId",
                table: "Boards",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ColumnStatusMappings",
                columns: table => new
                {
                    MappingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ColumnId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColumnStatusMappings", x => x.MappingId);
                    table.ForeignKey(
                        name: "FK_ColumnStatusMappings_Columns_ColumnId",
                        column: x => x.ColumnId,
                        principalTable: "Columns",
                        principalColumn: "ColumnId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Boards_ActiveSprintId",
                table: "Boards",
                column: "ActiveSprintId");

            migrationBuilder.CreateIndex(
                name: "IX_ColumnStatusMappings_ColumnId",
                table: "ColumnStatusMappings",
                column: "ColumnId");

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

            migrationBuilder.DropTable(
                name: "ColumnStatusMappings");

            migrationBuilder.DropIndex(
                name: "IX_Boards_ActiveSprintId",
                table: "Boards");

            migrationBuilder.DropColumn(
                name: "ActiveSprintId",
                table: "Boards");
        }
    }
}
