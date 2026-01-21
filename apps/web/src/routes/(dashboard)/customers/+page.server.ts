import { fail, redirect } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import type { Customer } from '$lib/types';
import { RESOURCES, ACTIONS } from '@repo/constants';
import { checkPermission, getResourcePermissions } from '$lib/permissions';

import { PUBLIC_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
    const organizationId = cookies.get('organizationId');
    const { memberRole, memberPermissions } = await parent();

    // Check read permission - redirect if denied
    if (!checkPermission(memberRole, memberPermissions, RESOURCES.CUSTOMER, ACTIONS.READ)) {
        throw redirect(302, '/unauthorized');
    }

    // Get permission flags for UI
    const permissions = getResourcePermissions(memberRole, memberPermissions, RESOURCES.CUSTOMER);

    if (!organizationId) {
        return { customers: [], ...permissions };
    }

    // handleFetch automatically injects cookies and X-Organization-Id
    try {
        const response = await fetch(`${PUBLIC_API_URL}/customers`);

        if (!response.ok) {
            if (response.status === 403) {
                throw redirect(302, '/unauthorized');
            }
            throw error(response.status, 'Failed to fetch customers');
        }

        const customers: Customer[] = await response.json();
        return { customers, ...permissions };
    } catch (e) {
        if ((e as any)?.status === 302) throw e;
        console.error("Error fetching customers", e);
        return { customers: [], ...permissions };
    }
};

export const actions: Actions = {
    createCustomer: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const name = data.get("name") as string;
        const phone = data.get("phone") as string;
        const email = data.get("email") as string | null;
        const notes = data.get("notes") as string | null;
        const gender = data.get("gender") as string | null;
        const location = data.get("location") as string | null;

        if (!name || !phone) return fail(400, { missing: true });

        try {
            const response = await fetch(`${PUBLIC_API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    phone,
                    email: email || null,
                    notes: notes || '',
                    gender: gender || null,
                    location: location || null
                })
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to create customer" });
            }
            return { success: true };
        } catch (e) {
            console.error("Error creating customer", e);
            return fail(500, { message: "Server error" });
        }
    },

    updateCustomer: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const id = data.get("id") as string;
        const name = data.get("name") as string;
        const phone = data.get("phone") as string;
        const email = data.get("email") as string | null;
        const notes = data.get("notes") as string | null;
        const gender = data.get("gender") as string | null;
        const location = data.get("location") as string | null;

        if (!id || !name || !phone) return fail(400, { missing: true });

        try {
            const response = await fetch(`${PUBLIC_API_URL}/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    phone,
                    email: email || null,
                    notes: notes || '',
                    gender: gender || null,
                    location: location || null
                })
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to update customer" });
            }
            return { success: true };
        } catch (e) {
            console.error("Error updating customer", e);
            return fail(500, { message: "Server error" });
        }
    },

    deleteCustomer: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const id = data.get("id") as string;

        if (!id) return fail(400, { missing: true });

        try {
            const response = await fetch(`${PUBLIC_API_URL}/customers/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to delete customer" });
            }
            return { success: true };
        } catch (e) {
            console.error("Error deleting customer", e);
            return fail(500, { message: "Server error" });
        }
    },
};
