import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
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
  createEvent: (event: Omit<EventItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => EventItem;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;

  // Booth Actions
  createBooth: (booth: Omit<Booth, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Booth;
  updateBooth: (id: string, updates: Partial<Booth>) => void;
  deleteBooth: (id: string) => void;

  // Product & Variant Actions
  addCategory: (name: string, workspaceId?: string) => ProductCategory;
  createProduct: (
    product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    variants: Array<Omit<ProductVariant, 'id' | 'workspace_id' | 'product_id' | 'created_at' | 'updated_at'>>
  ) => Product;
  updateProduct: (
    id: string,
    updates: Partial<Product>,
    variantUpdates?: Array<{
      id?: string;
      name: string;
      sku: string;
      price: number;
      total_inventory: number;
      reserved_quantity?: number;
      online_preorder_quantity?: number;
      barcode?: string | null;
    }>
  ) => void;
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
  allocateMaxToBooth: (
    workspaceId: string,
    eventId: string,
    boothId: string,
    variantIds?: string[]
  ) => number;
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
    tags?: string[];
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
    tags: ['Limbus Company', 'Project Moon', 'Keychain', 'Acrylic', 'Hologram', 'Best Seller'],
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
    tags: ['Limbus Company', 'Project Moon', 'Standee', 'Acrylic', 'E.G.O', 'Walpurgisnacht'],
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
    tags: ['Limbus Company', 'Figure', 'Chibi', 'Nendoroid', 'Premium'],
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
    tags: ['Limbus Company', 'Standee 3D', 'Sa bàn', 'Mephistopheles', 'Limited'],
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
    tags: ['Limbus Company', 'Keychain', 'Shaker', 'Cát chảy', 'Enkephalin'],
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
    tags: ['Anime', 'Figure', 'Pop Up Parade', 'Frieren', 'Oshi no Ko', 'Chính hãng'],
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
    tags: ['Limbus Company', 'Collab', 'GenZ Studio', 'Combo Set', 'Hologram'],
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
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
    total_inventory: 0,
    reserved_quantity: 0,
    online_preorder_quantity: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Default allocations for Hobby Horizon 2026 & Color Fiesta (all default quantities = 0 until user enters)
const defaultAllocations: InventoryAllocation[] = [
  // Keychain Don Quixote
  { id: 'alloc-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-don', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-don', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-cf-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-color-fiesta-2026', booth_id: 'booth-cf-1', variant_id: 'var-kc-don', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Keychain Faust
  { id: 'alloc-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-faust', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-4', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-faust', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-cf-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-color-fiesta-2026', booth_id: 'booth-cf-1', variant_id: 'var-kc-faust', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Keychain Yi Sang
  { id: 'alloc-5', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-yisang', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-6', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-yisang', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-cf-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-color-fiesta-2026', booth_id: 'booth-cf-1', variant_id: 'var-kc-yisang', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Keychain Ishmael & Sinclair
  { id: 'alloc-7', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-ishmael', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-8', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-ishmael', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-9', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-kc-sinclair', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-10', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-kc-sinclair', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Standee E.G.O (Vergilius, Heathcliff, Hong Lu, Ryoshu)
  { id: 'alloc-11', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-st-vergilius', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-12', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-st-vergilius', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-13', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-st-heathcliff', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-14', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-st-heathcliff', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-15', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-st-honglu', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-16', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-st-honglu', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-17', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-st-ryoshu', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-18', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-st-ryoshu', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Figure Chibi Limbus Company (Dante, Don Quixote, Faust)
  { id: 'alloc-19', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-fig-dante', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-20', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-dante', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-21', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-fig-don', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-22', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-don', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-23', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-fig-faust', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-24', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-faust', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Standee Diorama Mephistopheles & Shaker Keychains
  { id: 'alloc-25', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-dio-mephi-full', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-26', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-dio-mephi-full', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-27', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-shk-enkephalin', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-28', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-shk-enkephalin', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-29', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-a', variant_id: 'var-shk-bough', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-30', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-shk-bough', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Anime Scale Figures at Booth B
  { id: 'alloc-31', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-frieren', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-32', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-b', variant_id: 'var-fig-hoshino-ai', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Test Event Allocations (Quầy Test POS 01)
  { id: 'alloc-test-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-kc-don', allocated_quantity: 0, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-2', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-kc-faust', allocated_quantity: 0, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-3', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-st-vergilius', allocated_quantity: 0, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-4', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-fig-dante', allocated_quantity: 0, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-5', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-dio-mephi-full', allocated_quantity: 0, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'alloc-test-6', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-test-pos', booth_id: 'booth-test-1', variant_id: 'var-shk-enkephalin', allocated_quantity: 0, sold_quantity: 0, is_test: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Collab Booth Allocations
  { id: 'alloc-collab-genz-1', workspace_id: 'ws-hac-cam-studio', event_id: 'evt-hobby-horizon-2026', booth_id: 'booth-collab-genz', variant_id: 'var-collab-genz-bag-std', allocated_quantity: 0, sold_quantity: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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

const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // QuotaExceededError recovery: purge obsolete keys and retry without crashing the UI
      try {
        window.localStorage.removeItem('eventmate_core_data_v3');
        window.localStorage.removeItem('eventmate_core_data_v4');
        window.localStorage.removeItem('eventmate_audit_logs_v1');
        window.localStorage.setItem(name, value);
      } catch (retryErr) {
        console.warn('HikaruStore storage quota reached; keeping state in memory:', retryErr);
      }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useDataStore = create<DataStoreState>()(
  persist(
    (set, get) => ({
      events: [],
      booths: [],
      categories: defaultCategories,
      products: defaultProducts,
      variants: defaultVariants,
      allocations: [],
      members: defaultMembers,
      invitations: defaultInvitations,

      // Events
      createEvent: (eventData) => {
        const targetId =
          eventData.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const existing = get().events.find((e) => e.id === targetId);
        if (existing) return existing;

        const nowIso = new Date().toISOString();
        const newEvent: EventItem = {
          ...eventData,
          id: targetId,
          created_at: nowIso,
          updated_at: nowIso,
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
        const targetId =
          boothData.id || `booth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const existing = get().booths.find((b) => b.id === targetId);
        if (existing) return existing;

        const nowIso = new Date().toISOString();
        const newBooth: Booth = {
          ...boothData,
          id: targetId,
          created_at: nowIso,
          updated_at: nowIso,
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
          price: Math.max(0, Number(v.price) || 0),
          total_inventory: Math.max(0, Number(v.total_inventory) || 0),
          reserved_quantity: Math.max(0, Number(v.reserved_quantity) || 0),
          online_preorder_quantity: Math.max(0, Number(v.online_preorder_quantity) || 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        set({
          products: [newProduct, ...get().products],
          variants: [...newVariants, ...get().variants],
        });

        return newProduct;
      },
      updateProduct: (id, updates, variantUpdates) => {
        const nowIso = new Date().toISOString();
        const existingProd = get().products.find((p) => p.id === id);
        const wsId = existingProd?.workspace_id || 'ws-hac-cam-studio';

        let nextVariants = get().variants;
        if (variantUpdates && variantUpdates.length > 0) {
          const otherVariants = nextVariants.filter((v) => v.product_id !== id);
          const existingForProd = nextVariants.filter((v) => v.product_id === id);

          const updatedForProd: ProductVariant[] = variantUpdates.map((vu, idx) => {
            const matched =
              (vu.id && existingForProd.find((ev) => ev.id === vu.id)) || existingForProd[idx];
            return {
              id: matched?.id || `var-${Date.now()}-${idx}`,
              workspace_id: matched?.workspace_id || wsId,
              product_id: id,
              name: vu.name?.trim() || 'Tiêu chuẩn',
              sku: vu.sku?.trim().toUpperCase() || matched?.sku || `SKU-${Date.now().toString().slice(-4)}`,
              price: Math.max(0, Number(vu.price) || 0),
              total_inventory: Math.max(0, Number(vu.total_inventory) || 0),
              reserved_quantity: Math.max(0, Number(vu.reserved_quantity) || 0),
              online_preorder_quantity: Math.max(0, Number(vu.online_preorder_quantity) || 0),
              barcode: vu.barcode ?? matched?.barcode ?? null,
              created_at: matched?.created_at || nowIso,
              updated_at: nowIso,
            };
          });

          nextVariants = [...updatedForProd, ...otherVariants];
        }

        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: nowIso } : p
          ),
          variants: nextVariants,
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
        const currentSold = Math.max(0, Number(existing?.sold_quantity) || 0);
        const safeRequestedQty = Number.isFinite(Number(allocatedQuantity))
          ? Math.floor(Number(allocatedQuantity))
          : currentSold;

        let finalQty = Math.max(currentSold, safeRequestedQty);
        let updatedAllocations = [...allocations];
        const nowIso = new Date().toISOString();

        if (variant && !isTargetTest) {
          const totalInv = Math.max(0, Number(variant.total_inventory) || 0);
          const onlineQty = Math.max(0, Number(variant.online_preorder_quantity) || 0);
          const reservedQty = Math.max(0, Number(variant.reserved_quantity) || 0);
          const maxOfflineLimit = Math.max(0, totalInv - onlineQty - reservedQty);

          // Real allocations for this variant at OTHER booths
          const otherRealAllocs = updatedAllocations.filter(
            (a) => a.variant_id === variantId && a.booth_id !== boothId && !isTestAllocation(a)
          );
          const otherRealSold = otherRealAllocs.reduce(
            (sum, a) => sum + (Number(a.sold_quantity) || 0),
            0
          );

          // Maximum physical stock possible for this booth (cannot take what was already sold elsewhere)
          const maxPossibleForBooth = Math.max(currentSold, maxOfflineLimit - otherRealSold);
          finalQty = Math.min(finalQty, maxPossibleForBooth);

          // If other booths currently hold unsold allocation that would push total allocated > maxOfflineLimit,
          // automatically reclaim the needed unsold quantity (prioritizing booths from other events first)
          const currentOtherAllocated = otherRealAllocs.reduce(
            (sum, a) => sum + (Number(a.allocated_quantity) || 0),
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
              const otherAllocQty = Number(other.allocated_quantity) || 0;
              const otherSoldQty = Number(other.sold_quantity) || 0;
              const unsoldAtOther = Math.max(0, otherAllocQty - otherSoldQty);
              if (unsoldAtOther > 0) {
                const take = Math.min(unsoldAtOther, neededToReclaim);
                reductions.set(other.id, otherAllocQty - take);
                neededToReclaim -= take;
              }
            }

            if (reductions.size > 0) {
              updatedAllocations = updatedAllocations.map((a) =>
                reductions.has(a.id)
                  ? {
                      ...a,
                      allocated_quantity: reductions.get(a.id)!,
                      updated_at: nowIso,
                    }
                  : a
              );
            }
          }
        }

        if (existing) {
          if (existing.allocated_quantity === finalQty && updatedAllocations === allocations) {
            return;
          }
          set({
            allocations: updatedAllocations.map((a) =>
              a.id === existing.id
                ? {
                    ...a,
                    allocated_quantity: finalQty,
                    updated_at: nowIso,
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
            created_at: nowIso,
            updated_at: nowIso,
          };
          set({ allocations: [...updatedAllocations, newAlloc] });
        }
      },
      allocateMaxToBooth: (workspaceId, eventId, boothId, variantIds) => {
        const { variants, allocations, booths } = get();
        const targetBooth = booths.find((b) => b.id === boothId);
        if (!targetBooth) return 0;

        const isTargetTest = Boolean(targetBooth.is_test);
        const targetVariantSet = variantIds ? new Set(variantIds) : null;
        const candidateVariants = variants.filter((v) =>
          targetVariantSet ? targetVariantSet.has(v.id) : true
        );

        let updatedAllocations = [...allocations];
        const newAllocationsToAdd: InventoryAllocation[] = [];
        let updatedCount = 0;
        const nowIso = new Date().toISOString();

        for (let idx = 0; idx < candidateVariants.length; idx++) {
          const variant = candidateVariants[idx];
          const existingIdx = updatedAllocations.findIndex(
            (a) => a.booth_id === boothId && a.variant_id === variant.id
          );
          const existing = existingIdx >= 0 ? updatedAllocations[existingIdx] : undefined;
          const currentAllocQty = Math.max(0, Number(existing?.allocated_quantity) || 0);
          const currentSoldQty = Math.max(0, Number(existing?.sold_quantity) || 0);

          const totalInv = Math.max(0, Number(variant.total_inventory) || 0);
          const onlineQty = Math.max(0, Number(variant.online_preorder_quantity) || 0);
          const reservedQty = Math.max(0, Number(variant.reserved_quantity) || 0);
          const maxOfflineLimit = Math.max(0, totalInv - onlineQty - reservedQty);

          const otherRealAllocs = updatedAllocations.filter(
            (a) =>
              a.variant_id === variant.id &&
              a.booth_id !== boothId &&
              !isTestAllocation(a)
          );
          const otherRealSold = isTargetTest
            ? 0
            : otherRealAllocs.reduce((sum, a) => sum + (Number(a.sold_quantity) || 0), 0);

          const maxAllowed = Math.max(currentSoldQty, maxOfflineLimit - otherRealSold);
          if (maxAllowed <= currentAllocQty) continue;

          if (!isTargetTest) {
            const currentOtherAllocated = otherRealAllocs.reduce(
              (sum, a) => sum + (Number(a.allocated_quantity) || 0),
              0
            );
            let neededToReclaim = Math.max(
              0,
              maxAllowed + currentOtherAllocated - maxOfflineLimit
            );

            if (neededToReclaim > 0) {
              const sortedOthers = [...otherRealAllocs].sort((a, b) => {
                const aDiffEvent = a.event_id !== eventId ? 0 : 1;
                const bDiffEvent = b.event_id !== eventId ? 0 : 1;
                return aDiffEvent - bDiffEvent;
              });

              const reductions = new Map<string, number>();
              for (const other of sortedOthers) {
                if (neededToReclaim <= 0) break;
                const otherAllocQty = Number(other.allocated_quantity) || 0;
                const otherSoldQty = Number(other.sold_quantity) || 0;
                const unsoldAtOther = Math.max(0, otherAllocQty - otherSoldQty);
                if (unsoldAtOther > 0) {
                  const take = Math.min(unsoldAtOther, neededToReclaim);
                  reductions.set(other.id, otherAllocQty - take);
                  neededToReclaim -= take;
                }
              }

              if (reductions.size > 0) {
                updatedAllocations = updatedAllocations.map((a) =>
                  reductions.has(a.id)
                    ? {
                        ...a,
                        allocated_quantity: reductions.get(a.id)!,
                        updated_at: nowIso,
                      }
                    : a
                );
              }
            }
          }

          if (existing && existingIdx >= 0) {
            updatedAllocations[existingIdx] = {
              ...updatedAllocations[existingIdx],
              allocated_quantity: maxAllowed,
              updated_at: nowIso,
            };
          } else {
            newAllocationsToAdd.push({
              id: `alloc-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              workspace_id: workspaceId,
              event_id: eventId,
              booth_id: boothId,
              variant_id: variant.id,
              allocated_quantity: maxAllowed,
              sold_quantity: 0,
              is_test: isTargetTest,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }

          updatedCount += 1;
        }

        if (updatedCount > 0) {
          set({ allocations: [...updatedAllocations, ...newAllocationsToAdd] });
        }

        return updatedCount;
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
        tags,
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
          tags: tags && tags.length > 0 ? tags : ['Collab', partnerName],
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
      name: 'eventmate_core_data_v5',
      storage: createJSONStorage(() => safeLocalStorage),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('eventmate_core_data_v3');
            localStorage.removeItem('eventmate_core_data_v4');
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
          state.events = [];
        }
        if (state.products?.some((p) => legacyProductIds.has(p.id))) {
          state.products = defaultProducts;
          state.variants = defaultVariants;
          state.categories = defaultCategories;
          state.booths = [];
          state.allocations = [];
        }

        // Deduplicate events without forcing demo/test events
        if (!state.events) {
          state.events = [];
        } else {
          const seenEventIds = new Set<string>();
          const seenCollabEventNames = new Set<string>();
          state.events = state.events
            .filter((e) => {
              if (!e || !e.id || seenEventIds.has(e.id)) return false;
              seenEventIds.add(e.id);
              if (e.event_type === 'collab_event') {
                const key = `${e.workspace_id}:${(e.name || '').trim().toLowerCase()}`;
                const hasBoothAlloc = state.allocations?.some((a) => a.event_id === e.id);
                if (!hasBoothAlloc && seenCollabEventNames.has(key)) {
                  return false;
                }
                seenCollabEventNames.add(key);
              }
              return true;
            })
            .map((e) =>
              e.id === 'evt-test-pos' || e.id.includes('test') ? { ...e, is_test: true } : e
            );
        }

        // Deduplicate booths without forcing demo/test booths
        if (!state.booths) {
          state.booths = [];
        } else {
          const seenBoothIds = new Set<string>();
          const seenCollabBoothKeys = new Set<string>();
          state.booths = state.booths
            .filter((b) => {
              if (!b || !b.id || seenBoothIds.has(b.id)) return false;
              seenBoothIds.add(b.id);
              if (b.booth_type === 'collab' && b.code?.startsWith('COL-')) {
                const key = `${b.name}:${b.code}:${b.collab_partner || ''}`;
                const hasAlloc = state.allocations?.some(
                  (a) => a.booth_id === b.id && (a.allocated_quantity > 0 || a.sold_quantity > 0)
                );
                if (!hasAlloc && seenCollabBoothKeys.has(key)) {
                  return false;
                }
                seenCollabBoothKeys.add(key);
              }
              return true;
            })
            .map((b) =>
              b.id === 'booth-test-1' || b.event_id === 'evt-test-pos' || b.code === 'BOOTH-TEST'
                ? { ...b, is_test: true }
                : b
            );
        }

        // Deduplicate allocations by (booth_id, variant_id) without forcing demo allocs
        if (!state.allocations) {
          state.allocations = [];
        } else {
          const allocMap = new Map<string, InventoryAllocation>();
          for (const raw of state.allocations) {
            if (!raw || !raw.booth_id || !raw.variant_id) continue;
            const normalized: InventoryAllocation = {
              ...raw,
              allocated_quantity: Math.max(0, Number(raw.allocated_quantity) || 0),
              sold_quantity: Math.max(0, Number(raw.sold_quantity) || 0),
              is_test:
                raw.is_test === true ||
                raw.event_id === 'evt-test-pos' ||
                Boolean(raw.id && raw.id.includes('test')),
            };
            const key = `${normalized.booth_id}::${normalized.variant_id}`;
            const prev = allocMap.get(key);
            if (
              !prev ||
              normalized.allocated_quantity > prev.allocated_quantity ||
              normalized.sold_quantity > prev.sold_quantity
            ) {
              allocMap.set(key, normalized);
            }
          }
          state.allocations = Array.from(allocMap.values());
        }

        // Self-heal products, variants, categories
        if (!state.products || state.products.length === 0) {
          state.products = defaultProducts;
        } else {
          // Backfill default tags for existing default products if missing
          const defaultProdTagMap = new Map(defaultProducts.map((dp) => [dp.id, dp.tags || []]));
          state.products = state.products.map((p) => {
            if (!p.tags || p.tags.length === 0) {
              const fallbackTags = defaultProdTagMap.get(p.id);
              if (fallbackTags && fallbackTags.length > 0) {
                return { ...p, tags: fallbackTags };
              }
            }
            return p;
          });
        }

        if (!state.variants || state.variants.length === 0) {
          state.variants = defaultVariants;
        }
        if (!state.categories || state.categories.length === 0) state.categories = defaultCategories;
        if (!state.members || state.members.length === 0) state.members = defaultMembers;
      },
    }
  )
);
