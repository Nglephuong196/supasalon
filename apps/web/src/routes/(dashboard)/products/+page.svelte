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
    <title>Sản phẩm | SupaSalon</title>
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

    <!-- Products Content -->
    <div
        class="rounded-xl border border-gray-100 bg-card text-card-foreground shadow-sm"
    >
        <div
            class="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100"
        >
            <div>
                <h3 class="font-semibold leading-none tracking-tight">
                    Danh sách sản phẩm
                </h3>
                <p class="text-sm text-muted-foreground mt-2">
                    Quản lý {products.length} sản phẩm trong kho
                </p>
            </div>
            <div class="relative w-full max-w-sm">
                <Search
                    class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                    type="search"
                    placeholder="Tìm kiếm sản phẩm..."
                    class="pl-9 h-9"
                />
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="border-b border-gray-100 bg-muted/40">
                    <tr>
                        <th class="h-12 w-[50px] px-4 align-middle">
                            <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </th>
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Sản phẩm</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Danh mục</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Tồn kho</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Trạng thái</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Giá</th
                        >
                        <th
                            class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                        ></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each products as product}
                        {@const status = getStockStatus(
                            product.stock,
                            product.minStock,
                        )}
                        <tr class="hover:bg-muted/50 transition-colors">
                            <td class="p-4 align-middle">
                                <input
                                    type="checkbox"
                                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </td>
                            <td class="p-4 align-middle">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0"
                                    >
                                        <Package
                                            class="h-5 w-5 text-muted-foreground"
                                        />
                                    </div>
                                    <span class="font-medium text-foreground"
                                        >{product.name}</span
                                    >
                                </div>
                            </td>
                            <td class="p-4 align-middle text-muted-foreground"
                                >{product.category}</td
                            >
                            <td class="p-4 align-middle font-medium"
                                >{product.stock}</td
                            >
                            <td class="p-4 align-middle">
                                <span
                                    class={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                        status.class,
                                    )}
                                >
                                    {status.label}
                                </span>
                            </td>
                            <td
                                class="p-4 align-middle font-medium text-green-600"
                            >
                                {formatPrice(product.price)}
                            </td>
                            <td class="p-4 align-middle text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 text-muted-foreground"
                                >
                                    <div class="h-4 w-4 rotate-90">...</div>
                                </Button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
