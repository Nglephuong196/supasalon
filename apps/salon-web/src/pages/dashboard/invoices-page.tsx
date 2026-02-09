import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-client";
import {
  invoicesService,
  type Invoice,
  type InvoicePayload,
  type InvoiceStatus,
} from "@/services/invoices.service";

function Modal(props: {
  title: string;
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
        className="w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{props.title}</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={props.onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

const statusText: Record<InvoiceStatus, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

const statusClass: Record<InvoiceStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export function InvoicesPage() {
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState<"service" | "product">("service");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.title = "Hóa đơn | SupaSalon";
  }, []);

  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices,
    queryFn: () => invoicesService.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: InvoicePayload) => invoicesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<InvoicePayload> }) =>
      invoicesService.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
  });

  const closeTabMutation = useMutation({
    mutationFn: (id: number) => invoicesService.close(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => invoicesService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
  });

  const invoices = invoicesQuery.data ?? [];
  const loading = invoicesQuery.isLoading;
  const saving =
    createMutation.isPending ||
    updateStatusMutation.isPending ||
    closeTabMutation.isPending ||
    deleteMutation.isPending;

  const error =
    actionError ??
    (invoicesQuery.error instanceof Error ? invoicesQuery.error.message : null) ??
    (createMutation.error instanceof Error ? createMutation.error.message : null) ??
    (updateStatusMutation.error instanceof Error ? updateStatusMutation.error.message : null) ??
    (closeTabMutation.error instanceof Error ? closeTabMutation.error.message : null) ??
    (deleteMutation.error instanceof Error ? deleteMutation.error.message : null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const byStatus = statusFilter === "all" || item.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const bySearch =
        String(item.id).includes(query) ||
        (item.customer?.name || "").toLowerCase().includes(query) ||
        (item.paymentMethod || "").toLowerCase().includes(query);
      return byStatus && bySearch;
    });
  }, [invoices, searchQuery, statusFilter]);

  const totals = useMemo(() => {
    return {
      revenue: invoices
        .filter((item) => item.status === "paid")
        .reduce((sum, item) => sum + Number(item.total || 0), 0),
      pending: invoices.filter((item) => item.status === "pending").length,
      openTabs: invoices.filter((item) => item.isOpenInTab).length,
    };
  }, [invoices]);

  function resetForm() {
    setCustomerId("");
    setItemName("");
    setItemType("service");
    setQuantity("1");
    setUnitPrice("0");
    setNotes("");
  }

  async function createInvoice(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!itemName.trim()) {
      setActionError("Vui lòng nhập tên mục tính tiền");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setActionError("Số lượng không hợp lệ");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setActionError("Đơn giá không hợp lệ");
      return;
    }

    const lineTotal = qty * price;
    const payload: InvoicePayload = {
      customerId: customerId ? Number(customerId) : undefined,
      subtotal: lineTotal,
      total: lineTotal,
      amountPaid: 0,
      status: "pending",
      isOpenInTab: true,
      notes,
      items: [
        {
          type: itemType,
          name: itemName.trim(),
          quantity: qty,
          unitPrice: price,
          total: lineTotal,
          staff: [],
        },
      ],
    };

    setActionError(null);
    try {
      await createMutation.mutateAsync(payload);
      setCreateOpen(false);
      resetForm();
    } catch {
      // handled by mutation error state
    }
  }

  async function updateStatus(invoice: Invoice, status: InvoiceStatus) {
    setActionError(null);
    try {
      const payload: Partial<InvoicePayload> = {
        status,
        isOpenInTab: status === "pending",
      };
      await updateStatusMutation.mutateAsync({ id: invoice.id, payload });
    } catch {
      // handled by mutation error state
    }
  }

  async function closeInvoiceTab(invoice: Invoice) {
    setActionError(null);
    try {
      await closeTabMutation.mutateAsync(invoice.id);
    } catch {
      // handled by mutation error state
    }
  }

  async function deleteInvoice() {
    if (!selectedInvoice) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(selectedInvoice.id);
      setDeleteOpen(false);
      setSelectedInvoice(null);
    } catch {
      // handled by mutation error state
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hóa đơn</h1>
            <p className="text-muted-foreground">
              Tạo, cập nhật trạng thái và quản lý hóa đơn bán hàng
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setActionError(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo hóa đơn
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Doanh thu đã thu</div>
          <div className="text-xl font-semibold text-emerald-700">
            {totals.revenue.toLocaleString("vi-VN")}đ
          </div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Hóa đơn chờ thanh toán</div>
          <div className="text-xl font-semibold text-amber-700">{totals.pending}</div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Hóa đơn đang mở tab</div>
          <div className="text-xl font-semibold">{totals.openTabs}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo mã hóa đơn hoặc khách"
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border px-3 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | InvoiceStatus)}
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(statusText).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-auto rounded-lg border border-border/70 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Mã</th>
              <th className="px-3 py-2 text-left">Khách hàng</th>
              <th className="px-3 py-2 text-right">Tổng tiền</th>
              <th className="px-3 py-2 text-left">Trạng thái</th>
              <th className="px-3 py-2 text-left">Ngày tạo</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                  Không có hóa đơn
                </td>
              </tr>
            ) : (
              filteredInvoices.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">#{item.id}</td>
                  <td className="px-3 py-2">{item.customer?.name || "Khách lẻ"}</td>
                  <td className="px-3 py-2 text-right font-medium">
                    {Number(item.total || 0).toLocaleString("vi-VN")}đ
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass[item.status]}`}
                    >
                      {statusText[item.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2">{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {item.status !== "paid" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => void updateStatus(item, "paid")}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Đã thu
                        </Button>
                      ) : null}
                      {item.isOpenInTab ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => void closeInvoiceTab(item)}
                        >
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          Đóng tab
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedInvoice(item);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Tạo hóa đơn" open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="grid gap-4" onSubmit={createInvoice}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Mã khách hàng (tuỳ chọn)</Label>
              <Input
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                placeholder="VD: 1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Loại mục</Label>
              <select
                className="h-10 rounded-md border px-3 text-sm"
                value={itemType}
                onChange={(event) => setItemType(event.target.value as "service" | "product")}
              >
                <option value="service">Dịch vụ</option>
                <option value="product">Sản phẩm</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Tên mục tính tiền</Label>
            <Input
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="Ví dụ: Gội đầu dưỡng sinh"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Số lượng</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Đơn giá</Label>
              <Input
                type="number"
                min={0}
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Ghi chú</Label>
            <textarea
              className="min-h-20 rounded-md border px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            Thành tiền dự kiến:{" "}
            {(Number(quantity || "0") * Number(unitPrice || "0")).toLocaleString("vi-VN")}đ
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang tạo..." : "Tạo hóa đơn"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal title="Hủy hóa đơn" open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hóa đơn sẽ được đánh dấu hủy (soft delete).
          </p>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-medium">Hóa đơn #{selectedInvoice?.id}</div>
            <div className="text-muted-foreground">
              Tổng: {Number(selectedInvoice?.total || 0).toLocaleString("vi-VN")}đ
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void deleteInvoice()}>
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
