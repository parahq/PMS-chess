
import { Chess } from
  "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

const game = new Chess();

const board = document.getElementById("board");
const status = document.getElementById("game-status");
const engineStatus = document.getElementById("engine-status");
const moveList = document.getElementById("move-list");
const moveCount = document.getElementById("move-count");
const difficulty = document.getElementById("difficulty");
const playerColorSelect = document.getElementById("player-color");
let playerColor = playerColorSelect.value;
const promotionDialog = document.getElementById("promotion-dialog");

const symbols = {
  w: { k:"♔", q:"♕", r:"♖", b:"♗", n:"♘", p:"♙" },
  b: { k:"♚", q:"♛", r:"♜", b:"♝", n:"♞", p:"♟︎" }
};

let selected = null;
let pendingPromotion = null;
let engine = null;
let engineReady = false;
let thinking = false;
let searchId = 0;
let lastMove = null;
let awaitingBestMove = false;

function startEngine() {
  engineReady = false;
  engineStatus.textContent = "Loading Stockfish...";

  try {
    engine = new Worker("./engine/stockfish-19-lite-single.js");

    engine.onmessage = event => {
      const lines = String(event.data).split(/\r?\n/);

      for (const line of lines) {
        if (line === "uciok") {
          engine.postMessage("isready");
        }

        if (line === "readyok") {
  engineReady = true;
  engineStatus.textContent = "Stockfish ready";
  updateStatus();

  if (game.turn() !== playerColor &&
      !thinking && !game.isGameOver()) {
    requestEngineMove();
  }
}
        if (line.startsWith("bestmove ") && awaitingBestMove) {
          awaitingBestMove = false;

          const uci = line.split(" ")[1];

          if (uci && uci !== "(none)" && thinking) {
            try {
              const move = game.move({
                from: uci.slice(0, 2),
                to: uci.slice(2, 4),
                promotion: uci[4] || "q"
              });

              if (move) {
                lastMove = move;
              }
            } catch (error) {
              console.error("Engine move rejected:", error);
            }
          }

          thinking = false;
          render();
        }
      }
    };

    engine.onerror = error => {
      console.error("Stockfish error:", error);
      engineReady = false;
      thinking = false;
      engineStatus.textContent = "Engine unavailable";
      updateStatus();
    };

    engine.postMessage("uci");
  } catch (error) {
    console.error(error);
    engineStatus.textContent = "Engine unavailable";
  }
}

function renderBoard() {
  board.innerHTML = "";

  const legal = selected
    ? game.moves({ square: selected, verbose: true })
    : [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
     const files = playerColor === "w"
  ? "abcdefgh"
  : "hgfedcba";

const rank = playerColor === "w"
  ? 8 - row
  : row + 1;

const squareName = files[col] + rank;

      const piece = game.get(squareName);
      const square = document.createElement("button");

      square.type = "button";
      square.className = "square " +
        ((row + col) % 2 === 0 ? "light" : "dark");

      square.setAttribute("aria-label",
        squareName + (piece ? ` ${piece.color} ${piece.type}` : " empty")
      );

      if (selected === squareName) {
        square.classList.add("selected");
      }

      if (lastMove &&
          (lastMove.from === squareName ||
           lastMove.to === squareName)) {
        square.classList.add("last-move");
      }

      if (legal.some(m => m.to === squareName)) {
        square.classList.add("legal");

        if (piece) {
          square.classList.add("occupied");
        }
      }

      if (piece) {
        const span = document.createElement("span");
        span.className = "piece " +
          (piece.color === "w" ? "white" : "black");
        span.textContent = symbols[piece.color][piece.type];
        square.appendChild(span);
      }

      if (col === 0) {
        const rank = document.createElement("span");
        rank.className = "coord rank";
        rank.textContent = playerColor === "w"
  ? 8 - row
  : row + 1;
        square.appendChild(rank);
      }

      if (row === 7) {
        const file = document.createElement("span");
        file.className = "coord file";
        file.textContent = files[col];
        square.appendChild(file);
      }

      square.addEventListener("click", () => {
        handleSquare(squareName);
      });

      board.appendChild(square);
    }
  }
}

