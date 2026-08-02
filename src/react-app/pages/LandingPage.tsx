import { useState } from "react";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RegisterModal } from "../components/RegisterModal";
import { Hero } from "../components/sections/Hero";
import { ProblemSection } from "../components/sections/ProblemSection";
import { SolutionSection } from "../components/sections/SolutionSection";
import { ProductPreview } from "../components/sections/ProductPreview";
import { FinalCta } from "../components/sections/FinalCta";

export function LandingPage() {
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div className="min-h-screen bg-void text-violet-50">
			<Nav onRegisterClick={() => setModalOpen(true)} />
			<main>
				<Hero onRegisterClick={() => setModalOpen(true)} />
				<ProblemSection />
				<SolutionSection />
				<ProductPreview />
				<FinalCta onRegisterClick={() => setModalOpen(true)} />
			</main>
			<Footer />
			<RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
		</div>
	);
}
