/** Shared column shape for both PDF and Excel exports — one definition
 * drives both formats so a filtered list only needs to declare its columns
 * once. */
export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string;
}
