import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SpinnerIcon } from "../../components/Icons";
import { Modal } from "./ui";

const OUTPUT_SIZE = 256;

function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Could not load image"));
		img.src = src;
	});
}

export function AvatarCropModal({
	imageSrc,
	onCancel,
	onComplete,
}: {
	imageSrc: string;
	onCancel: () => void;
	onComplete: (dataUrl: string) => void;
}) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const [zoom, setZoom] = useState(1);
	const [minZoom, setMinZoom] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
	const [viewport, setViewport] = useState(280);
	const [ready, setReady] = useState(false);
	const [exporting, setExporting] = useState(false);
	const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadImage(imageSrc)
			.then((img) => {
				if (cancelled) return;
				const size = viewportRef.current?.clientWidth || 280;
				setViewport(size);
				const cover = Math.max(size / img.naturalWidth, size / img.naturalHeight);
				setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
				setMinZoom(cover);
				setZoom(cover);
				setOffset({ x: 0, y: 0 });
				setReady(true);
			})
			.catch(() => {
				if (!cancelled) onCancel();
			});
		return () => {
			cancelled = true;
		};
	}, [imageSrc, onCancel]);

	function clampOffset(next: { x: number; y: number }, nextZoom: number) {
		const scaledW = imageSize.w * nextZoom;
		const scaledH = imageSize.h * nextZoom;
		const maxX = Math.max(0, (scaledW - viewport) / 2);
		const maxY = Math.max(0, (scaledH - viewport) / 2);
		return {
			x: Math.min(maxX, Math.max(-maxX, next.x)),
			y: Math.min(maxY, Math.max(-maxY, next.y)),
		};
	}

	function handleZoom(nextZoom: number) {
		const z = Math.max(minZoom, Math.min(minZoom * 3, nextZoom));
		setZoom(z);
		setOffset((prev) => clampOffset(prev, z));
	}

	function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
		e.currentTarget.setPointerCapture(e.pointerId);
		dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
	}

	function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
		if (!dragRef.current) return;
		const dx = e.clientX - dragRef.current.x;
		const dy = e.clientY - dragRef.current.y;
		setOffset(clampOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }, zoom));
	}

	function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
		dragRef.current = null;
		try {
			e.currentTarget.releasePointerCapture(e.pointerId);
		} catch {
			// already released
		}
	}

	async function handleApply() {
		setExporting(true);
		try {
			const img = await loadImage(imageSrc);
			const canvas = document.createElement("canvas");
			canvas.width = OUTPUT_SIZE;
			canvas.height = OUTPUT_SIZE;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Canvas unavailable");

			const scale = OUTPUT_SIZE / viewport;
			const drawW = imageSize.w * zoom * scale;
			const drawH = imageSize.h * zoom * scale;
			const dx = OUTPUT_SIZE / 2 + offset.x * scale - drawW / 2;
			const dy = OUTPUT_SIZE / 2 + offset.y * scale - drawH / 2;

			ctx.beginPath();
			ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(img, dx, dy, drawW, drawH);

			const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
			onComplete(dataUrl);
		} catch {
			onCancel();
		} finally {
			setExporting(false);
		}
	}

	return (
		<Modal title="Crop photo" onClose={onCancel} size="md">
			<div className="space-y-4">
				<p className="text-sm text-violet-300/60">Drag to reposition. Use the slider to zoom.</p>

				<div
					ref={viewportRef}
					className="relative mx-auto aspect-square w-full max-w-[280px] touch-none overflow-hidden rounded-full border border-violet-500/25 bg-black/40"
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
					role="presentation"
				>
					{ready ? (
						<img
							src={imageSrc}
							alt=""
							draggable={false}
							className="pointer-events-none absolute top-1/2 left-1/2 max-w-none select-none"
							style={{
								width: imageSize.w * zoom,
								height: imageSize.h * zoom,
								transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
							}}
						/>
					) : (
						<div className="flex h-full items-center justify-center">
							<SpinnerIcon className="size-5 text-violet-400" />
						</div>
					)}
					<div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/15 ring-inset" />
				</div>

				<div className="space-y-2">
					<label htmlFor="avatar-zoom" className="block text-xs font-medium text-violet-300/70">
						Zoom
					</label>
					<input
						id="avatar-zoom"
						type="range"
						min={minZoom}
						max={minZoom * 3}
						step={0.01}
						value={zoom}
						disabled={!ready}
						onChange={(e) => handleZoom(Number(e.target.value))}
						className="w-full accent-violet-500"
					/>
				</div>

				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						disabled={exporting}
						className="rounded-lg px-3.5 py-2 text-sm font-medium text-violet-300/60 transition hover:text-violet-100 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleApply}
						disabled={!ready || exporting}
						className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{exporting && <SpinnerIcon className="size-4" />}
						{exporting ? "Saving…" : "Use photo"}
					</button>
				</div>
			</div>
		</Modal>
	);
}
