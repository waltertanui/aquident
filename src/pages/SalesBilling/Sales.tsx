import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
import { listSales, createSale, listSalesInventory } from "../../middleware/data";
import type { SalesInventoryItem, Sale } from "../../middleware/data";

function Sales() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [inventory, setInventory] = useState<SalesInventoryItem[]>([]);
    const [showAddSale, setShowAddSale] = useState(false);
    const [loading, setLoading] = useState(true);

    const [newSale, setNewSale] = useState({
        customer_name: "",
        item_id: "",
        quantity: 1,
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [salesData, inventoryData] = await Promise.all([
            listSales(),
            listSalesInventory(),
        ]);
        setSales(salesData);
        setInventory(inventoryData.filter(i => i.qty > 0));
        setLoading(false);
    }

    const handleSaveSale = async () => {
        if (!newSale.customer_name || !newSale.item_id || newSale.quantity <= 0) return;

        const item = inventory.find(i => i.id === newSale.item_id);
        if (!item) return;

        if (newSale.quantity > item.qty) {
            alert(`Only ${item.qty} items left in stock.`);
            return;
        }

        const saleData = {
            customer_name: newSale.customer_name,
            item_id: newSale.item_id,
            quantity: newSale.quantity,
            unit_price: item.price,
            total_price: item.price * newSale.quantity,
            sale_date: new Date().toISOString(),
        };

        const result = await createSale(saleData);
        if (result) {
            setShowAddSale(false);
            setNewSale({ customer_name: "", item_id: "", quantity: 1 });
            loadData();
        }
    };

    const formatCurrency = (n: number) =>
        n.toLocaleString(undefined, { style: "currency", currency: "USD" });

    // Calculate KPIs
    const today = new Date().toISOString().split("T")[0];
    const totalRevenue = sales.reduce((sum, s) => sum + s.total_price, 0);
    const todaysSales = sales.filter(s => s.sale_date.startsWith(today));
    const todaysRevenue = todaysSales.reduce((sum, s) => sum + s.total_price, 0);
    const totalTransactions = sales.length;
    const totalItemsSold = sales.reduce((sum, s) => sum + s.quantity, 0);

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Sales"
                action={{ label: "Add Sale", onClick: () => setShowAddSale(true) }}
            />

            {/* Colorful KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-90">Total Revenue</div>
                            <div className="text-2xl font-bold mt-1">Ksh {totalRevenue.toLocaleString()}</div>
                        </div>
                        <div className="text-3xl opacity-80">💰</div>
                    </div>
                    <div className="mt-2 text-xs opacity-75">All time sales revenue</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-90">Today's Revenue</div>
                            <div className="text-2xl font-bold mt-1">Ksh {todaysRevenue.toLocaleString()}</div>
                        </div>
                        <div className="text-3xl opacity-80">📅</div>
                    </div>
                    <div className="mt-2 text-xs opacity-75">{todaysSales.length} transactions today</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-90">Total Transactions</div>
                            <div className="text-2xl font-bold mt-1">{totalTransactions.toLocaleString()}</div>
                        </div>
                        <div className="text-3xl opacity-80">🧾</div>
                    </div>
                    <div className="mt-2 text-xs opacity-75">Completed sales</div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-90">Items Sold</div>
                            <div className="text-2xl font-bold mt-1">{totalItemsSold.toLocaleString()}</div>
                        </div>
                        <div className="text-3xl opacity-80">📦</div>
                    </div>
                    <div className="mt-2 text-xs opacity-75">Total quantity sold</div>
                </div>
            </div>

            {showAddSale && (
                <Card>
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Record New Sale</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={newSale.customer_name}
                                    onChange={e => setNewSale(v => ({ ...v, customer_name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Item</label>
                                <select
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={newSale.item_id}
                                    onChange={e => setNewSale(v => ({ ...v, item_id: e.target.value }))}
                                >
                                    <option value="">Select an item</option>
                                    {inventory.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({formatCurrency(item.price)}) - {item.qty} in stock
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={newSale.quantity}
                                    onChange={e => setNewSale(v => ({ ...v, quantity: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 rounded bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
                                onClick={handleSaveSale}
                            >
                                Save Sale
                            </button>
                            <button
                                className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
                                onClick={() => setShowAddSale(false)}
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
                                <th className="text-left p-4 font-medium">Date</th>
                                <th className="text-left p-4 font-medium">Customer</th>
                                <th className="text-left p-4 font-medium">Item</th>
                                <th className="text-right p-4 font-medium">Qty</th>
                                <th className="text-right p-4 font-medium">Unit Price</th>
                                <th className="text-right p-4 font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 animate-pulse">Loading sales records...</td>
                                </tr>
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No sales recorded yet.</td>
                                </tr>
                            ) : (
                                sales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-gray-600">
                                            {new Date(sale.sale_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-gray-900 font-medium">{sale.customer_name}</td>
                                        <td className="p-4 text-gray-600">{sale.item_name}</td>
                                        <td className="p-4 text-right text-gray-600">{sale.quantity}</td>
                                        <td className="p-4 text-right text-gray-600">{formatCurrency(sale.unit_price)}</td>
                                        <td className="p-4 text-right text-teal-600 font-semibold">{formatCurrency(sale.total_price)}</td>
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

export default Sales;
