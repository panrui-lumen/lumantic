import "./index.css";
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
		</>
	);
}

export default App;
