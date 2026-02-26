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
import { cashManagementService } from "@/services/cash-management.service";
import type { ApprovalPendingResponse } from "@/services/invoices.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, CircleDollarSign, ShieldAlert, Wallet, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function toDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const paymentMethodLabel = {
  cash: "Tiền mặt",
  card: "Thẻ",
  transfer: "Chuyển khoản",
} as const;

export function CashManagementPage() {
  const queryClient = useQueryClient();

  const defaultFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return toDateInput(date);
  }, []);
  const defaultTo = useMemo(() => toDateInput(new Date()), []);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [sessionStatus, setSessionStatus] = useState<"all" | "open" | "closed">("all");

  const [openBalance, setOpenBalance] = useState("0");
  const [openNotes, setOpenNotes] = useState("");

  const [closeActual, setCloseActual] = useState("0");
  const [closeNotes, setCloseNotes] = useState("");

  const [txType, setTxType] = useState<"in" | "out">("out");
  const [txAmount, setTxAmount] = useState("0");
  const [txCategory, setTxCategory] = useState("chi_khac");
  const [txNotes, setTxNotes] = useState("");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Quỹ tiền mặt | SupaSalon";
  }, []);

  const currentSessionQuery = useQuery({
    queryKey: ["cash-current-session"],
    queryFn: () => cashManagementService.currentSession(),
  });

  const paymentReportQuery = useQuery({
    queryKey: queryKeys.cashPaymentReport(from, to),
    queryFn: () => cashManagementService.paymentMethodReport({ from, to }),
  });

  const pendingPaymentsQuery = useQuery({
    queryKey: queryKeys.cashPendingPayments(from, to),
    queryFn: () => cashManagementService.pendingPayments({ from, to }),
  });

  const sessionsQuery = useQuery({
    queryKey: queryKeys.cashSessions(from, to, sessionStatus),
    queryFn: () =>
      cashManagementService.listSessions({
        from,
        to,
        status: sessionStatus === "all" ? undefined : sessionStatus,
      }),
  });

  const currentSessionId = currentSessionQuery.data?.currentSession?.id;
  const transactionsQuery = useQuery({
    queryKey: queryKeys.cashTransactions(currentSessionId, from, to),
    queryFn: () =>
      cashManagementService.listTransactions({
        from,
        to,
        cashSessionId: currentSessionId,
      }),
  });

  const openSessionMutation = useMutation({
    mutationFn: (payload: { openingBalance: number; notes?: string }) =>
      cashManagementService.openSession(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cash-current-session"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cashSessions(from, to, sessionStatus) }),
      ]);
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: (payload: { sessionId: number; actualClosingBalance: number; notes?: string }) =>
      cashManagementService.closeSession(payload.sessionId, {
        actualClosingBalance: payload.actualClosingBalance,
        notes: payload.notes,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cash-current-session"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cashSessions(from, to, sessionStatus) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cashTransactions(currentSessionId, from, to) }),
      ]);
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (payload: {
      type: "in" | "out";
      amount: number;
      category?: string;
      notes?: string;
      cashSessionId?: number;
    }) => cashManagementService.createTransaction(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cash-current-session"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cashTransactions(currentSessionId, from, to) }),
      ]);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (paymentId: number) => cashManagementService.confirmPayment(paymentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cashPendingPayments(from, to) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cashPaymentReport(from, to) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
        queryClient.invalidateQueries({ queryKey: ["cash-current-session"] }),
      ]);
    },
  });

  const failPaymentMutation = useMutation({
    mutationFn: (paymentId: number) => cashManagementService.failPayment(paymentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cashPendingPayments(from, to) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
      ]);
    },
  });

  const currentSession = currentSessionQuery.data?.currentSession ?? null;
  const currentSnapshot = currentSessionQuery.data?.currentSnapshot ?? null;
  const paymentReport = paymentReportQuery.data ?? [];
  const pendingPayments = pendingPaymentsQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];

  const reportTotals = useMemo(() => {
    const totalReceived = paymentReport.reduce((sum, item) => sum + Number(item.received || 0), 0);
    const totalRefunded = paymentReport.reduce((sum, item) => sum + Number(item.refunded || 0), 0);
    const totalNet = paymentReport.reduce((sum, item) => sum + Number(item.net || 0), 0);
    const cashRow = paymentReport.find((item) => item.method === "cash");

    return {
      totalReceived,
      totalRefunded,
      totalNet,
      cashNet: cashRow?.net ?? 0,
      pendingCount: pendingPayments.length,
    };
  }, [paymentReport, pendingPayments.length]);

  const loading =
    currentSessionQuery.isLoading ||
    paymentReportQuery.isLoading ||
    pendingPaymentsQuery.isLoading ||
    sessionsQuery.isLoading ||
    transactionsQuery.isLoading;

  const saving =
    openSessionMutation.isPending ||
    closeSessionMutation.isPending ||
    createTransactionMutation.isPending ||
    confirmPaymentMutation.isPending ||
    failPaymentMutation.isPending;

  const error =
    actionError ??
    (currentSessionQuery.error instanceof Error ? currentSessionQuery.error.message : null) ??
    (paymentReportQuery.error instanceof Error ? paymentReportQuery.error.message : null) ??
    (pendingPaymentsQuery.error instanceof Error ? pendingPaymentsQuery.error.message : null) ??
    (sessionsQuery.error instanceof Error ? sessionsQuery.error.message : null) ??
    (transactionsQuery.error instanceof Error ? transactionsQuery.error.message : null) ??
    (openSessionMutation.error instanceof Error ? openSessionMutation.error.message : null) ??
    (closeSessionMutation.error instanceof Error ? closeSessionMutation.error.message : null) ??
    (createTransactionMutation.error instanceof Error
      ? createTransactionMutation.error.message
      : null) ??
    (confirmPaymentMutation.error instanceof Error ? confirmPaymentMutation.error.message : null) ??
    (failPaymentMutation.error instanceof Error ? failPaymentMutation.error.message : null);

  useEffect(() => {
    if (!currentSnapshot) return;
    setCloseActual(String(currentSnapshot.expectedClosingBalance || 0));
  }, [currentSnapshot?.sessionId]);

  async function submitOpenSession(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const openingBalance = Number(openBalance);
    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
      setActionError("Số dư đầu ca không hợp lệ");
      return;
    }

    setActionError(null);
    setActionNotice(null);
    try {
      await openSessionMutation.mutateAsync({
        openingBalance,
        notes: openNotes.trim() || undefined,
      });
      setOpenNotes("");
      setCloseActual("0");
    } catch {
      // handled by mutation state
    }
  }

  async function submitCloseSession(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!currentSession) {
      setActionError("Không có ca quỹ đang mở");
      return;
    }

    const actualClosingBalance = Number(closeActual);
    if (!Number.isFinite(actualClosingBalance) || actualClosingBalance < 0) {
      setActionError("Tiền thực tế không hợp lệ");
      return;
    }

    setActionError(null);
    setActionNotice(null);
    try {
      await closeSessionMutation.mutateAsync({
        sessionId: currentSession.id,
        actualClosingBalance,
        notes: closeNotes.trim() || undefined,
      });
      setCloseNotes("");
    } catch {
      // handled by mutation state
    }
  }

  async function submitCashTransaction(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!currentSession) {
      setActionError("Bạn cần mở ca quỹ trước khi nhập thu/chi");
      return;
    }

    const amount = Number(txAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Số tiền thu/chi phải lớn hơn 0");
      return;
    }

    setActionError(null);
    setActionNotice(null);
    try {
      const result = await createTransactionMutation.mutateAsync({
        type: txType,
        amount,
        category: txCategory,
        notes: txNotes.trim() || undefined,
        cashSessionId: currentSession.id,
      });

      if ((result as ApprovalPendingResponse).requiresApproval) {
        const approval = result as ApprovalPendingResponse;
        setActionNotice(
          `Giao dịch chi quỹ đã được gửi phê duyệt (#${approval.approvalRequest.id}).`,
        );
        return;
      }

      setTxAmount("0");
      setTxNotes("");
    } catch {
      // handled by mutation state
    }
  }

  async function confirmPendingPayment(paymentId: number) {
    setActionError(null);
    setActionNotice(null);
    try {
      await confirmPaymentMutation.mutateAsync(paymentId);
    } catch {
      // handled by mutation state
    }
  }

  async function failPendingPayment(paymentId: number) {
    setActionError(null);
    setActionNotice(null);
    try {
      await failPaymentMutation.mutateAsync(paymentId);
    } catch {
      // handled by mutation state
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý quỹ tiền mặt</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi thanh toán theo phương thức, mở/đóng ca quỹ và đối soát tiền mặt cuối ca.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      {actionNotice ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {actionNotice}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3">
        <div className="grid gap-1">
          <Label>Từ ngày</Label>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Đến ngày</Label>
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Trạng thái ca</Label>
          <Select value={sessionStatus} onValueChange={(value) => setSessionStatus(value as typeof sessionStatus)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="open">Đang mở</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Trạng thái ca quỹ
          </div>
          <div className="text-lg font-semibold">
            {currentSession ? "Đang mở" : "Chưa mở ca"}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentSession ? `Mở lúc ${formatDateTime(currentSession.openedAt)}` : "Hãy mở ca đầu ngày"}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDollarSign className="h-4 w-4" />
            Tiền mặt dự kiến
          </div>
          <div className="text-lg font-semibold text-emerald-700">
            {formatMoney(currentSnapshot?.expectedClosingBalance || 0)}
          </div>
          <div className="text-xs text-muted-foreground">Tính từ đầu ca + thu/chi trong ca</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4" />
            Giao dịch chờ xác nhận
          </div>
          <div className="text-lg font-semibold text-amber-700">{reportTotals.pendingCount}</div>
          <div className="text-xs text-muted-foreground">Chuyển khoản/thẻ đang pending</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Dòng tiền ròng
          </div>
          <div className="text-lg font-semibold text-primary">{formatMoney(reportTotals.totalNet)}</div>
          <div className="text-xs text-muted-foreground">Net = thu - hoàn tiền theo bộ lọc</div>
        </div>
      </div>

      {!currentSession ? (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-1 text-base font-semibold">Mở ca quỹ mới</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Thiết lập số dư đầu ca để hệ thống tính quỹ dự kiến trong ngày.
          </p>
          <form className="grid gap-3 md:max-w-xl" onSubmit={submitOpenSession}>
            <div className="grid gap-1">
              <Label>Số dư đầu ca</Label>
              <Input
                type="number"
                min={0}
                step="1000"
                value={openBalance}
                onChange={(event) => setOpenBalance(event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label>Ghi chú</Label>
              <textarea
                className="min-h-20 rounded-md border px-3 py-2 text-sm"
                value={openNotes}
                onChange={(event) => setOpenNotes(event.target.value)}
                placeholder="Ví dụ: bắt đầu ca sáng"
              />
            </div>
            <div>
              <Button type="submit" disabled={saving}>
                Mở ca quỹ
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <h2 className="mb-1 text-base font-semibold">Đóng ca & đối soát</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Nhập số tiền thực đếm được để hệ thống tính lệch quỹ.
            </p>

            <div className="mb-4 grid gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Đầu ca</span>
                <span className="font-medium">{formatMoney(currentSnapshot?.openingBalance || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thu tiền mặt (hóa đơn)</span>
                <span className="font-medium text-emerald-700">
                  +{formatMoney(currentSnapshot?.invoiceCashIn || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hoàn tiền mặt</span>
                <span className="font-medium text-rose-700">
                  -{formatMoney(currentSnapshot?.invoiceCashOut || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thu ngoài hóa đơn</span>
                <span className="font-medium text-emerald-700">
                  +{formatMoney(currentSnapshot?.manualIn || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chi ngoài hóa đơn</span>
                <span className="font-medium text-rose-700">
                  -{formatMoney(currentSnapshot?.manualOut || 0)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t pt-2">
                <span className="font-medium">Dự kiến cuối ca</span>
                <span className="font-semibold text-primary">
                  {formatMoney(currentSnapshot?.expectedClosingBalance || 0)}
                </span>
              </div>
            </div>

            <form className="grid gap-3" onSubmit={submitCloseSession}>
              <div className="grid gap-1">
                <Label>Tiền thực tế khi đếm quỹ</Label>
                <Input
                  type="number"
                  min={0}
                  step="1000"
                  value={closeActual}
                  onChange={(event) => setCloseActual(event.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label>Ghi chú đóng ca</Label>
                <textarea
                  className="min-h-20 rounded-md border px-3 py-2 text-sm"
                  value={closeNotes}
                  onChange={(event) => setCloseNotes(event.target.value)}
                  placeholder="Ví dụ: lệch do thiếu hóa đơn chuyển khoản"
                />
              </div>
              <div>
                <Button type="submit" disabled={saving}>
                  Đóng ca quỹ
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h2 className="mb-1 text-base font-semibold">Thu/chi ngoài hóa đơn</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Ghi nhận các khoản nhập/xuất quỹ như mua vật tư, tạm ứng, thu khác.
            </p>
            <form className="grid gap-3" onSubmit={submitCashTransaction}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label>Loại</Label>
                  <Select value={txType} onValueChange={(value) => setTxType(value as "in" | "out")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Thu quỹ</SelectItem>
                      <SelectItem value="out">Chi quỹ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label>Số tiền</Label>
                  <Input
                    type="number"
                    min={1}
                    step="1000"
                    value={txAmount}
                    onChange={(event) => setTxAmount(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-1">
                <Label>Danh mục</Label>
                <Input
                  value={txCategory}
                  onChange={(event) => setTxCategory(event.target.value)}
                  placeholder="Ví dụ: mua_vat_tu"
                />
              </div>
              <div className="grid gap-1">
                <Label>Ghi chú</Label>
                <textarea
                  className="min-h-20 rounded-md border px-3 py-2 text-sm"
                  value={txNotes}
                  onChange={(event) => setTxNotes(event.target.value)}
                  placeholder="Nội dung thu/chi"
                />
              </div>
              <div>
                <Button type="submit" disabled={saving}>
                  Lưu giao dịch quỹ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Báo cáo theo phương thức thanh toán</h2>
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phương thức</TableHead>
                  <TableHead className="text-right">Thu vào</TableHead>
                  <TableHead className="text-right">Hoàn ra</TableHead>
                  <TableHead className="text-right">Ròng</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : paymentReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      Chưa có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentReport.map((item) => (
                    <TableRow key={item.method}>
                      <TableCell>{paymentMethodLabel[item.method]}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.received)}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.refunded)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(item.net)}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            item.pendingCount > 0
                              ? "font-medium text-amber-700"
                              : "text-muted-foreground"
                          }
                        >
                          {item.pendingCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
            <div>
              <div className="text-muted-foreground">Tổng thu</div>
              <div className="font-medium text-emerald-700">{formatMoney(reportTotals.totalReceived)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tổng hoàn</div>
              <div className="font-medium text-rose-700">{formatMoney(reportTotals.totalRefunded)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ròng tổng</div>
              <div className="font-medium">{formatMoney(reportTotals.totalNet)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ròng tiền mặt</div>
              <div className="font-medium">{formatMoney(reportTotals.cashNet)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Giao dịch chờ xác nhận</h2>
          <div className="max-h-[380px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hóa đơn</TableHead>
                  <TableHead>Khách</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Không có giao dịch pending.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>#{payment.invoice?.id || payment.invoiceId}</TableCell>
                      <TableCell>{payment.invoice?.customer?.name || "Khách vãng lai"}</TableCell>
                      <TableCell>{paymentMethodLabel[payment.method]}</TableCell>
                      <TableCell className="text-right">{formatMoney(payment.amount)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-emerald-200 text-emerald-700"
                            disabled={saving}
                            onClick={() => void confirmPendingPayment(payment.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Xác nhận
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-200 text-rose-700"
                            disabled={saving}
                            onClick={() => void failPendingPayment(payment.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Thất bại
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Lịch sử thu/chi quỹ (ca hiện tại)</h2>
          <div className="max-h-[360px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Chưa có giao dịch quỹ.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">{formatDateTime(tx.createdAt)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            tx.type === "in"
                              ? "inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                              : "inline-flex rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700"
                          }
                        >
                          {tx.type === "in" ? "Thu" : "Chi"}
                        </span>
                      </TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell className="text-right font-medium">
                        {tx.type === "in" ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Lịch sử ca quỹ</h2>
          <div className="max-h-[360px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mở ca</TableHead>
                  <TableHead>Đóng ca</TableHead>
                  <TableHead className="text-right">Đầu ca</TableHead>
                  <TableHead className="text-right">Dự kiến</TableHead>
                  <TableHead className="text-right">Lệch quỹ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Chưa có ca quỹ nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{formatDateTime(session.openedAt)}</TableCell>
                      <TableCell>
                        {session.status === "open" ? (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <CircleAlert className="h-3.5 w-3.5" />
                            Đang mở
                          </span>
                        ) : (
                          formatDateTime(session.closedAt)
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(session.openingBalance)}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(session.expectedClosingBalance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {session.discrepancy ? (
                          <span
                            className={
                              session.discrepancy === 0
                                ? "text-emerald-700"
                                : session.discrepancy > 0
                                  ? "text-amber-700"
                                  : "text-rose-700"
                            }
                          >
                            {formatMoney(session.discrepancy)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
