// --- SOLARIS OS Main Engine ---

let GEMINI_API_KEY = 'AQ.Ab8RN6KlvICmmqpxBxvOfIwj9n9WybATB6DJ7LbMlppvliIMiA';

// --- Wallpaper Manager ---
let currentWallpaperIndex = 1;
const totalWallpapers = 3;

function cycleWallpaper() {
  const body = document.getElementById('app-body');
  body.style.backgroundImage = ''; 
  body.className = ''; 
  
  currentWallpaperIndex = (currentWallpaperIndex % totalWallpapers) + 1;
  body.classList.add(`bg-wallpaper-${currentWallpaperIndex}`);
}

function uploadCustomBg(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const body = document.getElementById('app-body');
      body.className = ''; 
      body.style.backgroundImage = `url('${e.target.result}')`;
    };
    reader.readAsDataURL(file);
  }
}

// --- Music & Audio Stream Controller ---
let isMusicPlaying = false;

function toggleMusic() {
  const audio = document.getElementById('bg-audio');
  const btn = document.getElementById('music-btn');
  if (!audio) return;

  // Fallback default relaxing synth ambient stream if none set
  if (!audio.src || audio.src === window.location.href) {
    audio.src = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
    audio.load();
  }

  if (!isMusicPlaying) {
    audio.play().then(() => {
      isMusicPlaying = true;
      if (btn) btn.innerText = '⏸ Pause Music';
    }).catch(() => {
      alert("Click anywhere on the page first to enable audio playback!");
    });
  } else {
    audio.pause();
    isMusicPlaying = false;
    if (btn) btn.innerText = '🎵 Play Music';
  }
}

function setCustomAudioUrl() {
  const input = document.getElementById('custom-audio-url-input');
  const statusMsg = document.getElementById('audio-status-msg');
  const audio = document.getElementById('bg-audio');
  const btn = document.getElementById('music-btn');

  if (!input || !audio) return;
  const newUrl = input.value.trim();

  if (!newUrl) {
    if (statusMsg) statusMsg.innerText = 'Please enter a valid audio stream URL.';
    return;
  }

  audio.pause();
  audio.src = newUrl;
  audio.load();
  isMusicPlaying = false;
  if (btn) btn.innerText = '🎵 Play Music';

  localStorage.setItem('SOLARIS_AUDIO_URL', newUrl);
  if (statusMsg) statusMsg.innerText = 'Custom audio URL applied successfully! ✓';
  
  setTimeout(() => {
    closeModal('music-url-modal');
  }, 1000);
}

// --- Modal Controller ---
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.style.display = 'none';
  }
};

