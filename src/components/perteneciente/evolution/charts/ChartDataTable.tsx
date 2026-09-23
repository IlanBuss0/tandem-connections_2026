import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const thClass = 'p-4 text-left align-middle font-medium';

export default function ChartDataTable({ id, caption, rows, valueHeader, collapsed = false }: {
  id: string; caption: string; rows: { label: string; value: string }[]; valueHeader: string; collapsed?: boolean;
}) {
  return (
    <div id={id} className={`lg:not-sr-only lg:block lg:overflow-hidden lg:rounded-2xl lg:border lg:border-[var(--evo-border-1)] ${collapsed ? 'sr-only' : 'mt-3 overflow-hidden rounded-2xl border border-[var(--evo-border-1)]'}`}>
      <Table>
        <TableCaption className="sr-only text-left lg:not-sr-only lg:static lg:mt-0 lg:px-4 lg:pb-1 lg:pt-3 lg:text-xs lg:text-[var(--evo-text-secondary)]">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Semana</TableHead>
            <TableHead scope="col">{valueHeader}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.label}>
              <th scope="row" className={thClass}>{row.label}</th>
              <TableCell>{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
