
import React, { useState } from 'react';
import type { PatientRecord, InstallmentPayment } from '../middleware/data';
import { updateWalkin } from '../middleware/data';
import logo from '../assets/aquadent_logo.png';

interface CompletedLabWorksTableProps {
    patients: PatientRecord[];
    onUpdatePatient?: (patient: PatientRecord) => void;
}

interface EditFormData {
    clinic_cost: number;
    insurance_amount: number;
    cash_amount: number;
    to_come_again: boolean;
    card_image_url: string;
    consent_form_url: string;
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
        to_come_again: false,
        card_image_url: '',
        consent_form_url: ''
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

    const filteredPatients = patients; // No internal filtering, handle it at parent level


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
            to_come_again: p.to_come_again || false,
            card_image_url: p.card_image_url || '',
            consent_form_url: p.consent_form_url || ''
        });
        setLocalInstallments(p.installments || []);
    };

    const handleCloseModal = () => {
        setEditingPatient(null);
        setFormData({
            clinic_cost: 0, insurance_amount: 0, cash_amount: 0, to_come_again: false,
            card_image_url: '', consent_form_url: ''
        });
        setLocalInstallments([]);
        setShowInstallmentModal(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'card_image_url' | 'consent_form_url') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
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

    // Print invoice function (for insurance claims)
    const printInvoice = (p: PatientRecord) => {
        // Invoice is only used when insurance is covering
        if (!p.insurance_amount || p.insurance_amount <= 0) {
            alert("Invoice is only generated for insurance-covered treatments. This patient has no insurance amount.");
            return;
        }

        const invoiceWindow = window.open("", "_blank");
        if (!invoiceWindow) {
            alert("Please allow pop-ups to print invoices");
            return;
        }

        const now = new Date();
        const printDate = now.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
        const printTime = now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
        const voucherNo = `VCH-${String(p.no).padStart(6, '0')}`;
        const ngNo = String(p.no).padStart(7, '0');

        // Build procedure rows
        const procedures = p.procedure || [];
        const procedureRows = procedures.map((proc, idx) => {
            const qty = 1;
            const charge = Math.round((p.clinic_cost || 0) / procedures.length);
            const netAmt = charge;
            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${proc}</td>
                    <td style="text-align: right;">${charge.toLocaleString()}</td>
                    <td style="text-align: center;">${qty}</td>
                    <td style="text-align: right;">${charge.toLocaleString()}</td>
                    <td style="text-align: right;">0.00</td>
                    <td style="text-align: right;">${netAmt.toLocaleString()}</td>
                </tr>
            `;
        }).join("");

        const totalGross = p.clinic_cost || 0;
        const totalNet = p.insurance_amount || 0;
        const patientTotal = (p.cash_amount || 0);
        const sponsorTotal = p.insurance_amount || 0;

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
                    .header-text {
                        flex: 1;
                        text-align: center;
                    }
                    .company-name { 
                        font-size: 18px; 
                        font-weight: bold; 
                    }
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
                    .info-label { width: 100px; font-weight: bold; }
                    .info-value { }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 15px 0; 
                        font-size: 11px;
                    }
                    th, td { 
                        border: 1px solid #000; 
                        padding: 4px 6px; 
                    }
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
                        pointer-events: none;
                    }
                    .watermark img {
                        width: 300px;
                        height: 300px;
                    }
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

                <div class="invoice-title">SALE INVOICE</div>

                <div class="info-grid">
                    <div>
                        <div class="info-row"><span class="info-label">Print Dt:</span> <span class="info-value">${printDate} ${printTime}</span></div>
                        <div class="info-row"><span class="info-label">Voucher Bt.:</span> <span class="info-value">${printDate}</span></div>
                        <div class="info-row"><span class="info-label">Ks No.:</span> <span class="info-value">${ngNo}</span></div>
                        <div class="info-row"><span class="info-label">Name:</span> <span class="info-value">${p.name?.toUpperCase()}</span></div>
                        <div class="info-row"><span class="info-label">Ref.By:</span> <span class="info-value">${p.doc_name || 'DOCTOR'}</span></div>
                        <div class="info-row"><span class="info-label">Pre.Dbc.:</span> <span class="info-value">${p.doc_name || 'DOCTOR'}</span></div>
                        <div class="info-row"><span class="info-label">Srcl.:</span> <span class="info-value">Aquadent Dental Center OPD</span></div>
                        <div class="info-row"><span class="info-label">Pat. Typ:</span> <span class="info-value">CREDIT</span></div>
                        <div class="info-row"><span class="info-label">Order No:</span> <span class="info-value">${ngNo}</span></div>
                    </div>
                    <div>
                        <div class="info-row"><span class="info-label">Voucher No.:</span> <span class="info-value">${voucherNo}</span></div>
                        <div class="info-row"><span class="info-label">Corporate:</span> <span class="info-value">${p.op || 'INSURANCE'}</span></div>
                        <div class="info-row"><span class="info-label">Scheme:</span> <span class="info-value">${p.op || 'INSURANCE'}</span></div>
                        <div class="info-row"><span class="info-label">Trans.auth.no:</span> <span class="info-value">-</span></div>
                        <div class="info-row"><span class="info-label">Agr - No:</span> <span class="info-value">-</span></div>
                        <div class="info-row"><span class="info-label">Emp No:</span> <span class="info-value">SM</span></div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Service Name</th>
                            <th>Charge</th>
                            <th>Qty</th>
                            <th>Total</th>
                            <th>Net Disc</th>
                            <th>Net Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${procedureRows || `<tr><td colspan="7" style="text-align: center;">No procedures</td></tr>`}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; background: #f0f0f0;">
                            <td colspan="4" style="text-align: right;">Total Gross Art</td>
                            <td style="text-align: right;">${totalGross.toLocaleString()}</td>
                            <td></td>
                            <td style="text-align: right;">${totalNet.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="totals">
                    <div class="totals-row"><span>Patient Total</span><span>${patientTotal.toLocaleString()}</span></div>
                    <div class="totals-row"><span>Sponsor Total</span><span>${sponsorTotal.toLocaleString()}</span></div>
                    <div class="totals-row final"><span>Total</span><span>${(patientTotal + sponsorTotal).toLocaleString()}</span></div>
                </div>

                <div class="signature">
                    <p>User: FRONTOFFICE</p>
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

    // Print receipt function (for cash payments)
    const printReceipt = (p: PatientRecord) => {
        const receiptWindow = window.open("", "_blank");
        if (!receiptWindow) {
            alert("Please allow pop-ups to print receipts");
            return;
        }

        const receiptDate = new Date().toLocaleDateString("en-KE", {
            year: "numeric", month: "long", day: "numeric"
        });

        const invoiceNumber = `RCP-${String(p.no).padStart(6, '0')}`;
        const totalCost = (p.lab_cost || 0) + (p.clinic_cost || 0);
        const installmentsTotal = calculateInstallmentsTotal(p.installments || []);
        const balance = calculateBalance(p);

        const installmentsHtml = (p.installments || []).length > 0 ? `
            <div class="section-title">INSTALLMENT PAYMENTS</div>
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
                            <td>${new Date(inst.paid_at).toLocaleDateString("en-KE")}</td>
                            <td>${inst.payment_method}</td>
                            <td>${inst.receipt_no || "-"}</td>
                            <td style="text-align: right;">Ksh ${inst.amount.toLocaleString()}</td>
                        </tr>
                    `).join("")}
                    <tr class="total-row">
                        <td colspan="3"><strong>Total Installments</strong></td>
                        <td style="text-align: right;"><strong>Ksh ${installmentsTotal.toLocaleString()}</strong></td>
                    </tr>
                </tbody>
            </table>
        ` : "";

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
                    
                    /* Header with red theme */
                    .header {
                        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                        color: white;
                        padding: 15px 20px;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -20%;
                        width: 200px;
                        height: 200px;
                        background: rgba(255,255,255,0.05);
                        border-radius: 50%;
                    }
                    
                    .header::after {
                        content: '';
                        position: absolute;
                        bottom: -60%;
                        left: -10%;
                        width: 150px;
                        height: 150px;
                        background: rgba(255,255,255,0.03);
                        border-radius: 50%;
                    }
                    
                    .header-content {
                        position: relative;
                        z-index: 1;
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
                        letter-spacing: -0.5px;
                    }
                    
                    .brand-text p {
                        font-size: 10px;
                        opacity: 0.9;
                        font-weight: 400;
                    }
                    
                    .receipt-badge {
                        background: rgba(255,255,255,0.2);
                        backdrop-filter: blur(10px);
                        padding: 6px 12px;
                        border-radius: 6px;
                        text-align: right;
                    }
                    
                    .receipt-badge .label {
                        font-size: 9px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        opacity: 0.8;
                        margin-bottom: 2px;
                    }
                    
                    .receipt-badge .number {
                        font-size: 12px;
                        font-weight: 700;
                    }
                    
                    /* Content area */
                    .content {
                        padding: 20px;
                    }
                    
                    /* Info grid */
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
                        border-left: 3px solid #dc2626;
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
                    
                    .info-card .patient-no {
                        display: inline-block;
                        background: #dc2626;
                        color: white;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 10px;
                        font-weight: 600;
                        margin-top: 5px;
                    }
                    
                    /* Section styling */
                    .section {
                        margin-bottom: 15px;
                    }
                    
                    .section-title {
                        font-size: 10px;
                        font-weight: 700;
                        color: #dc2626;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 8px;
                        padding-bottom: 4px;
                        border-bottom: 1px solid #dc2626;
                        display: inline-block;
                    }
                    
                    .procedures-box {
                        background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
                        border: 1px solid #fecaca;
                        padding: 10px;
                        border-radius: 6px;
                        line-height: 1.4;
                        color: #1a1a1a;
                        font-size: 11px;
                    }
                    
                    /* Cost Summary Container - Side by Side */
                    .summary-container {
                        display: flex;
                        gap: 15px;
                        margin-bottom: 15px;
                    }
                    
                    .summary-col {
                        flex: 1;
                    }
                    
                    /* Tables */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 5px;
                    }
                    
                    th {
                        background: #dc2626;
                        color: white;
                        padding: 8px 10px;
                        text-align: left;
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        font-weight: 600;
                    }
                    
                    th:first-child { border-radius: 6px 0 0 0; }
                    th:last-child { border-radius: 0 6px 0 0; }
                    
                    td {
                        padding: 8px 10px;
                        border-bottom: 1px solid #f0f0f0;
                        font-size: 11px;
                    }
                    
                    tr:hover td {
                        background: #fafafa;
                    }
                    
                    .total-row td {
                        background: #fef2f2 !important;
                        border-top: 2px solid #dc2626;
                        font-weight: 600;
                    }
                    
                    /* Cost breakdown */
                    .cost-card {
                        background: #fafafa;
                        border-radius: 8px;
                        overflow: hidden;
                        border: 1px solid #eee;
                    }
                    
                    .cost-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 12px;
                        border-bottom: 1px solid #eee;
                        font-size: 11px;
                    }
                    
                    .cost-row:last-child {
                        border-bottom: none;
                    }
                    
                    .cost-row.highlight {
                        background: #dc2626;
                        color: white;
                        font-weight: 700;
                        font-size: 12px;
                    }
                    
                    .cost-row .label {
                        color: #666;
                    }
                    
                    .cost-row .amount {
                        font-weight: 600;
                        color: #1a1a1a;
                    }
                    
                    .cost-row.highlight .label,
                    .cost-row.highlight .amount {
                        color: white;
                    }
                    
                    /* Balance box */
                    .balance-wrapper {
                        margin-top: 15px;
                        display: flex;
                        justify-content: flex-end;
                    }

                    .balance-box {
                        padding: 15px 25px;
                        border-radius: 8px;
                        text-align: center;
                        background: ${balance > 0 ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'};
                        border: 1px solid ${balance > 0 ? '#fca5a5' : '#86efac'};
                        min-width: 200px;
                    }
                    
                    .balance-box .status {
                        font-size: 10px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: ${balance > 0 ? '#dc2626' : '#16a34a'};
                        margin-bottom: 4px;
                    }
                    
                    .balance-box .amount {
                        font-size: 24px;
                        font-weight: 800;
                        color: ${balance > 0 ? '#dc2626' : '#16a34a'};
                        letter-spacing: -0.5px;
                    }
                    
                    /* Footer */
                    .footer {
                        background: #1a1a1a;
                        color: white;
                        padding: 15px 20px;
                        text-align: center;
                    }
                    
                    .footer p {
                        font-size: 10px;
                        margin-bottom: 3px;
                    }
                    
                    .footer .tagline {
                        color: #dc2626;
                        font-weight: 600;
                        font-size: 11px;
                        margin-bottom: 5px;
                    }
                    
                    .footer .contact {
                        color: #888;
                        font-size: 9px;
                    }
                    
                    /* Print buttons */
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
                        transition: all 0.2s;
                        margin: 0 5px;
                    }
                    
                    .btn-primary { background: #dc2626; color: white; }
                    .btn-secondary { background: #e5e5e5; color: #333; }
                    
                    @media print {
                        body { background: white; padding: 0; }
                        .receipt-container { box-shadow: none; margin: 0; max-width: 100%; width: 100%; }
                        .no-print { display: none !important; }
                        .header, .footer, th, .balance-box, .cost-row.highlight { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        @page { margin: 0.5cm; size: auto; }
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
                                        <h1>Aquadent Dental Clinic</h1>
                                        <p>restore your smile</p>
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
                                    <h3>Patient</h3>
                                    <div class="name">${p.name}</div>
                                    <div class="detail">${p.contacts}</div>
                                    <div class="patient-no">ID: #${p.no}</div>
                                </div>
                                <div class="info-card" style="text-align: right; border-left: none; border-right: 3px solid #dc2626;">
                                    <h3>Details</h3>
                                    <div class="name">${receiptDate}</div>
                                    <div class="detail">Payment Receipt</div>
                                </div>
                            </div>

                            ${p.procedure && p.procedure.length > 0 ? `
                            <div class="section">
                                <div class="section-title">Clinical Procedures</div>
                                <div class="procedures-box">${p.procedure.join(' • ')}</div>
                            </div>
                        ` : ""}

                            ${p.lab_procedures ? `
                            <div class="section">
                                <div class="section-title">Laboratory Procedures</div>
                                <div class="procedures-box">${p.lab_procedures}</div>
                            </div>
                        ` : ""}

                            <div class="summary-container">
                                <div class="summary-col">
                                    <div class="section">
                                        <div class="section-title">Cost Summary</div>
                                        <div class="cost-card">
                                            <div class="cost-row">
                                                <span class="label">Laboratory</span>
                                                <span class="amount">Ksh ${(p.lab_cost || 0).toLocaleString()}</span>
                                            </div>
                                            <div class="cost-row">
                                                <span class="label">Clinical</span>
                                                <span class="amount">Ksh ${(p.clinic_cost || 0).toLocaleString()}</span>
                                            </div>
                                            <div class="cost-row highlight">
                                                <span class="label">TOTAL</span>
                                                <span class="amount">Ksh ${totalCost.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="summary-col">
                                    <div class="section">
                                        <div class="section-title">Payments</div>
                                        <div class="cost-card">
                                            <div class="cost-row">
                                                <span class="label">Insurance</span>
                                                <span class="amount">Ksh ${(p.insurance_amount || 0).toLocaleString()}</span>
                                            </div>
                                            <div class="cost-row">
                                                <span class="label">Cash</span>
                                                <span class="amount">Ksh ${(p.cash_amount || 0).toLocaleString()}</span>
                                            </div>
                                            ${installmentsTotal > 0 ? `
                                            <div class="cost-row">
                                                <span class="label">Inst. x${(p.installments || []).length}</span>
                                                <span class="amount">Ksh ${installmentsTotal.toLocaleString()}</span>
                                            </div>
                                        ` : ""}
                                            <div class="cost-row highlight">
                                                <span class="label">PAID</span>
                                                <span class="amount">Ksh ${((p.insurance_amount || 0) + (p.cash_amount || 0) + installmentsTotal).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            ${installmentsHtml}

                            <div class="balance-wrapper">
                                <div class="balance-box">
                                    <div class="status">${balance > 0 ? 'Balance Due' : balance < 0 ? 'Overpayment' : '✓ Paid in Full'}</div>
                                    <div class="amount">Ksh ${Math.abs(balance).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p class="tagline">Thank you for choosing Aquadent Dental Clinic!</p>
                        <p class="contact">info@aquadent.co.ke • +254 700 000 000 • Eldoret, Kenya</p>
                    </div>

                    <div class="no-print">
                        <button class="btn btn-primary" onclick="window.print()">🖨️ Print Receipt</button>
                        <button class="btn btn-secondary" onclick="window.close()">Close</button>
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
                            <th className="p-3 font-medium text-gray-600 sticky left-0 z-20 bg-gray-50 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[60px] min-w-[60px] max-w-[60px]">NO</th>
                            <th className="p-3 font-medium text-gray-600 sticky left-[60px] z-20 bg-gray-50 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[150px]">PATIENT</th>
                            <th className="p-3 font-medium text-gray-600">G</th>
                            <th className="p-3 font-medium text-gray-600">AGE</th>
                            <th className="p-3 font-medium text-gray-600">CONTACTS</th>
                            <th className="p-3 font-medium text-gray-600">RES</th>
                            <th className="p-3 font-medium text-gray-600">INSURANCE</th>
                            <th className="p-3 font-medium text-gray-600">PROCEDURE</th>
                            <th className="p-3 font-medium text-gray-600">LAB PROCEDURES</th>
                            <th className="p-3 font-medium text-gray-600">NOTES</th>
                            <th className="p-3 font-medium text-gray-600">TYPE</th>
                            <th className="p-3 font-medium text-gray-600">LAB COST</th>
                            <th className="p-3 font-medium text-gray-600">LAB STATUS</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">CLINIC COST</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">INS. AMT</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">CASH</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">INSTALLMENTS</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">BALANCE</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">COME AGAIN</th>
                            <th className="p-3 font-medium text-gray-600">ACTION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPatients.length === 0 ? (
                            <tr>
                                <td colSpan={19} className="p-4 text-center text-slate-500">
                                    No records found for the selected criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredPatients.map((p) => (
                                <tr key={p.no} className="hover:bg-slate-50">
                                    <td className="p-3 sticky left-0 z-10 bg-white border-r border-gray-100 font-medium w-[60px] min-w-[60px] max-w-[60px]">{p.no}</td>
                                    <td className="p-3 font-medium sticky left-[60px] z-10 bg-white border-r border-gray-100 min-w-[150px]">{p.name}</td>
                                    <td className="p-3">{p.g}</td>
                                    <td className="p-3">{getAge(p)}</td>
                                    <td className="p-3">{p.contacts}</td>
                                    <td className="p-3">{p.res}</td>
                                    <td className="p-3">{p.op}</td>
                                    <td className="p-3 text-gray-500 max-w-[200px]">
                                        <div className="truncate" title={p.procedure?.join(', ')}>{p.procedure?.join(', ') || '-'}</div>
                                    </td>
                                    <td className="p-3 max-w-[200px]">
                                        <div className="truncate" title={p.lab_procedures}>{p.lab_procedures || '-'}</div>
                                    </td>
                                    <td className="p-3 max-w-[200px]">
                                        <div className="truncate" title={p.lab_notes}>{p.lab_notes || '-'}</div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`text - xs px - 2 py - 1 rounded - full ${p.lab_type === 'Internal' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'} `}>
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
                                        <span className={`font - semibold ${calculateBalance(p) > 0 ? 'text-red-600' : calculateBalance(p) < 0 ? 'text-green-600' : 'text-gray-600'} `}>
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
                                                🧾
                                            </button>
                                            {(p.insurance_amount || 0) > 0 && (
                                                <button
                                                    onClick={() => printInvoice(p)}
                                                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 transition-colors"
                                                    title="Print Invoice (Insurance)"
                                                >
                                                    �
                                                </button>
                                            )}
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
                            <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded">
                                <span className="text-sm text-gray-600">Clinic Cost</span>
                                <span className="font-semibold text-gray-800">
                                    {(formData.clinic_cost || 0).toLocaleString()}
                                </span>
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
                                    className={`w - full px - 3 py - 2 border rounded - md focus: ring - 2 focus: ring - blue - 500 focus: border - blue - 500 ${isPriceLocked ? 'bg-gray-100 cursor-not-allowed' : ''} `}
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
                                    className={`w - full px - 3 py - 2 border rounded - md focus: ring - 2 focus: ring - blue - 500 focus: border - blue - 500 ${isPriceLocked ? 'bg-gray-100 cursor-not-allowed' : ''} `}
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
                            <div className={`flex justify - between items - center py - 3 px - 4 rounded - lg ${calculateFormBalance() > 0 ? 'bg-red-50 border border-red-200' : calculateFormBalance() < 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'} `}>
                                <span className="text-sm font-medium text-gray-700">Balance Due</span>
                                <span className={`font - bold text - xl ${calculateFormBalance() > 0 ? 'text-red-600' : calculateFormBalance() < 0 ? 'text-green-600' : 'text-gray-600'} `}>
                                    {calculateFormBalance().toLocaleString()}
                                </span>
                            </div>

                            {/* Come Again */}
                            <div className="flex items-center gap-3 py-2 border-t pt-4">
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

                            {/* DOCUMENT UPLOADS */}
                            <div className="border-t pt-4 space-y-4">
                                <h4 className="font-medium text-gray-800">Documents</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Patient Card</label>
                                        <div className="flex flex-col gap-2">
                                            {formData.card_image_url && (
                                                <div className="relative w-full h-32 border rounded overflow-hidden bg-gray-50">
                                                    <img src={formData.card_image_url} className="w-full h-full object-contain" alt="Card preview" />
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, card_image_url: '' }))}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full text-xs shadow-md"
                                                    >✕</button>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'card_image_url')}
                                                className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Consent Form</label>
                                        <div className="flex flex-col gap-2">
                                            {formData.consent_form_url && (
                                                <div className="relative w-full h-32 border rounded overflow-hidden bg-gray-50">
                                                    <img src={formData.consent_form_url} className="w-full h-full object-contain" alt="Consent preview" />
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, consent_form_url: '' }))}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full text-xs shadow-md"
                                                    >✕</button>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'consent_form_url')}
                                                className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                    </div>
                                </div>
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
