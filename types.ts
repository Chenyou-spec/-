export enum OrderStatus {
  PENDING = 'Pending Payment',
  PAID = 'Paid',
  SHIPPED = 'Shipped',
  COMPLETED = 'Completed',
  REFUNDED = 'Refunded',
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  amount: number;
  status: OrderStatus;
  date: string; // ISO Date string
  province: string;
}

export interface SalesStat {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductStat {
  name: string;
  sales: number;
}

export interface GeoStat {
  name: string;
  value: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ORDERS = 'ORDERS',
  AI_INSIGHTS = 'AI_INSIGHTS',
  SETTINGS = 'SETTINGS',
}