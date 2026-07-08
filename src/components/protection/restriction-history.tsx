import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RestrictionHistory({
  history,
}: {
  history: { roundNumber: number; dueAt: string; status: string; slashedAmount: number; restrictionApplied: boolean }[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Round</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Slashed</TableHead>
          <TableHead>Restriction</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((item) => (
          <TableRow key={`${item.roundNumber}-${item.dueAt}`}>
            <TableCell>Round {item.roundNumber}</TableCell>
            <TableCell>{new Date(item.dueAt).toLocaleString()}</TableCell>
            <TableCell><Badge variant={item.status === "missed" ? "destructive" : "outline"}>{item.status}</Badge></TableCell>
            <TableCell>{item.slashedAmount} USDC</TableCell>
            <TableCell>{item.restrictionApplied ? "Applied" : "No"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

