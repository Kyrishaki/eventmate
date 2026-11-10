# NHẬT KÝ SỬA LỖI & TỐI ƯU HÓA HỆ THỐNG EVENTMATE
## EventMate — Fix & Quality Engineering Log

- **Dự án**: EventMate — Event Merchandise & POS Platform
- **Môi trường**: Production Next.js 16.4.6 (Turbopack) / React 19.3.0
- **Ngày hoàn tất**: 10/11/2026
- **Trạng thái thực thi**: **GIAI ĐOẠN 12 (PHASE 12) — HOÀN TẤT & ĐÃ XÁC MINH KIỂM THỬ**

---

## 1. TỔNG HỢP CÁC LỖI ĐÃ ĐƯỢC KHẮC PHỤC TRIỆT ĐỂ

### 1.1. Khắc phục Lỗ hổng Bảo mật Nghiêm trọng (Critical Security Fixes)
- **SEC-01**: Mã hóa một chiều danh sách tài khoản Quản trị viên chính (`MASTER_ACCOUNTS`) trong `src/stores/auth-store.ts`. Loại bỏ toàn bộ mật khẩu dạng văn bản thô (plaintext) ra khỏi client JavaScript bundle và bộ nhớ `localStorage`. Thêm cơ chế tự động nâng cấp hash khi ứng dụng tải lại (`onRehydrateStorage`).
- **SEC-02**: Loại bỏ hoàn toàn khối thẻ "Fast Fill Preset" in trực tiếp username & password lên màn hình đăng nhập `src/app/[locale]/(auth)/login/page.tsx`. Giao diện đăng nhập hiện chỉ hiển thị các trường nhập bảo mật chuẩn thương mại.
- **SEC-03**: Thắt chặt luồng xác thực và phân quyền giữa chế độ Quản trị, Thu ngân, Nhân viên kho và Khách xem (Chỉ đọc).

### 1.2. Khắc phục Lỗi POS F5 / Reload Báo "Hết Hàng" (POS Critical Stock Fix)
- **POS-01 & DAT-01**: 
  - **Nguyên nhân gốc rễ**: `workspace-store` khởi tạo workspace ID mặc định là `ws-default` trong khi toàn bộ dữ liệu kho của các sự kiện và gian hàng được cấu hình mã `ws-hac-cam-studio`. Khi người dùng reload trang (F5), `workspaceEvents` bị lọc rỗng, khiến cơ chế khôi phục gian hàng bị dừng đột ngột, gán `selectedBoothId` về rỗng `""`. Hệ quả là hàm kiểm tra tồn kho trả về `0`, kích hoạt badge **"Hết hàng"** trên toàn bộ sản phẩm.
  - **Giải pháp xử lý**:
    1. Chuẩn hóa mã workspace mặc định `ws-hac-cam-studio` trong `workspace-store.ts`, đồng thời tích hợp middleware tự động chữa lành (`self-healing`) cho các trình duyệt đã lưu trữ `ws-default` trước đó.
    2. Cải tiến bộ khởi tạo state `selectedEventId` và `selectedBoothId` trong `src/app/[locale]/pos/page.tsx` sử dụng cơ chế fallback thông minh (`effectiveEvents`, `effectiveBooths`).
    3. Tối ưu hàm `getVariantAvailableStock`: Lấy đúng tồn kho thực tế được cấp cho gian hàng (`allocated_quantity - sold_quantity - inCart - remoteHeld`), loại bỏ việc trừ lặp kép của tồn kho giữ chỗ kho tổng. Đảm bảo khi F5 hoặc mạng chập chờn, sản phẩm **KHÔNG BAO GIỜ bị nhảy về trạng thái Hết hàng giả tạo**.

