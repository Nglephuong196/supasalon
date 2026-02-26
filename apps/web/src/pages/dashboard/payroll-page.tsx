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
import { employeesService } from "@/services/employees.service";
import {
  type PayrollItem,
  type PayrollPaymentMethod,
  type PayrollSalaryType,
  payrollService,
} from "@/services/payroll.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, FileCheck2, HandCoins, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NONE_OPTION_VALUE = "__none__";

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

type ItemDraft = {
  bonusAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  advanceAmount: string;
  paymentMethod: PayrollPaymentMethod;
  notes: string;
};

function staffLabel(staff: { id: string; user?: { name?: string | null; email?: string | null } }) {
  return staff.user?.name || staff.user?.email || staff.id;
}

export function PayrollPage() {
  const queryClient = useQueryClient();

  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return toDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [toDate, setToDate] = useState(() => toDateInput(new Date()));
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "finalized" | "paid">("all");

  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [previewRows, setPreviewRows] = useState<Array<{ staffId: string; staffName: string; netAmount: number }>>(
    [],
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const [configStaffId, setConfigStaffId] = useState("");
  const [configBranchId, setConfigBranchId] = useState<string>("global");
  const [configSalaryType, setConfigSalaryType] = useState<PayrollSalaryType>("monthly");
  const [configBaseSalary, setConfigBaseSalary] = useState("0");
  const [configAllowance, setConfigAllowance] = useState("0");
  const [configDeduction, setConfigDeduction] = useState("0");
  const [configAdvance, setConfigAdvance] = useState("0");
  const [configPaymentMethod, setConfigPaymentMethod] = useState<PayrollPaymentMethod>("transfer");
  const [configNotes, setConfigNotes] = useState("");

  const [itemDrafts, setItemDrafts] = useState<Record<number, ItemDraft>>({});

  useEffect(() => {
    document.title = "Bảng lương | SupaSalon";
  }, []);

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches,
    queryFn: () => branchesService.list(),
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.employees,
    queryFn: () => employeesService.list(),
  });

  const cyclesQuery = useQuery({
    queryKey: queryKeys.payrollCycles(
      branchFilter === "all" ? undefined : Number(branchFilter),
      statusFilter === "all" ? undefined : statusFilter,
      fromDate,
      toDate,
    ),
    queryFn: () =>
      payrollService.listCycles({
        branchId: branchFilter === "all" ? undefined : Number(branchFilter),
        status: statusFilter === "all" ? undefined : statusFilter,
        from: fromDate,
        to: toDate,
      }),
  });

  const configsQuery = useQuery({
    queryKey: queryKeys.payrollConfigs(
      configBranchId !== "global" ? Number(configBranchId) : undefined,
      configStaffId || undefined,
    ),
    queryFn: () =>
      payrollService.listConfigs({
        branchId: configBranchId !== "global" ? Number(configBranchId) : undefined,
        staffId: configStaffId || undefined,
      }),
  });

  const cycleItemsQuery = useQuery({
    queryKey: queryKeys.payrollCycleItems(selectedCycleId ?? undefined),
    queryFn: () => payrollService.listItems(Number(selectedCycleId)),
    enabled: Boolean(selectedCycleId),
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      payrollService.previewCycle({
        from: new Date(`${fromDate}T00:00:00`).toISOString(),
        to: new Date(`${toDate}T23:59:59.999`).toISOString(),
        branchId: branchFilter === "all" ? undefined : Number(branchFilter),
      }),
  });

  const createCycleMutation = useMutation({
    mutationFn: () =>
      payrollService.createCycle({
        from: new Date(`${fromDate}T00:00:00`).toISOString(),
        to: new Date(`${toDate}T23:59:59.999`).toISOString(),
        branchId: branchFilter === "all" ? undefined : Number(branchFilter),
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["payroll-cycles"] });
      setSelectedCycleId(created.id);
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: () =>
      payrollService.saveConfig({
        staffId: configStaffId,
        branchId: configBranchId === "global" ? undefined : Number(configBranchId),
        salaryType: configSalaryType,
        baseSalary: Number(configBaseSalary),
        defaultAllowance: Number(configAllowance),
        defaultDeduction: Number(configDeduction),
        defaultAdvance: Number(configAdvance),
        paymentMethod: configPaymentMethod,
        notes: configNotes.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payroll-configs"] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ItemDraft> }) =>
      payrollService.updateItem(id, {
        bonusAmount:
          typeof payload.bonusAmount === "string" ? Number(payload.bonusAmount || 0) : undefined,
        allowanceAmount:
          typeof payload.allowanceAmount === "string"
            ? Number(payload.allowanceAmount || 0)
            : undefined,
        deductionAmount:
          typeof payload.deductionAmount === "string"
            ? Number(payload.deductionAmount || 0)
            : undefined,
        advanceAmount:
          typeof payload.advanceAmount === "string" ? Number(payload.advanceAmount || 0) : undefined,
        notes: payload.notes,
        paymentMethod: payload.paymentMethod,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.payrollCycleItems(selectedCycleId ?? undefined),
      });
      await queryClient.invalidateQueries({ queryKey: ["payroll-cycles"] });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (cycleId: number) => payrollService.finalizeCycle(cycleId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payroll-cycles"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.payrollCycleItems(selectedCycleId ?? undefined) }),
      ]);
    },
  });

  const payMutation = useMutation({
    mutationFn: (cycleId: number) => payrollService.payCycle(cycleId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payroll-cycles"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.payrollCycleItems(selectedCycleId ?? undefined) }),
      ]);
    },
  });

  const branches = branchesQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const cycles = cyclesQuery.data ?? [];
  const configs = configsQuery.data ?? [];
  const cycleItems = cycleItemsQuery.data ?? [];

  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId],
  );

  useEffect(() => {
    const firstCycleId = cycles[0]?.id;
    if (!selectedCycleId && firstCycleId) {
      setSelectedCycleId(firstCycleId);
    }
  }, [cycles, selectedCycleId]);

  useEffect(() => {
    const drafts: Record<number, ItemDraft> = {};
    for (const item of cycleItems) {
      drafts[item.id] = {
        bonusAmount: String(item.bonusAmount ?? 0),
        allowanceAmount: String(item.allowanceAmount ?? 0),
        deductionAmount: String(item.deductionAmount ?? 0),
        advanceAmount: String(item.advanceAmount ?? 0),
        paymentMethod: item.paymentMethod,
        notes: item.notes ?? "",
      };
    }
    setItemDrafts(drafts);
  }, [cycleItems]);

  const saving =
    previewMutation.isPending ||
    createCycleMutation.isPending ||
    saveConfigMutation.isPending ||
    updateItemMutation.isPending ||
    finalizeMutation.isPending ||
    payMutation.isPending;

  const error =
    actionError ??
    (branchesQuery.error instanceof Error ? branchesQuery.error.message : null) ??
    (membersQuery.error instanceof Error ? membersQuery.error.message : null) ??
    (configsQuery.error instanceof Error ? configsQuery.error.message : null) ??
    (cyclesQuery.error instanceof Error ? cyclesQuery.error.message : null) ??
    (cycleItemsQuery.error instanceof Error ? cycleItemsQuery.error.message : null) ??
    (previewMutation.error instanceof Error ? previewMutation.error.message : null) ??
    (createCycleMutation.error instanceof Error ? createCycleMutation.error.message : null) ??
    (saveConfigMutation.error instanceof Error ? saveConfigMutation.error.message : null) ??
    (updateItemMutation.error instanceof Error ? updateItemMutation.error.message : null) ??
    (finalizeMutation.error instanceof Error ? finalizeMutation.error.message : null) ??
    (payMutation.error instanceof Error ? payMutation.error.message : null);

  const totals = useMemo(() => {
    const previewTotal = previewRows.reduce((sum, row) => sum + Number(row.netAmount || 0), 0);
    const cycleTotal = cycleItems.reduce((sum, item) => sum + Number(item.netAmount || 0), 0);
    return {
      cycleTotal,
      previewTotal,
      staffCount: cycleItems.length,
    };
  }, [cycleItems, previewRows]);

  function getItemDraft(item: PayrollItem): ItemDraft {
    return (
      itemDrafts[item.id] ?? {
        bonusAmount: String(item.bonusAmount ?? 0),
        allowanceAmount: String(item.allowanceAmount ?? 0),
        deductionAmount: String(item.deductionAmount ?? 0),
        advanceAmount: String(item.advanceAmount ?? 0),
        paymentMethod: item.paymentMethod,
        notes: item.notes ?? "",
      }
    );
  }

  function setItemDraft(itemId: number, patch: Partial<ItemDraft>) {
    setItemDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? {
          bonusAmount: "0",
          allowanceAmount: "0",
          deductionAmount: "0",
          advanceAmount: "0",
          paymentMethod: "transfer",
          notes: "",
        }),
        ...patch,
      },
    }));
  }

  async function previewCycle() {
    setActionError(null);
    try {
      const preview = await previewMutation.mutateAsync();
      setPreviewRows(
        preview.map((row) => ({
          staffId: row.staffId,
          staffName: row.staffName,
          netAmount: row.netAmount,
        })),
      );
    } catch {
      // handled by mutation state
    }
  }

  async function createCycle() {
    setActionError(null);
    try {
      await createCycleMutation.mutateAsync();
      setPreviewRows([]);
    } catch {
      // handled by mutation state
    }
  }

  async function saveConfig() {
    if (!configStaffId) {
      setActionError("Vui lòng chọn nhân viên để lưu cấu hình lương");
      return;
    }

    const baseSalary = Number(configBaseSalary);
    if (!Number.isFinite(baseSalary) || baseSalary < 0) {
      setActionError("Lương cơ bản không hợp lệ");
      return;
    }

    setActionError(null);
    try {
      await saveConfigMutation.mutateAsync();
      setConfigNotes("");
    } catch {
      // handled by mutation state
    }
  }

  async function saveItem(item: PayrollItem) {
    const draft = getItemDraft(item);
    setActionError(null);
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: draft,
      });
    } catch {
      // handled by mutation state
    }
  }

  async function finalizeCycle() {
    if (!selectedCycleId) return;
    setActionError(null);
    try {
      await finalizeMutation.mutateAsync(selectedCycleId);
    } catch {
      // handled by mutation state
    }
  }

  async function payCycle() {
    if (!selectedCycleId) return;
    const ok = window.confirm("Xác nhận đánh dấu đã chi trả toàn bộ kỳ lương này?");
    if (!ok) return;

    setActionError(null);
    try {
      await payMutation.mutateAsync(selectedCycleId);
    } catch {
      // handled by mutation state
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Bảng lương nhân sự</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý cấu hình lương, tạo kỳ lương theo chi nhánh và chi trả cho nhân viên.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-3 rounded-xl border bg-white p-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
        <div className="grid gap-1">
          <Label>Từ ngày</Label>
          <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Đến ngày</Label>
          <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Chi nhánh</Label>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger>
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
        <div className="grid gap-1">
          <Label>Trạng thái kỳ</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | "draft" | "finalized" | "paid")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="finalized">Đã chốt</SelectItem>
              <SelectItem value="paid">Đã chi trả</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={() => void previewCycle()} disabled={saving}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            Xem trước
          </Button>
        </div>
        <div className="flex items-end">
          <Button onClick={() => void createCycle()} disabled={saving}>
            <FileCheck2 className="mr-1.5 h-4 w-4" />
            Tạo kỳ lương
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Danh sách kỳ lương</h2>
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kỳ</TableHead>
                  <TableHead>Chi nhánh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Nhân sự</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cyclesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : cycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Chưa có kỳ lương
                    </TableCell>
                  </TableRow>
                ) : (
                  cycles.map((cycle) => (
                    <TableRow
                      key={cycle.id}
                      className={selectedCycleId === cycle.id ? "bg-muted/30" : ""}
                      onClick={() => setSelectedCycleId(cycle.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{cycle.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(cycle.fromDate).toLocaleDateString("vi-VN")} -{" "}
                          {new Date(cycle.toDate).toLocaleDateString("vi-VN")}
                        </div>
                      </TableCell>
                      <TableCell>{cycle.branch?.name || "Toàn hệ thống"}</TableCell>
                      <TableCell>
                        {cycle.status === "draft" ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Nháp
                          </span>
                        ) : cycle.status === "finalized" ? (
                          <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            Đã chốt
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Đã trả
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{cycle.items?.length ?? 0}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Kết quả xem trước</h2>
          <div className="max-h-[320px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-right">Lương thực nhận</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                      Nhấn "Xem trước" để tính tạm kỳ lương
                    </TableCell>
                  </TableRow>
                ) : (
                  previewRows.map((row) => (
                    <TableRow key={row.staffId}>
                      <TableCell>{row.staffName}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(row.netAmount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
            <div>
              <div className="text-muted-foreground">Nhân sự kỳ hiện tại</div>
              <div className="font-medium">{totals.staffCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tổng preview</div>
              <div className="font-medium">{formatMoney(totals.previewTotal)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tổng kỳ đang chọn</div>
              <div className="font-medium">{formatMoney(totals.cycleTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold">Cấu hình lương mặc định</h2>
        <div className="grid gap-3 lg:grid-cols-6">
          <div className="grid gap-1 lg:col-span-2">
            <Label>Nhân viên</Label>
            <Select
              value={configStaffId || NONE_OPTION_VALUE}
              onValueChange={(value) => setConfigStaffId(value === NONE_OPTION_VALUE ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_OPTION_VALUE}>Chọn nhân viên</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {staffLabel(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Chi nhánh áp dụng</Label>
            <Select value={configBranchId} onValueChange={setConfigBranchId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Toàn hệ thống</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Hình thức lương</Label>
            <Select
              value={configSalaryType}
              onValueChange={(value) => setConfigSalaryType(value as PayrollSalaryType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Theo tháng</SelectItem>
                <SelectItem value="daily">Theo ngày</SelectItem>
                <SelectItem value="hourly">Theo giờ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Lương cơ bản</Label>
            <Input
              type="number"
              min={0}
              step="1000"
              value={configBaseSalary}
              onChange={(event) => setConfigBaseSalary(event.target.value)}
            />
          </div>

          <div className="grid gap-1">
            <Label>Phương thức trả</Label>
            <Select
              value={configPaymentMethod}
              onValueChange={(value) => setConfigPaymentMethod(value as PayrollPaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Chuyển khoản</SelectItem>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="card">Thẻ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="grid gap-1">
            <Label>Phụ cấp mặc định</Label>
            <Input
              type="number"
              min={0}
              step="1000"
              value={configAllowance}
              onChange={(event) => setConfigAllowance(event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Khấu trừ mặc định</Label>
            <Input
              type="number"
              min={0}
              step="1000"
              value={configDeduction}
              onChange={(event) => setConfigDeduction(event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Tạm ứng mặc định</Label>
            <Input
              type="number"
              min={0}
              step="1000"
              value={configAdvance}
              onChange={(event) => setConfigAdvance(event.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Ghi chú</Label>
            <Input value={configNotes} onChange={(event) => setConfigNotes(event.target.value)} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Button onClick={() => void saveConfig()} disabled={saving}>
            <CircleDollarSign className="mr-1.5 h-4 w-4" />
            Lưu cấu hình lương
          </Button>
          <span className="text-sm text-muted-foreground">Đã lưu: {configs.length} cấu hình</span>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Dòng lương chi tiết</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCycle
                ? `Kỳ đang chọn: ${selectedCycle.name}`
                : "Chọn kỳ lương để xem và chỉnh các dòng chi trả"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => void finalizeCycle()}
              disabled={!selectedCycleId || selectedCycle?.status !== "draft" || saving}
            >
              <HandCoins className="mr-1.5 h-4 w-4" />
              Chốt kỳ
            </Button>
            <Button
              onClick={() => void payCycle()}
              disabled={!selectedCycleId || selectedCycle?.status === "paid" || saving}
            >
              Chi trả kỳ
            </Button>
          </div>
        </div>

        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead className="text-right">Lương cơ bản</TableHead>
                <TableHead className="text-right">Hoa hồng</TableHead>
                <TableHead className="text-right">Thưởng</TableHead>
                <TableHead className="text-right">Phụ cấp</TableHead>
                <TableHead className="text-right">Khấu trừ</TableHead>
                <TableHead className="text-right">Tạm ứng</TableHead>
                <TableHead className="text-right">Thực nhận</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-right">Lưu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedCycleId ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                    Chọn kỳ lương để hiển thị dữ liệu
                  </TableCell>
                </TableRow>
              ) : cycleItemsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : cycleItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                    Kỳ lương chưa có dòng dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                cycleItems.map((item) => {
                  const draft = getItemDraft(item);
                  const canEdit = selectedCycle?.status !== "paid";

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{staffLabel(item.staff ?? { id: item.staffId })}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.baseSalary)}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.commissionAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          min={0}
                          step="1000"
                          value={draft.bonusAmount}
                          onChange={(event) => setItemDraft(item.id, { bonusAmount: event.target.value })}
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          min={0}
                          step="1000"
                          value={draft.allowanceAmount}
                          onChange={(event) =>
                            setItemDraft(item.id, { allowanceAmount: event.target.value })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          min={0}
                          step="1000"
                          value={draft.deductionAmount}
                          onChange={(event) =>
                            setItemDraft(item.id, { deductionAmount: event.target.value })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right"
                          type="number"
                          min={0}
                          step="1000"
                          value={draft.advanceAmount}
                          onChange={(event) =>
                            setItemDraft(item.id, { advanceAmount: event.target.value })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(item.netAmount)}</TableCell>
                      <TableCell>
                        <Select
                          value={draft.paymentMethod}
                          onValueChange={(value) =>
                            setItemDraft(item.id, { paymentMethod: value as PayrollPaymentMethod })
                          }
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transfer">Chuyển khoản</SelectItem>
                            <SelectItem value="cash">Tiền mặt</SelectItem>
                            <SelectItem value="card">Thẻ</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 min-w-40"
                          value={draft.notes}
                          onChange={(event) => setItemDraft(item.id, { notes: event.target.value })}
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void saveItem(item)}
                            disabled={!canEdit || saving}
                          >
                            Lưu
                          </Button>
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
