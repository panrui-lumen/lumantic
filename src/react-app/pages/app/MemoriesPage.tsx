import { useEffect, useState } from "react";
import { BrainIcon, ChevronDown, PencilIcon, PlusIcon, SearchIcon, SpinnerIcon } from "../../components/Icons";
import { useAppAuth } from "./context";
import { ProposedMemoriesList } from "./ProposedMemoriesPage";
import { CategoryPill, ConfirmDeleteButton, EmptyState, ErrorBanner, inputClass, selectClass, textareaClass } from "./ui";
import { MEMORY_CATEGORIES, type Memory } from "./types";

export type MemoriesTab = "confirmed" | "proposed";

function formatDate(iso: string) {
	try {
		return new Date(iso.endsWith("Z") ? iso : `${iso}Z`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
	} catch {
		return iso;
	}
}

function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	return (
		<div className="relative">
			<select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
				{MEMORY_CATEGORIES.map((cat) => (
					<option key={cat} value={cat} className="bg-ink">
						{cat}
					</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-violet-400/50" />
		</div>
	);
}

function AddMemoryForm({ onAdd, onCancel }: { onAdd: (content: string, category: string) => Promise<void>; onCancel: () => void }) {
	const [content, setContent] = useState("");
	const [category, setCategory] = useState<string>("general");
	const [saving, setSaving] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!content.trim()) return;
		setSaving(true);
		try {
			await onAdd(content.trim(), category);
			setContent("");
			setCategory("general");
		} finally {
			setSaving(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-2xl border border-violet-500/20 bg-white/[0.03] p-4">
			<textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				placeholder="e.g. Our fiscal year starts February 1st, not January 1st."
				autoFocus
				className={textareaClass}
			/>
			<div className="mt-3 flex items-center justify-between gap-3">
				<CategorySelect value={category} onChange={setCategory} />
				<div className="flex items-center gap-2">
					<button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/60 hover:text-violet-100">
						Cancel
					</button>
					<button
						type="submit"
						disabled={saving || !content.trim()}
						className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{saving && <SpinnerIcon className="size-3.5" />}
						Save memory
					</button>
				</div>
			</div>
		</form>
	);
}

function MemoryCard({
	memory,
	onSave,
	onDelete,
}: {
	memory: Memory;
	onSave: (id: number, content: string, category: string) => Promise<void>;
	onDelete: (id: number) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [content, setContent] = useState(memory.content);
	const [category, setCategory] = useState(memory.category);
	const [saving, setSaving] = useState(false);

	if (editing) {
		return (
			<div className="rounded-2xl border border-violet-400/40 bg-white/[0.04] p-4">
				<textarea value={content} onChange={(e) => setContent(e.target.value)} autoFocus className={textareaClass} />
				<div className="mt-3 flex items-center justify-between gap-3">
					<CategorySelect value={category} onChange={setCategory} />
					<div className="flex items-center gap-2">
						<button
							onClick={() => {
								setEditing(false);
								setContent(memory.content);
								setCategory(memory.category);
							}}
							className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/60 hover:text-violet-100"
						>
							Cancel
						</button>
						<button
							onClick={async () => {
								if (!content.trim()) return;
								setSaving(true);
								try {
									await onSave(memory.id, content.trim(), category);
									setEditing(false);
								} finally {
									setSaving(false);
								}
							}}
							disabled={saving || !content.trim()}
							className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{saving && <SpinnerIcon className="size-3.5" />}
							Save
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="group rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4 transition hover:border-violet-500/25">
			<div className="flex items-start justify-between gap-4">
				<p className="text-sm leading-relaxed text-violet-100">{memory.content}</p>
				<div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
					<button
						onClick={() => setEditing(true)}
						aria-label="Edit memory"
						title="Edit memory"
						className="flex size-8 items-center justify-center rounded-lg text-violet-300/60 transition hover:bg-violet-500/15 hover:text-violet-100"
					>
						<PencilIcon className="size-4" />
					</button>
					<ConfirmDeleteButton onConfirm={() => onDelete(memory.id)} label="Delete memory" />
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-violet-400/50">
				<CategoryPill category={memory.category} />
				<span>·</span>
				<span>{memory.source === "ai" ? "Learned by AI" : memory.source === "manual" ? "Added manually" : memory.source}</span>
				<span>·</span>
				<span>{formatDate(memory.updated_at)}</span>
			</div>
		</div>
	);
}

export function MemoriesPage({
	tab,
	onTabChange,
	proposedCount = 0,
}: {
	tab: MemoriesTab;
	onTabChange: (tab: MemoriesTab) => void;
	proposedCount?: number;
}) {
	const { request } = useAppAuth();
	const [memories, setMemories] = useState<Memory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [showAdd, setShowAdd] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const t = setTimeout(() => {
			setLoading(true);
			const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
			request<{ memories: Memory[] }>(`/memories${q}`)
				.then((data) => {
					if (!cancelled) setMemories(data.memories);
				})
				.catch((err) => {
					if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load memories");
				})
				.finally(() => {
					if (!cancelled) setLoading(false);
				});
		}, 200);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	}, [search, request]);

	async function handleAdd(content: string, category: string) {
		const data = await request<{ memory: Memory }>("/memories", { method: "POST", body: JSON.stringify({ content, category }) });
		setMemories((prev) => [data.memory, ...prev]);
		setShowAdd(false);
	}

	async function handleSave(id: number, content: string, category: string) {
		const data = await request<{ memory: Memory }>(`/memories/${id}`, { method: "PUT", body: JSON.stringify({ content, category }) });
		setMemories((prev) => prev.map((m) => (m.id === id ? data.memory : m)));
	}

	async function handleDelete(id: number) {
		setMemories((prev) => prev.filter((m) => m.id !== id));
		try {
			await request(`/memories/${id}`, { method: "DELETE" });
		} catch {
			// best-effort local removal already applied; a refresh will resync if this failed
		}
	}

	const confirmed = tab === "confirmed";

	return (
		<div className="flex h-full flex-col">
			<div className="border-b border-violet-500/10 px-6 py-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="font-display text-xl font-semibold text-violet-50">Memories</h1>
						<p className="mt-1 text-sm text-violet-300/60">
							{confirmed
								? "Everything the Lumantic AI has learned and confirmed about your business."
								: "New things the AI picked up from chats and data. Approve to save them, edit first, or deny to discard."}
						</p>
					</div>
					{confirmed && (
						<button
							onClick={() => setShowAdd((v) => !v)}
							className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
						>
							<PlusIcon className="size-4" />
							Add memory
						</button>
					)}
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-3">
					<div className="grid grid-cols-2 gap-1 rounded-xl border border-violet-500/15 bg-white/[0.02] p-1 text-xs font-medium">
						<button
							type="button"
							onClick={() => onTabChange("confirmed")}
							className={`rounded-lg px-3 py-2 transition ${
								confirmed ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
							}`}
						>
							Confirmed
						</button>
						<button
							type="button"
							onClick={() => onTabChange("proposed")}
							className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${
								!confirmed ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
							}`}
						>
							Proposed
							{proposedCount > 0 && (
								<span className="rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[11px] font-semibold text-violet-100">{proposedCount}</span>
							)}
						</button>
					</div>
					{confirmed && (
						<div className="relative max-w-sm flex-1">
							<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-400/50" />
							<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search memories…" className={`${inputClass} pl-9`} />
						</div>
					)}
				</div>
			</div>

			<div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
				{confirmed ? (
					<>
						{error && <ErrorBanner message={error} />}
						{showAdd && <AddMemoryForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}

						{loading ? (
							<div className="flex justify-center py-16">
								<SpinnerIcon className="size-5 text-violet-400" />
							</div>
						) : memories.length === 0 ? (
							<EmptyState
								icon={<BrainIcon className="size-5" />}
								title={search ? "No memories match your search" : "No memories yet"}
								description={search ? "Try a different search term." : "Add your first memory, or approve a proposed one from the AI."}
							/>
						) : (
							memories.map((memory) => <MemoryCard key={memory.id} memory={memory} onSave={handleSave} onDelete={handleDelete} />)
						)}
					</>
				) : (
					<ProposedMemoriesList />
				)}
			</div>
		</div>
	);
}
