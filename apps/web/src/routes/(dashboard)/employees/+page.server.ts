import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: employees, error } = await locals.supabase
		.from('employee')
		.select('*')
		.order('name');

	return { employees: employees ?? [] };
};
