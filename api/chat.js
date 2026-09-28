if (typeof window !== 'undefined') {
/* ==========================================================
   APP.JS - CHỐN BÌNH YÊN (Mental Decompression Web App)
   ========================================================== */

// --- 1. PROCEDURAL WEB AUDIO SYNTHESIZER (100% Offline, Zero External Audio) ---
let audioCtx = null;
const sounds = {
  rain: { active: false, gain: null, node: null },
  stream: { active: false, gain: null, node: null },
  fire: { active: false, gain: null, node: null },
  ocean: { active: false, gain: null, node: null },
  wind: { active: false, gain: null, node: null },
  chimes: { active: false, gain: null, timer: null },
  lofi: { active: false, gain: null, timer: null },
  typing: { active: false, gain: null, timer: null }
};

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function createPinkNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function toggleSound(name) {
  initAudioContext();
  const s = sounds[name];
  const isChecked = document.getElementById(`toggle-${name}`)?.checked;
  const vol = parseFloat(document.getElementById(`vol-${name}`)?.value || 0.3);

  if (isChecked) {
    s.active = true;
    if (!s.gain) {
      s.gain = audioCtx.createGain();
      s.gain.connect(audioCtx.destination);
    }
    s.gain.gain.setValueAtTime(vol, audioCtx.currentTime);

    if (name === 'rain') startRainAudio(s);
    else if (name === 'stream') startStreamAudio(s);
    else if (name === 'fire') startFireAudio(s);
    else if (name === 'ocean') startOceanAudio(s);
    else if (name === 'wind') startWindAudio(s);
    else if (name === 'chimes') startChimesAudio(s);
    else if (name === 'lofi') startLofiAudio(s);
    else if (name === 'typing') startTypingAudio(s);
  } else {
    s.active = false;
    if (s.gain) s.gain.gain.setValueAtTime(0, audioCtx.currentTime);
    if (s.timer) clearInterval(s.timer);
  }
}

function changeVolume(name, val) {
  const s = sounds[name];
  if (s && s.gain && s.active) {
    s.gain.gain.setTargetAtTime(parseFloat(val), audioCtx.currentTime, 0.05);
  }
}

function startRainAudio(s) {
  const noise = audioCtx.createBufferSource();
  noise.buffer = createPinkNoiseBuffer();
  noise.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;
  noise.connect(filter);
  filter.connect(s.gain);
  noise.start();
  s.node = noise;
}

function startStreamAudio(s) {
  const noise = audioCtx.createBufferSource();
  noise.buffer = createPinkNoiseBuffer();
  noise.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 650;
  filter.Q.value = 2.0;
  noise.connect(filter);
  filter.connect(s.gain);
  noise.start();
  s.node = noise;
}

function startFireAudio(s) {
  const noise = audioCtx.createBufferSource();
  noise.buffer = createPinkNoiseBuffer();
  noise.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 450;
  noise.connect(filter);
  filter.connect(s.gain);
  noise.start();
  s.node = noise;
}

function startOceanAudio(s) {
  const noise = audioCtx.createBufferSource();
  noise.buffer = createPinkNoiseBuffer();
  noise.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 350;

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.12;
  lfoGain.gain.value = 200;
  lfo.connect(filter.frequency);
  lfo.start();

  noise.connect(filter);
  filter.connect(s.gain);
  noise.start();
  s.node = noise;
}

function startWindAudio(s) {
  const noise = audioCtx.createBufferSource();
  noise.buffer = createPinkNoiseBuffer();
  noise.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 400;
  filter.Q.value = 3.0;

  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.15;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 180;
  lfo.connect(filter.frequency);
  lfo.start();

  noise.connect(filter);
  filter.connect(s.gain);
  noise.start();
  s.node = noise;
}

function startChimesAudio(s) {
  const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
  s.timer = setInterval(() => {
    if (!s.active) return;
    if (Math.random() > 0.4) {
      const freq = notes[Math.floor(Math.random() * notes.length)];
      playTone(freq, 2.5, 'sine', s.gain, 0.15);
    }
  }, 2200);
}

function startLofiAudio(s) {
  const chords = [
    [261.63, 329.63, 392.00, 493.88],
    [220.00, 261.63, 329.63, 392.00],
    [146.83, 220.00, 261.63, 349.23],
    [196.00, 246.94, 293.66, 349.23]
  ];
  let step = 0;
  s.timer = setInterval(() => {
    if (!s.active) return;
    const currentChord = chords[step % chords.length];
    currentChord.forEach(f => playTone(f, 3.8, 'triangle', s.gain, 0.08));
    step++;
  }, 4000);
}

function startTypingAudio(s) {
  s.timer = setInterval(() => {
    if (!s.active) return;
    if (Math.random() > 0.3) {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(250 + Math.random() * 400, audioCtx.currentTime);
      g.gain.setValueAtTime(0.04, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
      osc.connect(g);
      g.connect(s.gain);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    }
  }, 160);
}

function playTone(freq, duration, type, destinationNode, volume = 0.2) {
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(g);
    osc.connect(destinationNode || audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function applyPreset(name) {
  stopAllAudio();
  setTimeout(() => {
    if (name === 'rainLofi') {
      setAudio('rain', 0.45);
      setAudio('lofi', 0.35);
      setAudio('wind', 0.2);
    } else if (name === 'hearthside') {
      setAudio('fire', 0.5);
      setAudio('wind', 0.2);
      setAudio('typing', 0.25);
    } else if (name === 'oceanNight') {
      setAudio('ocean', 0.5);
      setAudio('wind', 0.3);
      setAudio('chimes', 0.3);
    }
  }, 50);
}

function setAudio(name, vol) {
  const toggle = document.getElementById(`toggle-${name}`);
  const slider = document.getElementById(`vol-${name}`);
  if (toggle) toggle.checked = true;
  if (slider) slider.value = vol;
  toggleSound(name);
}

function stopAllAudio() {
  Object.keys(sounds).forEach(name => {
    const toggle = document.getElementById(`toggle-${name}`);
    if (toggle) toggle.checked = false;
    if (sounds[name].active) toggleSound(name);
  });
}

// --- 2. MƯA RƠI & PHỐ LOFI CANVAS ---
const rainCanvas = document.getElementById('rainCanvas');
const rainCtx = rainCanvas ? rainCanvas.getContext('2d') : null;
let raindrops = [];

function resizeRainCanvas() {
  if (!rainCanvas) return;
  rainCanvas.width = window.innerWidth;
  rainCanvas.height = window.innerHeight;
  raindrops = [];
  const count = Math.floor(window.innerWidth / 7);
  for (let i = 0; i < count; i++) {
    raindrops.push({
      x: Math.random() * rainCanvas.width,
      y: Math.random() * rainCanvas.height,
      len: 12 + Math.random() * 20,
      speed: 6 + Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.3
    });
  }
}

function drawRain() {
  if (!rainCtx) return;
  rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  raindrops.forEach(drop => {
    rainCtx.beginPath();
    rainCtx.strokeStyle = `rgba(186, 230, 253, ${drop.opacity})`;
    rainCtx.lineWidth = 1;
    rainCtx.moveTo(drop.x, drop.y);
    rainCtx.lineTo(drop.x - 2, drop.y + drop.len);
    rainCtx.stroke();

    drop.y += drop.speed;
    drop.x -= 0.8;
    if (drop.y > rainCanvas.height) {
      drop.y = -drop.len;
      drop.x = Math.random() * rainCanvas.width;
    }
  });
  requestAnimationFrame(drawRain);
}

// --- 3. DÒNG SÔNG ĐÈN LỒNG (Sóng bung >= 320px, Lưu ngầm) ---
const riverCanvas = document.getElementById('riverCanvas');
const riverCtx = riverCanvas ? riverCanvas.getContext('2d') : null;
let lanterns = [];
let ripples = [];

function resizeRiverCanvas() {
  if (!riverCanvas) return;
  const rect = riverCanvas.parentElement.getBoundingClientRect();
  riverCanvas.width = rect.width;
  riverCanvas.height = rect.height;
}

function loadSavedLanterns() {
  try {
    const raw = localStorage.getItem('user_serene_lanterns') || getCookie('user_serene_lanterns');
    if (raw) {
      const list = JSON.parse(raw);
      list.forEach(item => addLanternToRiver(item.text, true, item.id));
    }
  } catch (e) {}
  
  if (lanterns.length < 5) {
    addLanternToRiver("Bình an và nhẹ lòng", false);
    addLanternToRiver("Buông tay những điều không thuộc về mình", false);
    addLanternToRiver("Ngày mai sẽ tốt đẹp hơn hôm nay", false);
  }
  updateLanternCountUI();
}

function saveLanternsToStorage() {
  const userOnly = lanterns.filter(l => l.isUser).map(l => ({ id: l.id, text: l.text }));
  localStorage.setItem('user_serene_lanterns', JSON.stringify(userOnly));
  setCookie('user_serene_lanterns', JSON.stringify(userOnly), 365);
  updateLanternCountUI();
}

function addLanternToRiver(text, isUser = false, customId = null) {
  lanterns.push({
    id: customId || Date.now() + Math.random(),
    text: text,
    isUser: isUser,
    x: Math.random() * ((riverCanvas ? riverCanvas.width : 600) || 600),
    y: ((riverCanvas ? riverCanvas.height : 280) || 280) * (0.35 + Math.random() * 0.45),
    speed: 0.25 + Math.random() * 0.35,
    bobPhase: Math.random() * Math.PI * 2,
    tilt: 0,
    tiltVel: 0,
    boxWidth: isUser ? 36 : 28,
    boxHeight: isUser ? 42 : 34
  });
}

function releaseNewLantern() {
  const input = document.getElementById('lanternInput');
  const val = input.value.trim();
  if (!val) {
    showToast("Hãy nhập đôi lời trước khi thắp đèn nhé...");
    return;
  }
  initAudioContext();
  addLanternToRiver(val, true);
  saveLanternsToStorage();
  input.value = '';
  showToast("🏮 Đèn lồng mang tâm sự của bạn đã bắt đầu trôi theo dòng sông...");
  playTone(587.33, 1.8, 'sine', null, 0.2);
}

function clearUserLanterns() {
  lanterns = lanterns.filter(l => !l.isUser);
  saveLanternsToStorage();
  showToast("Đã thu dọn hết những đèn lồng cũ của bạn.");
}

function updateLanternCountUI() {
  const count = lanterns.filter(l => l.isUser).length;
  const badge = document.getElementById('userLanternCount');
  if (badge) badge.innerText = count;
}

function handleRiverClick(e) {
  if (!riverCanvas) return;
  initAudioContext();
  const rect = riverCanvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  for (let l of lanterns) {
    const dx = clickX - l.x;
    const dy = clickY - l.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) {
      openLanternModal(l.text);
      return;
    }
  }

  [0, 80, 160].forEach(delay => {
    setTimeout(() => {
      ripples.push({
        x: clickX,
        y: clickY,
        radius: 10,
        maxRadius: 320,
        alpha: 0.7
      });
    }, delay);
  });

  lanterns.forEach(l => {
    const dist = Math.hypot(l.x - clickX, l.y - clickY);
    if (dist < 260) {
      const force = (1 - dist / 260);
      l.tiltVel = (l.x > clickX ? 0.25 : -0.25) * force;
      l.y += (l.y > clickY ? 12 : -12) * force;
    }
  });

  playTone(784, 0.4, 'sine', null, 0.15);
  setTimeout(() => playTone(1046.5, 0.6, 'sine', null, 0.12), 60);
}

function drawRiver() {
  if (!riverCtx) return;
  riverCtx.clearRect(0, 0, riverCanvas.width, riverCanvas.height);

  const grad = riverCtx.createLinearGradient(0, 0, 0, riverCanvas.height);
  grad.addColorStop(0, '#04070d');
  grad.addColorStop(1, '#091322');
  riverCtx.fillStyle = grad;
  riverCtx.fillRect(0, 0, riverCanvas.width, riverCanvas.height);

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.radius += 2.8;
    r.alpha -= 0.007;
    if (r.alpha <= 0 || r.radius >= r.maxRadius) {
      ripples.splice(i, 1);
      continue;
    }
    riverCtx.save();
    riverCtx.beginPath();
    riverCtx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    riverCtx.strokeStyle = `rgba(56, 189, 248, ${r.alpha})`;
    riverCtx.lineWidth = 2.2;
    riverCtx.shadowColor = '#38bdf8';
    riverCtx.shadowBlur = 10;
    riverCtx.stroke();
    riverCtx.restore();
  }

  const now = Date.now() * 0.003;
  lanterns.forEach(l => {
    l.x += l.speed;
    if (l.x - 40 > riverCanvas.width) {
      l.x = -40;
    }

    const bob = Math.sin(now + l.bobPhase) * 4;
    l.tilt += l.tiltVel;
    l.tiltVel *= 0.92;

    riverCtx.save();
    riverCtx.translate(l.x, l.y + bob);
    riverCtx.rotate(l.tilt);

    const glow = riverCtx.createRadialGradient(0, 0, 4, 0, 0, l.boxWidth * 1.8);
    glow.addColorStop(0, l.isUser ? 'rgba(251, 191, 36, 0.9)' : 'rgba(245, 158, 11, 0.7)');
    glow.addColorStop(0.5, 'rgba(217, 119, 6, 0.3)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    riverCtx.fillStyle = glow;
    riverCtx.beginPath();
    riverCtx.arc(0, 0, l.boxWidth * 1.8, 0, Math.PI * 2);
    riverCtx.fill();

    const w = l.boxWidth;
    const h = l.boxHeight;
    riverCtx.fillStyle = 'rgba(254, 243, 199, 0.9)';
    riverCtx.fillRect(-w/2, -h/2, w, h);

    riverCtx.strokeStyle = '#451a03';
    riverCtx.lineWidth = 1.5;
    riverCtx.strokeRect(-w/2, -h/2, w, h);
    
    riverCtx.fillStyle = '#f59e0b';
    riverCtx.beginPath();
    riverCtx.arc(0, 0, 3.5, 0, Math.PI * 2);
    riverCtx.fill();

    riverCtx.strokeStyle = '#b91c1c';
    riverCtx.lineWidth = 1.5;
    riverCtx.beginPath();
    riverCtx.moveTo(0, h/2);
    riverCtx.lineTo(Math.sin(now * 2 + l.bobPhase) * 4, h/2 + 10);
    riverCtx.stroke();

    riverCtx.restore();
  });

  requestAnimationFrame(drawRiver);
}

function openLanternModal(text) {
  const modalText = document.getElementById('lanternModalText');
  if (modalText) modalText.innerText = `"${text}"`;
  const m = document.getElementById('lanternModal');
  if (m) m.classList.remove('opacity-0', 'pointer-events-none');
}

function closeLanternModal() {
  const m = document.getElementById('lanternModal');
  if (m) m.classList.add('opacity-0', 'pointer-events-none');
}

// --- 4. ĐỐT GIẤY TỪ TỪ (Slow Creeping Paper Burn) ---
function setBurnTemplate(t) {
  const ta = document.getElementById('burnPaperText');
  if (ta) ta.value = t;
}

function ignitePaperSlowly() {
  const ta = document.getElementById('burnPaperText');
  const text = ta ? ta.value.trim() : '';
  if (!text) {
    showToast("Hãy viết điều gì đó lên giấy trước khi châm lửa nhé...");
    return;
  }
  initAudioContext();

  const btn = document.getElementById('burnBtn');
  const overlay = document.getElementById('burnOverlay');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  }

  setAudio('fire', 0.6);

  if (overlay) {
    overlay.classList.remove('opacity-0', 'translate-y-full');
    overlay.classList.add('opacity-100', 'translate-y-0');
  }

  setTimeout(() => {
    if (ta) ta.value = '';
    setTimeout(() => {
      if (overlay) {
        overlay.classList.add('opacity-0', 'translate-y-full');
        overlay.classList.remove('opacity-100', 'translate-y-0');
      }
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      showToast("✨ Tờ giấy đã tan biến. Hãy hít một hơi thật sâu nào!");
    }, 3000);
  }, 7500);
}

// --- 5. NHỊP THỞ 4-7-8 & CANVAS VẼ CHÒM SAO ---
let breathTime = 0;
setInterval(() => {
  breathTime = (breathTime + 1) % 19;
  const phase = document.getElementById('breathPhaseText');
  const timer = document.getElementById('breathTimerText');
  if (!phase || !timer) return;
  if (breathTime < 4) {
    phase.innerText = "Hít Vào (Mũi)";
    timer.innerText = `${4 - breathTime}s`;
  } else if (breathTime < 11) {
    phase.innerText = "Giữ Hơi Thở";
    timer.innerText = `${11 - breathTime}s`;
  } else {
    phase.innerText = "Thở Ra (Miệng)";
    timer.innerText = `${19 - breathTime}s`;
  }
}, 1000);

const starCanvas = document.getElementById('starCanvas');
const starCtx = starCanvas ? starCanvas.getContext('2d') : null;
let stars = [];

function resizeStarCanvas() {
  if (!starCanvas) return;
  starCanvas.width = starCanvas.parentElement.clientWidth;
  starCanvas.height = starCanvas.parentElement.clientHeight;
}

function addStar(e) {
  if (!starCanvas) return;
  initAudioContext();
  const rect = starCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  stars.push({ x, y, alpha: 1, radius: 2.5 + Math.random() * 2 });
  if (stars.length > 30) stars.shift();

  const scale = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  playTone(scale[Math.floor(Math.random() * scale.length)], 1.2, 'sine', null, 0.08);
}

function clearStarCanvas() {
  stars = [];
}

function drawStars() {
  if (!starCtx) return;
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  starCtx.strokeStyle = 'rgba(186, 230, 253, 0.2)';
  starCtx.lineWidth = 1;

  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dist = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
      if (dist < 65) {
        starCtx.beginPath();
        starCtx.moveTo(stars[i].x, stars[i].y);
        starCtx.lineTo(stars[j].x, stars[j].y);
        starCtx.stroke();
      }
    }
  }

  stars.forEach(s => {
    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    starCtx.fillStyle = `rgba(254, 240, 138, ${s.alpha})`;
    starCtx.fill();
  });
  requestAnimationFrame(drawStars);
}

