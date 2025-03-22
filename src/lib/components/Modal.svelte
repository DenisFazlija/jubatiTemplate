<script lang="ts">
	import { fade } from 'svelte/transition';
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	let {
		isOpen,
		onClose,
		title,
		children
	}: {
		isOpen: boolean;
		onClose: () => void;
		title: string;
		children: Snippet;
	} = $props();
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 50 }}
	>
		<button aria-label="Close" class="fixed inset-0 bg-black bg-opacity-80" onclick={onClose}
		></button>
		<div
			class="relative z-50 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
		>
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold">{title}</h2>
				<button class="text-gray-400 hover:text-gray-500" onclick={onClose}>
					<X class="size-5" />
				</button>
			</div>
			<div class="mt-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
