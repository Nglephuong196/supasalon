<script lang="ts">
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Plus, Search, Package } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    // Mock data
    const products = [
        {
            id: "1",
            name: "Dầu gội Loreal",
            category: "Dầu gội",
            stock: 3,
            minStock: 10,
            price: 250000,
        },
        {
            id: "2",
            name: "Thuốc nhuộm số 5",
            category: "Thuốc nhuộm",
            stock: 5,
            minStock: 15,
            price: 180000,
        },
        {
            id: "3",
            name: "Keo xịt tóc",
            category: "Tạo kiểu",
            stock: 8,
            minStock: 20,
            price: 95000,
        },
        {
            id: "4",
            name: "Kem dưỡng tóc",
            category: "Dưỡng tóc",
            stock: 2,
            minStock: 10,
            price: 320000,
        },
        {
            id: "5",
            name: "Dầu xả Pantene",
            category: "Dầu xả",
            stock: 25,
            minStock: 10,
            price: 150000,
        },
        {
            id: "6",
            name: "Sáp vuốt tóc",
            category: "Tạo kiểu",
            stock: 18,
            minStock: 15,
            price: 120000,
        },
    ];

    function formatPrice(price: number) {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    }

    function getStockStatus(stock: number, minStock: number) {
        if (stock <= minStock * 0.3)
            return { label: "Sắp hết", class: "bg-red-100 text-red-700" };
        if (stock <= minStock)
            return {
                label: "Tồn kho thấp",
                class: "bg-yellow-100 text-yellow-700",
            };
        return { label: "Còn hàng", class: "bg-green-100 text-green-700" };
    }
</script>

<svelte:head>
    <title>Sản phẩm | Salon Pro</title>
</svelte:head>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Sản phẩm</h1>
            <p class="text-muted-foreground">Quản lý kho sản phẩm</p>
        </div>
        <Button class="bg-purple-600 hover:bg-purple-700">
            <Plus class="h-4 w-4 mr-2" />
            Thêm sản phẩm
        </Button>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-sm">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                class="pl-9"
            />
        </div>
    </div>

    <!-- Products Table -->
    <Card>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="border-b">
                    <tr>
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Sản phẩm</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Danh mục</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Tồn kho</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Trạng thái</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Giá</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y">
                    {#each products as product}
                        {@const status = getStockStatus(
                            product.stock,
                            product.minStock,
                        )}
                        <tr class="hover:bg-muted/50">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"
                                    >
                                        <Package
                                            class="h-5 w-5 text-muted-foreground"
                                        />
                                    </div>
                                    <span class="text-sm font-medium"
                                        >{product.name}</span
                                    >
                                </div>
                            </td>
                            <td class="px-4 py-3 text-sm">{product.category}</td
                            >
                            <td class="px-4 py-3 text-sm">{product.stock}</td>
                            <td class="px-4 py-3">
                                <span
                                    class={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium",
                                        status.class,
                                    )}
                                >
                                    {status.label}
                                </span>
                            </td>
                            <td
                                class="px-4 py-3 text-sm font-medium text-green-600"
                            >
                                {formatPrice(product.price)}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </Card>
</div>
