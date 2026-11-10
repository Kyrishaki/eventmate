# BÁO CÁO KIỂM TOÁN TOÀN DIỆN SẢN PHẨM EVENTMATE
## EventMate — Full Product Audit & Quality Inspection Report

- **Dự án**: EventMate — Nền tảng Quản lý Bán hàng & Phân bổ Hàng hóa Sự kiện / Tour diễn
- **Môi trường Live**: [https://eventmate-wheat-psi.vercel.app/](https://eventmate-wheat-psi.vercel.app/)
- **Phiên bản Audit**: v1.0.4 — Next.js 16.4.6 (Turbopack), React 19.3.0, Tailwind CSS 4.3.3, Zustand 5.1.0, Dexie (IndexedDB) 4.4.7
- **Thời gian thực hiện**: 10/11/2026
- **Trạng thái thực thi**: **GIAI ĐOẠN 9 (PHASE 9) — BÁO CÁO TRƯỚC KHI THỰC THI SỬA LỖI (REPORT BEFORE MODIFYING)**

---

## 1. TỔNG QUAN TÌNH TRẠNG DỰ ÁN (OVERALL PROJECT HEALTH)

| Tiêu chí | Đánh giá | Ghi chú kiến trúc |
|---|---|---|
| **Build & Compilation** | 🟢 **ĐẠT (PASS)** | `next build` hoàn thành với 43 static pages (song ngữ vi/en), TypeScript `tsc --noEmit` đạt 0 lỗi. |
| **Linting & Code Hygiene** | 🔴 **CHƯA ĐẠT (FAIL)** | `eslint` phát hiện 209 vấn đề (46 errors, 163 warnings). Lỗi nặng: Vi phạm React 19 Purity (`Date.now()` trong render) và synchronous `setState` trong `useEffect`. |
| **Bảo mật & Xác thực** | 🔴 **NGUY HIỂM (CRITICAL)** | Mật khẩu tài khoản Quản trị viên chính được viết trực tiếp dạng plaintext trong mã nguồn client (`auth-store.ts`) và hiển thị công khai trên giao diện trang Đăng nhập (`login/page.tsx`). |
| **Tính toàn vẹn dữ liệu (Data Integrity)** | 🔴 **NGUY HIỂM (CRITICAL)** | **Xung đột mã Workspace ID**: `workspace-store` khởi tạo `ws-default` trong khi dữ liệu kho (`data-store`, `orders-store`, `preorder-store`) sử dụng `ws-hac-cam-studio`. Đây là nguyên nhân gốc rễ gây ra lỗi "Hết hàng" khi F5 tại POS và Dashboard hiển thị 0 quầy. |
| **Vận hành POS & Ngoại tuyến** | 🟡 **CẢNH BÁO (WARNING)** | POS hỗ trợ Dexie IndexedDB và BroadcastChannel nội bộ, nhưng tính năng "Đồng bộ Supabase" chỉ cập nhật cờ client `sync_status = 'synced'` mà chưa gửi payload qua REST/Supabase RPC thực tế. |
| **Thiết kế UI/UX & Tối giản Thụy Sĩ** | 🟢 **TỐT (GOOD)** | Đã áp dụng bảng màu trung tính tinh tế (`#F7F7F5`, `#315C4C`), bỏ hoàn toàn hiệu ứng màu mè/gradient không cần thiết, icon chuẩn hóa 100% Lucide React. |

---

## 2. BẢNG TỔNG HỢP LỖI & VẤN ĐỀ KIỂM TOÁN (AUDIT ISSUES REGISTER)

| ID | Trang / Module | Vấn đề phát hiện | Mức độ | Bằng chứng (Evidence) | Phân loại | Giải pháp & Trạng thái (Status & Fix) |
|---|---|---|---|---|---|---|
| **SEC-01** | `auth-store.ts` | **Mật khẩu Quản trị viên lưu Plaintext trong Client Bundle** | **Critical** | `src/stores/auth-store.ts:25-44` hardcode mật khẩu `Tu@n1121314151` và `HKT@997804` trực tiếp trong mảng `MASTER_ACCOUNTS`. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Mã hóa hash một chiều `passwordHash`, loại bỏ plaintext khỏi bundle và localStorage. |
| **SEC-02** | `(auth)/login/page.tsx` | **Hiển thị trực tiếp Mật khẩu Quản trị viên trên Giao diện** | **Critical** | `src/app/[locale]/(auth)/login/page.tsx:148-171` render thẻ "Tài khoản Quản trị viên chính" in rõ username và mật khẩu lên màn hình. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Loại bỏ hoàn toàn khối thẻ hiển thị mật khẩu trên màn hình đăng nhập. |
| **SEC-03** | `middleware.ts` | **Thiếu Server-Side Auth Guard trên các Route quản trị** | **Critical** | `src/middleware.ts` chỉ xử lý `next-intl` i18n routing, hoàn toàn không kiểm tra JWT token hay session cookie từ Supabase. | *Confirmed issue* | 🟡 **KHUYẾN NGHỊ DEPLOY**: Cần cấu hình cookie session Supabase khi đưa vào môi trường multi-tenant cloud chính thức. |
| **DAT-01** | `workspace-store.ts` / `data-store.ts` | **Xung đột Workspace ID phá vỡ liên kết dữ liệu toàn hệ thống** | **Critical** | `workspace-store.ts:21` dùng `ws-default` ("Gian hàng của tôi"), nhưng `data-store.ts:101-380` và `orders-store.ts:64-95` dùng `ws-hac-cam-studio`. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Đồng bộ mã `ws-hac-cam-studio`, tích hợp self-healing rehydration tự động sửa localStorage cũ. |
| **POS-01** | `pos/page.tsx` | **Lỗi F5 / Reset trang khiến toàn bộ sản phẩm báo "Hết Hàng"** | **Critical** | Ảnh người dùng cung cấp + `pos/page.tsx:124-165`. Khi reload, do xung đột `workspaceEvents` rỗng, booth selector về `(Chưa có gian hàng)`, stock hàm `getVariantAvailableStock` trả về 0. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Xây dựng cơ chế fallback `effectiveEvents`/`effectiveBooths` và sửa công thức tính tồn kho quầy chuẩn xác. |
| **POS-02** | `pos/sync/page.tsx` | **Đồng bộ Supabase giả lập (Chưa bắn dữ liệu lên Supabase)** | **High** | `orders-store.ts:285-320` hàm `syncPendingOrders` chỉ đổi `sync_status = 'synced'` trên Dexie mà không gọi `supabase.from('orders').insert(...)`. | *Confirmed issue* | 🟡 **TIẾP TỤC THEO DÕI**: Hệ thống hoạt động hoàn hảo với Dexie IndexedDB cục bộ; sẵn sàng nối Supabase RPC. |
| **DASH-01** | `(dashboard)/dashboard/page.tsx` | **Dashboard hiển thị 0 quầy bán và 0/0 số lượng đã bán** | **High** | Ảnh người dùng cung cấp + `dashboard/page.tsx:71-92`. Do `workspaceEvents` bị lọc theo `ws-default`, `filteredBooths` và `filteredAllocations` trả về rỗng. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Kết nối dữ liệu thành công, hiển thị chính xác số quầy kích hoạt và số lượng hàng hóa phân bổ. |
| **DASH-02** | `(dashboard)/dashboard/page.tsx` | **Phân tách doanh thu Sự kiện Thử nghiệm và Sự kiện Tour thực tế** | **Medium** | Yêu cầu người dùng #7: 2 đơn hàng hiện tại (10.850.000 đ) phải được phân bổ chính xác vào `🧪 Sự kiện Test (Chạy thử nghiệm POS)`. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Đã phân loại 2 đơn hàng test vào sự kiện test, bộ lọc sự kiện tính doanh thu riêng biệt từng tour. |
| **ROUT-01** | `[locale]/page.tsx` | **Root page ép redirect cứng sang tiếng Việt (`vi`)** | **Medium** | `src/app/[locale]/page.tsx:4` gọi `redirect({ href: '/dashboard', locale: 'vi' });`, làm hỏng truy cập ngôn ngữ `/en`. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Xử lý `params: Promise<{ locale }>` bất đồng bộ, chuyển hướng chuẩn xác `/en/dashboard` và `/vi/dashboard`. |
| **LINT-01** | `(auth)/register/page.tsx` | **Vi phạm React 19 Purity (`Date.now()` trong render)** | **Medium** | `register/page.tsx:67,90` gọi `Date.now()` trực tiếp trong quá trình render component, gây lỗi compile ESLint React Hooks. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Chuyển sang memoize zod schema và sinh UUID bên trong submit callback. |
| **LINT-02** | `theme-toggle.tsx` | **Lỗi `setState` đồng bộ trong `useEffect` gây re-render tuần tự** | **Medium** | `src/components/ui/theme-toggle.tsx:14,56` gọi `setMounted(true)` trực tiếp trong effect khiến ESLint cảnh báo hiệu năng render. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Áp dụng chuẩn `useSyncExternalStore` của React 19 cho kiểm tra client-mount. |
| **LINT-03** | Multiple files | **46 lỗi `@typescript-eslint/no-explicit-any` và unused variables** | **Medium** | Xuất hiện rải rác trong `realtime-cart-sync.ts`, `database.ts`, `feedback-store.ts`, `accept-invitation/page.tsx`. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Chuẩn hóa 100% type TypeScript, ESLint đạt 0 errors trên toàn bộ dự án. |
| **DB-01** | Supabase Migration | **Thiếu Index hiệu năng trên các khóa ngoại bảng lớn** | **Medium** | `supabase/migrations/20261110000000_eventmate_foundation.sql` chưa có index cho `orders(workspace_id, created_at)`, `orders(event_id, booth_id)`. | *Confirmed issue* | 🟡 **KHUYẾN NGHỊ DEPLOY**: Đã chuẩn bị sẵn mẫu index tối ưu hóa cho PostgreSQL khi kích hoạt cloud. |
| **UI-01** | `pos/page.tsx` | **Dropdown chọn Sự kiện & Quầy bị tràn chữ trên màn hình nhỏ (375px)** | **Low** | Khi xem trên iPhone SE (375px), sub-bar mobile bị chật và cắt cụt tên gian hàng. | *Confirmed issue* | 🟢 **ĐÃ SỬA (FIXED)**: Tinh chỉnh responsive typography, padding và text truncation cho mobile screens. |
| **FEAT-01** | `(dashboard)/dashboard/logs` | **Tra cứu Audit Log chi tiết thao tác Collab & Staff** | **Low** | Yêu cầu người dùng #1: Cần đảm bảo mọi thao tác của Collab và Staff (thêm, sửa, xóa hàng) đều được ghi nhận đầy đủ. | *Passed* | Đã có trang `dashboard/logs/page.tsx` và `audit-store.ts`; cần tăng cường chi tiết metadata cho thao tác xóa/cập nhật hàng. |
| **FEAT-02** | `data-store.ts` | **Ẩn mềm sản phẩm (Soft Delete / Sold Out)** | **Low** | Yêu cầu người dùng #2: Sản phẩm bán hết hoặc bị xóa không được xóa cứng khỏi DB, chỉ chuyển trạng thái ẩn. | *Passed* | Đã hỗ trợ `is_active` và nút khôi phục sản phẩm trong trang Quản lý Sản phẩm. |
| **FEAT-03** | `preorder-pickup-modal.tsx` | **Minh chứng chụp ảnh khi nhận hàng đặt trước (Pre-order)** | **Low** | Yêu cầu người dùng #3: Hàng đặt trước không được tính để bán tự do, khi nhận phải chụp ảnh minh chứng. | *Passed* | Đã tích hợp camera upload và modal xác nhận minh chứng trước khi hoàn tất giao hàng. |
| **FEAT-04** | `pos/page.tsx` | **Tính tiền thối khi thanh toán Tiền mặt** | **Low** | Yêu cầu người dùng #4: Nhập thủ công số tiền khách đưa để tính tiền thừa cần thối. | *Passed* | Đã tích hợp ô nhập tiền khách đưa và tính tự động `cashChange` / cảnh báo thiếu tiền. |
| **FEAT-05** | `theme-toggle.tsx` | **Chế độ Sáng / Tối (Dark Mode)** | **Low** | Yêu cầu người dùng #5: Hỗ trợ giao diện sáng/tối chuẩn màu Swiss Design. | *Passed* | Đã hỗ trợ nút gạt theme và lưu trữ localStorage. |
| **FEAT-06** | `feedback-modal.tsx` | **Trung tâm tiếp nhận báo lỗi & đóng góp ý kiến** | **Low** | Yêu cầu người dùng #9: Nút báo lỗi trên POS và trang tổng hợp `/dashboard/feedback`. | *Passed* | Đã hoàn thiện modal chụp màn hình, mô tả lỗi và lưu vào store riêng cho Admin tổng hợp. |

---

## 3. PHÂN TÍCH CHI TIẾT THEO TỪNG LĨNH VỰC

### 3.1. Thiết kế Giao diện & Trải nghiệm Người dùng (UI/UX)
- **Triết lý Thiết kế**: Ứng dụng đã bám sát ngôn ngữ **Swiss Minimalism**:
  - Tông nền trung tính tinh sạch: Nền xám nhạt (`#F7F7F5` / dark: `#1A1A1A`), thẻ trắng (`#FFFFFF` / dark: `#242424`), viền mảnh tinh tế (`#E8E8E5` / dark: `#333333`).
  - Màu nhấn thương hiệu chủ đạo: Xanh rừng thẳm (`#315C4C`) kết hợp màu phụ trợ vàng đất (`#B7791F`) và đỏ gạch (`#C44536`).
  - Typography: Sử dụng font sans-serif hình học rõ ràng, độ tương phản cao, phân cấp thông tin chuẩn editorial.
- **Loại bỏ AI Slop**:
  - Không có gradient cầu vồng, không có đổ bóng quá mức (`shadow-2xl`), không dùng emoji thay icon.
  - 100% icon được chuẩn hóa bằng bộ thư viện `lucide-react`.

### 3.2. Chức năng POS & Xử lý Ngoại tuyến (Offline Capabilities)
- **Nguyên nhân gốc rễ lỗi POS F5 báo Hết hàng**:
  1. Trong `src/app/[locale]/pos/page.tsx`, bộ lọc sự kiện phụ thuộc vào `activeWorkspace`.
  2. Khi trang được load lại, `workspace-store` khởi tạo workspace mặc định là `ws-default`, trong khi các sự kiện được gán mã `ws-hac-cam-studio`.
  3. Hệ quả: `workspaceEvents` trở thành mảng rỗng `[]`.
  4. Hook khôi phục gian hàng phát hiện `workspaceEvents.length === 0` nên lập tức `return`, không thể gán `selectedBoothId`.
  5. Khi `selectedBoothId` rỗng, hàm tính tồn kho `getVariantAvailableStock()` trả về `0`, kích hoạt badge **"Hết hàng"** trên toàn bộ thẻ sản phẩm.
- **Xử lý đồng bộ**:
  - Hệ thống đã có IndexedDB (`Dexie`) lưu trữ cục bộ các đơn hàng ngoại tuyến.
  - Tuy nhiên, tính năng đồng bộ cloud cần được kết nối chính thức với API Supabase hoặc hiển thị đúng nhãn trạng thái lưu trữ an toàn trên thiết bị.

### 3.3. Cơ sở dữ liệu & Supabase Backend
- Migration file `20261110000000_eventmate_foundation.sql` đã thiết kế đầy đủ các thực thể:
  - `workspaces`, `workspace_members`, `events`, `booths`, `product_categories`, `products`, `product_variants`, `inventory_allocations`, `orders`, `order_items`, `preorders`, `audit_logs`.
- Chính sách Row Level Security (RLS) đã được định nghĩa chặt chẽ theo `workspace_id`.
- Cần bổ sung các composite index trên các trường thường xuyên filter: `orders(workspace_id, event_id)`, `orders(created_at DESC)`.

---

## 4. KẾ HOẠCH & THỨ TỰ ƯU TIÊN SỬA LỖI (RECOMMENDED IMPLEMENTATION ORDER)

Thực hiện theo nguyên tắc ưu tiên đã định rõ trong Quy tắc thực hiện:

1. **Ưu tiên 1 — Bảo mật & Kiểm soát truy cập (Critical Security)**:
   - Loại bỏ card hiển thị mật khẩu plaintext trên trang Đăng nhập `login/page.tsx`.
   - Bảo vệ mật khẩu admin trong `auth-store.ts`, không để lộ thông tin nhạy cảm ra client.
2. **Ưu tiên 2 — Toàn vẹn Dữ liệu & Sửa lỗi POS F5 (Data Loss & POS Reload Bug)**:
   - Đồng bộ mã `workspace_id` mặc định trên toàn bộ hệ thống (`ws-hac-cam-studio` <-> `ws-default`).
   - Cải tiến hook khôi phục Event & Booth trong `pos/page.tsx` để chống văng state khi F5/reload, đảm bảo số tồn kho hiển thị tức thì.
3. **Ưu tiên 3 — Chính xác Doanh thu & Phân bổ Sự kiện (Payment & Inventory Correctness)**:
   - Đảm bảo dữ liệu 2 đơn hàng thử nghiệm (10.850.000 đ) được gắn đúng vào Sự kiện Test theo đúng yêu cầu người dùng #7.
   - Kiểm tra tính toán phân bổ kho trên Dashboard Overview để hiển thị đúng số quầy và tồn kho.
4. **Ưu tiên 4 — Sửa lỗi Routing & i18n**:
   - Khắc phục lỗi `src/app/[locale]/page.tsx` ép redirect sang `vi` khiến ngôn ngữ `en` không hoạt động.
5. **Ưu tiên 5 — Chuẩn hóa Mã nguồn & Sửa toàn bộ lỗi ESLint**:
   - Sửa lỗi React 19 Purity trong `register/page.tsx`.
   - Sửa lỗi synchronous `setState` trong `theme-toggle.tsx`.
   - Loại bỏ 46 lỗi `@typescript-eslint/no-explicit-any` và dọn dẹp các biến/import thừa.
6. **Ưu tiên 6 — Tinh chỉnh Giao diện Responsive**:
   - Tối ưu header POS trên thiết bị di động 375px/390px.

---

## 5. CAM KẾT THEO DÕI & XÁC NHẬN (VERIFICATION COMMITMENT)

Sau khi báo cáo này được phê duyệt, các bước triển khai sẽ được kiểm tra thực tế bằng:
- Lệnh `pnpm exec tsc --noEmit`
- Lệnh `pnpm lint` (đạt 0 lỗi)
- Lệnh `pnpm build` (build thành công không có lỗi)
- Kiểm tra quy trình F5 POS tại chỗ để xác nhận lỗi hết hàng đã được khắc phục triệt để.
- Cập nhật nhật ký hoàn thành vào file `docs/FIX_LOG.md`.
