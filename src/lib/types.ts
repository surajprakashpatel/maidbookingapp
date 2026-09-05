// ============================================================
// TYPESCRIPT TYPES — Maid Booking PWA
// ============================================================

export type UserRole = 'customer' | 'maid' | 'admin';

export type ApprovalStatus = 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
export type VerificationStatus = 'not_submitted' | 'submitted' | 'pending' | 'verified' | 'failed';
export type SelfieStatus = 'not_captured' | 'captured' | 'verification_pending' | 'verified' | 'failed';

export type BookingStatus =
  | 'pending'
  | 'awaiting_maid'
  | 'confirmed'
  | 'payment_pending'
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentGateway = 'razorpay' | 'phonepe' | 'cash';
export type PricingType = 'hourly' | 'daily' | 'monthly';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  location?: string;
  city?: string;
  area?: string;
  address?: string;
  status: 'active' | 'suspended';
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  profileCompleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  fcmToken?: string;
}

export interface Customer extends User {
  role: 'customer';
  preferredArea?: string;
  savedMaids?: string[];
  totalBookings?: number;
}

export interface Maid {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  gender: 'female' | 'male' | 'other';
  dateOfBirth?: string;
  profilePhoto?: string;
  selfieUrl?: string; // Never exposed publicly
  verificationStatus: VerificationStatus;
  selfieStatus: SelfieStatus;
  approvalStatus: ApprovalStatus;
  aadhaarMasked?: string; // e.g. "XXXX-XXXX-XXXX-1234"
  location: string;
  city: string;
  area: string;
  address?: string;
  pincode?: string;
  serviceAreas: string[];
  workRadius?: number; // km
  qualification?: string;
  experience?: number; // years
  services: string[];
  languages?: string[];
  bio?: string;
  hourlyPrice?: number;
  dailyPrice?: number;
  monthlyPrice?: number;
  availability: 'available' | 'unavailable' | 'busy';
  rating?: number;
  totalRatings?: number;
  totalBookings?: number;
  completedBookings?: number;
  profileViews?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  adminNotes?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string; // e.g. MB-123456
  customerId: string;
  customerName: string;
  customerPhone?: string;
  maidId: string;
  maidName: string;
  maidPhoto?: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time?: string;
  duration?: number;
  pricingType: PricingType;
  serviceAmount: number;
  platformFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentGateway?: PaymentGateway;
  transactionId?: string;
  bookingStatus: BookingStatus;
  customerAddress: string;
  customerArea: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  bookingNumber: string;
  userId: string;
  gateway: PaymentGateway;
  transactionId?: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'account' | 'system' | 'maid';
  read: boolean;
  createdAt: string;
  data?: Record<string, string>;
}

export interface Review {
  id: string;
  maidId: string;
  customerId: string;
  customerName: string;
  bookingId?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  emoji: string;
  active: boolean;
  description?: string;
}

export interface CityConfig {
  id: string;
  name: string;
  state: string;
  isOperational: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LocalityConfig {
  id: string;
  cityId?: string;
  cityName: string;
  name: string;
  isOperational: boolean;
  isCustomLocality?: boolean;
  status?: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface AppSettings {
  general: {
    appName: string;
    appDescription: string;
    supportEmail: string;
    supportPhone: string;
    logoUrl?: string;
  };
  location: {
    supportedCities: string[];
    supportedAreas: string[];
    defaultRadius: number;
  };
  maid: {
    registrationEnabled: boolean;
    freeRegistration: boolean;
    registrationFee: number;
    approvalRequired: boolean;
    aadhaarRequired: boolean;
    selfieRequired: boolean;
  };
  services: ServiceCategory[];
  pricing: {
    hourlyEnabled: boolean;
    dailyEnabled: boolean;
    monthlyEnabled: boolean;
    platformFeePercent: number;
    taxPercent: number;
    currency: string;
  };
  booking: {
    cancellationWindowHours: number;
    advanceBookingDays: number;
    bookingExpiryMinutes: number;
  };
  payment: {
    razorpayEnabled: boolean;
    phonePeEnabled: boolean;
  };
  maintenance: {
    maintenanceMode: boolean;
    appVersion: string;
  };
}

export interface AdminStats {
  customers: { total: number; newThisMonth: number };
  maids: { total: number; pending: number; approved: number; rejected: number; suspended: number };
  bookings: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  revenue: { gross: number; platform: number; thisMonth: number; maidEarnings?: number };
}

export interface MaidRegistrationForm {
  // Step 1 — Personal
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: 'female' | 'male' | 'other';
  profilePhoto: File | null;
  profilePhotoPreview: string;

  // Step 2 — Identity
  aadhaarNumber: string;
  selfieDataUrl: string;
  selfieStatus: SelfieStatus;

  // Step 3 — Location
  location: string;
  city: string;
  area: string;
  address: string;
  pincode: string;
  serviceAreas: string[];
  workRadius: number;

  // Step 4 — Services
  qualification: string;
  experience: number;
  services: string[];
  languages: string[];
  bio: string;

  // Step 5 — Pricing
  hourlyEnabled: boolean;
  hourlyPrice: string;
  dailyEnabled: boolean;
  dailyPrice: string;
  monthlyEnabled: boolean;
  monthlyPrice: string;
}

export interface FilterState {
  area: string;
  gender: string;
  service: string;
  minPrice: number;
  maxPrice: number;
  pricingType: string;
  minRating: number;
  verifiedOnly: boolean;
  availability: string;
  minExperience: number;
}
