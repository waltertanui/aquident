import { getSupabaseClient } from "../lib/supabaseClient";

export type Gender = "M" | "F";

export interface PatientRecord {
  no: number;
  old?: number;
  newId?: number;
  name: string;
  g: Gender;
  a: number;
  dob?: string;
  contacts: string;
  res: string;
  op: string;
  dr?: string;
  ins?: string;
  // ADD: Treatment status fields
  status?: "active" | "completed" | "lab";
  procedure?: string[];
  doc_name?: string;
  // ADD: Lab specific fields
  lab_materials?: any[];
  lab_cost?: number;
  lab_procedures?: string;
  lab_notes?: string;
  lab_type?: "Internal" | "External";
  // ADD: Payment/billing fields
  clinic_cost?: number;
  insurance_amount?: number;
  cash_amount?: number;
  balance?: number;
  to_come_again?: boolean;
}

export interface WalkinInput {
  name: string;
  g: Gender;
  a: number;
  contacts: string;
  res: string;
  op: string;
  dr?: string;
  ins?: string;
}

const WALKINS_TABLE = "walkins";

export async function listWalkins(): Promise<PatientRecord[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(WALKINS_TABLE)
    .select("*")
    .order("no", { ascending: true });

  if (error) {
    console.error("listWalkins error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    no: row.no ?? row.id,
    old: row.old ?? undefined,
    newId: row.newId ?? undefined,
    name: row.name,
    g: row.g,
    a: row.a,
    dob: row.dob ?? undefined,
    contacts: row.contacts,
    res: row.res,
    op: row.op,
    dr: row.dr ?? undefined,
    ins: row.ins ?? undefined,
    // ADD: Map new fields
    status: row.status ?? "active",
    procedure: row.procedure ?? [],
    doc_name: row.doc_name ?? undefined,
    lab_materials: row.lab_materials ?? [],
    lab_cost: row.lab_cost ?? 0,
    lab_procedures: row.lab_procedures ?? "",
    lab_notes: row.lab_notes ?? "",
    lab_type: row.lab_type ?? "Internal",
    // Payment fields
    clinic_cost: row.clinic_cost ?? 0,
    insurance_amount: row.insurance_amount ?? 0,
    cash_amount: row.cash_amount ?? 0,
    balance: row.balance ?? 0,
    to_come_again: row.to_come_again ?? false,
  }));
}

export async function createWalkin(input: WalkinInput, dob?: string): Promise<PatientRecord> {
  const sb = getSupabaseClient();
  const payload: any = { ...input };
  if (dob) payload.dob = dob;

  const { data, error } = await sb
    .from(WALKINS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("createWalkin error:", error);
    // Fallback: fabricate a record with pseudo 'no'
    const nowNo = Date.now();
    return {
      no: nowNo,
      name: input.name,
      g: input.g,
      a: input.a,
      contacts: input.contacts,
      res: input.res,
      op: input.op,
      dr: input.dr,
      ins: input.ins,
      dob,
      newId: nowNo,
    };
  }

  const row: any = data;
  return {
    no: row.no ?? row.id,
    old: row.old ?? undefined,
    newId: row.newId ?? row.no ?? row.id,
    name: row.name,
    g: row.g,
    a: row.a,
    dob: row.dob ?? dob ?? undefined,
    contacts: row.contacts,
    res: row.res,
    op: row.op,
    dr: row.dr ?? undefined,
    ins: row.ins ?? undefined,
    status: "active",
    procedure: [],
    lab_materials: [],
    lab_cost: 0,
    lab_procedures: "",
    lab_notes: "",
    lab_type: "Internal",
    clinic_cost: 0,
    insurance_amount: 0,
    cash_amount: 0,
    balance: 0,
    to_come_again: false,
  };
}

export async function updateWalkin(
  no: number,
  updates: Partial<PatientRecord>
): Promise<boolean> {
  const sb = getSupabaseClient();

  // Format specific fields for DB if needed
  const payload: any = { ...updates };
  // remove fields we don't want to inadvertently patch if passed loosely
  delete payload.no;
  delete payload.newId;

  const { error } = await sb
    .from(WALKINS_TABLE)
    .update(payload)
    .eq("no", no);

  if (error) {
    console.error("updateWalkin error:", error);
    return false;
  }
  return true;
}

// ============================================
// APPOINTMENTS
// ============================================

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: number;
  patient_no: number;
  patient_name: string;
  patient_contacts?: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time?: string; // HH:MM
  reason?: string;
  notes?: string;
  status: AppointmentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentInput {
  patient_no: number;
  patient_name: string;
  patient_contacts?: string;
  appointment_date: string;
  appointment_time?: string;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
}

const APPOINTMENTS_TABLE = "appointments";

