using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyAuthModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "account");

            migrationBuilder.DropTable(
                name: "session");

            migrationBuilder.DropTable(
                name: "verification");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "account",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    accessToken = table.Column<string>(type: "text", nullable: true),
                    accessTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    accountId = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    idToken = table.Column<string>(type: "text", nullable: true),
                    password = table.Column<string>(type: "text", nullable: true),
                    providerId = table.Column<string>(type: "text", nullable: false),
                    refreshToken = table.Column<string>(type: "text", nullable: true),
                    refreshTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    scope = table.Column<string>(type: "text", nullable: true),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_account", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "session",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    activeOrganizationId = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ipAddress = table.Column<string>(type: "text", nullable: true),
                    token = table.Column<string>(type: "text", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    userAgent = table.Column<string>(type: "text", nullable: true),
                    userId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_session", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "verification",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    identifier = table.Column<string>(type: "text", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    value = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_verification", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_session_token",
                table: "session",
                column: "token",
                unique: true);
        }
    }
}
