using Api.Application.Common.Interfaces.Repositories;
using Api.Application.Common.Models;
using Api.Application.Features.Invoices;
using Api.Domain.Entities;

namespace api.Tests;

public class InvoicePaymentServiceTests
{
    [Fact]
    public async Task RecordPaymentAsync_SetsInvoiceToPaid_WhenNetPaidReachesTotal()
    {
        var invoice = new Invoice
        {
            Id = 11,
            OrganizationId = "org-1",
            Total = 500,
            Status = "pending"
        };

        var repo = new FakeInvoiceRepository
        {
            Invoice = invoice,
            ConfirmedPayments = new List<InvoicePaymentTransaction>
            {
                new() { Kind = "payment", Method = "cash", Amount = 500, Status = "confirmed" }
            }
        };
        var service = new InvoicePaymentService(repo);

        var result = await service.RecordPaymentAsync(11, new RecordInvoicePaymentRequest(
            OrganizationId: "org-1",
            Method: "cash",
            Amount: 500));

        Assert.Equal("paid", result.Status);
        Assert.Equal(500, result.AmountPaid);
        Assert.Equal("cash", result.PaymentMethod);
        Assert.NotNull(repo.LastPayment);
    }

    [Fact]
    public async Task RecordPaymentAsync_Throws_ForInvalidMethod()
    {
        var repo = new FakeInvoiceRepository
        {
            Invoice = new Invoice { Id = 11, OrganizationId = "org-1", Total = 500, Status = "pending" }
        };
        var service = new InvoicePaymentService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RecordPaymentAsync(11, new RecordInvoicePaymentRequest(
                OrganizationId: "org-1",
                Method: "crypto",
                Amount: 100)));
    }

    [Fact]
    public async Task RecordPaymentAsync_SetsRefunded_WhenOnlyRefundsRemain()
    {
        var repo = new FakeInvoiceRepository
        {
            Invoice = new Invoice { Id = 11, OrganizationId = "org-1", Total = 500, Status = "paid", AmountPaid = 500 },
            ConfirmedPayments = new List<InvoicePaymentTransaction>
            {
                new() { Kind = "refund", Method = "cash", Amount = 500, Status = "confirmed" }
            }
        };
        var service = new InvoicePaymentService(repo);

        var result = await service.RecordPaymentAsync(11, new RecordInvoicePaymentRequest(
            OrganizationId: "org-1",
            Method: "cash",
            Amount: 500,
            Kind: "refund"));

        Assert.Equal("refunded", result.Status);
        Assert.Equal(0, result.AmountPaid);
    }

    private sealed class FakeInvoiceRepository : IInvoiceRepository
    {
        public Invoice? Invoice { get; init; }
        public List<InvoicePaymentTransaction> ConfirmedPayments { get; init; } = new();
        public InvoicePaymentTransaction? LastPayment { get; private set; }

        public Task<Invoice> AddAsync(Invoice invoice, CancellationToken ct = default) => Task.FromResult(invoice);

        public Task<InvoicePaymentTransaction> AddPaymentAsync(InvoicePaymentTransaction payment, CancellationToken ct = default)
        {
            LastPayment = payment;
            return Task.FromResult(payment);
        }

        public Task<Branch?> FindBranchAsync(string organizationId, int branchId, CancellationToken ct = default)
            => Task.FromResult<Branch?>(null);

        public Task<Booking?> FindBookingAsync(string organizationId, int bookingId, CancellationToken ct = default)
            => Task.FromResult<Booking?>(null);

        public Task<Branch?> FindDefaultBranchAsync(string organizationId, CancellationToken ct = default)
            => Task.FromResult<Branch?>(null);

        public Task<Invoice?> FindByIdAsync(string organizationId, int invoiceId, CancellationToken ct = default)
            => Task.FromResult(Invoice);

        public Task<int?> FindOpenCashSessionIdAsync(string organizationId, CancellationToken ct = default)
            => Task.FromResult<int?>(5);

        public Task<List<InvoicePaymentTransaction>> GetConfirmedPaymentsAsync(string organizationId, int invoiceId, CancellationToken ct = default)
            => Task.FromResult(ConfirmedPayments);

        public Task<PaginatedResult<Invoice>> GetPagedAsync(string organizationId, InvoiceListQuery query, CancellationToken ct = default)
            => Task.FromResult(new PaginatedResult<Invoice>(new List<Invoice>(), 0, 1, 20, 1));

        public Task<Invoice> UpdateAsync(Invoice invoice, CancellationToken ct = default)
            => Task.FromResult(invoice);
    }
}
