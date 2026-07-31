import { useEffect, useMemo, useState } from "react";
import { BrainIcon, PencilIcon, PlusIcon, SearchIcon, SpinnerIcon } from "../../components/Icons";
import { useAppAuth } from "./context";
import { ProposedMemoriesList } from "./ProposedMemoriesPage";
import { formatWithPrefs, useResolvedDateTimePrefs } from "./companySettings";
import {
	CategoryPill,
	ConfirmDeleteButton,
	EmptyState,
	ErrorBanner,
	ListPagination,
	Pill,
	Select,
	Tooltip,
	inputClass,
	textareaClass,
} from "./ui";
import { MEMORY_CATEGORIES, type Memory } from "./types";
import { UserChip } from "./UserChip";
import { useT } from "./i18n";
import { normalizeProfileName } from "./userProfile";

export type MemoriesTab = "confirmed" | "proposed";

type MemorySort = "newest" | "oldest" | "az";

const PAGE_SIZE = 5;

const SORT_OPTIONS: { value: MemorySort; label: string }[] = [
	{ value: "newest", label: "Newest first" },
	{ value: "oldest", label: "Oldest first" },
	{ value: "az", label: "A to Z" },
];

const STALE_AFTER_MS = 90 * 24 * 60 * 60 * 1000;

function MemoryAttribution({ memory }: { memory: Memory }) {
	if (memory.source === "ai" || memory.source === "ai-chat") {
		return (
			<span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
				<span>Learned by</span>
				<UserChip name="Lumantic" size="xs" muted />
			</span>
		);
	}
	const by = memory.added_by?.trim();
	const named = Boolean(by && normalizeProfileName(by) !== "lumantic");
	if (memory.source === "manual") {
		if (!named) return <span>Added manually</span>;
		return (
			<span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
				<span>Added manually by</span>
				<UserChip name={by!} size="xs" muted />
			</span>
		);
	}
	if (!named) return <span>{memory.source}</span>;
	return (
		<span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
			<span>{memory.source} by</span>
			<UserChip name={by!} size="xs" muted />
		</span>
	);
}

function memoryTimestamp(iso: string) {
	const value = Date.parse(iso.endsWith("Z") ? iso : `${iso}Z`);
	return Number.isFinite(value) ? value : 0;
}

function isStaleMemory(memory: Memory) {
	const created = memoryTimestamp(memory.created_at);
	if (!created) return false;
	return Date.now() - created >= STALE_AFTER_MS;
}

function sortMemories(list: Memory[], sort: MemorySort) {
	const next = [...list];
	next.sort((a, b) => {
		switch (sort) {
			case "oldest":
				return memoryTimestamp(a.created_at) - memoryTimestamp(b.created_at);
			case "az":
				return a.content.localeCompare(b.content, undefined, { sensitivity: "base" });
			case "newest":
			default:
				return memoryTimestamp(b.created_at) - memoryTimestamp(a.created_at);
		}
	});
	return next;
}

function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	return (
		<Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Category">
			{MEMORY_CATEGORIES.map((cat) => (
				<option key={cat} value={cat} className="bg-ink">
					{cat}
				</option>
			))}
		</Select>
	);
}

