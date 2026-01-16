import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import { createDailyReport, type FinanceReportContent } from "../../middleware/data";
import { useNavigate } from "react-router-dom";

export default function FinanceReport() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<FinanceReportContent>({
        invoices_processed: 0,
        payments_received: 0,
        payments_disbursed: 0,
        bank_reconciliation: false,
        expense_claims: "",
        journal_entries: "",
        ledger_updates: false,
        documents_filed: false,
        outstanding_items: "",
        tax_entries: "",
        regulatory_filings: false,
        internal_controls: "",
        audit_queries: "",
        cash_flow_summary: false,
        variance_analysis: "",
        budget_monitoring: "",
        financial_ratios: "",
        reports_shared: false,
        department_queries: "",
        follow_ups: "",
        challenges: "",
        suggestions: "",
        comments: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const success = await createDailyReport({
            department: "finance",
            report_date: new Date().toISOString().split('T')[0],
            submitted_by: "Accountant",
            content: formData,
        });
        if (success) {
            alert("Report submitted successfully!");
            navigate("/reports");
        } else {
            alert("Failed to submit report.");
        }
        setIsSaving(false);
    };

    const toggleBool = (key: keyof FinanceReportContent) => {
        setFormData(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <PageHeader title="Finance & Admin Daily Report" />

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-6 space-y-8 text-sm">
                {/* Section 1: Transactions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-indigo-800 font-medium">1. Transactions & Processing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block font-medium mb-1">Invoices processed</label>
                            <input type="number" className="w-full border rounded px-3 py-2"
                                value={formData.invoices_processed}
                                onChange={e => setFormData({ ...formData, invoices_processed: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Payments received (Ksh)</label>
                            <input type="number" className="w-full border rounded px-3 py-2"
                                value={formData.payments_received}
                                onChange={e => setFormData({ ...formData, payments_received: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Payments disbursed (Ksh)</label>
                            <input type="number" className="w-full border rounded px-3 py-2"
                                value={formData.payments_disbursed}
                                onChange={e => setFormData({ ...formData, payments_disbursed: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="flex items-center gap-4 py-2">
                            <label className="font-medium">Bank recon completed?</label>
                            <button type="button" onClick={() => toggleBool('bank_reconciliation')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.bank_reconciliation ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.bank_reconciliation ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Expense claims reviewed</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.expense_claims}
                                onChange={e => setFormData({ ...formData, expense_claims: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Financial Records */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-indigo-800 font-medium">2. Financial Records</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium mb-1">Journal entries posted</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.journal_entries}
                                onChange={e => setFormData({ ...formData, journal_entries: e.target.value })} />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                <label className="font-medium">Ledger updates completed?</label>
                                <button type="button" onClick={() => toggleBool('ledger_updates')}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${formData.ledger_updates ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.ledger_updates ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="font-medium">Supporting documents filed?</label>
                                <button type="button" onClick={() => toggleBool('documents_filed')}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${formData.documents_filed ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.documents_filed ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Outstanding items flagged</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.outstanding_items}
                                onChange={e => setFormData({ ...formData, outstanding_items: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 3: Compliance */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-indigo-800 font-medium">3. Compliance & Controls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium mb-1">Tax entries recorded</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.tax_entries}
                                onChange={e => setFormData({ ...formData, tax_entries: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="font-medium">Regulatory filings prepared?</label>
                            <button type="button" onClick={() => toggleBool('regulatory_filings')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.regulatory_filings ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.regulatory_filings ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Internal control checks performed</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.internal_controls}
                                onChange={e => setFormData({ ...formData, internal_controls: e.target.value })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Audit queries addressed</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.audit_queries}
                                onChange={e => setFormData({ ...formData, audit_queries: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 4: Analysis */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-indigo-800 font-medium">4. Reporting & Analysis</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 py-2">
                            <label className="font-medium text-blue-700 font-semibold uppercase text-xs">Daily cash flow summary prepared?</label>
                            <button type="button" onClick={() => toggleBool('cash_flow_summary')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.cash_flow_summary ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.cash_flow_summary ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-medium mb-1">Variance analysis completed</label>
                                <input type="text" className="w-full border rounded px-3 py-2"
                                    value={formData.variance_analysis}
                                    onChange={e => setFormData({ ...formData, variance_analysis: e.target.value })} />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Budget monitoring updates</label>
                                <input type="text" className="w-full border rounded px-3 py-2"
                                    value={formData.budget_monitoring}
                                    onChange={e => setFormData({ ...formData, budget_monitoring: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Key financial ratios tracked</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.financial_ratios}
                                onChange={e => setFormData({ ...formData, financial_ratios: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 5: Coordination */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-indigo-800 font-medium">5. Communication & Coordination</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 py-2">
                            <label className="font-medium">Reports shared with management?</label>
                            <button type="button" onClick={() => toggleBool('reports_shared')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.reports_shared ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.reports_shared ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Queries from other departments resolved</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.department_queries}
                                onChange={e => setFormData({ ...formData, department_queries: e.target.value })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Vendor/customer follow-ups</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.follow_ups}
                                onChange={e => setFormData({ ...formData, follow_ups: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 6: Notes */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-indigo-800 font-medium">6. Notes & Observations</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block font-medium mb-1">Challenges faced today</label>
                            <textarea className="w-full border rounded px-3 py-2" rows={2}
                                value={formData.challenges}
                                onChange={e => setFormData({ ...formData, challenges: e.target.value })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Suggestions for improvement</label>
                            <textarea className="w-full border rounded px-3 py-2" rows={2}
                                value={formData.suggestions}
                                onChange={e => setFormData({ ...formData, suggestions: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
                    <button type="button" onClick={() => navigate("/reports")}
                        className="px-6 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isSaving}
                        className="px-8 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {isSaving ? "Submitting..." : "Submit Report"}
                    </button>
                </div>
            </form>
        </div>
    );
}
