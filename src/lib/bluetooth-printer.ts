/**
 * Bluetooth ESC/POS Thermal Receipt Printer Driver for Web Browsers (Web Bluetooth API)
 * Supports all 58mm and 80mm portable Bluetooth POS printers (Xprinter, Goojprt, PeriPage, PT-210, etc.)
 */

import { Order } from '@/types/database';
import { Workspace } from '@/types/database';

// Standard Bluetooth GATT Service UUIDs for Thermal Printers
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer GATT service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // ESC/POS service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent serial
];

// Helper to remove Vietnamese diacritics for safe printing on ASCII/CP437 thermal printers
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// ESC/POS Command Byte Sequences
const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
  INIT: `${ESC}@`, // Initialize printer
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_SIZE: `${GS}!\x11`, // 2x width, 2x height
  NORMAL_SIZE: `${GS}!\x00`,
  CUT_PAPER: `${GS}V\x41\x03`, // Feed 3 lines and partial cut
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,
};

interface BluetoothCharacteristicLike {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue?: (value: BufferSource) => Promise<void>;
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
}

interface BluetoothServiceLike {
  getCharacteristics: () => Promise<BluetoothCharacteristicLike[]>;
}

interface BluetoothGATTServerLike {
  getPrimaryServices: () => Promise<BluetoothServiceLike[]>;
}

interface BluetoothDeviceLike {
  gatt?: {
    connect: () => Promise<BluetoothGATTServerLike>;
    disconnect: () => void;
  };
}

export interface BluetoothPrintResult {
  success: boolean;
  message: string;
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export async function printReceiptViaBluetooth({
  order,
  workspace,
  eventName = 'Su Kien Banh Hang',
  boothName = 'Quay POS',
  itemDetails = [],
}: {
  order: Order;
  workspace: Workspace | null;
  eventName?: string;
  boothName?: string;
  itemDetails?: Array<{ name: string; variant: string; quantity: number; price: number }>;
}): Promise<BluetoothPrintResult> {
  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      message: 'Trình duyệt của bạn chưa hỗ trợ Web Bluetooth. Hãy dùng Google Chrome trên Android/Laptop hoặc mở ứng dụng hỗ trợ Bluetooth.',
    };
  }

  try {
    // 1. Request Bluetooth Device with printer filter
    const navBluetooth = (navigator as unknown as {
      bluetooth: {
        requestDevice: (options: unknown) => Promise<BluetoothDeviceLike>;
      };
    }).bluetooth;

    const device = await navBluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ae00-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
      ],
    });

    if (!device.gatt) {
      return { success: false, message: 'Thiết bị không hỗ trợ GATT Bluetooth.' };
    }

    // 2. Connect GATT Server
    const server = await device.gatt.connect();

    // 3. Discover Printer Service & Characteristic
    const services = await server.getPrimaryServices();
    let writeCharacteristic: BluetoothCharacteristicLike | null = null;

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeCharacteristic = char;
            break;
          }
        }
        if (writeCharacteristic) break;
      } catch {
        continue;
      }
    }

    if (!writeCharacteristic) {
      device.gatt.disconnect();
      return { success: false, message: 'Không tìm thấy cổng ghi dữ liệu trên máy in Bluetooth.' };
    }

    // 4. Build ESC/POS Payload
    const storeName = removeVietnameseAccents(workspace?.name || 'HIKARUSTORE');
    const safeEvent = removeVietnameseAccents(eventName);
    const safeBooth = removeVietnameseAccents(boothName);
    const safeDate = new Date(order.created_at).toLocaleString('vi-VN');
    const divider = '--------------------------------\n';

    let receiptContent = '';
    receiptContent += CMD.INIT;
    receiptContent += CMD.ALIGN_CENTER;
    receiptContent += CMD.DOUBLE_SIZE;
    receiptContent += `${storeName}\n`;
    receiptContent += CMD.NORMAL_SIZE;

    if (workspace?.phone) {
      receiptContent += `Hotline: ${workspace.phone}\n`;
    }
    receiptContent += `Su kien: ${safeEvent}\n`;
    receiptContent += `Quay: ${safeBooth}\n`;
    receiptContent += divider;

    receiptContent += CMD.ALIGN_LEFT;
    receiptContent += `Ma don: #${order.order_number}\n`;
    receiptContent += `Thoi gian: ${safeDate}\n`;
    receiptContent += `Hinh thuc: ${order.payment_method === 'cash' ? 'Tien mat (Cash)' : 'VietQR CK'}\n`;
    receiptContent += divider;

    // Items list
    receiptContent += 'SAN PHAM                 TTI\n';
    receiptContent += divider;

    if (itemDetails.length > 0) {
      for (const item of itemDetails) {
        const name = removeVietnameseAccents(item.name).slice(0, 20);
        const qtyAndPrice = ` x${item.quantity}  ${(item.price * item.quantity).toLocaleString('vi-VN')}`;
        receiptContent += `${name}\n`;
        receiptContent += CMD.ALIGN_RIGHT;
        receiptContent += `${qtyAndPrice}\n`;
        receiptContent += CMD.ALIGN_LEFT;
      }
    } else {
      receiptContent += `Tong so luong: ${order.items?.reduce((s, i) => s + i.quantity, 0) || 1} mon\n`;
    }

    receiptContent += divider;
    receiptContent += CMD.ALIGN_RIGHT;
    receiptContent += CMD.BOLD_ON;
    receiptContent += `TONG CONG: ${order.final_amount.toLocaleString('vi-VN')} VND\n`;
    receiptContent += CMD.BOLD_OFF;

    if (order.payment_method === 'cash' && order.tendered_amount != null) {
      receiptContent += `Khach dua: ${order.tendered_amount.toLocaleString('vi-VN')} VND\n`;
      receiptContent += `Thoi lai: ${(order.change_amount || 0).toLocaleString('vi-VN')} VND\n`;
    }

    receiptContent += CMD.ALIGN_CENTER;
    receiptContent += divider;
    receiptContent += `${removeVietnameseAccents(workspace?.slogan || 'Cam on quy khach!')}\n`;
    receiptContent += `Powered by EventMate HikaruStore\n`;
    receiptContent += CMD.FEED_LINES(3);
    receiptContent += CMD.CUT_PAPER;

    // 5. Convert String to Uint8Array Buffer
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptContent);

    // 6. Send in chunks of 512 bytes (standard BLE MTU limit)
    const CHUNK_SIZE = 512;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (writeCharacteristic.writeValueWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(chunk);
      } else if (writeCharacteristic.writeValue) {
        await writeCharacteristic.writeValue(chunk);
      }
      // Small 20ms yield between chunks to prevent buffer overflow on mini printers
      await new Promise((r) => setTimeout(r, 25));
    }

    // 7. Disconnect cleanly
    setTimeout(() => {
      try {
        device.gatt?.disconnect();
      } catch {}
    }, 1500);

    return {
      success: true,
      message: `Đã in thành công hóa đơn #${order.order_number} ra máy in Bluetooth!`,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NotFoundError') {
      return { success: false, message: 'Đã hủy chọn máy in Bluetooth.' };
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Lỗi kết nối máy in Bluetooth.',
    };
  }
}
