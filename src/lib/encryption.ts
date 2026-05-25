import CryptoJS from "crypto-js"

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY is not set. Add it to your Vercel environment variables.")
  return key
}

export function encryptKey(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, getKey()).toString()
}

export function decryptKey(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getKey())
  return bytes.toString(CryptoJS.enc.Utf8)
}
