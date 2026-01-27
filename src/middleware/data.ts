import { getSupabaseClient } from "../lib/supabaseClient";

export type Gender = "M" | "F";
export type TimeRange = 'Today' | 'Weekly' | 'Monthly' | 'Quarterly' | 'All';

// Installment payment tracking
export interface InstallmentPayment {
  id: string;
  amount: number;
  paid_at: string;
  payment_method: "Cash" | "M-Pesa" | "Card" | "Insurance" | "Bank Transfer";
  receipt_no?: string;
  notes?: string;
}

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
  scheme?: string; // ADD: Scheme field
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
  lab_completion_date?: string;
  // ADD: Payment/billing fields
  clinic_cost?: number;
  insurance_amount?: number;
  cash_amount?: number;
  balance?: number;
  invoice_status?: "Paid" | "Paid Less" | "Disputed"; // ADD: Invoice Status
  to_come_again?: boolean;
  // ADD: Price locking for fraud prevention
  price_locked?: boolean;
  price_locked_at?: string;
  price_locked_by?: string;
  // ADD: Installment tracking
  installments?: InstallmentPayment[];
  created_at?: string;
  card_image_url?: string;
  consent_form_url?: string;
  opg_document_url?: string;
  clinic_notes?: string; // Notes from front office sent to clinic
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
  scheme?: string; // ADD: Scheme field
  clinic_notes?: string; // Notes from front office sent to clinic
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
    scheme: row.scheme ?? undefined,
    // ADD: Map new fields
    status: row.status ?? "active",
    procedure: row.procedure ?? [],
    doc_name: row.doc_name ?? undefined,
    lab_materials: row.lab_materials ?? [],
    lab_cost: row.lab_cost ?? 0,
    lab_procedures: row.lab_procedures ?? "",
    lab_notes: row.lab_notes ?? "",
    lab_type: row.lab_type ?? "Internal",
    lab_completion_date: row.lab_completion_date ?? undefined,
    // Payment fields
    clinic_cost: row.clinic_cost ?? 0,
    insurance_amount: row.insurance_amount ?? 0,
    cash_amount: row.cash_amount ?? 0,
    balance: row.balance ?? 0,
    invoice_status: row.invoice_status ?? undefined,
    to_come_again: row.to_come_again ?? false,
    // Price locking fields
    price_locked: row.price_locked ?? false,
    price_locked_at: row.price_locked_at ?? undefined,
    price_locked_by: row.price_locked_by ?? undefined,
    // Installment tracking
    installments: row.installments ?? [],
    card_image_url: row.card_image_url ?? undefined,
    consent_form_url: row.consent_form_url ?? undefined,
    opg_document_url: row.opg_document_url ?? undefined,
    clinic_notes: row.clinic_notes ?? undefined,
    created_at: row.created_at ?? undefined,
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
      scheme: input.scheme,
      clinic_notes: input.clinic_notes,
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
    scheme: row.scheme ?? undefined,
    status: "active",
    procedure: [],
    lab_materials: [],
    lab_cost: 0,
    lab_procedures: "",
    lab_notes: "",
    lab_type: "Internal",
    lab_completion_date: undefined,
    clinic_cost: 0,
    insurance_amount: 0,
    cash_amount: 0,
    balance: 0,
    invoice_status: undefined,
    to_come_again: false,
    clinic_notes: row.clinic_notes ?? input.clinic_notes ?? undefined,
    created_at: row.created_at ?? undefined,
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
  invoice_status: "Paid" | "Paid Less" | "Disputed" | "Not Yet Paid";
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
  invoice_status?: "Paid" | "Paid Less" | "Disputed" | "Not Yet Paid";
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
    invoice_status: row.invoice_status ?? "Not Yet Paid",
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
    invoice_status: input.invoice_status ?? "Not Yet Paid",
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
    invoice_status: row.invoice_status ?? "Not Yet Paid",
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

// ============================================
// OPTICAL PATIENTS (Independent Module)
// ============================================

