'use client';

import { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Selector } from '@astryxdesign/core/Selector';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Table } from '@astryxdesign/core/Table';
import { useDataStore } from '@/stores/data-store';
import type { EventItem } from '@/types/database';

export function BoothQuantities({ event, editable }: { event: EventItem; editable: boolean }) {
  const { booths, products, variants, allocations, setBoothSaleQuantity } = useDataStore();
  const eventBooths = booths.filter((booth) => booth.event_id === event.id && booth.workspace_id === event.workspace_id);
  const [selectedBoothId, setSelectedBoothId] = useState(eventBooths[0]?.id ?? '');
  const booth = eventBooths.find((item) => item.id === selectedBoothId);
  const rows = variants.flatMap((variant) => {
    const product = products.find((item) => item.id === variant.product_id && item.workspace_id === event.workspace_id && item.is_active && !item.is_deleted);
    if (!product || variant.workspace_id !== event.workspace_id) return [];
    const allocation = allocations.find((item) => item.workspace_id === event.workspace_id && item.event_id === event.id && item.booth_id === booth?.id && item.variant_id === variant.id);
    return [{ id: variant.id, product: product.name, variant: variant.name, quantity: allocation?.allocated_quantity ?? 0, sold: allocation?.sold_quantity ?? 0 }];
  });

  return (
    <VStack gap={4}>
      <Text>Nhập tổng số mang đến từng gian hàng. Số còn bán được bằng số mang đi trừ số đã bán.</Text>
      <Selector label="Gian hàng" options={eventBooths.map((item) => ({ value: item.id, label: item.name }))} value={selectedBoothId} onChange={setSelectedBoothId} placeholder="Chọn gian hàng" />
      {!booth ? <Text>Hãy tạo gian hàng cho sự kiện trước.</Text> : (
        <Table data={rows} idKey="id" density="compact" columns={[
          { key: 'product', header: 'Sản phẩm' },
          { key: 'variant', header: 'Loại' },
          { key: 'sold', header: 'Đã bán' },
          { key: 'quantity', header: 'Mang đi', renderCell: (row) => (
            <NumberInput label={`Số lượng ${row.product} ${row.variant}`} isLabelHidden value={row.quantity} min={row.sold} step={1} isDisabled={!editable} isWheelEnabled={false} onChange={(value) => {
              if (!setBoothSaleQuantity(event.workspace_id, event.id, booth.id, row.id, value)) {
                window.alert('Số lượng phải là số nguyên và không nhỏ hơn số đã bán.');
              }
            }} />
          ) },
        ]} />
      )}
    </VStack>
  );
}
