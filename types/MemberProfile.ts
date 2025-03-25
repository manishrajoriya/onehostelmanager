export interface MemberDetails {
  addmissionDate: Date | string
  address: string
  contactNumber: string
  document?: string
  dueAmount: string
  email: string
  expiryDate: Date | string
  fullName: string
  id: string
  paidAmount: string
  planId?: string
  discount?: string
  profileImage?: string

  totalAmount: string
  plan?: string
 
  createdAt?: Date
  updatedAt?: Date
}




export interface ProfileData {
  name: string;
  address: string;
  contactNumber: string;
  membershipId: string;
  admissionDate: string;
  gender: 'Male' | 'Female' | 'Other';
  plan: PlanDetails;
}



export interface PlanDetails {
  name: string;
  startDate: string;
  endDate: string;
  planAmount: string;
  discount: string;
  finalAmount: string;
  tax: string;
  paidAmount: string;
  dueAmount: string;
}

export interface DetailRowProps {
  label: string;
  value: string;
}

export interface BillDetails {
  billDate: string;
  invoiceNo: string;
  paidAmount: string;
}



export interface FormData {
  fullName: string;
  address: string;
  contactNumber: string;
  email: string;
  plan: string;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  discount: string;
  profileImage: string;
  document: string;
  admissionDate: Date;
  expiryDate: Date;
  status: string;
  seatNumber: string;
  planId: string;
}

export interface PlanData {
  id: string;
  name: string;
  description: string | null;
  duration: string; // Duration in days
  amount: string;
}

export interface SeatData {
  id: string;
  seatId: string;
  isAllocated: boolean;
  allocatedTo: string | null;
}