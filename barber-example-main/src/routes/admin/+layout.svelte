<script lang="ts">
	import { page } from '$app/state';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Settings from 'lucide-svelte/icons/settings';
	import X from 'lucide-svelte/icons/x';
	import sidebar from './SideBarState.svelte';
	import { Toaster } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages.js';
	import LanguagePicker from '$lib/components/LanguagePicker.svelte';
	import 'dayjs/locale/de';
	import 'dayjs/locale/fr';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import dayjs from '$lib/dayjs';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	const navigation = $state([
		{ name: m.calendar(), Icon: Calendar, href: localizeHref('/admin/calendar') },
		{ name: m.settings(), Icon: Settings, href: localizeHref('/admin') }
	]);
	const { children } = $props();
	const currentRoute = $derived(localizeHref(page.url.pathname));
	dayjs.locale(getLocale());
</script>

<Toaster />
<div class="h-full bg-gray-900">
	<div>
		<!-- Mobile sidebar -->
		{@render mobileNav()}
		<!-- Static sidebar for desktop -->
		<div class="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col">
			<!-- Sidebar component -->
			<div class="flex h-full flex-col bg-black/10 px-6 ring-1 ring-white/5">
				<!-- Sidebar content (same as mobile, just without the close button) -->
				{@render nav()}
			</div>
		</div>
		<div class="xl:pl-72">
			<main>
				{@render children()}
				<h1 class="sr-only">{m.account_settings()}</h1>
				<!-- Settings forms -->
			</main>
		</div>
	</div>
	{#snippet nav()}
		<div class="flex h-16 shrink-0 items-center">
			<img
				alt={m.company_logo_alt()}
				src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=500"
				class="h-8 w-auto"
			/>
		</div>
		<nav class="flex flex-1 flex-col justify-between">
			<ul role="list" class="flex flex-col gap-y-7">
				<li>
					<ul role="list" class="-mx-2 space-y-1">
						{#each navigation as { name, Icon, href } (name)}
							<li>
								<a
									{href}
									onclick={() => sidebar.close()}
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold {currentRoute ===
									href
										? 'bg-gray-800 text-white'
										: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
								>
									<Icon aria-hidden="true" className="size-6 shrink-0" />
									{name}
								</a>
							</li>
						{/each}
					</ul>
				</li>
			</ul>

			<!-- Bottom items fixed at the bottom -->
			<div class="mt-auto space-y-4 py-6">
				<LanguagePicker />
				<button
					class="flex w-full items-center justify-center rounded-md bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-white/15"
					onclick={() => {
						authClient.signOut();
						goto('/login');
					}}>Logout</button
				>
			</div>
		</nav>
	{/snippet}
	{#snippet mobileNav()}
		{#if sidebar.sidebarOpen}
			<div class="relative z-50 xl:hidden">
				<div class="fixed inset-0 bg-gray-900/80"></div>
				<div class="fixed inset-0 flex">
					<div class="relative mr-16 flex w-full max-w-xs flex-1">
						<div class="absolute left-full top-0 flex w-16 justify-center pt-5">
							<button type="button" onclick={() => sidebar.close()} class="-m-2.5 p-2.5">
								<span class="sr-only">{m.close_sidebar()}</span>
								<X class="size-6 text-white" aria-hidden="true" />
							</button>
						</div>
						<!-- Sidebar component -->
						<div class="flex h-full w-full flex-col bg-gray-900 px-6 ring-1 ring-white/10">
							{@render nav()}
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/snippet}
</div>
