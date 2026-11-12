/**
 * Telegram Notification Service for EventMate (HikaruStore)
 * Sends instant Z-Report Shift summaries and VIP sales alerts to Manager Telegram groups.
 */

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

const STORAGE_KEY = 'eventmate_telegram_config';

export function getSavedTelegramConfig(): TelegramConfig {
  if (typeof window === 'undefined') {
    return { botToken: '', chatId: '', enabled: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { botToken: '', chatId: '', enabled: false };
}

export function saveTelegramConfig(config: TelegramConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export async function sendTelegramMessage(
  text: string,
  overrideConfig?: Partial<TelegramConfig>
): Promise<{ success: boolean; message: string }> {
  const config = { ...getSavedTelegramConfig(), ...overrideConfig };

  if (!config.botToken || !config.chatId) {
    return {
      success: false,
      message: 'Chưa cấu hình Telegram Bot Token hoặc Chat ID. Vui lòng thiết lập trong Cài đặt.',
    };
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      return { success: true, message: 'Đã gửi báo cáo thành công về Telegram!' };
    }
    return {
      success: false,
      message: data.description || 'Không thể gửi tin nhắn tới Telegram. Vui lòng kiểm tra lại Token và Chat ID.',
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Lỗi kết nối tới Telegram API.',
    };
  }
}

export async function testTelegramBot(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; message: string }> {
  const testMessage = `🤖 <b>HikaruStore POS — Kiểm tra kết nối Telegram Bot</b>\n\n✅ Kết nối thành công! Hệ thống đã sẵn sàng nhận báo cáo chốt ca (Z-Report) và biến động số dư tự động.\n\n🕒 Thời gian: <code>${new Date().toLocaleString('vi-VN')}</code>`;
  return sendTelegramMessage(testMessage, { botToken, chatId, enabled: true });
}
