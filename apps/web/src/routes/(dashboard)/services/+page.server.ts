import { fail, redirect } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { RESOURCES, ACTIONS } from '@repo/constants';
import { checkPermission, getResourcePermissions } from '$lib/permissions';
import { PUBLIC_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, request, cookies, parent }) => {
    const organizationId = cookies.get('organizationId');
    const { memberRole, memberPermissions } = await parent();

    // Check read permission - redirect if denied
    if (!checkPermission(memberRole, memberPermissions, RESOURCES.SERVICE, ACTIONS.READ)) {
        throw redirect(302, '/unauthorized');
    }

    // Get permission flags for UI
    const permissions = getResourcePermissions(memberRole, memberPermissions, RESOURCES.SERVICE);

    if (!organizationId) {
        return { services: [], categories: [], ...permissions };
    }

    const headers = {
        cookie: request.headers.get('cookie') || '',
        'X-Organization-Id': organizationId
    };

    try {
        const [servicesRes, categoriesRes] = await Promise.all([
            fetch(`${PUBLIC_API_URL}/services`, { headers }),
            fetch(`${PUBLIC_API_URL}/service-categories`, { headers })
        ]);

        if (servicesRes.status === 403 || categoriesRes.status === 403) {
            throw redirect(302, '/unauthorized');
        }

        const services = servicesRes.ok ? await servicesRes.json() : [];
        const categories = categoriesRes.ok ? await categoriesRes.json() : [];

        return { services, categories, ...permissions };
    } catch (e) {
        if ((e as any)?.status === 302) throw e;
        console.error("Error fetching services data", e);
        return { services: [], categories: [], ...permissions };
    }
};

export const actions: Actions = {
    createCategory: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const name = data.get("name") as string;

        if (!name) return fail(400, { missing: true });

        try {
            const response = await fetch(`${PUBLIC_API_URL}/service-categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId
                },
                body: JSON.stringify({ name })
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to create category" });
            }
            return { success: true };
        } catch (e) {
            return fail(500, { message: "Server error" });
        }
    },

    updateCategory: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const id = data.get("id");
        const name = data.get("name") as string;

        if (!id || !name) return fail(400, { missing: true });

        try {
            const response = await fetch(`${PUBLIC_API_URL}/service-categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId
                },
                body: JSON.stringify({ name })
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to update category" });
            }
            return { success: true };
        } catch (e) {
            return fail(500, { message: "Server error" });
        }
    },

    deleteCategory: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const id = data.get("id");

        if (!id) return fail(400, { missing: true });

        try {
            const response = await fetch(`${PUBLIC_API_URL}/service-categories/${id}`, {
                method: 'DELETE',
                headers: {
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId
                }
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to delete category" });
            }
            return { success: true };
        } catch (e) {
            return fail(500, { message: "Server error" });
        }
    },

    createService: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const name = data.get("name") as string;
        const categoryId = parseInt(data.get("categoryId") as string);
        const price = parseFloat(data.get("price") as string);
        const duration = parseInt(data.get("duration") as string);
        const description = data.get("description") as string;

        if (!name || !categoryId || isNaN(price) || isNaN(duration)) {
            return fail(400, { missing: true });
        }

        try {
            const response = await fetch(`${PUBLIC_API_URL}/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId
                },
                body: JSON.stringify({
                    name,
                    categoryId,
                    price,
                    duration,
                    description: description || ''
                })
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to create service" });
            }
            return { success: true };
        } catch (e) {
            return fail(500, { message: "Server error" });
        }
    },

    updateService: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const id = data.get("id");
        const name = data.get("name");
        const categoryId = data.get("categoryId") ? parseInt(data.get("categoryId") as string) : undefined;
        const price = data.get("price") ? parseFloat(data.get("price") as string) : undefined;
        const duration = data.get("duration") ? parseInt(data.get("duration") as string) : undefined;
        const description = data.get("description") as string;

        if (!id) return fail(400, { missing: true });

        const payload: any = {};
        if (name) payload.name = name;
        if (categoryId) payload.categoryId = categoryId;
        if (price !== undefined) payload.price = price;
        if (duration !== undefined) payload.duration = duration;
        if (description !== undefined) payload.description = description;

        try {
            const response = await fetch(`${PUBLIC_API_URL}/services/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to update service" });
            }
            return { success: true };
        } catch (e) {
            return fail(500, { message: "Server error" });
        }
    },

    deleteService: async ({ request, fetch, cookies }) => {
        const organizationId = cookies.get('organizationId');
        if (!organizationId) return fail(400, { message: "Organization not selected" });

        const data = await request.formData();
        const id = data.get("id");

        if (!id) return fail(400, { missing: true });

        try {
            const response = await fetch(`${PUBLIC_API_URL}/services/${id}`, {
                method: 'DELETE',
                headers: {
                    cookie: request.headers.get('cookie') || '',
                    'X-Organization-Id': organizationId
                }
            });

            if (!response.ok) {
                const res = await response.json();
                return fail(response.status, { message: res.error || "Failed to delete service" });
            }
            return { success: true };
        } catch (e) {
            return fail(500, { message: "Server error" });
        }
    }
};
