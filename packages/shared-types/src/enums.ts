export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  BUS_MANAGER = 'bus_manager',
  REPORT_MANAGER = 'report_manager',
  USER_MANAGER = 'user_manager',
  SYSTEM_MANAGER = 'system_manager',
}

export enum Permission {
  MANAGE_BUSES = 'manage_buses',
  MANAGE_REPORTS = 'manage_reports',
  MANAGE_USERS = 'manage_users',
  MANAGE_SYSTEM = 'manage_system',
}

export enum OperatorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum BusType {
  SEATER = 'seater',
  SLEEPER = 'sleeper',
  LIMOUSINE = 'limousine',
}

export enum TripStatus {
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  REFUND_PENDING = 'refund_pending',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  E_WALLET = 'ewallet',
  BANK_GATEWAY = 'bank_gateway',
  CARD = 'card',
}

export enum PaymentStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum TicketStatus {
  VALID = 'valid',
  USED = 'used',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum EmployeeRole {
  DRIVER = 'driver',
  TRIP_MANAGER = 'trip_manager',
}
