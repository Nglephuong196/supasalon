import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import {
  type Customer,
  type CustomerPayload,
  customersService,
} from "@/services/customers.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Crown, MapPin, Pencil, Phone, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  gender: "" | "male" | "female" | "other";
  location: string;
};

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  gender: "",
  location: "",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function getAvatarGradient(index: number): string {
  const gradients = [
    "from-purple-500 to-indigo-500",
    "from-pink-500 to-rose-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-lime-500",
    "from-orange-500 to-amber-500",
    "from-violet-500 to-purple-500",
  ];
  return gradients[index % gradients.length];
}
const NONE_OPTION_VALUE = "__none__";

function Modal(props: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!props.open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={props.onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-xl border border-border bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{props.title}</h3>
            {props.description ? (
              <p className="text-sm text-muted-foreground">{props.description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={props.onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "vip">("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [createForm, setCreateForm] = useState<CustomerForm>(emptyForm);
  const [editForm, setEditForm] = useState<CustomerForm>(emptyForm);

  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    document.title = "Khách hàng | SupaSalon";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("q") || "");
    setActiveFilter((params.get("filter") as "all" | "vip") || "all");
    const nextPage = Number.parseInt(params.get("page") || "1", 10);
    setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (debouncedSearchQuery) url.searchParams.set("q", debouncedSearchQuery);
    else url.searchParams.delete("q");
    if (activeFilter !== "all") url.searchParams.set("filter", activeFilter);
    else url.searchParams.delete("filter");
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");
    window.history.replaceState({}, "", url);
  }, [activeFilter, debouncedSearchQuery, page]);

  const customersQuery = useQuery({
    queryKey: queryKeys.customersList({
      page,
      limit,
      search: debouncedSearchQuery,
      filter: activeFilter,
    }),
    queryFn: () =>
      customersService.listPaginated({
        page,
        limit,
        search: debouncedSearchQuery,
        vipOnly: activeFilter === "vip",
      }),
    placeholderData: (previous) => previous,
  });
  const customers = customersQuery.data?.data ?? [];
  const total = customersQuery.data?.total ?? 0;
  const totalPages = customersQuery.data?.totalPages ?? 1;
  const loading = customersQuery.isLoading;

  useEffect(() => {
    if (customersQuery.error instanceof Error) {
      setError(customersQuery.error.message);
    }
  }, [customersQuery.error]);

  function validate(form: CustomerForm): boolean {
    let valid = true;
    setNameError("");
    setPhoneError("");
    if (!form.name.trim()) {
      setNameError("Vui lòng nhập tên khách hàng");
      valid = false;
    }
    if (!form.phone.trim()) {
      setPhoneError("Vui lòng nhập số điện thoại");
      valid = false;
    }
    return valid;
  }

  const createCustomerMutation = useMutation({
    mutationFn: (payload: CustomerPayload) => customersService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.customers,
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: CustomerPayload;
    }) => customersService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.customers,
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => customersService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.customers,
      });
    },
  });

  const saving =
    createCustomerMutation.isPending ||
    updateCustomerMutation.isPending ||
    deleteCustomerMutation.isPending;

  const customerColumns: Array<ColumnDef<Customer>> = [
    {
      id: "avatar",
      header: "Avatar",
      cell: ({ row }) => {
        const index = row.index;
        return (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-white shadow-sm",
              getAvatarGradient(index),
            )}
          >
            {row.original.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
        );
      },
    },
    {
      id: "customer",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.name}</div>
          <div className="text-xs text-gray-500">{row.original.email || ""}</div>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Liên hệ",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="h-3.5 w-3.5" />
          <span>{row.original.phone || "N/A"}</span>
        </div>
      ),
    },
    {
      id: "tier",
      header: "Hạng",
      cell: ({ row }) =>
        row.original.membershipTier ? (
          <div className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-xs font-medium text-white">
            <Crown className="h-3 w-3" />
            <span>{row.original.membershipTier.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        ),
    },
    {
      id: "location",
      header: "Địa chỉ",
      cell: ({ row }) => (
        <div className="flex max-w-[200px] items-center gap-1.5 truncate text-gray-600">
          {row.original.location ? (
            <>
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{row.original.location}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      id: "spent",
      header: "Chi tiêu",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) => (
        <div className="font-medium text-gray-900" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatCurrency(row.original.totalSpent || 0)}đ
        </div>
      ),
    },
    {
      id: "gender",
      header: "Giới tính",
      cell: ({ row }) =>
        row.original.gender ? (
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {row.original.gender === "male"
              ? "Nam"
              : row.original.gender === "female"
                ? "Nữ"
                : "Khác"}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        ),
    },
    {
      id: "actions",
      header: "Thao tác",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => openEditDialog(row.original)}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa
          </Button>
          <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(row.original)}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Xóa
          </Button>
        </div>
      ),
    },
  ];

  async function createCustomer(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!validate(createForm)) return;
    setError(null);
    try {
      const payload: CustomerPayload = {
        name: createForm.name,
        phone: createForm.phone,
        email: createForm.email || null,
        notes: createForm.notes || "",
        gender: createForm.gender || null,
        location: createForm.location || null,
      };
      await createCustomerMutation.mutateAsync(payload);
      setIsCreateOpen(false);
      setCreateForm(emptyForm);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Không thể tạo khách hàng";
      setError(message);
    }
  }

  async function updateCustomer(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!selectedCustomer) return;
    if (!validate(editForm)) return;
    setError(null);
    try {
      const payload: CustomerPayload = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email || null,
        notes: editForm.notes || "",
        gender: editForm.gender || null,
        location: editForm.location || null,
      };
      await updateCustomerMutation.mutateAsync({
        id: selectedCustomer.id,
        payload,
      });
      setIsEditOpen(false);
      setSelectedCustomer(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Không thể cập nhật khách hàng";
      setError(message);
    }
  }

  async function deleteCustomer() {
    if (!selectedCustomer) return;
    setError(null);
    try {
      await deleteCustomerMutation.mutateAsync(selectedCustomer.id);
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Không thể xóa khách hàng";
      setError(message);
    }
  }

  function openEditDialog(customer: Customer) {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      notes: customer.notes || "",
      gender: customer.gender || "",
      location: customer.location || "",
    });
    setNameError("");
    setPhoneError("");
    setIsEditOpen(true);
  }

  function openDeleteDialog(customer: Customer) {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Khách hàng</h1>
            <p className="mt-1 text-gray-500">Quản lý thông tin khách hàng của bạn</p>
          </div>
          <Button className="shadow-lg shadow-purple-200" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo mới khách hàng
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col items-start gap-4 rounded-xl border border-border/70 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Tìm kiếm khách hàng…"
            className="rounded-xl pr-10 pl-10"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
          {searchQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 rounded-full bg-gray-100 hover:bg-gray-200"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
            >
              <X className="h-3 w-3 text-gray-500" />
            </Button>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            className="h-auto rounded-xl px-4 py-2 text-sm"
            onClick={() => {
              setActiveFilter("all");
              setPage(1);
            }}
          >
            Tất cả
          </Button>
          <Button
            variant={activeFilter === "vip" ? "default" : "outline"}
            className="flex h-auto items-center gap-1.5 rounded-xl px-4 py-2 text-sm"
            onClick={() => {
              setActiveFilter("vip");
              setPage(1);
            }}
          >
            <Crown
              className={cn(
                "h-3.5 w-3.5",
                activeFilter === "vip" ? "text-white" : "text-amber-500",
              )}
            />
            VIP
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-white">
        <div className="hidden overflow-x-auto md:block">
          <DataTable data={customers} columns={customerColumns} loading={loading} />
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl bg-muted/40" />
              ))
            : customers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="space-y-3 rounded-xl border border-border/70 bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-white shadow-sm",
                          getAvatarGradient(index),
                        )}
                      >
                        {customer.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{customer.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {customer.email || "Không có email"}
                        </p>
                      </div>
                    </div>
                    {customer.membershipTier ? (
                      <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                        <Crown className="h-3 w-3" />
                        <span>{customer.membershipTier.name}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="truncate">{customer.phone || "N/A"}</span>
                    </div>
                    <div className="truncate text-right font-medium text-foreground">
                      {formatCurrency(customer.totalSpent || 0)}đ
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{customer.location || "-"}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(customer)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDeleteDialog(customer)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
        </div>

        {!loading && customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <div className="mb-3 rounded-full bg-gray-50 p-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            {searchQuery || activeFilter !== "all" ? (
              <>
                <p>Không tìm thấy khách hàng nào phù hợp.</p>
                <Button
                  variant="link"
                  className="mt-2 text-sm text-primary"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                    setPage(1);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </>
            ) : (
              <p>Chưa có khách hàng nào. Hãy thêm khách hàng đầu tiên!</p>
            )}
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Hiển thị {customers.length} / {total} khách hàng
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Trước
              </Button>
              <span className="min-w-20 text-center text-muted-foreground">
                Trang {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Thêm khách hàng mới"
        description="Nhập thông tin khách hàng mới vào bên dưới. Nhấn lưu để hoàn tất."
      >
        <form onSubmit={createCustomer} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="create-name">Tên *</Label>
            <Input
              id="create-name"
              value={createForm.name}
              onChange={(event) => {
                setCreateForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }));
                setNameError("");
              }}
              placeholder="Nguyễn Văn A"
            />
            {nameError ? <span className="text-xs text-red-500">{nameError}</span> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-phone">SĐT *</Label>
            <Input
              id="create-phone"
              type="tel"
              value={createForm.phone}
              onChange={(event) => {
                setCreateForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }));
                setPhoneError("");
              }}
              placeholder="0901234567"
            />
            {phoneError ? <span className="text-xs text-red-500">{phoneError}</span> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              value={createForm.email}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              placeholder="example@gmail.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-gender">Giới tính</Label>
            <Select
              value={createForm.gender || NONE_OPTION_VALUE}
              onValueChange={(value) =>
                setCreateForm((prev) => ({
                  ...prev,
                  gender: value === NONE_OPTION_VALUE ? "" : (value as CustomerForm["gender"]),
                }))
              }
            >
              <SelectTrigger
                id="create-gender"
                className="h-11 rounded-lg border border-input bg-gray-50/50 px-3 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_OPTION_VALUE}>Chọn giới tính</SelectItem>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-location">Địa chỉ</Label>
            <Input
              id="create-location"
              value={createForm.location}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  location: event.target.value,
                }))
              }
              placeholder="123 Đường ABC, Quận 1"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-notes">Ghi chú</Label>
            <Input
              id="create-notes"
              value={createForm.notes}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  notes: event.target.value,
                }))
              }
              placeholder="Ghi chú về khách hàng"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu khách hàng"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Chỉnh sửa khách hàng"
        description="Cập nhật thông tin khách hàng. Nhấn lưu để hoàn tất."
      >
        <form onSubmit={updateCustomer} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Tên *</Label>
            <Input
              id="edit-name"
              value={editForm.name}
              onChange={(event) => {
                setEditForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }));
                setNameError("");
              }}
            />
            {nameError ? <span className="text-xs text-red-500">{nameError}</span> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-phone">SĐT *</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={editForm.phone}
              onChange={(event) => {
                setEditForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }));
                setPhoneError("");
              }}
            />
            {phoneError ? <span className="text-xs text-red-500">{phoneError}</span> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={editForm.email}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-gender">Giới tính</Label>
            <Select
              value={editForm.gender || NONE_OPTION_VALUE}
              onValueChange={(value) =>
                setEditForm((prev) => ({
                  ...prev,
                  gender: value === NONE_OPTION_VALUE ? "" : (value as CustomerForm["gender"]),
                }))
              }
            >
              <SelectTrigger
                id="edit-gender"
                className="h-11 rounded-lg border border-input bg-gray-50/50 px-3 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_OPTION_VALUE}>Chọn giới tính</SelectItem>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-location">Địa chỉ</Label>
            <Input
              id="edit-location"
              value={editForm.location}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  location: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Ghi chú</Label>
            <Input
              id="edit-notes"
              value={editForm.notes}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  notes: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu…" : "Cập nhật"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Xác nhận xóa khách hàng?"
      >
        <p className="text-sm text-muted-foreground">
          Bạn có chắc chắn muốn xóa khách hàng <strong>{selectedCustomer?.name}</strong>? Hành động
          này không thể hoàn tác.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={() => void deleteCustomer()}
          >
            {saving ? "Đang xóa…" : "Xóa khách hàng"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
