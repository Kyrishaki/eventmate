export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'cashier'
  | 'inventory_staff'
  | 'viewer';

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
  collab_partner?: string | null;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  workspace_id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  barcode: string | null;
  total_inventory: number;
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
  sync_status: SyncStatus;
  idempotency_key: string;
  notes: string | null;
  offline_created_at: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
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
