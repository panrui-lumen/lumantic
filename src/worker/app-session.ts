/**
 * Demo app session tokens (HMAC). Shared by /api/app and admin impersonation.
 * Not meant to protect real customer data.
 */

const SESSION_SECRET = "lumantic-app-demo-secret-v1";
export const APP_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
/** Shorter TTL for admin "log in as" sessions. */
export const IMPERSONATION_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export type AppSession = {
	username: string;
	memberId?: number;
	impersonating?: boolean;
};

function toBase64Url(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(SESSION_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

export async function createAppSessionToken(opts: {
	username: string;
	memberId?: number;
	impersonating?: boolean;
	ttlMs?: number;
}): Promise<string> {
	const ttl = opts.ttlMs ?? APP_SESSION_TTL_MS;
	const payload = JSON.stringify({
		u: opts.username,
		exp: Date.now() + ttl,
		...(opts.memberId != null ? { mid: opts.memberId } : {}),
		...(opts.impersonating ? { imp: true } : {}),
	});
	const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
	const key = await hmacKey();
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
	return `${payloadB64}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAppSessionToken(token: string): Promise<AppSession | null> {
	const [payloadB64, sigB64] = token.split(".");
	if (!payloadB64 || !sigB64) return null;
	try {
		const key = await hmacKey();
		const valid = await crypto.subtle.verify(
			"HMAC",
			key,
			fromBase64Url(sigB64) as BufferSource,
			new TextEncoder().encode(payloadB64),
		);
		if (!valid) return null;
		const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as {
			u: string;
			exp: number;
			mid?: number;
			imp?: boolean;
		};
		if (!payload.u || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
		const memberId = typeof payload.mid === "number" && Number.isInteger(payload.mid) ? payload.mid : undefined;
		return {
			username: payload.u,
			...(memberId != null ? { memberId } : {}),
			...(payload.imp || memberId != null ? { impersonating: true } : {}),
		};
	} catch {
		return null;
	}
}