export interface OpticalPrescription {
  sphere?: string;
  cylinder?: string;
  axis?: string;
  add?: string;
  prism?: string;
  va?: string; // Visual acuity
}

export type OpticalStatus = "pending" | "processing" | "ready" | "collected" | "cancelled";

export interface OpticalPatient {
  id: string;
  name: string;
  gender?: "M" | "F";
  age?: number;
  dob?: string;
  contacts?: string;
  residence?: string;

  // Prescription
  prescription_od?: OpticalPrescription;
  prescription_os?: OpticalPrescription;
  pd?: string;

  // Frame & Lens
  frame_brand?: string;
  frame_model?: string;
  frame_color?: string;
  frame_price?: number;
  lens_type?: string;
  lens_coating?: string;
  lens_price?: number;

  // Order details
  notes?: string;
  status: OpticalStatus;

  // Billing
  total_cost?: number;
  insurance_amount?: number;
  cash_amount?: number;
  installments?: InstallmentPayment[];
  balance?: number;
  price_locked?: boolean;
  price_locked_at?: string;
  price_locked_by?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface OpticalPatientInput {
  name: string;
  gender?: "M" | "F";
  age?: number;
  dob?: string;
  contacts?: string;
  residence?: string;
  prescription_od?: OpticalPrescription;
  prescription_os?: OpticalPrescription;
  pd?: string;
  frame_brand?: string;
  frame_model?: string;
  frame_color?: string;
  frame_price?: number;
  lens_type?: string;
  lens_coating?: string;
  lens_price?: number;
  notes?: string;
  status?: OpticalStatus;
  total_cost?: number;
  insurance_amount?: number;
  cash_amount?: number;
  installments?: InstallmentPayment[];
  balance?: number;
}

const OPTICAL_PATIENTS_TABLE = "optical_patients";

export async function listOpticalPatients(): Promise<OpticalPatient[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(OPTICAL_PATIENTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listOpticalPatients error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? "",
    gender: row.gender ?? undefined,
    age: row.age ?? undefined,
    dob: row.dob ?? undefined,
    contacts: row.contacts ?? undefined,
    residence: row.residence ?? undefined,
    prescription_od: row.prescription_od ?? {},
    prescription_os: row.prescription_os ?? {},
    pd: row.pd ?? undefined,
    frame_brand: row.frame_brand ?? undefined,
    frame_model: row.frame_model ?? undefined,
    frame_color: row.frame_color ?? undefined,
    frame_price: row.frame_price ?? 0,
    lens_type: row.lens_type ?? undefined,
    lens_coating: row.lens_coating ?? undefined,
    lens_price: row.lens_price ?? 0,
    notes: row.notes ?? undefined,
    status: row.status ?? "pending",
    total_cost: row.total_cost ?? 0,
    insurance_amount: row.insurance_amount ?? 0,
    cash_amount: row.cash_amount ?? 0,
    installments: row.installments ?? [],
    balance: row.balance ?? 0,
    price_locked: row.price_locked ?? false,
    price_locked_at: row.price_locked_at ?? undefined,
    price_locked_by: row.price_locked_by ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  }));
}

