export type Role = 'ADMIN' | 'CUSTOMER';
export type TicketStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type CouponStatus = 'AVAILABLE' | 'RESERVED' | 'PENDING' | 'SOLD';
export type PaymentMethod = 'BANK_TRANSFER' | 'BANCARD';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface PublicUser {
  id: string;
  name: string;
  cedula: string;
  phone: string;
  email: string;
  role: Role;
  preferredLanguage?: 'pt' | 'es';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface EventSponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  order: number;
}

export interface EventDraw {
  id: string;
  order: number;
  prizeName: string;
  prizeNameEs: string;
  prizeValue: number;
  winnerCardId?: string | null;
  drawnAt?: string | null;
}

export interface EventSummary {
  id: string;
  name: string;
  nameEs: string;
  location: string;
  description?: string | null;
  descriptionEs?: string | null;
  eventDate: string;
  startTime: string;
  maxCoupons: number;
  couponPrice: number;
  cardsPerCoupon: number;
  drawCount: number;
  mainPrizeValue: number;
  totalPrizeValue: number;
  heroImageUrl?: string | null;
  isActive: boolean;
  soldCount: number;
  availableCount: number;
}

export interface EventDetail extends EventSummary {
  sponsors: EventSponsor[];
  draws: EventDraw[];
}

export interface CouponPublic {
  id: string;
  couponNumber: number;
  status: CouponStatus;
  cardNumbers: number[];
}

export interface CardNumbers {
  drawOrder: number;
  numbers: number[];
}

export interface CardDetail {
  id: string;
  cardNumber: number;
  imageUrl: string;
  drawNumbers: CardNumbers[];
}

export interface CouponDetail extends CouponPublic {
  cards: CardDetail[];
}

export interface TicketDetail {
  id: string;
  eventId: string;
  eventName: string;
  ticketNumber: number;
  status: TicketStatus;
  totalAmount: number;
  couponCount: number;
  createdAt: string;
  paidAt?: string | null;
  coupons: CouponDetail[];
  payment?: PaymentInfo | null;
}

export interface PaymentInfo {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  receiptUrl?: string | null;
  confirmedAt?: string | null;
  notes?: string | null;
}

export interface DashboardData {
  totalSold: number;
  totalRevenue: number;
  totalPending: number;
  totalCancelled: number;
  totalAvailable: number;
  recentTransactions: Array<{
    id: string;
    userName: string;
    eventName: string;
    amount: number;
    status: PaymentStatus;
    createdAt: string;
  }>;
  salesByDay: Array<{ date: string; count: number; revenue: number }>;
}

export interface CouponStatusUpdate {
  eventId: string;
  couponId: string;
  status: CouponStatus;
  reservedBy?: string;
}
