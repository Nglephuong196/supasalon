import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [servicesResult, categoriesResult] = await Promise.all([
		locals.supabase
			.from('service')
			.select('*, service_category(id, name)')
			.order('name'),
		locals.supabase
			.from('service_category')
			.select('*')
			.order('name')
	]);

	return {
		services: servicesResult.data ?? [],
		categories: categoriesResult.data ?? []
	};
};
