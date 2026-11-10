import { EventItem, Order, Booth, InventoryAllocation } from '@/types/database';

/**
 * Checks whether an event is a sandbox/test event.
 */
export function isTestEvent(event: EventItem | string | undefined | null): boolean {
  if (!event) return false;
  const id = typeof event === 'string' ? event : event.id;
  const name = typeof event === 'object' && event?.name ? event.name : '';
  const isTest = typeof event === 'object' && 'is_test' in event ? Boolean(event.is_test) : false;

  return (
    isTest ||
    id === 'evt-test-pos' ||
    id.toLowerCase().includes('test') ||
    name.toLowerCase().includes('chạy thử nghiệm') ||
    name.toLowerCase().includes('sự kiện test')
  );
}

/**
 * Checks whether an order is a test transaction.
 * Test transactions must NEVER contaminate real business metrics, revenue, or accounting reports.
 */
export function isTestOrder(order: Order | undefined | null): boolean {
  if (!order) return false;
  return (
    order.is_test === true ||
    isTestEvent(order.event_id) ||
    order.id.toLowerCase().includes('test') ||
    order.order_number === 'EM-4748' || // Initial sample test orders
    order.order_number === 'EM-9089' ||
    Boolean(order.notes?.toLowerCase().includes('thử nghiệm')) ||
    Boolean(order.notes?.toLowerCase().includes('test'))
  );
}

/**
 * Checks whether a booth is a test booth.
 */
export function isTestBooth(booth: Booth | undefined | null): boolean {
  if (!booth) return false;
  return (
    booth.is_test === true ||
    booth.id === 'booth-test-1' ||
    booth.code === 'BOOTH-TEST' ||
    isTestEvent(booth.event_id)
  );
}

/**
 * Checks whether an inventory allocation belongs to a test event or booth.
 */
export function isTestAllocation(allocation: InventoryAllocation | undefined | null): boolean {
  if (!allocation) return false;
  return (
    allocation.is_test === true ||
    allocation.id.toLowerCase().includes('test') ||
    isTestEvent(allocation.event_id)
  );
}

/**
 * Filters out all test orders, keeping only real production orders.
 */
export function filterRealOrders(orders: Order[]): Order[] {
  return orders.filter((o) => !isTestOrder(o));
}

/**
 * Filters out all test events, keeping only real production events.
 */
export function filterRealEvents(events: EventItem[]): EventItem[] {
  return events.filter((e) => !isTestEvent(e));
}

/**
 * Filters out all test booths, keeping only real production booths.
 */
export function filterRealBooths(booths: Booth[]): Booth[] {
  return booths.filter((b) => !isTestBooth(b));
}

/**
 * Filters out all test allocations, keeping only real production allocations.
 */
export function filterRealAllocations(allocations: InventoryAllocation[]): InventoryAllocation[] {
  return allocations.filter((a) => !isTestAllocation(a));
}
