using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocuMind.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RecorrectTheRelationInModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatHistories_Documents_DocumentId",
                table: "ChatHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatHistories_Users_UserId",
                table: "ChatHistories");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatHistories_Documents_DocumentId",
                table: "ChatHistories",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatHistories_Users_UserId",
                table: "ChatHistories",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatHistories_Documents_DocumentId",
                table: "ChatHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatHistories_Users_UserId",
                table: "ChatHistories");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatHistories_Documents_DocumentId",
                table: "ChatHistories",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatHistories_Users_UserId",
                table: "ChatHistories",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
