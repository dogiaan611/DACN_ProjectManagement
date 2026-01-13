using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSubtask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssigneeId",
                table: "Subtasks",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedById",
                table: "Subtasks",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Subtasks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "Subtasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "Subtasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Subtasks",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SubtaskCommentCommentId",
                table: "Attachments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SubtaskActivityLogs",
                columns: table => new
                {
                    LogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubtaskId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    OldValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NewValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubtaskActivityLogs", x => x.LogId);
                    table.ForeignKey(
                        name: "FK_SubtaskActivityLogs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SubtaskActivityLogs_Subtasks_SubtaskId",
                        column: x => x.SubtaskId,
                        principalTable: "Subtasks",
                        principalColumn: "SubtaskId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubtaskComments",
                columns: table => new
                {
                    CommentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubtaskId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubtaskComments", x => x.CommentId);
                    table.ForeignKey(
                        name: "FK_SubtaskComments_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubtaskComments_Subtasks_SubtaskId",
                        column: x => x.SubtaskId,
                        principalTable: "Subtasks",
                        principalColumn: "SubtaskId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubtaskCommentMentions",
                columns: table => new
                {
                    CommentId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubtaskCommentMentions", x => new { x.CommentId, x.UserId });
                    table.ForeignKey(
                        name: "FK_SubtaskCommentMentions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SubtaskCommentMentions_SubtaskComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "SubtaskComments",
                        principalColumn: "CommentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Subtasks_AssigneeId",
                table: "Subtasks",
                column: "AssigneeId");

            migrationBuilder.CreateIndex(
                name: "IX_Subtasks_CreatedById",
                table: "Subtasks",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_SubtaskCommentCommentId",
                table: "Attachments",
                column: "SubtaskCommentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_SubtaskActivityLogs_SubtaskId",
                table: "SubtaskActivityLogs",
                column: "SubtaskId");

            migrationBuilder.CreateIndex(
                name: "IX_SubtaskActivityLogs_UserId",
                table: "SubtaskActivityLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SubtaskCommentMentions_UserId",
                table: "SubtaskCommentMentions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SubtaskComments_SubtaskId",
                table: "SubtaskComments",
                column: "SubtaskId");

            migrationBuilder.CreateIndex(
                name: "IX_SubtaskComments_UserId",
                table: "SubtaskComments",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_SubtaskComments_SubtaskCommentCommentId",
                table: "Attachments",
                column: "SubtaskCommentCommentId",
                principalTable: "SubtaskComments",
                principalColumn: "CommentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Subtasks_AspNetUsers_AssigneeId",
                table: "Subtasks",
                column: "AssigneeId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Subtasks_AspNetUsers_CreatedById",
                table: "Subtasks",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_SubtaskComments_SubtaskCommentCommentId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Subtasks_AspNetUsers_AssigneeId",
                table: "Subtasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Subtasks_AspNetUsers_CreatedById",
                table: "Subtasks");

            migrationBuilder.DropTable(
                name: "SubtaskActivityLogs");

            migrationBuilder.DropTable(
                name: "SubtaskCommentMentions");

            migrationBuilder.DropTable(
                name: "SubtaskComments");

            migrationBuilder.DropIndex(
                name: "IX_Subtasks_AssigneeId",
                table: "Subtasks");

            migrationBuilder.DropIndex(
                name: "IX_Subtasks_CreatedById",
                table: "Subtasks");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_SubtaskCommentCommentId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "AssigneeId",
                table: "Subtasks");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Subtasks");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Subtasks");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "Subtasks");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Subtasks");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Subtasks");

            migrationBuilder.DropColumn(
                name: "SubtaskCommentCommentId",
                table: "Attachments");
        }
    }
}