// --- Live Gemini AI Integration ---
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const messagesContainer = document.getElementById('chat-messages');
  if (!input || !messagesContainer) return;
  const userText = input.value.trim();

  if (!userText) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'message user';
  userMsg.innerText = userText;
  messagesContainer.appendChild(userMsg);

  input.value = '';
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'message ai';
  loadingMsg.innerText = 'Thinking... 💭';
  messagesContainer.appendChild(loadingMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  let apiKey = GEMINI_API_KEY;
  if (!apiKey) {
    apiKey = localStorage.getItem('SOLARIS_GEMINI_KEY');
    if (!apiKey) {
      apiKey = prompt('Please enter your Google Gemini API key:');
      if (apiKey) localStorage.setItem('SOLARIS_GEMINI_KEY', apiKey.trim());
    }
  }

  if (!apiKey) {
    messagesContainer.removeChild(loadingMsg);
    const err = document.createElement('div');
    err.className = 'message ai';
    err.innerText = 'API key required to run neural companion. Please re-open and enter a valid key.';
    messagesContainer.appendChild(err);
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userText }] }]
      })
    });

    const data = await response.json();
    messagesContainer.removeChild(loadingMsg);

    let aiReply = "I couldn't generate a response. Please double check your API key status! ✨";
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      aiReply = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      aiReply = `API Error: ${data.error.message}`;
      if (data.error.code === 400 || data.error.code === 403) {
        localStorage.removeItem('SOLARIS_GEMINI_KEY');
      }
    }

    const aiMsg = document.createElement('div');
    aiMsg.className = 'message ai';
    aiMsg.innerText = aiReply;
    messagesContainer.appendChild(aiMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

  } catch (error) {
    if (messagesContainer.contains(loadingMsg)) {
      messagesContainer.removeChild(loadingMsg);
    }
    const errorMsg = document.createElement('div');
    errorMsg.className = 'message ai';
    errorMsg.innerText = "Network connection issue! Please check your connection or key setup. ⚠️";
    messagesContainer.appendChild(errorMsg);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') sendChatMessage();
    });
  }

  // Load Scratchpad
  const scratchpad = document.getElementById('scratchpad-text');
  if (scratchpad) {
    const savedNotes = localStorage.getItem('SOLARIS_NOTES');
    if (savedNotes) scratchpad.value = savedNotes;
  }

  // Load Saved Audio URL if present
  const savedAudioUrl = localStorage.getItem('SOLARIS_AUDIO_URL');
  if (savedAudioUrl) {
    const audio = document.getElementById('bg-audio');
    if (audio) {
      audio.src = savedAudioUrl;
      audio.load();
    }
  }

  // Load Tasks from LocalStorage
  loadTasks();

  // Load Saved Rating
  const savedRating = localStorage.getItem('SOLARIS_RATING');
  if (savedRating) rateApp(parseInt(savedRating));
});

// --- Scratchpad Functions ---
function saveNotes() {
  const scratchpad = document.getElementById('scratchpad-text');
  const status = document.getElementById('notes-status');
  if (scratchpad) {
    localStorage.setItem('SOLARIS_NOTES', scratchpad.value);
    if (status) {
      status.innerText = 'Saved ✓';
      setTimeout(() => status.innerText = 'Auto-saved to local storage ✓', 1200);
    }
  }
}

// --- Star Rating Function ---
function rateApp(rating) {
  const stars = document.querySelectorAll('#star-container span');
  const feedback = document.getElementById('rating-response');

  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });

  if (feedback) {
    if (rating === 5) {
      feedback.innerText = 'Thank you! 5-star perfection! 🌟';
    } else {
      feedback.innerText = `Thanks for your ${rating}-star rating! ✨`;
    }
  }
  localStorage.setItem('SOLARIS_RATING', rating);
}

// --- Calculator Logic ---
let calcDisplayValue = '0';

function appendCalc(val) {
  if (calcDisplayValue === '0' && val !== '.') {
    calcDisplayValue = val;
  } else {
    calcDisplayValue += val;
  }
  updateCalcScreen();
}

function clearCalc() {
  calcDisplayValue = '0';
  updateCalcScreen();
}

function calculateResult() {
  try {
    calcDisplayValue = eval(calcDisplayValue).toString();
  } catch (error) {
    calcDisplayValue = 'Error';
  }
  updateCalcScreen();
}

function updateCalcScreen() {
  const screen = document.getElementById('calc-screen');
  if (screen) screen.innerText = calcDisplayValue;
}

// --- Flexible Custom Focus Timer Logic with Giant Ring ---
let timerInterval = null;
let totalInitialTime = 25 * 60;
let timeLeft = 25 * 60; 
let isTimerRunning = false;

function applyCustomTimer() {
  const hrsInput = document.getElementById('timer-hours-input');
  const minsInput = document.getElementById('timer-mins-input');
  if (!hrsInput || !minsInput) return;

  const hrs = parseInt(hrsInput.value.trim(), 10) || 0;
  const mins = parseInt(minsInput.value.trim(), 10) || 0;

  clearInterval(timerInterval);
  isTimerRunning = false;
  
  totalInitialTime = (hrs * 3600) + (mins * 60);
  if (totalInitialTime <= 0) totalInitialTime = 1;
  timeLeft = totalInitialTime;

  updateTimerDisplay();
  updateTimerProgressRing();

  const btn = document.getElementById('timer-toggle-btn');
  if (btn) btn.innerText = 'Start';
}

