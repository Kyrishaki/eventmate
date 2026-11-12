import { NextRequest, NextResponse } from 'next/server';
import {
  findMatchingTransactionInStore,
  normalizeTransferText,
  recordIncomingTransaction,
  VerifiedBankTransaction,
} from '@/lib/payment-verifier';

export const runtime = 'nodejs';

interface CheckQrRequestBody {
  transferCode?: string;
  expectedAmount?: number;
  provider?: 'sepay' | 'casso' | 'webhook_only';
  apiToken?: string;
  accountNo?: string;
  testConnection?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckQrRequestBody = await req.json();
    const provider = body.provider || 'sepay';
    const transferCode = (body.transferCode || '').trim();
    const expectedAmount = Number(body.expectedAmount || 0);
    const token =
      (body.apiToken || '').trim() ||
      (provider === 'casso'
        ? process.env.CASSO_API_KEY || ''
        : process.env.SEPAY_API_TOKEN || '');

    // Mode A: Test API Token Connection from Payments Settings Page
    if (body.testConnection) {
      if (provider === 'webhook_only') {
        return NextResponse.json({
          success: true,
          message: 'Chế độ Webhook trực tiếp đã sẵn sàng nhận tín hiệu biến động số dư!',
        });
      }
      if (!token) {
        return NextResponse.json(
          {
            success: false,
            error: `Vui lòng nhập API Token của ${provider === 'casso' ? 'Casso.vn' : 'SePay.vn'} để kiểm tra kết nối trực tiếp, hoặc chuyển sang chế độ Webhook.`,
          },
          { status: 400 }
        );
      }

      if (provider === 'sepay') {
        const [resTx, resAcc] = await Promise.all([
          fetch('https://my.sepay.vn/userapi/transactions/list?limit=5', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          }),
          fetch('https://my.sepay.vn/userapi/bankaccounts/list', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          }),
        ]);
        if (!resTx.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `SePay API trả về mã lỗi ${resTx.status}. Vui lòng kiểm tra lại API Token trên my.sepay.vn.`,
            },
            { status: resTx.status }
          );
        }
        const dataTx = await resTx.json();
        const dataAcc = resAcc.ok ? await resAcc.json() : null;
        const txList = Array.isArray(dataTx?.transactions) ? dataTx.transactions : [];
        const bankAccounts = Array.isArray(dataAcc?.bankaccounts) ? dataAcc.bankaccounts : [];
        const bankNotice =
          bankAccounts.length > 0
            ? `Đã liên kết ${bankAccounts.length} tài khoản ngân hàng (${bankAccounts
                .map((b: { bank_short_name?: string; account_number?: string }) => `${b.bank_short_name || ''} ${b.account_number || ''}`.trim())
                .join(', ')})`
            : 'Chưa thấy tài khoản ngân hàng nào trong mục "Ngân hàng" trên my.sepay.vn — hãy bấm "Thêm ngân hàng" trên SePay để bắt đầu nhận biến động số dư!';

        return NextResponse.json({
          success: true,
          message: `Kết nối SePay.vn thành công! ${bankNotice} • Đã đọc ${txList.length} giao dịch gần nhất.`,
          sampleCount: txList.length,
          bankAccounts,
        });
      }

      if (provider === 'casso') {
        const res = await fetch('https://oauth.casso.vn/v2/transactions?pageSize=5&sort=DESC', {
          method: 'GET',
          headers: {
            Authorization: `Apikey ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        if (!res.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Casso API trả về mã lỗi ${res.status}. Vui lòng kiểm tra lại API Key trên Casso.vn.`,
            },
            { status: res.status }
          );
        }
        const data = await res.json();
        const records = Array.isArray(data?.data?.records) ? data.data.records : [];
        return NextResponse.json({
          success: true,
          message: `Kết nối Casso.vn thành công! Đã đọc được ${records.length} giao dịch gần nhất.`,
          sampleCount: records.length,
        });
      }
    }

    // Mode B: Check if a specific QR transferCode + expectedAmount has been paid
    if (!transferCode) {
      return NextResponse.json({ matched: false, reason: 'missing_transfer_code' });
    }

    // 1. Check in-memory Webhook store first (instant, zero external API latency)
    const webhookMatch = findMatchingTransactionInStore(transferCode, expectedAmount);
    if (webhookMatch) {
      return NextResponse.json({
        matched: true,
        source: webhookMatch.source,
        transaction: webhookMatch,
      });
    }

    // 2. If API Token is available, poll SePay or Casso directly (works even on localhost without public webhook!)
    const normalizedCode = normalizeTransferText(transferCode);

    if (provider === 'sepay' && token) {
      try {
        const res = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=20', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
          for (const item of transactions) {
            const amountIn = parseFloat(String(item.amount_in || '0'));
            const contentText = `${item.code || ''} ${item.transaction_content || ''}`;
            if (
              amountIn >= expectedAmount &&
              normalizeTransferText(contentText).includes(normalizedCode)
            ) {
              const verified: VerifiedBankTransaction = recordIncomingTransaction({
                id: `sepay-api-${item.id}`,
                gateway: String(item.bank_brand_name || 'SePay Bank'),
                accountNumber: String(item.account_number || ''),
                amount: amountIn,
                content: contentText.trim(),
                referenceCode: String(item.reference_number || item.id || ''),
                transactionDate: String(item.transaction_date || new Date().toISOString()),
                source: 'sepay_api',
                receivedAt: new Date().toISOString(),
              });
              return NextResponse.json({
                matched: true,
                source: 'sepay_api',
                transaction: verified,
              });
            }
          }
        }
      } catch (apiErr) {
        console.warn('SePay polling warning:', apiErr);
      }
    }

    if (provider === 'casso' && token) {
      try {
        const res = await fetch('https://oauth.casso.vn/v2/transactions?pageSize=20&sort=DESC', {
          method: 'GET',
          headers: {
            Authorization: `Apikey ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          const records = Array.isArray(data?.data?.records) ? data.data.records : [];
          for (const item of records) {
            const amountIn = Number(item.amount || 0);
            const contentText = String(item.description || '');
            if (
              amountIn >= expectedAmount &&
              normalizeTransferText(contentText).includes(normalizedCode)
            ) {
              const verified: VerifiedBankTransaction = recordIncomingTransaction({
                id: `casso-api-${item.id || item.tid}`,
                gateway: 'Casso Bank',
                accountNumber: String(item.bank_sub_acc_id || ''),
                amount: amountIn,
                content: contentText.trim(),
                referenceCode: String(item.tid || item.id || ''),
                transactionDate: String(item.when || new Date().toISOString()),
                source: 'casso_api',
                receivedAt: new Date().toISOString(),
              });
              return NextResponse.json({
                matched: true,
                source: 'casso_api',
                transaction: verified,
              });
            }
          }
        }
      } catch (apiErr) {
        console.warn('Casso polling warning:', apiErr);
      }
    }

    return NextResponse.json({
      matched: false,
      checkedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        matched: false,
        error: err instanceof Error ? err.message : 'Lỗi kiểm tra giao dịch QR',
      },
      { status: 500 }
    );
  }
}
