import "./index.css";
import { LandingPage } from "./pages/LandingPage";
import { AdminPage } from "./pages/AdminPage";
import { AppPage } from "./pages/app/AppPage";

function App() {
	const { pathname } = window.location;
	if (pathname.startsWith("/admin")) return <AdminPage />;
	if (pathname.startsWith("/app")) return <AppPage />;
	return <LandingPage />;
}

export default App;
