import { useState } from "react";
import type { ReactNode } from "react";
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
  pageSize?: number;
}

export const DataTable = <T,>({
  columns,
  rows,
  getKey,
  pageSize = 5,
}: DataTableProps<T>) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <>
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
            <tr key={getKey(row)}>
              <td>{start + i + 1}</td>
              {columns.map((col) => (
                <td key={col.header}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
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
