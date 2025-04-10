// src/utils/encryptionUtils.js
import CryptoJS from "crypto-js";

// Encrypt file data using patient's private key
export const encryptFile = async (fileData, encryptionKey) => {
  // Convert file to string if it's not already
  let fileString =
    typeof fileData === "string" ? fileData : await fileData.text();

  // Encrypt the file content
  const encryptedData = CryptoJS.AES.encrypt(
    fileString,
    encryptionKey
  ).toString();
  return encryptedData;
};

// Decrypt file data
export const decryptFile = (encryptedData, encryptionKey) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  return decryptedData;
};

// Generate a secure encryption key from patient ID and additional secret
export const generateEncryptionKey = (patientId, personalSecret) => {
  return CryptoJS.SHA256(patientId + personalSecret).toString();
};
