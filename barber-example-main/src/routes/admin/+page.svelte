<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages.js';
	import sidebar from './SideBarState.svelte';
	import Menu from 'lucide-svelte/icons/menu';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';

	// Define the types for day keys
	type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
	type ShiftKey = `${DayKey}_from` | `${DayKey}_to` | 'Lunch_from' | 'Lunch_to';

	// Define employee type
	interface Employee {
		id?: number;
		name: string;
		shifts: Record<ShiftKey, string>;
	}

	const { data }: { data: PageData } = $props();

	const serviceSuperform = superForm(data.servicesForm, {
		resetForm: false,
		dataType: 'json',
		onResult: ({ result }) => {
			if (result.type === 'error') {
				toast.error('Failed to save services');
				return;
			}

			if (result.type === 'success') {
				toast.success('Services saved successfully');
			}
		},
		onError: (error) => {
			toast.error('An unexpected error occurred ' + error.result.error.message);
		}
	});

	const { form: serviceForm, enhance: serviceEnhance } = serviceSuperform;

	function updateShift(employee: Employee, key: ShiftKey, value: string) {
		employee.shifts[key] = value;
		// Trigger reactivity by updating the form
		employeeForm.update(($form) => $form, { taint: false });
	}

	function addService() {
		serviceForm.update(
			($form) => {
				$form.services = [...$form.services, { service: '', duration: 0 }];
				return $form;
			},
			{ taint: false }
		);
	}

	function removeService(id?: number, index?: number) {
		serviceForm.update(
			($form) => {
				if (id) {
					$form.services = $form.services.filter((service) => service.id !== id);
				} else if (index !== undefined) {
					$form.services = $form.services.filter((_, i) => i !== index);
				}
				return $form;
			},
			{ taint: false }
		);
	}

	const employeeSuperform = superForm(data.employeesForm, {
		resetForm: false,
		dataType: 'json',
		onResult: ({ result }) => {
			if (result.type === 'error') {
				toast.error('Failed to save employee shifts');
				return;
			}

			if (result.type === 'success') {
				toast.success('Employee shifts saved successfully');
			}
		},
		onError: (error) => {
			toast.error('An unexpected error occurred ' + error.result.error.message);
		}
	});

	const { form: employeeForm, enhance: employeeEnhance } = employeeSuperform;

	function addEmployee() {
		employeeForm.update(
			($form) => {
				$form.employees = [
					...$form.employees,
					{
						name: '',
						shifts: {
							Mon_from: '09:00',
							Mon_to: '17:00',
							Tue_from: '09:00',
							Tue_to: '17:00',
							Wed_from: '09:00',
							Wed_to: '17:00',
							Thu_from: '09:00',
							Thu_to: '17:00',
							Fri_from: '09:00',
							Fri_to: '17:00',
							Sat_from: '09:00',
							Sat_to: '17:00',
							Sun_from: '09:00',
							Sun_to: '17:00',
							Lunch_from: '12:00',
							Lunch_to: '13:00'
						}
					}
				];
				return $form;
			},
			{ taint: false }
		);
	}

	function removeEmployee(id?: number, index?: number) {
		employeeForm.update(
			($form) => {
				if (id) {
					$form.employees = $form.employees.filter((employee) => employee.id !== id);
				} else if (index !== undefined) {
					$form.employees = $form.employees.filter((_, i) => i !== index);
				}
				return $form;
			},
			{ taint: false }
		);
	}

	let deleteEmployeeOpen = $state(false);
	let deleteServiceOpen = $state(false);

	let serviceToDelete = $state<{ id?: number; index?: number } | null>(null);
	let employeeToDelete = $state<{ id?: number; index?: number } | null>(null);

	// Map short day names to full names
	const dayFullNames: Record<DayKey, string> = {
		Mon: m.monday(),
		Tue: m.tuesday(),
		Wed: m.wednesday(),
		Thu: m.thursday(),
		Fri: m.friday(),
		Sat: m.saturday(),
		Sun: m.sunday()
	};
</script>

<!-- Sidebar toggle button with improved spacing and hover effect -->
<button
	type="button"
	onclick={() => sidebar.open()}
	class="m-5 rounded-lg bg-gray-800/40 p-3 text-white transition-colors duration-200 hover:bg-gray-700/60 xl:hidden"
>
	<span class="sr-only">Open sidebar</span>
	<Menu aria-hidden="true" className="size-5" />
</button>

