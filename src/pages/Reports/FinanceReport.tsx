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
        const { success, error } = await createDailyReport({
            department: "finance",
            report_date: new Date().toISOString().split('T')[0],
            submitted_by: "Accountant",
            content: formData,
        });
        if (success) {
            alert("Report submitted successfully!");
            navigate("/reports");
        } else {
            console.error(error);
            alert(`Failed to submit report: ${error?.message || JSON.stringify(error)}`);
        }
        setIsSaving(false);
    };

    const toggleBool = (key: keyof FinanceReportContent) => {
        setFormData(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-4 max-w-full mx-auto">
            <PageHeader title="Finance & Admin Daily Report" />

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-4 space-y-6 text-sm">
                {/* Section 1: Transactions */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-indigo-800 uppercase tracking-wide">1. Transactions & Processing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Invoices Processed</label>
                            <input type="number" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.invoices_processed}
                                onChange={e => setFormData({ ...formData, invoices_processed: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Payments Received (Ksh)</label>
                            <input type="number" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.payments_received}
                                onChange={e => setFormData({ ...formData, payments_received: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Payments Disbursed (Ksh)</label>
                            <input type="number" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.payments_disbursed}
                                onChange={e => setFormData({ ...formData, payments_disbursed: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Bank Recon Completed?</label>
                            <button type="button" onClick={() => toggleBool('bank_reconciliation')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.bank_reconciliation ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.bank_reconciliation ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Claims Reviewed</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.expense_claims}
                                onChange={e => setFormData({ ...formData, expense_claims: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Financial Records */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-indigo-800 uppercase tracking-wide">2. Financial Records</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Journal Entries Posted</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.journal_entries}
                                onChange={e => setFormData({ ...formData, journal_entries: e.target.value })} />
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Ledger Updates?</label>
                            <button type="button" onClick={() => toggleBool('ledger_updates')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.ledger_updates ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.ledger_updates ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Documents Filed?</label>
                            <button type="button" onClick={() => toggleBool('documents_filed')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.documents_filed ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.documents_filed ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Outstanding Items Flagged</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.outstanding_items}
                                onChange={e => setFormData({ ...formData, outstanding_items: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 3: Compliance */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-indigo-800 uppercase tracking-wide">3. Compliance & Controls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Entries Recorded</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.tax_entries}
                                onChange={e => setFormData({ ...formData, tax_entries: e.target.value })} />
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Regulatory Filings?</label>
                            <button type="button" onClick={() => toggleBool('regulatory_filings')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.regulatory_filings ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.regulatory_filings ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="md:col-span-1">
                            {/* Spacer or additional compact field if needed */}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Internal Control Checks</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.internal_controls}
                                onChange={e => setFormData({ ...formData, internal_controls: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Queries</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.audit_queries}
                                onChange={e => setFormData({ ...formData, audit_queries: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 4: Analysis */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-indigo-800 uppercase tracking-wide">4. Reporting & Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50 md:col-span-1">
                            <label className="text-xs font-semibold text-blue-700 uppercase">Cash Flow Summary?</label>
                            <button type="button" onClick={() => toggleBool('cash_flow_summary')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.cash_flow_summary ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.cash_flow_summary ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="md:col-span-3">
                            {/* Spacer */}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Variance Analysis</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.variance_analysis}
                                onChange={e => setFormData({ ...formData, variance_analysis: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Budget Monitoring</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.budget_monitoring}
                                onChange={e => setFormData({ ...formData, budget_monitoring: e.target.value })} />
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Key Financial Ratios</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.financial_ratios}
                                onChange={e => setFormData({ ...formData, financial_ratios: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 5: Coordination */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-indigo-800 uppercase tracking-wide">5. Communication</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Reports Shared?</label>
                            <button type="button" onClick={() => toggleBool('reports_shared')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.reports_shared ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.reports_shared ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Department Queries</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.department_queries}
                                onChange={e => setFormData({ ...formData, department_queries: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-ups</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5"
                                value={formData.follow_ups}
                                onChange={e => setFormData({ ...formData, follow_ups: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 6: Notes */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-indigo-800 uppercase tracking-wide">6. Notes & Observations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Challenges</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.challenges}
                                onChange={e => setFormData({ ...formData, challenges: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Suggestions</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.suggestions}
                                onChange={e => setFormData({ ...formData, suggestions: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => navigate("/reports")}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium">Cancel</button>
                    <button type="submit" disabled={isSaving}
                        className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-sm">
                        {isSaving ? "Saving..." : "Submit Report"}
                    </button>
                </div>
            </form>
        </div>
    );
}
