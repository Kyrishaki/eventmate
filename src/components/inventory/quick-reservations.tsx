'use client';

import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { canManageProduct, useAuthStore } from '@/stores/auth-store';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function QuickReservations() {
  const { activeWorkspace } = useWorkspaceStore();
  const { products, variants, allocations, updateVariantPreorders } = useDataStore();
  const { user, canManageInventory } = useAuthStore();
  const [productId, setProductId] = useState('');
  const [mode, setMode] = useState<'online' | 'vip' | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const availableProducts = products.filter((product) => product.workspace_id === activeWorkspace?.id && product.is_active && !product.is_deleted && canManageProduct(user, product.collab_partner));
  const product = availableProducts.find((item) => item.id === productId);
  const rows = variants.filter((variant) => variant.product_id === product?.id && variant.workspace_id === activeWorkspace?.id).map((variant) => {
    const sold = allocations.filter((item) => item.workspace_id === variant.workspace_id && item.variant_id === variant.id && !item.is_test).reduce((sum, item) => sum + item.sold_quantity, 0);
    return { id: variant.id, name: variant.name, sku: variant.sku, current: mode === 'online' ? variant.online_preorder_quantity || 0 : variant.reserved_quantity || 0, available: Math.max(0, variant.total_inventory - sold - (variant.reserved_quantity || 0) - (variant.online_preorder_quantity || 0)) };
  });

  function save() {
    if (!mode || !product || !canManageInventory() || !canManageProduct(user, product.collab_partner)) return;
    const current = useDataStore.getState();
    const currentVariants = current.variants.filter((item) => item.product_id === product.id && item.workspace_id === product.workspace_id);
    for (const variant of currentVariants) {
      const amount = amounts[variant.id] || 0;
      const sold = current.allocations.filter((item) => item.workspace_id === variant.workspace_id && item.variant_id === variant.id && !item.is_test).reduce((sum, item) => sum + item.sold_quantity, 0);
      const available = Math.max(0, variant.total_inventory - sold - (variant.reserved_quantity || 0) - (variant.online_preorder_quantity || 0));
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > available) {
        setMessage(`Số lượng cộng thêm của ${variant.name} không hợp lệ hoặc vượt tồn khả dụng (${available}).`);
        return;
      }
    }
    for (const variant of currentVariants) {
      const amount = amounts[variant.id] || 0;
      if (amount) updateVariantPreorders(variant.id, mode === 'online' ? { onlinePreorderQuantity: (variant.online_preorder_quantity || 0) + amount } : { reservedQuantity: (variant.reserved_quantity || 0) + amount });
    }
    setAmounts({});
    setMode(null);
    setMessage('Đã cập nhật số lượng.');
  }

  if (!canManageInventory()) return null;
  return (
    <VStack gap={3}>
      <Heading level={2}>Đơn online và giữ keep</Heading>
      <Text>Chọn sản phẩm trong kho tổng rồi cộng số lượng cho từng loại.</Text>
      <Selector label="Sản phẩm" options={availableProducts.map((item) => ({ value: item.id, label: item.name }))} value={productId} hasSearch onChange={(value) => { setProductId(value); setMode(null); setAmounts({}); setMessage(''); }} placeholder="Chọn sản phẩm" />
      {product && <HStack gap={2} wrap="wrap">
        <Button label="+ Đơn online" variant="secondary" onClick={() => { setMode('online'); setAmounts({}); setMessage(''); }} />
        <Button label="+ Giữ keep" variant="secondary" onClick={() => { setMode('vip'); setAmounts({}); setMessage(''); }} />
      </HStack>}
      {product && mode && <VStack gap={3}>
        <Text>Cộng {mode === 'online' ? 'đơn online' : 'giữ keep'} cho {product.name}</Text>
        <Table data={rows} idKey="id" density="compact" columns={[
          { key: 'name', header: 'Loại' },
          { key: 'current', header: 'Hiện có' },
          { key: 'available', header: 'Khả dụng' },
          { key: 'amount', header: 'Cộng thêm', renderCell: (row) => <NumberInput label={`Cộng thêm ${row.name}`} isLabelHidden value={amounts[row.id] ?? 0} min={0} max={row.available} step={1} isWheelEnabled={false} onChange={(value) => setAmounts((previous) => ({ ...previous, [row.id]: value }))} /> },
        ]} />
        <HStack gap={2}><Button label="Lưu số lượng" onClick={save} /><Button label="Hủy" variant="secondary" onClick={() => { setMode(null); setAmounts({}); }} /></HStack>
      </VStack>}
      {message && <Text>{message}</Text>}
    </VStack>
  );
}
