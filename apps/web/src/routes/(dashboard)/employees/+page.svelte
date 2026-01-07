<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	const filteredEmployees = $derived(
		data.employees.filter(employee =>
			employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			employee.phone?.includes(searchQuery)
		)
	);
</script>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold tracking-tight">Nhân viên</h1>
		<div class="flex flex-col sm:flex-row gap-4 justify-between">
			<div class="relative flex-1 max-w-sm">
				<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
				</svg>
				<input
					type="text"
					placeholder="Tìm kiếm nhân viên..."
					bind:value={searchQuery}
					class="input pl-10"
				/>
			</div>
			<button class="btn btn-primary btn-md">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/><path d="M12 5v14"/>
				</svg>
				Thêm nhân viên
			</button>
		</div>
	</div>

	<!-- Employee Cards Grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#if filteredEmployees.length === 0}
			<div class="col-span-full text-center py-12 text-muted-foreground">
				{searchQuery ? 'Không tìm thấy nhân viên nào' : 'Chưa có nhân viên nào'}
			</div>
		{:else}
			{#each filteredEmployees as employee}
				<div class="card p-4 hover:shadow-md transition-shadow">
					<div class="flex flex-col items-center text-center gap-3">
						<div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
							<span class="text-2xl font-semibold text-primary">
								{employee.name?.charAt(0) || 'N'}
							</span>
						</div>
						<div>
							<h3 class="font-medium">{employee.name}</h3>
							<p class="text-sm text-muted-foreground">{employee.position || 'Nhân viên'}</p>
						</div>
						<div class="flex flex-col gap-1 text-sm text-muted-foreground">
							{#if employee.phone}
								<div class="flex items-center gap-2">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
									</svg>
									{employee.phone}
								</div>
							{/if}
							{#if employee.email}
								<div class="flex items-center gap-2">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
									</svg>
									{employee.email}
								</div>
							{/if}
						</div>
						<div class="flex gap-2 mt-2">
							<button class="btn btn-outline btn-sm">Chỉnh sửa</button>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
