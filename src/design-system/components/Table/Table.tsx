import React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export function Table({ wrapperClassName = "", className = "", children, ...props }: TableProps) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-[14px] border border-border bg-surface-1 shadow-[var(--shadow-card)] custom-scrollbar ${wrapperClassName}`}
    >
      <table className={`w-full border-collapse text-left text-[13px] ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  sticky = true,
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }) {
  return (
    <thead
      className={`bg-surface-2 border-b border-border text-xs font-semibold uppercase tracking-wider text-text-secondary ${
        sticky ? "sticky top-0 z-10" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-border ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  zebra = true,
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { zebra?: boolean }) {
  return (
    <tr
      className={`transition-colors hover:bg-surface-2/70 ${
        zebra ? "even:bg-surface-2/35" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className = "",
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 font-semibold text-text-secondary whitespace-nowrap ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({
  className = "",
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 text-foreground align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}
