export type UserRole = 'owner' | 'manager' | 'sales' | 'loader';

export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment';
export type RestockStatus = 'requested' | 'approved' | 'ordered' | 'received' | 'rejected';
export type RestockUrgency = 'low' | 'medium' | 'high';
export type POStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
export type CustomerOrderStatus = 'pending' | 'confirmed' | 'packed' | 'loaded' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type VehicleStatus = 'available' | 'on_route' | 'maintenance';
export type LoadingTaskStatus = 'assigned' | 'in_progress' | 'completed';

export interface BusinessSettings {
  id: string;
  company_name: string;
  logo_url?: string;
  currency: string;
  tax_rate: number;
  setup_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  assigned_warehouse_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  unit: string;
  cost_price: number;
  default_selling_price: number;
  reorder_level: number;
  optimal_stock: number;
  supplier_id?: string;
  description?: string;
  images: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

export interface DailyPrice {
  id: string;
  product_id: string;
  date: string; // YYYY-MM-DD
  selling_price: number;
  created_by?: string;
  created_at: string;
}

export interface PriceHistoryLog {
  id: string;
  product_id: string;
  date: string;
  old_price?: number;
  new_price: number;
  changed_by?: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  source_warehouse_id?: string;
  destination_warehouse_id?: string;
  quantity: number;
  movement_type: MovementType;
  reason: string;
  user_id?: string;
  created_at: string;
}

export interface RestockRequest {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity_needed: number;
  urgency: RestockUrgency;
  note?: string;
  requested_by: string;
  status: RestockStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  warehouse_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: POStatus;
  total_cost: number;
  expected_date?: string;
  created_by?: string;
  items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CustomerOrderItem {
  id: string;
  customer_order_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  unit_price: number;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  status: CustomerOrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  amount_paid: number;
  discount: number;
  notes?: string;
  created_by?: string;
  items?: CustomerOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  driver_name?: string;
  capacity_kg?: number;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface LoadingTaskItem {
  id: string;
  loading_task_id: string;
  product_id: string;
  quantity_to_load: number;
  quantity_loaded: number;
  is_loaded: boolean;
}

export interface LoadingTask {
  id: string;
  task_number: string;
  customer_order_id?: string;
  source_warehouse_id: string;
  vehicle_id: string;
  assigned_loader_id?: string;
  status: LoadingTaskStatus;
  notes?: string;
  items?: LoadingTaskItem[];
  created_at: string;
  updated_at: string;
}

export interface StockStatusInfo {
  totalStock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}
