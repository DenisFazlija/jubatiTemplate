<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import ViewEventModal from './ViewEventModal.svelte';
	import { superForm } from 'sveltekit-superforms';
	import Menu from 'lucide-svelte/icons/menu';
	import sidebar from '../SideBarState.svelte';
	import dayjs from '$lib/dayjs';
	import * as m from '$lib/paraglide/messages.js';
	import AdminCreateEventModal from './AdminCreateEventModal.svelte';
	import type { TimeSlot } from '../../api/time-slots/+server';
	import EditEventModal from './EditEventModal.svelte';

	let { data }: { data: PageData } = $props();
	const superform = superForm(data.form);
	const editSuperform = superForm(data.editForm);
	const { form } = superform;

	let services = $state(data.services);
	let availableTimes = $state<string[]>([]);
	let availableEmployees = $state<number[]>([]);

	async function fetchTimeSlotData(date: string, serviceId: number, selectedTime?: string) {
		try {
			const params = new URLSearchParams({
				date,
				serviceId: serviceId.toString()
			});
			const response = await fetch(`/api/time-slots?${params}`);
			const data = (await response.json()) as { timeSlots: TimeSlot[] };

			// Update available times
			availableTimes = data.timeSlots.filter((slot) => slot.available).map((slot) => slot.time);

			// If a time is selected, update available employees
			if (selectedTime) {
				const timeSlot = data.timeSlots.find((slot) => slot.time === selectedTime);
				availableEmployees = timeSlot?.employeeIds ?? [];
			} else {
				availableEmployees = [];
			}
		} catch (error) {
			console.error('Error fetching time slot data:', error);
			availableTimes = [];
			availableEmployees = [];
		}
	}

	let formDate = $derived($form.date);
	let formService = $derived($form.service);
	let formTime = $derived($form.time);

	$effect(() => {
		if (formDate && formService) {
			fetchTimeSlotData(formDate, formService, formTime);
		} else {
			availableTimes = [];
			availableEmployees = [];
		}
	});

	let container: HTMLDivElement;
	let containerNav: HTMLDivElement;
	let containerOffset: HTMLDivElement;
	let createModalOpen = $state(false);
	let viewModalOpen = $state(false);
	let editModalOpen = $state(false);
	let selectedAppointment = $state<PageData['appointments'][number] | null>(null);

	function handleAppointmentClick(appointment: PageData['appointments'][number]) {
		selectedAppointment = appointment;
		viewModalOpen = true;
	}
	// Function to handle edit request from View Modal
	function handleEditAppointment(appointment: PageData['appointments'][number]) {
		selectedAppointment = appointment;
		viewModalOpen = false; // Close view modal

		// Fetch time slot data for the edit modal
		if (appointment.date && appointment.serviceId) {
			fetchTimeSlotData(appointment.date, appointment.serviceId, appointment.time_from);
		}

		editModalOpen = true; // Open edit modal
	}

	function classNames(...classes: (string | boolean | undefined | null)[]): string {
		return classes.filter(Boolean).join(' ');
	}

	onMount(() => {
		if (container && containerNav && containerOffset) {
			const currentMinute = dayjs().hour() * 60 + dayjs().minute();

			container.scrollTop =
				((container.scrollHeight - containerNav.offsetHeight - containerOffset.offsetHeight) *
					currentMinute) /
				1440;
		}
	});

	function previousDay() {
		const currentDate = dayjs(page.url.searchParams.get('date') || undefined);
		const dateStr = currentDate.subtract(1, 'day').format('YYYY-MM-DD');
		goto(`?date=${dateStr}`);
	}

	function nextDay() {
		const currentDate = dayjs(page.url.searchParams.get('date') || undefined);
		const dateStr = currentDate.add(1, 'day').format('YYYY-MM-DD');
		goto(`?date=${dateStr}`);
	}

	const selectedDate = $derived(dayjs(page.url.searchParams.get('date') || undefined));
</script>

<header
	class="sticky top-0 z-10 flex flex-none items-center justify-between border-b border-gray-200 bg-gray-800 px-4 py-4"
>
	<!-- Left section: Menu on mobile, empty on desktop -->
	<div class="flex items-center">
		<button type="button" onclick={() => sidebar.open()} class="mr-4 p-2 text-white xl:hidden">
			<span class="sr-only">Open sidebar</span>
			<Menu aria-hidden="true" className="size-5" />
		</button>

		<!-- Empty space on desktop -->
		<div class="hidden w-8 xl:block"></div>
	</div>

	<!-- Center section: COMPLETELY NEW APPROACH -->
	<div class="flex items-center text-white">
		<!-- Previous day button - now just a plain button -->
		<button
			type="button"
			class="mr-3 flex items-center justify-center rounded p-1.5 hover:bg-gray-700"
			onclick={previousDay}
		>
			<ChevronLeft class="size-5" />
		</button>

		<!-- Date display - no date picker tricks, just text and a separate button -->
		<div class="text-center">
			<div class="font-medium sm:text-lg">
				<span class="sm:hidden">{selectedDate.format('MMM DD')}</span>
				<span class="hidden sm:inline">{selectedDate.format('MMMM DD, YYYY')}</span>
			</div>
			<div class="text-xs text-gray-300">
				{selectedDate.format('dddd')}
			</div>
		</div>

		<!-- Next day button - now just a plain button -->
		<button
			type="button"
			class="ml-3 flex items-center justify-center rounded p-1.5 hover:bg-gray-700"
			onclick={nextDay}
		>
			<ChevronRight class="size-5" />
		</button>

		<!-- Add a separate calendar button that shows native date picker -->
		<div class="relative ml-4">
			<input
				type="date"
				id="datePicker"
				class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
				value={selectedDate.format('YYYY-MM-DD')}
				onchange={(e) => {
					const newDate = e.currentTarget.value;
					if (newDate) {
						goto(`?date=${newDate}`);
					}
				}}
			/>
			<!-- Increased padding for larger touch target -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
				<line x1="16" y1="2" x2="16" y2="6"></line>
				<line x1="8" y1="2" x2="8" y2="6"></line>
				<line x1="3" y1="10" x2="21" y2="10"></line>
			</svg>
		</div>
	</div>

	<!-- Right section: Add button -->
	<div>
		<button
			type="button"
			class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
			onclick={() => (createModalOpen = true)}
		>
			{m.add()}
		</button>
	</div>
