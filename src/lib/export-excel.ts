import * as XLSX from 'xlsx';
import { EventItem, Order, Booth, Product, ProductVariant, InventoryAllocation } from '@/types/database';
import { formatDate } from '@/lib/utils';

export interface ExportEventExcelParams {
  event?: EventItem | null; // null or undefined means "All Events"
  orders: Order[];
  booths: Booth[];
  products: Product[];
  variants: ProductVariant[];
  allocations: InventoryAllocation[];
  workspaceName?: string;
  currency?: string;
}

/**
 * Generates and downloads a comprehensive multi-sheet Excel file (.xlsx)
 * containing all operational, financial, booth collab, and inventory data
 * for a specific event or the entire workspace.
 */
export function exportEventToExcel({
  event,
  orders,
  booths,
  products,
  variants,
  allocations,
  workspaceName = 'EventMate Workspace',
  currency = 'VND',
}: ExportEventExcelParams) {
  // 1. Filter data based on event scope
  const targetOrders = event ? orders.filter((o) => o.event_id === event.id) : orders;
  const targetBooths = event ? booths.filter((b) => b.event_id === event.id) : booths;
  const targetAllocations = event ? allocations.filter((a) => a.event_id === event.id) : allocations;

  const eventTitle = event ? event.name : 'Toàn bộ sự kiện (Tất cả Tour)';
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN');
  const timeStr = now.toLocaleTimeString('vi-VN');

  // Workbook initialization
  const wb = XLSX.utils.book_new();

  // =========================================================================
  // SHEET 1: 📊 TỔNG QUAN TÀI CHÍNH & VẬN HÀNH
  // =========================================================================
  const totalRevenue = targetOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalSubtotal = targetOrders.reduce((sum, o) => sum + o.subtotal_amount, 0);
  const totalDiscount = targetOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
  const totalOrdersCount = targetOrders.length;
  const totalUnitsSold = targetOrders.reduce(
    (sum, o) => sum + (o.items?.reduce((iSum, it) => iSum + (it.quantity || 1), 0) || 1),
    0
  );
  const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Revenue by method
  const cashOrders = targetOrders.filter((o) => o.payment_method === 'cash');
  const cashRevenue = cashOrders.reduce((sum, o) => sum + o.final_amount, 0);

  const qrOrders = targetOrders.filter((o) => o.payment_method === 'qr_manual');
  const qrRevenue = qrOrders.reduce((sum, o) => sum + o.final_amount, 0);

  const gatewayOrders = targetOrders.filter((o) => o.payment_method === 'gateway');
  const gatewayRevenue = gatewayOrders.reduce((sum, o) => sum + o.final_amount, 0);

  // Collab vs Solo breakdown
  let totalCollabRevenue = 0;
  let totalCollabShare = 0;
  targetBooths.forEach((b) => {
    const isCollab = b.booth_type === 'collab' || Boolean(b.collab_partner);
    if (isCollab) {
      const bRevenue = targetOrders
        .filter((o) => o.booth_id === b.id)
        .reduce((sum, o) => sum + o.final_amount, 0);
      const ratio = b.revenue_share_ratio || 50;
      totalCollabRevenue += bRevenue;
      totalCollabShare += (bRevenue * ratio) / 100;
    }
  });
  const netRetained = totalRevenue - totalCollabShare;

  const summaryRows: (string | number)[][] = [
    ['BÁO CÁO TOÀN DIỆN VẬN HÀNH & DOANH THU SỰ KIỆN', '', '', ''],
    ['Hệ thống Quản lý Bán hàng & Phân bổ Hàng hóa EventMate', '', '', ''],
    ['', '', '', ''],
    ['1. THÔNG TIN CHUNG', '', '', ''],
    ['Workspace / Tổ chức:', workspaceName, 'Thời gian xuất báo cáo:', `${timeStr} - ${dateStr}`],
    ['Tên sự kiện / Tour:', eventTitle, 'Địa điểm tổ chức:', event?.location || 'Đa địa điểm'],
    [
      'Thời gian diễn ra:',
      event?.start_date ? `${formatDate(event.start_date)} - ${formatDate(event.end_date)}` : 'Toàn tour',
      'Đơn vị tiền tệ:',
      currency,
    ],
    ['', '', '', ''],
    ['2. CHỈ SỐ KINH DOANH CHÍNH', '', '', ''],
    ['Chỉ số', 'Giá trị', 'Đơn vị tính', 'Ghi chú'],
    ['Tổng doanh thu thực tế (Revenue):', totalRevenue, currency, 'Đã trừ chiết khấu / giảm giá'],
    ['Tổng tiền tạm tính (Subtotal):', totalSubtotal, currency, 'Trước giảm giá'],
    ['Tổng chiết khấu / Giảm giá (Discounts):', totalDiscount, currency, 'Khuyến mãi cho khách'],
    ['Tổng số đơn hàng thành công (Orders):', totalOrdersCount, 'Đơn', 'Giao dịch POS'],
    ['Tổng số món hàng xuất kho (Units Sold):', totalUnitsSold, 'Món / Chiếc', 'Merchandise thực tế đã giao'],
    ['Giá trị đơn hàng trung bình (AOV):', aov, `${currency}/đơn`, 'Doanh thu / Số đơn'],
    ['Tổng số quầy bán hoạt động:', targetBooths.length, 'Quầy', 'Bao gồm Solo & Collab'],
    ['', '', '', ''],
    ['3. DÒNG TIỀN THEO PHƯƠNG THỨC THANH TOÁN', '', '', ''],
    ['Phương thức', 'Số đơn', 'Tổng tiền (VND)', 'Tỷ trọng %'],
    [
      'Chuyển khoản VietQR (Ngân hàng):',
      qrOrders.length,
      qrRevenue,
      totalRevenue > 0 ? `${((qrRevenue / totalRevenue) * 100).toFixed(1)}%` : '0%',
    ],
    [
      'Tiền mặt tại két (Cash):',
      cashOrders.length,
      cashRevenue,
      totalRevenue > 0 ? `${((cashRevenue / totalRevenue) * 100).toFixed(1)}%` : '0%',
    ],
    [
      'Cổng thanh toán / POS thẻ (Gateway):',
      gatewayOrders.length,
      gatewayRevenue,
      totalRevenue > 0 ? `${((gatewayRevenue / totalRevenue) * 100).toFixed(1)}%` : '0%',
    ],
    ['Tổng cộng dòng tiền:', totalOrdersCount, totalRevenue, '100%'],
    ['', '', '', ''],
    ['4. ĐỐI SOÁT CHIA SẺ DOANH THU COLLAB', '', '', ''],
    ['Khoản mục', 'Số tiền (VND)', 'Ghi chú', ''],
    ['Tổng doanh thu từ các gian hàng Collab:', totalCollabRevenue, 'Quầy hợp tác nghệ sĩ/đối tác', ''],
    ['Phần chi trả cho Đối tác Collab:', totalCollabShare, 'Theo tỷ lệ % hợp đồng thỏa thuận', ''],
    ['Doanh thu thực nhận của BTC / Nghệ sĩ:', netRetained, 'Sau khi đã trừ phần chia đối tác', ''],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 36 }, { wch: 28 }, { wch: 28 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng quan & Tài chính');

  // =========================================================================
  // SHEET 2: 🛒 CHI TIẾT ĐƠN HÀNG (ORDERS & ITEMS)
  // =========================================================================
  const ordersData = targetOrders.map((ord, idx) => {
    const bth = booths.find((b) => b.id === ord.booth_id);
    const evtName = event?.name || 'Sự kiện';

    const itemsSummary =
      ord.items && ord.items.length > 0
        ? ord.items
            .map((it) => {
              const v = variants.find((variant) => variant.id === it.variant_id);
              const p = v ? products.find((prod) => prod.id === v.product_id) : null;
              return `${it.quantity}x ${p?.name || 'SP'} (${v?.name || v?.sku || ''})`;
            })
            .join('; ')
        : '1 món';

    const itemCount = ord.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1;

    let paymentMethodLabel = 'Tiền mặt';
    if (ord.payment_method === 'qr_manual') paymentMethodLabel = 'Chuyển khoản VietQR';
    if (ord.payment_method === 'gateway') paymentMethodLabel = 'Cổng thẻ POS';

    return {
      STT: idx + 1,
      'Mã đơn hàng': ord.order_number,
      'Thời gian tạo': formatDate(ord.created_at),
      'Sự kiện': evtName,
      'Gian hàng': bth?.name || 'Quầy POS',
      'Mã quầy': bth?.code || 'BOOTH',
      'Thu ngân': ord.cashier_id || 'Thu ngân POS',
      'Hình thức': paymentMethodLabel,
      'Trạng thái': ord.payment_status === 'completed' ? 'Hoàn tất' : ord.payment_status,
      'Đồng bộ': ord.sync_status === 'synced' ? 'Đã đồng bộ' : 'Chờ đồng bộ (Offline)',
      'Số lượng (Món)': itemCount,
      'Chi tiết sản phẩm đã mua': itemsSummary,
      'Tạm tính (VND)': ord.subtotal_amount,
      'Giảm giá (VND)': ord.discount_amount || 0,
      'Tổng thanh toán (VND)': ord.final_amount,
      'Tiền khách đưa (VND)': ord.tendered_amount ?? (ord.payment_method === 'cash' ? ord.final_amount : ''),
      'Tiền thối lại (VND)': ord.change_amount ?? (ord.payment_method === 'cash' ? 0 : ''),
      'Ảnh nhận hàng': ord.proof_image_url ? 'Có ảnh chụp' : 'Không',
      'Ghi chú': ord.notes || '',
      'Khóa đối soát Idempotency': ord.idempotency_key,
    };
  });

  const wsOrders = XLSX.utils.json_to_sheet(ordersData);
  wsOrders['!cols'] = [
    { wch: 6 },  // STT
    { wch: 14 }, // Mã đơn
    { wch: 20 }, // Thời gian
    { wch: 28 }, // Sự kiện
    { wch: 22 }, // Gian hàng
    { wch: 12 }, // Mã quầy
    { wch: 16 }, // Thu ngân
    { wch: 22 }, // Hình thức
    { wch: 12 }, // Trạng thái
    { wch: 16 }, // Đồng bộ
    { wch: 14 }, // Số lượng
    { wch: 45 }, // Chi tiết sản phẩm
    { wch: 16 }, // Tạm tính
    { wch: 14 }, // Giảm giá
    { wch: 18 }, // Tổng thanh toán
    { wch: 18 }, // Khách đưa
    { wch: 16 }, // Thối lại
    { wch: 14 }, // Ảnh nhận hàng
    { wch: 30 }, // Ghi chú
    { wch: 28 }, // Idempotency
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Chi tiết Đơn hàng');

  // =========================================================================
  // SHEET 3: 🏬 HIỆU SUẤT QUẦY & ĐỐI SOÁT COLLAB
  // =========================================================================
  const boothsData = targetBooths.map((b, idx) => {
    const boothOrders = targetOrders.filter((o) => o.booth_id === b.id);
    const bRevenue = boothOrders.reduce((sum, o) => sum + o.final_amount, 0);
    const bUnits = boothOrders.reduce(
      (sum, o) => sum + (o.items?.reduce((iSum, it) => iSum + (it.quantity || 1), 0) || 1),
      0
    );
    const bCash = boothOrders.filter((o) => o.payment_method === 'cash').reduce((sum, o) => sum + o.final_amount, 0);
    const bQr = boothOrders.filter((o) => o.payment_method === 'qr_manual').reduce((sum, o) => sum + o.final_amount, 0);

    const isCollab = b.booth_type === 'collab' || Boolean(b.collab_partner);
    const ratio = b.revenue_share_ratio || (isCollab ? 50 : 0);
    const partnerAmount = isCollab ? Math.round((bRevenue * ratio) / 100) : 0;
    const artistRetained = bRevenue - partnerAmount;

    return {
      STT: idx + 1,
      'Tên gian hàng': b.name,
      'Mã quầy': b.code,
      'Mô hình': isCollab ? 'Hợp tác Collab' : 'Gian hàng Độc lập',
      'Đối tác Collab': isCollab ? b.collab_partner || 'Đối tác' : '—',
      'Tỷ lệ chia (%)': isCollab ? `${ratio}%` : '0%',
      'Số đơn hàng': boothOrders.length,
      'Món đã bán': bUnits,
      'Tổng doanh thu (VND)': bRevenue,
      'Thu tiền mặt (VND)': bCash,
      'Thu VietQR (VND)': bQr,
      'Phần chi trả Đối tác (VND)': isCollab ? partnerAmount : 0,
      'Thực nhận BTC / Nghệ sĩ (VND)': artistRetained,
    };
  });

  const wsBooths = XLSX.utils.json_to_sheet(boothsData);
  wsBooths['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 12 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBooths, 'Hiệu suất Quầy & Collab');

  // =========================================================================
  // SHEET 4: 📦 BÁO CÁO TỒN KHO & PHÂN BỔ SKU
  // =========================================================================
  const inventoryRows: Record<string, string | number>[] = [];
  let skuCounter = 1;

  products.forEach((prod) => {
    if (prod.is_deleted) return;
    const prodVariants = variants.filter((v) => v.product_id === prod.id);

    prodVariants.forEach((v) => {
      // Find allocations for this variant
      const variantAllocs = targetAllocations.filter((a) => a.variant_id === v.id);
      const allocatedQty = variantAllocs.reduce((sum, a) => sum + a.allocated_quantity, 0);
      const soldQty = variantAllocs.reduce((sum, a) => sum + a.sold_quantity, 0);
      const remainingAtBooth = Math.max(0, allocatedQty - soldQty);

      // Total calculations
      const totalInventory = v.total_inventory;
      const reserved = v.reserved_quantity || 0;
      const preorder = v.online_preorder_quantity || 0;
      const centralStorageRemaining = Math.max(0, totalInventory - allocatedQty);

      // Financial value
      const revenueFromSku = soldQty * v.price;

      inventoryRows.push({
        STT: skuCounter++,
        'Mã SKU': v.sku,
        'Mã vạch Barcode': v.barcode || '—',
        'Tên sản phẩm': prod.name,
        'Biến thể (Size/Màu)': v.name,
        'Đơn giá (VND)': v.price,
        'Tổng nhập kho': totalInventory,
        'Giữ chỗ VIP (Reserved)': reserved,
        'Đặt trước Online (Pre-order)': preorder,
        'Đã cấp cho quầy (Allocated)': allocatedQty,
        'Đã bán thành công (Sold)': soldQty,
        'Doanh thu SKU (VND)': revenueFromSku,
        'Khả dụng tại quầy': remainingAtBooth,
        'Kho trung tâm còn lại': centralStorageRemaining,
        'Trạng thái':
          remainingAtBooth <= 0
            ? 'Hết hàng tại quầy'
            : remainingAtBooth <= 5
            ? 'Sắp hết'
            : 'Đang mở bán',
      });
    });
  });

  const wsInventory = XLSX.utils.json_to_sheet(inventoryRows);
  wsInventory['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 16 },
    { wch: 30 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInventory, 'Tồn kho & Phân bổ SKU');

  // =========================================================================
  // TRIGGER DOWNLOAD
  // =========================================================================
  const sanitizedName = (event?.name || 'EventMate_ToanBoTour')
    .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
    .slice(0, 40);
  const timeStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `EventMate_${sanitizedName}_${timeStamp}.xlsx`;

  XLSX.writeFile(wb, fileName);
  return fileName;
}
