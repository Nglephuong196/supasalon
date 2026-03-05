using Api.Models;
using Api.Middleware;
using Api.Utils;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor httpContextAccessor) : IdentityDbContext<User>(options)
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<MemberBranch> MemberBranches => Set<MemberBranch>();
    public DbSet<MembershipTier> MembershipTiers => Set<MembershipTier>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingPolicy> BookingPolicies => Set<BookingPolicy>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<CashSession> CashSessions => Set<CashSession>();
    public DbSet<CashTransaction> CashTransactions => Set<CashTransaction>();
    public DbSet<InvoicePaymentTransaction> InvoicePaymentTransactions => Set<InvoicePaymentTransaction>();
    public DbSet<PrepaidPlan> PrepaidPlans => Set<PrepaidPlan>();
    public DbSet<CustomerPrepaidCard> CustomerPrepaidCards => Set<CustomerPrepaidCard>();
    public DbSet<CustomerPrepaidTransaction> CustomerPrepaidTransactions => Set<CustomerPrepaidTransaction>();
    public DbSet<BookingReminderSetting> BookingReminderSettings => Set<BookingReminderSetting>();
    public DbSet<BookingReminderLog> BookingReminderLogs => Set<BookingReminderLog>();
    public DbSet<ApprovalPolicy> ApprovalPolicies => Set<ApprovalPolicy>();
    public DbSet<ApprovalRequest> ApprovalRequests => Set<ApprovalRequest>();
    public DbSet<PayrollConfig> PayrollConfigs => Set<PayrollConfig>();
    public DbSet<PayrollCycle> PayrollCycles => Set<PayrollCycle>();
    public DbSet<PayrollItem> PayrollItems => Set<PayrollItem>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<InvoiceItemStaff> InvoiceItemStaff => Set<InvoiceItemStaff>();
    public DbSet<StaffCommissionRule> StaffCommissionRules => Set<StaffCommissionRule>();
    public DbSet<StaffCommissionPayout> StaffCommissionPayouts => Set<StaffCommissionPayout>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<CustomerMembership> CustomerMemberships => Set<CustomerMembership>();
    public DbSet<MemberPermission> MemberPermissions => Set<MemberPermission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        ApplyUtcDateTimeConverters(modelBuilder);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyOrganizationScope();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyOrganizationScope();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyOrganizationScope()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return;
        }

        var organizationId = httpContext.Items[OrganizationContextMiddleware.OrganizationItemKey] as string;

        if (string.IsNullOrWhiteSpace(organizationId))
        {
            return;
        }

        foreach (var entry in ChangeTracker.Entries()
                     .Where(x => x.State is EntityState.Added or EntityState.Modified))
        {
            var property = entry.Metadata.FindProperty("OrganizationId");
            if (property is null || property.ClrType != typeof(string))
            {
                continue;
            }

            var current = entry.Property("OrganizationId").CurrentValue as string;
            if (string.IsNullOrWhiteSpace(current))
            {
                entry.Property("OrganizationId").CurrentValue = organizationId;
                continue;
            }

            if (!string.Equals(current, organizationId, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("organizationId mismatch between request context and entity.");
            }
        }
    }

    private static void ApplyUtcDateTimeConverters(ModelBuilder modelBuilder)
    {
        var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
            value => UtcDateTime.EnsureUtc(value),
            value => DateTime.SpecifyKind(value, DateTimeKind.Utc));

        var nullableDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
            value => value.HasValue ? UtcDateTime.EnsureUtc(value.Value) : value,
            value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : value);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(dateTimeConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(nullableDateTimeConverter);
                }
            }
        }
    }
}
