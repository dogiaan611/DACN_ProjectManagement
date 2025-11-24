using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class addUserIdRegistratioCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "RegistrationCodes",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RegistrationCodes_UserId",
                table: "RegistrationCodes",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_RegistrationCodes_AspNetUsers_UserId",
                table: "RegistrationCodes",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RegistrationCodes_AspNetUsers_UserId",
                table: "RegistrationCodes");

            migrationBuilder.DropIndex(
                name: "IX_RegistrationCodes_UserId",
                table: "RegistrationCodes");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "RegistrationCodes");
        }
    }
}
