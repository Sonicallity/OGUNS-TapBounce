const playArea = document.getElementById('playArea');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const scoreDisplay = document.getElementById('scoreDisplay');
const bestScoreDisplay = document.getElementById('bestScoreDisplay');
const streakDisplay = document.getElementById('streakDisplay');
const scoresList = document.getElementById('scoresList');
const scoreForm = document.getElementById('scoreForm');
const playerName = document.getElementById('playerName');
const message = document.getElementById('message');
const soundToggle = document.getElementById('soundToggle');
const particleContainer = document.getElementById('particleContainer');
const scorePopups = document.getElementById('scorePopups');
const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

let soundEnabled = localStorage.getItem('whirlybirdSound') !== 'false';

const gameConfig = {
  width: 380,
  height: 600,
  birdSize: 40,
  obstacleWidth: 70,
  obstacleGap: 150,
  gravity: 0.8,
  jumpVelocity: -11,
  obstacleSpeed: 4,
  spawnInterval: 90,
  maxSpeed: 7.2,
  speedIncrease: 0.02,
};

let birdY = 240;
let velocity = 0;
let score = 0;
let bestScore = Number(localStorage.getItem('whirlybirdBest') || 0);
let currentStreak = Number(localStorage.getItem('whirlybirdStreak') || 0);
let obstacles = [];
let running = false;
let frame = 0;
let gameTimer = null;
let birdElement = null;
let lastScored = false;

// ============ CANVAS BACKGROUND ANIMATION ============
function setupCanvas() {
  canvas.width = playArea.offsetWidth;
  canvas.height = playArea.offsetHeight;
  animateBackground();
}

function animateBackground() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  for (let i = 0; i < 5; i++) {
    const x = (frame * 2 + i * 60) % canvas.width;
    const y = (canvas.height / 5) * (i + 1);
    ctx.fillStyle = `rgba(0, 217, 255, ${0.3 + Math.sin(frame / 20 + i) * 0.2})`;
    ctx.fillRect(x, y, 2, 2);
  }
  
  if (running) requestAnimationFrame(animateBackground);
}

// ============ PARTICLE EFFECTS ============
function createParticles(x, y, count = 15, color = '#ff006e') {
  const angle = Math.PI * 2 / count;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = '6px';
    particle.style.height = '6px';
    particle.style.background = color;
    particle.style.boxShadow = `0 0 10px ${color}`;
    
    const velocityX = Math.cos(angle * i) * (2 + Math.random() * 4);
    const velocityY = Math.sin(angle * i) * (2 + Math.random() * 4);
    
    particleContainer.appendChild(particle);
    
    let lifetime = 0;
    const maxLifetime = 40;
    const particleInterval = setInterval(() => {
      lifetime++;
      const x = parseFloat(particle.style.left);
      const y = parseFloat(particle.style.top);
      
      particle.style.left = `${x + velocityX}px`;
      particle.style.top = `${y + velocityY}px`;
      particle.style.opacity = 1 - (lifetime / maxLifetime);
      
      if (lifetime >= maxLifetime) {
        clearInterval(particleInterval);
        particleContainer.removeChild(particle);
      }
    }, 16);
  }
}

// ============ SCORE POPUP ============
function createScorePopup(x, y) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = '+1';
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.color = '#ffbe0b';
  popup.style.fontSize = '1.8rem';
  
  scorePopups.appendChild(popup);
  
  setTimeout(() => {
    if (popup.parentNode) scorePopups.removeChild(popup);
  }, 1000);
}

// ============ SCREEN SHAKE ============
function shakeScreen(intensity = 10, duration = 150) {
  const originalStyle = playArea.style.transform;
  let shakes = 0;
  const maxShakes = Math.ceil(duration / 30);
  
  const shake = () => {
    if (shakes < maxShakes) {
      const offsetX = (Math.random() - 0.5) * intensity;
      const offsetY = (Math.random() - 0.5) * intensity;
      playArea.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      shakes++;
      setTimeout(shake, 30);
    } else {
      playArea.style.transform = originalStyle;
    }
  };
  
  shake();
}

// ============ BIRD & GAME SETUP ============
function buildBird() {
  const bird = document.createElement('div');
  bird.className = 'bird';
  bird.style.top = `${birdY}px`;
  playArea.appendChild(bird);
  return bird;
}

