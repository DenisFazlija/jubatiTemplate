<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import * as m from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';

	const session = authClient.useSession();

	$effect(() => {
		if ($session.data?.session) {
			goto(localizeHref('/admin/calendar'));
		}
	});
</script>

{#if !$session.data?.session}
	<div class="flex min-h-screen items-center justify-center bg-gray-100">
		<div class="w-[300px] overflow-hidden rounded-lg bg-white shadow-md">
			<div class="p-6">
				<h2 class="mb-6 text-center text-2xl font-bold">Admin Login</h2>
				<button
					class="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					onclick={async () => {
						await authClient.signIn.social({
							provider: 'google',
							callbackURL: '/admin/calendar'
						});
					}}
				>
					<svg
						class="mr-2 h-5 w-5"
						viewBox="0 0 21 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g clip-path="url(#clip0_13183_10121)">
							<path
								d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z"
								fill="#3F83F8"
							/>
							<path
								d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z"
								fill="#34A853"
							/>
							<path
								d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z"
								fill="#FBBC04"
							/>
							<path
								d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z"
								fill="#EA4335"
							/>
						</g>
						<defs>
							<clipPath id="clip0_13183_10121">
								<rect width="20" height="20" fill="white" transform="translate(0.5)" />
							</clipPath>
						</defs>
					</svg>
					{m.googleSignIn()}
				</button>
			</div>
		</div>
	</div>
{/if}
