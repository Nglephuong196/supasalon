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
import {
  type ServiceCategory,
  type ServiceItem,
  type ServicePayload,
  servicesService,
} from "@/services/services.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
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

const emptyServiceForm = {
  name: "",
  categoryId: "",
  price: "",
  duration: "",
  description: "",
};
const NONE_OPTION_VALUE = "__none__";

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"name-asc" | "price-asc" | "price-desc" | "duration-asc">(
    "name-asc",
  );

  const [categoryName, setCategoryName] = useState("");
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);

  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const [categoryDeleteId, setCategoryDeleteId] = useState<number | null>(null);
  const [serviceDeleteId, setServiceDeleteId] = useState<number | null>(null);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  useEffect(() => {
    document.title = "Dịch vụ | SupaSalon";
  }, []);

  const servicesQuery = useQuery({
    queryKey: queryKeys.services,
    queryFn: () => servicesService.listServices(),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.serviceCategories,
    queryFn: () => servicesService.listCategories(),
  });
  const services = servicesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const loading = servicesQuery.isLoading || categoriesQuery.isLoading;

  useEffect(() => {
    const queryError = servicesQuery.error ?? categoriesQuery.error;
    if (queryError instanceof Error) {
      setError(queryError.message);
    }
  }, [categoriesQuery.error, servicesQuery.error]);

  const filteredServices = useMemo(() => {
    const next = services.filter((item) => {
      const byCategory = selectedCategory === null || item.categoryId === selectedCategory;
      const bySearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return byCategory && bySearch;
    });

    next.sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "duration-asc") return a.duration - b.duration;
      return a.name.localeCompare(b.name, "vi");
    });

    return next;
  }, [searchQuery, selectedCategory, services, sortBy]);

  function resetCategoryForm() {
    setCategoryName("");
    setEditingCategory(null);
  }

  const createCategoryMutation = useMutation({
    mutationFn: (payload: { name: string }) => servicesService.createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.serviceCategories,
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { name: string };
    }) => servicesService.updateCategory(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.serviceCategories,
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => servicesService.deleteCategory(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.serviceCategories,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.services }),
      ]);
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: (payload: ServicePayload) => servicesService.createService(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.services,
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ServicePayload;
    }) => servicesService.updateService(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.services,
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => servicesService.deleteService(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.services,
      });
    },
  });

  const saving =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    deleteCategoryMutation.isPending ||
    createServiceMutation.isPending ||
    updateServiceMutation.isPending ||
    deleteServiceMutation.isPending;

  function resetServiceForm() {
    setServiceForm(emptyServiceForm);
    setEditingService(null);
  }

  function openCreateCategory() {
    resetCategoryForm();
    setIsCategoryOpen(true);
  }

  function openEditCategory(category: ServiceCategory) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsCategoryOpen(true);
  }

  function openCreateService() {
    resetServiceForm();
    if (selectedCategory) {
      setServiceForm((prev) => ({
        ...prev,
        categoryId: String(selectedCategory),
      }));
    }
    setIsServiceOpen(true);
  }

  function openEditService(service: ServiceItem) {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      categoryId: String(service.categoryId),
      price: String(service.price),
      duration: String(service.duration),
      description: service.description ?? "",
    });
    setIsServiceOpen(true);
  }

  async function submitCategory(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!categoryName.trim()) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }

    setError(null);
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          payload: { name: categoryName.trim() },
        });
      } else {
        await createCategoryMutation.mutateAsync({
          name: categoryName.trim(),
        });
      }
      setIsCategoryOpen(false);
      resetCategoryForm();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Không thể lưu danh mục");
    }
  }

  async function submitService(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const categoryId = Number(serviceForm.categoryId);
    const price = Number(serviceForm.price);
    const duration = Number(serviceForm.duration);

    if (!serviceForm.name.trim()) {
      setError("Vui lòng nhập tên dịch vụ");
      return;
    }
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setError("Vui lòng chọn danh mục");
      return;
    }
    if (!Number.isFinite(price)) {
      setError("Giá dịch vụ không hợp lệ");
      return;
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      setError("Thời gian dịch vụ không hợp lệ");
      return;
    }

    setError(null);
    try {
      const payload: ServicePayload = {
        name: serviceForm.name.trim(),
        categoryId,
        price,
        duration,
        description: serviceForm.description,
      };

      if (editingService) {
        await updateServiceMutation.mutateAsync({
          id: editingService.id,
          payload,
        });
      } else {
        await createServiceMutation.mutateAsync(payload);
      }

      setIsServiceOpen(false);
      resetServiceForm();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Không thể lưu dịch vụ");
    }
  }

  async function deleteCategory(id: number) {
    setError(null);
    try {
      await deleteCategoryMutation.mutateAsync(id);
      if (selectedCategory === id) setSelectedCategory(null);
      setCategoryDeleteId(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Không thể xóa danh mục");
    }
  }

  async function deleteService(id: number) {
    setError(null);
    try {
      await deleteServiceMutation.mutateAsync(id);
      setServiceDeleteId(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Không thể xóa dịch vụ");
    }
  }

  const categoryNameById = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );
  const categoryServiceCount = useMemo(() => {
    const counter = new Map<number, number>();
    for (const service of services) {
      counter.set(service.categoryId, (counter.get(service.categoryId) ?? 0) + 1);
    }
    return counter;
  }, [services]);
  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === null) return "Tất cả danh mục";
    return categoryNameById.get(selectedCategory) ?? "Danh mục";
  }, [categoryNameById, selectedCategory]);

  const serviceColumns: Array<ColumnDef<ServiceItem>> = [
    {
      accessorKey: "name",
      header: "Dịch vụ",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
          {row.original.description ? (
            <div className="text-xs text-muted-foreground">{row.original.description}</div>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: "Danh mục",
      cell: ({ row }) => categoryNameById.get(row.original.categoryId) ?? "-",
    },
    {
      id: "price",
      header: "Giá",
      meta: {
        className: "text-right",
        headerClassName: "text-right",
      },
      cell: ({ row }) => `${row.original.price.toLocaleString("vi-VN")}đ`,
    },
    {
      id: "duration",
      header: "Thời gian",
      meta: {
        className: "text-right",
        headerClassName: "text-right",
      },
      cell: ({ row }) => `${row.original.duration} phút`,
    },
    {
      id: "actions",
      header: "",
      meta: {
        className: "text-right",
        headerClassName: "text-right",
      },
      cell: ({ row }) => (
        <div className="inline-flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditService(row.original)}>
            <Pencil className="mr-1.5 h-3 w-3" />
            Sửa
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setServiceDeleteId(row.original.id)}>
            <Trash2 className="mr-1.5 h-3 w-3" />
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white via-white to-secondary/30 p-5 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý dịch vụ</h1>
            <p className="text-muted-foreground">Quản lý danh mục và đơn giá dịch vụ</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openCreateCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Danh mục
            </Button>
            <Button onClick={openCreateService}>
              <Plus className="mr-2 h-4 w-4" />
              Dịch vụ
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 md:flex-row md:gap-6">
        <div className="w-full rounded-xl border border-border/70 bg-white p-4 md:w-80">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Danh mục dịch vụ</h2>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {categories.length}
            </span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Chọn danh mục để lọc nhanh dịch vụ theo nhóm.
          </p>
          <div className="space-y-1">
            <button
              type="button"
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selectedCategory === null ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              onClick={() => setSelectedCategory(null)}
            >
              <span>Tất cả</span>
              <span className="text-xs">{services.length}</span>
            </button>
            {categories.map((category) => (
              <div key={category.id} className="group flex items-center gap-2">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selectedCategory === category.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs">{categoryServiceCount.get(category.id) ?? 0}</span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditCategory(category)}
                >
                  <Pencil className="mr-1.5 h-3 w-3" />
                  Sửa
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setCategoryDeleteId(category.id)}
                >
                  <Trash2 className="mr-1.5 h-3 w-3" />
                  Xóa
                </Button>
              </div>
            ))}
            {categories.length === 0 ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Chưa có danh mục nào. Tạo danh mục đầu tiên để bắt đầu.
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-border/70 bg-white p-4">
          <div className="mb-4 rounded-lg border border-border/70 bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">{selectedCategoryLabel}</p>
              <span className="text-xs text-muted-foreground">
                {filteredServices.length} dịch vụ hiển thị
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:flex-1">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm tên dịch vụ"
                  className="pl-9"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "name-asc" | "price-asc" | "price-desc" | "duration-asc")
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Tên A - Z</SelectItem>
                  <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                  <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
                  <SelectItem value="duration-asc">Thời gian ngắn trước</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border">
            <DataTable
              data={filteredServices}
              columns={serviceColumns}
              loading={loading}
              emptyMessage="Không tìm thấy dịch vụ phù hợp. Hãy thử từ khóa khác hoặc tạo dịch vụ mới."
            />
          </div>
        </div>
      </div>

      <Modal
        title={editingCategory ? "Cập nhật danh mục" : "Tạo danh mục"}
        open={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitCategory}>
          <div className="grid gap-2">
            <Label>Tên danh mục</Label>
            <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCategoryOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title={editingService ? "Cập nhật dịch vụ" : "Tạo dịch vụ"}
        open={isServiceOpen}
        onClose={() => setIsServiceOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitService}>
          <div className="grid gap-2">
            <Label>Tên dịch vụ</Label>
            <Input
              value={serviceForm.name}
              onChange={(event) =>
                setServiceForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Danh mục</Label>
              <Select
                value={serviceForm.categoryId || NONE_OPTION_VALUE}
                onValueChange={(value) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    categoryId: value === NONE_OPTION_VALUE ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_OPTION_VALUE}>Chọn danh mục</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Giá</Label>
              <Input
                type="number"
                value={serviceForm.price}
                onChange={(event) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    price: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Thời gian (phút)</Label>
              <Input
                type="number"
                value={serviceForm.duration}
                onChange={(event) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    duration: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Mô tả</Label>
            <textarea
              className="min-h-20 rounded-md border px-3 py-2 text-sm"
              value={serviceForm.description}
              onChange={(event) =>
                setServiceForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsServiceOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={categoryDeleteId !== null}
        onClose={() => setCategoryDeleteId(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Xóa danh mục sẽ ảnh hưởng các dịch vụ liên quan.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCategoryDeleteId(null)}>
              Hủy
            </Button>
            <Button
              disabled={saving}
              onClick={() => categoryDeleteId && void deleteCategory(categoryDeleteId)}
            >
              Xóa
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={serviceDeleteId !== null}
        onClose={() => setServiceDeleteId(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa dịch vụ này?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setServiceDeleteId(null)}>
              Hủy
            </Button>
            <Button
              disabled={saving}
              onClick={() => serviceDeleteId && void deleteService(serviceDeleteId)}
            >
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
