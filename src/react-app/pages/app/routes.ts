export type AppRoute =
	| "chat"
	| "memories"
	| "proposed"
	| "team"
	| "billing"
	| "support"
	| "settings"
	| "account";

export function pathToRoute(pathname: string): AppRoute {
	if (pathname.startsWith("/app/memories")) return "memories";
	if (pathname.startsWith("/app/proposed")) return "proposed";
	if (pathname.startsWith("/app/team")) return "team";
	if (pathname.startsWith("/app/billing")) return "billing";
	if (pathname.startsWith("/app/support")) return "support";
	if (pathname.startsWith("/app/settings")) return "settings";
	if (pathname.startsWith("/app/account")) return "account";
	return "chat";
}

export function routeToPath(route: AppRoute): string {
	switch (route) {
		case "memories":
			return "/app/memories";
		case "proposed":
			return "/app/proposed";
		case "team":
			return "/app/team";
		case "billing":
			return "/app/billing";
		case "support":
			return "/app/support";
		case "settings":
			return "/app/settings";
		case "account":
			return "/app/account";
		case "chat":
		default:
			return "/app";
	}
}

export function isLoginPath(pathname: string): boolean {
	return pathname.startsWith("/app/login") || pathname.startsWith("/app/register");
}
