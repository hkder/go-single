// src/EncryptionUtil.ts
export class EncryptionUtil {
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static async encryptData(
    plaintext: string,
    passphrase: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(plaintext)
    );
    const encryptedObject = {
      salt: EncryptionUtil.arrayBufferToBase64(salt.buffer),
      iv: EncryptionUtil.arrayBufferToBase64(iv.buffer),
      ciphertext: EncryptionUtil.arrayBufferToBase64(ciphertextBuffer),
    };
    return JSON.stringify(encryptedObject);
  }

  static async decryptData(
    encryptedStr: string,
    passphrase: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const encryptedObject = JSON.parse(encryptedStr);
    const salt = new Uint8Array(
      EncryptionUtil.base64ToArrayBuffer(encryptedObject.salt)
    );
    const iv = new Uint8Array(
      EncryptionUtil.base64ToArrayBuffer(encryptedObject.iv)
    );
    const ciphertext = EncryptionUtil.base64ToArrayBuffer(
      encryptedObject.ciphertext
    );
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    return decoder.decode(decryptedBuffer);
  }
}
