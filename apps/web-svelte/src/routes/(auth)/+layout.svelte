<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Đăng nhập | Salon Pro</title>
	<meta name="description" content="Đăng nhập vào hệ thống quản lý salon" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 p-4">
	<div class="w-full max-w-md">
		{@render children()}
	</div>
</div>