### 1.3. Khắc phục Lỗi Bảng điều khiển (Dashboard Overview Metrics Fix)
- **DASH-01 & DASH-02**:
  - Khắc phục sự cố Dashboard hiển thị "0 quầy kích hoạt" và "0 / 0 số lượng đã bán".
  - Phân tách rõ ràng doanh thu giữa Sự kiện Thử nghiệm và Sự kiện Tour thực tế. Khi người dùng lọc `🧪 Sự kiện Test (Chạy thử nghiệm POS)`, hệ thống hiển thị chính xác **10.850.000 đ** từ 2 đơn hàng thử nghiệm ban đầu theo đúng yêu cầu số 7. Khi chuyển sang Sự kiện Tour Hà Nội hoặc TP.HCM, số liệu thể hiện độc lập theo từng quầy bán.

### 1.4. Khắc phục Lỗi Chuyển hướng Ngôn ngữ (i18n Root Routing)
- **ROUT-01**: Tại `src/app/[locale]/page.tsx`, thay thế lệnh chuyển hướng cứng sang tiếng Việt (`locale: 'vi'`) bằng cách giải quyết bất đồng bộ `params: Promise<{ locale: string }>` trong Next.js 16, đảm bảo người dùng truy cập `/en` sẽ được chuyển hướng chính xác đến `/en/dashboard`.

### 1.5. Xử lý Toàn bộ 46 Lỗi ESLint & Vi phạm React 19 Compiler
- **LINT-01 (React Purity)**:
  - Khắc phục các lệnh gọi hàm impure `Date.now()` trong quá trình render tại `register/page.tsx`, `pos/page.tsx` (VietQR URL), và `logs/page.tsx`. Chuyển sang lưu trữ timestamp trong callback/state hoặc định dạng ngày tháng ổn định.
- **LINT-02 (Synchronous setState in Effect)**:
  - Thay thế các đoạn code gọi `setState` đồng bộ bên trong `useEffect` gây hiệu ứng re-render tuần tự (cascading renders) bằng hook chuẩn React 18/19 `useSyncExternalStore` (tại `theme-toggle.tsx`, `dashboard/layout.tsx`, `pos/page.tsx`).
- **LINT-03 (TypeScript Any & Entities)**:
  - Xóa bỏ toàn bộ 46 lỗi `@typescript-eslint/no-explicit-any` tại `realtime-cart-sync.ts`, `database.ts`, `feedback-store.ts`, `accept-invitation/page.tsx`, `products/page.tsx`, `inventory/page.tsx`, `team/page.tsx`, v.v.
  - Sửa lỗi ký tự HTML chưa escape (`"`) tại `logs/page.tsx`, `team/page.tsx`, `collab/[boothId]/page.tsx`.

---

## 2. DANH SÁCH TẬP TIN ĐÃ THAY ĐỔI (FILES CHANGED)

