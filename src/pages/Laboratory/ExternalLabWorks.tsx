import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
import LabProcedures from "./LabProcedures";
import InventoryRequestModal from "../../components/InventoryRequestModal";
import { listExternalLabOrders, type ExternalLabOrder } from "../../middleware/data";

// ────────────────────────────────────────────────
// TYPES (kept minimal)
// ────────────────────────────────────────────────

type OrderItem = {
  product: string;
  material: string;
  quantity: number;
  specs: string;
};

type FormData = {
  doctorName: string;
  institution: string;
  expectedDate: string;
  shippingMethod: string;
  notes: string;
  lab_procedures: string;
  lab_cost: number;
  items: OrderItem[];
};

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────

const PRICE_BOOK: Record<string, number> = {
  "Zirconia Crown": 140,
  "Porcelain-Fused Bridge": 210,
  "Complete Denture": 260,
  "Implant Abutment": 190,
  "Clear Aligner Set": 320,
};

const MATERIAL_MULTIPLIER: Record<string, number> = {
  Zirconia: 1.25,
  PMMA: 0.9,
  Titanium: 1.4,
  Composite: 1.0,
  Gold: 1.8,
};

const DEFAULT_FORM_VALUES: FormData = {
  doctorName: "",
  institution: "",
  expectedDate: "",
  shippingMethod: "Courier",
  notes: "",
  lab_procedures: "",
  lab_cost: 0,
  items: [{
    product: "Zirconia Crown",
    material: "Zirconia",
    quantity: 1,
    specs: "",
  }],
};

// ────────────────────────────────────────────────
// COMPONENT — UI ONLY
// ────────────────────────────────────────────────

