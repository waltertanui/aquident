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
        const success = await createDailyReport({
            department: "assistant",
            report_date: new Date().toISOString().split('T')[0],
            submitted_by: "Dental Assistant", // In real app, get from auth
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

    const toggleBool = (key: keyof AssistantReportContent) => {
        setFormData(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <PageHeader title="Dental Assistant Daily Report" />

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-6 space-y-8">
                {/* Section 1: Patient Care */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-teal-800">1. Patient Care</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Number of patients assisted</label>
                            <input type="number" className="w-full border rounded px-3 py-2"
                                value={formData.patients_assisted}
                                onChange={e => setFormData({ ...formData, patients_assisted: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Procedures supported</label>
                            <input type="text" className="w-full border rounded px-3 py-2" placeholder="e.g. cleanings, fillings, extractions"
                                value={formData.procedures_supported}
                                onChange={e => setFormData({ ...formData, procedures_supported: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-4 py-2">
                            <label className="text-sm font-medium">Sterilization and preparation completed?</label>
                            <button type="button" onClick={() => toggleBool('sterilization_completed')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.sterilization_completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.sterilization_completed ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Chairside assistance provided</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.chairside_assistance}
                                onChange={e => setFormData({ ...formData, chairside_assistance: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Administrative Tasks */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-teal-800">2. Administrative Tasks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Appointment scheduling/confirmation</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.appointment_scheduling}
                                onChange={e => setFormData({ ...formData, appointment_scheduling: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium">Patient records updated?</label>
                            <button type="button" onClick={() => toggleBool('records_updated')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.records_updated ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.records_updated ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Inventory check (supplies/equipment)</label>
                            <input type="text" className="w-full border rounded px-3 py-2"
                                value={formData.inventory_check}
                                onChange={e => setFormData({ ...formData, inventory_check: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 3: Infection Control & Safety */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-teal-800">3. Infection Control & Safety</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Sterilization log completed?</label>
                            <button type="button" onClick={() => toggleBool('sterilization_log_completed')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.sterilization_log_completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.sterilization_log_completed ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Operatory cleaning between patients?</label>
                            <button type="button" onClick={() => toggleBool('operatory_cleaning')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.operatory_cleaning ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.operatory_cleaning ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">PPE compliance?</label>
                            <button type="button" onClick={() => toggleBool('ppe_compliance')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.ppe_compliance ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.ppe_compliance ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 4: Communication */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-teal-800">4. Communication & Coordination</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Instructions given to patients</label>
                            <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2}
                                value={formData.patient_instructions}
                                onChange={e => setFormData({ ...formData, patient_instructions: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Coordination with dentist/hygienist</label>
                            <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2}
                                value={formData.dentist_coordination}
                                onChange={e => setFormData({ ...formData, dentist_coordination: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Issues requiring follow-up</label>
                            <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2}
                                value={formData.follow_up_issues}
                                onChange={e => setFormData({ ...formData, follow_up_issues: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Section 5: Notes */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-teal-800">5. Notes & Observations</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Challenges faced today</label>
                            <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2}
                                value={formData.challenges}
                                onChange={e => setFormData({ ...formData, challenges: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Suggestions for improvement</label>
                            <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2}
                                value={formData.suggestions}
                                onChange={e => setFormData({ ...formData, suggestions: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Additional comments</label>
                            <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2}
                                value={formData.comments}
                                onChange={e => setFormData({ ...formData, comments: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
                    <button type="button" onClick={() => navigate("/reports")}
                        className="px-6 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isSaving}
                        className="px-8 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors">
                        {isSaving ? "Submitting..." : "Submit Report"}
                    </button>
                </div>
            </form>
        </div>
    );
}
