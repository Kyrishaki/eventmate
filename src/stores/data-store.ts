import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import {
  EventItem,
  Booth,
  Product,
  ProductVariant,
  ProductCategory,
  InventoryAllocation,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceRole,
  EventStatus,
  BoothStatus,
} from '@/types/database';
import { isTestAllocation } from '@/lib/test-data-filter';

export interface DataStoreState {
  events: EventItem[];
  booths: Booth[];
  categories: ProductCategory[];
  products: Product[];
  variants: ProductVariant[];
  allocations: InventoryAllocation[];
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];

  // Event Actions
  createEvent: (event: Omit<EventItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => EventItem;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  refreshEventStatuses: () => void;

  // Booth Actions
  createBooth: (booth: Omit<Booth, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Booth;
  updateBooth: (id: string, updates: Partial<Booth>) => void;
  deleteBooth: (id: string) => void;

  // Product & Variant Actions
  addCategory: (name: string, workspaceId?: string) => ProductCategory;
  createProduct: (
    product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    variants: Array<Omit<ProductVariant, 'id' | 'workspace_id' | 'product_id' | 'created_at' | 'updated_at'>>
  ) => Product;
  updateProduct: (
    id: string,
    updates: Partial<Product>,
    variantUpdates?: Array<{
      id?: string;
      name: string;
      sku: string;
      price: number;
      total_inventory: number;
      reserved_quantity?: number;
      online_preorder_quantity?: number;
      barcode?: string | null;
    }>
  ) => void;
  deleteProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  updateVariantPreorders: (
    variantId: string,
    params: {
      reservedQuantity?: number;
      onlinePreorderQuantity?: number;
      totalInventory?: number;
    }
  ) => void;

  // Inventory & Allocation Actions
  setAllocations: (allocations: InventoryAllocation[]) => void;
  setAllocation: (
    workspaceId: string,
    eventId: string,
    boothId: string,
    variantId: string,
    allocatedQuantity: number
  ) => void;
  allocateMaxToBooth: (
    workspaceId: string,
    eventId: string,
    boothId: string,
    variantIds?: string[]
  ) => number;
  quickTransferStock: (boothId: string, variantId: string, delta: number) => boolean;
  resetTestAllocations: () => void;

  // Team Actions
  inviteMember: (workspaceId: string, email: string, role: WorkspaceRole, invitedBy: string) => WorkspaceInvitation;
  updateMemberRole: (memberId: string, newRole: WorkspaceRole) => void;
  removeMember: (memberId: string) => void;
  revokeInvitation: (invitationId: string) => void;

  // Collab Actions
  addCollabProduct: (params: {
    workspaceId: string;
    eventId: string;
    boothId: string;
    partnerName: string;
    name: string;
    price: number;
    quantity: number;
    sku?: string;
    variantName?: string;
    imageUrl?: string;
    barcode?: string;
    reservedQuantity?: number;
    onlinePreorderQuantity?: number;
    tags?: string[];
  }) => { product: Product; variant: ProductVariant; allocation: InventoryAllocation };
  restockCollabVariant: (boothId: string, variantId: string, addedQty: number) => boolean;
  mergeCollabSyncPackage: (pkg: {
    booth?: Partial<Booth>;
    products?: Product[];
    variants?: ProductVariant[];
    allocations?: InventoryAllocation[];
  }) => void;

  // Seeding & Reset
  clearAllData: () => void;
}

const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // QuotaExceededError recovery: purge obsolete keys and retry without crashing the UI
      try {
        window.localStorage.removeItem('eventmate_core_data_v3');
        window.localStorage.removeItem('eventmate_core_data_v4');
        window.localStorage.removeItem('eventmate_audit_logs_v1');
        window.localStorage.setItem(name, value);
      } catch (retryErr) {
        console.warn('HikaruStore storage quota reached; keeping state in memory:', retryErr);
      }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useDataStore = create<DataStoreState>()(
  persist(
    (set, get) => ({
      events: [],
      booths: [],
      categories: [],
      products: [],
      variants: [],
      allocations: [],
      members: [],
      invitations: [],

      // Events
      createEvent: (eventData) => {
        const targetId =
          eventData.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const existing = get().events.find((e) => e.id === targetId);
        if (existing) return existing;

        const nowIso = new Date().toISOString();
        const newEvent: EventItem = {
          ...eventData,
          id: targetId,
          created_at: nowIso,
          updated_at: nowIso,
        };
        set({ events: [newEvent, ...get().events] });
        return newEvent;
      },
      updateEvent: (id, updates) => {
        set({
          events: get().events.map((e) =>
            e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
          ),
        });
      },
      deleteEvent: (id) => {
        set({
          events: get().events.filter((e) => e.id !== id),
          booths: get().booths.filter((b) => b.event_id !== id),
          allocations: get().allocations.filter((a) => a.event_id !== id),
        });
      },
      refreshEventStatuses: () => {
        const now = Date.now();
        const updatedAt = new Date(now).toISOString();
        let changed = false;
        const events = get().events.map((event) => {
          if (event.status === 'draft' || event.status === 'cancelled') return event;
          const start = new Date(event.start_date).getTime();
          const end = new Date(event.end_date).getTime();
          if (!Number.isFinite(start) || !Number.isFinite(end)) return event;
          const status: EventStatus = now < start ? 'upcoming' : now < end ? 'active' : 'completed';
          if (event.status === 'completed' && status !== 'completed') return event;
          if (status === event.status) return event;
          changed = true;
          return { ...event, status, updated_at: updatedAt };
        });
        const booths = get().booths.map((booth) => {
          const manuallyClosed = booth.manually_closed ?? booth.status === 'closed';
          if (manuallyClosed) return booth;
          const event = events.find((item) => item.id === booth.event_id);
          const start = Date.parse(event?.start_date || '');
          const end = Date.parse(event?.end_date || '');
          const status: BoothStatus = !event || !Number.isFinite(start) || !Number.isFinite(end) || event.status === 'draft'
            ? 'paused' : event.status === 'cancelled' || now >= end ? 'closed' : now >= start ? 'active' : 'paused';
          if (booth.status === status && booth.manually_closed === false) return booth;
          changed = true;
          return { ...booth, status, manually_closed: false, updated_at: updatedAt };
        });
        if (changed) set({ events, booths });
      },

      // Booths
      createBooth: (boothData) => {
        const targetId =
          boothData.id || `booth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const existing = get().booths.find((b) => b.id === targetId);
        if (existing) return existing;

        const nowIso = new Date().toISOString();
        const newBooth: Booth = {
          ...boothData,
          id: targetId,
          created_at: nowIso,
          updated_at: nowIso,
        };
        set({ booths: [newBooth, ...get().booths] });
        return newBooth;
      },
      updateBooth: (id, updates) => {
        set({
          booths: get().booths.map((b) =>
            b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
          ),
        });
      },
      deleteBooth: (id) => {
        set({
          booths: get().booths.filter((b) => b.id !== id),
          allocations: get().allocations.filter((a) => a.booth_id !== id),
        });
      },

      // Products & Variants
      addCategory: (name, workspaceId) => {
        const trimmed = name.trim();
        const existing = get().categories.find(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (existing) return existing;

        const newCategory: ProductCategory = {
          id: `cat-${Date.now()}`,
          workspace_id: workspaceId || 'ws-hac-cam-studio',
          name: trimmed,
          sort_order: get().categories.length + 1,
          created_at: new Date().toISOString(),
        };

        set({ categories: [...get().categories, newCategory] });
        return newCategory;
      },
      createProduct: (productData, variantDataList) => {
        const productId = `prod-${Date.now()}`;
        const newProduct: Product = {
          ...productData,
          id: productId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newVariants: ProductVariant[] = variantDataList.map((v, idx) => ({
          ...v,
          id: `var-${Date.now()}-${idx}`,
          workspace_id: productData.workspace_id,
          product_id: productId,
          price: Math.max(0, Number(v.price) || 0),
          total_inventory: Math.max(0, Number(v.total_inventory) || 0),
          reserved_quantity: Math.max(0, Number(v.reserved_quantity) || 0),
          online_preorder_quantity: Math.max(0, Number(v.online_preorder_quantity) || 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        set({
          products: [newProduct, ...get().products],
          variants: [...newVariants, ...get().variants],
        });

        return newProduct;
      },
      updateProduct: (id, updates, variantUpdates) => {
        const nowIso = new Date().toISOString();
        const existingProd = get().products.find((p) => p.id === id);
        const wsId = existingProd?.workspace_id || 'ws-hac-cam-studio';

        let nextVariants = get().variants;
        if (variantUpdates && variantUpdates.length > 0) {
          const otherVariants = nextVariants.filter((v) => v.product_id !== id);
          const existingForProd = nextVariants.filter((v) => v.product_id === id);

          const updatedForProd: ProductVariant[] = variantUpdates.map((vu, idx) => {
            const matched =
              (vu.id && existingForProd.find((ev) => ev.id === vu.id)) || existingForProd[idx];
            return {
              id: matched?.id || `var-${Date.now()}-${idx}`,
              workspace_id: matched?.workspace_id || wsId,
              product_id: id,
              name: vu.name?.trim() || 'Tiêu chuẩn',
              sku: vu.sku?.trim().toUpperCase() || matched?.sku || `SKU-${Date.now().toString().slice(-4)}`,
              price: Math.max(0, Number(vu.price) || 0),
              total_inventory: Math.max(0, Number(vu.total_inventory) || 0),
              reserved_quantity: Math.max(0, Number(vu.reserved_quantity) || 0),
              online_preorder_quantity: Math.max(0, Number(vu.online_preorder_quantity) || 0),
              barcode: vu.barcode ?? matched?.barcode ?? null,
              created_at: matched?.created_at || nowIso,
              updated_at: nowIso,
            };
          });

          nextVariants = [...updatedForProd, ...otherVariants];
        }

        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: nowIso } : p
          ),
          variants: nextVariants,
        });
      },
      deleteProduct: (id) => {
        // SOFT-DELETE: Mark product as hidden/deleted without deleting data or allocations
        set({
          products: get().products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  is_deleted: true,
                  is_active: false,
                  deleted_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : p
          ),
        });
      },
      restoreProduct: (id) => {
        // RESTORE: Bring soft-deleted product back to active
        set({
          products: get().products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  is_deleted: false,
                  is_active: true,
                  deleted_at: null,
                  updated_at: new Date().toISOString(),
                }
              : p
          ),
        });
      },
      toggleProductActive: (id) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, is_active: !p.is_active, updated_at: new Date().toISOString() } : p
          ),
        });
      },

      updateVariantPreorders: (variantId, params) => {
        set({
          variants: get().variants.map((v) =>
            v.id === variantId
              ? {
                  ...v,
                  ...(params.reservedQuantity !== undefined
                    ? { reserved_quantity: Math.max(0, params.reservedQuantity) }
                    : {}),
                  ...(params.onlinePreorderQuantity !== undefined
                    ? { online_preorder_quantity: Math.max(0, params.onlinePreorderQuantity) }
                    : {}),
                  ...(params.totalInventory !== undefined
                    ? { total_inventory: Math.max(0, params.totalInventory) }
                    : {}),
                  updated_at: new Date().toISOString(),
                }
              : v
          ),
        });
      },

      // Allocations
      setAllocations: (allocations) => set({ allocations }),
      setAllocation: (workspaceId, eventId, boothId, variantId, allocatedQuantity) => {
        const { variants, allocations, booths } = get();
        const variant = variants.find((v) => v.id === variantId);
        const existing = allocations.find(
          (a) => a.booth_id === boothId && a.variant_id === variantId
        );
        const targetBooth = booths.find((b) => b.id === boothId);
        const isTargetTest = Boolean(existing?.is_test || targetBooth?.is_test);
        const currentSold = Math.max(0, Number(existing?.sold_quantity) || 0);
        const safeRequestedQty = Number.isFinite(Number(allocatedQuantity))
          ? Math.floor(Number(allocatedQuantity))
          : currentSold;

        let finalQty = Math.max(currentSold, safeRequestedQty);
        let updatedAllocations = [...allocations];
        const nowIso = new Date().toISOString();

        if (variant && !isTargetTest) {
          const totalInv = Math.max(0, Number(variant.total_inventory) || 0);
          const onlineQty = Math.max(0, Number(variant.online_preorder_quantity) || 0);
          const reservedQty = Math.max(0, Number(variant.reserved_quantity) || 0);
          const maxOfflineLimit = Math.max(0, totalInv - onlineQty - reservedQty);

          // Real allocations for this variant at OTHER booths
          const otherRealAllocs = updatedAllocations.filter(
            (a) => a.variant_id === variantId && a.booth_id !== boothId && !isTestAllocation(a)
          );
          const otherRealSold = otherRealAllocs.reduce(
            (sum, a) => sum + (Number(a.sold_quantity) || 0),
            0
          );

          // Maximum physical stock possible for this booth (cannot take what was already sold elsewhere)
          const maxPossibleForBooth = Math.max(currentSold, maxOfflineLimit - otherRealSold);
          finalQty = Math.min(finalQty, maxPossibleForBooth);

          // If other booths currently hold unsold allocation that would push total allocated > maxOfflineLimit,
          // automatically reclaim the needed unsold quantity (prioritizing booths from other events first)
          const currentOtherAllocated = otherRealAllocs.reduce(
            (sum, a) => sum + (Number(a.allocated_quantity) || 0),
            0
          );
          let neededToReclaim = Math.max(0, finalQty + currentOtherAllocated - maxOfflineLimit);

          if (neededToReclaim > 0) {
            // Sort other allocations: other events first, then same event
            const sortedOthers = [...otherRealAllocs].sort((a, b) => {
              const aDiffEvent = a.event_id !== eventId ? 0 : 1;
              const bDiffEvent = b.event_id !== eventId ? 0 : 1;
              return aDiffEvent - bDiffEvent;
            });

            const reductions = new Map<string, number>();
            for (const other of sortedOthers) {
              if (neededToReclaim <= 0) break;
              const otherAllocQty = Number(other.allocated_quantity) || 0;
              const otherSoldQty = Number(other.sold_quantity) || 0;
              const unsoldAtOther = Math.max(0, otherAllocQty - otherSoldQty);
              if (unsoldAtOther > 0) {
                const take = Math.min(unsoldAtOther, neededToReclaim);
                reductions.set(other.id, otherAllocQty - take);
                neededToReclaim -= take;
              }
            }

            if (reductions.size > 0) {
              updatedAllocations = updatedAllocations.map((a) =>
                reductions.has(a.id)
                  ? {
                      ...a,
                      allocated_quantity: reductions.get(a.id)!,
                      updated_at: nowIso,
                    }
                  : a
              );
            }
          }
        }

        if (existing) {
          if (existing.allocated_quantity === finalQty && updatedAllocations === allocations) {
            return;
          }
          set({
            allocations: updatedAllocations.map((a) =>
              a.id === existing.id
                ? {
                    ...a,
                    allocated_quantity: finalQty,
                    updated_at: nowIso,
                  }
                : a
            ),
          });
        } else {
          const newAlloc: InventoryAllocation = {
            id: `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            workspace_id: workspaceId,
            event_id: eventId,
            booth_id: boothId,
            variant_id: variantId,
            allocated_quantity: finalQty,
            sold_quantity: 0,
            is_test: isTargetTest,
            created_at: nowIso,
            updated_at: nowIso,
          };
          set({ allocations: [...updatedAllocations, newAlloc] });
        }
      },
      allocateMaxToBooth: (workspaceId, eventId, boothId, variantIds) => {
        const { variants, allocations, booths } = get();
        const targetBooth = booths.find((b) => b.id === boothId);
        if (!targetBooth) return 0;

        const isTargetTest = Boolean(targetBooth.is_test);
        const targetVariantSet = variantIds ? new Set(variantIds) : null;
        const candidateVariants = variants.filter((v) =>
          targetVariantSet ? targetVariantSet.has(v.id) : true
        );

        let updatedAllocations = [...allocations];
        const newAllocationsToAdd: InventoryAllocation[] = [];
        let updatedCount = 0;
        const nowIso = new Date().toISOString();

        for (let idx = 0; idx < candidateVariants.length; idx++) {
          const variant = candidateVariants[idx];
          const existingIdx = updatedAllocations.findIndex(
            (a) => a.booth_id === boothId && a.variant_id === variant.id
          );
          const existing = existingIdx >= 0 ? updatedAllocations[existingIdx] : undefined;
          const currentAllocQty = Math.max(0, Number(existing?.allocated_quantity) || 0);
          const currentSoldQty = Math.max(0, Number(existing?.sold_quantity) || 0);

          const totalInv = Math.max(0, Number(variant.total_inventory) || 0);
          const onlineQty = Math.max(0, Number(variant.online_preorder_quantity) || 0);
          const reservedQty = Math.max(0, Number(variant.reserved_quantity) || 0);
          const maxOfflineLimit = Math.max(0, totalInv - onlineQty - reservedQty);

          const otherRealAllocs = updatedAllocations.filter(
            (a) =>
              a.variant_id === variant.id &&
              a.booth_id !== boothId &&
              !isTestAllocation(a)
          );
          const otherRealSold = isTargetTest
            ? 0
            : otherRealAllocs.reduce((sum, a) => sum + (Number(a.sold_quantity) || 0), 0);

          const maxAllowed = Math.max(currentSoldQty, maxOfflineLimit - otherRealSold);
          if (maxAllowed <= currentAllocQty) continue;

          if (!isTargetTest) {
            const currentOtherAllocated = otherRealAllocs.reduce(
              (sum, a) => sum + (Number(a.allocated_quantity) || 0),
              0
            );
            let neededToReclaim = Math.max(
              0,
              maxAllowed + currentOtherAllocated - maxOfflineLimit
            );

            if (neededToReclaim > 0) {
              const sortedOthers = [...otherRealAllocs].sort((a, b) => {
                const aDiffEvent = a.event_id !== eventId ? 0 : 1;
                const bDiffEvent = b.event_id !== eventId ? 0 : 1;
                return aDiffEvent - bDiffEvent;
              });

              const reductions = new Map<string, number>();
              for (const other of sortedOthers) {
                if (neededToReclaim <= 0) break;
                const otherAllocQty = Number(other.allocated_quantity) || 0;
                const otherSoldQty = Number(other.sold_quantity) || 0;
                const unsoldAtOther = Math.max(0, otherAllocQty - otherSoldQty);
                if (unsoldAtOther > 0) {
                  const take = Math.min(unsoldAtOther, neededToReclaim);
                  reductions.set(other.id, otherAllocQty - take);
                  neededToReclaim -= take;
                }
              }

              if (reductions.size > 0) {
                updatedAllocations = updatedAllocations.map((a) =>
                  reductions.has(a.id)
                    ? {
                        ...a,
                        allocated_quantity: reductions.get(a.id)!,
                        updated_at: nowIso,
                      }
                    : a
                );
              }
            }
          }

          if (existing && existingIdx >= 0) {
            updatedAllocations[existingIdx] = {
              ...updatedAllocations[existingIdx],
              allocated_quantity: maxAllowed,
              updated_at: nowIso,
            };
          } else {
            newAllocationsToAdd.push({
              id: `alloc-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              workspace_id: workspaceId,
              event_id: eventId,
              booth_id: boothId,
              variant_id: variant.id,
              allocated_quantity: maxAllowed,
              sold_quantity: 0,
              is_test: isTargetTest,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }

          updatedCount += 1;
        }

        if (updatedCount > 0) {
          set({ allocations: [...updatedAllocations, ...newAllocationsToAdd] });
        }

        return updatedCount;
      },
      quickTransferStock: (boothId, variantId, delta) => {
        const { variants, allocations, booths } = get();
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return false;

        const booth = booths.find((b) => b.id === boothId);
        const currentBoothAlloc = allocations.find(
          (a) => a.booth_id === boothId && a.variant_id === variantId
        );
        const currentQty = currentBoothAlloc ? currentBoothAlloc.allocated_quantity : 0;
        const currentSold = currentBoothAlloc?.sold_quantity || 0;
        const targetQty = currentQty + delta;

        if (targetQty < currentSold) {
          return false;
        }

        const isTargetTest = Boolean(currentBoothAlloc?.is_test || booth?.is_test);
        if (!isTargetTest) {
          const maxOfflineLimit = Math.max(
            0,
            variant.total_inventory -
              (variant.online_preorder_quantity || 0) -
              (variant.reserved_quantity || 0)
          );
          const otherRealSold = allocations
            .filter(
              (a) => a.variant_id === variantId && a.booth_id !== boothId && !isTestAllocation(a)
            )
            .reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
          const maxPossibleForBooth = Math.max(currentSold, maxOfflineLimit - otherRealSold);

          if (delta > 0 && targetQty > maxPossibleForBooth) {
            return false;
          }
        }

        get().setAllocation(
          booth?.workspace_id || currentBoothAlloc?.workspace_id || 'ws-hac-cam-studio',
          booth?.event_id || currentBoothAlloc?.event_id || '',
          boothId,
          variantId,
          targetQty
        );
        return true;
      },
      resetTestAllocations: () => {
        set({
          allocations: get().allocations.map((a) =>
            isTestAllocation(a) ? { ...a, sold_quantity: 0, updated_at: new Date().toISOString() } : a
          ),
        });
      },

      // Team & Invitations
      inviteMember: (workspaceId, email, role, invitedBy) => {
        const newInvitation: WorkspaceInvitation = {
          id: `inv-${Date.now()}`,
          workspace_id: workspaceId,
          email,
          role,
          token: `tok_${Math.random().toString(36).substring(2, 10)}`,
          status: 'pending',
          invited_by: invitedBy,
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          created_at: new Date().toISOString(),
        };
        set({ invitations: [newInvitation, ...get().invitations] });
        return newInvitation;
      },
      updateMemberRole: (memberId, newRole) => {
        set({
          members: get().members.map((m) =>
            m.id === memberId ? { ...m, role: newRole, updated_at: new Date().toISOString() } : m
          ),
        });
      },
      removeMember: (memberId) => {
        const target = get().members.find((m) => m.id === memberId);
        if (target?.role === 'owner') return; // Cannot remove owner
        set({ members: get().members.filter((m) => m.id !== memberId) });
      },
      revokeInvitation: (invitationId) => {
        set({ invitations: get().invitations.filter((i) => i.id !== invitationId) });
      },

      // Collab Actions
      addCollabProduct: ({
        workspaceId,
        eventId,
        boothId,
        partnerName,
        name,
        price,
        quantity,
        sku,
        variantName,
        imageUrl,
        barcode,
        reservedQuantity,
        onlinePreorderQuantity,
        tags,
      }) => {
        const prodId = `prod-collab-${Date.now()}`;
        const varId = `var-collab-${Date.now()}`;
        const allocId = `alloc-collab-${Date.now()}`;

        const newProduct: Product = {
          id: prodId,
          workspace_id: workspaceId,
          category_id: null,
          name: name.trim(),
          description: `Sản phẩm do đối tác ${partnerName} mang đến`,
          image_url: imageUrl?.trim() || null,
          tags: tags && tags.length > 0 ? tags : ['Collab', partnerName],
          is_active: true,
          collab_partner: partnerName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newVariant: ProductVariant = {
          id: varId,
          workspace_id: workspaceId,
          product_id: prodId,
          sku: sku?.trim().toUpperCase() || `COL-${partnerName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          name: variantName?.trim() || 'Tiêu chuẩn',
          price: Number(price) || 0,
          barcode: barcode?.trim() || null,
          total_inventory: Number(quantity) || 0,
          reserved_quantity: Number(reservedQuantity) || 0,
          online_preorder_quantity: Number(onlinePreorderQuantity) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const initialAllocQty = Math.max(
          0,
          (Number(quantity) || 0) - (Number(reservedQuantity) || 0) - (Number(onlinePreorderQuantity) || 0)
        );

        const newAlloc: InventoryAllocation = {
          id: allocId,
          workspace_id: workspaceId,
          event_id: eventId,
          booth_id: boothId,
          variant_id: varId,
          allocated_quantity: initialAllocQty,
          sold_quantity: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set({
          products: [newProduct, ...get().products],
          variants: [newVariant, ...get().variants],
          allocations: [newAlloc, ...get().allocations],
        });

        return { product: newProduct, variant: newVariant, allocation: newAlloc };
      },

      restockCollabVariant: (boothId, variantId, addedQty) => {
        const { variants, allocations } = get();
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return false;

        const alloc = allocations.find((a) => a.booth_id === boothId && a.variant_id === variantId);
        if (!alloc) return false;

        set({
          variants: variants.map((v) =>
            v.id === variantId
              ? { ...v, total_inventory: v.total_inventory + addedQty, updated_at: new Date().toISOString() }
              : v
          ),
          allocations: allocations.map((a) =>
            a.id === alloc.id
              ? { ...a, allocated_quantity: a.allocated_quantity + addedQty, updated_at: new Date().toISOString() }
              : a
          ),
        });
        return true;
      },

      mergeCollabSyncPackage: (pkg) => {
        const { products, variants, allocations, booths } = get();
        const newProducts = [...products];
        const newVariants = [...variants];
        const newAllocations = [...allocations];

        if (pkg.products) {
          pkg.products.forEach((p) => {
            const idx = newProducts.findIndex((item) => item.id === p.id);
            if (idx >= 0) newProducts[idx] = p;
            else newProducts.unshift(p);
          });
        }
        if (pkg.variants) {
          pkg.variants.forEach((v) => {
            const idx = newVariants.findIndex((item) => item.id === v.id);
            if (idx >= 0) newVariants[idx] = v;
            else newVariants.push(v);
          });
        }
        if (pkg.allocations) {
          pkg.allocations.forEach((a) => {
            const idx = newAllocations.findIndex(
              (item) => item.id === a.id || (item.booth_id === a.booth_id && item.variant_id === a.variant_id)
            );
            if (idx >= 0) newAllocations[idx] = a;
            else newAllocations.push(a);
          });
        }
        if (pkg.booth && pkg.booth.id) {
          set({
            booths: booths.map((b) => (b.id === pkg.booth!.id ? { ...b, ...pkg.booth } : b)),
          });
        }

        set({
          products: newProducts,
          variants: newVariants,
          allocations: newAllocations,
        });
      },

      clearAllData: () => {
        set({
          events: [],
          booths: [],
          categories: [],
          products: [],
          variants: [],
          allocations: [],
          members: [],
          invitations: [],
        });
      },
    }),
    {
      name: 'eventmate_core_data_v5',
      storage: createJSONStorage(() => safeLocalStorage),
      // Persisted records are retained as stored; never seed, replace or
      // purge records during hydration based on demo IDs or empty collections.
    }
  )
);
