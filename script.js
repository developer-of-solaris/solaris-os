// --- SOLARIS OS Main Engine ---

let GEMINI_API_KEY = '';

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
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

// --- Focus Timer Logic ---
let timerInterval = null;
let timeLeft = 25 * 60;
let isTimerRunning = false;

function toggleTimer() {
  const btn = document.getElementById('timer-toggle-btn');
  if (!isTimerRunning) {
    isTimerRunning = true;
    if (btn) btn.innerText = 'Pause';
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
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
  timeLeft = 25 * 60;
  updateTimerDisplay();
  const btn = document.getElementById('timer-toggle-btn');
  if (btn) btn.innerText = 'Start';
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = document.getElementById('timer-display');
  if (display) {
    display.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// --- Task Manager Logic ---
function addTask() {
  const input = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  if (!input || !taskList) return;
  const taskText = input.value.trim();

  if (!taskText) return;

  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';
  taskItem.innerHTML = `
    <span>${taskText}</span>
    <button class="glass-btn-sm" onclick="this.parentElement.remove()">Done</button>
  `;
  
  taskList.appendChild(taskItem);
  input.value = '';
}

// --- Mini-Game Logic (Speed Clicker) ---
let gameScore = 0;
let gameTimeLeft = 10;
let gameInterval = null;
let isGameActive = false;

function startGame() {
  const targetBtn = document.getElementById('game-target-btn');
  const startBtn = document.getElementById('game-start-btn');
  
  gameScore = 0;
  gameTimeLeft = 10;
  isGameActive = true;
  
  document.getElementById('game-score').innerText = gameScore;
  document.getElementById('game-time').innerText = gameTimeLeft + 's';

  startBtn.style.display = 'none';
  targetBtn.style.display = 'block';

  gameInterval = setInterval(() => {
    gameTimeLeft--;
    document.getElementById('game-time').innerText = gameTimeLeft + 's';

    if (gameTimeLeft <= 0) {
      clearInterval(gameInterval);
      isGameActive = false;
      targetBtn.style.display = 'none';
      startBtn.style.display = 'block';
      startBtn.innerText = 'Play Again';
      alert(`Game Over! Your final score is ${gameScore} clicks! 🎉`);
    }
  }, 1000);
}

function clickTarget() {
  if (!isGameActive) return;
  gameScore++;
  document.getElementById('game-score').innerText = gameScore;
}