function handleSquare(square) {
  if (thinking || game.isGameOver() ||
      game.turn() !== playerColor || !engineReady) return;

  const piece = game.get(square);

  if (selected === square) {
    selected = null;
    renderBoard();
    return;
  }

  if (selected) {
    const moves = game.moves({
      square: selected,
      verbose: true
    });

    const matching = moves.filter(m => m.to === square);

    if (matching.length) {
      if (matching.some(m => m.isPromotion())) {
        pendingPromotion = { from: selected, to: square };
        promotionDialog.hidden = false;
        return;
      }

      makePlayerMove({
        from: selected,
        to: square
      });
      return;
    }
  }

  selected = piece && piece.color === playerColor
    ? square
    : null;

  renderBoard();
}

function makePlayerMove(moveData) {
  try {
    const move = game.move(moveData);

    if (!move) return;

    lastMove = move;
    selected = null;
    pendingPromotion = null;
    promotionDialog.hidden = true;

    render();

    if (!game.isGameOver()) {
      requestEngineMove();
    }
  } catch (error) {
    console.warn("Illegal move:", error);
    selected = null;
    renderBoard();
  }
}

function requestEngineMove() {
  if (!engineReady || game.turn() === playerColor ||
      game.isGameOver()) return;

  thinking = true;
  awaitingBestMove = true;
  searchId++;

  const currentSearch = searchId;
  const position = game.fen();
  const level = Number(difficulty.value);

  engine.postMessage(
    "setoption name Skill Level value " + level
  );
  engine.postMessage("position fen " + position);
  engine.postMessage("go movetime 500");

  // Only one engine search is active at a time.
  // New game restarts the worker to cancel old searches.
  render();
}

function updateStatus() {
  if (game.isCheckmate()) {
  status.textContent = game.turn() === playerColor
    ? "Checkmate — Stockfish wins"
    : "Checkmate — You win";
  } else if (game.isDraw()) {
    status.textContent = "Game drawn";
  } else if (thinking) {
    status.textContent = "Stockfish is thinking...";
  } else if (!engineReady) {
    status.textContent = "Waiting for chess engine...";
  } else if (game.isCheck()) {
    status.textContent = "Check!";
  } else {
    status.textContent = game.turn() === playerColor
  ? "Your move"
  : "Stockfish to move";
  }
}

function renderHistory() {
  const history = game.history();
  moveCount.textContent = history.length + " moves";

  if (!history.length) {
    moveList.innerHTML = '<p class="empty">No moves yet.</p>';
    return;
  }

  moveList.innerHTML = "";

  for (let i = 0; i < history.length; i += 2) {
    const row = document.createElement("div");
    row.className = "move-row";

    const number = document.createElement("span");
    number.className = "move-number";
    number.textContent = (i / 2 + 1) + ".";

    const white = document.createElement("span");
    white.textContent = history[i] || "";

    const black = document.createElement("span");
    black.textContent = history[i + 1] || "";

    row.append(number, white, black);
    moveList.appendChild(row);
  }

  moveList.scrollTop = moveList.scrollHeight;
}

function render() {
  renderBoard();
  renderHistory();
  updateStatus();
}

function restartEngine() {
  if (engine) {
    engine.terminate();
    engine = null;
  }

  thinking = false;
  awaitingBestMove = false;
  searchId++;
  startEngine();
}

playerColorSelect.addEventListener("change", () => {
  playerColor = playerColorSelect.value;

  game.reset();
  selected = null;
  lastMove = null;
  pendingPromotion = null;
  promotionDialog.hidden = true;

  restartEngine();
  render();
});

document.getElementById("new-game").addEventListener(
  "click", () => {
    game.reset();
    selected = null;
    lastMove = null;
    pendingPromotion = null;
    promotionDialog.hidden = true;

    restartEngine();
    render();
  }
);

document.getElementById("undo").addEventListener(
  "click", () => {
    if (thinking || !game.history().length) return;

    game.undo();

  if (game.turn() !== playerColor) {
  game.undo();
}

    selected = null;
    lastMove = null;
    render();
  }
);

