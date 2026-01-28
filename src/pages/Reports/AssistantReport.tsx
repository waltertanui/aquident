import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import { createDailyReport, type AssistantReportContent } from "../../middleware/data";
import { useNavigate } from "react-router-dom";

export default function AssistantReport() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<AssistantReportContent>({
        patients_assisted: 0,
        procedures_supported: "",
        sterilization_completed: false,
        chairside_assistance: "",
        appointment_scheduling: "",
        records_updated: false,
        inventory_check: "",
        sterilization_log_completed: false,
        operatory_cleaning: false,
        ppe_compliance: false,
        patient_instructions: "",
        dentist_coordination: "",
        follow_up_issues: "",
        challenges: "",
        suggestions: "",
        comments: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { success, error } = await createDailyReport({
            department: "assistant",
            report_date: new Date().toISOString().split('T')[0],
            submitted_by: "Dental Assistant", // In real app, get from auth
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

    const toggleBool = (key: keyof AssistantReportContent) => {
        setFormData(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-4 max-w-full mx-auto">
            <PageHeader title="Dental Assistant Daily Report" />

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-4 space-y-6">
                {/* Section 1: Patient Care */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-teal-800 uppercase tracking-wide">1. Patient Care</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Patients Assisted</label>
                            <input type="number" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5"
                                value={formData.patients_assisted}
                                onChange={e => setFormData({ ...formData, patients_assisted: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Procedures Supported</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5" placeholder="e.g. cleanings, fillings, extractions"
                                value={formData.procedures_supported}
                                onChange={e => setFormData({ ...formData, procedures_supported: e.target.value })} />
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Sterilization Completed?</label>
                            <button type="button" onClick={() => toggleBool('sterilization_completed')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.sterilization_completed ? 'bg-teal-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.sterilization_completed ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Chairside Assistance</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5"
                                value={formData.chairside_assistance}
                                onChange={e => setFormData({ ...formData, chairside_assistance: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Administrative Tasks */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-teal-800 uppercase tracking-wide">2. Administrative Tasks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduling / Confirmation</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5"
                                value={formData.appointment_scheduling}
                                onChange={e => setFormData({ ...formData, appointment_scheduling: e.target.value })} />
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Records Updated?</label>
                            <button type="button" onClick={() => toggleBool('records_updated')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.records_updated ? 'bg-teal-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.records_updated ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Inventory Check</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5"
                                value={formData.inventory_check}
                                onChange={e => setFormData({ ...formData, inventory_check: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 3: Infection Control & Safety */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-teal-800 uppercase tracking-wide">3. Infection Control</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Sterilization Log?</label>
                            <button type="button" onClick={() => toggleBool('sterilization_log_completed')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.sterilization_log_completed ? 'bg-teal-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.sterilization_log_completed ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Operatory Cleaning?</label>
                            <button type="button" onClick={() => toggleBool('operatory_cleaning')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.operatory_cleaning ? 'bg-teal-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.operatory_cleaning ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">PPE Compliance?</label>
                            <button type="button" onClick={() => toggleBool('ppe_compliance')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.ppe_compliance ? 'bg-teal-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.ppe_compliance ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 4: Communication */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-teal-800 uppercase tracking-wide">4. Communication</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Instructions</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.patient_instructions}
                                onChange={e => setFormData({ ...formData, patient_instructions: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Dentist Assist</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.dentist_coordination}
                                onChange={e => setFormData({ ...formData, dentist_coordination: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Requirements</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5"
                                value={formData.follow_up_issues}
                                onChange={e => setFormData({ ...formData, follow_up_issues: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 5: Notes */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-teal-800 uppercase tracking-wide">5. Notes & Observations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Challenges</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.challenges}
                                onChange={e => setFormData({ ...formData, challenges: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Suggestions</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.suggestions}
                                onChange={e => setFormData({ ...formData, suggestions: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Comments</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.comments}
                                onChange={e => setFormData({ ...formData, comments: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => navigate("/reports")}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium">Cancel</button>
                    <button type="submit" disabled={isSaving}
                        className="px-6 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium shadow-sm">
                        {isSaving ? "Saving..." : "Submit Report"}
                    </button>
                </div>
            </form>
        </div>
    );
}
