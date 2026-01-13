<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Sign In | Salon Pro</title>
	<meta name="description" content="Sign in to Salon Pro" />
</svelte:head>

<div class="min-h-screen">
	{@render children()}
</div>
