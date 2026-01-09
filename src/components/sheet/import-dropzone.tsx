"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader } from "lucide-react";
import Image from "next/image";
import { Progress } from "@/components/_ui/progress";
import { useDropzone } from "@/hooks/use-dropzone";
import { useSheetStore } from "@/lib/store/sheet-store";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_TYPES } from "@/lib/utils/file-validation";

interface ImportDropzoneProps {
	onFileSelect: (file: File) => void;
}

export function ImportDropzone({ onFileSelect }: ImportDropzoneProps) {
	const { importState } = useSheetStore();

	const {
		isDragging,
		fileInputRef,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleFileChange,
		handleBrowseClick,
	} = useDropzone({
		onFileSelect,
		isDisabled: importState.isImporting,
	});

	return (
		<>
			<motion.button
				type='button'
				tabIndex={0}
				aria-label='Drop zone for file upload'
				className={cn(
					"group relative rounded-xl w-full border-2 border-dashed transition-colors duration-200 min-h-[300px]",
					importState.isImporting
						? "border-border bg-muted/30 cursor-default"
						: isDragging
						? "border-primary bg-primary/5 cursor-pointer"
						: "border-border/60 hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
				)}
				whileHover={!importState.isImporting ? { scale: 1.005 } : undefined}
				whileTap={!importState.isImporting ? { scale: 0.995 } : undefined}
				onDragOver={importState.isImporting ? undefined : handleDragOver}
				onDragLeave={importState.isImporting ? undefined : handleDragLeave}
				onDrop={importState.isImporting ? undefined : handleDrop}
				onClick={importState.isImporting ? undefined : handleBrowseClick}
				onKeyDown={
					importState.isImporting
						? undefined
						: (e) => {
								if (e.key === "Enter" || e.key === " ") {
									handleBrowseClick();
								}
						  }
				}>
				<div className='flex flex-col items-center justify-center gap-4 p-8 py-12 h-full'>
					<AnimatePresence mode='wait'>
						{importState.isImporting ? (
							<ImportingState
								key='importing'
								progress={importState.progress}
								error={importState.error}
							/>
						) : (
							<IdleState key='idle' isDragging={isDragging} />
						)}
					</AnimatePresence>
				</div>
			</motion.button>

			<input
				ref={fileInputRef}
				type='file'
				accept={ACCEPTED_FILE_TYPES}
				className='hidden'
				onChange={handleFileChange}
			/>
		</>
	);
}

function getProgressPhase(progress: number): {
	label: string;
	description: string;
} {
	if (progress < 10) {
		return {
			label: "Reading file",
			description: "Analyzing your spreadsheet structure...",
		};
	}
	if (progress < 30) {
		return {
			label: "Parsing data",
			description: "Converting rows and columns...",
		};
	}
	if (progress < 70) {
		return {
			label: "Processing",
			description: "Organizing your data for quick access...",
		};
	}
	if (progress < 95) {
		return {
			label: "Saving",
			description: "Storing data locally for offline use...",
		};
	}
	return {
		label: "Almost done",
		description: "Finishing up...",
	};
}

function ImportingState({
	progress,
	error,
}: {
	progress: number;
	error: string | null;
}) {
	const phase = getProgressPhase(progress);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.2 }}
			className='flex flex-col items-center gap-5 w-full max-w-sm'>
			{/* Compact icon with subtle animation */}
			<motion.div
				className='relative flex items-center justify-center'
				animate={{ scale: [1, 1.02, 1] }}
				transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
				<div className='absolute inset-0 rounded-full bg-muted-foreground/10 blur-xl' />
				<div className='relative flex h-14 w-14 items-center justify-center rounded-full bg-muted ring-1 ring-border'>
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
						<Loader className='h-6 w-6 text-muted-foreground' />
					</motion.div>
				</div>
			</motion.div>

			{/* Status text */}
			<div className='flex flex-col items-center text-center space-y-1'>
				{error ? (
					<>
						<p className='text-sm font-medium text-destructive'>
							Import failed
						</p>
						<p className='text-xs text-destructive/80'>{error}</p>
					</>
				) : (
					<>
						<motion.p
							key={phase.label}
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							className='text-sm font-medium text-foreground'>
							{phase.label}
						</motion.p>
						<p className='text-xs text-muted-foreground'>{phase.description}</p>
					</>
				)}
			</div>

			{/* Progress bar */}
			{!error && (
				<div className='flex flex-col items-center gap-2 w-full'>
					<div className='relative w-full'>
						<Progress value={progress} className='w-full h-1.5' />
						<motion.div
							className='absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent'
							animate={{ x: ["-100%", "100%"] }}
							transition={{
								duration: 1.5,
								repeat: Infinity,
								ease: "easeInOut",
							}}
							style={{ width: "50%" }}
						/>
					</div>
					<div className='flex items-center gap-1.5'>
						<span className='text-xs font-medium text-muted-foreground tabular-nums'>
							{Math.round(progress)}%
						</span>
					</div>
				</div>
			)}
		</motion.div>
	);
}

function IdleState({ isDragging }: { isDragging: boolean }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.2 }}
			className='flex flex-col items-center gap-4'>
			<motion.div
				className='relative w-24 h-24'
				animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 300, damping: 20 }}>
				<Image
					src='/folder-upload.svg'
					alt='Upload file'
					width={96}
					height={96}
					className={cn(
						"transition-opacity",
						isDragging ? "opacity-80" : "opacity-100"
					)}
				/>
			</motion.div>

			<div className='flex flex-col items-center text-center space-y-2'>
				<p
					className={cn(
						"text-lg font-semibold transition-colors",
						isDragging ? "text-primary" : "text-foreground"
					)}>
					{isDragging
						? "Drop your file here"
						: "Drop a file or click to import"}
				</p>
				<p className='text-sm text-muted-foreground max-w-md'>
					Supports CSV and Excel files (.csv, .xlsx, .xls) up to 100K+ rows
				</p>
			</div>
		</motion.div>
	);
}
