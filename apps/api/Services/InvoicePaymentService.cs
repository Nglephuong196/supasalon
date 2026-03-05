using Api.Interfaces;
using Api.Dtos;
using Api.Models;

namespace Api.Services;

public class InvoicePaymentService(IInvoiceRepository repository) : IInvoicePaymentService
{
    public async Task<InvoiceDto> RecordPaymentAsync(string organizationId, int invoiceId, RecordInvoicePaymentRequest request, CancellationToken ct = default)
    {
        var invoice = await repository.FindByIdAsync(organizationId, invoiceId, ct);
        if (invoice is null)
        {
            throw new InvalidOperationException("Invoice not found");
        }

        if (invoice.Status == "cancelled")
        {
            throw new InvalidOperationException("Khong the thanh toan hoa don da huy");
        }

        var amount = ToAmount(request.Amount);
        var kind = string.IsNullOrWhiteSpace(request.Kind) ? "payment" : request.Kind.ToLowerInvariant();
        var status = string.IsNullOrWhiteSpace(request.Status) ? "confirmed" : request.Status.ToLowerInvariant();
        var method = request.Method.ToLowerInvariant();

        if (method is not ("cash" or "card" or "transfer"))
        {
            throw new InvalidOperationException("Phuong thuc thanh toan khong hop le");
        }
        if (kind is not ("payment" or "refund"))
        {
            throw new InvalidOperationException("Loai giao dich khong hop le");
        }
        if (status is not ("pending" or "confirmed" or "failed" or "cancelled"))
        {
            throw new InvalidOperationException("Trang thai giao dich khong hop le");
        }

        var openCashSessionId = method == "cash"
            ? await repository.FindOpenCashSessionIdAsync(organizationId, ct)
            : null;

        var payment = new InvoicePaymentTransaction
        {
            OrganizationId = organizationId,
            InvoiceId = invoiceId,
            CashSessionId = openCashSessionId,
            Kind = kind,
            Method = method,
            Status = status,
            Amount = amount,
            ReferenceCode = request.ReferenceCode,
            Notes = request.Notes,
            CreatedByUserId = request.CreatedByUserId,
            CreatedAt = DateTime.UtcNow,
            ConfirmedAt = status == "confirmed" ? DateTime.UtcNow : null
        };

        await repository.AddPaymentAsync(payment, ct);
        var confirmedRows = await repository.GetConfirmedPaymentsAsync(organizationId, invoiceId, ct);

        var netPaid = CalcNetPaid(confirmedRows);
        var methodNet = BuildMethodNet(confirmedRows);
        var paymentMethod = ResolvePaymentMethod(methodNet);

        var hasRefund = confirmedRows.Any(x => x.Kind == "refund");
        var total = invoice.Total;
        var isFullyPaid = netPaid >= total - 0.01;

        var nextStatus = "pending";
        if (hasRefund && netPaid <= 0.01)
        {
            nextStatus = "refunded";
        }
        else if (hasRefund && netPaid > 0.01)
        {
            nextStatus = "paid";
        }
        else if (isFullyPaid)
        {
            nextStatus = "paid";
        }

        invoice.AmountPaid = netPaid;
        invoice.Change = nextStatus == "paid" ? Math.Max(0, netPaid - total) : 0;
        invoice.PaymentMethod = paymentMethod;
        invoice.Status = nextStatus;
        invoice.PaidAt = nextStatus == "paid" ? invoice.PaidAt ?? DateTime.UtcNow : null;
        invoice.RefundedAt = nextStatus == "refunded" ? invoice.RefundedAt ?? DateTime.UtcNow : null;
        invoice.IsOpenInTab = nextStatus == "pending";

        var updated = await repository.UpdateAsync(invoice, ct);
        return updated.ToDto();
    }

    private static double ToAmount(double value)
    {
        var amount = Math.Round(value, 2);
        if (!double.IsFinite(amount) || amount <= 0)
        {
            throw new InvalidOperationException("So tien khong hop le");
        }
        return amount;
    }

    private static double CalcNetPaid(IEnumerable<InvoicePaymentTransaction> rows)
    {
        var net = rows.Sum(row => row.Kind == "refund" ? -row.Amount : row.Amount);
        return Math.Round(Math.Max(0, net), 2);
    }

    private static Dictionary<string, double> BuildMethodNet(IEnumerable<InvoicePaymentTransaction> rows)
    {
        var methodNet = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in rows)
        {
            methodNet.TryGetValue(row.Method, out var current);
            methodNet[row.Method] = row.Kind == "refund" ? current - row.Amount : current + row.Amount;
        }
        return methodNet;
    }

    private static string? ResolvePaymentMethod(Dictionary<string, double> methodNet)
    {
        var positive = methodNet.Where(x => x.Value > 0).Select(x => x.Key).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (positive.Count == 0)
        {
            return null;
        }
        if (positive.Count == 1)
        {
            var only = positive[0].ToLowerInvariant();
            return only is "cash" or "card" or "transfer" ? only : "mixed";
        }
        return "mixed";
    }
}
