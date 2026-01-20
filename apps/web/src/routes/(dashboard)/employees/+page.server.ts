import { fail } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { PageServerLoad, Actions } from './$types';

const API_URL = PUBLIC_API_URL || 'http://127.0.0.1:8787';

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        const res = await fetch(`${API_URL}/members`);
        console.log('res', res);
        if (!res.ok) return { members: [] };
        const members = await res.json();
        return { members };
    } catch (error) {
        console.error('Failed to load employees data:', error);
        return { members: [] };
    }
};

export const actions: Actions = {
    createMember: async ({ request, fetch }) => {
        const data = await request.formData();
        const name = data.get("name") as string;
        const email = data.get("email") as string;
        const password = data.get("password") as string;
        const role = data.get("role") as string;

        if (!name || !email || !password || !role) {
            return fail(400, { missing: true, message: "Missing required fields" });
        }

        try {
            const res = await fetch(`${API_URL}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            if (!res.ok) {
                const err = await res.json();
                return fail(res.status, { message: err.error || "Failed to create member" });
            }
            return { success: true };
        } catch (e: any) {
            console.error("Create member error:", e);
            return fail(500, { message: "Server error" });
        }
    },

    removeMember: async ({ request, fetch }) => {
        const data = await request.formData();
        const memberIdOrEmail = data.get("memberIdOrEmail");

        if (!memberIdOrEmail) return fail(400, { missing: true });

        try {
            const res = await fetch(`${API_URL}/members/remove-member`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberIdOrEmail })
            });

            if (!res.ok) {
                const err = await res.json();
                return fail(res.status, { message: err.message || err.error || "Failed to remove member" });
            }
            return { success: true };
        } catch (e: any) {
            console.error("Remove member error:", e);
            return fail(500, { message: "Server error" });
        }
    },

    updateRole: async ({ request, fetch }) => {
        const data = await request.formData();
        const memberId = data.get("memberId");
        const role = data.get("role");

        if (!memberId || !role) return fail(400, { missing: true });

        try {
            const res = await fetch(`${API_URL}/members/update-member-role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, role })
            });

            if (!res.ok) {
                const err = await res.json();
                return fail(res.status, { message: err.message || err.error || "Failed to update role" });
            }
            return { success: true };
        } catch (e: any) {
            console.error("Update role error:", e);
            return fail(500, { message: "Server error" });
        }
    }
};
