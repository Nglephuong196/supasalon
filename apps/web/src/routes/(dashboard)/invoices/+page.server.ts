import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import type { Invoice } from '$lib/types';
import { RESOURCES, ACTIONS } from '@repo/constants';
import { checkPermission, getResourcePermissions } from '$lib/permissions';
import { PUBLIC_API_URL } from '$env/static/public';

// ... (previous imports)
import { fail, type Actions } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
    // ... (existing load function code remains unchanged)
    const organizationId = cookies.get('organizationId');
    const { memberRole, memberPermissions } = await parent();

    // Check read permission - redirect if denied
    if (!checkPermission(memberRole, memberPermissions, RESOURCES.INVOICE, ACTIONS.READ)) {
        throw redirect(302, '/unauthorized');
    }

    // Get permission flags for UI
    const permissions = getResourcePermissions(memberRole, memberPermissions, RESOURCES.INVOICE);

    if (!organizationId) {
        return { invoices: [], ...permissions };
    }

    // handleFetch automatically injects cookies and X-Organization-Id
    try {
        const [invoicesRes, openInvoicesRes, customersRes, membersRes, servicesRes, productsRes, serviceCatsRes, productCatsRes] = await Promise.all([
            fetch(`${PUBLIC_API_URL}/invoices`),
            fetch(`${PUBLIC_API_URL}/invoices?isOpenInTab=true&date=today`),
            fetch(`${PUBLIC_API_URL}/customers`),
            fetch(`${PUBLIC_API_URL}/members`),
            fetch(`${PUBLIC_API_URL}/services`),
            fetch(`${PUBLIC_API_URL}/products`),
            fetch(`${PUBLIC_API_URL}/service-categories`),
            fetch(`${PUBLIC_API_URL}/product-categories`)
        ]);

        if (invoicesRes.status === 403) {
            throw redirect(302, '/unauthorized');
        }

        if (!invoicesRes.ok) {
            throw error(invoicesRes.status, 'Failed to fetch invoices');
        }

        const invoices: Invoice[] = await invoicesRes.json();
        const openInvoices: Invoice[] = openInvoicesRes.ok ? await openInvoicesRes.json() : [];
        const customers = customersRes.ok ? await customersRes.json() : [];
        const members = membersRes.ok ? await membersRes.json() : [];
        let services = servicesRes.ok ? await servicesRes.json() : [];
        let products = productsRes.ok ? await productsRes.json() : [];

        const serviceParams = serviceCatsRes.ok ? await serviceCatsRes.json() : [];
        const productParams = productCatsRes.ok ? await productCatsRes.json() : [];

        // Map categories
        const sCatsMap = new Map(serviceParams.map((c: any) => [c.id, c]));
        const pCatsMap = new Map(productParams.map((c: any) => [c.id, c]));

        services = services.map((s: any) => ({
            ...s,
            category: sCatsMap.get(s.categoryId) || null
        }));

        products = products.map((p: any) => ({
            ...p,
            category: pCatsMap.get(p.categoryId) || null
        }));

        return {
            invoices,
            openInvoices,
            customers,
            staff: members.map((m: any) => ({ id: m.id, name: m.user?.name || m.userId, ...m })), // Quick map
            services,
            products,
            ...permissions
        };
    } catch (e) {
        if ((e as any)?.status === 302) throw e;
        console.error('Error fetching invoices data:', e);
        return { invoices: [], customers: [], staff: [], services: [], products: [], ...permissions };
    }
};

export const actions: Actions = {
    create: async ({ fetch }) => {
        try {
            const { id, ...cleanBody } = {
                subtotal: 0,
                total: 0,
                status: "pending",
            } as any;

            console.log("Creating invoice with data:", cleanBody);

            const res = await fetch(`${PUBLIC_API_URL}/invoices`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanBody),
            });

            if (!res.ok) {
                const err = await res.json();
                console.log("Create Invoice API Error:", err);
                return fail(res.status, { message: err.message || err.error || "Không thể tạo hóa đơn" });
            }

            const newInvoice = await res.json();
            return { success: true, invoice: newInvoice };
        } catch (e) {
            console.error(e);
            return fail(500, { message: "Connection error" });
        }
    },

    update: async ({ request, fetch }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const payloadStr = formData.get('payload');

        if (!id || !payloadStr) {
            return fail(400, { message: "Missing required data" });
        }

        try {
            const payload = JSON.parse(payloadStr as string);
            const res = await fetch(`${PUBLIC_API_URL}/invoices/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                console.log("API Error Response:", err);
                return fail(res.status, { message: err.message || err.error || "Không thể tạo hóa đơn" });
            }

            const updatedInvoice = await res.json();
            return { success: true, invoice: updatedInvoice };

        } catch (e) {
            console.error(e);
            return fail(500, { message: "Connection error" });
        }
    },

    delete: async ({ request, fetch }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, { message: "Missing invoice ID" });
        }

        try {
            const res = await fetch(`${PUBLIC_API_URL}/invoices/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                return fail(res.status, { message: "Failed to delete/cancel invoice" });
            }

            return { success: true, deletedId: id };
        } catch (e) {
            console.error(e);
            return fail(500, { message: "Connection error" });
        }
    },

    close: async ({ request, fetch }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, { message: "Missing invoice ID" });
        }

        try {
            const res = await fetch(`${PUBLIC_API_URL}/invoices/${id}/close`, {
                method: "POST",
            });

            if (!res.ok) {
                return fail(res.status, { message: "Failed to close invoice tab" });
            }

            return { success: true, closedId: id };
        } catch (e) {
            console.error(e);
            return fail(500, { message: "Connection error" });
        }
    },

    bulk: async ({ request, fetch }) => {
        const formData = await request.formData();
        const actionType = formData.get('actionType') as string;
        const ids = formData.getAll('ids').map(id => id.toString());

        if (!ids.length || !actionType) {
            return fail(400, { message: "Missing required data" });
        }

        let successCount = 0;
        let failCount = 0;

        for (const id of ids) {
            try {
                let res;
                if (actionType === 'cancel') {
                    res = await fetch(`${PUBLIC_API_URL}/invoices/${id}`, { method: "DELETE" });
                } else if (actionType === 'complete') {
                    res = await fetch(`${PUBLIC_API_URL}/invoices/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: 'paid', isOpenInTab: false }),
                    });
                } else if (actionType === 'open') {
                    res = await fetch(`${PUBLIC_API_URL}/invoices/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isOpenInTab: true }),
                    });
                }

                if (res?.ok) successCount++;
                else failCount++;
            } catch (e) {
                failCount++;
            }
        }

        return { success: true, successCount, failCount };
    }
};
