<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎮 Tapbounce - The Ultimate Flight Challenge</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="background-animate"></div>
  <div class="floating-orbs"></div>
  
  <div class="app-shell">
    <header class="neon-header">
      <div class="header-content">
        <h1 class="glitch" data-text="⚡✨ TAPBOUNCE ✨⚡">⚡✨ TAPBOUNCE ✨⚡</h1>
        <p class="subtitle-bounce">Master the Impossible Flight Challenge</p>
        <div class="header-stats">
          <div class="stat-box">
            <span class="stat-label">Current Streak</span>
            <span id="streakDisplay" class="stat-value">0</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Personal Best</span>
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
            <div id="particleContainer" class="particle-container"></div>
            <div id="scorePopups" class="score-popups"></div>
            
            <div id="overlay" class="overlay visible">
              <div class="overlay-card glowing">
                <div class="overlay-icon">🚀</div>
                <strong id="overlayTitle" class="overlay-title">READY TO FLY?</strong>
                <p id="overlayText" class="overlay-text">Click, tap, or press Space to start your journey</p>
                <button id="retryButton" class="button button-primary glowing-button">
                  <span class="button-text">LET'S GO!</span>
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
            
            <div class="control-buttons">
              <button id="startButton" class="button button-primary">
                <span>START GAME</span>
              </button>
              <button id="soundToggle" class="button button-secondary" title="Toggle sound">
                <span>🔊 SOUND</span>
              </button>
            </div>
            
            <p class="hint-text">
              <span class="hint-icon">📍</span>
              Tap the game or press <strong>SPACE</strong> to jump
            </p>
          </div>
        </div>
      </section>

      <section class="leaderboard-panel">
        <div class="leaderboard-header">
          <h2>🏆 LEADERBOARD</h2>
          <div class="pulse-indicator"></div>
        </div>
        
        <ol id="scoresList" class="scores-list"></ol>
        
        <form id="scoreForm" class="score-form">
          <div class="form-group">
            <label for="playerName" class="form-label">Your Name</label>
            <input id="playerName" name="name" type="text" maxlength="20" placeholder="Enter your name..." required>
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
      <p>Made with <span class="heart-pulse">❤️</span> | Double your best score! 🎯</p>
    </footer>
  </div>

  <script src="script.js"></script>
</body>
</html>
