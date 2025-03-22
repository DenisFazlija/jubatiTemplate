<script lang="ts">
	import { page } from '$app/state';
	import Modal from '$lib/components/Modal.svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import dayjs from '$lib/dayjs';
	import * as m from '$lib/paraglide/messages.js';
	import AdminCreateEventForm from './AdminCreateEventForm.svelte';
	import type { AppointmentSchemaAdmin } from '$lib/schemas/AppointmentSchemaAdmin';
	import type { PageData } from './$types';

	type Props = {
		services: PageData['services'];
		superform: SuperForm<AppointmentSchemaAdmin>;
		isOpen: boolean;
		onClose: () => void;
		selectedDate: string;
		availableTimes: string[];
		employees: PageData['employees'];
		availableEmployees: number[];
		captcha?: boolean;
	};
	const {
		services,
		superform,
		isOpen,
		availableTimes,
		onClose,
		employees,
		availableEmployees
	}: Props = $props();

	const selectedDate = $derived(dayjs(page.url.searchParams.get('date') || undefined).toString());
</script>

<Modal {isOpen} {onClose} title={m.book_reservation()}>
	<AdminCreateEventForm
		{availableTimes}
		{superform}
		{availableEmployees}
		{employees}
		{services}
		{selectedDate}
		{onClose}
	/>
</Modal>
