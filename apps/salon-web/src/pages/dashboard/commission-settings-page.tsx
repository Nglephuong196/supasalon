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
import { type CommissionRule, settingsService } from "@/services/settings.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  staffId: "",
  itemType: "service" as "service" | "product",
  itemId: "",
  commissionType: "percent" as "percent" | "fixed",
  commissionValue: "0",
};
const NONE_OPTION_VALUE = "__none__";

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
    mutationFn: (payload: Omit<CommissionRule, "id">) =>
      settingsService.upsertCommissionRule(payload),
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

  const rules = bundleQuery.data?.commissionRules ?? [];
  const members: EmployeeMember[] = bundleQuery.data?.members ?? [];
  const services = (bundleQuery.data?.services ?? []).map((item) => ({
    id: item.id,
    name: item.name,
  }));
  const products = (bundleQuery.data?.products ?? []).map((item) => ({
    id: item.id,
    name: item.name,
  }));

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

  const ruleColumns: Array<ColumnDef<CommissionRule>> = [
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
      id: "value",
      header: "Giá trị",
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
          onClick={() => void removeRule(row.original.id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ];

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
              <Select
                value={form.staffId || NONE_OPTION_VALUE}
                onValueChange={(value) =>
                  setForm((prev) => ({
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
                  value={form.itemType}
                  onValueChange={(value) =>
                    setForm((prev) => ({
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
                  value={form.itemId || NONE_OPTION_VALUE}
                  onValueChange={(value) =>
                    setForm((prev) => ({
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
                <Label>Kiểu</Label>
                <Select
                  value={form.commissionType}
                  onValueChange={(value) =>
                    setForm((prev) => ({
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
                  value={form.commissionValue}
                  onChange={(event) =>
                    setForm((prev) => ({
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
            <DataTable
              data={rules}
              columns={ruleColumns}
              loading={loading}
              emptyMessage="Chưa có quy tắc"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
