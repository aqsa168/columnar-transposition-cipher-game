/**
 * ui.js - Classroom Educational UI Controller
 * For "Columnar Transposition Cipher - Encrypt & Decrypt Challenge"
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./cipher.js', './game.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./cipher.js'), require('./game.js'));
  } else {
    root.UI = factory(root.Cipher, root.Game);
  }
}(typeof self !== 'undefined' ? self : this, function (Cipher, Game) {
  'use strict';

  // --- Gentle Classroom Web Audio Synthesizer ---
  class ClassroomAudio {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.1) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playTyping() {
      this.playTone(700 + Math.random() * 200, 'triangle', 0.03, 0.05);
    }

    playSuccessBell() {
      this.init();
      if (!this.ctx) return;
      [587.33, 880].forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.15), idx * 90);
      });
    }

    playErrorBuzz() {
      this.playTone(180, 'sawtooth', 0.18, 0.12);
    }

    playFanfare() {
      this.init();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.18), idx * 110);
      });
    }
  }

  // --- UI Controller ---
  class UIController {
    constructor() {
      this.game = new Game.ChallengeManager();
      this.audio = new ClassroomAudio();
      this.activeDecryptColLetters = [];

      this.bindDOM();
      this.attachGameEvents();
      this.render();
    }

    bindDOM() {
      // Audio toggle
      const audioBtn = document.getElementById('audioToggleBtn');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          this.game.toggleAudio();
          audioBtn.textContent = this.game.audioEnabled ? '🔊 Sound: On' : '🔇 Sound: Off';
        });
      }

      // Mode Navigation Tabs
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-mode');
          this.game.setMode(mode);
          this.audio.playTone(550, 'sine', 0.05, 0.08);
        });
      });

      // Difficulty Selector
      const diffSelect = document.getElementById('difficultySelect');
      if (diffSelect) {
        diffSelect.addEventListener('change', (e) => {
          this.game.setDifficulty(e.target.value);
        });
      }

      // New Challenge Button
      const newChallengeBtn = document.getElementById('newChallengeBtn');
      if (newChallengeBtn) {
        newChallengeBtn.addEventListener('click', () => {
          this.game.initChallenge();
          this.audio.playTone(600, 'sine', 0.06, 0.1);
        });
      }

      // Hint Button
      const hintBtn = document.getElementById('hintBtn');
      if (hintBtn) {
        hintBtn.addEventListener('click', () => {
          const hint = this.game.getHint();
          this.showFeedback('info', hint);
        });
      }

      // Show Worked Example Button
      const workedExBtn = document.getElementById('workedExampleBtn');
      if (workedExBtn) {
        workedExBtn.addEventListener('click', () => {
          this.openWorkedExampleModal();
        });
      }

      // Close Worked Example Modal
      const closeExBtn = document.getElementById('closeWorkedExampleBtn');
      if (closeExBtn) {
        closeExBtn.addEventListener('click', () => {
          document.getElementById('workedExampleModal').classList.remove('active');
        });
      }
    }

    attachGameEvents() {
      this.game.addListener('onStateChange', (state) => {
        this.renderState(state);
      });

      this.game.addListener('onFeedback', (fb) => {
        this.showFeedback(fb.type, fb.message);
        if (this.game.audioEnabled) {
          if (fb.type === 'success') {
            if (fb.step === 5 || (this.game.mode === 'decrypt' && fb.step === 4)) {
              this.audio.playFanfare();
            } else {
              this.audio.playSuccessBell();
            }
          } else if (fb.type === 'error') {
            this.audio.playErrorBuzz();
          }
        }
      });

      this.game.addListener('onWorkedExample', (ex) => {
        this.renderWorkedExampleContent(ex);
      });
    }

    showFeedback(type, message) {
      const box = document.getElementById('teacherFeedbackBox');
      if (!box) return;
      box.className = `feedback-box ${type}`;
      box.innerHTML = `
        <span style="font-size: 1.25rem;">${type === 'success' ? '🌟' : type === 'error' ? '💡' : 'ℹ️'}</span>
        <div><strong>Teacher's Note:</strong> ${message}</div>
      `;
      box.classList.remove('hidden');
    }

    render() {
      this.renderState(this.game.getPublicState());
    }

    renderState(state) {
      // 1. Update HUD
      const scoreEl = document.getElementById('hudScore');
      if (scoreEl) scoreEl.textContent = state.score;

      const correctEl = document.getElementById('hudCorrect');
      if (correctEl) correctEl.textContent = state.correctCount;

      const incorrectEl = document.getElementById('hudIncorrect');
      if (incorrectEl) incorrectEl.textContent = state.incorrectCount;

      // 2. Update Tabs
      document.querySelectorAll('.nav-tab-btn').forEach(tab => {
        if (tab.getAttribute('data-mode') === state.mode) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      // 3. Update Challenge Banner
      const msgEl = document.getElementById('bannerMessage');
      const keyEl = document.getElementById('bannerKey');
      const colsEl = document.getElementById('bannerCols');
      if (msgEl) msgEl.textContent = state.plaintext;
      if (keyEl) keyEl.textContent = state.key;
      if (colsEl) colsEl.textContent = `${state.key.length} Columns`;

      const diffSelect = document.getElementById('difficultySelect');
      if (diffSelect) diffSelect.value = state.difficulty;

      // 4. Render Mode Area
      const content = document.getElementById('mainChallengeArea');
      if (!content) return;

      if (state.mode === 'learn') {
        this.renderLearnMode(content, state);
      } else if (state.mode === 'encrypt') {
        this.renderEncryptMode(content, state);
      } else if (state.mode === 'decrypt') {
        this.renderDecryptMode(content, state);
      } else if (state.mode === 'custom') {
        this.renderCustomMode(content, state);
      }
    }

    // ==========================================
    // LEARN FIRST MODE RENDERING
    // ==========================================
    renderLearnMode(container, state) {
      container.innerHTML = `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">LESSON</span>
              <h2 style="font-size: 1.25rem;">How Columnar Transposition Works</h2>
            </div>
            <button class="btn-primary" id="startEncryptFromLearnBtn">Start Encryption Challenge →</button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 1rem 0;">
            <!-- Encryption Concept Card -->
            <div style="background: var(--primary-light); border: 2px solid rgba(79, 70, 229, 0.2); border-radius: var(--radius-md); padding: 1.25rem;">
              <h3 style="color: var(--primary); font-size: 1.1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>🔒</span> 1. Encryption Flow
              </h3>
              <ol style="padding-left: 1.25rem; font-size: 0.95rem; line-height: 1.8; color: var(--text-main);">
                <li><strong>Plaintext:</strong> The original secret message.</li>
                <li><strong>Write row-by-row:</strong> Place letters left-to-right into the grid.</li>
                <li><strong>Determine Key Order:</strong> Number key letters alphabetically (1, 2, 3...).</li>
                <li><strong>Read columns in key order:</strong> Read down Rank 1, then Rank 2, etc.</li>
                <li><strong>Ciphertext:</strong> The resulting scrambled string.</li>
              </ol>
            </div>

            <!-- Decryption Concept Card -->
            <div style="background: rgba(16, 185, 129, 0.08); border: 2px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 1.25rem;">
              <h3 style="color: var(--success); font-size: 1.1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>🔓</span> 2. Decryption Flow
              </h3>
              <ol style="padding-left: 1.25rem; font-size: 0.95rem; line-height: 1.8; color: var(--text-main);">
                <li><strong>Ciphertext:</strong> The intercepted scrambled message.</li>
                <li><strong>Determine Key Order:</strong> Alphabetical ranks of the key.</li>
                <li><strong>Calculate Rows:</strong> <code>Math.ceil(Ciphertext Length / Columns)</code>.</li>
                <li><strong>Fill columns by key order:</strong> Place letter chunks column-by-column.</li>
                <li><strong>Read rows left-to-right:</strong> The original plaintext naturally reappears!</li>
              </ol>
            </div>
          </div>

          <!-- Canonical Animated Worked Example -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 1.25rem;">
            <h4 style="color: var(--text-main); font-size: 1rem; margin-bottom: 0.5rem;">
              Worked Example: Message: <code style="color: var(--primary);">WEAREDISCOVERED</code> | Key: <code style="color: var(--primary);">ZEBRAS</code>
            </h4>
            <div style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
              <p>Key letters are ranked: <strong>A=1, B=2, E=3, R=4, S=5, Z=6</strong>.</p>
              <p>Grid has 6 columns. 15 letters / 6 columns = 3 rows (Row 3 has 3 letters, 3 empty slots).</p>
              <p style="margin-top: 0.4rem;">Reading columns in order 1 → 6 yields: 
                <strong style="color: #065f46; background: var(--success-bg); padding: 0.2rem 0.6rem; border-radius: 4px;">
                  EV + ACD + ESE + RO + DE + WIR = EVACDESERODEWIR
                </strong>
              </p>
            </div>
          </div>
        </div>
      `;

      const startBtn = document.getElementById('startEncryptFromLearnBtn');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          this.game.setMode('encrypt');
        });
      }
    }

    // ==========================================
    // ENCRYPTION CHALLENGE RENDERING (5 STEPS)
    // ==========================================
    renderEncryptMode(container, state) {
      let stepHtml = '';

      if (state.encryptStep === 1) {
        stepHtml = this.renderEncryptStep1(state);
      } else if (state.encryptStep === 2) {
        stepHtml = this.renderEncryptStep2(state);
      } else if (state.encryptStep === 3) {
        stepHtml = this.renderEncryptStep3(state);
      } else if (state.encryptStep === 4) {
        stepHtml = this.renderEncryptStep4(state);
      } else if (state.encryptStep === 5) {
        stepHtml = this.renderEncryptStep5(state);
      }

      container.innerHTML = stepHtml;
      this.attachEncryptListeners(state);
    }

    // Encrypt Step 1: Understand the Key
    renderEncryptStep1(state) {
      return `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">STEP 1 OF 5</span>
              <h2 style="font-size: 1.25rem;">Understand the Key: Alphabetical Order</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Points: +10</span>
          </div>

          <p class="step-instruction">
            Determine the <strong>alphabetical order (1, 2, 3...)</strong> of the key letters.
            Enter the numbers in the boxes below each letter:
          </p>

          <div class="key-order-table-wrapper">
            <table class="key-order-table">
              <tr>
                <td style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-align: right; padding-right: 0.5rem;">Key:</td>
                ${state.key.split('').map(char => `<td class="key-box-cell">${char}</td>`).join('')}
              </tr>
              <tr>
                <td style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-align: right; padding-right: 0.5rem;">Col #:</td>
                ${state.key.split('').map((_, idx) => `<td class="col-num-cell">${idx + 1}</td>`).join('')}
              </tr>
              <tr>
                <td style="font-size: 0.8rem; font-weight: 700; color: var(--primary); text-align: right; padding-right: 0.5rem;">Order:</td>
                ${state.key.split('').map((_, idx) => `
                  <td class="order-input-cell">
                    <input type="text" maxlength="2" class="key-rank-input" data-col="${idx}" value="${state.userKeyRanks[idx] || ''}" placeholder="?">
                  </td>
                `).join('')}
              </tr>
            </table>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="btn-primary" id="checkKeyOrderBtn">Check Key Order ✓</button>
          </div>
        </div>
      `;
    }

    // Encrypt Step 2: Create the Encryption Grid
    renderEncryptStep2(state) {
      const dims = state.dims;
      let gridRowsHtml = '';

      for (let r = 0; r < dims.numRows; r++) {
        gridRowsHtml += `<tr>`;
        for (let c = 0; c < state.key.length; c++) {
          const val = state.userGrid[r] && state.userGrid[r][c] ? state.userGrid[r][c] : '';
          gridRowsHtml += `
            <td>
              <input type="text" maxlength="1" class="grid-cell-input" data-row="${r}" data-col="${c}" value="${val}">
            </td>
          `;
        }
        gridRowsHtml += `</tr>`;
      }

      return `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">STEP 2 OF 5</span>
              <h2 style="font-size: 1.25rem;">Create the Grid & Enter Plaintext</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Points: +20</span>
          </div>

          <p class="step-instruction">
            Enter the message <strong>"${state.plaintext}"</strong> into the grid from <strong>LEFT → RIGHT, row by row</strong>.
          </p>

          <div class="interactive-grid-wrapper">
            <table class="interactive-grid">
              <thead>
                <tr>
                  ${state.key.split('').map((char, c) => `
                    <th class="grid-key-header theme-col-${c % 7}">
                      ${char}
                      <div style="font-size: 0.7rem; font-weight: normal; opacity: 0.85;">Rank ${state.ranks[c]}</div>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${gridRowsHtml}
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Tip: Typing automatically advances to the next cell!</span>
            <button class="btn-primary" id="checkGridBtn">Check Grid ✓</button>
          </div>
        </div>
      `;
    }

    // Encrypt Step 3: Handle Incomplete Row / Padding
    renderEncryptStep3(state) {
      const dims = state.dims;
      const isPerfect = dims.remainder === 0;

      return `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">STEP 3 OF 5</span>
              <h2 style="font-size: 1.25rem;">Handle Empty Cells on the Final Row</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Points: +10</span>
          </div>

          <p class="step-instruction">
            Teacher Question: <strong>Does the message completely fill the final row?</strong>
          </p>

          <div style="display: flex; gap: 1rem; margin: 1rem 0;">
            <button class="btn-secondary" id="answerFullYesBtn" style="padding: 0.75rem 1.5rem; font-size: 1rem;">Yes, it is completely full</button>
            <button class="btn-secondary" id="answerFullNoBtn" style="padding: 0.75rem 1.5rem; font-size: 1rem;">No, the last row is incomplete</button>
          </div>

          <div id="paddingChoiceArea" style="display: none; background: var(--bg-input); border-radius: var(--radius-md); padding: 1.25rem; border: 1px solid #cbd5e1; margin-top: 1rem;">
            <h4 style="color: var(--text-main); margin-bottom: 0.5rem;">How would you like to handle the empty cells?</h4>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
              Depending on the cryptographic convention:
              <br>• <strong>Padding:</strong> Fill empty slots with a padding character (such as <code>'X'</code>) to make the grid completely rectangular.
              <br>• <strong>No Padding:</strong> Leave empty slots blank (resulting in irregular/short columns).
            </p>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn-primary" id="choosePadXBtn">Pad with 'X'</button>
              <button class="btn-secondary" id="chooseNoPadBtn">Leave Unpadded (No Padding)</button>
            </div>
          </div>
        </div>
      `;
    }

    // Encrypt Step 4: Read Columns in Key Order
    renderEncryptStep4(state) {
      const enc = Cipher.encryptColumnar(state.plaintext, state.key, state.usePadding, state.padChar);
      const nextRank = state.selectedColumns.length + 1;

      return `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">STEP 4 OF 5</span>
              <h2 style="font-size: 1.25rem;">Read Columns in Key Order</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Points: +20</span>
          </div>

          <p class="step-instruction">
            Teacher Question: <strong>Which column should we read next?</strong>
            <br>Click the column headers in alphabetical order (Current needed: <strong>Rank ${nextRank} of ${state.key.length}</strong>).
          </p>

          <div class="column-read-grid">
            ${enc.columnsData.map((col, idx) => {
              const isSelected = state.selectedColumns.includes(idx);
              const colThemeClass = `theme-col-${idx % 7}`;

              return `
                <div class="column-card ${colThemeClass} ${isSelected ? 'col-selected' : ''}" data-col="${idx}">
                  <div class="column-card-header">
                    <span>${col.keyChar}</span>
                    <span style="font-size: 0.75rem; opacity: 0.9;">Rank ${col.rank}</span>
                  </div>
                  ${col.letters.map(letter => `
                    <div class="column-card-cell">${letter}</div>
                  `).join('')}
                </div>
              `;
            }).join('')}
          </div>

          <div class="construction-tray">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">
              <span>CIPHERTEXT BEING CONSTRUCTED:</span>
              <span>${state.constructedCiphertext.length} / ${enc.ciphertext.length} Letters</span>
            </div>
            <div class="construction-slots">
              ${state.constructedCiphertext.split('').map(char => `<span class="cipher-chip">${char}</span>`).join('')}
              ${state.constructedCiphertext.length === 0 ? `<span style="color: var(--text-muted); font-size: 0.9rem;">Click the column with Rank 1 to begin...</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // Encrypt Step 5: Final Ciphertext & Summary
    renderEncryptStep5(state) {
      const enc = Cipher.encryptColumnar(state.plaintext, state.key, state.usePadding, state.padChar);

      return `
        <div class="step-card" style="border-color: var(--success-border); background: #ffffff;">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge" style="background: var(--success-bg); color: var(--success); border-color: var(--success);">STEP 5 OF 5 // COMPLETED</span>
              <h2 style="font-size: 1.3rem; color: #065f46;">🎉 Encryption Complete!</h2>
            </div>
            <span style="font-weight: 800; color: var(--success);">+30 Points</span>
          </div>

          <div style="background: var(--bg-input); border-radius: var(--radius-md); padding: 1.25rem; margin: 1rem 0; font-size: 1.05rem; line-height: 1.8;">
            <div>Your Ciphertext: <strong style="color: var(--primary); letter-spacing: 0.1em;">${state.constructedCiphertext}</strong></div>
            <div>Correct Ciphertext: <strong style="color: #065f46; letter-spacing: 0.1em;">${enc.ciphertext}</strong></div>
          </div>

          <div class="feedback-box success">
            <span style="font-size: 1.3rem;">🎓</span>
            <div>
              <strong>Teacher's Rule Recap:</strong>
              <blockquote style="margin-top: 0.35rem; font-style: italic;">
                Encryption = Write the plaintext row-by-row → Read the columns according to the alphabetical order of the key.
              </blockquote>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap;">
            <button class="btn-secondary" id="restartEncryptBtn">Try Another Challenge</button>
            <button class="btn-primary" id="proceedToDecryptBtn">Now Try Decryption →</button>
          </div>
        </div>
      `;
    }

    // Attach Event Listeners for Encrypt Mode
    attachEncryptListeners(state) {
      if (state.encryptStep === 1) {
        const inputs = document.querySelectorAll('.key-rank-input');
        inputs.forEach((input, idx) => {
          input.addEventListener('input', () => {
            this.audio.playTyping();
            if (input.value && idx < inputs.length - 1) {
              inputs[idx + 1].focus();
            }
          });
        });

        const checkBtn = document.getElementById('checkKeyOrderBtn');
        if (checkBtn) {
          checkBtn.addEventListener('click', () => {
            const ranks = Array.from(inputs).map(inp => inp.value.trim());
            this.game.checkKeyOrder(ranks);
          });
        }
      } else if (state.encryptStep === 2) {
        const cellInputs = document.querySelectorAll('.grid-cell-input');
        cellInputs.forEach((input, idx) => {
          input.addEventListener('input', (e) => {
            this.audio.playTyping();
            input.value = input.value.toUpperCase();
            if (input.value && idx < cellInputs.length - 1) {
              cellInputs[idx + 1].focus();
            }
          });

          input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
              cellInputs[idx - 1].focus();
            }
          });
        });

        const checkGridBtn = document.getElementById('checkGridBtn');
        if (checkGridBtn) {
          checkGridBtn.addEventListener('click', () => {
            const gridData = [];
            const dims = state.dims;
            for (let r = 0; r < dims.numRows; r++) {
              const row = [];
              for (let c = 0; c < state.key.length; c++) {
                const el = document.querySelector(`.grid-cell-input[data-row="${r}"][data-col="${c}"]`);
                row.push(el ? el.value.trim() : '');
              }
              gridData.push(row);
            }
            this.game.checkGridEntry(gridData);
          });
        }
      } else if (state.encryptStep === 3) {
        const yesBtn = document.getElementById('answerFullYesBtn');
        const noBtn = document.getElementById('answerFullNoBtn');
        const padArea = document.getElementById('paddingChoiceArea');

        if (yesBtn) {
          yesBtn.addEventListener('click', () => {
            this.game.handleEmptyCellsDecision('yes', 'none');
          });
        }

        if (noBtn) {
          noBtn.addEventListener('click', () => {
            const dims = state.dims;
            if (dims.remainder === 0) {
              this.game.handleEmptyCellsDecision('no', 'none');
            } else {
              if (padArea) padArea.style.display = 'block';
            }
          });
        }

        const padXBtn = document.getElementById('choosePadXBtn');
        if (padXBtn) {
          padXBtn.addEventListener('click', () => {
            this.game.handleEmptyCellsDecision('no', 'pad', 'X');
          });
        }

        const noPadBtn = document.getElementById('chooseNoPadBtn');
        if (noPadBtn) {
          noPadBtn.addEventListener('click', () => {
            this.game.handleEmptyCellsDecision('no', 'nopad');
          });
        }
      } else if (state.encryptStep === 4) {
        document.querySelectorAll('.column-card').forEach(card => {
          card.addEventListener('click', () => {
            const colIdx = parseInt(card.getAttribute('data-col'), 10);
            this.game.selectColumnInKeyOrder(colIdx);
          });
        });
      } else if (state.encryptStep === 5) {
        const restartBtn = document.getElementById('restartEncryptBtn');
        if (restartBtn) {
          restartBtn.addEventListener('click', () => this.game.initChallenge());
        }

        const decryptBtn = document.getElementById('proceedToDecryptBtn');
        if (decryptBtn) {
          decryptBtn.addEventListener('click', () => this.game.setMode('decrypt'));
        }
      }
    }

    // ==========================================
    // DECRYPTION CHALLENGE RENDERING (4 STEPS)
    // ==========================================
    renderDecryptMode(container, state) {
      let stepHtml = '';

      if (state.decryptStep === 1) {
        stepHtml = this.renderDecryptStep1(state);
      } else if (state.decryptStep === 2) {
        stepHtml = this.renderDecryptStep2(state);
      } else if (state.decryptStep === 3) {
        stepHtml = this.renderDecryptStep3(state);
      } else if (state.decryptStep === 4) {
        stepHtml = this.renderDecryptStep4(state);
      }

      container.innerHTML = stepHtml;
      this.attachDecryptListeners(state);
    }

    // Decrypt Step 1: Key Order
    renderDecryptStep1(state) {
      return `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">STEP 1 OF 4</span>
              <h2 style="font-size: 1.25rem;">Decryption Step 1: Determine Key Order</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Points: +10</span>
          </div>

          <p class="step-instruction">
            Just like in encryption, first establish the <strong>alphabetical order (1, 2, 3...)</strong> of the key letters:
          </p>

          <div class="key-order-table-wrapper">
            <table class="key-order-table">
              <tr>
                <td style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-align: right; padding-right: 0.5rem;">Key:</td>
                ${state.key.split('').map(char => `<td class="key-box-cell">${char}</td>`).join('')}
              </tr>
              <tr>
                <td style="font-size: 0.8rem; font-weight: 700; color: var(--primary); text-align: right; padding-right: 0.5rem;">Order:</td>
                ${state.key.split('').map((_, idx) => `
                  <td class="order-input-cell">
                    <input type="text" maxlength="2" class="decrypt-key-rank-input" data-col="${idx}" placeholder="?">
                  </td>
                `).join('')}
              </tr>
            </table>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button class="btn-primary" id="checkDecryptKeyOrderBtn">Check Key Order ✓</button>
          </div>
        </div>
      `;
    }

    // Decrypt Step 2: Calculate Rows
    renderDecryptStep2(state) {
      return `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">STEP 2 OF 4</span>
              <h2 style="font-size: 1.25rem;">Calculate the Number of Rows</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Points: +15</span>
          </div>

          <div style="background: var(--bg-input); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid #cbd5e1;">
            <div>Ciphertext: <strong style="color: var(--primary); letter-spacing: 0.08em;">${state.ciphertext}</strong> (Length: ${state.ciphertext.length})</div>
            <div style="margin-top: 0.35rem;">Number of Columns (Key length): <strong>${state.key.length}</strong></div>
          </div>

          <p class="step-instruction" style="margin-top: 1rem;">
            Teacher Question: <strong>How many rows will the grid have?</strong>
          </p>

          <div style="display: flex; gap: 0.75rem; align-items: center; margin: 0.75rem 0;">
            <label style="font-weight: 700;">Rows:</label>
            <input type="number" id="userRowCountInput" min="1" max="20" style="width: 80px; height: 42px; text-align: center; font-size: 1.2rem; font-weight: 800; border: 2px solid #cbd5e1; border-radius: var(--radius-sm);">
            <button class="btn-primary" id="checkRowCountBtn">Check Rows ✓</button>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);">
            Formula: <code>Rows = Math.ceil(Ciphertext Length / Number of Columns)</code>.
          </div>
        </div>
      `;
    }

    // Decrypt Step 3: Fill Columns by Key Order
    renderDecryptStep3(state) {
      const dec = Cipher.decryptColumnar(state.ciphertext, state.key, state.usePadding);
      const targetChunkObj = dec.chunksByRank.find(c => c.rank === state.currentDecryptRank);
      const activeColIdx = targetChunkObj ? targetChunkObj.colIndex : 0;
      const numRows = state.userRowCount || dec.numRows;

      let gridRowsHtml = '';
      for (let r = 0; r < numRows; r++) {
        gridRowsHtml += `<tr>`;
        for (let c = 0; c < state.key.length; c++) {
          const isCurrentCol = c === activeColIdx;
          const letterVal = state.userDecryptGrid[r] && state.userDecryptGrid[r][c] ? state.userDecryptGrid[r][c] : '';
          gridRowsHtml += `
            <td>
              <input type="text" maxlength="1" class="decrypt-cell-input ${isCurrentCol ? 'cell-active-col' : ''}" 
                     data-row="${r}" data-col="${c}" value="${letterVal}" ${!isCurrentCol ? 'disabled' : ''}>
            </td>
          `;
        }
        gridRowsHtml += `</tr>`;
      }

      return `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">STEP 3 OF 4</span>
              <h2 style="font-size: 1.25rem;">Fill Grid Column-by-Column</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Points: +25</span>
          </div>

          <div class="feedback-box info">
            <span style="font-size: 1.25rem;">ℹ️</span>
            <div>
              <strong>Rule:</strong> During decryption, ciphertext is placed <strong>COLUMN-BY-COLUMN</strong> according to the alphabetical order of the key.
              <br>Now filling: <strong>Rank ${state.currentDecryptRank} → Column '${state.key[activeColIdx]}' (Col ${activeColIdx + 1})</strong>.
            </div>
          </div>

          <div style="margin: 0.5rem 0; font-size: 0.95rem;">
            Ciphertext: <strong style="letter-spacing: 0.08em; color: var(--primary);">${state.ciphertext}</strong>
          </div>

          <div class="interactive-grid-wrapper">
            <table class="interactive-grid">
              <thead>
                <tr>
                  ${state.key.split('').map((char, c) => `
                    <th class="grid-key-header ${c === activeColIdx ? 'active-header' : ''}" style="${c === activeColIdx ? 'outline: 3px solid var(--primary); transform: scale(1.05);' : ''}">
                      ${char}
                      <div style="font-size: 0.7rem; font-weight: normal;">Rank ${state.ranks[c]}</div>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${gridRowsHtml}
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="btn-primary" id="checkDecryptColBtn">Check Column ✓</button>
          </div>
        </div>
      `;
    }

    // Decrypt Step 4: Read Plaintext Row-by-Row
    renderDecryptStep4(state) {
      return `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">STEP 4 OF 4</span>
              <h2 style="font-size: 1.25rem;">Read Plaintext Row-by-Row</h2>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Points: +30</span>
          </div>

          <p class="step-instruction">
            Teacher Question: <strong>Now read the completed grid from LEFT → RIGHT, row by row. What is the plaintext?</strong>
          </p>

          <div style="margin: 1rem 0;">
            <input type="text" id="userPlaintextSubmissionInput" placeholder="Enter recovered plaintext..." 
                   style="width: 100%; max-width: 480px; height: 48px; padding: 0 1rem; font-size: 1.15rem; font-weight: 700; text-transform: uppercase; border: 2px solid #cbd5e1; border-radius: var(--radius-sm);">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="btn-primary" id="submitPlaintextBtn">Submit Recovered Plaintext ✓</button>
          </div>
        </div>
      `;
    }

    // Attach Decrypt Event Listeners
    attachDecryptListeners(state) {
      if (state.decryptStep === 1) {
        const inputs = document.querySelectorAll('.decrypt-key-rank-input');
        inputs.forEach((inp, idx) => {
          inp.addEventListener('input', () => {
            this.audio.playTyping();
            if (inp.value && idx < inputs.length - 1) inputs[idx + 1].focus();
          });
        });

        const checkBtn = document.getElementById('checkDecryptKeyOrderBtn');
        if (checkBtn) {
          checkBtn.addEventListener('click', () => {
            const ranks = Array.from(inputs).map(inp => inp.value.trim());
            this.game.checkDecryptKeyOrder(ranks);
          });
        }
      } else if (state.decryptStep === 2) {
        const btn = document.getElementById('checkRowCountBtn');
        const inp = document.getElementById('userRowCountInput');
        if (btn && inp) {
          btn.addEventListener('click', () => {
            this.game.checkRowCount(inp.value);
          });
        }
      } else if (state.decryptStep === 3) {
        const dec = Cipher.decryptColumnar(state.ciphertext, state.key, state.usePadding);
        const targetChunkObj = dec.chunksByRank.find(c => c.rank === state.currentDecryptRank);
        const colIdx = targetChunkObj ? targetChunkObj.colIndex : 0;
        const cellInputs = document.querySelectorAll(`.decrypt-cell-input[data-col="${colIdx}"]`);

        cellInputs.forEach((inp, idx) => {
          inp.addEventListener('input', () => {
            this.audio.playTyping();
            inp.value = inp.value.toUpperCase();
            if (inp.value && idx < cellInputs.length - 1) {
              cellInputs[idx + 1].focus();
            }
          });
        });

        const checkColBtn = document.getElementById('checkDecryptColBtn');
        if (checkColBtn) {
          checkColBtn.addEventListener('click', () => {
            const letters = Array.from(cellInputs).map(i => i.value.trim());
            this.game.checkDecryptColumn(colIdx, letters);
          });
        }
      } else if (state.decryptStep === 4) {
        const submitBtn = document.getElementById('submitPlaintextBtn');
        const inp = document.getElementById('userPlaintextSubmissionInput');
        if (submitBtn && inp) {
          submitBtn.addEventListener('click', () => {
            this.game.checkPlaintextSubmission(inp.value);
          });
        }
      }
    }

    // ==========================================
    // CUSTOM CHALLENGE TAB RENDERING
    // ==========================================
    renderCustomMode(container, state) {
      container.innerHTML = `
        <div class="step-card">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-badge">CUSTOM</span>
              <h2 style="font-size: 1.25rem;">Create Your Own Challenge</h2>
            </div>
          </div>

          <p class="step-instruction">
            Teachers and students can type any secret message and key below to practice custom challenges:
          </p>

          <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 500px; margin: 1rem 0;">
            <div>
              <label style="font-weight: 700; font-size: 0.9rem;">Your Secret Message:</label>
              <input type="text" id="customPlaintextInput" value="${state.plaintext}" placeholder="e.g. MEETMEATNOON"
                     style="width: 100%; height: 42px; padding: 0 0.75rem; text-transform: uppercase; font-size: 1rem; font-weight: 700; border: 2px solid #cbd5e1; border-radius: var(--radius-sm); margin-top: 0.25rem;">
            </div>

            <div>
              <label style="font-weight: 700; font-size: 0.9rem;">Your Secret Key:</label>
              <input type="text" id="customKeyInput" value="${state.key}" placeholder="e.g. ZEBRA"
                     style="width: 100%; height: 42px; padding: 0 0.75rem; text-transform: uppercase; font-size: 1rem; font-weight: 700; border: 2px solid #cbd5e1; border-radius: var(--radius-sm); margin-top: 0.25rem;">
            </div>

            <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
              <button class="btn-primary" id="launchCustomEncryptBtn">Start Custom Encryption →</button>
              <button class="btn-secondary" id="launchCustomDecryptBtn">Start Custom Decryption →</button>
            </div>
          </div>
        </div>
      `;

      const encBtn = document.getElementById('launchCustomEncryptBtn');
      if (encBtn) {
        encBtn.addEventListener('click', () => {
          const pt = document.getElementById('customPlaintextInput').value;
          const k = document.getElementById('customKeyInput').value;
          this.game.setCustomChallenge(pt, k);
          this.game.setMode('encrypt');
        });
      }

      const decBtn = document.getElementById('launchCustomDecryptBtn');
      if (decBtn) {
        decBtn.addEventListener('click', () => {
          const pt = document.getElementById('customPlaintextInput').value;
          const k = document.getElementById('customKeyInput').value;
          this.game.setCustomChallenge(pt, k);
          this.game.setMode('decrypt');
        });
      }
    }

    // ==========================================
    // WORKED EXAMPLE MODAL
    // ==========================================
    openWorkedExampleModal() {
      const modal = document.getElementById('workedExampleModal');
      if (!modal) return;
      this.game.requestWorkedExample();
      modal.classList.add('active');
    }

    renderWorkedExampleContent(ex) {
      const container = document.getElementById('workedExampleContentArea');
      if (!container) return;

      container.innerHTML = `
        <div style="font-size: 0.95rem; line-height: 1.6;">
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">Step-by-Step Worked Solution</h3>
          <p><strong>Message:</strong> ${ex.plaintext} | <strong>Key:</strong> ${ex.key}</p>

          <h4 style="margin-top: 1rem; color: var(--text-main);">1. Key Alphabetical Ordering:</h4>
          <ul style="padding-left: 1.25rem; font-size: 0.9rem;">
            ${ex.rankExplanations.map(e => `<li>${e}</li>`).join('')}
          </ul>

          <h4 style="margin-top: 1rem; color: var(--text-main);">2. Encryption Grid Layout:</h4>
          <div style="overflow-x: auto; margin: 0.5rem 0;">
            <table class="interactive-grid">
              <thead>
                <tr>
                  ${ex.key.split('').map((c, i) => `
                    <th class="grid-key-header theme-col-${i % 7}">${c} (Rank ${ex.ranks[i]})</th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${ex.grid.map(row => `
                  <tr>
                    ${row.map(cell => `<td class="column-card-cell" style="text-align: center;">${cell || '—'}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <h4 style="margin-top: 1rem; color: var(--text-main);">3. Column Readout Sequence:</h4>
          <div style="font-size: 0.9rem; background: var(--bg-input); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid #cbd5e1;">
            ${ex.orderedColumns.map(col => `
              <div>• Rank ${col.rank} (Column '${col.keyChar}'): <strong>${col.chunk}</strong></div>
            `).join('')}
          </div>

          <h4 style="margin-top: 1rem; color: #065f46;">Resulting Ciphertext:</h4>
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary); letter-spacing: 0.1em; background: var(--success-bg); padding: 0.5rem 0.75rem; border-radius: 4px; display: inline-block;">
            ${ex.ciphertext}
          </div>
        </div>
      `;
    }
  }

  return {
    ClassroomAudio,
    UIController
  };
}));
