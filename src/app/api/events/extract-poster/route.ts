import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body; // base64 or data URL

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp hình ảnh (dạng base64 hoặc Data URL)' },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Chưa cấu hình GEMINI_API_KEY trong biến môi trường (.env.local). Vui lòng thêm GEMINI_API_KEY để sử dụng tính năng trích xuất bằng AI.',
        },
        { status: 500 }
      );
    }

    // Extract mime type and pure base64
    let mimeType = 'image/png';
    let base64Data = image;

    const dataUrlMatch = image.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    }

    const prompt = `Bạn là chuyên gia trích xuất thông tin sự kiện từ ảnh poster, banner, vé mời, flyer.
Hãy phân tích hình ảnh và trích xuất các thông tin sau:
1. name: Tên chính xác của sự kiện (viết hoa chuẩn, ngắn gọn rõ ràng, ví dụ: "BEYOND FESTIVAL").
2. startDate: Ngày giờ bắt đầu theo định dạng YYYY-MM-DDTHH:mm (nếu không có giờ, mặc định là 08:00). Lưu ý đúng năm và tháng (tiếng Anh như JAN=01, FEB=02, MAR=03... hoặc tiếng Việt).
3. endDate: Ngày giờ kết thúc theo định dạng YYYY-MM-DDTHH:mm (nếu poster ghi dải ngày ví dụ "JAN 16-17 2027", thì startDate là 2027-01-16T08:00 và endDate là 2027-01-17T22:00. Nếu chỉ có 1 ngày duy nhất thì endDate là cùng ngày đó lúc 22:00).
4. location: Địa điểm tổ chức nếu xuất hiện trong ảnh (hoặc chuỗi rỗng nếu không có).
5. description: Khẩu hiệu, slogan, thể loại hoặc nghệ sĩ nổi bật trên poster (hoặc chuỗi rỗng nếu không có).

Chỉ trả về JSON thuần túy theo định dạng:
{
  "name": "...",
  "startDate": "YYYY-MM-DDTHH:mm",
  "endDate": "YYYY-MM-DDTHH:mm",
  "location": "...",
  "description": "..."
}`;

    // Try models in order of capability & speed
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-3.8-flash',
    ];

    let lastError = null;
    let resultJson = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: 'application/json',
                temperature: 0.1,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(`Model ${model} returned ${response.status}: ${errText}`);
          continue;
        }

        const data = await response.json();
        const candidateText =
          data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          resultJson = JSON.parse(candidateText);
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!resultJson) {
      throw lastError || new Error('Không thể phân tích dữ liệu từ ảnh');
    }

    return NextResponse.json({
      success: true,
      data: {
        name: resultJson.name || 'Sự kiện mới',
        startDate: resultJson.startDate || new Date().toISOString().substring(0, 16),
        endDate:
          resultJson.endDate ||
          new Date(Date.now() + 24 * 3600000).toISOString().substring(0, 16),
        location: resultJson.location || '',
        description: resultJson.description || '',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/events/extract-poster:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý trích xuất ảnh sự kiện' },
      { status: 500 }
    );
  }
}
