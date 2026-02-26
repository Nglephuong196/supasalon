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
import type { EmployeeMember } from "@/services/employees.service";
import {
  type MembershipTier,
  type PermissionMap,
  permissionGroups,
  settingsService,
} from "@/services/settings.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Save, Shield, Trash2, X } from "lucide-react";
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

type Tab = "tiers" | "permissions" | "commissions" | "booking-rules";

const emptyTier = {
  name: "",
  minSpending: "0",
  discountPercent: "0",
  minSpendingToMaintain: "0",
  sortOrder: "0",
};

const emptyRule = {
  staffId: "",
  itemType: "service" as "service" | "product",
  itemId: "",
  commissionType: "percent" as "percent" | "fixed",
  commissionValue: "0",
};
const NONE_OPTION_VALUE = "__none__";

const defaultBookingPolicyForm = {
  preventStaffOverlap: true,
  bufferMinutes: "0",
  requireDeposit: false,
  defaultDepositAmount: "0",
  cancellationWindowHours: "2",
};

export function SettingsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("tiers");
  const [actionError, setActionError] = useState<string | null>(null);

  const [tierForm, setTierForm] = useState(emptyTier);
  const [tierEditing, setTierEditing] = useState<MembershipTier | null>(null);
  const [tierDeleteId, setTierDeleteId] = useState<number | null>(null);
  const [tierOpen, setTierOpen] = useState(false);

  const [permissionMember, setPermissionMember] = useState<EmployeeMember | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<PermissionMap>({});
  const [permissionOpen, setPermissionOpen] = useState(false);

  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [bookingPolicyForm, setBookingPolicyForm] = useState(defaultBookingPolicyForm);

  useEffect(() => {
    document.title = "Cài đặt | SupaSalon";
  }, []);

  const bundleQuery = useQuery({
    queryKey: queryKeys.settingsBundle,
    queryFn: () => settingsService.listBundle(),
  });

  const createTierMutation = useMutation({
    mutationFn: (payload: Omit<MembershipTier, "id">) => settingsService.createTier(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settingsBundle,
      });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<Omit<MembershipTier, "id">>;
    }) => settingsService.updateTier(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settingsBundle,
      });
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: (id: number) => settingsService.deleteTier(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settingsBundle,
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({
      memberId,
      permissions,
    }: {
      memberId: string;
      permissions: PermissionMap;
    }) => settingsService.updateMemberPermissions(memberId, permissions),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settingsBundle,
      });
    },
  });

  const upsertRuleMutation = useMutation({
    mutationFn: (payload: {
      staffId: string;
      itemType: "service" | "product";
      itemId: number;
      commissionType: "percent" | "fixed";
      commissionValue: number;
    }) => settingsService.upsertCommissionRule(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settingsBundle,
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => settingsService.deleteCommissionRule(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settingsBundle,
      });
    },
  });

  const updateBookingPolicyMutation = useMutation({
    mutationFn: (payload: {
      preventStaffOverlap: boolean;
      bufferMinutes: number;
      requireDeposit: boolean;
      defaultDepositAmount: number;
      cancellationWindowHours: number;
    }) => settingsService.updateBookingPolicy(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settingsBundle,
      });
    },
  });

  const tiers = bundleQuery.data?.tiers ?? [];
  const members = bundleQuery.data?.members ?? [];
  const services = (bundleQuery.data?.services ?? []).map((item) => ({
    id: item.id,
    name: item.name,
  }));
  const products = (bundleQuery.data?.products ?? []).map((item) => ({
    id: item.id,
    name: item.name,
  }));
  const rules = bundleQuery.data?.commissionRules ?? [];
  const bookingPolicy = bundleQuery.data?.bookingPolicy;

  useEffect(() => {
    if (!bookingPolicy) return;
    setBookingPolicyForm({
      preventStaffOverlap: bookingPolicy.preventStaffOverlap,
      bufferMinutes: String(bookingPolicy.bufferMinutes ?? 0),
      requireDeposit: bookingPolicy.requireDeposit,
      defaultDepositAmount: String(bookingPolicy.defaultDepositAmount ?? 0),
      cancellationWindowHours: String(bookingPolicy.cancellationWindowHours ?? 2),
    });
  }, [bookingPolicy]);

  const loading = bundleQuery.isLoading;
  const saving =
    createTierMutation.isPending ||
    updateTierMutation.isPending ||
    deleteTierMutation.isPending ||
    updatePermissionsMutation.isPending ||
    upsertRuleMutation.isPending ||
    deleteRuleMutation.isPending ||
    updateBookingPolicyMutation.isPending;

  const error =
    actionError ??
    (bundleQuery.error instanceof Error ? bundleQuery.error.message : null) ??
    (createTierMutation.error instanceof Error ? createTierMutation.error.message : null) ??
    (updateTierMutation.error instanceof Error ? updateTierMutation.error.message : null) ??
    (deleteTierMutation.error instanceof Error ? deleteTierMutation.error.message : null) ??
    (updatePermissionsMutation.error instanceof Error
      ? updatePermissionsMutation.error.message
      : null) ??
    (upsertRuleMutation.error instanceof Error ? upsertRuleMutation.error.message : null) ??
    (deleteRuleMutation.error instanceof Error ? deleteRuleMutation.error.message : null) ??
    (updateBookingPolicyMutation.error instanceof Error
      ? updateBookingPolicyMutation.error.message
      : null);

  function openCreateTier() {
    setTierEditing(null);
    setTierForm({ ...emptyTier, sortOrder: String(tiers.length) });
    setTierOpen(true);
  }

  function openEditTier(tier: MembershipTier) {
    setTierEditing(tier);
    setTierForm({
      name: tier.name,
      minSpending: String(tier.minSpending),
      discountPercent: String(tier.discountPercent),
      minSpendingToMaintain: String(tier.minSpendingToMaintain ?? 0),
      sortOrder: String(tier.sortOrder),
    });
    setTierOpen(true);
  }

  async function saveTier(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const payload = {
      name: tierForm.name.trim(),
      minSpending: Number(tierForm.minSpending),
      discountPercent: Number(tierForm.discountPercent),
      minSpendingToMaintain: Number(tierForm.minSpendingToMaintain) || null,
      sortOrder: Number(tierForm.sortOrder),
    };

    if (!payload.name) {
      setActionError("Vui lòng nhập tên hạng");
      return;
    }

    setActionError(null);
    try {
      if (tierEditing) {
        await updateTierMutation.mutateAsync({
          id: tierEditing.id,
          payload,
        });
      } else {
        await createTierMutation.mutateAsync(payload);
      }
      setTierOpen(false);
      setTierEditing(null);
      setTierForm(emptyTier);
    } catch {
      // handled by mutation state
    }
  }

  async function deleteTier() {
    if (!tierDeleteId) return;
    setActionError(null);
    try {
      await deleteTierMutation.mutateAsync(tierDeleteId);
      setTierDeleteId(null);
    } catch {
      // handled by mutation state
    }
  }

  function openPermissions(member: EmployeeMember) {
    setPermissionMember(member);
    const existing = member.permissions?.[0]?.permissions;
    setPermissionDraft(existing ? { ...existing } : {});
    setPermissionOpen(true);
  }

  function hasPermission(resource: string, action: string) {
    return (permissionDraft[resource] || []).includes(action);
  }

  function togglePermission(resource: string, action: string, enabled: boolean) {
    const current = new Set(permissionDraft[resource] || []);
    if (enabled) current.add(action);
    else current.delete(action);
    setPermissionDraft((prev) => ({
      ...prev,
      [resource]: Array.from(current),
    }));
  }

  async function savePermissions() {
    if (!permissionMember) return;
    setActionError(null);
    try {
      await updatePermissionsMutation.mutateAsync({
        memberId: permissionMember.id,
        permissions: permissionDraft,
      });
      setPermissionOpen(false);
      setPermissionMember(null);
    } catch {
      // handled by mutation state
    }
  }

  async function createCommissionRule(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const itemId = Number(ruleForm.itemId);
    const commissionValue = Number(ruleForm.commissionValue);

    if (!ruleForm.staffId || !Number.isInteger(itemId) || itemId <= 0) {
      setActionError("Thiếu thông tin nhân viên hoặc dịch vụ/sản phẩm");
      return;
    }

    setActionError(null);
    try {
      await upsertRuleMutation.mutateAsync({
        staffId: ruleForm.staffId,
        itemType: ruleForm.itemType,
        itemId,
        commissionType: ruleForm.commissionType,
        commissionValue,
      });
      setRuleForm(emptyRule);
    } catch {
      // handled by mutation state
    }
  }

  async function deleteRule(id: number) {
    setActionError(null);
    try {
      await deleteRuleMutation.mutateAsync(id);
    } catch {
      // handled by mutation state
    }
  }

  async function saveBookingPolicy() {
    const bufferMinutes = Number(bookingPolicyForm.bufferMinutes);
    const defaultDepositAmount = Number(bookingPolicyForm.defaultDepositAmount);
    const cancellationWindowHours = Number(bookingPolicyForm.cancellationWindowHours);

    if (!Number.isFinite(bufferMinutes) || bufferMinutes < 0) {
      setActionError("Buffer phút không hợp lệ");
      return;
    }
    if (!Number.isFinite(defaultDepositAmount) || defaultDepositAmount < 0) {
      setActionError("Mức cọc mặc định không hợp lệ");
      return;
    }
    if (!Number.isFinite(cancellationWindowHours) || cancellationWindowHours < 0) {
      setActionError("Giờ hủy miễn phí không hợp lệ");
      return;
    }

    setActionError(null);
    try {
      await updateBookingPolicyMutation.mutateAsync({
        preventStaffOverlap: bookingPolicyForm.preventStaffOverlap,
        bufferMinutes,
        requireDeposit: bookingPolicyForm.requireDeposit,
        defaultDepositAmount,
        cancellationWindowHours,
      });
    } catch {
      // handled by mutation state
    }
  }

  const itemOptions = useMemo(() => {
    return ruleForm.itemType === "service" ? services : products;
  }, [products, ruleForm.itemType, services]);

  const tierColumns: Array<ColumnDef<MembershipTier>> = [
    {
      accessorKey: "name",
      header: "Tên",
    },
    {
      id: "minSpending",
      header: "Chi tiêu tối thiểu",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) => `${row.original.minSpending.toLocaleString("vi-VN")}đ`,
    },
    {
      id: "discountPercent",
      header: "Ưu đãi",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) => `${row.original.discountPercent}%`,
    },
    {
      id: "actions",
      header: "Thao tác",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="outline" size="sm" onClick={() => openEditTier(row.original)}>
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTierDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const memberPermissionColumns: Array<ColumnDef<EmployeeMember>> = [
    {
      id: "member",
      header: "Thành viên",
      cell: ({ row }) => row.original.user?.name || row.original.user?.email || row.original.id,
    },
    {
      accessorKey: "role",
      header: "Vai trò",
    },
    {
      id: "count",
      header: "Số quyền",
      cell: ({ row }) =>
        Object.values(row.original.permissions?.[0]?.permissions || {}).reduce(
          (sum, actions) => sum + actions.length,
          0,
        ),
    },
    {
      id: "actions",
      header: "Thao tác",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => openPermissions(row.original)}>
          <Shield className="mr-2 h-4 w-4" />
          Phân quyền
        </Button>
      ),
    },
  ];

  const ruleColumns: Array<ColumnDef<(typeof rules)[number]>> = [
    {
      id: "member",
      header: "Nhân viên",
      cell: ({ row }) => {
        const member = members.find((item) => item.id === row.original.staffId);
        return member?.user?.name || member?.user?.email || row.original.staffId;
      },
    },
    {
      id: "item",
      header: "Mục",
      cell: ({ row }) => {
        const itemName =
          row.original.itemType === "service"
            ? services.find((item) => item.id === row.original.itemId)?.name
            : products.find((item) => item.id === row.original.itemId)?.name;
        return `${row.original.itemType}: ${itemName || `#${row.original.itemId}`}`;
      },
    },
    {
      id: "commission",
      header: "Hoa hồng",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) => (
        <>
          {row.original.commissionValue}
          {row.original.commissionType === "percent" ? "%" : "đ"}
        </>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => void deleteRule(row.original.id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ];

  const permissionMatrixColumns: Array<ColumnDef<(typeof permissionGroups)[number]>> = [
    {
      id: "resource",
      header: "Resource",
      cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
      meta: { className: "align-top" },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-3">
          {row.original.actions.map((action) => (
            <label
              key={`${row.original.resource}-${action}`}
              className="inline-flex items-center gap-2 text-xs"
            >
              <input
                type="checkbox"
                checked={hasPermission(row.original.resource, action)}
                onChange={(event) =>
                  togglePermission(row.original.resource, action, event.target.checked)
                }
              />
              {action}
            </label>
          ))}
        </div>
      ),
      meta: { className: "align-top" },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý hạng khách hàng, quyền thành viên và hoa hồng
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="inline-flex w-fit rounded-xl border bg-white p-1">
        <Button
          variant={activeTab === "tiers" ? "default" : "ghost"}
          onClick={() => setActiveTab("tiers")}
        >
          Hạng khách hàng
        </Button>
        <Button
          variant={activeTab === "permissions" ? "default" : "ghost"}
          onClick={() => setActiveTab("permissions")}
        >
          Phân quyền
        </Button>
        <Button
          variant={activeTab === "commissions" ? "default" : "ghost"}
          onClick={() => setActiveTab("commissions")}
        >
          Hoa hồng
        </Button>
        <Button
          variant={activeTab === "booking-rules" ? "default" : "ghost"}
          onClick={() => setActiveTab("booking-rules")}
        >
          Quy tắc lịch hẹn
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : null}

      {!loading && activeTab === "tiers" ? (
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Hạng khách hàng</h2>
            <Button onClick={openCreateTier}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo hạng
            </Button>
          </div>
          <div className="overflow-auto rounded-lg border">
            <DataTable data={tiers} columns={tierColumns} />
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "permissions" ? (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-semibold">Quyền theo thành viên</h2>
          <div className="overflow-auto rounded-lg border">
            <DataTable data={members} columns={memberPermissionColumns} />
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "commissions" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <h2 className="mb-4 font-semibold">Tạo/ghi đè quy tắc hoa hồng</h2>
            <form className="grid gap-3" onSubmit={createCommissionRule}>
              <div className="grid gap-2">
                <Label>Nhân viên</Label>
                <Select
                  value={ruleForm.staffId || NONE_OPTION_VALUE}
                  onValueChange={(value) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      staffId: value === NONE_OPTION_VALUE ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_OPTION_VALUE}>Chọn nhân viên</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        {member.user?.name || member.user?.email || member.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Loại mục</Label>
                  <Select
                    value={ruleForm.itemType}
                    onValueChange={(value) =>
                      setRuleForm((prev) => ({
                        ...prev,
                        itemType: value as "service" | "product",
                        itemId: "",
                      }))
                    }
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
                <div className="grid gap-2">
                  <Label>Mục</Label>
                  <Select
                    value={ruleForm.itemId || NONE_OPTION_VALUE}
                    onValueChange={(value) =>
                      setRuleForm((prev) => ({
                        ...prev,
                        itemId: value === NONE_OPTION_VALUE ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>Chọn mục</SelectItem>
                      {itemOptions.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Loại hoa hồng</Label>
                  <Select
                    value={ruleForm.commissionType}
                    onValueChange={(value) =>
                      setRuleForm((prev) => ({
                        ...prev,
                        commissionType: value as "percent" | "fixed",
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Phần trăm</SelectItem>
                      <SelectItem value="fixed">Cố định</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Giá trị</Label>
                  <Input
                    type="number"
                    value={ruleForm.commissionValue}
                    onChange={(event) =>
                      setRuleForm((prev) => ({
                        ...prev,
                        commissionValue: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu quy tắc
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h2 className="mb-4 font-semibold">Danh sách quy tắc</h2>
            <div className="max-h-[420px] overflow-auto rounded-lg border">
              <DataTable data={rules} columns={ruleColumns} />
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "booking-rules" ? (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-1 font-semibold">Quy tắc lịch hẹn</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Chống trùng lịch theo nhân viên, thời gian đệm và chính sách đặt cọc mặc định.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bookingPolicyForm.preventStaffOverlap}
                onChange={(event) =>
                  setBookingPolicyForm((prev) => ({
                    ...prev,
                    preventStaffOverlap: event.target.checked,
                  }))
                }
              />
              Chặn trùng lịch theo nhân viên
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bookingPolicyForm.requireDeposit}
                onChange={(event) =>
                  setBookingPolicyForm((prev) => ({
                    ...prev,
                    requireDeposit: event.target.checked,
                  }))
                }
              />
              Yêu cầu đặt cọc cho lịch hẹn
            </label>

            <div className="grid gap-2">
              <Label>Buffer giữa lịch (phút)</Label>
              <Input
                type="number"
                min={0}
                value={bookingPolicyForm.bufferMinutes}
                onChange={(event) =>
                  setBookingPolicyForm((prev) => ({
                    ...prev,
                    bufferMinutes: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Mức cọc mặc định (₫)</Label>
              <Input
                type="number"
                min={0}
                step="1000"
                value={bookingPolicyForm.defaultDepositAmount}
                onChange={(event) =>
                  setBookingPolicyForm((prev) => ({
                    ...prev,
                    defaultDepositAmount: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Hạn hủy miễn phí (giờ)</Label>
              <Input
                type="number"
                min={0}
                value={bookingPolicyForm.cancellationWindowHours}
                onChange={(event) =>
                  setBookingPolicyForm((prev) => ({
                    ...prev,
                    cancellationWindowHours: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => void saveBookingPolicy()} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Lưu quy tắc
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        title={tierEditing ? "Cập nhật hạng" : "Tạo hạng"}
        open={tierOpen}
        onClose={() => setTierOpen(false)}
      >
        <form className="grid gap-3" onSubmit={saveTier}>
          <div className="grid gap-2">
            <Label>Tên hạng</Label>
            <Input
              value={tierForm.name}
              onChange={(event) =>
                setTierForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Chi tiêu tối thiểu</Label>
              <Input
                type="number"
                value={tierForm.minSpending}
                onChange={(event) =>
                  setTierForm((prev) => ({
                    ...prev,
                    minSpending: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Giảm giá (%)</Label>
              <Input
                type="number"
                value={tierForm.discountPercent}
                onChange={(event) =>
                  setTierForm((prev) => ({
                    ...prev,
                    discountPercent: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Chi tiêu duy trì</Label>
              <Input
                type="number"
                value={tierForm.minSpendingToMaintain}
                onChange={(event) =>
                  setTierForm((prev) => ({
                    ...prev,
                    minSpendingToMaintain: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Thứ tự</Label>
              <Input
                type="number"
                value={tierForm.sortOrder}
                onChange={(event) =>
                  setTierForm((prev) => ({
                    ...prev,
                    sortOrder: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setTierOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              Lưu
            </Button>
          </div>
        </form>
      </Modal>

      <Modal title="Xóa hạng" open={tierDeleteId !== null} onClose={() => setTierDeleteId(null)}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa hạng khách hàng này?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTierDeleteId(null)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void deleteTier()}>
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Phân quyền thành viên"
        open={permissionOpen}
        onClose={() => setPermissionOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-medium">
              {permissionMember?.user?.name ||
                permissionMember?.user?.email ||
                permissionMember?.id}
            </div>
            <div className="text-muted-foreground">Vai trò: {permissionMember?.role}</div>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-md border">
            <DataTable data={permissionGroups} columns={permissionMatrixColumns} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPermissionOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void savePermissions()} disabled={saving}>
              Lưu quyền
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