// --- 6. QUÁN TRỌ ĐÊM MƯA: CHAT NHÓM, SMART SCROLL FIX & BOT CHÚ BỌ CUTE 🐞 ---
let chatClient = null;
let isChatOpen = false;
let unreadCount = 0;

function toggleChatDrawer(open) {
  isChatOpen = open;
  const d = document.getElementById('chatDrawer');
  if (open) {
    d.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
    document.getElementById('unreadChatDot')?.classList.add('hidden');
    scrollToChatBottom(false);
  } else {
    d.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
  }
}

function tagBotInInput() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  input.value = `@Chú Bọ Cute ${input.value}`;
  input.focus();
}

/**
 * Xử lý khi người dùng tự cuộn tay
 */
function handleChatScroll() {
  const c = document.getElementById('chatMessages');
  if (!c) return;
  
  const distFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
  const isScrolledUp = distFromBottom > 50;
  const btn = document.getElementById('scrollToBottomBtn');

  if (!isScrolledUp) {
    if (btn) btn.classList.add('hidden');
    unreadCount = 0;
  }
}

/**
 * Cuộn mượt xuống đáy khung chat
 */
function scrollToChatBottom(smooth = true) {
  const c = document.getElementById('chatMessages');
  if (!c) return;
  c.scrollTo({ top: c.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  const btn = document.getElementById('scrollToBottomBtn');
  if (btn) btn.classList.add('hidden');
  unreadCount = 0;
}

/**
 * BẮT BUỘC: Kiểm tra trạng thái cuộn TRƯỚC KHI append tin nhắn vào DOM
 * Nếu người dùng đang cuộn lên xem tin cũ -> Giữ nguyên vị trí, KHÔNG kéo màn hình
 */
function renderChatMessage(msg, isMe = false) {
  const c = document.getElementById('chatMessages');
  if (!c) return;

  // 1. Kiểm tra chính xác xem user có đang ở đáy hay không trước khi DOM thay đổi
  const threshold = 50;
  const wasAtBottom = (c.scrollHeight - c.scrollTop - c.clientHeight) <= threshold;

  // 2. Tạo phần tử DOM tin nhắn
  const div = document.createElement('div');
  div.className = "flex items-start gap-2.5 animate-fadeIn";

  if (msg.isBot) {
    div.innerHTML = `
      <span class="text-lg p-1.5 rounded-full bg-amber-950/80 border border-amber-800/60 flex-shrink-0">🐞</span>
      <div class="max-w-[80%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed font-serif-soft italic">
        <p class="font-semibold text-amber-400 text-[10px] not-italic mb-1 flex items-center gap-1">
          <span>🐞 Chú Bọ Cute</span>
          <span class="text-[9px] px-1.5 py-0.2 bg-amber-500/20 rounded text-amber-300">Nhà thơ tí hon</span>
        </p>
        ${msg.text.replace(/\n/g, '<br>')}
      </div>
    `;
  } else {
    div.innerHTML = `
      <span class="text-lg p-1.5 rounded-full bg-slate-900 border border-slate-800 flex-shrink-0">🍃</span>
      <div class="max-w-[80%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
        <p class="font-medium text-slate-400 text-[10px] mb-0.5">${escapeHtml(msg.sender || 'Lữ khách')}</p>
        ${escapeHtml(msg.text)}
      </div>
    `;
  }

  // 3. Append vào DOM
  c.appendChild(div);

  // 4. Quyết định hành vi cuộn:
  if (wasAtBottom || isMe) {
    // Nếu đang ở sát đáy hoặc là tin nhắn do chính user gửi -> Cuộn xuống đáy
    scrollToChatBottom(true);
  } else {
    // Nếu user đang cuộn lên trên đọc tin cũ -> GIỮ NGUYÊN VỊ TRÍ CUỘN, tăng badge tin mới
    unreadCount++;
    const btn = document.getElementById('scrollToBottomBtn');
    const badge = document.getElementById('unreadScrollBadge');
    if (btn) btn.classList.remove('hidden');
    if (badge) {
      badge.innerText = unreadCount;
      badge.classList.remove('hidden');
    }
  }

  if (!isChatOpen) {
    document.getElementById('unreadChatDot')?.classList.remove('hidden');
  }
}

// Khởi tạo kết nối MQTT và lưu lịch sử
function initMqttChat() {
  try {
    chatClient = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
    chatClient.on('connect', () => {
      chatClient.subscribe('chon-binh-yen/global-chat-v2');
      // Gửi yêu cầu sync lịch sử tin nhắn từ các máy đang online
      chatClient.publish('chon-binh-yen/global-chat-v2', JSON.stringify({ type: 'REQ_HISTORY' }));
    });

    chatClient.on('message', (topic, payload) => {
      try {
        const data = JSON.parse(payload.toString());
        if (data.type === 'REQ_HISTORY') {
          // Gửi phản hồi danh sách tin nhắn hiện tại nếu có
          const localCache = JSON.parse(localStorage.getItem('cached_messages') || '[]');
          if (localCache.length > 0) {
            chatClient.publish('chon-binh-yen/global-chat-v2', JSON.stringify({
              type: 'RES_HISTORY',
              history: localCache.slice(-15)
            }));
          }
          return;
        }

        if (data.type === 'RES_HISTORY') {
          // Nhận lịch sử từ máy khác và nạp nếu máy mình đang trống
          const currentCount = document.getElementById('chatMessages')?.children?.length || 0;
          if (currentCount <= 3 && Array.isArray(data.history)) {
            data.history.forEach(item => renderChatMessage(item, false));
          }
          return;
        }

        // Tin nhắn chat thông thường
        renderChatMessage(data, false);
        saveMessageToCache(data);
      } catch (e) {}
    });
  } catch (err) {
    console.log('MQTT local fallback:', err);
  }
}

function saveMessageToCache(msg) {
  try {
    const list = JSON.parse(localStorage.getItem('cached_messages') || '[]');
    list.push(msg);
    if (list.length > 30) list.shift();
    localStorage.setItem('cached_messages', JSON.stringify(list));
  } catch (e) {}
}

async function handleSendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const userMsg = {
    sender: 'Bạn',
    text: text,
    time: Date.now()
  };

  input.value = '';

  // Render ngay trên màn hình người gửi và ép cuộn xuống đáy
  renderChatMessage(userMsg, true);
  saveMessageToCache(userMsg);

  // Gửi qua MQTT đến mọi người
  if (chatClient && chatClient.connected) {
    chatClient.publish('chon-binh-yen/global-chat-v2', JSON.stringify(userMsg));
  }

  // Bot mặc định im lặng, CHỈ PHẢN HỒI KHI ĐƯỢC MENTION
  const mentionRegex = /@(chú bọ|chu bo|bọ cute|bo cute|chú bọ cute|bọ ơi)/i;
  if (mentionRegex.test(text)) {
    triggerChuBoPoem(text);
  }
}

async function triggerChuBoPoem(userText) {
  const typing = document.getElementById('botTypingIndicator');
  if (typing) typing.classList.remove('hidden');

  let replyPoem = "";

  try {
    // 1. Thử gọi backend Serverless Vercel (/api/chat)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) replyPoem = data.reply;
    }
  } catch (err) {}

  // 2. Fallback sang Free AI Proxy nếu chưa deploy backend
  if (!replyPoem) {
    try {
      const prompt = encodeURIComponent(`Bạn là Chú Bọ Cute (🐞), một bé bọ nhỏ xíu ấm áp. Hãy làm một bài thơ ngắn 4-6 câu dịu dàng vỗ về lữ khách: "${userText}".`);
      const freeRes = await fetch(`https://text.pollinations.ai/${prompt}`);
      if (freeRes.ok) {
        replyPoem = await freeRes.text();
      }
    } catch (e) {}
  }

  // 3. Fallback nội bộ offline nếu mạng mất kết nối hoàn toàn
  if (!replyPoem) {
    const offlinePoems = [
      "Lá biếc che đầu mưa bớt rơi,\nThương bạn vất vả giữa dòng đời.\nThôi buông gánh nặng nằm ngơi nghỉ,\nSớm mai nắng rạng lại tươi cười. 🍃",
      "Bọ nhỏ ôm bạn chiếc ôm đầy,\nBao nhiêu mỏi mệt gửi vào mây.\nTrăng treo đầu núi ru giấc mộng,\nBình an theo bạn suốt đêm nay. ✨",
      "Thở một hơi sâu, thả lỏng vai,\nChuyện buồn xin chớ nghĩ dài dai.\nĐêm nay đã có ngàn sao sáng,\nVỗ về giấc ngủ đến sớm mai. 🌙"
    ];
    replyPoem = offlinePoems[Math.floor(Math.random() * offlinePoems.length)];
  }

  if (typing) typing.classList.add('hidden');

  const botMsg = {
    isBot: true,
    text: replyPoem.trim(),
    time: Date.now()
  };

  // Render câu thơ của bot
  renderChatMessage(botMsg, false);
  saveMessageToCache(botMsg);

  if (chatClient && chatClient.connected) {
    chatClient.publish('chon-binh-yen/global-chat-v2', JSON.stringify(botMsg));
  }
}

