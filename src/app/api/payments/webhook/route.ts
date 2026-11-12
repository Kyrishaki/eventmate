import { NextRequest, NextResponse } from 'next/server';
import {
  recordIncomingTransaction,
  listRecentTransactions,
  VerifiedBankTransaction,
} from '@/lib/payment-verifier';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    success: true,
    transactions: listRecentTransactions(25),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nowIso = new Date().toISOString();
    const recorded: VerifiedBankTransaction[] = [];

    // Case 1: Casso Webhook format ({ error: 0, data: [ { id, tid, description, amount, when, bank_sub_acc_id } ] })
    if (Array.isArray(body?.data)) {
      for (const item of body.data) {
        const amount = Number(item.amount || item.transferAmount || 0);
        if (amount <= 0) continue;
        const tx = recordIncomingTransaction({
          id: `casso-${item.id || item.tid || Date.now()}`,
          gateway: String(item.bank_brand_name || item.gateway || 'Bank (Casso)'),
          accountNumber: String(item.bank_sub_acc_id || item.accountNumber || ''),
          amount,
          content: String(item.description || item.content || ''),
          referenceCode: String(item.tid || item.referenceCode || item.id || ''),
          transactionDate: String(item.when || item.transactionDate || nowIso),
          source: 'casso_webhook',
          receivedAt: nowIso,
        });
        recorded.push(tx);
      }
      return NextResponse.json({
        success: true,
        message: `Đã ghi nhận ${recorded.length} giao dịch từ Casso Webhook`,
        transactions: recorded,
      });
    }

    // Case 2: SePay Webhook format ({ id, gateway, transactionDate, accountNumber, code, content, transferType, transferAmount, referenceCode })
    if (body?.transferAmount !== undefined || body?.gateway !== undefined) {
      if (body.transferType && body.transferType !== 'in') {
        return NextResponse.json({
          success: true,
          ignored: true,
          message: 'Bỏ qua giao dịch tiền ra (transferType != in)',
        });
      }
      const amount = Number(body.transferAmount || body.amount || 0);
      const combinedContent = [body.code, body.content, body.description]
        .filter(Boolean)
        .join(' ');
      const tx = recordIncomingTransaction({
        id: `sepay-${body.id || Date.now()}`,
        gateway: String(body.gateway || 'Bank (SePay)'),
        accountNumber: String(body.accountNumber || ''),
        amount,
        content: combinedContent,
        referenceCode: String(body.referenceCode || body.id || ''),
        transactionDate: String(body.transactionDate || nowIso),
        source: body.source === 'simulated' ? 'simulated' : 'sepay_webhook',
        receivedAt: nowIso,
      });
      return NextResponse.json({
        success: true,
        message: 'Đã ghi nhận giao dịch từ SePay Webhook',
        transaction: tx,
      });
    }

    // Case 3: Generic / Custom Notification Forwarder / Simulated Webhook ({ content, amount, ... })
    const amount = Number(body?.amount || body?.amount_in || 0);
    const content = String(
      body?.content || body?.description || body?.transaction_content || body?.code || ''
    );

    if (!content || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dữ liệu Webhook thiếu nội dung chuyển khoản (content) hoặc số tiền (amount > 0)',
        },
        { status: 400 }
      );
    }

    const tx = recordIncomingTransaction({
      id: `custom-${body.id || Date.now()}`,
      gateway: String(body.gateway || body.bank || 'VietQR Auto'),
      accountNumber: String(body.accountNumber || body.account_number || ''),
      amount,
      content,
      referenceCode: String(body.referenceCode || body.reference_number || `REF-${Date.now().toString().slice(-6)}`),
      transactionDate: String(body.transactionDate || nowIso),
      source: body.source === 'simulated' ? 'simulated' : 'custom_webhook',
      receivedAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: 'Đã ghi nhận giao dịch thành công',
      transaction: tx,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi xử lý dữ liệu Webhook',
      },
      { status: 500 }
    );
  }
}