export default function ExternalLabWorks() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<ExternalLabOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await listExternalLabOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalUnits = useMemo(
    () => form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [form.items]
  );

  const updateForm = (patch: Partial<FormData>) =>
    setForm(prev => ({ ...prev, ...patch }));

  const updateItem = (index: number, patch: Partial<OrderItem>) =>
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));

  const addItem = () =>
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: "Implant Abutment",
          material: "Titanium",
          quantity: 1,
          specs: "",
        },
      ],
    }));

  const loadSample = () => {
    setForm({
      doctorName: "Dr. Aurora Finch",
      institution: "Starlight Dental Institute",
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      shippingMethod: "Courier",
      notes: "Theme: celestial aesthetics. Request subtle opalescence on anterior units.",
      lab_procedures: "",
      lab_cost: 0,
      items: [
        { product: "Zirconia Crown", material: "Zirconia", quantity: 2, specs: "Shade A2, high translucency" },
        { product: "Porcelain-Fused Bridge", material: "Composite", quantity: 1, specs: "3-unit bridge, canine guidance" },
        { product: "Clear Aligner Set", material: "PMMA", quantity: 1, specs: "Stages 1–4" },
      ],
    });
  };

  const handleTotalChange = useCallback((total: number) => {
    setForm(prev => {
      if (prev.lab_cost === total) return prev;
      return { ...prev, lab_cost: total };
    });
  }, []);

  const generateUUID = () => {
    // Simple UUID generator for browser environments
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSubmit = async () => {
    if (!form.doctorName || !form.institution) {
      alert("Please fill in Doctor Name and Institution");
      return;
    }

    setIsSubmitting(true);
    try {

      const orderInput: import("../../middleware/data").ExternalLabOrderInput = {
        id: generateUUID(),
        doctor_name: form.doctorName,
        institution: form.institution,
        expected_date: form.expectedDate || undefined,
        shipping_method: form.shippingMethod,
        notes: form.notes,
        lab_procedures: form.lab_procedures,
        lab_cost: form.lab_cost,
        items: form.items,
        quote: {
          subtotal: form.lab_cost, // Assuming lab_cost is subtotal for now
          tax: 0,
          total: form.lab_cost,
          status: "pending"
        },
        status: "draft",
      };

      const { createExternalLabOrder } = await import("../../middleware/data");
      const result = await createExternalLabOrder(orderInput);

      if (result) {
        alert("Order submitted successfully!");
        setForm(DEFAULT_FORM_VALUES);
        fetchOrders(); // Refresh the orders table
      } else {
        alert("Failed to submit order. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("An error occurred while submitting the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const printReceipt = (order: ExternalLabOrder) => {
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) {
      alert("Please allow pop-ups to print receipts");
      return;
    }

    const receiptDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString("en-KE", {
        year: "numeric", month: "long", day: "numeric"
      })
      : new Date().toLocaleDateString("en-KE", {
        year: "numeric", month: "long", day: "numeric"
      });

    const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;

    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.material}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.specs || "-"}</td>
      </tr>
    `).join("");

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 5px;
          }
          .subtitle { color: #666; font-size: 14px; }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
          }
          .invoice-info div { line-height: 1.8; }
          .label { color: #666; font-size: 12px; text-transform: uppercase; }
          .value { font-weight: 600; color: #333; }
          .section-title { 
            font-size: 14px; 
            font-weight: 600; 
            color: #2563eb;
            margin: 25px 0 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { 
            background: #2563eb; 
            color: white; 
            padding: 12px 8px; 
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
          }
          td { padding: 10px 8px; border-bottom: 1px solid #eee; }
          .procedures {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .total-section {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .total-row.grand {
            font-size: 24px;
            font-weight: bold;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.3);
            margin-top: 15px;
            margin-bottom: 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
          }
          .notes {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-top: 20px;
            border-radius: 0 8px 8px 0;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🦷 Aquadent Lab</div>
          <div class="subtitle">External Laboratory Services</div>
        </div>

        <div class="invoice-info">
          <div>
            <div class="label">Invoice Number</div>
            <div class="value">${invoiceNumber}</div>
            <div class="label" style="margin-top: 15px;">Date</div>
            <div class="value">${receiptDate}</div>
          </div>
          <div style="text-align: right;">
            <div class="label">Bill To</div>
            <div class="value">${order.doctor_name}</div>
            <div class="value">${order.institution}</div>
            <div class="label" style="margin-top: 15px;">Expected Delivery</div>
            <div class="value">${order.expected_date || "To be confirmed"}</div>
          </div>
        </div>

        ${(order.items || []).length > 0 ? `
          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Material</th>
                <th style="text-align: center;">Qty</th>
                <th>Specifications</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        ` : ""}

        ${order.lab_procedures ? `
          <div class="section-title">Lab Procedures</div>
          <div class="procedures">${order.lab_procedures}</div>
        ` : ""}

        ${order.notes ? `
          <div class="notes">
            <strong>Notes:</strong> ${order.notes}
          </div>
        ` : ""}

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal</span>
            <span>Ksh ${(order.quote?.subtotal ?? order.lab_cost ?? 0).toLocaleString()}</span>
          </div>
          <div class="total-row">
            <span>Tax</span>
            <span>Ksh ${(order.quote?.tax ?? 0).toLocaleString()}</span>
          </div>
          <div class="total-row grand">
            <span>Total Amount</span>
            <span>Ksh ${(order.quote?.total ?? order.lab_cost ?? 0).toLocaleString()}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing Aquadent Lab!</p>
          <p style="margin-top: 5px;">For inquiries, contact us at info@aquadentlab.com</p>
          <p style="margin-top: 10px; color: #999;">Shipping Method: ${order.shipping_method || "Courier"} | Status: ${order.status}</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            margin-right: 10px;
          ">🖨️ Print Receipt</button>
          <button onclick="window.close()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
          ">Close</button>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="External Lab Works" />

      <Card>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Doctor Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.doctorName}
                onChange={e => updateForm({ doctorName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Institution</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.institution}
                onChange={e => updateForm({ institution: e.target.value })}
                required
              />
            </div>



            <div className="space-y-1">
              <label className="text-sm text-gray-600">Expected Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={form.expectedDate}
                onChange={e => updateForm({ expectedDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Shipping Method</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.shippingMethod}
                onChange={e => updateForm({ shippingMethod: e.target.value })}
              >
                <option>Courier</option>
                <option>Pickup</option>
                <option>Digital Impression</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="font-medium flex items-center justify-between">
              <span>Items</span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  + Add Item
                </button>
                <button
                  type="button"
                  onClick={loadSample}
                  className="px-3 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded"
                >
                  Load Sample
                </button>
              </div>
            </div>

            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg bg-gray-50/40"
              >
                <div className="md:col-span-4">
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={item.product}
                    onChange={e => updateItem(index, { product: e.target.value })}
                  >
                    {Object.keys(PRICE_BOOK).map(p => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={item.material}
                    onChange={e => updateItem(index, { material: e.target.value })}
                  >
                    {Object.keys(MATERIAL_MULTIPLIER).map(m => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <input
                    type="number"
                    min={1}
                    className="w-full border rounded px-3 py-2"
                    value={item.quantity}
                    onChange={e => updateItem(index, { quantity: Number(e.target.value) || 1 })}
                  />
                </div>

                <div className="md:col-span-3">
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Specifications / Shade / etc."
                    value={item.specs}
                    onChange={e => updateItem(index, { specs: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Lab Procedures & Notes */}
          <div className="space-y-4">
            <LabProcedures
              onSelect={name =>
                updateForm({
                  lab_procedures: form.lab_procedures
                    ? `${form.lab_procedures}, ${name}`
                    : name,
                })
              }
              onTotalChange={handleTotalChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1">
                  Calculated Lab Cost
                </label>
                <div className="border bg-gray-50 rounded px-4 py-2.5 font-medium text-slate-700">
                  Ksh {form.lab_cost.toLocaleString()}
                </div>
              </div>

              <div className="text-sm flex items-end">
                Total units: <strong className="ml-1">{totalUnits}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">
                Lab Procedures
              </label>
              <textarea
                value={form.lab_procedures}
                onChange={e => updateForm({ lab_procedures: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm min-h-[80px]"
                placeholder="Selected procedures will appear here..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">
                Additional Notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => updateForm({ notes: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm min-h-[100px]"
                placeholder="Any special instructions..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowInventoryModal(true)}
              className="px-6 py-3 rounded-lg font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              Request Materials
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg font-medium transition-colors text-white ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {isSubmitting ? "Submitting..." : "Generate Quote & Submit"}
            </button>
          </div>
        </form>

        {/* Inventory Request Modal */}
        <InventoryRequestModal
          isOpen={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
          source="external_lab"
          patientName={form.doctorName || undefined}
          sourceReference={form.institution || undefined}
        />
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">External Lab Orders</h2>
            <button
              type="button"
              onClick={fetchOrders}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Doctor</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Institution</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Expected Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Lab Procedures</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Lab Cost</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{order.doctor_name}</td>
                      <td className="px-4 py-3">{order.institution}</td>
                      <td className="px-4 py-3">{order.expected_date || "-"}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={order.lab_procedures || ""}>
                        {order.lab_procedures || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        Ksh {(order.lab_cost ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${order.status === "completed" ? "bg-green-100 text-green-700" :
                          order.status === "inProduction" ? "bg-blue-100 text-blue-700" :
                            order.status === "accepted" ? "bg-purple-100 text-purple-700" :
                              order.status === "declined" ? "bg-red-100 text-red-700" :
                                order.status === "submitted" ? "bg-yellow-100 text-yellow-700" :
                                  "bg-gray-100 text-gray-700"
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => printReceipt(order)}
                          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                          title="Print Receipt"
                        >
                          🖨️ Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}