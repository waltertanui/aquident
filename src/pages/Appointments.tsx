import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader";
import Card from "../ui/Card";
import {
  listWalkins,
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type PatientRecord,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
} from "../middleware/data";

function Appointments() {
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ['walkins'],
    queryFn: listWalkins,
  });

  const { data: appointments = [], isLoading: loading } = useQuery({
    queryKey: ['appointments'],
    queryFn: listAppointments,
  });

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"followup" | "appointments">("appointments");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<AppointmentInput>({
    patient_no: 0,
    patient_name: "",
    patient_contacts: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
    status: "scheduled",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Filter patients who need to come again
  const toComeAgainPatients = useMemo(() => {
    const filtered = patients.filter((p) => p.to_come_again === true);
    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.contacts.includes(q) ||
        String(p.no).includes(q)
    );
  }, [patients, query]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (a) =>
        a.patient_name.toLowerCase().includes(q) ||
        a.patient_contacts?.includes(q) ||
        String(a.patient_no).includes(q)
    );
  }, [appointments, query]);

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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const styles: Record<AppointmentStatus, string> = {
      scheduled: "bg-blue-100 text-blue-700",
      confirmed: "bg-green-100 text-green-700",
      completed: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
      no_show: "bg-amber-100 text-amber-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setFormData({
      patient_no: 0,
      patient_name: "",
      patient_contacts: "",
      appointment_date: "",
      appointment_time: "",
      reason: "",
      notes: "",
      status: "scheduled",
    });
    setShowForm(true);
  };

  const handleEditAppointment = (apt: Appointment) => {
    setEditingAppointment(apt);
    setFormData({
      patient_no: apt.patient_no,
      patient_name: apt.patient_name,
      patient_contacts: apt.patient_contacts || "",
      appointment_date: apt.appointment_date,
      appointment_time: apt.appointment_time || "",
      reason: apt.reason || "",
      notes: apt.notes || "",
      status: apt.status,
    });
    setShowForm(true);
  };

  const handleScheduleFromFollowup = (p: PatientRecord) => {
    setEditingAppointment(null);
    setFormData({
      patient_no: p.no,
      patient_name: p.name,
      patient_contacts: p.contacts,
      appointment_date: "",
      appointment_time: "",
      reason: p.procedure?.join(", ") || "",
      notes: "",
      status: "scheduled",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.patient_name || !formData.appointment_date) {
      alert("Please fill in required fields (Patient Name, Date)");
      return;
    }

    setIsSaving(true);
    try {
      if (editingAppointment) {
        // Update existing
        await updateAppointment(editingAppointment.id, formData);
      } else {
        // Create new
        await createAppointment(formData);
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save appointment:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    const success = await deleteAppointment(id);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  };

  const handleStatusChange = async (id: number, newStatus: AppointmentStatus) => {
    const success = await updateAppointment(id, { status: newStatus });
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Appointments"
        action={{ label: "New Appointment", onClick: handleNewAppointment }}
      />

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-2 text-sm font-medium transition-colors ${activeTab === "appointments"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Scheduled Appointments
        </button>
        <button
          onClick={() => setActiveTab("followup")}
          className={`pb-2 text-sm font-medium transition-colors ${activeTab === "followup"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Patients to Come Again
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by NO, Name or Contacts"
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-64"
        />
      </div>

      {/* Appointments Table */}
      {activeTab === "appointments" && (
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Scheduled Appointments</h2>

            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left border-b">
                      <th className="p-3 font-medium text-gray-600">ID</th>
                      <th className="p-3 font-medium text-gray-600">DATE</th>
                      <th className="p-3 font-medium text-gray-600">TIME</th>
                      <th className="p-3 font-medium text-gray-600">PATIENT</th>
                      <th className="p-3 font-medium text-gray-600">CONTACTS</th>
                      <th className="p-3 font-medium text-gray-600">REASON</th>
                      <th className="p-3 font-medium text-gray-600">STATUS</th>
                      <th className="p-3 font-medium text-gray-600">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          No appointments found.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium">{apt.id}</td>
                          <td className="p-3">{formatDate(apt.appointment_date)}</td>
                          <td className="p-3">{formatTime(apt.appointment_time)}</td>
                          <td className="p-3 font-medium text-slate-700">{apt.patient_name}</td>
                          <td className="p-3">{apt.patient_contacts || "—"}</td>
                          <td className="p-3 text-gray-500 max-w-[200px] truncate">
                            {apt.reason || "—"}
                          </td>
                          <td className="p-3">
                            <select
                              value={apt.status}
                              onChange={(e) => handleStatusChange(apt.id, e.target.value as AppointmentStatus)}
                              className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${getStatusBadge(apt.status)}`}
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="no_show">No Show</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAppointment(apt)}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(apt.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && (
              <div className="text-sm text-gray-500">
                Showing {filteredAppointments.length} appointment(s)
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Follow-up Patients Table */}
      {activeTab === "followup" && (
        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Patients to Come Again</h2>
              <p className="text-sm text-gray-500">
                Click "Schedule" to create an appointment for follow-up patients
              </p>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left border-b">
                      <th className="p-3 font-medium text-gray-600">NO</th>
                      <th className="p-3 font-medium text-gray-600">PATIENT</th>
                      <th className="p-3 font-medium text-gray-600">G</th>
                      <th className="p-3 font-medium text-gray-600">AGE</th>
                      <th className="p-3 font-medium text-gray-600">DOB</th>
                      <th className="p-3 font-medium text-gray-600">CONTACTS</th>
                      <th className="p-3 font-medium text-gray-600">RESIDENCE</th>
                      <th className="p-3 font-medium text-gray-600">PROCEDURES</th>
                      <th className="p-3 font-medium text-gray-600">BALANCE</th>
                      <th className="p-3 font-medium text-gray-600">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {toComeAgainPatients.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-500">
                          No patients marked to come again.
                        </td>
                      </tr>
                    ) : (
                      toComeAgainPatients.map((p) => (
                        <tr key={p.no} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium">{p.no}</td>
                          <td className="p-3 font-medium text-slate-700">{p.name}</td>
                          <td className="p-3">{p.g}</td>
                          <td className="p-3">{getAge(p)}</td>
                          <td className="p-3 text-gray-500">{formatDOB(p.dob)}</td>
                          <td className="p-3">{p.contacts}</td>
                          <td className="p-3">{p.res}</td>
                          <td className="p-3 text-gray-500 max-w-[200px] truncate">
                            {p.procedure?.join(", ") || "—"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-semibold ${(p.balance || 0) > 0
                                ? "text-red-600"
                                : (p.balance || 0) < 0
                                  ? "text-green-600"
                                  : "text-gray-600"
                                }`}
                            >
                              {(p.balance || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleScheduleFromFollowup(p)}
                              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                            >
                              Schedule
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && (
              <div className="text-sm text-gray-500">
                Showing {toComeAgainPatients.length} patient(s) needing follow-up
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Appointment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAppointment ? "Edit Appointment" : "New Appointment"}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Patient Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, patient_name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Patient Contacts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contacts
                </label>
                <input
                  type="text"
                  value={formData.patient_contacts || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, patient_contacts: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, appointment_date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.appointment_time || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, appointment_time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={formData.reason || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Follow-up, Check-up, Procedure"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || "scheduled"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as AppointmentStatus }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingAppointment ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;