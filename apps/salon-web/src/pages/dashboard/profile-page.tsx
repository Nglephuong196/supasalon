import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organization, useSession } from "@/lib/auth-client";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileService } from "@/services/profile.service";

type OrganizationInfo = {
  id: string;
  name: string;
  slug: string | null;
};

async function fetchOrganizationInfo(sessionData: unknown): Promise<OrganizationInfo | null> {
  let resolvedOrg: OrganizationInfo | null = null;
  let resolvedOrgId =
    (typeof localStorage !== "undefined" ? localStorage.getItem("organizationId") : null) || null;

  const activeOrgIdFromSession = (
    sessionData as {
      session?: { activeOrganizationId?: string | null };
    } | null
  )?.session?.activeOrganizationId;

  if (!resolvedOrgId && activeOrgIdFromSession) {
    resolvedOrgId = activeOrgIdFromSession;
  }

  if (resolvedOrgId) {
    try {
      resolvedOrg = await apiClient.post<OrganizationInfo>(
        "/api/auth/organization/get-full-organization",
        {
          organizationId: resolvedOrgId,
        },
      );
    } catch {
      resolvedOrg = null;
    }
  }

  if (!resolvedOrg) {
    const listResult = (await organization.list()) as {
      data?: Array<{ id?: string; name?: string; slug?: string | null }> | undefined;
    };
    const list = listResult.data ?? [];
    const match = resolvedOrgId ? list.find((item) => item.id === resolvedOrgId) : null;
    const chosen = match ?? list[0];
    if (chosen?.id) {
      resolvedOrgId = chosen.id;
      try {
        await organization.setActive({ organizationId: chosen.id });
      } catch {
        // best-effort only
      }
      resolvedOrg = {
        id: chosen.id,
        name: chosen.name ?? "",
        slug: chosen.slug ?? null,
      };
    }
  }

  if (resolvedOrgId && typeof localStorage !== "undefined") {
    localStorage.setItem("organizationId", resolvedOrgId);
  }

  return resolvedOrg;
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const session = useSession();

  const defaults = useMemo(
    () => ({
      name: session.data?.user?.name ?? "",
      email: session.data?.user?.email ?? "",
      image: session.data?.user?.image ?? "",
      organizationName: "",
      organizationSlug: "",
    }),
    [session.data?.user?.email, session.data?.user?.image, session.data?.user?.name],
  );

  const [form, setForm] = useState(defaults);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Hồ sơ | SupaSalon";
  }, []);

  const organizationQuery = useQuery({
    queryKey: queryKeys.profileOrganization,
    queryFn: () => fetchOrganizationInfo(session.data),
    staleTime: 5 * 60_000,
  });

  const saveProfileMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      image: string;
      organizationName: string;
      organizationSlug: string;
    }) => profileService.updateProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profileOrganization });
    },
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: defaults.name,
      email: defaults.email,
      image: defaults.image,
    }));
  }, [defaults]);

  useEffect(() => {
    const org = organizationQuery.data;
    if (!org) return;
    setForm((prev) => ({
      ...prev,
      organizationName: org.name || prev.organizationName,
      organizationSlug: org.slug || "",
    }));
  }, [organizationQuery.data]);

  function setField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setStatus(null);
    try {
      await saveProfileMutation.mutateAsync({
        name: form.name,
        image: form.image,
        organizationName: form.organizationName,
        organizationSlug: form.organizationSlug,
      });
      setStatus("Đã cập nhật hồ sơ thành công");
    } catch {
      // handled by mutation state
    }
  }

  const loadingOrg = organizationQuery.isLoading;
  const saving = saveProfileMutation.isPending;
  const error =
    (saveProfileMutation.error instanceof Error ? saveProfileMutation.error.message : null) ??
    (organizationQuery.error instanceof Error ? organizationQuery.error.message : null);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">Cập nhật thông tin cá nhân và salon của bạn.</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {status}
        </div>
      ) : null}

      <Card className="border border-border/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Tên hiển thị</Label>
              <Input
                id="profile-name"
                name="name"
                placeholder="Tên hiển thị"
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" name="email" value={form.email} disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-image">Ảnh đại diện (URL)</Label>
              <Input
                id="profile-image"
                name="image"
                placeholder="https://..."
                value={form.image}
                onChange={(event) => setField("image", event.target.value)}
              />
            </div>

            <div className="border-t pt-2">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Thông tin salon</p>
              <div className="mb-4 grid gap-2">
                <Label htmlFor="organization-name">Tên salon</Label>
                <Input
                  id="organization-name"
                  name="organizationName"
                  placeholder="Tên salon"
                  value={form.organizationName}
                  onChange={(event) => setField("organizationName", event.target.value)}
                  disabled={loadingOrg}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="organization-slug">Slug salon</Label>
                <Input
                  id="organization-slug"
                  name="organizationSlug"
                  placeholder="vd: beauty-spa-nail"
                  value={form.organizationSlug}
                  onChange={(event) => setField("organizationSlug", event.target.value)}
                  disabled={loadingOrg}
                />
                <p className="text-xs text-muted-foreground">
                  URL đặt lịch dự kiến:{" "}
                  <span className="font-medium">
                    /book/{form.organizationSlug || "slug-cua-ban"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
