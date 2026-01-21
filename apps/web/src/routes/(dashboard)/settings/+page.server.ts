import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

const API_URL = 'http://localhost:8787';

export type MembershipTier = {
    id: number;
    organizationId: string;
    name: string;
    minSpending: number;
    discountPercent: number;
    minSpendingToMaintain: number | null;
    sortOrder: number;
    createdAt: string;
};

export type MemberPermission = {
    id: number;
    memberId: string;
    permissions: Record<string, string[]>;
    createdAt: string;
};

export type Member = {
    id: string;
    role: string;
    createdAt?: string;
    organizationId?: string;
    userId?: string;
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
    permissions: MemberPermission[];
};

export const load: PageServerLoad = async ({ fetch, cookies }) => {
    const organizationId = cookies.get('organizationId');

    if (!organizationId) {
        return { tiers: [], members: [] };
    }

    // handleFetch automatically injects cookies and X-Organization-Id
    try {
        const [tiersRes, membersRes] = await Promise.all([
            fetch(`${API_URL}/membership-tiers`),
            fetch(`${API_URL}/members`)
        ]);

        const tiers: MembershipTier[] = tiersRes.ok ? await tiersRes.json() : [];
        const members: Member[] = membersRes.ok ? await membersRes.json() : [];

        return { tiers, members };
    } catch (error) {
        console.error('Failed to load settings data:', error);
        return { tiers: [], members: [] };
    }
};

export const actions: Actions = {
    updatePermissions: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const memberId = data.get("memberId") as string;
        if (!memberId) return fail(400, { missing: true });

        // Parse permissions from form data
        const permissions: Record<string, string[]> = {};
        for (const [key, value] of data.entries()) {
            if (key.startsWith('permissions[')) {
                const match = key.match(/permissions\[([^\]]+)\]\[([^\]]+)\]/);
                if (match && value === 'on') {
                    const [, resource, action] = match;
                    if (!permissions[resource]) permissions[resource] = [];
                    permissions[resource].push(action);
                }
            }
        }

        try {
            const response = await fetch(`${API_URL}/members/${memberId}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions })
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to update permissions" });
            }
            return { success: true };
        } catch (e) {
            return fail(500, { message: "Server error" });
        }
    }
};
