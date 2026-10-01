/**
 * cipher.js - Core Cryptographic & Pedagogical Engine
 * For "Columnar Transposition Cipher - Encrypt & Decrypt Challenge"
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Cipher = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Student-Friendly Challenge Word Banks ---
  const CHALLENGE_POOLS = {
    easy: [
      { message: "SECRETMEN", key: "CAT" },
      { message: "MEETATDAWN", key: "BIRD" },
      { message: "HELPMEPLEASE", key: "STAR" },
      { message: "COMEHOMENOW", key: "LION" },
      { message: "SAVEOURSHIP", key: "BLUE" }
    ],
    medium: [
      { message: "MEETMEATNOON", key: "ZEBRA" },
      { message: "TREASUREISBURIED", key: "TIGER" },
      { message: "WEAREDISCOVERED", key: "ZEBRAS" },
      { message: "DEFENDTHECASTLE", key: "PLANET" },
      { message: "ATTACKFROMBEHIND", key: "SILVER" }
    ],
    hard: [
      { message: "DEFENDTHEEASTWALL", key: "BANANA" }, // Repeated A & N
      { message: "MOLEISPLANTEDATHEADQUARTERS", key: "TARGET" }, // Repeated T
      { message: "MISSIONACCOMPLISHEDNOW", key: "SUCCESS" }, // Repeated S & C
      { message: "SECRETOPERATIONUNDERWAY", key: "CARROT" }, // Repeated R
      { message: "SHUTDOWNALLCENTRALPOWERGRIDS", key: "OCTOPUS" } // Repeated O
    ]
  };

  /**
   * Normalizes text by converting to uppercase and stripping non-alphabetical characters.
   */
  function normalizeText(text) {
    if (typeof text !== 'string') return '';
    return text.toUpperCase().replace(/[^A-Z]/g, '');
  }

  /**
   * Computes 1-based alphabetical ranks for a key string.
   * Ties are broken strictly from left to right.
   * Example: "ZEBRA" -> [5, 2, 1, 4, 3]  (A=1, B=2, E=3, R=4, Z=5 -> wait! Let's check:
   *   A is 1st in alphabet -> rank 1
   *   B is 2nd in alphabet -> rank 2
   *   E is 3rd in alphabet -> rank 3
   *   R is 4th in alphabet -> rank 4
   *   Z is 5th in alphabet -> rank 5
   *   Key Z E B R A:
   *   Z -> rank 5
   *   E -> rank 3
   *   B -> rank 2
   *   R -> rank 4
   *   A -> rank 1
   * )
   */
  function getKeyRanks(key) {
    const cleanKey = normalizeText(key);
    if (!cleanKey) return [];

    const indexed = cleanKey.split('').map((char, index) => ({ char, index }));

    // Stable sort: alphabetical; if equal, original index left-to-right
    indexed.sort((a, b) => {
      if (a.char < b.char) return -1;
      if (a.char > b.char) return 1;
      return a.index - b.index;
    });

    const ranks = new Array(cleanKey.length);
    indexed.forEach((item, sortedIdx) => {
      ranks[item.index] = sortedIdx + 1;
    });

    return ranks;
  }

  /**
   * Generates step-by-step pedagogical explanation for the key ranks.
   */
  function explainKeyRanks(key) {
    const cleanKey = normalizeText(key);
    const ranks = getKeyRanks(cleanKey);
    const explanations = [];

    // Group letters by character to identify duplicates
    const counts = {};
    for (const c of cleanKey) counts[c] = (counts[c] || 0) + 1;

    cleanKey.split('').forEach((char, idx) => {
      const rank = ranks[idx];
      let exp = `'${char}' is assigned Rank ${rank}`;
      if (counts[char] > 1) {
        // Count which occurrence this is
        let occ = 0;
        for (let i = 0; i <= idx; i++) {
          if (cleanKey[i] === char) occ++;
        }
        exp += ` (it is occurrence #${occ} of '${char}', so ties are broken left-to-right)`;
      }
      explanations.push(exp);
    });

    return { ranks, explanations };
  }

  /**
   * Verifies the user's entered key ranks.
   * Returns per-index accuracy and explanations.
   */
  function verifyKeyRanks(userRanks, key) {
    const expected = getKeyRanks(key);
    const cleanKey = normalizeText(key);
    const results = [];
    let allCorrect = true;

    for (let i = 0; i < cleanKey.length; i++) {
      const userVal = parseInt(userRanks[i], 10);
      const expVal = expected[i];
      const isCorrect = userVal === expVal;
      if (!isCorrect) allCorrect = false;

      let explanation = "";
      if (isNaN(userVal)) {
        explanation = `Please enter a number between 1 and ${cleanKey.length}.`;
      } else if (!isCorrect) {
        explanation = `'${cleanKey[i]}' in position ${i + 1} has alphabetical rank ${expVal}, but you entered ${userVal}.`;
      } else {
        explanation = `Correct! '${cleanKey[i]}' is rank ${expVal}.`;
      }

      results.push({
        index: i,
        char: cleanKey[i],
        userValue: userVal,
        expectedValue: expVal,
        isCorrect,
        explanation
      });
    }

    return { allCorrect, results };
  }

  /**
   * Calculates grid dimensions.
   * Supports both padded (e.g. pad with 'X') and unpadded conventions.
   */
  function calculateDimensions(msgLength, numCols, usePadding = false, padChar = 'X') {
    if (numCols <= 0) return { numRows: 0, remainder: 0, paddedLength: 0, paddedText: "" };
    const numRows = Math.ceil(msgLength / numCols);
    const remainder = msgLength % numCols;
    const paddingNeeded = remainder === 0 ? 0 : (numCols - remainder);
    const isPadded = usePadding && paddingNeeded > 0;
    const finalLength = isPadded ? msgLength + paddingNeeded : msgLength;

    return {
      numCols,
      numRows,
      remainder,
      paddingNeeded,
      isPadded,
      finalLength
    };
  }

  /**
   * Fills an encryption grid row-by-row.
   * If usePadding is true, fills empty cells on the last row with padChar.
   * Otherwise, empty cells are null.
   */
  function buildEncryptionGrid(plaintext, key, usePadding = false, padChar = 'X') {
    const text = normalizeText(plaintext);
    const cleanKey = normalizeText(key);
    const numCols = cleanKey.length;
    const dims = calculateDimensions(text.length, numCols, usePadding, padChar);
    const { numRows, remainder } = dims;

    let fullText = text;
    if (usePadding && dims.paddingNeeded > 0) {
      fullText += padChar.repeat(dims.paddingNeeded);
    }

    const grid = [];
    let charIdx = 0;

    for (let r = 0; r < numRows; r++) {
      const row = [];
      for (let c = 0; c < numCols; c++) {
        if (usePadding || remainder === 0 || r < numRows - 1 || c < remainder) {
          row.push(fullText[charIdx] || '');
          charIdx++;
        } else {
          row.push(null); // Unpadded empty cell
        }
      }
      grid.push(row);
    }

    return { grid, dims, fullText };
  }

  /**
   * Encrypts plaintext using Columnar Transposition.
   */
  function encryptColumnar(plaintext, key, usePadding = false, padChar = 'X') {
    const text = normalizeText(plaintext);
    const cleanKey = normalizeText(key);
    const ranks = getKeyRanks(cleanKey);
    const numCols = cleanKey.length;

    const { grid, dims, fullText } = buildEncryptionGrid(text, cleanKey, usePadding, padChar);
    const { numRows } = dims;

    // Read columns in key rank order (Rank 1, 2, ..., numCols)
    let ciphertext = '';
    const columnsData = [];

    for (let c = 0; c < numCols; c++) {
      const colLetters = [];
      for (let r = 0; r < numRows; r++) {
        if (grid[r][c] !== null && grid[r][c] !== undefined) {
          colLetters.push(grid[r][c]);
        }
      }
      columnsData.push({
        colIndex: c,
        keyChar: cleanKey[c],
        rank: ranks[c],
        letters: colLetters,
        chunk: colLetters.join('')
      });
    }

    const orderedColumns = [];
    for (let r = 1; r <= numCols; r++) {
      const colIdx = ranks.indexOf(r);
      const col = columnsData[colIdx];
      ciphertext += col.chunk;
      orderedColumns.push(col);
    }

    return {
      plaintext: text,
      key: cleanKey,
      ranks,
      numCols,
      numRows,
      grid,
      dims,
      fullText,
      columnsData,
      orderedColumns,
      ciphertext
    };
  }

  /**
   * Decrypts ciphertext using Columnar Transposition.
   */
  function decryptColumnar(ciphertext, key, usePadding = false) {
    const cleanCipher = normalizeText(ciphertext);
    const cleanKey = normalizeText(key);
    const numCols = cleanKey.length;
    const ranks = getKeyRanks(cleanKey);
    const dims = calculateDimensions(cleanCipher.length, numCols, usePadding);
    const { numRows, remainder } = dims;

    // Determine length of each column
    const colLengths = new Array(numCols);
    for (let c = 0; c < numCols; c++) {
      if (remainder === 0 || usePadding) {
        colLengths[c] = numRows;
      } else if (c < remainder) {
        colLengths[c] = numRows; // Full column
      } else {
        colLengths[c] = numRows - 1; // Short column
      }
    }

    // Distribute ciphertext into columns by rank order
    const columnLetters = new Array(numCols).fill(null).map(() => []);
    const chunksByRank = [];
    let cursor = 0;

    for (let r = 1; r <= numCols; r++) {
      const colIdx = ranks.indexOf(r);
      const len = colLengths[colIdx];
      const chunk = cleanCipher.slice(cursor, cursor + len);
      cursor += len;
      columnLetters[colIdx] = chunk.split('');
      chunksByRank.push({
        rank: r,
        colIndex: colIdx,
        keyChar: cleanKey[colIdx],
        chunk
      });
    }

    // Reconstruct grid
    const grid = [];
    for (let r = 0; r < numRows; r++) {
      const row = [];
      for (let c = 0; c < numCols; c++) {
        if (r < colLengths[c]) {
          row.push(columnLetters[c][r] || '');
        } else {
          row.push(null);
        }
      }
      grid.push(row);
    }

    // Read row-by-row
    let plaintext = '';
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (grid[r][c] !== null && grid[r][c] !== undefined) {
          plaintext += grid[r][c];
        }
      }
    }

    return {
      ciphertext: cleanCipher,
      key: cleanKey,
      ranks,
      numCols,
      numRows,
      colLengths,
      grid,
      chunksByRank,
      plaintext
    };
  }

  /**
   * Generates a random challenge for the specified difficulty.
   */
  function generateRandomChallenge(difficulty = 'easy') {
    const pool = CHALLENGE_POOLS[difficulty] || CHALLENGE_POOLS.easy;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      plaintext: item.message,
      key: item.key,
      difficulty
    };
  }

  /**
   * Generates a comprehensive worked example for study/reference.
   */
  function generateWorkedExample(plaintext, key, usePadding = false, padChar = 'X') {
    const enc = encryptColumnar(plaintext, key, usePadding, padChar);
    const dec = decryptColumnar(enc.ciphertext, key, usePadding);
    const { explanations } = explainKeyRanks(key);

    return {
      plaintext: enc.plaintext,
      key: enc.key,
      ranks: enc.ranks,
      rankExplanations: explanations,
      grid: enc.grid,
      dims: enc.dims,
      columnsData: enc.columnsData,
      orderedColumns: enc.orderedColumns,
      ciphertext: enc.ciphertext,
      decryption: dec
    };
  }

  return {
    CHALLENGE_POOLS,
    normalizeText,
    getKeyRanks,
    explainKeyRanks,
    verifyKeyRanks,
    calculateDimensions,
    buildEncryptionGrid,
    encryptColumnar,
    decryptColumnar,
    generateRandomChallenge,
    generateWorkedExample
  };
}));