// Kiểm tra trạng thái AI Engine
async function checkAiEngineStatus() {
  const badge = document.getElementById('aiEngineBadge');
  const dot = document.getElementById('aiBadgeDot');
  const txt = document.getElementById('aiBadgeText');
  if (!badge || !dot || !txt) return;

  try {
    const res = await fetch('/api/chat', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (data.hasKey) {
        badge.className = "px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1 cursor-default select-none";
        dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-400";
        txt.innerText = "Gemini Active";
        return;
      }
    }
  } catch (e) {}

  badge.className = "px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-700/60 flex items-center gap-1 cursor-default select-none";
  dot.className = "w-1.5 h-1.5 rounded-full bg-amber-400";
  txt.innerText = "Free Engine";
}

// --- 7. TIỆN ÍCH & KHỞI TẠO (Cookie, Storage, Counter) ---
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  document.cookie = `${cname}=${encodeURIComponent(cvalue)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(cname) {
  const name = cname + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) return decodeURIComponent(c.substring(name.length, c.length));
  }
  return "";
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerText = msg;
  t.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => t.classList.add('opacity-0', 'pointer-events-none'), 3500);
}

// Bộ đếm người đồng hành dao động hữu cơ >= 69
let currentVisitors = 69;
setInterval(() => {
  const delta = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);
  currentVisitors = Math.max(69, currentVisitors + delta);
  const el = document.getElementById('visitorCount');
  if (el) el.innerText = currentVisitors;
}, 24000);

// Khởi chạy khi tài liệu sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
  resizeRainCanvas();
  drawRain();
  resizeRiverCanvas();
  loadSavedLanterns();
  resizeStarCanvas();
  drawStars();
  initMqttChat();
  checkAiEngineStatus();

  // Đăng ký sự kiện vẽ sao
  if (starCanvas) {
    starCanvas.addEventListener('mousedown', addStar);
    starCanvas.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) addStar(e);
    });
  }

  // Đăng ký sự kiện click badge đồng hành
  document.getElementById('companionBadge')?.addEventListener('click', () => {
    showToast("Bạn không hề đơn độc. Tối nay luôn có những lữ khách cùng bạn dừng lại nghỉ ngơi.");
  });

  window.addEventListener('resize', () => {
    resizeRainCanvas();
    resizeRiverCanvas();
    resizeStarCanvas();
  });
});
} else {
  module.exports = async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (req.method === 'GET') {
      return res.status(200).json({ configured: Boolean(apiKey) });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!apiKey) {
      return res.status(503).json({ error: 'Gemini is not configured' });
    }

    const message = req.body?.message;
    if (typeof message !== 'string' || !message.trim() || message.length > 280) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'Bạn là Chú Bọ Cute. Chỉ trả lời bằng một bài thơ tiếng Việt dịu dàng, 4-6 dòng, để vỗ về người dùng. Không viết văn xuôi.' }] },
          contents: [{ parts: [{ text: message.trim() }] }]
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) {
        return res.status(502).json({ error: 'Gemini request failed' });
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
      if (!reply) {
        return res.status(502).json({ error: 'Gemini returned no reply' });
      }
      return res.status(200).json({ reply });
    } catch (error) {
      return res.status(502).json({ error: 'Gemini request failed' });
    }
  };
}