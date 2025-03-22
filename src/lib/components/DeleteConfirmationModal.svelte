<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		isOpen: boolean;
		onClose: () => void;
		onDelete: () => void;
	};
	const { isOpen, onClose, onDelete }: Props = $props();

	function handleDeleteSubmit() {
		onDelete();
		onClose();
	}
</script>

<Modal {isOpen} {onClose} title={m.delete_action()}>
	<div class="py-6">
		<div class="mb-6 flex items-start">
			<!-- Warning icon -->
			<div class="mr-4 flex-shrink-0">
				<svg
					class="h-12 w-12 text-red-600"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>

			<!-- Warning text -->
			<div>
				<p class="text-gray-700">
					{m.delete_modal_dialog()}
				</p>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="mt-8 flex justify-end gap-3">
			<button
				type="button"
				class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				onclick={handleDeleteSubmit}
			>
				{m.delete_action()}
			</button>
		</div>
	</div>
</Modal>
