import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") {
    return <ArrowUp className="h-3.5 w-3.5" />;
  }
  if (sorted === "desc") {
    return <ArrowDown className="h-3.5 w-3.5" />;
  }
  return <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />;
}