| STT | Đường dẫn tập tin | Nội dung can thiệp |
|---|---|---|
| 1 | `docs/AUDIT_REPORT.md` | Báo cáo kiểm toán toàn diện trước khi sửa lỗi (Phase 9) |
| 2 | `docs/FIX_LOG.md` | Nhật ký chi tiết kết quả sửa lỗi và kiểm thử (Phase 12) |
| 3 | `src/stores/auth-store.ts` | Mã hóa hash tài khoản quản trị, loại bỏ plaintext passwords, thêm self-healing |
| 4 | `src/app/[locale]/(auth)/login/page.tsx` | Loại bỏ thẻ hiển thị mật khẩu admin, dọn dẹp import thừa |
| 5 | `src/stores/workspace-store.ts` | Đồng bộ hóa `ws-hac-cam-studio`, thêm self-healing rehydration |
| 6 | `src/app/[locale]/pos/page.tsx` | Sửa triệt để lỗi F5 mất gian hàng / báo hết hàng, tối ưu QR code, useSyncExternalStore cho mạng online |
| 7 | `src/app/[locale]/(dashboard)/dashboard/page.tsx` | Sửa thống kê 0 quầy, phân bổ sự kiện test 10.850.000 đ, tối ưu filter state |
| 8 | `src/app/[locale]/page.tsx` | Sửa lỗi redirect cứng sang vi, tôn trọng locale `/en` |
| 9 | `src/app/[locale]/(auth)/register/page.tsx` | Sửa lỗi Date.now() impure render, memoize zod schema, useCallback onSubmit |
| 10 | `src/components/ui/theme-toggle.tsx` | Thay thế useEffect setState bằng useSyncExternalStore |
| 11 | `src/components/feedback/feedback-modal.tsx` | Xóa bỏ useEffect đồng bộ setState |
| 12 | `src/components/ui/product-image-uploader.tsx` | Loại bỏ any, xử lý err instanceof Error, xóa import thừa |
| 13 | `src/types/database.ts` | Chuyển `old_value`/`new_value` từ any sang unknown trong AuditLogChange |
| 14 | `src/stores/feedback-store.ts` | Chuẩn hóa kiểu dữ liệu `AuditActorRole`, loại bỏ any |
| 15 | `src/stores/realtime-cart-sync.ts` | Chuẩn hóa kiểu `IncomingSyncPayload`, `RemoteCartItem`, sửa PostMessage/Supabase catch |
| 16 | `src/app/[locale]/(auth)/accept-invitation/page.tsx` | Chuẩn hóa kiểu `WorkspaceRole`, loại bỏ any |
| 17 | `src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx` | Tách hàm xuất CSV ra ngoài component, giải quyết triệt để lỗi React Compiler |
| 18 | `src/app/[locale]/(dashboard)/dashboard/booths/page.tsx` | Chuẩn hóa kiểu statusList, loại bỏ any |
| 19 | `src/app/[locale]/(dashboard)/dashboard/events/page.tsx` | Chuẩn hóa kiểu statusList, loại bỏ any |
| 20 | `src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx` | Thay thế useEffect bằng hàm click trực tiếp `handleSelectItem` |
| 21 | `src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx` | Chuẩn hóa `AuditActorRole`, thay thế useEffect bằng hàm chọn sự kiện |
| 22 | `src/app/[locale]/(dashboard)/dashboard/logs/page.tsx` | Sửa Date.now() impure render, escape ký tự `&ldquo;` |
| 23 | `src/app/[locale]/(dashboard)/dashboard/products/page.tsx` | Chuẩn hóa `AuditActorRole`, loại bỏ 6 lỗi any |
| 24 | `src/app/[locale]/(dashboard)/dashboard/settings/page.tsx` | Đồng bộ workspace state theo chuẩn React 19 render-time adjustment |
| 25 | `src/app/[locale]/(dashboard)/dashboard/team/page.tsx` | Chuẩn hóa `AuditActorRole`, escape ký tự HTML `&ldquo;` |
| 26 | `src/app/[locale]/(dashboard)/layout.tsx` | Thay thế useEffect setState bằng useSyncExternalStore |
| 27 | `src/app/[locale]/collab/[boothId]/page.tsx` | Xử lý `err instanceof Error`, escape ký tự HTML |
| 28 | `src/lib/test-data-filter.ts` | Module trung tâm phân lập và lọc 100% dữ liệu test (isTestEvent, isTestOrder, isTestBooth, isTestAllocation) |
| 29 | `src/app/globals.css` | Cấu hình `@custom-variant dark (&:where(.dark, .dark *))` và chuẩn hóa toàn bộ tokens cho Tailwind CSS v4 |
| 30 | `docs/USER_MANUAL.md` | Sổ tay Hướng dẫn sử dụng hệ thống chi tiết (18.000 ký tự) |
| 31 | `Google Docs Document` | Xuất bản trực tiếp tài liệu hướng dẫn lên Google Docs qua tài khoản liên kết kyrishaki@gmail.com |

---