export async function createOpticalPatient(
  input: OpticalPatientInput
): Promise<OpticalPatient | null> {
  const sb = getSupabaseClient();

  const totalCost = (input.frame_price ?? 0) + (input.lens_price ?? 0);
  const balance = totalCost - (input.insurance_amount ?? 0) - (input.cash_amount ?? 0);

  const payload: any = {
    name: input.name,
    gender: input.gender || null,
    age: input.age || null,
    dob: input.dob || null,
    contacts: input.contacts || null,
    residence: input.residence || null,
    prescription_od: input.prescription_od ?? {},
    prescription_os: input.prescription_os ?? {},
    pd: input.pd || null,
    frame_brand: input.frame_brand || null,
    frame_model: input.frame_model || null,
    frame_color: input.frame_color || null,
    frame_price: input.frame_price ?? 0,
    lens_type: input.lens_type || null,
    lens_coating: input.lens_coating || null,
    lens_price: input.lens_price ?? 0,
    notes: input.notes || null,
    status: input.status ?? "pending",
    total_cost: totalCost,
    insurance_amount: input.insurance_amount ?? 0,
    cash_amount: input.cash_amount ?? 0,
    installments: input.installments ?? [],
    balance: balance,
  };

  const { data, error } = await sb
    .from(OPTICAL_PATIENTS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("createOpticalPatient error:", error);
    return null;
  }

  const row: any = data;
  return {
    id: row.id,
    name: row.name ?? "",
    gender: row.gender ?? undefined,
    age: row.age ?? undefined,
    dob: row.dob ?? undefined,
    contacts: row.contacts ?? undefined,
    residence: row.residence ?? undefined,
    prescription_od: row.prescription_od ?? {},
    prescription_os: row.prescription_os ?? {},
    pd: row.pd ?? undefined,
    frame_brand: row.frame_brand ?? undefined,
    frame_model: row.frame_model ?? undefined,
    frame_color: row.frame_color ?? undefined,
    frame_price: row.frame_price ?? 0,
    lens_type: row.lens_type ?? undefined,
    lens_coating: row.lens_coating ?? undefined,
    lens_price: row.lens_price ?? 0,
    notes: row.notes ?? undefined,
    status: row.status ?? "pending",
    total_cost: row.total_cost ?? 0,
    insurance_amount: row.insurance_amount ?? 0,
    cash_amount: row.cash_amount ?? 0,
    installments: row.installments ?? [],
    balance: row.balance ?? 0,
    price_locked: row.price_locked ?? false,
    price_locked_at: row.price_locked_at ?? undefined,
    price_locked_by: row.price_locked_by ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

export async function updateOpticalPatient(
  id: string,
  updates: Partial<OpticalPatient>
): Promise<boolean> {
  const sb = getSupabaseClient();
  const payload: any = { ...updates, updated_at: new Date().toISOString() };
  delete payload.id;
  delete payload.created_at;

  const { error } = await sb
    .from(OPTICAL_PATIENTS_TABLE)
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("updateOpticalPatient error:", error);
    return false;
  }
  return true;
}

export async function deleteOpticalPatient(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from(OPTICAL_PATIENTS_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteOpticalPatient error:", error);
    return false;
  }
  return true;
}

// ============================================
// DAILY REPORTS
// ============================================

export type ReportDepartment = "assistant" | "lab" | "finance";

export interface AssistantReportContent {
  patients_assisted: number;
  procedures_supported: string;
  sterilization_completed: boolean;
  chairside_assistance: string;
  appointment_scheduling: string;
  records_updated: boolean;
  inventory_check: string;
  sterilization_log_completed: boolean;
  operatory_cleaning: boolean;
  ppe_compliance: boolean;
  patient_instructions: string;
  dentist_coordination: string;
  follow_up_issues: string;
  challenges: string;
  suggestions: string;
  comments: string;
}

export interface LabReportContent {
  cases_processed: number;
  prosthetic_types: string;
  materials_used: string;
  special_instructions: string;
  fit_finish_checks: boolean;
  adjustments_made: string;
  inspection_results: string;
  rework_cases: number;
  equipment_maintenance: string;
  inventory_check: string;
  equipment_issues: string;
  dentist_coordination: string;
  feedback_received: string;
  clarification_pending: string;
  infection_control: boolean;
  waste_disposal_completed: boolean;
  ppe_usage: boolean;
  challenges: string;
  suggestions: string;
  comments: string;
}

export interface FinanceReportContent {
  invoices_processed: number;
  payments_received: number;
  payments_disbursed: number;
  bank_reconciliation: boolean;
  expense_claims: string;
  journal_entries: string;
  ledger_updates: boolean;
  documents_filed: boolean;
  outstanding_items: string;
  tax_entries: string;
  regulatory_filings: boolean;
  internal_controls: string;
  audit_queries: string;
  cash_flow_summary: boolean;
  variance_analysis: string;
  budget_monitoring: string;
  financial_ratios: string;
  reports_shared: boolean;
  department_queries: string;
  follow_ups: string;
  challenges: string;
  suggestions: string;
  comments: string;
}

export interface DailyReport {
  id: string;
  department: ReportDepartment;
  report_date: string;
  submitted_by: string;
  content: AssistantReportContent | LabReportContent | FinanceReportContent;
  created_at?: string;
  updated_at?: string;
}

const DAILY_REPORTS_TABLE = "daily_reports";

export async function listDailyReports(date?: string): Promise<DailyReport[]> {
  const sb = getSupabaseClient();
  let query = sb.from(DAILY_REPORTS_TABLE).select("*").order("created_at", { ascending: false });

  if (date) {
    query = query.eq("report_date", date);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listDailyReports error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    department: row.department,
    report_date: row.report_date,
    submitted_by: row.submitted_by,
    content: row.content,
    created_at: row.created_at,
  }));
}

