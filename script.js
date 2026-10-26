
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PMS | Chess Simulation</title>
  <link rel="stylesheet" href="style.css">
  <script type="module" src="script.js"></script>
</head>
<body>

<header class="header">
  <a class="brand" href="index.html">
    <svg class="pms-logo" viewBox="0 0 48 48"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="5"
          fill="currentColor"/>

  <ellipse cx="24" cy="24" rx="21" ry="9"
           stroke="currentColor"
           stroke-width="1.8"
           transform="rotate(-35 24 24)"/>

  <ellipse cx="24" cy="24" rx="21" ry="9"
           stroke="currentColor"
           stroke-width="1.8"
           transform="rotate(35 24 24)"/>
</svg>
    <span>PMS <small>PERPETUAL MOTION SQUAD</small></span>
  </a>
  <span class="header-label">CHESS SIMULATOR</span>
</header>

<main class="layout">
  <section class="game-area">
    <div class="board-heading">
      <div>
        <span class="eyebrow">PLAY / COMPUTER</span>
        <h1>Chess.</h1>
      </div>
      <span id="engine-status" class="engine-status">Loading engine...</span>
    </div>

    <div class="player-line">
      <span class="avatar">♟</span>
      <div>
        <strong>Stockfish</strong>
        <small>Black · Computer</small>
      </div>
    </div>

    <div id="board" class="chessboard" aria-label="Chessboard"></div>

    <div class="player-line">
      <span class="avatar">♙</span>
      <div>
        <strong>You</strong>
        <small>White · Player</small>
      </div>
    </div>
  </section>

  <aside class="sidebar">
    <div class="sidebar-heading">
      <span class="eyebrow">GAME CONTROL</span>
      <h2>Play against AI</h2>
      <p>Make a move on the board. Stockfish will respond.</p>
    </div>

    <div class="panel">
      <label for="difficulty">Computer difficulty</label>
      <select id="difficulty">
        <option value="1">Beginner</option>
        <option value="5" selected>Intermediate</option>
        <option value="10">Advanced</option>
        <option value="18">Expert</option>
      </select>

      <div id="game-status" class="status" aria-live="polite">
        White to move
      </div>

      <div class="actions">
        <button id="new-game" class="primary">New game</button>
        <button id="undo" class="secondary">Undo turn</button>
        
<!-- PMS Voice Control -->
<div class="voice-controls">
  <button id="voiceBtn" type="button">
    🎙️ Speak Move
  </button>
  <p id="voiceStatus" aria-live="polite">
    Voice control ready
  </p>
</div>

      </div>
    </div>
    
<div class="color-controls">
  <label for="player-color">Play as:</label>
  <select id="player-color">
    <option value="w">White</option>
    <option value="b">Black</option>
  </select>
</div>


    <div class="panel moves-panel">
      <div class="panel-title">
        <h3>Move history</h3>
        <span id="move-count">0 moves</span>
      </div>
      <div id="move-list" class="move-list">
        <p class="empty">No moves yet.</p>
      </div>
    </div>

    <div class="panel">
      <span class="eyebrow">FUTURE INTEGRATION</span>
      <h3>Voice commands</h3>
      <p class="muted">
        Voice control and virtual electromagnetic movement
        will be added in a later version.
      </p>
    </div>
  </aside>
</main>

<div id="promotion-dialog" class="modal" hidden>
  <div class="modal-content">
    <h2>Choose promotion</h2>
    <div class="promotion-options">
      <button data-piece="q">♕</button>
      <button data-piece="r">♖</button>
      <button data-piece="b">♗</button>
      <button data-piece="n">♘</button>
    </div>
  </div>
</div>

<footer>
  PMS © 2026 · PERPETUAL MOTION SQUAD
  <span>POWERED BY STOCKFISH</span>
</footer>

</body>
</html>
