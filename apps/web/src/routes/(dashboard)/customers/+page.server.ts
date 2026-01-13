import { fail } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import type { Customer } from '$lib/types';

const API_URL = 'http://localhost:8787';

export const load: PageServerLoad = async ({ fetch, request, cookies }) => {
    const organizationId = cookies.get('organizationId');

    if (!organizationId) {
        return { customers: [] };
    }

    try {
        const response = await fetch(`${API_URL}/customers`, {
            headers: {
                cookie: request.headers.get('cookie') || '',
                'X-Organization-Id': organizationId
            }
        });

        if (!response.ok) {
            throw error(response.status, 'Failed to fetch customers');
        }

        const customers: Customer[] = await response.json();
        return { customers };
    } catch (e) {
        console.error("Error fetching customers", e);
        return { customers: [] };
    }
};

export const actions: Actions = {
    createCustomer: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');

        if (!organizationId) {
            return fail(400, { message: "Organization not selected" });
        }

        const data = await request.formData();
        const name = data.get("name") as string;
        const phone = data.get("phone") as string;
        const email = data.get("email") as string | null;
        const notes = data.get("notes") as string | null;

        if (!name || !phone) {
            return fail(400, { missing: true });
        }

        try {
            const response = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId
                },
                body: JSON.stringify({ name, phone, email: email || null, notes: notes || '' })
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
};

