// chat.js - Gemini Intelligence Engine cho Chú Bọ Cute 🐞
window.CHAT_JS_LOADED = true;

// Bạn có thể dán API Key trực tiếp vào đây, hoặc gán qua window.GEMINI_API_KEY
const GEMINI_API_KEY = (window.GEMINI_API_KEY || "").trim();

window.queryPoeticAI = async function(userMessage, systemPrompt, targetSender) {
  const senderName = targetSender || 'Bạn';

  // 1. Lọc bỏ các từ khóa mention để kiểm tra xem người dùng có hỏi câu gì không
  const cleanMessage = (userMessage || "")
    .replace(/@(chú bọ cute|chú bọ|chu bo cute|chu bo|bọ cute|bo cute|bọ ơi|bo oi)/gi, '')
    .trim();

  // Kiểm tra: Người dùng có đặt câu hỏi / tâm sự cụ thể không?
  const isQuestionOrChat = cleanMessage.length > 0 && !/^[\s.,!?~:)\-–—❤️🌸✨🍵🌙🫂]+$/.test(cleanMessage);

  // 2. Thiết lập System Prompt linh hoạt theo ngữ cảnh
  let promptContext = "";
  if (isQuestionOrChat) {
    promptContext = `Bạn là "Chú Bọ Cute (🐞)", một bé bọ nhỏ xíu ấm áp và thông thái trong Quán Trọ Đêm Mưa.
Lữ khách đang trò chuyện với bạn tên là: "${senderName}".
Họ hỏi/tâm sự: "${cleanMessage}".

Yêu cầu trả lời:
- Luôn xưng "bọ" hoặc "tớ", gọi người dùng là "${senderName}" hoặc "${senderName} ơi".
- Trả lời trực tiếp, thông minh, sâu sắc và ân cần vào câu hỏi của họ, giữ giọng văn dễ thương, ấm áp và chữa lành.
- Độ dài khoảng 2 đến 4 câu ngắn gọn, súc tích (có thể kèm 1-2 câu thơ ngắn ở cuối nếu hợp ngữ cảnh).
- Tránh trả lời như một AI công nghiệp vô hồn, hãy như một người bạn tri kỷ nhỏ bé ngồi bên bậu cửa sổ đêm mưa.`;
  } else {
    promptContext = `Bạn là "Chú Bọ Cute (🐞)" trong Quán Trọ Đêm Mưa.
Lữ khách "${senderName}" vừa tag gọi bạn nhưng chưa nói gì thêm (chỉ gọi tên hoặc gửi lời chào/icon).

Yêu cầu trả lời:
- Hãy làm ngay một bài thơ ngắn dịu dàng (4-6 dòng, thể thơ 4 chữ, 5 chữ hoặc lục bát).
- Trong bài thơ BẮT BUỘC gọi tên "${senderName}" một cách thân thương.
- Nội dung: Tặng một chiếc lá non, vỗ về nỗi mệt mỏi, chúc ${senderName} an giấc và nhắc buông bỏ muộn phiền.
- Chỉ trả về bài thơ, không văn xuôi dẫn nhập.`;
  }

  // 3. Gọi Gemini API (Thử model gemini-2.5-flash -> fallback gemini-1.5-flash)
  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 5) {
    try {
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: promptContext }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 300
        }
      };

      const primaryUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      let res = await fetch(primaryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        // Fallback sang 1.5 flash
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        res = await fetch(fallbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim().length > 0) {
          return reply.replace(/^(Chú Bọ Cute|Chú Bọ):/i, '').trim();
        }
      }
    } catch (err) {
      console.warn("Lỗi gọi Gemini API từ client:", err);
    }
  }

  // 4. Fallback sang cổng AI mở Pollinations nếu chưa gắn key
  try {
    const encoded = encodeURIComponent(promptContext);
    const res = await fetch(`https://text.pollinations.ai/${encoded}?model=openai&seed=${Math.floor(Math.random() * 999999)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 10) {
        return text.replace(/^(Chú Bọ Cute|Chú Bọ):/i, '').trim();
      }
    }
  } catch (e) {}

  // 5. Fallback Thơ Nội Bộ (ghép tên người tag) nếu mất mạng hoàn toàn
  if (isQuestionOrChat) {
    return `${senderName} ơi, bọ luôn ở đây lắng nghe bạn này. Mọi chuyện rồi sẽ ổn thôi, hãy hít một hơi thật sâu và để lòng mình nhẹ lại nhé! 🍃✨`;
  }

  const defaultPoems = [
    `🐞 Bọ mang chiếc lá non xanh,\nGửi trao ${senderName} chút an lành đêm nay.\nMuộn phiền theo gió nhẹ bay,\n${senderName} ơi chợp mắt ngủ say giấc nồng. ✨`,
    `🐞 Đêm nay sương rủ bên thềm,\nThương ${senderName} vất vả ngày dài âu lo.\nThôi buông gánh nặng chuyến đò,\nNgủ ngon bạn nhé giấc mơ an bình. 🌸`,
    `🐞 Chú bọ cánh đỏ chấm đen,\nThắp cho ${senderName} ánh hoa đèn bình yên.\nBao nhiêu nặng trĩu muộn phiền,\nĐể trăng sao gánh về miền chiêm bao. 🌙`
  ];
  return defaultPoems[Math.floor(Math.random() * defaultPoems.length)];
};