export async function createDailyReport(report: Omit<DailyReport, "id" | "created_at">): Promise<{ success: boolean; error?: any }> {
  const sb = getSupabaseClient();
  const { error } = await sb.from(DAILY_REPORTS_TABLE).insert(report);

  if (error) {
    console.error("createDailyReport error:", error);
    return { success: false, error };
  }
  return { success: true };
}

// ============================================
// SALES AND INVENTORY
// ============================================

export interface SalesInventoryItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  initial_qty: number;
  price: number;
  status: "In Stock" | "Low" | "Out";
  delivery_date?: string;
  delivery_note_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: string;
  customer_name: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  payment_status: "paid" | "pending" | "paid_less" | "disputed";
  invoice_status?: "not_yet_paid" | "paid" | "paid_less" | "disputed";
  notes?: string;
  created_at?: string;
  // Join data
  item_name?: string;
}

const SALES_INVENTORY_TABLE = "sales_inventory";
const SALES_TABLE = "sales";

export async function listSalesInventory(): Promise<SalesInventoryItem[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(SALES_INVENTORY_TABLE)
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("listSalesInventory error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    qty: row.qty,
    initial_qty: row.initial_qty ?? row.qty, // Fallback if null
    price: row.price,
    status: row.status,
    delivery_date: row.delivery_date ?? undefined,
    delivery_note_url: row.delivery_note_url ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createSalesInventoryItem(item: Omit<SalesInventoryItem, "id" | "created_at" | "updated_at">): Promise<SalesInventoryItem | null> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(SALES_INVENTORY_TABLE)
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error("createSalesInventoryItem error:", error);
    return null;
  }
  return data;
}

export async function updateSalesInventoryItem(id: string, updates: Partial<SalesInventoryItem>): Promise<boolean> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from(SALES_INVENTORY_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("updateSalesInventoryItem error:", error);
    return false;
  }
  return true;
}

export async function deleteSalesInventoryItem(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from(SALES_INVENTORY_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteSalesInventoryItem error:", error);
    return false;
  }
  return true;
}

export async function listSales(): Promise<Sale[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(SALES_TABLE)
    .select(`
      *,
      sales_inventory (
        name
      )
    `)
    .order("sale_date", { ascending: false });

  if (error) {
    console.error("listSales error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    customer_name: row.customer_name,
    item_id: row.item_id,
    quantity: row.quantity,
    unit_price: row.unit_price,
    total_price: row.total_price,
    sale_date: row.sale_date,
    payment_status: row.payment_status ?? "paid",
    invoice_status: row.invoice_status ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    item_name: row.sales_inventory?.name,
  }));
}

export async function updateSale(id: string, updates: Partial<Sale>): Promise<boolean> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from(SALES_TABLE)
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("updateSale error:", error);
    return false;
  }
  return true;
}

