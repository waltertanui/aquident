// SalesBilling component
import PageHeader from "../components/PageHeader";
import Card from "../ui/Card";
import { useState } from "react"; // NEW: local state for invoices and modal

// NEW: lightweight type for invoices (placed above the component)
type Invoice = {
  id: string;
  customer: string;
  amount: number;
  status: "Paid" | "Due" | "Overdue";
  dueDate: string; // ISO date string
};

function SalesBilling() {
  // NEW: state
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customer: "",
    amount: 0,
    dueDate: "",
  });
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: "INV-1001", customer: "Acme Co.", amount: 1200, status: "Due", dueDate: "2026-02-01" },
    { id: "INV-1002", customer: "Globex", amount: 800, status: "Paid", dueDate: "2026-01-05" },
  ]);

  // NEW: helpers
  const formatCurrency = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  const totalDue = invoices.filter(i => i.status !== "Paid").reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);

  const handleSaveInvoice = () => {
    if (!newInvoice.customer || !newInvoice.dueDate || (newInvoice.amount ?? 0) <= 0) return;
    const created: Invoice = {
      id: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
      customer: newInvoice.customer!,
      amount: Number(newInvoice.amount ?? 0),
      status: "Due",
      dueDate: newInvoice.dueDate!,
    };
    setInvoices(prev => [created, ...prev]);
    setShowCreateInvoice(false);
    setNewInvoice({ customer: "", amount: 0, dueDate: "" });
  };
  return (
    <div className="p-6 space-y-6">
      {/* UPDATED: add onClick handler to header action */}
      <PageHeader
        title="Sales & Billing"
        action={{ label: "Create Invoice", onClick: () => setShowCreateInvoice(true) }}
      />

      <Card>
        {/* REPLACED: overview content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-xs text-gray-500">Total Invoices</div>
            <div className="text-xl font-semibold">{invoices.length}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs text-gray-500">Amount Due</div>
            <div className="text-xl font-semibold">{formatCurrency(totalDue)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs text-gray-500">Paid</div>
            <div className="text-xl font-semibold text-green-600">{formatCurrency(totalPaid)}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="font-medium">Recent Invoices</div>
          {/* Fallback UIButton in case PageHeader action doesn't wire up */}
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
            onClick={() => setShowCreateInvoice(true)}
          >
            Create Invoice
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left p-2">Invoice</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="p-2">{inv.id}</td>
                  <td className="p-2">{inv.customer}</td>
                  <td className="p-2 text-right">{formatCurrency(inv.amount)}</td>
                  <td className="p-2">
                    <span
                      className={
                        inv.status === "Paid"
                          ? "text-green-600"
                          : inv.status === "Overdue"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-2">{inv.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* NEW: lightweight inline create-invoice form */}
      {showCreateInvoice && (
        <Card>
          <div className="space-y-4">
            <div className="font-medium">Create Invoice</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Customer</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-2"
                  value={newInvoice.customer ?? ""}
                  onChange={e => setNewInvoice(v => ({ ...v, customer: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded px-2 py-2"
                  value={newInvoice.amount ?? 0}
                  onChange={e => setNewInvoice(v => ({ ...v, amount: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-2"
                  value={newInvoice.dueDate ?? ""}
                  onChange={e => setNewInvoice(v => ({ ...v, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                onClick={handleSaveInvoice}
              >
                Save
              </button>
              <button
                className="px-3 py-2 rounded border text-sm"
                onClick={() => setShowCreateInvoice(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default SalesBilling;