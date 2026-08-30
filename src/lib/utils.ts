import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { BookingStatus, PaymentStatus, ApprovalStatus, VerificationStatus } from './types';

// ============================================================
// CLASS UTILITIES
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTransactionId(prefix = 'TXN'): string {
  return `${prefix.toUpperCase()}_${Date.now()}`;
}

// ============================================================
// CURRENCY
// ============================================================

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

// ============================================================
// DATE & TIME
// ============================================================

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  // "09:00" → "9:00 AM"
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

// ============================================================
// STATUS HELPERS
// ============================================================

export function getBookingStatusLabel(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    pending: 'Pending',
    awaiting_maid: 'Awaiting Maid',
    confirmed: 'Confirmed',
    payment_pending: 'Payment Pending',
    paid: 'Paid',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return map[status] ?? status;
}

export function getBookingStatusClass(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    pending: 'badge-pending',
    awaiting_maid: 'badge-warning',
    confirmed: 'badge-confirmed',
    payment_pending: 'badge-pending',
    paid: 'badge-confirmed',
    in_progress: 'badge-inprogress',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    rejected: 'badge-cancelled',
    expired: 'badge-neutral',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    unpaid: 'Unpaid',
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return map[status] ?? status;
}

export function getPaymentStatusClass(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    unpaid: 'badge-neutral',
    pending: 'badge-pending',
    paid: 'badge-confirmed',
    failed: 'badge-cancelled',
    refunded: 'badge-info',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
}

export function getApprovalStatusLabel(status: ApprovalStatus): string {
  const map: Record<ApprovalStatus, string> = {
    draft: 'Draft',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    suspended: 'Suspended',
  };
  return map[status] ?? status;
}

export function getApprovalStatusClass(status: ApprovalStatus): string {
  const map: Record<ApprovalStatus, string> = {
    draft: 'badge-neutral',
    under_review: 'badge-review',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    suspended: 'badge-suspended',
  };
  return `badge ${map[status] ?? 'badge-neutral'}`;
}

export function getVerificationStatusLabel(status: VerificationStatus): string {
  const map: Record<VerificationStatus, string> = {
    not_submitted: 'Not Submitted',
    submitted: 'Submitted',
    pending: 'Pending',
    verified: 'Verified',
    failed: 'Failed',
  };
  return map[status] ?? status;
}

// ============================================================
// PHONE & AADHAAR
// ============================================================

export function maskPhone(phone: string): string {
  if (phone.length < 10) return phone;
  return phone.slice(0, 2) + 'XXXXXXXX' + phone.slice(-2);
}

export function maskAadhaar(aadhaar: string): string {
  const digits = aadhaar.replace(/\D/g, '');
  if (digits.length !== 12) return 'XXXX-XXXX-XXXX-' + digits.slice(-4);
  return `XXXX-XXXX-XXXX-${digits.slice(-4)}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

// ============================================================
// VALIDATION
// ============================================================

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateAadhaar(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar.replace(/\D/g, ''));
}

export function validatePincode(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

// ============================================================
// MISC
// ============================================================

export function generateBookingNumber(): string {
  return 'MB-' + Math.floor(100000 + Math.random() * 900000);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
}

export function getPricingLabel(type: string): string {
  const map: Record<string, string> = {
    hourly: '/hr',
    daily: '/day',
    monthly: '/month',
  };
  return map[type] ?? '';
}

export function getAvailabilityClass(avail: string): string {
  if (avail === 'available') return 'text-success';
  if (avail === 'busy') return 'text-warning';
  return 'text-muted';
}

export function getAvailabilityLabel(avail: string): string {
  const map: Record<string, string> = {
    available: 'Available',
    busy: 'Busy',
    unavailable: 'Unavailable',
  };
  return map[avail] ?? avail;
}

export function clampText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}
