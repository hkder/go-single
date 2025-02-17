"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptData = encryptData;
exports.decryptData = decryptData;
function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
}
function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
function encryptData(plaintext, passphrase) {
    return __awaiter(this, void 0, void 0, function* () {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const keyMaterial = yield crypto.subtle.importKey("raw", encoder.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]);
        const key = yield crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        const ciphertextBuffer = yield crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encoder.encode(plaintext));
        const encryptedObject = {
            salt: arrayBufferToBase64(salt.buffer),
            iv: arrayBufferToBase64(iv.buffer),
            ciphertext: arrayBufferToBase64(ciphertextBuffer)
        };
        return JSON.stringify(encryptedObject);
    });
}
function decryptData(encryptedStr, passphrase) {
    return __awaiter(this, void 0, void 0, function* () {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const encryptedObject = JSON.parse(encryptedStr);
        const salt = new Uint8Array(base64ToArrayBuffer(encryptedObject.salt));
        const iv = new Uint8Array(base64ToArrayBuffer(encryptedObject.iv));
        const ciphertext = base64ToArrayBuffer(encryptedObject.ciphertext);
        const keyMaterial = yield crypto.subtle.importKey("raw", encoder.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]);
        const key = yield crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        const decryptedBuffer = yield crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
        return decoder.decode(decryptedBuffer);
    });
}
//# sourceMappingURL=CryptoUtils.js.map