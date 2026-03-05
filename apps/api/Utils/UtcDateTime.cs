using System.Globalization;

namespace Api.Utils;

public static class UtcDateTime
{
    public static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    public static DateTime? EnsureUtc(DateTime? value)
    {
        return value is null ? null : EnsureUtc(value.Value);
    }

    public static bool TryParseUtc(string? value, out DateTime utcValue)
    {
        if (!DateTime.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var parsed))
        {
            utcValue = default;
            return false;
        }

        utcValue = EnsureUtc(parsed);
        return true;
    }
}
