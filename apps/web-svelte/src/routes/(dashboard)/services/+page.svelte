<script lang="ts">
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
        TableCaption,
    } from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import {
        Plus,
        Search,
        MoreHorizontal,
        Sparkles,
        Clock,
        Filter,
        ArrowUpDown,
    } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import { toast } from "svelte-sonner";
    import { Label } from "$lib/components/ui/label";

    // --- Mock Data & Types ---
    type Service = {
        id: string;
        name: string;
        category: string;
        duration: number;
        price: number;
        popular: boolean;
    };

    let services = $state<Service[]>([
        {
            id: "1",
            name: "Cắt tóc nam",
            category: "Cắt tóc",
            duration: 30,
            price: 80000,
            popular: true,
        },
        {
            id: "2",
            name: "Cắt tóc nữ",
            category: "Cắt tóc",
            duration: 45,
            price: 120000,
            popular: true,
        },
        {
            id: "3",
            name: "Gội đầu massage",
            category: "Gội đầu",
            duration: 20,
            price: 50000,
            popular: false,
        },
        {
            id: "4",
            name: "Nhuộm tóc",
            category: "Nhuộm",
            duration: 90,
            price: 350000,
            popular: true,
        },
        {
            id: "5",
            name: "Uốn tóc",
            category: "Uốn/Duỗi",
            duration: 120,
            price: 500000,
            popular: false,
        },
        {
            id: "6",
            name: "Duỗi tóc",
            category: "Uốn/Duỗi",
            duration: 150,
            price: 600000,
            popular: false,
        },
        {
            id: "7",
            name: "Chăm sóc tóc",
            category: "Chăm sóc",
            duration: 60,
            price: 200000,
            popular: false,
        },
        {
            id: "8",
            name: "Tạo kiểu tóc",
            category: "Tạo kiểu",
            duration: 30,
            price: 100000,
            popular: true,
        },
    ]);

    // --- State ---
    let searchQuery = $state("");
    let currentPage = $state(1);
    let itemsPerPage = 5;
    let selectedCategory = $state<string | "all">("all");

    // Dialog State
    let isCreateDialogOpen = $state(false);
    let isDeleteDialogOpen = $state(false);
    let editingService = $state<Service | null>(null); // If null, we are creating
    let serviceToDelete = $state<string | null>(null);

    // Form data
    let formData = $state({
        name: "",
        category: "Cắt tóc",
        duration: 30,
        price: 0,
        popular: false,
    });

    // --- Derived ---
    // Svelte 5 derived state using $derived
    let filteredServices = $derived(
        services.filter((s) => {
            const matchesSearch = s.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedCategory === "all" || s.category === selectedCategory;
            return matchesSearch && matchesCategory;
        }),
    );

    let totalPages = $derived(
        Math.ceil(filteredServices.length / itemsPerPage),
    );
    let paginatedServices = $derived(
        filteredServices.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage,
        ),
    );

    // --- Helper Functions ---
    function formatPrice(price: number) {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    }

    function getCategoryColor(category: string) {
        const colors: Record<string, string> = {
            "Cắt tóc": "from-purple-500 to-indigo-500",
            "Gội đầu": "from-blue-500 to-cyan-500",
            Nhuộm: "from-pink-500 to-rose-500",
            "Uốn/Duỗi": "from-orange-500 to-amber-500",
            "Chăm sóc": "from-green-500 to-emerald-500",
            "Tạo kiểu": "from-violet-500 to-purple-500",
        };
        return colors[category] || "from-gray-500 to-gray-600";
    }

    // --- Actions ---
    function openCreateDialog() {
        editingService = null;
        formData = {
            name: "",
            category: "Cắt tóc",
            duration: 30,
            price: 0,
            popular: false,
        };
        isCreateDialogOpen = true;
    }

    function openEditDialog(service: Service) {
        editingService = service;
        formData = { ...service };
        isCreateDialogOpen = true;
    }

    function openDeleteDialog(id: string) {
        serviceToDelete = id;
        isDeleteDialogOpen = true;
    }

    function handleSave() {
        if (editingService) {
            // Update
            services = services.map((s) =>
                s.id === editingService!.id ? { ...formData, id: s.id } : s,
            );
            toast.success("Dịch vụ đã được cập nhật!");
        } else {
            // Create
            const newService = {
                ...formData,
                id: Math.random().toString(36).substr(2, 9),
            };
            services = [newService, ...services];
            toast.success("Dịch vụ mới đã được tạo!");
        }
        isCreateDialogOpen = false;
    }

    function handleDelete() {
        if (serviceToDelete) {
            services = services.filter((s) => s.id !== serviceToDelete);
            toast.success("Đã xóa dịch vụ thành công.");
            serviceToDelete = null;
        }
        isDeleteDialogOpen = false;
    }
