import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EventItem,
  Booth,
  Product,
  ProductVariant,
  ProductCategory,
  InventoryAllocation,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceRole,
  EventStatus,
  BoothStatus,
} from '@/types/database';
import { isTestAllocation } from '@/lib/test-data-filter';

export interface DataStoreState {
  events: EventItem[];
  booths: Booth[];
  categories: ProductCategory[];
  products: Product[];
  variants: ProductVariant[];
  allocations: InventoryAllocation[];
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];

  // Event Actions
  createEvent: (event: Omit<EventItem, 'id' | 'created_at' | 'updated_at'>) => EventItem;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;

  // Booth Actions
  createBooth: (booth: Omit<Booth, 'id' | 'created_at' | 'updated_at'>) => Booth;
  updateBooth: (id: string, updates: Partial<Booth>) => void;
  deleteBooth: (id: string) => void;

  // Product & Variant Actions
  createProduct: (
    product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    variants: Array<Omit<ProductVariant, 'id' | 'workspace_id' | 'product_id' | 'created_at' | 'updated_at'>>
  ) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  updateVariantPreorders: (
    variantId: string,
    params: {
      reservedQuantity?: number;
      onlinePreorderQuantity?: number;
      totalInventory?: number;
    }
  ) => void;

  // Inventory & Allocation Actions
  setAllocations: (allocations: InventoryAllocation[]) => void;
  setAllocation: (
    workspaceId: string,
    eventId: string,
    boothId: string,
    variantId: string,
    allocatedQuantity: number
  ) => void;
  quickTransferStock: (boothId: string, variantId: string, delta: number) => boolean;
  resetTestAllocations: () => void;

  // Team Actions
  inviteMember: (workspaceId: string, email: string, role: WorkspaceRole, invitedBy: string) => WorkspaceInvitation;
  updateMemberRole: (memberId: string, newRole: WorkspaceRole) => void;
  removeMember: (memberId: string) => void;
  revokeInvitation: (invitationId: string) => void;

  // Collab Actions
  addCollabProduct: (params: {
    workspaceId: string;
    eventId: string;
    boothId: string;
    partnerName: string;
    name: string;
    price: number;
    quantity: number;
    sku?: string;
    variantName?: string;
    imageUrl?: string;
    barcode?: string;
    reservedQuantity?: number;
    onlinePreorderQuantity?: number;
  }) => { product: Product; variant: ProductVariant; allocation: InventoryAllocation };
  restockCollabVariant: (boothId: string, variantId: string, addedQty: number) => boolean;
  mergeCollabSyncPackage: (pkg: {
    booth?: Partial<Booth>;
    products?: Product[];
    variants?: ProductVariant[];
    allocations?: InventoryAllocation[];
  }) => void;

  // Seeding & Reset
  seedDemoTourData: (workspaceId: string) => void;
  clearAllData: () => void;
}

const defaultCategories: ProductCategory[] = [
  { id: 'cat-apparel', workspace_id: 'ws-hac-cam-studio', name: 'Áo thun & Trang phục', sort_order: 1, created_at: new Date().toISOString() },
  { id: 'cat-accessories', workspace_id: 'ws-hac-cam-studio', name: 'Phụ kiện & Lightstick', sort_order: 2, created_at: new Date().toISOString() },
  { id: 'cat-music', workspace_id: 'ws-hac-cam-studio', name: 'Đĩa Than (Vinyl) & CD', sort_order: 3, created_at: new Date().toISOString() },
];

