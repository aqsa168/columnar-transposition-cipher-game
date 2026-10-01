"""
verify_cipher.py - Cross-verifies Columnar Transposition educational cipher logic
"""

import math

def normalize_text(text):
    return ''.join([c.upper() for c in text if c.isalpha()])

def get_key_ranks(key):
    clean_key = normalize_text(key)
    indexed = [(char, idx) for idx, char in enumerate(clean_key)]
    indexed.sort(key=lambda item: (item[0], item[1]))
    ranks = [0] * len(clean_key)
    for rank, (char, idx) in enumerate(indexed, 1):
        ranks[idx] = rank
    return ranks

def calculate_dimensions(msg_len, num_cols, use_padding=False, pad_char='X'):
    num_rows = math.ceil(msg_len / num_cols)
    remainder = msg_len % num_cols
    padding_needed = 0 if remainder == 0 else (num_cols - remainder)
    is_padded = use_padding and padding_needed > 0
    final_len = (msg_len + padding_needed) if is_padded else msg_len
    return num_rows, remainder, padding_needed, is_padded, final_len

def encrypt_columnar(plaintext, key, use_padding=False, pad_char='X'):
    text = normalize_text(plaintext)
    clean_key = normalize_text(key)
    num_cols = len(clean_key)
    ranks = get_key_ranks(clean_key)
    num_rows, remainder, padding_needed, is_padded, final_len = calculate_dimensions(len(text), num_cols, use_padding, pad_char)

    full_text = text + (pad_char * padding_needed if is_padded else "")

    grid = [[None] * num_cols for _ in range(num_rows)]
    cursor = 0
    for r in range(num_rows):
        for c in range(num_cols):
            if is_padded or remainder == 0 or r < num_rows - 1 or c < remainder:
                grid[r][c] = full_text[cursor]
                cursor += 1

    ciphertext = ""
    for r in range(1, num_cols + 1):
        c = ranks.index(r)
        col_letters = [grid[row][c] for row in range(num_rows) if grid[row][c] is not None]
        ciphertext += "".join(col_letters)

    return ciphertext, ranks, num_rows, grid

def decrypt_columnar(ciphertext, key, use_padding=False):
    clean_cipher = normalize_text(ciphertext)
    clean_key = normalize_text(key)
    num_cols = len(clean_key)
    ranks = get_key_ranks(clean_key)
    num_rows, remainder, padding_needed, is_padded, final_len = calculate_dimensions(len(clean_cipher), num_cols, use_padding)

    col_lengths = []
    for c in range(num_cols):
        if remainder == 0 or use_padding:
            col_lengths.append(num_rows)
        elif c < remainder:
            col_lengths.append(num_rows)
        else:
            col_lengths.append(num_rows - 1)

    cols_data = [[] for _ in range(num_cols)]
    cursor = 0
    for r in range(1, num_cols + 1):
        c = ranks.index(r)
        length = col_lengths[c]
        cols_data[c] = list(clean_cipher[cursor:cursor + length])
        cursor += length

    grid = [[None] * num_cols for _ in range(num_rows)]
    for c in range(num_cols):
        for r in range(col_lengths[c]):
            grid[r][c] = cols_data[c][r]

    plaintext = ""
    for r in range(num_rows):
        for c in range(num_cols):
            if grid[r][c] is not None:
                plaintext += grid[r][c]

    return plaintext

def run_tests():
    print("--- Running Cryptography Education Verification ---")

    # 1. Prompt Example 1: MEETMEATNOON with ZEBRA
    # Key ZEBRA: A=1, B=2, E=3, R=4, Z=5 -> ranks: [5, 3, 2, 4, 1]
    ranks_zebra = get_key_ranks("ZEBRA")
    assert ranks_zebra == [5, 3, 2, 4, 1], f"Expected [5, 3, 2, 4, 1], got {ranks_zebra}"
    print("✔ Key ZEBRA ranks: Z=5, E=3, B=2, R=4, A=1 (Verified!)")

    # Unpadded MEETMEATNOON + ZEBRA
    c_unpadded, _, rows, _ = encrypt_columnar("MEETMEATNOON", "ZEBRA", False)
    dec_unpadded = decrypt_columnar(c_unpadded, "ZEBRA", False)
    assert dec_unpadded == "MEETMEATNOON", f"Unpadded decrypt failed: {dec_unpadded}"
    print(f"✔ MEETMEATNOON + ZEBRA (unpadded) -> {c_unpadded} -> {dec_unpadded} (PASSED)")

    # Padded with 'X'
    c_padded, _, _, _ = encrypt_columnar("MEETMEATNOON", "ZEBRA", True, 'X')
    dec_padded = decrypt_columnar(c_padded, "ZEBRA", True)
    assert dec_padded == "MEETMEATNOONXXX", f"Padded decrypt failed: {dec_padded}"
    print(f"✔ MEETMEATNOON + ZEBRA (padded with X) -> {c_padded} -> {dec_padded} (PASSED)")

    # 2. Prompt Canonical Example: WEAREDISCOVERED + ZEBRAS
    c_weare, ranks_zebras, _, _ = encrypt_columnar("WEAREDISCOVERED", "ZEBRAS", False)
    assert c_weare == "EVACDESERODEWIR", f"Expected EVACDESERODEWIR, got {c_weare}"
    assert decrypt_columnar(c_weare, "ZEBRAS", False) == "WEAREDISCOVERED"
    print("✔ Canonical Example: WEAREDISCOVERED + ZEBRAS -> EVACDESERODEWIR (Verified!)")

    # 3. Repeated Letters Tie-Breaking: BANANA & CARROT
    ranks_banana = get_key_ranks("BANANA")
    assert ranks_banana == [4, 1, 5, 2, 6, 3], f"BANANA tie-breaking failed: {ranks_banana}"
    print("✔ BANANA tie-breaking: A1=1, A2=2, A3=3, B=4, N1=5, N2=6 (Verified!)")

    # 4. Difficulty Challenge Pools Test
    challenges = [
        ("SECRETMEN", "CAT"),
        ("MEETATDAWN", "BIRD"),
        ("TREASUREISBURIED", "TIGER"),
        ("DEFENDTHEEASTWALL", "BANANA"),
        ("MOLEISPLANTEDATHEADQUARTERS", "TARGET")
    ]
    for pt, k in challenges:
        c, _, _, _ = encrypt_columnar(pt, k, False)
        rec = decrypt_columnar(c, k, False)
        assert rec == normalize_text(pt), f"Challenge {pt} with {k} failed"
        print(f"✔ Challenge [{k}]: {pt} -> {c[:10]}... -> {rec} (PASSED)")

    print("\nAll Columnar Transposition educational test assertions verified 100%!\n")

if __name__ == "__main__":
    run_tests()
