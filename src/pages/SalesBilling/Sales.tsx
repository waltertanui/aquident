import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
import { listSales, createSale, listSalesInventory } from "../../middleware/data";
import logo from "../../assets/aquadent_logo.png";
// blank line or simply remove the line


function Sales() {
    const queryClient = useQueryClient();

    // Fetch sales and inventory
    const { data: sales = [], isLoading: loadingSales } = useQuery({
        queryKey: ['sales'],
        queryFn: listSales,
    });

    const { data: inventory = [], isLoading: loadingInventory } = useQuery({
        queryKey: ['salesInventory'],
        queryFn: listSalesInventory,
    });

    const activeInventory = inventory.filter(i => i.qty > 0);
    const loading = loadingSales || loadingInventory;

    const [showAddSale, setShowAddSale] = useState(false);

    const [newSale, setNewSale] = useState({
        customer_name: "",
        item_id: "",
        quantity: 1,
        payment_status: "paid" as "paid" | "pending",
        notes: "",
    });

    const printDocument = (type: 'receipt' | 'invoice' | 'quote', data: any) => {
        const w = window.open("", "_blank");
        if (!w) {
            alert("Please allow pop-ups");
            return;
        }

        const date = new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
        const time = new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

        // Document numbering
        const docNumber = `${type === 'invoice' ? 'VCH' : type.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 10000).toString().padStart(6, '0')}`;
        const refNo = Math.floor(Math.random() * 10000).toString().padStart(6, '0');

        // Styles based on type
        const isCompact = type === 'receipt';

        let html = '';

        if (isCompact) {
            // COMPACT RECEIPT TEMPLATE (Green/Red Gradient)
            const docTitle = 'Receipt';
            html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${docTitle} - ${docNumber}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; background: #f5f5f5; color: #1a1a1a; line-height: 1.3; font-size: 11px; }
                    .receipt-container { max-width: 600px; margin: 10px auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 15px 20px; position: relative; overflow: hidden; }
                    .header-content { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; }
                    .brand { display: flex; align-items: center; gap: 10px; }
                    .brand-icon { width: 40px; height: 40px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
                    .brand-text h1 { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
                    .brand-text p { font-size: 10px; opacity: 0.9; }
                    .receipt-badge { background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; text-align: right; }
                    .content { padding: 20px; }
                    .info-grid { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                    .info-card { flex: 1; }
                    .cost-card { background: #fafafa; border-radius: 6px; border: 1px solid #eee; overflow: hidden; }
                    .cost-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #eee; }
                    .cost-row:last-child { border-bottom: none; }
                    .cost-row.highlight { background: #16a34a; color: white; font-weight: 700; }
                    .balance-box { margin-top: 15px; padding: 15px; text-align: center; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; }
                    .footer { background: #1a1a1a; color: white; padding: 15px; text-align: center; }
                    .no-print { padding: 15px; text-align: center; }
                    .btn { padding: 10px 20px; margin: 0 5px; cursor: pointer; border: none; border-radius: 4px; color: white; }
                    .btn-primary { background: #16a34a; }
                    .btn-secondary { background: #666; }
                    @media print { body { background: white; } .receipt-container { box-shadow: none; margin: 0; } .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <div class="header-content">
                            <div class="brand">
                                <div class="brand-icon"><img src="${logo}" style="width:100%;height:100%;object-fit:contain;padding:3px" /></div>
                                <div class="brand-text"><h1>Aquadent Dental Clinic</h1><p>restore your smile</p></div>
                            </div>
                            <div class="receipt-badge"><div style="font-size:9px">RECEIPT</div><div style="font-weight:700">${docNumber}</div></div>
                        </div>
                    </div>
                    <div class="content">
                        <div class="info-grid">
                            <div class="info-card"><h3>Customer</h3><div style="font-weight:700">${data.customer_name}</div></div>
                            <div class="info-card" style="text-align:right"><h3>Date</h3><div>${date}</div></div>
                        </div>
                        <div class="cost-card">
                            <div class="cost-row"><span>Item</span><span style="font-weight:700">${data.item_name || 'Item'}</span></div>
                            <div class="cost-row"><span>Qty</span><span>x${data.quantity}</span></div>
                            <div class="cost-row highlight"><span>TOTAL PAID</span><span>Ksh ${data.total_price.toLocaleString()}</span></div>
                        </div>
                        <div class="balance-box">
                            <div style="color:#16a34a;font-weight:700;text-transform:uppercase;font-size:10px">✓ Paid in Full</div>
                            <div style="color:#16a34a;font-weight:800;font-size:24px">Ksh ${data.total_price.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="footer"><p>Thank you for choosing Aquadent!</p></div>
                </div>
                <div class="no-print"><button class="btn btn-primary" onclick="window.print()">Print Receipt</button></div>
            </body>
            </html>`;
        } else {
            // FULL PAGE INVOICE TEMPLATE (Matching Screenshot)
            const docTitle = type === 'quote' ? 'QUOTATION' : 'SALE INVOICE';
            html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${docTitle} - ${docNumber}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 20px; max-width: 900px; margin: 0 auto; color: #000; }
                    .header-section { margin-bottom: 20px; }
                    .top-header { display: flex; align-items: flex-start; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .logo-area { width: 100px; height: 80px; margin-right: 20px; }
                    .logo-img { width: 100%; height: 100%; object-fit: contain; }
                    .company-info { text-align: center; flex: 1; }
                    .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; font-family: Arial, sans-serif; }
                    .company-details { font-size: 11px; line-height: 1.4; }
                    
                    .doc-title { text-align: center; font-weight: bold; font-size: 14px; text-decoration: underline; margin: 20px 0; font-family: Arial, sans-serif; }
                    
                    .info-columns { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .col { width: 48%; }
                    .row { display: flex; margin-bottom: 3px; }
                    .label { width: 100px; font-weight: bold; }
                    .value { flex: 1; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: 'Courier New', Courier, monospace; }
                    th { border: 1px solid #000; padding: 5px; text-align: right; font-weight: bold; background: #f0f0f0; }
                    th:first-child, th:nth-child(2) { text-align: left; }
                    td { border: 1px solid #000; padding: 5px; text-align: right; }
                    td:first-child, td:nth-child(2) { text-align: left; }
                    
                    .totals-section { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .total-row.final { font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0; margin-top: 5px; }
                    
                    .footer-section { margin-top: 40px; font-size: 11px; }
                    
                    .no-print { margin-top: 20px; text-align: center; background: #eee; padding: 10px; }
                    .btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; cursor: pointer; border-radius: 4px; }
                    .close-btn { background: #6b7280; margin-left: 10px; }
                    
                    @media print { .no-print { display: none; } body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header-section">
                    <div class="top-header">
                        <div class="logo-area">
                            <img src="${logo}" class="logo-img" alt="Logo" />
                        </div>
                        <div class="company-info">
                            <div class="company-name">Aquadent Dental Clinic, Eldoret</div>
                            <div class="company-details">
                                P.O. Box 1234, Eldoret. Telephone: 053-2030000, 0722-000000<br>
                                Mobile: 0722 000000, 0733 000000 Fax: 053-2030001<br>
                                E-mail: info@aquadent.co.ke
                            </div>
                        </div>
                    </div>
                    
                    <div class="doc-title">${docTitle}</div>
                    
                    <div class="info-columns">
                        <div class="col">
                            <div class="row"><span class="label">Print Dt:</span><span class="value">${date} ${time}</span></div>
                            <div class="row"><span class="label">Voucher Bt.:</span><span class="value">${date}</span></div>
                            <div class="row"><span class="label">Ks No.:</span><span class="value">${refNo}</span></div>
                            <div class="row"><span class="label">Name:</span><span class="value">${data.customer_name.toUpperCase()}</span></div>
                            <div class="row"><span class="label">Ref.By:</span><span class="value">Dr. Lee</span></div>
                            <div class="row"><span class="label">Pre.Dbc.:</span><span class="value">Dr. Lee</span></div>
                            <div class="row"><span class="label">Srcl.:</span><span class="value">Aquadent Dental Center OPD</span></div>
                            <div class="row"><span class="label">Pat. Typ:</span><span class="value">${type === 'quote' ? 'QUOTE' : 'CREDIT'}</span></div>
                            <div class="row"><span class="label">Order No:</span><span class="value">${refNo}</span></div>
                        </div>
                        <div class="col">
                            <div class="row"><span class="label">Voucher No.:</span><span class="value">${docNumber}</span></div>
                            <div class="row"><span class="label">Corporate:</span><span class="value">-</span></div>
                            <div class="row"><span class="label">Scheme:</span><span class="value">-</span></div>
                            <div class="row"><span class="label">Trans.auth.no:</span><span class="value">-</span></div>
                            <div class="row"><span class="label">Agr - No:</span><span class="value">-</span></div>
                            <div class="row"><span class="label">Emp No:</span><span class="value">-</span></div>
                        </div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width:50px">No.</th>
                            <th>Service Name</th>
                            <th style="width:100px">Charge</th>
                            <th style="width:60px">Qty</th>
                            <th style="width:100px">Total</th>
                            <th style="width:100px">Net Disc</th>
                            <th style="width:100px">Net Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>${data.item_name || 'Item Name'} ${data.notes ? `(${data.notes})` : ''}</td>
                            <td>${data.unit_price.toLocaleString()}</td>
                            <td>${data.quantity}</td>
                            <td>${data.total_price.toLocaleString()}</td>
                            <td>0.00</td>
                            <td>${data.total_price.toLocaleString()}</td>
                        </tr>
                        <!-- Empty rows for spacing if needed -->
                    </tbody>
                    <tfoot>
                         <tr>
                            <td colspan="4" style="text-align:right; font-weight:bold; border:none; border-top:1px solid #000">Total Gross Amt</td>
                            <td style="font-weight:bold">${data.total_price.toLocaleString()}</td>
                            <td style="background:#ddd"></td>
                            <td style="font-weight:bold">${data.total_price.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <div class="totals-section">
                    <div class="total-row"><span>Patient Total</span><span>0</span></div>
                    <div class="total-row"><span>Sponsor Total</span><span>${data.total_price.toLocaleString()}</span></div>
                    <div class="total-row final"><span>Total</span><span>${data.total_price.toLocaleString()}</span></div>
                </div>
                
                <div class="footer-section">
                    User: FRONTOFFICE
                </div>
                
                <div class="no-print">
                    <button class="btn" onclick="window.print()">Print Invoice</button>
                    <button class="btn close-btn" onclick="window.close()">Close</button>
                </div>
            </body>
            </html>`;
        }

        w.document.write(html);
        w.document.close();
    };

    const handleSaveSale = async () => {
        if (!newSale.customer_name || !newSale.item_id || newSale.quantity <= 0) return;

        const item = activeInventory.find(i => i.id === newSale.item_id);
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
            payment_status: newSale.payment_status,
            notes: newSale.notes,
        };

        const result = await createSale(saleData);
        if (result) {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['salesInventory'] });
            setShowAddSale(false);
            setNewSale({ customer_name: "", item_id: "", quantity: 1, payment_status: "paid", notes: "" });
        }
    };

    const handleGenerateQuote = () => {
        if (!newSale.customer_name || !newSale.item_id || newSale.quantity <= 0) return;
        const item = activeInventory.find(i => i.id === newSale.item_id);
        if (!item) return;

        printDocument('quote', {
            customer_name: newSale.customer_name,
            quantity: newSale.quantity,
            unit_price: item.price,
            total_price: item.price * newSale.quantity,
            item_name: item.name,
            notes: newSale.notes
        });
    };

    const formatCurrency = (n: number) =>
        n.toLocaleString(undefined, { style: "currency", currency: "USD" });

    const formattedToday = new Date().toISOString().split("T")[0];
    const [filterType, setFilterType] = useState<"all" | "daily" | "weekly" | "monthly">("daily");
    const [selectedDate, setSelectedDate] = useState(formattedToday);

    // Helpers for filtering
    const getWeekNumber = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const filteredSales = sales.filter(s => {
        if (filterType === 'all') return true;

        const saleDate = new Date(s.sale_date);
        const selDate = new Date(selectedDate);

        if (filterType === 'daily') {
            return s.sale_date.startsWith(selectedDate);
        }
        if (filterType === 'weekly') {
            const saleWeek = getWeekNumber(saleDate);
            const selWeek = getWeekNumber(selDate);
            return saleWeek === selWeek && saleDate.getFullYear() === selDate.getFullYear();
        }
        if (filterType === 'monthly') {
            return saleDate.getMonth() === selDate.getMonth() && saleDate.getFullYear() === selDate.getFullYear();
        }
        return true;
    });

    // Calculate KPIs based on filteredSales
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total_price, 0);
    const totalTransactions = filteredSales.length;
    const totalItemsSold = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
    const cashRevenue = filteredSales.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + s.total_price, 0);
    const invoiceRevenue = filteredSales.filter(s => s.payment_status === 'pending').reduce((sum, s) => sum + s.total_price, 0);

    // Filter label for display
    const getFilterLabel = () => {
        if (filterType === 'all') return "All Time";
        const date = new Date(selectedDate);
        if (filterType === 'daily') return date.toLocaleDateString(undefined, { dateStyle: 'full' });
        if (filterType === 'monthly') return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        if (filterType === 'weekly') return `Week ${getWeekNumber(date)}, ${date.getFullYear()}`;
        return "";
    }

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Sales"
                action={{ label: "Add Sale", onClick: () => setShowAddSale(true) }}
            />

            {/* Filter Controls */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <div className="flex gap-2">
                        {(['daily', 'weekly', 'monthly', 'all'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${filterType === type
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {filterType !== 'all' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-600">
                                Select {filterType === 'monthly' ? 'Month' : 'Date'}:
                            </label>
                            <input
                                type={filterType === 'monthly' ? 'month' : 'date'}
                                value={filterType === 'monthly' ? selectedDate.substring(0, 7) : selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    )}
                </div>
                <div className="mt-2 text-sm text-gray-500 text-center font-medium">
                    Showing data for: <span className="text-teal-700">{getFilterLabel()}</span>
                </div>
            </Card>

            {/* Colorful KPI Cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-2.5 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs opacity-90">Total Revenue</div>
                            <div className="text-lg font-bold">Ksh {totalRevenue.toLocaleString()}</div>
                        </div>
                        <div className="text-xl opacity-80">💰</div>
                    </div>
                    <div className="mt-1 text-[10px] opacity-75">{getFilterLabel()}</div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2.5 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs opacity-90">Cash Revenue</div>
                            <div className="text-lg font-bold">Ksh {cashRevenue.toLocaleString()}</div>
                        </div>
                        <div className="text-xl opacity-80">💵</div>
                    </div>
                    <div className="mt-1 text-[10px] opacity-75">Paid sales</div>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-2.5 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs opacity-90">Invoice Revenue</div>
                            <div className="text-lg font-bold">Ksh {invoiceRevenue.toLocaleString()}</div>
                        </div>
                        <div className="text-xl opacity-80">📄</div>
                    </div>
                    <div className="mt-1 text-[10px] opacity-75">Pending invoices</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2.5 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs opacity-90">Transactions</div>
                            <div className="text-lg font-bold">{totalTransactions.toLocaleString()}</div>
                        </div>
                        <div className="text-xl opacity-80">🧾</div>
                    </div>
                    <div className="mt-1 text-[10px] opacity-75">Sales count</div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-2.5 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs opacity-90">Items Sold</div>
                            <div className="text-lg font-bold">{totalItemsSold.toLocaleString()}</div>
                        </div>
                        <div className="text-xl opacity-80">📦</div>
                    </div>
                    <div className="mt-1 text-[10px] opacity-75">Total quantity</div>
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
                                    {activeInventory.map(item => (
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Payment Status</label>
                            <select
                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={newSale.payment_status}
                                onChange={(e) => setNewSale(v => ({ ...v, payment_status: e.target.value as "paid" | "pending" }))}
                            >
                                <option value="paid">Paid (Receipt)</option>
                                <option value="pending">Pending (Invoice)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Notes</label>
                            <input
                                type="text"
                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={newSale.notes}
                                onChange={(e) => setNewSale(v => ({ ...v, notes: e.target.value }))}
                                placeholder="Optional notes..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-between">
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 rounded bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
                                onClick={handleSaveSale}
                            >
                                Save Sale
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                                onClick={handleGenerateQuote}
                            >
                                Generate Quote
                            </button>
                        </div>
                        <button
                            className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
                            onClick={() => setShowAddSale(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </Card>
            )
            }


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
                                <th className="text-center p-4 font-medium">Status</th>
                                <th className="text-right p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 animate-pulse">Loading sales records...</td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">No sales recorded for this period.</td>
                                </tr>
                            ) : (
                                filteredSales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-gray-600">
                                            {new Date(sale.sale_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-gray-900 font-medium">{sale.customer_name}</td>
                                        <td className="p-4 text-gray-600">{sale.item_name}</td>
                                        <td className="p-4 text-right text-gray-600">{sale.quantity}</td>
                                        <td className="p-4 text-right text-gray-600">{formatCurrency(sale.unit_price)}</td>
                                        <td className="p-4 text-right text-teal-600 font-semibold">{formatCurrency(sale.total_price)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full ${sale.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {sale.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => printDocument(sale.payment_status === 'paid' ? 'receipt' : 'invoice', sale)}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                            >
                                                Print {sale.payment_status === 'paid' ? 'Receipt' : 'Invoice'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div >
    );
}

export default Sales;
