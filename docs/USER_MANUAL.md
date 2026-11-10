# SỔ TAY HƯỚNG DẪN SỬ DỤNG HỆ THỐNG EVENTMATE
### Nền tảng Quản lý Gian hàng, Điều phối Kho & POS Bán hàng Sự kiện chuyên nghiệp
*Phiên bản tài liệu: 2.0 (Cập nhật tháng 11/2026)*

---

## MỤC LỤC TỔNG QUAN

1. [GIỚI THIỆU CHUNG & TRIẾT LÝ VẬN HÀNH](#1-giới-thiệu-chung--triết-lý-vận-hành)
   - 1.1. Mục tiêu và phạm vi ứng dụng
   - 1.2. Phân quyền vai trò người dùng (RBAC)
   - 1.3. Cơ chế cách ly dữ liệu: Thực tế vs Thử nghiệm (Sandbox)
2. [HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN & CHỦ SHOP (ADMIN / OWNER)](#2-hướng-dẫn-dành-cho-quản-trị-viên--chủ-shop-admin--owner)
   - 2.1. Quản lý Không gian làm việc (Workspace) & Đa sự kiện
   - 2.2. Quản lý Sản phẩm, Danh mục & Biến thể SKU
   - 2.3. Cấu hình Tài khoản Ngân hàng thụ hưởng VietQR
   - 2.4. Thiết lập Quầy bán (Solo vs Collab chia sẻ doanh thu)
   - 2.5. Phân quyền và Mời nhân viên vào Đội ngũ
3. [QUẢN TRỊ TỒN KHO & ĐIỀU PHỐI HÀNG HÓA (INVENTORY)](#3-quản-trị-tồn-kho--điều-phối-hàng-hóa-inventory)
   - 3.1. Mô hình Kho 2 lớp: Kho tổng (Central) & Kho quầy (Allocated)
   - 3.2. Quản lý Hàng đặt trước Online (Pre-order) & Hàng giữ chỗ (Reserved)
   - 3.3. Quy trình Cấp hàng & Điều chuyển tức thì (Stock Transfer)
   - 3.4. Cơ chế chống bán âm và khóa tồn thời gian thực
4. [HƯỚNG DẪN THAO TÁC MÁY BÁN HÀNG POS (DÀNH CHO THU NGÂN)](#4-hướng-dẫn-thao-tác-máy-bán-hàng-pos-dành-cho-thu-ngân)
   - 4.1. Đăng nhập và Chọn Quầy làm việc tại sự kiện
   - 4.2. Thao tác Chọn hàng & Tìm kiếm nhanh (SKU, Tên, Barcode)
   - 4.3. Quản lý Giỏ hàng & Kiểm tra số lượng khả dụng
   - 4.4. Quy trình Thanh toán Tiền mặt (Hỗ trợ thối tiền nhanh)
   - 4.5. Quy trình Thanh toán Chuyển khoản VietQR tự động
   - 4.6. Quy trình Trả hàng Đặt trước (Pre-order Pickup) & Chụp ảnh đối soát
   - 4.7. Chế độ Mất mạng (Offline Mode) & Tự động đồng bộ
5. [BÁO CÁO DOANH THU & ĐỐI SOÁT KẾ TOÁN](#5-báo-cáo-doanh-thu--đối-soát-kế-toán)
   - 5.1. Bảng theo dõi Doanh số thời gian thực (Dashboard)
   - 5.2. Đối soát Doanh thu Gian hàng Collab (Chia phần đối tác)
   - 5.3. Xuất dữ liệu Kế toán định dạng CSV
6. [NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) & HỖ TRỢ BÁO LỖI](#6-nhật-ký-kiểm-toán-audit-logs--hỗ-trợ-báo-lỗi)
   - 6.1. Tra cứu Lịch sử hoạt động và Biến động kho
   - 6.2. Gửi ý kiến đóng góp & Báo cáo sự cố (Feedback System)
7. [BẢNG TỔNG HỢP CÂU HỎI THƯỜNG GẶP (FAQ) & XỬ LÝ SỰ CỐ TẠI CHỖ](#7-bảng-tổng-hợp-câu-hỏi-thường-gặp-faq--xử-lý-sự-cố-tại-chỗ)

---

## 1. GIỚI THIỆU CHUNG & TRIẾT LÝ VẬN HÀNH

### 1.1. Mục tiêu và phạm vi ứng dụng
**EventMate** là hệ sinh thái phần mềm chuyên biệt được tối ưu hóa cho các sự kiện biểu diễn trực tiếp (Concert, Music Festival, Fan Meeting, Pop-up Exhibition). Nơi diễn ra hoạt động bán Merchandise (quà lưu niệm, phụ kiện, đĩa nhạc, lightstick) với áp lực phục vụ lưu lượng khán giả cực lớn trong thời gian ngắn ngủi trước và sau giờ diễn.

Hệ thống giải quyết 4 bài toán cốt lõi:
1. **Tốc độ bán tại quầy:** Thao tác tạo đơn và thanh toán siêu tốc (dưới 5 giây/đơn).
2. **Không thất thoát kho:** Mô hình phân bổ kho 2 lớp chặt chẽ, ngăn chặn tuyệt đối tình trạng bán vượt số lượng (overselling) khi nhiều thu ngân cùng bán một mặt hàng.
3. **Thanh toán không gián đoạn:** Tự động sinh mã VietQR động theo từng đơn hàng vào thẳng tài khoản ngân hàng của đơn vị tổ chức; đồng thời hỗ trợ vận hành 100% khi mất kết nối mạng Internet (Offline-first).
4. **Minh bạch đối soát Collab:** Tính toán tự động tỷ lệ chia sẻ doanh thu cho nghệ sĩ khách mời hoặc đối tác nhãn hàng đồng hành.

---

### 1.2. Phân quyền vai trò người dùng (RBAC)

| Vai trò | Tên hiển thị | Quyền hạn chính |
| :--- | :--- | :--- |
| **Workspace Owner** | Chủ gian hàng | Toàn quyền quản trị hệ thống, quản lý tài chính, phân quyền nhân sự, cấu hình ngân hàng, xóa đơn test. |
| **Event Coordinator** | Điều phối sự kiện | Quản lý danh sách sự kiện, quầy bán, lập danh mục sản phẩm, theo dõi doanh số tổng quan. |
| **Inventory Staff** | Thủ kho sự kiện | Nhập kho, điều chuyển hàng hóa giữa Kho tổng và các Quầy bán, kiểm kê tồn kho. |
| **Cashier** | Thu ngân POS | Bán hàng trực tiếp tại quầy được chỉ định, quét mã QR/thu tiền mặt, xử lý giao hàng Pre-order. |
| **Collab Partner** | Đối tác Collab | Xem bảng báo cáo doanh thu trực tiếp đối với các sản phẩm hợp tác của gian hàng mình phụ trách. |

---

### 1.3. Cơ chế cách ly dữ liệu: Thực tế vs Thử nghiệm (Sandbox)
Để phục vụ việc đào tạo thu ngân và diễn tập trước giờ mở cửa mà không làm sai lệch số liệu kế toán:
* **Dữ liệu Thực tế (Production):** Bao gồm tất cả các giao dịch, phân bổ kho tại các tour diễn chính thức (Ví dụ: *Hạc Cầm Live Concert - Hà Nội*, *Hạc Cầm Tour - TP. Hồ Chí Minh*).
* **Dữ liệu Thử nghiệm (Sandbox):** Hoạt động thử nghiệm POS tại sự kiện `🧪 Sự kiện Test (Chạy thử nghiệm POS)` và quầy `Quầy Test POS 01`.
* **Quy tắc cách ly tuyệt đối:** Khi xem *"Tất cả sự kiện"* trên Dashboard Tổng quan, Báo cáo Doanh thu, Két tiền mặt hay Tồn kho, hệ thống **tự động loại trừ 100% các đơn test**. Doanh thu test không bao giờ được tính vào tổng doanh thu thật. Bạn có thể xóa sạch đơn test bất kỳ lúc nào bằng nút **`[Xóa đơn test]`**.

---

## 2. HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN & CHỦ SHOP (ADMIN / OWNER)

### 2.1. Quản lý Không gian làm việc (Workspace) & Đa sự kiện
* **Chuyển đổi Workspace:** Nhấp vào tên Workspace ở góc trên cùng của thanh điều hướng bên trái để đổi gian hàng nếu bạn quản lý nhiều nhãn hàng khác nhau.
* **Tạo sự kiện mới (`/dashboard/events`):**
  1. Vào menu **Sự kiện & Tour**.
  2. Bấm nút **`+ Tạo sự kiện`**.
  3. Điền các trường thông tin:
     - Tên sự kiện (Ví dụ: *Hạc Cầm Live Concert - Hà Nội*).
     - Địa điểm tổ chức (Ví dụ: *Trung tâm Hội nghị Quốc gia, Hà Nội*).
     - Thời gian bắt đầu và Thời gian kết thúc.
     - Mô tả ghi chú và trạng thái (*Bản nháp*, *Sắp diễn ra*, hoặc *Đang hoạt động*).
  4. Bấm **Lưu sự kiện**.

### 2.2. Quản lý Sản phẩm, Danh mục & Biến thể SKU (`/dashboard/products`)
Hệ thống quản lý sản phẩm theo mô hình **Sản phẩm cha (Product) - Biến thể con (Variant)** để đáp ứng linh hoạt các phân loại như Kích cỡ (Size S/M/L) hay Màu sắc.

#### Các bước thêm sản phẩm mới:
1. Vào menu **Sản phẩm & Biến thể**, bấm **`+ Thêm sản phẩm`**.
2. Nhập thông tin cơ bản: Tên sản phẩm, Danh mục (Áo quần, Phụ kiện, Đĩa nhạc, Quà tặng).
3. **Hình ảnh sản phẩm:** Bạn có thể:
   - Tải ảnh có sẵn từ máy tính / điện thoại.
   - Bấm biểu tượng **Chụp ảnh** để chụp ảnh sản phẩm mẫu trực tiếp bằng camera thiết bị.
4. **Khai báo biến thể:**
   - Mã SKU (Ví dụ: `HC-TSHIRT-BLK-S`).
   - Tên biến thể (Ví dụ: `Size S`).
   - Giá bán niêm yết (VND).
   - Mã vạch Barcode (nếu có để quét tít tít tại quầy).
   - Tổng số lượng nhập kho (Total Inventory).
   - **Hàng giữ chỗ nội bộ (Reserved):** Số lượng dành riêng cho khách mời VIP/BTC (không xuất bán tự do).
   - **Hàng đặt trước Online (Online Pre-order):** Số lượng khách đã trả tiền trước qua web để nhận hàng tại concert.
5. Bấm **Lưu sản phẩm**.

---

### 2.3. Cấu hình Tài khoản Ngân hàng thụ hưởng VietQR (`/dashboard/payments`)
Để tiền bán hàng tại tất cả các máy POS tự động chảy thẳng về tài khoản ngân hàng của bạn mà không cần nhập số tài khoản thủ công:
1. Vào menu **Thanh toán**.
2. Tại mục **Cấu hình Ngân hàng thụ hưởng VietQR**, điền:
   - **Mã Ngân hàng (BIN / Bank Code):** Chọn ngân hàng thụ hưởng (Ví dụ: `MB`, `VCB`, `TCB`, `ACB`, `ICB`...).
   - **Số tài khoản:** Nhập chính xác số tài khoản nhận tiền.
   - **Tên chủ tài khoản:** Nhập tên in hoa không dấu (Ví dụ: `NGUYEN VAN A`).
3. Bấm nút **`Lưu cấu hình`**.
4. Toàn bộ các máy POS trên hệ thống sẽ áp dụng tức thì. Khi thu ngân bấm *"Thanh toán VietQR"*, mã QR động kèm đúng số tiền và nội dung đơn hàng sẽ tự động hiện lên màn hình.

---

### 2.4. Thiết lập Quầy bán (Solo vs Collab chia sẻ doanh thu) (`/dashboard/booths`)
Trong mỗi sự kiện, bạn có thể thiết lập nhiều quầy bán (Ví dụ: Quầy Cổng chính, Quầy Khu VIP, Quầy Check-in).

* **Quầy độc lập (Solo):** 100% doanh thu thuộc về đơn vị tổ chức.
* **Quầy hợp tác (Collab):** Dành riêng cho gian hàng kết hợp với Nghệ sĩ khách mời hoặc Nhãn hàng tài trợ.
  - Bật tùy chọn **Gian hàng Collab**.
  - Nhập **Tên đối tác** (Ví dụ: *Nghệ sĩ Khách mời X*).
  - Nhập **Tỷ lệ chia sẻ doanh thu (%)** (Ví dụ: `40%`).
  - Hệ thống sẽ cung cấp một **Đường link theo dõi riêng (Collab Portal Link)** để đối tác có thể tự đăng nhập theo dõi doanh số minh bạch mà không xem được dữ liệu nhạy cảm của các quầy khác.

---

### 2.5. Phân quyền và Mời nhân viên vào Đội ngũ (`/dashboard/team`)
1. Vào menu **Đội ngũ & Phân quyền**.
2. Nhập Email nhân viên và chọn vai trò: *Điều phối viên (Event Coordinator)*, *Thủ kho (Inventory Staff)* hoặc *Thu ngân (Cashier)*.
3. Bấm **Gửi lời mời**. Nhân viên truy cập đường dẫn được cấp để bắt đầu làm việc.

---

## 3. QUẢN TRỊ TỒN KHO & ĐIỀU PHỐI HÀNG HÓA (INVENTORY)

### 3.1. Mô hình Kho 2 lớp: Kho tổng & Kho quầy
Nhằm tránh tình trạng thất thoát hàng hóa tại các sự kiện đông đúc, EventMate áp dụng cấu trúc phân bổ 2 lớp:
```
TỔNG NHẬP KHO (Total Inventory)
   ├── Hàng giữ chỗ nội bộ (Reserved) -> Khóa cố định, không bán tự do
   ├── Hàng đặt trước Online (Pre-order) -> Chờ trả hàng theo mã đơn
   └── HÀNG KHẢ DỤNG BÁN TẠI CONCERT (Free Stock)
          ├── KHO TỔNG DỰ PHÒNG (Central Storage)
          └── PHÂN BỔ QUẦY 1, QUẦY 2... (Booth Allocations)
```

* **Kho tổng dự phòng (Central Storage):** Lượng hàng lưu tại xe tải hoặc kho trung tâm của sân vận động.
* **Phân bổ quầy (Allocated Quantity):** Lượng hàng thực tế đã được bưng bê bàn giao cho nhân viên thu ngân tại từng quầy. Thu ngân tại quầy đó **chỉ được phép bán tối đa trong hạn mức này**.

---

### 3.2. Quản lý Hàng đặt trước Online & Hàng giữ chỗ
* **Hàng đặt trước (Pre-order):** Được quản lý theo danh sách khách hàng đã thanh toán trước. Hàng này nằm tại quầy trả hàng chuyên dụng và không bị tính lẫn vào số lượng bán tự do của khách vãng lai.
* **Hàng giữ chỗ (Reserved):** Đảm bảo ban tổ chức không bao giờ rơi vào cảnh thiếu áo size đặc biệt cho ca sĩ, ban nhạc hoặc khách VIP đối tác.

---

### 3.3. Quy trình Cấp hàng & Điều chuyển tức thì (Stock Transfer)
Tại trang **Kho & Phân bổ (`/dashboard/inventory`)**:
1. Chọn **Sự kiện** và chọn **Quầy bán** cần thao tác.
2. Tại từng dòng sản phẩm / biến thể, bạn sẽ nhìn thấy:
   - *Tồn kho tổng:* Tổng lượng hàng nhập vào.
   - *Kho tổng còn:* Lượng hàng chưa cấp phát cho quầy nào.
   - *Đã cấp cho quầy:* Số lượng quầy này đang giữ.
   - *Đã bán tại quầy:* Số lượng thu ngân quầy này đã xuất đơn thành công.
   - *Khả dụng tại quầy:* `Số đã cấp - Số đã bán`.
3. **Cấp thêm hàng từ Kho tổng ra Quầy:** Bấm nút **`+10`**, **`+50`** hoặc nhập số lượng và bấm dấu **`+`**.
4. **Thu hồi hàng thừa từ Quầy về Kho tổng:** Bấm dấu **`-`**. Lưu ý: Hệ thống **chặn không cho thu hồi vượt quá số lượng còn lại** (không thể thu hồi hàng mà quầy đã bán cho khách).

---

### 3.4. Cơ chế chống bán âm và khóa tồn thời gian thực
Khi 2 thu ngân tại cùng một quầy cùng thêm món hàng cuối cùng vào giỏ:
- Hệ thống áp dụng cơ chế xác thực tồn kho khả dụng tức thì (Optimistic lock combined with allocation verification).
- Ngay khi một thu ngân hoàn tất thanh toán, quầy bên cạnh sẽ nhận thông báo sản phẩm đã hết hàng.
- Nút thêm vào giỏ tự động vô hiệu hóa thành **`Hết hàng`**, ngăn chặn 100% tình trạng nhận tiền của khách xong không có hàng giao.

---

## 4. HƯỚNG DẪN THAO TÁC MÁY BÁN HÀNG POS (DÀNH CHO THU NGÂN)

Giao diện Bán hàng POS (`/pos`) được tối ưu hóa đặc biệt cho màn hình cảm ứng, iPad, máy POS cầm tay và điện thoại thông minh.

### 4.1. Đăng nhập và Chọn Quầy làm việc tại sự kiện
1. Truy cập đường dẫn `/pos` trên trình duyệt thiết bị bán hàng.
2. Chọn đúng **Sự kiện** bạn đang làm việc (Ví dụ: *Hạc Cầm Live Concert - Hà Nội*).
3. Chọn đúng **Quầy bán** của bạn (Ví dụ: *Quầy A - Cổng chính*).
4. Góc trên bên phải sẽ hiển thị chấm trạng thái mạng:
   - Chấm xanh lá: `● Trực tuyến (Online)`
   - Chấm vàng cam: `● Ngoại tuyến (Offline)`

---

### 4.2. Thao tác Chọn hàng & Tìm kiếm nhanh
* **Tìm kiếm:** Gõ tên sản phẩm, ký hiệu viết tắt hoặc mã SKU vào ô tìm kiếm.
* **Lọc theo biến thể:** Bấm trực tiếp vào các nút Size (`Size S`, `Size M`, `Size L`...) trên thẻ sản phẩm để chuyển đổi biến thể.
* **Xem số lượng còn:** Mỗi thẻ sản phẩm hiển thị nhãn tồn rõ ràng:
  - `Còn 40`: Số lượng quầy bạn còn có thể bán.
  - `Hết hàng`: Quầy đã bán hết (cần liên hệ thủ kho cấp thêm).

---

### 4.3. Quản lý Giỏ hàng
* Bấm vào nút **`+ Thêm vào giỏ`** để đưa món hàng vào giỏ bên phải.
* Tăng giảm số lượng trực tiếp bằng các nút **`+`** hoặc **`-`** trong danh sách giỏ hàng.
* Nút **`Xóa tất cả`**: Làm sạch giỏ hàng nhanh khi khách đổi ý.
* Áp dụng mã giảm giá / chiết khấu nếu có chính sách ưu đãi.

---

### 4.4. Quy trình Thanh toán Tiền mặt (Cash)
1. Trong giỏ hàng, bấm nút **`THANH TOÁN (Số tiền)`**.
2. Chọn tab **`Tiền mặt`**.
3. **Tính tiền thối siêu nhanh:**
   - Bấm vào các nút gợi ý mệnh giá tiền phổ biến: `100.000 đ`, `200.000 đ`, `500.000 đ`, `1.000.000 đ`...
   - Hoặc gõ số tiền khách đưa vào ô *Khách đưa*.
   - Màn hình lập tức hiển thị màu xanh lá đậm: **Tiền thối lại: XXX.000 đ**.
4. Bấm **`HOÀN TẤT ĐƠN HÀNG`**.
5. Màn hình thông báo thành công hiển thị mã đơn hàng (Ví dụ: `#EM-8821`), hóa đơn tự động lưu trữ và kho hàng quầy trừ ngay lập tức.

---

### 4.5. Quy trình Thanh toán Chuyển khoản VietQR tự động
1. Bấm nút **`THANH TOÁN`**, chọn tab **`VietQR`**.
2. Hệ thống tạo tức thì mã VietQR chuẩn NAPAS247 hiển thị to rõ trên màn hình máy POS:
   - Đúng số tài khoản của Ban tổ chức.
   - Đúng chính xác số tiền của đơn hàng (khách không thể sửa bớt tiền).
   - Nội dung chuyển khoản chứa mã đơn tự động.
3. Hướng dẫn khách đưa app ngân hàng quét mã.
4. Sau khi kiểm tra điện thoại thông báo tiền về hoặc khách đưa biên lai màn hình, thu ngân bấm **`XÁC NHẬN ĐÃ NHẬN TIỀN`** để xuất đơn.

---

### 4.6. Quy trình Trả hàng Đặt trước (Pre-order Pickup) & Chụp ảnh đối soát
Tại các concert, khách hàng đã đặt trước online thường đến quầy nhận hàng rất đông. Để tránh nhầm lẫn hoặc khiếu nại "chưa nhận hàng":
1. Tại góc trên thanh công cụ POS, bấm vào nút **`📦 Trả hàng Pre-order`**.
2. Nhập Số điện thoại, Mã đặt chỗ hoặc Tên người mua để tra cứu.
3. Màn hình hiện chi tiết các món khách đã đặt.
4. Lấy đúng sản phẩm từ khu vực hàng Pre-order giao cho khách kiểm tra.
5. **Chụp ảnh đối soát:** Bấm biểu tượng **`Máy ảnh (Camera)`** để chụp nhanh ảnh túi đồ giao cho khách hoặc ảnh ký nhận. Ảnh được đính kèm trực tiếp vào đơn hàng trên hệ thống.
6. Bấm **`Xác nhận đã trả hàng`**. Trạng thái đơn đổi sang hoàn tất.

---

### 4.7. Chế độ Mất mạng (Offline POS) & Tự động đồng bộ
Tại các sân vận động đông hàng chục ngàn người, sóng 4G/Wifi thường xuyên chập chờn hoặc mất hẳn. EventMate được trang bị công nghệ **Offline-First**:
* Khi mất mạng, máy POS vẫn hoạt động **hoàn toàn bình thường**: Bạn vẫn bấm chọn món, tính tiền thối, và in/lưu đơn hàng như lúc có mạng.
* Đơn hàng được mã hóa và lưu trữ an toàn ngay trong bộ nhớ trình duyệt thiết bị (IndexedDB).
* Mỗi đơn hàng được gắn **Mã khóa chống trùng lặp (Idempotency Key)**.
* Khi kết nối mạng phục hồi, hệ thống **tự động đẩy toàn bộ đơn hàng pending lên máy chủ** trong nền mà thu ngân không cần bấm phím nào.
* Bạn có thể kiểm tra danh sách hàng đợi đồng bộ tại trang **`pos/sync`**.

---

## 5. BÁO CÁO DOANH THU & ĐỐI SOÁT KẾ TOÁN

### 5.1. Bảng theo dõi Doanh số thời gian thực (`/dashboard` & `/dashboard/analytics`)
Chủ shop và Điều phối viên có thể theo dõi trực tiếp từ xa:
* **Tổng doanh thu thực tế:** Tổng tiền đã thu từ toàn bộ các quầy của tour.
* **Tổng số đơn hàng thành công.**
* **Số lượng món đã xuất kho.**
* **Giá trị đơn hàng trung bình (AOV - Average Order Value).**
* Bộ lọc theo từng sự kiện giúp phân tích chi tiết hiệu quả bán lẻ giữa các đêm diễn khác nhau (Hà Nội vs TP.HCM).

---

### 5.2. Đối soát Doanh thu Gian hàng Collab (Chia phần đối tác)
Tại bảng phân tích chi tiết:
* Doanh thu được phân loại rõ theo từng quầy bán.
* Tự động trích xuất:
  - *Tổng doanh thu quầy Collab.*
  - *Phần chia cho Đối tác Collab (theo % thỏa thuận).*
  - *Phần thực nhận của Nghệ sĩ / Đơn vị tổ chức.*
* Giúp bộ phận kế toán loại bỏ hoàn toàn việc tính toán thủ công bằng Excel sau mỗi đêm diễn.

---

### 5.3. Xuất dữ liệu Kế toán định dạng CSV
1. Tại trang **Báo cáo & Phân tích (`/dashboard/analytics`)**, bấm nút **`Xuất báo cáo CSV`**.
2. File CSV chuẩn mã hóa UTF-8 (hỗ trợ tiếng Việt có dấu mở tốt trên Excel) sẽ được tải xuống, bao gồm đầy đủ các cột:
   - Mã đơn hàng, Thời gian phát sinh.
   - Tên sự kiện, Tên quầy bán.
   - Mô hình (Solo / Collab) & Tên đối tác.
   - Phương thức thanh toán (Tiền mặt / VietQR / Cổng thẻ).
   - Tạm tính, Tiền giảm giá, Tổng thanh toán cuối cùng.

---

## 6. NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) & HỖ TRỢ BÁO LỖI

### 6.1. Tra cứu Lịch sử hoạt động và Biến động kho (`/dashboard/logs`)
Mọi hành động quan trọng trên hệ thống đều được ghi vết tự động 100% kèm thời gian và danh tính người thực hiện:
* Thu ngân tạo đơn hàng mới (số tiền, danh sách món, phương thức).
* Thủ kho điều chuyển hàng từ Kho tổng ra Quầy (+/- số lượng cụ thể).
* Thay đổi giá bán sản phẩm hoặc cập nhật tài khoản ngân hàng thụ hưởng.
* Giúp chủ shop dễ dàng đối soát khi xảy ra chênh lệch tồn kho hoặc tiền mặt cuối ngày.

---

### 6.2. Gửi ý kiến đóng góp & Báo cáo sự cố (Feedback System) (`/dashboard/feedback`)
Bất cứ lúc nào gặp trục trặc kỹ thuật hoặc có ý tưởng cải tiến:
1. Bấm vào nút nổi **`💬 Góp ý & Báo lỗi`** ở góc dưới cùng bên phải màn hình (hoặc truy cập `/dashboard/feedback`).
2. Chọn loại thông điệp:
   - *Báo cáo lỗi (Bug Report):* Gặp lỗi thao tác, lỗi giỏ hàng, lỗi hiển thị.
   - *Góp ý tính năng (Feature Request):* Đề xuất thêm tính năng hữu ích cho tour sau.
   - *Hỏi đáp / Trợ giúp (General Inquiry).*
3. Nhập tiêu đề, mô tả chi tiết các bước xảy ra lỗi.
4. Đính kèm ảnh chụp màn hình bị lỗi (nếu có).
5. Bấm **`Gửi phản hồi`**. Đội ngũ kỹ thuật sẽ tiếp nhận và xử lý cập nhật hệ thống ngay lập tức.

---

## 7. BẢNG TỔNG HỢP CÂU HỎI THƯỜNG GẶP (FAQ) & XỬ LÝ SỰ CỐ TẠI CHỖ

#### Q1: Mất mạng 4G/Wifi tại quầy thì có bán hàng được không?
> **Trả lời:** **Có, hoàn toàn bình thường.** Giao diện POS sẽ tự động chuyển sang chế độ Ngoại tuyến (Offline). Bạn tiếp tục thu tiền và hoàn tất đơn. Khi có mạng trở lại, hệ thống tự động đẩy dữ liệu lên máy chủ mà không làm mất bất kỳ đơn hàng nào.

#### Q2: Khách quét mã VietQR nhưng tiền chưa thấy vào tài khoản thì làm sao?
> **Trả lời:**
> 1. Kiểm tra màn hình điện thoại của khách: Xem đúng Tên chủ tài khoản và Số tiền chưa.
> 2. Đề nghị khách cho xem thông báo *Giao dịch thành công* trên ứng dụng ngân hàng của khách (kiểm tra mã giao dịch ngân hàng).
> 3. Trong trường hợp ngân hàng chuyển khoản liên ngân hàng bị nghẽn mạch tạm thời, thu ngân có thể chuyển sang hình thức nhận Tiền mặt để tránh ùn tắc hàng dài người chờ.

#### Q3: Hai nhân viên bán cùng lúc có bị bán trùng hàng không?
> **Trả lời:** **Không.** Hệ thống liên tục kiểm tra số lượng tồn kho khả dụng tại quầy theo thời gian thực. Khi hàng tại quầy về 0, nút thêm giỏ sẽ lập tức chuyển sang trạng thái *"Hết hàng"*.

#### Q4: Làm thế nào để xóa các đơn hàng thử nghiệm mà thu ngân đã bấm test trước sự kiện?
> **Trả lời:**
> Vào **Bảng điều khiển Tổng quan (`/dashboard`)**, chuyển bộ lọc sự kiện sang `🧪 Sự kiện Test (Chạy thử nghiệm POS)`, bấm nút **`[Xóa đơn test]`**. Hệ thống sẽ làm sạch 100% đơn hàng test và đưa số lượng xuất kho test về 0.

#### Q5: Tôi muốn in mã QR ngân hàng dán sẵn tại quầy dự phòng được không?
> **Trả lời:**
> Bạn nên sử dụng mã VietQR sinh tự động trên màn hình POS vì mã này có sẵn số tiền chính xác của đơn, khách không cần gõ tay tránh chuyển nhầm thừa/thiếu tiền. Tuy nhiên bạn vẫn có thể dán thêm bảng thông tin tài khoản ngân hàng (lấy từ mục `/dashboard/payments`) tại quầy để phòng khi khách có nhu cầu chuyển khoản thủ công.

---
*Tài liệu được phát hành và bảo đảm chất lượng bởi Đội ngũ Kỹ thuật & Vận hành EventMate.*
*Hỗ trợ kỹ thuật 24/7 trong suốt các ngày diễn ra sự kiện.*
