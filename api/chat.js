// api/chat.js - Vercel Serverless Function
export default async function handler(req, res) {
  // Bật CORS cho mọi origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Endpoint kiểm tra nhanh trạng thái key (cho badge màu xanh/vàng)
  if (req.method === 'GET') {
    if (apiKey && apiKey.trim().length > 5) {
      return res.status(200).json({ status: 'active', hasKey: true });
    }
    return res.status(200).json({ status: 'fallback', hasKey: false });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel' });
  }

  try {
    const { message, persona } = req.body || {};
    const userPrompt = message || "Chào chú bọ, hôm nay tớ mệt quá";

    // System instruction ép Chú Bọ Cute làm thơ 4-5 chữ / lục bát vỗ về
    const systemPrompt = `Bạn là "Chú Bọ Cute (🐞)", một bé bọ nhỏ nhắn với trái tim ấm áp, là người lắng nghe lữ khách dừng chân lúc đêm muộn.
Quy tắc trả lời:
- Luôn gọi đối phương là "bạn", "bạn ơi", xưng "tớ" hoặc "bọ nhỏ".
- Trả lời bằng một bài thơ ngắn dịu dàng (4-6 dòng, thể thơ 4 chữ, 5 chữ hoặc lục bát ngọt ngào).
- Chủ đề: Chiếc lá non, ôm thật chặt, vỗ về nỗi buồn, buông bỏ áp lực và chúc ngủ ngon.
- Giọng văn dễ thương, trong sáng, chữa lành tâm hồn, không dùng từ ngữ đao to búa lớn.`;

    // Gọi trực tiếp Google Gemini API qua endpoint chính thức
    // Dùng gemini-2.5-flash (tự động fallback sang gemini-1.5-flash nếu cần)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemPrompt}\n\nLữ khách tâm sự: "${userPrompt}"\nHãy làm một bài thơ vỗ về bạn ấy:` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 250
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return res.status(502).json({ error: 'Lỗi từ Gemini API', details: errorText });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return res.status(502).json({ error: 'Không nhận được phản hồi từ AI' });
    }

    return res.status(200).json({ reply: replyText.trim() });
  } catch (err) {
    console.error('Serverless internal error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}