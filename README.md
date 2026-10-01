# Columnar Transposition Cipher – Encrypt & Decrypt Challenge 🎓

An interactive educational web game designed for beginner students learning classical cryptography. The game teaches students how the **Columnar Transposition Cipher** works by guiding them through every step of encryption and decryption — but the learner performs the actual work themselves!

---

## 🌟 Pedagogical Design & Learning Goals

- **Active Learning**: Students do not merely observe pre-calculated answers. They manually calculate key ranks, fill the grid row-by-row, make padding decisions, select columns by key order, calculate row counts, fill columns, and recover plaintext.
- **Teacher-Style Feedback**: When a student makes a mistake, the game explains **why** it is incorrect rather than simply saying "Wrong".
- **Step-by-Step Worked Solutions**: A "Show Worked Example" modal is available whenever a student needs a complete demonstration of the resolution steps.

---

## 🔒 Encryption Mode (5 Steps)

1. **Step 1 – Understand the Key**:
   - The key letters are displayed in boxes.
   - The student determines the alphabetical order (1, 2, 3...) of each key letter and enters the ranks.
   - Immediate feedback checks each entry and explains ties/alphabetical ranking.
2. **Step 2 – Create the Encryption Grid**:
   - An empty grid is presented with key letters on top.
   - The student manually types the message into the grid from **LEFT → RIGHT, row by row**. Focus advances automatically as letters are typed!
   - "Check Grid" validates cell entries and points out misplaced characters.
3. **Step 3 – Handle Empty Cells**:
   - Asks: *"Does the message completely fill the final row?"*
   - Explains padding conventions and lets the student choose to either **pad empty cells with 'X'** or **leave the grid unpadded**.
4. **Step 4 – Read Columns in Key Order**:
   - Asks: *"Which column should we read first?"*
   - The student clicks the column headers in alphabetical rank order (A → B → E → R → Z).
   - Selected column letters are highlighted and appended to the **Ciphertext Construction Area** (`_____ _____ _____`).
5. **Step 5 – Final Encrypted Message**:
   - Compares **Your Ciphertext** with **Correct Ciphertext**.
   - Summarizes the core concept:
     > **Encryption** = Write plaintext row-by-row → Read columns according to the alphabetical order of the key.

---

## 🔓 Decryption Mode (4 Steps)

1. **Step 1 – Determine Key Order**:
   - Student enters the alphabetical ranks for the key letters.
2. **Step 2 – Calculate Rows**:
   - Shows ciphertext length and number of columns.
   - Asks: *"How many rows will the grid have?"*
   - Explains the formula: $\text{Rows} = \lceil \text{Ciphertext Length} / \text{Columns} \rceil$.
3. **Step 3 – Fill the Grid Column-by-Column**:
   - Teaches: *"During decryption, ciphertext is placed COLUMN-BY-COLUMN according to the alphabetical order of the key."*
   - Highlights the active column according to key order.
   - Student types the corresponding ciphertext letters into that column. "Check Column" verifies placement.
4. **Step 4 – Read Plaintext Row-by-Row**:
   - Asks: *"Now read the grid from LEFT → RIGHT, row by row. What is the plaintext?"*
   - Student enters the recovered plaintext and receives teacher validation and summary:
     > **Decryption** = Restore ciphertext column-by-column according to key order → Read grid row-by-row to recover plaintext.

---

## 📚 Additional Modes

- **Learn First**:
  - Interactive visual walkthrough with animated concept cards explaining both encryption and decryption workflows before starting challenges.
- **Custom Challenge**:
  - Teachers or students can type any custom secret message and keyword to practice custom scenarios.

---

## 🎯 Difficulty Tiers

- **Easy**: Short messages (9–12 letters), 3–4 letter keys (`CAT`, `BIRD`, `STAR`), perfectly even grids.
- **Medium**: Longer messages (12–20 letters), 5–6 letter keys (`ZEBRA`, `TIGER`, `PLANET`), incomplete last rows with padding options.
- **Hard**: Longer messages, 7–8 letter keys, repeated letters in keys (`BANANA`, `CARROT`, `TARGET`, `SUCCESS`) to practice left-to-right tie-breaking.

---

## 🏆 Scoring & Game Features

- **Score Points**:
  - +10: Correct key ordering
  - +20: Correct grid entry
  - +20: Correct column selection
  - +30: Correct ciphertext / plaintext recovery
- **Hint System**: Provides pedagogical hints (-5 points).
- **Attempts Counter**: Tracks practice repetitions.
- **Web Audio Synthesizer**: Gentle mechanical typing, success bells, and celebratory fanfares (with mute button).
- **Mobile Responsive**: Large touch-friendly cells ($\ge 48\text{px}$) with automatic cursor advance.

---

## 📁 File Structure

```text
├── index.html         # Classroom UI container, tabs, HUD, and worked example modal
├── styles.css         # Clean educational styling, interactive grid cells, step cards
├── cipher.js          # Core crypto logic, challenge generators, rank explanations, worked examples
├── game.js            # State machine managing 5-step encryption and 4-step decryption
├── ui.js              # DOM controller, auto-advancing cells, live ciphertext builder, audio
├── tests.html         # Interactive in-browser unit test suite
├── verify_cipher.py   # Python algorithmic test suite
├── check_integrity.py # File reference and asset validator
└── README.md          # Comprehensive documentation
```

---

## 🚀 How to Run

1. Open `index.html` directly in any web browser.
2. Choose **"📚 Learn First"** for a tutorial, or dive into **"🔒 Encrypt Challenge"** or **"🔓 Decrypt Challenge"**.
3. Run verification tests anytime by opening `tests.html` or running:
   ```bash
   python verify_cipher.py
   python check_integrity.py
   ```
