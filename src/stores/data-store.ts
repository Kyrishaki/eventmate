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
  addCategory: (name: string, workspaceId?: string) => ProductCategory;
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
  { id: 'cat-keychain', workspace_id: 'ws-hac-cam-studio', name: 'Keychain & Móc khóa Acrylic', sort_order: 1, created_at: new Date().toISOString() },
  { id: 'cat-standee', workspace_id: 'ws-hac-cam-studio', name: 'Standee Acrylic & Sa bàn 3D', sort_order: 2, created_at: new Date().toISOString() },
  { id: 'cat-figure', workspace_id: 'ws-hac-cam-studio', name: 'Figure & Mô hình Anime/Game', sort_order: 3, created_at: new Date().toISOString() },
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
    id: 'evt-hobby-horizon-2026',
    workspace_id: 'ws-hac-cam-studio',
    name: 'Hobby Horizon 2026 - Anime & Game Festival',
    description: 'Đại hội văn hóa Anime, Comic, Game & Creators lớn nhất Việt Nam. Quy tụ khu Artist Alley, Figure chính hãng và gian hàng fanwork Limbus Company (Project Moon).',
    location: 'Trung tâm Hội chợ & Triển lãm Sài Gòn (SECC), Quận 7, TP.HCM',
    start_date: '2026-11-21T08:30:00Z',
    end_date: '2026-11-22T21:00:00Z',
    status: 'active',
    banner_url: '/products/banner-hobby-horizon.svg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'evt-color-fiesta-2026',
    workspace_id: 'ws-hac-cam-studio',
    name: "Color Fiesta: Mephisto's Bus - Creator & Doujin Festival",
    description: 'Lễ hội Artist Alley & Doujinshi quy mô lớn dành cho cộng đồng fan Limbus Company, Project Moon và Anime/Gacha Games tại TP.HCM.',
    location: 'Nhà thi đấu Hồ Xuân Hương, Quận 3, TP.HCM',
    start_date: '2026-12-12T08:30:00Z',
    end_date: '2026-12-13T20:30:00Z',
    status: 'upcoming',
    banner_url: '/products/banner-color-fiesta.svg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'evt-hobby-horizon-hn',
    workspace_id: 'ws-hac-cam-studio',
    name: 'Hobby Horizon Winter Matsuri - Hà Nội 2026',
    description: 'Lễ hội mùa đông giao lưu Cosplay, Figure, Acrylic Standee & Keychain Anime/Game tại thủ đô Hà Nội.',
    location: 'Cung Văn hóa Lao động Hữu nghị Việt Xô, Hoàn Kiếm, Hà Nội',
    start_date: '2026-12-26T09:00:00Z',
    end_date: '2026-12-27T21:00:00Z',
    status: 'upcoming',
    banner_url: '/products/banner-hobby-horizon-hn.svg',
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
    event_id: 'evt-hobby-horizon-2026',
    name: 'Gian A12 - HikaruStore Official (Artist Alley)',
    code: 'BOOTH-HH-A12',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'booth-b',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-hobby-horizon-2026',
    name: 'Gian B05 - Khu Figure & Standee Limbus',
    code: 'BOOTH-HH-B05',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'booth-collab-genz',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-hobby-horizon-2026',
    name: 'Gian Collab C08 — GenZ Studio x Limbus',
    code: 'BOOTH-COL-GENZ',
    status: 'active',
    booth_type: 'collab',
    collab_partner: 'GenZ Studio',
    revenue_share_ratio: 40,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'booth-cf-1',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-color-fiesta-2026',
    name: 'Gian D01 - Khu Creator Zone (Color Fiesta)',
    code: 'BOOTH-CF-D01',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'booth-hn-1',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-hobby-horizon-hn',
    name: 'Gian M03 - Sảnh Chính (Hobby Horizon HN)',
    code: 'BOOTH-HN-M03',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultProducts: Product[] = [
  {
    id: 'prod-limbus-keychain-sinners',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-keychain',
    name: 'Keychain Acrylic 2 Lớp Limbus Company - 12 Sinners',
    description: 'Móc khóa mica 2 lớp in UV sắc nét kèm hiệu ứng ép kim tuyến Hologram, khoen cài hình bánh răng đồng hồ Dante (Project Moon).',
    image_url: '/products/limbus-keychain-sinners.svg',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-limbus-standee-ego',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-standee',
    name: 'Standee Acrylic Limbus Company - E.G.O & Walpurgisnacht (18cm)',
    description: 'Standee Acrylic dày 4mm cắt laser viền bóng, đế in biểu tượng Lobotomy E.G.O và hiệu ứng ánh kim lấp lánh.',
    image_url: '/products/limbus-standee-ego.svg',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-limbus-figure-chibi',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-figure',
    name: 'Figure Chibi / Nendoroid Limbus Company - Bus Department',
    description: 'Mô hình PVC/ABS cao 10cm chính hãng kèm 3 biểu cảm khuôn mặt thay thế và phụ kiện vũ khí đặc trưng của từng Sinner.',
    image_url: '/products/limbus-figure-chibi.svg',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-limbus-diorama-mephi',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-standee',
    name: 'Standee Sa Bàn 3D Chuyến Xe Mephistopheles - Limbus Company',
    description: 'Bộ Standee sa bàn 5 lớp lắp ghép 3D tái hiện nội thất xe buýt Mephistopheles cùng Charon, Dante và Vergilius.',
    image_url: '/products/limbus-diorama-mephi.svg',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-limbus-shaker-keychain',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-keychain',
    name: 'Keychain Shaker Cát Chảy Limbus Company - Enkephalin & Golden Bough',
    description: 'Móc khóa Shaker chứa dầu lấp lánh màu xanh Enkephalin và nhánh cây vàng Golden Bough cùng charm mini các Sinners bên trong.',
    image_url: '/products/limbus-shaker-keychain.svg',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-anime-figure-popup',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-figure',
    name: 'Figure Anime Chính Hãng - Hobby Horizon Exclusive Pop Up Parade',
    description: 'Dòng Figure PVC tỷ lệ chuẩn cao 18cm nhập khẩu Nhật Bản (Good Smile Company), hộp nguyên seal trưng bày tại Hobby Horizon.',
    image_url: '/products/anime-figure-popup.svg',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-collab-genz-bag',
    workspace_id: 'ws-hac-cam-studio',
    category_id: 'cat-standee',
    name: 'Set Standee & Keychain Hologram Limbus Company x GenZ Studio',
    description: 'Bộ sưu tập Fanart độc quyền hợp tác cùng GenZ Studio cho kỳ lễ hội Hobby Horizon: gồm 1 Standee 16cm + 1 Keychain Hologram + 2 Card bo góc.',
    image_url: '/products/limbus-collab-set.svg',
    collab_partner: 'GenZ Studio',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultVariants: ProductVariant[] = [
  // 1. Keychain Acrylic 12 Sinners
  {
    id: 'var-kc-don',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-keychain-sinners',
    sku: 'LC-KC-DON-03',
    name: 'Don Quixote (#03)',
    price: 65000,
    barcode: '893602001001',
    total_inventory: 120,
    reserved_quantity: 10,
    online_preorder_quantity: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-kc-faust',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-keychain-sinners',
    sku: 'LC-KC-FAUST-02',
    name: 'Faust (#02)',
    price: 65000,
    barcode: '893602001002',
    total_inventory: 100,
    reserved_quantity: 8,
    online_preorder_quantity: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-kc-yisang',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-keychain-sinners',
    sku: 'LC-KC-YISANG-01',
    name: 'Yi Sang (#01)',
    price: 65000,
    barcode: '893602001003',
    total_inventory: 100,
    reserved_quantity: 5,
    online_preorder_quantity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-kc-ishmael',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-keychain-sinners',
    sku: 'LC-KC-ISHMAEL-08',
    name: 'Ishmael (#08)',
    price: 65000,
    barcode: '893602001004',
    total_inventory: 90,
    reserved_quantity: 5,
    online_preorder_quantity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-kc-sinclair',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-keychain-sinners',
    sku: 'LC-KC-SINCLAIR-11',
    name: 'Sinclair (#11)',
    price: 65000,
    barcode: '893602001005',
    total_inventory: 90,
    reserved_quantity: 5,
    online_preorder_quantity: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 2. Standee Acrylic E.G.O & Walpurgisnacht
  {
    id: 'var-st-vergilius',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-standee-ego',
    sku: 'LC-ST-VERG-00',
    name: 'Vergilius (The Red Gaze)',
    price: 145000,
    barcode: '893602002001',
    total_inventory: 80,
    reserved_quantity: 8,
    online_preorder_quantity: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-st-heathcliff',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-standee-ego',
    sku: 'LC-ST-HEATH-07',
    name: 'Heathcliff (#07 - Wild Hunt ID)',
    price: 145000,
    barcode: '893602002002',
    total_inventory: 90,
    reserved_quantity: 10,
    online_preorder_quantity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-st-honglu',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-standee-ego',
    sku: 'LC-ST-HONGLU-06',
    name: 'Hong Lu (#06 - Land of Illusion)',
    price: 135000,
    barcode: '893602002003',
    total_inventory: 80,
    reserved_quantity: 5,
    online_preorder_quantity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-st-ryoshu',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-standee-ego',
    sku: 'LC-ST-RYOSHU-04',
    name: 'Ryōshū (#04 - Red Eyes)',
    price: 135000,
    barcode: '893602002004',
    total_inventory: 75,
    reserved_quantity: 5,
    online_preorder_quantity: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 3. Figure Chibi / Nendoroid Limbus Company
  {
    id: 'var-fig-dante',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-figure-chibi',
    sku: 'LC-FIG-DANTE-10',
    name: 'Dante (Manager - Đầu Đồng Hồ Lửa)',
    price: 850000,
    barcode: '893602003001',
    total_inventory: 40,
    reserved_quantity: 5,
    online_preorder_quantity: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-fig-don',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-figure-chibi',
    sku: 'LC-FIG-DON-03',
    name: 'Don Quixote (La Manchaland Ver.)',
    price: 920000,
    barcode: '893602003002',
    total_inventory: 35,
    reserved_quantity: 5,
    online_preorder_quantity: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-fig-faust',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-figure-chibi',
    sku: 'LC-FIG-FAUST-02',
    name: 'Faust (Zwei / Gesellschaft Ver.)',
    price: 890000,
    barcode: '893602003003',
    total_inventory: 30,
    reserved_quantity: 4,
    online_preorder_quantity: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 4. Standee Sa Bàn 3D Mephistopheles
  {
    id: 'var-dio-mephi-full',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-diorama-mephi',
    sku: 'LC-DIO-MEPHI-SET',
    name: 'Full Set Sa Bàn 3D (Kèm Charon & Mephi)',
    price: 280000,
    barcode: '893602004001',
    total_inventory: 60,
    reserved_quantity: 6,
    online_preorder_quantity: 14,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 5. Keychain Shaker Cát Chảy
  {
    id: 'var-shk-enkephalin',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-shaker-keychain',
    sku: 'LC-SHK-ENKE-01',
    name: 'Bình Enkephalin (Gregor, Outis, Meursault)',
    price: 95000,
    barcode: '893602005001',
    total_inventory: 100,
    reserved_quantity: 10,
    online_preorder_quantity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-shk-bough',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-limbus-shaker-keychain',
    sku: 'LC-SHK-BOUGH-02',
    name: 'Nhánh Golden Bough (Dante & Sinclair)',
    price: 95000,
    barcode: '893602005002',
    total_inventory: 100,
    reserved_quantity: 10,
    online_preorder_quantity: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 6. Figure Anime Pop Up Parade
  {
    id: 'var-fig-frieren',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-anime-figure-popup',
    sku: 'ANI-FIG-FRIEREN',
    name: 'Frieren (Sousou no Frieren - 18cm)',
    price: 950000,
    barcode: '893602006001',
    total_inventory: 35,
    reserved_quantity: 5,
    online_preorder_quantity: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-fig-hoshino-ai',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-anime-figure-popup',
    sku: 'ANI-FIG-AI-01',
    name: 'Ai Hoshino (Oshi no Ko - 18cm)',
    price: 980000,
    barcode: '893602006002',
    total_inventory: 30,
    reserved_quantity: 4,
    online_preorder_quantity: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 7. Collab GenZ Studio x Limbus Company
  {
    id: 'var-collab-genz-bag-std',
    workspace_id: 'ws-hac-cam-studio',
    product_id: 'prod-collab-genz-bag',
    sku: 'COL-GENZ-LC-SET',
    name: 'Combo Walpurgis (Outis, Gregor & Rodion)',
    price: 195000,
    barcode: '893602009001',
    total_inventory: 80,
    reserved_quantity: 5,
    online_preorder_quantity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Default allocations for Hobby Horizon 2026 & Color Fiesta
const defaultAllocations: InventoryAllocation[] = [
  // Keychain Don Quixote: maxOffline 90 -> Booth A: 45, Booth B: 25, CF: 10
  { id: 'alloc-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-don', allocated_quantity: 45, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-don', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-cf-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-color-fiesta-2026', booth_id: 'booth-cf-1', variant_id: 'var-kc-don', allocated_quantity: 10, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Keychain Faust: maxOffline 80 -> Booth A: 40, Booth B: 20, CF: 10
  { id: 'alloc-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-faust', allocated_quantity: 40, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-4', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-faust', allocated_quantity: 20, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-cf-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-color-fiesta-2026', booth_id: 'booth-cf-1', variant_id: 'var-kc-faust', allocated_quantity: 10, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Keychain Yi Sang: maxOffline 80 -> Booth A: 40, Booth B: 20, CF: 10
  { id: 'alloc-5', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-yisang', allocated_quantity: 40, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-6', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-yisang', allocated_quantity: 20, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-cf-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-color-fiesta-2026', booth_id: 'booth-cf-1', variant_id: 'var-kc-yisang', allocated_quantity: 10, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Keychain Ishmael & Sinclair
  { id: 'alloc-7', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-ishmael', allocated_quantity: 35, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-8', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-ishmael', allocated_quantity: 20, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-9', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-sinclair', allocated_quantity: 35, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-10', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-sinclair', allocated_quantity: 20, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Standee E.G.O (Vergilius, Heathcliff, Hong Lu, Ryoshu)
  { id: 'alloc-11', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-st-vergilius', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-12', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-st-vergilius', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-13', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-st-heathcliff', allocated_quantity: 30, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-14', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-st-heathcliff', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-15', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-st-honglu', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-16', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-st-honglu', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-17', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-st-ryoshu', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-18', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-st-ryoshu', allocated_quantity: 20, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Figure Chibi Limbus Company (Dante, Don Quixote, Faust)
  { id: 'alloc-19', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-fig-dante', allocated_quantity: 10, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-20', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-dante', allocated_quantity: 10, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-21', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-fig-don', allocated_quantity: 8, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-22', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-don', allocated_quantity: 8, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-23', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-fig-faust', allocated_quantity: 8, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-24', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-faust', allocated_quantity: 8, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Standee Diorama Mephistopheles & Shaker Keychains
  { id: 'alloc-25', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-dio-mephi-full', allocated_quantity: 18, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-26', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-dio-mephi-full', allocated_quantity: 14, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-27', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-shk-enkephalin', allocated_quantity: 35, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-28', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-shk-enkephalin', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-29', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-shk-bough', allocated_quantity: 35, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-30', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-shk-bough', allocated_quantity: 25, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Anime Scale Figures at Booth B
  { id: 'alloc-31', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-frieren', allocated_quantity: 15, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-32', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-hoshino-ai', allocated_quantity: 14, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Test Event Allocations (Quầy Test POS 01)
  { id: 'alloc-test-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-kc-don', allocated_quantity: 50, sold_quantity: 12, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-kc-faust', allocated_quantity: 50, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-st-vergilius', allocated_quantity: 40, sold_quantity: 1, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-4', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-fig-dante', allocated_quantity: 20, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-5', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-dio-mephi-full', allocated_quantity: 30, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-6', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-shk-enkephalin', allocated_quantity: 40, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Collab Booth Allocations
  { id: 'alloc-collab-genz-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-collab-genz', variant_id: 'var-collab-genz-bag-std', allocated_quantity: 45, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
      addCategory: (name, workspaceId) => {
        const trimmed = name.trim();
        const existing = get().categories.find(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (existing) return existing;

        const newCategory: ProductCategory = {
          id: `cat-${Date.now()}`,
          workspace_id: workspaceId || 'ws-hac-cam-studio',
          name: trimmed,
          sort_order: get().categories.length + 1,
          created_at: new Date().toISOString(),
        };

        set({ categories: [...get().categories, newCategory] });
        return newCategory;
      },
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
        const { variants, allocations, booths } = get();
        const variant = variants.find((v) => v.id === variantId);
        const existing = allocations.find(
          (a) => a.booth_id === boothId && a.variant_id === variantId
        );
        const targetBooth = booths.find((b) => b.id === boothId);
        const isTargetTest = Boolean(existing?.is_test || targetBooth?.is_test);
        const currentSold = existing?.sold_quantity || 0;

        let finalQty = Math.max(currentSold, allocatedQuantity);
        let updatedAllocations = [...allocations];

        if (variant && !isTargetTest) {
          const maxOfflineLimit = Math.max(
            0,
            variant.total_inventory -
              (variant.online_preorder_quantity || 0) -
              (variant.reserved_quantity || 0)
          );

          // Real allocations for this variant at OTHER booths
          const otherRealAllocs = updatedAllocations.filter(
            (a) => a.variant_id === variantId && a.booth_id !== boothId && !isTestAllocation(a)
          );
          const otherRealSold = otherRealAllocs.reduce(
            (sum, a) => sum + (a.sold_quantity || 0),
            0
          );

          // Maximum physical stock possible for this booth (cannot take what was already sold elsewhere)
          const maxPossibleForBooth = Math.max(currentSold, maxOfflineLimit - otherRealSold);
          finalQty = Math.min(finalQty, maxPossibleForBooth);

          // If other booths currently hold unsold allocation that would push total allocated > maxOfflineLimit,
          // automatically reclaim the needed unsold quantity (prioritizing booths from other events first)
          const currentOtherAllocated = otherRealAllocs.reduce(
            (sum, a) => sum + a.allocated_quantity,
            0
          );
          let neededToReclaim = Math.max(0, finalQty + currentOtherAllocated - maxOfflineLimit);

          if (neededToReclaim > 0) {
            // Sort other allocations: other events first, then same event
            const sortedOthers = [...otherRealAllocs].sort((a, b) => {
              const aDiffEvent = a.event_id !== eventId ? 0 : 1;
              const bDiffEvent = b.event_id !== eventId ? 0 : 1;
              return aDiffEvent - bDiffEvent;
            });

            const reductions = new Map<string, number>();
            for (const other of sortedOthers) {
              if (neededToReclaim <= 0) break;
              const unsoldAtOther = Math.max(
                0,
                other.allocated_quantity - (other.sold_quantity || 0)
              );
              if (unsoldAtOther > 0) {
                const take = Math.min(unsoldAtOther, neededToReclaim);
                reductions.set(other.id, other.allocated_quantity - take);
                neededToReclaim -= take;
              }
            }

            if (reductions.size > 0) {
              updatedAllocations = updatedAllocations.map((a) =>
                reductions.has(a.id)
                  ? {
                      ...a,
                      allocated_quantity: reductions.get(a.id)!,
                      updated_at: new Date().toISOString(),
                    }
                  : a
              );
            }
          }
        }

        if (existing) {
          set({
            allocations: updatedAllocations.map((a) =>
              a.id === existing.id
                ? {
                    ...a,
                    allocated_quantity: finalQty,
                    updated_at: new Date().toISOString(),
                  }
                : a
            ),
          });
        } else {
          const newAlloc: InventoryAllocation = {
            id: `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            workspace_id: workspaceId,
            event_id: eventId,
            booth_id: boothId,
            variant_id: variantId,
            allocated_quantity: finalQty,
            sold_quantity: 0,
            is_test: isTargetTest,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ allocations: [...updatedAllocations, newAlloc] });
        }
      },
      quickTransferStock: (boothId, variantId, delta) => {
        const { variants, allocations, booths } = get();
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return false;

        const booth = booths.find((b) => b.id === boothId);
        const currentBoothAlloc = allocations.find(
          (a) => a.booth_id === boothId && a.variant_id === variantId
        );
        const currentQty = currentBoothAlloc ? currentBoothAlloc.allocated_quantity : 0;
        const currentSold = currentBoothAlloc?.sold_quantity || 0;
        const targetQty = currentQty + delta;

        if (targetQty < currentSold) {
          return false;
        }

        const isTargetTest = Boolean(currentBoothAlloc?.is_test || booth?.is_test);
        if (!isTargetTest) {
          const maxOfflineLimit = Math.max(
            0,
            variant.total_inventory -
              (variant.online_preorder_quantity || 0) -
              (variant.reserved_quantity || 0)
          );
          const otherRealSold = allocations
            .filter(
              (a) => a.variant_id === variantId && a.booth_id !== boothId && !isTestAllocation(a)
            )
            .reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
          const maxPossibleForBooth = Math.max(currentSold, maxOfflineLimit - otherRealSold);

          if (delta > 0 && targetQty > maxPossibleForBooth) {
            return false;
          }
        }

        get().setAllocation(
          booth?.workspace_id || currentBoothAlloc?.workspace_id || 'ws-hac-cam-studio',
          booth?.event_id || currentBoothAlloc?.event_id || '',
          boothId,
          variantId,
          targetQty
        );
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

        const initialAllocQty = Math.max(
          0,
          (Number(quantity) || 0) - (Number(reservedQuantity) || 0) - (Number(onlinePreorderQuantity) || 0)
        );

        const newAlloc: InventoryAllocation = {
          id: allocId,
          workspace_id: workspaceId,
          event_id: eventId,
          booth_id: boothId,
          variant_id: varId,
          allocated_quantity: initialAllocQty,
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
      name: 'eventmate_core_data_v4',
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('eventmate_core_data_v3');
            const savedEvt = localStorage.getItem('eventmate_pos_selected_event');
            if (savedEvt === 'evt-hanoi-2026' || savedEvt === 'evt-saigon-2026') {
              localStorage.setItem('eventmate_pos_selected_event', 'evt-hobby-horizon-2026');
            }
            const savedDashEvt = localStorage.getItem('eventmate_dashboard_selected_event');
            if (savedDashEvt === 'evt-hanoi-2026' || savedDashEvt === 'evt-saigon-2026') {
              localStorage.setItem('eventmate_dashboard_selected_event', 'all');
            }
          } catch {
            // ignore storage errors
          }
        }
        if (!state) return;

        // Purge any legacy Hạc Cầm Concert data if ever present
        const legacyEventIds = new Set(['evt-hanoi-2026', 'evt-saigon-2026']);
        const legacyProductIds = new Set([
          'prod-tshirt-tour',
          'prod-tour-cap',
          'prod-lightstick',
          'prod-vinyl-album',
        ]);

        if (state.events?.some((e) => legacyEventIds.has(e.id))) {
          state.events = defaultEvents;
        }
        if (state.products?.some((p) => legacyProductIds.has(p.id))) {
          state.products = defaultProducts;
          state.variants = defaultVariants;
          state.categories = defaultCategories;
          state.booths = defaultBooths;
          state.allocations = defaultAllocations;
        }

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
          if (!state.booths.some((b) => b.id === 'booth-collab-genz')) {
            const collabBooth = defaultBooths.find((b) => b.id === 'booth-collab-genz');
            if (collabBooth) state.booths = [...state.booths, collabBooth];
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
          if (!state.allocations.some((a) => a.id === 'alloc-collab-genz-1')) {
            const collabAlloc = defaultAllocations.find((a) => a.id === 'alloc-collab-genz-1');
            if (collabAlloc) state.allocations = [...state.allocations, collabAlloc];
          }
          state.allocations = state.allocations.map((a) =>
            a.event_id === 'evt-test-pos' || a.id.includes('test') ? { ...a, is_test: true } : a
          );
        }

        // Self-heal products, variants, categories
        if (!state.products || state.products.length === 0) {
          state.products = defaultProducts;
        } else if (!state.products.some((p) => p.id === 'prod-collab-genz-bag')) {
          const collabProd = defaultProducts.find((p) => p.id === 'prod-collab-genz-bag');
          if (collabProd) state.products = [...state.products, collabProd];
        }

        if (!state.variants || state.variants.length === 0) {
          state.variants = defaultVariants;
        } else if (!state.variants.some((v) => v.id === 'var-collab-genz-bag-std')) {
          const collabVar = defaultVariants.find((v) => v.id === 'var-collab-genz-bag-std');
          if (collabVar) state.variants = [...state.variants, collabVar];
        }
        if (!state.categories || state.categories.length === 0) state.categories = defaultCategories;
        if (!state.members || state.members.length === 0) state.members = defaultMembers;
      },
    }
  )
);