function toggleTimer() {
  const btn = document.getElementById('timer-toggle-btn');
  if (!isTimerRunning) {
    if (timeLeft <= 0) applyCustomTimer();
    isTimerRunning = true;
    if (btn) btn.innerText = 'Pause';
    
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
        updateTimerProgressRing();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        if (btn) btn.innerText = 'Start';
        alert('Focus session complete! 🎉');
      }
    }, 1000);
  } else {
    isTimerRunning = false;
    clearInterval(timerInterval);
    if (btn) btn.innerText = 'Start';
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timeLeft = totalInitialTime;
  updateTimerDisplay();
  updateTimerProgressRing();
  const btn = document.getElementById('timer-toggle-btn');
  if (btn) btn.innerText = 'Start';
}

function updateTimerDisplay() {
  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  const display = document.getElementById('timer-display');
  if (display) {
    if (hrs > 0) {
      display.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }
}

function updateTimerProgressRing() {
  const circle = document.getElementById('timer-progress-bar');
  if (!circle) return;
  const circumference = 880; // matches updated pathLength
  const progress = timeLeft / totalInitialTime;
  const offset = circumference - (progress * circumference);
  circle.style.strokeDashoffset = offset;
}
// --- Robust Task Manager Logic with 2-Second Strike Animation ---
function loadTasks() {
  const taskList = document.getElementById('task-list');
  if (!taskList) return;
  taskList.innerHTML = '';
  
  const savedTasks = JSON.parse(localStorage.getItem('SOLARIS_TASKS') || '[]');
  savedTasks.forEach((taskText, index) => {
    renderTaskElement(taskText, index);
  });
}

function addTask() {
  const input = document.getElementById('task-input');
  if (!input) return;
  const taskText = input.value.trim();
  if (!taskText) return;

  const savedTasks = JSON.parse(localStorage.getItem('SOLARIS_TASKS') || '[]');
  savedTasks.push(taskText);
  localStorage.setItem('SOLARIS_TASKS', JSON.stringify(savedTasks));

  input.value = '';
  loadTasks();
}

function completeTask(buttonElement, index) {
  const taskItem = buttonElement.closest('.task-item');
  if (!taskItem) return;

  // Add strike-through effect and fade class
  taskItem.classList.add('completed');
  buttonElement.disabled = true;
  buttonElement.innerText = '✓ Done';

  // Wait 2 seconds, then remove from storage and DOM with fade out
  setTimeout(() => {
    taskItem.style.opacity = '0';
    taskItem.style.transform = 'scale(0.95)';
    setTimeout(() => {
      let savedTasks = JSON.parse(localStorage.getItem('SOLARIS_TASKS') || '[]');
      savedTasks.splice(index, 1);
      localStorage.setItem('SOLARIS_TASKS', JSON.stringify(savedTasks));
      loadTasks();
    }, 300); // match fade transition
  }, 2000); // 2 seconds delay
}

function renderTaskElement(taskText, index) {
  const taskList = document.getElementById('task-list');
  if (!taskList) return;

  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';
  taskItem.innerHTML = `
    <span class="task-text">${taskText}</span>
    <button class="glass-btn-sm" onclick="completeTask(this, ${index})">Done</button>
  `;
  taskList.appendChild(taskItem);
}




// =======================================================
// SOLARIS OS Window & Starfighter Vanguard Arcade Engine
// =======================================================

function openArcadeWindow() {
  const windowEl = document.getElementById('arcade-window');
  if (!windowEl) return;
  windowEl.style.display = 'flex';
  setTimeout(() => {
    windowEl.classList.add('active');
  }, 10);
}

function closeArcadeWindow() {
  const windowEl = document.getElementById('arcade-window');
  if (!windowEl) return;
  
  windowEl.classList.remove('active');
  
  spaceGameActive = false;
  if (spaceGameInterval) clearInterval(spaceGameInterval);
  spaceGameInterval = null;

  window.removeEventListener('keydown', handleSpaceInput);
  window.removeEventListener('keyup', handleSpaceInput);

  setTimeout(() => {
    windowEl.style.display = 'none';
    const overlay = document.getElementById('arcade-overlay');
    if (overlay) overlay.style.display = 'flex';
  }, 250);
}

// --- 2D Starfighter Vanguard Engine ---
let spaceGameInterval = null;
let spaceGameActive = false;
let playerShip, lasers, enemies, stars, particleFX, gameScoreVal, waveLevel;
let keysPressed = {};

function startSpaceGame() {
  const canvas = document.getElementById('arcade-canvas');
  const overlay = document.getElementById('arcade-overlay');
  
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  spaceGameActive = false;
  if (spaceGameInterval) clearInterval(spaceGameInterval);
  spaceGameInterval = null;
  
  gameScoreVal = 0;
  waveLevel = 1;

  playerShip = {
    x: canvas.width / 2 - 22,
    y: canvas.height - 65,
    width: 44,
    height: 32,
    speed: 6.5
  };

  lasers = [];
  enemies = [];
  stars = [];
  particleFX = [];

  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 2 + 0.5
    });
  }

  window.addEventListener('keydown', handleSpaceInput);
  window.addEventListener('keyup', handleSpaceInput);

  overlay.style.display = 'none';
  spaceGameActive = true;

  spaceGameInterval = setInterval(() => {
    updateGameLogic(ctx, canvas);
    renderGame(ctx, canvas);
  }, 1000 / 60);
}

