import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
import {
    listSalesInventory,
    createSalesInventoryItem,
    deleteSalesInventoryItem,
} from "../../middleware/data";
import type { SalesInventoryItem } from "../../middleware/data";

function SalesInventory() {
    const queryClient = useQueryClient();

    const { data: items = [], isLoading: loading } = useQuery({
        queryKey: ['salesInventory'],
        queryFn: listSalesInventory,
    });

    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        sku: "",
        qty: 0,
        price: 0,
    });

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.sku) return;

        let status: SalesInventoryItem["status"] = "In Stock";
        if (newItem.qty === 0) status = "Out";
        else if (newItem.qty < 10) status = "Low";

        const result = await createSalesInventoryItem({
            ...newItem,
            initial_qty: newItem.qty,
            status,
        });

        if (result) {
            queryClient.invalidateQueries({ queryKey: ['salesInventory'] });
            setShowAdd(false);
            setNewItem({ name: "", sku: "", qty: 0, price: 0 });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            const success = await deleteSalesInventoryItem(id);
            if (success) {
                queryClient.invalidateQueries({ queryKey: ['salesInventory'] });
            }
        }
    };

    const formatCurrency = (n: number) =>
        n.toLocaleString("en-KE", { style: "currency", currency: "KES" });

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Sales Inventory"
                action={{ label: "Add Item", onClick: () => setShowAdd(true) }}
            />

            {showAdd && (
                <Card>
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Add Inventory Item</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Item Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={newItem.name}
                                    onChange={e => setNewItem(v => ({ ...v, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">SKU</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={newItem.sku}
                                    onChange={e => setNewItem(v => ({ ...v, sku: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={newItem.qty}
                                    onChange={e => setNewItem(v => ({ ...v, qty: Number(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Price</label>
                                <input
                                    type="number"
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={newItem.price}
                                    onChange={e => setNewItem(v => ({ ...v, price: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 rounded bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
                                onClick={handleAddItem}
                            >
                                Save Item
                            </button>
                            <button
                                className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
                                onClick={() => setShowAdd(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-200">
                                <th className="text-left p-4 font-medium">Name</th>
                                <th className="text-left p-4 font-medium">SKU</th>
                                <th className="text-right p-4 font-medium">Initial Qty</th>
                                <th className="text-right p-4 font-medium">Qty</th>
                                <th className="text-right p-4 font-medium">Price</th>
                                <th className="text-center p-4 font-medium">Status</th>
                                <th className="text-right p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 animate-pulse">Loading inventory...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">No items in inventory.</td>
                                </tr>
                            ) : (
                                items.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-gray-900 font-medium">{item.name}</td>
                                        <td className="p-4 text-slate-700">{item.sku}</td>
                                        <td className="p-4 text-right text-teal-600 font-medium">{item.initial_qty}</td>
                                        <td className="p-4 text-right text-slate-700">{item.qty}</td>
                                        <td className="p-4 text-right text-slate-700">{formatCurrency(item.price)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                        ${item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-700 transition text-xs font-medium"
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
            </Card>
        </div>
    );
}

export default SalesInventory;