function AddMemoryForm({
	onAdd,
	onCancel,
}: {
	onAdd: (content: string, category: string) => Promise<void>;
	onCancel: () => void;
}) {
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
					<button
						type="button"
						onClick={onCancel}
						className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/60 hover:text-violet-100"
					>
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
	const dateTimePrefs = useResolvedDateTimePrefs();
	const updatedLabel = formatWithPrefs(memory.updated_at, dateTimePrefs, {
		dateStyle: "medium",
		timeStyle: "short",
	});

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
					<Tooltip content="Edit memory">
						<button
							onClick={() => setEditing(true)}
							aria-label="Edit memory"
							className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-violet-300/60 transition hover:bg-violet-500/15 hover:text-violet-100"
						>
							<PencilIcon className="size-4" />
						</button>
					</Tooltip>
					<ConfirmDeleteButton onConfirm={() => onDelete(memory.id)} label="Delete memory" />
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-violet-400/50">
				<CategoryPill category={memory.category} />
				{isStaleMemory(memory) && (
					<Pill tone="amber" title="This memory is over 90 days old and may need to be re-reviewed">
						Old · may need re-review
					</Pill>
				)}
				<span>·</span>
				<MemoryAttribution memory={memory} />
				<span>·</span>
				<span>{updatedLabel || memory.updated_at}</span>
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
	const t = useT();
	const [memories, setMemories] = useState<Memory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<MemorySort>("newest");
	const [showAdd, setShowAdd] = useState(false);
	const [page, setPage] = useState(1);

	useEffect(() => {
		let cancelled = false;
		const t = setTimeout(() => {
			setLoading(true);
			const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
			request<{ memories: Memory[] }>(`/memories${q}`)
				.then((data) => {
					if (!cancelled) {
						setMemories(data.memories);
						setPage(1);
					}
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

	const sortedMemories = useMemo(() => sortMemories(memories, sort), [memories, sort]);
	const totalPages = Math.max(1, Math.ceil(sortedMemories.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const pageMemories = sortedMemories.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
	const [sortSource, setSortSource] = useState(sort);

	if (sort !== sortSource) {
		setSortSource(sort);
		setPage(1);
	} else if (page !== safePage) {
		setPage(safePage);
	}

	async function handleAdd(content: string, category: string) {
		const data = await request<{ memory: Memory }>("/memories", {
			method: "POST",
			body: JSON.stringify({ content, category }),
		});
		setMemories((prev) => [data.memory, ...prev]);
		setShowAdd(false);
		setPage(1);
	}

	async function handleSave(id: number, content: string, category: string) {
		const data = await request<{ memory: Memory }>(`/memories/${id}`, {
			method: "PUT",
			body: JSON.stringify({ content, category }),
		});
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
						<h1 className="font-display text-xl font-semibold text-violet-50">{t("memories.title")}</h1>
						<p className="mt-1 text-sm text-violet-300/60">
							{confirmed
								? "Everything Lumantic has learned and confirmed about your business."
								: "New things Lumantic picked up from chats and data. Approve to save them, edit first, or deny to discard."}
						</p>
					</div>
					{confirmed && (
						<button
							onClick={() => setShowAdd((v) => !v)}
							className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
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
							className={`cursor-pointer rounded-lg px-3 py-2 transition ${
								confirmed ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
							}`}
						>
							{t("memories.confirmed")}
						</button>
						<button
							type="button"
							onClick={() => onTabChange("proposed")}
							className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${
								!confirmed ? "bg-violet-500/20 text-violet-50" : "text-violet-300/60 hover:text-violet-100"
							}`}
						>
							{t("memories.proposed")}
							{proposedCount > 0 && (
								<span className="rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[11px] font-semibold text-violet-100">
									{proposedCount}
								</span>
							)}
						</button>
					</div>
					{confirmed && (
						<>
							<div className="relative max-w-sm min-w-[12rem] flex-1">
								<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-400/50" />
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search memories…"
									className={`${inputClass} pl-9`}
								/>
							</div>
							<div>
								<label className="sr-only" htmlFor="memory-sort">
									Sort memories
								</label>
								<Select
									id="memory-sort"
									value={sort}
									onChange={(e) => setSort(e.target.value as MemorySort)}
									wrapperClassName="min-w-[10.5rem]"
									size="sm"
								>
									{SORT_OPTIONS.map((option) => (
										<option key={option.value} value={option.value} className="bg-ink">
											{option.label}
										</option>
									))}
								</Select>
							</div>
						</>
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
						) : sortedMemories.length === 0 ? (
							<EmptyState
								icon={<BrainIcon className="size-5" />}
								title={search ? "No memories match your search" : "No memories yet"}
								description={
									search
										? "Try a different search term."
										: "Add your first memory, or approve a proposed one from Lumantic."
								}
							/>
						) : (
							<>
								{pageMemories.map((memory) => (
									<MemoryCard key={memory.id} memory={memory} onSave={handleSave} onDelete={handleDelete} />
								))}
								<ListPagination
									page={safePage}
									pageSize={PAGE_SIZE}
									total={sortedMemories.length}
									onPageChange={setPage}
									className="pt-2"
								/>
							</>
						)}
					</>
				) : (
					<ProposedMemoriesList />
				)}
			</div>
		</div>
	);
}
