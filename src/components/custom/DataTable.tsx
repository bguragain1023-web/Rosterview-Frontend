import { useState } from "react";
import type { ReactNode } from "react";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode; // how to show this column for one row
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string; // a unique id for each row
  getRowClassName?: (row: T) => string | undefined; // e.g. dim cancelled rows
  pageSize?: number;
  // Give this to show a search box; it returns the text to search in (e.g. name).
  getSearchText?: (row: T) => string;
  searchPlaceholder?: string;
  toolbar?: ReactNode; // shown on the left of the top row, e.g. tab buttons
}

export const DataTable = <T,>({
  columns,
  rows,
  getKey,
  getRowClassName,
  pageSize = 10,
  getSearchText,
  searchPlaceholder = "Search by name…",
  toolbar,
}: DataTableProps<T>) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Only rows whose text contains what's typed (ignoring upper/lower case).
  const query = search.trim().toLowerCase();
  const visibleRows =
    getSearchText && query
      ? rows.filter((row) => getSearchText(row).toLowerCase().includes(query))
      : rows;

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = visibleRows.slice(start, start + pageSize);

  return (
    <>
      {(toolbar || getSearchText) && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          {toolbar}
          {getSearchText && (
            <Form.Control
              type="search"
              size="sm"
              className="ms-auto"
              style={{ maxWidth: 240 }}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // new search → start from the first page
              }}
            />
          )}
        </div>
      )}

      <Table hover responsive className="dashboard-table mb-3">
        <thead>
          <tr>
            <th>#</th>
            {columns.map((col) => (
              <th key={col.header}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, i) => (
            <tr key={getKey(row)} className={getRowClassName?.(row)}>
              <td>{start + i + 1}</td>
              {columns.map((col) => (
                <td key={col.header}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
          {pageRows.length === 0 && query && (
            <tr>
              <td colSpan={columns.length + 1} className="text-center mutedDate">
                No matches for "{search.trim()}"
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination className="justify-content-end mb-0">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        />
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <Pagination.Item
            key={n}
            active={n === currentPage}
            onClick={() => setPage(n)}
          >
            {n}
          </Pagination.Item>
        ))}
        <Pagination.Next
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
        />
      </Pagination>
    </>
  );
};