function handleSpaceInput(e) {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD'].includes(e.code)) {
    if (e.type === 'keydown') {
        keysPressed[e.code] = true;
        if (e.code === 'Space' && spaceGameActive) {
            shootLaser();
        }
    } else {
        keysPressed[e.code] = false;
    }
    e.preventDefault();
  }
}

function shootLaser() {
    lasers.push({
        x: playerShip.x + playerShip.width / 2 - 3,
        y: playerShip.y - 4,
        width: 6,
        height: 16,
        speed: 14
    });
}

function updateGameLogic(ctx, canvas) {
  if (!spaceGameActive) return;

  if ((keysPressed['ArrowLeft'] || keysPressed['KeyA']) && playerShip.x > 10) {
    playerShip.x -= playerShip.speed;
  }
  if ((keysPressed['ArrowRight'] || keysPressed['KeyD']) && playerShip.x < canvas.width - playerShip.width - 10) {
    playerShip.x += playerShip.speed;
  }

  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].y -= lasers[i].speed;
    if (lasers[i].y < -20) lasers.splice(i, 1);
  }

  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) star.y = -5;
  });

  // Update particles
  for (let i = particleFX.length - 1; i >= 0; i--) {
    let p = particleFX[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particleFX.splice(i, 1);
  }

  spawnEnemies(canvas);
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].y += enemies[i].speed;
    
    // Player collision check
    if (
      playerShip.x < enemies[i].x + enemies[i].width &&
      playerShip.x + playerShip.width > enemies[i].x &&
      playerShip.y < enemies[i].y + enemies[i].height &&
      playerShip.y + playerShip.height > enemies[i].y
    ) {
      endSpaceGame(canvas);
      return;
    }

    // Laser collision check
    let enemyDestroyed = false;
    for (let j = lasers.length - 1; j >= 0; j--) {
      if (
        lasers[j].x < enemies[i].x + enemies[i].width &&
        lasers[j].x + lasers[j].width > enemies[i].x &&
        lasers[j].y < enemies[i].y + enemies[i].height &&
        lasers[j].y + lasers[j].height > enemies[i].y
      ) {
        // Spawn particle explosion
        for (let k = 0; k < 12; k++) {
          particleFX.push({
            x: enemies[i].x + enemies[i].width / 2,
            y: enemies[i].y + enemies[i].height / 2,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 25,
            color: Math.random() > 0.5 ? '#38bdf8' : '#f43f5e'
          });
        }

        enemies.splice(i, 1);
        lasers.splice(j, 1);
        gameScoreVal += 150 * waveLevel;
        enemyDestroyed = true;

        if (gameScoreVal >= (waveLevel * waveLevel * 2500)) {
          waveLevel++;
        }
        break;
      }
    }

    if (!enemyDestroyed && enemies[i] && enemies[i].y > canvas.height + 30) {
      enemies.splice(i, 1);
    }
  }
}

