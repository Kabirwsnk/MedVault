import {
  User,
  TokenResponse,
  Patient,
  PatientCreateRequest,
  MedicalRecord,
  Medicine,
  Prescription,
  InventoryMovement,
  DoctorDashboardStats,
  PharmacyDashboardStats,
  PatientDashboard,
  BeneficiaryCardData,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 45000;
const MAX_SAFE_RETRIES = 2;

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function canRetry(method: string, endpoint: string, hasIdempotencyKey: boolean): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method)
    || (method === 'POST' && endpoint.startsWith('/medical-records/') && hasIdempotencyKey);
}

function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('medvault_token');
  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (['POST', 'PUT', 'PATCH'].includes(method) && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', createIdempotencyKey());
  }

  const url = `${API_BASE}${endpoint}`;
  const shouldRetry = canRetry(method, endpoint, headers.has('Idempotency-Key'));
  let response: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt <= (shouldRetry ? MAX_SAFE_RETRIES : 0); attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      response = await fetch(url, { ...options, headers, signal: controller.signal });
      if (response.ok || !shouldRetry || ![408, 429, 500, 502, 503, 504].includes(response.status)) {
        break;
      }
    } catch (error) {
      lastError = error;
      if (!shouldRetry || attempt === MAX_SAFE_RETRIES) {
        throw new ApiError('The server could not be reached. Your work was not confirmed as saved.', 0, error);
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  if (!response) {
    throw new ApiError('The server could not be reached. Your work was not confirmed as saved.', 0, lastError);
  }

  if (response.status === 401) {
    // If unauthorized and we're not already on login, we can trigger event
    if (!endpoint.includes('/auth/login')) {
      window.dispatchEvent(new CustomEvent('medvault_unauthorized'));
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorData: any = null;
    try {
      errorData = await response.json();
      if (typeof errorData?.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        errorMessage = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      }
    } catch {
      // not json
    }
    throw new ApiError(errorMessage, response.status, errorData);
  }

  if (response.headers.get('Content-Type')?.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}

export const api = {
  async health(): Promise<{ status: string; database: string }> {
    return request('/health');
  },
  // Auth endpoints
  async login(username: string, password: string): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return request<TokenResponse>('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  },

  async enrollPatient(data: { email: string; password: string; beneficiary_id: string }): Promise<any> {
    return request('/auth/patient-enrollment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async registerStaff(data: { email: string; password: string; role: string }): Promise<User> {
    return request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<User> {
    return request<User>('/users/me');
  },

  // Patients
  async getPatients(): Promise<Patient[]> {
    return request<Patient[]>('/patients/');
  },

  async searchPatients(name: string): Promise<Patient[]> {
    return request<Patient[]>(`/patients/search?name=${encodeURIComponent(name)}`);
  },

  async createPatient(data: PatientCreateRequest): Promise<Patient> {
    return request<Patient>('/patients/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPatient(beneficiary_id: string): Promise<Patient> {
    return request<Patient>(`/patients/${beneficiary_id}`);
  },

  async updatePatient(beneficiary_id: string, data: Partial<PatientCreateRequest>): Promise<Patient> {
    return request<Patient>(`/patients/${beneficiary_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },


  async getPatientProfile(beneficiary_id: string): Promise<Patient> {
    return request<Patient>(`/patients/profile/${beneficiary_id}`);
  },

  async getPatientTimeline(beneficiary_id: string): Promise<any[]> {
    return request<any[]>(`/patients/timeline/${beneficiary_id}`);
  },

  async getBeneficiaryCard(beneficiary_id: string): Promise<BeneficiaryCardData> {
    return request<BeneficiaryCardData>(`/patients/card/${beneficiary_id}`);
  },

  getQrCodeUrl(beneficiary_id: string): string {
    return `${API_BASE}/patients/card/${beneficiary_id}/qr`;
  },

  getPdfCardUrl(beneficiary_id: string): string {
    return `${API_BASE}/patients/card/${beneficiary_id}/pdf`;
  },

  // Medical Records
  async createMedicalRecord(beneficiary_id: string, data: { diagnosis: string; prescription: string; notes?: string }, idempotencyKey?: string): Promise<MedicalRecord> {
    return request<MedicalRecord>(`/medical-records/${beneficiary_id}`, {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      body: JSON.stringify(data),
    });
  },

  async getMedicalRecords(beneficiary_id: string): Promise<MedicalRecord[]> {
    return request<MedicalRecord[]>(`/medical-records/${beneficiary_id}`);
  },

  // Medicines & Inventory
  async getMedicines(): Promise<Medicine[]> {
    return request<Medicine[]>('/medicines/');
  },

  async getLowStock(): Promise<Medicine[]> {
    return request<Medicine[]>('/medicines/low-stock');
  },

  async getCriticalStock(): Promise<Medicine[]> {
    return request<Medicine[]>('/medicines/critical-stock');
  },

  async addMedicine(data: { medicine_name: string; manufacturer: string; unit: string; strength?: string; dosage_form?: string; stock: number }): Promise<Medicine> {
    return request<Medicine>('/medicines/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async restockMedicine(id: number, quantity: number): Promise<Medicine> {
    return request<Medicine>(`/medicines/${id}/restock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    return request<InventoryMovement[]>('/medicines/movements/history');
  },

  // Prescriptions
  async createPrescription(medical_record_id: number, data: { medicine_id: number; quantity: number; dosage: string; duration: string }): Promise<Prescription> {
    return request<Prescription>(`/prescriptions/${medical_record_id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPrescriptions(): Promise<Prescription[]> {
    return request<Prescription[]>('/prescriptions/');
  },

  async dispensePrescription(id: number): Promise<any> {
    return request(`/prescriptions/${id}/dispense`, {
      method: 'POST',
    });
  },

  // Dashboards
  async getDoctorStats(): Promise<DoctorDashboardStats> {
    return request<DoctorDashboardStats>('/dashboard/stats');
  },

  async getRecentPatients(): Promise<Patient[]> {
    return request<Patient[]>('/dashboard/recent-patients');
  },

  async getRecentRecords(): Promise<MedicalRecord[]> {
    return request<MedicalRecord[]>('/dashboard/recent-records');
  },

  async getPharmacyStats(): Promise<PharmacyDashboardStats> {
    return request<PharmacyDashboardStats>('/pharmacy-dashboard/stats');
  },

  async getPatientDashboard(beneficiary_id: string): Promise<PatientDashboard> {
    return request<PatientDashboard>(`/patient-dashboard/${beneficiary_id}`);
  },

  // AI & Clinical Intelligence
  async checkSymptoms(symptoms: string): Promise<{ symptoms: string; possible_conditions: string[]; advice: string }> {
    return request(`/ai/symptom-checker?symptoms=${encodeURIComponent(symptoms)}`);
  },

  async chatAI(beneficiary_id: string, question: string): Promise<{ answer: string; beneficiary_id: string }> {
    return request(`/ai/chat?beneficiary_id=${encodeURIComponent(beneficiary_id)}&question=${encodeURIComponent(question)}`);
  },

  async getAISummary(beneficiary_id: string): Promise<{ summary: string; beneficiary_id: string }> {
    return request(`/ai/summary/${encodeURIComponent(beneficiary_id)}`);
  },
};