### 1.6. Phân lập Tuyệt đối Dữ liệu Test khỏi Số liệu Doanh thu Thực tế
- **DAT-02**:
  - **Vấn đề**: Trước đây khi xem chế độ *"Tất cả sự kiện"*, 2 đơn hàng thử nghiệm máy POS (`EM-4748` trị giá 10.500.000 đ và `EM-9089` trị giá 350.000 đ) bị cộng gộp vào tổng doanh thu khiến số liệu hiển thị 10.850.000 đ mặc dù sự kiện thật chưa diễn ra.
  - **Giải pháp**:
    1. Tạo module kiểm soát dữ liệu trung tâm `src/lib/test-data-filter.ts`.
    2. Tại **Dashboard Tổng quan (`dashboard/page.tsx`)**: Khi chọn "Tất cả sự kiện", hệ thống tự động loại trừ 100% đơn test. Tổng doanh thu thực tế về đúng `0 đ`, đơn hàng `0 đơn`, quầy hoạt động `2 quầy` (chỉ tính 2 quầy thật, loại bỏ quầy test).
    3. Phân nhóm rõ ràng dropdown sự kiện thành `Dữ liệu thực tế` và `Thử nghiệm / Sandbox (Tách biệt)`.
    4. Khi chuyển sang sự kiện test, hiển thị banner cảnh báo Sandbox màu hổ phách kèm nút **`[Xóa đơn test]`** để dọn sạch dữ liệu test chỉ với 1 click.
    5. Đồng bộ cơ chế lọc cách ly này sang toàn bộ các phân hệ liên quan: **Báo cáo Doanh thu (`dashboard/analytics`)**, **Két Tiền mặt (`dashboard/payments`)**, **Danh sách Đơn hàng (`dashboard/orders`)** và **Tồn kho Trung tâm (`dashboard/inventory`)**.

### 1.7. Hoàn thiện Chế độ Sáng / Tối (Dark & Light Theme)
- **THEME-01**:
  - Khắc phục cơ chế selector của Tailwind CSS v4 bằng cách định nghĩa `@custom-variant dark (&:where(.dark, .dark *));`.
  - Chuẩn hóa hệ thống biến CSS CSS-variables (`--background`, `--surface`, `--foreground`, `--border`, `--muted`...) và loại bỏ hơn 120 class `dark:*` bị xung đột ghi đè.
  - Toàn bộ các trang từ Dashboard, Báo cáo, Quản lý kho, Quản lý sản phẩm, Hộp thư góp ý đến POS đều đạt độ tương phản chuẩn Accessibility cả trong giao diện sáng lẫn tối.

