import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Chưa cấu hình GEMINI_API_KEY trong file .env.local' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping test' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { success: false, error: `Google API phản hồi lỗi ${response.status}: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      model: 'gemini-2.5-flash',
      maskedKey: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4),
      message: 'Kết nối Google Gemini AI thành công và sẵn sàng hoạt động!',
      reply: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi kết nối tới Google Generative Language API' },
      { status: 500 }
    );
  }
}
