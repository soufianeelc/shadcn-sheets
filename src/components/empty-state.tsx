import { FileSpreadsheet, Table, Upload } from "lucide-react";
import { EmptyState as EmptyStateUI } from "@/components/_ui/empty-state";

export function EmptyState() {
	return (
		<EmptyStateUI
			title='No recent files'
			description='Import your first spreadsheet to get started.&#10;Your files are stored locally in your browser.'
			icons={[FileSpreadsheet, Table, Upload]}
			className='w-full mx-auto maw'
		/>
	);
}
