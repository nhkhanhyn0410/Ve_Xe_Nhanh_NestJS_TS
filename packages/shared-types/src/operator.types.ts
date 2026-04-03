import { OperatorStatus } from './enums.js';

export interface IBusOperator {
  id: string;
  companyName: string;
  username: string; // Tên đăng nhập
  operatorAuth?: string;
  email: string;
  phone: string;
  logo?: string;
  businessLicense: string;
  taxCode: string;
  address: string;
  description?: string;
  
  // Trạng thái kiểm duyệt
  status: OperatorStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  verificationDocs?: string[];
  approvedAt?: string | Date;
  approvedBy?: string; // ID của Admin đã duyệt
  
  // Thống kê denormalized
  totalRoutes: number;
  totalBuses: number;
  totalTrips: number;
  averageRating: number;
  totalReviews: number;

  // Metadata
  lastLoginAt?: string | Date;
  createdAt: string;
  updatedAt: string;
}
