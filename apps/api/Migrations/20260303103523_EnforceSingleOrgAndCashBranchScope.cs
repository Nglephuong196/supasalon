using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class EnforceSingleOrgAndCashBranchScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_member_userId",
                table: "member");

            migrationBuilder.DropIndex(
                name: "IX_cash_transactions_organization_id",
                table: "cash_transactions");

            migrationBuilder.DropIndex(
                name: "IX_cash_sessions_organization_id",
                table: "cash_sessions");

            migrationBuilder.AddColumn<int>(
                name: "branch_id",
                table: "cash_transactions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "branch_id",
                table: "cash_sessions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "member_user_id_unique",
                table: "member",
                column: "userId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cash_transactions_branch_id",
                table: "cash_transactions",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_transactions_organization_id_branch_id_created_at",
                table: "cash_transactions",
                columns: new[] { "organization_id", "branch_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_cash_sessions_branch_id",
                table: "cash_sessions",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_sessions_organization_id_branch_id_status",
                table: "cash_sessions",
                columns: new[] { "organization_id", "branch_id", "status" });

            migrationBuilder.AddForeignKey(
                name: "FK_cash_sessions_branches_branch_id",
                table: "cash_sessions",
                column: "branch_id",
                principalTable: "branches",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_cash_transactions_branches_branch_id",
                table: "cash_transactions",
                column: "branch_id",
                principalTable: "branches",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cash_sessions_branches_branch_id",
                table: "cash_sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_cash_transactions_branches_branch_id",
                table: "cash_transactions");

            migrationBuilder.DropIndex(
                name: "member_user_id_unique",
                table: "member");

            migrationBuilder.DropIndex(
                name: "IX_cash_transactions_branch_id",
                table: "cash_transactions");

            migrationBuilder.DropIndex(
                name: "IX_cash_transactions_organization_id_branch_id_created_at",
                table: "cash_transactions");

            migrationBuilder.DropIndex(
                name: "IX_cash_sessions_branch_id",
                table: "cash_sessions");

            migrationBuilder.DropIndex(
                name: "IX_cash_sessions_organization_id_branch_id_status",
                table: "cash_sessions");

            migrationBuilder.DropColumn(
                name: "branch_id",
                table: "cash_transactions");

            migrationBuilder.DropColumn(
                name: "branch_id",
                table: "cash_sessions");

            migrationBuilder.CreateIndex(
                name: "IX_member_userId",
                table: "member",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_cash_transactions_organization_id",
                table: "cash_transactions",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_sessions_organization_id",
                table: "cash_sessions",
                column: "organization_id");
        }
    }
}
