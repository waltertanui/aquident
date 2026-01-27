
import React, { useState } from 'react';
import type { PatientRecord } from '../middleware/data';
import CompletedLabWorksTable from './CompletedLabWorksTable';

interface AllRecordsProps {
    patients: PatientRecord[]; // These are already filtered by the parent's search query
    allPatients: PatientRecord[]; // All patients for determining New/Old status (unfiltered by time)
    query: string;
    onShowForm: () => void;
    // onSelectExisting: (p: PatientRecord) => void;
    onSetTempName: (name: string) => void;
    onUpdatePatient?: (patient: PatientRecord) => void;
}

const AllRecords: React.FC<AllRecordsProps> = ({
    patients,
    allPatients,
    query,
    onShowForm,
    onSetTempName,
    onUpdatePatient
}) => {
    const [activeTab, setActiveTab] = useState<'patients' | 'lab'>('patients');

    // Count visits per contact number to determine New vs Old status
    // Use allPatients (unfiltered) to get accurate historical visit count
    // A patient is "Old" if they have visited 2+ times (same contact number appears more than once)
    const visitCountByContact = React.useMemo(() => {
        const counts: Record<string, number> = {};
        allPatients.forEach(p => {
            if (p.contacts) {
                const key = p.contacts.trim().toLowerCase();
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        return counts;
    }, [allPatients]);

    // Determine if patient is returning (Old) or first-time (New)
    const isReturningPatient = (p: PatientRecord): boolean => {
        if (!p.contacts) return false;
        const key = p.contacts.trim().toLowerCase();
        return (visitCountByContact[key] || 0) >= 2;
    };

    // Helper for age (duplicate from FrontOffice or just use p.a if simple, but FrontOffice had computation)
    // We'll re-implement the simple computation or just display p.a if dob missing.
    // Ideally this logic should be in the model or a shared helper. 
    // For now, I'll allow the table to just show 'a' or simple calc.
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

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('patients')}
                    className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'patients'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    All Patients
                </button>
                <button
                    onClick={() => setActiveTab('lab')}
                    className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'lab'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Billing
                </button>
            </div>

            {/* Content */}
            <div className="rounded-lg border border-slate-200 bg-white">
                {activeTab === 'patients' && (
                    <div className="overflow-x-auto rounded-md">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left border-b">
                                    <th className="p-3 font-medium text-gray-600">NO</th>
                                    <th className="p-3 font-medium text-gray-600">STATUS</th>
                                    <th className="p-3 font-medium text-gray-600">NAME</th>
                                    <th className="p-3 font-medium text-gray-600">G</th>
                                    <th className="p-3 font-medium text-gray-600">AGE</th>
                                    <th className="p-3 font-medium text-gray-600">DOB</th>
                                    <th className="p-3 font-medium text-gray-600">CONTACTS</th>
                                    <th className="p-3 font-medium text-gray-600">RES</th>
                                    <th className="p-3 font-medium text-gray-600">SCHEME</th>
                                    <th className="p-3 font-medium text-gray-600">Insurance</th>
                                    <th className="p-3 font-medium text-gray-600">NOTES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {patients.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-8 text-center text-gray-500">
                                            No matches for "{query}".
                                            {query && (
                                                <button
                                                    type="button"
                                                    className="ml-2 text-blue-600 underline"
                                                    onClick={() => {
                                                        onSetTempName(query);
                                                        onShowForm();
                                                    }}
                                                >
                                                    Create "{query}" as New Walk-in
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    patients.map((p) => (
                                        <tr key={p.no} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3">{p.no}</td>
                                            <td className="p-3">
                                                {isReturningPatient(p) ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                                                        Old
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
                                                        New
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 font-medium text-slate-700">{p.name}</td>
                                            <td className="p-3">{p.g}</td>
                                            <td className="p-3">{getAge(p)}</td>
                                            <td className="p-3 text-gray-500">{formatDOB(p.dob)}</td>
                                            <td className="p-3">{p.contacts}</td>
                                            <td className="p-3">{p.res}</td>
                                            <td className="p-3">{p.scheme || '—'}</td>
                                            <td className="p-3">{p.op}</td>
                                            <td className="p-3 text-gray-500 max-w-xs truncate" title={p.clinic_notes || ''}>{p.clinic_notes || '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'lab' && (
                    <CompletedLabWorksTable
                        patients={patients.filter(p => p.status === 'completed')}
                        onUpdatePatient={onUpdatePatient}
                    />
                )}
            </div>
        </div>
    );
};

export default AllRecords;
