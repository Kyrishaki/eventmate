import { ProductVariant, ProductSaleStatus } from '@/types/database';

export interface VariantStockBreakdown {
  // === 5 TRẠNG THÁI CHÍNH XÁC THEO YÊU CẦU ===
  total: number; // 1. Số lượng (Tổng số lượng nhập kho)
  online: number; // 2. Online (Khách đặt online nhận tại sự kiện)
  preord: number; // 3. Preord (Giữ chỗ nội bộ / đặt trước VIP)
  offlineSold: number; // 4. Số lượng hàng đã bán offline (tổng đã bán tại các quầy POS)
  offlineAvailable: number; // 5. Tồn kho để bán offline (không tính online và preord vào): max(0, total - online - preord - offlineSold)

  // Trường hỗ trợ & tương thích ngược
  reserved: number; // Alias của preord
  onlinePreorder: number; // Alias của online
  totalHeld: number; // online + preord
  allocated: number; // Đã cấp ra các quầy
  sold: number; // Alias của offlineSold
  availableForSale: number; // Alias của offlineAvailable
  status: ProductSaleStatus;
  statusLabel: string;
  badgeVariant: 'success' | 'warning' | 'error' | 'outline' | 'neutral';
}

/**
 * Tính toán chi tiết 5 trạng thái kho cho từng biến thể:
 * 1. Số lượng (Tổng nhập): v.total_inventory
 * 2. Online: v.online_preorder_quantity
 * 3. Preord: v.reserved_quantity
 * 4. Số lượng hàng đã bán offline: offlineSold
 * 5. Tồn kho để bán offline (không tính online và preord vào): max(0, total - online - preord - offlineSold)
 */
export function calculateVariantStock(
  variant: ProductVariant,
  offlineSold = 0,
  allocatedQuantity = 0
): VariantStockBreakdown {
  const total = Number(variant.total_inventory) || 0;
  const online = Number(variant.online_preorder_quantity) || 0;
  const preord = Number(variant.reserved_quantity) || 0;
  const sold = Number(offlineSold) || 0;
  const allocated = Number(allocatedQuantity) || 0;

  const totalHeld = online + preord;
  // Công thức chuẩn: Tồn kho để bán offline không tính online và preord vào
  const offlineAvailable = Math.max(0, total - totalHeld - sold);

  let status: ProductSaleStatus = 'in_stock';
  let statusLabel = 'Sẵn sàng bán';
  let badgeVariant: 'success' | 'warning' | 'error' | 'outline' | 'neutral' = 'success';

  if (total <= 0) {
    status = 'sold_out';
    statusLabel = 'Chưa nhập kho (0)';
    badgeVariant = 'outline';
  } else if (sold >= total && total > 0) {
    status = 'sold_out';
    statusLabel = 'Đã bán hết';
    badgeVariant = 'neutral';
  } else if (offlineAvailable <= 0 && totalHeld >= total) {
    status = 'reserved_full';
    statusLabel = 'Đã giữ chỗ / online hết';
    badgeVariant = 'warning';
  } else if (offlineAvailable <= 0) {
    status = 'sold_out';
    statusLabel = 'Hết hàng bán quầy';
    badgeVariant = 'neutral';
  } else if (offlineAvailable > 0 && offlineAvailable <= 10) {
    status = 'low_stock';
    statusLabel = `Sắp hết (Còn ${offlineAvailable})`;
    badgeVariant = 'error';
  } else if (totalHeld > 0) {
    status = 'pre_order';
    statusLabel = `Có đơn giữ chỗ (${totalHeld})`;
    badgeVariant = 'warning';
  }

  return {
    total,
    online,
    preord,
    offlineSold: sold,
    offlineAvailable,
    reserved: preord,
    onlinePreorder: online,
    totalHeld,
    allocated,
    sold,
    availableForSale: offlineAvailable,
    status,
    statusLabel,
    badgeVariant,
  };
}

export interface ProductStockSummary {
  total: number;
  online: number;
  preord: number;
  offlineSold: number;
  offlineAvailable: number;
  totalHeld: number;
  allocated: number;
}

/**
 * Tổng hợp 5 trạng thái kho cho toàn bộ biến thể của 1 sản phẩm
 */
export function calculateProductStock(
  variants: ProductVariant[],
  allocations: { variant_id: string; sold_quantity: number; allocated_quantity: number; is_test?: boolean }[] = []
): ProductStockSummary {
  const realAllocations = allocations.filter((a) => !a.is_test);

  return variants.reduce<ProductStockSummary>(
    (acc, v) => {
      const soldForVar = realAllocations
        .filter((a) => a.variant_id === v.id)
        .reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
      const allocForVar = realAllocations
        .filter((a) => a.variant_id === v.id)
        .reduce((sum, a) => sum + (a.allocated_quantity || 0), 0);

      const bs = calculateVariantStock(v, soldForVar, allocForVar);

      return {
        total: acc.total + bs.total,
        online: acc.online + bs.online,
        preord: acc.preord + bs.preord,
        offlineSold: acc.offlineSold + bs.offlineSold,
        offlineAvailable: acc.offlineAvailable + bs.offlineAvailable,
        totalHeld: acc.totalHeld + bs.totalHeld,
        allocated: acc.allocated + bs.allocated,
      };
    },
    {
      total: 0,
      online: 0,
      preord: 0,
      offlineSold: 0,
      offlineAvailable: 0,
      totalHeld: 0,
      allocated: 0,
    }
  );
}
