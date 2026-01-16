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
        const success = await createDailyReport({
            department: "lab",
            report_date: new Date().toISOString().split('T')[0],
            submitted_by: "Lab Technologist",
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

    const toggleBool = (key: keyof LabReportContent) => {
        setFormData(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <PageHeader title="Lab Technologist Daily Report" />

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-6 space-y-8 text-sm">
                {/* Section 1: Case Work */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-blue-800 font-medium">1. Case Work Completed</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium mb-1">Number of cases processed</label>
                            <input type="number" className="w-full border rounded px-3 py-2"
                                value={formData.cases_processed}
                                onChange={e => setFormData({ ...formData, cases_processed: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Types of prosthetics fabricated (crowns, bridges, dentures...)</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.prosthetic_types}
                                onChange={e => setFormData({ ...formData, prosthetic_types: e.target.value })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Materials used</label>
                            <input type="text" className="w-full border rounded px-3 py-2" placeholder="ceramic, acrylic, metal, composite"
                                value={formData.materials_used}
                                onChange={e => setFormData({ ...formData, materials_used: e.target.value })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Special instructions followed</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.special_instructions}
                                onChange={e => setFormData({ ...formData, special_instructions: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Quality Control */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-blue-800 font-medium">2. Quality Control</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 py-2">
                            <label className="font-medium">Fit and finish checks performed?</label>
                            <button type="button" onClick={() => toggleBool('fit_finish_checks')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.fit_finish_checks ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.fit_finish_checks ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Cases requiring rework</label>
                            <input type="number" className="w-full border rounded px-3 py-2"
                                value={formData.rework_cases}
                                onChange={e => setFormData({ ...formData, rework_cases: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Adjustments made / Final inspection results</label>
                            <textarea className="w-full border rounded px-3 py-2" rows={2}
                                value={formData.adjustments_made}
                                onChange={e => setFormData({ ...formData, adjustments_made: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 3: Equipment */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-blue-800 font-medium">3. Equipment & Materials</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block font-medium mb-1">Equipment used and maintenance performed</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.equipment_maintenance}
                                onChange={e => setFormData({ ...formData, equipment_maintenance: e.target.value })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Inventory check (materials, tools, consumables)</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.inventory_check}
                                onChange={e => setFormData({ ...formData, inventory_check: e.target.value })} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Issues with equipment or supplies</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.equipment_issues}
                                onChange={e => setFormData({ ...formData, equipment_issues: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 4: Collaboration */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-blue-800 font-medium">4. Collaboration & Communication</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="block font-medium mb-1">Coordination with dentists/orthodontists</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.dentist_coordination}
                                onChange={e => setFormData({ ...formData, dentist_coordination: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block font-medium mb-1">Feedback received</label>
                                <input type="text" className="w-full border rounded px-3 py-2"
                                    value={formData.feedback_received}
                                    onChange={e => setFormData({ ...formData, feedback_received: e.target.value })} />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Cases pending clarification</label>
                                <input type="text" className="w-full border rounded px-3 py-2"
                                    value={formData.clarification_pending}
                                    onChange={e => setFormData({ ...formData, clarification_pending: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 5: Safety */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-blue-800 font-medium">5. Safety & Compliance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-medium">Infection control measures followed?</label>
                            <button type="button" onClick={() => toggleBool('infection_control')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.infection_control ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.infection_control ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-medium">Waste disposal log completed?</label>
                            <button type="button" onClick={() => toggleBool('waste_disposal_completed')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.waste_disposal_completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.waste_disposal_completed ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-medium">PPE usage compliant?</label>
                            <button type="button" onClick={() => toggleBool('ppe_usage')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.ppe_usage ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.ppe_usage ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 6: Notes */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-blue-800 font-medium">6. Notes & Observations</h3>
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
                        className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {isSaving ? "Submitting..." : "Submit Report"}
                    </button>
                </div>
            </form>
        </div>
    );
}
