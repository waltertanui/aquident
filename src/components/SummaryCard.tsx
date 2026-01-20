import Card from "../ui/Card";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

function SummaryCard({ label, value, hint }: Props) {
  return (
    <Card>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
      </div>
    </Card>
  );
}

export default SummaryCard;