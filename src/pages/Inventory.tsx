import PageHeader from "../components/PageHeader";
import Card from "../ui/Card";
import { useEffect, useMemo, useState } from "react";
import type {
  InternalInventoryItem,
  InternalInventoryStatus,
} from "../middleware/data";
import {
  listInternalInventory,
  createInternalInventoryItem,
  deleteInternalInventoryItem,
} from "../middleware/data";

function Inventory() {
  const [items, setItems] = useState<InternalInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    qty: 0,
    status: "In Stock" as InternalInventoryStatus,
  });

  // Load items from Supabase
  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      setError(null);
      try {
        const data = await listInternalInventory();
        setItems(data);
      } catch (err) {
        console.error("Error loading inventory:", err);
        setError("Failed to load inventory. Please ensure the database table exists.");
      }
      setLoading(false);
    }
    fetchItems();
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

  const addItem = async () => {
    if (!newItem.name || !newItem.sku) return;
    const created = await createInternalInventoryItem({
      name: newItem.name,
      sku: newItem.sku,
      qty: newItem.qty,
      status: newItem.status,
    });
    if (created) {
      setItems((prev) => [...prev, created]);
    }
    setShowAdd(false);
    setNewItem({ name: "", sku: "", qty: 0, status: "In Stock" });
  };

  const deleteItem = async (id: number) => {
    const success = await deleteInternalInventoryItem(id);
    if (success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Inventory"
        action={{ label: "Add Item", onClick: () => setShowAdd(true) }}
      />
      <Card>
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
              onChange={(e) =>
                setNewItem((ni) => ({ ...ni, name: e.target.value }))
              }
              placeholder="Name"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newItem.sku}
              onChange={(e) =>
                setNewItem((ni) => ({ ...ni, sku: e.target.value }))
              }
              placeholder="SKU"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newItem.qty}
              onChange={(e) =>
                setNewItem((ni) => ({ ...ni, qty: Number(e.target.value) }))
              }
              placeholder="Qty"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newItem.status}
              onChange={(e) =>
                setNewItem((ni) => ({
                  ...ni,
                  status: e.target.value as InternalInventoryStatus,
                }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="In Stock">In Stock</option>
              <option value="Low">Low</option>
              <option value="Out">Out</option>
            </select>
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

        {/* error state */}
        {error && (
          <div className="py-8 text-center text-red-500">
            {error}
            <div className="mt-2 text-sm text-gray-500">
              Run the SQL migration in Supabase to create the internal_inventory table.
            </div>
          </div>
        )}

        {/* loading state */}
        {loading && !error ? (
          <div className="py-8 text-center text-gray-500">Loading inventory...</div>
        ) : (
          /* table */
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 px-3 text-center text-gray-500"
                    >
                      No items found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200">
                      <td className="py-2 px-3">{item.name}</td>
                      <td className="py-2 px-3">{item.sku}</td>
                      <td className="py-2 px-3">{item.qty}</td>
                      <td className="py-2 px-3">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-1 text-xs " +
                            (item.status === "In Stock"
                              ? "bg-green-100 text-green-700"
                              : item.status === "Low"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700")
                          }
                        >
                          {item.status}
                        </span>
                      </td>
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
        )}
      </Card>
    </div>
  );
}

export default Inventory;