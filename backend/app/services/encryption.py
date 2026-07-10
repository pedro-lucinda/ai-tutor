import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_encryption_key() -> bytes:
    raw = os.environ.get("APP_ENCRYPTION_KEY", "").strip()
    if not raw:
        raise RuntimeError("APP_ENCRYPTION_KEY is not configured")

    try:
        key = base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4))
    except Exception:
        key = bytes.fromhex(raw) if all(c in "0123456789abcdefABCDEF" for c in raw) else raw.encode()

    if len(key) != 32:
        raise RuntimeError("APP_ENCRYPTION_KEY must decode to 32 bytes for AES-256-GCM")
    return key


def encrypt(plaintext: str) -> bytes:
    key = _get_encryption_key()
    nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext.encode(), None)
    return nonce + ciphertext


def decrypt(blob: bytes) -> str:
    key = _get_encryption_key()
    nonce, ciphertext = blob[:12], blob[12:]
    return AESGCM(key).decrypt(nonce, ciphertext, None).decode()
