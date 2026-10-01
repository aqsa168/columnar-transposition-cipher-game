/**
 * game.js - Educational Challenge State Machine
 * For "Columnar Transposition Cipher - Encrypt & Decrypt Challenge"
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./cipher.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./cipher.js'));
  } else {
    root.Game = factory(root.Cipher);
  }
}(typeof self !== 'undefined' ? self : this, function (Cipher) {
  'use strict';

  class ChallengeManager {
    constructor() {
      this.mode = 'learn'; // 'learn' | 'encrypt' | 'decrypt' | 'custom'
      this.difficulty = 'easy'; // 'easy' | 'medium' | 'hard'
      
      // Scoring & Stats
      this.score = 0;
      this.correctCount = 0;
      this.incorrectCount = 0;
      this.hintsUsed = 0;
      this.attemptsInStep = 0;
      this.audioEnabled = true;

      // Current Challenge Data
      this.plaintext = "SECRETMEN";
      this.key = "CAT";
      this.usePadding = false;
      this.padChar = 'X';
      this.ciphertext = "";

      // Step States
      this.encryptStep = 1; // 1 to 5
      this.decryptStep = 1; // 1 to 4
      this.learnStep = 0; // 0 to 5

      // Working inputs
      this.userKeyRanks = [];
      this.userGrid = [];
      this.selectedColumns = [];
      this.constructedCiphertext = '';
      this.userRowCount = null;
      this.currentDecryptRank = 1;
      this.userDecryptGrid = [];
      this.userRecoveredPlaintext = '';

      // Listeners
      this.listeners = {
        onStateChange: [],
        onFeedback: [],
        onWorkedExample: []
      };

      this.initChallenge('easy');
    }

    addListener(event, fn) {
      if (this.listeners[event]) {
        this.listeners[event].push(fn);
      }
    }

    emit(event, ...args) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(fn => fn(...args));
      }
    }

    setMode(newMode) {
      if (['learn', 'encrypt', 'decrypt', 'custom'].includes(newMode)) {
        this.mode = newMode;
        if (newMode === 'encrypt' || newMode === 'decrypt') {
          this.initChallenge(this.difficulty);
        }
        this.emit('onStateChange', this.getPublicState());
      }
    }

    setDifficulty(diff) {
      if (['easy', 'medium', 'hard'].includes(diff)) {
        this.difficulty = diff;
        this.initChallenge(diff);
      }
    }

    initChallenge(difficulty = this.difficulty) {
      this.difficulty = difficulty;
      const challenge = Cipher.generateRandomChallenge(difficulty);
      this.setCustomChallenge(challenge.plaintext, challenge.key);
    }

    setCustomChallenge(plaintext, key) {
      this.plaintext = Cipher.normalizeText(plaintext) || "SECRETMEN";
      this.key = Cipher.normalizeText(key) || "CAT";
      this.usePadding = false;
      this.padChar = 'X';

      // Pre-compute expected cipher result
      const enc = Cipher.encryptColumnar(this.plaintext, this.key, this.usePadding, this.padChar);
      this.ciphertext = enc.ciphertext;

      // Reset Encrypt Step
      this.encryptStep = 1;
      this.userKeyRanks = new Array(this.key.length).fill('');
      this.userGrid = [];
      this.selectedColumns = [];
      this.constructedCiphertext = '';

      // Reset Decrypt Step
      this.decryptStep = 1;
      this.userRowCount = null;
      this.currentDecryptRank = 1;
      this.userDecryptGrid = [];
      this.userRecoveredPlaintext = '';

      // Reset Attempts
      this.attemptsInStep = 0;

      this.emit('onStateChange', this.getPublicState());
    }

    toggleAudio() {
      this.audioEnabled = !this.audioEnabled;
      this.emit('onStateChange', this.getPublicState());
    }

    // ==========================================
    // ENCRYPTION CHALLENGE LOGIC (5 Steps)
    // ==========================================

    // Step 1: Check Key Order
    checkKeyOrder(enteredRanks) {
      this.attemptsInStep++;
      this.userKeyRanks = enteredRanks;
      const verification = Cipher.verifyKeyRanks(enteredRanks, this.key);

      if (verification.allCorrect) {
        this.correctCount++;
        this.score += 10;
        this.encryptStep = 2;
        this.attemptsInStep = 0;
        this.initEmptyGridForUser();

        this.emit('onFeedback', {
          type: 'success',
          step: 1,
          message: `Great job! You correctly ordered the key letters. Now let's create the grid and write the message row-by-row.`
        });
      } else {
        this.incorrectCount++;
        const mistakes = verification.results.filter(r => !r.isCorrect);
        const explanation = mistakes.map(m => m.explanation).join(' ');

        this.emit('onFeedback', {
          type: 'error',
          step: 1,
          message: `Some numbers are incorrect: ${explanation}`
        });
      }

      this.emit('onStateChange', this.getPublicState());
      return verification;
    }

    initEmptyGridForUser() {
      const dims = Cipher.calculateDimensions(this.plaintext.length, this.key.length, this.usePadding, this.padChar);
      this.userGrid = [];
      for (let r = 0; r < dims.numRows; r++) {
        this.userGrid.push(new Array(this.key.length).fill(''));
      }
    }

    // Step 2: Check Grid Entry
    checkGridEntry(gridData) {
      this.attemptsInStep++;
      this.userGrid = gridData;
      const expected = Cipher.buildEncryptionGrid(this.plaintext, this.key, this.usePadding, this.padChar);
      const dims = expected.dims;

      let allCorrect = true;
      let firstError = null;

      for (let r = 0; r < dims.numRows; r++) {
        for (let c = 0; c < this.key.length; c++) {
          const expChar = expected.grid[r][c];
          if (expChar !== null) {
            const userChar = (gridData[r] && gridData[r][c] ? gridData[r][c] : '').toUpperCase().trim();
            if (userChar !== expChar) {
              allCorrect = false;
              if (!firstError) {
                firstError = {
                  row: r + 1,
                  col: c + 1,
                  entered: userChar,
                  expected: expChar
                };
              }
            }
          }
        }
      }

      if (allCorrect) {
        this.correctCount++;
        this.score += 20;
        this.encryptStep = 3;
        this.attemptsInStep = 0;

        this.emit('onFeedback', {
          type: 'success',
          step: 2,
          message: `Correct! The message is written into the grid from left to right, row by row.`
        });
      } else {
        this.incorrectCount++;
        this.emit('onFeedback', {
          type: 'error',
          step: 2,
          message: `Check Row ${firstError.row}, Column ${firstError.col}. Expected letter '${firstError.expected}', but found '${firstError.entered || '(empty)'}'. Remember to fill row-by-row from left to right.`
        });
      }

      this.emit('onStateChange', this.getPublicState());
      return allCorrect;
    }

    // Step 3: Handle Incomplete Rows / Padding
    handleEmptyCellsDecision(userAnswersFull, userPaddingChoice, padChar = 'X') {
      const dims = Cipher.calculateDimensions(this.plaintext.length, this.key.length, false);
      const actuallyFull = dims.remainder === 0;

      if (actuallyFull) {
        if (userAnswersFull === 'yes') {
          this.correctCount++;
          this.score += 10;
          this.encryptStep = 4;
          this.emit('onFeedback', {
            type: 'success',
            step: 3,
            message: `Exactly! The message length (${this.plaintext.length}) divides evenly into ${this.key.length} columns. Every row is complete.`
          });
        } else {
          this.incorrectCount++;
          this.emit('onFeedback', {
            type: 'error',
            step: 3,
            message: `Notice that ${this.plaintext.length} letters divided by ${this.key.length} columns equals exactly ${dims.numRows} complete rows. So the final row IS full!`
          });
        }
      } else {
        if (userAnswersFull === 'no') {
          this.correctCount++;
          this.score += 10;
          this.usePadding = userPaddingChoice === 'pad';
          this.padChar = padChar.toUpperCase() || 'X';

          // Re-calculate expected ciphertext if padding is chosen
          const enc = Cipher.encryptColumnar(this.plaintext, this.key, this.usePadding, this.padChar);
          this.ciphertext = enc.ciphertext;

          this.encryptStep = 4;
          this.emit('onFeedback', {
            type: 'success',
            step: 3,
            message: `Correct deduction! The last row only has ${dims.remainder} letters out of ${this.key.length} columns. ${this.usePadding ? `Empty cells padded with '${this.padChar}'.` : `Proceeding with unpadded convention.`}`
          });
        } else {
          this.incorrectCount++;
          this.emit('onFeedback', {
            type: 'error',
            step: 3,
            message: `Look at the last row: there are only ${dims.remainder} letters, leaving ${dims.paddingNeeded} cells empty! So the final row is NOT completely full.`
          });
        }
      }

      this.emit('onStateChange', this.getPublicState());
    }

    // Step 4: Click Columns in Key Rank Order
    selectColumnInKeyOrder(colIndex) {
      if (this.encryptStep !== 4) return;

      const ranks = Cipher.getKeyRanks(this.key);
      const expectedRank = this.selectedColumns.length + 1;
      const actualRank = ranks[colIndex];

      if (actualRank === expectedRank) {
        this.selectedColumns.push(colIndex);
        const enc = Cipher.encryptColumnar(this.plaintext, this.key, this.usePadding, this.padChar);
        const col = enc.columnsData[colIndex];
        this.constructedCiphertext += col.letters.join('');

        this.emit('onFeedback', {
          type: 'success',
          step: 4,
          message: `Correct! Column '${col.keyChar}' has Rank ${actualRank}. Added '${col.letters.join('')}' to the ciphertext.`
        });

        if (this.selectedColumns.length === this.key.length) {
          this.correctCount++;
          this.score += 20;
          this.encryptStep = 5;
          this.emit('onFeedback', {
            type: 'success',
            step: 5,
            message: `Outstanding! You have assembled the complete ciphertext by reading down the columns in alphabetical key order!`
          });
        }
      } else {
        this.incorrectCount++;
        const targetColIdx = ranks.indexOf(expectedRank);
        this.emit('onFeedback', {
          type: 'error',
          step: 4,
          message: `Mistake! Next in alphabetical order is Rank ${expectedRank} (Column '${this.key[targetColIdx]}'), but you clicked Column '${this.key[colIndex]}' which is Rank ${actualRank}.`
        });
      }

      this.emit('onStateChange', this.getPublicState());
    }

    // ==========================================
    // DECRYPTION CHALLENGE LOGIC (4 Steps)
    // ==========================================

    // Decrypt Step 1: Check Key Order
    checkDecryptKeyOrder(enteredRanks) {
      this.attemptsInStep++;
      const verification = Cipher.verifyKeyRanks(enteredRanks, this.key);

      if (verification.allCorrect) {
        this.correctCount++;
        this.score += 10;
        this.decryptStep = 2;
        this.attemptsInStep = 0;
        this.emit('onFeedback', {
          type: 'success',
          step: 1,
          message: `Correct! The key order is established. Next, let's calculate the number of rows needed for the grid.`
        });
      } else {
        this.incorrectCount++;
        this.emit('onFeedback', {
          type: 'error',
          step: 1,
          message: `Some ranks are incorrect. Alphabetical order determines the reading and filling sequence.`
        });
      }

      this.emit('onStateChange', this.getPublicState());
      return verification;
    }

    // Decrypt Step 2: Calculate Row Count
    checkRowCount(userRows) {
      this.attemptsInStep++;
      const expectedRows = Math.ceil(this.ciphertext.length / this.key.length);
      const isCorrect = parseInt(userRows, 10) === expectedRows;

      if (isCorrect) {
        this.correctCount++;
        this.score += 15;
        this.userRowCount = expectedRows;
        this.decryptStep = 3;
        this.currentDecryptRank = 1;
        this.initDecryptGridForUser(expectedRows);

        this.emit('onFeedback', {
          type: 'success',
          step: 2,
          message: `Correct! ${this.ciphertext.length} ciphertext letters / ${this.key.length} columns = ${expectedRows} rows.`
        });
      } else {
        this.incorrectCount++;
        this.emit('onFeedback', {
          type: 'error',
          step: 2,
          message: `Formula: Rows = Math.ceil(Ciphertext Length / Columns). Here: ceil(${this.ciphertext.length} / ${this.key.length}) = ${expectedRows} rows.`
        });
      }

      this.emit('onStateChange', this.getPublicState());
      return isCorrect;
    }

    initDecryptGridForUser(numRows) {
      this.userDecryptGrid = [];
      for (let r = 0; r < numRows; r++) {
        this.userDecryptGrid.push(new Array(this.key.length).fill(''));
      }
    }

    // Decrypt Step 3: Check Current Column Fill
    checkDecryptColumn(colIndex, lettersEntered) {
      this.attemptsInStep++;
      const dec = Cipher.decryptColumnar(this.ciphertext, this.key, this.usePadding);
      const targetChunkObj = dec.chunksByRank.find(c => c.rank === this.currentDecryptRank);

      if (colIndex !== targetChunkObj.colIndex) {
        this.incorrectCount++;
        this.emit('onFeedback', {
          type: 'error',
          step: 3,
          message: `Rank ${this.currentDecryptRank} belongs to Column '${this.key[targetChunkObj.colIndex]}' (Column ${targetChunkObj.colIndex + 1}), not Column ${colIndex + 1}!`
        });
        return false;
      }

      const enteredStr = lettersEntered.map(l => (l || '').toUpperCase().trim()).join('');
      const expectedStr = targetChunkObj.chunk;

      if (enteredStr === expectedStr) {
        this.correctCount++;
        this.score += 15;

        // Store into user decrypt grid
        for (let r = 0; r < expectedStr.length; r++) {
          this.userDecryptGrid[r][colIndex] = expectedStr[r];
        }

        this.currentDecryptRank++;

        if (this.currentDecryptRank > this.key.length) {
          this.decryptStep = 4;
          this.emit('onFeedback', {
            type: 'success',
            step: 3,
            message: `All columns filled successfully! Now read the grid row-by-row to extract the original plaintext.`
          });
        } else {
          this.emit('onFeedback', {
            type: 'success',
            step: 3,
            message: `Column '${this.key[colIndex]}' (Rank ${targetChunkObj.rank}) filled correctly! Now fill Rank ${this.currentDecryptRank}.`
          });
        }
      } else {
        this.incorrectCount++;
        this.emit('onFeedback', {
          type: 'error',
          step: 3,
          message: `Incorrect letters for Column '${this.key[colIndex]}'. Expected '${expectedStr}', but received '${enteredStr}'.`
        });
      }

      this.emit('onStateChange', this.getPublicState());
      return enteredStr === expectedStr;
    }

    // Decrypt Step 4: Check Recovered Plaintext
    checkPlaintextSubmission(userText) {
      this.attemptsInStep++;
      const cleanUser = Cipher.normalizeText(userText);
      const expectedPlain = Cipher.normalizeText(this.plaintext);

      this.userRecoveredPlaintext = cleanUser;

      if (cleanUser === expectedPlain) {
        this.correctCount++;
        this.score += 30;

        this.emit('onFeedback', {
          type: 'success',
          step: 4,
          message: `Congratulations! You successfully decrypted the message: "${expectedPlain}"!`
        });
      } else {
        this.incorrectCount++;
        this.emit('onFeedback', {
          type: 'error',
          step: 4,
          message: `Not quite. Read across the rows from left to right: Row 1, then Row 2, then Row 3...`
        });
      }

      this.emit('onStateChange', this.getPublicState());
      return cleanUser === expectedPlain;
    }

    // --- HINT SYSTEM ---
    getHint() {
      this.hintsUsed++;
      this.score = Math.max(0, this.score - 5);
      const ranks = Cipher.getKeyRanks(this.key);

      let hint = "";
      if (this.mode === 'encrypt') {
        if (this.encryptStep === 1) {
          const { explanations } = Cipher.explainKeyRanks(this.key);
          hint = `Hint: Alphabetical ranking for key '${this.key}': ${explanations[0]}.`;
        } else if (this.encryptStep === 2) {
          hint = `Hint: Place '${this.plaintext[0]}' in Row 1 Col 1, '${this.plaintext[1]}' in Row 1 Col 2, and continue across the row.`;
        } else if (this.encryptStep === 3) {
          const dims = Cipher.calculateDimensions(this.plaintext.length, this.key.length, false);
          hint = `Hint: ${this.plaintext.length} letters % ${this.key.length} cols = ${dims.remainder}. If remainder is > 0, the final row has empty slots.`;
        } else if (this.encryptStep === 4) {
          const nextRank = this.selectedColumns.length + 1;
          const colIdx = ranks.indexOf(nextRank);
          hint = `Hint: Next is Rank ${nextRank} -> Column '${this.key[colIdx]}' (Column ${colIdx + 1}).`;
        }
      } else if (this.mode === 'decrypt') {
        if (this.decryptStep === 1) {
          hint = `Hint: Alphabetical order of letters in '${this.key}'.`;
        } else if (this.decryptStep === 2) {
          hint = `Hint: ${this.ciphertext.length} letters / ${this.key.length} columns = ${Math.ceil(this.ciphertext.length / this.key.length)} rows.`;
        } else if (this.decryptStep === 3) {
          const dec = Cipher.decryptColumnar(this.ciphertext, this.key, this.usePadding);
          const chunkObj = dec.chunksByRank.find(c => c.rank === this.currentDecryptRank);
          hint = `Hint: Next column to fill is Rank ${this.currentDecryptRank} ('${this.key[chunkObj.colIndex]}'). It receives letters: '${chunkObj.chunk}'.`;
        } else if (this.decryptStep === 4) {
          hint = `Hint: Read Row 1 from left to right, then Row 2, etc.`;
        }
      }

      this.emit('onStateChange', this.getPublicState());
      return hint;
    }

    // --- WORKED EXAMPLE MODAL ---
    requestWorkedExample() {
      const example = Cipher.generateWorkedExample(this.plaintext, this.key, this.usePadding, this.padChar);
      this.emit('onWorkedExample', example);
      return example;
    }

    getPublicState() {
      const ranks = Cipher.getKeyRanks(this.key);
      const dims = Cipher.calculateDimensions(this.plaintext.length, this.key.length, this.usePadding, this.padChar);
      const enc = Cipher.encryptColumnar(this.plaintext, this.key, this.usePadding, this.padChar);

      return {
        mode: this.mode,
        difficulty: this.difficulty,
        score: this.score,
        correctCount: this.correctCount,
        incorrectCount: this.incorrectCount,
        hintsUsed: this.hintsUsed,
        attemptsInStep: this.attemptsInStep,
        audioEnabled: this.audioEnabled,

        plaintext: this.plaintext,
        key: this.key,
        ranks,
        dims,
        usePadding: this.usePadding,
        padChar: this.padChar,
        ciphertext: this.ciphertext,
        expectedGrid: enc.grid,

        encryptStep: this.encryptStep,
        userKeyRanks: this.userKeyRanks,
        userGrid: this.userGrid,
        selectedColumns: this.selectedColumns,
        constructedCiphertext: this.constructedCiphertext,

        decryptStep: this.decryptStep,
        userRowCount: this.userRowCount,
        currentDecryptRank: this.currentDecryptRank,
        userDecryptGrid: this.userDecryptGrid,
        userRecoveredPlaintext: this.userRecoveredPlaintext
      };
    }
  }

  return {
    ChallengeManager
  };
}));
