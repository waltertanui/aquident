import React from "react";
import Card from "../ui/Card";

type Props = {
  items: { text: string; time: string }[];
};

function RecentActivity({ items }: Props) {
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between text-sm">
            <span>{item.text}</span>
            <span className="text-gray-500">{item.time}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default RecentActivity;