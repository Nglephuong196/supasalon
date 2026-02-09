import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Shield, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-client";
import {
  permissionGroups,
  settingsService,
  type MembershipTier,
  type PermissionMap,
} from "@/services/settings.service";
import type { EmployeeMember } from "@/services/employees.service";

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

type Tab = "tiers" | "permissions" | "commissions";

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
      await queryClient.invalidateQueries({ queryKey: queryKeys.settingsBundle });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Omit<MembershipTier, "id">> }) =>
      settingsService.updateTier(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settingsBundle });
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: (id: number) => settingsService.deleteTier(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settingsBundle });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ memberId, permissions }: { memberId: string; permissions: PermissionMap }) =>
      settingsService.updateMemberPermissions(memberId, permissions),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settingsBundle });
    },
  });

  const upsertRuleMutation = useMutation({
    mutationFn: (
      payload: {
        staffId: string;
        itemType: "service" | "product";
        itemId: number;
        commissionType: "percent" | "fixed";
        commissionValue: number;
      },
    ) => settingsService.upsertCommissionRule(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settingsBundle });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => settingsService.deleteCommissionRule(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settingsBundle });
    },
  });

  const tiers = bundleQuery.data?.tiers ?? [];
  const members = bundleQuery.data?.members ?? [];
  const services = (bundleQuery.data?.services ?? []).map((item) => ({ id: item.id, name: item.name }));
  const products = (bundleQuery.data?.products ?? []).map((item) => ({ id: item.id, name: item.name }));
  const rules = bundleQuery.data?.commissionRules ?? [];

  const loading = bundleQuery.isLoading;
  const saving =
    createTierMutation.isPending ||
    updateTierMutation.isPending ||
    deleteTierMutation.isPending ||
    updatePermissionsMutation.isPending ||
    upsertRuleMutation.isPending ||
    deleteRuleMutation.isPending;

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
    (deleteRuleMutation.error instanceof Error ? deleteRuleMutation.error.message : null);

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
        await updateTierMutation.mutateAsync({ id: tierEditing.id, payload });
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
    setPermissionDraft((prev) => ({ ...prev, [resource]: Array.from(current) }));
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

  const itemOptions = useMemo(() => {
    return ruleForm.itemType === "service" ? services : products;
  }, [products, ruleForm.itemType, services]);

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
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Tên</th>
                  <th className="px-3 py-2 text-right">Chi tiêu tối thiểu</th>
                  <th className="px-3 py-2 text-right">Ưu đãi</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.id} className="border-t">
                    <td className="px-3 py-2">{tier.name}</td>
                    <td className="px-3 py-2 text-right">
                      {tier.minSpending.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-3 py-2 text-right">{tier.discountPercent}%</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEditTier(tier)}>
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setTierDeleteId(tier.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "permissions" ? (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-semibold">Quyền theo thành viên</h2>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Thành viên</th>
                  <th className="px-3 py-2 text-left">Vai trò</th>
                  <th className="px-3 py-2 text-left">Số quyền</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const count = Object.values(member.permissions?.[0]?.permissions || {}).reduce(
                    (sum, actions) => sum + actions.length,
                    0,
                  );
                  return (
                    <tr key={member.id} className="border-t">
                      <td className="px-3 py-2">
                        {member.user?.name || member.user?.email || member.id}
                      </td>
                      <td className="px-3 py-2">{member.role}</td>
                      <td className="px-3 py-2">{count}</td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="outline" size="sm" onClick={() => openPermissions(member)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Phân quyền
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                <select
                  className="h-10 rounded-md border px-3 text-sm"
                  value={ruleForm.staffId}
                  onChange={(event) =>
                    setRuleForm((prev) => ({ ...prev, staffId: event.target.value }))
                  }
                >
                  <option value="">Chọn nhân viên</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.user?.name || member.user?.email || member.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Loại mục</Label>
                  <select
                    className="h-10 rounded-md border px-3 text-sm"
                    value={ruleForm.itemType}
                    onChange={(event) =>
                      setRuleForm((prev) => ({
                        ...prev,
                        itemType: event.target.value as "service" | "product",
                        itemId: "",
                      }))
                    }
                  >
                    <option value="service">Dịch vụ</option>
                    <option value="product">Sản phẩm</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Mục</Label>
                  <select
                    className="h-10 rounded-md border px-3 text-sm"
                    value={ruleForm.itemId}
                    onChange={(event) =>
                      setRuleForm((prev) => ({ ...prev, itemId: event.target.value }))
                    }
                  >
                    <option value="">Chọn mục</option>
                    {itemOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Loại hoa hồng</Label>
                  <select
                    className="h-10 rounded-md border px-3 text-sm"
                    value={ruleForm.commissionType}
                    onChange={(event) =>
                      setRuleForm((prev) => ({
                        ...prev,
                        commissionType: event.target.value as "percent" | "fixed",
                      }))
                    }
                  >
                    <option value="percent">Phần trăm</option>
                    <option value="fixed">Cố định</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Giá trị</Label>
                  <Input
                    type="number"
                    value={ruleForm.commissionValue}
                    onChange={(event) =>
                      setRuleForm((prev) => ({ ...prev, commissionValue: event.target.value }))
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
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Nhân viên</th>
                    <th className="px-3 py-2 text-left">Mục</th>
                    <th className="px-3 py-2 text-right">Hoa hồng</th>
                    <th className="px-3 py-2 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => {
                    const member = members.find((item) => item.id === rule.staffId);
                    const itemName =
                      rule.itemType === "service"
                        ? services.find((item) => item.id === rule.itemId)?.name
                        : products.find((item) => item.id === rule.itemId)?.name;
                    return (
                      <tr key={rule.id} className="border-t">
                        <td className="px-3 py-2">
                          {member?.user?.name || member?.user?.email || rule.staffId}
                        </td>
                        <td className="px-3 py-2">
                          {rule.itemType}: {itemName || `#${rule.itemId}`}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {rule.commissionValue}
                          {rule.commissionType === "percent" ? "%" : "đ"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => void deleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
              onChange={(event) => setTierForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Chi tiêu tối thiểu</Label>
              <Input
                type="number"
                value={tierForm.minSpending}
                onChange={(event) =>
                  setTierForm((prev) => ({ ...prev, minSpending: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Giảm giá (%)</Label>
              <Input
                type="number"
                value={tierForm.discountPercent}
                onChange={(event) =>
                  setTierForm((prev) => ({ ...prev, discountPercent: event.target.value }))
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
                  setTierForm((prev) => ({ ...prev, minSpendingToMaintain: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Thứ tự</Label>
              <Input
                type="number"
                value={tierForm.sortOrder}
                onChange={(event) =>
                  setTierForm((prev) => ({ ...prev, sortOrder: event.target.value }))
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
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Resource</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissionGroups.map((group) => (
                  <tr key={group.resource} className="border-t align-top">
                    <td className="px-3 py-2 font-medium">{group.label}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-3">
                        {group.actions.map((action) => (
                          <label
                            key={`${group.resource}-${action}`}
                            className="inline-flex items-center gap-2 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={hasPermission(group.resource, action)}
                              onChange={(event) =>
                                togglePermission(group.resource, action, event.target.checked)
                              }
                            />
                            {action}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
