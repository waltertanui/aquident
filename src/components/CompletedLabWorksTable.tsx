
import React, { useState } from 'react';
import type { PatientRecord, InstallmentPayment } from '../middleware/data';
import { updateWalkin } from '../middleware/data';

interface CompletedLabWorksTableProps {
    patients: PatientRecord[];
    onUpdatePatient?: (patient: PatientRecord) => void;
}

interface EditFormData {
    clinic_cost: number;
    insurance_amount: number;
    cash_amount: number;
    to_come_again: boolean;
}

interface NewInstallment {
    amount: number;
    payment_method: "Cash" | "M-Pesa" | "Card" | "Insurance" | "Bank Transfer";
    receipt_no: string;
    notes: string;
}

const CompletedLabWorksTable: React.FC<CompletedLabWorksTableProps> = ({ patients, onUpdatePatient }) => {
    const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
    const [formData, setFormData] = useState<EditFormData>({
        clinic_cost: 0,
        insurance_amount: 0,
        cash_amount: 0,
        to_come_again: false
    });
    const [isSaving, setIsSaving] = useState(false);

    // Installment modal state
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [newInstallment, setNewInstallment] = useState<NewInstallment>({
        amount: 0,
        payment_method: "Cash",
        receipt_no: "",
        notes: ""
    });
    const [localInstallments, setLocalInstallments] = useState<InstallmentPayment[]>([]);

    const formatDOB = (dob?: string) => {
        if (!dob) return "—";
        const d = new Date(dob);
        if (isNaN(d.getTime())) return dob;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const getAge = (p: PatientRecord) => {
        if (p.dob) {
            const d = new Date(p.dob);
            if (!isNaN(d.getTime())) {
                const today = new Date();
                let age = today.getFullYear() - d.getFullYear();
                const m = today.getMonth() - d.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
                return age;
            }
        }
        return p.a;
    };

    const calculateInstallmentsTotal = (installments: InstallmentPayment[]) => {
        return installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
    };

    const calculateBalance = (p: PatientRecord) => {
        const labCost = p.lab_cost || 0;
        const clinicCost = p.clinic_cost || 0;
        const insurance = p.insurance_amount || 0;
        const cash = p.cash_amount || 0;
        const installmentsTotal = calculateInstallmentsTotal(p.installments || []);
        return (labCost + clinicCost) - insurance - cash - installmentsTotal;
    };

    const calculateFormBalance = () => {
        if (!editingPatient) return 0;
        const labCost = editingPatient.lab_cost || 0;
        const installmentsTotal = calculateInstallmentsTotal(localInstallments);
        return (labCost + formData.clinic_cost) - formData.insurance_amount - formData.cash_amount - installmentsTotal;
    };

    const handleEditClick = (p: PatientRecord) => {
        setEditingPatient(p);
        setFormData({
            clinic_cost: p.clinic_cost || 0,
            insurance_amount: p.insurance_amount || 0,
            cash_amount: p.cash_amount || 0,
            to_come_again: p.to_come_again || false
        });
        setLocalInstallments(p.installments || []);
    };

    const handleCloseModal = () => {
        setEditingPatient(null);
        setFormData({ clinic_cost: 0, insurance_amount: 0, cash_amount: 0, to_come_again: false });
        setLocalInstallments([]);
        setShowInstallmentModal(false);
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
            notes: newInstallment.notes || undefined
        };

        setLocalInstallments(prev => [...prev, installment]);
        setNewInstallment({ amount: 0, payment_method: "Cash", receipt_no: "", notes: "" });
        setShowInstallmentModal(false);
    };

    const handleRemoveInstallment = (id: string) => {
        setLocalInstallments(prev => prev.filter(inst => inst.id !== id));
    };

    const handleSave = async () => {
        if (!editingPatient) return;

        setIsSaving(true);
        try {
            const balance = calculateFormBalance();

            // Check if this is first time setting prices (for locking)
            const isFirstPriceSet = !editingPatient.price_locked &&
                (formData.clinic_cost > 0 || formData.insurance_amount > 0 || formData.cash_amount > 0);

            const updates: Partial<PatientRecord> = {
                ...formData,
                balance,
                installments: localInstallments,
                // Lock the price after first save if any payment info was entered
                ...(isFirstPriceSet ? {
                    price_locked: true,
                    price_locked_at: new Date().toISOString(),
                    price_locked_by: "FrontOffice" // Could be dynamic user name
                } : {})
            };

            await updateWalkin(editingPatient.no, updates);

            if (onUpdatePatient) {
                onUpdatePatient({ ...editingPatient, ...updates });
            }

            handleCloseModal();
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Print receipt function
    const printReceipt = (p: PatientRecord) => {
        const receiptWindow = window.open("", "_blank");
        if (!receiptWindow) {
            alert("Please allow pop-ups to print receipts");
            return;
        }

        const receiptDate = new Date().toLocaleDateString("en-KE", {
            year: "numeric", month: "long", day: "numeric"
        });

        const invoiceNumber = `INV-${String(p.no).padStart(6, '0')}`;
        const totalCost = (p.lab_cost || 0) + (p.clinic_cost || 0);
        const installmentsTotal = calculateInstallmentsTotal(p.installments || []);
        const balance = calculateBalance(p);

        const installmentsHtml = (p.installments || []).length > 0 ? `
            <div class="section-title">Installment Payments</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Receipt #</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${(p.installments || []).map(inst => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">
                                ${new Date(inst.paid_at).toLocaleDateString("en-KE")}
                            </td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${inst.payment_method}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${inst.receipt_no || "-"}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                                Ksh ${inst.amount.toLocaleString()}
                            </td>
                        </tr>
                    `).join("")}
                    <tr style="background: #f8fafc;">
                        <td colspan="3" style="padding: 8px; font-weight: 600;">Total Installments</td>
                        <td style="padding: 8px; text-align: right; font-weight: 600;">
                            Ksh ${installmentsTotal.toLocaleString()}
                        </td>
                    </tr>
                </tbody>
            </table>
        ` : "";

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
                    .cost-breakdown {
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .cost-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .cost-row:last-child { border-bottom: none; }
                    .cost-row.subtotal { 
                        font-weight: 600; 
                        border-top: 2px solid #e5e7eb;
                        margin-top: 10px;
                        padding-top: 15px;
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
                    .balance-due {
                        background: ${balance > 0 ? '#fef2f2' : '#f0fdf4'};
                        border: 2px solid ${balance > 0 ? '#ef4444' : '#22c55e'};
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        margin-top: 20px;
                    }
                    .balance-label { 
                        font-size: 14px; 
                        color: ${balance > 0 ? '#dc2626' : '#16a34a'}; 
                        margin-bottom: 5px;
                    }
                    .balance-amount { 
                        font-size: 28px; 
                        font-weight: bold; 
                        color: ${balance > 0 ? '#dc2626' : '#16a34a'};
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        color: #666;
                        font-size: 12px;
                    }
                    .locked-badge {
                        display: inline-block;
                        background: #fef3c7;
                        color: #92400e;
                        padding: 4px 10px;
                        border-radius: 4px;
                        font-size: 11px;
                        margin-left: 10px;
                    }
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🦷 Aquadent Dental Clinic</div>
                    <div class="subtitle">Patient Receipt / Invoice</div>
                </div>

                <div class="invoice-info">
                    <div>
                        <div class="label">Invoice Number</div>
                        <div class="value">${invoiceNumber}</div>
                        <div class="label" style="margin-top: 15px;">Date</div>
                        <div class="value">${receiptDate}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">Patient</div>
                        <div class="value">${p.name}</div>
                        <div class="value" style="font-weight: normal; color: #666;">${p.contacts}</div>
                        <div class="label" style="margin-top: 15px;">Patient No</div>
                        <div class="value">#${p.no}</div>
                    </div>
                </div>

                ${p.procedure && p.procedure.length > 0 ? `
                    <div class="section-title">Procedures</div>
                    <div class="procedures">${p.procedure.join(', ')}</div>
                ` : ""}

                ${p.lab_procedures ? `
                    <div class="section-title">Lab Procedures</div>
                    <div class="procedures">${p.lab_procedures}</div>
                ` : ""}

                <div class="section-title">Cost Breakdown</div>
                <div class="cost-breakdown">
                    <div class="cost-row">
                        <span>Lab Cost</span>
                        <span>Ksh ${(p.lab_cost || 0).toLocaleString()}</span>
                    </div>
                    <div class="cost-row">
                        <span>Clinic Cost</span>
                        <span>Ksh ${(p.clinic_cost || 0).toLocaleString()}</span>
                    </div>
                    <div class="cost-row subtotal">
                        <span>Total Cost</span>
                        <span>Ksh ${totalCost.toLocaleString()}</span>
                    </div>
                </div>

                <div class="section-title">Payments Received</div>
                <div class="cost-breakdown">
                    <div class="cost-row">
                        <span>Insurance</span>
                        <span>Ksh ${(p.insurance_amount || 0).toLocaleString()}</span>
                    </div>
                    <div class="cost-row">
                        <span>Cash Payment</span>
                        <span>Ksh ${(p.cash_amount || 0).toLocaleString()}</span>
                    </div>
                    ${installmentsTotal > 0 ? `
                        <div class="cost-row">
                            <span>Installments (${(p.installments || []).length} payments)</span>
                            <span>Ksh ${installmentsTotal.toLocaleString()}</span>
                        </div>
                    ` : ""}
                    <div class="cost-row subtotal">
                        <span>Total Paid</span>
                        <span>Ksh ${((p.insurance_amount || 0) + (p.cash_amount || 0) + installmentsTotal).toLocaleString()}</span>
                    </div>
                </div>

                ${installmentsHtml}

                <div class="balance-due">
                    <div class="balance-label">${balance > 0 ? 'BALANCE DUE' : balance < 0 ? 'OVERPAYMENT' : 'PAID IN FULL'}</div>
                    <div class="balance-amount">Ksh ${Math.abs(balance).toLocaleString()}</div>
                </div>

                <div class="footer">
                    <p>Thank you for choosing Aquadent Dental Clinic!</p>
                    <p style="margin-top: 5px;">For inquiries, contact us at info@aquadent.com</p>
                    ${p.price_locked ? `<p style="margin-top: 10px;"><span class="locked-badge">🔒 Prices Locked on ${p.price_locked_at ? new Date(p.price_locked_at).toLocaleDateString() : 'N/A'}</span></p>` : ""}
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

    const isPriceLocked = editingPatient?.price_locked || false;

    return (
        <>
            <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr className="text-left border-b">
                            <th className="p-3 font-medium text-gray-600">NO</th>
                            <th className="p-3 font-medium text-gray-600">STATUS</th>
                            <th className="p-3 font-medium text-gray-600">PATIENT</th>
                            <th className="p-3 font-medium text-gray-600">G</th>
                            <th className="p-3 font-medium text-gray-600">AGE</th>
                            <th className="p-3 font-medium text-gray-600">DOB</th>
                            <th className="p-3 font-medium text-gray-600">CONTACTS</th>
                            <th className="p-3 font-medium text-gray-600">RES</th>
                            <th className="p-3 font-medium text-gray-600">OP</th>
                            <th className="p-3 font-medium text-gray-600">PROCEDURE</th>
                            <th className="p-3 font-medium text-gray-600">LAB PROCEDURES</th>
                            <th className="p-3 font-medium text-gray-600">NOTES</th>
                            <th className="p-3 font-medium text-gray-600">TYPE</th>
                            <th className="p-3 font-medium text-gray-600">LAB COST</th>
                            <th className="p-3 font-medium text-gray-600">LAB STATUS</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">CLINIC COST</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">INSURANCE</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">CASH</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">INSTALLMENTS</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">BALANCE</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">COME AGAIN</th>
                            <th className="p-3 font-medium text-gray-600">ACTION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {patients.length === 0 ? (
                            <tr>
                                <td colSpan={22} className="p-4 text-center text-slate-500">No completed lab works.</td>
                            </tr>
                        ) : (
                            patients.map((p) => (
                                <tr key={p.no} className="hover:bg-slate-50">
                                    <td className="p-3">{p.no}</td>
                                    <td className="p-3">
                                        {p.old ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                                                Old
                                            </span>
                                        ) : p.newId ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
                                                New
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 font-medium">{p.name}</td>
                                    <td className="p-3">{p.g}</td>
                                    <td className="p-3">{getAge(p)}</td>
                                    <td className="p-3 text-gray-500">{formatDOB(p.dob)}</td>
                                    <td className="p-3">{p.contacts}</td>
                                    <td className="p-3">{p.res}</td>
                                    <td className="p-3">{p.op}</td>
                                    <td className="p-3 text-gray-500 min-w-[200px]">{p.procedure?.join(', ') || '-'}</td>
                                    <td className="p-3 min-w-[200px]">{p.lab_procedures || '-'}</td>
                                    <td className="p-3 min-w-[200px]">{p.lab_notes || '-'}</td>
                                    <td className="p-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${p.lab_type === 'Internal' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {p.lab_type || 'Internal'}
                                        </span>
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800">
                                        {p.lab_cost?.toLocaleString() || '0'}
                                    </td>
                                    <td className="p-3">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Completed</span>
                                    </td>
                                    {/* Display values (read-only) */}
                                    <td className="p-3 bg-blue-50/30 text-right font-medium">
                                        {(p.clinic_cost || 0).toLocaleString()}
                                        {p.price_locked && <span className="ml-1 text-amber-600" title="Price Locked">🔒</span>}
                                    </td>
                                    <td className="p-3 bg-blue-50/30 text-right font-medium">
                                        {(p.insurance_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="p-3 bg-blue-50/30 text-right font-medium">
                                        {(p.cash_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="p-3 bg-blue-50/30 text-right font-medium">
                                        <span className="text-purple-600">
                                            {calculateInstallmentsTotal(p.installments || []).toLocaleString()}
                                        </span>
                                        {(p.installments || []).length > 0 && (
                                            <span className="ml-1 text-xs text-gray-500">
                                                ({(p.installments || []).length})
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 bg-blue-50/30">
                                        <span className={`font-semibold ${calculateBalance(p) > 0 ? 'text-red-600' : calculateBalance(p) < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                            {calculateBalance(p).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-3 bg-blue-50/30 text-center">
                                        {p.to_come_again ? (
                                            <span className="text-green-600 font-medium">Yes</span>
                                        ) : (
                                            <span className="text-gray-400">No</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(p)}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                            >
                                                {p.price_locked ? 'View' : 'Edit'}
                                            </button>
                                            <button
                                                onClick={() => printReceipt(p)}
                                                className="px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
                                                title="Print Receipt"
                                            >
                                                🖨️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b sticky top-0 bg-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {isPriceLocked ? 'View Payment Details' : 'Edit Payment Details'}
                                </h3>
                                {isPriceLocked && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                                        🔒 Prices Locked
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Patient: <span className="font-medium text-gray-700">{editingPatient.name}</span>
                            </p>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            {/* Warning for locked prices */}
                            {isPriceLocked && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-amber-600 text-xl">⚠️</span>
                                        <div>
                                            <h4 className="font-medium text-amber-800">Prices are locked</h4>
                                            <p className="text-sm text-amber-700 mt-1">
                                                Cost fields cannot be edited after the first save to prevent fraud.
                                                You can still add installment payments and view details.
                                            </p>
                                            {editingPatient.price_locked_at && (
                                                <p className="text-xs text-amber-600 mt-2">
                                                    Locked on: {new Date(editingPatient.price_locked_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lab Cost (read-only display) */}
                            <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded">
                                <span className="text-sm text-gray-600">Lab Cost</span>
                                <span className="font-semibold text-gray-800">
                                    {(editingPatient.lab_cost || 0).toLocaleString()}
                                </span>
                            </div>

                            {/* Clinic Cost */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Clinic Cost
                                </label>
                                <input
                                    type="number"
                                    value={formData.clinic_cost || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clinic_cost: parseFloat(e.target.value) || 0 }))}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isPriceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="Enter clinic cost"
                                    disabled={isPriceLocked}
                                />
                            </div>

                            {/* Total Cost (calculated) */}
                            <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded">
                                <span className="text-sm font-medium text-blue-700">Total Cost (Lab + Clinic)</span>
                                <span className="font-semibold text-blue-800">
                                    {((editingPatient.lab_cost || 0) + formData.clinic_cost).toLocaleString()}
                                </span>
                            </div>

                            {/* Insurance */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Insurance Amount
                                </label>
                                <input
                                    type="number"
                                    value={formData.insurance_amount || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, insurance_amount: parseFloat(e.target.value) || 0 }))}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isPriceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="Enter insurance amount"
                                    disabled={isPriceLocked}
                                />
                            </div>

                            {/* Cash */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cash Amount
                                </label>
                                <input
                                    type="number"
                                    value={formData.cash_amount || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cash_amount: parseFloat(e.target.value) || 0 }))}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isPriceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="Enter cash amount"
                                    disabled={isPriceLocked}
                                />
                            </div>

                            {/* Installments Section */}
                            <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-800">Installment Payments</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowInstallmentModal(true)}
                                        className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                                    >
                                        + Add Installment
                                    </button>
                                </div>

                                {localInstallments.length > 0 ? (
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Date</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Method</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Receipt #</th>
                                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Amount</th>
                                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {localInstallments.map((inst) => (
                                                    <tr key={inst.id} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-gray-600">
                                                            {new Date(inst.paid_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                                                {inst.payment_method}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500">{inst.receipt_no || '-'}</td>
                                                        <td className="px-3 py-2 text-right font-medium">{inst.amount.toLocaleString()}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveInstallment(inst.id)}
                                                                className="text-red-500 hover:text-red-700 text-xs"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-purple-50">
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-2 font-medium text-purple-800">
                                                        Total Installments
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold text-purple-800">
                                                        {calculateInstallmentsTotal(localInstallments).toLocaleString()}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                                        No installments recorded
                                    </div>
                                )}
                            </div>

                            {/* Balance (auto-calculated) */}
                            <div className={`flex justify-between items-center py-3 px-4 rounded-lg ${calculateFormBalance() > 0 ? 'bg-red-50 border border-red-200' : calculateFormBalance() < 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                <span className="text-sm font-medium text-gray-700">Balance Due</span>
                                <span className={`font-bold text-xl ${calculateFormBalance() > 0 ? 'text-red-600' : calculateFormBalance() < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                    {calculateFormBalance().toLocaleString()}
                                </span>
                            </div>

                            {/* Come Again */}
                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="to_come_again"
                                    checked={formData.to_come_again}
                                    onChange={(e) => setFormData(prev => ({ ...prev, to_come_again: e.target.checked }))}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="to_come_again" className="text-sm font-medium text-gray-700">
                                    Patient needs to come again
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => printReceipt(editingPatient)}
                                className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                🖨️ Print Receipt
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Installment Modal */}
            {showInstallmentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Add Installment Payment</h3>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    value={newInstallment.amount || ''}
                                    onChange={(e) => setNewInstallment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Enter amount"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={newInstallment.payment_method}
                                    onChange={(e) => setNewInstallment(prev => ({ ...prev, payment_method: e.target.value as any }))}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="M-Pesa">M-Pesa</option>
                                    <option value="Card">Card</option>
                                    <option value="Insurance">Insurance</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Receipt Number
                                </label>
                                <input
                                    type="text"
                                    value={newInstallment.receipt_no}
                                    onChange={(e) => setNewInstallment(prev => ({ ...prev, receipt_no: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Enter receipt number (optional)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={newInstallment.notes}
                                    onChange={(e) => setNewInstallment(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Add notes (optional)"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowInstallmentModal(false);
                                    setNewInstallment({ amount: 0, payment_method: "Cash", receipt_no: "", notes: "" });
                                }}
                                className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddInstallment}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                                Add Installment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CompletedLabWorksTable;
