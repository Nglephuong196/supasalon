import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { VIETNAM_PHONE_REGEX } from '@repo/constants';

const API_URL = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8787';

// Helper to parse Set-Cookie header
const parseSetCookie = (header: string) => {
    const parts = header.split(';');
    const [name, ...valueParts] = parts[0].split('=');
    const value = valueParts.join('=');
    const options: any = { path: '/' };

    parts.slice(1).forEach(part => {
        const [key, val] = part.trim().split('=');
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'path') options.path = val;
        else if (lowerKey === 'httponly') options.httpOnly = true;
        else if (lowerKey === 'secure') options.secure = true;
        else if (lowerKey === 'samesite') options.sameSite = val.toLowerCase();
        else if (lowerKey === 'max-age') options.maxAge = parseInt(val);
        else if (lowerKey === 'expires') options.expires = new Date(val);
    });
    return { name, value, options };
};

export const actions: Actions = {
    default: async ({ request, cookies, fetch }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        const ownerName = formData.get('ownerName') as string;
        const ownerPhone = formData.get('ownerPhone') as string;
        const salonName = formData.get('salonName') as string;
        const province = formData.get('province') as string;
        const address = formData.get('address') as string;

        // Validation
        const errors: Record<string, string> = {};

        if (!email) errors.email = "Email là bắt buộc";
        if (!password) errors.password = "Mật khẩu là bắt buộc";
        if (password.length < 8) errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
        if (password !== confirmPassword) errors.confirmPassword = "Mật khẩu không khớp";
        if (!ownerName) errors.ownerName = "Họ tên là bắt buộc";
        if (!ownerPhone) errors.ownerPhone = "Số điện thoại là bắt buộc";
        else if (!VIETNAM_PHONE_REGEX.test(ownerPhone)) errors.ownerPhone = "Số điện thoại không hợp lệ";
        if (!salonName) errors.salonName = "Tên Salon là bắt buộc";
        if (!province) errors.province = "Vui lòng chọn Tỉnh/Thành phố";
        if (!address) errors.address = "Địa chỉ là bắt buộc";

        if (Object.keys(errors).length > 0) {
            return fail(400, {
                data: { email, ownerName, ownerPhone, salonName, province, address },
                errors
            });
        }

        try {
            // 1. Sign Up User
            const signUpRes = await fetch(`${API_URL}/api/auth/sign-up/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    name: ownerName,
                    image: undefined
                })
            });

            // DEBUG LOGGING
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.resolve('debug_auth.log');
                const logData = `\n[${new Date().toISOString()}] SignUp Response Status: ${signUpRes.status}\n` +
                    `SignUp Set-Cookie: ${signUpRes.headers.get('set-cookie')}\n` +
                    `SignUp getSetCookie (if available): ${JSON.stringify((signUpRes.headers as any).getSetCookie ? (signUpRes.headers as any).getSetCookie() : 'N/A')}\n`;
                fs.appendFileSync(logPath, logData);
            } catch (err) {
                console.error("Failed to write log", err);
            }


            if (!signUpRes.ok) {
                const errorData = await signUpRes.json();
                return fail(400, {
                    data: { email, ownerName, ownerPhone, salonName, province, address },
                    errors: { form: errorData.message || "Đăng ký thất bại" }
                });
            }

            // Forward session cookies from Sign Up to the browser
            // And also capturing them for the next request


            // Handle parsing cookies whether they come as single header (native Fetch) or array (Node/Bun specific)
            // SvelteKit's fetch might combine them with comma, which is tricky for Dates.
            // Assuming simpler case or Set-Cookie-Parser logic can be applied if needed.

            // Collection of all cookies to pass to the next request
            const cookiesForNextRequest: string[] = [];

            const setCookie = signUpRes.headers.get('set-cookie');
            if (setCookie) {
                // Simplistic split by comma (warning: can break on Expires)
                // But typically better-auth cookies don't use Comma except as separator
                // Let's iterate. 
                // However, since we are in `actions`, `cookies.set` is the way.

                // For simplicity/robustness with Better Auth, we look for the session token.
                // Or we can try to rely on sveltekit passing cookies if we use event.fetch?
                // But API is external URL.

                // Let's parse strictly better-auth session.
                // Usually `better-auth.session_token`

                // Parsing logic:
                // We will try to preserve all cookies.
                // If SvelteKit runtime (Bun) supports `getSetCookie`, use that.

                let cookiesToSet: string[] = [];

                if (typeof (signUpRes.headers as any).getSetCookie === 'function') {
                    cookiesToSet = (signUpRes.headers as any).getSetCookie();
                } else if (setCookie) {
                    cookiesToSet = setCookie.split(/,(?=\s*[a-zA-Z0-9_-]+=)/).map(c => c.trim());
                }

                // DEBUG LOGGING
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    const logPath = path.resolve('debug_auth.log');
                    fs.appendFileSync(logPath, `Parsed Cookies to Set: ${JSON.stringify(cookiesToSet)}\n`);
                } catch (e) { }


                cookiesToSet.forEach(cookieStr => {
                    const { name, value, options } = parseSetCookie(cookieStr);
                    // Pass to client
                    cookies.set(name, value, options);

                    // Collect for next request (name=value)
                    cookiesForNextRequest.push(`${name}=${value}`);
                });
            }

            // 2. Create Organization
            const slug = salonName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

            const orgRes = await fetch(`${API_URL}/api/auth/organization/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Pass all session cookies we just got
                    'Cookie': cookiesForNextRequest.join('; ')
                },
                body: JSON.stringify({
                    name: salonName,
                    slug
                })
            });

            // DEBUG LOGGING
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.resolve('debug_auth.log');
                const logData = `[${new Date().toISOString()}] Org Response Status: ${orgRes.status}\n` +
                    `Org Set-Cookie: ${orgRes.headers.get('set-cookie')}\n`;
                fs.appendFileSync(logPath, logData);
            } catch (err) { }


            if (!orgRes.ok) {
                const errorData = await orgRes.json();
                console.error("Organization creation failed:", errorData);
                return fail(400, {
                    data: { email, ownerName, ownerPhone, salonName, province, address },
                    errors: { form: errorData.message || "Không thể tạo Salon. Vui lòng thử lại." }
                });
            }

            // Forward cookies from Organization Create (might update session)
            const orgSetCookie = orgRes.headers.get('set-cookie');
            if (orgSetCookie) {
                let cookiesToSet: string[] = [];
                if (typeof (orgRes.headers as any).getSetCookie === 'function') {
                    cookiesToSet = (orgRes.headers as any).getSetCookie();
                } else {
                    cookiesToSet = orgSetCookie.split(/,(?=\s*[a-zA-Z0-9_-]+=)/).map(c => c.trim());
                }

                cookiesToSet.forEach(cookieStr => {
                    const { name, value, options } = parseSetCookie(cookieStr);
                    cookies.set(name, value, options);
                });
            }

        } catch (error) {
            console.error(error);
            return fail(500, {
                data: { email, ownerName, ownerPhone, salonName, province, address },
                errors: { form: "Đã có lỗi xảy ra. Vui lòng thử lại sau." }
            });
        }

        throw redirect(303, '/');
    }
};
