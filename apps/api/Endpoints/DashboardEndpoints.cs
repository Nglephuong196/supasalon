using Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.Json;

namespace Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var dashboard = app.MapGroup("/api/dashboard").RequireAuthorization();
        dashboard.MapGet("/", GetDashboard);
        return app;
    }

    private static async Task<IResult> GetDashboard(
        string? range,
        HttpContext httpContext,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid)
        {
            return validation.Error!;
        }

        var organizationId = validation.OrganizationId!;
        var requestedRange = ResolveRange(httpContext, range);
        var safeRange = ClampRange(requestedRange);
        var period = GetRange(safeRange);

        var bookingsCurrent = await db.Bookings
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.Date >= period.From && x.Date <= period.To)
            .ToListAsync(ct);

        var bookingsPreviousCount = await db.Bookings
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.Date >= period.PrevFrom && x.Date <= period.PrevTo)
            .CountAsync(ct);

        var paidInvoicesCurrent = await db.Invoices
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId
                && x.CreatedAt >= period.From
                && x.CreatedAt <= period.To
                && x.Status == "paid")
            .ToListAsync(ct);

        var paidInvoicesPrev = await db.Invoices
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId
                && x.CreatedAt >= period.PrevFrom
                && x.CreatedAt <= period.PrevTo
                && x.Status == "paid")
            .ToListAsync(ct);

        var newCustomersCurrent = await db.Customers
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.CreatedAt >= period.From && x.CreatedAt <= period.To)
            .CountAsync(ct);

        var newCustomersPrev = await db.Customers
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.CreatedAt >= period.PrevFrom && x.CreatedAt <= period.PrevTo)
            .CountAsync(ct);

        var revenue = paidInvoicesCurrent.Sum(x => x.Total);
        var revenuePrev = paidInvoicesPrev.Sum(x => x.Total);
        var avgInvoice = paidInvoicesCurrent.Count > 0 ? Math.Round(revenue / paidInvoicesCurrent.Count) : 0;
        var avgInvoicePrev = paidInvoicesPrev.Count > 0 ? Math.Round(revenuePrev / paidInvoicesPrev.Count) : 0;

        var customersById = await db.Customers
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .Select(x => new { x.Id, x.Name })
            .ToDictionaryAsync(x => x.Id, x => x.Name, ct);

        var serviceNames = await (
            from service in db.Services.AsNoTracking()
            join category in db.ServiceCategories.AsNoTracking() on service.CategoryId equals category.Id
            where category.OrganizationId == organizationId
            select new { service.Id, service.Name }
        ).ToDictionaryAsync(x => x.Id, x => x.Name, ct);

        var staffNames = await (
            from member in db.Members.AsNoTracking()
            join user in db.Users.AsNoTracking() on member.UserId equals user.Id
            where member.OrganizationId == organizationId
            select new { member.Id, user.Name }
        ).ToDictionaryAsync(x => x.Id, x => x.Name, ct);

        var scheduleSource = bookingsCurrent
            .OrderBy(x => x.Date)
            .Take(8)
            .ToList();

        var schedule = scheduleSource.Select(booking =>
        {
            (int? serviceId, string? staffId) = GetFirstGuestServiceInfo(booking.Guests);
            return new
            {
                id = booking.Id,
                time = booking.Date.ToString("HH:mm", CultureInfo.InvariantCulture),
                customer = customersById.TryGetValue(booking.CustomerId, out var customerName) ? customerName : "Khach hang",
                service = serviceId is int sid && serviceNames.TryGetValue(sid, out var serviceName) ? serviceName : "Dich vu",
                staff = !string.IsNullOrWhiteSpace(staffId) && staffNames.TryGetValue(staffId, out var staffName) ? staffName : "Nhan vien",
                status = booking.Status
            };
        }).ToList();

        var chart = BuildChart(safeRange, paidInvoicesCurrent, period.From);

        var topStylists = await BuildTopStylistsAsync(db, organizationId, period.From, period.To, staffNames, ct);
        var lowStock = await BuildLowStockAsync(db, organizationId, ct);

        var response = new
        {
            range = safeRange,
            from = period.From.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            to = period.To.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            chart = new
            {
                labels = chart.Labels,
                data = chart.Data,
                unit = "₫",
                title = chart.Title,
                context = period.Label,
                compare = period.Compare
            },
            stats = new
            {
                revenue,
                appointments = bookingsCurrent.Count,
                newCustomers = newCustomersCurrent,
                avgInvoice,
                trend = new
                {
                    revenue = PercentChange(revenue, revenuePrev),
                    appointments = PercentChange(bookingsCurrent.Count, bookingsPreviousCount),
                    newCustomers = PercentChange(newCustomersCurrent, newCustomersPrev),
                    avgInvoice = PercentChange(avgInvoice, avgInvoicePrev)
                }
            },
            schedule,
            topStylists,
            lowStock
        };

        return Results.Ok(response);
    }

    private static string? ResolveRange(HttpContext httpContext, string? range)
    {
        if (!string.IsNullOrWhiteSpace(range))
        {
            return NormalizeRangeToken(range);
        }

        if (httpContext.Request.Query.TryGetValue("range:", out var malformedRangeValue))
        {
            var candidate = malformedRangeValue.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(candidate))
            {
                return NormalizeRangeToken(candidate);
            }
        }

        foreach (var key in httpContext.Request.Query.Keys)
        {
            if (!key.StartsWith("range:", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var suffix = key["range:".Length..];
            if (!string.IsNullOrWhiteSpace(suffix))
            {
                return NormalizeRangeToken(suffix);
            }
        }

        return null;
    }

    private static string NormalizeRangeToken(string value)
    {
        var trimmed = value.Trim();
        if (trimmed.StartsWith("range:", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed["range:".Length..].Trim();
        }

        if (trimmed.StartsWith(":", StringComparison.Ordinal))
        {
            return trimmed[1..].Trim();
        }

        return trimmed;
    }

    private static async Task<List<object>> BuildTopStylistsAsync(
        AppDbContext db,
        string organizationId,
        DateTime rangeFrom,
        DateTime rangeTo,
        Dictionary<string, string> staffNames,
        CancellationToken ct)
    {
        var rows = await (
            from invoice in db.Invoices.AsNoTracking()
            join item in db.InvoiceItems.AsNoTracking() on invoice.Id equals item.InvoiceId
            join staff in db.InvoiceItemStaff.AsNoTracking() on item.Id equals staff.InvoiceItemId
            where invoice.OrganizationId == organizationId
                  && invoice.Status == "paid"
                  && invoice.CreatedAt >= rangeFrom
                  && invoice.CreatedAt <= rangeTo
            select new
            {
                staff.StaffId,
                item.Total
            }
        ).ToListAsync(ct);

        var aggregated = rows
            .GroupBy(x => x.StaffId)
            .Select(group => new
            {
                StaffId = group.Key,
                Revenue = group.Sum(x => x.Total),
                Count = group.Count()
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        var topRevenue = aggregated.FirstOrDefault()?.Revenue ?? 0;
        if (topRevenue <= 0)
        {
            return new List<object>();
        }

        return aggregated
            .Select(x =>
            {
                var name = staffNames.TryGetValue(x.StaffId, out var value) ? value : "Nhan vien";
                return (object)new
                {
                    id = x.StaffId,
                    name,
                    revenue = x.Revenue,
                    revenuePercent = (int)Math.Round((x.Revenue / topRevenue) * 100),
                    appointments = x.Count,
                    avatar = BuildAvatar(name)
                };
            })
            .ToList();
    }

    private static async Task<List<object>> BuildLowStockAsync(AppDbContext db, string organizationId, CancellationToken ct)
    {
        var products = await (
            from product in db.Products.AsNoTracking()
            join category in db.ProductCategories.AsNoTracking() on product.CategoryId equals category.Id
            where category.OrganizationId == organizationId
            select new
            {
                product.Id,
                product.Name,
                product.Stock,
                product.MinStock
            }
        ).ToListAsync(ct);

        return products
            .Where(x => x.Stock <= x.MinStock)
            .OrderBy(x => x.Stock)
            .ThenBy(x => x.Name)
            .Take(6)
            .Select(x => (object)new
            {
                id = x.Id,
                name = x.Name,
                stock = x.Stock,
                minStock = x.MinStock,
                status = x.Stock <= Math.Max(1, (int)Math.Round(x.MinStock * 0.3)) ? "critical" : "warning"
            })
            .ToList();
    }

    private static (int? ServiceId, string? StaffId) GetFirstGuestServiceInfo(JsonDocument? guests)
    {
        if (guests is null || guests.RootElement.ValueKind != JsonValueKind.Array)
        {
            return (null, null);
        }

        foreach (var guest in guests.RootElement.EnumerateArray())
        {
            if (!guest.TryGetProperty("services", out var services) || services.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var service in services.EnumerateArray())
            {
                int? serviceId = null;
                string? staffId = null;

                if (service.TryGetProperty("serviceId", out var serviceIdEl))
                {
                    serviceId = serviceIdEl.ValueKind switch
                    {
                        JsonValueKind.Number => serviceIdEl.GetInt32(),
                        JsonValueKind.String when int.TryParse(serviceIdEl.GetString(), out var parsed) => parsed,
                        _ => null
                    };
                }

                if (service.TryGetProperty("memberId", out var memberIdEl) && memberIdEl.ValueKind == JsonValueKind.String)
                {
                    staffId = memberIdEl.GetString();
                }

                return (serviceId, staffId);
            }
        }

        return (null, null);
    }

    private static string ClampRange(string? range)
    {
        return range switch
        {
            "today" => "today",
            "month" => "month",
            "year" => "year",
            _ => "week"
        };
    }

    private static (DateTime From, DateTime To, DateTime PrevFrom, DateTime PrevTo, string Label, string Compare) GetRange(string range)
    {
        var now = DateTime.UtcNow;

        if (range == "today")
        {
            var from = StartOfDay(now);
            var to = EndOfDay(now);
            var prevFrom = StartOfDay(now.AddDays(-1));
            var prevTo = EndOfDay(now.AddDays(-1));
            return (from, to, prevFrom, prevTo, "Hom nay", "so voi hom qua");
        }

        if (range == "month")
        {
            var from = StartOfDay(new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc));
            var to = EndOfDay(new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 0, 0, 0, DateTimeKind.Utc));
            var prevMonth = now.AddMonths(-1);
            var prevFrom = StartOfDay(new DateTime(prevMonth.Year, prevMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc));
            var prevTo = EndOfDay(new DateTime(prevMonth.Year, prevMonth.Month, DateTime.DaysInMonth(prevMonth.Year, prevMonth.Month), 0, 0, 0, DateTimeKind.Utc));
            return (from, to, prevFrom, prevTo, "Thang nay", "so voi thang truoc");
        }

        if (range == "year")
        {
            var from = StartOfDay(new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc));
            var to = EndOfDay(new DateTime(now.Year, 12, 31, 0, 0, 0, DateTimeKind.Utc));
            var prevFrom = StartOfDay(new DateTime(now.Year - 1, 1, 1, 0, 0, 0, DateTimeKind.Utc));
            var prevTo = EndOfDay(new DateTime(now.Year - 1, 12, 31, 0, 0, 0, DateTimeKind.Utc));
            return (from, to, prevFrom, prevTo, "Nam nay", "so voi nam truoc");
        }

        var weekFrom = StartOfDay(now.AddDays(-6));
        var weekTo = EndOfDay(now);
        var prevWeekFrom = StartOfDay(weekFrom.AddDays(-7));
        var prevWeekTo = EndOfDay(weekFrom.AddDays(-1));
        return (weekFrom, weekTo, prevWeekFrom, prevWeekTo, "7 ngay qua", "so voi 7 ngay truoc");
    }

    private static DateTime StartOfDay(DateTime value) => new(value.Year, value.Month, value.Day, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime EndOfDay(DateTime value) => new(value.Year, value.Month, value.Day, 23, 59, 59, 999, DateTimeKind.Utc);

    private static int PercentChange(double current, double previous)
    {
        if (previous == 0 && current == 0)
        {
            return 0;
        }

        if (previous == 0)
        {
            return 100;
        }

        return (int)Math.Round(((current - previous) / previous) * 100);
    }

    private static (List<string> Labels, List<double> Data, string Title) BuildChart(string range, List<Models.Invoice> invoices, DateTime from)
    {
        if (range == "today")
        {
            var labels = new List<string> { "08h", "10h", "12h", "14h", "16h", "18h", "20h" };
            var hours = new[] { 8, 10, 12, 14, 16, 18, 20 };
            var data = hours.Select(hour => invoices
                    .Where(x => x.CreatedAt.Hour >= hour && x.CreatedAt.Hour < hour + 2)
                    .Sum(x => x.Total))
                .ToList();
            return (labels, data, "Doanh thu theo gio");
        }

        if (range == "month")
        {
            var labels = new List<string> { "Tuan 1", "Tuan 2", "Tuan 3", "Tuan 4" };
            var data = new List<double> { 0, 0, 0, 0 };
            foreach (var invoice in invoices)
            {
                var week = Math.Min(3, (invoice.CreatedAt.Day - 1) / 7);
                data[week] += invoice.Total;
            }
            return (labels, data, "Doanh thu theo tuan");
        }

        if (range == "year")
        {
            var labels = new List<string> { "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12" };
            var data = Enumerable.Repeat(0d, 12).ToList();
            foreach (var invoice in invoices)
            {
                data[invoice.CreatedAt.Month - 1] += invoice.Total;
            }
            return (labels, data, "Doanh thu theo thang");
        }

        var weekLabels = new List<string>();
        var weekData = new List<double>();
        var culture = new CultureInfo("vi-VN");
        for (var i = 0; i < 7; i++)
        {
            var day = from.Date.AddDays(i);
            weekLabels.Add(day.ToString("ddd", culture));
            weekData.Add(invoices.Where(x => x.CreatedAt.Date == day).Sum(x => x.Total));
        }

        return (weekLabels, weekData, "Doanh thu theo ngay");
    }

    private static string BuildAvatar(string name)
    {
        var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
        {
            return "NV";
        }

        if (parts.Length == 1)
        {
            return parts[0].Length >= 2
                ? parts[0][..2].ToUpperInvariant()
                : parts[0].ToUpperInvariant();
        }

        return string.Concat(parts[^2][0], parts[^1][0]).ToUpperInvariant();
    }
}
