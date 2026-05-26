/**
 * ============================================================================
 * NEUROXO - CORE JAVASCRIPT GAME ENGINE & VISUAL EFFECTS
 * ============================================================================
 */

// Global Audio Context (Initialized lazily on first interaction)
let audioCtx = null;

// --- DYNAMIC AUDIO SYNTHESIZER ---
const Synth = {
  enabled: true,

  init() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  },

  playTick() {
    if (!this.enabled) return;
    this.init();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    // Frequency drops quickly to simulate a subtle holographic tick
    osc.frequency.setValueAtTime(700, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  },

  playSelect() {
    if (!this.enabled) return;
    this.init();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'triangle';
    // Frequency sweeps upwards for selection trigger
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  },

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    const now = audioCtx.currentTime;
    
    // Play a futuristic, major-chord arpeggio (E4 -> G4 -> C5 -> E5 -> G5 -> C6)
    const notes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.035, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.3);
    });
  },

  playFailure() {
    if (!this.enabled) return;
    this.init();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    // Dramatic descending sweep
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(70, now + 0.45);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.45);
  }
};

// --- SPEECH ANNOUNCER CORE ---
const Announcer = {
  enabled: true,
  robotVoice: null,

  init() {
    this.findVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => this.findVoice();
    }
  },

  findVoice() {
    const voices = window.speechSynthesis.getVoices();
    // Try to find a premium English voice or robotic voice
    this.robotVoice = voices.find(v => 
      v.lang.includes('en') && (
        v.name.includes('Google') || 
        v.name.includes('Zira') || 
        v.name.includes('David') || 
        v.name.includes('Microsoft')
      )
    ) || voices[0];
  },

  speak(text) {
    if (!this.enabled) return;
    window.speechSynthesis.cancel(); // Terminate ongoing announcements
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.robotVoice) {
      utterance.voice = this.robotVoice;
    }
    // Manipulate speed and pitch for space-age cyberpunk synth vocals
    utterance.pitch = 0.65;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }
};

// --- BACKGROUND DUST PARTICLES ---
const BackgroundMatrix = {
  canvas: null,
  ctx: null,
  particles: [],
  maxParticles: 50,
  animationId: null,

  init() {
    this.canvas = document.getElementById('bgCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Populate particles
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1
    };
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Get colors from CSS Variables dynamically
    const style = getComputedStyle(document.documentElement);
    const particleColor = style.getPropertyValue('--neon-blue').trim();
    
    this.particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around bounds
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particleColor;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();

      // Connect close nodes
      for (let j = idx + 1; j < this.particles.length; j++) {
        const other = this.particles[j];
        const dist = Math.hypot(p.x - other.x, p.y - other.y);
        if (dist < 100) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = particleColor;
          this.ctx.globalAlpha = (1 - dist / 100) * 0.1;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    });

    this.ctx.globalAlpha = 1.0;
    this.animationId = requestAnimationFrame(() => this.animate());
  }
};

// --- WINNER CELEBRATION SHOWER (CONFETTI) ---
const ConfettiController = {
  canvas: null,
  ctx: null,
  particles: [],
  active: false,

  init() {
    this.canvas = document.getElementById('sparkleCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  trigger() {
    this.active = true;
    this.particles = [];
    const style = getComputedStyle(document.documentElement);
    const c1 = style.getPropertyValue('--neon-blue').trim();
    const c2 = style.getPropertyValue('--neon-purple').trim();
    
    // Spawn particles from center screen
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 3;

    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 3, // slightly upward bias
        size: Math.random() * 5 + 3,
        color: Math.random() > 0.5 ? c1 : c2,
        gravity: 0.15,
        drag: 0.98,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.01
      });
    }

    this.animate();
  },

  animate() {
    if (!this.active || this.particles.length === 0) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1.0;
    requestAnimationFrame(() => this.animate());
  },

  stop() {
    this.active = false;
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
};