const defaultEvents: EventItem[] = [
  {
    id: 'evt-test-pos',
    workspace_id: 'ws-hac-cam-studio',
    name: '🧪 Sự kiện Test (Chạy thử nghiệm POS)',
    description: 'Sự kiện dành riêng để chạy thử máy POS, test giao dịch và đối soát doanh thu',
    location: 'Quầy Demo & Test POS',
    start_date: '2026-11-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    status: 'active',
    is_test: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'evt-hanoi-2026',
    workspace_id: 'ws-hac-cam-studio',
    name: 'Hạc Cầm Live Concert - Hà Nội',
    description: 'Đêm diễn mở màn tour lưu diễn 2026 tại Hà Nội',
    location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    start_date: '2026-11-20T18:00:00Z',
    end_date: '2026-11-20T22:30:00Z',
    status: 'upcoming',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'evt-saigon-2026',
    workspace_id: 'ws-hac-cam-studio',
    name: 'Hạc Cầm Tour - TP. Hồ Chí Minh',
    description: 'Đêm nhạc sân vận động thứ hai',
    location: 'Nhà thi đấu Phú Thọ, Quận 11, TP.HCM',
    start_date: '2026-12-05T18:00:00Z',
    end_date: '2026-12-05T22:30:00Z',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultBooths: Booth[] = [
  {
    id: 'booth-test-1',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-test-pos',
    name: 'Quầy Test POS 01',
    code: 'BOOTH-TEST',
    status: 'active',
    is_test: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'booth-a',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-hanoi-2026',
    name: 'Quầy A - Cổng chính',
    code: 'BOOTH-A',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'booth-b',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-hanoi-2026',
    name: 'Quầy B - Khu VIP & Sân trong',
    code: 'BOOTH-B',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'booth-sg-1',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-saigon-2026',
    name: 'Quầy 1 - Khu Vé & Check-in',
    code: 'BOOTH-SG1',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'booth-sg-2',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-saigon-2026',
    name: 'Quầy 2 - Sân khấu chính',
    code: 'BOOTH-SG2',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultProducts: Product[] = [
  {
    id: 'prod-tshirt-tour',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-apparel',
    name: 'Áo thun Tour Hạc Cầm 2026 (Black Edition)',
    description: 'Chất liệu 100% cotton định lượng 250gsm, in lụa thủ công mặt trước và lịch tour mặt sau.',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-tour-cap',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-accessories',
    name: 'Nón lưỡi trai Official Tour Cap',
    description: 'Thêu nổi biểu tượng Hạc Cầm phía trước, khóa kim loại cao cấp tùy chỉnh.',
    image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=60',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-lightstick',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-accessories',
    name: 'Lightstick Cổ vũ Hạc Cầm RGB',
    description: 'Đèn phát sáng đồng bộ bluetooth theo nhịp điệu sân khấu, 15 chế độ màu sắc.',
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-vinyl-album',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-music',
    name: "Đĩa Than (Vinyl) - Album 'Khởi Hành'",
    description: 'Đĩa nhựa 180g mastered tại Abbey Road, phiên bản kỷ niệm có chữ ký tác quyền.',
    image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&auto=format&fit=crop&q=60',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultVariants: ProductVariant[] = [
  {
    id: 'var-tshirt-s',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-tshirt-tour',
    sku: 'HC-TSHIRT-BLK-S',
    name: 'Size S',
    price: 350000,
    barcode: '893601001001',
    total_inventory: 100,
    reserved_quantity: 15, // Chủ shop tự giữ chỗ 15 cái cho VIP/Nội bộ
    online_preorder_quantity: 20, // Khách đặt mua online nhận tại quầy 20 cái
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-tshirt-m',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-tshirt-tour',
    sku: 'HC-TSHIRT-BLK-M',
    name: 'Size M',
    price: 350000,
    barcode: '893601001002',
    total_inventory: 150,
    reserved_quantity: 10,
    online_preorder_quantity: 35,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-tshirt-l',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-tshirt-tour',
    sku: 'HC-TSHIRT-BLK-L',
    name: 'Size L',
    price: 350000,
    barcode: '893601001003',
    total_inventory: 150,
    reserved_quantity: 10,
    online_preorder_quantity: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-cap-blk',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-tour-cap',
    sku: 'HC-CAP-BLK',
    name: 'Freesize - Đen',
    price: 220000,
    barcode: '893601002001',
    total_inventory: 120,
    reserved_quantity: 5,
    online_preorder_quantity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-lightstick-rgb',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-lightstick',
    sku: 'HC-LIGHTSTICK-RGB',
    name: 'Phiên bản Chuẩn RGB',
    price: 280000,
    barcode: '893601003001',
    total_inventory: 200,
    reserved_quantity: 20,
    online_preorder_quantity: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-vinyl-limited',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-vinyl-album',
    sku: 'HC-VINYL-LTD',
    name: 'Bản chữ ký đặc biệt',
    price: 850000,
    barcode: '893601004001',
    total_inventory: 50,
    reserved_quantity: 15,
    online_preorder_quantity: 30, // Chỉ còn 5 cái khả dụng bán tự do!
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Default allocations for Hanoi Concert
// Exact Allocated Inventory model adhering to specifications
const defaultAllocations: InventoryAllocation[] = [
  // T-Shirt S: Total 100 -> Booth A: 40, Booth B: 30, Storage: 30
  { id: 'alloc-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-a', variant_id: 'var-tshirt-s', allocated_quantity: 40, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-b', variant_id: 'var-tshirt-s', allocated_quantity: 30, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // T-Shirt M: Total 150 -> Booth A: 60, Booth B: 50, Storage: 40
  { id: 'alloc-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-a', variant_id: 'var-tshirt-m', allocated_quantity: 60, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-4', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-b', variant_id: 'var-tshirt-m', allocated_quantity: 50, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // T-Shirt L: Total 150 -> Booth A: 60, Booth B: 50, Storage: 40
  { id: 'alloc-5', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-a', variant_id: 'var-tshirt-l', allocated_quantity: 60, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-6', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-b', variant_id: 'var-tshirt-l', allocated_quantity: 50, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Cap: Total 120 -> Booth A: 50, Booth B: 40, Storage: 30
  { id: 'alloc-7', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-a', variant_id: 'var-cap-blk', allocated_quantity: 50, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-8', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-b', variant_id: 'var-cap-blk', allocated_quantity: 40, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Lightstick: Total 200 -> Booth A: 90, Booth B: 70, Storage: 40
  { id: 'alloc-9', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-a', variant_id: 'var-lightstick-rgb', allocated_quantity: 90, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-10', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-b', variant_id: 'var-lightstick-rgb', allocated_quantity: 70, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Vinyl: Total 50 -> Booth A: 20, Booth B: 20, Storage: 10
  { id: 'alloc-11', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-a', variant_id: 'var-vinyl-limited', allocated_quantity: 20, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-12', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hanoi-2026', booth_id: 'booth-b', variant_id: 'var-vinyl-limited', allocated_quantity: 20, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Saigon Event Allocations
  { id: 'alloc-sg-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-saigon-2026', booth_id: 'booth-sg-1', variant_id: 'var-tshirt-s', allocated_quantity: 40, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-sg-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-saigon-2026', booth_id: 'booth-sg-1', variant_id: 'var-tshirt-m', allocated_quantity: 60, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-sg-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-saigon-2026', booth_id: 'booth-sg-1', variant_id: 'var-tshirt-l', allocated_quantity: 60, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-sg-4', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-saigon-2026', booth_id: 'booth-sg-1', variant_id: 'var-cap-blk', allocated_quantity: 50, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-sg-5', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-saigon-2026', booth_id: 'booth-sg-1', variant_id: 'var-lightstick-rgb', allocated_quantity: 90, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-sg-6', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-saigon-2026', booth_id: 'booth-sg-1', variant_id: 'var-vinyl-limited', allocated_quantity: 20, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Test Event Allocations (Quầy Test POS 01)
  { id: 'alloc-test-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-tshirt-s', allocated_quantity: 50, sold_quantity: 31, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-tshirt-m', allocated_quantity: 50, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-tshirt-l', allocated_quantity: 50, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-4', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-cap-blk', allocated_quantity: 30, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-5', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-lightstick-rgb', allocated_quantity: 50, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-6', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-vinyl-limited', allocated_quantity: 15, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const defaultMembers: WorkspaceMember[] = [
  {
    id: 'mem-1',
    workspace_id: 'ws-hac-cam-studio',
    user_id: 'user-artist-demo',
    role: 'owner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'user-artist-demo',
      full_name: 'Alex Rivera (Tour Lead)',
      avatar_url: null,
      phone: '0901234567',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'mem-2',
    workspace_id: 'ws-hac-cam-studio',
    user_id: 'user-2',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'user-2',
      full_name: 'Trần Bảo Minh',
      avatar_url: null,
      phone: '0912345678',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'mem-3',
    workspace_id: 'ws-hac-cam-studio',
    user_id: 'user-3',
    role: 'manager',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'user-3',
      full_name: 'Lê Thu Trang',
      avatar_url: null,
      phone: '0923456789',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'mem-4',
    workspace_id: 'ws-hac-cam-studio',
    user_id: 'user-4',
    role: 'cashier',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'user-4',
      full_name: 'Nguyễn Hoàng Long',
      avatar_url: null,
      phone: '0934567890',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'mem-5',
    workspace_id: 'ws-hac-cam-studio',
    user_id: 'user-5',
    role: 'inventory_staff',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'user-5',
      full_name: 'Phạm Quốc Huy',
      avatar_url: null,
      phone: '0945678901',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

const defaultInvitations: WorkspaceInvitation[] = [
  {
    id: 'inv-1',
    workspace_id: 'ws-hac-cam-studio',
    email: 'thungan.hanoi@eventmate.com',
    role: 'cashier',
    token: 'tok_hanoi_gate_a_2026',
    status: 'pending',
    invited_by: 'user-artist-demo',
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const useDataStore = create<DataStoreState>()(
  persist(
    (set, get) => ({
      events: defaultEvents,
      booths: defaultBooths,
      categories: defaultCategories,
      products: defaultProducts,
      variants: defaultVariants,
      allocations: defaultAllocations,
      members: defaultMembers,
      invitations: defaultInvitations,

      // Events
      createEvent: (eventData) => {
        const newEvent: EventItem = {
          ...eventData,
          id: `evt-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set({ events: [newEvent, ...get().events] });
        return newEvent;
      },
      updateEvent: (id, updates) => {
        set({
          events: get().events.map((e) =>
            e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
          ),
        });
      },
      deleteEvent: (id) => {
        set({
          events: get().events.filter((e) => e.id !== id),
          booths: get().booths.filter((b) => b.event_id !== id),
          allocations: get().allocations.filter((a) => a.event_id !== id),
        });
      },

      // Booths
      createBooth: (boothData) => {
        const newBooth: Booth = {
          ...boothData,
          id: `booth-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set({ booths: [newBooth, ...get().booths] });
        return newBooth;
      },
      updateBooth: (id, updates) => {
        set({
          booths: get().booths.map((b) =>
            b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
          ),
        });
      },
      deleteBooth: (id) => {
        set({
          booths: get().booths.filter((b) => b.id !== id),
          allocations: get().allocations.filter((a) => a.booth_id !== id),
        });
      },

      // Products & Variants
      createProduct: (productData, variantDataList) => {
        const productId = `prod-${Date.now()}`;
        const newProduct: Product = {
          ...productData,
          id: productId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newVariants: ProductVariant[] = variantDataList.map((v, idx) => ({
          ...v,
          id: `var-${Date.now()}-${idx}`,
          workspace_id: productData.workspace_id,
          product_id: productId,
          reserved_quantity: Number(v.reserved_quantity) || 0,
          online_preorder_quantity: Number(v.online_preorder_quantity) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        set({
          products: [newProduct, ...get().products],
          variants: [...newVariants, ...get().variants],
        });

        return newProduct;
      },
      updateProduct: (id, updates) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
          ),
        });
      },
      deleteProduct: (id) => {
        // SOFT-DELETE: Mark product as hidden/deleted without deleting data or allocations
        set({
          products: get().products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  is_deleted: true,
                  is_active: false,
                  deleted_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : p
          ),
        });
      },
      restoreProduct: (id) => {
        // RESTORE: Bring soft-deleted product back to active
        set({
          products: get().products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  is_deleted: false,
                  is_active: true,
                  deleted_at: null,
                  updated_at: new Date().toISOString(),
                }
              : p
          ),
        });
      },
      toggleProductActive: (id) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, is_active: !p.is_active, updated_at: new Date().toISOString() } : p
          ),
        });
      },

      updateVariantPreorders: (variantId, params) => {
        set({
          variants: get().variants.map((v) =>
            v.id === variantId
              ? {
                  ...v,
                  ...(params.reservedQuantity !== undefined
                    ? { reserved_quantity: Math.max(0, params.reservedQuantity) }
                    : {}),
                  ...(params.onlinePreorderQuantity !== undefined
                    ? { online_preorder_quantity: Math.max(0, params.onlinePreorderQuantity) }
                    : {}),
                  ...(params.totalInventory !== undefined
                    ? { total_inventory: Math.max(0, params.totalInventory) }
                    : {}),
                  updated_at: new Date().toISOString(),
                }
              : v
          ),
        });
      },

      // Allocations
      setAllocations: (allocations) => set({ allocations }),
      setAllocation: (workspaceId, eventId, boothId, variantId, allocatedQuantity) => {
        const existing = get().allocations.find(
          (a) => a.booth_id === boothId && a.variant_id === variantId
        );

        if (existing) {
          set({
            allocations: get().allocations.map((a) =>
              a.id === existing.id
                ? {
                    ...a,
                    allocated_quantity: Math.max(a.sold_quantity, allocatedQuantity),
                    updated_at: new Date().toISOString(),
                  }
                : a
            ),
          });
        } else {
          const newAlloc: InventoryAllocation = {
            id: `alloc-${Date.now()}`,
            workspace_id: workspaceId,
            event_id: eventId,
            booth_id: boothId,
            variant_id: variantId,
            allocated_quantity: Math.max(0, allocatedQuantity),
            sold_quantity: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ allocations: [...get().allocations, newAlloc] });
        }
      },
      quickTransferStock: (boothId, variantId, delta) => {
        const { variants, allocations } = get();
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return false;

        // Calculate total allocated across all booths
        const allVariantAllocations = allocations.filter((a) => a.variant_id === variantId);
        const currentTotalAllocated = allVariantAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
        const centralStorage = variant.total_inventory - currentTotalAllocated;

        const currentBoothAlloc = allVariantAllocations.find((a) => a.booth_id === boothId);
        const currentQty = currentBoothAlloc ? currentBoothAlloc.allocated_quantity : 0;
        const targetQty = currentQty + delta;

        // Validation: cannot drop below sold quantity, cannot exceed remaining storage
        if (delta > 0 && delta > centralStorage) {
          return false; // Not enough stock in central storage
        }
        if (targetQty < (currentBoothAlloc?.sold_quantity || 0)) {
          return false; // Cannot de-allocate already sold stock
        }

        if (currentBoothAlloc) {
          set({
            allocations: allocations.map((a) =>
              a.id === currentBoothAlloc.id
                ? { ...a, allocated_quantity: targetQty, updated_at: new Date().toISOString() }
                : a
            ),
          });
        } else {
          const booth = get().booths.find((b) => b.id === boothId);
          if (!booth) return false;
          const newAlloc: InventoryAllocation = {
            id: `alloc-${Date.now()}`,
            workspace_id: booth.workspace_id,
            event_id: booth.event_id,
            booth_id: boothId,
            variant_id: variantId,
            allocated_quantity: targetQty,
            sold_quantity: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ allocations: [...allocations, newAlloc] });
        }
        return true;
      },
      resetTestAllocations: () => {
        set({
          allocations: get().allocations.map((a) =>
            isTestAllocation(a) ? { ...a, sold_quantity: 0, updated_at: new Date().toISOString() } : a
          ),
        });
      },

      // Team & Invitations
      inviteMember: (workspaceId, email, role, invitedBy) => {
        const newInvitation: WorkspaceInvitation = {
          id: `inv-${Date.now()}`,
          workspace_id: workspaceId,
          email,
          role,
          token: `tok_${Math.random().toString(36).substring(2, 10)}`,
          status: 'pending',
          invited_by: invitedBy,
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          created_at: new Date().toISOString(),
        };
        set({ invitations: [newInvitation, ...get().invitations] });
        return newInvitation;
      },
      updateMemberRole: (memberId, newRole) => {
        set({
          members: get().members.map((m) =>
            m.id === memberId ? { ...m, role: newRole, updated_at: new Date().toISOString() } : m
          ),
        });
      },
      removeMember: (memberId) => {
        const target = get().members.find((m) => m.id === memberId);
        if (target?.role === 'owner') return; // Cannot remove owner
        set({ members: get().members.filter((m) => m.id !== memberId) });
      },
      revokeInvitation: (invitationId) => {
        set({ invitations: get().invitations.filter((i) => i.id !== invitationId) });
      },

      // Collab Actions
      addCollabProduct: ({
        workspaceId,
        eventId,
        boothId,
        partnerName,
        name,
        price,
        quantity,
        sku,
        variantName,
        imageUrl,
        barcode,
        reservedQuantity,
        onlinePreorderQuantity,
      }) => {
        const prodId = `prod-collab-${Date.now()}`;
        const varId = `var-collab-${Date.now()}`;
        const allocId = `alloc-collab-${Date.now()}`;

        const newProduct: Product = {
          id: prodId,
          workspace_id: workspaceId,
          category_id: null,
          name: name.trim(),
          description: `Sản phẩm do đối tác ${partnerName} mang đến`,
          image_url: imageUrl?.trim() || null,
          is_active: true,
          collab_partner: partnerName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newVariant: ProductVariant = {
          id: varId,
          workspace_id: workspaceId,
          product_id: prodId,
          sku: sku?.trim().toUpperCase() || `COL-${partnerName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          name: variantName?.trim() || 'Tiêu chuẩn',
          price: Number(price) || 0,
          barcode: barcode?.trim() || null,
          total_inventory: Number(quantity) || 0,
          reserved_quantity: Number(reservedQuantity) || 0,
          online_preorder_quantity: Number(onlinePreorderQuantity) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newAlloc: InventoryAllocation = {
          id: allocId,
          workspace_id: workspaceId,
          event_id: eventId,
          booth_id: boothId,
          variant_id: varId,
          allocated_quantity: Number(quantity) || 0,
          sold_quantity: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set({
          products: [newProduct, ...get().products],
          variants: [newVariant, ...get().variants],
          allocations: [newAlloc, ...get().allocations],
        });

        return { product: newProduct, variant: newVariant, allocation: newAlloc };
      },

      restockCollabVariant: (boothId, variantId, addedQty) => {
        const { variants, allocations } = get();
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return false;

        const alloc = allocations.find((a) => a.booth_id === boothId && a.variant_id === variantId);
        if (!alloc) return false;

        set({
          variants: variants.map((v) =>
            v.id === variantId
              ? { ...v, total_inventory: v.total_inventory + addedQty, updated_at: new Date().toISOString() }
              : v
          ),
          allocations: allocations.map((a) =>
            a.id === alloc.id
              ? { ...a, allocated_quantity: a.allocated_quantity + addedQty, updated_at: new Date().toISOString() }
              : a
          ),
        });
        return true;
      },

      mergeCollabSyncPackage: (pkg) => {
        const { products, variants, allocations, booths } = get();
        const newProducts = [...products];
        const newVariants = [...variants];
        const newAllocations = [...allocations];

        if (pkg.products) {
          pkg.products.forEach((p) => {
            const idx = newProducts.findIndex((item) => item.id === p.id);
            if (idx >= 0) newProducts[idx] = p;
            else newProducts.unshift(p);
          });
        }
        if (pkg.variants) {
          pkg.variants.forEach((v) => {
            const idx = newVariants.findIndex((item) => item.id === v.id);
            if (idx >= 0) newVariants[idx] = v;
            else newVariants.push(v);
          });
        }
        if (pkg.allocations) {
          pkg.allocations.forEach((a) => {
            const idx = newAllocations.findIndex(
              (item) => item.id === a.id || (item.booth_id === a.booth_id && item.variant_id === a.variant_id)
            );
            if (idx >= 0) newAllocations[idx] = a;
            else newAllocations.push(a);
          });
        }
        if (pkg.booth && pkg.booth.id) {
          set({
            booths: booths.map((b) => (b.id === pkg.booth!.id ? { ...b, ...pkg.booth } : b)),
          });
        }

        set({
          products: newProducts,
          variants: newVariants,
          allocations: newAllocations,
        });
      },

      // Seed helper
      seedDemoTourData: (workspaceId) => {
        set({
          events: defaultEvents.map((e) => ({ ...e, workspace_id: workspaceId })),
          booths: defaultBooths.map((b) => ({ ...b, workspace_id: workspaceId })),
          categories: defaultCategories.map((c) => ({ ...c, workspace_id: workspaceId })),
          products: defaultProducts.map((p) => ({ ...p, workspace_id: workspaceId })),
          variants: defaultVariants.map((v) => ({ ...v, workspace_id: workspaceId })),
          allocations: defaultAllocations.map((a) => ({ ...a, workspace_id: workspaceId })),
        });
      },

      clearAllData: () => {
        set({
          events: [],
          booths: [],
          categories: [],
          products: [],
          variants: [],
          allocations: [],
          members: [],
          invitations: [],
        });
      },
    }),
    {
      name: 'eventmate_core_data_v3',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Self-heal and ensure events exist
        if (!state.events || state.events.length === 0) {
          state.events = defaultEvents;
        } else {
          // If evt-test-pos is missing, prepend it
          if (!state.events.some((e) => e.id === 'evt-test-pos')) {
            const testEvt = defaultEvents.find((e) => e.id === 'evt-test-pos');
            if (testEvt) state.events = [testEvt, ...state.events];
          }
          // Ensure test flag is set on test events
          state.events = state.events.map((e) =>
            e.id === 'evt-test-pos' || e.id.includes('test') ? { ...e, is_test: true } : e
          );
        }

        // Self-heal booths
        if (!state.booths || state.booths.length === 0) {
          state.booths = defaultBooths;
        } else {
          if (!state.booths.some((b) => b.id === 'booth-test-1')) {
            const testBooth = defaultBooths.find((b) => b.id === 'booth-test-1');
            if (testBooth) state.booths = [testBooth, ...state.booths];
          }
          state.booths = state.booths.map((b) =>
            b.id === 'booth-test-1' || b.event_id === 'evt-test-pos' || b.code === 'BOOTH-TEST'
              ? { ...b, is_test: true }
              : b
          );
        }

        // Self-heal allocations
        if (!state.allocations || state.allocations.length === 0) {
          state.allocations = defaultAllocations;
        } else {
          if (!state.allocations.some((a) => a.event_id === 'evt-test-pos')) {
            const testAllocs = defaultAllocations.filter((a) => a.event_id === 'evt-test-pos');
            state.allocations = [...state.allocations, ...testAllocs];
          }
          state.allocations = state.allocations.map((a) =>
            a.event_id === 'evt-test-pos' || a.id.includes('test') ? { ...a, is_test: true } : a
          );
        }

        // Self-heal products, variants, categories
        if (!state.products || state.products.length === 0) state.products = defaultProducts;
        if (!state.variants || state.variants.length === 0) state.variants = defaultVariants;
        if (!state.categories || state.categories.length === 0) state.categories = defaultCategories;
        if (!state.members || state.members.length === 0) state.members = defaultMembers;
      },
    }
  )
);
