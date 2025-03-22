<script>
	import { localizeHref } from '$lib/paraglide/runtime';
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"
>
	<div class="max-w-md p-8 text-center text-white">
		<h1 class="mb-4 text-9xl font-bold">404</h1>
		<p class="mb-8 text-2xl">Oops! Page not found. Did you take a wrong turn in cyberspace?</p>
		<div class="mb-8 whitespace-pre font-mono text-xs">
			{`   ___
  (o o)
 (  V  )
/--m-m--\\
   Lost?`}
		</div>
		<a
			href={localizeHref('/')}
			class="rounded-full bg-white px-6 py-3 font-bold text-purple-600 transition duration-300 hover:bg-purple-100"
		>
			Beam me back home, Scotty!
		</a>
	</div>
</div>
