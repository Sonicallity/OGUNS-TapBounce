<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🚀 NEXUS FLIGHT - Ultimate Aerial Combat</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="background-animate"></div>
  <div class="floating-orbs"></div>
  <div class="cosmic-particles"></div>
  
  <div class="app-shell">
    <header class="neon-header">
      <div class="header-content">
        <h1 class="glitch" data-text="⚡🚀 NEXUS FLIGHT 🚀⚡">⚡🚀 NEXUS FLIGHT 🚀⚡</h1>
        <p class="subtitle-bounce">Master the Cosmos in this Epic Aerial Odyssey</p>
        <div class="header-stats">
          <div class="stat-box">
            <span class="stat-label">Level</span>
            <span id="currentLevelDisplay" class="stat-value">1</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Lives</span>
            <span id="livesDisplay" class="stat-value">3</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">High Score</span>
            <span id="bestScoreDisplay" class="stat-value">0</span>
          </div>
        </div>
      </div>
    </header>

    <main>
      <section class="game-panel">
        <div class="game-wrapper">
          <div id="playArea" class="play-area">
            <canvas id="backgroundCanvas" class="bg-canvas"></canvas>
            <canvas id="gameCanvas" class="game-canvas"></canvas>
            <div id="particleContainer" class="particle-container"></div>
            <div id="scorePopups" class="score-popups"></div>
            <div id="powerupContainer" class="powerup-container"></div>
            <div id="uiContainer" class="ui-container">
              <div class="health-bar">
                <div class="health-fill" id="healthFill"></div>
                <div class="health-text">SHIELD</div>
              </div>
              <div class="powerup-indicators">
                <div class="powerup-slot" id="speedBoostSlot">
                  <span class="powerup-icon">⚡</span>
                  <span class="powerup-timer" id="speedBoostTimer"></span>
                </div>
                <div class="powerup-slot" id="shieldSlot">
                  <span class="powerup-icon">🛡️</span>
                  <span class="powerup-timer" id="shieldTimer"></span>
                </div>
                <div class="powerup-slot" id="magnetSlot">
                  <span class="powerup-icon">🧲</span>
                  <span class="powerup-timer" id="magnetTimer"></span>
                </div>
              </div>
            </div>
            
            <div id="overlay" class="overlay visible">
              <div class="overlay-card glowing">
                <div class="overlay-icon">🚀</div>
                <strong id="overlayTitle" class="overlay-title">READY FOR LAUNCH?</strong>
                <p id="overlayText" class="overlay-text">Navigate through cosmic hazards and collect power-ups in this epic journey</p>
                <button id="retryButton" class="button button-primary glowing-button">
                  <span class="button-text">ENGAGE!</span>
                  <span class="button-glow"></span>
                </button>
              </div>
            </div>
          </div>

          <div class="game-controls">
            <div class="score-display-large">
              <span class="score-label">SCORE</span>
              <span id="scoreDisplay" class="score-value">0</span>
            </div>
            
            <div class="level-info">
              <div class="level-progress">
                <div class="progress-bar">
                  <div class="progress-fill" id="levelProgressFill"></div>
                </div>
                <span class="progress-text">Level <span id="levelNumber">1</span> Progress</span>
              </div>
              <div class="coins-display">
                <span class="coins-icon">🪙</span>
                <span id="coinsDisplay" class="coins-value">0</span>
              </div>
            </div>
            
            <div class="control-buttons">
              <button id="startButton" class="button button-primary">
                <span>START MISSION</span>
              </button>
              <button id="soundToggle" class="button button-secondary" title="Toggle sound">
                <span>🔊 SOUND</span>
              </button>
              <button id="settingsButton" class="button button-secondary" title="Settings">
                <span>⚙️ SETTINGS</span>
              </button>
            </div>
            
            <p class="hint-text">
              <span class="hint-icon">🎯</span>
              Use <strong>SPACE</strong> or click to navigate • Collect <strong>🪙</strong> for bonuses • Avoid <strong>💥</strong> hazards
            </p>
          </div>
        </div>
      </section>

      <aside class="side-panel">
        <div class="achievements-panel">
          <h3>🏆 ACHIEVEMENTS</h3>
          <div id="achievementsList" class="achievements-list"></div>
        </div>
        
        <div class="powerups-panel">
          <h3>⚡ POWER-UPS</h3>
          <div class="powerup-descriptions">
            <div class="powerup-desc">
              <span class="powerup-icon">⚡</span>
              <div class="powerup-info">
                <strong>Speed Boost</strong>
                <small>Increase speed temporarily</small>
              </div>
            </div>
            <div class="powerup-desc">
              <span class="powerup-icon">🛡️</span>
              <div class="powerup-info">
                <strong>Shield</strong>
                <small>Protect from one hit</small>
              </div>
            </div>
            <div class="powerup-desc">
              <span class="powerup-icon">🧲</span>
              <div class="powerup-info">
                <strong>Magnet</strong>
                <small>Attract nearby coins</small>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section class="leaderboard-panel">
        <div class="leaderboard-header">
          <h2>🏆 LEADERBOARD</h2>
          <div class="pulse-indicator"></div>
        </div>
        
        <ol id="scoresList" class="scores-list"></ol>
        
        <form id="scoreForm" class="score-form">
          <div class="form-group">
            <label for="playerName" class="form-label">Pilot Name</label>
            <input id="playerName" name="name" type="text" maxlength="20" placeholder="Enter your callsign..." required>
            <div class="input-underline"></div>
          </div>
          <button type="submit" class="button button-accent">
            <span>SUBMIT SCORE</span>
          </button>
        </form>
        
        <div id="message" class="message"></div>
      </section>
    </main>

    <footer class="footer">
      <p>Navigate the cosmos in <span class="highlight">NEXUS FLIGHT</span> | Master 10 epic levels! 🌌</p>
    </footer>
  </div>

  <script src="script.js"></script>
</body>
</html>