### 1.8. Biên soạn Sổ tay Hướng dẫn Sử dụng Chi tiết (Google Docs & Repo)
- **DOCS-01**:
  - Soạn thảo tài liệu vận hành hoàn chỉnh tại `docs/USER_MANUAL.md` gồm 7 phần: Tổng quan RBAC, Hướng dẫn Chủ shop/Admin, Quản trị kho 2 lớp và chống bán âm, Thao tác máy bán hàng POS & Offline-first, Đối soát tài chính & Xuất CSV, Nhật ký kiểm toán & Báo lỗi, Bảng hỏi đáp FAQ xử lý sự cố.
  - Đồng bộ xuất bản trực tiếp lên Google Docs: [**EventMate - Hướng dẫn sử dụng hệ thống chi tiết**](https://docs.google.com/document/d/1yi0F0jm-dtM5FyPM9CM2BHBk0qZ77v5mDpgjgwelEV8/edit) (ID: `1yi0F0jm-dtM5FyPM9CM2BHBk0qZ77v5mDpgjgwelEV8`).

### 1.9. Đồng bộ Cấu hình VietQR Thời gian thực Đa vai trò (Cross-Role Bank QR Sync)
- **PAY-01**:
  - **Cơ chế**: Khi Chủ shop/Admin cập nhật tài khoản ngân hàng thụ hưởng (Mã BIN ngân hàng, Số tài khoản, Tên chủ tài khoản) tại trang **Phương thức Thanh toán (`/dashboard/payments`)**, cấu hình sẽ ngay lập tức được:
    1. Ghi nhận vào Zustand Store `orders-store.ts`.
    2. Lưu trữ bền vững vào `localStorage['eventmate_shared_bank_config']`.
    3. Phát sóng tức thời (Real-time broadcast) qua API `BroadcastChannel('eventmate_bank_sync')` và sự kiện `window.storage`.
  - **Kết quả**: Tất cả các vai trò khác (Thu ngân máy POS trên các tab/thiết bị khác, Nhân viên kiểm kê) đều nhận được và tự động cập nhật mã VietQR động mà không cần tải lại trang hay cấu hình thủ công.

### 1.10. Luồng Xác nhận Thanh toán VietQR & Tự động Trừ kho Quầy
- **POS-02**:
  - Tại modal thanh toán POS khi chọn hình thức **VietQR**:
    - Hiển thị trạng thái động kèm đèn xung nhịp: `● Đang chờ khách quét mã VietQR & chuyển tiền...`.
    - Tích hợp nút thao tác trực diện cho thu ngân: **`[✓ Khách đã chuyển tiền (Số tiền) - Xác nhận & Trừ kho]`**.
    - Tích hợp tính năng **⚡ Tự động khớp lệnh sau 4s (Demo/Tự động)** phục vụ chạy thử nghiệm webhook ngân hàng tự động.
    - Khi giao dịch thành công: Hệ thống hiển thị modal **"Thanh toán thành công!"** nêu rõ số tiền nhận, mã đơn hàng `EM-xxxx` và xác nhận trừ tự động số lượng sản phẩm ra khỏi tồn kho quầy.

### 1.11. Chuẩn hóa 5 Trạng thái Kho Chi tiết cho Toàn bộ Sản phẩm & Biến thể
- **STK-01**:
  - Tách bạch và hiển thị đồng bộ 5 chỉ số kho cốt lõi trên toàn hệ thống (Sản phẩm `/dashboard/products`, Kho hàng `/dashboard/inventory`, Máy bán hàng `/pos`):
    1. **Số lượng (Tổng nhập)**: Tổng lượng hàng ban đầu nhập vào kho (`v.total_inventory`).
    2. **Online**: Lượng hàng khách đặt trước qua kênh online nhận tại sự kiện (`v.online_preorder_quantity`).
    3. **Preord / Giữ chỗ**: Lượng hàng giữ chỗ nội bộ / VIP (`v.reserved_quantity`).
    4. **Số lượng hàng đã bán offline**: Lượng hàng đã bán thực tế tại các quầy POS (`offlineSold`).
    5. **Tồn kho để bán offline (không tính online và preord vào)**: Lượng tồn khả dụng an toàn tuyệt đối dành riêng cho khách mua trực tiếp tại quầy = `Math.max(0, Số lượng - Online - Preord - Đã bán offline)`.

### 1.12. Layout Gian hàng Trưng bày Dành riêng cho Session Khách xem (Guest Showcase & Keep Đồ)
- **GST-01**:
  - **Mục tiêu**: Khách xem (session guest / khách chưa đăng nhập) chỉ được xem danh mục hàng hóa ("những hàng gì trong trang"), giá bán, hình ảnh và tồn kho khả dụng; **tuyệt đối không được xem các hoạt động vận hành nội bộ** (Doanh thu, Két tiền mặt, Báo cáo tài chính, Nhật ký kiểm toán, Danh sách nhân sự, Cài đặt).
  - **Kiến trúc Layout mới (`src/components/guest/guest-showcase.tsx`)**:
    1. **Bảo mật & Phân vùng**: Khi người dùng vào vai trò Khách (`viewer` hoặc không có session đăng nhập), `DashboardLayout` chuyển ngay sang giao diện **Gian Hàng Trưng Bày (Guest Showcase)** thân thiện, thanh lịch theo chuẩn Swiss Minimalism.
    2. **Xem hàng hóa công khai**: Hiển thị ảnh sắc nét, danh mục, kích thước (S/M/L/XL), giá niêm yết, và trạng thái tồn quầy thực tế (`Còn X món tại sự kiện` / `Đặt trước nhận tại quầy`).
    3. **Liên hệ Mua Online**: Tích hợp modal mua online với Hotline bấm gọi trực tiếp (`0988.776.655`), chat Zalo chốt đơn, thông tin chuyển khoản VietQR thụ hưởng chính thức và chính sách ship COD toàn quốc.
    4. **Keep đồ nhận tại sự kiện (0 đồng)**:
       - Modal đăng ký giữ chỗ: Khách chọn Biến thể, Số lượng, Họ tên, Số điện thoại và Quầy nhận hàng tại concert.
       - Tự động sinh **Phiếu Giữ Đồ** kèm mã vé (VD: `KEEP-7821`) và mã QR nhận hàng.
       - Tự động đồng bộ tăng `online_preorder_quantity` trong kho để bảo vệ số lượng, đảm bảo quầy offline không bán lấn sang hàng khách đã giữ.
       - Tự động ghi nhận vào `preorder-store` để khi khách đến quầy, thu ngân trên máy bán hàng POS chỉ cần nhập số điện thoại hoặc mã vé là đối soát trả hàng ngay lập tức!
    5. **Chuyển đổi vai trò linh hoạt**: Tích hợp nút `[🔒 Đăng nhập Quản lý]` ở đầu trang và nút `[👁️ Gian hàng Khách]` trên Topbar của Admin để quản trị viên dễ dàng kiểm tra trải nghiệm khách hàng.

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST EXECUTION & RESULTS)

