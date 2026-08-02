import { useState } from "react";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RegisterModal } from "../components/RegisterModal";
import { WorkedExample } from "../components/sections/WorkedExample";

export function HowItWorksPage() {
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div className="min-h-screen bg-void text-violet-50">
			<Nav onRegisterClick={() => setModalOpen(true)} />
			<main className="pt-16">
				<div className="mx-auto max-w-7xl px-6 pt-10 sm:pt-14">
					<a href="/" className="text-sm text-violet-300/60 transition hover:text-violet-100">
						← Back to home
					</a>
				</div>
				<WorkedExample />
			</main>
			<Footer />
			<RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
		</div>
	);
}