function renderGame(ctx, canvas) {
  // Deep space background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#030308');
  bgGrad.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  stars.forEach(star => {
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });

  // Draw Particles
  particleFX.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });

  // Draw High-Tech 2D Starfighter Ship
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(playerShip.x + playerShip.width / 2, playerShip.y);
  ctx.lineTo(playerShip.x, playerShip.y + playerShip.height);
  ctx.lineTo(playerShip.x + playerShip.width / 2, playerShip.y + playerShip.height - 8);
  ctx.lineTo(playerShip.x + playerShip.width, playerShip.y + playerShip.height);
  ctx.closePath();
  ctx.fill();

  // Ship glow core
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(playerShip.x + playerShip.width / 2 - 2, playerShip.y + 12, 4, 12);

  // Engine exhaust thruster flame
  ctx.fillStyle = '#f97316';
  ctx.fillRect(playerShip.x + playerShip.width / 2 - 4, playerShip.y + playerShip.height, 8, 10 + Math.random() * 6);

  // Draw Lasers (Glowing neon yellow)
  ctx.fillStyle = '#facc15';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#facc15';
  lasers.forEach(laser => {
    ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
  });
  ctx.shadowBlur = 0; // reset shadow

  // Draw Enemy Vanguard Craft
  enemies.forEach(enemy => {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
    ctx.lineTo(enemy.x, enemy.y);
    ctx.lineTo(enemy.x + enemy.width, enemy.y);
    ctx.closePath();
    ctx.fill();
    // Core engine light
    ctx.fillStyle = '#facc15';
    ctx.fillRect(enemy.x + enemy.width / 2 - 3, enemy.y + 4, 6, 6);
  });

  // HUD Overlay info
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = '600 13px sans-serif';
  ctx.fillText(`SCORE: ${gameScoreVal}`, 20, 30);
  ctx.fillText(`WAVE: ${waveLevel}`, canvas.width - 90, 30);
}

function spawnEnemies(canvas) {
  const maxEnemies = 4 + waveLevel * 2;
  if (Math.random() < (0.025 + waveLevel * 0.005) && enemies.length < maxEnemies) {
    const size = 36;
    enemies.push({
      x: Math.random() * (canvas.width - size - 20) + 10,
      y: -size,
      width: size,
      height: size * 0.8,
      speed: 1.6 + Math.random() * 1.4 + (waveLevel * 0.25)
    });
  }
}

function endSpaceGame(canvas) {
  spaceGameActive = false;
  clearInterval(spaceGameInterval);
  window.removeEventListener('keydown', handleSpaceInput);
  window.removeEventListener('keyup', handleSpaceInput);

  const overlay = document.getElementById('arcade-overlay');
  const desc = document.getElementById('arcade-overlay-desc');
  const playBtn = document.getElementById('arcade-play-btn');

  if (overlay && desc && playBtn) {
    desc.innerText = `MISSION FAILED! (SCORE: ${gameScoreVal} | WAVES SURVIVED: ${waveLevel})`;
    playBtn.innerText = "PLAY AGAIN 🔄";
    overlay.style.display = 'flex';
  }
}