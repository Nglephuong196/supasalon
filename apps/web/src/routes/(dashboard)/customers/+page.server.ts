import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";

// Mock database
let customers = [
    {
        id: "1",
        name: "Nguyễn Văn A",
        phone: "0901234567",
        email: "nguyenvana@gmail.com",
        visits: 15,
        lastVisit: "10/01/2026",
        isVip: true,
    },
    {
        id: "2",
        name: "Trần Thị B",
        phone: "0912345678",
        email: "tranthib@gmail.com",
        visits: 8,
        lastVisit: "08/01/2026",
        isVip: false,
    },
    {
        id: "3",
        name: "Lê Văn C",
        phone: "0923456789",
        email: "levanc@gmail.com",
        visits: 22,
        lastVisit: "12/01/2026",
        isVip: true,
    },
    {
        id: "4",
        name: "Phạm Thị D",
        phone: "0934567890",
        email: "phamthid@gmail.com",
        visits: 5,
        lastVisit: "05/01/2026",
        isVip: false,
    },
    {
        id: "5",
        name: "Hoàng Văn E",
        phone: "0945678901",
        email: "hoangvane@gmail.com",
        visits: 12,
        lastVisit: "11/01/2026",
        isVip: false,
    },
    {
        id: "6",
        name: "Võ Thị F",
        phone: "0956789012",
        email: "vothif@gmail.com",
        visits: 18,
        lastVisit: "09/01/2026",
        isVip: true,
    },
];

export const load: PageServerLoad = async () => {
    return {
        customers,
    };
};

export const actions: Actions = {
    createCustomer: async ({ request }) => {
        const data = await request.formData();
        const name = data.get("name") as string;
        const phone = data.get("phone") as string;
        const email = data.get("email") as string;

        if (!name || !phone || !email) {
            return fail(400, { missing: true });
        }

        // Simulate database delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Add to mock database
        const newCustomer = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            phone,
            email,
            visits: 0,
            lastVisit: new Date().toLocaleDateString("vi-VN"),
            isVip: false,
        };

        customers = [newCustomer, ...customers];

        return { success: true };
    },
};
