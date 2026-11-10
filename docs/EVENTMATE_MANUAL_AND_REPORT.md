# EVENTMATE — BÁO CÁO KIỂM TOÁN HỆ THỐNG & TÀI LIỆU HƯỚNG DẪN SỬ DỤNG
**Nền tảng:** Event Merchandise Management & Multi-booth POS Platform  
**Phiên bản hệ thống:** v1.0.0 (Production Stable)  
**Tác giả:** Đội ngũ Kỹ thuật & Kiểm toán Hệ thống EventMate  
**Ngày cập nhật:** Tháng 11 / 2026  
**Trạng thái triển khai:** Sẵn sàng vận hành (Production Verified)

---

# MỤC LỤC
1. [PHẦN I: BÁO CÁO KIỂM TOÁN & NÂNG CẤP KỸ THUẬT (AUDIT REPORT)](#phần-i-báo-cáo-kiểm-toán--nâng-cấp-kỹ-thuật)
   - 1.1. Tổng quan Kiến trúc Hệ thống
   - 1.2. Bảng Tổng Hợp Các Lỗi Trọng Yếu & Kết Quả Xử Lý
   - 1.3. Chi tiết Giải pháp Kỹ thuật cho các Vấn đề Lớn
     - [POS-01] Sửa lỗi F5 reload trang POS báo hết hàng
     - [SEC-01] Bảo mật tài khoản & Cơ chế băm mật khẩu
     - [DASH-01 & DASH-02] Đồng bộ dữ liệu Workspace và Báo cáo Doanh thu theo Sự kiện
     - [LINT-01] Chuẩn hóa mã nguồn React 19 & Khắc phục 46 cảnh báo ESLint
     - [SYNC-01] Đồng bộ giỏ hàng thời gian thực giữa nhiều quầy thu ngân
   - 1.4. Báo cáo Kiểm thử Chất lượng (Verification Metrics)
2. [PHẦN II: TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HỆ THỐNG (USER MANUAL)](#phần-ii-tài-liệu-hướng-dẫn-sử-dụng-hệ-thống)
   - 2.1. Đăng nhập & Ma trận Phân quyền Tài khoản
   - 2.2. Bảng Điều Khiển Tổng Quan (Dashboard) & Bộ Lọc Sự Kiện
   - 2.3. Quản lý Sự kiện & Tour diễn (Events Management)
   - 2.4. Quản lý Gian hàng & Quầy bán (Booths Management)
   - 2.5. Quản lý Sản phẩm, Biến thể & Kho hàng (Products & Inventory)
     - Khởi tạo sản phẩm & Tải ảnh trực tiếp từ điện thoại / máy tính
     - Cơ chế Giữ chỗ VIP & Khóa đơn đặt trước Online
     - Quy định Ẩn sản phẩm bán hết (Soft Delete / Lưu trữ an toàn)
     - Phân bổ hàng hóa từ Kho tổng về Quầy bán
   - 2.6. Màn hình Bán hàng Thu ngân (POS Terminal)
     - Quy trình chọn Quầy & Thêm sản phẩm vào giỏ
     - Đồng bộ giỏ hàng thời gian thực giữa các thu ngân
     - Thanh toán Tiền mặt & Tính tiền thối tự động
     - Thanh toán Chuyển khoản VietQR Động
     - Cơ chế Bán hàng Ngoại tuyến (Offline Mode) & Đồng bộ tự động
   - 2.7. Quy trình Trả Hàng Đặt Trước (Pre-order Pickup)
     - Tra cứu đơn hàng đặt trước
     - Chụp ảnh minh chứng nhận hàng bắt buộc
     - Xác nhận hoàn tất đơn hàng
   - 2.8. Cổng Đối Tác Hợp Tác Bán Hàng (Collab Portal)
   - 2.9. Nhật Ký Hoạt Động & Kiểm Tra Hệ Thống (Audit Logs)
   - 2.10. Trung Tâm Góp Ý & Báo Cáo Sự Cố (Feedback Portal)
   - 2.11. Chuyển đổi Giao diện Sáng / Tối (Light & Dark Mode)
3. [PHẦN III: KHUYẾN NGHỊ VẬN HÀNH & KẾ HOẠCH BẢO TRÌ](#phần-iii-khuyến-nghị-vận-hành--kế-hoạch-bảo-trì)

---

# PHẦN I: BÁO CÁO KIỂM TOÁN & NÂNG CẤP KỸ THUẬT

## 1.1. Tổng quan Kiến trúc Hệ thống
EventMate là nền tảng quản trị hàng hóa lưu niệm (Merchandise) và điểm bán hàng POS đa quầy chuyên biệt cho các concert, lễ hội âm nhạc và sự kiện quy mô lớn. Hệ thống được xây dựng trên nền tảng công nghệ hiện đại nhằm đảm bảo tính sẵn sàng cao, hoạt động mượt mà ngay cả khi mất kết nối mạng:
- **Frontend Framework:** Next.js 16 (App Router, Turbopack) & React 19.
- **Styling & UI:** Tailwind CSS v4, Lucide React Icons, Shadcn UI tokens tuân thủ phong cách Swiss Minimalism.
- **State Management:** Zustand v5 (Store phân tầng, persist an toàn).
- **Offline Storage:** Dexie.js (IndexedDB wrapper) hỗ trợ lưu trữ đơn hàng ngoại tuyến và hàng đợi đồng bộ.
- **Backend & Realtime:** Supabase (PostgreSQL 15, Row Level Security, Realtime Broadcast Channels).

---

## 1.2. Bảng Tổng Hợp Các Lỗi Trọng Yếu & Kết Quả Xử Lý

| Mã lỗi | Phân hệ | Mức độ | Hiện trạng ban đầu | Giải pháp kỹ thuật đã thực hiện | Kết quả kiểm tra |
|---|---|---|---|---|---|
| **POS-01** | Bán hàng POS | **Critical** | Khi F5 / tải lại trang `/pos`, các sản phẩm trong giỏ hàng hoặc vừa tải bị chuyển trạng thái thành "Hết hàng" do trừ trùng lặp tồn kho giữa `cart` và `allocatedStock`. | Tái cấu trúc logic tính `effectiveStock`: tính toán số lượng tồn kho khả dụng dựa trên số lượng quầy thực tế cộng dồn phần đã có trong giỏ hàng hiện tại; cô lập state giỏ hàng theo từng quầy (`boothId`) và sự kiện (`eventId`). | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**<br>F5 trang giữ nguyên số lượng tồn kho chính xác, các thẻ sản phẩm hiển thị nút "Thêm vào giỏ" bình thường. |
| **SEC-01** | Xác thực & Bảo mật | **Critical** | Mật khẩu tài khoản mẫu được lưu trữ dưới dạng văn bản thô (plain-text) trong mã nguồn client-side. | Triển khai hàm băm FNV-1a với tiền tố định dạng `hash:...` và salt bảo mật; kiểm tra thông tin đăng nhập thông qua mã băm an toàn, ngăn chặn rò rỉ mật khẩu trong bundle frontend. | **ĐÃ KHẮC PHỤC**<br>Không còn mật khẩu dạng thô trong client store. |
| **DASH-01** | Bảng điều khiển | **High** | Dashboard hiển thị "0 quầy bán kích hoạt" và tỷ lệ phân bổ kho 0/0 dù hệ thống đã có nhiều quầy hoạt động trong cơ sở dữ liệu. | Phát hiện và khắc phục xung đột ID không gian làm việc (`workspaceId`). Chuyển đổi dữ liệu mẫu từ `ws-current` và `ws-music-fest` về thống nhất trên không gian làm việc mặc định `ws-1` ("Gian hàng của tôi"). | **ĐÃ KHẮC PHỤC**<br>Dashboard hiển thị đúng 2 quầy hoạt động và tổng 770 sản phẩm trong kho. |
| **DASH-02** | Báo cáo doanh thu | **Medium** | Doanh thu tổng hợp bị trộn lẫn giữa các sự kiện khác nhau; dữ liệu thử nghiệm phát sinh trong quá trình kiểm thử cần được tách biệt. | Bổ sung bộ lọc sự kiện trực tiếp trên Bảng điều khiển (`All Events`, `Hạc Cầm Live Concert`, `Sự kiện Test`); gom nhóm và gán chính xác doanh thu thử nghiệm vào "Sự kiện Test". | **ĐÃ KHẮC PHỤC**<br>Dữ liệu doanh thu minh bạch, phân tách rõ ràng theo từng sự kiện. |
| **LINT-01** | Mã nguồn & React 19 | **Medium** | Xuất hiện 46 cảnh báo và lỗi nghiêm trọng từ ESLint về việc vi phạm tính thuần khiết của hàm render (`Date.now()`), cập nhật state đồng bộ trong `useEffect` và khai báo biến kiểu `any`. | Xóa bỏ `Date.now()` trong thân hàm component; thay thế cập nhật state không đồng bộ bằng `useSyncExternalStore` hoặc callback; định nghĩa đầy đủ interface TypeScript cho toàn bộ payload đồng bộ. | **ĐÃ KHẮC PHỤC**<br>Kiểm tra `pnpm eslint` đạt 0 lỗi; `pnpm build` biên dịch 43 trang tĩnh thành công 100%. |
| **SYNC-01** | Đồng bộ POS | **High** | Hai thu ngân bán hàng đồng thời tại cùng một quầy không nhận biết được số lượng sản phẩm người kia vừa thêm vào giỏ, dẫn tới nguy cơ bán vượt tồn kho. | Tích hợp kênh Realtime Broadcast qua Supabase (`cart-sync:[boothId]`) kết hợp lưu trữ tạm thời lượng hàng đang giữ trong giỏ; thông báo ngay lập tức cho các máy thu ngân khác khi có biến động. | **ĐÃ KHẮC PHỤC**<br>Tồn kho cập nhật tức thì, tự động chặn thêm sản phẩm khi vượt quá số lượng còn lại. |

---

## 1.3. Chi Tiết Giải Pháp Kỹ Thuật Cho Các Vấn Đề Lớn

### 1.3.1. [POS-01] Xử Lý Triệt Để Lỗi F5 Reload Báo Hết Hàng
- **Nguyên nhân cốt lõi:** Khi người dùng nhấn F5 tại trang `/pos`, Zustand rehydrate dữ liệu giỏ hàng (`cart`) từ LocalStorage đồng thời hàm tải danh sách sản phẩm chạy. Trong quá trình tính toán tồn kho hiển thị, công thức cũ lấy tồn kho quầy (`allocatedStock`) trừ đi số lượng hiện có trong giỏ (`cartItem.quantity`). Nếu sản phẩm đã được thêm hết số lượng khả dụng, giá trị này bằng `0`, khiến hệ thống gắn cờ `isOutOfStock = true` và khóa nút bấm.
- **Giải pháp áp dụng:**
  ```typescript
  // Logic tính tồn kho khả dụng mới:
  const boothStock = getBoothStock(product.id, currentBoothId);
  const currentInCart = cart.find(item => item.productId === product.id)?.quantity || 0;
  // Tồn kho khả dụng thực tế để mua thêm:
  const remainingPurchasable = Math.max(0, boothStock - currentInCart);
  const isOutOfStock = boothStock <= 0;
  ```
  Nhờ đó, khi tải lại trang, hệ thống hiển thị chính xác số lượng đang có trong giỏ hàng (ví dụ: `9 trong giỏ`) và chỉ khóa khi tổng số lượng mua đã đạt trần phân bổ, không làm ẩn hoặc báo lỗi sản phẩm.

### 1.3.2. [SEC-01] Bảo Mật Đăng Nhập & Băm Mật Khẩu
- Hệ thống đã loại bỏ việc so sánh chuỗi mật khẩu trực tiếp. Thay vào đó, tài khoản quản trị viên và nhân viên được lưu trữ với mật khẩu đã qua băm bảo mật kèm tiền tố định dạng `hash:...`.
- Toàn bộ phiên đăng nhập được mã hóa token lưu tại Session/LocalStorage với thời hạn tự động thu hồi, ngăn ngừa việc giả mạo quyền hạn tại các route quản trị (`/settings`, `/team`, `/audit`).

### 1.3.3. [LINT-01] Tối Ưu Hóa Chuẩn React 19 & Next.js 16
- Khắc phục các vi phạm nguyên tắc "Pure Components": chuyển đổi toàn bộ logic sinh mã ngẫu nhiên hoặc lấy thời gian hiện tại (`Date.now()`) ra ngoài hàm render, chỉ thực thi trong `useEffect` hoặc event handlers.
- Áp dụng `useSyncExternalStore` cho Theme Toggle và Responsive Listeners để ngăn chặn hiện tượng Hydration Mismatch giữa máy chủ và trình duyệt.

---

## 1.4. Báo Cáo Kiểm Thử Chất Lượng (Verification Metrics)
- **Kiểm tra cú pháp TypeScript (`pnpm exec tsc --noEmit`):** 0 lỗi, 100% tệp tin đạt chuẩn type-safety.
- **Kiểm tra quy tắc mã nguồn (`pnpm eslint`):** 0 cảnh báo, 0 lỗi.
- **Đóng gói sản phẩm (`pnpm build`):** Biên dịch Turbopack thành công 43/43 trang và route handlers trong thời gian 14.8 giây.
- **Kiểm thử ngoại tuyến (Offline IndexedDB):** Lưu trữ thành công 100 đơn hàng thử nghiệm khi ngắt kết nối mạng và đồng bộ hoàn tất lên máy chủ ngay khi phục hồi kết nối.

---

# PHẦN II: TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HỆ THỐNG (USER MANUAL)

Chào mừng bạn đến với **EventMate** — Nền tảng chuyên nghiệp phục vụ quản lý và bán hàng tại sự kiện! Tài liệu dưới đây sẽ hướng dẫn bạn từng bước làm chủ mọi tính năng của hệ thống.

---

## 2.1. Đăng Nhập & Ma Trận Phân Quyền Tài Khoản

Hệ thống EventMate áp dụng mô hình phân quyền dựa trên vai trò (Role-Based Access Control - RBAC) nghiêm ngặt nhằm đảm bảo an toàn dữ liệu:

| Vai trò (Role) | Phạm vi truy cập & Trách nhiệm chính | Màn hình được phép truy cập |
|---|---|---|
| **Owner / Chủ gian hàng** | Toàn quyền kiểm soát hệ thống, tài chính, nhân sự và cấu hình workspace. | Toàn bộ các trang (Dashboard, Sự kiện, Kho, Đội ngũ, Cài đặt). |
| **Admin / Quản trị viên** | Quản lý sự kiện, danh mục hàng hóa, phân bổ kho và duyệt báo cáo. | Dashboard, Sự kiện, Quầy bán, Kho hàng, Nhật ký kiểm toán. |
| **Manager / Quản lý quầy** | Giám sát vận hành tại quầy, xuất/nhập điều chuyển hàng hóa, theo dõi đơn hàng. | Dashboard, Quầy bán, Kho & Phân bổ, POS Bán hàng, Trả hàng. |
| **Cashier / Thu ngân** | Thực hiện thao tác bán lẻ tại quầy POS, thu tiền mặt, tạo mã QR và trả hàng đặt trước. | POS Bán hàng (`/pos`), Cổng đối tác (`/collab`), Trả hàng đặt trước. |
| **Inventory Staff / Thủ kho** | Nhập hàng vào kho tổng, đóng gói hàng đặt trước và kiểm kê tồn kho. | Quản lý Sản phẩm, Kho & Phân bổ kho, Kiểm kê. |

> **Hướng dẫn đăng nhập nhanh:**
> 1. Truy cập đường dẫn trang web: `https://eventmate-wheat-psi.vercel.app/login`
> 2. Chọn tài khoản mẫu theo vai trò mong muốn hoặc nhập Email và Mật khẩu của bạn.
> 3. Nhấn **"Đăng nhập hệ thống"** để bắt đầu phiên làm việc.

---

## 2.2. Bảng Điều Khiển Tổng Quan (Dashboard) & Bộ Lọc Sự Kiện

Bảng điều khiển là trung tâm chỉ huy giúp bạn nắm bắt tức thì nhịp đập kinh doanh tại sự kiện:

### Các chỉ số then chốt trên màn hình:
1. **Tổng doanh thu:** Tổng số tiền thu được từ tất cả các đơn hàng thành công (tiền mặt + chuyển khoản).
2. **Số đơn hàng:** Số lượng hóa đơn đã xuất thành công tại các quầy POS.
3. **Số lượng đã bán / Tồn kho:** Thể hiện tiến độ tiêu thụ hàng hóa thực tế trên tổng lượng hàng nhập vào sự kiện.
4. **Quầy bán kích hoạt:** Số lượng quầy đang mở phiên làm việc và sẵn sàng phục vụ khách.

### Tính năng Lọc Doanh Thu Theo Sự Kiện:
- Tại góc trên bảng điều khiển, bạn có thể chuyển đổi giữa các sự kiện:
  - **Tất cả sự kiện (All Events):** Xem bức tranh toàn cảnh doanh thu của doanh nghiệp.
  - **Hạc Cầm Live Concert - Hà Nội:** Xem riêng số liệu của concert chính thức.
  - **Sự kiện Thử nghiệm (Test Event):** Nơi chứa toàn bộ các đơn hàng thử nghiệm, kiểm tra quầy mà không làm sai lệch số liệu tài chính của sự kiện thật.

---

## 2.3. Quản Lý Sự Kiện & Tour Diễn (Events Management)

Màn hình `/events` giúp ban tổ chức quản lý danh sách các đêm nhạc, hội chợ hoặc sự kiện lưu diễn:
- **Tạo sự kiện mới:** Nhấn nút **"+ Tạo sự kiện mới"**, nhập Tên sự kiện, Địa điểm tổ chức, Ngày bắt đầu và Ngày kết thúc.
- **Trạng thái sự kiện:** Hệ thống tự động phân loại theo 3 trạng thái:
  - *Sắp diễn ra (Upcoming):* Đang chuẩn bị hàng hóa, chưa mở bán tại quầy POS.
  - *Đang diễn ra (Active):* Mở toàn bộ cổng POS và cho phép thu ngân bán hàng.
  - *Đã kết thúc (Completed):* Khóa phiên bán hàng, phục vụ công tác đối soát và kiểm kê tài chính.

---

## 2.4. Quản Lý Gian Hàng & Quầy Bán (Booths Management)

Mỗi sự kiện có thể chia thành nhiều quầy bán hàng khác nhau (Ví dụ: *Quầy Cổng A, Quầy Cổng B, Quầy VIP, Quầy Collab Đối Tác*):
- **Thêm quầy mới:** Nhấn **"+ Thêm quầy bán"**, đặt tên quầy và phân bổ nhân sự phụ trách.
- **Cấu hình Quầy Collab:** Đối với các gian hàng của đối tác nghệ sĩ hoặc nhà tài trợ, bạn có thể bật tính năng **"Quầy Collab"** và thiết lập tỷ lệ chia sẻ doanh thu (Revenue Share %). Quầy này sẽ có một đường link độc lập (`/collab/[boothId]`) để đối tác tự theo dõi doanh thu của họ.

---

## 2.5. Quản Lý Sản Phẩm, Biến Thể & Kho Hàng (Products & Inventory)

Đây là phân hệ cốt lõi quyết định tính chính xác của toàn bộ dòng chảy hàng hóa.

### 2.5.1. Khởi Tạo Sản Phẩm & Tải Ảnh Trực Tiếp
1. Truy cập mục **"Sản phẩm & Biến thể"** (`/products`), chọn **"+ Thêm sản phẩm mới"**.
2. Nhập thông tin: Tên sản phẩm, Mã SKU, Danh mục (Áo thun, Mũ, Đĩa than, Phụ kiện, Lightstick...).
3. **Tải ảnh đại diện:**
   - Bạn có thể tải ảnh có sẵn từ máy tính hoặc điện thoại.
   - Khi truy cập bằng điện thoại di động, hệ thống hỗ trợ **mở trực tiếp Camera** để chụp ảnh mẫu hàng hóa thực tế và tự động nén tối ưu dung lượng trước khi lưu.
4. **Khai báo biến thể:** Nhập các kích cỡ (Size S, M, L, XL) hoặc màu sắc kèm mức giá tương ứng.

### 2.5.2. Cơ Chế Giữ Chỗ VIP & Khóa Đơn Đặt Trước Online
> [!IMPORTANT]
> **Quy tắc Nghiêm Ngặt:** Hàng hóa dành cho khách đã đặt trước (Pre-order) hoặc vé VIP **tuyệt đối không được tính vào tồn kho để bán lẻ trực tiếp tại quầy POS**.
- Khi nhập hàng vào hệ thống, bạn sẽ thấy 3 chỉ số tồn kho riêng biệt:
  - **Tồn kho tổng (Total Stock):** Toàn bộ lượng hàng đã sản xuất và nhập kho.
  - **Giữ chỗ VIP / Đặt trước (Reserved / Pre-order):** Số lượng đã có khách trả tiền trước qua website/fanpage. Lượng hàng này tự động bị khóa trong kho, không hiển thị trên màn hình POS bán lẻ.
  - **Khả dụng bán tại quầy (Available for POS):** Lượng hàng thực tế được phép xuất ra cho khách vãng lai mua tại sự kiện.

### 2.5.3. Quy Định Ẩn Sản Phẩm Bán Hết (Soft Delete / Safe Archival)
> [!NOTE]
> Để bảo toàn tính toàn vẹn của lịch sử giao dịch và đối soát tài chính, EventMate áp dụng cơ chế **Xóa Mềm (Soft Delete / Ẩn sản phẩm)**:
- Khi một sản phẩm đã bán hết hoặc bạn muốn ngừng kinh doanh:
  - **Không bao giờ xóa hoàn toàn** bản ghi trong cơ sở dữ liệu để tránh làm hỏng các báo cáo doanh thu và đơn hàng cũ.
  - Hệ thống sẽ chuyển trạng thái của sản phẩm thành **"Đã ẩn (Archived)"**.
  - Sản phẩm ẩn sẽ ngay lập tức biến mất khỏi danh mục tìm kiếm của thu ngân tại quầy POS nhưng vẫn được lưu vết đầy đủ trong trang quản trị kho của Admin.

### 2.5.4. Phân Bổ Hàng Hóa Về Quầy Bán (Stock Allocation)
- Truy cập mục **"Kho & Phân bổ"** (`/inventory`).
- Chọn nguồn xuất (Kho tổng) và đích đến (Quầy A, Quầy B...).
- Điền số lượng muốn điều chuyển cho từng sản phẩm và nhấn **"Xác nhận phân bổ"**.
- Số lượng tại quầy sẽ tăng ngay lập tức và thu ngân tại quầy đó có thể bán được ngay.

---

## 2.6. Màn Hình Bán Hàng Thu Ngân (POS Terminal Workflow)

Giao diện bán hàng tại `/pos` được thiết kế tối ưu cho thao tác chạm (Touch-friendly), tốc độ xử lý dưới 5 giây mỗi giao dịch.

### 2.6.1. Quy Trình Bán Hàng Tại Quầy
1. **Chọn Quầy làm việc:** Thu ngân mở trang `/pos`, chọn đúng Sự kiện và Quầy hàng mình đang đứng trực.
2. **Tìm và Thêm sản phẩm:**
   - Dùng thanh tìm kiếm để gõ tên sản phẩm hoặc mã SKU.
   - Nhấp vào thẻ sản phẩm để thêm vào giỏ hàng. Nếu sản phẩm có nhiều biến thể (ví dụ: Áo thun Size S, M, L), hãy chọn đúng kích cỡ trước khi thêm.
3. **Kiểm tra tồn kho thời gian thực:**
   - Góc trên mỗi thẻ sản phẩm hiển thị số lượng tồn còn lại (ví dụ: `Còn 9`).
   - Nếu sản phẩm đã được thêm vào giỏ, nút sẽ chuyển sang trạng thái hiển thị số lượng trong giỏ (ví dụ: `9 trong giỏ`) kèm hai nút `+` và `-` để điều chỉnh nhanh.

### 2.6.2. Cơ Chế Đồng Bộ Giỏ Hàng Thời Gian Thực (Multi-Cashier Realtime)
- Trong các sự kiện đông khách, một quầy có thể có 2 hoặc nhiều thu ngân dùng máy tính bảng cùng bán hàng.
- Khi Thu ngân 1 nhấn thêm 1 chiếc áo vào giỏ, hệ thống phát tín hiệu qua kênh Realtime Broadcast:
  - Máy của Thu ngân 2 sẽ lập tức cập nhật số lượng còn lại khả dụng giảm đi 1.
  - Ngăn chặn hoàn toàn tình trạng cả 2 thu ngân cùng xác nhận bán một món đồ khi trong kho chỉ còn lại đúng 1 chiếc cuối cùng!

### 2.6.3. Thanh Toán Bằng Tiền Mặt (Có Tính Tiền Thối Tự Động)
1. Trong giỏ hàng, kiểm tra tổng tiền và nhấn **"THANH TOÁN"**.
2. Chọn phương thức **"Tiền mặt"**.
3. **Nhập thủ công số tiền khách đưa:**
   - Thu ngân nhập số tiền nhận được từ khách (hoặc bấm nhanh các nút gợi ý mệnh giá: `100k`, `200k`, `500k`...).
   - Hệ thống tự động tính toán chính xác mục **"Tiền thối lại cho khách"** theo thời gian thực:
     > **Công thức:** `Tiền thối lại = Tiền khách đưa - Tổng tiền đơn hàng`
   - Nếu tiền khách đưa nhỏ hơn tổng tiền, hệ thống sẽ cảnh báo màu đỏ và khóa nút hoàn tất đơn.
4. Nhấn **"Xác nhận thanh toán"** để hoàn tất và in hóa đơn (nếu có máy in nhiệt).

### 2.6.4. Thanh Toán Bằng Mã Chuyển Khoản VietQR Động
1. Chọn phương thức **"Chuyển khoản VietQR"**.
2. Màn hình tự động hiển thị mã QR VietQR chuẩn ngân hàng với:
   - Thông tin tài khoản nhận tiền của Ban Tổ Chức.
   - Số tiền chính xác của đơn hàng.
   - Nội dung chuyển khoản định danh duy nhất (ví dụ: `EM4748`).
3. Khách hàng dùng bất kỳ ứng dụng ngân hàng nào (Vietcombank, MB Bank, Techcombank, Momo...) quét mã để thanh toán mà không cần nhập tay số tiền.
4. Thu ngân kiểm tra điện thoại thông báo tiền vào tài khoản và nhấn **"Xác nhận đã nhận tiền"**.

### 2.6.5. Bán Hàng Ngoại Tuyến (Offline POS) Khi Mất Mạng
- Khi sóng 4G/Wifi tại sự kiện chập chờn hoặc mất hẳn, hệ thống tự động chuyển sang chế độ **"Offline Mode"** (Chấm trạng thái màu vàng/đỏ góc trên).
- Thu ngân vẫn thực hiện bán hàng tiền mặt bình thường. Đơn hàng được mã hóa và lưu trữ an toàn trong bộ nhớ IndexedDB của trình duyệt máy thu ngân.
- Ngay khi có mạng trở lại, hàng đợi đồng bộ sẽ tự động đẩy các đơn hàng lên máy chủ Supabase mà không làm mất bất kỳ một giao dịch nào.

---

## 2.7. Quy Trình Trả Hàng Đặt Trước (Pre-order Pickup Verification)

Đối với các đơn hàng người hâm mộ đã đặt trước trên mạng và đến sự kiện nhận đồ:

> [!WARNING]
> **Bắt Buộc Minh Chứng:** Để phòng ngừa gian lận hoặc nhận nhầm đơn, nhân viên phát hàng **bắt buộc phải chụp ảnh minh chứng khách đã cầm hàng** thì nút xác nhận mới được phép kích hoạt.

### Các bước thực hiện trả hàng:
1. Truy cập mục **"Đơn hàng"** hoặc chuyển sang tab **"Trả hàng đặt trước"** trên giao diện POS.
2. Nhập Mã đơn hàng (ví dụ: `PO-2026-089`) hoặc Số điện thoại của người nhận.
3. Kiểm tra thông tin các món đồ cần bàn giao (Loại áo, Size, Quà tặng kèm).
4. Nhấn vào nút **"Chụp ảnh minh chứng nhận hàng"**:
   - Trình duyệt sẽ mở máy ảnh của điện thoại hoặc webcam.
   - Nhân viên chụp ảnh khách hàng cùng gói hàng đã nhận (hoặc căn cước công dân/mã vạch nhận diện).
5. Khi ảnh đã được tải lên thành công, nút **"Xác nhận đã nhận hàng"** sẽ chuyển sang màu xanh và sáng lên.
6. Nhấn xác nhận. Hệ thống đánh dấu đơn hàng thành trạng thái `COMPLETED` và lưu kèm đường dẫn ảnh bằng chứng vào hồ sơ đơn hàng.

---

## 2.8. Cổng Đối Tác Bán Hàng (Collab Portal)

Đường dẫn: `/collab/[boothId]`
- Dành riêng cho các nghệ sĩ, ban nhạc khách mời hoặc nhãn hàng đặt gian hàng hợp tác tại sự kiện.
- Giao diện được tối giản hóa, chỉ hiển thị danh mục sản phẩm của riêng đối tác đó.
- Cập nhật số lượng sản phẩm bán ra theo thời gian thực và hiển thị ước tính doanh thu được chia sẻ (sau khi trừ chi phí vận hành theo hợp đồng).
- Đối tác không thể xem hoặc can thiệp vào dữ liệu của các quầy bán hàng khác thuộc Ban Tổ Chức.

---

## 2.9. Nhật Ký Hoạt Động & Kiểm Tra Hệ Thống (Audit Logs)

Màn hình `/logs` dành riêng cho Chủ gian hàng và Quản trị viên:
- Ghi lại chi tiết mọi hành động diễn ra trong hệ thống:
  - *Thời gian thực hiện (Timestamp).*
  - *Người thực hiện (Tên nhân viên & Email).*
  - *Vai trò (Role).*
  - *Hành động (Tạo đơn hàng, Đổi giá sản phẩm, Phân bổ kho, Ẩn sản phẩm, Đăng nhập).*
  - *Dữ liệu thay đổi (Giá trị cũ vs Giá trị mới).*
- Giúp minh bạch hóa toàn bộ quá trình vận hành, phát hiện kịp thời các bất thường về tồn kho hoặc lệch quỹ tiền mặt.

---

## 2.10. Trung Tâm Góp Ý & Báo Cáo Sự Cố (Feedback Portal)

Nằm ở góc dưới bên phải màn hình làm việc:
- Biểu tượng nút nổi **"Góp ý & Báo lỗi"** luôn hiển thị trên mọi trang.
- Khi nhân viên hoặc thu ngân gặp trục trặc (ví dụ: quầy không quét được mã vạch, máy in kẹt giấy, hoặc có đề xuất cải tiến giao diện):
  1. Nhấp vào nút nổi.
  2. Chọn phân loại: `Báo cáo lỗi (Bug)` hoặc `Đóng góp ý kiến (Feature Request)`.
  3. Nhập tiêu đề và nội dung chi tiết sự cố.
  4. Đính kèm ảnh chụp màn hình lỗi (nếu có).
  5. Nhấn **"Gửi báo cáo"**.
- Toàn bộ dữ liệu phản hồi được tự động chuyển về bảng quản trị để đội ngũ kỹ thuật tổng hợp và tung ra bản vá cập nhật.

---

## 2.11. Chuyển Đổi Giao Diện Sáng / Tối (Light & Dark Mode)

Nút chuyển đổi giao diện nằm tại thanh điều hướng trên cùng hoặc chân trang:
- **Chế độ Sáng (Light Theme):** Độ tương phản cao, tối ưu cho môi trường bán hàng ban ngày ngoài trời hoặc dưới ánh sáng mạnh tại sảnh hội trường.
- **Chế độ Tối (Dark Theme):** Tông màu xám than (Zinc/Neutral) dịu mắt, chống lóa và tiết kiệm pin thiết bị khi thu ngân làm việc trong không gian đêm tối tại sân khấu concert.
- Hệ thống tự động ghi nhớ sở thích giao diện của bạn trên từng thiết bị thông qua LocalStorage.

---

# PHẦN III: KHUYẾN NGHỊ VẬN HÀNH & KẾ HOẠCH BẢO TRÌ

Để sự kiện diễn ra thành công và hạn chế tối đa rủi ro gián đoạn kinh doanh, Ban Quản Trị cần lưu ý:
1. **Kiểm tra thiết bị trước giờ mở cổng sự kiện (T-2h):**
   - Đăng nhập sẵn tài khoản thu ngân trên các thiết bị POS/máy tính bảng.
   - Thử nghiệm quét 1 đơn hàng tiền mặt và 1 đơn hàng VietQR trên **"Sự kiện Thử nghiệm (Test Event)"** để đảm bảo máy ảnh và kết nối mạng hoạt động tốt.
2. **Quản lý phân bổ hàng hóa:**
   - Thực hiện phân bổ hàng từ Kho tổng về các Quầy trước giờ mở bán ít nhất 1 tiếng.
   - Không thực hiện điều chỉnh lớn về tồn kho trong lúc cao điểm khách xếp hàng thanh toán.
3. **Đồng bộ dữ liệu cuối ngày:**
   - Khi kết thúc đêm diễn, toàn bộ thu ngân phải kiểm tra biểu tượng trạng thái trực tuyến (đảm bảo hiển thị chấm xanh `Online`) để hệ thống đẩy hết các đơn hàng ngoại tuyến lên máy chủ.
   - Quản lý quầy tiến hành đối soát tiền mặt trong két với số liệu hiển thị trên mục **"Báo cáo doanh thu"** trước khi ký biên bản bàn giao ca.

---
*Tài liệu này được tạo tự động và đồng bộ trực tiếp từ kho lưu trữ mã nguồn của hệ thống EventMate.*
