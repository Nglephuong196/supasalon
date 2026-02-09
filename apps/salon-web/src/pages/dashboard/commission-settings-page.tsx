import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-client";
import { settingsService, type CommissionRule } from "@/services/settings.service";
import type { EmployeeMember } from "@/services/employees.service";

const emptyForm = {
  staffId: "",
  itemType: "service" as "service" | "product",
  itemId: "",
  commissionType: "percent" as "percent" | "fixed",
  commissionValue: "0",
};

export function CommissionSettingsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyForm);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Cài đặt hoa hồng | SupaSalon";
  }, []);

  const bundleQuery = useQuery({
    queryKey: queryKeys.settingsBundle,
    queryFn: () => settingsService.listBundle(),
  });

  const upsertRuleMutation = useMutation({
    mutationFn: (payload: Omit<CommissionRule, "id">) => settingsService.upsertCommissionRule(payload),
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

  const rules = bundleQuery.data?.commissionRules ?? [];
  const members: EmployeeMember[] = bundleQuery.data?.members ?? [];
  const services = (bundleQuery.data?.services ?? []).map((item) => ({ id: item.id, name: item.name }));
  const products = (bundleQuery.data?.products ?? []).map((item) => ({ id: item.id, name: item.name }));

  const loading = bundleQuery.isLoading;
  const saving = upsertRuleMutation.isPending || deleteRuleMutation.isPending;

  const error =
    actionError ??
    (bundleQuery.error instanceof Error ? bundleQuery.error.message : null) ??
    (upsertRuleMutation.error instanceof Error ? upsertRuleMutation.error.message : null) ??
    (deleteRuleMutation.error instanceof Error ? deleteRuleMutation.error.message : null);

  const itemOptions = useMemo(() => {
    return form.itemType === "service" ? services : products;
  }, [form.itemType, products, services]);

  async function submit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const itemId = Number(form.itemId);
    const value = Number(form.commissionValue);
    if (!form.staffId || !Number.isInteger(itemId) || itemId <= 0) {
      setActionError("Vui lòng chọn đầy đủ nhân viên và mục áp dụng");
      return;
    }

    setActionError(null);
    try {
      await upsertRuleMutation.mutateAsync({
        staffId: form.staffId,
        itemType: form.itemType,
        itemId,
        commissionType: form.commissionType,
        commissionValue: value,
      });
      setForm(emptyForm);
    } catch {
      // handled by mutation state
    }
  }

  async function removeRule(id: number) {
    setActionError(null);
    try {
      await deleteRuleMutation.mutateAsync(id);
    } catch {
      // handled by mutation state
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt hoa hồng</h1>
        <p className="text-muted-foreground">
          Cấu hình hoa hồng theo nhân viên và dịch vụ/sản phẩm
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-semibold">Tạo/ghi đè quy tắc</h2>
          <form className="grid gap-3" onSubmit={submit}>
            <div className="grid gap-2">
              <Label>Nhân viên</Label>
              <select
                className="h-10 rounded-md border px-3 text-sm"
                value={form.staffId}
                onChange={(event) => setForm((prev) => ({ ...prev, staffId: event.target.value }))}
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
                  value={form.itemType}
                  onChange={(event) =>
                    setForm((prev) => ({
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
                  value={form.itemId}
                  onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))}
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
                <Label>Kiểu</Label>
                <select
                  className="h-10 rounded-md border px-3 text-sm"
                  value={form.commissionType}
                  onChange={(event) =>
                    setForm((prev) => ({
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
                  value={form.commissionValue}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, commissionValue: event.target.value }))
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
                  <th className="px-3 py-2 text-right">Giá trị</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                      Đang tải...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                      Chưa có quy tắc
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => {
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
                            onClick={() => void removeRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
