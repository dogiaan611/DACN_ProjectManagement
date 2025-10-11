using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class renameTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogs_Tasks_TaskId",
                table: "ActivityLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Tasks_TaskId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Tasks_TaskId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Tasks_TaskId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Subtasks_Tasks_TaskId",
                table: "Subtasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_AspNetUsers_AssigneeId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_AspNetUsers_CreatedById",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Columns_ColumnId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Sprints_SprintId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskTags_Tasks_TaskId",
                table: "TaskTags");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskUserTags_Tasks_TaskId",
                table: "TaskUserTags");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskWatchers_Tasks_TaskId",
                table: "TaskWatchers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Tasks",
                table: "Tasks");

            migrationBuilder.RenameTable(
                name: "Tasks",
                newName: "PojectTasks");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_SprintId",
                table: "PojectTasks",
                newName: "IX_PojectTasks_SprintId");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_CreatedById",
                table: "PojectTasks",
                newName: "IX_PojectTasks_CreatedById");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_ColumnId",
                table: "PojectTasks",
                newName: "IX_PojectTasks_ColumnId");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_AssigneeId",
                table: "PojectTasks",
                newName: "IX_PojectTasks_AssigneeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PojectTasks",
                table: "PojectTasks",
                column: "TaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogs_PojectTasks_TaskId",
                table: "ActivityLogs",
                column: "TaskId",
                principalTable: "PojectTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_PojectTasks_TaskId",
                table: "Attachments",
                column: "TaskId",
                principalTable: "PojectTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_PojectTasks_TaskId",
                table: "Comments",
                column: "TaskId",
                principalTable: "PojectTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_PojectTasks_TaskId",
                table: "Notifications",
                column: "TaskId",
                principalTable: "PojectTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PojectTasks_AspNetUsers_AssigneeId",
                table: "PojectTasks",
                column: "AssigneeId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PojectTasks_AspNetUsers_CreatedById",
                table: "PojectTasks",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PojectTasks_Columns_ColumnId",
                table: "PojectTasks",
                column: "ColumnId",
                principalTable: "Columns",
                principalColumn: "ColumnId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PojectTasks_Sprints_SprintId",
                table: "PojectTasks",
                column: "SprintId",
                principalTable: "Sprints",
                principalColumn: "SprintId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Subtasks_PojectTasks_TaskId",
                table: "Subtasks",
                column: "TaskId",
                principalTable: "PojectTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskTags_PojectTasks_TaskId",
                table: "TaskTags",
                column: "TaskId",
                principalTable: "PojectTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskUserTags_PojectTasks_TaskId",
                table: "TaskUserTags",
                column: "TaskId",
                principalTable: "PojectTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskWatchers_PojectTasks_TaskId",
                table: "TaskWatchers",
                column: "TaskId",
                principalTable: "PojectTasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogs_PojectTasks_TaskId",
                table: "ActivityLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_PojectTasks_TaskId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_PojectTasks_TaskId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_PojectTasks_TaskId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_PojectTasks_AspNetUsers_AssigneeId",
                table: "PojectTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_PojectTasks_AspNetUsers_CreatedById",
                table: "PojectTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_PojectTasks_Columns_ColumnId",
                table: "PojectTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_PojectTasks_Sprints_SprintId",
                table: "PojectTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Subtasks_PojectTasks_TaskId",
                table: "Subtasks");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskTags_PojectTasks_TaskId",
                table: "TaskTags");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskUserTags_PojectTasks_TaskId",
                table: "TaskUserTags");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskWatchers_PojectTasks_TaskId",
                table: "TaskWatchers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PojectTasks",
                table: "PojectTasks");

            migrationBuilder.RenameTable(
                name: "PojectTasks",
                newName: "Tasks");

            migrationBuilder.RenameIndex(
                name: "IX_PojectTasks_SprintId",
                table: "Tasks",
                newName: "IX_Tasks_SprintId");

            migrationBuilder.RenameIndex(
                name: "IX_PojectTasks_CreatedById",
                table: "Tasks",
                newName: "IX_Tasks_CreatedById");

            migrationBuilder.RenameIndex(
                name: "IX_PojectTasks_ColumnId",
                table: "Tasks",
                newName: "IX_Tasks_ColumnId");

            migrationBuilder.RenameIndex(
                name: "IX_PojectTasks_AssigneeId",
                table: "Tasks",
                newName: "IX_Tasks_AssigneeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Tasks",
                table: "Tasks",
                column: "TaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogs_Tasks_TaskId",
                table: "ActivityLogs",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Tasks_TaskId",
                table: "Attachments",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Tasks_TaskId",
                table: "Comments",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Tasks_TaskId",
                table: "Notifications",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Subtasks_Tasks_TaskId",
                table: "Subtasks",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_AspNetUsers_AssigneeId",
                table: "Tasks",
                column: "AssigneeId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_AspNetUsers_CreatedById",
                table: "Tasks",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Columns_ColumnId",
                table: "Tasks",
                column: "ColumnId",
                principalTable: "Columns",
                principalColumn: "ColumnId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Sprints_SprintId",
                table: "Tasks",
                column: "SprintId",
                principalTable: "Sprints",
                principalColumn: "SprintId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskTags_Tasks_TaskId",
                table: "TaskTags",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskUserTags_Tasks_TaskId",
                table: "TaskUserTags",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskWatchers_Tasks_TaskId",
                table: "TaskWatchers",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
