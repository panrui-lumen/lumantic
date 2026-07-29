import "./index.css";
import { LandingPage } from "./pages/LandingPage";
import { AdminPage } from "./pages/AdminPage";

function App() {
	const isAdmin = window.location.pathname.startsWith("/admin");
	return isAdmin ? <AdminPage /> : <LandingPage />;
}

export default App;
