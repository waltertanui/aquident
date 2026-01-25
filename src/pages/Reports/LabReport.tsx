import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import { createDailyReport, type LabReportContent } from "../../middleware/data";
import { useNavigate } from "react-router-dom";

export default function LabReport() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<LabReportContent>({
        cases_processed: 0,
        prosthetic_types: "",
        materials_used: "",
        special_instructions: "",
        fit_finish_checks: false,
        adjustments_made: "",
        inspection_results: "",
        rework_cases: 0,
        equipment_maintenance: "",
        inventory_check: "",
        equipment_issues: "",
        dentist_coordination: "",
        feedback_received: "",
        clarification_pending: "",
        infection_control: false,
        waste_disposal_completed: false,
        ppe_usage: false,
        challenges: "",
        suggestions: "",
        comments: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { success, error } = await createDailyReport({
            department: "lab",
            report_date: new Date().toISOString().split('T')[0],
            submitted_by: "Lab Technologist",
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

    const toggleBool = (key: keyof LabReportContent) => {
        setFormData(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-4 max-w-full mx-auto">
            <PageHeader title="Lab Technologist Daily Report" />

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-4 space-y-6 text-sm">
                {/* Section 1: Case Work */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-blue-800 uppercase tracking-wide">1. Case Work Completed</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Cases Processed</label>
                            <input type="number" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.cases_processed}
                                onChange={e => setFormData({ ...formData, cases_processed: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Types of Prosthetics (crowns, bridges...)</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.prosthetic_types}
                                onChange={e => setFormData({ ...formData, prosthetic_types: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Materials Used</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5" placeholder="ceramic, acrylic, metal, composite"
                                value={formData.materials_used}
                                onChange={e => setFormData({ ...formData, materials_used: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Special Instructions</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.special_instructions}
                                onChange={e => setFormData({ ...formData, special_instructions: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Quality Control */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-blue-800 uppercase tracking-wide">2. Quality Control</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Fit & Finish Checks?</label>
                            <button type="button" onClick={() => toggleBool('fit_finish_checks')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.fit_finish_checks ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.fit_finish_checks ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Rework Cases</label>
                            <input type="number" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.rework_cases}
                                onChange={e => setFormData({ ...formData, rework_cases: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Adjustments / Inspection Results</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5" rows={1}
                                value={formData.adjustments_made}
                                onChange={e => setFormData({ ...formData, adjustments_made: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 3: Equipment */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-blue-800 uppercase tracking-wide">3. Equipment & Materials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Maintenance</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.equipment_maintenance}
                                onChange={e => setFormData({ ...formData, equipment_maintenance: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Inventory Check</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.inventory_check}
                                onChange={e => setFormData({ ...formData, inventory_check: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Issues</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.equipment_issues}
                                onChange={e => setFormData({ ...formData, equipment_issues: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 4: Collaboration */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-blue-800 uppercase tracking-wide">4. Collaboration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Dentist Coordination</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.dentist_coordination}
                                onChange={e => setFormData({ ...formData, dentist_coordination: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Feedback Received</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.feedback_received}
                                onChange={e => setFormData({ ...formData, feedback_received: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Pending Clarification</label>
                            <input type="text" className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5"
                                value={formData.clarification_pending}
                                onChange={e => setFormData({ ...formData, clarification_pending: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 5: Safety */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-blue-800 uppercase tracking-wide">5. Safety & Compliance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Infection Control?</label>
                            <button type="button" onClick={() => toggleBool('infection_control')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.infection_control ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.infection_control ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">Waste Disposal Log?</label>
                            <button type="button" onClick={() => toggleBool('waste_disposal_completed')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.waste_disposal_completed ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.waste_disposal_completed ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between border border-gray-400 rounded-md p-2 bg-gray-50">
                            <label className="text-xs font-semibold text-gray-700">PPE Usage?</label>
                            <button type="button" onClick={() => toggleBool('ppe_usage')}
                                className={`w-10 h-5 rounded-full relative transition-colors ${formData.ppe_usage ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.ppe_usage ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 6: Notes */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold border-b pb-1 text-blue-800 uppercase tracking-wide">6. Notes & Observations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Challenges</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.challenges}
                                onChange={e => setFormData({ ...formData, challenges: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Suggestions</label>
                            <textarea className="w-full border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-1.5" rows={2}
                                value={formData.suggestions}
                                onChange={e => setFormData({ ...formData, suggestions: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => navigate("/reports")}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium">Cancel</button>
                    <button type="submit" disabled={isSaving}
                        className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm">
                        {isSaving ? "Saving..." : "Submit Report"}
                    </button>
                </div>
            </form>
        </div>
    );
}
