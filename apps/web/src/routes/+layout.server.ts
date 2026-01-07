import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { session, user } = await locals.safeGetSession();
	console.log("session", "user");

	const publicRoutes = ['/login', '/signup'];
	const isPublicRoute = publicRoutes.some((route) => url.pathname.startsWith(route));

	// If user is not logged in and trying to access protected route
	if (!user && !isPublicRoute) {
		throw redirect(303, '/login');
	}

	// If user is logged in and trying to access auth routes
	if (user && isPublicRoute) {
		throw redirect(303, '/');
	}

	return {
		session,
		user
	};
};
