export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "preparing",
  "proposal_sent",
  "negotiation",
  "confirmed",
  "paid",
  "completed",
  "cancelled",
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CUSTOMER_TYPES = ["individual", "company", "agency"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const QUOTATION_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const BOOKING_STATUSES = ["confirmed", "in_progress", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_TYPES = ["cash", "bank", "card", "online"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const VOUCHER_SERVICE_TYPES = [
  "hotel",
  "transfer",
  "guide",
  "excursion",
  "restaurant",
  "other",
] as const;
export type VoucherServiceType = (typeof VOUCHER_SERVICE_TYPES)[number];

export const INVOICE_STATUSES = ["unpaid", "partial", "paid"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const SUPPLIER_TYPES = [
  "hotel",
  "transport",
  "guide",
  "restaurant",
  "ticket",
  "airline",
  "railway",
  "other",
] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export const VEHICLE_TYPES = ["sedan", "minivan", "suv", "bus", "other"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const MEAL_PLANS = ["RO", "BB", "HB", "FB", "AI"] as const;
export type MealPlan = (typeof MEAL_PLANS)[number];

export const COMMUNICATION_CHANNELS = [
  "whatsapp",
  "telegram",
  "email",
  "website",
  "phone",
  "other",
] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const COMMUNICATION_DIRECTIONS = ["inbound", "outbound"] as const;
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];

export const EXPENSE_CATEGORIES = [
  "salary",
  "rent",
  "utilities",
  "marketing",
  "transport",
  "office",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const USER_ROLES = [
  "admin",
  "director",
  "manager",
  "sales",
  "accountant",
  "tour_operator",
  "guide",
  "driver",
  "agent",
] as const;
export type UserRole = (typeof USER_ROLES)[number];
