import "./index.css";
import { Toaster } from "sonner";
import { LandingPage } from "./pages/LandingPage";
import { AdminPage } from "./pages/AdminPage";
import { AppPage } from "./pages/app/AppPage";
import { SharedChatPage } from "./pages/app/SharedChatPage";
import { StatusPage } from "./pages/StatusPage";
import { isKnownSitePath, NotFoundPage } from "./pages/NotFoundPage";
import { SiteBanner } from "./components/SiteBanner";

function App() {
	const { pathname } = window.location;
	const path = pathname.replace(/\/+$/, "") || "/";
	const page = !isKnownSitePath(pathname) ? (
		<NotFoundPage />
	) : path.startsWith("/admin") ? (
		<AdminPage />
	) : path.startsWith("/s/") ? (
		<SharedChatPage />
	) : path.startsWith("/app") ? (
		<AppPage />
	) : path === "/status" ? (
		<StatusPage />
	) : (
		<LandingPage />
	);

	return (
		<>
			<SiteBanner />
			{page}
			<Toaster
				theme="dark"
				position="bottom-right"
				closeButton
				toastOptions={{
					classNames: {
						toast:
							"!rounded-xl !border !border-violet-500/20 !bg-ink !text-violet-50 !shadow-[0_0_40px_-15px_rgba(143,99,248,0.5)] !font-sans",
						title: "!text-violet-50 !font-medium",
						description: "!text-violet-300/70",
						actionButton: "!bg-gradient-to-r !from-violet-500 !to-violet-400 !text-white",
						cancelButton: "!bg-white/10 !text-violet-200",
						closeButton: "!border-violet-500/20 !bg-white/5 !text-violet-300",
						success: "!border-emerald-500/25",
						error: "!border-rose-500/25",
					},
				}}
			/>
		</>
	);
}

export default App;