export async function listAppointments(): Promise<Appointment[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(APPOINTMENTS_TABLE)
    .select("*")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (error) {
    console.error("listAppointments error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    patient_no: row.patient_no,
    patient_name: row.patient_name,
    patient_contacts: row.patient_contacts ?? undefined,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time ?? undefined,
    reason: row.reason ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status ?? "scheduled",
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  }));
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment | null> {
  const sb = getSupabaseClient();
  const payload: any = {
    ...input,
    status: input.status ?? "scheduled",
    // Send null instead of 0 for patient_no to avoid FK constraint violation
    patient_no: input.patient_no && input.patient_no > 0 ? input.patient_no : null,
  };

  const { data, error } = await sb
    .from(APPOINTMENTS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("createAppointment error:", error);
    return null;
  }

  const row: any = data;
  return {
    id: row.id,
    patient_no: row.patient_no,
    patient_name: row.patient_name,
    patient_contacts: row.patient_contacts ?? undefined,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time ?? undefined,
    reason: row.reason ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status ?? "scheduled",
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

export async function updateAppointment(
  id: number,
  updates: Partial<Appointment>
): Promise<boolean> {
  const sb = getSupabaseClient();
  const payload: any = { ...updates };
  delete payload.id;
  delete payload.created_at;

  const { error } = await sb
    .from(APPOINTMENTS_TABLE)
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("updateAppointment error:", error);
    return false;
  }
  return true;
}

export async function deleteAppointment(id: number): Promise<boolean> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from(APPOINTMENTS_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteAppointment error:", error);
    return false;
  }
  return true;
}

// ============================================
// EXTERNAL LAB WORKS
// ============================================

export type ExternalLabOrderStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "declined"
  | "inProduction"
  | "completed";

export type QuoteStatus = "pending" | "awaitingApproval" | "approved" | "rejected";

export interface OrderItem {
  product: string;
  material: string;
  quantity: number;
  specs: string;
}

export interface ExternalLabOrderQuote {
  subtotal: number;
  tax: number;
  total: number;
  status: QuoteStatus;
}

export interface ExternalLabOrder {
  id: string;
  doctor_name: string;
  institution: string;
  expected_date?: string;
  shipping_method: string;
  notes?: string;
  lab_procedures?: string;
  lab_cost?: number;
  items: OrderItem[];
  quote: ExternalLabOrderQuote;
  status: ExternalLabOrderStatus;
  capacity_ok?: boolean;
  last_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalLabOrderInput {
  id: string;
  doctor_name: string;
  institution: string;
  expected_date?: string;
  shipping_method?: string;
  notes?: string;
  lab_procedures?: string;
  lab_cost?: number;
  items?: OrderItem[];
  quote?: ExternalLabOrderQuote;
  status?: ExternalLabOrderStatus;
  capacity_ok?: boolean;
  last_message?: string;
}

const EXTERNAL_LAB_WORKS_TABLE = "external_lab_works";

export async function listExternalLabOrders(): Promise<ExternalLabOrder[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(EXTERNAL_LAB_WORKS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listExternalLabOrders error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    doctor_name: row.doctor_name ?? "",
    institution: row.institution ?? "",
    expected_date: row.expected_date ?? undefined,
    shipping_method: row.shipping_method ?? "Courier",
    notes: row.notes ?? undefined,
    lab_procedures: row.lab_procedures ?? undefined,
    lab_cost: row.lab_cost ?? 0,
    items: row.items ?? [],
    quote: row.quote ?? { subtotal: 0, tax: 0, total: 0, status: "pending" },
    status: row.status ?? "draft",
    capacity_ok: row.capacity_ok ?? undefined,
    last_message: row.last_message ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  }));
}

export async function createExternalLabOrder(
  input: ExternalLabOrderInput
): Promise<ExternalLabOrder | null> {
  const sb = getSupabaseClient();
  const payload: any = {
    id: input.id,
    doctor_name: input.doctor_name,
    institution: input.institution,
    expected_date: input.expected_date || null,
    shipping_method: input.shipping_method ?? "Courier",
    notes: input.notes || null,
    lab_procedures: input.lab_procedures || null,
    lab_cost: input.lab_cost ?? 0,
    items: input.items ?? [],
    quote: input.quote ?? { subtotal: 0, tax: 0, total: 0, status: "pending" },
    status: input.status ?? "draft",
    capacity_ok: input.capacity_ok ?? null,
    last_message: input.last_message || null,
  };

  const { data, error } = await sb
    .from(EXTERNAL_LAB_WORKS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("createExternalLabOrder error:", error);
    return null;
  }

  const row: any = data;
  return {
    id: row.id,
    doctor_name: row.doctor_name ?? "",
    institution: row.institution ?? "",
    expected_date: row.expected_date ?? undefined,
    shipping_method: row.shipping_method ?? "Courier",
    notes: row.notes ?? undefined,
    lab_procedures: row.lab_procedures ?? undefined,
    lab_cost: row.lab_cost ?? 0,
    items: row.items ?? [],
    quote: row.quote ?? { subtotal: 0, tax: 0, total: 0, status: "pending" },
    status: row.status ?? "draft",
    capacity_ok: row.capacity_ok ?? undefined,
    last_message: row.last_message ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

export async function updateExternalLabOrder(
  id: string,
  updates: Partial<ExternalLabOrder>
): Promise<boolean> {
  const sb = getSupabaseClient();
  const payload: any = { ...updates };
  delete payload.id;
  delete payload.created_at;

  const { error } = await sb
    .from(EXTERNAL_LAB_WORKS_TABLE)
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("updateExternalLabOrder error:", error);
    return false;
  }
  return true;
}

export async function deleteExternalLabOrder(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from(EXTERNAL_LAB_WORKS_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteExternalLabOrder error:", error);
    return false;
  }
  return true;
}