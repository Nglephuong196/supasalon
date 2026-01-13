<script lang="ts">
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Plus, Search, Phone, Mail } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    // Mock data
    const employees = [
        {
            id: "1",
            name: "Trần Văn B",
            role: "Thợ cắt tóc",
            phone: "0901111222",
            email: "tranb@salon.com",
            status: "active",
        },
        {
            id: "2",
            name: "Lê Thị D",
            role: "Thợ làm tóc",
            phone: "0902222333",
            email: "led@salon.com",
            status: "active",
        },
        {
            id: "3",
            name: "Nguyễn Văn G",
            role: "Thợ cắt tóc",
            phone: "0903333444",
            email: "nguyeng@salon.com",
            status: "active",
        },
        {
            id: "4",
            name: "Phạm Thị H",
            role: "Lễ tân",
            phone: "0904444555",
            email: "phamh@salon.com",
            status: "inactive",
        },
        {
            id: "5",
            name: "Hoàng Văn K",
            role: "Quản lý",
            phone: "0905555666",
            email: "hoangk@salon.com",
            status: "active",
        },
    ];

    const roleColors: Record<string, string> = {
        "Thợ cắt tóc": "bg-blue-100 text-blue-700",
        "Thợ làm tóc": "bg-purple-100 text-purple-700",
        "Lễ tân": "bg-green-100 text-green-700",
        "Quản lý": "bg-orange-100 text-orange-700",
    };
</script>

<svelte:head>
    <title>Nhân viên | Salon Pro</title>
</svelte:head>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Nhân viên</h1>
            <p class="text-muted-foreground">Quản lý nhân viên salon</p>
        </div>
        <Button class="bg-purple-600 hover:bg-purple-700">
            <Plus class="h-4 w-4 mr-2" />
            Thêm nhân viên
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
                placeholder="Tìm kiếm nhân viên..."
                class="pl-9"
            />
        </div>
    </div>

    <!-- Employees Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each employees as employee}
            <Card class="p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start gap-4">
                    <div
                        class={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium shrink-0",
                            employee.status === "active"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground",
                        )}
                    >
                        {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold truncate">
                                {employee.name}
                            </h3>
                            {#if employee.status === "inactive"}
                                <span
                                    class="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                                    >Nghỉ</span
                                >
                            {/if}
                        </div>
                        <span
                            class={cn(
                                "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                roleColors[employee.role] ||
                                    "bg-gray-100 text-gray-700",
                            )}
                        >
                            {employee.role}
                        </span>
                        <div class="space-y-1 mt-2">
                            <div
                                class="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <Phone class="h-3 w-3" />
                                <span>{employee.phone}</span>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <Mail class="h-3 w-3" />
                                <span class="truncate">{employee.email}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        {/each}
    </div>
</div>
