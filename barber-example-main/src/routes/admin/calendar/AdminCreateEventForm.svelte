<script lang="ts">
	import type { SuperForm } from 'sveltekit-superforms';
	import * as m from '$lib/paraglide/messages.js';
	import dayjs from '$lib/dayjs';
	import type { AppointmentSchemaAdmin } from '$lib/schemas/AppointmentSchemaAdmin';
	import OptionalTag from '$lib/components/OptionalTag.svelte';
	import type { PageData } from './$types';

	type Props = {
		services: PageData['services'];
		superform: SuperForm<AppointmentSchemaAdmin>;
		selectedDate: string;
		availableTimes: string[];
		employees: PageData['employees'];
		availableEmployees: number[];
		onClose?: () => void;
	};
	const { services, superform, availableTimes, employees, availableEmployees, onClose }: Props =
		$props();

	const { form, errors, constraints, enhance } = superform;

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

	form.update(
		($form) => {
			$form.service = services[0].id;
			$form.date = dayjs().format('YYYY-MM-DD');
			return $form;
		},
		{ taint: false }
	);
</script>

<form
	method="POST"
	action="?/add"
	use:enhance={{
		onResult: ({ result }) => {
			if (result.type === 'success') onClose?.();
		}
	}}
>
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
				<option value="" disabled selected>{m.select_service()}</option>
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
			/>
		</div>
	</div>

	<!-- Step 2: Available Times -->
	{#if $form.date && $form.service && availableTimes.length > 0}
		<div class="my-6">
			<label for="time" class="block text-sm font-medium text-gray-700">{m.available_times()}</label
			>
			<select
				id="time"
				bind:value={$form.time}
				name="time"
				class="mt-1 block w-full rounded-md border bg-white px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 {$errors.time
					? 'border-red-500 focus:border-red-500 focus:ring-red-500'
					: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}"
			>
				<option value="" disabled selected>{m.select_time()}</option>
				{#each availableTimes as time (time)}
					<option value={time}>{time}</option>
				{/each}
			</select>
		</div>
	{:else}
		{m.no_available_times()}
	{/if}

	<!-- Step 3: Available Employees -->
	{#if $form.time && availableEmployees.length > 0}
		<div class="my-6">
			<span class="block text-sm font-medium text-gray-700">{m.available_employees()}</span>
			<div class="mt-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each employees.filter( (emp) => availableEmployees.includes(emp.id) ) as employee (employee.id)}
					<label
						class="relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none"
						for={employee.id.toString()}
					>
						<input
							id={employee.id.toString()}
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
	{/if}

	<!-- Step 4: Customer Information -->
	{#if $form.employeeId && availableEmployees.length > 0}
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
				<label for="lastName" class="block text-sm font-medium text-gray-700">{m.last_name()}</label
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
	{/if}

	<!-- Submit Button -->
	{#if $form.employeeId}
		<button
			disabled={!isValid}
			type="submit"
			class="mt-6 flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {isValid
				? 'bg-indigo-600 hover:bg-indigo-700'
				: 'cursor-not-allowed bg-indigo-400'}"
		>
			{m.book_reservation()}
		</button>
	{/if}
</form>
