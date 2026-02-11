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
import { approvalsService } from "@/services/approvals.service";
import { queryKeys } from "@/lib/query-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

function toDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

export function ApprovalsPage() {
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "pending",
  );
  const [entityFilter, setEntityFilter] = useState<
    "all" | "invoice" | "cash_transaction" | "booking" | "commission_payout" | "prepaid_card"
  >("all");
  const [from, setFrom] = useState(toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(toDateInput(new Date()));

  const [requireInvoiceCancelApproval, setRequireInvoiceCancelApproval] = useState(false);
  const [requireInvoiceRefundApproval, setRequireInvoiceRefundApproval] = useState(false);
  const [invoiceRefundThreshold, setInvoiceRefundThreshold] = useState("0");
  const [requireCashOutApproval, setRequireCashOutApproval] = useState(false);
  const [cashOutThreshold, setCashOutThreshold] = useState("0");

  useEffect(() => {
    document.title = "Phê duyệt | SupaSalon";
  }, []);

  const policyQuery = useQuery({
    queryKey: queryKeys.approvalPolicy,
    queryFn: () => approvalsService.getPolicy(),
  });

  const requestsQuery = useQuery({
    queryKey: queryKeys.approvalRequests(statusFilter, entityFilter, from, to),
    queryFn: () =>
      approvalsService.listRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
        entityType: entityFilter === "all" ? undefined : entityFilter,
        from,
        to,
      }),
  });

  useEffect(() => {
    if (!policyQuery.data) return;
    setRequireInvoiceCancelApproval(policyQuery.data.requireInvoiceCancelApproval);
    setRequireInvoiceRefundApproval(policyQuery.data.requireInvoiceRefundApproval);
    setInvoiceRefundThreshold(String(policyQuery.data.invoiceRefundThreshold || 0));
    setRequireCashOutApproval(policyQuery.data.requireCashOutApproval);
    setCashOutThreshold(String(policyQuery.data.cashOutThreshold || 0));
  }, [policyQuery.data]);

  const savePolicyMutation = useMutation({
    mutationFn: (payload: {
      requireInvoiceCancelApproval: boolean;
      requireInvoiceRefundApproval: boolean;
      invoiceRefundThreshold: number;
      requireCashOutApproval: boolean;
      cashOutThreshold: number;
    }) => approvalsService.updatePolicy(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicy });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (approvalId: number) => approvalsService.approve(approvalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.approvalRequests(statusFilter, entityFilter, from, to),
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (approvalId: number) => approvalsService.reject(approvalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.approvalRequests(statusFilter, entityFilter, from, to),
      });
    },
  });

  const requests = requestsQuery.data ?? [];

  const saving = savePolicyMutation.isPending || approveMutation.isPending || rejectMutation.isPending;

  const error =
    actionError ??
    (policyQuery.error instanceof Error ? policyQuery.error.message : null) ??
    (requestsQuery.error instanceof Error ? requestsQuery.error.message : null) ??
    (savePolicyMutation.error instanceof Error ? savePolicyMutation.error.message : null) ??
    (approveMutation.error instanceof Error ? approveMutation.error.message : null) ??
    (rejectMutation.error instanceof Error ? rejectMutation.error.message : null);

  async function savePolicy() {
    const refundThreshold = Number(invoiceRefundThreshold);
    const cashThreshold = Number(cashOutThreshold);

    if (!Number.isFinite(refundThreshold) || refundThreshold < 0) {
      setActionError("Ngưỡng hoàn tiền không hợp lệ");
      return;
    }
    if (!Number.isFinite(cashThreshold) || cashThreshold < 0) {
      setActionError("Ngưỡng chi quỹ không hợp lệ");
      return;
    }

    setActionError(null);
    try {
      await savePolicyMutation.mutateAsync({
        requireInvoiceCancelApproval,
        requireInvoiceRefundApproval,
        invoiceRefundThreshold: refundThreshold,
        requireCashOutApproval,
        cashOutThreshold: cashThreshold,
      });
    } catch {
      // handled by mutation state
    }
  }

  async function approveRequest(id: number) {
    setActionError(null);
    try {
      await approveMutation.mutateAsync(id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cashTransactions() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cashSessions() });
    } catch {
      // handled by mutation state
    }
  }

  async function rejectRequest(id: number) {
    setActionError(null);
    try {
      await rejectMutation.mutateAsync(id);
    } catch {
      // handled by mutation state
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Approval Workflow</h1>
        <p className="text-sm text-muted-foreground">
          Kiểm soát thao tác nhạy cảm: hủy hóa đơn, hoàn tiền và chi quỹ ngoài hóa đơn.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <h2 className="font-semibold">Chính sách phê duyệt</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireInvoiceCancelApproval}
              onChange={(event) => setRequireInvoiceCancelApproval(event.target.checked)}
            />
            Yêu cầu duyệt khi hủy hóa đơn
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireInvoiceRefundApproval}
              onChange={(event) => setRequireInvoiceRefundApproval(event.target.checked)}
            />
            Yêu cầu duyệt khi hoàn tiền
          </label>

          <div className="grid gap-1">
            <Label>Ngưỡng hoàn tiền cần duyệt</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={invoiceRefundThreshold}
              onChange={(event) => setInvoiceRefundThreshold(event.target.value)}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireCashOutApproval}
              onChange={(event) => setRequireCashOutApproval(event.target.checked)}
            />
            Yêu cầu duyệt cho giao dịch chi quỹ
          </label>

          <div className="grid gap-1">
            <Label>Ngưỡng chi quỹ cần duyệt</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={cashOutThreshold}
              onChange={(event) => setCashOutThreshold(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button disabled={saving} onClick={() => void savePolicy()}>
            Lưu chính sách
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">Danh sách yêu cầu duyệt</h2>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={entityFilter}
              onValueChange={(value) => setEntityFilter(value as typeof entityFilter)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="invoice">Hóa đơn</SelectItem>
                <SelectItem value="cash_transaction">Chi quỹ</SelectItem>
                <SelectItem value="prepaid_card">Thẻ trả trước</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
        </div>

        <div className="max-h-[460px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Yêu cầu bởi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Giá trị</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Không có dữ liệu.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((item) => {
                  const amount = Number((item.payload as Record<string, unknown> | null)?.amount ?? 0);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.action}</div>
                        <div className="text-xs text-muted-foreground">{item.entityType}</div>
                      </TableCell>
                      <TableCell>{item.requestedBy?.name || item.requestedBy?.email || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            item.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : item.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.status === "rejected"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{amount > 0 ? formatMoney(amount) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {item.status === "pending" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-emerald-200 text-emerald-700"
                                disabled={saving}
                                onClick={() => void approveRequest(item.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Duyệt
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-rose-200 text-rose-700"
                                disabled={saving}
                                onClick={() => void rejectRequest(item.id)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Từ chối
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
