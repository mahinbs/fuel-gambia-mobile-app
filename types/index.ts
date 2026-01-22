// User Types
export enum UserRole {
  USER = 'USER',
  ATTENDANT = 'ATTENDANT',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
}

export enum TransactionMode {
  SUBSIDY = 'SUBSIDY',
  PAID = 'PAID',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// User Interfaces
export interface User {
  id: string;
  phoneNumber: string;
  role: UserRole;
  name?: string;
  email?: string;
  isBeneficiary?: boolean; // Track if user is a fuel beneficiary
  createdAt: string;
  updatedAt: string;
}

export interface Beneficiary extends User {
  role: UserRole.USER;
  isBeneficiary: true;
  governmentId?: string;
  employmentLetter?: string;
  departmentName?: string;
  verificationStatus: VerificationStatus;
  monthlyAllocation: number;
  remainingBalance: number;
  fuelType: FuelType;
  expiryDate: string;
}

export interface Attendant extends User {
  role: UserRole.ATTENDANT;
  stationId: string;
  stationName: string;
}

// QR Code Interfaces
export interface SubsidyQRPayload {
  userId: string;
  couponId: string;
  fuelType: FuelType;
  remainingAmount: number;
  expiry: string;
  mode: TransactionMode.SUBSIDY;
}

export interface PaidQRPayload {
  transactionId: string;
  fuelType: FuelType;
  paidAmount: number;
  expiry: string;
  mode: TransactionMode.PAID;
}

export type QRPayload = SubsidyQRPayload | PaidQRPayload;

// Transaction Interfaces
export interface Transaction {
  id: string;
  userId: string;
  stationId?: string;
  stationName?: string;
  fuelType: FuelType;
  amount: number;
  liters: number;
  mode: TransactionMode;
  status: PaymentStatus;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory Interfaces
export interface Inventory {
  stationId: string;
  stationName: string;
  petrolStock: number;
  dieselStock: number;
  lastUpdated: string;
}

// Notification Interfaces
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ALLOCATION' | 'BALANCE' | 'PAYMENT' | 'REDEMPTION' | 'VERIFICATION';
  read: boolean;
  createdAt: string;
}

// Payment Interfaces
export interface PaymentIntent {
  id: string;
  amount: number;
  fuelType: FuelType;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
