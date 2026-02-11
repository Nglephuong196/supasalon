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
import { queryKeys } from "@/lib/query-client";
import { type CommissionRule, type CommissionRulePayload, settingsService } from "@/services/settings.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NONE_OPTION_VALUE = "__none__";

type ItemType = "service" | "product";
type CommissionType = "percent" | "fixed";
type ApplyTarget = "selected" | "all";
type Draft = {
  commissionType: CommissionType;
  commissionValue: string;
};

export function CommissionSettingsPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [itemType, setItemType] = useState<ItemType>("service");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [quickType, setQuickType] = useState<CommissionType>("percent");
  const [quickValue, setQuickValue] = useState("10");
  const [quickApplyTarget, setQuickApplyTarget] = useState<ApplyTarget>("selected");

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    document.title = "Cài đặt hoa hồng | SupaSalon";
  }, []);

  const bundleQuery = useQuery({
    queryKey: queryKeys.settingsBundle,
    queryFn: () => settingsService.listBundle(),
  });

  const upsertRuleMutation = useMutation({
    mutationFn: (payload: CommissionRulePayload) => settingsService.upsertCommissionRule(payload),
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

  const members = bundleQuery.data?.members ?? [];
  const services = (bundleQuery.data?.services ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    categoryId: item.categoryId,
  }));
  const products = (bundleQuery.data?.products ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    categoryId: item.categoryId,
  }));
  const serviceCategories = bundleQuery.data?.serviceCategories ?? [];
  const productCategories = bundleQuery.data?.productCategories ?? [];

  useEffect(() => {
    setRules(bundleQuery.data?.commissionRules ?? []);
  }, [bundleQuery.data?.commissionRules]);

  useEffect(() => {
    if (selectedStaffId || members.length === 0) return;
    setSelectedStaffId(members[0]?.id ?? "");
  }, [members, selectedStaffId]);

  const loading = bundleQuery.isLoading;
  const saving = upsertRuleMutation.isPending || deleteRuleMutation.isPending || bulkLoading;

  const error =
    actionError ??
    (bundleQuery.error instanceof Error ? bundleQuery.error.message : null) ??
    (upsertRuleMutation.error instanceof Error ? upsertRuleMutation.error.message : null) ??
    (deleteRuleMutation.error instanceof Error ? deleteRuleMutation.error.message : null);

  const currentItems = useMemo(() => {
    const source = itemType === "service" ? services : products;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const byCategory =
      selectedCategoryId === null
        ? source
        : source.filter((item) => item.categoryId === selectedCategoryId);

    if (!normalizedSearch) return byCategory;
    return byCategory.filter((item) => item.name.toLowerCase().includes(normalizedSearch));
  }, [itemType, products, searchQuery, selectedCategoryId, services]);

  const currentCategories = itemType === "service" ? serviceCategories : productCategories;

  function keyFor(itemId: number): string {
    return `${selectedStaffId}:${itemType}:${itemId}`;
  }

  function getExistingRule(itemId: number) {
    return (
      rules.find(
        (rule) =>
          rule.staffId === selectedStaffId && rule.itemType === itemType && rule.itemId === itemId,
      ) ?? null
    );
  }

  function defaultDraftFor(itemId: number): Draft {
    const existing = getExistingRule(itemId);
    return {
      commissionType: existing?.commissionType ?? "percent",
      commissionValue: String(existing?.commissionValue ?? 0),
    };
  }

  function getDraft(itemId: number): Draft {
    return drafts[keyFor(itemId)] ?? defaultDraftFor(itemId);
  }

  function setDraft(itemId: number, patch: Partial<Draft>) {
    const key = keyFor(itemId);
    setDrafts((prev) => {
      const fallback = defaultDraftFor(itemId);
      return {
        ...prev,
        [key]: {
          ...(prev[key] ?? fallback),
          ...patch,
        },
      };
    });
  }

  function formatCurrency(value: number) {
    return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  }

  function estimatePayout(itemPrice: number, draft: Draft) {
    const value = Number(draft.commissionValue || 0);
    if (!Number.isFinite(value) || value < 0) return 0;
    if (draft.commissionType === "percent") return (itemPrice * value) / 100;
    return value;
  }

  async function saveRule(item: { id: number }) {
    if (!selectedStaffId) {
      setActionError("Vui lòng chọn nhân viên");
      return;
    }
    const key = keyFor(item.id);
    const draft = getDraft(item.id);
    const numericValue = Number(draft.commissionValue);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setActionError("Giá trị hoa hồng không hợp lệ");
      return;
    }

    setActionError(null);
    setRowLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const saved = await upsertRuleMutation.mutateAsync({
        staffId: selectedStaffId,
        itemType,
        itemId: item.id,
        commissionType: draft.commissionType,
        commissionValue: numericValue,
      });
      setRules((prev) => {
        const rest = prev.filter(
          (rule) =>
            !(rule.staffId === saved.staffId && rule.itemType === saved.itemType && rule.itemId === saved.itemId) &&
            rule.id !== saved.id,
        );
        return [...rest, saved];
      });
    } catch {
      // handled by mutation state
    } finally {
      setRowLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function clearRule(item: { id: number }) {
    const key = keyFor(item.id);
    const existing = getExistingRule(item.id);
    if (!existing) {
      setDraft(item.id, { commissionType: "percent", commissionValue: "0" });
      return;
    }

    setActionError(null);
    setRowLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await deleteRuleMutation.mutateAsync(existing.id);
      setRules((prev) => prev.filter((rule) => rule.id !== existing.id));
      setDraft(item.id, { commissionType: "percent", commissionValue: "0" });
    } catch {
      // handled by mutation state
    } finally {
      setRowLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function applyQuickToFiltered() {
    if (quickApplyTarget === "selected" && !selectedStaffId) {
      setActionError("Vui lòng chọn nhân viên");
      return;
    }
    const quickNumeric = Number(quickValue);
    if (!Number.isFinite(quickNumeric) || quickNumeric < 0) {
      setActionError("Giá trị áp dụng nhanh không hợp lệ");
      return;
    }
    if (currentItems.length === 0) {
      setActionError("Không có mục nào để áp dụng");
      return;
    }

    const targetStaffIds =
      quickApplyTarget === "all" ? members.map((member) => member.id) : [selectedStaffId];
    if (targetStaffIds.length === 0) {
      setActionError("Không có nhân viên để áp dụng");
      return;
    }

    const allPayload = targetStaffIds.flatMap((staffId) =>
      currentItems.map((item) => ({
        staffId,
        itemType,
        itemId: item.id,
        commissionType: quickType,
        commissionValue: quickNumeric,
      })),
    );

    setActionError(null);
    setBulkLoading(true);
    try {
      const chunkSize = 400;
      const savedRules: CommissionRule[] = [];
      for (let i = 0; i < allPayload.length; i += chunkSize) {
        const chunk = allPayload.slice(i, i + chunkSize);
        const response = await settingsService.bulkUpsertCommissionRules({ rules: chunk });
        savedRules.push(...response.rules);
      }

      setRules((prev) => {
        const replaced = new Set(savedRules.map((rule) => `${rule.staffId}:${rule.itemType}:${rule.itemId}`));
        const next = prev.filter((rule) => !replaced.has(`${rule.staffId}:${rule.itemType}:${rule.itemId}`));
        return [...next, ...savedRules];
      });

      for (const item of currentItems) {
        setDraft(item.id, {
          commissionType: quickType,
          commissionValue: String(quickNumeric),
        });
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.settingsBundle,
      });
    } catch {
      setActionError("Không thể áp dụng hàng loạt");
    } finally {
      setBulkLoading(false);
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

      {loading ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border bg-white p-4 lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label className="mb-2 block">Nhân viên</Label>
                  <Select
                    value={selectedStaffId || NONE_OPTION_VALUE}
                    onValueChange={(value) =>
                      setSelectedStaffId(value === NONE_OPTION_VALUE ? "" : value)
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

                <div>
                  <Label className="mb-2 block">Tìm kiếm mục</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Tên dịch vụ/sản phẩm"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-2">
                <Button
                  variant={itemType === "service" ? "default" : "outline"}
                  onClick={() => {
                    setItemType("service");
                    setSelectedCategoryId(null);
                  }}
                >
                  Dịch vụ
                </Button>
                <Button
                  variant={itemType === "product" ? "default" : "outline"}
                  onClick={() => {
                    setItemType("product");
                    setSelectedCategoryId(null);
                  }}
                >
                  Sản phẩm
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void queryClient.invalidateQueries({ queryKey: queryKeys.settingsBundle });
                  }}
                >
                  Làm mới dữ liệu
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedCategoryId === null ? "default" : "outline"}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  Tất cả danh mục
                </Button>
                {currentCategories.map((category) => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={selectedCategoryId === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h2 className="font-semibold">Áp dụng nhanh</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Áp dụng cùng 1 mức cho danh sách đang lọc.
              </p>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-2">
                  <Label>Loại</Label>
                  <Select
                    value={quickType}
                    onValueChange={(value) => setQuickType(value as CommissionType)}
                  >
                    <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Phần trăm (%)</SelectItem>
                      <SelectItem value="fixed">Cố định (đ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Phạm vi áp dụng</Label>
                  <Select
                    value={quickApplyTarget}
                    onValueChange={(value) => setQuickApplyTarget(value as ApplyTarget)}
                  >
                    <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Nhân viên đang chọn</SelectItem>
                      <SelectItem value="all">Tất cả nhân viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Giá trị</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={quickValue}
                    onChange={(event) => setQuickValue(event.target.value)}
                  />
                </div>
                <Button onClick={() => void applyQuickToFiltered()} disabled={saving}>
                  {bulkLoading
                    ? "Đang áp dụng..."
                    : quickApplyTarget === "all"
                      ? `Áp dụng ${currentItems.length} mục x ${members.length} nhân viên`
                      : `Áp dụng cho ${currentItems.length} mục`}
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {selectedStaffId ? (
                <>
                  Đang cấu hình cho:
                  <span className="font-medium text-foreground">
                    {members.find((member) => member.id === selectedStaffId)?.user?.name ?? selectedStaffId}
                  </span>
                </>
              ) : (
                "Chưa chọn nhân viên"
              )}
              <span className="ml-auto">{currentItems.length} mục</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      {itemType === "service" ? "Dịch vụ" : "Sản phẩm"}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Giá bán</th>
                    <th className="px-4 py-3 text-left font-medium">Loại hoa hồng</th>
                    <th className="px-4 py-3 text-left font-medium">Giá trị</th>
                    <th className="px-4 py-3 text-left font-medium">Ước tính</th>
                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Không có dữ liệu phù hợp.
                      </td>
                    </tr>
                  ) : null}

                  {currentItems.map((item) => {
                    const key = keyFor(item.id);
                    const draft = getDraft(item.id);
                    const existing = getExistingRule(item.id);
                    const rowSaving = Boolean(rowLoading[key]);
                    return (
                      <tr
                        key={item.id}
                        className="border-t border-border/60 align-top transition-colors hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                        <td className="w-48 px-4 py-3">
                          <Select
                            value={draft.commissionType}
                            onValueChange={(value) =>
                              setDraft(item.id, {
                                commissionType: value as CommissionType,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 rounded-md border px-3 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">Phần trăm (%)</SelectItem>
                              <SelectItem value="fixed">Cố định (đ)</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="w-48 px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft.commissionValue}
                            onChange={(event) =>
                              setDraft(item.id, {
                                commissionValue: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatCurrency(estimatePayout(item.price, draft))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {existing ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              Đã cấu hình
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Mặc định 0
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={rowSaving || saving}
                              onClick={() => void clearRule(item)}
                            >
                              Đặt về 0
                            </Button>
                            <Button
                              size="sm"
                              disabled={rowSaving || saving}
                              onClick={() => void saveRule(item)}
                            >
                              {rowSaving ? "Đang lưu..." : "Lưu"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