function showOverlay(title, text, buttonLabel, icon = '🚀') {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  retryButton.textContent = buttonLabel;
  overlay.querySelector('.overlay-icon').textContent = icon;
  overlay.classList.add('visible');
}

function hideOverlay() {
  overlay.classList.remove('visible');
}

function resetGame() {
  birdY = gameConfig.height / 2 - gameConfig.birdSize / 2;
  velocity = 0;
  score = 0;
  obstacles = [];
  frame = 0;
  lastScored = false;
  
  const gameContent = document.querySelector('.play-area > *:not(canvas):not(.particle-container):not(.score-popups):not(.overlay)');
  if (gameContent) gameContent.remove();
  
  birdElement = buildBird();
  renderScore();
  setMessage('🎮 Stay alive and fly through the gaps!');
  setupCanvas();
}

function startGame() {
  if (running) return;
  running = true;
  hideOverlay();
  resetGame();
  setupCanvas();
  gameTimer = setInterval(updateFrame, 30);
  playSound('start');
}

function endGame() {
  running = false;
  clearInterval(gameTimer);
  
  const newBest = bestScore < score;
  if (newBest) {
    bestScore = score;
    localStorage.setItem('whirlybirdBest', bestScore);
    currentStreak = Math.max(currentStreak, score);
  } else {
    currentStreak = 0;
  }
  localStorage.setItem('whirlybirdStreak', currentStreak);
  
  bestScoreDisplay.textContent = bestScore;
  streakDisplay.textContent = currentStreak;
  
  playSound('gameOver');
  shakeScreen(15, 300);
  createParticles(100, birdY, 20, '#ff006e');
  
  const gameOverMessage = newBest ? `🔥 NEW RECORD! ${score} points!` : `Game over! You scored ${score} points.`;
  const icon = newBest ? '🏆' : '💥';
  
  setMessage(gameOverMessage);
  showOverlay('GAME OVER', gameOverMessage, newBest ? '🔥 TRY AGAIN 🔥' : 'RETRY', icon);
}

function setMessage(text) {
  message.textContent = text;
  message.classList.remove('success', 'error');
}

function renderScore() {
  scoreDisplay.textContent = score;
  bestScoreDisplay.textContent = bestScore;
  streakDisplay.textContent = currentStreak;
}

function addObstacle() {
  const topHeight = 80 + Math.random() * (gameConfig.height - gameConfig.obstacleGap - 180);
  const obstacle = {
    x: gameConfig.width,
    topHeight,
    bottomY: topHeight + gameConfig.obstacleGap,
    passed: false,
  };
  obstacles.push(obstacle);
}

function updateFrame() {
  velocity += gameConfig.gravity;
  birdY = Math.min(gameConfig.height - gameConfig.birdSize, Math.max(0, birdY + velocity));
  frame += 1;

  const speed = Math.min(gameConfig.maxSpeed, gameConfig.obstacleSpeed + score * gameConfig.speedIncrease);

  if (frame % gameConfig.spawnInterval === 0) {
    addObstacle();
  }

  obstacles = obstacles
    .map((obs) => ({ ...obs, x: obs.x - speed }))
    .filter((obs) => obs.x + gameConfig.obstacleWidth > 0);

  obstacles.forEach((obs) => {
    if (!obs.passed && obs.x + gameConfig.obstacleWidth < 100) {
      obs.passed = true;
      score += 1;
      lastScored = true;
      createScorePopup(80, birdY);
      createParticles(100, birdY, 8, '#ffbe0b');
      playSound('score');
      renderScore();
    }
  });

  if (birdY <= 0 || birdY + gameConfig.birdSize >= gameConfig.height) {
    endGame();
    return;
  }

  for (const obs of obstacles) {
    const birdLeft = 100;
    const birdRight = birdLeft + gameConfig.birdSize;
    const birdTop = birdY;
    const birdBottom = birdY + gameConfig.birdSize;
    const obsLeft = obs.x;
    const obsRight = obs.x + gameConfig.obstacleWidth;

    if (birdRight > obsLeft && birdLeft < obsRight) {
      if (birdTop < obs.topHeight || birdBottom > obs.bottomY) {
        obs.hit = true;
        endGame();
        return;
      }
    }
  }

  drawFrame(speed);
}

