import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { type PaginatedEmployees, employeesService } from "@/services/employees.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Pencil, Plus, Search, Trash, X } from "lucide-react";
import { useEffect, useState } from "react";

type Employee = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  status: "active";
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  owner: "bg-orange-100 text-orange-700",
  member: "bg-blue-100 text-blue-700",
  user: "bg-gray-100 text-gray-700",
};

function Modal(props: {
  title: string;
  description?: string;
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
        className="w-full max-w-[520px] rounded-xl border border-border bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{props.title}</h3>
            {props.description ? (
              <p className="text-sm text-muted-foreground">{props.description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={props.onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");

  const [editRole, setEditRole] = useState("member");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    document.title = "Nhân viên | SupaSalon";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("q") || "");
    const nextPage = Number.parseInt(params.get("page") || "1", 10);
    setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (debouncedSearchQuery) url.searchParams.set("q", debouncedSearchQuery);
    else url.searchParams.delete("q");
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");
    window.history.replaceState({}, "", url);
  }, [debouncedSearchQuery, page]);

  const membersQuery = useQuery<PaginatedEmployees>({
    queryKey: queryKeys.employeesList({
      page,
      limit,
      search: debouncedSearchQuery,
    }),
    queryFn: () =>
      employeesService.listPaginated({
        page,
        limit,
        search: debouncedSearchQuery,
      }),
    placeholderData: (previous) => previous,
  });
  const members = (membersQuery.data?.data ?? []).map((item) => ({
    id: item.id,
    name: item.user?.name || "Unknown",
    email: item.user?.email || "No Email",
    image: item.user?.image,
    role: item.role,
    status: "active" as const,
  }));
  const total = membersQuery.data?.total ?? 0;
  const totalPages = membersQuery.data?.totalPages ?? 1;
  const loading = membersQuery.isLoading;

  useEffect(() => {
    if (membersQuery.error instanceof Error) {
      setError(membersQuery.error.message);
    }
  }, [membersQuery.error]);

  const canManageEmployees = true;

  const employeeColumns: Array<ColumnDef<Employee>> = [
    {
      id: "employee",
      header: "Nhân viên",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary",
              "flex items-center justify-center",
            )}
          >
            {row.original.image ? (
              <img
                src={row.original.image}
                alt="Avatar"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              row.original.name.split("@")[0].slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            roleColors[row.original.role] || "bg-gray-100 text-gray-700",
          )}
        >
          {row.original.role}
        </span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: () => (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          Active
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "text-right", headerClassName: "text-right" },
      cell: ({ row }) =>
        canManageEmployees ? (
          <div className="inline-flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditRole(row.original)}>
              <Pencil className="mr-1.5 h-3 w-3" />
              Sửa vai trò
            </Button>
            <Button variant="destructive" size="sm" onClick={() => openDelete(row.original)}>
              <Trash className="mr-1.5 h-3 w-3" />
              Xóa
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  const createMemberMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      password: string;
      role: string;
    }) => employeesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees,
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { memberId: string; role: string }) =>
      employeesService.updateRole(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees,
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (payload: { memberIdOrEmail: string }) => employeesService.remove(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees,
      });
    },
  });

  const saving =
    createMemberMutation.isPending ||
    updateRoleMutation.isPending ||
    removeMemberMutation.isPending;

  function resetCreateForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("member");
    setNameError("");
    setEmailError("");
    setPasswordError("");
  }

  async function createMember(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    setNameError("");
    setEmailError("");
    setPasswordError("");

    let valid = true;
    if (!name.trim()) {
      setNameError("Vui lòng nhập tên hiển thị");
      valid = false;
    }
    if (!email.trim()) {
      setEmailError("Vui lòng nhập email");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Email không hợp lệ");
      valid = false;
    }
    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      valid = false;
    }
    if (!valid) return;

    setError(null);
    try {
      await createMemberMutation.mutateAsync({
        name,
        email,
        password,
        role,
      });
      setIsAddOpen(false);
      resetCreateForm();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Không thể thêm nhân viên";
      setError(message);
    }
  }

  async function updateRole(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!selectedEmployee) return;

    setError(null);
    try {
      await updateRoleMutation.mutateAsync({
        memberId: selectedEmployee.id,
        role: editRole,
      });
      setIsEditRoleOpen(false);
      setSelectedEmployee(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Không thể cập nhật vai trò";
      setError(message);
    }
  }

  async function removeMember() {
    if (!selectedEmployee) return;
    setError(null);
    try {
      await removeMemberMutation.mutateAsync({
        memberIdOrEmail: selectedEmployee.id,
      });
      setIsDeleteOpen(false);
      setSelectedEmployee(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Không thể xóa nhân viên";
      setError(message);
    }
  }

  function openEditRole(employee: Employee) {
    setSelectedEmployee(employee);
    setEditRole(employee.role);
    setIsEditRoleOpen(true);
  }

  function openDelete(employee: Employee) {
    setSelectedEmployee(employee);
    setIsDeleteOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nhân viên</h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý tài khoản nội bộ, vai trò và quyền truy cập theo tổ chức.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-100 p-6 sm:flex-row">
          <div>
            <h3 className="font-semibold leading-none tracking-tight">Danh sách nhân viên</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Quản lý {total} nhân viên trong hệ thống
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm nhân viên…"
                className="h-9 pr-9 pl-9"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
              />
              {searchQuery ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-2.5 h-5 w-5 -translate-y-1/2 rounded-full bg-gray-100 hover:bg-gray-200"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                >
                  <X className="h-3 w-3 text-gray-500" />
                </Button>
              ) : null}
            </div>

            {canManageEmployees ? (
              <Button className="h-9" onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo mới nhân viên
              </Button>
            ) : null}
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <DataTable
            data={members}
            columns={employeeColumns}
            loading={loading}
            emptyMessage="Không tìm thấy nhân viên nào."
          />
        </div>

        <div className="flex flex-col gap-4 p-4 md:hidden">
          {!loading && members.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 p-8 text-muted-foreground">
              <p>Không tìm thấy nhân viên nào.</p>
            </div>
          ) : (
            members.map((employee) => (
              <Card key={employee.id}>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4 pb-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {employee.image ? (
                      <img
                        src={employee.image}
                        alt="Avatar"
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      employee.name.split("@")[0].slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <CardTitle className="truncate text-base">{employee.name}</CardTitle>
                    <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 p-4 pt-2 text-sm">
                  <div className="flex justify-between border-b border-gray-50 py-1">
                    <span className="text-muted-foreground">Vai trò:</span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                        roleColors[employee.role] || "bg-gray-100 text-gray-700",
                      )}
                    >
                      {employee.role}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>
                </CardContent>
                {canManageEmployees ? (
                  <CardFooter className="flex justify-end gap-2 border-t bg-muted/30 p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => openEditRole(employee)}
                    >
                      <Pencil className="mr-1.5 h-3 w-3" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => openDelete(employee)}
                    >
                      <Trash className="mr-1.5 h-3 w-3" />
                      Xóa
                    </Button>
                  </CardFooter>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-white px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Hiển thị {members.length} / {total} nhân viên
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Trước
            </Button>
            <span className="min-w-20 text-center text-muted-foreground">
              Trang {page}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Thêm nhân viên mới"
        description="Tạo tài khoản mới cho nhân viên."
      >
        <form onSubmit={createMember} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="emp-name">Tên hiển thị</Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError("");
              }}
              placeholder="Nguyễn Văn A"
            />
            {nameError ? <span className="text-xs text-red-500">{nameError}</span> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emp-email">Email</Label>
            <Input
              id="emp-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
              }}
              placeholder="nhanvien@salon.com"
            />
            {emailError ? <span className="text-xs text-red-500">{emailError}</span> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emp-password">Mật khẩu</Label>
            <Input
              id="emp-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError("");
              }}
              placeholder="••••••••"
            />
            {passwordError ? <span className="text-xs text-red-500">{passwordError}</span> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emp-role">Vai trò</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger
                id="emp-role"
                className="h-11 rounded-lg border border-input bg-gray-50/50 px-3 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Thành viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="owner">Chủ sở hữu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang tạo…" : "Tạo mới nhân viên"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isEditRoleOpen}
        onClose={() => setIsEditRoleOpen(false)}
        title="Cập nhật vai trò"
        description={`Thay đổi vai trò cho ${selectedEmployee?.name || "nhân viên"}`}
      >
        <form onSubmit={updateRole} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-role">Vai trò</Label>
            <Select value={editRole} onValueChange={setEditRole}>
              <SelectTrigger
                id="edit-role"
                className="h-11 rounded-lg border border-input bg-gray-50/50 px-3 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Thành viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="owner">Chủ sở hữu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Bạn có chắc chắn muốn xóa?"
        description="Hành động này không thể hoàn tác. Nhân viên sẽ bị xóa khỏi tổ chức."
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={() => void removeMember()}
          >
            {saving ? "Đang xóa…" : "Xóa"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
