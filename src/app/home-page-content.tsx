"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/_ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DeleteSheetDialog } from "@/components/delete-sheet-dialog";
import { HomeContent } from "@/components/home-content";
import { PageHeader } from "@/components/page-header";
import { SheetContainer, SheetTabs } from "@/components/sheet";
import { useSheetDelete } from "@/hooks/use-sheet-delete";
import { useSheetExport } from "@/hooks/use-sheet-export";
import { useSheetList } from "@/hooks/use-sheet-list";
import { useSheetTabs } from "@/hooks/use-sheet-tabs";
import { useImportWorker } from "@/lib/hooks/use-import-worker";
import { useSheetStore } from "@/lib/store/sheet-store";

export function HomePageContent() {
	const [sheetIdFromUrl, setSheetIdInUrl] = useQueryState(
		"sheet",
		parseAsString.withDefault("")
	);

	const { sheetId, sheetMeta, importState, unloadSheet, loadSheet } =
		useSheetStore();
	const { importFile } = useImportWorker();
	const { sheets, isLoading, refreshSheets, removeSheetFromList } =
		useSheetList();
	const { exportToCSV } = useSheetExport();

	const {
		deleteDialogOpen,
		sheetToDelete,
		initiateDelete,
		confirmDelete,
		setDeleteDialogOpen,
	} = useSheetDelete();

	const handleTabRemove = useCallback(
		(tabId: string) => {
			if (tabId === sheetId) {
				unloadSheet();
				setSheetIdInUrl("");
			}
		},
		[sheetId, unloadSheet, setSheetIdInUrl]
	);

	const handleTabNavigate = useCallback(
		(tabId: string) => {
			loadSheet(tabId);
			setSheetIdInUrl(tabId);
		},
		[loadSheet, setSheetIdInUrl]
	);

	const { tabs, removeTab, handleTabSelect, handleTabClose } = useSheetTabs({
		currentSheetId: sheetId,
		currentSheetMeta: sheetMeta,
		onTabSelect: handleTabNavigate,
		onTabRemove: handleTabRemove,
	});

	useEffect(() => {
		if (sheetId && sheetId !== sheetIdFromUrl) {
			setSheetIdInUrl(sheetId);
		}
	}, [sheetId, sheetIdFromUrl, setSheetIdInUrl]);

	useEffect(() => {
		if (sheetIdFromUrl && !sheetId) {
			loadSheet(sheetIdFromUrl);
		}
	}, [sheetIdFromUrl, sheetId, loadSheet]);

	useEffect(() => {
		if (!importState.isImporting && sheetMeta) {
			refreshSheets();
		}
	}, [importState.isImporting, sheetMeta, refreshSheets]);

	const handleFileSelect = useCallback(
		(file: File) => {
			importFile(file);
		},
		[importFile]
	);

	const handleImportClick = useCallback(() => {
		// Import functionality removed
	}, []);

	const handleOpenSheet = useCallback(
		(id: string) => {
			loadSheet(id);
			setSheetIdInUrl(id);
		},
		[loadSheet, setSheetIdInUrl]
	);

	const handleDeleteSheet = useCallback(
		(id: string, name: string) => {
			initiateDelete(id, name);
		},
		[initiateDelete]
	);

	const handleConfirmDelete = useCallback(() => {
		confirmDelete((deletedSheetId) => {
			removeSheetFromList(deletedSheetId);
			removeTab(deletedSheetId);
		});
	}, [confirmDelete, removeSheetFromList, removeTab]);

	const handleHomeClick = useCallback(() => {
		unloadSheet();
		setSheetIdInUrl("");
	}, [unloadSheet, setSheetIdInUrl]);

	const handleExportClick = useCallback(() => {
		if (sheetId && sheetMeta) {
			exportToCSV(sheetId, sheetMeta);
		}
	}, [sheetId, sheetMeta, exportToCSV]);

	return (
		<SidebarProvider>
			<AppSidebar
				onHomeClick={handleHomeClick}
				onImportClick={handleImportClick}
			/>
			<SidebarInset className='overflow-hidden'>
				<div className='flex flex-col h-screen overflow-hidden'>
					<PageHeader
						showExport={!!sheetId}
						isExportDisabled={!sheetMeta}
						onExportClick={handleExportClick}
					/>

					{sheetId ? (
						<div className='flex-1 overflow-hidden'>
							<SheetContainer />
						</div>
					) : (
						<HomeContent
							sheets={sheets}
							isLoading={isLoading}
							onFileSelect={handleFileSelect}
							onOpenSheet={handleOpenSheet}
							onDeleteSheet={handleDeleteSheet}
						/>
					)}

					{(sheetId || tabs.length > 0) && (
						<SheetTabs
							tabs={tabs}
							onTabSelect={handleTabSelect}
							onTabClose={handleTabClose}
							onAddTab={handleImportClick}
							onHomeClick={handleHomeClick}
						/>
					)}
				</div>
			</SidebarInset>

			<DeleteSheetDialog
				open={deleteDialogOpen}
				sheetName={sheetToDelete?.name ?? null}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleConfirmDelete}
			/>
		</SidebarProvider>
	);
}