// --- GAME CONTROLLER ENGINE ---
const NeuroXO = {
  // State
  board: ["", "", "", "", "", "", "", "", ""],
  currentPlayer: "X", // X always goes first
  gameActive: true,
  gameMode: "ai", // 'ai' or 'pvp'
  aiDifficulty: "medium", // 'easy', 'medium', 'hard'
  isAiThinking: false,

  // Stats Counters
  stats: {
    winsX: 0,
    winsO: 0,
    draws: 0,
    totalGames: 0,
    streak: 0,
    maxStreak: 0
  },

  // Match History logs
  logs: [],

  // Elements mapping
  cells: null,
  scoreboardX: null,
  scoreboardO: null,
  scoreboardDraw: null,
  scoreCardX: null,
  scoreCardO: null,
  scoreCardDraw: null,
  playerOTag: null,
  statsTotal: null,
  statsWinRate: null,
  statsStreak: null,
  statsCompletions: null,
  distBarX: null,
  distBarDraw: null,
  distBarO: null,
  distValX: null,
  distValDraw: null,
  distValO: null,
  historyList: null,
  boardOverlay: null,
  aiPulseIndicator: null,
  winnerAnnounce: null,
  winnerText: null,
  winningLineSvg: null,
  winningLine: null,

  winningCombos: [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ],

  // Center coordinate mapping for winning line inside a 100x100 SVG
  cellCoords: [
    { x: 16.67, y: 16.67 }, { x: 50.0, y: 16.67 }, { x: 83.33, y: 16.67 },
    { x: 16.67, y: 50.0 },  { x: 50.0, y: 50.0 },  { x: 83.33, y: 50.0 },
    { x: 16.67, y: 83.33 }, { x: 50.0, y: 83.33 }, { x: 83.33, y: 83.33 }
  ],

  init() {
    this.cacheElements();
    this.loadStatsFromStorage();
    this.bindEvents();
    this.updateStatsDisplay();
    this.renderLogs();
    Announcer.init();
  },

  cacheElements() {
    this.cells = document.querySelectorAll('.cell');
    this.scoreboardX = document.getElementById('scoreX');
    this.scoreboardO = document.getElementById('scoreO');
    this.scoreboardDraw = document.getElementById('scoreDraw');
    
    this.scoreCardX = document.getElementById('scoreCardX');
    this.scoreCardO = document.getElementById('scoreCardO');
    this.scoreCardDraw = document.getElementById('scoreCardDraw');
    this.playerOTag = document.getElementById('playerOTag');

    this.statsTotal = document.getElementById('statsTotal');
    this.statsWinRate = document.getElementById('statsWinRate');
    this.statsStreak = document.getElementById('statsStreak');
    this.statsCompletions = document.getElementById('statsCompletions');

    this.distBarX = document.getElementById('distBarX');
    this.distBarDraw = document.getElementById('distBarDraw');
    this.distBarO = document.getElementById('distBarO');
    this.distValX = document.getElementById('distValX');
    this.distValDraw = document.getElementById('distValDraw');
    this.distValO = document.getElementById('distValO');

    this.historyList = document.getElementById('historyList');
    this.boardOverlay = document.getElementById('boardOverlay');
    this.aiPulseIndicator = document.getElementById('aiPulseIndicator');
    this.winnerAnnounce = document.getElementById('winnerAnnounce');
    this.winnerText = document.getElementById('winnerText');
    this.winningLineSvg = document.getElementById('winningLineSvg');
    this.winningLine = document.getElementById('winningLine');
  },

  bindEvents() {
    // Grid Cells Input
    this.cells.forEach(cell => {
      cell.addEventListener('click', (e) => this.handleCellClick(e));
      cell.addEventListener('mouseenter', () => Synth.playTick());
    });

    // Reset Buttons
    document.getElementById('resetBtn').addEventListener('click', () => {
      Synth.playSelect();
      this.rebootBoard();
    });
    document.getElementById('overlayResetBtn').addEventListener('click', () => {
      Synth.playSelect();
      this.rebootBoard();
    });

    // Mode Selector Controls
    document.getElementById('modePvAI').addEventListener('click', (e) => this.switchMode('ai', e.currentTarget));
    document.getElementById('modePvP').addEventListener('click', (e) => this.switchMode('pvp', e.currentTarget));

    // Difficulty Options Selector
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchDifficulty(e.currentTarget));
    });

    // Controls Panel Switches
    const soundBtn = document.getElementById('soundToggle');
    const soundPath = document.getElementById('soundIconPath');
    soundBtn.addEventListener('click', () => {
      Synth.enabled = !Synth.enabled;
      soundBtn.classList.toggle('muted', !Synth.enabled);
      localStorage.setItem('neuroxo_sound', Synth.enabled);
      Synth.playSelect();
    });
    // Load setting
    if (localStorage.getItem('neuroxo_sound') === 'false') {
      Synth.enabled = false;
      soundBtn.classList.add('muted');
    }

    const voiceBtn = document.getElementById('voiceToggle');
    voiceBtn.addEventListener('click', () => {
      Announcer.enabled = !Announcer.enabled;
      voiceBtn.classList.toggle('disabled', !Announcer.enabled);
      localStorage.setItem('neuroxo_voice', Announcer.enabled);
      Synth.playSelect();
    });
    // Load setting
    if (localStorage.getItem('neuroxo_voice') === 'false') {
      Announcer.enabled = false;
      voiceBtn.classList.add('disabled');
    }

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('neuroxo_theme', newTheme);
      Synth.playSelect();
    });
    // Load Theme
    const savedTheme = localStorage.getItem('neuroxo_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Purge Logs Button
    document.getElementById('clearLogsBtn').addEventListener('click', () => {
      Synth.playFailure();
      this.logs = [];
      localStorage.setItem('neuroxo_logs', JSON.stringify(this.logs));
      this.renderLogs();
    });
  },

  // --- ACTIONS & HANDLERS ---
  switchMode(mode, targetBtn) {
    if (this.gameMode === mode) return;
    Synth.playSelect();
    
    this.gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    targetBtn.classList.add('active');

    const diffContainer = document.getElementById('difficultyContainer');
    if (mode === 'pvp') {
      diffContainer.classList.add('disabled');
      this.playerOTag.textContent = "USER (O)";
    } else {
      diffContainer.classList.remove('disabled');
      this.playerOTag.textContent = "AI (O)";
    }
    this.rebootBoard();
  },

  switchDifficulty(targetBtn) {
    if (this.gameMode !== 'ai') return;
    Synth.playSelect();

    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    targetBtn.classList.add('active');
    this.aiDifficulty = targetBtn.getAttribute('data-diff');
    this.rebootBoard();
  },

  handleCellClick(e) {
    const clickedCell = e.currentTarget;
    const clickedIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (this.board[clickedIndex] !== "" || !this.gameActive || this.isAiThinking) {
      return;
    }

    this.makeMove(clickedIndex, this.currentPlayer);
  },

  makeMove(index, player) {
    this.board[index] = player;
    this.drawTokenOnCell(index, player);
    Synth.playTick();

    const winCombo = this.checkWinCondition(this.board, player);

    if (winCombo) {
      this.handleGameEnd('win', player, winCombo);
    } else if (this.board.every(cell => cell !== "")) {
      this.handleGameEnd('draw');
    } else {
      // Toggle player turn
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
      this.updateTurnIndicator();

      if (this.gameMode === 'ai' && this.currentPlayer === "O" && this.gameActive) {
        this.triggerAiTurn();
      }
    }
  },

  drawTokenOnCell(index, player) {
    const cell = this.cells[index];
    cell.setAttribute('aria-label', `Cell ${index + 1}, Occupied by ${player}`);
    
    let svgMarkup = "";
    if (player === 'X') {
      svgMarkup = `
        <svg viewBox="0 0 100 100">
          <line x1="20" y1="20" x2="80" y2="80" class="token-x-path" />
          <line x1="80" y1="20" x2="20" y2="80" class="token-x-path token-x-path-2" />
        </svg>
      `;
    } else {
      svgMarkup = `
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="32" class="token-o-path" />
        </svg>
      `;
    }
    cell.innerHTML = svgMarkup;
  },

  updateTurnIndicator() {
    this.scoreCardX.classList.toggle('active', this.currentPlayer === 'X');
    this.scoreCardO.classList.toggle('active', this.currentPlayer === 'O');
  },

  // --- AI ENGINE & MINIMAX ---
  triggerAiTurn() {
    this.isAiThinking = true;
    this.boardOverlay.classList.add('active');
    this.aiPulseIndicator.style.display = 'flex';
    this.winnerAnnounce.style.display = 'none';

    // Simulate AI computing matrices delay
    const delay = Math.random() * 400 + 400; // 400ms to 800ms
    setTimeout(() => {
      const bestMove = this.computeAiMove();
      this.boardOverlay.classList.remove('active');
      this.aiPulseIndicator.style.display = 'none';
      this.isAiThinking = false;
      this.makeMove(bestMove, "O");
    }, delay);
  },

  computeAiMove() {
    if (this.aiDifficulty === 'easy') {
      return this.getRandomMove();
    } else if (this.aiDifficulty === 'medium') {
      // 50% chance of playing minimax, 50% chance of random
      return Math.random() > 0.5 ? this.getBestMove() : this.getRandomMove();
    } else {
      // Hard: Always invoke Minimax (Unbeatable play)
      return this.getBestMove();
    }
  },

  getRandomMove() {
    const availableCells = [];
    this.board.forEach((cell, idx) => {
      if (cell === "") availableCells.push(idx);
    });
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  },

  getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (this.board[i] === "") {
        this.board[i] = "O";
        let score = this.minimax(this.board, 0, false);
        this.board[i] = "";
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  },

  minimax(boardState, depth, isMaximizing) {
    const score = this.evaluateBoard(boardState);

    // Terminal states
    if (score === 10) return score - depth; // Prefer quicker wins
    if (score === -10) return score + depth; // Prefer longer survival
    if (!boardState.includes("")) return 0; // Tie

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === "") {
          boardState[i] = "O";
          best = Math.max(best, this.minimax(boardState, depth + 1, false));
          boardState[i] = "";
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === "") {
          boardState[i] = "X";
          best = Math.min(best, this.minimax(boardState, depth + 1, true));
          boardState[i] = "";
        }
      }
      return best;
    }
  },

  evaluateBoard(boardState) {
    // Check horizontal, vertical, and diagonal winning combos
    for (let combo of this.winningCombos) {
      const [a, b, c] = combo;
      if (boardState[a] !== "" && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return boardState[a] === "O" ? 10 : -10;
      }
    }
    return 0;
  },

  checkWinCondition(boardState, player) {
    for (let combo of this.winningCombos) {
      const [a, b, c] = combo;
      if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
        return combo;
      }
    }
    return null;
  },

  // --- GAME END SYSTEM ---
  handleGameEnd(type, winner = null, winCombo = null) {
    this.gameActive = false;
    this.scoreCardX.classList.remove('active');
    this.scoreCardO.classList.remove('active');

    if (type === 'win') {
      this.drawWinningLine(winCombo);
      this.updateStats(winner);

      if (winner === 'X') {
        Synth.playSuccess();
        ConfettiController.trigger();
        this.winnerText.innerHTML = `<span class="text-neon-blue">USER</span> SECURED MATRIX`;
        this.winnerText.className = "win-x";
        Announcer.speak(this.gameMode === 'ai' ? "Cognitive intelligence bypassed. User wins." : "Matrix secured by user X.");
      } else {
        if (this.gameMode === 'ai') {
          Synth.playFailure();
          this.winnerText.innerHTML = `<span class="text-neon-purple">COGNITIVE AI</span> DOMINATES`;
          this.winnerText.className = "win-o";
          Announcer.speak("Neural network prevails. Cognitive code wins.");
        } else {
          Synth.playSuccess();
          ConfettiController.trigger();
          this.winnerText.innerHTML = `<span class="text-neon-purple">USER O</span> SECURED MATRIX`;
          this.winnerText.className = "win-o";
          Announcer.speak("Matrix secured by user O.");
        }
      }
      this.addLog(type, winner);
    } else {
      Synth.playFailure();
      this.updateStats('draw');
      this.winnerText.textContent = "PARITY EQUILIBRIUM (TIE)";
      this.winnerText.className = "win-draw";
      Announcer.speak("Matrix parity achieved. It is a draw.");
      this.addLog(type);
    }

    // Display winner announcement overlay
    setTimeout(() => {
      this.boardOverlay.classList.add('active');
      this.aiPulseIndicator.style.display = 'none';
      this.winnerAnnounce.style.display = 'flex';
    }, 900); // Wait for winning line to finish drawing
  },

  drawWinningLine(combo) {
    const startCell = this.cellCoords[combo[0]];
    const endCell = this.cellCoords[combo[2]];

    this.winningLine.setAttribute('x1', startCell.x);
    this.winningLine.setAttribute('y1', startCell.y);
    this.winningLine.setAttribute('x2', endCell.x);
    this.winningLine.setAttribute('y2', endCell.y);

    this.winningLineSvg.classList.add('active');
    
    // Trigger CSS SVG animation transition resetting offset
    this.winningLine.style.strokeDashoffset = '0';
  },

  // --- REBOOT BOARD ---
  rebootBoard() {
    this.board = ["", "", "", "", "", "", "", "", ""];
    this.currentPlayer = "X";
    this.gameActive = true;
    this.isAiThinking = false;

    // Reset UI board cells
    this.cells.forEach((cell, idx) => {
      cell.innerHTML = "";
      cell.setAttribute('aria-label', `Cell ${idx + 1}, Empty`);
    });

    // Reset overlay
    this.boardOverlay.classList.remove('active');
    this.aiPulseIndicator.style.display = 'none';
    this.winnerAnnounce.style.display = 'none';

    // Reset winning line
    this.winningLineSvg.classList.remove('active');
    this.winningLine.style.strokeDashoffset = '100';

    // Stop confetti
    ConfettiController.stop();

    this.updateTurnIndicator();
  },

  // --- STATISTICS AND STATE MANAGEMENT ---
  updateStats(result) {
    this.stats.totalGames += 1;

    if (result === 'X') {
      this.stats.winsX += 1;
      this.stats.streak += 1;
      if (this.stats.streak > this.stats.maxStreak) {
        this.stats.maxStreak = this.stats.streak;
      }
    } else if (result === 'O') {
      this.stats.winsO += 1;
      this.stats.streak = 0; // Reset streak on loss
    } else {
      this.stats.draws += 1;
      // Streak continues to hold or reset depending on preferences (let's keep it steady for draw)
    }

    this.saveStatsToStorage();
    this.updateStatsDisplay();
  },

  updateStatsDisplay() {
    // Score board counters
    this.scoreboardX.textContent = this.stats.winsX;
    this.scoreboardO.textContent = this.stats.winsO;
    this.scoreboardDraw.textContent = this.stats.draws;

    // Numerical stats panel details
    this.statsTotal.textContent = this.stats.totalGames;
    this.statsStreak.textContent = this.stats.maxStreak;
    this.statsCompletions.textContent = this.stats.winsX + this.stats.winsO;

    // Win Rate Calculation (relative to X / User wins)
    let winRate = 0;
    if (this.stats.totalGames > 0) {
      winRate = Math.round((this.stats.winsX / this.stats.totalGames) * 100);
    }
    this.statsWinRate.textContent = `${winRate}%`;

    // Visual distribution ratios
    let percentX = 33.3;
    let percentO = 33.3;
    let percentDraw = 33.4;

    if (this.stats.totalGames > 0) {
      percentX = (this.stats.winsX / this.stats.totalGames) * 100;
      percentO = (this.stats.winsO / this.stats.totalGames) * 100;
      percentDraw = (this.stats.draws / this.stats.totalGames) * 100;
    }

    this.distBarX.style.width = `${percentX}%`;
    this.distBarO.style.width = `${percentO}%`;
    this.distBarDraw.style.width = `${percentDraw}%`;

    this.distValX.textContent = this.stats.winsX;
    this.distValO.textContent = this.stats.winsO;
    this.distValDraw.textContent = this.stats.draws;
  },

  addLog(type, winner = null) {
    let modeText = this.gameMode === 'ai' ? `VS AI (${this.aiDifficulty.toUpperCase()})` : "VS LOCAL";
    let outcomeText = "";
    let colorClass = "";

    if (type === 'win') {
      if (winner === 'X') {
        outcomeText = "X SECURED";
        colorClass = "win-x";
      } else {
        outcomeText = "O SECURED";
        colorClass = "win-o";
      }
    } else {
      outcomeText = "PARITY TIE";
      colorClass = "draw";
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logItem = {
      mode: modeText,
      result: outcomeText,
      color: colorClass,
      time: timestamp
    };

    this.logs.unshift(logItem); // Add to beginning of history list
    if (this.logs.length > 25) {
      this.logs.pop(); // Cap history to 25 items
    }

    localStorage.setItem('neuroxo_logs', JSON.stringify(this.logs));
    this.renderLogs();
  },

  renderLogs() {
    if (this.logs.length === 0) {
      this.historyList.innerHTML = `<li class="history-empty">NO CYCLE RECORDED</li>`;
      return;
    }

    this.historyList.innerHTML = this.logs.map(log => `
      <li class="history-item">
        <span class="history-mode">${log.mode} [${log.time}]</span>
        <span class="history-result ${log.color}">${log.result}</span>
      </li>
    `).join('');
  },

  saveStatsToStorage() {
    localStorage.setItem('neuroxo_stats', JSON.stringify(this.stats));
  },

  loadStatsFromStorage() {
    const savedStats = localStorage.getItem('neuroxo_stats');
    if (savedStats) {
      this.stats = JSON.parse(savedStats);
    }
    const savedLogs = localStorage.getItem('neuroxo_logs');
    if (savedLogs) {
      this.logs = JSON.parse(savedLogs);
    }
  }
};

