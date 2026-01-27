import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
import LabProcedures from "./LabProcedures";
import InventoryRequestModal from "../../components/InventoryRequestModal";
import { listExternalLabOrders, type ExternalLabOrder } from "../../middleware/data";
import logo from "../../assets/aquadent_logo.png";

// ────────────────────────────────────────────────
// TYPES (kept minimal)
// ───────────────────────────────────────────────

type FormData = {
  doctorName: string;
  institution: string;
  expectedDate: string;
  shippingMethod: string;
  notes: string;
  lab_procedures: string;
  lab_cost: number;
};

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────

const DEFAULT_FORM_VALUES: FormData = {
  doctorName: "",
  institution: "",
  expectedDate: "",
  shippingMethod: "Courier",
  notes: "",
  lab_procedures: "",
  lab_cost: 0,
};

// ────────────────────────────────────────────────
// COMPONENT — UI ONLY
// ────────────────────────────────────────────────

export default function ExternalLabWorks() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showProcedures, setShowProcedures] = useState(false);

  // Fetch orders using useQuery
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['externalLabOrders'],
    queryFn: listExternalLabOrders,
  });

  const updateForm = (patch: Partial<FormData>) =>
    setForm(prev => ({ ...prev, ...patch }));

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
        quote: {
          subtotal: form.lab_cost, // Assuming lab_cost is subtotal for now
          tax: 0,
          total: form.lab_cost,
          status: "pending"
        },
        status: "draft",
        invoice_status: "Not Yet Paid",
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

  const handleStatusChange = async (orderId: string, newStatus: ExternalLabOrder["invoice_status"]) => {
    try {
      const { updateExternalLabOrder } = await import("../../middleware/data");
      const success = await updateExternalLabOrder(orderId, { invoice_status: newStatus });
      if (success) {
        refetch();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error updating status");
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
            height: 50px; 
            width: auto; 
            margin-right: 15px;
            object-fit: contain;
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
            gap: 20px;
            margin-bottom: 25px;
          }
          .info-row { display: flex; font-size: 12px; margin-bottom: 5px; }
          .info-label { width: 120px; font-weight: bold; color: #555; }
          .info-value { font-weight: 500; color: #000; }
          
          /* Table Styles - Blue Header Block */
          table { 
            width: 100%; 
            border-collapse: separate; 
            border-spacing: 0;
            margin: 20px 0; 
            font-size: 11px;
          }
          th { 
            background: #2563eb; 
            color: white; 
            padding: 10px 15px; 
            font-weight: 700; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
            text-align: left;
          }
          th:first-child { border-radius: 6px 0 0 0; }
          th:last-child { border-radius: 0 6px 0 0; text-align: center; }
          
          td { 
            padding: 10px 15px; 
            border-bottom: 1px solid #f0f0f0;
            font-size: 12px;
            color: #333;
          }
          tr:last-child td { border-bottom: none; }
          
          .section-title {
            color: #2563eb; 
            font-weight: 700; 
            font-size: 12px; 
            letter-spacing: 0.5px; 
            text-transform: uppercase; 
            padding-bottom: 4px; 
            border-bottom: 2px solid #2563eb; 
            display: inline-block;
            margin-bottom: 8px;
          }
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
            <div class="company-name">AQUADENT COMPANY LIMITED</div>
            <div class="company-info" style="font-weight: bold; margin-bottom: 5px;">Restore Your Smile</div>
            <div class="company-info">
              Sagaas Business Centre, 2nd Floor, Nandi Road<br>
              P.O. Box 6001-30100, Eldoret<br>
              Tel: 0708 315 325 / 0799 413 203<br>
              Email: info@aquadentclinic.co.ke | KRA PIN: P051625610X
            </div>
          </div>
        </div>

        </div>
        
        <div style="margin-top: 10px; margin-bottom: 20px;">
           <h2 class="invoice-title" style="margin: 0; text-align: left; border-bottom: none; text-decoration: none; color: #2563eb; font-size: 16px;">EXTERNAL LAB INVOICE</h2>
        </div>

        <div class="info-grid">
          <div>
            <div class="info-row"><span class="info-label">Print Date:</span> <span class="info-value">${printDate} ${printTime}</span></div>
            <div class="info-row"><span class="info-label">Invoice No.:</span> <span class="info-value">${voucherNo}</span></div>
            <div class="info-row"><span class="info-label">Doctor:</span> <span class="info-value">${order.doctor_name?.toUpperCase()}</span></div>
            <div class="info-row"><span class="info-label">Clinic:</span> <span class="info-value">${order.institution}</span></div>
          </div>
          <div>
            <div class="info-row"><span class="info-label">Expected Date:</span> <span class="info-value">${order.expected_date || "TBD"}</span></div>
            <div class="info-row"><span class="info-label">Shipping:</span> <span class="info-value">${order.shipping_method || "Courier"}</span></div>
            <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">${order.status?.toUpperCase()}</span></div>
          </div>
        </div>



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

        <div class="signature" style="display: flex; justify-content: space-between; align-items: center; margin-top: 50px; font-size: 11px;">
          <div>
            <span style="font-weight: bold;">Official Signature:</span> _______________________
          </div>
          <div>
            <span style="font-weight: bold;">S/No:</span> ${voucherNo}
          </div>
          <div>
            <span style="font-weight: bold;">Patient/Guardian Signature:</span> _______________________
          </div>
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
            display: flex;
            align-items: center;
          }
          .logo {
            height: 45px;
            width: auto;
            margin-right: 15px;
            object-fit: contain;
          }
          .header-text {
            flex: 1;
            text-align: center;
            padding-right: 45px; /* Offset logo width to keep text centered */
          }
          .company-name {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .company-info {
            font-size: 10px;
            opacity: 0.9;
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
          .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-top: 30px;
            padding: 0 5px;
            font-size: 10px;
            color: #1a1a1a;
          }
          .sig-line {
            border-bottom: 1px solid #1a1a1a;
            width: 120px;
            display: inline-block;
            margin-left: 5px;
          }
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
            <img class="logo" src="${logo}" alt="Logo" />
            <div class="header-text">
              <div class="company-name">AQUADENT COMPANY LIMITED</div>
              <div class="company-info" style="font-weight: bold; margin-bottom: 5px;">Restore Your Smile</div>
              <div class="company-info">
                Sagaas Business Centre, 2nd Floor, Nandi Road<br>
                P.O. Box 6001-30100, Eldoret<br>
                Tel: 0708 315 325 / 0799 413 203<br>
                Email: info@aquadentclinic.co.ke | KRA PIN: P051625610X
              </div>
            </div>
          </div>

          <div class="content">
            <div class="info-grid" style="margin-top: 20px; border-bottom: none; padding-bottom: 0;">
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

          <div class="signature-section">
            <div>Official Signature: <span class="sig-line"></span></div>
            <div>S/No: ${invoiceNumber}</div>
            <div>Patient/Guardian Signature: <span class="sig-line"></span></div>
          </div>

          <div class="footer">
            <p class="tagline">Thank you for choosing Aquadent Dental Clinic!</p>
            <p>Sagaas Business Centre, 2nd Floor, Nandi Road | P.O. Box 6001-30100, Eldoret</p>
            <p>Tel: 0708 315 325 / 0799 413 203 | Email: info@aquadentclinic.co.ke</p>
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
              <label className="text-sm text-gray-600">Clinic</label>
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



          {/* Lab Procedures & Notes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-700">Lab Procedures</h3>
              <button
                type="button"
                onClick={() => setShowProcedures(!showProcedures)}
                className={`text-xs px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-2 ${showProcedures
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
              >
                {showProcedures ? "✕ Close Procedures" : "＋ Add Procedures"}
              </button>
            </div>

            {showProcedures && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <LabProcedures
                  onSelect={name =>
                    updateForm({
                      lab_procedures: form.lab_procedures
                        ? `${form.lab_procedures}, ${name} `
                        : name,
                    })
                  }
                  onTotalChange={handleTotalChange}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1">
                  Calculated Lab Cost
                </label>
                <div className="border bg-gray-50 rounded px-4 py-2.5 font-medium text-slate-700">
                  Ksh {form.lab_cost.toLocaleString()}
                </div>
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
              className={`px - 8 py - 3 rounded - lg font - medium transition - colors text - white ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                } `}
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
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Clinic</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Expected Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Lab Procedures</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Lab Cost</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Order Status</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Invoice Status</th>
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
                      <td className="px-4 py-3 text-center">
                        <select
                          value={order.invoice_status || "Not Yet Paid"}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                          className={`text-xs font-semibold rounded px-2 py-1 border focus:ring-2 focus:ring-blue-500 cursor-pointer ${order.invoice_status === "Paid" ? "bg-green-100 text-green-700 border-green-200" :
                            order.invoice_status === "Paid Less" ? "bg-amber-100 text-amber-700 border-amber-200" :
                              order.invoice_status === "Disputed" ? "bg-red-100 text-red-700 border-red-200" :
                                "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Paid Less">Paid Less</option>
                          <option value="Disputed">Disputed</option>
                          <option value="Not Yet Paid">Not Yet Paid</option>
                        </select>
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