import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader";

import {
  listOpticalPatients,
  createOpticalPatient,
  updateOpticalPatient,
  type OpticalPatient,
  type OpticalPatientInput,
  type InstallmentPayment,
  type OpticalStatus,
} from "../middleware/data";

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────

const LENS_TYPES = [
  "Single Vision",
  "Bifocal",
  "Progressive",
  "Photochromic",
  "Computer/Blue Light",
  "Reading",
];

const LENS_COATINGS = [
  "Anti-Reflective",
  "Scratch Resistant",
  "UV Protection",
  "Blue Light Filter",
  "Hydrophobic",
  "None",
];

const STATUS_COLORS: Record<OpticalStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  collected: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-800",
};

// ────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────

export default function Optical() {
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['optical'],
    queryFn: listOpticalPatients,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<OpticalPatient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState<OpticalPatientInput>({
    name: "",
    gender: "M",
    age: undefined,
    contacts: "",
    residence: "",
    prescription_od: {},
    prescription_os: {},
    pd: "",
    frame_brand: "",
    frame_model: "",
    frame_color: "",
    frame_price: 0,
    lens_type: "Single Vision",
    lens_coating: "Anti-Reflective",
    lens_price: 0,
    notes: "",
  });

  // Payment state for edit modal
  const [paymentData, setPaymentData] = useState({
    insurance_amount: 0,
    cash_amount: 0,
  });
  const [localInstallments, setLocalInstallments] = useState<InstallmentPayment[]>([]);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [newInstallment, setNewInstallment] = useState({
    amount: 0,
    payment_method: "Cash" as const,
    receipt_no: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // ────────────────────────────────────────────────
  // DATA FETCHING
  // ────────────────────────────────────────────────

  // ────────────────────────────────────────────────
  // DATA FETCHING (Managed by useQuery above)
  // ────────────────────────────────────────────────

  // ────────────────────────────────────────────────
  // COMPUTED VALUES
  // ────────────────────────────────────────────────

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.contacts?.includes(q) ||
        p.frame_brand?.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const stats = useMemo(() => {
    let totalExpected = 0;
    let totalPaid = 0;
    let cashRevenue = 0;
    let insuranceRevenue = 0;

    patients.forEach((p) => {
      const total = (p.frame_price || 0) + (p.lens_price || 0);
      const instTotal = (p.installments || []).reduce((sum, inst) => sum + (inst.amount || 0), 0);
      const paid =
        (p.insurance_amount || 0) +
        (p.cash_amount || 0) +
        instTotal;

      totalExpected += total;
      totalPaid += paid;
      cashRevenue += (p.cash_amount || 0) + instTotal;
      insuranceRevenue += (p.insurance_amount || 0);
    });

    return {
      totalOrders: patients.length,
      revenue: totalExpected,
      paid: totalPaid,
      balance: totalExpected - totalPaid,
      cashRevenue,
      insuranceRevenue,
    };
  }, [patients]);

  // ────────────────────────────────────────────────
  // HANDLERS
  // ────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "M",
      age: undefined,
      contacts: "",
      residence: "",
      prescription_od: {},
      prescription_os: {},
      pd: "",
      frame_brand: "",
      frame_model: "",
      frame_color: "",
      frame_price: 0,
      lens_type: "Single Vision",
      lens_coating: "Anti-Reflective",
      lens_price: 0,
      notes: "",
    });
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter patient name");
      return;
    }

    setIsSaving(true);
    try {
      const result = await createOpticalPatient(formData);
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['optical'] });
        setShowForm(false);
        resetForm();
      } else {
        alert("Failed to create patient");
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("Error creating patient");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (patient: OpticalPatient) => {
    setEditingPatient(patient);
    setPaymentData({
      insurance_amount: patient.insurance_amount || 0,
      cash_amount: patient.cash_amount || 0,
    });
    setLocalInstallments(patient.installments || []);
  };

  const calculateInstallmentsTotal = (installments: InstallmentPayment[]) => {
    return installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
  };

  const calculateBalance = (patient: OpticalPatient, payData = paymentData, installs = localInstallments) => {
    const total = (patient.frame_price || 0) + (patient.lens_price || 0);
    const paid = payData.insurance_amount + payData.cash_amount + calculateInstallmentsTotal(installs);
    return total - paid;
  };

  const handleAddInstallment = () => {
    if (newInstallment.amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const installment: InstallmentPayment = {
      id: crypto.randomUUID ? crypto.randomUUID() : `inst-${Date.now()}`,
      amount: newInstallment.amount,
      paid_at: new Date().toISOString(),
      payment_method: newInstallment.payment_method,
      receipt_no: newInstallment.receipt_no || undefined,
      notes: newInstallment.notes || undefined,
    };

    setLocalInstallments((prev) => [...prev, installment]);
    setNewInstallment({ amount: 0, payment_method: "Cash", receipt_no: "", notes: "" });
    setShowInstallmentModal(false);
  };

  const handleSavePayment = async () => {
    if (!editingPatient) return;

    setIsSaving(true);
    try {
      const balance = calculateBalance(editingPatient);
      const isFirstPayment = !editingPatient.price_locked &&
        (paymentData.insurance_amount > 0 || paymentData.cash_amount > 0 || localInstallments.length > 0);

      const updates: Partial<OpticalPatient> = {
        insurance_amount: paymentData.insurance_amount,
        cash_amount: paymentData.cash_amount,
        installments: localInstallments,
        balance,
        ...(isFirstPayment ? {
          price_locked: true,
          price_locked_at: new Date().toISOString(),
          price_locked_by: "Optical",
        } : {}),
      };

      const success = await updateOpticalPatient(editingPatient.id, updates);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['optical'] });
        setEditingPatient(null);
      } else {
        alert("Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (patient: OpticalPatient, newStatus: OpticalStatus) => {
    try {
      const success = await updateOpticalPatient(patient.id, { status: newStatus });
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['optical'] });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // ────────────────────────────────────────────────
  // PRINT INVOICE
  // ────────────────────────────────────────────────

  const printInvoice = (patient: OpticalPatient) => {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups");
      return;
    }

    const invoiceNo = `OPT-${patient.id.slice(0, 8).toUpperCase()}`;
    const date = new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
    const total = (patient.frame_price || 0) + (patient.lens_price || 0);
    const instTotal = calculateInstallmentsTotal(patient.installments || []);
    const balance = total - (patient.insurance_amount || 0) - (patient.cash_amount || 0) - instTotal;

    const rxOD = patient.prescription_od || {};
    const rxOS = patient.prescription_os || {};

    const html = `<!DOCTYPE html><html><head><title>Invoice ${invoiceNo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#333}
.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #2563eb;padding-bottom:20px}
.logo{font-size:28px;font-weight:bold;color:#2563eb}
.subtitle{color:#666;font-size:14px}
.info-grid{display:flex;justify-content:space-between;margin-bottom:30px;background:#f8fafc;padding:20px;border-radius:8px}
.label{color:#666;font-size:12px;text-transform:uppercase}
.value{font-weight:600}
.section{margin:25px 0}
.section-title{font-size:14px;font-weight:600;color:#2563eb;margin-bottom:15px;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
th{background:#2563eb;color:white;padding:12px 8px;text-align:left;font-size:12px}
td{padding:10px 8px;border-bottom:1px solid #eee}
.rx-table th{background:#f1f5f9;color:#333}
.total-section{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:25px;border-radius:8px;margin-top:30px}
.total-row{display:flex;justify-content:space-between;margin-bottom:10px}
.total-row.grand{font-size:24px;font-weight:bold;border-top:1px solid rgba(255,255,255,0.3);padding-top:15px;margin-top:15px}
.balance-box{text-align:center;padding:20px;border-radius:8px;margin-top:20px;
  background:${balance > 0 ? '#fef2f2' : '#f0fdf4'};
  border:2px solid ${balance > 0 ? '#ef4444' : '#22c55e'}}
.balance-label{font-size:14px;color:${balance > 0 ? '#dc2626' : '#16a34a'}}
.balance-amount{font-size:28px;font-weight:bold;color:${balance > 0 ? '#dc2626' : '#16a34a'}}
.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#666;font-size:12px}
@media print{.no-print{display:none}}
</style></head><body>
<div class="header">
  <div class="logo">👓 Aquadent Optical</div>
  <div class="subtitle">Eye Care Services</div>
</div>
<div class="info-grid">
  <div>
    <div class="label">Invoice #</div>
    <div class="value">${invoiceNo}</div>
    <div class="label" style="margin-top:15px">Date</div>
    <div class="value">${date}</div>
  </div>
  <div style="text-align:right">
    <div class="label">Patient</div>
    <div class="value">${patient.name}</div>
    <div style="color:#666">${patient.contacts || ''}</div>
    <div class="label" style="margin-top:15px">Status</div>
    <div class="value">${patient.status}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Prescription</div>
  <table class="rx-table">
    <tr><th></th><th>SPH</th><th>CYL</th><th>AXIS</th><th>ADD</th><th>VA</th></tr>
    <tr><td><strong>OD (Right)</strong></td>
      <td>${rxOD.sphere || '-'}</td><td>${rxOD.cylinder || '-'}</td>
      <td>${rxOD.axis || '-'}</td><td>${rxOD.add || '-'}</td><td>${rxOD.va || '-'}</td></tr>
    <tr><td><strong>OS (Left)</strong></td>
      <td>${rxOS.sphere || '-'}</td><td>${rxOS.cylinder || '-'}</td>
      <td>${rxOS.axis || '-'}</td><td>${rxOS.add || '-'}</td><td>${rxOS.va || '-'}</td></tr>
  </table>
  <p style="margin-top:10px"><strong>PD:</strong> ${patient.pd || '-'}</p>
</div>

<div class="section">
  <div class="section-title">Order Details</div>
  <table>
    <tr><th>Item</th><th>Description</th><th style="text-align:right">Price</th></tr>
    <tr><td>Frame</td><td>${patient.frame_brand || ''} ${patient.frame_model || ''} ${patient.frame_color ? `(${patient.frame_color})` : ''}</td>
      <td style="text-align:right">Ksh ${(patient.frame_price || 0).toLocaleString()}</td></tr>
    <tr><td>Lens</td><td>${patient.lens_type || ''} ${patient.lens_coating ? `- ${patient.lens_coating}` : ''}</td>
      <td style="text-align:right">Ksh ${(patient.lens_price || 0).toLocaleString()}</td></tr>
    <tr style="background:#f8fafc"><td colspan="2"><strong>Total</strong></td>
      <td style="text-align:right"><strong>Ksh ${total.toLocaleString()}</strong></td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">Payments</div>
  <table>
    <tr><td>Insurance</td><td style="text-align:right">Ksh ${(patient.insurance_amount || 0).toLocaleString()}</td></tr>
    <tr><td>Cash</td><td style="text-align:right">Ksh ${(patient.cash_amount || 0).toLocaleString()}</td></tr>
    ${instTotal > 0 ? `<tr><td>Installments (${(patient.installments || []).length})</td><td style="text-align:right">Ksh ${instTotal.toLocaleString()}</td></tr>` : ''}
    <tr style="background:#f8fafc"><td><strong>Total Paid</strong></td>
      <td style="text-align:right"><strong>Ksh ${((patient.insurance_amount || 0) + (patient.cash_amount || 0) + instTotal).toLocaleString()}</strong></td></tr>
  </table>
</div>

<div class="balance-box">
  <div class="balance-label">${balance > 0 ? 'BALANCE DUE' : balance < 0 ? 'OVERPAYMENT' : 'PAID IN FULL'}</div>
  <div class="balance-amount">Ksh ${Math.abs(balance).toLocaleString()}</div>
</div>

<div class="footer">
  <p>Thank you for choosing Aquadent Optical!</p>
  ${patient.notes ? `<p style="margin-top:10px;color:#666">Notes: ${patient.notes}</p>` : ''}
</div>

<div class="no-print" style="text-align:center;margin-top:30px">
  <button onclick="window.print()" style="background:#2563eb;color:white;border:none;padding:12px 30px;font-size:16px;border-radius:8px;cursor:pointer;margin-right:10px">🖨️ Print</button>
  <button onclick="window.close()" style="background:#6b7280;color:white;border:none;padding:12px 30px;font-size:16px;border-radius:8px;cursor:pointer">Close</button>
</div>
</body></html>`;

    w.document.write(html);
    w.document.close();
  };

  // ────────────────────────────────────────────────
  // PRINT RECEIPT (Quick/Modern Style)
  // ────────────────────────────────────────────────

  const printReceipt = (patient: OpticalPatient) => {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups");
      return;
    }

    const receiptNo = `RCP-${patient.id.slice(0, 8).toUpperCase()}`;
    const date = new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
    const total = (patient.frame_price || 0) + (patient.lens_price || 0);
    const instTotal = calculateInstallmentsTotal(patient.installments || []);
    const totalPaid = (patient.insurance_amount || 0) + (patient.cash_amount || 0) + instTotal;
    const balance = total - totalPaid;

    const html = `<!DOCTYPE html><html><head><title>Receipt ${receiptNo}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;padding:0;margin:0;background:#f5f5f5;color:#1a1a1a;font-size:11px}
.container{max-width:500px;margin:10px auto;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
.header{background:linear-gradient(135deg,#16a34a,#15803d);color:white;padding:15px 20px}
.header-content{display:flex;justify-content:space-between;align-items:center}
.brand h1{font-size:16px;font-weight:700}
.brand p{font-size:10px;opacity:0.9}
.badge{background:rgba(255,255,255,0.2);padding:6px 12px;border-radius:6px;text-align:right}
.badge .label{font-size:9px;text-transform:uppercase;opacity:0.8}
.badge .number{font-size:12px;font-weight:700}
.content{padding:20px}
.info-row{display:flex;justify-content:space-between;gap:15px;margin-bottom:15px;padding-bottom:15px;border-bottom:1px solid #eee}
.info-card{flex:1;background:#fafafa;padding:10px;border-radius:6px;border-left:3px solid #16a34a}
.info-card h3{font-size:9px;text-transform:uppercase;color:#888;margin-bottom:5px}
.info-card .name{font-size:13px;font-weight:700}
.info-card .detail{font-size:11px;color:#666}
.section{margin-bottom:15px}
.section-title{font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid #16a34a;display:inline-block;padding-bottom:4px}
.cost-card{background:#fafafa;border-radius:6px;border:1px solid #eee;overflow:hidden}
.cost-row{display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #eee}
.cost-row:last-child{border-bottom:none}
.cost-row.highlight{background:#16a34a;color:white;font-weight:700}
.balance-box{margin-top:15px;padding:15px;text-align:center;border-radius:8px;
  background:${balance > 0 ? '#fef2f2' : '#f0fdf4'};
  border:2px solid ${balance > 0 ? '#ef4444' : '#22c55e'}}
.balance-label{font-size:10px;font-weight:700;color:${balance > 0 ? '#dc2626' : '#16a34a'}}
.balance-amount{font-size:24px;font-weight:800;color:${balance > 0 ? '#dc2626' : '#16a34a'}}
.footer{background:#1a1a1a;color:white;padding:15px;text-align:center;font-size:10px}
.footer .tagline{color:#16a34a;font-weight:600;font-size:11px;margin-bottom:5px}
.no-print{padding:15px;text-align:center;background:#f5f5f5}
.btn{padding:10px 20px;margin:0 5px;border:none;border-radius:6px;cursor:pointer;font-weight:600}
.btn-primary{background:#16a34a;color:white}
.btn-secondary{background:#e5e5e5;color:#333}
@media print{body{background:white}.container{box-shadow:none;margin:0}.no-print{display:none!important}}
</style></head><body>
<div class="container">
  <div class="header">
    <div class="header-content">
      <div class="brand"><h1>👓 Aquadent Optical</h1><p>Eye Care Services</p></div>
      <div class="badge"><div class="label">Receipt</div><div class="number">${receiptNo}</div></div>
    </div>
  </div>
  <div class="content">
    <div class="info-row">
      <div class="info-card"><h3>Patient</h3><div class="name">${patient.name}</div><div class="detail">${patient.contacts || ''}</div></div>
      <div class="info-card" style="text-align:right;border-left:none;border-right:3px solid #16a34a"><h3>Date</h3><div class="name">${date}</div><div class="detail">${patient.status}</div></div>
    </div>

    <div class="section">
      <div class="section-title">Order Summary</div>
      <div class="cost-card">
        <div class="cost-row"><span>Frame: ${patient.frame_brand || ''} ${patient.frame_model || ''}</span><span>Ksh ${(patient.frame_price || 0).toLocaleString()}</span></div>
        <div class="cost-row"><span>Lens: ${patient.lens_type || ''}</span><span>Ksh ${(patient.lens_price || 0).toLocaleString()}</span></div>
        <div class="cost-row highlight"><span>TOTAL</span><span>Ksh ${total.toLocaleString()}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payments</div>
      <div class="cost-card">
        ${patient.insurance_amount ? `<div class="cost-row"><span>Insurance</span><span>Ksh ${patient.insurance_amount.toLocaleString()}</span></div>` : ''}
        ${patient.cash_amount ? `<div class="cost-row"><span>Cash</span><span>Ksh ${patient.cash_amount.toLocaleString()}</span></div>` : ''}
        ${instTotal > 0 ? `<div class="cost-row"><span>Installments (${(patient.installments || []).length})</span><span>Ksh ${instTotal.toLocaleString()}</span></div>` : ''}
        <div class="cost-row highlight"><span>TOTAL PAID</span><span>Ksh ${totalPaid.toLocaleString()}</span></div>
      </div>
    </div>

    <div class="balance-box">
      <div class="balance-label">${balance > 0 ? 'BALANCE DUE' : balance < 0 ? 'OVERPAYMENT' : '✓ PAID IN FULL'}</div>
      <div class="balance-amount">Ksh ${Math.abs(balance).toLocaleString()}</div>
    </div>
  </div>
  <div class="footer">
    <p class="tagline">Thank you for choosing Aquadent Optical!</p>
    <p>info@aquadent.co.ke • +254 700 000 000 • Eldoret, Kenya</p>
  </div>
  <div class="no-print">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print Receipt</button>
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
  </div>
</div>
</body></html>`;

    w.document.write(html);
    w.document.close();
  };

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Optical" action={{ label: "New Patient", onClick: () => setShowForm(true) }} />

      {/* Colorful KPI Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-2.5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">Total Revenue</div>
              <div className="text-lg font-bold">Ksh {stats.revenue.toLocaleString()}</div>
            </div>
            <div className="text-xl opacity-80">💰</div>
          </div>
          <div className="mt-1 text-[10px] opacity-75">Expected</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2.5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">Cash Revenue</div>
              <div className="text-lg font-bold">Ksh {stats.cashRevenue.toLocaleString()}</div>
            </div>
            <div className="text-xl opacity-80">💵</div>
          </div>
          <div className="mt-1 text-[10px] opacity-75">Cash + Installments</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-2.5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">Insurance</div>
              <div className="text-lg font-bold">Ksh {stats.insuranceRevenue.toLocaleString()}</div>
            </div>
            <div className="text-xl opacity-80">🏥</div>
          </div>
          <div className="mt-1 text-[10px] opacity-75">Insurance claims</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2.5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">Paid Amount</div>
              <div className="text-lg font-bold">Ksh {stats.paid.toLocaleString()}</div>
            </div>
            <div className="text-xl opacity-80">✅</div>
          </div>
          <div className="mt-1 text-[10px] opacity-75">Total collected</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-2.5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">Balance Due</div>
              <div className="text-lg font-bold">Ksh {stats.balance.toLocaleString()}</div>
            </div>
            <div className="text-xl opacity-80">⏳</div>
          </div>
          <div className="mt-1 text-[10px] opacity-75">Pending</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2.5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-90">Total Orders</div>
              <div className="text-lg font-bold">{stats.totalOrders}</div>
            </div>
            <div className="text-xl opacity-80">👓</div>
          </div>
          <div className="mt-1 text-[10px] opacity-75">Patients</div>
        </div>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Optical Patients</h2>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, contact, or frame..."
            className="border rounded-md px-3 py-2 text-sm w-64"
          />
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="p-3 font-medium text-gray-600">Patient</th>
                <th className="p-3 font-medium text-gray-600">Contacts</th>
                <th className="p-3 font-medium text-gray-600">Prescription</th>
                <th className="p-3 font-medium text-gray-600">Frame</th>
                <th className="p-3 font-medium text-gray-600">Lens</th>
                <th className="p-3 font-medium text-gray-600 text-right">Total</th>
                <th className="p-3 font-medium text-gray-600 text-right">Paid</th>
                <th className="p-3 font-medium text-gray-600 text-right">Balance</th>
                <th className="p-3 font-medium text-gray-600">Status</th>
                <th className="p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={10} className="p-4 text-center text-gray-500">Loading...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan={10} className="p-4 text-center text-gray-500">No patients found</td></tr>
              ) : (
                filteredPatients.map((p) => {
                  const total = (p.frame_price || 0) + (p.lens_price || 0);
                  const paid = (p.insurance_amount || 0) + (p.cash_amount || 0) + calculateInstallmentsTotal(p.installments || []);
                  const bal = total - paid;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-gray-500">{p.contacts || '-'}</td>
                      <td className="p-3 text-xs text-gray-500">
                        OD: {p.prescription_od?.sphere || '-'}/{p.prescription_od?.cylinder || '-'}<br />
                        OS: {p.prescription_os?.sphere || '-'}/{p.prescription_os?.cylinder || '-'}
                      </td>
                      <td className="p-3">{p.frame_brand || '-'} {p.frame_model || ''}</td>
                      <td className="p-3">{p.lens_type || '-'}</td>
                      <td className="p-3 text-right font-medium">{total.toLocaleString()}</td>
                      <td className="p-3 text-right text-green-600">{paid.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <span className={`font-semibold ${bal > 0 ? 'text-red-600' : bal < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {bal.toLocaleString()}
                        </span>
                        {p.price_locked && <span className="ml-1" title="Locked">🔒</span>}
                      </td>
                      <td className="p-3">
                        <select
                          value={p.status}
                          onChange={(e) => handleStatusChange(p, e.target.value as OpticalStatus)}
                          className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[p.status]}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="ready">Ready</option>
                          <option value="collected">Collected</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEditClick(p)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                            {p.price_locked ? 'View' : 'Pay'}
                          </button>
                          <button onClick={() => printReceipt(p)} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700" title="Print Receipt">
                            🧾
                          </button>
                          {(p.insurance_amount || 0) > 0 && (
                            <button onClick={() => printInvoice(p)} className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700" title="Print Invoice">
                              📄
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Patient Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreatePatient} className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">New Optical Patient</h3>

              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-20">
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value as "M" | "F" }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, age: parseInt(e.target.value) || undefined }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contacts</label>
                  <input
                    type="text"
                    value={formData.contacts}
                    onChange={(e) => setFormData((p) => ({ ...p, contacts: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* Prescription */}
              <div>
                <h4 className="font-medium mb-3">Prescription</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* OD */}
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="font-medium text-sm mb-2">OD (Right Eye)</div>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="SPH" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_od?.sphere || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_od: { ...p.prescription_od, sphere: e.target.value } }))} />
                      <input placeholder="CYL" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_od?.cylinder || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_od: { ...p.prescription_od, cylinder: e.target.value } }))} />
                      <input placeholder="AXIS" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_od?.axis || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_od: { ...p.prescription_od, axis: e.target.value } }))} />
                      <input placeholder="ADD" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_od?.add || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_od: { ...p.prescription_od, add: e.target.value } }))} />
                      <input placeholder="VA" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_od?.va || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_od: { ...p.prescription_od, va: e.target.value } }))} />
                    </div>
                  </div>
                  {/* OS */}
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="font-medium text-sm mb-2">OS (Left Eye)</div>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="SPH" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_os?.sphere || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_os: { ...p.prescription_os, sphere: e.target.value } }))} />
                      <input placeholder="CYL" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_os?.cylinder || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_os: { ...p.prescription_os, cylinder: e.target.value } }))} />
                      <input placeholder="AXIS" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_os?.axis || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_os: { ...p.prescription_os, axis: e.target.value } }))} />
                      <input placeholder="ADD" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_os?.add || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_os: { ...p.prescription_os, add: e.target.value } }))} />
                      <input placeholder="VA" className="border rounded px-2 py-1 text-sm"
                        value={formData.prescription_os?.va || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, prescription_os: { ...p.prescription_os, va: e.target.value } }))} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 w-32">
                  <label className="block text-sm font-medium mb-1">PD</label>
                  <input
                    value={formData.pd}
                    onChange={(e) => setFormData((p) => ({ ...p, pd: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., 63"
                  />
                </div>
              </div>

              {/* Frame & Lens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Frame</h4>
                  <input placeholder="Brand" className="w-full border rounded px-3 py-2"
                    value={formData.frame_brand}
                    onChange={(e) => setFormData((p) => ({ ...p, frame_brand: e.target.value }))} />
                  <input placeholder="Model" className="w-full border rounded px-3 py-2"
                    value={formData.frame_model}
                    onChange={(e) => setFormData((p) => ({ ...p, frame_model: e.target.value }))} />
                  <input placeholder="Color" className="w-full border rounded px-3 py-2"
                    value={formData.frame_color}
                    onChange={(e) => setFormData((p) => ({ ...p, frame_color: e.target.value }))} />
                  <div>
                    <label className="block text-sm font-medium mb-1">Frame Price (Ksh)</label>
                    <input type="number" className="w-full border rounded px-3 py-2"
                      value={formData.frame_price || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, frame_price: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Lens</h4>
                  <select className="w-full border rounded px-3 py-2"
                    value={formData.lens_type}
                    onChange={(e) => setFormData((p) => ({ ...p, lens_type: e.target.value }))}>
                    {LENS_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <select className="w-full border rounded px-3 py-2"
                    value={formData.lens_coating}
                    onChange={(e) => setFormData((p) => ({ ...p, lens_coating: e.target.value }))}>
                    {LENS_COATINGS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lens Price (Ksh)</label>
                    <input type="number" className="w-full border rounded px-3 py-2"
                      value={formData.lens_price || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, lens_price: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-700">Total Cost</span>
                  <span className="text-xl font-bold text-blue-800">
                    Ksh {((formData.frame_price || 0) + (formData.lens_price || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {isSaving ? "Saving..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Payment Details</h3>
                  <p className="text-sm text-gray-500">{editingPatient.name}</p>
                </div>
                {editingPatient.price_locked && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">🔒 Locked</span>
                )}
              </div>

              {/* Cost Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between"><span>Frame</span><span>Ksh {(editingPatient.frame_price || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Lens</span><span>Ksh {(editingPatient.lens_price || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span><span>Ksh {((editingPatient.frame_price || 0) + (editingPatient.lens_price || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Insurance Amount</label>
                  <input type="number" className={`w-full border rounded px-3 py-2 ${editingPatient.price_locked ? 'bg-gray-100' : ''}`}
                    value={paymentData.insurance_amount || ""}
                    onChange={(e) => setPaymentData((p) => ({ ...p, insurance_amount: parseFloat(e.target.value) || 0 }))}
                    disabled={editingPatient.price_locked} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cash Amount</label>
                  <input type="number" className={`w-full border rounded px-3 py-2 ${editingPatient.price_locked ? 'bg-gray-100' : ''}`}
                    value={paymentData.cash_amount || ""}
                    onChange={(e) => setPaymentData((p) => ({ ...p, cash_amount: parseFloat(e.target.value) || 0 }))}
                    disabled={editingPatient.price_locked} />
                </div>
              </div>

              {/* Installments */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Installments</h4>
                  <button type="button" onClick={() => setShowInstallmentModal(true)}
                    className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700">+ Add</button>
                </div>
                {localInstallments.length > 0 ? (
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Method</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr></thead>
                      <tbody>
                        {localInstallments.map((inst) => (
                          <tr key={inst.id} className="border-t">
                            <td className="px-3 py-2">{new Date(inst.paid_at).toLocaleDateString()}</td>
                            <td className="px-3 py-2">{inst.payment_method}</td>
                            <td className="px-3 py-2 text-right">{inst.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-purple-50">
                        <tr><td colSpan={2} className="px-3 py-2 font-medium">Total</td>
                          <td className="px-3 py-2 text-right font-bold">{calculateInstallmentsTotal(localInstallments).toLocaleString()}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">No installments</div>
                )}
              </div>

              {/* Balance */}
              <div className={`p-4 rounded-lg ${calculateBalance(editingPatient) > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Balance</span>
                  <span className={`text-xl font-bold ${calculateBalance(editingPatient) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Ksh {calculateBalance(editingPatient).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <button type="button" onClick={() => printInvoice(editingPatient)}
                  className="px-4 py-2 border rounded hover:bg-gray-50">🖨️ Print</button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditingPatient(null)}
                    className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                  <button type="button" onClick={handleSavePayment} disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Installment Modal */}
      {showInstallmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Add Installment</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Amount *</label>
              <input type="number" className="w-full border rounded px-3 py-2"
                value={newInstallment.amount || ""}
                onChange={(e) => setNewInstallment((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select className="w-full border rounded px-3 py-2"
                value={newInstallment.payment_method}
                onChange={(e) => setNewInstallment((p) => ({ ...p, payment_method: e.target.value as any }))}>
                <option value="Cash">Cash</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Card">Card</option>
                <option value="Insurance">Insurance</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Receipt #</label>
              <input className="w-full border rounded px-3 py-2"
                value={newInstallment.receipt_no}
                onChange={(e) => setNewInstallment((p) => ({ ...p, receipt_no: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowInstallmentModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleAddInstallment}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}