import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is not set. Set it in your .env.local and Vercel project settings.")
}

export function encryptKey(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY!).toString()
}

export function decryptKey(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY!)
  return bytes.toString(CryptoJS.enc.Utf8)
}
