<script lang="ts">
	import '../app.css';
	let { children } = $props();
	import '@fontsource-variable/inter';
	import dayjs from '$lib/dayjs';
	import { getLocale } from '$lib/paraglide/runtime';
	import 'dayjs/locale/de';
	import 'dayjs/locale/fr';

	dayjs.locale(getLocale());
</script>

{@render children()}
