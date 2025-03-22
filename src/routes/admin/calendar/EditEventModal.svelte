<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';
	import Modal from '$lib/components/Modal.svelte';
	import type { PageData } from './$types';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { EditAppointmentSchemaAdmin } from '$lib/schemas/AppointmentSchemaAdmin';
	import dayjs from '$lib/dayjs';
	import OptionalTag from '$lib/components/OptionalTag.svelte';

	type Props = {
		isOpen: boolean;
		onClose: () => void;
		appointment: PageData['appointments'][number] | null;
		services: PageData['services'];
		employees: PageData['employees'];
		editForm: SuperForm<EditAppointmentSchemaAdmin, unknown>;
		availableTimes: string[];
		availableEmployees: number[];
	};

	const {
		isOpen,
		onClose,
		appointment,
		services,
		employees,
		editForm,
		availableTimes,
		availableEmployees
	}: Props = $props();

	const { form, errors, constraints, enhance } = editForm;

	function isFormComplete() {
		return (
			$form.firstName &&
			$form.lastName &&
			$form.service &&
			$form.date &&
			$form.time &&
			$form.employeeId
		);
	}

	let isValid = $derived(isFormComplete() && Object.keys($errors).length === 0);

	// We need to watch if the appointment changes to update the form
	$effect(() => {
		if (appointment && isOpen) {
			// Pre-fill the form with appointment data
			form.update(
				($form) => {
					$form.firstName = appointment.firstName;
					$form.lastName = appointment.lastName;
					$form.email = appointment.email || null;
					$form.phone = appointment.phone || null;
					$form.street = appointment.street || null;
					$form.zip = appointment.zip || null;
					$form.city = appointment.city || null;
					$form.employeeId = appointment.employeeId;
					$form.date = appointment.date;
					$form.time = appointment.time_from;
					$form.service = appointment.serviceId;
					$form.description = appointment.description || null;
					return $form;
				},
				{ taint: false }
			);
		}
	});

	const isOpenAndAppointment = $derived(isOpen && appointment !== null);
</script>