<!-- Main container with improved spacing and separate sections -->
<div class="mx-auto max-w-7xl divide-y divide-white/10 rounded-lg bg-gray-900/30 shadow-xl">
	<!-- Services Section -->
	<div class="grid grid-cols-1 gap-x-8 gap-y-10 px-6 py-10 sm:px-8 md:grid-cols-3 lg:px-10">
		<div class="space-y-3">
			<h2 class="text-xl font-bold tracking-tight text-white">{m.services_title()}</h2>
			<p class="text-sm leading-relaxed text-gray-400">{m.services_description()}</p>
		</div>

		<form class="md:col-span-2" use:serviceEnhance action="?/editServices" method="POST">
			<div class="grid grid-cols-1 gap-6">
				{#each $serviceForm.services as service, i (service.id)}
					<div class="col-span-full rounded-lg bg-white/5 p-6 shadow-md">
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-7">
							<div class="sm:col-span-3">
								<label for={`service-name-${i}`} class="mb-2 block text-sm font-medium text-white"
									>{m.service_name()}</label
								>
								<input
									id={`service-name-${i}`}
									type="text"
									class="block w-full rounded-md border-0 bg-white/5 px-3 py-2.5 text-white shadow-md ring-1 ring-inset ring-white/10 transition-shadow duration-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
									bind:value={service.service}
								/>
							</div>
							<div class="sm:col-span-3">
								<label
									for={`service-duration-${i}`}
									class="mb-2 block text-sm font-medium text-white">{m.duration()}</label
								>
								<input
									id={`service-duration-${i}`}
									type="number"
									class="block w-full rounded-md border-0 bg-white/5 px-3 py-2.5 text-white shadow-md ring-1 ring-inset ring-white/10 transition-shadow duration-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
									bind:value={service.duration}
								/>
							</div>
							<div class="sm:col-span-1">
								<button
									type="button"
									class="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-red-500/10 p-2.5 text-red-400 transition-colors duration-200 hover:bg-red-500/30 hover:text-red-300"
									onclick={() => {
										serviceToDelete = { id: service.id, index: i };
										deleteServiceOpen = true;
									}}
								>
									<X class="h-5 w-5" />
									<span class="sm:hidden">{m.delete_action()}</span>
								</button>
							</div>
						</div>
					</div>
				{/each}
				<div class="mt-2">
					<button
						type="button"
						class="flex w-full items-center justify-center rounded-md bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-white/15"
						onclick={addService}
					>
						<Plus class="mr-2 h-5 w-5" />
						{m.add_service()}
					</button>
				</div>
			</div>
			<button
				type="submit"
				class="mt-8 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
			>
				{m.save()}
			</button>
		</form>
	</div>
	<!-- Employee Section -->
	<div class="grid grid-cols-1 gap-x-8 gap-y-10 px-6 py-10 sm:px-8 md:grid-cols-3 lg:px-10">
		<div class="space-y-3">
			<h2 class="text-xl font-bold tracking-tight text-white">{m.employee_shifts()}</h2>
			<p class="text-sm leading-relaxed text-gray-400">{m.employee_shifts_description()}</p>
		</div>

		<form class="md:col-span-2" use:employeeEnhance action="?/editEmployees" method="POST">
			<div class="grid grid-cols-1 gap-y-8">
				{#each $employeeForm.employees as employee, i (employee.id)}
					<div class="col-span-full rounded-lg bg-white/5 p-6 shadow-md">
						<div class="mb-4 flex items-center justify-between">
							<label for={`employee-name-${i}`} class="block text-lg font-medium text-white"
								>{m.employee_name()}</label
							>
							<button
								type="button"
								class="flex items-center rounded-md p-2 text-gray-400 transition-colors duration-200 hover:bg-white/10 hover:text-white"
								onclick={() => {
									employeeToDelete = { id: employee.id, index: i };
									deleteEmployeeOpen = true;
								}}
							>
								<X class="h-5 w-5" />
							</button>
						</div>
						<div class="mb-6">
							<input
								id={`employee-name-${i}`}
								type="text"
								class="block w-full rounded-md border-0 bg-white/10 px-3 py-2.5 text-sm text-white shadow-md ring-1 ring-inset ring-white/20 transition-shadow duration-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
								bind:value={employee.name}
							/>
						</div>

						<!-- Work Shifts with improved layout and mobile-friendly time inputs -->
						<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
							{#each Object.keys(dayFullNames) as day (day)}
								{@const typedDay = day as DayKey}
								<div class="rounded-md bg-gray-800/40 p-3 shadow-sm">
									<h4
										class="mb-2 border-b border-gray-700 pb-1 text-center text-sm font-medium text-gray-200"
									>
										{dayFullNames[typedDay]}
									</h4>
									<div class="grid grid-cols-2 gap-2">
										<div class="flex flex-col">
											<label
												for={`${day}-from-${i}`}
												class="mb-1 block text-xs font-medium text-gray-400"
											>
												{m.day_from({ day: dayFullNames[typedDay] })}
											</label>
											<div class="relative flex-1">
												<input
													id={`${day}-from-${i}`}
													type="time"
													class="flex h-9 min-w-full appearance-none items-center justify-center rounded-md border-0 bg-black/20 px-2 text-xs text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
													value={employee.shifts[`${typedDay}_from` as ShiftKey]}
													onchange={(e) =>
														updateShift(
															employee,
															`${typedDay}_from` as ShiftKey,
															e.currentTarget.value
														)}
													style="min-width: 100%; -webkit-appearance: none; text-align: center; padding-top: 0; padding-bottom: 0;"
												/>
											</div>
										</div>
										<div class="flex flex-col">
											<label
												for={`${day}-to-${i}`}
												class="mb-1 block text-xs font-medium text-gray-400"
											>
												{m.day_to({ day: dayFullNames[typedDay] })}
											</label>
											<div class="relative flex-1">
												<input
													id={`${day}-to-${i}`}
													type="time"
													class="block h-9 min-w-full appearance-none rounded-md border-0 bg-black/20 px-2 py-1.5 text-xs text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
													value={employee.shifts[`${typedDay}_to` as ShiftKey]}
													onchange={(e) =>
														updateShift(
															employee,
															`${typedDay}_to` as ShiftKey,
															e.currentTarget.value
														)}
													style="min-width: 100%; -webkit-appearance: none; text-align: center; padding-top: 0; padding-bottom: 0;"
												/>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>

						<!-- Break (formerly Lunch Break) with improved styling and mobile-friendly time inputs -->
						<div class="mt-6 rounded-md bg-indigo-900/20 p-4">
							<h3 class="text-md mb-3 font-semibold text-indigo-300">{m.break_title()}</h3>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex flex-col">
									<label
										for={`lunch-from-${i}`}
										class="mb-1 block text-sm font-medium text-gray-300"
									>
										{m.break_from()}
									</label>
									<div class="relative flex-1">
										<input
											id={`lunch-from-${i}`}
											type="time"
											class="flex h-10 min-w-full appearance-none items-center justify-center rounded-md border-0 bg-black/20 px-3 text-sm text-white shadow-md ring-1 ring-inset ring-indigo-400/30 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
											bind:value={employee.shifts.Lunch_from}
											style="min-width: 100%; -webkit-appearance: none;"
										/>
									</div>
								</div>
								<div class="flex flex-col">
									<label for={`lunch-to-${i}`} class="mb-1 block text-sm font-medium text-gray-300">
										{m.break_to()}
									</label>
									<div class="relative flex-1">
										<input
											id={`lunch-to-${i}`}
											type="time"
											class="block h-10 min-w-full appearance-none rounded-md border-0 bg-black/20 px-3 py-2 text-sm text-white shadow-md ring-1 ring-inset ring-indigo-400/30 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
											bind:value={employee.shifts.Lunch_to}
											style="min-width: 100%; -webkit-appearance: none;"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}

				<button
					type="button"
					class="flex items-center justify-center rounded-md bg-indigo-600/20 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-indigo-600/40"
					onclick={addEmployee}
				>
					<Plus class="mr-2 h-5 w-5" />{m.add_employee()}
				</button>

				<div>
					<button
						type="submit"
						class="mt-8 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
					>
						{m.save()}
					</button>
				</div>
			</div>
		</form>
	</div>
</div>

<!-- Keep modals unchanged -->
<DeleteConfirmationModal
	isOpen={deleteEmployeeOpen}
	onClose={() => {
		deleteEmployeeOpen = false;
		employeeToDelete = null;
	}}
	onDelete={() => {
		if (employeeToDelete) {
			removeEmployee(employeeToDelete.id, employeeToDelete.index);
			employeeToDelete = null;
		}
	}}
/>

<DeleteConfirmationModal
	isOpen={deleteServiceOpen}
	onClose={() => {
		deleteServiceOpen = false;
		serviceToDelete = null;
	}}
	onDelete={() => {
		if (serviceToDelete) {
			removeService(serviceToDelete.id, serviceToDelete.index);
			serviceToDelete = null;
		}
	}}
/>

<!-- Mobile Safari Time Input Fix -->
<style>
	/* Fix for Safari on iOS to make time inputs respect width */
	@supports (-webkit-touch-callout: none) {
		input[type='time'] {
			min-height: 44px; /* Increased touch target size */
			font-size: 16px !important; /* Prevent zoom on focus */
			padding-right: 5px !important; /* Extra padding for the clock icon */
			line-height: 44px; /* Vertically center text */
			text-align: center; /* Center text horizontally */
			display: flex;
			align-items: center;
		}
	}

	/* Global time input styles for better vertical alignment */
	input[type='time'] {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	/* Better focus states for mobile */
	input:focus {
		outline: none;
	}
</style>
