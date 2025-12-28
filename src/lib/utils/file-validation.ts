export function isValidFileType(file: File): boolean {
  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  const validExtensions = [".csv", ".xlsx", ".xls"];

  if (validTypes.includes(file.type)) return true;

  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return validExtensions.includes(extension);
}

export const ACCEPTED_FILE_TYPES = ".csv,.xlsx,.xls";
export const FILE_TYPE_ERROR_MESSAGE =
  "Please drop a CSV or Excel file (.csv, .xlsx, .xls)";
