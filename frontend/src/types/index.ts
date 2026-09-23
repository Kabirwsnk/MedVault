export type UserRole = 'admin' | 'doctor' | 'registration_worker' | 'pharmacy' | 'patient';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  patient_id?: number | null;
  beneficiary_id?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Patient {
  id: number;
  beneficiary_id: string;
  full_name: string;
  phone_number: string;
  aadhar_number: string;
  user_id?: number | null;
  blood_group?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  emergency_contact?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientCreateRequest {
  full_name: string;
  phone_number: string;
  aadhar_number: string;
  blood_group?: string;
  date_of_birth?: string;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  emergency_contact?: string;
}

export interface Prescription {
  id: number;
  medical_record_id: number;
  medicine_id: number;
  medicine_name?: string | null;
  patient_name?: string | null;
  quantity: number;
  dosage: string;
  duration: string;
  dispensed: boolean;
  dispensed_at?: string | null;
  dispensed_by_user_id?: number | null;
  created_at: string;
}


export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id?: number | null;
  diagnosis: string;
  prescription: string; // text representation
  notes?: string | null;
  created_at: string;
  prescriptions?: Prescription[];
}

export interface Medicine {
  id: number;
  medicine_name: string;
  manufacturer: string;
  unit: string;
  strength?: string | null;
  dosage_form?: string | null;
  stock: number;
  created_at: string;
}

export interface InventoryMovement {
  id: number;
  medicine_id: number;
  medicine_name?: string;
  prescription_id?: number | null;
  performed_by_user_id: number;
  movement_type: 'dispense' | 'restock' | 'adjustment';
  quantity: number;
  stock_before: number;
  stock_after: number;
  notes?: string | null;
  created_at: string;
}

export interface DoctorDashboardStats {
  total_patients: number;
  total_records: number;
  total_prescriptions: number;
  recent_records_count?: number;
}

export interface PharmacyDashboardStats {
  total_medicines: number;
  low_stock_count: number;
  critical_stock_count: number;
  total_dispensed_today?: number;
}

export interface PatientDashboard {
  beneficiary_id: string;
  full_name: string;
  phone_number: string;
  blood_group?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  emergency_contact?: string | null;
  medical_records: MedicalRecord[];
  patient?: Patient;
}

export interface BeneficiaryCardData {
  beneficiary_id: string;
  full_name: string;
  phone_number: string;
  blood_group?: string | null;
  gender?: string | null;
  emergency_contact?: string | null;
  total_records: number;
  qr_data_preview?: string;
}
