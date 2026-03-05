namespace Api.Utils;

public static class PaginationDefaults
{
    public const int DefaultPage = 1;
    public const int DefaultLimit = 20;

    public static int Page(int? value) => value is > 0 ? value.Value : DefaultPage;

    public static int Limit(int? value) => value is > 0 ? value.Value : DefaultLimit;
}
