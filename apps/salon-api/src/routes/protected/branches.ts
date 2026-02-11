import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { ActivityLogsService, BranchesService } from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

function parseBranchId(value: string): number {
  const branchId = Number.parseInt(value, 10);
  if (!Number.isInteger(branchId) || branchId <= 0) {
    throw new Error("ID chi nhánh không hợp lệ");
  }
  return branchId;
}

export const branchesProtectedRoutes = new Elysia({
  name: "protected-branches-routes",
})
  .use(protectedPlugin)
  .group("/branches", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.EMPLOYEE, ACTIONS.READ);
        return new BranchesService(db).list(organization.id);
      })
      .get("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.EMPLOYEE, ACTIONS.READ);
        try {
          const branchId = parseBranchId(params.id);
          const branch = await new BranchesService(db).findById(organization.id, branchId);
          if (!branch) {
            set.status = 404;
            return { error: "Không tìm thấy chi nhánh" };
          }
          return branch;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "ID chi nhánh không hợp lệ" };
        }
      })
      .post("/", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.EMPLOYEE,
          ACTIONS.UPDATE,
        );

        try {
          const body = (await request.json()) as {
            name: string;
            code?: string;
            address?: string;
            phone?: string;
            managerMemberId?: string;
            isActive?: boolean;
            isDefault?: boolean;
          };

          const created = await new BranchesService(db).create(organization.id, body);
          if (!created) {
            set.status = 500;
            return { error: "Không thể tạo chi nhánh" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "branch",
            entityId: created.id,
            action: "create",
            metadata: {
              name: created.name,
              code: created.code,
              isDefault: created.isDefault,
            },
          });

          set.status = 201;
          return created;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tạo chi nhánh" };
        }
      })
      .put("/:id", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.EMPLOYEE,
          ACTIONS.UPDATE,
        );

        try {
          const branchId = parseBranchId(params.id);
          const body = (await request.json()) as {
            name?: string;
            code?: string;
            address?: string;
            phone?: string;
            managerMemberId?: string;
            isActive?: boolean;
            isDefault?: boolean;
          };
          const updated = await new BranchesService(db).update(organization.id, branchId, body);
          if (!updated) {
            set.status = 404;
            return { error: "Không tìm thấy chi nhánh" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "branch",
            entityId: updated.id,
            action: "update",
            metadata: {
              name: updated.name,
              code: updated.code,
              isActive: updated.isActive,
              isDefault: updated.isDefault,
            },
          });

          return updated;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể cập nhật chi nhánh" };
        }
      })
      .delete("/:id", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.EMPLOYEE,
          ACTIONS.UPDATE,
        );

        try {
          const branchId = parseBranchId(params.id);
          const deleted = await new BranchesService(db).delete(organization.id, branchId);
          if (!deleted) {
            set.status = 404;
            return { error: "Không tìm thấy chi nhánh" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "branch",
            entityId: deleted.id,
            action: "delete",
            metadata: {
              name: deleted.name,
            },
          });

          return { success: true };
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể xóa chi nhánh" };
        }
      })
      .get("/:id/members", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.EMPLOYEE, ACTIONS.READ);

        try {
          const branchId = parseBranchId(params.id);
          return new BranchesService(db).listMembers(organization.id, branchId);
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "ID chi nhánh không hợp lệ" };
        }
      })
      .put("/:id/members/:memberId", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.EMPLOYEE,
          ACTIONS.UPDATE,
        );

        try {
          const branchId = parseBranchId(params.id);
          const body = (await request.json().catch(() => ({}))) as { isPrimary?: boolean };
          const assigned = await new BranchesService(db).assignMember(
            organization.id,
            branchId,
            params.memberId,
            {
              isPrimary: body.isPrimary,
            },
          );

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "branch",
            entityId: branchId,
            action: "assign_member",
            metadata: {
              memberId: params.memberId,
              isPrimary: assigned?.isPrimary ?? false,
            },
          });

          return assigned;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể gán nhân viên vào chi nhánh" };
        }
      })
      .delete("/:id/members/:memberId", async ({ request, params, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.EMPLOYEE,
          ACTIONS.UPDATE,
        );

        try {
          const branchId = parseBranchId(params.id);
          const removed = await new BranchesService(db).unassignMember(
            organization.id,
            branchId,
            params.memberId,
          );
          if (!removed) {
            set.status = 404;
            return { error: "Không tìm thấy nhân viên tại chi nhánh" };
          }

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "branch",
            entityId: branchId,
            action: "unassign_member",
            metadata: {
              memberId: params.memberId,
            },
          });

          return { success: true };
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể xóa nhân viên khỏi chi nhánh" };
        }
      })
      .get("/by-member/:memberId", async ({ request, params }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.EMPLOYEE, ACTIONS.READ);
        return new BranchesService(db).listByMember(organization.id, params.memberId);
      }),
  );
