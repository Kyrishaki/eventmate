export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'cashier'
  | 'inventory_staff'
  | 'viewer'
  | 'collab_partner';

export type EventStatus =
  | 'draft'
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'cancelled';

export type EventType = 'own_tour' | 'collab_event' | 'festival_booth' | 'pop_up';

export type BoothStatus = 'active' | 'paused' | 'closed';

export type BoothType = 'solo' | 'collab';

export type PaymentMethod = 'cash' | 'qr_manual' | 'gateway';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type OrderStatus = 'completed' | 'cancelled' | 'refunded';

export type SyncStatus = 'synced' | 'pending_sync' | 'conflict';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  currency: string;
  description?: string;
  is_collab?: boolean;
  owner_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  social_link?: string;
  slogan?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_account_name?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  created_at: string;
}

export interface EventItem {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  status: EventStatus;
  event_type?: EventType;
  banner_url?: string | null;
  is_test?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booth {
  id: string;
  workspace_id: string;
  event_id: string;
  name: string;
  code: string;
  status: BoothStatus;
  booth_type?: BoothType;
  collab_partner?: string | null;
  revenue_share_ratio?: number; // e.g. 50% collab
  is_test?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  workspace_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  workspace_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: string | null;
  scheduled_purge_at?: string | null;
  collab_partner?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
  variants?: ProductVariant[];
}

export type ProductSaleStatus =
  | 'in_stock' // Sẵn sàng bán
  | 'pre_order' // Có đơn đặt trước / Giữ chỗ
  | 'low_stock' // Sắp hết hàng
  | 'reserved_full' // Đã giữ/đặt trước toàn bộ
  | 'sold_out'; // Hết hàng

export interface ProductVariant {
  id: string;
  workspace_id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  barcode: string | null;
  total_inventory: number;
  reserved_quantity?: number; // Đặt trước thủ công / giữ chỗ cho khách quen, VIP
  online_preorder_quantity?: number; // Khách đặt mua online / đăng ký trước
  status?: ProductSaleStatus;
  created_at: string;
  updated_at: string;
}

export interface InventoryAllocation {
  id: string;
  workspace_id: string;
  event_id: string;
  booth_id: string;
  variant_id: string;
  allocated_quantity: number;
  sold_quantity: number;
  is_test?: boolean;
  created_at: string;
  updated_at: string;
  variant?: ProductVariant;
}

export interface Order {
  id: string;
  workspace_id: string;
  event_id: string;
  booth_id: string;
  cashier_id: string;
  order_number: string;
  subtotal_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status?: OrderStatus;
  sync_status: SyncStatus;
  idempotency_key: string;
  notes: string | null;
  order_type?: 'pos_walkin' | 'preorder_pickup';
  proof_image_url?: string | null;
  proof_verified?: boolean;
  proof_verified_at?: string | null;
  proof_verified_by?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  tendered_amount?: number | null;
  change_amount?: number | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancelled_by_role?: WorkspaceRole | null;
  cancellation_reason?: string | null;
  refunded_at?: string | null;
  refunded_by?: string | null;
  refunded_by_role?: WorkspaceRole | null;
  refund_reason?: string | null;
  refund_amount?: number | null;
  refund_restocked?: boolean;
  refund_record_number?: string | null;
  is_test?: boolean;
  offline_created_at: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export type PreorderStatus = 'pending_pickup' | 'picked_up' | 'cancelled';
export type PreorderType = 'vip_hold' | 'online_preorder';

export interface PreorderItem {
  variant_id: string;
  variant_name: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface PreorderReservation {
  id: string;
  code: string;                 // e.g. "PRE-7821", "ONL-4512"
  workspace_id: string;
  event_id?: string;
  booth_id?: string;
  customer_name: string;
  customer_phone?: string;
  preorder_type: PreorderType;  // 'vip_hold' | 'online_preorder'
  status: PreorderStatus;       // 'pending_pickup' | 'picked_up' | 'cancelled'
  items: PreorderItem[];
  total_amount: number;
  deposit_paid: number;
  remaining_amount: number;
  notes?: string;
  proof_image_url?: string;     // MANDATORY PHOTO PROOF (Base64 data or URL)
  picked_up_at?: string;
  picked_up_by?: string;        // Cashier name or Staff ID
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  workspace_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  variant?: ProductVariant;
}

export interface Payment {
  id: string;
  workspace_id: string;
  order_id: string;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transaction_ref: string | null;
  provider_data: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================================
// AUDIT LOG / ACTIVITY HISTORY TYPES
// ============================================================================

export type AuditActorRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'staff'
  | 'inventory_staff'
  | 'cashier'
  | 'collab_partner'
  | 'viewer'
  | 'system';

export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'stock_adjust'
  | 'preorder_adjust'
  | 'order_create'
  | 'order_cancel'
  | 'order_refund'
  | 'collab_contribute'
  | 'collab_sync'
  | 'user_create'
  | 'user_delete'
  | 'login'
  | 'export_data';

export interface AuditLogChange {
  field: string;
  field_label?: string;
  old_value?: unknown;
  new_value?: unknown;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_id?: string;
  actor_name: string;
  actor_role: AuditActorRole;
  actor_username?: string;
  action_type: AuditActionType;
  entity_type:
    | 'product'
    | 'variant'
    | 'inventory'
    | 'order'
    | 'booth'
    | 'event'
    | 'team_member'
    | 'sync_package'
    | 'system';
  entity_id?: string;
  entity_name: string;
  description: string;
  booth_name?: string;
  event_name?: string;
  changes?: AuditLogChange[];
  is_rolled_back?: boolean;
  rolled_back_at?: string;
  rolled_back_by?: string;
  snapshot?: unknown;
}
