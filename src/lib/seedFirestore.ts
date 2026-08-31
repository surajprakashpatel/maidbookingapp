import { db } from './firebase/config';
import { doc, setDoc } from 'firebase/firestore';

const APP_SETTINGS = {
  general: {
    appName: 'MaidEasy',
    appDescription: 'Trusted maid and home service booking platform for India',
    supportEmail: 'support@maideasy.in',
    supportPhone: '1800-XXX-XXXX',
  },
  location: {
    supportedCities: ['Bhilai', 'Durg', 'Raipur', 'Bilaspur', 'Rajnandgaon'],
    supportedAreas: ['Sector 1', 'Sector 4', 'Sector 7', 'Nehru Nagar', 'Supela', 'Smriti Nagar'],
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
  services: [
    { id: 'cleaning', name: 'Cleaning', emoji: '🧹', active: true },
    { id: 'cooking', name: 'Cooking', emoji: '🍳', active: true },
    { id: 'babysitting', name: 'Babysitting', emoji: '👶', active: true },
    { id: 'elder_care', name: 'Elder Care', emoji: '🧓', active: true },
    { id: 'house_help', name: 'House Help', emoji: '🏠', active: true },
    { id: 'laundry', name: 'Laundry', emoji: '👕', active: true },
  ],
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

const USERS = [
  {
    id: 'admin-1',
    role: 'admin',
    name: 'Admin User',
    phone: '9000000001',
    email: 'admin@maideasy.in',
    status: 'active',
    createdAt: '2023-01-01T10:00:00Z',
  },
  {
    id: 'cust-1',
    role: 'customer',
    name: 'Rahul Gupta',
    phone: '9876500001',
    email: 'rahul.gupta@gmail.com',
    location: 'Bhilai',
    area: 'Sector 7',
    address: 'House No. 42, Sector 7, Bhilai',
    status: 'active',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'user-m1',
    role: 'maid',
    name: 'Sunita Verma',
    phone: '9876543210',
    email: 'sunita.verma@gmail.com',
    location: 'Bhilai',
    area: 'Nehru Nagar',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
  },
];

const MAIDS = [
  {
    id: 'maid-1',
    userId: 'user-m1',
    name: 'Sunita Verma',
    phone: '9876543210',
    email: 'sunita.verma@gmail.com',
    gender: 'female',
    profilePhoto: 'https://i.pravatar.cc/300?img=47',
    verificationStatus: 'verified',
    selfieStatus: 'verified',
    approvalStatus: 'approved',
    aadhaarMasked: 'XXXX-XXXX-XXXX-4521',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Nehru Nagar',
    address: 'House 12, Street 4, Nehru Nagar',
    pincode: '490020',
    serviceAreas: ['Nehru Nagar', 'Sector 6', 'Smriti Nagar', 'Supela'],
    workRadius: 5,
    qualification: 'High School',
    experience: 6,
    services: ['Cleaning', 'Cooking', 'House Help'],
    languages: ['Hindi', 'Chhattisgarhi'],
    bio: 'Experienced household cook and cleaning specialist with 6+ years of service in Bhilai.',
    hourlyPrice: 150,
    dailyPrice: 450,
    monthlyPrice: 3500,
    availability: 'available',
    rating: 4.8,
    totalRatings: 42,
    totalBookings: 128,
    completedBookings: 124,
    profileViews: 412,
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-01T12:00:00Z',
  },
  {
    id: 'maid-2',
    userId: 'user-m2',
    name: 'Priya Sharma',
    phone: '9876543211',
    email: 'priya.sharma@gmail.com',
    gender: 'female',
    profilePhoto: 'https://i.pravatar.cc/300?img=45',
    verificationStatus: 'verified',
    selfieStatus: 'verified',
    approvalStatus: 'approved',
    aadhaarMasked: 'XXXX-XXXX-XXXX-8812',
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Sector 7',
    address: 'Quarter 14B, Sector 7',
    pincode: '490006',
    serviceAreas: ['Sector 7', 'Sector 6', 'Sector 4', 'Civic Centre'],
    workRadius: 4,
    qualification: 'Primary School',
    experience: 4,
    services: ['Babysitting', 'Elder Care', 'House Help'],
    languages: ['Hindi'],
    bio: 'Patient and caring nanny & elder care attendant with training in basic first aid.',
    hourlyPrice: 180,
    dailyPrice: 500,
    monthlyPrice: 4000,
    availability: 'available',
    rating: 4.9,
    totalRatings: 31,
    totalBookings: 86,
    completedBookings: 84,
    profileViews: 289,
    isActive: true,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-02-05T12:00:00Z',
  },
];

const BOOKINGS = [
  {
    id: 'bk-1001',
    bookingNumber: 'MB-892401',
    customerId: 'cust-1',
    customerName: 'Rahul Gupta',
    customerPhone: '9876500001',
    maidId: 'maid-1',
    maidName: 'Sunita Verma',
    maidPhoto: 'https://i.pravatar.cc/300?img=47',
    serviceId: 'cleaning',
    serviceName: 'Deep House Cleaning',
    date: '2026-09-02',
    time: '09:00 AM',
    duration: 3,
    pricingType: 'hourly',
    serviceAmount: 450,
    platformFee: 23,
    tax: 0,
    discount: 0,
    totalAmount: 473,
    paymentStatus: 'paid',
    paymentGateway: 'phonepe',
    transactionId: 'TXN-99882211',
    bookingStatus: 'confirmed',
    customerAddress: 'House No. 42, Sector 7, Bhilai',
    customerArea: 'Sector 7',
    notes: 'Please bring floor cleaning solution if possible.',
    createdAt: '2026-08-30T09:15:00Z',
    updatedAt: '2026-08-30T09:20:00Z',
  },
];

const NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'cust-1',
    title: 'Booking Confirmed!',
    message: 'Your booking MB-892401 with Sunita Verma is confirmed for Sep 2 at 09:00 AM.',
    type: 'booking',
    read: false,
    createdAt: '2026-08-30T09:20:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-m1',
    title: 'New Booking Request',
    message: 'You have a new confirmed booking MB-892401 from Rahul Gupta in Sector 7.',
    type: 'booking',
    read: true,
    createdAt: '2026-08-30T09:20:00Z',
  },
];

export async function seedDatabase() {
  console.log('🌱 Seeding Firestore Database structured initial data...');

  // 1. Settings
  await setDoc(doc(db, 'settings', 'app'), APP_SETTINGS);
  console.log('✓ Seeding settings/app doc done.');

  // 2. Users
  for (const user of USERS) {
    await setDoc(doc(db, 'users', user.id), user);
    console.log(`✓ Seeding user: users/${user.id}`);
  }

  // 3. Maids
  for (const maid of MAIDS) {
    await setDoc(doc(db, 'maids', maid.id), maid);
    console.log(`✓ Seeding maid: maids/${maid.id}`);
  }

  // 4. Bookings
  for (const bk of BOOKINGS) {
    await setDoc(doc(db, 'bookings', bk.id), bk);
    console.log(`✓ Seeding booking: bookings/${bk.id}`);
  }

  // 5. Notifications
  for (const n of NOTIFICATIONS) {
    await setDoc(doc(db, 'notifications', n.id), n);
    console.log(`✓ Seeding notification: notifications/${n.id}`);
  }

  console.log('🎉 Firestore Database seeded successfully in a structural manner!');
  return { success: true };
}