document.querySelectorAll("[data-piece]").forEach(button => {
  button.addEventListener("click", () => {
    if (!pendingPromotion) return;

    makePlayerMove({
      ...pendingPromotion,
      promotion: button.dataset.piece
    });
  });
});

render();
startEngine();

/* =========================
   PMS VOICE CONTROL
   ========================= */

const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

const numberWords = {
  one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8",
  won: "1", too: "2", to: "2", for: "4",
  ate: "8"
};

const fileWords = {
  a: "a", ay: "a", hey: "a",
  b: "b", bee: "b", be: "b",
  c: "c", see: "c", sea: "c",
  d: "d", dee: "d",
  e: "e", ee: "e",
  f: "f", ef: "f",
  g: "g", gee: "g",
  h: "h", aitch: "h"
};

function normalizeVoice(text) {
  let words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return words.map(word => {
    if (numberWords[word]) return numberWords[word];
    if (fileWords[word]) return fileWords[word];
    return word;
  }).join(" ");
}

function extractSquares(text) {
  const squares = [];
  const tokens = text.split(/\s+/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Normal coordinates: e2, g1, f3
    if (/^[a-h][1-8]$/.test(token)) {
      squares.push(token);
      continue;
    }

    // Separated coordinates: e 2, g 1
    if (/^[a-h]$/.test(token) &&
        /^[1-8]$/.test(tokens[i + 1] || "")) {
      squares.push(token + tokens[i + 1]);
      i++;
      continue;
    }

    // Recognition sometimes combines "E2" as "32"
    // but 32 is ambiguous, so we do NOT guess here.
  }

  return squares;
}

function parseVoiceMove(transcript) {
  const normalized = normalizeVoice(transcript);
  const squares = extractSquares(normalized);

  if (squares.length !== 2) return null;

  const [from, to] = squares;

  // Only consider currently legal moves.
  const legalMoves = game.moves({ verbose: true });
  const matches = legalMoves.filter(
    move => move.from === from && move.to === to
  );

  if (!matches.length) return null;

  // Promotion requires an explicit choice.
  if (matches.some(move => move.isPromotion())) {
    return { from, to, needsPromotion: true };
  }

  return { from, to };
}

if (!SpeechRecognition) {
  voiceStatus.textContent =
    "Voice recognition is not supported in this browser.";
  voiceBtn.disabled = true;
} else {
  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  voiceBtn.addEventListener("click", () => {
    if (thinking || !engineReady ||
        game.turn() !== playerColor || game.isGameOver()) {
      voiceStatus.textContent =
        "Wait until it's your turn.";
      return;
    }

    voiceStatus.textContent = "Listening...";
    voiceBtn.disabled = true;

    try {
      recognition.start();
    } catch (error) {
      voiceStatus.textContent =
        "Could not start microphone.";
      voiceBtn.disabled = false;
    }
  });

  recognition.onresult = event => {
    const alternatives = Array.from(event.results[0])
      .map(result => result.transcript);

    // Only execute when all recognized legal candidates agree.
    const parsed = alternatives
      .map(parseVoiceMove)
      .filter(Boolean);

    const unique = [
      ...new Set(parsed.map(move =>
        move.from + move.to
      ))
    ];

    if (unique.length !== 1) {
      voiceStatus.textContent =
        `Couldn't confirm move. Heard: "${alternatives[0]}"`;
      return;
    }

    const move = parsed[0];

    if (thinking || !engineReady ||
        game.turn() !== playerColor || game.isGameOver()) {
      voiceStatus.textContent =
        "It's not your turn.";
      return;
    }

    voiceStatus.textContent =
      `Playing ${move.from} → ${move.to}`;

    if (move.needsPromotion) {
      pendingPromotion = {
        from: move.from,
        to: move.to
      };
      promotionDialog.hidden = false;
    } else {
      makePlayerMove({
        from: move.from,
        to: move.to
      });
    }
  };

  recognition.onerror = event => {
    voiceStatus.textContent =
      `Microphone error: ${event.error}`;
  };

  recognition.onend = () => {
    voiceBtn.disabled = false;
  };
}
