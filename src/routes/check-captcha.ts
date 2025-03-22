interface TurnstileResponse {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	error_codes: string[];
	action?: string;
	cdata?: string;
}

export async function checkCaptcha(
	secret: string,
	token: string,
	ip: string,
	idempotencyKey: string
) {
	const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

	const response = await fetch(url, {
		body: JSON.stringify({
			secret: secret,
			response: token,
			remoteip: ip,
			idempotency_key: idempotencyKey
		}),
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const result = (await response.json()) as TurnstileResponse;
	return result.success;
}
