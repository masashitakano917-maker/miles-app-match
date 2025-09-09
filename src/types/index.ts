export type UserRole = 'admin' | 'customer' | 'professional';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: {
    postalCode: string;
    prefecture: string;
    city: string;
    detail: string;
  };
}

export interface Label {
  id: string;
  name: string;
  category: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  labels: Label[];
  plans: Plan[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  serviceId: string;
}

export interface Order {
  id: string;
  customerId: string;
  serviceId: string;
  planId: string;
  status: 'pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: {
    postalCode: string;
    prefecture: string;
    city: string;
    detail: string;
  };
  meetingPlace?: string;
  specialNotes?: string;
  assignedProfessionalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Professional extends User {
  labels: Label[];
  isActive: boolean;
  completedJobs: number;
  rating: number;
  address?: {
    postalCode: string;
    prefecture: string;
    city: string;
    detail: string;
  };
}