<Modal isOpen={isOpenAndAppointment} {onClose} title={m.edit_appointment()}>
	<div class="mt-4">
		<form
			method="POST"
			action="?/edit"
			use:enhance={{
				onResult: ({ result }) => {
					if (result.type === 'success') {
						invalidateAll();
						onClose();
					}
				}
			}}
		>
			<!-- Hidden appointment ID field -->
			<input type="hidden" name="appointmentId" value={appointment?.id} />

			<!-- Step 1: Service Type and Date -->
			<div class="my-6 grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<label for="type" class="block text-sm font-medium text-gray-700">{m.type()}</label>
					<select
						id="type"
						bind:value={$form.service}
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.service
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						name="service"
					>
						{#each services as service (service.id)}
							<option value={service.id}>{service.service}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="date" class="block text-sm font-medium text-gray-700">{m.date()}</label>
					<input
						type="date"
						id="date"
						name="date"
						bind:value={$form.date}
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.date
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						min={dayjs().format('YYYY-MM-DD')}
					/>
				</div>
			</div>

			<!-- Step 2: Available Times -->
			<div class="my-6">
				<label for="time" class="block text-sm font-medium text-gray-700"
					>{m.available_times()}</label
				>
				<select
					id="time"
					bind:value={$form.time}
					name="time"
					class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.time
						? 'border-red-500 focus:border-red-500 focus:ring-red-500'
						: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
				>
					<option value={appointment?.time_from}>{appointment?.time_from} (Current)</option>
					{#each availableTimes as time (time)}
						{#if time !== appointment?.time_from}
							<option value={time}>{time}</option>
						{/if}
					{/each}
				</select>
			</div>

			<!-- Step 3: Available Employees -->
			<div class="my-6">
				<span class="block text-sm font-medium text-gray-700">{m.available_employees()}</span>
				<div class="mt-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<!-- Current employee is always available -->
					<label
						class="relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none"
						for={`employee-${appointment?.employeeId}`}
					>
						<input
							id={`employee-${appointment?.employeeId}`}
							type="radio"
							name="employeeId"
							value={appointment?.employeeId}
							bind:group={$form.employeeId}
							class="sr-only"
						/>
						<div class="flex w-full items-center justify-between">
							<div class="flex items-center">
								<div class="text-sm">
									<p class="font-medium text-gray-900">
										{appointment?.employeeName} (Current)
									</p>
								</div>
							</div>
							<div
								class="ml-4 h-5 w-5 shrink-0 rounded-full border-2"
								class:border-indigo-500={$form.employeeId === appointment?.employeeId}
								class:bg-indigo-600={$form.employeeId === appointment?.employeeId}
							></div>
						</div>
					</label>

					<!-- Other available employees -->
					{#each employees.filter((emp) => availableEmployees.includes(emp.id) && emp.id !== appointment?.employeeId) as employee (employee.id)}
						<label
							class="relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none"
							for={`employee-${employee.id}`}
						>
							<input
								id={`employee-${employee.id}`}
								type="radio"
								name="employeeId"
								value={employee.id}
								bind:group={$form.employeeId}
								class="sr-only"
							/>
							<div class="flex w-full items-center justify-between">
								<div class="flex items-center">
									<div class="text-sm">
										<p class="font-medium text-gray-900">{employee.name}</p>
									</div>
								</div>
								<div
									class="ml-4 h-5 w-5 shrink-0 rounded-full border-2"
									class:border-indigo-500={$form.employeeId === employee.id}
									class:bg-indigo-600={$form.employeeId === employee.id}
								></div>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<!-- Customer Information -->
			<div class="my-6 grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<label for="firstName" class="block text-sm font-medium text-gray-700"
						>{m.first_name()}</label
					>
					<input
						type="text"
						required
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.firstName
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						bind:value={$form.firstName}
						name="firstName"
						{...$constraints.firstName}
					/>
				</div>

				<div>
					<label for="lastName" class="block text-sm font-medium text-gray-700"
						>{m.last_name()}</label
					>
					<input
						type="text"
						required
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.lastName
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						bind:value={$form.lastName}
						name="lastName"
						{...$constraints.lastName}
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700"
						>{m.email()} <OptionalTag /></label
					>
					<input
						type="email"
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.email
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						bind:value={$form.email}
						name="email"
						{...$constraints.email}
					/>
				</div>

				<div>
					<label for="phone" class="block text-sm font-medium text-gray-700"
						>{m.phone()} <OptionalTag /></label
					>
					<input
						type="tel"
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.phone
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						bind:value={$form.phone}
						name="phone"
						{...$constraints.phone}
					/>
				</div>

				<div class="md:col-span-2">
					<label for="street" class="block text-sm font-medium text-gray-700"
						>{m.street()} <OptionalTag /></label
					>
					<input
						type="text"
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.street
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						bind:value={$form.street}
						name="street"
						{...$constraints.street}
					/>
				</div>

				<div>
					<label for="zipcode" class="block text-sm font-medium text-gray-700"
						>{m.zipcode()} <OptionalTag /></label
					>
					<input
						type="text"
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.zip
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						bind:value={$form.zip}
						name="zip"
						{...$constraints.zip}
					/>
				</div>

				<div>
					<label for="city" class="block text-sm font-medium text-gray-700"
						>{m.city()} <OptionalTag /></label
					>
					<input
						type="text"
						class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.city
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						bind:value={$form.city}
						name="city"
						{...$constraints.city}
					/>
				</div>
				<div class="md:col-span-2">
					<label for="description" class="block text-sm font-medium text-gray-700"
						>{m.description()} <OptionalTag /></label
					>
					<textarea
						id="description"
						rows="4"
						class="mt-1 block max-h-64 min-h-24 w-full resize-y rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.description
							? 'border-red-500 focus:border-red-500 focus:ring-red-500'
							: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
						bind:value={$form.description}
						name="description"
						{...$constraints.description}
					></textarea>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="mt-6 flex justify-end space-x-3">
				<button
					type="button"
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
					onclick={onClose}
				>
					{m.cancel()}
				</button>
				<button
					type="submit"
					class="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {isValid
						? 'bg-indigo-600 hover:bg-indigo-700'
						: 'cursor-not-allowed bg-indigo-400'}"
					disabled={!isValid}
				>
					{m.save()}
				</button>
			</div>
		</form>
	</div>
</Modal>
