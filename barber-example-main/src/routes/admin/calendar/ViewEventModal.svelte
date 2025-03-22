<script lang="ts">
	import { enhance } from '$app/forms';
	import dayjs from 'dayjs';
	import { invalidateAll } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';
	import Modal from '$lib/components/Modal.svelte';
	import type { PageData } from './$types';
	import Pencil from 'lucide-svelte/icons/pencil'; // Import edit icon

	type Props = {
		isOpen: boolean;
		onClose: () => void;
		appointment: PageData['appointments'][number] | null;
		onEdit: (appointment: PageData['appointments'][number]) => void; // New prop for edit action
	};
	const { isOpen, onClose, appointment, onEdit = () => {} }: Props = $props();

	let isDeleting = $state(false);

	function handleDeleteSubmit() {
		isDeleting = true;
	}

	function handleEdit() {
		if (appointment) {
			onEdit(appointment);
		}
	}

	const isOpenAndAppointment = $derived(isOpen && appointment !== null);
</script>

<Modal isOpen={isOpenAndAppointment} {onClose} title={m.appointment_details()}>
	<div class="mt-4 space-y-4">
		<div>
			<p class="text-sm font-medium text-gray-500">{m.employee()}</p>
			<p class="text-gray-900">{appointment?.employeeName}</p>
		</div>
		<div>
			<p class="text-sm font-medium text-gray-500">{m.service()}</p>
			<p class="text-gray-900">{appointment?.serviceName}</p>
		</div>
		<div>
			<p class="text-sm font-medium text-gray-500">{m.customer()}</p>
			<p class="text-gray-900">{appointment?.firstName} {appointment?.lastName}</p>
		</div>
		<div>
			<p class="text-sm font-medium text-gray-500">{m.time()}</p>
			<p class="text-gray-900">
				{dayjs(`${appointment?.time_from}`, 'hh:mm').format('h:mm')} -
				{dayjs(`${appointment?.time_to}`, 'hh:mm').format('h:mm')}
			</p>
		</div>
		{#if appointment?.description}
			<div>
				<p class="text-sm font-medium text-gray-500">{m.description()}</p>
				<p class="text-gray-900">
					{appointment?.description}
				</p>
			</div>
		{/if}
		<div class="mt-6 flex justify-between">
			<!-- Added Edit button -->
			<button
				type="button"
				class="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
				onclick={handleEdit}
			>
				<Pencil class="mr-1 size-4" />
				{m.edit() || 'Edit'}
			</button>

			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					handleDeleteSubmit();
					return async ({ result, update }) => {
						if (result.type === 'success') {
							await invalidateAll();
							onClose();
						} else update();
						isDeleting = false;
					};
				}}
			>
				<input type="hidden" name="id" value={appointment?.id} />
				<button
					type="submit"
					class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-500 disabled:opacity-50"
					disabled={isDeleting}
				>
					{isDeleting ? m.deleting() : m.delete_action()}
				</button>
			</form>
		</div>
	</div>
</Modal>
