using Api.Application.Common.Interfaces.Services;
using Api.Application.Features.Invoices;

namespace Api.Api.Endpoints;

public static class InvoiceEndpoints
{
    public static IEndpointRouteBuilder MapInvoiceEndpoints(this IEndpointRouteBuilder app)
    {
        var invoices = app.MapGroup("/api/invoices").RequireAuthorization();

        invoices.MapGet("/", GetInvoices);
        invoices.MapPost("/", CreateInvoice);
        invoices.MapPost("/{invoiceId:int}/payments", RecordPayment);

        return app;
    }

    private static async Task<IResult> GetInvoices(
        string organizationId,
        bool? isOpenInTab,
        DateTime? from,
        DateTime? to,
        int? branchId,
        int page,
        int limit,
        IInvoiceService service,
        CancellationToken ct)
    {
        var query = new InvoiceListQuery(
            IsOpenInTab: isOpenInTab,
            From: from,
            To: to,
            BranchId: branchId,
            Page: page <= 0 ? 1 : page,
            Limit: limit <= 0 ? 20 : limit);
        var data = await service.GetPagedAsync(organizationId, query, ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateInvoice(
        CreateInvoiceRequest request,
        IInvoiceService service,
        CancellationToken ct)
    {
        try
        {
            var invoice = await service.CreateAsync(request, ct);
            return Results.Created($"/api/invoices/{invoice.Id}", invoice);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }

    private static async Task<IResult> RecordPayment(
        int invoiceId,
        RecordInvoicePaymentRequest request,
        IInvoicePaymentService service,
        CancellationToken ct)
    {
        try
        {
            var invoice = await service.RecordPaymentAsync(invoiceId, request, ct);
            return Results.Ok(invoice);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }
}
