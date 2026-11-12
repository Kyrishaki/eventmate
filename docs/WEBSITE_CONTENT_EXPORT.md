# BẢN XUẤT TOÀN BỘ NỘI DUNG WEBSITE (HIKARUSTORE / EVENTMATE)

> **Mục đích:** Xuất **100% nội dung hiển thị thực tế (verbatim)** trên toàn bộ ứng dụng web (giao diện tiếng Việt/Anh, metadata, PWA manifest, từ điển đa ngôn ngữ, dữ liệu mẫu, thông báo lỗi, `alert`/`confirm`, mẫu tin nhắn Zalo, hóa đơn in nhiệt, Z-Report, CSV/Excel xuất báo cáo, và prompt AI) để bạn rà soát và chỉnh sửa chính xác từng chi tiết.
> **Phạm vi kiểm toán:** **51** tệp có chuỗi giao diện/dữ liệu người dùng (trên 76 tệp mã nguồn trong `src/`) + `messages/vi.json` & `messages/en.json` (**203** i18n keys) + `public/manifest.json` & `public/sw.js`.

### Hướng dẫn chỉnh sửa nhanh
1. Mỗi bảng ghi rõ **Dòng** (link bấm mở thẳng tới đúng dòng trong mã nguồn), **Loại**, **Ngữ cảnh / Key**, và **Nội dung gốc (Verbatim)**.
2. Khi cần đổi câu chữ nào, bạn chỉ cần ghi chú theo dạng: `[Mục X - Tệp - L<số dòng>]: "cũ" -> "mới"` hoặc chỉnh trực tiếp theo key i18n ở **Mục 2**.
3. Riêng các mẫu dài nhiều dòng (Zalo, Z-Report, Biên lai, Excel, CSV, AI Prompt, Markdown Export) được tách nguyên khối trong ```text``` ngay bên dưới bảng để dễ sửa toàn văn.
4. Xem riêng [**Mục 11**](#mục-11-tổng-hợp-các-điểm-chưa-đồng-bộ--gợi-ý-chuẩn-hóa) để xử lý đồng loạt các điểm lệch thương hiệu (`HikaruStore` vs `EventMate` vs `Hạc Cầm`), key đa ngôn ngữ bị bỏ hoang và thông tin demo/cá nhân viết cứng.

## Mục lục
- [Mục 1: Thương hiệu, Metadata & PWA](#mục-1-thương-hiệu-metadata--pwa)
- [Mục 2: Bộ từ điển Đa ngôn ngữ (messages/vi.json & messages/en.json — 203 keys)](#mục-2-bộ-từ-điển-đa-ngôn-ngữ-messagesvijson--messagesenjson--203-keys)
- [Mục 3: Dữ liệu Mặc định, Dữ liệu Mẫu trong Stores & Trạng thái Kho](#mục-3-dữ-liệu-mặc-định-dữ-liệu-mẫu-trong-stores--trạng-thái-kho)
- [Mục 4: Trang Khách Xem Công Khai (GuestShowcase)](#mục-4-trang-khách-xem-công-khai-guestshowcase)
- [Mục 5: Hệ thống Đăng nhập & Tài khoản](#mục-5-hệ-thống-đăng-nhập--tài-khoản)
- [Mục 6: Khung Giao diện Quản trị & UI Dùng chung](#mục-6-khung-giao-diện-quản-trị--ui-dùng-chung)
- [Mục 7: Toàn bộ 12 Trang Quản trị (/dashboard/*)](#mục-7-toàn-bộ-12-trang-quản-trị-dashboard)
- [Mục 8: Màn hình Bán hàng POS & Modals POS](#mục-8-màn-hình-bán-hàng-pos--modals-pos)
- [Mục 9: Cổng Đối tác Collab (/collab/[boothId])](#mục-9-cổng-đối-tác-collab-collabboothid)
- [Mục 10: Modals Hỗ trợ, Xuất Excel & API AI](#mục-10-modals-hỗ-trợ-xuất-excel--api-ai)
- [Mục 11: Tổng hợp Các Điểm Chưa Đồng Bộ & Gợi ý Chuẩn hóa](#mục-11-tổng-hợp-các-điểm-chưa-đồng-bộ--gợi-ý-chuẩn-hóa)

---

## Mục 1: Thương hiệu, Metadata & PWA

#### 1.1 PWA Web App Manifest ([public/manifest.json](file:///D:/Codes/QuanLyGianHangHKT/public/manifest.json))
| Trường | Giá trị gốc (Verbatim) |
| :--- | :--- |
| `name` | `HikaruStore — Quản lý Gian Hàng & Bán Hàng Sự Kiện` |
| `short_name` | `HikaruStore` |
| `description` | `Hệ thống quản lý gian hàng merchandise, kiểm soát kho và bán hàng POS chuyên nghiệp HikaruStore` |
| `start_url` | `/` |
| `display` | `standalone` |
| `background_color` | `#F7F7F5` |
| `theme_color` | `#315C4C` |
| `orientation` | `any` |
| `icons` | `[{"src":"/icon.png","sizes":"512x512 192x192 128x128","type":"image/png"},{"src":"/favicon.ico","sizes":"64x64 32x32 24x24 16x16","type":"image/x-icon"}]` |

> Ghi chú Service Worker ([public/sw.js](file:///D:/Codes/QuanLyGianHangHKT/public/sw.js)): Dùng cache `'eventmate-pos-v2'` / `'eventmate-cache-v1'` và chuyển hướng fallback sang `'/pos'` hoặc `'/'` khi mất mạng — không có chuỗi thông báo hiển thị trực tiếp cho người dùng.

#### 1.2 Root Layout & SEO Metadata
> Nguồn: [src/app/[locale]/layout.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/layout.tsx) — **2** mục nội dung

Cấu hình i18n ([src/i18n/routing.ts](file:///D:/Codes/QuanLyGianHangHKT/src/i18n/routing.ts)): hỗ trợ 2 ngôn ngữ `['vi', 'en']`, mặc định `'vi'`, chế độ `localePrefix: 'as-needed'`.

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L24](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/layout.tsx#L24) | Thuộc tính dữ liệu | title | HikaruStore |
| [L25](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/layout.tsx#L25) | Thuộc tính dữ liệu | description | Hệ thống quản lý gian hàng merchandise, kiểm soát kho và bán hàng POS chuyên nghiệp HikaruStore. |


#### 1.3 Auth Layout & Footer
> Nguồn: [src/app/[locale]/(auth)/layout.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/layout.tsx) — **3** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L16](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/layout.tsx#L16) | Thuộc tính HTML | alt | HikaruStore Logo |
| [L21](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/layout.tsx#L21) | Văn bản JSX | text | HikaruStore |
| [L39](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/layout.tsx#L39) | Văn bản JSX | text | © 2026 HikaruStore. Quản lý gian hàng & bán hàng sự kiện. |


---

## Mục 2: Bộ từ điển Đa ngôn ngữ (`messages/vi.json` & `messages/en.json` — 203 keys)

> Tệp nguồn: [messages/vi.json](file:///D:/Codes/QuanLyGianHangHKT/messages/vi.json) | [messages/en.json](file:///D:/Codes/QuanLyGianHangHKT/messages/en.json)
> **Thống kê sử dụng thực tế trong code:** Tổng **203** keys → **116** keys đang được gọi trong code (các key `events.statusList.*` và `booths.statusList.*` được gọi cả trực tiếp lẫn động qua template `statusList.${...}`), và **87** keys hiện **chưa được gọi ở bất kỳ giao diện nào** (do phần lớn các trang đang viết cứng tiếng Việt trực tiếp trong JSX).

#### 2.1 Namespace `common` (23 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `common.appName` | `[Chưa dùng]` | EventMate | EventMate |
| `common.tagline` | `[Chưa dùng]` | Quản lý bán hàng Merchandise Sự kiện dành cho Nghệ sĩ & Ekip | Event Merchandise Sales Platform for Artists & Tour Crews |
| `common.loading` | `[Chưa dùng]` | Đang tải... | Loading... |
| `common.save` | **`[Đang dùng]`** | Lưu | Save |
| `common.cancel` | **`[Đang dùng]`** | Hủy | Cancel |
| `common.delete` | `[Chưa dùng]` | Xóa | Delete |
| `common.edit` | **`[Đang dùng]`** | Chỉnh sửa | Edit |
| `common.create` | `[Chưa dùng]` | Tạo mới | Create |
| `common.search` | **`[Đang dùng]`** | Tìm kiếm... | Search... |
| `common.filter` | `[Chưa dùng]` | Bộ lọc | Filter |
| `common.all` | `[Chưa dùng]` | Tất cả | All |
| `common.status` | `[Chưa dùng]` | Trạng thái | Status |
| `common.actions` | `[Chưa dùng]` | Hành động | Actions |
| `common.back` | `[Chưa dùng]` | Quay lại | Back |
| `common.confirm` | `[Chưa dùng]` | Xác nhận | Confirm |
| `common.online` | **`[Đang dùng]`** | Trực tuyến | Online |
| `common.offline` | **`[Đang dùng]`** | Ngoại tuyến | Offline |
| `common.syncing` | **`[Đang dùng]`** | Đang đồng bộ | Syncing |
| `common.synced` | **`[Đang dùng]`** | Đã đồng bộ | Synced |
| `common.syncFailed` | **`[Đang dùng]`** | Đồng bộ lỗi | Sync failed |
| `common.pending` | `[Chưa dùng]` | Chờ xử lý | Pending |
| `common.copied` | `[Chưa dùng]` | Đã sao chép vào bộ nhớ tạm | Copied to clipboard |
| `common.required` | `[Chưa dùng]` | Bắt buộc | Required |

#### 2.2 Namespace `auth` (31 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `auth.loginTitle` | `[Chưa dùng]` | Đăng nhập vào EventMate | Sign in to EventMate |
| `auth.loginSubtitle` | `[Chưa dùng]` | Hệ thống quản trị bán hàng merchandise chuyên nghiệp | Professional event merchandise management system |
| `auth.emailLabel` | **`[Đang dùng]`** | Địa chỉ Email | Email address |
| `auth.emailPlaceholder` | **`[Đang dùng]`** | artist@eventmate.com | artist@eventmate.com |
| `auth.passwordLabel` | **`[Đang dùng]`** | Mật khẩu | Password |
| `auth.passwordPlaceholder` | **`[Đang dùng]`** | •••••••• | •••••••• |
| `auth.forgotPassword` | `[Chưa dùng]` | Quên mật khẩu? | Forgot password? |
| `auth.signInButton` | `[Chưa dùng]` | Đăng nhập | Sign in |
| `auth.signUpPrompt` | `[Chưa dùng]` | Chưa có tài khoản? | Don't have an account? |
| `auth.signUpLink` | `[Chưa dùng]` | Tạo tài khoản Nghệ sĩ mới | Create an Artist Workspace |
| `auth.registerTitle` | **`[Đang dùng]`** | Khởi tạo Không gian làm việc Nghệ sĩ | Create Artist Workspace |
| `auth.registerSubtitle` | **`[Đang dùng]`** | Bắt đầu quản lý gian hàng và phân bổ hàng hóa cho các tour diễn | Start allocating inventory and managing booths for your tours |
| `auth.fullNameLabel` | **`[Đang dùng]`** | Họ và tên | Full name |
| `auth.fullNamePlaceholder` | **`[Đang dùng]`** | Nguyễn Văn A | Alex Rivera |
| `auth.workspaceNameLabel` | **`[Đang dùng]`** | Tên Không gian làm việc / Ban nhạc / Nghệ sĩ | Workspace / Artist / Band name |
| `auth.workspaceNamePlaceholder` | **`[Đang dùng]`** | Hạc Cầm Studio / Vũ Cát Tường Merch | Tour Merch Studio / Alex Live |
| `auth.signUpButton` | **`[Đang dùng]`** | Đăng ký tài khoản | Create account |
| `auth.signInPrompt` | **`[Đang dùng]`** | Đã có tài khoản? | Already have an account? |
| `auth.signInLink` | **`[Đang dùng]`** | Đăng nhập | Sign in |
| `auth.forgotTitle` | **`[Đang dùng]`** | Khôi phục mật khẩu | Reset password |
| `auth.forgotSubtitle` | **`[Đang dùng]`** | Nhập email của bạn để nhận liên kết khôi phục | Enter your email to receive a password reset link |
| `auth.sendResetLink` | **`[Đang dùng]`** | Gửi email khôi phục | Send reset link |
| `auth.backToLogin` | **`[Đang dùng]`** | Quay lại trang đăng nhập | Back to login |
| `auth.acceptInvitationTitle` | **`[Đang dùng]`** | Chấp nhận lời mời tham gia Ekip | Accept Team Invitation |
| `auth.acceptInvitationSubtitle` | **`[Đang dùng]`** | Bạn đã được mời tham gia không gian làm việc | You have been invited to join the workspace |
| `auth.acceptButton` | **`[Đang dùng]`** | Tham gia ngay | Join Workspace |
| `auth.errors.invalidEmail` | **`[Đang dùng]`** | Vui lòng nhập email hợp lệ | Please enter a valid email address |
| `auth.errors.passwordTooShort` | **`[Đang dùng]`** | Mật khẩu phải có tối thiểu 6 ký tự | Password must be at least 6 characters |
| `auth.errors.requiredField` | **`[Đang dùng]`** | Trường này không được để trống | This field is required |
| `auth.errors.loginFailed` | `[Chưa dùng]` | Email hoặc mật khẩu không chính xác | Invalid email or password |
| `auth.errors.registerFailed` | `[Chưa dùng]` | Không thể tạo tài khoản. Vui lòng thử lại | Could not create account. Please try again |

#### 2.3 Namespace `nav` (19 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `nav.dashboard` | **`[Đang dùng]`** | Tổng quan | Overview |
| `nav.events` | **`[Đang dùng]`** | Sự kiện | Events & Tours |
| `nav.booths` | **`[Đang dùng]`** | Gian hàng | Booths |
| `nav.products` | **`[Đang dùng]`** | Sản phẩm | Products & Variants |
| `nav.inventory` | **`[Đang dùng]`** | Kho hàng | Inventory & Allocation |
| `nav.orders` | **`[Đang dùng]`** | Đơn hàng | Orders |
| `nav.payments` | **`[Đang dùng]`** | Thanh toán | Payments |
| `nav.team` | **`[Đang dùng]`** | Nhân sự | Team & Access |
| `nav.logs` | **`[Đang dùng]`** | Nhật ký | Audit & Activity Logs |
| `nav.feedback` | **`[Đang dùng]`** | Góp ý & Báo lỗi | Feedback & Bug Reports |
| `nav.analytics` | **`[Đang dùng]`** | Báo cáo | Revenue Analytics |
| `nav.settings` | **`[Đang dùng]`** | Cài đặt | Workspace Settings |
| `nav.posTerminal` | **`[Đang dùng]`** | Bán hàng POS | Open POS Terminal |
| `nav.groupOperations` | `[Chưa dùng]` | Vận hành | Operations |
| `nav.groupCatalog` | `[Chưa dùng]` | Hàng hóa & Kho | Catalog & Stock |
| `nav.groupSystem` | `[Chưa dùng]` | Tài chính & Hệ thống | Finance & System |
| `nav.moreMenu` | `[Chưa dùng]` | Menu | More |
| `nav.posShort` | `[Chưa dùng]` | Bán POS | POS |
| `nav.feedbackShort` | `[Chưa dùng]` | Góp ý | Feedback |

#### 2.4 Namespace `dashboard` (13 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `dashboard.overviewTitle` | **`[Đang dùng]`** | Tổng quan | Sales Overview |
| `dashboard.welcome` | `[Chưa dùng]` | Xin chào | Welcome back |
| `dashboard.metrics.totalRevenue` | **`[Đang dùng]`** | Doanh thu | Total Revenue |
| `dashboard.metrics.ordersCount` | **`[Đang dùng]`** | Đơn hàng | Orders |
| `dashboard.metrics.unitsSold` | **`[Đang dùng]`** | Đã bán / Tồn | Units Sold |
| `dashboard.metrics.avgOrderValue` | `[Chưa dùng]` | Giá trị trung bình | Avg Order Value |
| `dashboard.recentOrders` | **`[Đang dùng]`** | Đơn hàng gần đây | Recent Orders |
| `dashboard.upcomingEvents` | **`[Đang dùng]`** | Sự kiện | Upcoming Events |
| `dashboard.inventoryWarnings` | **`[Đang dùng]`** | Tồn kho quầy | Inventory Warnings |
| `dashboard.noRecentOrders` | **`[Đang dùng]`** | Chưa có đơn hàng nào | No orders recorded yet |
| `dashboard.noUpcomingEvents` | **`[Đang dùng]`** | Chưa có sự kiện nào | No upcoming events scheduled |
| `dashboard.noWarnings` | `[Chưa dùng]` | Tất cả các gian hàng đang có đủ hàng | All booths are stocked adequately |
| `dashboard.syncStatus` | `[Chưa dùng]` | Trạng thái kết nối | Sync Status |

#### 2.5 Namespace `events` (22 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `events.title` | **`[Đang dùng]`** | Sự kiện | Events & Tours |
| `events.description` | **`[Đang dùng]`** | Quản lý lịch diễn và các gian hàng. | Manage concert dates, cities, venues and allocated merchandise booths. |
| `events.createButton` | **`[Đang dùng]`** | Tạo sự kiện | Create Event |
| `events.editButton` | **`[Đang dùng]`** | Sửa sự kiện | Edit Event |
| `events.name` | **`[Đang dùng]`** | Tên sự kiện | Event / Tour Name |
| `events.namePlaceholder` | **`[Đang dùng]`** | Hạc Cầm Live Concert - Hà Nội | Live Tour 2026 - National Arena |
| `events.location` | **`[Đang dùng]`** | Địa điểm | Venue Location |
| `events.locationPlaceholder` | **`[Đang dùng]`** | Trung tâm Hội nghị Quốc gia, Hà Nội | National Convention Center |
| `events.descriptionLabel` | **`[Đang dùng]`** | Mô tả | Description / Notes |
| `events.descriptionPlaceholder` | **`[Đang dùng]`** | Ghi chú đêm diễn... | Opening night of the 2026 stadium tour... |
| `events.startDate` | **`[Đang dùng]`** | Bắt đầu | Start Date & Time |
| `events.endDate` | **`[Đang dùng]`** | Kết thúc | End Date & Time |
| `events.status` | **`[Đang dùng]`** | Trạng thái | Event Status |
| `events.boothsCount` | `[Chưa dùng]` | Số quầy | Booths |
| `events.noEvents` | **`[Đang dùng]`** | Chưa có sự kiện nào | No events found in this workspace |
| `events.noEventsDesc` | **`[Đang dùng]`** | Bắt đầu bằng cách tạo một sự kiện mới. | Start by creating an event to allocate merchandise for your booth points. |
| `events.detailTitle` | `[Chưa dùng]` | Chi tiết sự kiện | Event Details |
| `events.statusList.draft` | **`[Đang dùng]`** | Bản nháp | Draft |
| `events.statusList.upcoming` | **`[Đang dùng]`** | Sắp diễn ra | Upcoming |
| `events.statusList.active` | **`[Đang dùng]`** | Đang diễn ra | Active |
| `events.statusList.completed` | **`[Đang dùng]`** | Đã kết thúc | Completed |
| `events.statusList.cancelled` | **`[Đang dùng]`** | Đã hủy | Cancelled |

#### 2.6 Namespace `booths` (17 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `booths.title` | **`[Đang dùng]`** | Gian hàng | Booths & Sales Points |
| `booths.description` | `[Chưa dùng]` | Quản lý các quầy bán và nhân viên phụ trách. | Manage physical sales locations and assign cashiers and operators. |
| `booths.createButton` | **`[Đang dùng]`** | Thêm gian hàng | Add Booth |
| `booths.editButton` | **`[Đang dùng]`** | Sửa gian hàng | Edit Booth |
| `booths.selectEvent` | **`[Đang dùng]`** | Chọn sự kiện | Select Event |
| `booths.allEvents` | **`[Đang dùng]`** | Tất cả sự kiện | All Events |
| `booths.name` | **`[Đang dùng]`** | Tên gian hàng | Booth Name |
| `booths.namePlaceholder` | **`[Đang dùng]`** | Quầy A - Cổng Tây | Booth A - West Gate |
| `booths.code` | **`[Đang dùng]`** | Mã quầy | Booth Code |
| `booths.codePlaceholder` | **`[Đang dùng]`** | BOOTH-A | BOOTH-A |
| `booths.assignedStaff` | `[Chưa dùng]` | Nhân viên | Assigned Staff |
| `booths.status` | **`[Đang dùng]`** | Trạng thái | Operating Status |
| `booths.noBooths` | **`[Đang dùng]`** | Chưa có gian hàng nào | No booths created yet |
| `booths.noBoothsDesc` | **`[Đang dùng]`** | Hãy tạo gian hàng tương ứng với các quầy bán thực tế. | Add physical booths corresponding to your tour merchandise counters. |
| `booths.statusList.active` | **`[Đang dùng]`** | Hoạt động | Active |
| `booths.statusList.paused` | **`[Đang dùng]`** | Tạm dừng | Paused |
| `booths.statusList.closed` | **`[Đang dùng]`** | Đã đóng | Closed |

#### 2.7 Namespace `products` (23 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `products.title` | **`[Đang dùng]`** | Sản phẩm | Products & Variants |
| `products.description` | **`[Đang dùng]`** | Danh mục hàng hóa, bảng giá và phân loại. | Merchandise catalog, pricing, size/color variants and SKU inventory. |
| `products.createButton` | **`[Đang dùng]`** | Thêm sản phẩm | Add Product |
| `products.editButton` | `[Chưa dùng]` | Sửa sản phẩm | Edit Product |
| `products.categories` | `[Chưa dùng]` | Danh mục | Categories |
| `products.allCategories` | **`[Đang dùng]`** | Tất cả danh mục | All Categories |
| `products.productName` | **`[Đang dùng]`** | Tên sản phẩm | Product Name |
| `products.productNamePlaceholder` | **`[Đang dùng]`** | Áo thun Tour Hạc Cầm 2026 | Tour 2026 Graphic T-Shirt |
| `products.categoryLabel` | **`[Đang dùng]`** | Danh mục | Product Category |
| `products.descriptionLabel` | **`[Đang dùng]`** | Mô tả sản phẩm | Description |
| `products.imageUrlLabel` | `[Chưa dùng]` | Đường dẫn ảnh sản phẩm | Image URL |
| `products.variantsSection` | **`[Đang dùng]`** | Biến thể & Tồn kho ban đầu | Variants & Initial Inventory |
| `products.addVariant` | **`[Đang dùng]`** | Thêm biến thể | Add Variant |
| `products.variantName` | `[Chưa dùng]` | Tên biến thể | Variant Name |
| `products.variantNamePlaceholder` | **`[Đang dùng]`** | Size L - Đen | Size L - Black |
| `products.sku` | `[Chưa dùng]` | Mã loại | SKU Code |
| `products.skuPlaceholder` | `[Chưa dùng]` | HC-TSHIRT-BLK-L | TOUR-TSHIRT-BLK-L |
| `products.price` | `[Chưa dùng]` | Giá bán | Price |
| `products.totalInventory` | `[Chưa dùng]` | Tổng kho nhập ban đầu | Total Stock (Initial) |
| `products.barcode` | `[Chưa dùng]` | Mã vạch (tùy chọn) | Barcode (optional) |
| `products.noProducts` | **`[Đang dùng]`** | Chưa có sản phẩm nào | No products created yet |
| `products.noProductsDesc` | **`[Đang dùng]`** | Hãy tạo các sản phẩm merchandise trước khi tiến hành phân bổ cho các gian hàng. | Add merchandise items before allocating them to event booths. |
| `products.units` | **`[Đang dùng]`** | sản phẩm | items |

#### 2.8 Namespace `inventory` (18 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `inventory.title` | **`[Đang dùng]`** | Kho hàng | Inventory & Booth Allocation |
| `inventory.description` | **`[Đang dùng]`** | Phân bổ số lượng hàng hóa từ kho tổng vào từng gian hàng. | Allocate stock from central tour storage into specific event booths before doors open. |
| `inventory.allocateButton` | `[Chưa dùng]` | Phân bổ kho | Allocate to Booth |
| `inventory.selectEventBooth` | `[Chưa dùng]` | Chọn sự kiện và quầy | Select Event and Booth |
| `inventory.selectBoothPrompt` | **`[Đang dùng]`** | Chọn quầy để kiểm tra và phân bổ | Select a booth to inspect and adjust its allocated stock |
| `inventory.masterOverview` | `[Chưa dùng]` | Tổng quan kho | Master Inventory Overview |
| `inventory.totalStock` | **`[Đang dùng]`** | Tổng kho | Total Stock |
| `inventory.allocatedStock` | **`[Đang dùng]`** | Đã phân bổ | Allocated |
| `inventory.storageStock` | **`[Đang dùng]`** | Kho tổng | Central Storage |
| `inventory.soldStock` | **`[Đang dùng]`** | Đã bán | Sold |
| `inventory.boothAllocation` | `[Chưa dùng]` | Tồn kho quầy | Booth Allocation Limit |
| `inventory.availableToSell` | `[Chưa dùng]` | Có thể bán | Available to Sell |
| `inventory.allocatedQty` | `[Chưa dùng]` | Số lượng cấp | Allocated Qty |
| `inventory.storageRemaining` | `[Chưa dùng]` | Còn trong kho | Remaining in Storage |
| `inventory.quickTransfer` | `[Chưa dùng]` | Điều chuyển | Quick Transfer |
| `inventory.ruleNotice` | **`[Đang dùng]`** | Gian hàng chỉ được bán trong phạm vi số lượng đã phân bổ. | Rule: A booth cannot sell more items than its available allocated stock. |
| `inventory.noAllocations` | `[Chưa dùng]` | Chưa có phân bổ nào | No stock allocated for this booth yet |
| `inventory.allocateSuccess` | `[Chưa dùng]` | Đã lưu phân bổ kho | Inventory allocation updated successfully |

#### 2.9 Namespace `team` (25 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `team.title` | `[Chưa dùng]` | Nhân sự | Team & Access Control |
| `team.description` | `[Chưa dùng]` | Quản lý thành viên và phân quyền trong hệ thống. | Manage crew members in your Workspace, invite staff and grant scoped roles. |
| `team.inviteButton` | `[Chưa dùng]` | Mời thành viên | Invite Member |
| `team.membersCount` | `[Chưa dùng]` | Thành viên | Members |
| `team.pendingInvitations` | `[Chưa dùng]` | Đang chờ | Pending Invitations |
| `team.emailLabel` | `[Chưa dùng]` | Email | Member Email |
| `team.emailPlaceholder` | `[Chưa dùng]` | crew@eventmate.com | crew@eventmate.com |
| `team.roleLabel` | `[Chưa dùng]` | Vai trò | Assigned Role |
| `team.expiresIn` | `[Chưa dùng]` | Hạn mời | Expires In |
| `team.sendInvite` | `[Chưa dùng]` | Gửi lời mời | Send Invitation |
| `team.copyInviteLink` | `[Chưa dùng]` | Sao chép link | Copy Invite Link |
| `team.revokeInvite` | `[Chưa dùng]` | Thu hồi | Revoke |
| `team.noMembers` | `[Chưa dùng]` | Chưa có thành viên | No additional members yet |
| `team.roles.owner` | `[Chưa dùng]` | Chủ sở hữu (Owner) | Owner |
| `team.roles.admin` | `[Chưa dùng]` | Quản trị viên (Admin) | Admin |
| `team.roles.manager` | `[Chưa dùng]` | Quản lý (Manager) | Tour Manager |
| `team.roles.cashier` | `[Chưa dùng]` | Thu ngân (Cashier) | Cashier |
| `team.roles.inventory_staff` | `[Chưa dùng]` | Thủ kho (Inventory) | Inventory Staff |
| `team.roles.viewer` | `[Chưa dùng]` | Khách xem (Viewer) | Viewer |
| `team.roleDescriptions.owner` | `[Chưa dùng]` | Toàn quyền quản lý tài chính và phân quyền. | Full access to workspace, settings, team, and financials. |
| `team.roleDescriptions.admin` | `[Chưa dùng]` | Quản trị sự kiện, quầy bán và sản phẩm. | Manage events, booths, products, and members. |
| `team.roleDescriptions.manager` | `[Chưa dùng]` | Giám sát vận hành và phân bổ kho. | Manage events, booths, and stock allocations. |
| `team.roleDescriptions.cashier` | `[Chưa dùng]` | Bán hàng qua POS và trả hàng đặt trước. | Sell via POS and view assigned booth inventory. |
| `team.roleDescriptions.inventory_staff` | `[Chưa dùng]` | Quản lý nhập xuất và kiểm kê kho. | Manage stock intake, transfers, and receiving. |
| `team.roleDescriptions.viewer` | `[Chưa dùng]` | Chỉ xem báo cáo, không thể chỉnh sửa. | Read-only access to sales and reports. |

#### 2.10 Namespace `settings` (12 keys)
| Key | Trạng thái | Tiếng Việt (`vi.json`) | Tiếng Anh (`en.json`) |
| :--- | :--- | :--- | :--- |
| `settings.title` | `[Chưa dùng]` | Cài đặt | Workspace Settings |
| `settings.description` | `[Chưa dùng]` | Cấu hình tài khoản, đơn vị tiền tệ và hệ thống. | Configure artist profile, default currency and demo testing data. |
| `settings.workspaceInfo` | `[Chưa dùng]` | Thông tin Workspace | Workspace Information |
| `settings.name` | `[Chưa dùng]` | Tên Không gian làm việc | Workspace Name |
| `settings.slug` | `[Chưa dùng]` | Định danh (Slug) | Slug Identifier |
| `settings.currency` | **`[Đang dùng]`** | Đơn vị tiền tệ | Default Currency |
| `settings.currencyHelp` | `[Chưa dùng]` | Tiền tệ dùng để định giá merchandise và tính toán doanh thu trên POS. | Currency used for pricing merchandise and calculating POS receipts. |
| `settings.demoSection` | **`[Đang dùng]`** | Dữ liệu mẫu Tour diễn | Tour Demo Data |
| `settings.demoHelp` | **`[Đang dùng]`** | Tải một bộ dữ liệu đầy đủ bao gồm Tour diễn, 2 gian hàng, 4 sản phẩm mẫu cùng phân bổ kho để kiểm thử ngay. | Load a realistic demo tour with 2 booths, 4 products, variants and allocated stock for instant testing. |
| `settings.loadDemoData` | **`[Đang dùng]`** | Nạp dữ liệu mẫu Tour diễn | Load Tour Demo Data |
| `settings.demoLoaded` | **`[Đang dùng]`** | Đã nạp thành công dữ liệu mẫu Tour diễn! | Tour demo data loaded successfully! |
| `settings.saveChanges` | `[Chưa dùng]` | Lưu thay đổi | Save Changes |

---

## Mục 3: Dữ liệu Mặc định, Dữ liệu Mẫu trong Stores & Trạng thái Kho

#### 3.1 Workspace Mặc định (`workspace-store.ts`)
> Nguồn: [src/stores/workspace-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts) — **18** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L23](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L23) | Thuộc tính dữ liệu | name | HikaruStore |
| [L24](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L24) | Chuỗi JS / Fallback | slug | hikarustore |
| [L26](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L26) | Chuỗi JS / Fallback | currency | VND |
| [L27](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L27) | Thuộc tính dữ liệu | description | Không gian bán hàng và phân phối merchandise chính hãng HikaruStore |
| [L29](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L29) | Thuộc tính dữ liệu | owner_name | Nguyễn Văn Tuấn |
| [L30](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L30) | Thuộc tính dữ liệu | phone | 0988.776.655 |
| [L31](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L31) | Thuộc tính dữ liệu | email | contact@hikarustore.vn |
| [L32](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L32) | Thuộc tính dữ liệu | address | Gian Hàng HikaruStore, Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh |
| [L34](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L34) | Thuộc tính dữ liệu | slogan | Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng |
| [L37](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L37) | Thuộc tính dữ liệu | bank_account_name | NGUYEN VAN TUAN |
| [L66](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L66) | Chuỗi JS / Fallback | literal | VND |
| [L74](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L74) | Chuỗi JS / Fallback | literal | Dự án Collab / Gian hàng hợp tác |
| [L74](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L74) | Chuỗi JS / Fallback | literal | Không gian làm việc riêng |
| [L75](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L75) | Chuỗi JS / Fallback | literal | Nguyễn Văn Tuấn |
| [L77](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L77) | Chuỗi JS / Fallback | literal | contact@hikarustore.vn |
| [L78](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L78) | Chuỗi JS / Fallback | literal | Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh |
| [L80](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L80) | Chuỗi JS / Fallback | literal | Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng |
| [L121](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts#L121) | Chuỗi JS / Fallback | literal | Gian hàng của tôi |


#### 3.2 Dữ liệu Mẫu Sự kiện, Gian hàng, Sản phẩm & Thông báo (`data-store.ts`)
> Nguồn: [src/stores/data-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts) — **66** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L105](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L105) | Thuộc tính dữ liệu | name | Áo thun & Trang phục |
| [L106](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L106) | Thuộc tính dữ liệu | name | Phụ kiện & Lightstick |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L107) | Thuộc tính dữ liệu | name | Đĩa Than (Vinyl) & CD |
| [L114](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L114) | Thuộc tính dữ liệu | name | 🧪 Sự kiện Test (Chạy thử nghiệm POS) |
| [L115](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L115) | Thuộc tính dữ liệu | description | Sự kiện dành riêng để chạy thử máy POS, test giao dịch và đối soát doanh thu |
| [L116](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L116) | Thuộc tính dữ liệu | location | Quầy Demo & Test POS |
| [L127](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L127) | Thuộc tính dữ liệu | name | Hạc Cầm Live Concert - Hà Nội |
| [L128](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L128) | Thuộc tính dữ liệu | description | Đêm diễn mở màn tour lưu diễn 2026 tại Hà Nội |
| [L129](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L129) | Thuộc tính dữ liệu | location | Trung tâm Hội nghị Quốc gia, Hà Nội |
| [L139](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L139) | Thuộc tính dữ liệu | name | Hạc Cầm Tour - TP. Hồ Chí Minh |
| [L140](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L140) | Thuộc tính dữ liệu | description | Đêm nhạc sân vận động thứ hai |
| [L141](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L141) | Thuộc tính dữ liệu | location | Nhà thi đấu Phú Thọ, Quận 11, TP.HCM |
| [L155](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L155) | Thuộc tính dữ liệu | name | Quầy Test POS 01 |
| [L156](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L156) | Thuộc tính dữ liệu | code | BOOTH-TEST |
| [L166](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L166) | Thuộc tính dữ liệu | name | Quầy A - Cổng chính |
| [L167](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L167) | Thuộc tính dữ liệu | code | BOOTH-A |
| [L176](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L176) | Thuộc tính dữ liệu | name | Quầy B - Khu VIP & Sân trong |
| [L177](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L177) | Thuộc tính dữ liệu | code | BOOTH-B |
| [L186](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L186) | Thuộc tính dữ liệu | name | Quầy 1 - Khu Vé & Check-in |
| [L187](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L187) | Thuộc tính dữ liệu | code | BOOTH-SG1 |
| [L196](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L196) | Thuộc tính dữ liệu | name | Quầy 2 - Sân khấu chính |
| [L197](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L197) | Thuộc tính dữ liệu | code | BOOTH-SG2 |
| [L206](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L206) | Thuộc tính dữ liệu | name | Quầy Collab — GenZ Studio |
| [L207](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L207) | Thuộc tính dữ liệu | code | BOOTH-COL-GENZ |
| [L210](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L210) | Thuộc tính dữ liệu | collab_partner | GenZ Studio |
| [L222](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L222) | Thuộc tính dữ liệu | name | Áo thun Tour Hạc Cầm 2026 (Black Edition) |
| [L223](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L223) | Thuộc tính dữ liệu | description | Chất liệu 100% cotton định lượng 250gsm, in lụa thủ công mặt trước và lịch tour mặt sau. |
| [L233](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L233) | Thuộc tính dữ liệu | name | Nón lưỡi trai Official Tour Cap |
| [L234](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L234) | Thuộc tính dữ liệu | description | Thêu nổi biểu tượng Hạc Cầm phía trước, khóa kim loại cao cấp tùy chỉnh. |
| [L244](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L244) | Thuộc tính dữ liệu | name | Lightstick Cổ vũ Hạc Cầm RGB |
| [L245](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L245) | Thuộc tính dữ liệu | description | Đèn phát sáng đồng bộ bluetooth theo nhịp điệu sân khấu, 15 chế độ màu sắc. |
| [L255](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L255) | Thuộc tính dữ liệu | name | Đĩa Than (Vinyl) - Album 'Khởi Hành' |
| [L256](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L256) | Thuộc tính dữ liệu | description | Đĩa nhựa 180g mastered tại Abbey Road, phiên bản kỷ niệm có chữ ký tác quyền. |
| [L266](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L266) | Thuộc tính dữ liệu | name | Túi Canvas Collab Hạc Cẩm x GenZ Studio |
| [L267](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L267) | Thuộc tính dữ liệu | description | Túi tote canvas cao cấp phiên bản giới hạn hợp tác cùng GenZ Studio. |
| [L269](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L269) | Thuộc tính dữ liệu | collab_partner | GenZ Studio |
| [L281](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L281) | Thuộc tính dữ liệu | sku | HC-TSHIRT-BLK-S |
| [L282](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L282) | Thuộc tính dữ liệu | name | Size S |
| [L295](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L295) | Thuộc tính dữ liệu | sku | HC-TSHIRT-BLK-M |
| [L296](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L296) | Thuộc tính dữ liệu | name | Size M |
| [L309](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L309) | Thuộc tính dữ liệu | sku | HC-TSHIRT-BLK-L |
| [L310](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L310) | Thuộc tính dữ liệu | name | Size L |
| [L323](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L323) | Thuộc tính dữ liệu | sku | HC-CAP-BLK |
| [L324](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L324) | Thuộc tính dữ liệu | name | Freesize - Đen |
| [L337](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L337) | Thuộc tính dữ liệu | sku | HC-LIGHTSTICK-RGB |
| [L338](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L338) | Thuộc tính dữ liệu | name | Phiên bản Chuẩn RGB |
| [L351](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L351) | Thuộc tính dữ liệu | sku | HC-VINYL-LTD |
| [L352](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L352) | Thuộc tính dữ liệu | name | Bản chữ ký đặc biệt |
| [L365](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L365) | Thuộc tính dữ liệu | sku | COL-GENZ-BAG-01 |
| [L366](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L366) | Thuộc tính dữ liệu | name | Tiêu chuẩn (Standard) |
| [L434](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L434) | Thuộc tính dữ liệu | full_name | Alex Rivera (Tour Lead) |
| [L436](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L436) | Thuộc tính dữ liệu | phone | 0901234567 |
| [L450](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L450) | Thuộc tính dữ liệu | full_name | Trần Bảo Minh |
| [L452](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L452) | Thuộc tính dữ liệu | phone | 0912345678 |
| [L466](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L466) | Thuộc tính dữ liệu | full_name | Lê Thu Trang |
| [L468](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L468) | Thuộc tính dữ liệu | phone | 0923456789 |
| [L482](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L482) | Thuộc tính dữ liệu | full_name | Nguyễn Hoàng Long |
| [L484](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L484) | Thuộc tính dữ liệu | phone | 0934567890 |
| [L498](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L498) | Thuộc tính dữ liệu | full_name | Phạm Quốc Huy |
| [L500](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L500) | Thuộc tính dữ liệu | phone | 0945678901 |
| [L511](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L511) | Thuộc tính dữ liệu | email | thungan.hanoi@eventmate.com |
| [L859](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L859) | Mẫu văn bản (`...`) | template | `prod-collab-${Date.now()}` |
| [L860](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L860) | Mẫu văn bản (`...`) | template | `var-collab-${Date.now()}` |
| [L861](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L861) | Mẫu văn bản (`...`) | template | `alloc-collab-${Date.now()}` |
| [L868](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L868) | Mẫu văn bản (`...`) | template | `Sản phẩm do đối tác ${partnerName} mang đến` |
| [L881](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L881) | Chuỗi JS / Fallback | literal | Tiêu chuẩn |


#### 3.3 Tài khoản Mẫu & Thông báo Xác thực (`auth-store.ts`)
> Nguồn: [src/stores/auth-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts) — **25** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L41](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L41) | Thuộc tính dữ liệu | username | Tuanadminvippro666 |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L42) | Thuộc tính dữ liệu | email | tuanadmin@eventmate.app |
| [L44](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L44) | Thuộc tính dữ liệu | fullName | Tuấn Admin VIP Pro |
| [L50](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L50) | Thuộc tính dữ liệu | username | HKT87@123 |
| [L51](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L51) | Thuộc tính dữ liệu | email | hkt87@eventmate.app |
| [L53](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L53) | Thuộc tính dữ liệu | fullName | HKT Super Admin |
| [L59](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L59) | Thuộc tính dữ liệu | username | collab_genz |
| [L60](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L60) | Thuộc tính dữ liệu | email | genz@collab.eventmate.app |
| [L62](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L62) | Thuộc tính dữ liệu | fullName | Đại diện GenZ Studio (Đối tác Collab) |
| [L130](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L130) | Thuộc tính dữ liệu | message | Tên đăng nhập hoặc email không tồn tại trong hệ thống. |
| [L141](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L141) | Chuỗi JS / Fallback | literal | tuanadminvippro666 |
| [L143](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L143) | Chuỗi JS / Fallback | literal | tuanadminvippro666 |
| [L159](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L159) | Chuỗi JS / Fallback | literal | collab_genz |
| [L161](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L161) | Chuỗi JS / Fallback | literal | collab@123 |
| [L162](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L162) | Chuỗi JS / Fallback | literal | collab_genz |
| [L171](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L171) | Thuộc tính dữ liệu | message | Mật khẩu không chính xác. |
| [L197](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L197) | Thuộc tính dữ liệu | username | guest |
| [L198](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L198) | Thuộc tính dữ liệu | fullName | Khách xem (Chỉ đọc) |
| [L214](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L214) | Thuộc tính dữ liệu | username | guest |
| [L215](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L215) | Thuộc tính dữ liệu | fullName | Khách xem (Chỉ đọc) |
| [L277](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L277) | Thuộc tính dữ liệu | message | Tên đăng nhập không được để trống. |
| [L280](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L280) | Thuộc tính dữ liệu | message | Mật khẩu phải từ 6 ký tự trở lên. |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L289) | Mẫu văn bản (`...`) | template | `Tên đăng nhập "${cleanUsername}" đã được sử dụng.` |
| [L295](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L295) | Mẫu văn bản (`...`) | template | `${cleanUsername.toLowerCase()}@eventmate.local` |
| [L311](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts#L311) | Hộp thoại `alert`/`confirm` | alert | alert('Không thể xóa tài khoản Quản trị viên chính.') |


#### 3.4 Đơn hàng Mẫu & Lỗi Tạo đơn (`orders-store.ts`)
> Nguồn: [src/stores/orders-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts) — **11** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L30](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L30) | Chuỗi JS / Fallback | accountName | NGUYEN VAN TUAN - HIKARUSTORE |
| [L77](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L77) | Thuộc tính dữ liệu | order_number | EM-4748 |
| [L85](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L85) | Thuộc tính dữ liệu | notes | Đơn hàng thử nghiệm máy bán hàng POS (30 món) |
| [L109](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L109) | Thuộc tính dữ liệu | order_number | EM-9089 |
| [L117](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L117) | Thuộc tính dữ liệu | notes | Đơn hàng thử nghiệm máy bán hàng POS (1 món) |
| [L222](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L222) | Chuỗi JS / Fallback | literal | Giỏ hàng trống |
| [L333](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L333) | Mẫu văn bản (`...`) | template | `Thu ngân (${cashierId \|\| 'POS'})` |
| [L337](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L337) | Mẫu văn bản (`...`) | template | `Đơn #${orderNumber}` |
| [L338](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L338) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Thu ngân tạo đơn hàng #${orderNumber} thành công (${cart.map((c) => `...` |
| [L340](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L340) | Mẫu văn bản (`...`) | template | `${finalAmount.toLocaleString('vi-VN')} VND` |
| [L341](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L341) | Chuỗi JS / Fallback | field_label | Hình thức |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([orders-store.ts#L338](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L338))

```text
`Thu ngân tạo đơn hàng #${orderNumber} thành công (${cart.map((c) => `${c.quantity}x ${c.productName}`).join(', ')}). Tổng tiền: ${finalAmount.toLocaleString('vi-VN')} VND qua ${paymentMethod === 'cash' ? `Tiền mặt (Khách đưa: ${(newOrder.tendered_amount || finalAmount).toLocaleString('vi-VN')} đ, Thối lại: ${(newOrder.change_amount || 0).toLocaleString('vi-VN')} đ)` : 'VietQR'}.`
```


#### 3.5 Đơn Đặt trước / Giữ đồ VIP Mẫu (`preorder-store.ts`)
> Nguồn: [src/stores/preorder-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts) — **42** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L12](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L12) | Thuộc tính dữ liệu | code | PRE-7821 |
| [L16](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L16) | Thuộc tính dữ liệu | customer_name | Nguyễn Thùy Linh (VIP Fan) |
| [L23](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L23) | Thuộc tính dữ liệu | variant_name | Size L |
| [L24](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L24) | Thuộc tính dữ liệu | product_name | Áo Tour Official 2026 |
| [L30](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L30) | Thuộc tính dữ liệu | variant_name | Bản Tiêu Chuẩn |
| [L31](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L31) | Thuộc tính dữ liệu | product_name | Lightstick Đổi Màu RGB |
| [L39](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L39) | Thuộc tính dữ liệu | notes | Khách VIP đã cọc 100% qua chuyển khoản, nhận trước giờ diễn 30p. |
| [L45](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L45) | Thuộc tính dữ liệu | code | ONL-3419 |
| [L49](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L49) | Thuộc tính dữ liệu | customer_name | Trần Minh Quân (Đơn Web Online) |
| [L56](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L56) | Thuộc tính dữ liệu | variant_name | Full Box 10 Card |
| [L57](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L57) | Thuộc tính dữ liệu | product_name | Set Photocard Hologram Special |
| [L63](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L63) | Thuộc tính dữ liệu | variant_name | Đen Trơn |
| [L64](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L64) | Thuộc tính dữ liệu | product_name | Nón Cap Hạc Cầm Signature |
| [L72](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L72) | Thuộc tính dữ liệu | notes | Đơn đặt trước trên Website EventMate, có mã QR nhận hàng tại quầy. |
| [L78](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L78) | Thuộc tính dữ liệu | code | COL-9012 |
| [L82](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L82) | Thuộc tính dữ liệu | customer_name | Lê Hoàng Yến |
| [L89](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L89) | Thuộc tính dữ liệu | variant_name | Size XL |
| [L90](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L90) | Thuộc tính dữ liệu | product_name | Áo Hoodie Collab GenZ Limited |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L98) | Thuộc tính dữ liệu | notes | Đã nhận lúc 17:30 tại quầy Collab A1 |
| [L101](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L101) | Chuỗi JS / Fallback | picked_up_by | Thu ngân Quầy A1 |
| [L150](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L150) | Thuộc tính dữ liệu | message | BẮT BUỘC: Bạn phải chụp lại ảnh minh chứng nhận hàng trước khi xác nhận! |
| [L158](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L158) | Thuộc tính dữ liệu | message | Không tìm thấy đơn đặt trước này. |
| [L162](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L162) | Thuộc tính dữ liệu | message | Đơn này đã được xác nhận nhận hàng trước đó. |
| [L175](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L175) | Chuỗi JS / Fallback | literal | Thu ngân quầy |
| [L244](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L244) | Chuỗi JS / Fallback | literal | Thu ngân quầy |
| [L257](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L257) | Mẫu văn bản (`...`) | template | `Trả hàng đặt trước #${preorder.code} cho khách ${preorder.customer_name}. Đã xác nhận kèm ảnh minh chứng.` |
| [L281](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L281) | Chuỗi JS / Fallback | literal | Thu ngân POS |
| [L285](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L285) | Mẫu văn bản (`...`) | template | `Đơn Trả hàng #${preorder.code}` |
| [L286](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L286) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Thu ngân đã xác nhận trả hàng đặt trước #${preorder.code} cho khách "...` |
| [L288](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L288) | Chuỗi JS / Fallback | field_label | Minh chứng ảnh |
| [L288](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L288) | Chuỗi JS / Fallback | new_value | Đã đính kèm ảnh chụp nhận hàng |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L289) | Chuỗi JS / Fallback | field_label | Trạng thái |
| [L317](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L317) | Chuỗi JS / Fallback | literal | Khách hoặc thu ngân hủy giữ chỗ |
| [L318](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L318) | Chuỗi JS / Fallback | literal | Thu ngân quầy |
| [L325](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L325) | Thuộc tính dữ liệu | message | Không tìm thấy đơn đặt trước. |
| [L329](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L329) | Thuộc tính dữ liệu | message | Đơn đặt trước này đã bị từ chối / hủy trước đó. |
| [L344](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L344) | Mẫu văn bản (`...`) | template | `${p.notes} \| [ĐÃ TỪ CHỐI/HỦY: ${reason}]` |
| [L344](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L344) | Mẫu văn bản (`...`) | template | `[ĐÃ TỪ CHỐI/HỦY: ${reason}]` |
| [L391](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L391) | Mẫu văn bản (`...`) | template | `Từ chối đơn #${preorder.code}` |
| [L393](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L393) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #2** bên dưới:_ ``Thu ngân/Quản lý đã từ chối trả hàng / hủy giữ chỗ đơn #${preorder.co...` |
| [L395](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L395) | Chuỗi JS / Fallback | field_label | Trạng thái |
| [L396](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L396) | Chuỗi JS / Fallback | field_label | Lý do từ chối |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([preorder-store.ts#L286](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L286))

```text
`Thu ngân đã xác nhận trả hàng đặt trước #${preorder.code} cho khách "${preorder.customer_name}" (${preorder.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}) với ẢNH MINH CHỨNG đính kèm. Đã xuất kho thành công.`
```

##### 📄 Mẫu #2 — Mẫu văn bản (`...`) ([preorder-store.ts#L393](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L393))

```text
`Thu ngân/Quản lý đã từ chối trả hàng / hủy giữ chỗ đơn #${preorder.code} của khách "${preorder.customer_name}". Lý do: "${reason}". Đã hoàn trả lại ${preorder.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')} về kho khả dụng.`
```


#### 3.6 Nhật ký Hệ thống Mẫu (`audit-store.ts`)
> Nguồn: [src/stores/audit-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts) — **48** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L10](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L10) | Thuộc tính dữ liệu | actor_name | Đối tác: GenZ Merch (Collab) |
| [L14](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L14) | Thuộc tính dữ liệu | entity_name | Áo Hoodie Collab Limited Edition (Size XL) |
| [L15](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L15) | Thuộc tính dữ liệu | booth_name | Gian hàng Collab Booth A |
| [L16](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L16) | Thuộc tính dữ liệu | event_name | Live Concert Vũ Trụ 2026 |
| [L17](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L17) | Thuộc tính dữ liệu | description | Đối tác "GenZ Merch" vừa đóng góp 40 sản phẩm "Áo Hoodie Collab Limited Edition (Size XL)" vào gian hàng. Tự giữ chỗ: 8, Đã đặt online: 12, Khả dụng bán tại quầy: 20. |
| [L19](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L19) | Chuỗi JS / Fallback | field_label | Giá niêm yết |
| [L19](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L19) | Chuỗi JS / Fallback | new_value | 450.000 VND |
| [L20](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L20) | Chuỗi JS / Fallback | field_label | Tổng kho mang đến |
| [L21](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L21) | Chuỗi JS / Fallback | field_label | Tự giữ trước (VIP) |
| [L22](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L22) | Chuỗi JS / Fallback | field_label | Đơn đặt mua online |
| [L28](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L28) | Thuộc tính dữ liệu | actor_name | Đối tác: GenZ Merch (Collab) |
| [L32](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L32) | Thuộc tính dữ liệu | entity_name | Móc Khóa Mica Hologram |
| [L33](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L33) | Thuộc tính dữ liệu | booth_name | Gian hàng Collab Booth A |
| [L34](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L34) | Thuộc tính dữ liệu | event_name | Live Concert Vũ Trụ 2026 |
| [L35](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L35) | Thuộc tính dữ liệu | description | Đối tác "GenZ Merch" bổ sung thêm +10 sản phẩm "Móc Khóa Mica Hologram" vào quầy bán chung. |
| [L37](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L37) | Chuỗi JS / Fallback | field_label | Số lượng bổ sung |
| [L43](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L43) | Thuộc tính dữ liệu | actor_name | Trần Thị Trợ Lý (Staff) |
| [L48](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L48) | Thuộc tính dữ liệu | entity_name | Áo Tour Official 2026 - Size L |
| [L49](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L49) | Thuộc tính dữ liệu | booth_name | Gian Hàng Merchandise Chính A1 |
| [L50](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L50) | Thuộc tính dữ liệu | description | Nhân viên trợ lý cập nhật số lượng đặt trước: Giữ riêng VIP tăng từ 5 lên 10, Đơn online: 15. |
| [L52](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L52) | Chuỗi JS / Fallback | field_label | Tự giữ trước (VIP) |
| [L53](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L53) | Chuỗi JS / Fallback | field_label | Đơn online |
| [L59](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L59) | Thuộc tính dữ liệu | actor_name | Thu ngân Quầy A1 (Cashier) |
| [L64](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L64) | Thuộc tính dữ liệu | entity_name | Đơn hàng #EM-7821 |
| [L65](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L65) | Thuộc tính dữ liệu | booth_name | Gian Hàng Merchandise Chính A1 |
| [L66](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L66) | Thuộc tính dữ liệu | description | Thu ngân quầy A1 tạo thành công đơn hàng #EM-7821 trị giá 350.000 VND (Phương thức: VietQR chuyển khoản). Giảm 1 món "Áo Tour 2026". |
| [L68](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L68) | Chuỗi JS / Fallback | field_label | Giá trị đơn |
| [L68](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L68) | Chuỗi JS / Fallback | new_value | 350.000 VND |
| [L69](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L69) | Chuỗi JS / Fallback | field_label | Thanh toán |
| [L69](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L69) | Chuỗi JS / Fallback | new_value | VietQR |
| [L75](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L75) | Thuộc tính dữ liệu | actor_name | Tuấn Admin VIP Pro (Owner) |
| [L77](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L77) | Chuỗi JS / Fallback | actor_username | Tuanadminvippro666 |
| [L80](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L80) | Thuộc tính dữ liệu | entity_name | Tài khoản thu ngân: cashier_a1 |
| [L81](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L81) | Thuộc tính dữ liệu | description | Admin cấp tài khoản mới "cashier_a1" với vai trò "Thu ngân (Cashier)" và cấp quyền truy cập máy POS. |
| [L83](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L83) | Chuỗi JS / Fallback | field_label | Vai trò cấp |
| [L84](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L84) | Chuỗi JS / Fallback | field_label | Tên đăng nhập |
| [L90](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L90) | Thuộc tính dữ liệu | actor_name | Nguyễn Văn Staff (Inventory) |
| [L95](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L95) | Thuộc tính dữ liệu | entity_name | Nón Cap Hạc Cầm Signature |
| [L96](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L96) | Thuộc tính dữ liệu | booth_name | Kho Tổng Trung Tâm |
| [L97](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L97) | Thuộc tính dữ liệu | description | Nhân viên kho điều chỉnh định mức phân bổ: Cấp thêm +20 nón vào gian hàng Merchandise Phụ B2. |
| [L99](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L99) | Chuỗi JS / Fallback | field_label | Số lượng phân bổ |
| [L105](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L105) | Thuộc tính dữ liệu | actor_name | Tuấn Admin VIP Pro (Owner) |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L107) | Chuỗi JS / Fallback | actor_username | Tuanadminvippro666 |
| [L110](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L110) | Thuộc tính dữ liệu | entity_name | Lightstick Đổi Màu RGB |
| [L111](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L111) | Thuộc tính dữ liệu | description | Admin cập nhật giá bán niêm yết từ 250.000 VND lên 280.000 VND. |
| [L113](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L113) | Chuỗi JS / Fallback | field_label | Giá niêm yết |
| [L113](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L113) | Chuỗi JS / Fallback | old_value | 250.000 VND |
| [L113](file:///D:/Codes/QuanLyGianHangHKT/src/stores/audit-store.ts#L113) | Chuỗi JS / Fallback | new_value | 280.000 VND |


#### 3.7 Góp ý & Báo lỗi Mẫu (`feedback-store.ts`)
> Nguồn: [src/stores/feedback-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts) — **26** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L49](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L49) | Thuộc tính dữ liệu | title | F5 trang POS quầy bán bị reset làm báo hết hàng |
| [L50](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L50) | Thuộc tính dữ liệu | description | Khi bán hàng tại quầy và ấn F5 tải lại trang, mã quầy được chọn bị trống dẫn tới hàng báo hết hàng. Cần lưu quầy vào bộ nhớ trình duyệt để tải lại không bị mất. |
| [L51](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L51) | Chuỗi JS / Fallback | module | POS Bán hàng |
| [L55](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L55) | Chuỗi JS / Fallback | reporter_name | Thu ngân Quầy A (Long) |
| [L57](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L57) | Thuộc tính dữ liệu | admin_notes | Đã fix thành công: Lưu selectedBoothId và selectedEventId vào localStorage kèm cơ chế tự khôi phục dữ liệu. |
| [L64](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L64) | Thuộc tính dữ liệu | title | Hỗ trợ tính tiền thối tự động khi khách trả tiền mặt |
| [L65](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L65) | Thuộc tính dữ liệu | description | Khách hay đưa 500k hoặc 1 triệu cho các đơn 350k, thu ngân cần ô nhập nhanh số tiền khách đưa để máy tự tính tiền cần thối lại tránh nhầm lẫn trong lúc đông khách. |
| [L66](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L66) | Chuỗi JS / Fallback | module | Thanh toán & Đơn hàng |
| [L72](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L72) | Thuộc tính dữ liệu | admin_notes | Đã thêm modal thanh toán tiền mặt với các nút gợi ý tiền 100k, 200k, 500k và tự động tính tiền thối kèm cảnh báo thiếu tiền. |
| [L79](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L79) | Thuộc tính dữ liệu | title | Cho phép chụp ảnh sản phẩm bằng điện thoại để up lên |
| [L80](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L80) | Thuộc tính dữ liệu | description | Đối tác mang hàng đến tại sự kiện muốn chụp ngay ảnh thật của sản phẩm từ camera điện thoại để đưa vào quầy bán thay vì phải copy link ảnh trên mạng. |
| [L81](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L81) | Chuỗi JS / Fallback | module | Sản phẩm & Biến thể |
| [L85](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L85) | Chuỗi JS / Fallback | reporter_name | Trần Bảo Minh |
| [L87](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L87) | Thuộc tính dữ liệu | admin_notes | Đã tích hợp camera capture và thư viện ảnh từ điện thoại có nén ảnh tự động bằng HTML5 Canvas siêu nhẹ. |
| [L94](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L94) | Thuộc tính dữ liệu | title | Thêm giao diện Tối (Dark Mode) khi bán hàng ban đêm |
| [L95](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L95) | Thuộc tính dữ liệu | description | Các buổi concert biểu diễn ban đêm sân khấu rất tối, ánh sáng trắng của màn hình POS gây chói mắt thu ngân. Mong có nút đổi sang Dark Mode. |
| [L96](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L96) | Chuỗi JS / Fallback | module | Giao diện & Hiển thị |
| [L100](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L100) | Chuỗi JS / Fallback | reporter_name | Lê Thu Trang |
| [L102](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L102) | Thuộc tính dữ liệu | admin_notes | Đã hoàn thiện hệ thống theme Sáng / Tối đồng bộ cho cả Dashboard, POS và Cổng Collab. |
| [L109](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L109) | Thuộc tính dữ liệu | title | Góp ý: Xuất báo cáo doanh thu ra file Excel / PDF cuối ngày |
| [L110](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L110) | Thuộc tính dữ liệu | description | Cần có nút tải xuống file bảng tính Excel để đối soát doanh thu từng nhân viên ca sáng và ca chiều sau khi bế mạc sự kiện. |
| [L111](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L111) | Chuỗi JS / Fallback | module | Báo cáo & Thống kê |
| [L115](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L115) | Chuỗi JS / Fallback | reporter_name | Tuấn Admin VIP Pro |
| [L117](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L117) | Thuộc tính dữ liệu | admin_notes | Đang lên kế hoạch phát triển cho bản cập nhật tiếp theo. |
| [L141](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L141) | Chuỗi JS / Fallback | literal | Người dùng / Thu ngân |
| [L146](file:///D:/Codes/QuanLyGianHangHKT/src/stores/feedback-store.ts#L146) | Mẫu văn bản (`...`) | template | `Gửi ${data.type === 'bug' ? 'báo cáo lỗi' : 'góp ý cải thiện'}: "${data.title}" (${data.module}).` |


#### 3.8 Dữ liệu Ca Thu ngân (`shift-store.ts`)
> Nguồn: [src/stores/shift-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/shift-store.ts) — **3** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L102](file:///D:/Codes/QuanLyGianHangHKT/src/stores/shift-store.ts#L102) | Mẫu văn bản (`...`) | template | `Mở ca thu ngân mới tại "${boothName}". Tiền mặt đầu ca: ${startingCashFloat.toLocaleString('vi-VN')} đ.` |
| [L114](file:///D:/Codes/QuanLyGianHangHKT/src/stores/shift-store.ts#L114) | Chuỗi JS / Fallback | literal | vietqr |
| [L163](file:///D:/Codes/QuanLyGianHangHKT/src/stores/shift-store.ts#L163) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Chốt ca thu ngân (Z-Report). Doanh thu: ${closedShift.totalSales.toLo...` |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([shift-store.ts#L163](file:///D:/Codes/QuanLyGianHangHKT/src/stores/shift-store.ts#L163))

```text
`Chốt ca thu ngân (Z-Report). Doanh thu: ${closedShift.totalSales.toLocaleString('vi-VN')} đ (${closedShift.ordersCount} đơn). Thực đếm két: ${closingCashCount.toLocaleString('vi-VN')} đ (Lệch: ${difference > 0 ? `+${difference.toLocaleString('vi-VN')}` : difference.toLocaleString('vi-VN')} đ).`
```


#### 3.9 Quy tắc & Nhãn 5 Trạng thái Kho (`stock-status.ts`)
> Nguồn: [src/lib/stock-status.ts](file:///D:/Codes/QuanLyGianHangHKT/src/lib/stock-status.ts) — **6** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L47](file:///D:/Codes/QuanLyGianHangHKT/src/lib/stock-status.ts#L47) | Chuỗi JS / Fallback | literal | Sẵn sàng bán |
| [L52](file:///D:/Codes/QuanLyGianHangHKT/src/lib/stock-status.ts#L52) | Chuỗi JS / Fallback | literal | Đã bán hết |
| [L56](file:///D:/Codes/QuanLyGianHangHKT/src/lib/stock-status.ts#L56) | Chuỗi JS / Fallback | literal | Đã giữ chỗ / online hết |
| [L60](file:///D:/Codes/QuanLyGianHangHKT/src/lib/stock-status.ts#L60) | Chuỗi JS / Fallback | literal | Hết hàng bán quầy |
| [L64](file:///D:/Codes/QuanLyGianHangHKT/src/lib/stock-status.ts#L64) | Mẫu văn bản (`...`) | template | `Sắp hết (Còn ${offlineAvailable})` |
| [L68](file:///D:/Codes/QuanLyGianHangHKT/src/lib/stock-status.ts#L68) | Mẫu văn bản (`...`) | template | `Có đơn giữ chỗ (${totalHeld})` |


#### 3.10 Bộ lọc Dữ liệu Thử nghiệm (`test-data-filter.ts`)
> Nguồn: [src/lib/test-data-filter.ts](file:///D:/Codes/QuanLyGianHangHKT/src/lib/test-data-filter.ts) — **3** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L16](file:///D:/Codes/QuanLyGianHangHKT/src/lib/test-data-filter.ts#L16) | Chuỗi JS / Fallback | literal | chạy thử nghiệm |
| [L17](file:///D:/Codes/QuanLyGianHangHKT/src/lib/test-data-filter.ts#L17) | Chuỗi JS / Fallback | literal | sự kiện test |
| [L33](file:///D:/Codes/QuanLyGianHangHKT/src/lib/test-data-filter.ts#L33) | Chuỗi JS / Fallback | literal | thử nghiệm |


---

## Mục 4: Trang Khách Xem Công Khai (`GuestShowcase`)

#### 4.1 Giao diện Trang chủ Công khai & Đặt giữ đồ Online
> Nguồn: [src/components/guest/guest-showcase.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx) — **147** mục nội dung

Trang này viết cứng toàn bộ tiếng Việt (không dùng `next-intl`) và có một số chuỗi fallback mặc định khi workspace chưa cài đủ thông tin (`HikaruStore`, `0988.776.655`, `https://zalo.me/0988776655`).

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L77](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L77) | Chuỗi JS / Fallback | literal | Trước giờ biểu diễn (16:30 - 18:30) |
| [L138](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L138) | Hộp thoại `alert`/`confirm` | alert | alert('Vui lòng nhập Họ tên và Số điện thoại để nhân viên đối soát nhận đồ tại sự kiện.') |
| [L169](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L169) | Mẫu văn bản (`...`) | template | `Khách giữ đồ qua Khách xem Showcase. Khung giờ nhận: ${pickupTime}. Ghi chú: ${keepNotes.trim() \|\| 'Không'}` |
| [L185](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L185) | Hộp thoại `alert`/`confirm` | alert | alert('Có lỗi xảy ra khi tạo phiếu giữ đồ. Vui lòng thử lại.') |
| [L198](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L198) | Chuỗi trong `{...}` | literal | Chế độ xem trước: |
| [L198](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L198) | Chuỗi trong `{...}` | literal | Khu vực khách: |
| [L198](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L198) | Văn bản JSX | text | Gian hàng Merchandise |
| [L201](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L201) | Văn bản JSX | text | (Dành cho khách xem sản phẩm & đặt trước keep đồ) |
| [L213](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L213) | Thuộc tính HTML | title | Thoát giao diện khách và trở lại trang quản trị |
| [L216](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L216) | Văn bản JSX | text | Thoát & Trở lại Quản trị |
| [L230](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L230) | Thuộc tính HTML | alt | HikaruStore Logo |
| [L237](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L237) | Chuỗi trong `{...}` | literal | HikaruStore |
| [L240](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L240) | Văn bản JSX | text | Khách xem |
| [L244](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L244) | Văn bản JSX | text | Official Merchandise Catalog & Pre-order |
| [L255](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L255) | Thuộc tính HTML | title | Hotline tư vấn và chốt đơn giao hàng tận nơi |
| [L258](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L258) | Văn bản JSX | text | Hotline: |
| [L270](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L270) | Văn bản JSX | text | Vé giữ ( |
| [L294](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L294) | Thuộc tính HTML | title | Quay lại giao diện quản trị |
| [L298](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L298) | Chuỗi trong `{...}` | literal | Trở lại Quản lý |
| [L298](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L298) | Chuỗi trong `{...}` | literal | Đăng nhập Quản lý |
| [L300](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L300) | Văn bản JSX | text | Quản lý |
| [L313](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L313) | Văn bản JSX | text | Gian Hàng Merchandise Chính Thức — |
| [L313](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L313) | Chuỗi trong `{...}` | literal | HikaruStore |
| [L316](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L316) | Chuỗi trong `{...}` | literal | Bộ Sưu Tập Merchandise & Giữ Đồ Tại Sự Kiện |
| [L319](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L319) | Văn bản JSX | text | Khám phá đầy đủ trang phục, phụ kiện và quà tặng chính thức. Bạn có thể |
| [L320](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L320) | Văn bản JSX | text | liên hệ mua online giao tận nơi |
| [L320](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L320) | Văn bản JSX | text | hoặc |
| [L321](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L321) | Văn bản JSX | text | giữ đồ miễn phí để nhận tại quầy sự kiện |
| [L321](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L321) | Văn bản JSX | text | mà không lo hết hàng. |
| [L330](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L330) | Văn bản JSX | text | 100% Chính Hãng |
| [L331](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L331) | Văn bản JSX | text | Merchandise tour chuẩn |
| [L338](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L338) | Văn bản JSX | text | Keep Đồ 0đ |
| [L339](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L339) | Văn bản JSX | text | Giữ chỗ không cần cọc |
| [L346](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L346) | Văn bản JSX | text | Giao Tận Nơi |
| [L347](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L347) | Văn bản JSX | text | Ship COD toàn quốc |
| [L361](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L361) | Văn bản JSX | text | Phân loại hàng: |
| [L374](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L374) | Văn bản JSX | text | ✨ Tất cả ( |
| [L386](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L386) | Văn bản JSX | text | 👑 Độc quyền |
| [L386](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L386) | Chuỗi trong `{...}` | literal | HikaruStore |
| [L399](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L399) | Văn bản JSX | text | 🤝 Hàng Đối tác Collab ( |
| [L413](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L413) | Thuộc tính HTML | placeholder | Tìm tên áo, nón, lightstick, phụ kiện... |
| [L433](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L433) | Văn bản JSX | text | Tất cả tour diễn |
| [L454](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L454) | Văn bản JSX | text | Tất cả ( |
| [L482](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L482) | Văn bản JSX | text | Không tìm thấy sản phẩm phù hợp |
| [L485](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L485) | Văn bản JSX | text | Thử xóa từ khóa tìm kiếm hoặc chọn nguồn hàng khác. |
| [L496](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L496) | Văn bản JSX | text | Xem toàn bộ sản phẩm |
| [L544](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L544) | Văn bản JSX | text | Collab: |
| [L548](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L548) | Văn bản JSX | text | 👑 |
| [L548](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L548) | Chuỗi trong `{...}` | literal | HikaruStore |
| [L562](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L562) | Mẫu văn bản (`...`) | template | `Sắp hết (Còn ${stock?.offlineAvailable})` |
| [L563](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L563) | Mẫu văn bản (`...`) | template | `Còn ${stock?.offlineAvailable} món` |
| [L567](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L567) | Văn bản JSX | text | Nhận đặt trước |
| [L571](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L571) | Văn bản JSX | text | Tạm hết hàng |
| [L592](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L592) | Văn bản JSX | text | Hàng Collab: |
| [L596](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L596) | Văn bản JSX | text | 👑 Độc quyền |
| [L596](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L596) | Chuỗi trong `{...}` | literal | HikaruStore |
| [L613](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L613) | Văn bản JSX | text | Chọn biến thể: |
| [L644](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L644) | Chuỗi trong `{...}` | literal | VND |
| [L662](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L662) | Thuộc tính HTML | title | Liên hệ tư vấn và chốt đơn ship tận nơi toàn quốc |
| [L665](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L665) | Văn bản JSX | text | Mua Online |
| [L675](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L675) | Thuộc tính HTML | title | Đăng ký giữ đồ miễn phí để nhận tại quầy sự kiện |
| [L678](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L678) | Văn bản JSX | text | Keep Đồ Tour |
| [L694](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L694) | Thuộc tính HTML | title | Đăng Ký Giữ Đồ — Nhận Tại Sự Kiện |
| [L695](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L695) | Thuộc tính HTML | description | Hệ thống sẽ tạo mã vé giữ đồ cho bạn. Khi đến sự kiện, bạn chỉ cần đọc số điện thoại tại quầy để nhận đồ mà không lo bị cháy hàng. |
| [L718](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L718) | Văn bản JSX | text | Hàng Collab: |
| [L722](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L722) | Văn bản JSX | text | 👑 Chính hãng |
| [L722](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L722) | Chuỗi trong `{...}` | literal | HikaruStore |
| [L728](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L728) | Văn bản JSX | text | Biến thể: |
| [L728](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L728) | Văn bản JSX | text | • Giá: |
| [L729](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L729) | Chuỗi trong `{...}` | literal | VND |
| [L737](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L737) | Văn bản JSX | text | Số lượng muốn giữ: |
| [L746](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L746) | Thuộc tính HTML | title | Giảm 1 |
| [L761](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L761) | Thuộc tính HTML | placeholder | 1 |
| [L768](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L768) | Thuộc tính HTML | title | Tăng 1 |
| [L773](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L773) | Văn bản JSX | text | sản phẩm |
| [L781](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L781) | Văn bản JSX | text | Họ và tên của bạn: |
| [L786](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L786) | Thuộc tính HTML | placeholder | VD: Nguyễn Thùy Linh |
| [L795](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L795) | Văn bản JSX | text | Số điện thoại nhận hàng: |
| [L801](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L801) | Thuộc tính HTML | placeholder | VD: 0912345678 |
| [L812](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L812) | Văn bản JSX | text | Sự kiện & Quầy nhận hàng: |
| [L824](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L824) | Chuỗi trong `{...}` | literal | Sự kiện |
| [L833](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L833) | Văn bản JSX | text | Khung giờ dự kiến đến quầy lấy: |
| [L837](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L837) | Thuộc tính HTML | placeholder | VD: 17:30 trước giờ biểu diễn |
| [L844](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L844) | Văn bản JSX | text | Ghi chú thêm (tùy chọn): |
| [L848](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L848) | Thuộc tính HTML | placeholder | VD: Mình có vé VIP hàng A / Cần lấy thêm túi xách |
| [L857](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L857) | Văn bản JSX | text | Không cần thanh toán trước — Giữ đồ 0đ |
| [L860](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L860) | Văn bản JSX | text | Đơn giữ đồ sẽ được lưu trực tiếp vào danh sách của nhân viên quầy. Bạn chỉ cần đọc số điện thoại khi tới nơi để nhận hàng và thanh toán tiền mặt/VietQR. |
| [L867](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L867) | Văn bản JSX | text | Hủy |
| [L877](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L877) | Văn bản JSX | text | Xác nhận Giữ đồ Tour ( |
| [L877](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L877) | Chuỗi trong `{...}` | literal | VND |
| [L889](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L889) | Thuộc tính HTML | title | Đăng Ký Giữ Đồ Thành Công! |
| [L890](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L890) | Thuộc tính HTML | description | Vui lòng chụp ảnh màn hình vé này hoặc ghi nhớ mã giữ đồ để đối soát nhanh tại quầy. |
| [L903](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L903) | Văn bản JSX | text | MÃ VÉ GIỮ ĐỒ CỦA BẠN |
| [L917](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L917) | Thuộc tính HTML | alt | QR Ticket |
| [L924](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L924) | Văn bản JSX | text | Khách hàng: |
| [L928](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L928) | Văn bản JSX | text | Số điện thoại: |
| [L932](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L932) | Văn bản JSX | text | Sản phẩm giữ: |
| [L938](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L938) | Văn bản JSX | text | Tổng tiền thanh toán tại quầy: |
| [L940](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L940) | Chuỗi trong `{...}` | literal | VND |
| [L947](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L947) | Văn bản JSX | text | 💡 |
| [L947](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L947) | Văn bản JSX | text | Mẹo: |
| [L947](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L947) | Văn bản JSX | text | Hãy chụp màn hình lại điện thoại. Khi đến cổng biểu diễn, bạn đến đúng quầy và đưa mã |
| [L947](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L947) | Văn bản JSX | text | cho nhân viên để lấy đồ ngay! |
| [L957](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L957) | Văn bản JSX | text | Đã hiểu & Đóng lại |
| [L968](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L968) | Mẫu văn bản (`...`) | template | `Liên Hệ Mua Online — ${onlineModalProduct.name}` |
| [L969](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L969) | Thuộc tính HTML | description | Bạn có thể đặt mua online để được đóng gói và giao hàng COD tận nơi trên toàn quốc. |
| [L977](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L977) | Văn bản JSX | text | Nguồn hàng: Phối hợp phát hành cùng Đối tác Collab |
| [L981](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L981) | Văn bản JSX | text | 👑 Nguồn hàng: |
| [L981](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L981) | Văn bản JSX | text | Sản phẩm độc quyền chính hãng |
| [L981](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L981) | Chuỗi trong `{...}` | literal | HikaruStore |
| [L995](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L995) | Văn bản JSX | text | Gọi Hotline đặt hàng |
| [L1000](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1000) | Mẫu văn bản (`...`) | template | `Đại diện: ${activeWorkspace.owner_name}` |
| [L1000](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1000) | Chuỗi trong `{...}` | literal | Hỗ trợ 8h - 22h hàng ngày |
| [L1015](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1015) | Văn bản JSX | text | Nhắn tin Zalo Official |
| [L1017](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1017) | Văn bản JSX | text | Zalo: |
| [L1019](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1019) | Văn bản JSX | text | Gửi ảnh & chốt đơn nhanh |
| [L1032](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1032) | Thuộc tính HTML | alt | VietQR Bank |
| [L1039](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1039) | Văn bản JSX | text | Tài khoản chuyển khoản chính thức |
| [L1042](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1042) | Văn bản JSX | text | Ngân hàng: |
| [L1042](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1042) | Văn bản JSX | text | • Số TK: |
| [L1046](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1046) | Văn bản JSX | text | Chủ tài khoản: |
| [L1049](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1049) | Văn bản JSX | text | Cú pháp CK: |
| [L1049](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1049) | Văn bản JSX | text | ONL [Tên bạn] [Số điện thoại] |
| [L1058](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1058) | Văn bản JSX | text | Chính sách giao hàng toàn quốc: |
| [L1061](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1061) | Văn bản JSX | text | Giao nhanh 1-2 ngày tại TP.HCM & Hà Nội; 2-4 ngày tại các tỉnh thành khác. |
| [L1062](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1062) | Văn bản JSX | text | Được kiểm tra hàng trước khi nhận và thanh toán COD. |
| [L1063](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1063) | Văn bản JSX | text | Hỗ trợ đổi size trong vòng 7 ngày nếu chưa qua sử dụng. |
| [L1069](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1069) | Văn bản JSX | text | Đóng |
| [L1081](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1081) | Thuộc tính HTML | title | Danh Sách Phiếu Giữ Đồ Của Bạn |
| [L1082](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1082) | Mẫu văn bản (`...`) | template | `Các đơn giữ đồ gắn liền với số điện thoại ${guestPhone}.` |
| [L1088](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1088) | Văn bản JSX | text | Chưa có đơn giữ đồ nào được ghi nhận với số điện thoại này. |
| [L1102](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1102) | Văn bản JSX | text | Tạo lúc: |
| [L1106](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1106) | Chuỗi trong `{...}` | literal | Đã nhận đồ |
| [L1106](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1106) | Chuỗi trong `{...}` | literal | Chờ đến quầy nhận |
| [L1115](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1115) | Văn bản JSX | text | Tổng tiền cần thanh toán: |
| [L1115](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1115) | Chuỗi trong `{...}` | literal | VND |
| [L1121](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1121) | Văn bản JSX | text | 👉 Hãy đến quầy bán hàng tại sự kiện và đọc mã |
| [L1121](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1121) | Văn bản JSX | text | hoặc số điện thoại |
| [L1121](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1121) | Văn bản JSX | text | để nhận đồ nhé! |
| [L1136](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1136) | Văn bản JSX | text | © 2026 |
| [L1136](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1136) | Chuỗi trong `{...}` | literal | HikaruStore |
| [L1136](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1136) | Văn bản JSX | text | Merchandise Platform. |
| [L1139](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1139) | Mẫu văn bản (`...`) | template | `Đại diện: ${activeWorkspace.owner_name}` |
| [L1141](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1141) | Mẫu văn bản (`...`) | template | `Địa chỉ: ${activeWorkspace.address}` |
| [L1149](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1149) | Văn bản JSX | text | Hotline: |
| [L1164](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1164) | Chuỗi trong `{...}` | literal | ← Thoát xem thử & Trở lại Quản trị |
| [L1164](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx#L1164) | Chuỗi trong `{...}` | literal | Khu vực Quản trị / Thu ngân |


---

## Mục 5: Hệ thống Đăng nhập & Tài khoản

#### 5.1 Trang Đăng nhập (`/login`)
> Nguồn: [src/app/[locale]/(auth)/login/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx) — **20** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L42) | Chuỗi JS / Fallback | literal | Vui lòng nhập tên đăng nhập hoặc email. |
| [L46](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L46) | Chuỗi JS / Fallback | literal | Vui lòng nhập mật khẩu. |
| [L58](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L58) | Chuỗi JS / Fallback | literal | Đăng nhập không thành công. |
| [L61](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L61) | Chuỗi JS / Fallback | literal | Có lỗi xảy ra trong quá trình đăng nhập. |
| [L81](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L81) | Thuộc tính HTML | alt | HikaruStore Logo |
| [L86](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L86) | Văn bản JSX | text | Đăng nhập HikaruStore |
| [L89](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L89) | Văn bản JSX | text | Nhập tài khoản Quản trị viên hoặc tài khoản Nhân viên được cấp để tiếp tục. |
| [L100](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L100) | Văn bản JSX | text | Đang đăng nhập: |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L107) | Văn bản JSX | text | Đăng xuất |
| [L119](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L119) | Văn bản JSX | text | Tiếp tục vào trang quản trị ( |
| [L119](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L119) | Chuỗi trong `{...}` | literal | POS |
| [L119](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L119) | Chuỗi trong `{...}` | literal | Dashboard |
| [L134](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L134) | Văn bản JSX | text | Tên đăng nhập hoặc Email |
| [L141](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L141) | Thuộc tính HTML | placeholder | Tuanadminvippro666, admin, HKT87@123... |
| [L155](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L155) | Văn bản JSX | text | Mật khẩu |
| [L163](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L163) | Thuộc tính HTML | placeholder | •••••••••••• |
| [L187](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L187) | Văn bản JSX | text | Đăng nhập hệ thống |
| [L200](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L200) | Văn bản JSX | text | ⚡ Vào nhanh tài khoản Admin (Không cần gõ mật khẩu) |
| [L208](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L208) | Văn bản JSX | text | Hoặc |
| [L220](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx#L220) | Văn bản JSX | text | Xem Gian Hàng Merchandise (Khách xem & Keep đồ) |


#### 5.2 Trang Đăng ký Workspace (`/register`)
> Nguồn: [src/app/[locale]/(auth)/register/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx) — **20** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L29](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L29) | i18n (`t`) | t('errors.requiredField') -> auth.errors.requiredField | VI: "Trường này không được để trống" \| EN: "This field is required" |
| [L30](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L30) | i18n (`t`) | t('errors.requiredField') -> auth.errors.requiredField | VI: "Trường này không được để trống" \| EN: "This field is required" |
| [L31](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L31) | i18n (`t`) | t('errors.requiredField') -> auth.errors.requiredField | VI: "Trường này không được để trống" \| EN: "This field is required" |
| [L31](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L31) | i18n (`t`) | t('errors.invalidEmail') -> auth.errors.invalidEmail | VI: "Vui lòng nhập email hợp lệ" \| EN: "Please enter a valid email address" |
| [L32](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L32) | i18n (`t`) | t('errors.passwordTooShort') -> auth.errors.passwordTooShort | VI: "Mật khẩu phải có tối thiểu 6 ký tự" \| EN: "Password must be at least 6 characters" |
| [L76](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L76) | Chuỗi JS / Fallback | currency | VND |
| [L99](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L99) | Chuỗi JS / Fallback | currency | VND |
| [L124](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L124) | i18n (`t`) | t('registerTitle') -> auth.registerTitle | VI: "Khởi tạo Không gian làm việc Nghệ sĩ" \| EN: "Create Artist Workspace" |
| [L127](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L127) | i18n (`t`) | t('registerSubtitle') -> auth.registerSubtitle | VI: "Bắt đầu quản lý gian hàng và phân bổ hàng hóa cho các tour diễn" \| EN: "Start allocating inventory and managing booths for your tours" |
| [L142](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L142) | i18n (`t`) | t('fullNameLabel') -> auth.fullNameLabel | VI: "Họ và tên" \| EN: "Full name" |
| [L149](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L149) | i18n (`t`) | t('fullNamePlaceholder') -> auth.fullNamePlaceholder | VI: "Nguyễn Văn A" \| EN: "Alex Rivera" |
| [L162](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L162) | i18n (`t`) | t('workspaceNameLabel') -> auth.workspaceNameLabel | VI: "Tên Không gian làm việc / Ban nhạc / Nghệ sĩ" \| EN: "Workspace / Artist / Band name" |
| [L169](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L169) | i18n (`t`) | t('workspaceNamePlaceholder') -> auth.workspaceNamePlaceholder | VI: "Hạc Cầm Studio / Vũ Cát Tường Merch" \| EN: "Tour Merch Studio / Alex Live" |
| [L182](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L182) | i18n (`t`) | t('emailLabel') -> auth.emailLabel | VI: "Địa chỉ Email" \| EN: "Email address" |
| [L189](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L189) | i18n (`t`) | t('emailPlaceholder') -> auth.emailPlaceholder | VI: "artist@eventmate.com" \| EN: "artist@eventmate.com" |
| [L202](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L202) | i18n (`t`) | t('passwordLabel') -> auth.passwordLabel | VI: "Mật khẩu" \| EN: "Password" |
| [L209](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L209) | i18n (`t`) | t('passwordPlaceholder') -> auth.passwordPlaceholder | VI: "••••••••" \| EN: "••••••••" |
| [L221](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L221) | i18n (`t`) | t('signUpButton') -> auth.signUpButton | VI: "Đăng ký tài khoản" \| EN: "Create account" |
| [L226](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L226) | i18n (`t`) | t('signInPrompt') -> auth.signInPrompt | VI: "Đã có tài khoản?" \| EN: "Already have an account?" |
| [L231](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/register/page.tsx#L231) | i18n (`t`) | t('signInLink') -> auth.signInLink | VI: "Đăng nhập" \| EN: "Sign in" |


#### 5.3 Trang Quên mật khẩu (`/forgot-password`)
> Nguồn: [src/app/[locale]/(auth)/forgot-password/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx) — **11** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L23](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L23) | i18n (`t`) | t('errors.requiredField') -> auth.errors.requiredField | VI: "Trường này không được để trống" \| EN: "This field is required" |
| [L23](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L23) | i18n (`t`) | t('errors.invalidEmail') -> auth.errors.invalidEmail | VI: "Vui lòng nhập email hợp lệ" \| EN: "Please enter a valid email address" |
| [L50](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L50) | Chuỗi JS / Fallback | literal | Đã gửi email liên kết khôi phục mật khẩu. Vui lòng kiểm tra hòm thư. |
| [L53](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L53) | Chuỗi JS / Fallback | literal | Đã gửi hướng dẫn khôi phục mật khẩu nếu email tồn tại trong hệ thống. |
| [L63](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L63) | i18n (`t`) | t('forgotTitle') -> auth.forgotTitle | VI: "Khôi phục mật khẩu" \| EN: "Reset password" |
| [L66](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L66) | i18n (`t`) | t('forgotSubtitle') -> auth.forgotSubtitle | VI: "Nhập email của bạn để nhận liên kết khôi phục" \| EN: "Enter your email to receive a password reset link" |
| [L88](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L88) | i18n (`t`) | t('emailLabel') -> auth.emailLabel | VI: "Địa chỉ Email" \| EN: "Email address" |
| [L95](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L95) | i18n (`t`) | t('emailPlaceholder') -> auth.emailPlaceholder | VI: "artist@eventmate.com" \| EN: "artist@eventmate.com" |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L107) | i18n (`t`) | t('sendResetLink') -> auth.sendResetLink | VI: "Gửi email khôi phục" \| EN: "Send reset link" |
| [L116](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L116) | Văn bản JSX | text | ← |
| [L116](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/forgot-password/page.tsx#L116) | i18n (`t`) | t('backToLogin') -> auth.backToLogin | VI: "Quay lại trang đăng nhập" \| EN: "Back to login" |


#### 5.4 Trang Nhận lời mời tham gia Đội ngũ (`/accept-invitation`)
> Nguồn: [src/app/[locale]/(auth)/accept-invitation/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx) — **11** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L21](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L21) | Chuỗi JS / Fallback | literal | Hạc Cầm Studio Tour |
| [L37](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L37) | Chuỗi JS / Fallback | currency | VND |
| [L47](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L47) | Thuộc tính dữ liệu | email | crew@eventmate.com |
| [L48](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L48) | Thuộc tính dữ liệu | fullName | Crew Member |
| [L65](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L65) | i18n (`t`) | t('acceptInvitationTitle') -> auth.acceptInvitationTitle | VI: "Chấp nhận lời mời tham gia Ekip" \| EN: "Accept Team Invitation" |
| [L68](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L68) | i18n (`t`) | t('acceptInvitationSubtitle') -> auth.acceptInvitationSubtitle | VI: "Bạn đã được mời tham gia không gian làm việc" \| EN: "You have been invited to join the workspace" |
| [L75](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L75) | Văn bản JSX | text | Không gian làm việc: |
| [L79](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L79) | Văn bản JSX | text | Vai trò được phân công: |
| [L85](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L85) | Văn bản JSX | text | Mã thư mời: |
| [L93](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L93) | Văn bản JSX | text | Đã tham gia thành công! Đang chuyển hướng... |
| [L104](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/accept-invitation/page.tsx#L104) | i18n (`t`) | t('acceptButton') -> auth.acceptButton | VI: "Tham gia ngay" \| EN: "Join Workspace" |


---

## Mục 6: Khung Giao diện Quản trị & UI Dùng chung

#### 6.1 Dashboard Layout
> Nguồn: [src/app/[locale]/(dashboard)/layout.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/layout.tsx) — **0** mục nội dung

_Không có chuỗi giao diện người dùng trực tiếp (chỉ dùng biến truyền vào hoặc logic nội bộ)._


#### 6.2 Thanh Điều hướng Trái (`Sidebar`)
> Nguồn: [src/components/dashboard/sidebar.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx) — **21** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L41](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L41) | i18n (`t`) | t('dashboard') -> nav.dashboard | VI: "Tổng quan" \| EN: "Overview" |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L42) | i18n (`t`) | t('events') -> nav.events | VI: "Sự kiện" \| EN: "Events & Tours" |
| [L43](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L43) | i18n (`t`) | t('booths') -> nav.booths | VI: "Gian hàng" \| EN: "Booths" |
| [L44](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L44) | i18n (`t`) | t('products') -> nav.products | VI: "Sản phẩm" \| EN: "Products & Variants" |
| [L45](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L45) | i18n (`t`) | t('inventory') -> nav.inventory | VI: "Kho hàng" \| EN: "Inventory & Allocation" |
| [L46](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L46) | i18n (`t`) | t('orders') -> nav.orders | VI: "Đơn hàng" \| EN: "Orders" |
| [L47](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L47) | i18n (`t`) | t('payments') -> nav.payments | VI: "Thanh toán" \| EN: "Payments" |
| [L48](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L48) | i18n (`t`) | t('team') -> nav.team | VI: "Nhân sự" \| EN: "Team & Access" |
| [L49](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L49) | i18n (`t`) | t('logs') -> nav.logs | VI: "Nhật ký" \| EN: "Audit & Activity Logs" |
| [L49](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L49) | Chuỗi JS / Fallback | badge | Admin |
| [L50](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L50) | i18n (`t`) | t('feedback') -> nav.feedback | VI: "Góp ý & Báo lỗi" \| EN: "Feedback & Bug Reports" |
| [L51](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L51) | i18n (`t`) | t('analytics') -> nav.analytics | VI: "Báo cáo" \| EN: "Revenue Analytics" |
| [L52](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L52) | i18n (`t`) | t('settings') -> nav.settings | VI: "Cài đặt" \| EN: "Workspace Settings" |
| [L80](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L80) | Thuộc tính HTML | alt | HikaruStore Logo |
| [L86](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L86) | Văn bản JSX | text | HikaruStore |
| [L88](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L88) | Văn bản JSX | text | v1.0 |
| [L91](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L91) | Văn bản JSX | text | Event Merchandise |
| [L152](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L152) | Văn bản JSX | text | Tùy chọn: |
| [L167](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L167) | i18n (`t`) | t('posTerminal') -> nav.posTerminal | VI: "Bán hàng POS" \| EN: "Open POS Terminal" |
| [L170](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L170) | Văn bản JSX | text | Chế độ POS |
| [L175](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx#L175) | Văn bản JSX | text | POS |


#### 6.3 Thanh Tiêu đề Trên (`Topbar`)
> Nguồn: [src/components/dashboard/topbar.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx) — **10** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L37](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L37) | Thuộc tính HTML | aria-label | Open navigation menu |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L42) | Thuộc tính HTML | title | Về trang tổng quan |
| [L46](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L46) | Thuộc tính HTML | alt | HikaruStore Logo |
| [L50](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L50) | Văn bản JSX | text | HikaruStore |
| [L78](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L78) | Thuộc tính HTML | title | Xem thử giao diện Gian hàng Khách xem (Chỉ xem sản phẩm & Keep đồ) |
| [L81](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L81) | Văn bản JSX | text | Gian hàng Khách |
| [L91](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L91) | Chuỗi trong `{...}` | literal | Artist Tour Crew |
| [L96](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L96) | Mẫu văn bản (`...`) | template | `Collab: ${user.collabPartnerName}` |
| [L96](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L96) | Chuỗi trong `{...}` | literal | Collab Partner |
| [L108](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx#L108) | Thuộc tính HTML | title | Đăng xuất |


#### 6.4 Bộ Chuyển Workspace (`WorkspaceSwitcher`)
> Nguồn: [src/components/dashboard/workspace-switcher.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx) — **21** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L20](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L20) | Chuỗi JS / Fallback | literal | VND |
| [L44](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L44) | Mẫu văn bản (`...`) | template | `Hợp tác cùng: ${collabPartner.trim()}` |
| [L79](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L79) | Chuỗi trong `{...}` | literal | Select Workspace |
| [L83](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L83) | Văn bản JSX | text | Collab |
| [L88](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L88) | Chuỗi trong `{...}` | literal | VND |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L98) | Văn bản JSX | text | Không gian & Dự án Collab |
| [L130](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L130) | Văn bản JSX | text | Collab |
| [L153](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L153) | Văn bản JSX | text | Thêm Dự án / Gian hàng Collab mới |
| [L164](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L164) | Thuộc tính HTML | title | Tạo Không gian hoặc Dự án Collab mới |
| [L165](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L165) | Thuộc tính HTML | description | Quản lý độc lập từng tour diễn, dự án hợp tác liên danh (collab), hoặc gian hàng tại các lễ hội/comic con khác nhau. |
| [L170](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L170) | Văn bản JSX | text | Tên Không gian / Dự án Collab |
| [L175](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L175) | Thuộc tính HTML | placeholder | VD: Collab Hạc Cầm x M-TP Merch, Pop-up Comic Con... |
| [L185](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L185) | Văn bản JSX | text | Dự án Hợp tác / Liên danh (Collab) |
| [L188](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L188) | Văn bản JSX | text | Bật nếu đây là gian hàng hợp tác chung với nghệ sĩ, ban nhạc hoặc đối tác khác. |
| [L202](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L202) | Văn bản JSX | text | Tên Đối tác / Gian hàng Collab |
| [L205](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L205) | Thuộc tính HTML | placeholder | VD: Cá Hồi Hoang, Cổ Động, The Cassette, Hãng Đĩa Thời Đại... |
| [L215](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L215) | Văn bản JSX | text | Tiền tệ thanh toán |
| [L222](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L222) | Văn bản JSX | text | VND (Việt Nam Đồng - ₫) |
| [L223](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L223) | Văn bản JSX | text | USD (US Dollar - $) |
| [L234](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L234) | Văn bản JSX | text | Hủy |
| [L237](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/workspace-switcher.tsx#L237) | Văn bản JSX | text | Khởi tạo ngay |


#### 6.5 Khung Trang con Dùng chung (`SubpageShell`)
> Nguồn: [src/components/dashboard/subpage-shell.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/subpage-shell.tsx) — **1** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L60](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/subpage-shell.tsx#L60) | Văn bản JSX | text | Sẵn sàng triển khai trong Phase 2 |


#### 6.6 Nút Đổi Mật độ Hiển thị (`DensityToggle`)
> Nguồn: [src/components/ui/density-toggle.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx) — **8** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L37](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx#L37) | Thuộc tính dữ liệu | label | Vừa |
| [L37](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx#L37) | Thuộc tính dữ liệu | desc | Giao diện Tiêu chuẩn (100%) |
| [L38](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx#L38) | Thuộc tính dữ liệu | label | Gọn |
| [L38](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx#L38) | Thuộc tính dữ liệu | desc | Giao diện Thu gọn (90% - Nhiều không gian thao tác) |
| [L39](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx#L39) | Thuộc tính dữ liệu | label | Rộng |
| [L39](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx#L39) | Thuộc tính dữ liệu | desc | Giao diện Siêu gọn (80% - Tối đa màn hình) |
| [L48](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx#L48) | Mẫu văn bản (`...`) | template | `${current.desc} — Nhấn để đổi tỉ lệ (100% → 90% → 80%)` |
| [L49](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/density-toggle.tsx#L49) | Thuộc tính HTML | aria-label | Đổi tỉ lệ hiển thị |


#### 6.7 Nút Chuyển Ngôn ngữ (`LanguageSwitcher`)
> Nguồn: [src/components/ui/language-switcher.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/language-switcher.tsx) — **2** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L43](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/language-switcher.tsx#L43) | Văn bản JSX | text | VI |
| [L56](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/language-switcher.tsx#L56) | Văn bản JSX | text | EN |


#### 6.8 Huy hiệu Trạng thái Đồng bộ (`SyncStatusBadge`)
> Nguồn: [src/components/ui/sync-status-badge.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/sync-status-badge.tsx) — **5** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L22](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/sync-status-badge.tsx#L22) | i18n (`t`) | t('online') -> common.online | VI: "Trực tuyến" \| EN: "Online" |
| [L28](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/sync-status-badge.tsx#L28) | i18n (`t`) | t('offline') -> common.offline | VI: "Ngoại tuyến" \| EN: "Offline" |
| [L34](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/sync-status-badge.tsx#L34) | i18n (`t`) | t('syncing') -> common.syncing | VI: "Đang đồng bộ" \| EN: "Syncing" |
| [L40](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/sync-status-badge.tsx#L40) | i18n (`t`) | t('synced') -> common.synced | VI: "Đã đồng bộ" \| EN: "Synced" |
| [L52](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/sync-status-badge.tsx#L52) | i18n (`t`) | t('syncFailed') -> common.syncFailed | VI: "Đồng bộ lỗi" \| EN: "Sync failed" |


#### 6.9 Nút Đổi Giao diện Sáng/Tối (`ThemeToggle`)
> Nguồn: [src/components/ui/theme-toggle.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/theme-toggle.tsx) — **6** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/theme-toggle.tsx#L42) | Chuỗi trong `{...}` | title | Chuyển sang Giao diện Sáng (Light mode) |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/theme-toggle.tsx#L42) | Chuỗi trong `{...}` | title | Chuyển sang Giao diện Tối (Dark mode) |
| [L43](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/theme-toggle.tsx#L43) | Thuộc tính HTML | aria-label | Toggle theme |
| [L69](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/theme-toggle.tsx#L69) | Thuộc tính dữ liệu | label | Sáng |
| [L70](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/theme-toggle.tsx#L70) | Thuộc tính dữ liệu | label | Tối |
| [L71](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/theme-toggle.tsx#L71) | Thuộc tính dữ liệu | label | Tự động |


#### 6.10 Bộ Tải ảnh Sản phẩm (`ProductImageUploader`)
> Nguồn: [src/components/ui/product-image-uploader.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx) — **21** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L22](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L22) | Chuỗi JS / Fallback | literal | Không thể đọc tệp ảnh |
| [L25](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L25) | Chuỗi JS / Fallback | literal | Tệp tải lên không phải định dạng ảnh hợp lệ |
| [L60](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L60) | Chuỗi JS / Fallback | literal | Ảnh sản phẩm / Merchandise |
| [L74](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L74) | Chuỗi JS / Fallback | literal | Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP, HEIC). |
| [L86](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L86) | Chuỗi JS / Fallback | literal | Không thể xử lý ảnh này. |
| [L149](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L149) | Chuỗi trong `{...}` | literal | Ẩn nhập link |
| [L149](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L149) | Chuỗi trong `{...}` | literal | Hoặc nhập link URL |
| [L159](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L159) | Thuộc tính HTML | alt | Preview |
| [L164](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L164) | Thuộc tính HTML | title | Xóa ảnh |
| [L173](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L173) | Văn bản JSX | text | Đã có ảnh sản phẩm |
| [L176](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L176) | Văn bản JSX | text | Ảnh sẽ hiển thị trên bảng điều khiển quản lý và màn hình máy bán hàng POS. |
| [L189](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L189) | Văn bản JSX | text | Chụp lại |
| [L201](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L201) | Văn bản JSX | text | Chọn ảnh khác |
| [L211](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L211) | Văn bản JSX | text | Xóa ảnh |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L235) | Văn bản JSX | text | Đang xử lý & tối ưu hóa ảnh... |
| [L251](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L251) | Văn bản JSX | text | Tải lên ảnh từ điện thoại hoặc máy tính |
| [L254](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L254) | Văn bản JSX | text | Chụp ảnh trực tiếp từ máy ảnh điện thoại hoặc chọn ảnh có sẵn trong thư viện |
| [L269](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L269) | Văn bản JSX | text | Chụp ảnh ngay |
| [L281](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L281) | Văn bản JSX | text | Chọn ảnh từ thiết bị |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L289) | Thuộc tính HTML | placeholder | Dán link ảnh (https://...) |
| [L307](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/product-image-uploader.tsx#L307) | Văn bản JSX | text | Dùng link |


---

## Mục 7: Toàn bộ 12 Trang Quản trị (`/dashboard/*`)

#### 7.1 Trang Tổng quan (`/dashboard`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx) — **103** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L120](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L120) | i18n (`t`) | t('metrics.totalRevenue') -> dashboard.metrics.totalRevenue | VI: "Doanh thu" \| EN: "Total Revenue" |
| [L121](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L121) | Chuỗi JS / Fallback | literal | VND |
| [L122](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L122) | Mẫu văn bản (`...`) | template | `${filteredOrders.length} đơn thành công` |
| [L126](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L126) | i18n (`t`) | t('metrics.ordersCount') -> dashboard.metrics.ordersCount | VI: "Đơn hàng" \| EN: "Orders" |
| [L127](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L127) | Mẫu văn bản (`...`) | template | `${filteredOrders.length} đơn` |
| [L128](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L128) | Chuỗi JS / Fallback | literal | Quầy POS thực tế |
| [L128](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L128) | Mẫu văn bản (`...`) | template | `${filteredBooths.length} quầy` |
| [L132](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L132) | i18n (`t`) | t('metrics.unitsSold') -> dashboard.metrics.unitsSold | VI: "Đã bán / Tồn" \| EN: "Units Sold" |
| [L134](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L134) | Chuỗi JS / Fallback | literal | Hàng sự kiện |
| [L138](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L138) | Thuộc tính dữ liệu | title | Quầy hoạt động |
| [L139](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L139) | Mẫu văn bản (`...`) | template | `${activeBoothsCount} quầy` |
| [L142](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L142) | Mẫu văn bản (`...`) | template | `${realEvents.length} sự kiện thực` |
| [L143](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L143) | Chuỗi JS / Fallback | literal | Sự kiện hiện tại |
| [L156](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L156) | Chuỗi JS / Fallback | literal | Gian hàng |
| [L157](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L157) | Chuỗi JS / Fallback | literal | VND |
| [L168](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L168) | i18n (`t`) | t('overviewTitle') -> dashboard.overviewTitle | VI: "Tổng quan" \| EN: "Sales Overview" |
| [L171](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L171) | Chuỗi trong `{...}` | literal | Workspace |
| [L175](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L175) | Văn bản JSX | text | Đối tác: |
| [L175](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L175) | Chuỗi trong `{...}` | literal | Collab Partner |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L180) | Văn bản JSX | text | Theo dõi doanh thu, kho hàng và quầy bán. |
| [L190](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L190) | Thuộc tính HTML | title | Xuất toàn bộ dữ liệu sự kiện này ra file Excel (.xlsx) |
| [L193](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L193) | Văn bản JSX | text | Xuất Excel |
| [L198](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L198) | i18n (`t`) | tNav('events') -> nav.events | VI: "Sự kiện" \| EN: "Events & Tours" |
| [L204](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L204) | i18n (`t`) | tNav('posTerminal') -> nav.posTerminal | VI: "Bán hàng POS" \| EN: "Open POS Terminal" |
| [L217](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L217) | Văn bản JSX | text | Bảng điều khiển Đối tác Collab: |
| [L220](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L220) | Văn bản JSX | text | Bạn có toàn quyền theo dõi doanh thu, mở POS bán hàng và quản trị sản phẩm của thương hiệu |
| [L220](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L220) | Văn bản JSX | text | . Kho hàng trung tâm của Admin được bảo vệ an toàn (Chỉ đọc). |
| [L227](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L227) | Văn bản JSX | text | Sản phẩm của tôi |
| [L238](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L238) | Văn bản JSX | text | Sự kiện: |
| [L247](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L247) | Thuộc tính HTML | label | Dữ liệu thực tế |
| [L248](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L248) | Văn bản JSX | text | Tất cả sự kiện (Số liệu thực tế) |
| [L256](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L256) | Thuộc tính HTML | label | Thử nghiệm / Sandbox (Tách biệt) |
| [L259](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L259) | Văn bản JSX | text | (Không tính vào báo cáo thật) |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L276) | Văn bản JSX | text | Xem số liệu thật |
| [L284](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L284) | Văn bản JSX | text | Chế độ Sandbox — Dữ liệu Test |
| [L292](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L292) | Văn bản JSX | text | sự kiện thực tế |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L303) | Văn bản JSX | text | Dữ liệu thử nghiệm (Sandbox): |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L303) | Văn bản JSX | text | Doanh thu ( |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L303) | Chuỗi trong `{...}` | literal | VND |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L303) | Văn bản JSX | text | ) và |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L303) | Văn bản JSX | text | đơn hàng tại đây là số liệu TEST phát sinh khi chạy thử máy POS, |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L303) | Văn bản JSX | text | hoàn toàn không được cộng vào tổng doanh thu thực tế |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L303) | Văn bản JSX | text | của hệ thống. |
| [L311](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L311) | Hộp thoại `alert`/`confirm` | confirm | confirm('Bạn có muốn xóa toàn bộ các đơn hàng thử nghiệm để làm sạch dữ liệu test?') |
| [L318](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L318) | Văn bản JSX | text | Xóa đơn test |
| [L326](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L326) | Văn bản JSX | text | Về số liệu thật |
| [L360](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L360) | i18n (`t`) | t('upcomingEvents') -> dashboard.upcomingEvents | VI: "Sự kiện" \| EN: "Upcoming Events" |
| [L360](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L360) | Chuỗi trong `{...}` | literal | Gian hàng sự kiện |
| [L364](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L364) | Chuỗi trong `{...}` | literal | Danh sách sự kiện và quầy bán |
| [L371](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L371) | Văn bản JSX | text | Tất cả |
| [L382](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L382) | Văn bản JSX | text | Tất cả sự kiện |
| [L392](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L392) | i18n (`t`) | t('noUpcomingEvents') -> dashboard.noUpcomingEvents | VI: "Chưa có sự kiện nào" \| EN: "No upcoming events scheduled" |
| [L396](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L396) | Văn bản JSX | text | Tạo sự kiện đầu tiên |
| [L418](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L418) | Chuỗi trong `{...}` | literal | Thử nghiệm |
| [L419](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L419) | i18n động | tEvents | tEvents(`statusList.${evt.status as 'upcoming' \| 'active' \| 'completed' \| 'draft'}`) [namespace: events] |
| [L424](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L424) | Chuỗi trong `{...}` | literal | Địa điểm tổ chức |
| [L430](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L430) | Văn bản JSX | text | quầy bán |
| [L433](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L433) | Văn bản JSX | text | Lọc sự kiện này → |
| [L446](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L446) | Văn bản JSX | text | Địa điểm: |
| [L447](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L447) | Chuỗi trong `{...}` | literal | Chưa đặt |
| [L450](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L450) | Văn bản JSX | text | Thời gian: |
| [L452](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L452) | Chuỗi trong `{...}` | literal | Đang cập nhật |
| [L459](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L459) | Văn bản JSX | text | Danh sách quầy bán ( |
| [L459](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L459) | Văn bản JSX | text | quầy): |
| [L479](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L479) | Văn bản JSX | text | Đã bán: |
| [L479](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L479) | Văn bản JSX | text | / Cấp: |
| [L479](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L479) | Văn bản JSX | text | món |
| [L485](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L485) | Văn bản JSX | text | Vào POS |
| [L501](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L501) | i18n (`t`) | t('inventoryWarnings') -> dashboard.inventoryWarnings | VI: "Tồn kho quầy" \| EN: "Inventory Warnings" |
| [L504](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L504) | Chuỗi trong `{...}` | literal | Tình trạng tồn kho và phân bổ |
| [L505](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L505) | Mẫu văn bản (`...`) | template | `Kho hàng: ${selectedEvent?.name}` |
| [L510](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L510) | Văn bản JSX | text | Kiểm tra kho |
| [L521](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L521) | Văn bản JSX | text | Kho tổng: |
| [L522](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L522) | Văn bản JSX | text | món |
| [L525](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L525) | Văn bản JSX | text | Đã cấp cho quầy: |
| [L526](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L526) | Văn bản JSX | text | món |
| [L529](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L529) | Văn bản JSX | text | Chưa phân bổ: |
| [L531](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L531) | Văn bản JSX | text | món |
| [L538](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L538) | Văn bản JSX | text | Hàng sự kiện: |
| [L539](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L539) | Văn bản JSX | text | món |
| [L542](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L542) | Văn bản JSX | text | Đã bán: |
| [L543](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L543) | Văn bản JSX | text | món |
| [L546](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L546) | Văn bản JSX | text | Tồn tại quầy: |
| [L548](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L548) | Văn bản JSX | text | món |
| [L552](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L552) | Văn bản JSX | text | Kho tổng còn: |
| [L554](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L554) | Văn bản JSX | text | món |
| [L564](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L564) | Văn bản JSX | text | Quầy sẵn sàng hoạt động |
| [L568](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L568) | Văn bản JSX | text | Điều phối |
| [L581](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L581) | i18n (`t`) | t('recentOrders') -> dashboard.recentOrders | VI: "Đơn hàng gần đây" \| EN: "Recent Orders" |
| [L584](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L584) | Chuỗi trong `{...}` | literal | Giao dịch gần nhất qua POS |
| [L585](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L585) | Mẫu văn bản (`...`) | template | `Giao dịch: ${selectedEvent?.name}` |
| [L590](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L590) | Văn bản JSX | text | Xem tất cả |
| [L601](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L601) | i18n (`t`) | t('noRecentOrders') -> dashboard.noRecentOrders | VI: "Chưa có đơn hàng nào" \| EN: "No orders recorded yet" |
| [L602](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L602) | Mẫu văn bản (`...`) | template | `Chưa có đơn hàng nào tại ${selectedEvent?.name}` |
| [L605](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L605) | Văn bản JSX | text | Đơn hàng tạo từ POS (cả online và offline) sẽ được tổng hợp tự động khi kết nối Internet. |
| [L611](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L611) | Văn bản JSX | text | Mở máy POS sự kiện này |
| [L633](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L633) | Chuỗi trong `{...}` | literal | Tiền mặt |
| [L633](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L633) | Chuỗi trong `{...}` | literal | VietQR |
| [L637](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L637) | Văn bản JSX | text | Thử nghiệm (Sandbox) |
| [L642](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L642) | Chuỗi trong `{...}` | literal | Sự kiện |
| [L642](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L642) | Chuỗi trong `{...}` | literal | Quầy POS |
| [L647](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L647) | Chuỗi trong `{...}` | literal | VND |
| [L650](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/page.tsx#L650) | Văn bản JSX | text | món |


#### 7.2 Quản lý Sự kiện (`/dashboard/events`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/events/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx) — **46** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L95](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L95) | Hộp thoại `alert`/`confirm` | alert | alert('Tài khoản của bạn chỉ có quyền xem, không được phép thêm hoặc sửa sự kiện.') |
| [L152](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L152) | Chuỗi JS / Fallback | literal | Gian hàng |
| [L153](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L153) | Chuỗi JS / Fallback | literal | VND |
| [L163](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L163) | i18n (`t`) | t('title') -> events.title | VI: "Sự kiện" \| EN: "Events & Tours" |
| [L165](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L165) | i18n (`t`) | t('title') -> events.title | VI: "Sự kiện" \| EN: "Events & Tours" |
| [L168](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L168) | i18n (`t`) | t('description') -> events.description | VI: "Quản lý lịch diễn và các gian hàng." \| EN: "Manage concert dates, cities, venues and allocated merchandise booths." |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L180) | Văn bản JSX | text | Quét ảnh Poster (AI) |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L184) | i18n (`t`) | t('createButton') -> events.createButton | VI: "Tạo sự kiện" \| EN: "Create Event" |
| [L189](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L189) | Văn bản JSX | text | Chế độ Chỉ Xem (Khách) |
| [L198](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L198) | i18n (`t`) | tCommon('search') -> common.search | VI: "Tìm kiếm..." \| EN: "Search..." |
| [L211](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L211) | i18n (`t`) | t('noEvents') -> events.noEvents | VI: "Chưa có sự kiện nào" \| EN: "No events found in this workspace" |
| [L212](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L212) | i18n (`t`) | t('noEventsDesc') -> events.noEventsDesc | VI: "Bắt đầu bằng cách tạo một sự kiện mới." \| EN: "Start by creating an event to allocate merchandise for your booth points." |
| [L222](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L222) | Văn bản JSX | text | Quét ảnh Poster (AI) |
| [L227](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L227) | i18n (`t`) | t('createButton') -> events.createButton | VI: "Tạo sự kiện" \| EN: "Create Event" |
| [L257](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L257) | i18n động | t | t(`statusList.${evt.status as 'upcoming' \| 'active' \| 'completed' \| 'draft'}`) [namespace: events] |
| [L281](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L281) | Văn bản JSX | text | gian hàng đã thiết lập |
| [L299](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L299) | i18n (`t`) | tCommon('edit') -> common.edit | VI: "Chỉnh sửa" \| EN: "Edit" |
| [L306](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L306) | Hộp thoại `alert`/`confirm` | confirm | confirm('Bạn có chắc muốn xóa sự kiện này?') |
| [L315](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L315) | Văn bản JSX | text | Chế độ xem |
| [L325](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L325) | Thuộc tính HTML | title | Xuất toàn bộ dữ liệu sự kiện này ra file Excel (.xlsx) |
| [L328](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L328) | Văn bản JSX | text | Xuất Excel |
| [L334](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L334) | Văn bản JSX | text | Quầy Collab |
| [L341](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L341) | Văn bản JSX | text | Phân bổ kho |
| [L356](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L356) | i18n (`t`) | t('editButton') -> events.editButton | VI: "Sửa sự kiện" \| EN: "Edit Event" |
| [L356](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L356) | i18n (`t`) | t('createButton') -> events.createButton | VI: "Tạo sự kiện" \| EN: "Create Event" |
| [L357](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L357) | Thuộc tính HTML | description | Thông tin sự kiện được đồng bộ trực tiếp với các quầy POS và quản lý kho. |
| [L366](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L366) | Văn bản JSX | text | Có ảnh poster sự kiện? AI sẽ tự động tách tên, ngày tháng năm & địa điểm. |
| [L380](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L380) | Văn bản JSX | text | Nhập ảnh AI |
| [L390](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L390) | Thuộc tính HTML | alt | Banner preview |
| [L398](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L398) | Văn bản JSX | text | Gỡ ảnh banner |
| [L405](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L405) | i18n (`t`) | t('name') -> events.name | VI: "Tên sự kiện" \| EN: "Event / Tour Name" |
| [L410](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L410) | i18n (`t`) | t('namePlaceholder') -> events.namePlaceholder | VI: "Hạc Cầm Live Concert - Hà Nội" \| EN: "Live Tour 2026 - National Arena" |
| [L417](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L417) | i18n (`t`) | t('location') -> events.location | VI: "Địa điểm" \| EN: "Venue Location" |
| [L420](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L420) | i18n (`t`) | t('locationPlaceholder') -> events.locationPlaceholder | VI: "Trung tâm Hội nghị Quốc gia, Hà Nội" \| EN: "National Convention Center" |
| [L428](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L428) | i18n (`t`) | t('startDate') -> events.startDate | VI: "Bắt đầu" \| EN: "Start Date & Time" |
| [L437](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L437) | i18n (`t`) | t('endDate') -> events.endDate | VI: "Kết thúc" \| EN: "End Date & Time" |
| [L448](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L448) | i18n (`t`) | t('status') -> events.status | VI: "Trạng thái" \| EN: "Event Status" |
| [L455](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L455) | i18n (`t`) | t('statusList.draft') -> events.statusList.draft | VI: "Bản nháp" \| EN: "Draft" |
| [L456](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L456) | i18n (`t`) | t('statusList.upcoming') -> events.statusList.upcoming | VI: "Sắp diễn ra" \| EN: "Upcoming" |
| [L457](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L457) | i18n (`t`) | t('statusList.active') -> events.statusList.active | VI: "Đang diễn ra" \| EN: "Active" |
| [L458](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L458) | i18n (`t`) | t('statusList.completed') -> events.statusList.completed | VI: "Đã kết thúc" \| EN: "Completed" |
| [L459](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L459) | i18n (`t`) | t('statusList.cancelled') -> events.statusList.cancelled | VI: "Đã hủy" \| EN: "Cancelled" |
| [L464](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L464) | i18n (`t`) | t('descriptionLabel') -> events.descriptionLabel | VI: "Mô tả" \| EN: "Description / Notes" |
| [L469](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L469) | i18n (`t`) | t('descriptionPlaceholder') -> events.descriptionPlaceholder | VI: "Ghi chú đêm diễn..." \| EN: "Opening night of the 2026 stadium tour..." |
| [L482](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L482) | i18n (`t`) | tCommon('cancel') -> common.cancel | VI: "Hủy" \| EN: "Cancel" |
| [L485](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx#L485) | i18n (`t`) | tCommon('save') -> common.save | VI: "Lưu" \| EN: "Save" |


#### 7.3 Quản lý Gian hàng & Link Collab (`/dashboard/booths`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/booths/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx) — **113** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L77](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L77) | Mẫu văn bản (`...`) | template | `collab_${cleanSlug \|\| 'user'}` |
| [L78](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L78) | Chuỗi JS / Fallback | literal | Collab@2026 |
| [L79](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L79) | Mẫu văn bản (`...`) | template | `Đại diện ${safePartner}` |
| [L80](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L80) | Mẫu văn bản (`...`) | template | `${cleanSlug \|\| 'collab'}@eventmate.local` |
| [L92](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L92) | Chuỗi JS / Fallback | literal | Đối tác Collab |
| [L104](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L104) | Chuỗi JS / Fallback | literal | Lỗi khi cấp tài khoản. |
| [L109](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L109) | Chuỗi JS / Fallback | literal | Admin |
| [L113](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L113) | Mẫu văn bản (`...`) | template | `Tài khoản Collab: ${collabUsername}` |
| [L114](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L114) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Admin cấp tài khoản Collab "${collabUsername}" (${collabFullName}) ch...` |
| [L119](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L119) | Mẫu văn bản (`...`) | template | `collab-${Date.now()}` |
| [L133](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L133) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #2** bên dưới:_ ``🎉 TÀI KHOẢN ĐỐI TÁC GIAN HÀNG COLLAB — EVENTMATE...` |
| [L156](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L156) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #3** bên dưới:_ ``${window.location.origin}/vi/collab/${booth.id}?partner=${encodeURICo...` |
| [L166](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L166) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #4** bên dưới:_ ``🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE...` |
| [L224](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L224) | Hộp thoại `alert`/`confirm` | alert | alert('Tài khoản của bạn chỉ có quyền xem, không được phép thêm hoặc sửa gian hàng.') |
| [L273](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L273) | i18n (`t`) | t('title') -> booths.title | VI: "Gian hàng" \| EN: "Booths & Sales Points" |
| [L275](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L275) | Văn bản JSX | text | quầy bán |
| [L279](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L279) | Văn bản JSX | text | Quản lý các gian hàng riêng hoặc gian hàng hợp tác liên danh (Collab) cho từng sự kiện. |
| [L292](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L292) | i18n (`t`) | t('createButton') -> booths.createButton | VI: "Thêm gian hàng" \| EN: "Add Booth" |
| [L296](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L296) | Văn bản JSX | text | Chế độ Chỉ Xem |
| [L305](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L305) | i18n (`t`) | t('selectEvent') -> booths.selectEvent | VI: "Chọn sự kiện" \| EN: "Select Event" |
| [L312](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L312) | i18n (`t`) | t('allEvents') -> booths.allEvents | VI: "Tất cả sự kiện" \| EN: "All Events" |
| [L323](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L323) | Văn bản JSX | text | Mô hình quầy: |
| [L330](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L330) | Văn bản JSX | text | Tất cả mô hình |
| [L331](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L331) | Văn bản JSX | text | Gian hàng Độc lập |
| [L332](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L332) | Văn bản JSX | text | Gian hàng Collab (Hợp tác) |
| [L341](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L341) | i18n (`t`) | t('noBooths') -> booths.noBooths | VI: "Chưa có gian hàng nào" \| EN: "No booths created yet" |
| [L342](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L342) | i18n (`t`) | t('noBoothsDesc') -> booths.noBoothsDesc | VI: "Hãy tạo gian hàng tương ứng với các quầy bán thực tế." \| EN: "Add physical booths corresponding to your tour merchandise counters." |
| [L346](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L346) | i18n (`t`) | t('createButton') -> booths.createButton | VI: "Thêm gian hàng" \| EN: "Add Booth" |
| [L380](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L380) | Văn bản JSX | text | Collab: |
| [L380](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L380) | Chuỗi trong `{...}` | literal | Đối tác |
| [L384](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L384) | Văn bản JSX | text | Độc lập |
| [L391](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L391) | i18n động | t | t(`statusList.${booth.status as 'active' \| 'inactive' \| 'closed'}`) [namespace: booths] |
| [L397](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L397) | Chuỗi trong `{...}` | literal | Sự kiện |
| [L405](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L405) | Văn bản JSX | text | Đối tác: |
| [L405](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L405) | Chuỗi trong `{...}` | literal | Chưa đặt tên |
| [L408](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L408) | Văn bản JSX | text | % Doanh số |
| [L418](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L418) | Thuộc tính HTML | title | Cấp tài khoản đăng nhập trực tiếp cho Đối tác Collab |
| [L421](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L421) | Văn bản JSX | text | Cấp Account Collab |
| [L429](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L429) | Thuộc tính HTML | title | Chia sẻ Cổng liên kết web |
| [L432](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L432) | Văn bản JSX | text | Link Web |
| [L447](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L447) | Thuộc tính HTML | title | Mở xem cổng đối tác |
| [L458](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L458) | Văn bản JSX | text | Hạn mức đã cấp: |
| [L460](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L460) | Văn bản JSX | text | món |
| [L464](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L464) | Văn bản JSX | text | Đã bán: |
| [L466](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L466) | Văn bản JSX | text | món |
| [L470](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L470) | Văn bản JSX | text | Còn lại tại quầy: |
| [L472](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L472) | Văn bản JSX | text | món |
| [L496](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L496) | Hộp thoại `alert`/`confirm` | confirm | confirm('Bạn có chắc muốn xóa gian hàng này?') |
| [L505](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L505) | Văn bản JSX | text | Chỉ xem |
| [L513](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L513) | Văn bản JSX | text | Kho |
| [L519](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L519) | Văn bản JSX | text | Mở POS |
| [L534](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L534) | i18n (`t`) | t('editButton') -> booths.editButton | VI: "Sửa gian hàng" \| EN: "Edit Booth" |
| [L534](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L534) | i18n (`t`) | t('createButton') -> booths.createButton | VI: "Thêm gian hàng" \| EN: "Add Booth" |
| [L535](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L535) | Thuộc tính HTML | description | Mỗi quầy bán có mã định danh riêng và chỉ được phép bán số lượng hàng hóa được phân bổ. |
| [L540](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L540) | i18n (`t`) | t('selectEvent') -> booths.selectEvent | VI: "Chọn sự kiện" \| EN: "Select Event" |
| [L559](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L559) | i18n (`t`) | t('name') -> booths.name | VI: "Tên gian hàng" \| EN: "Booth Name" |
| [L564](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L564) | i18n (`t`) | t('namePlaceholder') -> booths.namePlaceholder | VI: "Quầy A - Cổng Tây" \| EN: "Booth A - West Gate" |
| [L573](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L573) | i18n (`t`) | t('code') -> booths.code | VI: "Mã quầy" \| EN: "Booth Code" |
| [L578](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L578) | i18n (`t`) | t('codePlaceholder') -> booths.codePlaceholder | VI: "BOOTH-A" \| EN: "BOOTH-A" |
| [L585](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L585) | i18n (`t`) | t('status') -> booths.status | VI: "Trạng thái" \| EN: "Operating Status" |
| [L592](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L592) | i18n (`t`) | t('statusList.active') -> booths.statusList.active | VI: "Hoạt động" \| EN: "Active" |
| [L593](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L593) | i18n (`t`) | t('statusList.paused') -> booths.statusList.paused | VI: "Tạm dừng" \| EN: "Paused" |
| [L594](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L594) | i18n (`t`) | t('statusList.closed') -> booths.statusList.closed | VI: "Đã đóng" \| EN: "Closed" |
| [L603](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L603) | Văn bản JSX | text | Mô hình quầy bán |
| [L605](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L605) | Văn bản JSX | text | Chọn nếu đây là gian hàng hợp tác / liên danh với nghệ sĩ hoặc đối tác khác |
| [L618](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L618) | Văn bản JSX | text | Độc lập |
| [L629](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L629) | Văn bản JSX | text | Collab |
| [L637](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L637) | Văn bản JSX | text | Tên Đối tác Collab |
| [L640](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L640) | Thuộc tính HTML | placeholder | VD: The Cassette, Cá Hồi Hoang... |
| [L647](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L647) | Văn bản JSX | text | Chia sẻ doanh thu (%) |
| [L669](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L669) | i18n (`t`) | tCommon('cancel') -> common.cancel | VI: "Hủy" \| EN: "Cancel" |
| [L672](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L672) | i18n (`t`) | tCommon('save') -> common.save | VI: "Lưu" \| EN: "Save" |
| [L683](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L683) | Mẫu văn bản (`...`) | template | `Cổng Hợp Tác Đối Tác — ${selectedCollabBooth.name}` |
| [L684](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L684) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #5** bên dưới:_ ``Gửi liên kết độc quyền này cho đối tác "${selectedCollabBooth.collab_...` |
| [L689](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L689) | Văn bản JSX | text | Gian hàng: |
| [L690](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L690) | Văn bản JSX | text | Tỷ lệ: |
| [L690](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L690) | Văn bản JSX | text | % Đối tác |
| [L693](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L693) | Văn bản JSX | text | Đối tác khi truy cập link này sẽ vào thẳng cổng làm việc riêng của gian hàng, không cần tài khoản admin chính của bạn. |
| [L698](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L698) | Văn bản JSX | text | Liên kết truy cập Cổng Đối tác: |
| [L713](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L713) | Chuỗi trong `{...}` | literal | Đã copy |
| [L713](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L713) | Chuỗi trong `{...}` | literal | Copy |
| [L719](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L719) | Văn bản JSX | text | Mẫu tin nhắn gửi qua Zalo / Telegram: |
| [L721](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L721) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #6** bên dưới:_ ``🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE...` |
| [L743](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L743) | Văn bản JSX | text | Mở xem thử giao diện Đối tác |
| [L754](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L754) | Văn bản JSX | text | Đóng |
| [L764](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L764) | Chuỗi trong `{...}` | literal | Đã sao chép tin nhắn! |
| [L764](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L764) | Chuỗi trong `{...}` | literal | Sao chép tin nhắn gửi Đối tác |
| [L777](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L777) | Thuộc tính HTML | title | Cấp Tài Khoản Quản Trị Cho Đối Tác Collab |
| [L778](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L778) | Mẫu văn bản (`...`) | template | `Tạo tài khoản đăng nhập trực tiếp cho đối tác "${selectedCollabBooth.collab_partner \|\| 'Đối tác'}" để tự quản lý hàng bán.` |
| [L787](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L787) | Văn bản JSX | text | Đã cấp tài khoản đối tác thành công! |
| [L790](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L790) | Văn bản JSX | text | Đối tác có thể đăng nhập vào hệ thống để tự quản lý sản phẩm, tồn kho và bán hàng tại quầy liên danh. Kho hàng của Admin được bảo vệ ở chế độ Chỉ đọc. |
| [L797](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L797) | Văn bản JSX | text | Thương hiệu / Đối tác: |
| [L801](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L801) | Văn bản JSX | text | Gian hàng được cấp: |
| [L805](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L805) | Văn bản JSX | text | Tên đăng nhập: |
| [L811](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L811) | Văn bản JSX | text | Mật khẩu: |
| [L817](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L817) | Văn bản JSX | text | Link đăng nhập: |
| [L831](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L831) | Văn bản JSX | text | Đóng |
| [L841](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L841) | Chuỗi trong `{...}` | literal | Đã sao chép tài khoản! |
| [L841](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L841) | Chuỗi trong `{...}` | literal | Sao chép thông tin tài khoản |
| [L855](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L855) | Văn bản JSX | text | Gian hàng: |
| [L857](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L857) | Văn bản JSX | text | Chia sẻ: |
| [L861](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L861) | Văn bản JSX | text | 🔒 Tài khoản Collab có quyền thêm/sửa sản phẩm và quản lý kho hàng của bản thân. Kho hàng của Admin sẽ ở trạng thái |
| [L861](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L861) | Văn bản JSX | text | Chỉ đọc |
| [L867](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L867) | Văn bản JSX | text | Họ tên người đại diện đối tác |
| [L872](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L872) | Thuộc tính HTML | placeholder | VD: Nguyễn Văn Đại Diện, Trưởng nhóm Brand... |
| [L882](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L882) | Văn bản JSX | text | Tên đăng nhập (Username) |
| [L887](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L887) | Thuộc tính HTML | placeholder | VD: collab_genz... |
| [L896](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L896) | Văn bản JSX | text | Mật khẩu đăng nhập |
| [L902](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L902) | Thuộc tính HTML | placeholder | Tối thiểu 6 ký tự... |
| [L911](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L911) | Văn bản JSX | text | Email liên hệ (tùy chọn) |
| [L915](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L915) | Thuộc tính HTML | placeholder | partner@brand.com |
| [L929](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L929) | Văn bản JSX | text | Hủy |
| [L938](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L938) | Văn bản JSX | text | Khởi tạo & Cấp tài khoản |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([page.tsx#L114](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L114))

```text
`Admin cấp tài khoản Collab "${collabUsername}" (${collabFullName}) cho đối tác "${safePartner}" tại gian hàng "${selectedCollabBooth.name}".`
```

##### 📄 Mẫu #2 — Mẫu văn bản (`...`) ([page.tsx#L133](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L133))

```text
`🎉 TÀI KHOẢN ĐỐI TÁC GIAN HÀNG COLLAB — EVENTMATE
• Sự kiện: ${evt?.name || 'Sự kiện'}
• Gian hàng liên danh: ${selectedCollabBooth.name} (${selectedCollabBooth.code})
• Đối tác: ${collabCreatedSuccess.collabPartnerName}
• Link đăng nhập hệ thống: ${window.location.origin}/login
• Tên đăng nhập (Username): ${collabCreatedSuccess.username}
• Mật khẩu (Password): ${collabCreatedSuccess.password}
• Quyền hạn: Quản trị độc lập gian hàng & sản phẩm collab (Kho hàng Admin được bảo vệ chỉ đọc).`
```

##### 📄 Mẫu #3 — Mẫu văn bản (`...`) ([page.tsx#L156](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L156))

```text
`${window.location.origin}/vi/collab/${booth.id}?partner=${encodeURIComponent(
      booth.collab_partner || 'Đối tác'
    )}&event=${encodeURIComponent(evt?.name || '')}&ratio=${
      booth.revenue_share_ratio || 50
    }&name=${encodeURIComponent(booth.name)}&evtId=${encodeURIComponent(booth.event_id)}`
```

##### 📄 Mẫu #4 — Mẫu văn bản (`...`) ([page.tsx#L166](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L166))

```text
`🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE
• Sự kiện: ${evt?.name || 'Sự kiện chung'}
• Gian hàng liên danh: ${booth.name} (${booth.code})
• Đối tác: ${booth.collab_partner || 'Đối tác'}
• Tỷ lệ chia sẻ doanh thu: ${booth.revenue_share_ratio || 50}% cho Đối tác

👉 Nhấn vào liên kết sau để mở Cổng Đối tác, đồng bộ hàng hóa và xem doanh thu thời gian thực:
${url}`
```

##### 📄 Mẫu #5 — Mẫu văn bản (`...`) ([page.tsx#L684](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L684))

```text
`Gửi liên kết độc quyền này cho đối tác "${selectedCollabBooth.collab_partner || 'Đối tác'}" để họ có thể mở trang giao diện riêng, đồng bộ sản phẩm và xem báo cáo chia sẻ doanh thu.`
```

##### 📄 Mẫu #6 — Mẫu văn bản (`...`) ([page.tsx#L721](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L721))

```text
`🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE
• Sự kiện: ${events.find((e) => e.id === selectedCollabBooth.event_id)?.name || 'Sự kiện chung'}
• Gian hàng liên danh: ${selectedCollabBooth.name} (${selectedCollabBooth.code})
• Đối tác: ${selectedCollabBooth.collab_partner || 'Đối tác'}
• Tỷ lệ chia sẻ doanh thu: ${selectedCollabBooth.revenue_share_ratio || 50}% cho Đối tác

👉 Nhấn vào link sau để mở Cổng Đối tác, đồng bộ hàng hóa và xem doanh thu thời gian thực:
${getCollabShareUrl(selectedCollabBooth)}`
```


#### 7.4 Quản lý Sản phẩm & Biến thể (`/dashboard/products`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/products/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx) — **132** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L99](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L99) | Hộp thoại `alert`/`confirm` | alert | alert('Bạn chỉ có quyền điều chỉnh sản phẩm thuộc thương hiệu Collab của mình. Không thể can thiệp hàng kho Admin.') |
| [L132](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L132) | Chuỗi JS / Fallback | literal | Nhân viên / Admin |
| [L137](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L137) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Điều chỉnh số lượng đặt trước / online cho "${quickAdjustProduct.name...` |
| [L141](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L141) | Mẫu văn bản (`...`) | template | `Tổng: ${v.total} \| Tự giữ: ${v.reserved} \| Onl: ${v.online}` |
| [L215](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L215) | Thuộc tính dữ liệu | name | Tiêu chuẩn (Standard) |
| [L279](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L279) | Thuộc tính dữ liệu | name | Tiêu chuẩn |
| [L286](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L286) | Hộp thoại `alert`/`confirm` | alert | alert('Bạn chỉ có quyền quản trị các sản phẩm thuộc thương hiệu Collab của mình. Không thể chỉnh sửa hàng kho của Admin.') |
| [L316](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L316) | Thuộc tính dữ liệu | name | Tiêu chuẩn |
| [L343](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L343) | Hộp thoại `alert`/`confirm` | alert | alert('Tài khoản của bạn chỉ có quyền xem, không được phép thêm hoặc sửa sản phẩm.') |
| [L349](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L349) | Chuỗi JS / Fallback | literal | Collab Partner |
| [L369](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L369) | Hộp thoại `alert`/`confirm` | alert | alert('Bạn không có quyền chỉnh sửa sản phẩm thuộc kho hàng Admin.') |
| [L382](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L382) | Chuỗi JS / Fallback | literal | Người dùng |
| [L387](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L387) | Mẫu văn bản (`...`) | template | `Cập nhật thông tin sản phẩm "${name}" (${effectiveCollabPartner ? `Collab: ${effectiveCollabPartner}` : 'Hàng Host'}).` |
| [L389](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L389) | Chuỗi JS / Fallback | field_label | Tên sản phẩm |
| [L390](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L390) | Chuỗi JS / Fallback | field_label | Đối tác |
| [L390](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L390) | Chuỗi JS / Fallback | literal | Không |
| [L416](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L416) | Chuỗi JS / Fallback | literal | Người dùng |
| [L421](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L421) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #2** bên dưới:_ ``Tạo mới sản phẩm "${name}" (${effectiveCollabPartner ? `Collab: ${eff...` |
| [L433](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L433) | i18n (`t`) | t('title') -> products.title | VI: "Sản phẩm" \| EN: "Products & Variants" |
| [L435](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L435) | i18n (`t`) | t('units') -> products.units | VI: "sản phẩm" \| EN: "items" |
| [L438](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L438) | i18n (`t`) | t('description') -> products.description | VI: "Danh mục hàng hóa, bảng giá và phân loại." \| EN: "Merchandise catalog, pricing, size/color variants and SKU inventory." |
| [L444](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L444) | i18n (`t`) | t('createButton') -> products.createButton | VI: "Thêm sản phẩm" \| EN: "Add Product" |
| [L448](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L448) | Văn bản JSX | text | Chế độ Chỉ Xem |
| [L460](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L460) | Văn bản JSX | text | Không gian Đối tác Collab: |
| [L460](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L460) | Chuỗi trong `{...}` | literal | Đối tác |
| [L463](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L463) | Văn bản JSX | text | Bạn có toàn quyền quản lý, thêm mới, sửa ảnh và điều phối sản phẩm của thương hiệu |
| [L463](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L463) | Văn bản JSX | text | . Hàng hóa kho tổng của Admin được bảo vệ ở chế độ |
| [L463](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L463) | Văn bản JSX | text | Chỉ đọc (Read-only) |
| [L463](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L463) | Văn bản JSX | text | để tránh can thiệp ngoài phạm vi. |
| [L468](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L468) | Văn bản JSX | text | Quản trị Độc lập |
| [L486](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L486) | Văn bản JSX | text | Đang bán |
| [L503](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L503) | Văn bản JSX | text | Hết hàng |
| [L520](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L520) | Văn bản JSX | text | Đã ẩn |
| [L536](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L536) | Văn bản JSX | text | Tất cả |
| [L547](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L547) | i18n (`t`) | tCommon('search') -> common.search | VI: "Tìm kiếm..." \| EN: "Search..." |
| [L561](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L561) | i18n (`t`) | t('allCategories') -> products.allCategories | VI: "Tất cả danh mục" \| EN: "All Categories" |
| [L576](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L576) | i18n (`t`) | t('noProducts') -> products.noProducts | VI: "Chưa có sản phẩm nào" \| EN: "No products created yet" |
| [L577](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L577) | i18n (`t`) | t('noProductsDesc') -> products.noProductsDesc | VI: "Hãy tạo các sản phẩm merchandise trước khi tiến hành phân bổ cho các gian hàng." \| EN: "Add merchandise items before allocating them to event booths." |
| [L581](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L581) | i18n (`t`) | t('createButton') -> products.createButton | VI: "Thêm sản phẩm" \| EN: "Add Product" |
| [L608](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L608) | Chuỗi trong `{...}` | title | Bấm để đổi ảnh hoặc sửa thông tin sản phẩm |
| [L623](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L623) | Văn bản JSX | text | Đổi ảnh |
| [L641](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L641) | Văn bản JSX | text | Collab: |
| [L646](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L646) | Văn bản JSX | text | Đã xóa (Đang ẩn) |
| [L651](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L651) | Văn bản JSX | text | Tạm ngưng bán |
| [L656](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L656) | Văn bản JSX | text | Đã bán hết (Ẩn khỏi POS) |
| [L671](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L671) | Văn bản JSX | text | Số lượng: |
| [L674](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L674) | Văn bản JSX | text | Online: |
| [L677](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L677) | Văn bản JSX | text | Preord: |
| [L680](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L680) | Văn bản JSX | text | Đã bán offline: |
| [L683](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L683) | Văn bản JSX | text | Tồn bán offline: |
| [L686](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L686) | Văn bản JSX | text | biến thể) |
| [L701](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L701) | Thuộc tính HTML | title | Sửa thông tin, chụp ảnh hoặc tải ảnh mới từ điện thoại |
| [L704](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L704) | Văn bản JSX | text | Sửa & Đổi ảnh |
| [L712](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L712) | Thuộc tính HTML | title | Chỉnh nhanh số lượng đặt trước thủ công và đơn đặt mua online |
| [L715](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L715) | Văn bản JSX | text | ⚡ Chỉnh Đặt Trước / Online |
| [L726](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L726) | Chuỗi JS / Fallback | literal | Người dùng |
| [L731](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L731) | Mẫu văn bản (`...`) | template | `Khôi phục sản phẩm "${prod.name}" trở lại danh mục đang mở bán.` |
| [L734](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L734) | Thuộc tính HTML | title | Khôi phục sản phẩm này trở lại mở bán |
| [L737](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L737) | Văn bản JSX | text | Khôi phục |
| [L750](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L750) | Văn bản JSX | text | Ẩn sản phẩm |
| [L755](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L755) | Văn bản JSX | text | Hiện lại |
| [L765](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L765) | Hộp thoại `alert`/`confirm` | confirm | _Xem **Mẫu #3** bên dưới:_ `confirm(...` |
| [L771](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L771) | Chuỗi JS / Fallback | literal | Người dùng |
| [L776](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L776) | Mẫu văn bản (`...`) | template | `Đã ẩn/xóa sản phẩm "${prod.name}" khỏi danh mục đang bán (chuyển vào mục Đã ẩn/Đã xóa).` |
| [L780](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L780) | Thuộc tính HTML | title | Ẩn / Xóa sản phẩm (Chỉ ẩn đi, không bị mất dữ liệu) |
| [L788](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L788) | Thuộc tính HTML | title | Hàng kho Admin - Bạn không thể chỉnh sửa |
| [L790](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L790) | Văn bản JSX | text | Kho hàng Admin (Chỉ đọc) |
| [L793](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L793) | Văn bản JSX | text | Chỉ xem |
| [L802](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L802) | Văn bản JSX | text | Phân rã Biến thể & Trạng thái Đặt Trước / Khả Dụng |
| [L805](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L805) | Văn bản JSX | text | Bao gồm: Tự đặt trước (Chủ shop giữ) + Khách đặt mua Online |
| [L826](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L826) | Chuỗi trong `{...}` | literal | VND |
| [L836](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L836) | Văn bản JSX | text | Còn |
| [L836](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L836) | Văn bản JSX | text | bán quầy |
| [L843](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L843) | Văn bản JSX | text | Số lượng |
| [L847](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L847) | Văn bản JSX | text | Online |
| [L851](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L851) | Văn bản JSX | text | Preord |
| [L855](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L855) | Văn bản JSX | text | Đã bán off |
| [L859](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L859) | Văn bản JSX | text | Tồn bán off |
| [L878](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L878) | Chuỗi trong `{...}` | title | Chỉnh Sửa Thông Tin & Đổi Ảnh Sản Phẩm |
| [L878](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L878) | i18n (`t`) | t('createButton') -> products.createButton | VI: "Thêm sản phẩm" \| EN: "Add Product" |
| [L882](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L882) | Chuỗi trong `{...}` | description | Cập nhật ảnh chụp sản phẩm, tên, phân loại và số lượng mở bán. |
| [L883](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L883) | Chuỗi trong `{...}` | description | Nhập thông tin sản phẩm merchandise và danh sách các biến thể kích thước/màu sắc. |
| [L891](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L891) | Thuộc tính HTML | label | Ảnh chụp sản phẩm / Tải ảnh từ điện thoại |
| [L896](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L896) | i18n (`t`) | t('productName') -> products.productName | VI: "Tên sản phẩm" \| EN: "Product Name" |
| [L901](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L901) | i18n (`t`) | t('productNamePlaceholder') -> products.productNamePlaceholder | VI: "Áo thun Tour Hạc Cầm 2026" \| EN: "Tour 2026 Graphic T-Shirt" |
| [L911](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L911) | i18n (`t`) | t('categoryLabel') -> products.categoryLabel | VI: "Danh mục" \| EN: "Product Category" |
| [L913](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L913) | Văn bản JSX | text | Nhập tự do hoặc chọn có sẵn |
| [L921](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L921) | Thuộc tính HTML | placeholder | Gõ danh mục (VD: Móc khóa, Sticker...) hoặc bấm chọn |
| [L934](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L934) | Thuộc tính HTML | title | Bấm để mở danh sách danh mục có sẵn |
| [L962](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L962) | Văn bản JSX | text | Dùng danh mục mới: |
| [L995](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L995) | Văn bản JSX | text | SP |
| [L1007](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1007) | Văn bản JSX | text | Không tìm thấy danh mục có sẵn. Danh mục mới sẽ được tạo khi lưu. |
| [L1015](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1015) | Văn bản JSX | text | Gợi ý nhanh: |
| [L1039](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1039) | Văn bản JSX | text | Đối tác Collab |
| [L1044](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1044) | Chuỗi trong `{...}` | value | Collab Partner |
| [L1049](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1049) | Văn bản JSX | text | 🔒 Tự động gán cho tài khoản đối tác của bạn ( |
| [L1055](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1055) | Thuộc tính HTML | placeholder | VD: GenZ Studio, The Cassette... |
| [L1064](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1064) | i18n (`t`) | t('descriptionLabel') -> products.descriptionLabel | VI: "Mô tả sản phẩm" \| EN: "Description" |
| [L1069](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1069) | Thuộc tính HTML | placeholder | Chất liệu, ghi chú đóng gói... |
| [L1079](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1079) | i18n (`t`) | t('variantsSection') -> products.variantsSection | VI: "Biến thể & Tồn kho ban đầu" \| EN: "Variants & Initial Inventory" |
| [L1089](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1089) | i18n (`t`) | t('addVariant') -> products.addVariant | VI: "Thêm biến thể" \| EN: "Add Variant" |
| [L1106](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1106) | Văn bản JSX | text | Tên biến thể: |
| [L1108](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1108) | i18n (`t`) | t('variantNamePlaceholder') -> products.variantNamePlaceholder | VI: "Size L - Đen" \| EN: "Size L - Black" |
| [L1116](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1116) | Văn bản JSX | text | Mã loại: |
| [L1118](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1118) | Thuộc tính HTML | placeholder | Mã loại |
| [L1126](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1126) | Văn bản JSX | text | Giá bán (VND): |
| [L1129](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1129) | Thuộc tính HTML | placeholder | Giá bán |
| [L1142](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1142) | Thuộc tính HTML | title | Xóa biến thể |
| [L1152](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1152) | Văn bản JSX | text | Tổng tồn kho: |
| [L1156](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1156) | Thuộc tính HTML | placeholder | Tổng kho |
| [L1166](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1166) | Văn bản JSX | text | Tự giữ chỗ (VIP): |
| [L1170](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1170) | Thuộc tính HTML | placeholder | Đặt trước |
| [L1179](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1179) | Văn bản JSX | text | Khách đặt Online: |
| [L1183](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1183) | Thuộc tính HTML | placeholder | Đơn online |
| [L1192](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1192) | Văn bản JSX | text | Khả dụng tại quầy |
| [L1194](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1194) | Văn bản JSX | text | món |
| [L1211](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1211) | i18n (`t`) | tCommon('cancel') -> common.cancel | VI: "Hủy" \| EN: "Cancel" |
| [L1214](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1214) | Chuỗi trong `{...}` | literal | Lưu cập nhật & Đổi ảnh |
| [L1214](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1214) | i18n (`t`) | tCommon('save') -> common.save | VI: "Lưu" \| EN: "Save" |
| [L1225](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1225) | Mẫu văn bản (`...`) | template | `Điều Chỉnh Số Lượng Đặt Trước & Online — ${quickAdjustProduct.name}` |
| [L1226](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1226) | Thuộc tính HTML | description | Cập nhật nhanh số lượng sản phẩm được chủ shop tự giữ trước hoặc khách hàng đã đặt mua online. |
| [L1233](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1233) | Văn bản JSX | text | Quy tắc 5 trạng thái kho EventMate: |
| [L1236](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1236) | Văn bản JSX | text | Tồn kho để bán offline |
| [L1236](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1236) | Văn bản JSX | text | = Số lượng (Tổng nhập) - Online - Preord - Đã bán offline. Hệ thống POS bảo vệ nghiêm ngặt số lượng này, tuyệt đối không cho phép bán lấn sang hàng online hoặc giữ chỗ! |
| [L1255](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1255) | Văn bản JSX | text | • Đã bán offline: |
| [L1259](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1259) | Văn bản JSX | text | Tồn bán offline: |
| [L1261](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1261) | Văn bản JSX | text | món |
| [L1269](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1269) | Văn bản JSX | text | Tổng số lượng trong kho: |
| [L1288](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1288) | Văn bản JSX | text | Tự giữ / Đặt trước (VIP): |
| [L1307](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1307) | Văn bản JSX | text | Khách đặt mua Online: |
| [L1335](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1335) | Văn bản JSX | text | Hủy |
| [L1344](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1344) | Văn bản JSX | text | Lưu Thay Đổi Số Lượng & Trạng Thái |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([page.tsx#L137](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L137))

```text
`Điều chỉnh số lượng đặt trước / online cho "${quickAdjustProduct.name}": ${quickVariants.map((v) => `${v.name} (Tự giữ: ${v.reserved}, Onl: ${v.online})`).join('; ')}.`
```

##### 📄 Mẫu #2 — Mẫu văn bản (`...`) ([page.tsx#L421](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L421))

```text
`Tạo mới sản phẩm "${name}" (${effectiveCollabPartner ? `Collab: ${effectiveCollabPartner}` : 'Hàng Host'}) với ${formVariants.length} phân loại.`
```

##### 📄 Mẫu #3 — Hộp thoại `alert`/`confirm` ([page.tsx#L765](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L765))

```text
confirm(
                                    `Bạn có chắc muốn ẩn/xóa sản phẩm "${prod.name}"? (Sản phẩm sẽ được ẩn đi chứ không bị xóa vĩnh viễn, bạn có thể khôi phục lại bất kỳ lúc nào).`
                                  )
```


#### 7.5 Kho & Phân bổ Quầy (`/dashboard/inventory`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx) — **91** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L60](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L60) | Chuỗi JS / Fallback | literal | móc khóa |
| [L73](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L73) | Hộp thoại `alert`/`confirm` | alert | alert('Bạn không có quyền điều chuyển hoặc thay đổi số lượng kho hàng của Admin.') |
| [L89](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L89) | Hộp thoại `alert`/`confirm` | alert | _Xem **Mẫu #1** bên dưới:_ `alert(...` |
| [L103](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L103) | Chuỗi JS / Fallback | literal | Nhân viên kho |
| [L110](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L110) | Mẫu văn bản (`...`) | template | `Điều chỉnh phân bổ quầy "${selectedBooth.name}": ${amount > 0 ? `+${amount}` : amount} món "${variantName}".` |
| [L112](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L112) | Chuỗi JS / Fallback | field_label | Số lượng chuyển |
| [L124](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L124) | Hộp thoại `alert`/`confirm` | alert | alert('Bạn không có quyền điều chuyển hoặc thay đổi số lượng kho hàng của Admin.') |
| [L151](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L151) | Hộp thoại `alert`/`confirm` | alert | _Xem **Mẫu #2** bên dưới:_ `alert(...` |
| [L172](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L172) | Chuỗi JS / Fallback | literal | Nhân viên kho |
| [L179](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L179) | Mẫu văn bản (`...`) | template | `Nhập trực tiếp số lượng cấp cho quầy "${selectedBooth.name}": ${clampedAlloc} món "${variantName}" (Cũ: ${currentAllocQty}).` |
| [L181](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L181) | Chuỗi JS / Fallback | field_label | Số lượng phân bổ |
| [L236](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L236) | i18n (`t`) | t('title') -> inventory.title | VI: "Kho hàng" \| EN: "Inventory & Booth Allocation" |
| [L238](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L238) | Văn bản JSX | text | mã loại |
| [L241](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L241) | i18n (`t`) | t('description') -> inventory.description | VI: "Phân bổ số lượng hàng hóa từ kho tổng vào từng gian hàng." \| EN: "Allocate stock from central tour storage into specific event booths before doors open." |
| [L251](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L251) | Thuộc tính HTML | title | Kiểm đếm số lượng thực tế tại quầy và cân bằng kho |
| [L254](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L254) | Văn bản JSX | text | Kiểm Kê Quầy |
| [L267](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L267) | Văn bản JSX | text | Kho Hàng Đối tác Collab: |
| [L267](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L267) | Chuỗi trong `{...}` | literal | Đối tác |
| [L270](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L270) | Văn bản JSX | text | Bạn có quyền điều phối hàng hóa cho gian hàng hợp tác của mình. Kho hàng của Admin được hiển thị ở chế độ |
| [L270](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L270) | Văn bản JSX | text | Chỉ đọc (Read-only) |
| [L270](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L270) | Văn bản JSX | text | để bảo vệ dữ liệu tổng. |
| [L275](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L275) | Văn bản JSX | text | Kho Độc Lập |
| [L283](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L283) | i18n (`t`) | t('totalStock') -> inventory.totalStock | VI: "Tổng kho" \| EN: "Total Stock" |
| [L284](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L284) | Văn bản JSX | text | món |
| [L285](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L285) | Văn bản JSX | text | Tổng nhập |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L289) | i18n (`t`) | t('allocatedStock') -> inventory.allocatedStock | VI: "Đã phân bổ" \| EN: "Allocated" |
| [L290](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L290) | Văn bản JSX | text | món |
| [L291](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L291) | Văn bản JSX | text | Đã cấp cho quầy |
| [L295](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L295) | i18n (`t`) | t('storageStock') -> inventory.storageStock | VI: "Kho tổng" \| EN: "Central Storage" |
| [L296](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L296) | Văn bản JSX | text | món |
| [L297](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L297) | Văn bản JSX | text | Còn tại kho tổng |
| [L301](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L301) | i18n (`t`) | t('soldStock') -> inventory.soldStock | VI: "Đã bán" \| EN: "Sold" |
| [L302](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L302) | Văn bản JSX | text | món |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L303) | Văn bản JSX | text | Đã bán qua POS |
| [L319](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L319) | Thuộc tính HTML | label | Sự kiện thực tế |
| [L327](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L327) | Thuộc tính HTML | label | Thử nghiệm / Sandbox (Tách biệt) |
| [L330](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L330) | Văn bản JSX | text | 🧪 |
| [L342](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L342) | Văn bản JSX | text | Sự kiện chưa có quầy bán nào |
| [L367](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L367) | i18n (`t`) | t('ruleNotice') -> inventory.ruleNotice | VI: "Gian hàng chỉ được bán trong phạm vi số lượng đã phân bổ." \| EN: "Rule: A booth cannot sell more items than its available allocated stock." |
| [L377](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L377) | Văn bản JSX | text | Quầy hàng thử nghiệm (Sandbox): |
| [L377](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L377) | Văn bản JSX | text | Lượng hàng cấp và doanh số tại quầy test POS được cách ly độc lập, |
| [L377](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L377) | Văn bản JSX | text | hoàn toàn không ảnh hưởng |
| [L377](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L377) | Văn bản JSX | text | đến tồn kho tổng hay số liệu xuất kho thực tế của các show diễn. |
| [L387](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L387) | i18n (`t`) | t('selectBoothPrompt') -> inventory.selectBoothPrompt | VI: "Chọn quầy để kiểm tra và phân bổ" \| EN: "Select a booth to inspect and adjust its allocated stock" |
| [L395](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L395) | Văn bản JSX | text | Phân bổ kho: |
| [L398](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L398) | Văn bản JSX | text | Sự kiện: |
| [L407](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L407) | Văn bản JSX | text | món đã cấp |
| [L416](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L416) | Văn bản JSX | text | Sản phẩm & Biến thể |
| [L417](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L417) | Văn bản JSX | text | Mã loại |
| [L418](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L418) | Văn bản JSX | text | Tổng nhập |
| [L419](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L419) | Văn bản JSX | text | Giữ Online |
| [L420](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L420) | Văn bản JSX | text | Giữ Pre-order |
| [L421](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L421) | Văn bản JSX | text | Đã bán tại quầy |
| [L422](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L422) | Văn bản JSX | text | Tồn khả dụng bán |
| [L424](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L424) | Văn bản JSX | text | Cấp quầy ( |
| [L426](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L426) | Văn bản JSX | text | Trạng thái |
| [L427](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L427) | Văn bản JSX | text | Điều chỉnh cấp kho |
| [L476](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L476) | Chuỗi trong `{...}` | alt | Sản phẩm |
| [L489](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L489) | Văn bản JSX | text | Collab: |
| [L530](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L530) | Văn bản JSX | text | (Tại quầy: |
| [L546](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L546) | Văn bản JSX | text | Còn bán: |
| [L563](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L563) | Mẫu văn bản (`...`) | template | `Không thể giảm dưới số lượng đã bán (${currentSoldQty})` |
| [L563](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L563) | Chuỗi trong `{...}` | title | Giảm 1 món về kho tổng |
| [L592](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L592) | Mẫu văn bản (`...`) | template | `Nhập trực tiếp số lượng cấp cho quầy (Tối thiểu: ${currentSoldQty}, Tối đa: ${maxAllowedBoothAlloc})` |
| [L598](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L598) | Mẫu văn bản (`...`) | template | `Kho tổng đã hết hàng khả dụng cho bán offline (Còn ${centralStorageRemaining})` |
| [L598](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L598) | Chuỗi trong `{...}` | title | Cấp thêm 1 món từ kho tổng |
| [L606](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L606) | Thuộc tính HTML | title | Hàng kho Admin - Bạn không thể chỉnh sửa |
| [L608](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L608) | Văn bản JSX | text | (Kho Admin) |
| [L612](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L612) | Văn bản JSX | text | (Chỉ xem) |
| [L670](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L670) | Chuỗi trong `{...}` | alt | Sản phẩm |
| [L682](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L682) | Văn bản JSX | text | 🤝 |
| [L699](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L699) | Chuỗi trong `{...}` | literal | Đang cấp quầy |
| [L699](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L699) | Chuỗi trong `{...}` | literal | Chưa cấp |
| [L707](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L707) | Văn bản JSX | text | Số lượng (Tổng nhập): |
| [L711](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L711) | Văn bản JSX | text | Giữ Online: |
| [L715](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L715) | Văn bản JSX | text | Preord / Giữ chỗ: |
| [L719](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L719) | Văn bản JSX | text | Đã bán offline: |
| [L721](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L721) | Mẫu văn bản (`...`) | template | `(Quầy: ${currentSoldQty})` |
| [L725](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L725) | Văn bản JSX | text | Tồn bán offline: |
| [L729](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L729) | Văn bản JSX | text | Hạn mức quầy: |
| [L731](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L731) | Văn bản JSX | text | (Còn: |
| [L739](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L739) | Chuỗi trong `{...}` | literal | Điều chuyển số lượng: |
| [L740](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L740) | Chuỗi trong `{...}` | literal | Hạn mức kho: |
| [L749](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L749) | Mẫu văn bản (`...`) | template | `Không thể giảm dưới số lượng đã bán (${currentSoldQty})` |
| [L749](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L749) | Chuỗi trong `{...}` | title | Giảm 1 món |
| [L776](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L776) | Mẫu văn bản (`...`) | template | `Nhập trực tiếp số lượng cấp cho quầy (Tối thiểu: ${currentSoldQty}, Tối đa: ${maxAllowedBoothAlloc})` |
| [L784](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L784) | Mẫu văn bản (`...`) | template | `Kho tổng đã hết hàng khả dụng cho bán offline (Còn ${centralStorageRemaining})` |
| [L784](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L784) | Chuỗi trong `{...}` | title | Cấp thêm 1 món |
| [L790](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L790) | Thuộc tính HTML | title | Hàng kho Admin - Bạn không thể chỉnh sửa |
| [L792](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L792) | Văn bản JSX | text | (Kho Admin) |
| [L796](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L796) | Văn bản JSX | text | (Chỉ xem) |

##### 📄 Mẫu #1 — Hộp thoại `alert`/`confirm` ([page.tsx#L89](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L89))

```text
alert(
        `Không thể cấp thêm ${amount} sản phẩm!\nKho chỉ còn ${centralOfflineRemaining} sản phẩm khả dụng cho bán offline (Tổng nhập ${targetVariant.total_inventory} - Giữ Online ${targetVariant.online_preorder_quantity || 0} - Giữ Pre-order ${targetVariant.reserved_quantity || 0} - Đã cấp các quầy ${currentTotalAllocated}).`
      )
```

##### 📄 Mẫu #2 — Hộp thoại `alert`/`confirm` ([page.tsx#L151](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/inventory/page.tsx#L151))

```text
alert(
        `Không thể cấp ${targetAlloc} sản phẩm!\nKho chỉ còn tối đa ${maxPossibleAlloc} sản phẩm khả dụng cho quầy này (Tổng nhập: ${targetVariant.total_inventory}, Giữ Online: ${targetVariant.online_preorder_quantity || 0}, Giữ Pre-order: ${targetVariant.reserved_quantity || 0}, Các quầy khác: ${otherBoothsAlloc}).\nHệ thống đã tự động giới hạn ở mức ${maxPossibleAlloc}.`
      )
```


#### 7.6 Lịch sử Đơn hàng (`/dashboard/orders`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/orders/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx) — **70** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L93](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L93) | Chuỗi JS / Fallback | literal | Gian hàng |
| [L94](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L94) | Chuỗi JS / Fallback | literal | VND |
| [L104](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L104) | Văn bản JSX | text | Đơn hàng & Giao dịch |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L107) | Mẫu văn bản (`...`) | template | `${realOrders.length} đơn thực tế` |
| [L109](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L109) | Mẫu văn bản (`...`) | template | `${testOrders.length} đơn test` |
| [L110](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L110) | Mẫu văn bản (`...`) | template | `${filteredOrders.length} đơn` |
| [L114](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L114) | Văn bản JSX | text | Lịch sử toàn bộ các giao dịch phát sinh qua máy POS từ tất cả quầy bán của sự kiện. |
| [L123](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L123) | Thuộc tính HTML | title | Xuất danh sách đơn hàng và dữ liệu vận hành ra file Excel |
| [L126](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L126) | Văn bản JSX | text | Xuất Excel (.xlsx) |
| [L136](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L136) | Văn bản JSX | text | Dữ liệu thử nghiệm (Sandbox): |
| [L136](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L136) | Văn bản JSX | text | Bạn đang xem |
| [L136](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L136) | Văn bản JSX | text | đơn hàng TEST phát sinh khi chạy thử POS. Các đơn hàng này |
| [L136](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L136) | Văn bản JSX | text | hoàn toàn không được tính vào doanh thu thực tế |
| [L144](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L144) | Hộp thoại `alert`/`confirm` | confirm | confirm('Bạn có muốn xóa toàn bộ các đơn hàng thử nghiệm để làm sạch danh sách đơn?') |
| [L151](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L151) | Văn bản JSX | text | Xóa đơn test |
| [L159](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L159) | Văn bản JSX | text | Về đơn thực tế |
| [L170](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L170) | Thuộc tính HTML | placeholder | Tìm theo mã đơn hoặc ghi chú... |
| [L183](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L183) | Văn bản JSX | text | Tất cả sự kiện (Dữ liệu thực tế) |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L184) | Thuộc tính HTML | label | Sự kiện thực tế |
| [L192](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L192) | Thuộc tính HTML | label | Thử nghiệm / Sandbox (Tách biệt) |
| [L195](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L195) | Văn bản JSX | text | 🧪 |
| [L208](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L208) | Văn bản JSX | text | Tất cả hình thức |
| [L209](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L209) | Văn bản JSX | text | Tiền mặt |
| [L210](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L210) | Văn bản JSX | text | VietQR |
| [L211](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L211) | Văn bản JSX | text | Cổng thanh toán |
| [L220](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L220) | Văn bản JSX | text | Chưa có đơn hàng nào phù hợp |
| [L222](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L222) | Văn bản JSX | text | Đơn hàng tạo từ POS tại các quầy bán sẽ tự động tổng hợp tại đây. |
| [L233](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L233) | Văn bản JSX | text | Mã đơn |
| [L234](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L234) | Văn bản JSX | text | Thời gian |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L235) | Văn bản JSX | text | Sự kiện & Quầy |
| [L236](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L236) | Văn bản JSX | text | Hình thức |
| [L237](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L237) | Văn bản JSX | text | Đồng bộ |
| [L238](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L238) | Văn bản JSX | text | Tổng tiền |
| [L239](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L239) | Văn bản JSX | text | Chi tiết |
| [L255](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L255) | Văn bản JSX | text | Thử nghiệm |
| [L262](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L262) | Văn bản JSX | text | Ảnh nhận hàng |
| [L281](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L281) | Chuỗi trong `{...}` | literal | Tiền mặt |
| [L281](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L281) | Chuỗi trong `{...}` | literal | VietQR |
| [L290](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L290) | Chuỗi trong `{...}` | literal | Đã đồng bộ |
| [L290](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L290) | Chuỗi trong `{...}` | literal | Chờ đồng bộ |
| [L295](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L295) | Chuỗi trong `{...}` | literal | VND |
| [L330](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L330) | Văn bản JSX | text | Thử nghiệm |
| [L338](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L338) | Chuỗi trong `{...}` | literal | Đã đồng bộ |
| [L338](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L338) | Chuỗi trong `{...}` | literal | Chờ đồng bộ |
| [L355](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L355) | Chuỗi trong `{...}` | literal | Tiền mặt |
| [L355](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L355) | Chuỗi trong `{...}` | literal | VietQR |
| [L358](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L358) | Chuỗi trong `{...}` | literal | VND |
| [L369](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L369) | Văn bản JSX | text | Chi tiết |
| [L383](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L383) | Mẫu văn bản (`...`) | template | `Chi tiết Đơn hàng: ${selectedOrder?.order_number}` |
| [L384](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L384) | Thuộc tính HTML | description | Thông tin chi tiết các món hàng và hình thức thanh toán. |
| [L390](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L390) | Văn bản JSX | text | Thời gian tạo: |
| [L394](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L394) | Văn bản JSX | text | Hình thức thanh toán: |
| [L396](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L396) | Chuỗi trong `{...}` | literal | Tiền mặt |
| [L396](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L396) | Chuỗi trong `{...}` | literal | Quét mã VietQR |
| [L400](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L400) | Văn bản JSX | text | Mã Idempotency: |
| [L409](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L409) | Văn bản JSX | text | Sản phẩm trong đơn |
| [L422](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L422) | Văn bản JSX | text | • Mã loại: |
| [L427](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L427) | Chuỗi trong `{...}` | literal | VND |
| [L430](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L430) | Văn bản JSX | text | x |
| [L430](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L430) | Chuỗi trong `{...}` | literal | VND |
| [L441](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L441) | Văn bản JSX | text | Tổng thanh toán: |
| [L443](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L443) | Chuỗi trong `{...}` | literal | VND |
| [L449](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L449) | Văn bản JSX | text | Tiền mặt khách đưa: |
| [L451](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L451) | Chuỗi trong `{...}` | literal | VND |
| [L455](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L455) | Văn bản JSX | text | Tiền đã thối lại: |
| [L457](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L457) | Chuỗi trong `{...}` | literal | VND |
| [L468](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L468) | Văn bản JSX | text | Ảnh Minh Chứng Nhận Hàng (Đơn Đặt Trước): |
| [L474](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L474) | Thuộc tính HTML | alt | Minh chứng nhận hàng |
| [L490](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L490) | Văn bản JSX | text | Xem & In Hóa Đơn Nhiệt |
| [L499](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/orders/page.tsx#L499) | Văn bản JSX | text | Đóng |


#### 7.7 Cấu hình Thanh toán VietQR (`/dashboard/payments`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/payments/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx) — **36** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L85](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L85) | Văn bản JSX | text | Phương thức & Cấu hình Thanh toán |
| [L88](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L88) | Văn bản JSX | text | VietQR / Tiền mặt |
| [L92](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L92) | Văn bản JSX | text | Cấu hình thông tin ngân hàng thụ hưởng để sinh mã VietQR tự động trên toàn bộ máy POS. |
| [L101](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L101) | Văn bản JSX | text | Chuyển khoản VietQR |
| [L105](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L105) | Chuỗi trong `{...}` | literal | VND |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L107) | Văn bản JSX | text | Doanh thu thực tế vào tài khoản |
| [L112](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L112) | Văn bản JSX | text | Tiền mặt tại két (Cash) |
| [L116](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L116) | Chuỗi trong `{...}` | literal | VND |
| [L118](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L118) | Văn bản JSX | text | Thu ngân giữ tại quầy thực tế |
| [L123](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L123) | Văn bản JSX | text | Cổng / Thẻ POS |
| [L127](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L127) | Chuỗi trong `{...}` | literal | VND |
| [L129](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L129) | Văn bản JSX | text | Qua thiết bị thanh toán ngoài |
| [L139](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L139) | Văn bản JSX | text | Hệ thống đã tự động cách ly |
| [L139](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L139) | Văn bản JSX | text | đơn hàng thử nghiệm ( |
| [L139](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L139) | Chuỗi trong `{...}` | literal | VND |
| [L139](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L139) | Văn bản JSX | text | khỏi dòng tiền thực tế tại quầy để đảm bảo số liệu kế toán chính xác. |
| [L149](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L149) | Văn bản JSX | text | Đã cập nhật mã VietQR thành công! |
| [L149](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L149) | Văn bản JSX | text | Toàn bộ các vai trò (Thu ngân máy POS, Nhân viên, Quản trị) và thiết bị khác đều đã đồng bộ tức thì. |
| [L159](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L159) | Văn bản JSX | text | Cấu hình Mã VietQR Nhận tiền tại quầy |
| [L162](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L162) | Văn bản JSX | text | Hệ thống tự động nhúng số tiền và mã hóa đơn vào mã QR, khách hàng quét là hiện đúng số tiền và thông tin tour. |
| [L171](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L171) | Văn bản JSX | text | Mã Ngân hàng (BIN / Code) |
| [L179](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L179) | Văn bản JSX | text | MB Bank (Quân Đội) |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L180) | Văn bản JSX | text | Vietcombank |
| [L181](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L181) | Văn bản JSX | text | Techcombank |
| [L183](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L183) | Văn bản JSX | text | VPBank |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L184) | Văn bản JSX | text | TPBank |
| [L186](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L186) | Văn bản JSX | text | VietinBank |
| [L192](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L192) | Văn bản JSX | text | Số tài khoản nhận tiền |
| [L197](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L197) | Thuộc tính HTML | placeholder | VD: 0987654321 |
| [L206](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L206) | Văn bản JSX | text | Tên Chủ tài khoản (Không dấu) |
| [L211](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L211) | Thuộc tính HTML | placeholder | VD: NGUYEN VAN A |
| [L227](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L227) | Thuộc tính HTML | alt | VietQR Demo |
| [L233](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L233) | Văn bản JSX | text | Xem trước mã VietQR tại quầy |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L235) | Văn bản JSX | text | Khi thu ngân bấm thanh toán trên POS, mã QR này sẽ hiển thị kèm chính xác số tiền của giỏ hàng và mã đơn để khách chỉ cần quét và xác nhận chuyển khoản. |
| [L239](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L239) | Văn bản JSX | text | Chuẩn VietQR liên ngân hàng Napas247 |
| [L247](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/payments/page.tsx#L247) | Văn bản JSX | text | Lưu thông tin ngân hàng |


#### 7.8 Nhân sự & Phân quyền (`/dashboard/team`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/team/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx) — **68** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L67](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L67) | Chuỗi JS / Fallback | literal | Vui lòng nhập tên đối tác / thương hiệu Collab. |
| [L80](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L80) | Chuỗi JS / Fallback | literal | Lỗi tạo tài khoản |
| [L85](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L85) | Chuỗi JS / Fallback | literal | Admin |
| [L89](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L89) | Mẫu văn bản (`...`) | template | `Tài khoản: ${username}` |
| [L90](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L90) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Admin cấp tài khoản mới "${username}" (${fullName.trim() \|\| username}...` |
| [L92](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L92) | Chuỗi JS / Fallback | field_label | Tên đăng nhập |
| [L93](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L93) | Chuỗi JS / Fallback | field_label | Vai trò |
| [L94](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L94) | Chuỗi JS / Fallback | field_label | Đối tác |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L107) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #2** bên dưới:_ ``EventMate - Thông tin đăng nhập:\n- Đường dẫn: ${window.location.orig...` |
| [L116](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L116) | Chuỗi JS / Fallback | literal | Chủ sở hữu (Owner) |
| [L118](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L118) | Chuỗi JS / Fallback | literal | Quản trị viên (Admin) |
| [L120](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L120) | Chuỗi JS / Fallback | literal | Quản lý quầy (Manager) |
| [L122](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L122) | Chuỗi JS / Fallback | literal | Thu ngân POS (Cashier) |
| [L124](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L124) | Chuỗi JS / Fallback | literal | Nhân viên kho (Inventory) |
| [L126](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L126) | Chuỗi JS / Fallback | literal | Đối tác Collab (Quản trị độc lập) |
| [L128](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L128) | Chuỗi JS / Fallback | literal | Khách xem (Viewer) |
| [L151](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L151) | Văn bản JSX | text | Đội ngũ & Cấp tài khoản Nhân sự |
| [L154](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L154) | Văn bản JSX | text | tài khoản |
| [L158](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L158) | Văn bản JSX | text | Quản trị viên trực tiếp tạo tài khoản & mật khẩu để phát cho nhân viên, trợ lý và thu ngân. |
| [L173](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L173) | Văn bản JSX | text | Tạo tài khoản & Mật khẩu |
| [L178](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L178) | Văn bản JSX | text | Chế độ Chỉ xem (Không có quyền tạo tài khoản) |
| [L187](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L187) | Văn bản JSX | text | Phân cấp quyền hạn trong hệ thống |
| [L191](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L191) | Văn bản JSX | text | Admin / Owner: |
| [L192](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L192) | Văn bản JSX | text | Toàn quyền quản lý, tạo account + mật khẩu phát cho nhân viên, xem & xuất doanh thu. |
| [L195](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L195) | Văn bản JSX | text | Thu ngân (Cashier): |
| [L196](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L196) | Văn bản JSX | text | Chỉ được mở màn hình POS (`/pos`) để bán hàng và quét mã VietQR. Không được sửa giá hay kho. |
| [L199](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L199) | Văn bản JSX | text | Khách xem (Viewer / Guest): |
| [L200](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L200) | Văn bản JSX | text | Chỉ được phép xem báo cáo đối soát. Bị chặn mọi quyền thêm, sửa, xóa dữ liệu. |
| [L211](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L211) | Văn bản JSX | text | Danh sách Tài khoản & Mật khẩu Đã Cấp |
| [L214](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L214) | Văn bản JSX | text | Các tài khoản có thể đăng nhập trực tiếp tại trang `/login` |
| [L244](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L244) | Văn bản JSX | text | Đối tác: |
| [L249](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L249) | Văn bản JSX | text | Admin Chính |
| [L256](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L256) | Văn bản JSX | text | Tài khoản: |
| [L261](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L261) | Văn bản JSX | text | Mật khẩu: |
| [L269](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L269) | Chuỗi trong `{...}` | title | Ẩn mật khẩu |
| [L269](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L269) | Chuỗi trong `{...}` | title | Hiện mật khẩu |
| [L285](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L285) | Thuộc tính HTML | title | Sao chép tên đăng nhập và mật khẩu để gửi nhân sự |
| [L290](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L290) | Văn bản JSX | text | Đã sao chép |
| [L295](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L295) | Văn bản JSX | text | Gửi thông tin |
| [L306](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L306) | Hộp thoại `alert`/`confirm` | confirm | confirm(`Bạn có chắc muốn xóa tài khoản "${acc.username}"?`) |
| [L309](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L309) | Chuỗi JS / Fallback | literal | Admin |
| [L313](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L313) | Mẫu văn bản (`...`) | template | `Tài khoản: ${acc.username}` |
| [L314](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L314) | Mẫu văn bản (`...`) | template | `Admin đã xóa tài khoản nhân viên "${acc.username}" (${acc.fullName}).` |
| [L318](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L318) | Thuộc tính HTML | title | Xóa tài khoản nhân viên |
| [L334](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L334) | Thuộc tính HTML | title | Tạo Tài Khoản & Mật Khẩu Cho Nhân Sự |
| [L335](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L335) | Thuộc tính HTML | description | Admin trực tiếp đặt tên đăng nhập và mật khẩu để phát cho trợ lý hoặc thu ngân. |
| [L346](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L346) | Văn bản JSX | text | Tên nhân viên / Trợ lý |
| [L351](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L351) | Thuộc tính HTML | placeholder | VD: Nguyễn Văn Thu Ngân, Trợ Lý Minh... |
| [L361](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L361) | Văn bản JSX | text | Tên đăng nhập (Username) |
| [L366](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L366) | Thuộc tính HTML | placeholder | VD: thungan01, trolytour... |
| [L375](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L375) | Văn bản JSX | text | Mật khẩu đăng nhập |
| [L381](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L381) | Thuộc tính HTML | placeholder | Tối thiểu 6 ký tự... |
| [L391](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L391) | Văn bản JSX | text | Phân quyền nhiệm vụ |
| [L399](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L399) | Văn bản JSX | text | Thu ngân (Cashier) — Chỉ bán hàng tại màn hình POS |
| [L400](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L400) | Văn bản JSX | text | Quản lý (Manager) — Quản lý sự kiện, quầy và theo dõi kho |
| [L401](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L401) | Văn bản JSX | text | Nhân viên kho (Inventory) — Chỉ quản lý và điều chuyển tồn kho |
| [L402](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L402) | Văn bản JSX | text | Đối tác Collab (Collab Partner) — Quản trị sản phẩm & kho hàng riêng, không can thiệp kho Admin |
| [L403](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L403) | Văn bản JSX | text | Khách xem (Viewer) — Chỉ xem báo cáo, không được chỉnh sửa |
| [L404](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L404) | Văn bản JSX | text | Quản trị viên (Admin) — Toàn quyền như Owner |
| [L411](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L411) | Văn bản JSX | text | Tên đối tác / Thương hiệu Collab |
| [L416](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L416) | Thuộc tính HTML | placeholder | VD: GenZ Studio, The Cassette, Brand X... |
| [L422](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L422) | Văn bản JSX | text | 🔒 Đối tác Collab sẽ chỉ được phép quản trị sản phẩm và điều phối kho hàng thuộc thương hiệu này. Kho hàng của Admin được bảo vệ an toàn (Chỉ đọc). |
| [L428](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L428) | Văn bản JSX | text | 💡 Lưu ý bảo mật: |
| [L430](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L430) | Văn bản JSX | text | Sau khi tạo, bạn có thể bấm nút |
| [L430](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L430) | Văn bản JSX | text | &ldquo;Gửi thông tin&rdquo; |
| [L430](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L430) | Văn bản JSX | text | để sao chép tin nhắn định dạng sẵn và gửi qua Zalo/Messenger cho nhân viên. |
| [L441](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L441) | Văn bản JSX | text | Hủy |
| [L444](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L444) | Văn bản JSX | text | Tạo & Lưu tài khoản |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([page.tsx#L90](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L90))

```text
`Admin cấp tài khoản mới "${username}" (${fullName.trim() || username}) với vai trò "${getRoleLabel(role)}"${role === 'collab_partner' ? ` [Đối tác: ${collabPartnerName}]` : ''}.`
```

##### 📄 Mẫu #2 — Mẫu văn bản (`...`) ([page.tsx#L107](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L107))

```text
`EventMate - Thông tin đăng nhập:\n- Đường dẫn: ${window.location.origin}/login\n- Tên đăng nhập: ${account.username}\n- Mật khẩu: ${account.password}\n- Vai trò: ${getRoleLabel(account.role)}${account.collabPartnerName ? `\n- Đối tác: ${account.collabPartnerName} (Chỉ quản trị hàng bán của bản thân)` : ''}`
```


#### 7.9 Nhật ký Hoạt động (`/dashboard/logs`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/logs/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx) — **94** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L131](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L131) | Mẫu văn bản (`...`) | template | `eventmate-audit-logs-${new Date().toISOString().slice(0, 10)}.json` |
| [L186](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L186) | Văn bản JSX | text | + Hàng Collab mới |
| [L192](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L192) | Văn bản JSX | text | 🔄 Đồng bộ Collab |
| [L198](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L198) | Văn bản JSX | text | ⚡ Chỉnh đặt trước |
| [L204](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L204) | Văn bản JSX | text | 📦 Điều chỉnh kho |
| [L210](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L210) | Văn bản JSX | text | + Thêm mới |
| [L216](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L216) | Văn bản JSX | text | ✎ Chỉnh sửa |
| [L223](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L223) | Văn bản JSX | text | 🗑 Đã xóa |
| [L229](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L229) | Văn bản JSX | text | 🛒 Đơn POS |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L235) | Văn bản JSX | text | 🔑 Cấp tài khoản |
| [L259](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L259) | Văn bản JSX | text | Khu vực Giám Sát & Nhật Ký Hoạt Động (Admin Only) |
| [L262](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L262) | Văn bản JSX | text | Nhật ký lưu vết thao tác (Audit Log) chứa thông tin bảo mật về toàn bộ lịch sử chỉnh sửa, xóa hàng, điều chỉnh kho của Đối tác Collab và Nhân viên. |
| [L268](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L268) | Văn bản JSX | text | Tài khoản hiện tại: |
| [L269](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L269) | Chuỗi trong `{...}` | literal | Khách xem |
| [L272](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L272) | Văn bản JSX | text | Vai trò hiện tại: |
| [L274](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L274) | Văn bản JSX | text | (Không đủ quyền) |
| [L278](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L278) | Văn bản JSX | text | Tài khoản Quản trị viên chính: |
| [L280](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L280) | Văn bản JSX | text | Tuanadminvippro666 & HKT87@123 |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L289) | Văn bản JSX | text | Đăng nhập bằng tài khoản Quản trị viên (Admin) |
| [L294](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L294) | Văn bản JSX | text | Quay lại Bảng tổng quan |
| [L313](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L313) | Văn bản JSX | text | Nhật Ký & Tra Cứu Hoạt Động (Audit Log) |
| [L317](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L317) | Văn bản JSX | text | Ghi nhận thời gian thực |
| [L321](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L321) | Văn bản JSX | text | Dành riêng cho Quản trị viên: Tra cứu toàn bộ lịch sử Đối tác Collab và Staff nhân sự làm gì, thêm gì, chỉnh gì, xóa gì. |
| [L332](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L332) | Thuộc tính HTML | title | Tải file JSON toàn bộ nhật ký |
| [L335](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L335) | Văn bản JSX | text | Xuất JSON |
| [L343](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L343) | Thuộc tính HTML | title | Khôi phục lại dữ liệu log mẫu để đối soát |
| [L346](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L346) | Văn bản JSX | text | Nạp log mẫu |
| [L354](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L354) | Thuộc tính HTML | title | Xóa sạch toàn bộ lịch sử log |
| [L357](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L357) | Văn bản JSX | text | Xóa nhật ký |
| [L367](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L367) | Văn bản JSX | text | Tổng Lượt Thao Tác |
| [L375](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L375) | Văn bản JSX | text | Đã lưu trong phiên làm việc |
| [L384](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L384) | Văn bản JSX | text | Đối Tác Collab Thao Tác |
| [L392](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L392) | Văn bản JSX | text | Thêm hàng, nạp kho, đồng bộ |
| [L401](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L401) | Văn bản JSX | text | Staff & Thu Ngân Làm Việc |
| [L409](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L409) | Văn bản JSX | text | Bán POS, kiểm kê, chỉnh kho |
| [L418](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L418) | Văn bản JSX | text | Chỉnh Sửa & Xóa Nhạy Cảm |
| [L426](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L426) | Văn bản JSX | text | Sửa giá, xóa món, chỉnh VIP hold |
| [L438](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L438) | Thuộc tính HTML | placeholder | Tìm kiếm theo tên nhân viên, đối tác, sản phẩm, mã đơn hoặc nội dung... |
| [L453](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L453) | Văn bản JSX | text | 👤 Tất cả đối tượng |
| [L454](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L454) | Văn bản JSX | text | 🤝 Chỉ Đối tác Collab |
| [L455](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L455) | Văn bản JSX | text | 👔 Chỉ Staff / Trợ lý / Kho |
| [L456](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L456) | Văn bản JSX | text | 🛒 Chỉ Thu ngân POS |
| [L457](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L457) | Văn bản JSX | text | 🛡️ Chỉ Quản trị viên (Admin) |
| [L466](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L466) | Văn bản JSX | text | ⚡ Tất cả hành động |
| [L467](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L467) | Văn bản JSX | text | + Đóng góp hàng Collab |
| [L468](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L468) | Văn bản JSX | text | ⚡ Chỉnh Đặt trước / VIP hold |
| [L469](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L469) | Văn bản JSX | text | 📦 Bổ sung / Điều chỉnh kho |
| [L470](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L470) | Văn bản JSX | text | 🛒 Tạo đơn hàng POS |
| [L471](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L471) | Văn bản JSX | text | + Thêm mới |
| [L472](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L472) | Văn bản JSX | text | ✎ Chỉnh sửa |
| [L473](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L473) | Văn bản JSX | text | 🗑 Xóa dữ liệu |
| [L474](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L474) | Văn bản JSX | text | 🔑 Cấp tài khoản nhân sự |
| [L475](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L475) | Văn bản JSX | text | 🔄 Đồng bộ gói hàng |
| [L484](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L484) | Văn bản JSX | text | 🕒 Tất cả thời gian |
| [L485](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L485) | Văn bản JSX | text | Hôm nay / 24 giờ qua |
| [L486](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L486) | Văn bản JSX | text | 7 ngày gần nhất |
| [L494](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L494) | Văn bản JSX | text | Đang lọc: |
| [L497](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L497) | Văn bản JSX | text | Từ khóa: &ldquo; |
| [L503](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L503) | Văn bản JSX | text | × |
| [L509](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L509) | Văn bản JSX | text | Vai trò: |
| [L515](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L515) | Văn bản JSX | text | × |
| [L521](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L521) | Văn bản JSX | text | Hành động: |
| [L527](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L527) | Văn bản JSX | text | × |
| [L533](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L533) | Văn bản JSX | text | Thời gian: |
| [L539](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L539) | Văn bản JSX | text | × |
| [L553](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L553) | Văn bản JSX | text | Xóa tất cả bộ lọc |
| [L565](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L565) | Văn bản JSX | text | Dòng Nhật Ký Hoạt Động Chi Tiết |
| [L568](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L568) | Văn bản JSX | text | Hiển thị |
| [L568](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L568) | Văn bản JSX | text | bản ghi thao tác |
| [L577](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L577) | Văn bản JSX | text | Không tìm thấy thao tác nào phù hợp |
| [L580](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L580) | Văn bản JSX | text | Thử thay đổi từ khóa tìm kiếm hoặc chọn lại bộ lọc hành động / đối tượng bên trên. |
| [L618](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L618) | Văn bản JSX | text | Thay đổi: |
| [L672](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L672) | Văn bản JSX | text | Chi tiết |
| [L676](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L676) | Thuộc tính HTML | title | Xóa dòng log này |
| [L694](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L694) | Thuộc tính HTML | title | Chi Tiết Bản Ghi Nhật Ký Thao Tác |
| [L695](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L695) | Thuộc tính HTML | description | Toàn bộ thông tin đối soát kỹ thuật được hệ thống ghi nhận. |
| [L701](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L701) | Văn bản JSX | text | Mã bản ghi (Log ID): |
| [L705](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L705) | Văn bản JSX | text | Thời gian chính xác: |
| [L709](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L709) | Văn bản JSX | text | Đối tượng thực hiện: |
| [L715](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L715) | Văn bản JSX | text | Hành động: |
| [L719](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L719) | Văn bản JSX | text | Thực thể tác động: |
| [L727](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L727) | Văn bản JSX | text | Mô tả đầy đủ: |
| [L735](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L735) | Văn bản JSX | text | Dữ liệu thay đổi (Diff): |
| [L740](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L740) | Văn bản JSX | text | Trường dữ liệu |
| [L741](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L741) | Văn bản JSX | text | Giá trị cũ |
| [L742](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L742) | Văn bản JSX | text | Giá trị mới |
| [L769](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L769) | Văn bản JSX | text | Đóng |
| [L780](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L780) | Thuộc tính HTML | title | Xác nhận Xóa Nhật Ký Hoạt Động |
| [L781](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L781) | Thuộc tính HTML | description | Bạn có chắc chắn muốn xóa toàn bộ lịch sử thao tác không? Hành động này không thể hoàn tác. |
| [L787](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L787) | Văn bản JSX | text | Toàn bộ lịch sử đối soát và hoạt động của đối tác collab và nhân viên sẽ bị xóa khỏi bộ nhớ. Hãy cân nhắc |
| [L787](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L787) | Văn bản JSX | text | Xuất file JSON |
| [L787](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L787) | Văn bản JSX | text | trước khi xóa! |
| [L797](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L797) | Văn bản JSX | text | Hủy bỏ |
| [L808](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L808) | Văn bản JSX | text | Xóa sạch nhật ký ngay |


#### 7.10 Báo lỗi & Đề xuất Tính năng (`/dashboard/feedback`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx) — **89** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L88](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L88) | Chuỗi JS / Fallback | literal | # 📋 KẾ HOẠCH UPDATE PHẦN MỀM EVENTMATE |
| [L89](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L89) | Mẫu văn bản (`...`) | template | `*Thời gian tổng hợp: ${new Date().toLocaleString('vi-VN')}*\n\n` |
| [L91](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L91) | Chuỗi JS / Fallback | literal | ## 🐞 Lỗi cần sửa (Bugs to fix): |
| [L93](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L93) | Chuỗi JS / Fallback | literal | - [x] Chưa có lỗi nào tồn đọng! |
| [L96](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L96) | Mẫu văn bản (`...`) | template | `- [ ] **[${b.severity.toUpperCase()}]** ${b.title} (${b.module}) — Người báo: ${b.reporter_name \|\| 'N/A'}\n` |
| [L100](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L100) | Chuỗi JS / Fallback | literal | _Xem **Mẫu #1** bên dưới:_ `...` |
| [L102](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L102) | Chuỗi JS / Fallback | literal | - Không có tính năng mới nào đang chờ. |
| [L109](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L109) | Chuỗi JS / Fallback | literal | _Xem **Mẫu #2** bên dưới:_ `...` |
| [L111](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L111) | Mẫu văn bản (`...`) | template | `- [x] ${r.title} (${r.admin_notes \|\| 'Đã update thành công'})\n` |
| [L124](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L124) | Mẫu văn bản (`...`) | template | `eventmate_feedback_export_${Date.now()}.json` |
| [L134](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L134) | Văn bản JSX | text | Báo lỗi |
| [L141](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L141) | Văn bản JSX | text | Góp ý tính năng |
| [L148](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L148) | Văn bản JSX | text | Trải nghiệm (UX) |
| [L155](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L155) | Văn bản JSX | text | Ý kiến |
| [L166](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L166) | Văn bản JSX | text | 🚨 Khẩn cấp |
| [L172](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L172) | Văn bản JSX | text | Cao |
| [L178](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L178) | Văn bản JSX | text | Bình thường |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L184) | Văn bản JSX | text | Thấp |
| [L195](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L195) | Văn bản JSX | text | ⏳ Chờ xử lý |
| [L201](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L201) | Văn bản JSX | text | ⚙️ Đang xử lý |
| [L207](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L207) | Văn bản JSX | text | ✅ Đã hoàn thành |
| [L213](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L213) | Văn bản JSX | text | Đã đóng |
| [L226](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L226) | Văn bản JSX | text | Hộp thư Báo cáo Lỗi & Góp ý Cải thiện |
| [L229](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L229) | Văn bản JSX | text | phản hồi |
| [L233](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L233) | Văn bản JSX | text | Tổng hợp toàn bộ phản hồi từ người dùng, thu ngân và đối tác để đối chiếu và lên kế hoạch update web. |
| [L243](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L243) | Thuộc tính HTML | title | Sao chép toàn bộ danh sách lỗi và tính năng ra định dạng Markdown để lưu trữ |
| [L248](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L248) | Văn bản JSX | text | Đã chép danh sách! |
| [L253](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L253) | Văn bản JSX | text | Chép Kế hoạch Update |
| [L263](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L263) | Thuộc tính HTML | title | Tải file dữ liệu JSON |
| [L266](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L266) | Văn bản JSX | text | Xuất JSON |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L276) | Văn bản JSX | text | Gửi phản hồi mới |
| [L285](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L285) | Văn bản JSX | text | Tổng số phản hồi |
| [L293](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L293) | Văn bản JSX | text | Từ mọi nguồn và thiết bị |
| [L298](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L298) | Văn bản JSX | text | Lỗi cần fix |
| [L306](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L306) | Văn bản JSX | text | Đang chờ xử lý / kiểm tra |
| [L311](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L311) | Văn bản JSX | text | Ý tưởng tính năng |
| [L319](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L319) | Văn bản JSX | text | Đề xuất cải thiện từ người dùng |
| [L324](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L324) | Văn bản JSX | text | Đã giải quyết |
| [L332](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L332) | Văn bản JSX | text | Đã fix & đưa vào bản update |
| [L341](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L341) | Thuộc tính HTML | placeholder | Tìm theo tiêu đề, người gửi, module... |
| [L351](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L351) | Văn bản JSX | text | Loại: |
| [L358](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L358) | Văn bản JSX | text | Tất cả loại |
| [L359](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L359) | Văn bản JSX | text | 🐞 Báo lỗi (Bug) |
| [L360](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L360) | Văn bản JSX | text | 💡 Góp ý tính năng |
| [L361](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L361) | Văn bản JSX | text | ⚡ Trải nghiệm (UX) |
| [L362](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L362) | Văn bản JSX | text | 💬 Ý kiến khác |
| [L372](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L372) | Văn bản JSX | text | Tất cả trạng thái |
| [L373](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L373) | Văn bản JSX | text | Chờ xử lý |
| [L374](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L374) | Văn bản JSX | text | Đang xử lý |
| [L375](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L375) | Văn bản JSX | text | Đã hoàn thành |
| [L376](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L376) | Văn bản JSX | text | Đã đóng |
| [L386](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L386) | Văn bản JSX | text | Tất cả mức độ |
| [L387](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L387) | Văn bản JSX | text | 🚨 Khẩn cấp |
| [L388](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L388) | Văn bản JSX | text | Cao |
| [L389](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L389) | Văn bản JSX | text | Bình thường |
| [L390](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L390) | Văn bản JSX | text | Thấp |
| [L400](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L400) | Văn bản JSX | text | Danh sách tiếp nhận ( |
| [L400](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L400) | Văn bản JSX | text | mục) |
| [L403](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L403) | Văn bản JSX | text | Bấm vào từng mục để cập nhật tiến độ xử lý và ghi chú cho bản cập nhật mới |
| [L412](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L412) | Văn bản JSX | text | Không tìm thấy phản hồi nào phù hợp bộ lọc |
| [L415](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L415) | Văn bản JSX | text | Mọi ý kiến đóng góp từ máy POS hoặc Dashboard sẽ xuất hiện tại đây. |
| [L452](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L452) | Văn bản JSX | text | Ghi chú cập nhật: |
| [L459](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L459) | Văn bản JSX | text | Người báo: |
| [L459](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L459) | Chuỗi trong `{...}` | literal | Khách |
| [L472](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L472) | Văn bản JSX | text | Xem ảnh lỗi |
| [L486](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L486) | Văn bản JSX | text | Chờ xử lý |
| [L487](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L487) | Văn bản JSX | text | Đang xử lý |
| [L488](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L488) | Văn bản JSX | text | Đã hoàn thành |
| [L489](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L489) | Văn bản JSX | text | Đã đóng |
| [L498](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L498) | Văn bản JSX | text | Chi tiết |
| [L505](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L505) | Hộp thoại `alert`/`confirm` | confirm | confirm(`Bạn có chắc muốn xóa báo cáo "${item.title}"?`) |
| [L510](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L510) | Thuộc tính HTML | title | Xóa mục này |
| [L528](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L528) | Mẫu văn bản (`...`) | template | `Chi Tiết Phản Hồi — #${selectedItem.id}` |
| [L529](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L529) | Thuộc tính HTML | description | Cập nhật trạng thái và ghi chú xử lý để chuẩn bị tài liệu cập nhật phiên bản mới. |
| [L554](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L554) | Văn bản JSX | text | Ảnh minh chứng đính kèm: |
| [L559](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L559) | Thuộc tính HTML | alt | Screenshot |
| [L562](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L562) | Thuộc tính HTML | title | Bấm để xem phóng to |
| [L571](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L571) | Văn bản JSX | text | Người báo cáo: |
| [L578](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L578) | Văn bản JSX | text | Liên hệ: |
| [L584](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L584) | Văn bản JSX | text | Trang gặp lỗi: |
| [L590](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L590) | Văn bản JSX | text | Thiết bị & Màn hình: |
| [L602](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L602) | Văn bản JSX | text | Ghi chú xử lý / Kế hoạch update của Admin: |
| [L606](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L606) | Thuộc tính HTML | placeholder | VD: Đã fix trong bản build mới; hoặc Sẽ triển khai vào tuần tới... |
| [L627](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L627) | Văn bản JSX | text | Đánh dấu Đã hoàn thành |
| [L633](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L633) | Văn bản JSX | text | Đóng |
| [L643](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L643) | Văn bản JSX | text | Lưu ghi chú |
| [L656](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L656) | Thuộc tính HTML | title | Ảnh Minh Chứng Báo Cáo Lỗi |
| [L663](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L663) | Thuộc tính HTML | alt | Ảnh phóng to |
| [L669](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L669) | Văn bản JSX | text | Đóng ảnh |

##### 📄 Mẫu #1 — Chuỗi JS / Fallback ([page.tsx#L100](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L100))

```text

## 💡 Góp ý & Tính năng cần bổ sung (Features & Ideas):
```

##### 📄 Mẫu #2 — Chuỗi JS / Fallback ([page.tsx#L109](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L109))

```text

## ✅ Đã xử lý & Hoàn thành (Resolved):
```


#### 7.11 Thống kê Doanh thu & Xuất CSV (`/dashboard/analytics`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx) — **81** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L45](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L45) | Hộp thoại `alert`/`confirm` | alert | alert('Không có dữ liệu giao dịch để xuất') |
| [L50](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L50) | Chuỗi JS / Fallback | literal | Mã đơn hàng |
| [L51](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L51) | Chuỗi JS / Fallback | literal | Thời gian |
| [L52](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L52) | Chuỗi JS / Fallback | literal | Sự kiện |
| [L53](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L53) | Chuỗi JS / Fallback | literal | Gian hàng |
| [L54](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L54) | Chuỗi JS / Fallback | literal | Mô hình |
| [L55](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L55) | Chuỗi JS / Fallback | literal | Đối tác Collab |
| [L56](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L56) | Chuỗi JS / Fallback | literal | Phương thức thanh toán |
| [L57](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L57) | Chuỗi JS / Fallback | literal | Tạm tính |
| [L58](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L58) | Chuỗi JS / Fallback | literal | Giảm giá |
| [L59](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L59) | Chuỗi JS / Fallback | literal | Tổng thanh toán |
| [L70](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L70) | Chuỗi JS / Fallback | literal | Collab |
| [L71](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L71) | Mẫu văn bản (`...`) | template | `"${booth?.collab_partner \|\| ''}"` |
| [L84](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L84) | Mẫu văn bản (`...`) | template | `EventMate_BaoCaoDoanhThu_${new Date().toISOString().replace(/[:.]/g, '-')}.csv` |
| [L172](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L172) | Chuỗi JS / Fallback | literal | Gian hàng |
| [L173](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L173) | Chuỗi JS / Fallback | literal | VND |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L184) | Văn bản JSX | text | Báo cáo & Phân tích Doanh thu |
| [L187](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L187) | Văn bản JSX | text | Doanh thu thực tế |
| [L191](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L191) | Văn bản JSX | text | Tổng hợp dữ liệu bán hàng tại các quầy sự kiện, đối soát gian hàng Collab và xuất báo cáo kế toán. |
| [L201](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L201) | Thuộc tính HTML | title | Xuất file CSV phẳng cơ bản |
| [L204](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L204) | Văn bản JSX | text | Xuất CSV |
| [L212](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L212) | Thuộc tính HTML | title | Xuất trọn gói dữ liệu Sự kiện, Doanh thu, Quầy Collab & Tồn kho ra file Excel (.xlsx) |
| [L215](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L215) | Văn bản JSX | text | Xuất Excel (.xlsx) |
| [L225](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L225) | Văn bản JSX | text | Phạm vi sự kiện: |
| [L233](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L233) | Văn bản JSX | text | Tất cả sự kiện (Dữ liệu thực tế) |
| [L234](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L234) | Thuộc tính HTML | label | Dữ liệu thực tế |
| [L242](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L242) | Thuộc tính HTML | label | Thử nghiệm / Sandbox (Tách biệt) |
| [L245](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L245) | Văn bản JSX | text | 🧪 |
| [L256](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L256) | Văn bản JSX | text | Chế độ Sandbox (Test) |
| [L264](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L264) | Văn bản JSX | text | Doanh thu thực tế ( |
| [L264](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L264) | Văn bản JSX | text | sự kiện) |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L276) | Văn bản JSX | text | Dữ liệu thử nghiệm (Sandbox): |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L276) | Văn bản JSX | text | Doanh thu ( |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L276) | Chuỗi trong `{...}` | literal | VND |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L276) | Văn bản JSX | text | ) và |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L276) | Văn bản JSX | text | đơn hàng tại đây là số liệu TEST phát sinh khi chạy thử máy POS, |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L276) | Văn bản JSX | text | hoàn toàn không được cộng vào tổng doanh thu thực tế |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L276) | Văn bản JSX | text | của hệ thống. |
| [L284](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L284) | Hộp thoại `alert`/`confirm` | confirm | confirm('Bạn có muốn xóa toàn bộ các đơn hàng thử nghiệm để làm sạch dữ liệu test?') |
| [L291](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L291) | Văn bản JSX | text | Xóa đơn test |
| [L299](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L299) | Văn bản JSX | text | Về số liệu thật |
| [L308](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L308) | Văn bản JSX | text | Tổng doanh thu |
| [L310](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L310) | Chuỗi trong `{...}` | literal | VND |
| [L312](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L312) | Văn bản JSX | text | Đã thu qua các quầy |
| [L316](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L316) | Văn bản JSX | text | Tổng đơn hàng |
| [L317](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L317) | Văn bản JSX | text | đơn |
| [L318](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L318) | Văn bản JSX | text | Giao dịch thành công |
| [L322](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L322) | Văn bản JSX | text | Số lượng món đã bán |
| [L323](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L323) | Văn bản JSX | text | món |
| [L324](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L324) | Văn bản JSX | text | Merchandise xuất kho |
| [L328](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L328) | Văn bản JSX | text | Giá trị trung bình / đơn |
| [L330](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L330) | Chuỗi trong `{...}` | literal | VND |
| [L332](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L332) | Văn bản JSX | text | AOV theo phiên tour |
| [L341](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L341) | Văn bản JSX | text | Hiệu suất Bán hàng theo từng Gian hàng & Quầy bán |
| [L344](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L344) | Văn bản JSX | text | Theo dõi chi tiết doanh số từng quầy và phân bổ chia sẻ doanh thu đối tác Collab. |
| [L353](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L353) | Văn bản JSX | text | Gian hàng & Mã |
| [L354](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L354) | Văn bản JSX | text | Sự kiện |
| [L355](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L355) | Văn bản JSX | text | Mô hình |
| [L356](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L356) | Văn bản JSX | text | Số đơn |
| [L357](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L357) | Văn bản JSX | text | Món đã bán |
| [L359](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L359) | Văn bản JSX | text | Tổng doanh thu |
| [L362](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L362) | Văn bản JSX | text | Phần Đối tác Collab |
| [L365](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L365) | Văn bản JSX | text | Thực nhận Nghệ sĩ |
| [L385](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L385) | Văn bản JSX | text | Collab: |
| [L385](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L385) | Chuỗi trong `{...}` | literal | Đối tác |
| [L388](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L388) | Văn bản JSX | text | Chia: |
| [L393](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L393) | Văn bản JSX | text | Độc lập |
| [L407](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L407) | Chuỗi trong `{...}` | literal | VND |
| [L412](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L412) | Chuỗi trong `{...}` | literal | VND |
| [L417](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L417) | Chuỗi trong `{...}` | literal | VND |
| [L442](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L442) | Văn bản JSX | text | Collab |
| [L446](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L446) | Văn bản JSX | text | Độc lập |
| [L453](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L453) | Văn bản JSX | text | Tổng doanh thu: |
| [L455](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L455) | Chuỗi trong `{...}` | literal | VND |
| [L459](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L459) | Văn bản JSX | text | Đã bán: |
| [L461](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L461) | Văn bản JSX | text | đơn • |
| [L461](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L461) | Văn bản JSX | text | món |
| [L465](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L465) | Văn bản JSX | text | Trả đối tác: |
| [L467](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L467) | Chuỗi trong `{...}` | literal | VND |
| [L471](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L471) | Văn bản JSX | text | Thực nhận Artist: |
| [L473](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L473) | Chuỗi trong `{...}` | literal | VND |


#### 7.12 Cài đặt Hệ thống & Sao lưu (`/dashboard/settings`)
> Nguồn: [src/app/[locale]/(dashboard)/dashboard/settings/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx) — **136** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L42) | Thuộc tính dữ liệu | name | MBBank (Ngân hàng Quân Đội) |
| [L43](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L43) | Thuộc tính dữ liệu | name | Vietcombank (Ngoại thương Việt Nam) |
| [L44](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L44) | Thuộc tính dữ liệu | name | ACB (Á Châu) |
| [L45](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L45) | Thuộc tính dữ liệu | name | Techcombank (Kỹ Thương) |
| [L46](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L46) | Thuộc tính dữ liệu | name | VPBank (Việt Nam Thịnh Vượng) |
| [L47](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L47) | Thuộc tính dữ liệu | name | BIDV (Đầu tư và Phát triển VN) |
| [L48](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L48) | Thuộc tính dữ liệu | name | VIB (Quốc tế) |
| [L49](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L49) | Thuộc tính dữ liệu | name | TPBank (Tiên Phong) |
| [L60](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L60) | Chuỗi JS / Fallback | literal | HikaruStore |
| [L61](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L61) | Chuỗi JS / Fallback | literal | hikarustore |
| [L62](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L62) | Chuỗi JS / Fallback | literal | VND |
| [L63](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L63) | Chuỗi JS / Fallback | literal | Không gian bán hàng và phân phối merchandise chính hãng |
| [L65](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L65) | Chuỗi JS / Fallback | literal | Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng |
| [L69](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L69) | Chuỗi JS / Fallback | literal | Nguyễn Văn Tuấn |
| [L71](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L71) | Chuỗi JS / Fallback | literal | contact@hikarustore.vn |
| [L73](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L73) | Chuỗi JS / Fallback | literal | Gian Hàng HikaruStore, Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh |
| [L103](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L103) | Chuỗi JS / Fallback | literal | Kết nối Google Gemini AI thành công! |
| [L106](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L106) | Chuỗi JS / Fallback | literal | Không thể kết nối tới Google Gemini API. |
| [L110](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L110) | Chuỗi JS / Fallback | literal | Lỗi kết nối kiểm tra AI. |
| [L118](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L118) | Chuỗi JS / Fallback | literal | HikaruStore |
| [L119](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L119) | Chuỗi JS / Fallback | literal | hikarustore |
| [L120](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L120) | Chuỗi JS / Fallback | literal | VND |
| [L122](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L122) | Chuỗi JS / Fallback | literal | Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng |
| [L123](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L123) | Chuỗi JS / Fallback | literal | Nguyễn Văn Tuấn |
| [L125](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L125) | Chuỗi JS / Fallback | literal | contact@hikarustore.vn |
| [L126](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L126) | Chuỗi JS / Fallback | literal | Gian Hàng HikaruStore, Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh |
| [L143](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L143) | Chuỗi JS / Fallback | literal | HikaruStore |
| [L144](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L144) | Chuỗi JS / Fallback | literal | hikarustore |
| [L177](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L177) | Chuỗi JS / Fallback | appName | EventMate |
| [L196](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L196) | Mẫu văn bản (`...`) | template | `HikaruStore_Backup_${new Date().toISOString().slice(0, 10)}.json` |
| [L216](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L216) | Chuỗi JS / Fallback | literal | EventMate |
| [L217](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L217) | Hộp thoại `alert`/`confirm` | alert | alert('File sao lưu không hợp lệ hoặc không phải từ hệ thống EventMate.') |
| [L231](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L231) | Mẫu văn bản (`...`) | template | `Khôi phục thành công dữ liệu từ file sao lưu (${file.name})!` |
| [L234](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L234) | Hộp thoại `alert`/`confirm` | alert | alert('Có lỗi xảy ra khi đọc file sao lưu JSON. Vui lòng kiểm tra định dạng file.') |
| [L250](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L250) | Hộp thoại `alert`/`confirm` | confirm | _Xem **Mẫu #1** bên dưới:_ `confirm(...` |
| [L268](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L268) | Văn bản JSX | text | Cài Đặt Hệ Thống & Thông Tin Gian Hàng |
| [L270](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L270) | Chuỗi trong `{...}` | literal | VND |
| [L274](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L274) | Văn bản JSX | text | Cấu hình đồng bộ thông tin cá nhân, gian hàng, hotline, địa chỉ và mã VietQR cho toàn bộ hệ thống. |
| [L284](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L284) | Văn bản JSX | text | Trung tâm Đồng bộ Tự động — Điền 1 lần, hiển thị toàn diện: |
| [L287](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L287) | Văn bản JSX | text | Mọi thông tin cá nhân và tài khoản bạn chỉnh sửa bên dưới sẽ được tự động đồng bộ ngay lập tức sang: |
| [L288](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L288) | Văn bản JSX | text | (1) Gian hàng cho Khách xem |
| [L288](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L288) | Văn bản JSX | text | (Hotline, Zalo, địa chỉ, số tài khoản thanh toán online), |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L289) | Văn bản JSX | text | (2) Màn hình Bán hàng POS & Mã VietQR |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L289) | Văn bản JSX | text | , và |
| [L290](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L290) | Văn bản JSX | text | (3) Hóa đơn in nhiệt / Phiếu xuất hàng |
| [L290](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L290) | Văn bản JSX | text | . Bạn không cần phải chỉnh thủ công ở bất kỳ chỗ nào khác! |
| [L299](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L299) | Văn bản JSX | text | Đã lưu và đồng bộ toàn bộ thông tin thành công! |
| [L301](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L301) | Văn bản JSX | text | Gian hàng khách xem, hóa đơn in nhiệt và mã VietQR tại quầy POS đã nhận dữ liệu mới nhất. |
| [L314](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L314) | Văn bản JSX | text | 1. Thông Tin Gian Hàng & Thương Hiệu |
| [L317](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L317) | Văn bản JSX | text | Tên cửa hàng, định danh đường dẫn, tiền tệ và slogan hiển thị trên tiêu đề và hóa đơn. |
| [L325](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L325) | Văn bản JSX | text | Tên Gian Hàng / Cửa Hàng |
| [L330](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L330) | Thuộc tính HTML | placeholder | VD: HikaruStore |
| [L334](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L334) | Văn bản JSX | text | Tên xuất hiện trên tiêu đề web, bill in nhiệt và banner khách xem. |
| [L338](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L338) | Văn bản JSX | text | Định danh URL (Slug) |
| [L342](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L342) | Thuộc tính HTML | placeholder | hikarustore |
| [L351](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L351) | Văn bản JSX | text | Slogan / Thông Điệp Gian Hàng |
| [L354](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L354) | Thuộc tính HTML | placeholder | VD: Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng |
| [L358](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L358) | Văn bản JSX | text | Hiển thị tại đầu trang gian hàng khách và chân hóa đơn. |
| [L362](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L362) | i18n (`t`) | t('currency') -> settings.currency | VI: "Đơn vị tiền tệ" \| EN: "Default Currency" |
| [L369](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L369) | Văn bản JSX | text | VND (Việt Nam Đồng - ₫) |
| [L370](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L370) | Văn bản JSX | text | USD (US Dollar - $) |
| [L376](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L376) | Văn bản JSX | text | Mô tả Giới thiệu ngắn về Gian hàng |
| [L381](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L381) | Thuộc tính HTML | placeholder | Giới thiệu về gian hàng, tour diễn và các sản phẩm độc quyền... |
| [L394](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L394) | Văn bản JSX | text | 2. Thông Tin Chủ Quầy & Kênh Liên Hệ Khách Hàng |
| [L397](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L397) | Văn bản JSX | text | Thông tin liên hệ của bạn để khách gọi chốt đơn, chat Zalo, đặt cọc giữ đồ và hiển thị trên biên nhận. |
| [L406](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L406) | Văn bản JSX | text | Họ và Tên Chủ quầy / Người đại diện |
| [L411](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L411) | Thuộc tính HTML | placeholder | VD: Nguyễn Văn Tuấn |
| [L420](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L420) | Văn bản JSX | text | Số Điện Thoại / Hotline Tư Vấn & Đặt Hàng |
| [L425](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L425) | Thuộc tính HTML | placeholder | VD: 0988.776.655 |
| [L429](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L429) | Văn bản JSX | text | Khách bấm vào nút Hotline ở gian hàng sẽ gọi thẳng tới số này. |
| [L437](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L437) | Văn bản JSX | text | Địa chỉ Email Hỗ trợ / Hợp tác |
| [L442](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L442) | Thuộc tính HTML | placeholder | contact@hikarustore.vn |
| [L451](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L451) | Văn bản JSX | text | Link Chat Zalo / Facebook Tư Vấn Nhanh |
| [L455](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L455) | Thuộc tính HTML | placeholder | https://zalo.me/0988776655 |
| [L459](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L459) | Văn bản JSX | text | Gắn vào nút &quot;Nhắn Zalo đặt hàng ngay&quot; ở gian hàng khách xem. |
| [L466](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L466) | Văn bản JSX | text | Địa Chỉ Quầy Bán / Trụ Sở Gian Hàng |
| [L470](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L470) | Thuộc tính HTML | placeholder | VD: Gian Hàng HikaruStore, Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh |
| [L474](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L474) | Văn bản JSX | text | In trên chân hóa đơn bán hàng và thông tin liên hệ của trang web. |
| [L484](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L484) | Văn bản JSX | text | 3. Cấu Hình Tài Khoản Ngân Hàng & Mã VietQR Nhận Tiền |
| [L487](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L487) | Văn bản JSX | text | Mã VietQR động tự chèn số tiền và mã đơn trên máy POS và hỗ trợ khách chuyển khoản đặt cọc online. |
| [L495](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L495) | Văn bản JSX | text | Ngân Hàng Thụ Hưởng |
| [L513](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L513) | Văn bản JSX | text | Số Tài Khoản Nhận Tiền |
| [L519](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L519) | Thuộc tính HTML | placeholder | VD: 0988776655 |
| [L527](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L527) | Văn bản JSX | text | Tên Chủ Tài Khoản (Không Dấu) |
| [L533](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L533) | Thuộc tính HTML | placeholder | VD: NGUYEN VAN TUAN |
| [L549](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L549) | Thuộc tính HTML | alt | VietQR Preview |
| [L559](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L559) | Văn bản JSX | text | Mã QR Xem Trước Của Bạn |
| [L562](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L562) | Văn bản JSX | text | Ngân hàng: |
| [L562](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L562) | Văn bản JSX | text | • Số TK: |
| [L563](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L563) | Chuỗi trong `{...}` | literal | (Chưa nhập) |
| [L566](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L566) | Văn bản JSX | text | Chủ TK: |
| [L566](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L566) | Chuỗi trong `{...}` | literal | (Chưa nhập) |
| [L569](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L569) | Văn bản JSX | text | ✓ Sẵn sàng quét nhận tiền qua tất cả ứng dụng ngân hàng và ví điện tử tại Việt Nam. |
| [L579](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L579) | Văn bản JSX | text | Lưu một lần — Tự động áp dụng cho Gian hàng khách xem, Hóa đơn và Màn hình POS. |
| [L583](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L583) | Văn bản JSX | text | Lưu Toàn Bộ Cài Đặt |
| [L593](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L593) | Văn bản JSX | text | Chế độ Giao diện (Sáng / Tối) |
| [L596](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L596) | Văn bản JSX | text | Tùy chỉnh giao diện hiển thị cho toàn bộ hệ thống quản trị và màn hình bán hàng POS. |
| [L602](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L602) | Văn bản JSX | text | Lựa chọn chủ đề: |
| [L604](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L604) | Văn bản JSX | text | Chế độ Tối (Dark mode) giúp bảo vệ mắt khi bán hàng ban đêm tại các sự kiện hoặc sân khấu âm nhạc. |
| [L618](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L618) | Văn bản JSX | text | Trí Tuệ Nhân Tạo (Google Gemini AI) |
| [L621](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L621) | Văn bản JSX | text | gemini-2.5-flash |
| [L625](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L625) | Văn bản JSX | text | Hệ thống AI thông minh hỗ trợ trích xuất tự động thông tin sự kiện từ ảnh poster, đọc dữ liệu và tối ưu hóa quản trị. |
| [L634](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L634) | Văn bản JSX | text | Trạng thái: |
| [L634](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L634) | Văn bản JSX | text | Đã tự động cấu hình & Sẵn sàng hoạt động |
| [L637](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L637) | Văn bản JSX | text | Khóa API: |
| [L637](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L637) | Văn bản JSX | text | AQ.Ab8RN6••••••••5w9Q |
| [L637](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L637) | Văn bản JSX | text | (Đã kích hoạt trong .env.local) |
| [L654](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L654) | Chuỗi trong `{...}` | literal | Đang kiểm tra... |
| [L654](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L654) | Chuỗi trong `{...}` | literal | Kiểm tra kết nối AI |
| [L661](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L661) | Chuỗi trong `{...}` | literal | Kết nối máy chủ Google Gemini API thành công 100%! |
| [L668](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L668) | Chuỗi trong `{...}` | literal | Lỗi kết nối tới Google Gemini API. |
| [L675](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L675) | Văn bản JSX | text | 💡 Hướng dẫn nếu bạn muốn tạo và lấy khóa API riêng từ tài khoản Google cá nhân: |
| [L678](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L678) | Văn bản JSX | text | Truy cập |
| [L678](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L678) | Văn bản JSX | text | Google AI Studio (aistudio.google.com/apikey) |
| [L678](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L678) | Văn bản JSX | text | và đăng nhập bằng tài khoản Google của bạn. |
| [L679](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L679) | Văn bản JSX | text | Bấm nút |
| [L679](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L679) | Văn bản JSX | text | &ldquo;Create API key&rdquo; |
| [L679](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L679) | Văn bản JSX | text | để tạo khóa mới hoàn toàn miễn phí. |
| [L680](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L680) | Văn bản JSX | text | Sao chép mã khóa và cập nhật vào biến |
| [L680](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L680) | Văn bản JSX | text | GEMINI_API_KEY |
| [L680](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L680) | Văn bản JSX | text | trong tệp |
| [L680](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L680) | Văn bản JSX | text | .env.local |
| [L691](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L691) | i18n (`t`) | t('demoSection') -> settings.demoSection | VI: "Dữ liệu mẫu Tour diễn" \| EN: "Tour Demo Data" |
| [L693](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L693) | i18n (`t`) | t('demoHelp') -> settings.demoHelp | VI: "Tải một bộ dữ liệu đầy đủ bao gồm Tour diễn, 2 gian hàng, 4 sản phẩm mẫu cùng phân bổ kho để kiểm thử ngay." \| EN: "Load a realistic demo tour with 2 booths, 4 products, variants and allocated stock for instant testing." |
| [L698](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L698) | Văn bản JSX | text | Dữ liệu bao gồm: 2 Sự kiện, 2 Gian hàng quầy vé, các sản phẩm merchandise mẫu và bảng phân bổ tồn kho hoàn chỉnh. |
| [L704](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L704) | i18n (`t`) | t('demoLoaded') -> settings.demoLoaded | VI: "Đã nạp thành công dữ liệu mẫu Tour diễn!" \| EN: "Tour demo data loaded successfully!" |
| [L717](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L717) | i18n (`t`) | t('loadDemoData') -> settings.loadDemoData | VI: "Nạp dữ liệu mẫu Tour diễn" \| EN: "Load Tour Demo Data" |
| [L728](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L728) | Văn bản JSX | text | Sao Lưu & Khôi Phục Dữ Liệu Ngoại Tuyến (Backup / Restore) |
| [L731](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L731) | Văn bản JSX | text | Xuất file sao lưu toàn bộ kho hàng, sự kiện, đơn hàng và nhật ký ra file JSON để lưu trữ hoặc chuyển sang máy khác. |
| [L739](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L739) | Văn bản JSX | text | Đã xuất thành công file sao lưu hệ thống toàn vẹn (.json)! |
| [L759](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L759) | Văn bản JSX | text | Tải File Sao Lưu (.json) |
| [L779](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L779) | Văn bản JSX | text | Khôi Phục từ File Backup |
| [L791](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L791) | Văn bản JSX | text | Khởi tạo Hệ thống Trắng (Xóa sạch dữ liệu mẫu) |
| [L794](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L794) | Văn bản JSX | text | Xóa toàn bộ các dữ liệu mẫu (sự kiện, gian hàng, đơn hàng, sản phẩm) để bắt đầu nhập dữ liệu kinh doanh thực tế. |
| [L802](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L802) | Văn bản JSX | text | Đã xóa toàn bộ dữ liệu mẫu thành công. Hệ thống đang ở trạng thái trắng hoàn toàn. |
| [L815](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L815) | Văn bản JSX | text | Xóa sạch dữ liệu mẫu & Đặt lại về trắng |

##### 📄 Mẫu #1 — Hộp thoại `alert`/`confirm` ([page.tsx#L250](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L250))

```text
confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu (sự kiện, gian hàng, sản phẩm, đơn hàng) để hệ thống hoàn toàn trắng không?'
      )
```


---

## Mục 8: Màn hình Bán hàng POS & Modals POS

#### 8.1 Màn hình Bán hàng POS Chính (`/pos`)
> Nguồn: [src/app/[locale]/pos/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx) — **248** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L196](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L196) | Hộp thoại `alert`/`confirm` | alert | alert('Không có kết nối mạng để đồng bộ. Vui lòng kết nối Internet trước.') |
| [L203](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L203) | Mẫu văn bản (`...`) | template | `Đã đồng bộ thành công ${res.successCount} đơn hàng lên máy chủ!` |
| [L205](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L205) | Chuỗi JS / Fallback | literal | Tất cả đơn hàng đã ở trạng thái đồng bộ mới nhất. |
| [L208](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L208) | Chuỗi JS / Fallback | literal | Lỗi đồng bộ dữ liệu. Vui lòng kiểm tra lại mạng. |
| [L450](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L450) | Hộp thoại `alert`/`confirm` | alert | alert('Tài khoản của bạn là Khách xem (Chỉ đọc). Vui lòng đăng nhập tài khoản Thu ngân hoặc Quản trị để bán hàng.') |
| [L464](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L464) | Hộp thoại `alert`/`confirm` | alert | alert(`Sản phẩm này tạm thời hết hàng khả dụng vì đang có ${remoteHeld} sản phẩm nằm trong giỏ của thu ngân khác!`) |
| [L466](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L466) | Hộp thoại `alert`/`confirm` | alert | alert('Sản phẩm đã hết hàng khả dụng tại quầy này!') |
| [L490](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L490) | Hộp thoại `alert`/`confirm` | alert | alert(`Không thể mua quá số lượng! Đang có ${remoteHeld} sản phẩm nằm trong giỏ hàng của thu ngân khác.`) |
| [L492](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L492) | Hộp thoại `alert`/`confirm` | alert | alert('Không thể mua quá số lượng! Đã đạt số lượng tồn khả dụng tối đa của quầy.') |
| [L515](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L515) | Hộp thoại `alert`/`confirm` | alert | alert('Tài khoản của bạn là Khách xem (Chỉ đọc), không thể xác nhận thanh toán đơn hàng.') |
| [L520](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L520) | Hộp thoại `alert`/`confirm` | alert | alert(`Số tiền khách đưa chưa đủ! Còn thiếu ${cashShortage.toLocaleString('vi-VN')} VND.`) |
| [L547](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L547) | Hộp thoại `alert`/`confirm` | alert | alert(err instanceof Error ? err.message : 'Lỗi tạo đơn hàng') |
| [L610](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L610) | Văn bản JSX | text | Màn hình Bán hàng (POS) |
| [L612](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L612) | Văn bản JSX | text | Vui lòng đăng nhập bằng tài khoản Thu ngân hoặc Quản trị viên để bán hàng tại quầy. |
| [L619](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L619) | Văn bản JSX | text | Đến trang Đăng nhập |
| [L629](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L629) | Văn bản JSX | text | Xem giao diện với tư cách Khách |
| [L644](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L644) | Thuộc tính HTML | title | Về trang quản lý |
| [L649](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L649) | Thuộc tính HTML | alt | HikaruStore Logo |
| [L654](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L654) | Văn bản JSX | text | HikaruStore |
| [L655](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L655) | Văn bản JSX | text | POS Terminal |
| [L662](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L662) | Văn bản JSX | text | Quản lý |
| [L673](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L673) | Văn bản JSX | text | (Chưa có sự kiện) |
| [L686](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L686) | Văn bản JSX | text | (Chưa có gian hàng) |
| [L707](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L707) | Thuộc tính HTML | title | Xem trạng thái mạng & đồng bộ ngoại tuyến |
| [L710](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L710) | Chuỗi trong `{...}` | literal | Online |
| [L710](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L710) | Chuỗi trong `{...}` | literal | Offline |
| [L723](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L723) | Thuộc tính HTML | aria-label | Menu tác vụ POS |
| [L724](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L724) | Thuộc tính HTML | title | Menu tác vụ POS |
| [L734](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L734) | Thuộc tính HTML | aria-label | Giỏ hàng |
| [L756](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L756) | Thuộc tính HTML | title | Trạng thái mạng & Đồng bộ dữ liệu ngoại tuyến |
| [L759](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L759) | Chuỗi trong `{...}` | literal | Online |
| [L759](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L759) | Chuỗi trong `{...}` | literal | Offline |
| [L762](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L762) | Văn bản JSX | text | chờ đẩy |
| [L773](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L773) | Thuộc tính HTML | title | Trả hàng cho khách đặt trước (Cần chụp ảnh minh chứng) |
| [L776](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L776) | Văn bản JSX | text | Trả hàng |
| [L796](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L796) | Mẫu văn bản (`...`) | template | `Ca đang mở (Két: ${(activeShift.startingCashFloat + activeShift.totalCashSales).toLocaleString('vi-VN')} đ) — Nhấn để Chốt ca / Bàn giao` |
| [L797](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L797) | Chuỗi trong `{...}` | title | Chưa mở ca — Nhấn để nhập tiền đầu ca |
| [L802](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L802) | Chuỗi trong `{...}` | literal | Chốt ca |
| [L802](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L802) | Chuỗi trong `{...}` | literal | Mở ca |
| [L812](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L812) | Văn bản JSX | text | Lịch sử |
| [L821](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L821) | Thuộc tính HTML | title | Góp ý hoặc báo lỗi hệ thống |
| [L824](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L824) | Văn bản JSX | text | Góp ý |
| [L839](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L839) | Văn bản JSX | text | Đang ở chế độ Bán Hàng Ngoại Tuyến (Offline) — Đơn hàng sẽ được lưu vào thiết bị (IndexedDB). |
| [L847](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L847) | Văn bản JSX | text | Chi tiết ( |
| [L847](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L847) | Văn bản JSX | text | đơn chờ) |
| [L864](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L864) | Văn bản JSX | text | Sự kiện |
| [L871](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L871) | Văn bản JSX | text | (Chưa có sự kiện) |
| [L882](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L882) | Văn bản JSX | text | Gian hàng |
| [L889](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L889) | Văn bản JSX | text | (Chưa có gian hàng) |
| [L909](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L909) | Thuộc tính HTML | placeholder | Tìm sản phẩm, mã loại... |
| [L928](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L928) | Văn bản JSX | text | Tất cả |
| [L939](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L939) | Văn bản JSX | text | 👑 Shop |
| [L950](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L950) | Văn bản JSX | text | 🤝 Collab |
| [L963](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L963) | Thuộc tính HTML | title | Tự động ẩn sản phẩm hết hàng |
| [L968](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L968) | Văn bản JSX | text | Ẩn hết hàng ( |
| [L973](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L973) | Văn bản JSX | text | Hiện tất cả |
| [L980](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L980) | Văn bản JSX | text | Collab: |
| [L991](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L991) | Văn bản JSX | text | Tất cả sản phẩm đã hết hàng |
| [L993](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L993) | Văn bản JSX | text | Có |
| [L993](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L993) | Văn bản JSX | text | sản phẩm tại quầy này đã bán hết hoặc đang được giữ trong giỏ hàng. |
| [L1001](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1001) | Văn bản JSX | text | Hiển thị sản phẩm hết hàng |
| [L1006](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1006) | Văn bản JSX | text | Chưa có sản phẩm nào tại quầy |
| [L1009](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1009) | Chuỗi trong `{...}` | literal | Hãy tạo Sự kiện và Gian hàng trong Dashboard trước để bắt đầu bán. |
| [L1010](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1010) | Chuỗi trong `{...}` | literal | Hãy thêm sản phẩm và phân bổ số lượng tồn kho cho gian hàng này trong mục Quản lý Kho. |
| [L1017](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1017) | Chuỗi trong `{...}` | literal | Tạo Sự Kiện Ngay |
| [L1017](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1017) | Chuỗi trong `{...}` | literal | Phân Bổ Tồn Kho |
| [L1075](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1075) | Văn bản JSX | text | 🤝 |
| [L1079](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1079) | Văn bản JSX | text | 👑 |
| [L1079](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1079) | Chuỗi trong `{...}` | literal | Shop |
| [L1088](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1088) | Văn bản JSX | text | Còn |
| [L1092](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1092) | Văn bản JSX | text | trong giỏ |
| [L1095](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1095) | Thuộc tính HTML | title | Đang trong giỏ của quầy khác |
| [L1096](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1096) | Văn bản JSX | text | Quầy khác giữ |
| [L1100](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1100) | Văn bản JSX | text | Hết hàng |
| [L1109](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1109) | Văn bản JSX | text | 🤝 Collab: |
| [L1118](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1118) | Chuỗi trong `{...}` | literal | VND |
| [L1156](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1156) | Văn bản JSX | text | Quầy: |
| [L1159](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1159) | Văn bản JSX | text | Kho bán: |
| [L1167](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1167) | Văn bản JSX | text | Tồn quầy: |
| [L1170](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1170) | Văn bản JSX | text | Số lượng: |
| [L1174](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1174) | Văn bản JSX | text | Onl: |
| [L1175](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1175) | Văn bản JSX | text | Preord: |
| [L1176](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1176) | Văn bản JSX | text | Đã bán: |
| [L1179](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1179) | Văn bản JSX | text | Tồn bán offline: |
| [L1203](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1203) | Văn bản JSX | text | trong giỏ |
| [L1210](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1210) | Chuỗi trong `{...}` | title | Đã đạt giới hạn tồn khả dụng |
| [L1210](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1210) | Chuỗi trong `{...}` | title | Thêm 1 |
| [L1226](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1226) | Chuỗi trong `{...}` | literal | Thêm vào giỏ |
| [L1226](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1226) | Chuỗi trong `{...}` | literal | Hết hàng |
| [L1244](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1244) | Văn bản JSX | text | Giỏ hàng |
| [L1246](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1246) | Văn bản JSX | text | món |
| [L1255](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1255) | Văn bản JSX | text | Xóa giỏ |
| [L1265](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1265) | Văn bản JSX | text | Giỏ hàng trống |
| [L1267](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1267) | Văn bản JSX | text | Chọn sản phẩm để thêm vào đơn |
| [L1284](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1284) | Chuỗi trong `{...}` | literal | VND |
| [L1294](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1294) | Thuộc tính HTML | title | Giảm 1 |
| [L1313](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1313) | Thuộc tính HTML | title | Nhập trực tiếp số lượng mua |
| [L1320](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1320) | Chuỗi trong `{...}` | title | Đã đạt số lượng tồn khả dụng |
| [L1320](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1320) | Chuỗi trong `{...}` | title | Thêm 1 |
| [L1342](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1342) | Văn bản JSX | text | Tạm tính: |
| [L1344](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1344) | Chuỗi trong `{...}` | literal | VND |
| [L1348](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1348) | Văn bản JSX | text | Giảm giá: |
| [L1354](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1354) | Thuộc tính HTML | placeholder | 0 |
| [L1359](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1359) | Văn bản JSX | text | Tổng cộng: |
| [L1361](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1361) | Chuỗi trong `{...}` | literal | VND |
| [L1377](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1377) | Văn bản JSX | text | Thanh toán ( |
| [L1377](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1377) | Chuỗi trong `{...}` | literal | VND |
| [L1399](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1399) | Văn bản JSX | text | Giỏ hàng • |
| [L1399](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1399) | Văn bản JSX | text | món |
| [L1401](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1401) | Chuỗi trong `{...}` | literal | VND |
| [L1413](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1413) | Văn bản JSX | text | Xem giỏ |
| [L1424](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1424) | Văn bản JSX | text | Thanh toán |
| [L1434](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1434) | Mẫu văn bản (`...`) | template | `Chi tiết giỏ hàng (${totalCartUnits} món)` |
| [L1435](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1435) | Thuộc tính HTML | description | Kiểm tra các sản phẩm đã chọn tại quầy. |
| [L1442](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1442) | Văn bản JSX | text | Chưa có sản phẩm nào trong giỏ hàng |
| [L1451](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1451) | Chuỗi trong `{...}` | literal | VND |
| [L1470](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1470) | Chuỗi trong `{...}` | title | Đã đạt số lượng tồn khả dụng |
| [L1470](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1470) | Chuỗi trong `{...}` | title | Thêm 1 |
| [L1493](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1493) | Văn bản JSX | text | Tạm tính: |
| [L1495](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1495) | Chuỗi trong `{...}` | literal | VND |
| [L1499](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1499) | Văn bản JSX | text | Giảm giá: |
| [L1505](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1505) | Thuộc tính HTML | placeholder | 0 |
| [L1510](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1510) | Văn bản JSX | text | Tổng cộng: |
| [L1512](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1512) | Chuỗi trong `{...}` | literal | VND |
| [L1523](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1523) | Văn bản JSX | text | Xóa giỏ |
| [L1536](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1536) | Văn bản JSX | text | Thanh toán ( |
| [L1536](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1536) | Chuỗi trong `{...}` | literal | VND |
| [L1548](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1548) | Thuộc tính HTML | title | Thanh toán |
| [L1550](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1550) | Thuộc tính HTML | description | Chọn phương thức thanh toán |
| [L1565](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1565) | Văn bản JSX | text | VietQR |
| [L1578](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1578) | Văn bản JSX | text | Tiền mặt |
| [L1591](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1591) | Văn bản JSX | text | Thẻ POS |
| [L1613](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1613) | Mẫu văn bản (`...`) | template | `⚡ Đang tự động khớp lệnh sau ${qrCountdown}s...` |
| [L1614](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1614) | Chuỗi trong `{...}` | literal | Đang hiển thị mã VietQR • Bấm nút xanh hoặc [Enter] khi đã nhận tiền |
| [L1623](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1623) | Văn bản JSX | text | Thiết bị đang ngoại tuyến (Offline) |
| [L1626](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1626) | Văn bản JSX | text | Ảnh mã QR tự động từ máy chủ tạm thời không tải được do không có mạng Internet. Khách hàng có thể chuyển khoản bằng STK bên dưới hoặc quét mã QR in sẵn tại quầy: |
| [L1636](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1636) | Thuộc tính HTML | alt | VietQR code |
| [L1644](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1644) | Văn bản JSX | text | Ngân hàng: |
| [L1648](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1648) | Văn bản JSX | text | Số tài khoản: |
| [L1657](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1657) | Thuộc tính HTML | title | Nhấn để sao chép |
| [L1664](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1664) | Văn bản JSX | text | Chủ tài khoản: |
| [L1668](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1668) | Văn bản JSX | text | Số tiền cần CK: |
| [L1670](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1670) | Chuỗi trong `{...}` | literal | VND |
| [L1674](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1674) | Văn bản JSX | text | Nội dung chuyển: |
| [L1676](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1676) | Văn bản JSX | text | EM |
| [L1685](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1685) | Văn bản JSX | text | Vì sao sau khi chuyển tiền màn hình chưa tự nhảy? |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | Mã VietQR chuyển thẳng trực tiếp vào tài khoản ngân hàng của bạn. Khi điện thoại bạn nổ thông báo |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | &quot;ting ting&quot; |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | , hãy bấm nút |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | &quot;✓ ĐÃ NHẬN TIỀN&quot; |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | bên dưới (hoặc phím |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | Enter |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | ) để máy lưu đơn và trừ kho. Hoặc bạn có thể tích chọn |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | &quot;⚡ Tự động khớp sau 5s&quot; |
| [L1687](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1687) | Văn bản JSX | text | để máy tự động chuyển màn hình! |
| [L1705](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1705) | Văn bản JSX | text | ✓ ĐÃ NHẬN TIỀN ( |
| [L1705](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1705) | Chuỗi trong `{...}` | literal | VND |
| [L1705](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1705) | Văn bản JSX | text | ) - HOÀN TẤT ĐƠN [ENTER] |
| [L1715](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1715) | Thuộc tính HTML | title | Bấm để hoàn tất đơn ngay lập tức khi test hoặc khi đã thấy biến động số dư |
| [L1718](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1718) | Văn bản JSX | text | Khớp lệnh nhanh (Tức thì) |
| [L1728](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1728) | Văn bản JSX | text | ⚡ Tự động khớp sau 5s |
| [L1740](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1740) | Văn bản JSX | text | Cần thu: |
| [L1742](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1742) | Chuỗi trong `{...}` | literal | VND |
| [L1751](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1751) | Văn bản JSX | text | Tiền khách đưa: |
| [L1759](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1759) | Văn bản JSX | text | Xóa |
| [L1774](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1774) | Thuộc tính HTML | placeholder | Nhập số tiền... |
| [L1779](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1779) | Văn bản JSX | text | ₫ |
| [L1787](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1787) | Văn bản JSX | text | Nhập tiền khách đưa để tính tiền thối |
| [L1794](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1794) | Văn bản JSX | text | Khách đưa chưa đủ tiền |
| [L1797](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1797) | Văn bản JSX | text | Thiếu |
| [L1797](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1797) | Chuỗi trong `{...}` | literal | VND |
| [L1804](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1804) | Văn bản JSX | text | Tiền thối lại: |
| [L1806](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1806) | Chuỗi trong `{...}` | literal | 0 ₫ (Vừa đủ) |
| [L1806](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1806) | Chuỗi trong `{...}` | literal | VND |
| [L1810](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1810) | Văn bản JSX | text | Đã nhận: |
| [L1810](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1810) | Chuỗi trong `{...}` | literal | VND |
| [L1811](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1811) | Văn bản JSX | text | Đơn: |
| [L1811](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1811) | Chuỗi trong `{...}` | literal | VND |
| [L1822](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1822) | Văn bản JSX | text | Thanh toán thẻ POS |
| [L1824](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1824) | Văn bản JSX | text | Quẹt thẻ hoặc chạm thiết bị vào máy POS. |
| [L1832](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1832) | Văn bản JSX | text | Ghi chú (tùy chọn) |
| [L1836](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1836) | Thuộc tính HTML | placeholder | Ghi chú đơn hàng... |
| [L1850](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1850) | Văn bản JSX | text | Hủy |
| [L1864](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1864) | Mẫu văn bản (`...`) | template | `Thiếu ${formatCurrency(cashShortage, activeWorkspace?.currency \|\| 'VND')}` |
| [L1865](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1865) | Chuỗi trong `{...}` | literal | Hoàn tất đơn hàng |
| [L1876](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1876) | Thuộc tính HTML | title | Thanh toán thành công! |
| [L1877](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1877) | Thuộc tính HTML | description | Giao dịch đã được ghi nhận hoàn tất. Hệ thống đã tự động trừ số lượng sản phẩm khỏi tồn kho quầy. |
| [L1886](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1886) | Văn bản JSX | text | Mã đơn hàng |
| [L1891](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1891) | Chuỗi trong `{...}` | literal | Tiền mặt tại quầy |
| [L1891](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1891) | Chuỗi trong `{...}` | literal | Chuyển khoản VietQR |
| [L1894](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1894) | Chuỗi trong `{...}` | literal | VND |
| [L1900](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1900) | Văn bản JSX | text | Đã tự động trừ |
| [L1900](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1900) | Văn bản JSX | text | sản phẩm ra khỏi tồn quầy! |
| [L1908](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1908) | Văn bản JSX | text | Tiền khách đưa: |
| [L1910](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1910) | Chuỗi trong `{...}` | literal | VND |
| [L1914](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1914) | Văn bản JSX | text | Tiền thối lại: |
| [L1916](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1916) | Chuỗi trong `{...}` | literal | VND |
| [L1926](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1926) | Văn bản JSX | text | x |
| [L1929](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1929) | Chuỗi trong `{...}` | literal | VND |
| [L1937](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1937) | Văn bản JSX | text | ⚠️ Đơn hàng đã được lưu ngoại tuyến an toàn vào thiết bị (IndexedDB). Sẽ tự động tải lên khi có mạng. |
| [L1950](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1950) | Văn bản JSX | text | Xem & In hóa đơn |
| [L1959](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1959) | Văn bản JSX | text | Tạo đơn tiếp theo |
| [L1971](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1971) | Chuỗi trong `{...}` | boothName | Quầy POS |
| [L1973](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1973) | Chuỗi trong `{...}` | eventName | Sự kiện |
| [L2004](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2004) | Thuộc tính HTML | title | Trung tâm Ngoại tuyến & Đồng bộ |
| [L2005](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2005) | Thuộc tính HTML | description | Kiểm soát trạng thái mạng và lưu trữ ngoại tuyến của máy POS. |
| [L2012](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2012) | Văn bản JSX | text | Đường truyền mạng vật lý: |
| [L2023](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2023) | Chuỗi trong `{...}` | literal | Có kết nối Internet |
| [L2023](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2023) | Chuỗi trong `{...}` | literal | Mất kết nối Internet |
| [L2028](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2028) | Văn bản JSX | text | Trạng thái hoạt động POS: |
| [L2036](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2036) | Chuỗi trong `{...}` | literal | 🟢 Online (Trực tuyến) |
| [L2036](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2036) | Chuỗi trong `{...}` | literal | 🟠 Offline (Lưu trữ cục bộ) |
| [L2045](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2045) | Văn bản JSX | text | Mô phỏng Chế độ Ngoại tuyến |
| [L2047](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2047) | Văn bản JSX | text | Thử nghiệm bán hàng khi mất mạng Internet. |
| [L2062](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2062) | Văn bản JSX | text | ⚡ Đang bật mô phỏng ngoại tuyến. Các đơn hàng tạo mới sẽ được lưu trữ vào IndexedDB và chuyển sang hàng đợi đồng bộ. |
| [L2071](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2071) | Văn bản JSX | text | Đơn hàng chờ đồng bộ: |
| [L2072](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2072) | Văn bản JSX | text | Lưu trữ trong IndexedDB & LocalStorage |
| [L2075](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2075) | Văn bản JSX | text | đơn |
| [L2090](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2090) | Văn bản JSX | text | Đồng bộ ngay bây giờ |
| [L2095](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2095) | Văn bản JSX | text | Xem chi tiết |
| [L2102](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2102) | Văn bản JSX | text | Cơ chế lưu trữ Offline của HikaruStore: |
| [L2104](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2104) | Văn bản JSX | text | Hỗ trợ Service Worker (PWA) giúp tải lại trang ngay cả khi ngắt toàn bộ Wifi/4G. |
| [L2105](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2105) | Văn bản JSX | text | Mọi đơn hàng tạo khi mất mạng được bảo toàn 100% bằng Idempotency Key. |
| [L2106](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2106) | Văn bản JSX | text | Tự động đẩy dữ liệu lên máy chủ ngay khi thiết bị kết nối lại mạng. |
| [L2116](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2116) | Thuộc tính HTML | title | Tác vụ nhanh POS |
| [L2117](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2117) | Thuộc tính HTML | description | Menu các chức năng hỗ trợ bán hàng tại sự kiện. |
| [L2136](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2136) | Chuỗi trong `{...}` | literal | Quản lý ca bán hàng (Đang mở) |
| [L2136](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2136) | Chuỗi trong `{...}` | literal | Mở ca bán hàng |
| [L2140](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2140) | Mẫu văn bản (`...`) | template | `Két hiện tại: ${(activeShift.startingCashFloat + activeShift.totalCashSales).toLocaleString('vi-VN')} đ` |
| [L2141](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2141) | Chuỗi trong `{...}` | literal | Nhập tiền lẻ đầu ca để quản lý két |
| [L2146](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2146) | Chuỗi trong `{...}` | literal | Chốt ca |
| [L2146](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2146) | Chuỗi trong `{...}` | literal | Mở ca |
| [L2164](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2164) | Văn bản JSX | text | Trả hàng đặt trước (Pre-order) |
| [L2165](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2165) | Văn bản JSX | text | Xác nhận và chụp ảnh minh chứng nhận hàng |
| [L2170](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2170) | Văn bản JSX | text | chờ nhận |
| [L2173](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2173) | Văn bản JSX | text | 0 |
| [L2188](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2188) | Văn bản JSX | text | Lịch sử đơn hàng POS |
| [L2189](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2189) | Văn bản JSX | text | Xem lại tất cả hóa đơn đã bán tại quầy |
| [L2192](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2192) | Văn bản JSX | text | Xem &rarr; |
| [L2209](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2209) | Văn bản JSX | text | Trạng thái Ngoại tuyến & Đồng bộ |
| [L2211](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2211) | Chuỗi trong `{...}` | literal | 🟢 Đang có mạng |
| [L2211](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2211) | Chuỗi trong `{...}` | literal | 🟠 Đang ngoại tuyến |
| [L2211](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2211) | Văn bản JSX | text | đơn chờ đẩy |
| [L2215](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2215) | Văn bản JSX | text | Cài đặt |
| [L2221](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2221) | Văn bản JSX | text | Tùy chỉnh hiển thị & Giao diện |
| [L2224](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2224) | Văn bản JSX | text | Tỉ lệ màn hình: |
| [L2228](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2228) | Văn bản JSX | text | Chế độ sáng / tối: |
| [L2243](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L2243) | Văn bản JSX | text | Góp ý & Báo lỗi hệ thống |


#### 8.2 Danh sách Đơn POS trong Ngày (`/pos/orders`)
> Nguồn: [src/app/[locale]/pos/orders/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx) — **19** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L57](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L57) | Văn bản JSX | text | Về POS |
| [L62](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L62) | Thuộc tính HTML | alt | Logo |
| [L63](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L63) | Văn bản JSX | text | Lịch sử Đơn hàng tại Quầy |
| [L68](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L68) | Văn bản JSX | text | đơn đã ghi nhận |
| [L79](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L79) | Thuộc tính HTML | placeholder | Tìm theo mã đơn... |
| [L94](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L94) | Văn bản JSX | text | Tất cả |
| [L103](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L103) | Văn bản JSX | text | Đã đồng bộ |
| [L112](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L112) | Văn bản JSX | text | Chờ đồng bộ ngoại tuyến |
| [L122](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L122) | Văn bản JSX | text | Không tìm thấy đơn hàng nào |
| [L146](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L146) | Chuỗi trong `{...}` | literal | Đã đồng bộ server |
| [L146](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L146) | Chuỗi trong `{...}` | literal | Chờ đồng bộ |
| [L149](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L149) | Chuỗi trong `{...}` | literal | Tiền mặt |
| [L149](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L149) | Chuỗi trong `{...}` | literal | VietQR |
| [L159](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L159) | Văn bản JSX | text | Ghi chú: |
| [L167](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L167) | Chuỗi trong `{...}` | literal | VND |
| [L170](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L170) | Văn bản JSX | text | dòng sản phẩm |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L180) | Thuộc tính HTML | title | Xem biên nhận và in hóa đơn nhiệt |
| [L183](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L183) | Văn bản JSX | text | Hóa đơn |
| [L194](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/orders/page.tsx#L194) | Văn bản JSX | text | Đồng bộ |


#### 8.3 Trung tâm Đồng bộ Offline POS (`/pos/sync`)
> Nguồn: [src/app/[locale]/pos/sync/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx) — **22** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L37](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L37) | Mẫu văn bản (`...`) | template | `Đã đồng bộ thành công ${res.successCount} đơn hàng lên máy chủ!` |
| [L39](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L39) | Chuỗi JS / Fallback | literal | Đồng bộ thất bại. Vui lòng kiểm tra kết nối mạng. |
| [L53](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L53) | Văn bản JSX | text | Về POS |
| [L58](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L58) | Thuộc tính HTML | alt | Logo |
| [L59](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L59) | Văn bản JSX | text | Trung tâm Đồng bộ Dữ liệu Ngoại tuyến |
| [L76](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L76) | Văn bản JSX | text | Chờ đồng bộ (Pending) |
| [L78](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L78) | Văn bản JSX | text | đơn |
| [L80](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L80) | Văn bản JSX | text | Lưu trữ trong IndexedDB |
| [L84](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L84) | Văn bản JSX | text | Đã xác nhận (Confirmed) |
| [L86](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L86) | Văn bản JSX | text | đơn |
| [L88](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L88) | Văn bản JSX | text | Đã tải lên Supabase |
| [L92](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L92) | Văn bản JSX | text | Bộ nhớ cục bộ |
| [L94](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L94) | Văn bản JSX | text | Dexie.js |
| [L96](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L96) | Văn bản JSX | text | Sẵn sàng 100% khi mất mạng |
| [L104](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L104) | Văn bản JSX | text | Đồng bộ Hàng đợi Đơn hàng |
| [L106](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L106) | Văn bản JSX | text | Hệ thống sử dụng cơ chế Idempotency Key để đảm bảo không bao giờ bị nhân đôi đơn hàng khi kết nối lại mạng Internet. |
| [L121](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L121) | Văn bản JSX | text | Đồng bộ tất cả ( |
| [L121](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L121) | Văn bản JSX | text | đơn chờ) |
| [L131](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L131) | Văn bản JSX | text | Danh sách đơn hàng đang chờ đẩy lên máy chủ |
| [L142](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L142) | Văn bản JSX | text | Tạo lúc: |
| [L142](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L142) | Văn bản JSX | text | • Idempotency: |
| [L147](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/sync/page.tsx#L147) | Chuỗi trong `{...}` | literal | VND |


#### 8.4 Modal Nhận hàng Đặt trước / VIP (`PreorderPickupModal`)
> Nguồn: [src/components/pos/preorder-pickup-modal.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx) — **86** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L65](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L65) | Chuỗi JS / Fallback | literal | Khách không đến nhận / Quá giờ hẹn |
| [L112](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L112) | Chuỗi JS / Fallback | literal | Kích thước ảnh quá lớn (tối đa 5MB). |
| [L129](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L129) | Chuỗi JS / Fallback | literal | BẮT BUỘC: Bạn phải chụp lại ảnh minh chứng nhận hàng trước khi xác nhận! |
| [L137](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L137) | Chuỗi JS / Fallback | literal | Thu ngân POS |
| [L144](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L144) | Chuỗi JS / Fallback | literal | Lỗi khi xác nhận nhận hàng |
| [L160](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L160) | Chuỗi JS / Fallback | literal | Lý do khác... |
| [L161](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L161) | Chuỗi JS / Fallback | literal | Khác |
| [L168](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L168) | Chuỗi JS / Fallback | literal | Thu ngân POS |
| [L188](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L188) | Thuộc tính HTML | title | Trả hàng đặt trước |
| [L189](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L189) | Thuộc tính HTML | description | Kiểm tra thông tin và chụp ảnh minh chứng nhận hàng. |
| [L197](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L197) | Thuộc tính HTML | placeholder | Tìm mã đơn, tên, số điện thoại... |
| [L214](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L214) | Văn bản JSX | text | Chờ nhận |
| [L229](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L229) | Văn bản JSX | text | Đã nhận |
| [L244](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L244) | Văn bản JSX | text | Đã từ chối |
| [L259](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L259) | Văn bản JSX | text | Tất cả ( |
| [L269](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L269) | Văn bản JSX | text | Không tìm thấy đơn đặt trước nào |
| [L270](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L270) | Văn bản JSX | text | Thử tìm theo tên khách hoặc mã đơn khác. |
| [L291](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L291) | Văn bản JSX | text | Giữ chỗ VIP |
| [L296](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L296) | Văn bản JSX | text | Đơn Đặt Online |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L303) | Văn bản JSX | text | Đã nhận hàng |
| [L308](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L308) | Văn bản JSX | text | Đã từ chối / Hủy |
| [L313](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L313) | Văn bản JSX | text | Chờ nhận tại quầy |
| [L336](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L336) | Văn bản JSX | text | x |
| [L342](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L342) | Văn bản JSX | text | Ghi chú: |
| [L349](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L349) | Văn bản JSX | text | Đã giao lúc: |
| [L358](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L358) | Văn bản JSX | text | Từ chối: |
| [L358](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L358) | Chuỗi trong `{...}` | literal | Đã hủy giữ chỗ |
| [L359](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L359) | Mẫu văn bản (`...`) | template | `(Bởi: ${po.cancelled_by})` |
| [L376](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L376) | Văn bản JSX | text | Xem minh chứng |
| [L382](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L382) | Văn bản JSX | text | Đã hoàn kho |
| [L390](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L390) | Thuộc tính HTML | title | Từ chối trả hàng và hoàn lại số lượng về kho |
| [L393](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L393) | Chuỗi JS / Fallback | literal | Khách không đến nhận / Quá giờ hẹn |
| [L398](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L398) | Văn bản JSX | text | Từ chối |
| [L413](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L413) | Văn bản JSX | text | Xác nhận trả hàng |
| [L425](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L425) | Văn bản JSX | text | Toàn bộ hàng đặt trước đã được giữ riêng trong kho, không bán lẻ tại quầy. |
| [L427](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L427) | Văn bản JSX | text | Đóng |
| [L443](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L443) | Mẫu văn bản (`...`) | template | `Xác Nhận Trả Hàng #${selectedPreorder?.code}` |
| [L444](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L444) | Thuộc tính HTML | description | Bắt buộc phải chụp lại minh chứng nhận hàng trước khi nhấn nút xác nhận. |
| [L451](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L451) | Văn bản JSX | text | Khách hàng: |
| [L453](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L453) | Chuỗi trong `{...}` | literal | VND |
| [L457](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L457) | Văn bản JSX | text | Điện thoại: |
| [L457](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L457) | Chuỗi trong `{...}` | literal | Chưa cung cấp |
| [L460](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L460) | Văn bản JSX | text | Mặt hàng bàn giao: |
| [L464](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L464) | Văn bản JSX | text | món |
| [L475](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L475) | Văn bản JSX | text | Ảnh Minh Chứng Nhận Hàng (BẮT BUỘC) |
| [L502](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L502) | Thuộc tính HTML | alt | Minh chứng nhận hàng |
| [L509](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L509) | Thuộc tính HTML | title | Xóa và chụp lại |
| [L517](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L517) | Văn bản JSX | text | Đã ghi nhận ảnh minh chứng hợp lệ! |
| [L528](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L528) | Văn bản JSX | text | Chụp lại ảnh khác |
| [L540](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L540) | Văn bản JSX | text | Chụp ảnh khách nhận hàng / Biên lai đối chiếu |
| [L543](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L543) | Văn bản JSX | text | Để tránh khiếu nại hoặc mất mát, hệ thống yêu cầu ảnh minh chứng trước khi kích hoạt nút xác nhận. |
| [L556](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L556) | Văn bản JSX | text | Mở Camera chụp ngay |
| [L567](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L567) | Văn bản JSX | text | Chọn ảnh từ thiết bị |
| [L584](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L584) | Văn bản JSX | text | Ghi chú đối soát (tùy chọn): |
| [L587](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L587) | Thuộc tính HTML | placeholder | VD: Đã kiểm tra CCCD 4 số đuôi 8912, nhận đủ 2 áo... |
| [L603](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L603) | Chuỗi JS / Fallback | literal | Thông tin đối chiếu không khớp (Nghi vấn giả mạo) |
| [L608](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L608) | Văn bản JSX | text | Từ chối đơn này |
| [L621](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L621) | Văn bản JSX | text | Đóng |
| [L639](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L639) | Chuỗi trong `{...}` | literal | Xác Nhận Đã Nhận Hàng |
| [L640](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L640) | Chuỗi trong `{...}` | literal | Chụp ảnh minh chứng để kích hoạt nút |
| [L655](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L655) | Mẫu văn bản (`...`) | template | `Từ Chối Trả Hàng #${rejectTarget?.code}` |
| [L656](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L656) | Thuộc tính HTML | description | Xác nhận từ chối bàn giao hoặc hủy giữ chỗ đơn đặt trước này. |
| [L663](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L663) | Văn bản JSX | text | Khách hàng: |
| [L664](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L664) | Chuỗi trong `{...}` | literal | VND |
| [L667](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L667) | Văn bản JSX | text | SĐT: |
| [L667](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L667) | Chuỗi trong `{...}` | literal | Chưa cung cấp |
| [L670](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L670) | Văn bản JSX | text | Sản phẩm đang giữ chỗ: |
| [L674](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L674) | Văn bản JSX | text | x |
| [L685](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L685) | Văn bản JSX | text | Lưu ý: |
| [L685](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L685) | Văn bản JSX | text | Khi xác nhận từ chối, toàn bộ số lượng sản phẩm trên sẽ được |
| [L685](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L685) | Văn bản JSX | text | tự động hoàn trả về kho khả dụng |
| [L685](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L685) | Văn bản JSX | text | ngay lập tức để tiếp tục bán tại quầy hoặc cho khách khác. |
| [L692](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L692) | Văn bản JSX | text | Lý do từ chối bàn giao / hủy giữ chỗ: |
| [L696](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L696) | Chuỗi trong `{...}` | literal | Khách không đến nhận / Quá thời gian quy định |
| [L697](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L697) | Chuỗi trong `{...}` | literal | Thông tin đối chiếu không khớp (Nghi vấn giả mạo) |
| [L698](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L698) | Chuỗi trong `{...}` | literal | Khách chủ động yêu cầu hủy nhận hàng |
| [L699](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L699) | Chuỗi trong `{...}` | literal | Hàng hóa bị lỗi / Không đủ điều kiện bàn giao |
| [L700](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L700) | Chuỗi trong `{...}` | literal | Lý do khác... |
| [L722](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L722) | Chuỗi trong `{...}` | literal | Lý do khác... |
| [L725](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L725) | Thuộc tính HTML | placeholder | Nhập chi tiết lý do từ chối... |
| [L744](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L744) | Văn bản JSX | text | Hủy bỏ |
| [L755](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L755) | Văn bản JSX | text | Xác Nhận Từ Chối & Hoàn Kho |
| [L768](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L768) | Thuộc tính HTML | title | Ảnh Minh Chứng Bàn Giao Hàng |
| [L769](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L769) | Thuộc tính HTML | description | Hình ảnh chụp thực tế lúc bàn giao hàng cho khách hàng tại quầy sự kiện. |
| [L777](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L777) | Thuộc tính HTML | alt | Minh chứng nhận hàng |
| [L783](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/preorder-pickup-modal.tsx#L783) | Văn bản JSX | text | Đóng |


#### 8.5 Modal Mở / Chốt Ca & Báo cáo Z-Report (`ShiftModal`)
> Nguồn: [src/components/pos/shift-modal.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx) — **79** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L66](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L66) | Chuỗi JS / Fallback | literal | Thu ngân |
| [L91](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L91) | Chuỗi JS / Fallback | literal | === BÁO CÁO CHỐT CA BÁN HÀNG (Z-REPORT) === |
| [L92](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L92) | Mẫu văn bản (`...`) | template | `Sự kiện: ${s.eventName}` |
| [L93](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L93) | Mẫu văn bản (`...`) | template | `Quầy: ${s.boothName}` |
| [L94](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L94) | Mẫu văn bản (`...`) | template | `Thu ngân: ${s.cashierName}` |
| [L95](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L95) | Mẫu văn bản (`...`) | template | `Bắt đầu: ${formatDate(s.startTime)}` |
| [L96](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L96) | Mẫu văn bản (`...`) | template | `Kết thúc: ${formatDate(s.endTime \|\| '')}` |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L98) | Mẫu văn bản (`...`) | template | `Số đơn hàng trong ca: ${s.ordersCount} đơn` |
| [L99](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L99) | Mẫu văn bản (`...`) | template | `Tiền mặt đầu ca (Float): ${formatCurrency(s.startingCashFloat, 'VND')}` |
| [L100](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L100) | Mẫu văn bản (`...`) | template | `Doanh thu Tiền mặt: +${formatCurrency(s.totalCashSales, 'VND')}` |
| [L101](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L101) | Mẫu văn bản (`...`) | template | `Doanh thu VietQR: +${formatCurrency(s.totalQrSales, 'VND')}` |
| [L102](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L102) | Mẫu văn bản (`...`) | template | `TỔNG DOANH THU CA: ${formatCurrency(s.totalSales, 'VND')}` |
| [L104](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L104) | Mẫu văn bản (`...`) | template | `Tiền mặt kỳ vọng trong két: ${formatCurrency(s.expectedCashTotal \|\| 0, 'VND')}` |
| [L105](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L105) | Mẫu văn bản (`...`) | template | `Tiền mặt thực đếm trong két: ${formatCurrency(s.closingCashCount \|\| 0, 'VND')}` |
| [L106](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L106) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Chênh lệch (Lệch két): ${s.cashDifference! >= 0 ? `+${formatCurrency(...` |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L107) | Mẫu văn bản (`...`) | template | `Ghi chú bàn giao: ${s.notes}` |
| [L108](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L108) | Chuỗi JS / Fallback | literal | Xác nhận bàn giao: Ký tên .................... |
| [L130](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L130) | Chuỗi trong `{...}` | title | Báo Cáo Bàn Giao Ca (Z-Report) |
| [L132](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L132) | Chuỗi trong `{...}` | title | Chốt Ca Bán Hàng & Bàn Giao Két Tiền |
| [L133](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L133) | Chuỗi trong `{...}` | title | Mở Ca Thu Ngân Mới |
| [L142](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L142) | Văn bản JSX | text | Ca bán hàng đã được chốt và lưu vào nhật ký đối soát an toàn! |
| [L152](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L152) | Thuộc tính HTML | alt | HikaruStore Logo |
| [L154](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L154) | Văn bản JSX | text | BÁO CÁO CHỐT CA (Z-REPORT) |
| [L161](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L161) | Văn bản JSX | text | Thu ngân: |
| [L165](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L165) | Văn bản JSX | text | Thời gian ca: |
| [L166](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L166) | Văn bản JSX | text | → |
| [L169](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L169) | Văn bản JSX | text | Số đơn hoàn thành: |
| [L170](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L170) | Văn bản JSX | text | đơn |
| [L176](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L176) | Văn bản JSX | text | Tiền thối đầu ca (Float): |
| [L177](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L177) | Chuỗi trong `{...}` | literal | VND |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L180) | Văn bản JSX | text | Doanh thu Tiền mặt: |
| [L181](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L181) | Chuỗi trong `{...}` | literal | VND |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L184) | Văn bản JSX | text | Doanh thu VietQR: |
| [L185](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L185) | Chuỗi trong `{...}` | literal | VND |
| [L188](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L188) | Văn bản JSX | text | TỔNG DOANH THU CA: |
| [L189](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L189) | Chuỗi trong `{...}` | literal | VND |
| [L195](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L195) | Văn bản JSX | text | Tiền mặt kỳ vọng trong két: |
| [L197](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L197) | Chuỗi trong `{...}` | literal | VND |
| [L201](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L201) | Văn bản JSX | text | Tiền mặt thực đếm bàn giao: |
| [L203](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L203) | Chuỗi trong `{...}` | literal | VND |
| [L207](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L207) | Văn bản JSX | text | Chênh lệch két: |
| [L218](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L218) | Chuỗi trong `{...}` | literal | ✅ Khớp 100% (0 đ) |
| [L220](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L220) | Mẫu văn bản (`...`) | template | `Thừa +${formatCurrency(lastClosedShift.cashDifference!, 'VND')}` |
| [L221](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L221) | Mẫu văn bản (`...`) | template | `Thiếu hụt ${formatCurrency(lastClosedShift.cashDifference!, 'VND')}` |
| [L228](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L228) | Văn bản JSX | text | Ghi chú: |
| [L241](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L241) | Chuỗi trong `{...}` | literal | Đã sao chép |
| [L241](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L241) | Chuỗi trong `{...}` | literal | Sao chép văn bản |
| [L251](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L251) | Văn bản JSX | text | In Z-Report |
| [L262](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L262) | Văn bản JSX | text | Hoàn tất |
| [L272](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L272) | Văn bản JSX | text | Thu ngân hiện tại: |
| [L276](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L276) | Văn bản JSX | text | Giờ mở ca: |
| [L280](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L280) | Văn bản JSX | text | Tiền thối đầu ca: |
| [L282](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L282) | Chuỗi trong `{...}` | literal | VND |
| [L286](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L286) | Văn bản JSX | text | Doanh thu tiền mặt thu được: |
| [L288](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L288) | Chuỗi trong `{...}` | literal | VND |
| [L288](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L288) | Văn bản JSX | text | đơn) |
| [L292](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L292) | Văn bản JSX | text | Tiền mặt kỳ vọng trong két: |
| [L294](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L294) | Chuỗi trong `{...}` | literal | VND |
| [L301](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L301) | Văn bản JSX | text | Tiền mặt thực tế đếm được trong két: |
| [L302](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L302) | Văn bản JSX | text | Đếm toàn bộ tiền giấy |
| [L307](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L307) | Thuộc tính HTML | placeholder | Ví dụ: 3.500.000 |
| [L327](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L327) | Văn bản JSX | text | Đối soát chênh lệch: |
| [L330](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L330) | Chuỗi trong `{...}` | literal | ✅ Két tiền khớp 100% |
| [L332](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L332) | Mẫu văn bản (`...`) | template | `Thừa: +${formatCurrency(diffNum, 'VND')}` |
| [L333](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L333) | Mẫu văn bản (`...`) | template | `Thiếu hụt: ${formatCurrency(diffNum, 'VND')}` |
| [L339](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L339) | Văn bản JSX | text | Ghi chú bàn giao / Giải trình chênh lệch: |
| [L341](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L341) | Thuộc tính HTML | placeholder | Ghi chú người nhận bàn giao ca kế tiếp hoặc lý do lệch tiền... |
| [L350](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L350) | Văn bản JSX | text | Hủy |
| [L360](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L360) | Văn bản JSX | text | Xác Nhận Chốt Ca & Xuất Z-Report |
| [L370](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L370) | Văn bản JSX | text | Chào |
| [L370](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L370) | Chuỗi trong `{...}` | literal | Thu ngân |
| [L370](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L370) | Văn bản JSX | text | ! Hãy nhập số tiền thối ban đầu (tiền lót két) để bắt đầu ca bán hàng tại quầy. |
| [L376](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L376) | Văn bản JSX | text | Tiền mặt nhận bàn giao đầu ca (Tiền thối / Float): |
| [L381](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L381) | Thuộc tính HTML | placeholder | 1.000.000 |
| [L397](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L397) | Chuỗi trong `{...}` | literal | VND |
| [L404](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L404) | Văn bản JSX | text | Ghi chú ca mở: |
| [L406](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L406) | Thuộc tính HTML | placeholder | Ca sáng / Nhận ca từ bạn An... |
| [L415](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L415) | Văn bản JSX | text | Để sau |
| [L424](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L424) | Văn bản JSX | text | Bắt Đầu Mở Ca Bán Hàng |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([shift-modal.tsx#L106](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L106))

```text
`Chênh lệch (Lệch két): ${s.cashDifference! >= 0 ? `+${formatCurrency(s.cashDifference!, 'VND')}` : formatCurrency(s.cashDifference!, 'VND')}`
```


##### 📄 Trích đoạn Toàn văn Mẫu Z-Report Copy ([shift-modal.tsx#L89-L110](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/shift-modal.tsx#L89))
```ts
    const s = lastClosedShift;
    const text = [
      `=== BÁO CÁO CHỐT CA BÁN HÀNG (Z-REPORT) ===`,
      `Sự kiện: ${s.eventName}`,
      `Quầy: ${s.boothName}`,
      `Thu ngân: ${s.cashierName}`,
      `Bắt đầu: ${formatDate(s.startTime)}`,
      `Kết thúc: ${formatDate(s.endTime || '')}`,
      `------------------------------------------`,
      `Số đơn hàng trong ca: ${s.ordersCount} đơn`,
      `Tiền mặt đầu ca (Float): ${formatCurrency(s.startingCashFloat, 'VND')}`,
      `Doanh thu Tiền mặt: +${formatCurrency(s.totalCashSales, 'VND')}`,
      `Doanh thu VietQR: +${formatCurrency(s.totalQrSales, 'VND')}`,
      `TỔNG DOANH THU CA: ${formatCurrency(s.totalSales, 'VND')}`,
      `------------------------------------------`,
      `Tiền mặt kỳ vọng trong két: ${formatCurrency(s.expectedCashTotal || 0, 'VND')}`,
      `Tiền mặt thực đếm trong két: ${formatCurrency(s.closingCashCount || 0, 'VND')}`,
      `Chênh lệch (Lệch két): ${s.cashDifference! >= 0 ? `+${formatCurrency(s.cashDifference!, 'VND')}` : formatCurrency(s.cashDifference!, 'VND')}`,
      s.notes ? `Ghi chú bàn giao: ${s.notes}` : '',
      `Xác nhận bàn giao: Ký tên ....................`,
    ].filter(Boolean).join('\n');

```

#### 8.6 Modal Biên lai / In Hóa đơn (`ReceiptModal`)
> Nguồn: [src/components/pos/receipt-modal.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx) — **48** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L34](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L34) | Chuỗi JS / Fallback | literal | Quầy Bán Hàng |
| [L40](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L40) | Chuỗi JS / Fallback | literal | Sản phẩm Merchandise |
| [L52](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L52) | Mẫu văn bản (`...`) | template | `=== ${activeWorkspace?.name \|\| 'HIKARUSTORE'} ===` |
| [L53](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L53) | Mẫu văn bản (`...`) | template | `Đại diện: ${activeWorkspace.owner_name}` |
| [L55](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L55) | Mẫu văn bản (`...`) | template | `Địa chỉ: ${activeWorkspace.address}` |
| [L56](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L56) | Mẫu văn bản (`...`) | template | `Sự kiện: ${currentEvent}` |
| [L57](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L57) | Mẫu văn bản (`...`) | template | `Quầy: ${currentBooth}` |
| [L58](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L58) | Mẫu văn bản (`...`) | template | `Mã đơn: ${order.order_number}` |
| [L59](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L59) | Mẫu văn bản (`...`) | template | `Thời gian: ${formatDate(order.created_at)}` |
| [L63](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L63) | Mẫu văn bản (`...`) | template | ` [Collab: ${collabPartner}]` |
| [L64](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L64) | Mẫu văn bản (`...`) | template | `${productName} (${variantName})${tag} x${it.quantity}: ${formatCurrency(it.unit_price * it.quantity, activeWorkspace?.currency \|\| 'VND')}` |
| [L67](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L67) | Mẫu văn bản (`...`) | template | `Tạm tính: ${formatCurrency(order.subtotal_amount, activeWorkspace?.currency \|\| 'VND')}` |
| [L68](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L68) | Mẫu văn bản (`...`) | template | `Giảm giá: -${formatCurrency(order.discount_amount, activeWorkspace?.currency \|\| 'VND')}` |
| [L69](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L69) | Mẫu văn bản (`...`) | template | `TỔNG CỘNG: ${formatCurrency(order.final_amount, activeWorkspace?.currency \|\| 'VND')}` |
| [L70](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L70) | Mẫu văn bản (`...`) | template | `Hình thức: ${order.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}` |
| [L71](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L71) | Chuỗi JS / Fallback | literal | Cảm ơn quý khách đã ủng hộ! |
| [L82](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L82) | Thuộc tính HTML | title | Hóa Đơn & Biên Nhận Thanh Toán |
| [L87](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L87) | Văn bản JSX | text | Hóa đơn nhiệt chuẩn khổ 58mm / 80mm hoặc xem biên nhận điện tử |
| [L95](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L95) | Thuộc tính HTML | title | Sao chép toàn bộ biên lai dạng văn bản |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L98) | Chuỗi trong `{...}` | literal | Đã sao chép |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L98) | Chuỗi trong `{...}` | literal | Sao chép |
| [L105](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L105) | Thuộc tính HTML | title | In hóa đơn ra máy in nhiệt di động hoặc lưu file PDF |
| [L108](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L108) | Văn bản JSX | text | In Hóa Đơn |
| [L123](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L123) | Thuộc tính HTML | alt | Logo |
| [L125](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L125) | Chuỗi trong `{...}` | literal | HIKARUSTORE |
| [L127](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L127) | Văn bản JSX | text | Đại diện: |
| [L130](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L130) | Văn bản JSX | text | Hotline: |
| [L142](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L142) | Văn bản JSX | text | Mã đơn hàng: |
| [L146](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L146) | Văn bản JSX | text | Thời gian: |
| [L150](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L150) | Văn bản JSX | text | Hình thức: |
| [L152](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L152) | Chuỗi trong `{...}` | literal | Tiền mặt |
| [L152](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L152) | Chuỗi trong `{...}` | literal | VietQR Chuyển khoản |
| [L160](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L160) | Văn bản JSX | text | MÓN HÀNG |
| [L161](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L161) | Văn bản JSX | text | THÀNH TIỀN |
| [L171](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L171) | Văn bản JSX | text | [Collab: |
| [L175](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L175) | Chuỗi trong `{...}` | literal | VND |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L180) | Văn bản JSX | text | x |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L180) | Văn bản JSX | text | @ |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L180) | Chuỗi trong `{...}` | literal | VND |
| [L191](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L191) | Văn bản JSX | text | Tạm tính: |
| [L192](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L192) | Chuỗi trong `{...}` | literal | VND |
| [L196](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L196) | Văn bản JSX | text | Giảm giá: |
| [L197](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L197) | Chuỗi trong `{...}` | literal | VND |
| [L201](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L201) | Văn bản JSX | text | TỔNG THANH TOÁN: |
| [L202](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L202) | Chuỗi trong `{...}` | literal | VND |
| [L209](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L209) | Chuỗi trong `{...}` | literal | Cảm ơn bạn đã đồng hành và ủng hộ nghệ sĩ! |
| [L211](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L211) | Văn bản JSX | text | Vui lòng kiểm tra hàng hóa kỹ trước khi rời quầy. |
| [L224](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L224) | Văn bản JSX | text | Đóng |


##### 📄 Trích đoạn Toàn văn Mẫu Biên lai Văn bản ([receipt-modal.tsx#L50-L73](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L50))
```ts
  const handleCopyText = () => {
    const textReceipt = [
      `=== ${activeWorkspace?.name || 'HIKARUSTORE'} ===`,
      activeWorkspace?.owner_name ? `Đại diện: ${activeWorkspace.owner_name}` : '',
      activeWorkspace?.phone ? `Hotline: ${activeWorkspace.phone}` : '',
      activeWorkspace?.address ? `Địa chỉ: ${activeWorkspace.address}` : '',
      `Sự kiện: ${currentEvent}`,
      `Quầy: ${currentBooth}`,
      `Mã đơn: ${order.order_number}`,
      `Thời gian: ${formatDate(order.created_at)}`,
      `--------------------------------`,
      ...(order.items || []).map((it) => {
        const { productName, variantName, collabPartner } = getItemNames(it);
        const tag = collabPartner ? ` [Collab: ${collabPartner}]` : '';
        return `${productName} (${variantName})${tag} x${it.quantity}: ${formatCurrency(it.unit_price * it.quantity, activeWorkspace?.currency || 'VND')}`;
      }),
      `--------------------------------`,
      `Tạm tính: ${formatCurrency(order.subtotal_amount, activeWorkspace?.currency || 'VND')}`,
      order.discount_amount > 0 ? `Giảm giá: -${formatCurrency(order.discount_amount, activeWorkspace?.currency || 'VND')}` : '',
      `TỔNG CỘNG: ${formatCurrency(order.final_amount, activeWorkspace?.currency || 'VND')}`,
      `Hình thức: ${order.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}`,
      activeWorkspace?.slogan || 'Cảm ơn quý khách đã ủng hộ!',
    ]
      .filter(Boolean)
```

---

## Mục 9: Cổng Đối tác Collab (`/collab/[boothId]`)

#### 9.1 Cổng Hợp tác Gian hàng Đối tác (`/collab/[boothId]`)
> Nguồn: [src/app/[locale]/collab/[boothId]/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx) — **229** mục nội dung

Bao gồm màn hình đăng nhập đối tác (ghi chú mật khẩu mặc định `Collab@2026` ở giao diện), 3 tab quản lý (Kho & Nhập hàng, Bán hàng POS Collab, Đối soát & Chia sẻ doanh thu), mẫu tin nhắn copy gửi Zalo, và xuất file CSV `Doi-soat-Collab-${partnerName}.csv`.

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L111](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L111) | Chuỗi JS / Fallback | literal | Tiêu chuẩn (Free size) |
| [L150](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L150) | Chuỗi JS / Fallback | literal | Đối tác Liên danh |
| [L151](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L151) | Chuỗi JS / Fallback | literal | Sự kiện Collab 2026 |
| [L153](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L153) | Chuỗi JS / Fallback | literal | Gian hàng Hợp tác Collab |
| [L154](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L154) | Mẫu văn bản (`...`) | template | `evt-collab-${Date.now()}` |
| [L163](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L163) | Thuộc tính dữ liệu | location | Địa điểm sự kiện |
| [L164](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L164) | Mẫu văn bản (`...`) | template | `Sự kiện hợp tác cùng đối tác ${partnerParam}` |
| [L186](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L186) | Chuỗi JS / Fallback | literal | Đối tác Liên danh |
| [L188](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L188) | Chuỗi JS / Fallback | literal | Sự kiện chung |
| [L247](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L247) | Mẫu văn bản (`...`) | template | `Đối tác: ${partnerName}` |
| [L254](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L254) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Đối tác "${partnerName}" đã thêm sản phẩm mới "${productName}" (${pro...` |
| [L256](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L256) | Chuỗi JS / Fallback | field_label | Giá niêm yết |
| [L256](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L256) | Mẫu văn bản (`...`) | template | `${productPrice.toLocaleString('vi-VN')} VND` |
| [L257](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L257) | Chuỗi JS / Fallback | field_label | Số lượng mang đến |
| [L258](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L258) | Chuỗi JS / Fallback | field_label | Tự giữ chỗ VIP |
| [L259](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L259) | Chuỗi JS / Fallback | field_label | Đơn đặt mua online |
| [L280](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L280) | Mẫu văn bản (`...`) | template | `Đối tác: ${partnerName}` |
| [L284](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L284) | Chuỗi JS / Fallback | literal | Sản phẩm Collab |
| [L287](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L287) | Mẫu văn bản (`...`) | template | `Đối tác "${partnerName}" đã bổ sung thêm +${amount} sản phẩm "${targetVariant?.name \|\| 'Sản phẩm'}" vào quầy bán chung.` |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L289) | Chuỗi JS / Fallback | field_label | Số lượng bổ sung |
| [L297](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L297) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #2** bên dưới:_ ``${window.location.origin}/vi/collab/${boothId}?partner=${encodeURICom...` |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L303) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #3** bên dưới:_ ``🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE...` |
| [L345](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L345) | Mẫu văn bản (`...`) | template | `Đối tác: ${partnerName}` |
| [L349](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L349) | Thuộc tính dữ liệu | entity_name | Gói đồng bộ dữ liệu Collab |
| [L352](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L352) | Mẫu văn bản (`...`) | template | `Đối tác "${partnerName}" đã nạp và hợp nhất gói đồng bộ dữ liệu vào gian hàng "${currentBooth?.name}".` |
| [L354](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L354) | Chuỗi JS / Fallback | literal | ✅ Đã nạp và đồng bộ dữ liệu thành công! |
| [L358](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L358) | Chuỗi JS / Fallback | literal | ❌ Định dạng gói đồng bộ không hợp lệ. Vui lòng kiểm tra lại mã JSON. |
| [L373](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L373) | Hộp thoại `alert`/`confirm` | alert | alert(`Số tiền khách đưa chưa đủ! Còn thiếu ${cashShortage.toLocaleString('vi-VN')} VND.`) |
| [L382](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L382) | Mẫu văn bản (`...`) | template | `cashier-collab-${partnerName}` |
| [L386](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L386) | Mẫu văn bản (`...`) | template | `Đơn hàng bán tại Quầy Collab: ${partnerName}` |
| [L395](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L395) | Mẫu văn bản (`...`) | template | `Thu ngân Collab (${partnerName})` |
| [L399](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L399) | Mẫu văn bản (`...`) | template | `Đơn hàng #${order.order_number}` |
| [L402](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L402) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #4** bên dưới:_ ``Thu ngân quầy Collab hoàn tất đơn hàng #${order.order_number} trị giá...` |
| [L404](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L404) | Chuỗi JS / Fallback | field_label | Tổng tiền đơn |
| [L404](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L404) | Mẫu văn bản (`...`) | template | `${order.final_amount.toLocaleString('vi-VN')} VND` |
| [L405](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L405) | Chuỗi JS / Fallback | field_label | Phương thức |
| [L409](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L409) | Hộp thoại `alert`/`confirm` | alert | alert(`Lỗi khi tạo đơn: ${err instanceof Error ? err.message : 'Vui lòng kiểm tra lại tồn kho'}`) |
| [L445](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L445) | Thuộc tính HTML | title | Quay lại danh sách gian hàng |
| [L454](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L454) | Thuộc tính HTML | alt | HikaruStore Logo |
| [L462](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L462) | Chuỗi trong `{...}` | literal | Gian hàng Liên danh |
| [L466](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L466) | Văn bản JSX | text | Collab: |
| [L470](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L470) | Văn bản JSX | text | Đồng bộ trực tiếp |
| [L482](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L482) | Văn bản JSX | text | Chia sẻ doanh thu: |
| [L482](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L482) | Văn bản JSX | text | % Đối tác / |
| [L482](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L482) | Văn bản JSX | text | % Ban tổ chức |
| [L495](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L495) | Thuộc tính HTML | title | Trả hàng cho khách đã đặt trước (Bắt buộc chụp ảnh minh chứng) |
| [L498](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L498) | Văn bản JSX | text | Trả Hàng Đặt Trước |
| [L499](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L499) | Văn bản JSX | text | Trả hàng |
| [L511](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L511) | Văn bản JSX | text | Đã copy link! |
| [L516](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L516) | Văn bản JSX | text | Chia sẻ link Đối tác |
| [L528](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L528) | Chuỗi trong `{...}` | literal | Đóng POS Bán Hàng |
| [L528](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L528) | Chuỗi trong `{...}` | literal | Mở POS Bán Hàng |
| [L547](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L547) | Văn bản JSX | text | Kho & Sản Phẩm Đồng Bộ |
| [L563](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L563) | Văn bản JSX | text | Máy POS Bán Hàng |
| [L576](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L576) | Văn bản JSX | text | Đối Soát Doanh Thu & Đơn Hàng |
| [L592](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L592) | Văn bản JSX | text | Đồng Bộ Dữ Liệu 2 Chiều |
| [L604](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L604) | Văn bản JSX | text | Tổng Doanh Số Quầy |
| [L608](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L608) | Chuỗi trong `{...}` | literal | VND |
| [L612](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L612) | Văn bản JSX | text | Từ |
| [L612](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L612) | Văn bản JSX | text | giao dịch hoàn tất |
| [L617](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L617) | Văn bản JSX | text | Phần Đối Tác Nhận ( |
| [L621](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L621) | Chuỗi trong `{...}` | literal | VND |
| [L625](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L625) | Văn bản JSX | text | Khoản đối tác được quyết toán |
| [L630](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L630) | Văn bản JSX | text | Phần Ban Tổ Chức ( |
| [L634](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L634) | Chuỗi trong `{...}` | literal | VND |
| [L638](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L638) | Văn bản JSX | text | Chi phí tổ chức & vận hành |
| [L643](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L643) | Văn bản JSX | text | Hàng Hóa Đã Bán |
| [L647](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L647) | Văn bản JSX | text | món |
| [L652](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L652) | Văn bản JSX | text | Đang bày bán |
| [L652](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L652) | Văn bản JSX | text | mặt hàng |
| [L666](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L666) | Văn bản JSX | text | Kho Hàng & Danh Mục Sản Phẩm Chung |
| [L669](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L669) | Văn bản JSX | text | Đồng bộ hàng hóa của Đối tác và Ban tổ chức để bày bán chung tại gian hàng sự kiện này. |
| [L680](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L680) | Văn bản JSX | text | + Đóng góp hàng của Đối tác vào quầy |
| [L689](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L689) | Văn bản JSX | text | 📦 Hàng hóa do Đối tác ( |
| [L689](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L689) | Văn bản JSX | text | ) mang đến |
| [L692](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L692) | Văn bản JSX | text | sản phẩm |
| [L701](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L701) | Văn bản JSX | text | Đối tác chưa đóng góp sản phẩm nào vào gian hàng |
| [L704](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L704) | Văn bản JSX | text | Nhấn vào nút bên dưới để thêm các mặt hàng bạn mang tới sự kiện (Áo merch, photocard, móc khóa, phụ kiện...). |
| [L713](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L713) | Văn bản JSX | text | Thêm sản phẩm của bạn ngay |
| [L736](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L736) | Chuỗi trong `{...}` | literal | VND |
| [L748](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L748) | Văn bản JSX | text | Giữ chỗ: |
| [L754](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L754) | Văn bản JSX | text | Đơn onl: |
| [L762](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L762) | Văn bản JSX | text | Mang đến |
| [L768](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L768) | Văn bản JSX | text | Đang giữ |
| [L774](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L774) | Văn bản JSX | text | Đã bán |
| [L780](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L780) | Văn bản JSX | text | Bán tại quầy |
| [L788](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L788) | Văn bản JSX | text | Bổ sung hàng: |
| [L794](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L794) | Thuộc tính HTML | placeholder | SL |
| [L795](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L795) | Thuộc tính HTML | defaultValue | 10 |
| [L797](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L797) | Thuộc tính HTML | title | Nhập trực tiếp số lượng bổ sung |
| [L813](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L813) | Văn bản JSX | text | Bổ sung |
| [L829](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L829) | Văn bản JSX | text | 🎪 Hàng hóa do Ban Tổ Chức bán chung tại quầy |
| [L832](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L832) | Văn bản JSX | text | sản phẩm |
| [L838](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L838) | Văn bản JSX | text | Chưa có sản phẩm nào của Ban tổ chức tại quầy này. |
| [L859](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L859) | Chuỗi trong `{...}` | literal | VND |
| [L871](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L871) | Văn bản JSX | text | Giữ chỗ: |
| [L877](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L877) | Văn bản JSX | text | Đơn onl: |
| [L884](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L884) | Văn bản JSX | text | Hạn mức |
| [L890](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L890) | Văn bản JSX | text | Đang giữ |
| [L896](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L896) | Văn bản JSX | text | Đã bán |
| [L902](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L902) | Văn bản JSX | text | Bán tại quầy |
| [L925](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L925) | Thuộc tính HTML | placeholder | Tìm sản phẩm bán tại quầy (tên, mã loại)... |
| [L938](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L938) | Thuộc tính HTML | title | Tự động ẩn sản phẩm đã bán hết khỏi màn hình thu ngân |
| [L943](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L943) | Văn bản JSX | text | Đang ẩn hàng hết ( |
| [L948](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L948) | Văn bản JSX | text | Hiện tất cả ( |
| [L948](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L948) | Văn bản JSX | text | hết hàng) |
| [L957](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L957) | Văn bản JSX | text | Không tìm thấy sản phẩm nào |
| [L959](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L959) | Văn bản JSX | text | Hãy thêm sản phẩm vào gian hàng ở tab &ldquo;Kho &amp; Sản Phẩm Đồng Bộ&rdquo; trước khi bán. |
| [L1002](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1002) | Văn bản JSX | text | Giữ: |
| [L1007](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1007) | Văn bản JSX | text | Onl: |
| [L1014](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1014) | Chuỗi trong `{...}` | literal | Collab |
| [L1014](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1014) | Chuỗi trong `{...}` | literal | Host |
| [L1023](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1023) | Chuỗi trong `{...}` | literal | VND |
| [L1026](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1026) | Chuỗi trong `{...}` | literal | Hết hàng bán quầy |
| [L1026](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1026) | Mẫu văn bản (`...`) | template | `Bán quầy: ${available}` |
| [L1043](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1043) | Văn bản JSX | text | Giỏ Hàng Quầy Collab |
| [L1051](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1051) | Văn bản JSX | text | Xóa tất cả |
| [L1061](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1061) | Văn bản JSX | text | Chưa có món nào trong giỏ hàng |
| [L1062](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1062) | Văn bản JSX | text | Bấm vào sản phẩm bên trái để thêm |
| [L1072](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1072) | Chuỗi trong `{...}` | literal | VND |
| [L1100](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1100) | Thuộc tính HTML | title | Nhập trực tiếp số lượng |
| [L1132](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1132) | Văn bản JSX | text | Tạm tính ( |
| [L1132](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1132) | Văn bản JSX | text | món): |
| [L1133](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1133) | Chuỗi trong `{...}` | literal | VND |
| [L1136](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1136) | Văn bản JSX | text | Tổng thanh toán: |
| [L1138](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1138) | Chuỗi trong `{...}` | literal | VND |
| [L1142](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1142) | Văn bản JSX | text | Phần đối tác nhận ( |
| [L1144](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1144) | Chuỗi trong `{...}` | literal | VND |
| [L1161](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1161) | Văn bản JSX | text | Quét VietQR |
| [L1173](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1173) | Văn bản JSX | text | Tiền mặt |
| [L1181](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1181) | Văn bản JSX | text | Tài khoản nhận: |
| [L1188](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1188) | Thuộc tính HTML | alt | VietQR Payment |
| [L1193](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1193) | Văn bản JSX | text | 💡 Khi tài khoản báo |
| [L1193](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1193) | Văn bản JSX | text | &quot;ting ting&quot; |
| [L1193](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1193) | Văn bản JSX | text | có tiền, bấm nút bên dưới để hoàn tất đơn hàng và trừ kho ngay lập tức. |
| [L1204](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1204) | Văn bản JSX | text | ✓ Đã nhận tiền ( |
| [L1204](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1204) | Chuỗi trong `{...}` | literal | VND |
| [L1204](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1204) | Văn bản JSX | text | ) - Hoàn tất ngay |
| [L1213](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1213) | Văn bản JSX | text | Tổng cần thu: |
| [L1215](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1215) | Chuỗi trong `{...}` | literal | VND |
| [L1223](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1223) | Văn bản JSX | text | Tiền khách đưa (Nhập thủ công): |
| [L1231](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1231) | Văn bản JSX | text | Xóa |
| [L1245](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1245) | Thuộc tính HTML | placeholder | Nhập số tiền khách đưa... |
| [L1249](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1249) | Văn bản JSX | text | ₫ |
| [L1257](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1257) | Văn bản JSX | text | Nhập số tiền khách đưa để tính tiền thối |
| [L1263](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1263) | Văn bản JSX | text | Còn thiếu: |
| [L1265](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1265) | Chuỗi trong `{...}` | literal | VND |
| [L1269](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1269) | Văn bản JSX | text | Tiền cần thối lại: |
| [L1271](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1271) | Chuỗi trong `{...}` | literal | 0 ₫ (Vừa đủ) |
| [L1271](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1271) | Chuỗi trong `{...}` | literal | VND |
| [L1286](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1286) | Chuỗi trong `{...}` | literal | Đang hoàn tất đơn... |
| [L1288](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1288) | Mẫu văn bản (`...`) | template | `Chưa đủ tiền (Thiếu ${formatCurrency(cashShortage, activeWorkspace?.currency \|\| 'VND')})` |
| [L1289](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1289) | Chuỗi trong `{...}` | literal | Xác nhận Đã Thu Tiền & Bán Hàng |
| [L1299](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1299) | Văn bản JSX | text | Đã ghi nhận đơn |
| [L1299](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1299) | Văn bản JSX | text | ! |
| [L1302](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1302) | Văn bản JSX | text | Số tiền: |
| [L1302](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1302) | Chuỗi trong `{...}` | literal | VND |
| [L1302](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1302) | Văn bản JSX | text | • Phần đối tác: |
| [L1306](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1306) | Chuỗi trong `{...}` | literal | VND |
| [L1312](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1312) | Văn bản JSX | text | Tiền khách đưa: |
| [L1314](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1314) | Chuỗi trong `{...}` | literal | VND |
| [L1318](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1318) | Văn bản JSX | text | Tiền thối lại: |
| [L1320](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1320) | Chuỗi trong `{...}` | literal | VND |
| [L1330](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1330) | Văn bản JSX | text | Đóng thông báo |
| [L1347](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1347) | Văn bản JSX | text | Đối Soát Doanh Số Bán Hàng Chi Tiết |
| [L1349](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1349) | Văn bản JSX | text | Minh bạch toàn bộ giao dịch tại quầy. Cả 2 bên cùng theo dõi và đối soát chính xác theo thời gian thực. |
| [L1359](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1359) | Chuỗi JS / Fallback | literal | Mã đơn |
| [L1359](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1359) | Chuỗi JS / Fallback | literal | Thời gian |
| [L1359](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1359) | Chuỗi JS / Fallback | literal | Phương thức |
| [L1359](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1359) | Chuỗi JS / Fallback | literal | Tổng tiền |
| [L1359](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1359) | Mẫu văn bản (`...`) | template | `Phần đối tác (${revenueShareRatio}%)` |
| [L1363](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1363) | Chuỗi JS / Fallback | literal | VietQR |
| [L1363](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1363) | Chuỗi JS / Fallback | literal | Tiền mặt |
| [L1372](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1372) | Mẫu văn bản (`...`) | template | `Doi-soat-Collab-${partnerName}.csv` |
| [L1379](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1379) | Văn bản JSX | text | Xuất file đối soát (CSV) |
| [L1386](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1386) | Văn bản JSX | text | Chưa có đơn hàng nào được bán ra tại quầy |
| [L1388](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1388) | Văn bản JSX | text | Khi khách mua hàng qua POS tại quầy, hóa đơn và tiền chia sẻ sẽ lập tức nhảy vào đây. |
| [L1397](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1397) | Văn bản JSX | text | Mã đơn |
| [L1398](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1398) | Văn bản JSX | text | Thời gian |
| [L1399](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1399) | Văn bản JSX | text | Hình thức |
| [L1400](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1400) | Văn bản JSX | text | Tổng tiền |
| [L1402](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1402) | Văn bản JSX | text | Phần Đối tác ( |
| [L1405](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1405) | Văn bản JSX | text | Phần Ban tổ chức ( |
| [L1424](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1424) | Chuỗi trong `{...}` | literal | VietQR |
| [L1424](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1424) | Chuỗi trong `{...}` | literal | Tiền mặt |
| [L1428](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1428) | Chuỗi trong `{...}` | literal | VND |
| [L1431](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1431) | Chuỗi trong `{...}` | literal | VND |
| [L1434](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1434) | Chuỗi trong `{...}` | literal | VND |
| [L1457](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1457) | Văn bản JSX | text | 1. Xuất Gói Dữ Liệu Đồng Bộ Sang Ban Tổ Chức |
| [L1460](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1460) | Văn bản JSX | text | Khi bạn thêm sản phẩm mới hoặc bán đơn hàng offline, bấm nút bên dưới để sao chép toàn bộ gói dữ liệu gửi cho Ban tổ chức qua Zalo/Telegram. |
| [L1473](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1473) | Văn bản JSX | text | Đã sao chép gói dữ liệu vào bộ nhớ tạm! |
| [L1478](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1478) | Văn bản JSX | text | Sao chép Gói Dữ Liệu Đồng Bộ Mới Nhất |
| [L1484](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1484) | Văn bản JSX | text | Bao gồm trong gói: |
| [L1485](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1485) | Văn bản JSX | text | sản phẩm do đối tác đóng góp |
| [L1486](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1486) | Văn bản JSX | text | hóa đơn đã phát sinh tại quầy |
| [L1487](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1487) | Văn bản JSX | text | • Số lượng tồn kho và hạn mức quầy tính tới |
| [L1496](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1496) | Văn bản JSX | text | 2. Nạp Gói Dữ Liệu Từ Ban Tổ Chức |
| [L1499](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1499) | Văn bản JSX | text | Dán chuỗi dữ liệu JSON do Ban tổ chức gửi cho bạn vào ô bên dưới để cập nhật lại danh mục hàng hóa hoặc hạn mức quầy mới nhất. |
| [L1505](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1505) | Thuộc tính HTML | placeholder | Dán mã JSON gói đồng bộ tại đây... |
| [L1523](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1523) | Văn bản JSX | text | Nạp và Hợp Nhất Dữ Liệu Ngay |
| [L1534](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1534) | Thuộc tính HTML | title | Đóng Góp Sản Phẩm của Đối Tác Vào Gian Hàng |
| [L1535](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1535) | Mẫu văn bản (`...`) | template | `Sản phẩm sẽ được ghi nhận dưới tên đối tác "${partnerName}" và tự động cấp vào quầy để mở bán trên POS.` |
| [L1540](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1540) | Văn bản JSX | text | Tên sản phẩm / Merchandise |
| [L1545](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1545) | Thuộc tính HTML | placeholder | VD: Áo Thun Collab Limited, Card Bo Góc, Poster... |
| [L1554](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1554) | Văn bản JSX | text | Giá bán niêm yết (VND) |
| [L1569](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1569) | Văn bản JSX | text | Tổng số lượng mang đến |
| [L1586](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1586) | Văn bản JSX | text | Tự giữ trước (VIP / Cọc) |
| [L1594](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1594) | Thuộc tính HTML | placeholder | 0 |
| [L1597](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1597) | Văn bản JSX | text | Chủ động giữ riêng, không bán lẻ tại quầy |
| [L1603](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1603) | Văn bản JSX | text | Đã đặt mua Online / App |
| [L1611](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1611) | Thuộc tính HTML | placeholder | 0 |
| [L1614](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1614) | Văn bản JSX | text | Khách đã đặt trước nhận tại sự kiện |
| [L1618](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1618) | Văn bản JSX | text | Khả dụng mở bán tự do tại quầy POS: |
| [L1620](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1620) | Văn bản JSX | text | món |
| [L1628](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1628) | Văn bản JSX | text | Phân loại / Kích thước (Size/Màu) |
| [L1632](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1632) | Thuộc tính HTML | placeholder | VD: Size L, Màu Trắng... |
| [L1639](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1639) | Văn bản JSX | text | Mã loại (tùy chọn) |
| [L1642](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1642) | Thuộc tính HTML | placeholder | VD: COL-TSHIRT-L |
| [L1653](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1653) | Thuộc tính HTML | label | Ảnh chụp sản phẩm (Chụp trực tiếp tại quầy hoặc chọn từ điện thoại) |
| [L1660](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1660) | Văn bản JSX | text | Chính sách chia sẻ doanh thu: |
| [L1663](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1663) | Văn bản JSX | text | Mỗi món bán ra với giá |
| [L1663](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1663) | Chuỗi trong `{...}` | literal | VND |
| [L1663](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1663) | Văn bản JSX | text | sẽ mang lại |
| [L1665](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1665) | Chuỗi trong `{...}` | literal | VND |
| [L1667](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1667) | Văn bản JSX | text | %) cho |
| [L1678](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1678) | Văn bản JSX | text | Hủy |
| [L1686](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1686) | Văn bản JSX | text | Xác nhận Đồng bộ vào Gian hàng |
| [L1703](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1703) | Văn bản JSX | text | HikaruStore Collab Partner Portal — Hệ thống quản lý và đồng bộ gian hàng sự kiện chuyên nghiệp. |
| [L1715](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1715) | Văn bản JSX | text | Đang khởi tạo Cổng Đối Tác Hợp Tác... |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([page.tsx#L254](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L254))

```text
`Đối tác "${partnerName}" đã thêm sản phẩm mới "${productName}" (${productQty} món) vào gian hàng "${currentBooth.name}". Tự giữ chỗ: ${productReservedQty}, Đã đặt online: ${productOnlineQty}.`
```

##### 📄 Mẫu #2 — Mẫu văn bản (`...`) ([page.tsx#L297](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L297))

```text
`${window.location.origin}/vi/collab/${boothId}?partner=${encodeURIComponent(
      partnerName
    )}&event=${encodeURIComponent(eventName)}&ratio=${revenueShareRatio}&name=${encodeURIComponent(
      currentBooth?.name || 'Gian hàng Collab'
    )}`
```

##### 📄 Mẫu #3 — Mẫu văn bản (`...`) ([page.tsx#L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L303))

```text
`🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE
• Sự kiện: ${eventName}
• Gian hàng liên danh: ${currentBooth?.name || 'Gian hàng Collab'}
• Đối tác: ${partnerName}
• Tỷ lệ chia sẻ doanh thu: ${revenueShareRatio}% cho Đối tác

👉 Nhấn vào liên kết sau để mở Cổng Đối tác, đồng bộ hàng hóa và xem doanh thu thời gian thực:
${url}`
```

##### 📄 Mẫu #4 — Mẫu văn bản (`...`) ([page.tsx#L402](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L402))

```text
`Thu ngân quầy Collab hoàn tất đơn hàng #${order.order_number} trị giá ${order.final_amount.toLocaleString('vi-VN')} VND (Hình thức: ${order.payment_method}).`
```


##### 📄 Trích đoạn Khối xuất CSV Đối soát Collab ([collab/[boothId]/page.tsx#L1358-L1379](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L1358))
```ts
                  const csvRows = [
                    ['Mã đơn', 'Thời gian', 'Phương thức', 'Tổng tiền', `Phần đối tác (${revenueShareRatio}%)`],
                    ...boothOrders.map((o) => [
                      o.order_number,
                      new Date(o.created_at).toLocaleTimeString('vi-VN'),
                      o.payment_method === 'qr_manual' ? 'VietQR' : 'Tiền mặt',
                      o.final_amount,
                      (o.final_amount * revenueShareRatio) / 100,
                    ]),
                  ];
                  const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Doi-soat-Collab-${partnerName}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất file đối soát (CSV)</span>
```

---

## Mục 10: Modals Hỗ trợ, Xuất Excel & API AI

#### 10.1 Modal Tạo Sự kiện từ Poster bằng AI (`AiEventPosterModal`)
> Nguồn: [src/components/events/ai-event-poster-modal.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx) — **37** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L37](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L37) | Chuỗi JS / Fallback | literal | Không thể đọc file ảnh |
| [L40](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L40) | Chuỗi JS / Fallback | literal | Định dạng hình ảnh không hợp lệ |
| [L123](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L123) | Chuỗi JS / Fallback | literal | Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP). |
| [L144](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L144) | Chuỗi JS / Fallback | literal | Không thể nhận diện nội dung trên ảnh poster. |
| [L156](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L156) | Chuỗi JS / Fallback | literal | Error analyzing poster: |
| [L157](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L157) | Chuỗi JS / Fallback | literal | Lỗi phân tích ảnh poster. |
| [L227](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L227) | Thuộc tính HTML | title | Tự động thêm sự kiện từ ảnh Poster / Banner (AI) |
| [L228](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L228) | Thuộc tính HTML | description | Tải hoặc dán ảnh poster sự kiện để AI tự động trích xuất tên sự kiện, ngày tháng năm và địa điểm. |
| [L261](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L261) | Văn bản JSX | text | Kéo thả hoặc bấm để chọn ảnh Poster sự kiện |
| [L264](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L264) | Văn bản JSX | text | Hỗ trợ PNG, JPG, WebP. Bạn cũng có thể bấm |
| [L264](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L264) | Văn bản JSX | text | Ctrl + V |
| [L264](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L264) | Văn bản JSX | text | để dán trực tiếp ảnh từ bộ nhớ tạm. |
| [L274](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L274) | Văn bản JSX | text | Chọn ảnh từ máy tính |
| [L286](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L286) | Văn bản JSX | text | Đang quét và nhận diện sự kiện từ poster... |
| [L289](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L289) | Văn bản JSX | text | AI đang trích xuất: Tên sự kiện, Thời gian (Ngày / Tháng / Năm), Địa điểm |
| [L302](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L302) | Văn bản JSX | text | Vui lòng thử lại với ảnh rõ nét hơn hoặc điền thông tin sự kiện thủ công. |
| [L313](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L313) | Văn bản JSX | text | Thử lại |
| [L325](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L325) | Thuộc tính HTML | alt | Poster preview |
| [L337](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L337) | Văn bản JSX | text | Đổi ảnh khác |
| [L347](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L347) | Văn bản JSX | text | AI đã trích xuất thành công: |
| [L347](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L347) | Văn bản JSX | text | Vui lòng kiểm tra lại thông tin dưới đây và nhấn xác nhận. |
| [L357](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L357) | Văn bản JSX | text | Tên sự kiện |
| [L362](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L362) | Thuộc tính HTML | placeholder | Ví dụ: BEYOND FESTIVAL 2027 |
| [L371](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L371) | Văn bản JSX | text | Ngày bắt đầu |
| [L385](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L385) | Văn bản JSX | text | Ngày kết thúc |
| [L399](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L399) | Văn bản JSX | text | Địa điểm tổ chức |
| [L403](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L403) | Thuộc tính HTML | placeholder | Ví dụ: SECC Quận 7, TP. Hồ Chí Minh |
| [L412](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L412) | Văn bản JSX | text | Trạng thái |
| [L420](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L420) | Văn bản JSX | text | Sắp diễn ra |
| [L421](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L421) | Văn bản JSX | text | Đang diễn ra |
| [L422](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L422) | Văn bản JSX | text | Bản nháp |
| [L423](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L423) | Văn bản JSX | text | Đã kết thúc |
| [L439](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L439) | Văn bản JSX | text | Lưu ảnh này làm Banner đại diện sự kiện |
| [L445](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L445) | Văn bản JSX | text | Mô tả / Slogan |
| [L451](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L451) | Thuộc tính HTML | placeholder | Ghi chú, thông điệp sự kiện... |
| [L466](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L466) | Văn bản JSX | text | Hủy |
| [L475](file:///D:/Codes/QuanLyGianHangHKT/src/components/events/ai-event-poster-modal.tsx#L475) | Văn bản JSX | text | Xác nhận & Thêm sự kiện |


#### 10.2 Modal Gửi Báo lỗi / Đề xuất (`FeedbackModal`)
> Nguồn: [src/components/feedback/feedback-modal.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx) — **52** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L42) | Chuỗi JS / Fallback | literal | POS Bán hàng |
| [L92](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L92) | Chuỗi JS / Fallback | literal | Người dùng ẩn danh |
| [L115](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L115) | Chuỗi trong `{...}` | title | Gửi thành công! |
| [L115](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L115) | Chuỗi trong `{...}` | title | Góp ý & Báo lỗi |
| [L118](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L118) | Chuỗi trong `{...}` | description | Ý kiến của bạn đã được ghi nhận vào hệ thống. |
| [L119](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L119) | Chuỗi trong `{...}` | description | Gửi phản hồi hoặc báo lỗi để chúng tôi cải thiện hệ thống. |
| [L131](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L131) | Văn bản JSX | text | Cảm ơn bạn đã đóng góp! |
| [L134](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L134) | Văn bản JSX | text | Báo cáo của bạn đã được chuyển tới Admin để tổng hợp và xử lý. |
| [L140](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L140) | Văn bản JSX | text | Đóng |
| [L158](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L158) | Văn bản JSX | text | Báo lỗi |
| [L171](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L171) | Văn bản JSX | text | Tính năng |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L184) | Văn bản JSX | text | Trải nghiệm |
| [L197](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L197) | Văn bản JSX | text | Khác |
| [L205](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L205) | Văn bản JSX | text | Khu vực / Chức năng gặp vấn đề: |
| [L213](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L213) | Thuộc tính HTML | value | POS Bán hàng |
| [L213](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L213) | Văn bản JSX | text | POS Bán hàng (Thu ngân, giỏ hàng, quét QR) |
| [L214](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L214) | Thuộc tính HTML | value | Kho & Phân bổ |
| [L214](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L214) | Văn bản JSX | text | Quản lý Kho & Phân bổ hàng hóa |
| [L215](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L215) | Thuộc tính HTML | value | Sản phẩm & Biến thể |
| [L215](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L215) | Văn bản JSX | text | Sản phẩm, biến thể & Ảnh chụp |
| [L216](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L216) | Thuộc tính HTML | value | Đơn hàng & Thanh toán |
| [L216](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L216) | Văn bản JSX | text | Đơn hàng, tiền mặt & Đối soát |
| [L217](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L217) | Thuộc tính HTML | value | Sự kiện & Gian hàng |
| [L217](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L217) | Văn bản JSX | text | Sự kiện, tour diễn & Quầy bán |
| [L218](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L218) | Thuộc tính HTML | value | Cổng Collab Hợp tác |
| [L218](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L218) | Văn bản JSX | text | Cổng Collab (Đối tác bán chung) |
| [L219](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L219) | Thuộc tính HTML | value | Giao diện & Hiển thị |
| [L219](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L219) | Văn bản JSX | text | Giao diện Sáng / Tối (Theme) & Font chữ |
| [L220](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L220) | Thuộc tính HTML | value | Đăng nhập & Quyền |
| [L220](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L220) | Văn bản JSX | text | Đăng nhập, phân quyền & Tài khoản |
| [L221](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L221) | Thuộc tính HTML | value | Tính năng khác |
| [L221](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L221) | Văn bản JSX | text | Tính năng khác |
| [L227](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L227) | Văn bản JSX | text | Mức độ ưu tiên / Ảnh hưởng: |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L235) | Văn bản JSX | text | Thấp — Ý kiến tham khảo / Cải tiến nhỏ |
| [L236](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L236) | Văn bản JSX | text | Bình thường — Cần cải thiện trong bản tới |
| [L237](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L237) | Văn bản JSX | text | Cao — Ảnh hưởng đến thao tác sử dụng |
| [L238](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L238) | Văn bản JSX | text | Khẩn cấp — Lỗi nghiêm trọng / Chặn đứng bán hàng |
| [L246](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L246) | Chuỗi trong `{...}` | literal | Tóm tắt lỗi gặp phải: |
| [L246](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L246) | Chuỗi trong `{...}` | literal | Tiêu đề góp ý / Ý tưởng mới: |
| [L253](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L253) | Chuỗi trong `{...}` | placeholder | VD: Bấm thanh toán bằng VietQR nhưng không hiện mã QR... |
| [L254](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L254) | Chuỗi trong `{...}` | placeholder | VD: Cần thêm tính năng in hóa đơn khổ 80mm... |
| [L265](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L265) | Văn bản JSX | text | Mô tả chi tiết & các bước xảy ra: |
| [L271](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L271) | Thuộc tính HTML | placeholder | Vui lòng mô tả cụ thể bạn đang thao tác ở bước nào, lỗi hiển thị ra sao hoặc bạn mong muốn hệ thống hoạt động như thế nào... |
| [L283](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L283) | Thuộc tính HTML | label | Ảnh chụp màn hình lỗi / Ảnh minh họa (tùy chọn): |
| [L291](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L291) | Văn bản JSX | text | Người gửi (Họ tên): |
| [L295](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L295) | Thuộc tính HTML | placeholder | VD: Tuấn Admin, Thu ngân Linh... |
| [L304](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L304) | Văn bản JSX | text | Email / SĐT liên hệ lại (nếu cần): |
| [L308](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L308) | Thuộc tính HTML | placeholder | email@example.com / 090... |
| [L319](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L319) | Văn bản JSX | text | Hủy |
| [L329](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L329) | Văn bản JSX | text | Gửi phản hồi cho Admin |
| [L352](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L352) | Thuộc tính HTML | title | Báo cáo lỗi hoặc đóng góp ý kiến cải thiện website |
| [L355](file:///D:/Codes/QuanLyGianHangHKT/src/components/feedback/feedback-modal.tsx#L355) | Văn bản JSX | text | Góp ý & Báo lỗi |


#### 10.3 Modal Kiểm kê Kho thực tế (`StocktakeModal`)
> Nguồn: [src/components/inventory/stocktake-modal.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx) — **30** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L82](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L82) | Chuỗi JS / Fallback | loss | Thất thoát / Không rõ nguyên nhân |
| [L83](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L83) | Chuỗi JS / Fallback | damaged | Hư hỏng / Lỗi tem mác / Rách |
| [L84](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L84) | Chuỗi JS / Fallback | gift | Tặng nghệ sĩ / VIP / Ban tổ chức |
| [L85](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L85) | Chuỗi JS / Fallback | unrecorded_return | Khách đổi trả chưa vào máy |
| [L86](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L86) | Chuỗi JS / Fallback | count_error | Sai lệch kiểm đếm khi nhận kho |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L107) | Mẫu văn bản (`...`) | template | `${product?.name} (${variant?.name}): lệch ${delta > 0 ? `+${delta}` : delta} món (Lý do: ${reasonText})` |
| [L113](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L113) | Chuỗi JS / Fallback | literal | Nhân viên kiểm kho |
| [L117](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L117) | Mẫu văn bản (`...`) | template | `Kiểm kê quầy ${booth.name}` |
| [L120](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L120) | Mẫu văn bản (`...`) | template | _Xem **Mẫu #1** bên dưới:_ ``Kiểm kê thực tế quầy "${booth.name}". Tổng chênh lệch: ${totalDelta >...` |
| [L136](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L136) | Mẫu văn bản (`...`) | template | `Kiểm Kê Tồn Kho Quầy: ${booth.name}` |
| [L137](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L137) | Mẫu văn bản (`...`) | template | `Đối chiếu số lượng hàng thực tế tại quầy với số liệu hệ thống (${event?.name \|\| 'Sự kiện'})` |
| [L145](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L145) | Văn bản JSX | text | Đã ghi nhận kết quả kiểm kê và tự động cân bằng tồn kho quầy thành công! |
| [L153](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L153) | Văn bản JSX | text | Nhập số lượng thực đếm tại quầy. Hệ thống sẽ tự động tính độ lệch và lưu vết giải trình vào Nhật ký hoạt động. |
| [L160](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L160) | Văn bản JSX | text | Quầy này chưa được phân bổ món hàng nào. |
| [L179](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L179) | Văn bản JSX | text | Phân loại: |
| [L179](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L179) | Văn bản JSX | text | • Mã loại: |
| [L183](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L183) | Văn bản JSX | text | Tồn hệ thống: |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L184) | Văn bản JSX | text | món |
| [L190](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L190) | Văn bản JSX | text | Thực đếm: |
| [L207](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L207) | Chuỗi trong `{...}` | literal | Khớp |
| [L213](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L213) | Văn bản JSX | text | Lý do lệch: |
| [L219](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L219) | Văn bản JSX | text | Thất thoát / Chưa rõ |
| [L220](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L220) | Văn bản JSX | text | Hư hỏng / Lỗi tem |
| [L221](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L221) | Văn bản JSX | text | Tặng nghệ sĩ / VIP |
| [L222](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L222) | Văn bản JSX | text | Khách đổi chưa nhập |
| [L223](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L223) | Văn bản JSX | text | Sai lệch đếm ban đầu |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L235) | Văn bản JSX | text | Ghi chú đợt kiểm kê: |
| [L237](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L237) | Thuộc tính HTML | placeholder | Kiểm kê đầu ngày / Cuối show... |
| [L246](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L246) | Văn bản JSX | text | Hủy |
| [L255](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L255) | Văn bản JSX | text | Xác Nhận & Cân Bằng Kho |

##### 📄 Mẫu #1 — Mẫu văn bản (`...`) ([stocktake-modal.tsx#L120](file:///D:/Codes/QuanLyGianHangHKT/src/components/inventory/stocktake-modal.tsx#L120))

```text
`Kiểm kê thực tế quầy "${booth.name}". Tổng chênh lệch: ${totalDelta > 0 ? `+${totalDelta}` : totalDelta} món.${
        generalNotes ? ` Ghi chú: ${generalNotes}.` : ''
      } Chi tiết: ${changesSummary.join('; ') || 'Không có lệch kho'}.`
```


#### 10.4 Trình Xuất Báo cáo Excel 4 Sheet (`export-excel.ts`)
> Nguồn: [src/lib/export-excel.ts](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts) — **125** mục nội dung

Tạo file `.xlsx` mang tên `EventMate_${sanitizedName}_${timeStamp}.xlsx` (hoặc `EventMate_ToanBoTour_...`) gồm **4 sheet**: `Tổng quan & Tài chính`, `Chi tiết Đơn hàng`, `Hiệu suất Quầy & Collab`, và `Tồn kho & Phân bổ Mã loại`.

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L28](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L28) | Chuỗi JS / Fallback | literal | EventMate Workspace |
| [L29](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L29) | Chuỗi JS / Fallback | literal | VND |
| [L36](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L36) | Chuỗi JS / Fallback | literal | Toàn bộ sự kiện (Tất cả Tour) |
| [L84](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L84) | Chuỗi JS / Fallback | literal | BÁO CÁO TOÀN DIỆN VẬN HÀNH & DOANH THU SỰ KIỆN |
| [L85](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L85) | Chuỗi JS / Fallback | literal | Hệ thống Quản lý Bán hàng & Phân bổ Hàng hóa EventMate |
| [L87](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L87) | Chuỗi JS / Fallback | literal | 1. THÔNG TIN CHUNG |
| [L88](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L88) | Chuỗi JS / Fallback | literal | Workspace / Tổ chức: |
| [L88](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L88) | Chuỗi JS / Fallback | literal | Thời gian xuất báo cáo: |
| [L89](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L89) | Chuỗi JS / Fallback | literal | Tên sự kiện / Tour: |
| [L89](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L89) | Chuỗi JS / Fallback | literal | Địa điểm tổ chức: |
| [L89](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L89) | Chuỗi JS / Fallback | literal | Đa địa điểm |
| [L91](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L91) | Chuỗi JS / Fallback | literal | Thời gian diễn ra: |
| [L92](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L92) | Chuỗi JS / Fallback | literal | Toàn tour |
| [L93](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L93) | Chuỗi JS / Fallback | literal | Đơn vị tiền tệ: |
| [L97](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L97) | Chuỗi JS / Fallback | literal | 2. CHỈ SỐ KINH DOANH CHÍNH |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L98) | Chuỗi JS / Fallback | literal | Chỉ số |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L98) | Chuỗi JS / Fallback | literal | Giá trị |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L98) | Chuỗi JS / Fallback | literal | Đơn vị tính |
| [L98](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L98) | Chuỗi JS / Fallback | literal | Ghi chú |
| [L99](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L99) | Chuỗi JS / Fallback | literal | Tổng doanh thu thực tế (Revenue): |
| [L99](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L99) | Chuỗi JS / Fallback | literal | Đã trừ chiết khấu / giảm giá |
| [L100](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L100) | Chuỗi JS / Fallback | literal | Tổng tiền tạm tính (Subtotal): |
| [L100](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L100) | Chuỗi JS / Fallback | literal | Trước giảm giá |
| [L101](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L101) | Chuỗi JS / Fallback | literal | Tổng chiết khấu / Giảm giá (Discounts): |
| [L101](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L101) | Chuỗi JS / Fallback | literal | Khuyến mãi cho khách |
| [L102](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L102) | Chuỗi JS / Fallback | literal | Tổng số đơn hàng thành công (Orders): |
| [L102](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L102) | Chuỗi JS / Fallback | literal | Đơn |
| [L102](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L102) | Chuỗi JS / Fallback | literal | Giao dịch POS |
| [L103](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L103) | Chuỗi JS / Fallback | literal | Tổng số món hàng xuất kho (Units Sold): |
| [L103](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L103) | Chuỗi JS / Fallback | literal | Món / Chiếc |
| [L103](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L103) | Chuỗi JS / Fallback | literal | Merchandise thực tế đã giao |
| [L104](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L104) | Chuỗi JS / Fallback | literal | Giá trị đơn hàng trung bình (AOV): |
| [L104](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L104) | Mẫu văn bản (`...`) | template | `${currency}/đơn` |
| [L104](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L104) | Chuỗi JS / Fallback | literal | Doanh thu / Số đơn |
| [L105](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L105) | Chuỗi JS / Fallback | literal | Tổng số quầy bán hoạt động: |
| [L105](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L105) | Chuỗi JS / Fallback | literal | Quầy |
| [L105](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L105) | Chuỗi JS / Fallback | literal | Bao gồm Solo & Collab |
| [L107](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L107) | Chuỗi JS / Fallback | literal | 3. DÒNG TIỀN THEO PHƯƠNG THỨC THANH TOÁN |
| [L108](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L108) | Chuỗi JS / Fallback | literal | Phương thức |
| [L108](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L108) | Chuỗi JS / Fallback | literal | Số đơn |
| [L108](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L108) | Chuỗi JS / Fallback | literal | Tổng tiền (VND) |
| [L108](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L108) | Chuỗi JS / Fallback | literal | Tỷ trọng % |
| [L110](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L110) | Chuỗi JS / Fallback | literal | Chuyển khoản VietQR (Ngân hàng): |
| [L116](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L116) | Chuỗi JS / Fallback | literal | Tiền mặt tại két (Cash): |
| [L122](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L122) | Chuỗi JS / Fallback | literal | Cổng thanh toán / POS thẻ (Gateway): |
| [L127](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L127) | Chuỗi JS / Fallback | literal | Tổng cộng dòng tiền: |
| [L129](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L129) | Chuỗi JS / Fallback | literal | 4. ĐỐI SOÁT CHIA SẺ DOANH THU COLLAB |
| [L130](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L130) | Chuỗi JS / Fallback | literal | Khoản mục |
| [L130](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L130) | Chuỗi JS / Fallback | literal | Số tiền (VND) |
| [L130](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L130) | Chuỗi JS / Fallback | literal | Ghi chú |
| [L131](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L131) | Chuỗi JS / Fallback | literal | Tổng doanh thu từ các gian hàng Collab: |
| [L131](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L131) | Chuỗi JS / Fallback | literal | Quầy hợp tác nghệ sĩ/đối tác |
| [L132](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L132) | Chuỗi JS / Fallback | literal | Phần chi trả cho Đối tác Collab: |
| [L132](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L132) | Chuỗi JS / Fallback | literal | Theo tỷ lệ % hợp đồng thỏa thuận |
| [L133](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L133) | Chuỗi JS / Fallback | literal | Doanh thu thực nhận của BTC / Nghệ sĩ: |
| [L133](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L133) | Chuỗi JS / Fallback | literal | Sau khi đã trừ phần chia đối tác |
| [L138](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L138) | Chuỗi JS / Fallback | literal | Tổng quan & Tài chính |
| [L145](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L145) | Chuỗi JS / Fallback | literal | Sự kiện |
| [L156](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L156) | Chuỗi JS / Fallback | literal | 1 món |
| [L160](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L160) | Chuỗi JS / Fallback | literal | Tiền mặt |
| [L161](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L161) | Chuỗi JS / Fallback | literal | Chuyển khoản VietQR |
| [L162](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L162) | Chuỗi JS / Fallback | literal | Cổng thẻ POS |
| [L166](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L166) | Chuỗi JS / Fallback | literal | Mã đơn hàng |
| [L167](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L167) | Chuỗi JS / Fallback | literal | Thời gian tạo |
| [L168](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L168) | Chuỗi JS / Fallback | literal | Sự kiện |
| [L169](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L169) | Chuỗi JS / Fallback | literal | Gian hàng |
| [L169](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L169) | Chuỗi JS / Fallback | literal | Quầy POS |
| [L170](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L170) | Chuỗi JS / Fallback | literal | Mã quầy |
| [L171](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L171) | Chuỗi JS / Fallback | literal | Thu ngân |
| [L171](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L171) | Chuỗi JS / Fallback | literal | Thu ngân POS |
| [L172](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L172) | Chuỗi JS / Fallback | literal | Hình thức |
| [L173](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L173) | Chuỗi JS / Fallback | literal | Trạng thái |
| [L173](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L173) | Chuỗi JS / Fallback | literal | Hoàn tất |
| [L174](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L174) | Chuỗi JS / Fallback | literal | Đồng bộ |
| [L174](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L174) | Chuỗi JS / Fallback | literal | Đã đồng bộ |
| [L174](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L174) | Chuỗi JS / Fallback | literal | Chờ đồng bộ (Offline) |
| [L175](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L175) | Chuỗi JS / Fallback | literal | Số lượng (Món) |
| [L176](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L176) | Chuỗi JS / Fallback | literal | Chi tiết sản phẩm đã mua |
| [L177](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L177) | Chuỗi JS / Fallback | literal | Tạm tính (VND) |
| [L178](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L178) | Chuỗi JS / Fallback | literal | Giảm giá (VND) |
| [L179](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L179) | Chuỗi JS / Fallback | literal | Tổng thanh toán (VND) |
| [L180](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L180) | Chuỗi JS / Fallback | literal | Tiền khách đưa (VND) |
| [L181](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L181) | Chuỗi JS / Fallback | literal | Tiền thối lại (VND) |
| [L182](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L182) | Chuỗi JS / Fallback | literal | Ảnh nhận hàng |
| [L182](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L182) | Chuỗi JS / Fallback | literal | Có ảnh chụp |
| [L182](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L182) | Chuỗi JS / Fallback | literal | Không |
| [L183](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L183) | Chuỗi JS / Fallback | literal | Ghi chú |
| [L184](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L184) | Chuỗi JS / Fallback | literal | Khóa đối soát Idempotency |
| [L211](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L211) | Chuỗi JS / Fallback | literal | Chi tiết Đơn hàng |
| [L233](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L233) | Chuỗi JS / Fallback | literal | Tên gian hàng |
| [L234](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L234) | Chuỗi JS / Fallback | literal | Mã quầy |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L235) | Chuỗi JS / Fallback | literal | Mô hình |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L235) | Chuỗi JS / Fallback | literal | Hợp tác Collab |
| [L235](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L235) | Chuỗi JS / Fallback | literal | Gian hàng Độc lập |
| [L236](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L236) | Chuỗi JS / Fallback | literal | Đối tác Collab |
| [L236](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L236) | Chuỗi JS / Fallback | literal | Đối tác |
| [L237](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L237) | Chuỗi JS / Fallback | literal | Tỷ lệ chia (%) |
| [L238](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L238) | Chuỗi JS / Fallback | literal | Số đơn hàng |
| [L239](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L239) | Chuỗi JS / Fallback | literal | Món đã bán |
| [L240](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L240) | Chuỗi JS / Fallback | literal | Tổng doanh thu (VND) |
| [L241](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L241) | Chuỗi JS / Fallback | literal | Thu tiền mặt (VND) |
| [L242](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L242) | Chuỗi JS / Fallback | literal | Thu VietQR (VND) |
| [L243](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L243) | Chuỗi JS / Fallback | literal | Phần chi trả Đối tác (VND) |
| [L244](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L244) | Chuỗi JS / Fallback | literal | Thực nhận BTC / Nghệ sĩ (VND) |
| [L264](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L264) | Chuỗi JS / Fallback | literal | Hiệu suất Quầy & Collab |
| [L294](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L294) | Chuỗi JS / Fallback | literal | Mã loại |
| [L295](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L295) | Chuỗi JS / Fallback | literal | Mã vạch Barcode |
| [L296](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L296) | Chuỗi JS / Fallback | literal | Tên sản phẩm |
| [L297](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L297) | Chuỗi JS / Fallback | literal | Biến thể (Size/Màu) |
| [L298](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L298) | Chuỗi JS / Fallback | literal | Đơn giá (VND) |
| [L299](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L299) | Chuỗi JS / Fallback | literal | Tổng nhập kho |
| [L300](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L300) | Chuỗi JS / Fallback | literal | Giữ chỗ VIP (Reserved) |
| [L301](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L301) | Chuỗi JS / Fallback | literal | Đặt trước Online (Pre-order) |
| [L302](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L302) | Chuỗi JS / Fallback | literal | Đã cấp cho quầy (Allocated) |
| [L303](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L303) | Chuỗi JS / Fallback | literal | Đã bán thành công (Sold) |
| [L304](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L304) | Chuỗi JS / Fallback | literal | Doanh thu theo Mã loại (VND) |
| [L305](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L305) | Chuỗi JS / Fallback | literal | Khả dụng tại quầy |
| [L306](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L306) | Chuỗi JS / Fallback | literal | Kho trung tâm còn lại |
| [L307](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L307) | Chuỗi JS / Fallback | literal | Trạng thái |
| [L309](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L309) | Chuỗi JS / Fallback | literal | Hết hàng tại quầy |
| [L311](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L311) | Chuỗi JS / Fallback | literal | Sắp hết |
| [L312](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L312) | Chuỗi JS / Fallback | literal | Đang mở bán |
| [L335](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L335) | Chuỗi JS / Fallback | literal | Tồn kho & Phân bổ Mã loại |
| [L340](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L340) | Chuỗi JS / Fallback | literal | EventMate_ToanBoTour |
| [L344](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts#L344) | Mẫu văn bản (`...`) | template | `EventMate_${sanitizedName}_${timeStamp}.xlsx` |


#### 10.5 API Kiểm tra Kết nối Gemini (`/api/ai/test`)
> Nguồn: [src/app/api/ai/test/route.ts](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/ai/test/route.ts) — **5** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L13](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/ai/test/route.ts#L13) | Thuộc tính dữ liệu | error | Chưa cấu hình GEMINI_API_KEY trong file .env.local |
| [L25](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/ai/test/route.ts#L25) | Thuộc tính dữ liệu | text | Ping test |
| [L34](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/ai/test/route.ts#L34) | Mẫu văn bản (`...`) | template | `Google API phản hồi lỗi ${response.status}: ${errText}` |
| [L44](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/ai/test/route.ts#L44) | Thuộc tính dữ liệu | message | Kết nối Google Gemini AI thành công và sẵn sàng hoạt động! |
| [L48](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/ai/test/route.ts#L48) | Chuỗi JS / Fallback | literal | Lỗi kết nối tới Google Generative Language API |


#### 10.6 API Trích xuất Thông tin Poster (`/api/events/extract-poster`)
> Nguồn: [src/app/api/events/extract-poster/route.ts](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts) — **7** mục nội dung

| Dòng | Loại | Ngữ cảnh / Key | Nội dung gốc (Verbatim) |
| :--- | :--- | :--- | :--- |
| [L12](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts#L12) | Thuộc tính dữ liệu | error | Vui lòng cung cấp hình ảnh (dạng base64 hoặc Data URL) |
| [L26](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts#L26) | Thuộc tính dữ liệu | error | Chưa cấu hình GEMINI_API_KEY trong biến môi trường (.env.local). Vui lòng thêm GEMINI_API_KEY để sử dụng tính năng trích xuất bằng AI. |
| [L42](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts#L42) | Chuỗi JS / Fallback | literal | _Xem **Mẫu #1** bên dưới:_ `Bạn là chuyên gia trích xuất thông tin sự kiện từ ảnh poster, banner, ...` |
| [L119](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts#L119) | Chuỗi JS / Fallback | literal | Không thể phân tích dữ liệu từ ảnh |
| [L125](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts#L125) | Chuỗi JS / Fallback | literal | Sự kiện mới |
| [L135](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts#L135) | Chuỗi JS / Fallback | literal | Error in /api/events/extract-poster: |
| [L136](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts#L136) | Chuỗi JS / Fallback | literal | Lỗi xử lý trích xuất ảnh sự kiện |

##### 📄 Mẫu #1 — Chuỗi JS / Fallback ([route.ts#L42](file:///D:/Codes/QuanLyGianHangHKT/src/app/api/events/extract-poster/route.ts#L42))

```text
Bạn là chuyên gia trích xuất thông tin sự kiện từ ảnh poster, banner, vé mời, flyer.
Hãy phân tích hình ảnh và trích xuất các thông tin sau:
1. name: Tên chính xác của sự kiện (viết hoa chuẩn, ngắn gọn rõ ràng, ví dụ: "BEYOND FESTIVAL").
2. startDate: Ngày giờ bắt đầu theo định dạng YYYY-MM-DDTHH:mm (nếu không có giờ, mặc định là 08:00). Lưu ý đúng năm và tháng (tiếng Anh như JAN=01, FEB=02, MAR=03... hoặc tiếng Việt).
3. endDate: Ngày giờ kết thúc theo định dạng YYYY-MM-DDTHH:mm (nếu poster ghi dải ngày ví dụ "JAN 16-17 2027", thì startDate là 2027-01-16T08:00 và endDate là 2027-01-17T22:00. Nếu chỉ có 1 ngày duy nhất thì endDate là cùng ngày đó lúc 22:00).
4. location: Địa điểm tổ chức nếu xuất hiện trong ảnh (hoặc chuỗi rỗng nếu không có).
5. description: Khẩu hiệu, slogan, thể loại hoặc nghệ sĩ nổi bật trên poster (hoặc chuỗi rỗng nếu không có).

Chỉ trả về JSON thuần túy theo định dạng:
{
  "name": "...",
  "startDate": "YYYY-MM-DDTHH:mm",
  "endDate": "YYYY-MM-DDTHH:mm",
  "location": "...",
  "description": "..."
}
```


---

## Mục 11: Tổng hợp Các Điểm Chưa Đồng Bộ & Gợi ý Chuẩn hóa

Phần này tóm tắt toàn bộ các chỗ đang xung đột hoặc viết cứng để bạn quyết định chuẩn hóa một lần cho gọn:

### 11.1 Xung đột Thương hiệu: `HikaruStore` vs `EventMate` vs `Hạc Cầm`
Hiện trong codebase đang tồn tại song song 3 lớp tên thương hiệu hiển thị cho người dùng:
- **`HikaruStore`** (**56** vị trí khớp trong `src/` & `manifest.json` + **5** chuỗi nội bộ/email): Title web ([layout.tsx#L19](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/layout.tsx#L19)), `manifest.json`, Trang Khách xem ([guest-showcase.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx)), Trang Login ([login/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx)), Sidebar/Topbar/WorkspaceSwitcher, Biên lai in nhiệt ([receipt-modal.tsx#L125](file:///D:/Codes/QuanLyGianHangHKT/src/components/pos/receipt-modal.tsx#L125)), Z-Report logo alt, trang Thanh toán & Cài đặt (file backup `HikaruStore_Backup_*.json`).
- **`EventMate`** (**35** vị trí hiển thị/kiểm tra/xuất file + **46** khóa lưu trữ/tên miền nội bộ):
  - `messages/vi.json` & `messages/en.json` ([vi.json#L3](file:///D:/Codes/QuanLyGianHangHKT/messages/vi.json#L3): `common.appName`, `auth.loginTitle`, `artist@eventmate.com`, `crew@eventmate.com`).
  - Tiêu đề tin nhắn Zalo cấp link & tài khoản Collab (`— EVENTMATE` ở [booths/page.tsx#L133](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L133), [L166](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L166), [L721](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L721), [collab/[boothId]/page.tsx#L303](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx#L303)).
  - Mẫu copy tài khoản nhân viên (`EventMate - Thông tin đăng nhập` ở [team/page.tsx#L107](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx#L107)).
  - Bảng hướng dẫn `Quy tắc 5 trạng thái kho EventMate:` ([products/page.tsx#L1233](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx#L1233)).
  - Trang Góp ý: tiêu đề xuất Markdown `# 📋 KẾ HOẠCH UPDATE PHẦN MỀM EVENTMATE` ([feedback/page.tsx#L88](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/feedback/page.tsx#L88)) và tên file JSON `eventmate_feedback_export_*.json`.
  - Trang Cài đặt: trường `appName: 'EventMate'` khi xuất backup và thông báo `File sao lưu không hợp lệ hoặc không phải từ hệ thống EventMate.` ([settings/page.tsx#L217](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L217)) — lệch với tên file tải về là `HikaruStore_Backup_*.json` ([settings/page.tsx#L196](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L196))!
  - Tên file Xuất báo cáo: `EventMate_BaoCaoDoanhThu_*.csv` ([analytics/page.tsx#L84](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx#L84)), `eventmate-audit-logs-*.json` ([logs/page.tsx#L131](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/logs/page.tsx#L131)), `EventMate_*.xlsx` / `EventMate Workspace` / `EventMate_ToanBoTour` ([export-excel.ts](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts)).
  - Dữ liệu mẫu [preorder-store.ts#L72](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L72) (`Đơn đặt trước trên Website EventMate...`).
- **`Hạc Cầm`**: Xuất hiện trong dữ liệu mẫu ban đầu ở [data-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts) (`Fanmeeting "Hạc Cầm" 2026`, `Hạc Cầm Live Tour`), `orders-store.ts`, `preorder-store.ts`, `audit-store.ts`, `feedback-store.ts`, và placeholder gợi ý tên sự kiện/sản phẩm ở [events/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/events/page.tsx), [products/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx).

### 11.2 Lệch pha Đa ngôn ngữ (`next-intl`)
- Toàn bộ `messages/vi.json` & `messages/en.json` có **203** keys, nhưng chỉ **116** keys thực sự nối với UI (`Sidebar`, một phần `Dashboard`, `Events`, `Booths`, `Products`, `Inventory`, `Register`, `Forgot Password`, `Accept Invitation`, phần tiền tệ & demo của `Settings`, `SyncStatusBadge`).
- **87** keys (`team.*`, `nav.group*`, `auth.login*`, phần lớn `settings.*`, `inventory.allocateButton/availableToSell/...`, `common.appName/tagline/...`) hiện **không được sử dụng** trong JSX, đồng thời các màn hình tương ứng (`/login`, `/pos`, `/collab`, `GuestShowcase`, `orders`, `payments`, `team`, `logs`, `feedback`, `analytics`) đều viết cứng tiếng Việt trực tiếp.
- Khi người dùng bấm nút chuyển sang `EN` ở [language-switcher.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/ui/language-switcher.tsx), phần lớn trang vẫn giữ nguyên tiếng Việt hoặc hiển thị trộn lẫn Anh – Việt.

### 11.3 Thông tin Cá nhân, Tài khoản/Mật khẩu Demo & API Key Che mờ Viết cứng
Các chuỗi nhạy cảm hoặc mang tính cá nhân/thử nghiệm sau đang xuất hiện trực tiếp trong giao diện hoặc store mặc định:
| Chuỗi viết cứng | Ngữ cảnh xuất hiện | Vị trí tham chiếu |
| :--- | :--- | :--- |
| `Tuanadminvippro666` / `Tu@n1121314151` | Nút điền nhanh Admin + placeholder ô đăng nhập + tài khoản khởi tạo | [login/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx), [auth-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts) |
| `HKT87@123` / `HKT@997804` | Nút điền nhanh Admin HKT + placeholder ô đăng nhập + tài khoản khởi tạo | [login/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx), [auth-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts) |
| `collab_genz` / `Collab@123` & `Collab@2026` | Nút điền nhanh + tài khoản mẫu + thông báo mật khẩu mặc định Collab | [login/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(auth)/login/page.tsx), [auth-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/auth-store.ts), [collab/[boothId]/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/collab/[boothId]/page.tsx) |
| `Nguyễn Văn Tuấn`, `NGUYEN VAN TUAN - HIKARUSTORE`, `0988.776.655`, `contact@hikarustore.vn`, `https://zalo.me/0988776655` | Thông tin mặc định Workspace / QR Ngân hàng / Fallback Hotline GuestShowcase | [workspace-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/workspace-store.ts), [orders-store.ts](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts), [settings/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx), [guest-showcase.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/guest/guest-showcase.tsx) |
| `AQ.Ab8RN6••••••••5w9Q` | Chuỗi API key Gemini giả lập che mờ viết tĩnh trên giao diện Cài đặt (không phản ánh key thật trong `.env.local`) | [settings/page.tsx#L637](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx#L637) |

### 11.4 Chưa đồng nhất Thuật ngữ, Tiền tố Mã & Vai trò
- **Tên biến thể sản phẩm:** Lúc dùng `"Mã loại"` ([products/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/products/page.tsx), [export-excel.ts](file:///D:/Codes/QuanLyGianHangHKT/src/lib/export-excel.ts)), lúc dùng `"Biến thể"` hoặc `"SKU"`.
- **Chỉ số tồn bán tại quầy:** Lúc ghi `"Khả dụng bán"`, lúc ghi `"Tồn bán offline"`, lúc ghi `"Khả dụng tại quầy"`.
- **Nhãn vai trò người xem:** Lúc gọi `"Khách xem"` ([team/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/team/page.tsx), [pos/page.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx)), lúc hiện chuỗi fallback `"Viewer"` hoặc `"Collab Partner"` tiếng Anh ở [topbar.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/topbar.tsx) / [sidebar.tsx](file:///D:/Codes/QuanLyGianHangHKT/src/components/dashboard/sidebar.tsx).
- **Tiền tố mã đơn & Nội dung chuyển khoản VietQR:**
  - Đơn POS tạo mã `EM-xxxx` ([orders-store.ts#L228](file:///D:/Codes/QuanLyGianHangHKT/src/stores/orders-store.ts#L228)).
  - Nội dung chuyển khoản VietQR mặc định `EM ${cartOrderPreview}` ([pos/page.tsx#L1676](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/pos/page.tsx#L1676)).
  - Đơn pickup đặt trước tạo mã `PU-xxxx` ([preorder-store.ts#L237](file:///D:/Codes/QuanLyGianHangHKT/src/stores/preorder-store.ts#L237)).
  - Mã quầy Collab tự sinh `COL-XXX-xxxx` ([data-store.ts#L880](file:///D:/Codes/QuanLyGianHangHKT/src/stores/data-store.ts#L880)).
- **Tên tệp khi tải xuống:** Trộn lẫn `HikaruStore_Backup_*.json`, `EventMate_BaoCaoDoanhThu_*.csv`, `EventMate_*.xlsx`, `eventmate_feedback_export_*.json`, `eventmate-audit-logs-*.json`, `Doi-soat-Collab-*.csv`.
- **Khóa trạng thái Gian hàng (`booths.statusList.*`):** Từ điển i18n định nghĩa `booths.statusList.paused` ([vi.json](file:///D:/Codes/QuanLyGianHangHKT/messages/vi.json)), nhưng [booths/page.tsx#L391](file:///D:/Codes/QuanLyGianHangHKT/src/app/[locale]/(dashboard)/dashboard/booths/page.tsx#L391) lại gọi động `statusList.${booth.status as 'active' | 'inactive' | 'closed'}` (ép kiểu `'inactive'` không khớp khóa `paused`).

### 11.5 Khóa Lưu trữ Trình duyệt (`localStorage` / `IndexedDB`)
> Lưu ý kỹ thuật: Nếu đổi tên thương hiệu hoàn toàn, cân nhắc có đổi tên khóa `localStorage` hay giữ nguyên để không làm mất dữ liệu đang lưu trên trình duyệt của người dùng cũ:
- `eventmate_workspace_state_v3`, `eventmate_core_data_v3`, `eventmate_auth_state_v4`, `eventmate_orders_state_v3`, `eventmate_preorders_v1`, `eventmate_audit_logs_v1`, `eventmate_feedback_v1`
- `eventmate-theme`, `eventmate-density`, `eventmate-active-shift`, `eventmate-past-shifts`
- `eventmate_guest_phone`, `eventmate_dashboard_selected_event`, `eventmate_pos_selected_event`, `eventmate_pos_selected_booth`, `eventmate_shared_bank_config`, `eventmate_bank_sync`
