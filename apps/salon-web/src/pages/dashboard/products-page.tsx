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
  type ProductCategory,
  type ProductItem,
  type ProductPayload,
  productsService,
} from "@/services/products.service";
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

const emptyProductForm = {
  name: "",
  categoryId: "",
  price: "",
  stock: "0",
  minStock: "0",
  sku: "",
  description: "",
};
const NONE_OPTION_VALUE = "__none__";

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"name-asc" | "price-asc" | "price-desc" | "stock-asc">(
    "name-asc",
  );

  const [categoryName, setCategoryName] = useState("");
  const [productForm, setProductForm] = useState(emptyProductForm);

  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const [categoryDeleteId, setCategoryDeleteId] = useState<number | null>(null);
  const [productDeleteId, setProductDeleteId] = useState<number | null>(null);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);

  useEffect(() => {
    document.title = "Sản phẩm | SupaSalon";
  }, []);

  const productsQuery = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => productsService.listProducts(),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.productCategories,
    queryFn: () => productsService.listCategories(),
  });
  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const loading = productsQuery.isLoading || categoriesQuery.isLoading;

  useEffect(() => {
    const queryError = productsQuery.error ?? categoriesQuery.error;
    if (queryError instanceof Error) {
      setError(queryError.message);
    }
  }, [categoriesQuery.error, productsQuery.error]);

  const filteredProducts = useMemo(() => {
    const next = products.filter((item) => {
      const byCategory = selectedCategory === null || item.categoryId === selectedCategory;
      const query = searchQuery.toLowerCase();
      const bySearch =
        item.name.toLowerCase().includes(query) || (item.sku ?? "").toLowerCase().includes(query);
      return byCategory && bySearch;
    });

    next.sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "stock-asc") return a.stock - b.stock;
      return a.name.localeCompare(b.name, "vi");
    });

    return next;
  }, [products, searchQuery, selectedCategory, sortBy]);

  function resetCategoryForm() {
    setCategoryName("");
    setEditingCategory(null);
  }

  const createCategoryMutation = useMutation({
    mutationFn: (payload: { name: string }) => productsService.createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.productCategories,
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
    }) => productsService.updateCategory(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.productCategories,
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => productsService.deleteCategory(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.productCategories,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
      ]);
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (payload: ProductPayload) => productsService.createProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products,
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProductPayload;
    }) => productsService.updateProduct(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products,
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => productsService.deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products,
      });
    },
  });

  const saving =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    deleteCategoryMutation.isPending ||
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    deleteProductMutation.isPending;

  function resetProductForm() {
    setProductForm(emptyProductForm);
    setEditingProduct(null);
  }

  function openCreateCategory() {
    resetCategoryForm();
    setIsCategoryOpen(true);
  }

  function openEditCategory(category: ProductCategory) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsCategoryOpen(true);
  }

  function openCreateProduct() {
    resetProductForm();
    if (selectedCategory) {
      setProductForm((prev) => ({
        ...prev,
        categoryId: String(selectedCategory),
      }));
    }
    setIsProductOpen(true);
  }

  function openEditProduct(item: ProductItem) {
    setEditingProduct(item);
    setProductForm({
      name: item.name,
      categoryId: String(item.categoryId),
      price: String(item.price),
      stock: String(item.stock),
      minStock: String(item.minStock),
      sku: item.sku ?? "",
      description: item.description ?? "",
    });
    setIsProductOpen(true);
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

  async function submitProduct(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const categoryId = Number(productForm.categoryId);
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const minStock = Number(productForm.minStock);

    if (!productForm.name.trim()) {
      setError("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setError("Vui lòng chọn danh mục");
      return;
    }
    if (!Number.isFinite(price)) {
      setError("Giá sản phẩm không hợp lệ");
      return;
    }

    setError(null);
    try {
      const payload: ProductPayload = {
        name: productForm.name.trim(),
        categoryId,
        price,
        stock: Number.isFinite(stock) ? stock : 0,
        minStock: Number.isFinite(minStock) ? minStock : 0,
        sku: productForm.sku.trim() || null,
        description: productForm.description,
      };

      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          payload,
        });
      } else {
        await createProductMutation.mutateAsync(payload);
      }

      setIsProductOpen(false);
      resetProductForm();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Không thể lưu sản phẩm");
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

  async function deleteProduct(id: number) {
    setError(null);
    try {
      await deleteProductMutation.mutateAsync(id);
      setProductDeleteId(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Không thể xóa sản phẩm");
    }
  }

  const categoryNameById = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );
  const categoryProductCount = useMemo(() => {
    const counter = new Map<number, number>();
    for (const product of products) {
      counter.set(product.categoryId, (counter.get(product.categoryId) ?? 0) + 1);
    }
    return counter;
  }, [products]);
  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === null) return "Tất cả danh mục";
    return categoryNameById.get(selectedCategory) ?? "Danh mục";
  }, [categoryNameById, selectedCategory]);

  const productColumns: Array<ColumnDef<ProductItem>> = [
    {
      accessorKey: "name",
      header: "Sản phẩm",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
          <div className="text-xs text-muted-foreground">{row.original.sku || "Không có SKU"}</div>
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
      id: "stock",
      header: "Tồn kho",
      meta: {
        className: "text-right",
        headerClassName: "text-right",
      },
      cell: ({ row }) => (
        <span
          className={
            row.original.stock <= row.original.minStock ? "font-semibold text-red-600" : ""
          }
        >
          {row.original.stock}
        </span>
      ),
    },
    {
      id: "minStock",
      header: "Tồn tối thiểu",
      meta: {
        className: "text-right",
        headerClassName: "text-right",
      },
      cell: ({ row }) => row.original.minStock,
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
          <Button variant="outline" size="sm" onClick={() => openEditProduct(row.original)}>
            <Pencil className="mr-1.5 h-3 w-3" />
            Sửa
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setProductDeleteId(row.original.id)}>
            <Trash2 className="mr-1.5 h-3 w-3" />
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý sản phẩm</h1>
            <p className="text-muted-foreground">
              Theo dõi kho, tồn tối thiểu và danh mục sản phẩm
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openCreateCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Danh mục
            </Button>
            <Button onClick={openCreateProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Sản phẩm
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
            <h2 className="font-semibold">Danh mục sản phẩm</h2>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {categories.length}
            </span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Chọn danh mục để lọc nhanh sản phẩm theo nhóm.
          </p>
          <div className="space-y-1">
            <button
              type="button"
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selectedCategory === null ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              onClick={() => setSelectedCategory(null)}
            >
              <span>Tất cả</span>
              <span className="text-xs">{products.length}</span>
            </button>
            {categories.map((category) => (
              <div key={category.id} className="group flex items-center gap-2">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selectedCategory === category.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs">{categoryProductCount.get(category.id) ?? 0}</span>
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
                {filteredProducts.length} sản phẩm hiển thị
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:flex-1">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm tên hoặc SKU"
                  className="pl-9"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "name-asc" | "price-asc" | "price-desc" | "stock-asc")
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Tên A - Z</SelectItem>
                  <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                  <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
                  <SelectItem value="stock-asc">Tồn kho thấp trước</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border">
            <DataTable
              data={filteredProducts}
              columns={productColumns}
              loading={loading}
              emptyMessage="Không tìm thấy sản phẩm phù hợp. Hãy thử từ khóa khác hoặc tạo sản phẩm mới."
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
        title={editingProduct ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
        open={isProductOpen}
        onClose={() => setIsProductOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitProduct}>
          <div className="grid gap-2">
            <Label>Tên sản phẩm</Label>
            <Input
              value={productForm.name}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Danh mục</Label>
              <Select
                value={productForm.categoryId || NONE_OPTION_VALUE}
                onValueChange={(value) =>
                  setProductForm((prev) => ({
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
                value={productForm.price}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    price: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Tồn kho</Label>
              <Input
                type="number"
                value={productForm.stock}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    stock: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Tồn tối thiểu</Label>
              <Input
                type="number"
                value={productForm.minStock}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    minStock: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>SKU</Label>
            <Input
              value={productForm.sku}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  sku: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Mô tả</Label>
            <textarea
              className="min-h-20 rounded-md border px-3 py-2 text-sm"
              value={productForm.description}
              onChange={(event) =>
                setProductForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsProductOpen(false)}>
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
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa danh mục này?</p>
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
        open={productDeleteId !== null}
        onClose={() => setProductDeleteId(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa sản phẩm này?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProductDeleteId(null)}>
              Hủy
            </Button>
            <Button
              disabled={saving}
              onClick={() => productDeleteId && void deleteProduct(productDeleteId)}
            >
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
