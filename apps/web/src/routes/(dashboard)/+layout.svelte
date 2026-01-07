<script lang="ts">
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';

	let { children, data } = $props();
	let sidebarCollapsed = $state(false);

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}
</script>

<div class="flex h-screen overflow-hidden">
	<!-- Sidebar -->
	<Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

	<!-- Main content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<Header user={data.user} />
		<main class="flex-1 overflow-y-auto bg-background p-6">
			{@render children()}
		</main>
	</div>
</div>
