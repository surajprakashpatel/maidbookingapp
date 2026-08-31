import { Maid, Booking, Customer, Notification, AdminStats, AppSettings, ServiceCategory } from './types';

// ============================================================
// SERVICE CATEGORIES (PRODUCTION PLATFORM METADATA)
// ============================================================

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'cleaning', name: 'Cleaning', emoji: '🧹', active: true },
  { id: 'cooking', name: 'Cooking', emoji: '🍳', active: true },
  { id: 'babysitting', name: 'Babysitting', emoji: '👶', active: true },
  { id: 'elder_care', name: 'Elder Care', emoji: '🧓', active: true },
  { id: 'house_help', name: 'House Help', emoji: '🏠', active: true },
  { id: 'laundry', name: 'Laundry', emoji: '👕', active: true },
  { id: 'full_day', name: 'Full Day', emoji: '🌞', active: true },
  { id: 'part_time', name: 'Part Time', emoji: '⏰', active: true },
];

// ============================================================
// SUPPORTED AREAS (PLATFORM CONFIGURATION)
// ============================================================

export const SUPPORTED_CITIES = ['Bhilai', 'Durg', 'Raipur', 'Bilaspur', 'Rajnandgaon'];

export const SUPPORTED_AREAS: Record<string, string[]> = {
  Bhilai: [
    'Sector 1', 'Sector 2', 'Sector 4', 'Sector 6', 'Sector 7', 'Sector 9',
    'Nehru Nagar', 'Supela', 'Smriti Nagar', 'Civic Centre', 'Junwani',
    'Risali', 'Bhilai-3', 'Bhilai Nagar', 'Durg Road',
  ],
  Durg: [
    'Nehru Chowk', 'Shankar Nagar', 'Padmanabhpur', 'Transport Nagar',
    'Ram Nagar', 'Ganjpara', 'Utai', 'Boria',
  ],
  Raipur: [
    'Pandri', 'Telibandha', 'Tatibandh', 'Shankar Nagar', 'Amanaka',
    'Tikrapara', 'Devendra Nagar', 'Pachpedi Naka', 'Vidhan Sabha',
  ],
  Bilaspur: ['Sadar Bazar', 'Torwa', 'Talapara', 'Gole Bazar'],
  Rajnandgaon: ['Main Road', 'Chhindwara Road', 'Khairagarh'],
};

// ============================================================
// DEFAULT APP SETTINGS
// ============================================================

export const DEFAULT_APP_SETTINGS: AppSettings = {
  general: {
    appName: 'MaidEasy',
    appDescription: 'Trusted maid and home service booking platform for India',
    supportEmail: 'support@maideasy.in',
    supportPhone: '1800-XXX-XXXX',
  },
  location: {
    supportedCities: SUPPORTED_CITIES,
    supportedAreas: SUPPORTED_AREAS[SUPPORTED_CITIES[0]],
    defaultRadius: 5,
  },
  maid: {
    registrationEnabled: true,
    freeRegistration: true,
    registrationFee: 0,
    approvalRequired: true,
    aadhaarRequired: true,
    selfieRequired: true,
  },
  services: SERVICE_CATEGORIES,
  pricing: {
    hourlyEnabled: true,
    dailyEnabled: true,
    monthlyEnabled: true,
    platformFeePercent: 5,
    taxPercent: 0,
    currency: 'INR',
  },
  booking: {
    cancellationWindowHours: 4,
    advanceBookingDays: 30,
    bookingExpiryMinutes: 30,
  },
  payment: {
    razorpayEnabled: true,
    phonePeEnabled: true,
  },
  maintenance: {
    maintenanceMode: false,
    appVersion: '1.0.0',
  },
};

// ============================================================
// EXACTLY 2 DESIGNATED TEST RECORDS (FOR TESTING PURPOSES ONLY)
// ============================================================

export const TEST_MAID: Maid = {
  id: 'test-maid-1',
  userId: 'test-maid-user-1',
  name: '[TEST] Verified Maid Partner',
  phone: '9876543210',
  email: 'test.maid@maideasy.in',
  gender: 'female',
  profilePhoto: 'https://i.pravatar.cc/300?img=47',
  verificationStatus: 'verified',
  selfieStatus: 'verified',
  approvalStatus: 'approved',
  aadhaarMasked: 'XXXX-XXXX-XXXX-4521',
  location: 'Bhilai',
  city: 'Bhilai',
  area: 'Nehru Nagar',
  address: 'Test House Help Lane',
  pincode: '490020',
  serviceAreas: ['Nehru Nagar', 'Sector 6', 'Sector 7'],
  workRadius: 5,
  qualification: 'Higher Secondary (12th)',
  experience: 5,
  services: ['Cleaning', 'Cooking', 'House Help'],
  languages: ['Hindi', 'English'],
  bio: '[TEST RECORD] Experienced and trustworthy verified helper for platform test suite.',
  hourlyPrice: 150,
  dailyPrice: 800,
  monthlyPrice: 18000,
  availability: 'available',
  rating: 4.9,
  totalRatings: 1,
  totalBookings: 1,
  completedBookings: 1,
  profileViews: 1,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const TEST_CUSTOMER: Customer = {
  id: 'test-cust-1',
  role: 'customer',
  name: '[TEST] Customer Account',
  phone: '9876500001',
  email: 'test.customer@maideasy.in',
  photoUrl: 'https://i.pravatar.cc/300?img=11',
  location: 'Bhilai',
  area: 'Sector 7',
  address: 'Test Residential Address, Bhilai',
  preferredArea: 'Sector 7',
  status: 'active',
  totalBookings: 0,
  createdAt: '2024-01-01T00:00:00Z',
};

// Aliases for compatibility during transition
export const TEST_MAIDS: Maid[] = [TEST_MAID];
export const TEST_CUSTOMERS: Customer[] = [TEST_CUSTOMER];
export const TEST_BOOKINGS: Booking[] = [];
export const TEST_NOTIFICATIONS: Notification[] = [];

// Clean initial empty stats
export const INITIAL_ADMIN_STATS: AdminStats = {
  customers: { total: 0, newThisMonth: 0 },
  maids: { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 },
  bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
  revenue: { gross: 0, platform: 0, thisMonth: 0 },
};
