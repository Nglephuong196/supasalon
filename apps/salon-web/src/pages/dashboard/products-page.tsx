import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-client";
import {
  productsService,
  type ProductCategory,
  type ProductItem,
  type ProductPayload,
} from "@/services/products.service";

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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={props.onClose}
          >
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

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [productForm, setProductForm] = useState(emptyProductForm);

  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null,
  );

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
    return products.filter((item) => {
      const byCategory =
        selectedCategory === null || item.categoryId === selectedCategory;
      const query = searchQuery.toLowerCase();
      const bySearch =
        item.name.toLowerCase().includes(query) ||
        (item.sku ?? "").toLowerCase().includes(query);
      return byCategory && bySearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const lowStockCount = useMemo(
    () => products.filter((item) => item.stock <= item.minStock).length,
    [products],
  );

  function resetCategoryForm() {
    setCategoryName("");
    setEditingCategory(null);
  }

  const createCategoryMutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      productsService.createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.productCategories,
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name: string } }) =>
      productsService.updateCategory(id, payload),
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
    mutationFn: (payload: ProductPayload) =>
      productsService.createProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductPayload }) =>
      productsService.updateProduct(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => productsService.deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products });
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

  async function submitCategory(
    event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
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
        await createCategoryMutation.mutateAsync({ name: categoryName.trim() });
      }
      setIsCategoryOpen(false);
      resetCategoryForm();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể lưu danh mục",
      );
    }
  }

  async function submitProduct(
    event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
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
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể lưu sản phẩm",
      );
    }
  }

  async function deleteCategory(id: number) {
    setError(null);
    try {
      await deleteCategoryMutation.mutateAsync(id);
      if (selectedCategory === id) setSelectedCategory(null);
      setCategoryDeleteId(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể xóa danh mục",
      );
    }
  }

  async function deleteProduct(id: number) {
    setError(null);
    try {
      await deleteProductMutation.mutateAsync(id);
      setProductDeleteId(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể xóa sản phẩm",
      );
    }
  }

  const categoryNameById = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Quản lý sản phẩm
            </h1>
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

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-white p-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm tên hoặc SKU"
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border px-3 text-sm"
          value={selectedCategory ?? "all"}
          onChange={(event) =>
            setSelectedCategory(
              event.target.value === "all" ? null : Number(event.target.value),
            )
          }
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          {lowStockCount} sản phẩm sắp hết
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-border/70 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Sản phẩm</th>
              <th className="px-3 py-2 text-left">Danh mục</th>
              <th className="px-3 py-2 text-right">Giá</th>
              <th className="px-3 py-2 text-right">Tồn kho</th>
              <th className="px-3 py-2 text-right">Tồn tối thiểu</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-muted-foreground"
                >
                  Đang tải...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-muted-foreground"
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredProducts.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.sku || "Không có SKU"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {categoryNameById.get(item.categoryId) ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {item.price.toLocaleString("vi-VN")}đ
                  </td>
                  <td
                    className={`px-3 py-2 text-right ${item.stock <= item.minStock ? "font-semibold text-red-600" : ""}`}
                  >
                    {item.stock}
                  </td>
                  <td className="px-3 py-2 text-right">{item.minStock}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditProduct(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setProductDeleteId(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Danh mục sản phẩm</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
            >
              <span>{category.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => openEditCategory(category)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setCategoryDeleteId(category.id)}
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          ))}
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
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryOpen(false)}
            >
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
              <select
                className="h-10 rounded-md border px-3 text-sm"
                value={productForm.categoryId}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    categoryId: event.target.value,
                  }))
                }
              >
                <option value="">Chọn danh mục</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
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
                setProductForm((prev) => ({ ...prev, sku: event.target.value }))
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProductOpen(false)}
            >
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
            Bạn có chắc muốn xóa danh mục này?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCategoryDeleteId(null)}>
              Hủy
            </Button>
            <Button
              disabled={saving}
              onClick={() =>
                categoryDeleteId && void deleteCategory(categoryDeleteId)
              }
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
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa sản phẩm này?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProductDeleteId(null)}>
              Hủy
            </Button>
            <Button
              disabled={saving}
              onClick={() =>
                productDeleteId && void deleteProduct(productDeleteId)
              }
            >
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
