<script lang="ts">
  let { children } = $props();
</script>

<svelte:head>
  <title>Sign In | SupaSalon</title>
  <meta name="description" content="Sign in to SupaSalon" />
</svelte:head>

<div class="min-h-screen">
  {@render children()}
</div>
