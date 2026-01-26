import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
import LabProcedures from "./LabProcedures";
import InventoryRequestModal from "../../components/InventoryRequestModal";
import { listExternalLabOrders, type ExternalLabOrder } from "../../middleware/data";
import logo from "../../assets/aquadent_logo.png";

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
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  // Fetch orders using useQuery
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['externalLabOrders'],
    queryFn: listExternalLabOrders,
  });

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
        queryClient.invalidateQueries({ queryKey: ['externalLabOrders'] });
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

  // Print Invoice function (for formal records/insurance)
  const printInvoice = (order: ExternalLabOrder) => {
    const invoiceWindow = window.open("", "_blank");
    if (!invoiceWindow) {
      alert("Please allow pop-ups to print invoices");
      return;
    }

    const now = new Date();
    const printDate = now.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
    const printTime = now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
    const voucherNo = `INV-${order.id.slice(0, 8).toUpperCase()}`;

    // Build item rows
    const itemRows = (order.items || []).map((item, idx) => {
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.product}</td>
          <td>${item.material}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td>${item.specs || "-"}</td>
        </tr>
      `;
    }).join("");

    const totalAmount = order.quote?.total ?? order.lab_cost ?? 0;

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${voucherNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px;
            padding: 20px; 
            max-width: 800px; 
            margin: 0 auto;
            color: #000;
          }
          .header { 
            display: flex;
            align-items: center;
            margin-bottom: 15px; 
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
          }
          .logo { 
            width: 60px; 
            height: 60px; 
            margin-right: 15px;
          }
          .header-text { flex: 1; text-align: center; }
          .company-name { font-size: 18px; font-weight: bold; }
          .company-info { font-size: 11px; line-height: 1.4; }
          .invoice-title { 
            text-align: center; 
            font-size: 14px; 
            font-weight: bold; 
            margin: 15px 0;
            text-decoration: underline;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 5px;
            margin-bottom: 15px;
          }
          .info-row { display: flex; }
          .info-label { width: 120px; font-weight: bold; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
            font-size: 11px;
          }
          th, td { border: 1px solid #000; padding: 4px 6px; }
          th { background: #f0f0f0; font-weight: bold; }
          .totals { margin-top: 10px; }
          .totals-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 3px 0;
            border-bottom: 1px dotted #ccc;
          }
          .totals-row.final { 
            font-weight: bold; 
            border-bottom: 2px solid #000;
            border-top: 1px solid #000;
            padding: 5px 0;
          }
          .signature { margin-top: 30px; }
          .no-print { margin-top: 20px; text-align: center; }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.08;
            z-index: -1;
          }
          .watermark img { width: 300px; height: 300px; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          <img src="${logo}" alt="Watermark" />
        </div>
        <div class="header">
          <img class="logo" src="${logo}" alt="Logo" />
          <div class="header-text">
            <div class="company-name">Aquadent Dental Clinic, Eldoret</div>
            <div class="company-info">
              P.O. Box 1234, Eldoret. Telephone: 053-2030000, 0722-000000<br>
              Mobile: 0722 000000, 0733 000000 Fax: 053-2030001<br>
              E-mail: info@aquadent.co.ke
            </div>
          </div>
        </div>

        <div class="invoice-title">EXTERNAL LAB INVOICE</div>

        <div class="info-grid">
          <div>
            <div class="info-row"><span class="info-label">Print Date:</span> <span>${printDate} ${printTime}</span></div>
            <div class="info-row"><span class="info-label">Invoice No.:</span> <span>${voucherNo}</span></div>
            <div class="info-row"><span class="info-label">Doctor:</span> <span>${order.doctor_name?.toUpperCase()}</span></div>
            <div class="info-row"><span class="info-label">Institution:</span> <span>${order.institution}</span></div>
          </div>
          <div>
            <div class="info-row"><span class="info-label">Expected Date:</span> <span>${order.expected_date || "TBD"}</span></div>
            <div class="info-row"><span class="info-label">Shipping:</span> <span>${order.shipping_method || "Courier"}</span></div>
            <div class="info-row"><span class="info-label">Status:</span> <span>${order.status?.toUpperCase()}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Product</th>
              <th>Material</th>
              <th>Qty</th>
              <th>Specifications</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || `<tr><td colspan="5" style="text-align: center;">No items</td></tr>`}
          </tbody>
        </table>

        ${order.lab_procedures ? `
          <div style="margin-bottom: 15px;">
            <strong>Lab Procedures:</strong><br>
            ${order.lab_procedures}
          </div>
        ` : ""}

        ${order.notes ? `
          <div style="margin-bottom: 15px;">
            <strong>Notes:</strong><br>
            ${order.notes}
          </div>
        ` : ""}

        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>Ksh ${(order.quote?.subtotal ?? order.lab_cost ?? 0).toLocaleString()}</span></div>
          <div class="totals-row"><span>Tax</span><span>Ksh ${(order.quote?.tax ?? 0).toLocaleString()}</span></div>
          <div class="totals-row final"><span>Total Amount</span><span>Ksh ${totalAmount.toLocaleString()}</span></div>
        </div>

        <div class="signature">
          <p>Authorized by: ___________________</p>
          <p style="margin-top: 10px;">Date: ___________________</p>
        </div>

        <div class="no-print">
          <button onclick="window.print()" style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 25px;
            font-size: 14px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
          ">🖨️ Print Invoice</button>
          <button onclick="window.close()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 10px 25px;
            font-size: 14px;
            border-radius: 5px;
            cursor: pointer;
          ">Close</button>
        </div>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
  };

  // Print Receipt function (for cash payments/quick receipts)
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

    const invoiceNumber = `RCP-${order.id.slice(0, 8).toUpperCase()}`;
    const totalAmount = order.quote?.total ?? order.lab_cost ?? 0;

    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${item.product}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${item.material}</td>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
      </tr>
    `).join("");

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            padding: 0;
            margin: 0;
            background: #f5f5f5;
            color: #1a1a1a;
            line-height: 1.3;
            font-size: 11px;
          }
          .receipt-container {
            max-width: 600px;
            margin: 10px auto;
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 15px 20px;
            position: relative;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-icon {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .brand-text h1 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .brand-text p {
            font-size: 10px;
            opacity: 0.9;
          }
          .receipt-badge {
            background: rgba(255,255,255,0.2);
            padding: 6px 12px;
            border-radius: 6px;
            text-align: right;
          }
          .receipt-badge .label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
          }
          .receipt-badge .number {
            font-size: 12px;
            font-weight: 700;
          }
          .content { padding: 20px; }
          .info-grid {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          .info-card {
            flex: 1;
            background: #fafafa;
            padding: 10px;
            border-radius: 6px;
            border-left: 3px solid #2563eb;
          }
          .info-card h3 {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .info-card .name {
            font-size: 13px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 2px;
          }
          .info-card .detail {
            font-size: 11px;
            color: #666;
          }
          .section { margin-bottom: 15px; }
          .section-title {
            font-size: 10px;
            font-weight: 700;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #2563eb;
            display: inline-block;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
          }
          th {
            background: #2563eb;
            color: white;
            padding: 8px 10px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
          }
          th:first-child { border-radius: 6px 0 0 0; }
          th:last-child { border-radius: 0 6px 0 0; }
          td { padding: 8px 10px; font-size: 11px; }
          .total-box {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-box .label { font-size: 14px; font-weight: 600; }
          .total-box .amount { font-size: 24px; font-weight: 800; }
          .footer {
            background: #1a1a1a;
            color: white;
            padding: 15px 20px;
            text-align: center;
          }
          .footer p { font-size: 10px; margin-bottom: 3px; }
          .footer .tagline { color: #2563eb; font-weight: 600; font-size: 11px; margin-bottom: 5px; }
          .no-print {
            text-align: center;
            padding: 15px;
            background: #f5f5f5;
          }
          .btn {
            display: inline-block;
            padding: 10px 20px;
            font-size: 12px;
            font-weight: 600;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin: 0 5px;
          }
          .btn-primary { background: #2563eb; color: white; }
          .btn-secondary { background: #e5e5e5; color: #333; }
          @media print {
            body { background: white; padding: 0; }
            .receipt-container { box-shadow: none; margin: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="header-content">
              <div class="brand">
                <div class="brand-icon">
                  <img src="${logo}" alt="Aquadent" style="width: 100%; height: 100%; object-fit: contain; padding: 3px;" />
                </div>
                <div class="brand-text">
                  <h1>Aquadent Dental Lab</h1>
                  <p>External Laboratory Services</p>
                </div>
              </div>
              <div class="receipt-badge">
                <div class="label">Receipt</div>
                <div class="number">${invoiceNumber}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="info-grid">
              <div class="info-card">
                <h3>Client</h3>
                <div class="name">${order.doctor_name}</div>
                <div class="detail">${order.institution}</div>
              </div>
              <div class="info-card" style="text-align: right; border-left: none; border-right: 3px solid #2563eb;">
                <h3>Details</h3>
                <div class="name">${receiptDate}</div>
                <div class="detail">${order.shipping_method || "Courier"}</div>
              </div>
            </div>

            ${(order.items || []).length > 0 ? `
              <div class="section">
                <div class="section-title">Order Items</div>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Material</th>
                      <th style="text-align: center;">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>
            ` : ""}

            ${order.lab_procedures ? `
              <div class="section">
                <div class="section-title">Lab Procedures</div>
                <div style="background: #f0f7ff; padding: 10px; border-radius: 6px; border: 1px solid #bfdbfe;">
                  ${order.lab_procedures}
                </div>
              </div>
            ` : ""}

            <div class="total-box">
              <span class="label">Total Amount</span>
              <span class="amount">Ksh ${totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p class="tagline">Thank you for choosing Aquadent Dental Lab!</p>
            <p>info@aquadent.co.ke • +254 700 000 000 • Eldoret, Kenya</p>
          </div>

          <div class="no-print">
            <button class="btn btn-primary" onclick="window.print()">🖨️ Print Receipt</button>
            <button class="btn btn-secondary" onclick="window.close()">Close</button>
          </div>
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
              onClick={() => refetch()}
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
                        <div className="flex gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => printReceipt(order)}
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                            title="Print Receipt"
                          >
                            🧾 Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => printInvoice(order)}
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Print Invoice"
                          >
                            📄 Invoice
                          </button>
                        </div>
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