// --- STARTUP / LOAD CONTROLLER ---
const LoadingSequence = {
  progress: 0,
  loaderOverlay: null,
  loaderBar: null,
  loaderStatus: null,
  loaderPercent: null,

  messages: [
    { threshold: 0, txt: "BOOTING NEURAL NETWORKS..." },
    { threshold: 18, txt: "CALIBRATING QUANTUM CELL GRID..." },
    { threshold: 38, txt: "SYNCING COGNITIVE MINIMAX WEIGHTS..." },
    { threshold: 58, txt: "LOADING WEB AUDIO SYNTH ARPEGGIATORS..." },
    { threshold: 78, txt: "STABILIZING GLOW FLUIDS..." },
    { threshold: 92, txt: "SYSTEM READY. SYNCHRONIZING." }
  ],

  init() {
    this.loaderOverlay = document.getElementById('loaderOverlay');
    this.loaderBar = document.getElementById('loaderBar');
    this.loaderStatus = document.getElementById('loaderStatus');
    this.loaderPercent = document.getElementById('loaderPercent');

    this.run();
  },

  run() {
    const interval = setInterval(() => {
      this.progress += Math.floor(Math.random() * 8) + 3;
      if (this.progress >= 100) {
        this.progress = 100;
        clearInterval(interval);
        this.complete();
      }

      // Update text status based on percentages
      const activeMsg = this.messages.reduce((prev, curr) => {
        return (this.progress >= curr.threshold) ? curr : prev;
      });

      this.loaderBar.style.width = `${this.progress}%`;
      this.loaderPercent.textContent = `${this.progress}%`;
      this.loaderStatus.textContent = activeMsg.txt;
    }, 60);
  },

  complete() {
    setTimeout(() => {
      this.loaderOverlay.classList.add('fade-out');
      // Announce ready sound arpeggio and startup voice message!
      Synth.playSuccess();
      Announcer.speak("Neural network initialized. Welcome to Neuro XO.");
      
      // Clean up overlay element completely from rendering stack
      setTimeout(() => {
        this.loaderOverlay.style.display = 'none';
      }, 800);
    }, 400);
  }
};

// --- INTERACTIVE MOUSE GLOW ---
const CursorTracker = {
  glowEl: null,
  
  init() {
    this.glowEl = document.getElementById('cursorGlow');
    window.addEventListener('mousemove', (e) => this.update(e));
  },

  update(e) {
    // Throttle layout triggers to render cursor positioning
    const x = e.clientX;
    const y = e.clientY;
    
    // Update center coordinates inside animation frame
    requestAnimationFrame(() => {
      this.glowEl.style.left = `${x}px`;
      this.glowEl.style.top = `${y}px`;
    });
  }
};

// --- APPLICATION INITIALIZATION BOOTSTRAPPING ---
document.addEventListener('DOMContentLoaded', () => {
  BackgroundMatrix.init();
  ConfettiController.init();
  NeuroXO.init();
  CursorTracker.init();
  
  // Start boot loaders sequence last
  LoadingSequence.init();
});
