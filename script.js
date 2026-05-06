const playArea = document.getElementById('playArea');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const scoreDisplay = document.getElementById('scoreDisplay');
const bestScoreDisplay = document.getElementById('bestScoreDisplay');
const currentLevelDisplay = document.getElementById('currentLevelDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const levelProgressFill = document.getElementById('levelProgressFill');
const levelNumber = document.getElementById('levelNumber');
const coinsDisplay = document.getElementById('coinsDisplay');
const healthFill = document.getElementById('healthFill');
const scoresList = document.getElementById('scoresList');
const scoreForm = document.getElementById('scoreForm');
const playerName = document.getElementById('playerName');
const message = document.getElementById('message');
const soundToggle = document.getElementById('soundToggle');
const settingsButton = document.getElementById('settingsButton');
const particleContainer = document.getElementById('particleContainer');
const scorePopups = document.getElementById('scorePopups');
const powerupContainer = document.getElementById('powerupContainer');
const achievementsList = document.getElementById('achievementsList');
const canvas = document.getElementById('backgroundCanvas');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameCtx = gameCanvas.getContext('2d');

let soundEnabled = localStorage.getItem('nexusFlightSound') !== 'false';
let musicEnabled = localStorage.getItem('nexusFlightMusic') !== 'false';

const gameConfig = {
  width: 380,
  height: 600,
  birdSize: 35,
  obstacleWidth: 60,
  obstacleGap: 140,
  gravity: 0.7,
  jumpVelocity: -12,
  baseObstacleSpeed: 3.5,
  spawnInterval: 85,
  maxSpeed: 8.0,
  speedIncrease: 0.015,
  levels: 50,
  coinsPerLevel: 5,
  powerupSpawnRate: 0.15,
  magnetRange: 80,
  shieldDuration: 300, // frames
  speedBoostDuration: 240,
  magnetDuration: 360,
};

const difficultyConfig = {
  levels: [
    ...Array.from({ length: 10 }, (_, i) => ({
      level: i + 1,
      speed: 2,
      gapSize: 180,
      spawnRate: 120,
      obstacles: ['static'],
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      level: i + 11,
      speed: 2.5,
      gapSize: 150,
      spawnRate: 110,
      obstacles: ['static', 'vertical_moving'],
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      level: i + 21,
      speed: 3,
      gapSize: 130,
      spawnRate: 100,
      obstacles: ['static', 'vertical_moving', 'rotating', 'closing_gap'],
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      level: i + 31,
      speed: 3.5,
      gapSize: 110,
      spawnRate: 90,
      obstacles: ['multi_gap', 'enemy', 'rotating'],
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      level: i + 41,
      speed: 4,
      gapSize: 90,
      spawnRate: 80,
      obstacles: ['multi_gap', 'enemy', 'wind', 'speed_zone', 'rotating'],
    })),
  ],
};

function getDifficulty(level) {
  return difficultyConfig.levels[Math.min(Math.max(level, 1), difficultyConfig.levels.length) - 1];
}

function getDifficultyScoreValue(type) {
  switch (type) {
    case 'rotating':
      return 20;
    case 'multi_gap':
      return 25;
    case 'enemy':
      return 18;
    default:
      return 10;
  }
}

function rectangleOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function getObstacleHitboxes(obs) {
  const hitboxes = [];

  if (obs.type === 'static' || obs.type === 'vertical_moving' || obs.type === 'closing_gap') {
    hitboxes.push({ left: obs.x, right: obs.x + obs.width, top: 0, bottom: obs.gapY });
    hitboxes.push({ left: obs.x, right: obs.x + obs.width, top: obs.gapY + obs.gapSize, bottom: gameConfig.height });
  } else if (obs.type === 'multi_gap') {
    hitboxes.push({ left: obs.x, right: obs.x + obs.width, top: 0, bottom: obs.gapY1 });
    hitboxes.push({ left: obs.x, right: obs.x + obs.width, top: obs.gapY1 + obs.gapSize, bottom: obs.gapY2 });
    hitboxes.push({ left: obs.x, right: obs.x + obs.width, top: obs.gapY2 + obs.gapSize, bottom: gameConfig.height });
  } else if (obs.type === 'rotating') {
    const halfWidth = obs.width / 2;
    const halfHeight = obs.height / 2;
    hitboxes.push({
      left: obs.x - halfWidth,
      right: obs.x + obs.width + halfWidth,
      top: obs.centerY - halfHeight,
      bottom: obs.centerY + halfHeight,
    });
  } else if (obs.type === 'enemy') {
    hitboxes.push({ left: obs.x, right: obs.x + obs.width, top: obs.y, bottom: obs.y + obs.height });
  }

  return hitboxes;
}

let birdY = 240;
let velocity = 0;
let score = 0;
let bestScore = Number(localStorage.getItem('nexusFlightBest') || 0);
let currentLevel = 1;
let lives = 3;
let coins = 0;
let totalCoins = Number(localStorage.getItem('nexusFlightCoins') || 0);
let health = 100;
let obstacles = [];
let powerups = [];
let coinsList = [];
let frame = 0;
let running = false;
let gameTimer = null;
let birdElement = null;
let lastScored = false;

// Power-up states
let activePowerups = {
  shield: { active: false, timer: 0 },
  speedBoost: { active: false, timer: 0 },
  magnet: { active: false, timer: 0 }
};

// Achievements
let achievements = JSON.parse(localStorage.getItem('nexusFlightAchievements') || '{}');
const achievementDefinitions = {
  first_flight: { name: 'First Launch', desc: 'Complete your first mission', icon: '??', unlocked: false },
  coin_collector: { name: 'Coin Collector', desc: 'Collect 100 coins', icon: '??', unlocked: false },
  speed_demon: { name: 'Speed Demon', desc: 'Reach max speed', icon: '?', unlocked: false },
  survivor: { name: 'Survivor', desc: 'Complete 5 levels', icon: '???', unlocked: false },
  high_flyer: { name: 'High Flyer', desc: 'Score 5000+ points', icon: '??', unlocked: false },
  power_master: { name: 'Power Master', desc: 'Use all power-ups', icon: '??', unlocked: false },
  perfect_run: { name: 'Perfect Run', desc: 'Complete a level without taking damage', icon: '?', unlocked: false },
  cosmic_explorer: { name: 'Cosmic Explorer', desc: 'Reach level 10', icon: '??', unlocked: false }
};

// ============ CANVAS BACKGROUND ANIMATION ============
function setupCanvas() {
  canvas.width = playArea.offsetWidth || 380;
  canvas.height = playArea.offsetHeight || 600;
  gameCanvas.width = playArea.offsetWidth || 380;
  gameCanvas.height = playArea.offsetHeight || 600;
  // animateBackground(); // Disabled to prevent startup crash
}

function animateBackground() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw stars
  for (let i = 0; i < 8; i++) {
    const x = (frame * (1 + i * 0.5) + i * 80) % canvas.width;
    const y = (canvas.height / 8) * (i + 1);
    const size = 1 + Math.sin(frame / 30 + i) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(frame / 20 + i) * 0.3})`;
    ctx.fillRect(x, y, size, size);
  }
  
  // Draw nebula effect
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width / 2
  );
  gradient.addColorStop(0, `rgba(255, 0, 110, ${0.02 + Math.sin(frame / 50) * 0.01})`);
  gradient.addColorStop(0.5, `rgba(0, 217, 255, ${0.02 + Math.cos(frame / 50) * 0.01})`);
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (running) requestAnimationFrame(animateBackground);
  else window.backgroundAnimating = false;
}

// ============ PARTICLE EFFECTS ============
function createParticles(x, y, count = 15, color = '#ff006e', size = 6) {
  const angle = Math.PI * 2 / count;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = color;
    particle.style.boxShadow = `0 0 10px ${color}`;
    
    const velocityX = Math.cos(angle * i) * (2 + Math.random() * 4);
    const velocityY = Math.sin(angle * i) * (2 + Math.random() * 4);
    
    particleContainer.appendChild(particle);
    
    let lifetime = 0;
    const maxLifetime = 35;
    const particleInterval = setInterval(() => {
      lifetime++;
      const currentX = parseFloat(particle.style.left);
      const currentY = parseFloat(particle.style.top);
      
      particle.style.left = `${currentX + velocityX}px`;
      particle.style.top = `${currentY + velocityY}px`;
      particle.style.opacity = 1 - (lifetime / maxLifetime);
      
      if (lifetime >= maxLifetime) {
        clearInterval(particleInterval);
        if (particle.parentNode) particleContainer.removeChild(particle);
      }
    }, 16);
  }
}

// ============ SCORE POPUP ============
function createScorePopup(x, y, text = '+1', color = '#ffbe0b') {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = text;
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.color = color;
  popup.style.fontSize = '1.5rem';
  
  scorePopups.appendChild(popup);
  
  setTimeout(() => {
    if (popup.parentNode) scorePopups.removeChild(popup);
  }, 1200);
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

// ============ POWER-UP SYSTEM ============
function createPowerup(x, y, type) {
  const cssType = type === 'speedBoost' ? 'speed-boost' : type;
  const powerup = document.createElement('div');
  powerup.className = `powerup-item ${cssType}`;
  powerup.style.left = `${x}px`;
  powerup.style.top = `${y}px`;
  powerup.dataset.type = type;
  
  powerupContainer.appendChild(powerup);
  powerups.push({
    element: powerup,
    x: x,
    y: y,
    type: type,
    collected: false
  });
}

function activatePowerup(type) {
  const powerup = activePowerups[type];
  if (!powerup) return;
  
  powerup.active = true;
  powerup.timer = gameConfig[`${type}Duration`];
  
  // Update UI
  const slot = document.getElementById(`${type}Slot`);
  if (slot) {
    slot.classList.add('active');
    updatePowerupTimer(type);
  }
  
  // Visual effects
  createParticles(100, birdY, 20, type === 'speedBoost' ? '#ffbe0b' : type === 'shield' ? '#00d9ff' : '#ff006e');
  playSound('powerup');
  
  // Check achievement
  checkAchievement('power_master');
}

function updatePowerupTimers() {
  Object.keys(activePowerups).forEach(type => {
    const powerup = activePowerups[type];
    if (powerup.active) {
      powerup.timer--;
      updatePowerupTimer(type);
      
      if (powerup.timer <= 0) {
        deactivatePowerup(type);
      }
    }
  });
}

function deactivatePowerup(type) {
  activePowerups[type].active = false;
  activePowerups[type].timer = 0;
  
  const slot = document.getElementById(`${type}Slot`);
  if (slot) {
    slot.classList.remove('active');
    const timer = slot.querySelector('.powerup-timer');
    if (timer) timer.textContent = '';
  }
}

function updatePowerupTimer(type) {
  const slot = document.getElementById(`${type}Slot`);
  if (slot) {
    const timer = slot.querySelector('.powerup-timer');
    if (timer && activePowerups[type].active) {
      timer.textContent = Math.ceil(activePowerups[type].timer / 30);
    }
  }
}

// ============ COIN SYSTEM ============
function createCoin(x, y) {
  const coin = document.createElement('div');
  coin.className = 'coin';
  coin.textContent = '??';
  coin.style.left = `${x}px`;
  coin.style.top = `${y}px`;
  
  playArea.appendChild(coin);
  coinsList.push({
    element: coin,
    x: x,
    y: y,
    collected: false
  });
}

function collectCoin(coin) {
  coin.collected = true;
  coins++;
  totalCoins++;
  localStorage.setItem('nexusFlightCoins', totalCoins);
  
  createScorePopup(coin.x + 12, coin.y, '+??', '#ffd700');
  createParticles(coin.x + 12, coin.y, 8, '#ffd700', 4);
  playSound('coin');
  
  coinsDisplay.textContent = coins;
  checkAchievement('coin_collector');
  
  if (coin.element.parentNode) {
    coin.element.parentNode.removeChild(coin.element);
  }
}

// ============ LEVEL SYSTEM ============
function getLevelProgress() {
  const levelScore = score % 1000;
  return (levelScore / 1000) * 100;
}

function checkLevelUp() {
  const newLevel = Math.min(gameConfig.levels, Math.floor(score / 1000) + 1);
  if (newLevel > currentLevel) {
    currentLevel = newLevel;
    levelNumber.textContent = currentLevel;
    currentLevelDisplay.textContent = currentLevel;
    
    // Level up effects
    createParticles(playArea.offsetWidth / 2, playArea.offsetHeight / 2, 30, '#ffbe0b');
    playSound('levelUp');
    
    // Restore health on level up
    health = 100;
    updateHealthBar();
    
    checkAchievement('cosmic_explorer');
    
    if (currentLevel >= 5) {
      checkAchievement('survivor');
    }
  }
}

function updateLevelProgress() {
  const progress = getLevelProgress();
  levelProgressFill.style.width = `${progress}%`;
}

// ============ BIRD & GAME SETUP ============
function buildBird() {
  const bird = document.createElement('div');
  bird.className = 'bird';
  bird.style.top = `${birdY}px`;
  playArea.appendChild(bird);
  return bird;
}

function showOverlay(title, text, buttonLabel, icon = '??') {
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
  currentLevel = 1;
  lives = 3;
  coins = 0;
  health = 100;
  obstacles = [];
  powerups = [];
  coinsList = [];
  frame = 0;
  lastScored = false;
  
  // Reset power-ups
  Object.keys(activePowerups).forEach(type => {
    activePowerups[type].active = false;
    activePowerups[type].timer = 0;
    deactivatePowerup(type);
  });
  
  // Clear game elements, including the previous ship
  const gameContent = playArea.querySelectorAll('.bird, .obstacle, .coin, .powerup-item');
  gameContent.forEach(el => el.remove());
  birdElement = null;

  // Clear lingering effects and old popups
  const oldParticles = particleContainer.querySelectorAll('.particle');
  oldParticles.forEach(el => el.remove());
  const oldPopups = scorePopups.querySelectorAll('.score-popup');
  oldPopups.forEach(el => el.remove());
  playArea.style.transform = '';
  
  birdElement = buildBird();
  renderScore();
  updateHealthBar();
  updateLevelProgress();
  setMessage('?? Navigate through cosmic hazards and collect power-ups!');
}

function startGame() {
  if (running) return;
  running = true;
  hideOverlay();
  resetGame();
  setupCanvas();
  
  // Prevent immediate jump from click event bubbling
  window.allowGameJump = false;
  setTimeout(() => {
    window.allowGameJump = true;
  }, 100);
  
  gameTimer = setInterval(updateFrame, 30);
  playSound('start');
}

function endGame() {
  running = false;
  clearInterval(gameTimer);
  
  const newBest = bestScore < score;
  if (newBest) {
    bestScore = score;
    localStorage.setItem('nexusFlightBest', bestScore);
  }
  
  // Save achievements
  localStorage.setItem('nexusFlightAchievements', JSON.stringify(achievements));
  
  bestScoreDisplay.textContent = bestScore;
  
  playSound('gameOver');
  shakeScreen(15, 300);
  createParticles(100, birdY, 25, '#ff006e');
  
  const gameOverMessage = newBest ? `?? NEW RECORD! ${score} points!` : `Mission failed! You scored ${score} points.`;
  const icon = newBest ? '??' : '??';
  
  setMessage(gameOverMessage);
  showOverlay('MISSION COMPLETE', gameOverMessage, 'RELAUNCH', icon);
}

function setMessage(text) {
  message.textContent = text;
  message.classList.remove('success', 'error');
}

function renderScore() {
  scoreDisplay.textContent = score;
  bestScoreDisplay.textContent = bestScore;
  currentLevelDisplay.textContent = currentLevel;
  livesDisplay.textContent = lives;
  coinsDisplay.textContent = coins;
}

function updateHealthBar() {
  healthFill.style.width = `${health}%`;
}

function addObstacle() {
  obstacles.push(spawnObstacle(getDifficulty(currentLevel)));
}

function spawnObstacle(config) {
  const type = config.obstacles[Math.floor(Math.random() * config.obstacles.length)];
  switch (type) {
    case 'vertical_moving':
      return createVerticalMovingObstacle(config);
    case 'rotating':
      return createRotatingObstacle(config);
    case 'closing_gap':
      return createClosingGapObstacle(config);
    case 'multi_gap':
      return createMultiGapObstacle(config);
    case 'enemy':
      return createEnemyObstacle(config);
    case 'wind':
      return createWindZoneObstacle(config);
    case 'speed_zone':
      return createSpeedZoneObstacle(config);
    default:
      return createStaticObstacle(config);
  }
}

function createStaticObstacle(config) {
  const gapY = 80 + Math.random() * (gameConfig.height - config.gapSize - 160);
  return {
    type: 'static',
    x: gameConfig.width,
    width: 70,
    speed: config.speed,
    gapY,
    gapSize: config.gapSize,
    passed: false,
  };
}

function createVerticalMovingObstacle(config) {
  const baseY = 80 + Math.random() * (gameConfig.height - config.gapSize - 160);
  return {
    type: 'vertical_moving',
    x: gameConfig.width,
    width: 70,
    speed: config.speed,
    baseY,
    gapY: baseY,
    gapSize: config.gapSize,
    amplitude: 35,
    phase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.035,
    passed: false,
  };
}

function createClosingGapObstacle(config) {
  const gapY = 80 + Math.random() * (gameConfig.height - config.gapSize - 160);
  return {
    type: 'closing_gap',
    x: gameConfig.width,
    width: 70,
    speed: config.speed,
    gapY,
    gapSize: config.gapSize,
    baseGapSize: config.gapSize,
    pulseSpeed: 0.045,
    pulseAmplitude: 30,
    phase: Math.random() * Math.PI * 2,
    passed: false,
  };
}

function createRotatingObstacle(config) {
  const centerY = 140 + Math.random() * (gameConfig.height - 280);
  return {
    type: 'rotating',
    x: gameConfig.width,
    width: 16,
    height: 140,
    speed: config.speed,
    centerY,
    angle: Math.random() * Math.PI * 0.5,
    angularSpeed: Math.random() < 0.5 ? 0.03 : -0.03,
    passed: false,
  };
}

function createMultiGapObstacle(config) {
  const gapY1 = 80 + Math.random() * 120;
  const gapY2 = gapY1 + config.gapSize + 60 + Math.random() * 40;
  return {
    type: 'multi_gap',
    x: gameConfig.width,
    width: 70,
    speed: config.speed,
    gapY1,
    gapY2,
    gapSize: config.gapSize,
    passed: false,
  };
}

function createEnemyObstacle(config) {
  const y = 80 + Math.random() * (gameConfig.height - 160);
  return {
    type: 'enemy',
    x: gameConfig.width,
    y,
    width: 36,
    height: 36,
    speed: config.speed * 1.1,
    baseY: y,
    amplitude: 40,
    phase: Math.random() * Math.PI * 2,
    passed: false,
  };
}

function createWindZoneObstacle(config) {
  const y = 80 + Math.random() * (gameConfig.height - 220);
  return {
    type: 'wind',
    x: gameConfig.width,
    width: 90,
    y,
    height: 120,
    speed: config.speed * 0.9,
    direction: Math.random() < 0.5 ? -1 : 1,
    force: 0.12,
  };
}

function createSpeedZoneObstacle(config) {
  const y = 100 + Math.random() * (gameConfig.height - 200);
  return {
    type: 'speed_zone',
    x: gameConfig.width,
    width: 90,
    y,
    height: 90,
    speed: config.speed,
    passed: false,
  };
}

function updateFrame() {
  velocity += gameConfig.gravity;
  birdY = Math.min(gameConfig.height - gameConfig.birdSize, Math.max(0, birdY + velocity));
  frame += 1;

  const difficulty = getDifficulty(currentLevel);
  const speed = difficulty.speed + (currentLevel - 1) * 0.02;
  
  // Update power-up timers
  updatePowerupTimers();
  
  // Apply speed boost
  let actualSpeed = activePowerups.speedBoost.active ? speed * 1.5 : speed;

  // Spawn obstacles on a controlled progression
  if (frame >= 30 && frame % difficulty.spawnRate === 0) {
    addObstacle();
  }

  // Spawn coins
  if (frame % 120 === 0 && Math.random() < 0.4) {
    const coinY = 50 + Math.random() * (gameConfig.height - 100);
    createCoin(gameConfig.width, coinY);
  }
  
  // Spawn power-ups
  if (frame % 300 === 0 && Math.random() < gameConfig.powerupSpawnRate) {
    const powerupY = 80 + Math.random() * (gameConfig.height - 160);
    const powerupTypes = ['speedBoost', 'shield', 'magnet'];
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    createPowerup(gameConfig.width, powerupY, randomType);
  }

  // Update obstacles and type-specific movement
  obstacles = obstacles
    .map((obs) => {
      obs.x -= actualSpeed;
      if (obs.type === 'vertical_moving') {
        obs.gapY = obs.baseY + Math.sin(frame * obs.pulseSpeed + obs.phase) * obs.amplitude;
      }
      if (obs.type === 'closing_gap') {
        obs.gapSize = Math.max(90, obs.baseGapSize + Math.sin(frame * obs.pulseSpeed + obs.phase) * obs.pulseAmplitude);
      }
      if (obs.type === 'rotating') {
        obs.angle += obs.angularSpeed;
      }
      if (obs.type === 'enemy') {
        obs.y = obs.baseY + Math.sin(frame * 0.06 + obs.phase) * obs.amplitude;
      }
      return obs;
    })
    .filter((obs) => obs.x + obs.width > -100);

  // Update coins
  coinsList = coinsList
    .map((coin) => ({ ...coin, x: coin.x - actualSpeed }))
    .filter((coin) => {
      if (coin.collected) {
        return false;
      }
      if (coin.x < -30) {
        if (coin.element.parentNode) coin.element.parentNode.removeChild(coin.element);
        return false;
      }
      return true;
    });

  // Update power-ups
  powerups = powerups
    .map((powerup) => ({ ...powerup, x: powerup.x - actualSpeed }))
    .filter((powerup) => {
      if (powerup.collected) {
        return false;
      }
      if (powerup.x < -30) {
        if (powerup.element.parentNode) powerup.element.parentNode.removeChild(powerup.element);
        return false;
      }
      return true;
    });

  // Check coin collection
  coinsList.forEach((coin) => {
    if (!coin || !coin.element) return;
    if (!coin.collected && Math.abs(coin.x - 100) < 40 && Math.abs(coin.y - birdY) < 40) {
      collectCoin(coin);
    } else if (activePowerups.magnet.active && !coin.collected) {
      const distance = Math.sqrt((coin.x - 100) ** 2 + (coin.y - birdY) ** 2);
      if (distance < gameConfig.magnetRange) {
        const angle = Math.atan2(birdY - coin.y, 100 - coin.x);
        coin.x += Math.cos(angle) * 3;
        coin.y += Math.sin(angle) * 3;
        if (coin.element && coin.element.parentNode) {
          coin.element.style.left = `${coin.x}px`;
          coin.element.style.top = `${coin.y}px`;
        }
      }
    }
  });

  // Check power-up collection
  powerups.forEach((powerup) => {
    if (!powerup || !powerup.element) return;
    if (!powerup.collected && Math.abs(powerup.x - 100) < 40 && Math.abs(powerup.y - birdY) < 40) {
      powerup.collected = true;
      activatePowerup(powerup.type);
      if (powerup.element.parentNode) powerup.element.parentNode.removeChild(powerup.element);
    }
  });

  const birdLeft = 100;
  const birdRight = birdLeft + gameConfig.birdSize;
  const birdTop = birdY;
  const birdBottom = birdY + gameConfig.birdSize;
  const birdRect = { left: birdLeft, right: birdRight, top: birdTop, bottom: birdBottom };

  obstacles.forEach((obs) => {
    if (!obs) return;

    if (obs.type === 'wind') {
      if (birdRight > obs.x && birdLeft < obs.x + obs.width && birdBottom > obs.y && birdTop < obs.y + obs.height) {
        velocity += obs.direction * obs.force;
        return;
      }
    }

    if (obs.type === 'speed_zone') {
      if (birdRight > obs.x && birdLeft < obs.x + obs.width && birdBottom > obs.y && birdTop < obs.y + obs.height) {
        actualSpeed += 1.1;
      }
    }

    const hitboxes = getObstacleHitboxes(obs);
    const collided = hitboxes.some((box) => rectangleOverlap(box, birdRect));
    if (collided) {
      if (activePowerups.shield.active) {
        createParticles(birdLeft + gameConfig.birdSize / 2, birdY + gameConfig.birdSize / 2, 15, '#00d9ff');
        playSound('shieldHit');
        health = Math.max(0, health - 15);
      } else {
        health -= 25;
        shakeScreen(8, 100);
        createParticles(birdLeft + gameConfig.birdSize / 2, birdY + gameConfig.birdSize / 2, 12, '#ff006e');
        playSound('hit');
      }
      updateHealthBar();
      if (health <= 0) {
        lives--;
        if (lives <= 0) {
          endGame();
          return;
        } else {
          health = 100;
          updateHealthBar();
          createParticles(birdLeft + gameConfig.birdSize / 2, birdY + gameConfig.birdSize / 2, 20, '#00d9ff');
          playSound('extraLife');
        }
      }
    }

    if (!obs.passed && obs.x + obs.width < birdLeft) {
      obs.passed = true;
      const scoreAmount = getDifficultyScoreValue(obs.type) * currentLevel;
      score += scoreAmount;
      createScorePopup(80, birdY, `+${scoreAmount}`, '#ffbe0b');
      createParticles(100, birdY, 8, '#ffbe0b');
      playSound('score');
      renderScore();
      checkLevelUp();
      updateLevelProgress();
    }
  });

  // Check boundaries
  if (birdY <= 0 || birdY + gameConfig.birdSize >= gameConfig.height) {
    health -= 15;
    updateHealthBar();
    shakeScreen(6, 80);
    createParticles(birdLeft + gameConfig.birdSize / 2, birdY + gameConfig.birdSize / 2, 10, '#ff006e');
    
    if (health <= 0) {
      lives--;
      if (lives <= 0) {
        endGame();
        return;
      } else {
        health = 100;
        updateHealthBar();
        velocity = 0;
        birdY = gameConfig.height / 2 - gameConfig.birdSize / 2;
      }
    } else {
      velocity = 0;
      birdY = Math.max(0, Math.min(gameConfig.height - gameConfig.birdSize, birdY));
    }
  }

  drawFrame(actualSpeed);
}

function drawFrame(speed) {
  if (!birdElement || !birdElement.parentNode) {
    console.warn('birdElement missing, skipping frame');
    return;
  }

  const existingObstacles = playArea.querySelectorAll('.obstacle');
  existingObstacles.forEach(el => el.remove());
  
  birdElement.style.top = `${birdY}px`;
  birdElement.style.transform = `rotate(${Math.min(30, Math.max(-45, velocity * 3))}deg)`;
  
  // Add glow effect when shielded
  if (activePowerups.shield.active) {
    birdElement.style.boxShadow = '0 0 25px rgba(0, 217, 255, 0.8), 0 0 50px rgba(0, 217, 255, 0.4)';
  } else {
    birdElement.style.boxShadow = '';
  }

  // Start background animation if not already running
  if (running && !window.backgroundAnimating) {
    window.backgroundAnimating = true;
    animateBackground();
  }

  obstacles.forEach((obs) => {
    if (!obs) return;

    if (obs.type === 'static' || obs.type === 'vertical_moving' || obs.type === 'closing_gap') {
      const topBlock = document.createElement('div');
      topBlock.className = 'obstacle';
      topBlock.style.left = `${obs.x}px`;
      topBlock.style.top = `0px`;
      topBlock.style.height = `${Math.max(0, obs.gapY)}px`;
      topBlock.style.width = `${obs.width}px`;
      playArea.insertBefore(topBlock, birdElement);

      const bottomBlock = document.createElement('div');
      bottomBlock.className = 'obstacle';
      bottomBlock.style.left = `${obs.x}px`;
      bottomBlock.style.top = `${Math.min(gameConfig.height, obs.gapY + obs.gapSize)}px`;
      bottomBlock.style.height = `${Math.max(0, gameConfig.height - (obs.gapY + obs.gapSize))}px`;
      bottomBlock.style.width = `${obs.width}px`;
      playArea.insertBefore(bottomBlock, birdElement);
    } else if (obs.type === 'multi_gap') {
      const firstBlock = document.createElement('div');
      firstBlock.className = 'obstacle';
      firstBlock.style.left = `${obs.x}px`;
      firstBlock.style.top = `0px`;
      firstBlock.style.height = `${Math.max(0, obs.gapY1)}px`;
      firstBlock.style.width = `${obs.width}px`;
      playArea.insertBefore(firstBlock, birdElement);

      const middleBlock = document.createElement('div');
      middleBlock.className = 'obstacle';
      middleBlock.style.left = `${obs.x}px`;
      middleBlock.style.top = `${obs.gapY1 + obs.gapSize}px`;
      middleBlock.style.height = `${Math.max(0, obs.gapY2 - (obs.gapY1 + obs.gapSize))}px`;
      middleBlock.style.width = `${obs.width}px`;
      playArea.insertBefore(middleBlock, birdElement);

      const bottomBlock = document.createElement('div');
      bottomBlock.className = 'obstacle';
      bottomBlock.style.left = `${obs.x}px`;
      bottomBlock.style.top = `${obs.gapY2 + obs.gapSize}px`;
      bottomBlock.style.height = `${Math.max(0, gameConfig.height - (obs.gapY2 + obs.gapSize))}px`;
      bottomBlock.style.width = `${obs.width}px`;
      playArea.insertBefore(bottomBlock, birdElement);
    } else if (obs.type === 'rotating') {
      const bar = document.createElement('div');
      bar.className = 'obstacle rotating';
      bar.style.left = `${obs.x}px`;
      bar.style.top = `${obs.centerY - obs.height / 2}px`;
      bar.style.width = `${obs.width}px`;
      bar.style.height = `${obs.height}px`;
      bar.style.transform = `rotate(${obs.angle}rad)`;
      bar.style.transformOrigin = 'center center';
      playArea.insertBefore(bar, birdElement);
    } else if (obs.type === 'enemy') {
      const enemy = document.createElement('div');
      enemy.className = 'obstacle enemy';
      enemy.style.left = `${obs.x}px`;
      enemy.style.top = `${obs.y}px`;
      enemy.style.width = `${obs.width}px`;
      enemy.style.height = `${obs.height}px`;
      playArea.insertBefore(enemy, birdElement);
    } else if (obs.type === 'wind') {
      const zone = document.createElement('div');
      zone.className = 'obstacle wind-zone';
      zone.style.left = `${obs.x}px`;
      zone.style.top = `${obs.y}px`;
      zone.style.width = `${obs.width}px`;
      zone.style.height = `${obs.height}px`;
      playArea.insertBefore(zone, birdElement);
    } else if (obs.type === 'speed_zone') {
      const zone = document.createElement('div');
      zone.className = 'obstacle speed-zone';
      zone.style.left = `${obs.x}px`;
      zone.style.top = `${obs.y}px`;
      zone.style.width = `${obs.width}px`;
      zone.style.height = `${obs.height}px`;
      playArea.insertBefore(zone, birdElement);
    }
  });

  // Update coin positions
  coinsList.forEach((coin) => {
    if (coin.element && coin.element.parentNode) {
      coin.element.style.left = `${coin.x}px`;
      coin.element.style.top = `${coin.y}px`;
    }
  });

  // Update power-up positions
  powerups.forEach((powerup) => {
    if (powerup.element && powerup.element.parentNode) {
      powerup.element.style.left = `${powerup.x}px`;
      powerup.element.style.top = `${powerup.y}px`;
    }
  });
}

function jump() {
  if (!running) {
    startGame();
    return;
  }
  
  // Prevent jump immediately after game start (click event bubbling)
  if (window.allowGameJump === false) {
    return;
  }
  
  velocity = gameConfig.jumpVelocity;
  birdElement.classList.add('jumping');
  createParticles(110, birdY + gameConfig.birdSize / 2, 12, '#00d9ff');
  playSound('jump');
  
  setTimeout(() => {
    if (birdElement) birdElement.classList.remove('jumping');
  }, 200);
}

// ============ ACHIEVEMENT SYSTEM ============
function checkAchievement(achievementId) {
  if (achievements[achievementId]) return false;
  
  let unlocked = false;
  switch (achievementId) {
    case 'first_flight':
      unlocked = score > 0;
      break;
    case 'coin_collector':
      unlocked = totalCoins >= 100;
      break;
    case 'speed_demon':
      unlocked = activePowerups.speedBoost.active;
      break;
    case 'survivor':
      unlocked = currentLevel >= 5;
      break;
    case 'high_flyer':
      unlocked = score >= 5000;
      break;
    case 'power_master':
      unlocked = Object.keys(activePowerups).every(type => activePowerups[type].active);
      break;
    case 'perfect_run':
      unlocked = health === 100 && currentLevel > 1;
      break;
    case 'cosmic_explorer':
      unlocked = currentLevel >= 10;
      break;
  }
  
  if (unlocked) {
    achievements[achievementId] = true;
    showAchievement(achievementDefinitions[achievementId]);
    playSound('achievement');
    createParticles(playArea.offsetWidth / 2, playArea.offsetHeight / 2, 25, '#ffbe0b');
  }
  
  return unlocked;
}

function showAchievement(achievement) {
  const achievementDiv = document.createElement('div');
  achievementDiv.className = 'achievement-notification';
  achievementDiv.innerHTML = `
    <div class="achievement-icon">${achievement.icon}</div>
    <div class="achievement-content">
      <div class="achievement-title">Achievement Unlocked!</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.desc}</div>
    </div>
  `;
  
  document.body.appendChild(achievementDiv);
  
  setTimeout(() => {
    if (achievementDiv.parentNode) {
      achievementDiv.parentNode.removeChild(achievementDiv);
    }
  }, 4000);
  
  updateAchievementsList();
}

function updateAchievementsList() {
  achievementsList.innerHTML = '';
  
  Object.keys(achievementDefinitions).forEach(id => {
    const achievement = achievementDefinitions[id];
    const isUnlocked = achievements[id] || false;
    
    const item = document.createElement('div');
    item.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
    
    item.innerHTML = `
      <span class="achievement-icon">${achievement.icon}</span>
      <div class="achievement-info">
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.desc}</div>
      </div>
    `;
    
    achievementsList.appendChild(item);
  });
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
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'score':
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.setValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'coin':
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1000, now + 0.03);
        osc.frequency.setValueAtTime(1200, now + 0.06);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'powerup':
        for (let i = 0; i < 4; i++) {
          const osc2 = audioContext.createOscillator();
          osc2.connect(gain);
          osc2.frequency.setValueAtTime(600 + i * 200, now + i * 0.05);
          osc2.start(now + i * 0.05);
          osc2.stop(now + i * 0.05 + 0.08);
        }
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        break;
      case 'hit':
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'shieldHit':
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'extraLife':
        for (let i = 0; i < 5; i++) {
          const osc2 = audioContext.createOscillator();
          osc2.connect(gain);
          osc2.frequency.setValueAtTime(800 + i * 100, now + i * 0.1);
          osc2.start(now + i * 0.1);
          osc2.stop(now + i * 0.1 + 0.1);
        }
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        break;
      case 'levelUp':
        for (let i = 0; i < 6; i++) {
          const osc2 = audioContext.createOscillator();
          osc2.connect(gain);
          osc2.frequency.setValueAtTime(500 + i * 150, now + i * 0.08);
          osc2.start(now + i * 0.08);
          osc2.stop(now + i * 0.08 + 0.1);
        }
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        break;
      case 'achievement':
        const melody = [523, 659, 784, 1047]; // C5, E5, G5, C6
        melody.forEach((freq, i) => {
          const osc2 = audioContext.createOscillator();
          osc2.connect(gain);
          osc2.frequency.setValueAtTime(freq, now + i * 0.15);
          osc2.start(now + i * 0.15);
          osc2.stop(now + i * 0.15 + 0.12);
        });
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
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
        for (let i = 0; i < 4; i++) {
          const osc2 = audioContext.createOscillator();
          osc2.connect(gain);
          osc2.frequency.setValueAtTime(500 + i * 200, now + i * 0.1);
          osc2.start(now + i * 0.1);
          osc2.stop(now + i * 0.1 + 0.1);
        }
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
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
        scoresList.innerHTML = '<li style="text-align: center; color: rgba(255,255,255,0.5);">No scores yet. Be the first pilot!</li>';
        return;
      }
      scoresList.innerHTML = data
        .map((entry, index) => {
          const medal = index === 0 ? '??' : index === 1 ? '??' : index === 2 ? '??' : '?';
          return `<li><strong>${medal} ${escapeHtml(entry.name)}</strong> <span>${entry.score} pts</span></li>`;
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
    body: JSON.stringify({ 
      name, 
      score: scoreValue,
      level: currentLevel,
      coins: coins,
      achievements: Object.keys(achievements).filter(id => achievements[id])
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        setMessage('? ' + data.error);
        message.classList.add('error');
        return;
      }
      message.classList.add('success');
      setMessage('? Score saved! Excellent piloting!');
      playerName.value = '';
      loadScores();
    })
    .catch(() => {
      setMessage('? Could not save score right now.');
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
  localStorage.setItem('nexusFlightSound', soundEnabled);
  soundToggle.style.opacity = soundEnabled ? '1' : '0.5';
  soundToggle.textContent = soundEnabled ? '?? SOUND' : '?? MUTE';
});

settingsButton.addEventListener('click', () => {
  // Simple settings toggle for now
  musicEnabled = !musicEnabled;
  localStorage.setItem('nexusFlightMusic', musicEnabled);
  settingsButton.textContent = musicEnabled ? '?? MUSIC' : '?? MUTE';
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
    setMessage('?? Enter your pilot name before saving a score.');
    return;
  }
  if (score === 0) {
    message.classList.add('error');
    setMessage('?? Play a mission first before submitting a score.');
    return;
  }
  submitScore(name, score);
});

// ============ INITIALIZATION ============
showOverlay('READY FOR LAUNCH?', 'Navigate through cosmic hazards and collect power-ups in this epic journey', 'ENGAGE!', '??');
renderScore();
loadScores();
updateAchievementsList();

soundToggle.textContent = soundEnabled ? '?? SOUND' : '?? MUTE';
soundToggle.style.opacity = soundEnabled ? '1' : '0.5';
settingsButton.textContent = musicEnabled ? '?? MUSIC' : '?? MUTE';

window.addEventListener('resize', setupCanvas);
x