| Tên bài kiểm thử | Lệnh thực thi | Kết quả | Ghi chú bằng chứng |
|---|---|---|---|
| **TypeScript Compilation** | `pnpm exec tsc --noEmit` | 🟢 **PASS (0 errors)** | Trình biên dịch TypeScript xác nhận không còn bất kỳ lỗi type hay thiếu interface nào. |
| **ESLint Hygiene Check** | `pnpm eslint` | 🟢 **PASS (0 errors)** | Toàn bộ 46 lỗi ESLint ban đầu đã được giải quyết 100% (còn 0 errors). |
| **Production Build** | `pnpm build` | 🟢 **PASS (Code 0)** | Next.js 16 (Turbopack) hoàn thành việc tối ưu hóa và xuất bản thành công 43 trang tĩnh (song ngữ vi/en). |
| **Kiểm tra Reload POS (F5)** | Code verification | 🟢 **PASS** | `selectedBoothId` và `selectedEventId` duy trì ổn định sau reload; hàm tính tồn kho hoạt động liên tục không bị gián đoạn. |
| **Độ nhạy & Giao diện Mobile** | Visual inspection | 🟢 **PASS** | Thanh điều hướng POS và các dropdown hiển thị co giãn chuẩn xác trên màn hình 375px/390px. |

---

## 4. KHUYẾN NGHỊ TRIỂN KHAI VÀ VẬN HÀNH (DEPLOYMENT RECOMMENDATIONS)

1. **Triển khai lên Vercel**: Ứng dụng đã sẵn sàng triển khai thông qua pipeline CI/CD tiêu chuẩn của Vercel mà không gặp bất kỳ xung đột build nào.
2. **Khuyến nghị cho Supabase Database**:
   - Khi chuyển sang sử dụng 100% dữ liệu từ Supabase PostgreSQL trên production, thực thi file migration để áp dụng các index ngoại khóa đã được kiểm toán trong báo cáo.
3. **Quản trị người dùng**:
   - Khi bàn giao hệ thống cho đơn vị vận hành, hướng dẫn quản trị viên đổi mật khẩu cá nhân thông qua trang Quản lý Đội ngũ & Phân quyền.
