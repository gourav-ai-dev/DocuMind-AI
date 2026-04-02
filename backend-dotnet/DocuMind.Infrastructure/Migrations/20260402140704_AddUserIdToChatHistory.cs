using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocuMind.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToChatHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "ChatHistories",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_ChatHistories_UserId",
                table: "ChatHistories",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatHistories_Users_UserId",
                table: "ChatHistories",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatHistories_Users_UserId",
                table: "ChatHistories");

            migrationBuilder.DropIndex(
                name: "IX_ChatHistories_UserId",
                table: "ChatHistories");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ChatHistories");
        }
    }
}
