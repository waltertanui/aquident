import PageHeader from "../components/PageHeader";
import Card from "../ui/Card";
import { useEffect, useMemo, useState } from "react";
import type {
  InternalInventoryItem,
  InternalInventoryStatus,
  InventoryRequest,
} from "../middleware/data";
import {
  listInternalInventory,
  createInternalInventoryItem,
  deleteInternalInventoryItem,
  listInventoryRequests,
  approveInventoryRequest,
  rejectInventoryRequest,
} from "../middleware/data";

function Inventory() {
  const [items, setItems] = useState<InternalInventoryItem[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "requests" | "history">("inventory");
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    initial_qty: 0,
    qty: 0,
  });

  // Load items and requests from Supabase
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [inventoryData, requestsData] = await Promise.all([
          listInternalInventory(),
          listInventoryRequests(),
        ]);
        setItems(inventoryData);
        setRequests(requestsData);
      } catch (err) {
        console.error("Error loading inventory:", err);
        setError("Failed to load inventory. Please ensure the database tables exist.");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        String(i.qty).includes(q) ||
        i.status.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Split requests into pending and history
  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const historyRequests = useMemo(() => requests.filter(r => r.status !== 'pending'), [requests]);

  const addItem = async () => {
    if (!newItem.name || !newItem.sku) return;
    const created = await createInternalInventoryItem({
      name: newItem.name,
      sku: newItem.sku,
      initial_qty: newItem.initial_qty,
      qty: newItem.qty,
    });
    if (created) {
      setItems((prev) => [...prev, created]);
    }
    setShowAdd(false);
    setNewItem({ name: "", sku: "", initial_qty: 0, qty: 0 });
  };

  const deleteItem = async (id: number) => {
    const success = await deleteInternalInventoryItem(id);
    if (success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleApprove = async (requestId: number) => {
    const success = await approveInventoryRequest(requestId, "Inventory Keeper");
    if (success) {
      // Refresh both lists
      const [inventoryData, requestsData] = await Promise.all([
        listInternalInventory(),
        listInventoryRequests(),
      ]);
      setItems(inventoryData);
      setRequests(requestsData);
    }
  };

  const handleReject = async (requestId: number) => {
    const reason = prompt("Reason for rejection (optional):");
    const success = await rejectInventoryRequest(requestId, "Inventory Keeper", reason || undefined);
    if (success) {
      // Refresh requests list to move item to history
      const requestsData = await listInventoryRequests();
      setRequests(requestsData);
    }
  };

  const getStatusBadge = (status: InternalInventoryStatus) => {
    const styles = {
      "In Stock": "bg-green-100 text-green-700",
      "Low": "bg-amber-100 text-amber-700",
      "Out": "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getRequestStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs capitalize ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  const getSourceBadge = (source: string) => {
    const labels: Record<string, string> = {
      internal_lab: "Internal Lab",
      external_lab: "External Lab",
      clinic: "Clinic",
    };
    const styles: Record<string, string> = {
      internal_lab: "bg-blue-100 text-blue-700",
      external_lab: "bg-purple-100 text-purple-700",
      clinic: "bg-teal-100 text-teal-700",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${styles[source] || "bg-gray-100 text-gray-700"}`}>
        {labels[source] || source}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Inventory"
        action={{ label: "Add Item", onClick: () => setShowAdd(true) }}
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "inventory"
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          Inventory Items
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "requests"
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "history"
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          Request History
        </button>
      </div>

      <Card>
        {/* error state */}
        {error && (
          <div className="py-8 text-center text-red-500">
            {error}
            <div className="mt-2 text-sm text-gray-500">
              Run the SQL migrations in Supabase to create the tables.
            </div>
          </div>
        )}

        {/* loading state */}
        {loading && !error ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : activeTab === "inventory" ? (
          <>
            {/* search */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, SKU, quantity, status..."
                className="w-full md:w-80 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* add form */}
            {showAdd && (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem((ni) => ({ ...ni, name: e.target.value }))}
                  placeholder="Name"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={(e) => setNewItem((ni) => ({ ...ni, sku: e.target.value }))}
                  placeholder="SKU"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={newItem.initial_qty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNewItem((ni) => ({ ...ni, initial_qty: val, qty: val }));
                  }}
                  placeholder="Initial Qty"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={newItem.qty}
                  onChange={(e) => setNewItem((ni) => ({ ...ni, qty: Number(e.target.value) }))}
                  placeholder="Current Qty"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addItem}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* inventory table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3">Initial Qty</th>
                    <th className="py-2 px-3">Current Qty</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 px-3 text-center text-gray-500">
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="border-t border-gray-200">
                        <td className="py-2 px-3">{item.name}</td>
                        <td className="py-2 px-3">{item.sku}</td>
                        <td className="py-2 px-3">{item.initial_qty}</td>
                        <td className="py-2 px-3">{item.qty}</td>
                        <td className="py-2 px-3">{getStatusBadge(item.status)}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : activeTab === "requests" ? (
          /* Pending Requests Tab */
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Source</th>
                  <th className="py-2 px-3">Patient</th>
                  <th className="py-2 px-3">Requested By</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 px-3 text-center text-gray-500">
                      No pending requests.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => (
                    <tr key={req.id} className="border-t border-gray-200">
                      <td className="py-2 px-3">
                        <div className="font-medium">{req.item_name}</div>
                        <div className="text-xs text-gray-500">{req.item_sku}</div>
                      </td>
                      <td className="py-2 px-3">{req.quantity}</td>
                      <td className="py-2 px-3">{getSourceBadge(req.source)}</td>
                      <td className="py-2 px-3">{req.patient_name || "-"}</td>
                      <td className="py-2 px-3">{req.requested_by || "-"}</td>
                      <td className="py-2 px-3">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="rounded-md bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* History Tab */
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Source</th>
                  <th className="py-2 px-3">Requested By</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Processed By</th>
                  <th className="py-2 px-3">Processed Date</th>
                  <th className="py-2 px-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {historyRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 px-3 text-center text-gray-500">
                      No history found.
                    </td>
                  </tr>
                ) : (
                  historyRequests.map((req) => (
                    <tr key={req.id} className="border-t border-gray-200">
                      <td className="py-2 px-3">
                        <div className="font-medium">{req.item_name}</div>
                        <div className="text-xs text-gray-500">{req.item_sku}</div>
                      </td>
                      <td className="py-2 px-3">{req.quantity}</td>
                      <td className="py-2 px-3">{getSourceBadge(req.source)}</td>
                      <td className="py-2 px-3">{req.requested_by || "-"}</td>
                      <td className="py-2 px-3">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2 px-3">{getRequestStatusBadge(req.status)}</td>
                      <td className="py-2 px-3">{req.approved_by || "-"}</td>
                      <td className="py-2 px-3">
                        {req.approved_at ? new Date(req.approved_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2 px-3">
                        {req.rejection_reason ? (
                          <span className="text-red-600">{req.rejection_reason}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Inventory;