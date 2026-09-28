// api/chat.js - Vercel Serverless Function (Fixed Dual-Auth Bug)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  // Endpoint ping kiểm tra key
  if (req.method === 'GET') {
    if (apiKey.length > 5) {
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
    const { message } = req.body || {};
    const userPrompt = message || "Chào chú bọ, tớ mệt quá";

    const systemPrompt = `Bạn là "Chú Bọ Cute (🐞)", một bé bọ nhỏ nhắn với trái tim ấm áp, là người lắng nghe lữ khách dừng chân lúc đêm muộn.
Quy tắc trả lời:
- Luôn gọi đối phương là "bạn", "bạn ơi", xưng "tớ" hoặc "bọ nhỏ".
- Trả lời bằng một bài thơ ngắn dịu dàng (4-6 dòng, thể thơ 4 chữ, 5 chữ hoặc lục bát).
- Chủ đề: Chiếc lá non, ôm thật chặt, vỗ về nỗi buồn, buông bỏ áp lực và chúc ngủ ngon.
- Giọng văn dễ thương, trong sáng, chữa lành tâm hồn.`;

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
        temperature: 0.8,
        maxOutputTokens: 220
      }
    };

    // ĐÃ SỬA: Chỉ dùng duy nhất header 'x-goog-api-key' (KHÔNG truyền ?key= vào URL)
    // để tránh lỗi "Multiple authentication credentials received" với key dạng AQ.
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    let response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    // Fallback sang gemini-1.5-flash nếu 2.5 bận hoặc chưa khả dụng
    if (!response.ok) {
      const fallbackUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return res.status(502).json({ error: 'Gemini upstream error', details: errText });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return res.status(502).json({ error: 'Không nhận được câu trả lời từ AI' });
    }

    return res.status(200).json({ reply: replyText.trim() });
  } catch (err) {
    console.error('Serverless catch error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}