</script>

<svelte:head>
    <title>Dịch vụ | Salon Pro</title>
</svelte:head>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">
                Dịch vụ
            </h1>
            <p class="text-muted-foreground mt-1">
                Quản lý danh sách dịch vụ salon
            </p>
        </div>
        <Button
            onclick={openCreateDialog}
            class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200 border-0"
        >
            <Plus class="h-4 w-4 mr-2" />
            Thêm dịch vụ
        </Button>
    </div>

    <!-- Toolbar -->
    <div
        class="flex flex-col sm:flex-row items-center gap-4 bg-white p-1 rounded-xl border border-gray-100 shadow-sm"
    >
        <div class="relative flex-1 w-full">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
                bind:value={searchQuery}
                placeholder="Tìm kiếm dịch vụ..."
                class="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        </div>
        <div class="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
        <div class="flex items-center gap-2 px-3 w-full sm:w-auto">
            <Filter class="h-4 w-4 text-muted-foreground" />
            <select
                bind:value={selectedCategory}
                class="text-sm border-0 bg-transparent focus:ring-0 text-muted-foreground font-medium outline-none cursor-pointer hover:text-foreground transition-colors"
            >
                <option value="all">Tất cả danh mục</option>
                <option value="Cắt tóc">Cắt tóc</option>
                <option value="Gội đầu">Gội đầu</option>
                <option value="Nhuộm">Nhuộm</option>
                <option value="Uốn/Duỗi">Uốn/Duỗi</option>
            </select>
        </div>
    </div>

    <!-- Table Card -->
    <div
        class="rounded-xl border border-border/60 bg-white shadow-sm overflow-hidden"
    >
        <Table>
            <TableHeader class="bg-gray-50/50">
                <TableRow class="hover:bg-transparent">
                    <TableHead class="w-[300px]">Dịch vụ</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>
                        <div
                            class="flex items-center gap-1 cursor-pointer hover:text-primary"
                        >
                            Thời gian
                            <ArrowUpDown class="h-3 w-3" />
                        </div>
                    </TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead class="text-right">Thao tác</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each paginatedServices as service (service.id)}
                    <TableRow
                        class="group hover:bg-purple-50/30 transition-colors"
                    >
                        <TableCell class="font-medium">
                            <div class="flex items-center gap-3">
                                <div
                                    class={cn(
                                        "h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm shrink-0",
                                        getCategoryColor(service.category),
                                    )}
                                >
                                    <Sparkles class="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <div class="font-semibold text-foreground">
                                        {service.name}
                                    </div>
                                    {#if service.popular}
                                        <span
                                            class="text-[10px] text-amber-600 font-medium"
                                            >✨ Popular</span
                                        >
                                    {/if}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                                {service.category}
                            </span>
                        </TableCell>
                        <TableCell>
                            <div
                                class="flex items-center gap-1.5 text-muted-foreground text-sm"
                            >
                                <Clock class="h-3.5 w-3.5" />
                                {service.duration}m
                            </div>
                        </TableCell>
                        <TableCell class="font-semibold text-foreground">
                            {formatPrice(service.price)}
                        </TableCell>
                        <TableCell class="text-right">
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger
                                    class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground hover:text-primary"
                                >
                                    <MoreHorizontal class="h-4 w-4" />
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content
                                    align="end"
                                    class="w-[160px]"
                                >
                                    <DropdownMenu.Item
                                        onclick={() => openEditDialog(service)}
                                        class="cursor-pointer"
                                    >
                                        Chỉnh sửa
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        onclick={() =>
                                            openDeleteDialog(service.id)}
                                        class="text-red-600 focus:text-red-600 cursor-pointer"
                                    >
                                        Xóa dịch vụ
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </TableCell>
                    </TableRow>
                {/each}
                {#if paginatedServices.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={5}
                            class="h-24 text-center text-muted-foreground"
                        >
                            Không tìm thấy dịch vụ nào.
                        </TableCell>
                    </TableRow>
                {/if}
            </TableBody>
        </Table>

        <!-- Pagination Footer -->
        <div
            class="flex items-center justify-between px-4 py-4 border-t border-border/60 bg-gray-50/30"
        >
            <div class="text-sm text-muted-foreground">
                Hiển thị <span class="font-medium text-foreground"
                    >{paginatedServices.length}</span
                >
                trong tổng số
                <span class="font-medium text-foreground"
                    >{filteredServices.length}</span
                > dịch vụ
            </div>
            <div class="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onclick={() => currentPage--}
                    class="h-8 w-8 p-0"
                >
                    &lt;
                </Button>
                <div class="text-sm font-medium px-2">
                    Trang {currentPage} / {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onclick={() => currentPage++}
                    class="h-8 w-8 p-0"
                >
                    &gt;
                </Button>
            </div>
        </div>
    </div>
</div>

<!-- Create/Edit Dialog -->
<Dialog.Root bind:open={isCreateDialogOpen}>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title
                >{editingService
                    ? "Chỉnh sửa dịch vụ"
                    : "Thêm dịch vụ mới"}</Dialog.Title
            >
            <Dialog.Description>
                {editingService
                    ? "Cập nhật thông tin chi tiết cho dịch vụ này."
                    : "Điền thông tin để tạo dịch vụ mới vào hệ thống."}
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="name">Tên dịch vụ</Label>
                <Input
                    id="name"
                    bind:value={formData.name}
                    placeholder="Ví dụ: Cắt tóc layer"
                />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label for="price">Giá (VNĐ)</Label>
                    <Input
                        id="price"
                        type="number"
                        bind:value={formData.price}
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="duration">Thời gian (phút)</Label>
                    <Input
                        id="duration"
                        type="number"
                        bind:value={formData.duration}
                    />
                </div>
            </div>
            <div class="grid gap-2">
                <Label for="category">Danh mục</Label>
                <select
                    id="category"
                    bind:value={formData.category}
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="Cắt tóc">Cắt tóc</option>
                    <option value="Gội đầu">Gội đầu</option>
                    <option value="Nhuộm">Nhuộm</option>
                    <option value="Uốn/Duỗi">Uốn/Duỗi</option>
                    <option value="Chăm sóc">Chăm sóc</option>
                    <option value="Tạo kiểu">Tạo kiểu</option>
                </select>
            </div>
        </div>
        <Dialog.Footer>
            <Button
                variant="outline"
                onclick={() => (isCreateDialogOpen = false)}>Hủy</Button
            >
            <Button
                onclick={handleSave}
                class="bg-primary text-primary-foreground hover:bg-primary/90"
                >Lưu thay đổi</Button
            >
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Bạn có chắc chắn muốn xóa?</AlertDialog.Title>
            <AlertDialog.Description>
                Hành động này không thể hoàn tác. Dịch vụ này sẽ bị xóa vĩnh
                viễn khỏi cơ sở dữ liệu.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel onclick={() => (isDeleteDialogOpen = false)}
                >Hủy bỏ</AlertDialog.Cancel
            >
            <AlertDialog.Action
                onclick={handleDelete}
                class="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
                Xóa dịch vụ
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
