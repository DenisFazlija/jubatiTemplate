<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import dayjs from '$lib/dayjs';
	import type { Locale } from '$lib/paraglide/runtime';
	import {
		locales,
		getLocale,
		setLocale,
		deLocalizeHref,
		localizeHref
	} from '$lib/paraglide/runtime';

	type LanguageLabels = Record<Locale, string>;

	function switchToLanguage(newLanguage: Locale) {
		setLocale(newLanguage);
		dayjs.locale(newLanguage);
		const newUrl = localizeHref(page.url.pathname, { locale: newLanguage });

		goto(newUrl);
	}

	const labels: LanguageLabels = {
		en: 'English (en)',
		de: 'Deutsch (de)',
		fr: 'Français (fr)'
	};
</script>

<div class="relative inline-block w-full text-left">
	<select
		class="
      focus:ring-primary-500
      dark:focus:ring-primary-500
      w-full
      cursor-pointer
      appearance-none
      rounded-md
      border
      border-gray-300
      bg-white
      px-4
      py-2
      text-sm
      font-medium
      text-gray-700
      shadow-sm
      hover:bg-gray-50
      focus:outline-none
      focus:ring-2
      focus:ring-offset-2
      dark:border-gray-700
      dark:bg-gray-800
      dark:text-gray-300
      dark:hover:bg-gray-700
    "
		onchange={(e) => switchToLanguage(e.currentTarget.value as Locale)}
	>
		{#each locales as langTag (langTag)}
			<option value={langTag} selected={getLocale() === langTag}>
				{labels[langTag]}
			</option>
		{/each}
	</select>
	<div
		class="
      pointer-events-none
      absolute
      inset-y-0
      right-0
      flex
      items-center
      px-2
      text-gray-700
      dark:text-gray-300
    "
	>
		<svg
			class="h-5 w-5"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
</div>
