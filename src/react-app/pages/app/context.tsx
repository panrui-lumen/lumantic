import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppUser } from "./types";

const TOKEN_KEY = "lumantic_app_token";

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

type AppAuthContextValue = {
	user: AppUser | null;
	checkingSession: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
	request: <T>(path: string, init?: RequestInit) => Promise<T>;
	updateProfile: (fields: { name: string; role: string }) => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AppUser | null>(null);
	const [checkingSession, setCheckingSession] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_KEY);
		setUser(null);
	}, []);

	const request = useCallback(
		async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
			const headers = new Headers(init.headers);
			headers.set("Content-Type", "application/json");
			const token = localStorage.getItem(TOKEN_KEY);
			if (token) headers.set("Authorization", `Bearer ${token}`);

			const res = await fetch(`/api/app${path}`, { ...init, headers });
			if (res.status === 401) {
				logout();
				throw new ApiError("Your session expired. Please sign in again.", 401);
			}

			let data: unknown = null;
			try {
				data = await res.json();
			} catch {
				data = null;
			}
			if (!res.ok) {
				const message = (data as { error?: string } | null)?.error ?? "Something went wrong. Please try again.";
				throw new ApiError(message, res.status);
			}
			return data as T;
		},
		[logout],
	);

	const login = useCallback(async (username: string, password: string) => {
		const res = await fetch("/api/app/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});
		const data = (await res.json().catch(() => null)) as { ok?: boolean; token?: string; user?: AppUser; error?: string } | null;
		if (!res.ok || !data?.ok || !data.token || !data.user) {
			throw new ApiError(data?.error ?? "Incorrect email or password.", res.status);
		}
		localStorage.setItem(TOKEN_KEY, data.token);
		setUser(data.user);
	}, []);

	const updateProfile = useCallback(
		async (fields: { name: string; role: string }) => {
			const data = await request<{ user: AppUser }>("/profile", { method: "PUT", body: JSON.stringify(fields) });
			setUser(data.user);
		},
		[request],
	);

	useEffect(() => {
		const token = localStorage.getItem(TOKEN_KEY);
		if (!token) return;
		fetch("/api/app/session", { headers: { Authorization: `Bearer ${token}` } })
			.then(async (res) => {
				if (!res.ok) {
					localStorage.removeItem(TOKEN_KEY);
					return;
				}
				const data = (await res.json()) as { user: AppUser };
				setUser(data.user);
			})
			.catch(() => {
				localStorage.removeItem(TOKEN_KEY);
			})
			.finally(() => setCheckingSession(false));
	}, []);

	return (
		<AppAuthContext.Provider value={{ user, checkingSession, login, logout, request, updateProfile }}>
			{children}
		</AppAuthContext.Provider>
	);
}

export function useAppAuth() {
	const ctx = useContext(AppAuthContext);
	if (!ctx) throw new Error("useAppAuth must be used within AppAuthProvider");
	return ctx;
}
