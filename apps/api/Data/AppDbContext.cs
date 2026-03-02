using Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<User>(options)
{
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
    }
}
