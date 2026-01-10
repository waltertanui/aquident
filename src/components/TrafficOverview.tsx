import React from "react";
import Card from "../ui/Card";

type Props = {
  className?: string;
  title: string;
  ranges: string[];
  selectedRange: string;
};

function TrafficOverview({ className, title, ranges, selectedRange }: Props) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <select
          className="rounded-md border px-2 py-1 text-sm"
          defaultValue={selectedRange}
        >
          {ranges.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Placeholder chart area */}
      <div className="mt-4 h-48 rounded-md bg-gradient-to-r from-teal-50 to-teal-100" />
    </Card>
  );
}

export default TrafficOverview;