</header>
<div class="isolate flex flex-auto overflow-hidden bg-white">
	<div bind:this={container} class="flex flex-auto flex-col overflow-auto">
		<div
			bind:this={containerNav}
			class="sticky top-0 z-10 grid flex-none grid-cols-7 bg-white text-xs text-gray-500 shadow ring-1 ring-black/5 md:hidden"
		>
			{#each { length: 7 }, i}
				{@const date = selectedDate.subtract(3 - i, 'day')}
				<button type="button" class="flex flex-col items-center pb-1.5 pt-3">
					<span>{date.format('dd')}</span>
					<span
						class={classNames(
							'mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold',
							date.isSame(selectedDate, 'day') && 'bg-gray-900 text-white',
							date.isSame(dayjs(), 'day') && 'text-indigo-600',
							!date.isSame(selectedDate, 'day') && !date.isSame(dayjs(), 'day') && 'text-gray-900'
						)}
					>
						{date.format('D')}
					</span>
				</button>
			{/each}
		</div>
		<div class="flex w-full flex-auto">
			<div class="w-14 flex-none bg-white ring-1 ring-gray-100"></div>
			<div class="grid flex-auto grid-cols-1 grid-rows-1">
				<!-- Time grid -->
				<div
					class="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
					style="grid-template-rows: repeat(48, minmax(3.5rem, 1fr))"
				>
					<div bind:this={containerOffset} class="row-end-1 h-7"></div>
					{#each { length: 24 }, hour}
						<div>
							<div
								class="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400"
							>
								{hour === 0
									? '12AM'
									: hour < 12
										? `${hour}AM`
										: hour === 12
											? '12PM'
											: `${hour - 12}PM`}
							</div>
						</div>
						<div></div>
					{/each}
				</div>

				<!-- Events -->
				<ol
					class="col-start-1 col-end-2 row-start-1 grid"
					style="grid-template-rows: 1.75rem repeat(288, minmax(0, 1fr)) auto"
				>
					{#each data.appointments as appointment (appointment.id)}
						{@const startTime = dayjs(`${appointment.time_from}`, 'HH:mm')}
						{@const endTime = dayjs(`${appointment.time_to}`, 'HH:mm')}
						{@const colors = [
							'bg-blue-50 hover:bg-blue-100 text-blue-700',
							'bg-green-50 hover:bg-green-100 text-green-700',
							'bg-purple-50 hover:bg-purple-100 text-purple-700',
							'bg-red-50 hover:bg-red-100 text-red-700',
							'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
						]}
						{@const colorIndex = appointment.employeeId % colors.length}
						{@const startRow = startTime.hour() * 12 + Math.floor(startTime.minute() / 5) + 2}
						{@const durationInMinutes = endTime.diff(startTime, 'minute')}
						{@const span = Math.floor(durationInMinutes / 5)}
						<li class="relative mt-px flex" style="grid-row: {startRow} / span {span}">
							<button
								type="button"
								class="group absolute inset-1 flex flex-col rounded-lg bg-blue-50 p-2 text-xs/5 hover:bg-blue-100 {colors[
									colorIndex
								]} appearance-none overflow-hidden border-0 text-left"
								onclick={() => handleAppointmentClick(appointment)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleAppointmentClick(appointment);
									}
								}}
							>
								<p class="order-1 truncate font-semibold text-blue-700">
									{appointment.serviceName} - {appointment.firstName}
									{appointment.lastName}
								</p>
								<p class="truncate text-blue-500 group-hover:text-blue-700">
									<time datetime={appointment.time_from}>
										{startTime.format('H:mm')} - {endTime.format('H:mm')}
									</time>
									{appointment.employeeName}
								</p>
							</button>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</div>

<AdminCreateEventModal
	{services}
	{availableTimes}
	{superform}
	{availableEmployees}
	isOpen={createModalOpen}
	onClose={() => (createModalOpen = false)}
	selectedDate={selectedDate.format('YYYY-MM-DD')}
	employees={data.employees}
	captcha={false}
/>
<!-- View Event Modal -->
<ViewEventModal
	isOpen={viewModalOpen}
	onClose={() => (viewModalOpen = false)}
	appointment={selectedAppointment}
	onEdit={handleEditAppointment}
/>

<!-- Edit Event Modal -->
<EditEventModal
	isOpen={editModalOpen}
	onClose={() => (editModalOpen = false)}
	appointment={selectedAppointment}
	services={data.services}
	employees={data.employees}
	editForm={editSuperform}
	{availableTimes}
	{availableEmployees}
/>