function drawFrame(speed) {
  const existingObstacles = playArea.querySelectorAll('.obstacle');
  existingObstacles.forEach(el => el.remove());
  
  birdElement.style.top = `${birdY}px`;
  birdElement.style.transform = `rotate(${Math.min(30, Math.max(-45, velocity * 3))}deg)`;

  obstacles.forEach((obs) => {
    const topBlock = document.createElement('div');
    topBlock.className = 'obstacle' + (obs.hit ? ' hit' : '');
    topBlock.style.left = `${obs.x}px`;
    topBlock.style.height = `${obs.topHeight}px`;

    const bottomBlock = document.createElement('div');
    bottomBlock.className = 'obstacle' + (obs.hit ? ' hit' : '');
    bottomBlock.style.left = `${obs.x}px`;
    bottomBlock.style.top = `${obs.bottomY}px`;
    bottomBlock.style.height = `${gameConfig.height - obs.bottomY}px`;

    playArea.insertBefore(topBlock, birdElement);
    playArea.insertBefore(bottomBlock, birdElement);
  });
}

function jump() {
  if (!running) {
    startGame();
    return;
  }
  velocity = gameConfig.jumpVelocity;
  birdElement.classList.add('jumping');
  createParticles(110, birdY + gameConfig.birdSize / 2, 10, '#00d9ff');
  playSound('jump');
  
  setTimeout(() => {
    if (birdElement) birdElement.classList.remove('jumping');
  }, 200);
}

// ============ SOUND EFFECTS ============
function playSound(type) {
  if (!soundEnabled) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    switch (type) {
      case 'jump':
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'score':
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1000, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'gameOver':
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'start':
        for (let i = 0; i < 3; i++) {
          const osc2 = audioContext.createOscillator();
          osc2.connect(gain);
          osc2.frequency.setValueAtTime(500 + i * 150, now + i * 0.1);
          osc2.start(now + i * 0.1);
          osc2.stop(now + i * 0.1 + 0.1);
        }
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        break;
    }
  } catch (e) {
    // Audio context not available
  }
}

// ============ LEADERBOARD ============
function loadScores() {
  fetch('api.php?action=scores')
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0) {
        scoresList.innerHTML = '<li style="text-align: center; color: rgba(255,255,255,0.5);">No scores yet. Be the first!</li>';
        return;
      }
      scoresList.innerHTML = data
        .map((entry, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•';
          return `<li><strong>${medal} ${escapeHtml(entry.name)}</strong> <span>${entry.score}</span></li>`;
        })
        .join('');
    })
    .catch(() => {
      scoresList.innerHTML = '<li style="color: #ff006e;">Unable to load leaderboard.</li>';
    });
}

function submitScore(name, scoreValue) {
  fetch('api.php?action=scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score: scoreValue }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        setMessage('❌ ' + data.error);
        message.classList.add('error');
        return;
      }
      message.classList.add('success');
      setMessage('✅ Score saved! Amazing!');
      playerName.value = '';
      loadScores();
    })
    .catch(() => {
      setMessage('❌ Could not save score right now.');
      message.classList.add('error');
    });
}

function escapeHtml(text) {
  const element = document.createElement('div');
  element.textContent = text;
  return element.innerHTML;
}

// ============ EVENT LISTENERS ============
playArea.addEventListener('click', jump);
startButton.addEventListener('click', startGame);
retryButton.addEventListener('click', startGame);

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem('whirlybirdSound', soundEnabled);
  soundToggle.style.opacity = soundEnabled ? '1' : '0.5';
  soundToggle.textContent = soundEnabled ? '🔊 SOUND' : '🔇 MUTE';
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    jump();
  }
  if (event.code === 'Enter' && !running) {
    startGame();
  }
});

scoreForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = playerName.value.trim();
  if (!name) {
    message.classList.add('error');
    setMessage('📝 Enter your name before saving a score.');
    return;
  }
  if (score === 0) {
    message.classList.add('error');
    setMessage('🎮 Play a game first before submitting a score.');
    return;
  }
  submitScore(name, score);
});

// ============ INITIALIZATION ============
showOverlay('READY TO FLY?', 'Click, tap, or press Space to start your journey', 'LET\'S GO!', '🚀');
renderScore();
loadScores();

soundToggle.textContent = soundEnabled ? '🔊 SOUND' : '🔇 MUTE';
soundToggle.style.opacity = soundEnabled ? '1' : '0.5';

window.addEventListener('resize', setupCanvas);
