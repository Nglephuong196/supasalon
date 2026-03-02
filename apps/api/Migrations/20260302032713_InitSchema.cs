using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class InitSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "account",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    accountId = table.Column<string>(type: "text", nullable: false),
                    providerId = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    accessToken = table.Column<string>(type: "text", nullable: true),
                    refreshToken = table.Column<string>(type: "text", nullable: true),
                    idToken = table.Column<string>(type: "text", nullable: true),
                    accessTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    refreshTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    scope = table.Column<string>(type: "text", nullable: true),
                    password = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_account", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organization",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: true),
                    logo = table.Column<string>(type: "text", nullable: true),
                    metadata = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organization", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "session",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    expiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    token = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ipAddress = table.Column<string>(type: "text", nullable: true),
                    userAgent = table.Column<string>(type: "text", nullable: true),
                    userId = table.Column<string>(type: "text", nullable: false),
                    activeOrganizationId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_session", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    image = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    emailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "verification",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    identifier = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<string>(type: "text", nullable: false),
                    expiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_verification", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "approval_policies",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    require_invoice_cancel_approval = table.Column<bool>(type: "boolean", nullable: false),
                    require_invoice_refund_approval = table.Column<bool>(type: "boolean", nullable: false),
                    invoice_refund_threshold = table.Column<double>(type: "double precision", nullable: false),
                    require_cash_out_approval = table.Column<bool>(type: "boolean", nullable: false),
                    cash_out_threshold = table.Column<double>(type: "double precision", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approval_policies", x => x.id);
                    table.ForeignKey(
                        name: "FK_approval_policies_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "booking_policies",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    prevent_staff_overlap = table.Column<bool>(type: "boolean", nullable: false),
                    buffer_minutes = table.Column<int>(type: "integer", nullable: false),
                    require_deposit = table.Column<bool>(type: "boolean", nullable: false),
                    default_deposit_amount = table.Column<double>(type: "double precision", nullable: false),
                    cancellation_window_hours = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_policies", x => x.id);
                    table.ForeignKey(
                        name: "FK_booking_policies_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "membership_tiers",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    min_spending = table.Column<double>(type: "double precision", nullable: false),
                    discount_percent = table.Column<double>(type: "double precision", nullable: false),
                    min_spending_to_maintain = table.Column<double>(type: "double precision", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_membership_tiers", x => x.id);
                    table.ForeignKey(
                        name: "FK_membership_tiers_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "prepaid_plans",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    unit = table.Column<string>(type: "text", nullable: false),
                    sale_price = table.Column<double>(type: "double precision", nullable: false),
                    initial_balance = table.Column<double>(type: "double precision", nullable: false),
                    expiry_days = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_prepaid_plans", x => x.id);
                    table.ForeignKey(
                        name: "FK_prepaid_plans_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_categories", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_categories_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "service_categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_categories", x => x.id);
                    table.ForeignKey(
                        name: "FK_service_categories_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "activity_logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    actor_user_id = table.Column<string>(type: "text", nullable: true),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    entity_id = table.Column<int>(type: "integer", nullable: true),
                    action = table.Column<string>(type: "text", nullable: false),
                    reason = table.Column<string>(type: "text", nullable: true),
                    metadata = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_activity_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_activity_logs_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_activity_logs_user_actor_user_id",
                        column: x => x.actor_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "approval_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    entity_id = table.Column<int>(type: "integer", nullable: true),
                    action = table.Column<string>(type: "text", nullable: false),
                    payload = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    request_reason = table.Column<string>(type: "text", nullable: true),
                    review_reason = table.Column<string>(type: "text", nullable: true),
                    requested_by_user_id = table.Column<string>(type: "text", nullable: true),
                    reviewed_by_user_id = table.Column<string>(type: "text", nullable: true),
                    reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    executed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    execution_result = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approval_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_approval_requests_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_approval_requests_user_requested_by_user_id",
                        column: x => x.requested_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_approval_requests_user_reviewed_by_user_id",
                        column: x => x.reviewed_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_user_UserId",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_user_UserId",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_user_UserId",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_user_UserId",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "booking_reminder_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    enabled = table.Column<bool>(type: "boolean", nullable: false),
                    channels = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    hours_before = table.Column<int>(type: "integer", nullable: false),
                    template = table.Column<string>(type: "text", nullable: false),
                    updated_by_user_id = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_reminder_settings", x => x.id);
                    table.ForeignKey(
                        name: "FK_booking_reminder_settings_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_booking_reminder_settings_user_updated_by_user_id",
                        column: x => x.updated_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "cash_sessions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    opened_by_user_id = table.Column<string>(type: "text", nullable: true),
                    closed_by_user_id = table.Column<string>(type: "text", nullable: true),
                    opening_balance = table.Column<double>(type: "double precision", nullable: false),
                    expected_closing_balance = table.Column<double>(type: "double precision", nullable: false),
                    actual_closing_balance = table.Column<double>(type: "double precision", nullable: true),
                    discrepancy = table.Column<double>(type: "double precision", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    opened_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    closed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cash_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_cash_sessions_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cash_sessions_user_closed_by_user_id",
                        column: x => x.closed_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_cash_sessions_user_opened_by_user_id",
                        column: x => x.opened_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "invitation",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    organizationId = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    expiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    inviterId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invitation", x => x.id);
                    table.ForeignKey(
                        name: "FK_invitation_organization_organizationId",
                        column: x => x.organizationId,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_invitation_user_inviterId",
                        column: x => x.inviterId,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "member",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    organizationId = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member", x => x.id);
                    table.ForeignKey(
                        name: "FK_member_organization_organizationId",
                        column: x => x.organizationId,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_member_user_userId",
                        column: x => x.userId,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "customers",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: false),
                    gender = table.Column<string>(type: "text", nullable: true),
                    location = table.Column<string>(type: "text", nullable: true),
                    birthday = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    total_spent = table.Column<double>(type: "double precision", nullable: false),
                    membership_tier_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customers", x => x.id);
                    table.ForeignKey(
                        name: "FK_customers_membership_tiers_membership_tier_id",
                        column: x => x.membership_tier_id,
                        principalTable: "membership_tiers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_customers_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    category_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    price = table.Column<double>(type: "double precision", nullable: false),
                    stock = table.Column<int>(type: "integer", nullable: false),
                    min_stock = table.Column<int>(type: "integer", nullable: false),
                    sku = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.id);
                    table.ForeignKey(
                        name: "FK_products_product_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "product_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "services",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    category_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    price = table.Column<double>(type: "double precision", nullable: false),
                    duration = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_services", x => x.id);
                    table.ForeignKey(
                        name: "FK_services_service_categories_category_id",
                        column: x => x.category_id,
                        principalTable: "service_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cash_transactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    cash_session_id = table.Column<int>(type: "integer", nullable: true),
                    type = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    amount = table.Column<double>(type: "double precision", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_by_user_id = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cash_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_cash_transactions_cash_sessions_cash_session_id",
                        column: x => x.cash_session_id,
                        principalTable: "cash_sessions",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_cash_transactions_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cash_transactions_user_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "branches",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    manager_member_id = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branches", x => x.id);
                    table.ForeignKey(
                        name: "FK_branches_member_manager_member_id",
                        column: x => x.manager_member_id,
                        principalTable: "member",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_branches_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "member_permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    member_id = table.Column<string>(type: "text", nullable: false),
                    permissions = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_permissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_member_permissions_member_member_id",
                        column: x => x.member_id,
                        principalTable: "member",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "staff_commission_payouts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    staff_id = table.Column<string>(type: "text", nullable: false),
                    from_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    to_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    total_amount = table.Column<double>(type: "double precision", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_commission_payouts", x => x.id);
                    table.ForeignKey(
                        name: "FK_staff_commission_payouts_member_staff_id",
                        column: x => x.staff_id,
                        principalTable: "member",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_staff_commission_payouts_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "staff_commission_rules",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    staff_id = table.Column<string>(type: "text", nullable: false),
                    item_type = table.Column<string>(type: "text", nullable: false),
                    item_id = table.Column<int>(type: "integer", nullable: false),
                    commission_type = table.Column<string>(type: "text", nullable: false),
                    commission_value = table.Column<double>(type: "double precision", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_commission_rules", x => x.id);
                    table.ForeignKey(
                        name: "FK_staff_commission_rules_member_staff_id",
                        column: x => x.staff_id,
                        principalTable: "member",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_staff_commission_rules_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "customer_memberships",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    customer_id = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_memberships", x => x.id);
                    table.ForeignKey(
                        name: "FK_customer_memberships_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "customer_prepaid_cards",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    customer_id = table.Column<int>(type: "integer", nullable: false),
                    plan_id = table.Column<int>(type: "integer", nullable: true),
                    card_code = table.Column<string>(type: "text", nullable: false),
                    unit = table.Column<string>(type: "text", nullable: false),
                    purchase_price = table.Column<double>(type: "double precision", nullable: false),
                    initial_balance = table.Column<double>(type: "double precision", nullable: false),
                    remaining_balance = table.Column<double>(type: "double precision", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    purchased_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expired_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_user_id = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_prepaid_cards", x => x.id);
                    table.ForeignKey(
                        name: "FK_customer_prepaid_cards_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_customer_prepaid_cards_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_customer_prepaid_cards_prepaid_plans_plan_id",
                        column: x => x.plan_id,
                        principalTable: "prepaid_plans",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_customer_prepaid_cards_user_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "bookings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    customer_id = table.Column<int>(type: "integer", nullable: false),
                    branch_id = table.Column<int>(type: "integer", nullable: true),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    deposit_amount = table.Column<double>(type: "double precision", nullable: false),
                    deposit_paid = table.Column<double>(type: "double precision", nullable: false),
                    no_show_reason = table.Column<string>(type: "text", nullable: true),
                    no_show_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    guest_count = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    guests = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bookings", x => x.id);
                    table.ForeignKey(
                        name: "FK_bookings_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_bookings_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_bookings_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "member_branches",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    branch_id = table.Column<int>(type: "integer", nullable: false),
                    member_id = table.Column<string>(type: "text", nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_member_branches", x => x.id);
                    table.ForeignKey(
                        name: "FK_member_branches_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_member_branches_member_member_id",
                        column: x => x.member_id,
                        principalTable: "member",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_member_branches_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payroll_configs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    branch_id = table.Column<int>(type: "integer", nullable: true),
                    staff_id = table.Column<string>(type: "text", nullable: false),
                    salary_type = table.Column<string>(type: "text", nullable: false),
                    base_salary = table.Column<double>(type: "double precision", nullable: false),
                    default_allowance = table.Column<double>(type: "double precision", nullable: false),
                    default_deduction = table.Column<double>(type: "double precision", nullable: false),
                    default_advance = table.Column<double>(type: "double precision", nullable: false),
                    payment_method = table.Column<string>(type: "text", nullable: false),
                    effective_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payroll_configs", x => x.id);
                    table.ForeignKey(
                        name: "FK_payroll_configs_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_payroll_configs_member_staff_id",
                        column: x => x.staff_id,
                        principalTable: "member",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_payroll_configs_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payroll_cycles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    branch_id = table.Column<int>(type: "integer", nullable: true),
                    name = table.Column<string>(type: "text", nullable: false),
                    from_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    to_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_by_user_id = table.Column<string>(type: "text", nullable: true),
                    finalized_by_user_id = table.Column<string>(type: "text", nullable: true),
                    paid_by_user_id = table.Column<string>(type: "text", nullable: true),
                    finalized_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payroll_cycles", x => x.id);
                    table.ForeignKey(
                        name: "FK_payroll_cycles_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_payroll_cycles_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_payroll_cycles_user_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_payroll_cycles_user_finalized_by_user_id",
                        column: x => x.finalized_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_payroll_cycles_user_paid_by_user_id",
                        column: x => x.paid_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "booking_reminder_logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    booking_id = table.Column<int>(type: "integer", nullable: false),
                    channel = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    scheduled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    message = table.Column<string>(type: "text", nullable: true),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    payload = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    created_by_user_id = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_reminder_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_booking_reminder_logs_bookings_booking_id",
                        column: x => x.booking_id,
                        principalTable: "bookings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_booking_reminder_logs_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_booking_reminder_logs_user_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "invoices",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    customer_id = table.Column<int>(type: "integer", nullable: true),
                    booking_id = table.Column<int>(type: "integer", nullable: true),
                    branch_id = table.Column<int>(type: "integer", nullable: true),
                    subtotal = table.Column<double>(type: "double precision", nullable: false),
                    discount_value = table.Column<double>(type: "double precision", nullable: true),
                    discount_type = table.Column<string>(type: "text", nullable: true),
                    total = table.Column<double>(type: "double precision", nullable: false),
                    amount_paid = table.Column<double>(type: "double precision", nullable: true),
                    change = table.Column<double>(type: "double precision", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    payment_method = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cancel_reason = table.Column<string>(type: "text", nullable: true),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    refund_reason = table.Column<string>(type: "text", nullable: true),
                    refunded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_open_in_tab = table.Column<bool>(type: "boolean", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoices", x => x.id);
                    table.ForeignKey(
                        name: "FK_invoices_bookings_booking_id",
                        column: x => x.booking_id,
                        principalTable: "bookings",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_invoices_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_invoices_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_invoices_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payroll_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    cycle_id = table.Column<int>(type: "integer", nullable: false),
                    staff_id = table.Column<string>(type: "text", nullable: false),
                    branch_id = table.Column<int>(type: "integer", nullable: true),
                    base_salary = table.Column<double>(type: "double precision", nullable: false),
                    commission_amount = table.Column<double>(type: "double precision", nullable: false),
                    bonus_amount = table.Column<double>(type: "double precision", nullable: false),
                    allowance_amount = table.Column<double>(type: "double precision", nullable: false),
                    deduction_amount = table.Column<double>(type: "double precision", nullable: false),
                    advance_amount = table.Column<double>(type: "double precision", nullable: false),
                    net_amount = table.Column<double>(type: "double precision", nullable: false),
                    payment_method = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    metadata = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payroll_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_payroll_items_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_payroll_items_member_staff_id",
                        column: x => x.staff_id,
                        principalTable: "member",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_payroll_items_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_payroll_items_payroll_cycles_cycle_id",
                        column: x => x.cycle_id,
                        principalTable: "payroll_cycles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "customer_prepaid_transactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    card_id = table.Column<int>(type: "integer", nullable: false),
                    customer_id = table.Column<int>(type: "integer", nullable: false),
                    invoice_id = table.Column<int>(type: "integer", nullable: true),
                    type = table.Column<string>(type: "text", nullable: false),
                    amount = table.Column<double>(type: "double precision", nullable: false),
                    balance_after = table.Column<double>(type: "double precision", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    metadata = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    created_by_user_id = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_prepaid_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_customer_prepaid_transactions_customer_prepaid_cards_card_id",
                        column: x => x.card_id,
                        principalTable: "customer_prepaid_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_customer_prepaid_transactions_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_customer_prepaid_transactions_invoices_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_customer_prepaid_transactions_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_customer_prepaid_transactions_user_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "invoice_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    invoice_id = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    reference_id = table.Column<int>(type: "integer", nullable: true),
                    name = table.Column<string>(type: "text", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<double>(type: "double precision", nullable: false),
                    discount_value = table.Column<double>(type: "double precision", nullable: true),
                    discount_type = table.Column<string>(type: "text", nullable: true),
                    total = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_invoice_items_invoices_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoice_payment_transactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_id = table.Column<string>(type: "text", nullable: false),
                    invoice_id = table.Column<int>(type: "integer", nullable: false),
                    cash_session_id = table.Column<int>(type: "integer", nullable: true),
                    kind = table.Column<string>(type: "text", nullable: false),
                    method = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    amount = table.Column<double>(type: "double precision", nullable: false),
                    reference_code = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_by_user_id = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    confirmed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice_payment_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_invoice_payment_transactions_cash_sessions_cash_session_id",
                        column: x => x.cash_session_id,
                        principalTable: "cash_sessions",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_invoice_payment_transactions_invoices_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_invoice_payment_transactions_organization_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organization",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_invoice_payment_transactions_user_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "invoice_item_staff",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    invoice_item_id = table.Column<int>(type: "integer", nullable: false),
                    staff_id = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    commission_value = table.Column<double>(type: "double precision", nullable: true),
                    commission_type = table.Column<string>(type: "text", nullable: true),
                    bonus = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice_item_staff", x => x.id);
                    table.ForeignKey(
                        name: "FK_invoice_item_staff_invoice_items_invoice_item_id",
                        column: x => x.invoice_item_id,
                        principalTable: "invoice_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_invoice_item_staff_member_staff_id",
                        column: x => x.staff_id,
                        principalTable: "member",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_activity_logs_actor_user_id",
                table: "activity_logs",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_activity_logs_organization_id",
                table: "activity_logs",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "approval_policies_org_unique",
                table: "approval_policies",
                column: "organization_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_approval_requests_organization_id",
                table: "approval_requests",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_approval_requests_requested_by_user_id",
                table: "approval_requests",
                column: "requested_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_approval_requests_reviewed_by_user_id",
                table: "approval_requests",
                column: "reviewed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "booking_policies_org_unique",
                table: "booking_policies",
                column: "organization_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_booking_reminder_logs_booking_id",
                table: "booking_reminder_logs",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_booking_reminder_logs_created_by_user_id",
                table: "booking_reminder_logs",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_booking_reminder_logs_organization_id",
                table: "booking_reminder_logs",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "booking_reminder_settings_org_unique",
                table: "booking_reminder_settings",
                column: "organization_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_booking_reminder_settings_updated_by_user_id",
                table: "booking_reminder_settings",
                column: "updated_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_branch_id",
                table: "bookings",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_customer_id",
                table: "bookings",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_organization_id",
                table: "bookings",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "branches_org_code_unique",
                table: "branches",
                columns: new[] { "organization_id", "code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "branches_org_name_unique",
                table: "branches",
                columns: new[] { "organization_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_branches_manager_member_id",
                table: "branches",
                column: "manager_member_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_sessions_closed_by_user_id",
                table: "cash_sessions",
                column: "closed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_sessions_opened_by_user_id",
                table: "cash_sessions",
                column: "opened_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_sessions_organization_id",
                table: "cash_sessions",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_transactions_cash_session_id",
                table: "cash_transactions",
                column: "cash_session_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_transactions_created_by_user_id",
                table: "cash_transactions",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_cash_transactions_organization_id",
                table: "cash_transactions",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_memberships_customer_id",
                table: "customer_memberships",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "customer_prepaid_cards_org_code_unique",
                table: "customer_prepaid_cards",
                columns: new[] { "organization_id", "card_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_customer_prepaid_cards_created_by_user_id",
                table: "customer_prepaid_cards",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prepaid_cards_customer_id",
                table: "customer_prepaid_cards",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prepaid_cards_plan_id",
                table: "customer_prepaid_cards",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prepaid_transactions_card_id",
                table: "customer_prepaid_transactions",
                column: "card_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prepaid_transactions_created_by_user_id",
                table: "customer_prepaid_transactions",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prepaid_transactions_customer_id",
                table: "customer_prepaid_transactions",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prepaid_transactions_invoice_id",
                table: "customer_prepaid_transactions",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_prepaid_transactions_organization_id",
                table: "customer_prepaid_transactions",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_customers_membership_tier_id",
                table: "customers",
                column: "membership_tier_id");

            migrationBuilder.CreateIndex(
                name: "IX_customers_organization_id",
                table: "customers",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_invitation_inviterId",
                table: "invitation",
                column: "inviterId");

            migrationBuilder.CreateIndex(
                name: "IX_invitation_organizationId",
                table: "invitation",
                column: "organizationId");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_item_staff_invoice_item_id",
                table: "invoice_item_staff",
                column: "invoice_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_item_staff_staff_id",
                table: "invoice_item_staff",
                column: "staff_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_items_invoice_id",
                table: "invoice_items",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_payment_transactions_cash_session_id",
                table: "invoice_payment_transactions",
                column: "cash_session_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_payment_transactions_created_by_user_id",
                table: "invoice_payment_transactions",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_payment_transactions_invoice_id",
                table: "invoice_payment_transactions",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_payment_transactions_organization_id",
                table: "invoice_payment_transactions",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_booking_id",
                table: "invoices",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_branch_id",
                table: "invoices",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_customer_id",
                table: "invoices",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_organization_id",
                table: "invoices",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_member_organizationId",
                table: "member",
                column: "organizationId");

            migrationBuilder.CreateIndex(
                name: "IX_member_userId",
                table: "member",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_member_branches_branch_id",
                table: "member_branches",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_member_branches_member_id",
                table: "member_branches",
                column: "member_id");

            migrationBuilder.CreateIndex(
                name: "member_branches_org_branch_member_unique",
                table: "member_branches",
                columns: new[] { "organization_id", "branch_id", "member_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_member_permissions_member_id",
                table: "member_permissions",
                column: "member_id");

            migrationBuilder.CreateIndex(
                name: "IX_membership_tiers_organization_id",
                table: "membership_tiers",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_organization_slug",
                table: "organization",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payroll_configs_branch_id",
                table: "payroll_configs",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_configs_organization_id",
                table: "payroll_configs",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_configs_staff_id",
                table: "payroll_configs",
                column: "staff_id");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_cycles_branch_id",
                table: "payroll_cycles",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_cycles_created_by_user_id",
                table: "payroll_cycles",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_cycles_finalized_by_user_id",
                table: "payroll_cycles",
                column: "finalized_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_cycles_paid_by_user_id",
                table: "payroll_cycles",
                column: "paid_by_user_id");

            migrationBuilder.CreateIndex(
                name: "payroll_cycles_org_branch_period_unique",
                table: "payroll_cycles",
                columns: new[] { "organization_id", "branch_id", "from_date", "to_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payroll_items_branch_id",
                table: "payroll_items",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_items_organization_id",
                table: "payroll_items",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_payroll_items_staff_id",
                table: "payroll_items",
                column: "staff_id");

            migrationBuilder.CreateIndex(
                name: "payroll_items_cycle_staff_unique",
                table: "payroll_items",
                columns: new[] { "cycle_id", "staff_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "prepaid_plans_org_name_unique",
                table: "prepaid_plans",
                columns: new[] { "organization_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_product_categories_organization_id",
                table: "product_categories",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_products_category_id",
                table: "products",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_service_categories_organization_id",
                table: "service_categories",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_services_category_id",
                table: "services",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_session_token",
                table: "session",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_staff_commission_payouts_organization_id",
                table: "staff_commission_payouts",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_staff_commission_payouts_staff_id",
                table: "staff_commission_payouts",
                column: "staff_id");

            migrationBuilder.CreateIndex(
                name: "IX_staff_commission_rules_staff_id",
                table: "staff_commission_rules",
                column: "staff_id");

            migrationBuilder.CreateIndex(
                name: "staff_commission_rules_staff_item_unique",
                table: "staff_commission_rules",
                columns: new[] { "organization_id", "staff_id", "item_type", "item_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "user",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_user_email",
                table: "user",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "user",
                column: "NormalizedUserName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "account");

            migrationBuilder.DropTable(
                name: "activity_logs");

            migrationBuilder.DropTable(
                name: "approval_policies");

            migrationBuilder.DropTable(
                name: "approval_requests");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "booking_policies");

            migrationBuilder.DropTable(
                name: "booking_reminder_logs");

            migrationBuilder.DropTable(
                name: "booking_reminder_settings");

            migrationBuilder.DropTable(
                name: "cash_transactions");

            migrationBuilder.DropTable(
                name: "customer_memberships");

            migrationBuilder.DropTable(
                name: "customer_prepaid_transactions");

            migrationBuilder.DropTable(
                name: "invitation");

            migrationBuilder.DropTable(
                name: "invoice_item_staff");

            migrationBuilder.DropTable(
                name: "invoice_payment_transactions");

            migrationBuilder.DropTable(
                name: "member_branches");

            migrationBuilder.DropTable(
                name: "member_permissions");

            migrationBuilder.DropTable(
                name: "payroll_configs");

            migrationBuilder.DropTable(
                name: "payroll_items");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "services");

            migrationBuilder.DropTable(
                name: "session");

            migrationBuilder.DropTable(
                name: "staff_commission_payouts");

            migrationBuilder.DropTable(
                name: "staff_commission_rules");

            migrationBuilder.DropTable(
                name: "verification");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "customer_prepaid_cards");

            migrationBuilder.DropTable(
                name: "invoice_items");

            migrationBuilder.DropTable(
                name: "cash_sessions");

            migrationBuilder.DropTable(
                name: "payroll_cycles");

            migrationBuilder.DropTable(
                name: "product_categories");

            migrationBuilder.DropTable(
                name: "service_categories");

            migrationBuilder.DropTable(
                name: "prepaid_plans");

            migrationBuilder.DropTable(
                name: "invoices");

            migrationBuilder.DropTable(
                name: "bookings");

            migrationBuilder.DropTable(
                name: "branches");

            migrationBuilder.DropTable(
                name: "customers");

            migrationBuilder.DropTable(
                name: "member");

            migrationBuilder.DropTable(
                name: "membership_tiers");

            migrationBuilder.DropTable(
                name: "user");

            migrationBuilder.DropTable(
                name: "organization");
        }
    }
}
