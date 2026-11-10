import { ProductVariant, ProductSaleStatus } from '@/types/database';

export interface VariantStockBreakdown {
  total: number;
  reserved: number; // Đặt trước thủ công (do chủ shop tự chỉnh/giữ chỗ)
  onlinePreorder: number; // Khách đặt mua online / đăng ký trước
  totalHeld: number; // reserved + onlinePreorder
  allocated: number; // Đã phân bổ cấp ra quầy
  sold: number; // Đã bán thực tế
  availableForSale: number; // Khả dụng bán trực tiếp tại quầy: max(0, total - totalHeld - sold)
  status: ProductSaleStatus;
  statusLabel: string;
  badgeVariant: 'success' | 'warning' | 'error' | 'outline' | 'neutral';
}

/**
 * Tính toán chi tiết trạng thái phân rã kho cho từng biến thể sản phẩm:
 * - Tổng kho (Total)
 * - Đặt trước thủ công (Manual Reserved)
 * - Đặt mua online (Online Pre-orders)
 * - Đã bán (Sold)
 * - Khả dụng bán tự do tại quầy (Available for Walk-in POS)
 */
export function calculateVariantStock(
  variant: ProductVariant,
  soldQuantity = 0,
  allocatedQuantity = 0
): VariantStockBreakdown {
  const total = Number(variant.total_inventory) || 0;
  const reserved = Number(variant.reserved_quantity) || 0;
  const onlinePreorder = Number(variant.online_preorder_quantity) || 0;
  const totalHeld = reserved + onlinePreorder;
  const sold = Number(soldQuantity) || 0;
  const allocated = Number(allocatedQuantity) || 0;

  // Khả dụng để bán tự do tại sự kiện
  const availableForSale = Math.max(0, total - totalHeld - sold);

  let status: ProductSaleStatus = 'in_stock';
  let statusLabel = 'Sẵn sàng bán';
  let badgeVariant: 'success' | 'warning' | 'error' | 'outline' | 'neutral' = 'success';

  if (sold >= total && total > 0) {
    status = 'sold_out';
    statusLabel = 'Hết hàng (Sold out)';
    badgeVariant = 'neutral';
  } else if (availableForSale <= 0 && totalHeld >= total) {
    status = 'reserved_full';
    statusLabel = 'Đã giữ chỗ hết số lượng';
    badgeVariant = 'warning';
  } else if (availableForSale > 0 && availableForSale <= 10) {
    status = 'low_stock';
    statusLabel = `Sắp cháy hàng (Còn ${availableForSale})`;
    badgeVariant = 'error';
  } else if (totalHeld > 0) {
    status = 'pre_order';
    statusLabel = `Có đơn giữ chỗ (${totalHeld})`;
    badgeVariant = 'warning';
  }

  return {
    total,
    reserved,
    onlinePreorder,
    totalHeld,
    allocated,
    sold,
    availableForSale,
    status,
    statusLabel,
    badgeVariant,
  };
}
