import {
	AWS_SES_ACCESS_KEY_ID,
	AWS_SES_REGION,
	AWS_SES_SECRET_ACCESS_KEY
} from '$env/static/private';
import { AwsClient } from 'aws4fetch';
import { createMimeMessage } from 'mimetext/browser';

function encodeBase64Bytes(bytes: Uint8Array): string {
	return btoa(bytes.reduce((acc, current) => acc + String.fromCharCode(current), ''));
}

function utf8ToBase64(str: string): string {
	return encodeBase64Bytes(new TextEncoder().encode(str));
}

function is7BitWithLineLengthLimit(text: string): boolean {
	const lines = text.split(/\r?\n/); // Split the text into lines using either \r\n or \n as the line separator
	const lineLengthLimit = 998; // Maximum line length limit excluding line separator

	for (const line of lines) {
		if (line.length > lineLengthLimit) {
			return false; // Line length exceeds the limit
		}
	}

	return /^[\x00-\x7F]*$/.test(text); // Check if the text contains only 7-bit ASCII characters
}

function encodeToQuotedPrintable(input: string): string {
	const encoder = new TextEncoder();
	const buffer = encoder.encode(input);

	// Usable characters that do not need encoding
	const ranges: Array<[number, number?]> = [
		[0x09], // <TAB>
		[0x0a], // <LF>
		[0x0d], // <CR>
		[0x20, 0x3c], // <SP>!"#$%&'()*+,-./0123456789:;
		[0x3e, 0x7e] // >?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}
	];
	let result = '';
	let ord: number;

	const checkRanges = (value: number, ranges: Array<[number, number?]>): boolean => {
		for (let range of ranges) {
			if (
				(range.length === 1 && value === range[0]) ||
				(range.length === 2 && value >= range[0] && (range[1] === undefined || value <= range[1]))
			) {
				return true;
			}
		}
		return false;
	};

	for (let i = 0, len = buffer.length; i < len; i++) {
		ord = buffer[i];
		// if the char is in allowed range, then keep as is, unless it is a ws at the end of a line
		if (
			checkRanges(ord, ranges) &&
			!(
				(ord === 0x20 || ord === 0x09) &&
				(i === len - 1 || buffer[i + 1] === 0x0a || buffer[i + 1] === 0x0d)
			)
		) {
			result += String.fromCharCode(ord);
			continue;
		}
		result += '=' + (ord < 0x10 ? '0' : '') + ord.toString(16).toUpperCase();
	}

	return result;
}

async function sendMail(
	from: { name: string; addr: string },
	to: { name: string; addr: string },
	subject: string,
	plaintext: string,
	html?: string
) {
	const new_email = createMimeMessage();

	new_email.setSender({
		name: from.name,
		addr: from.addr
	});

	new_email.setTo({
		name: to.name,
		addr: to.addr
	});

	new_email.setSubject(subject);

	// Add plaintext part
	const canBePlaintext7bit = is7BitWithLineLengthLimit(plaintext);
	new_email.addMessage({
		data: canBePlaintext7bit ? plaintext : encodeToQuotedPrintable(plaintext),
		contentType: 'text/plain',
		encoding: canBePlaintext7bit ? '7bit' : 'quoted-printable',
		charset: '"utf-8"'
	});

	// Add HTML part if provided
	if (html) {
		const canBeHtml7bit = is7BitWithLineLengthLimit(html);
		new_email.addMessage({
			data: canBeHtml7bit ? html : encodeToQuotedPrintable(html),
			contentType: 'text/html',
			encoding: canBeHtml7bit ? '7bit' : 'quoted-printable',
			charset: '"utf-8"'
		});
	}

	const body = {
		Content: {
			Raw: {
				Data: utf8ToBase64(new_email.asRaw())
			}
		},
		Destination: {
			BccAddresses: [to.addr]
		}
	};

	const aws_client = new AwsClient({
		accessKeyId: AWS_SES_ACCESS_KEY_ID,
		secretAccessKey: AWS_SES_SECRET_ACCESS_KEY,
		service: 'ses',
		retries: 0
	});

	const ses_prom = aws_client
		.fetch(`https://email.${AWS_SES_REGION}.amazonaws.com/v2/email/outbound-emails`, {
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json'
			}
		})
		.then((res) => {
			if (!res.ok) {
				throw new Error(`SES response not ok: ${res.status}`);
			}
		});

	await ses_prom;
}

export { sendMail };
