
import React, { useState } from 'react';
import type { PatientRecord } from '../middleware/data';
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

const CompletedLabWorksTable: React.FC<CompletedLabWorksTableProps> = ({ patients, onUpdatePatient }) => {
    const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
    const [formData, setFormData] = useState<EditFormData>({
        clinic_cost: 0,
        insurance_amount: 0,
        cash_amount: 0,
        to_come_again: false
    });
    const [isSaving, setIsSaving] = useState(false);

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

    const calculateBalance = (p: PatientRecord) => {
        const labCost = p.lab_cost || 0;
        const clinicCost = p.clinic_cost || 0;
        const insurance = p.insurance_amount || 0;
        const cash = p.cash_amount || 0;
        return (labCost + clinicCost) - insurance - cash;
    };

    const calculateFormBalance = () => {
        if (!editingPatient) return 0;
        const labCost = editingPatient.lab_cost || 0;
        return (labCost + formData.clinic_cost) - formData.insurance_amount - formData.cash_amount;
    };

    const handleEditClick = (p: PatientRecord) => {
        setEditingPatient(p);
        setFormData({
            clinic_cost: p.clinic_cost || 0,
            insurance_amount: p.insurance_amount || 0,
            cash_amount: p.cash_amount || 0,
            to_come_again: p.to_come_again || false
        });
    };

    const handleCloseModal = () => {
        setEditingPatient(null);
        setFormData({ clinic_cost: 0, insurance_amount: 0, cash_amount: 0, to_come_again: false });
    };

    const handleSave = async () => {
        if (!editingPatient) return;

        setIsSaving(true);
        try {
            const balance = calculateFormBalance();
            const updates = {
                ...formData,
                balance
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
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">BALANCE</th>
                            <th className="p-3 font-medium text-gray-600 bg-blue-50">COME AGAIN</th>
                            <th className="p-3 font-medium text-gray-600">ACTION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {patients.length === 0 ? (
                            <tr>
                                <td colSpan={21} className="p-4 text-center text-slate-500">No completed lab works.</td>
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
                                    </td>
                                    <td className="p-3 bg-blue-50/30 text-right font-medium">
                                        {(p.insurance_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="p-3 bg-blue-50/30 text-right font-medium">
                                        {(p.cash_amount || 0).toLocaleString()}
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
                                        <button
                                            onClick={() => handleEditClick(p)}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Edit
                                        </button>
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
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Edit Payment Details
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Patient: <span className="font-medium text-gray-700">{editingPatient.name}</span>
                            </p>
                        </div>

                        <div className="px-6 py-4 space-y-4">
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
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter clinic cost"
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
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter insurance amount"
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
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter cash amount"
                                />
                            </div>

                            {/* Balance (auto-calculated) */}
                            <div className={`flex justify-between items-center py-2 px-3 rounded ${calculateFormBalance() > 0 ? 'bg-red-50' : calculateFormBalance() < 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                                <span className="text-sm font-medium text-gray-700">Balance</span>
                                <span className={`font-bold text-lg ${calculateFormBalance() > 0 ? 'text-red-600' : calculateFormBalance() < 0 ? 'text-green-600' : 'text-gray-600'}`}>
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

                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
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
            )}
        </>
    );
};

export default CompletedLabWorksTable;
