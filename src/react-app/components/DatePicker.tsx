import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "./Icons";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

function pad2(n: number) {
	return String(n).padStart(2, "0");
}

/** Local calendar date as YYYY-MM-DD. */
export function toDateValue(d: Date): string {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateValue(value: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const [y, m, day] = value.split("-").map(Number);
	const d = new Date(y, m - 1, day);
	if (d.getFullYear() !== y || d.getMonth() !== m - 1 || d.getDate() !== day) return null;
	return d;
}

function startOfMonth(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
	return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

/** Monday-first weekday index (0 = Mon … 6 = Sun). */
function mondayIndex(d: Date) {
	return (d.getDay() + 6) % 7;
}

function formatDisplay(value: string): string {
	const d = parseDateValue(value);
	if (!d) return "";
	try {
		return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
	} catch {
		return value;
	}
}

function monthLabel(d: Date): string {
	try {
		return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
	} catch {
		return `${d.getMonth() + 1}/${d.getFullYear()}`;
	}
}

type DayCell = { date: Date; inMonth: boolean; value: string };

function buildMonthGrid(view: Date): DayCell[] {
	const first = startOfMonth(view);
	const startOffset = mondayIndex(first);
	const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - startOffset);
	const cells: DayCell[] = [];
	for (let i = 0; i < 42; i++) {
		const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
		cells.push({
			date,
			inMonth: date.getMonth() === view.getMonth(),
			value: toDateValue(date),
		});
	}
	return cells;
}

export type DatePickerProps = {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	id?: string;
	"aria-label"?: string;
	wrapperClassName?: string;
	className?: string;
	placeholder?: string;
};

/**
 * Branded date control. Native `<input type="date">` popups cannot be themed;
 * use this everywhere a calendar is needed in the product/admin UI.
 */
export function DatePicker({
	value,
	onChange,
	disabled = false,
	id,
	"aria-label": ariaLabel,
	wrapperClassName = "",
	className = "",
	placeholder = "Select date",
}: DatePickerProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [view, setView] = useState(() => startOfMonth(parseDateValue(value) ?? new Date()));

	useEffect(() => {
		if (!open) return;
		setView(startOfMonth(parseDateValue(value) ?? new Date()));
	}, [open, value]);

	useEffect(() => {
		if (!open) return;
		function onDoc(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDoc);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	const cells = useMemo(() => buildMonthGrid(view), [view]);
	const todayValue = toDateValue(new Date());
	const display = value ? formatDisplay(value) : "";

	return (
		<div ref={rootRef} className={`relative ${wrapperClassName}`}>
			<button
				type="button"
				id={id}
				disabled={disabled}
				aria-label={ariaLabel}
				aria-expanded={open}
				aria-haspopup="dialog"
				onClick={() => setOpen((v) => !v)}
				className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-violet-500/20 bg-white/[0.03] px-3 py-2 text-left text-sm outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
					display ? "text-violet-50" : "text-violet-400/40"
				} ${className}`}
			>
				<span className="min-w-0 truncate">{display || placeholder}</span>
				<CalendarIcon className="size-4 shrink-0 text-violet-400/50" />
			</button>

			{open && !disabled ? (
				<div
					role="dialog"
					aria-label={monthLabel(view)}
					className="absolute top-[calc(100%+0.35rem)] left-0 z-50 w-[17.5rem] rounded-xl border border-violet-500/20 bg-ink p-3 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.85)]"
				>
					<div className="mb-2 flex items-center justify-between gap-2">
						<p className="text-sm font-medium text-violet-50">{monthLabel(view)}</p>
						<div className="flex items-center gap-0.5">
							<button
								type="button"
								aria-label="Previous month"
								onClick={() => setView((v) => addMonths(v, -1))}
								className="flex size-7 cursor-pointer items-center justify-center rounded-md text-violet-300/70 transition hover:bg-white/[0.06] hover:text-violet-50"
							>
								<ChevronLeft className="size-4" />
							</button>
							<button
								type="button"
								aria-label="Next month"
								onClick={() => setView((v) => addMonths(v, 1))}
								className="flex size-7 cursor-pointer items-center justify-center rounded-md text-violet-300/70 transition hover:bg-white/[0.06] hover:text-violet-50"
							>
								<ChevronRight className="size-4" />
							</button>
						</div>
					</div>

					<div className="mb-1 grid grid-cols-7 gap-0.5">
						{WEEKDAYS.map((d, i) => (
							<span
								key={`${d}-${i}`}
								className="flex size-8 items-center justify-center text-[11px] font-medium text-violet-400/55"
							>
								{d}
							</span>
						))}
					</div>

					<div className="grid grid-cols-7 gap-0.5">
						{cells.map((cell) => {
							const isSelected = cell.value === value;
							const isToday = cell.value === todayValue;
							return (
								<button
									key={cell.value}
									type="button"
									onClick={() => {
										onChange(cell.value);
										setOpen(false);
									}}
									className={`flex size-8 cursor-pointer items-center justify-center rounded-md text-xs transition ${
										isSelected
											? "bg-violet-600 font-semibold text-white hover:bg-violet-500"
											: isToday
												? "border border-violet-400/35 text-violet-100 hover:bg-white/[0.06]"
												: cell.inMonth
													? "text-violet-100 hover:bg-white/[0.06]"
													: "text-violet-400/30 hover:bg-white/[0.04] hover:text-violet-200/70"
									}`}
								>
									{cell.date.getDate()}
								</button>
							);
						})}
					</div>

					<div className="mt-2 flex items-center justify-between border-t border-violet-500/10 pt-2">
						<button
							type="button"
							onClick={() => {
								onChange("");
								setOpen(false);
							}}
							className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-violet-300/80 transition hover:bg-white/[0.05] hover:text-violet-100"
						>
							Clear
						</button>
						<button
							type="button"
							onClick={() => {
								const today = toDateValue(new Date());
								onChange(today);
								setView(startOfMonth(new Date()));
								setOpen(false);
							}}
							className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-violet-300/80 transition hover:bg-white/[0.05] hover:text-violet-100"
						>
							Today
						</button>
					</div>
				</div>
			) : null}
		</div>
	);
}
