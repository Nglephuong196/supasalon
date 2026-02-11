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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NONE_OPTION_VALUE = "__none__";

function memberLabel(member: { id: string; user?: { name?: string | null; email?: string | null } }) {
  return member.user?.name || member.user?.email || member.id;
}

export function BranchesPage() {
  const queryClient = useQueryClient();

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [managerMemberId, setManagerMemberId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const [assignMemberId, setAssignMemberId] = useState("");
  const [assignPrimary, setAssignPrimary] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Chi nhánh | SupaSalon";
  }, []);

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches,
    queryFn: () => branchesService.list(),
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.employees,
    queryFn: () => employeesService.list(),
  });

  const branchMembersQuery = useQuery({
    queryKey: queryKeys.branchMembers(selectedBranchId ?? undefined),
    queryFn: () => branchesService.listMembers(Number(selectedBranchId)),
    enabled: Boolean(selectedBranchId),
  });

  useEffect(() => {
    const firstId = branchesQuery.data?.[0]?.id ?? null;
    if (selectedBranchId === null && firstId) {
      setSelectedBranchId(firstId);
    }
  }, [branchesQuery.data, selectedBranchId]);

  const createMutation = useMutation({
    mutationFn: () =>
      branchesService.create({
        name: name.trim(),
        code: code.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        managerMemberId: managerMemberId || undefined,
        isActive,
        isDefault,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.branches });
      setSelectedBranchId(created.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (branchId: number) =>
      branchesService.update(branchId, {
        name: name.trim(),
        code: code.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        managerMemberId: managerMemberId || undefined,
        isActive,
        isDefault,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.branches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.branchMembers(selectedBranchId ?? undefined) }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (branchId: number) => branchesService.remove(branchId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.branches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.branchMembers(selectedBranchId ?? undefined) }),
      ]);
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      if (!selectedBranchId || !assignMemberId) {
        throw new Error("Vui lòng chọn chi nhánh và nhân viên");
      }
      return branchesService.assignMember(selectedBranchId, assignMemberId, {
        isPrimary: assignPrimary,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.branchMembers(selectedBranchId ?? undefined),
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (memberId: string) => {
      if (!selectedBranchId) {
        throw new Error("Vui lòng chọn chi nhánh");
      }
      return branchesService.unassignMember(selectedBranchId, memberId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.branchMembers(selectedBranchId ?? undefined),
      });
    },
  });

  const branches = branchesQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const branchMembers = branchMembersQuery.data ?? [];

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    assignMutation.isPending ||
    unassignMutation.isPending;

  const error =
    actionError ??
    (branchesQuery.error instanceof Error ? branchesQuery.error.message : null) ??
    (membersQuery.error instanceof Error ? membersQuery.error.message : null) ??
    (branchMembersQuery.error instanceof Error ? branchMembersQuery.error.message : null) ??
    (createMutation.error instanceof Error ? createMutation.error.message : null) ??
    (updateMutation.error instanceof Error ? updateMutation.error.message : null) ??
    (deleteMutation.error instanceof Error ? deleteMutation.error.message : null) ??
    (assignMutation.error instanceof Error ? assignMutation.error.message : null) ??
    (unassignMutation.error instanceof Error ? unassignMutation.error.message : null);

  function resetForm() {
    setEditingBranchId(null);
    setName("");
    setCode("");
    setAddress("");
    setPhone("");
    setManagerMemberId("");
    setIsActive(true);
    setIsDefault(false);
  }

  function editBranch(branchId: number) {
    const branch = branches.find((item) => item.id === branchId);
    if (!branch) return;
    setEditingBranchId(branch.id);
    setName(branch.name);
    setCode(branch.code ?? "");
    setAddress(branch.address ?? "");
    setPhone(branch.phone ?? "");
    setManagerMemberId(branch.managerMemberId ?? "");
    setIsActive(branch.isActive);
    setIsDefault(branch.isDefault);
  }

  async function submitBranch(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!name.trim()) {
      setActionError("Vui lòng nhập tên chi nhánh");
      return;
    }

    setActionError(null);
    try {
      if (editingBranchId) {
        await updateMutation.mutateAsync(editingBranchId);
      } else {
        await createMutation.mutateAsync();
      }
      resetForm();
    } catch {
      // handled by mutation state
    }
  }

  async function removeBranch(branchId: number) {
    const ok = window.confirm("Xóa chi nhánh này? Hành động không thể hoàn tác.");
    if (!ok) return;

    setActionError(null);
    try {
      await deleteMutation.mutateAsync(branchId);
      if (selectedBranchId === branchId) {
        setSelectedBranchId(null);
      }
    } catch {
      // handled by mutation state
    }
  }

  async function assignMemberToBranch() {
    if (!assignMemberId) {
      setActionError("Vui lòng chọn nhân viên để gán");
      return;
    }

    setActionError(null);
    try {
      await assignMutation.mutateAsync();
      setAssignMemberId("");
      setAssignPrimary(false);
    } catch {
      // handled by mutation state
    }
  }

  async function unassignMemberFromBranch(memberId: string) {
    setActionError(null);
    try {
      await unassignMutation.mutateAsync(memberId);
    } catch {
      // handled by mutation state
    }
  }

  async function markPrimaryMember(memberId: string) {
    if (!selectedBranchId) return;
    setActionError(null);
    try {
      await branchesService.assignMember(selectedBranchId, memberId, { isPrimary: true });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.branchMembers(selectedBranchId),
      });
    } catch (error) {
      if (error instanceof Error) {
        setActionError(error.message);
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý chi nhánh</h1>
        <p className="text-sm text-muted-foreground">
          Tạo và quản trị danh sách chi nhánh, gán nhân viên làm việc theo từng cơ sở.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="rounded-xl border bg-white p-4 xl:col-span-2">
          <h2 className="mb-3 text-base font-semibold">
            {editingBranchId ? "Cập nhật chi nhánh" : "Tạo chi nhánh mới"}
          </h2>

          <form className="grid gap-3" onSubmit={submitBranch}>
            <div className="grid gap-1">
              <Label>Tên chi nhánh</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label>Mã chi nhánh</Label>
                <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="CN-HCM-01" />
              </div>
              <div className="grid gap-1">
                <Label>Số điện thoại</Label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0909xxxxxx" />
              </div>
            </div>

            <div className="grid gap-1">
              <Label>Địa chỉ</Label>
              <Input value={address} onChange={(event) => setAddress(event.target.value)} />
            </div>

            <div className="grid gap-1">
              <Label>Quản lý chi nhánh</Label>
              <Select
                value={managerMemberId || NONE_OPTION_VALUE}
                onValueChange={(value) =>
                  setManagerMemberId(value === NONE_OPTION_VALUE ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_OPTION_VALUE}>Không chỉ định</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {memberLabel(member)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Trạng thái</Label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(value) => setIsActive(value === "active")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Chi nhánh mặc định</Label>
                <Select
                  value={isDefault ? "yes" : "no"}
                  onValueChange={(value) => setIsDefault(value === "yes")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Đặt mặc định</SelectItem>
                    <SelectItem value="no">Không</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving}>
                <Plus className="mr-1 h-4 w-4" />
                {editingBranchId ? "Cập nhật" : "Tạo mới"}
              </Button>
              {editingBranchId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Hủy chỉnh sửa
                </Button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="rounded-xl border bg-white p-4 xl:col-span-3">
          <h2 className="mb-3 text-base font-semibold">Danh sách chi nhánh</h2>
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chi nhánh</TableHead>
                  <TableHead>Quản lý</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : branches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Chưa có chi nhánh nào
                    </TableCell>
                  </TableRow>
                ) : (
                  branches.map((branch) => (
                    <TableRow
                      key={branch.id}
                      className={selectedBranchId === branch.id ? "bg-muted/30" : ""}
                      onClick={() => setSelectedBranchId(branch.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{branch.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {branch.code || "Không có mã"}
                        </div>
                        {branch.isDefault ? (
                          <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            Mặc định
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{branch.manager?.user?.name || branch.manager?.user?.email || "-"}</TableCell>
                      <TableCell>
                        {branch.isActive ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                            Tạm ngưng
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              editBranch(branch.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeBranch(branch.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Nhân sự theo chi nhánh</h2>
            <p className="text-sm text-muted-foreground">
              {selectedBranch ? (
                <>Chi nhánh đang chọn: {selectedBranch.name}</>
              ) : (
                <>Vui lòng chọn một chi nhánh</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Tổng nhân sự: {branchMembers.length}
          </div>
        </div>

        <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="grid gap-1">
            <Label>Chọn nhân viên để gán</Label>
            <Select
              value={assignMemberId || NONE_OPTION_VALUE}
              onValueChange={(value) => setAssignMemberId(value === NONE_OPTION_VALUE ? "" : value)}
              disabled={!selectedBranch}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_OPTION_VALUE}>Chọn nhân viên</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {memberLabel(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Vai trò nhánh</Label>
            <Select
              value={assignPrimary ? "primary" : "secondary"}
              onValueChange={(value) => setAssignPrimary(value === "primary")}
              disabled={!selectedBranch}
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secondary">Thành viên</SelectItem>
                <SelectItem value="primary">Chi nhánh chính</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <Button onClick={() => void assignMemberToBranch()} disabled={!selectedBranch || saving}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Gán nhân viên
          </Button>
        </div>

        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedBranch ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Chọn chi nhánh để xem nhân sự
                  </TableCell>
                </TableRow>
              ) : branchMembersQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : branchMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Chưa có nhân sự trong chi nhánh này
                  </TableCell>
                </TableRow>
              ) : (
                branchMembers.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      {assignment.member ? memberLabel(assignment.member) : assignment.memberId}
                    </TableCell>
                    <TableCell>
                      {assignment.isPrimary ? (
                        <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          Chi nhánh chính
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          Thành viên
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void markPrimaryMember(assignment.memberId)}
                        >
                          Đặt chính
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700"
                          onClick={() => void unassignMemberFromBranch(assignment.memberId)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