export async function createSale(sale: Omit<Sale, "id" | "created_at" | "item_name">): Promise<Sale | null> {
  const sb = getSupabaseClient();

  // 1. Create the sale record
  const { data, error } = await sb
    .from(SALES_TABLE)
    .insert(sale)
    .select()
    .single();

  if (error) {
    console.error("createSale error:", error);
    return null;
  }

  // 2. Update inventory quantity
  const { data: item, error: fetchError } = await sb
    .from(SALES_INVENTORY_TABLE)
    .select("qty")
    .eq("id", sale.item_id)
    .single();

  if (!fetchError && item) {
    const newQty = Math.max(0, item.qty - sale.quantity);
    let newStatus: SalesInventoryItem["status"] = "In Stock";
    if (newQty === 0) newStatus = "Out";
    else if (newQty < 10) newStatus = "Low";

    await sb
      .from(SALES_INVENTORY_TABLE)
      .update({ qty: newQty, status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", sale.item_id);
  }

  return data;
}

// ============================================
// INTERNAL INVENTORY (Clinic Supplies)
// ============================================

export type InternalInventoryStatus = "In Stock" | "Low" | "Out";

export interface InternalInventoryItem {
  id: number;
  name: string;
  sku: string;
  initial_qty: number;
  qty: number;
  status: InternalInventoryStatus;
  delivery_date?: string;
  delivery_note_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InternalInventoryInput {
  name: string;
  sku: string;
  initial_qty: number;
  qty: number;
  status?: InternalInventoryStatus;
  delivery_date?: string;
  delivery_note_url?: string;
}

const INTERNAL_INVENTORY_TABLE = "internal_inventory";

// Helper to compute status based on qty
function computeInventoryStatus(qty: number, initialQty: number): InternalInventoryStatus {
  if (qty === 0) return "Out";
  if (qty <= initialQty * 0.2) return "Low"; // Low when below 20% of initial
  return "In Stock";
}

export async function listInternalInventory(): Promise<InternalInventoryItem[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(INTERNAL_INVENTORY_TABLE)
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("listInternalInventory error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    initial_qty: row.initial_qty ?? row.qty,
    qty: row.qty,
    status: row.status,
    delivery_date: row.delivery_date ?? undefined,
    delivery_note_url: row.delivery_note_url ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createInternalInventoryItem(
  input: InternalInventoryInput
): Promise<InternalInventoryItem | null> {
  const sb = getSupabaseClient();
  const status = computeInventoryStatus(input.qty, input.initial_qty);

  const payload = {
    name: input.name,
    sku: input.sku,
    initial_qty: input.initial_qty,
    qty: input.qty,
    status: status,
    delivery_date: input.delivery_date,
    delivery_note_url: input.delivery_note_url,
  };

  const { data, error } = await sb
    .from(INTERNAL_INVENTORY_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("createInternalInventoryItem error:", error);
    return null;
  }

  return data;
}

export async function updateInternalInventoryItem(
  id: number,
  updates: Partial<InternalInventoryItem>
): Promise<boolean> {
  const sb = getSupabaseClient();
  const payload: any = { ...updates };
  delete payload.id;
  delete payload.created_at;

  // Auto-compute status if qty changed
  if (updates.qty !== undefined) {
    const { data: current } = await sb
      .from(INTERNAL_INVENTORY_TABLE)
      .select("initial_qty")
      .eq("id", id)
      .single();
    if (current) {
      payload.status = computeInventoryStatus(updates.qty, current.initial_qty);
    }
  }

  const { error } = await sb
    .from(INTERNAL_INVENTORY_TABLE)
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("updateInternalInventoryItem error:", error);
    return false;
  }
  return true;
}

export async function deleteInternalInventoryItem(id: number): Promise<boolean> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from(INTERNAL_INVENTORY_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteInternalInventoryItem error:", error);
    return false;
  }
  return true;
}

// ============================================
// INVENTORY REQUESTS (Approval Workflow)
// ============================================

export type InventoryRequestStatus = "pending" | "approved" | "rejected";
export type InventoryRequestSource = "internal_lab" | "external_lab" | "clinic";

export interface InventoryRequest {
  id: number;
  inventory_item_id: number;
  quantity: number;
  source: InventoryRequestSource;
  source_reference?: string;
  patient_name?: string;
  requested_by?: string;
  status: InventoryRequestStatus;
  approved_by?: string;
  rejection_reason?: string;
  created_at?: string;
  approved_at?: string;
  // Joined data
  item_name?: string;
  item_sku?: string;
}

export interface InventoryRequestInput {
  inventory_item_id: number;
  quantity: number;
  source: InventoryRequestSource;
  source_reference?: string;
  patient_name?: string;
  requested_by?: string;
}

const INVENTORY_REQUESTS_TABLE = "inventory_requests";

export async function listInventoryRequests(status?: InventoryRequestStatus): Promise<InventoryRequest[]> {
  const sb = getSupabaseClient();
  let query = sb
    .from(INVENTORY_REQUESTS_TABLE)
    .select(`
      *,
      internal_inventory (
        name,
        sku
      )
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listInventoryRequests error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    inventory_item_id: row.inventory_item_id,
    quantity: row.quantity,
    source: row.source,
    source_reference: row.source_reference,
    patient_name: row.patient_name,
    requested_by: row.requested_by,
    status: row.status,
    approved_by: row.approved_by,
    rejection_reason: row.rejection_reason,
    created_at: row.created_at,
    approved_at: row.approved_at,
    item_name: row.internal_inventory?.name,
    item_sku: row.internal_inventory?.sku,
  }));
}

export async function createInventoryRequest(
  input: InventoryRequestInput
): Promise<InventoryRequest | null> {
  const sb = getSupabaseClient();

  const { data, error } = await sb
    .from(INVENTORY_REQUESTS_TABLE)
    .insert({
      inventory_item_id: input.inventory_item_id,
      quantity: input.quantity,
      source: input.source,
      source_reference: input.source_reference || null,
      patient_name: input.patient_name || null,
      requested_by: input.requested_by || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("createInventoryRequest error:", error);
    return null;
  }

  return data;
}

export async function approveInventoryRequest(
  requestId: number,
  approvedBy: string
): Promise<boolean> {
  const sb = getSupabaseClient();

  // Get the request details
  const { data: request, error: fetchError } = await sb
    .from(INVENTORY_REQUESTS_TABLE)
    .select("inventory_item_id, quantity, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    console.error("approveInventoryRequest fetch error:", fetchError);
    return false;
  }

  if (request.status !== "pending") {
    console.error("Request is not pending");
    return false;
  }

  // Get current inventory item
  const { data: item, error: itemError } = await sb
    .from(INTERNAL_INVENTORY_TABLE)
    .select("qty, initial_qty")
    .eq("id", request.inventory_item_id)
    .single();

  if (itemError || !item) {
    console.error("approveInventoryRequest item fetch error:", itemError);
    return false;
  }

  // Calculate new quantity
  const newQty = Math.max(0, item.qty - request.quantity);
  const newStatus = computeInventoryStatus(newQty, item.initial_qty);

  // Update inventory item
  const { error: updateItemError } = await sb
    .from(INTERNAL_INVENTORY_TABLE)
    .update({ qty: newQty, status: newStatus })
    .eq("id", request.inventory_item_id);

  if (updateItemError) {
    console.error("approveInventoryRequest update item error:", updateItemError);
    return false;
  }

  // Update request status
  const { error: updateRequestError } = await sb
    .from(INVENTORY_REQUESTS_TABLE)
    .update({
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateRequestError) {
    console.error("approveInventoryRequest update request error:", updateRequestError);
    return false;
  }

  return true;
}

export async function rejectInventoryRequest(
  requestId: number,
  rejectedBy: string,
  reason?: string
): Promise<boolean> {
  const sb = getSupabaseClient();

  const { error } = await sb
    .from(INVENTORY_REQUESTS_TABLE)
    .update({
      status: "rejected",
      approved_by: rejectedBy,
      rejection_reason: reason || null,
      approved_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) {
    console.error("rejectInventoryRequest error:", error);
    return false;
  }

  return true;
}
