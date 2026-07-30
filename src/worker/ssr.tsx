import { renderToString } from "react-dom/server";
import { LandingPage } from "../react-app/pages/LandingPage";

/** Renders the landing page to an HTML string for server-side rendering. */
export function renderLandingPageHtml(): string {
	return renderToString(<LandingPage />);
}
