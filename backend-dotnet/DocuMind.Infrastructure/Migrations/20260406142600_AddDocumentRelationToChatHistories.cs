using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocuMind.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentRelationToChatHistories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ChatHistories_DocumentId",
                table: "ChatHistories",
                column: "DocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatHistories_Documents_DocumentId",
                table: "ChatHistories",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatHistories_Documents_DocumentId",
                table: "ChatHistories");

            migrationBuilder.DropIndex(
                name: "IX_ChatHistories_DocumentId",
                table: "ChatHistories");
        }
    }
}
