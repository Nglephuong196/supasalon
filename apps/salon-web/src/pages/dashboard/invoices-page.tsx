import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/lib/query-client";
import { branchesService } from "@/services/branches.service";
import {
  type ApprovalPendingResponse,
  type Invoice,
  type InvoicePaymentInput,
  type InvoicePaymentMethod,
  type InvoicePaymentStatus,
  type InvoicePayload,
  type InvoiceSettlePayload,
  type InvoiceStatus,
  invoicesService,
} from "@/services/invoices.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  ExternalLink,
  FileText,
  History,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  refunded: "Đã hoàn tiền",
};

const statusClass: Record<InvoiceStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  refunded: "bg-sky-100 text-sky-700",
};

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

const paymentMethodLabel: Record<InvoicePaymentMethod, string> = {
  cash: "Tiền mặt",
  card: "Thẻ",
  transfer: "Chuyển khoản",
};

const paymentStatusLabel: Record<InvoicePaymentStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  failed: "Thất bại",
  cancelled: "Đã hủy",
};
const NONE_OPTION_VALUE = "__none__";

type SettlePaymentLine = {
  method: InvoicePaymentMethod;
  amount: string;
  status: "confirmed" | "pending";
  referenceCode: string;
  notes: string;
};

export function InvoicesPage() {
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("history");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [settlePayments, setSettlePayments] = useState<SettlePaymentLine[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState<"service" | "product">("service");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.title = "Hóa đơn | SupaSalon";
  }, []);

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches,
    queryFn: () => branchesService.list(),
  });

  const invoicesQuery = useQuery({
    queryKey: [...queryKeys.invoices, branchFilter],
    queryFn: () =>
      invoicesService.list({
        branchId: branchFilter === "all" ? undefined : Number(branchFilter),
      }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: InvoicePayload) => invoicesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<InvoicePayload>;
    }) => invoicesService.update(id, payload),
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

  const settleMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: InvoiceSettlePayload;
    }) => invoicesService.settle(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => invoicesService.cancel(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => invoicesService.refund(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
  });

  const invoiceAuditQuery = useQuery({
    queryKey: ["invoice-audit", selectedInvoice?.id ?? 0],
    queryFn: () => invoicesService.audit(Number(selectedInvoice?.id)),
    enabled: Boolean(auditOpen && selectedInvoice?.id),
  });

  const invoices = invoicesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const loading = invoicesQuery.isLoading;
  const saving =
    bulkLoading ||
    createMutation.isPending ||
    updateStatusMutation.isPending ||
    closeTabMutation.isPending ||
    settleMutation.isPending ||
    deleteMutation.isPending ||
    refundMutation.isPending;

  const error =
    actionError ??
    (branchesQuery.error instanceof Error ? branchesQuery.error.message : null) ??
    (invoicesQuery.error instanceof Error ? invoicesQuery.error.message : null) ??
    (createMutation.error instanceof Error ? createMutation.error.message : null) ??
    (updateStatusMutation.error instanceof Error ? updateStatusMutation.error.message : null) ??
    (closeTabMutation.error instanceof Error ? closeTabMutation.error.message : null) ??
    (settleMutation.error instanceof Error ? settleMutation.error.message : null) ??
    (deleteMutation.error instanceof Error ? deleteMutation.error.message : null) ??
    (refundMutation.error instanceof Error ? refundMutation.error.message : null) ??
    (invoiceAuditQuery.error instanceof Error ? invoiceAuditQuery.error.message : null);

  const openTabInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.isOpenInTab);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const byStatus = statusFilter === "all" || item.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const bySearch =
        query.length === 0 ||
        String(item.id).includes(query) ||
        (item.customer?.name || "").toLowerCase().includes(query) ||
        (item.paymentMethod || "").toLowerCase().includes(query);
      return byStatus && bySearch;
    });
  }, [invoices, searchQuery, statusFilter]);

  const activeInvoice = useMemo(() => {
    if (activeTab === "history") return null;
    return invoices.find((invoice) => String(invoice.id) === activeTab) ?? null;
  }, [activeTab, invoices]);

  const selectedCount = selectedIds.size;
  const allChecked =
    filteredInvoices.length > 0 && filteredInvoices.every((item) => selectedIds.has(item.id));

  const totals = useMemo(() => {
    return {
      revenue: invoices
        .filter((item) => item.status === "paid")
        .reduce((sum, item) => sum + Number(item.total || 0), 0),
      pending: invoices.filter((item) => item.status === "pending").length,
      openTabs: openTabInvoices.length,
    };
  }, [invoices, openTabInvoices.length]);

  useEffect(() => {
    if (activeTab !== "history" && !activeInvoice) {
      setActiveTab("history");
    }
  }, [activeInvoice, activeTab]);

  function resetForm() {
    setCustomerId("");
    setFormBranchId("");
    setItemName("");
    setItemType("service");
    setQuantity("1");
    setUnitPrice("0");
    setNotes("");
  }

  function toggleSelect(invoiceId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) next.delete(invoiceId);
      else next.add(invoiceId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allChecked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredInvoices.map((item) => item.id)));
  }

  async function createInvoice(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const branchId = formBranchId ? Number(formBranchId) : undefined;
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
    if (typeof branchId === "number" && (!Number.isInteger(branchId) || branchId <= 0)) {
      setActionError("Chi nhánh không hợp lệ");
      return;
    }

    const lineTotal = qty * price;
    const payload: InvoicePayload = {
      customerId: customerId ? Number(customerId) : undefined,
      branchId,
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
      const created = await createMutation.mutateAsync(payload);
      setCreateOpen(false);
      resetForm();
      setActiveTab(String(created.id));
    } catch {
      // handled by mutation error state
    }
  }

  function getInvoiceDueAmount(invoice: Invoice) {
    const paid = Number(invoice.amountPaid ?? 0);
    return Number(Math.max(0, Number(invoice.total || 0) - paid).toFixed(2));
  }

  function isApprovalPendingResponse(
    value: Invoice | ApprovalPendingResponse,
  ): value is ApprovalPendingResponse {
    return Boolean((value as ApprovalPendingResponse).requiresApproval);
  }

  function openSettleModal(invoice: Invoice) {
    const due = getInvoiceDueAmount(invoice);
    setSelectedInvoice(invoice);
    setSettlePayments([
      {
        method: "cash",
        amount: String(due > 0 ? due : Number(invoice.total || 0)),
        status: "confirmed",
        referenceCode: "",
        notes: "",
      },
    ]);
    setSettleOpen(true);
  }

  function updateSettleLine(index: number, patch: Partial<SettlePaymentLine>) {
    setSettlePayments((prev) =>
      prev.map((line, lineIndex) => {
        if (lineIndex !== index) return line;
        return {
          ...line,
          ...patch,
          status:
            (patch.method ?? line.method) === "cash"
              ? "confirmed"
              : (patch.status ?? line.status),
        };
      }),
    );
  }

  function addSettleLine() {
    setSettlePayments((prev) => [
      ...prev,
      {
        method: "transfer",
        amount: "0",
        status: "pending",
        referenceCode: "",
        notes: "",
      },
    ]);
  }

  function removeSettleLine(index: number) {
    setSettlePayments((prev) => prev.filter((_, lineIndex) => lineIndex !== index));
  }

  async function settleInvoice() {
    if (!selectedInvoice) return;
    const due = getInvoiceDueAmount(selectedInvoice);

    const payments: InvoicePaymentInput[] = settlePayments
      .map((line) => ({
        method: line.method,
        amount: Number(line.amount),
        status: line.method === "cash" ? "confirmed" : line.status,
        referenceCode: line.referenceCode.trim() || undefined,
        notes: line.notes.trim() || undefined,
      }))
      .filter((line) => Number.isFinite(line.amount) && line.amount > 0);

    if (payments.length === 0) {
      setActionError("Vui lòng nhập ít nhất một khoản thanh toán hợp lệ");
      return;
    }

    const totalPayment = payments.reduce((sum, line) => sum + line.amount, 0);
    if (due > 0 && totalPayment <= 0) {
      setActionError("Tổng thanh toán phải lớn hơn 0");
      return;
    }

    setActionError(null);
    try {
      await settleMutation.mutateAsync({
        id: selectedInvoice.id,
        payload: {
          payments,
        },
      });
      setSettleOpen(false);
      setSelectedInvoice(null);
      setSettlePayments([]);
    } catch {
      // handled by mutation state
    }
  }

  async function openInvoiceInTab(invoice: Invoice) {
    setActionError(null);
    setActiveTab(String(invoice.id));
    if (invoice.isOpenInTab) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: invoice.id,
        payload: {
          isOpenInTab: true,
        },
      });
    } catch {
      // handled by mutation error state
    }
  }

  async function closeInvoiceTab(invoice: Invoice) {
    setActionError(null);
    try {
      await closeTabMutation.mutateAsync(invoice.id);
      if (activeTab === String(invoice.id)) {
        setActiveTab("history");
      }
    } catch {
      // handled by mutation error state
    }
  }

  async function deleteInvoice() {
    if (!selectedInvoice) return;
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await deleteMutation.mutateAsync({
        id: selectedInvoice.id,
        reason: cancelReason.trim() || undefined,
      });
      setDeleteOpen(false);
      setSelectedInvoice(null);
      setCancelReason("");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedInvoice.id);
        return next;
      });
      if (activeTab === String(selectedInvoice.id)) {
        setActiveTab("history");
      }
      if (isApprovalPendingResponse(result)) {
        setActionNotice(
          `Yêu cầu hủy hóa đơn đã được gửi phê duyệt (#${result.approvalRequest.id}).`,
        );
      }
    } catch {
      // handled by mutation error state
    }
  }

  async function refundInvoice() {
    if (!selectedInvoice) return;
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await refundMutation.mutateAsync({
        id: selectedInvoice.id,
        reason: refundReason.trim() || undefined,
      });
      setRefundOpen(false);
      setRefundReason("");
      setSelectedInvoice(null);
      if (isApprovalPendingResponse(result)) {
        setActionNotice(
          `Yêu cầu hoàn tiền đã được gửi phê duyệt (#${result.approvalRequest.id}).`,
        );
      }
    } catch {
      // handled by mutation error state
    }
  }

  async function runBulkAction(actionType: "open" | "complete" | "cancel") {
    const selected = invoices.filter((item) => selectedIds.has(item.id));
    if (selected.length === 0) return;

    const openTargets = selected.filter((item) => !item.isOpenInTab && item.status !== "cancelled");
    const completeTargets = selected.filter(
      (item) => item.status === "pending" && getInvoiceDueAmount(item) > 0,
    );
    const cancelTargets = selected.filter((item) => item.status !== "cancelled");

    try {
      setActionError(null);
      setActionNotice(null);
      setBulkLoading(true);

      if (actionType === "open") {
        await Promise.all(
          openTargets.map((item) => invoicesService.update(item.id, { isOpenInTab: true })),
        );
        if (openTargets[0]) {
          setActiveTab(String(openTargets[0].id));
        }
      }

      if (actionType === "complete") {
        await Promise.all(
          completeTargets.map((item) =>
            invoicesService.settle(item.id, {
              payments: [
                {
                  method: "cash",
                  amount: getInvoiceDueAmount(item),
                  status: "confirmed",
                  notes: "Thanh toán hàng loạt từ màn hình lịch sử",
                },
              ],
            }),
          ),
        );
      }

      if (actionType === "cancel") {
        const results = await Promise.all(
          cancelTargets.map((item) => invoicesService.cancel(item.id, "Hủy hàng loạt từ màn hình lịch sử")),
        );
        const approvalCount = results.filter((result) => isApprovalPendingResponse(result)).length;
        if (approvalCount > 0) {
          setActionNotice(`Đã gửi ${approvalCount} yêu cầu phê duyệt hủy hóa đơn.`);
        }
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      setSelectedIds(new Set());
    } catch (bulkError) {
      if (bulkError instanceof Error) {
        setActionError(bulkError.message);
      } else {
        setActionError("Không thể thực hiện thao tác hàng loạt");
      }
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-muted/10">
      <div className="border-b border-border/80 bg-background px-4 py-3 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">POS Bán Hàng</h1>
            <p className="text-sm text-muted-foreground">Quản lý lịch sử và tab hóa đơn đang mở</p>
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            className="h-9 rounded-md"
            onClick={() => setActiveTab("history")}
          >
            <History className="h-4 w-4" />
            Lịch sử
          </Button>

          {openTabInvoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center">
              <Button
                variant={activeTab === String(invoice.id) ? "default" : "ghost"}
                className="h-9 rounded-r-none border border-r-0 border-transparent px-3 data-[active=true]:border-primary/40"
                onClick={() => setActiveTab(String(invoice.id))}
                data-active={activeTab === String(invoice.id)}
              >
                <FileText className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{invoice.customer?.name || `#${invoice.id}`}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-l-none border border-l-0"
                onClick={() => void closeInvoiceTab(invoice)}
                title="Đóng tab"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-6">
          {error}
        </div>
      ) : null}
      {actionNotice ? (
        <div className="mx-4 mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 sm:mx-6">
          {actionNotice}
        </div>
      ) : null}

      <div className="flex-1 overflow-hidden px-4 pb-4 sm:px-6 sm:pb-6">
        {activeTab === "history" ? (
          <div className="flex h-full flex-col gap-4 pt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-muted-foreground">Doanh thu đã thu</div>
                <div className="text-xl font-semibold text-emerald-700">{formatMoney(totals.revenue)}</div>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-muted-foreground">Hóa đơn chờ thanh toán</div>
                <div className="text-xl font-semibold text-amber-700">{totals.pending}</div>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-muted-foreground">Hóa đơn mở tab</div>
                <div className="text-xl font-semibold text-primary">{totals.openTabs}</div>
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
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as "all" | InvoiceStatus)}
              >
                <SelectTrigger className="h-10 w-[220px] rounded-md border px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(statusText).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-10 w-[220px] rounded-md border px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleSelectAll}
                        aria-label="Chọn tất cả"
                        className="h-4 w-4"
                      />
                    </TableHead>
                    <TableHead>Mã hóa đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Chi nhánh</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(invoice.id)}
                            onChange={() => toggleSelect(invoice.id)}
                            aria-label={`Chọn hóa đơn #${invoice.id}`}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium">#{invoice.id}</TableCell>
                        <TableCell>{invoice.customer?.name || "Khách vãng lai"}</TableCell>
                        <TableCell>{invoice.branch?.name || "Toàn hệ thống"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invoice.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatMoney(invoice.total)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass[invoice.status]}`}
                          >
                            {statusText[invoice.status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void openInvoiceInTab(invoice)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Mở tab
                            </Button>
                            {invoice.status === "pending" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSettleModal(invoice)}
                              >
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                Thanh toán
                              </Button>
                            ) : null}
                            {invoice.status === "paid" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setRefundReason("");
                                    setRefundOpen(true);
                                  }}
                                >
                                  Hoàn tiền
                                </Button>
                              </>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setAuditOpen(true);
                              }}
                            >
                              Nhật ký
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setCancelReason("");
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {selectedCount > 0 ? (
              <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-primary/20 bg-white/95 px-4 py-2 shadow-2xl backdrop-blur">
                <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                  {selectedCount}
                </span>
                <span className="text-sm font-medium">đang chọn</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-blue-200 text-blue-700"
                  onClick={() => void runBulkAction("open")}
                  disabled={saving}
                >
                  <ExternalLink className="h-4 w-4" />
                  Mở tab
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-green-200 text-green-700"
                  onClick={() => void runBulkAction("complete")}
                  disabled={saving}
                >
                  <CheckCircle className="h-4 w-4" />
                  Thanh toán
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-red-200 text-red-700"
                  onClick={() => void runBulkAction("cancel")}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
                  Hủy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Bỏ chọn
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="h-full overflow-auto py-4">
            {activeInvoice ? (
              <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Hóa đơn #{activeInvoice.id}</div>
                    <h2 className="text-xl font-semibold">
                      {activeInvoice.customer?.name || "Khách vãng lai"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass[activeInvoice.status]}`}
                    >
                      {statusText[activeInvoice.status]}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => void closeInvoiceTab(activeInvoice)}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                      Đóng tab
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">Ngày tạo</div>
                    <div className="font-medium">
                      {new Date(activeInvoice.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">Tổng tiền</div>
                    <div className="font-semibold text-primary">{formatMoney(activeInvoice.total)}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">Đã thanh toán</div>
                    <div className="font-medium text-emerald-700">
                      {formatMoney(Number(activeInvoice.amountPaid || 0))}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">Còn lại</div>
                    <div className="font-medium text-amber-700">
                      {formatMoney(getInvoiceDueAmount(activeInvoice))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border">
                  <div className="border-b px-4 py-3 text-sm font-medium">Chi tiết mục thanh toán</div>
                  <div className="p-4">
                    {activeInvoice.items?.length ? (
                      <div className="space-y-2">
                        {activeInvoice.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border bg-muted/10 px-3 py-2"
                          >
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.type} · SL {item.quantity} x {formatMoney(item.unitPrice)}
                              </div>
                            </div>
                            <div className="font-medium">{formatMoney(item.total)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Chưa có dữ liệu chi tiết</div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border">
                  <div className="border-b px-4 py-3 text-sm font-medium">
                    Giao dịch thanh toán theo phương thức
                  </div>
                  <div className="p-4">
                    {activeInvoice.payments?.length ? (
                      <div className="space-y-2">
                        {activeInvoice.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="grid gap-2 rounded-lg border bg-muted/10 px-3 py-2 text-sm md:grid-cols-5 md:items-center"
                          >
                            <div>
                              <div className="font-medium">
                                {payment.kind === "refund" ? "Hoàn tiền" : "Thanh toán"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatMoney(payment.amount)}
                              </div>
                            </div>
                            <div>{paymentMethodLabel[payment.method]}</div>
                            <div>{paymentStatusLabel[payment.status]}</div>
                            <div className="text-muted-foreground">
                              {payment.referenceCode || "-"}
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              {new Date(payment.createdAt).toLocaleString("vi-VN")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Chưa có giao dịch thanh toán nào.
                      </div>
                    )}
                  </div>
                </div>

                {activeInvoice.notes ? (
                  <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                    <div className="mb-1 text-xs text-muted-foreground">Ghi chú</div>
                    <div>{activeInvoice.notes}</div>
                  </div>
                ) : null}

                {activeInvoice.cancelReason ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
                    <div className="mb-1 text-xs text-rose-700">Lý do hủy</div>
                    <div className="text-rose-800">{activeInvoice.cancelReason}</div>
                  </div>
                ) : null}
                {activeInvoice.refundReason ? (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
                    <div className="mb-1 text-xs text-sky-700">Lý do hoàn tiền</div>
                    <div className="text-sky-800">{activeInvoice.refundReason}</div>
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  {activeInvoice.status === "pending" ? (
                    <Button onClick={() => openSettleModal(activeInvoice)} disabled={saving}>
                      <CheckCircle className="h-4 w-4" />
                      Thanh toán hóa đơn
                    </Button>
                  ) : activeInvoice.status === "paid" ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedInvoice(activeInvoice);
                          setRefundReason("");
                          setRefundOpen(true);
                        }}
                        disabled={saving}
                      >
                        Hoàn tiền
                      </Button>
                    </>
                  ) : null}

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedInvoice(activeInvoice);
                      setAuditOpen(true);
                    }}
                  >
                    Xem nhật ký
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedInvoice(activeInvoice);
                      setCancelReason("");
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Hủy hóa đơn
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Không tìm thấy tab hóa đơn
              </div>
            )}
          </div>
        )}
      </div>

      <Modal title="Tạo hóa đơn" open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="grid gap-4" onSubmit={createInvoice}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Mã khách hàng (tuỳ chọn)</Label>
              <Input
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                placeholder="VD: 1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Chi nhánh</Label>
              <Select
                value={formBranchId || NONE_OPTION_VALUE}
                onValueChange={(value) =>
                  setFormBranchId(value === NONE_OPTION_VALUE ? "" : value)
                }
              >
                <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_OPTION_VALUE}>Tự động mặc định</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Loại mục</Label>
              <Select
                value={itemType}
                onValueChange={(value) => setItemType(value as "service" | "product")}
              >
                <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Dịch vụ</SelectItem>
                  <SelectItem value="product">Sản phẩm</SelectItem>
                </SelectContent>
              </Select>
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
            Thành tiền dự kiến: {formatMoney(Number(quantity || "0") * Number(unitPrice || "0"))}
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

      <Modal
        title="Thanh toán hóa đơn"
        open={settleOpen}
        onClose={() => {
          setSettleOpen(false);
          setSettlePayments([]);
          setSelectedInvoice(null);
        }}
      >
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-medium">Hóa đơn #{selectedInvoice?.id}</div>
            <div className="text-muted-foreground">
              Tổng: {formatMoney(selectedInvoice?.total || 0)} · Đã thu:{" "}
              {formatMoney(Number(selectedInvoice?.amountPaid || 0))}
            </div>
            <div className="text-muted-foreground">
              Còn lại: {formatMoney(selectedInvoice ? getInvoiceDueAmount(selectedInvoice) : 0)}
            </div>
          </div>

          <div className="space-y-3">
            {settlePayments.map((line, index) => (
              <div key={`${line.method}-${index}`} className="rounded-lg border bg-muted/10 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium">Khoản thanh toán #{index + 1}</div>
                  {settlePayments.length > 1 ? (
                    <Button variant="ghost" size="sm" onClick={() => removeSettleLine(index)}>
                      Xóa
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <Label>Phương thức</Label>
                    <Select
                      value={line.method}
                      onValueChange={(value) =>
                        updateSettleLine(index, { method: value as InvoicePaymentMethod })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tiền mặt</SelectItem>
                        <SelectItem value="transfer">Chuyển khoản</SelectItem>
                        <SelectItem value="card">Thẻ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Số tiền</Label>
                    <Input
                      type="number"
                      min={0}
                      step="1000"
                      value={line.amount}
                      onChange={(event) => updateSettleLine(index, { amount: event.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <Label>Trạng thái</Label>
                    <Select
                      value={line.method === "cash" ? "confirmed" : line.status}
                      onValueChange={(value) =>
                        updateSettleLine(index, { status: value as "confirmed" | "pending" })
                      }
                      disabled={line.method === "cash"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                        <SelectItem value="pending">Chờ xác nhận</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Mã tham chiếu (tuỳ chọn)</Label>
                    <Input
                      value={line.referenceCode}
                      onChange={(event) =>
                        updateSettleLine(index, { referenceCode: event.target.value })
                      }
                      placeholder="Ví dụ: MB1234..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3 text-sm">
            <div className="font-medium">
              Tổng nhập:{" "}
              {formatMoney(
                settlePayments.reduce((sum, line) => sum + Number(line.amount || 0), 0),
              )}
            </div>
            <Button variant="outline" size="sm" onClick={addSettleLine}>
              <PlusCircle className="h-4 w-4" />
              Thêm phương thức
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSettleOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void settleInvoice()}>
              Xác nhận thanh toán
            </Button>
          </div>
        </div>
      </Modal>

      <Modal title="Hủy hóa đơn" open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Hóa đơn sẽ được đánh dấu hủy (soft delete).</p>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-medium">Hóa đơn #{selectedInvoice?.id}</div>
            <div className="text-muted-foreground">Tổng: {formatMoney(selectedInvoice?.total || 0)}</div>
          </div>
          <div className="grid gap-2">
            <Label>Lý do hủy</Label>
            <textarea
              className="min-h-20 rounded-md border px-3 py-2 text-sm"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Nhập lý do để lưu audit log..."
            />
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

      <Modal title="Hoàn tiền hóa đơn" open={refundOpen} onClose={() => setRefundOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hóa đơn sẽ được chuyển sang trạng thái hoàn tiền.
          </p>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-medium">Hóa đơn #{selectedInvoice?.id}</div>
            <div className="text-muted-foreground">Tổng: {formatMoney(selectedInvoice?.total || 0)}</div>
          </div>
          <div className="grid gap-2">
            <Label>Lý do hoàn tiền</Label>
            <textarea
              className="min-h-20 rounded-md border px-3 py-2 text-sm"
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              placeholder="Ví dụ: Khách đổi dịch vụ / nhập sai hóa đơn..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRefundOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void refundInvoice()}>
              Xác nhận hoàn tiền
            </Button>
          </div>
        </div>
      </Modal>

      <Modal title="Nhật ký hóa đơn" open={auditOpen} onClose={() => setAuditOpen(false)}>
        <div className="space-y-3">
          {invoiceAuditQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải nhật ký...</div>
          ) : (invoiceAuditQuery.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có sự kiện nào.</div>
          ) : (
            (invoiceAuditQuery.data ?? []).map((log) => (
              <div key={log.id} className="rounded-lg border bg-muted/10 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                {log.reason ? <div className="mt-1 text-muted-foreground">Lý do: {log.reason}</div> : null}
                <div className="mt-1 text-xs text-muted-foreground">
                  Thực hiện bởi: {log.actor?.name || log.actor?.email || "Hệ thống"}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
