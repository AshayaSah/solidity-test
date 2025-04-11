// server.js - AI Integration Service
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("langchain/llms/openai");
const crypto = require("crypto");
const Web3 = require("web3");
const contractABI = require("./MedicalRecords.json").abi;
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());

// Initialize Web3 connection
const web3 = new Web3("http://localhost:8545"); // Connect to local blockchain
const contractAddress = "0x123..."; // Your deployed contract address
const medicalContract = new web3.eth.Contract(contractABI, contractAddress);

// Initialize AI model
const model = new OpenAI({
  temperature: 0.2,
  apiKey: process.env.OPENAI_API_KEY,
});

// Secure data transformation function
function transformDataForAI(medicalData, patientKey) {
  // Remove direct identifiers
  const sanitizedData = {
    ...medicalData,
    patientName: undefined,
    patientID: undefined,
    fullAddress: undefined,
    insuranceNumber: undefined,
    // Keep only necessary medical information
    medicalConditions: medicalData.medicalConditions,
    medications: medicalData.medications,
    allergies: medicalData.allergies,
    vitalSigns: medicalData.vitalSigns,
    labResults: medicalData.labResults,
  };

  // Generate a request-specific hash for data tracking
  const requestId = crypto.randomBytes(16).toString("hex");

  // Log access attempt with minimal info (for audit trail)
  console.log(
    `AI consultation request ${requestId} for patient key: ${patientKey.substring(
      0,
      8
    )}...`
  );

  return sanitizedData;
}

// API endpoint for AI health assistant
app.post("/api/ai/health-assistant", async (req, res) => {
  try {
    const { patientAddress, patientKey, query, accessToken } = req.body;

    // Validate access token with blockchain contract
    const isAuthorized = await medicalContract.methods
      .validateAccess(patientAddress, accessToken)
      .call();

    if (!isAuthorized) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Retrieve encrypted data from blockchain
    const encryptedData = await medicalContract.methods
      .getPatientData(patientAddress)
      .call();

    // Decrypt data locally (patient provides their key)
    const decryptedData = decryptMedicalData(encryptedData, patientKey);

    // Transform data securely before AI processing
    const aiSafeData = transformDataForAI(decryptedData, patientKey);

    // Create context for AI with sanitized data
    const context = `
      Medical context (anonymized):
      - Medical conditions: ${aiSafeData.medicalConditions}
      - Current medications: ${aiSafeData.medications}
      - Allergies: ${aiSafeData.allergies}
      - Recent vital signs: ${aiSafeData.vitalSigns}
      - Relevant lab results: ${aiSafeData.labResults}
    `;

    // Query AI with context and user question
    const aiResponse = await model.call(`
      You are a healthcare assistant providing general information only.
      Never reference any specific patient details in your response.
      Based on the following anonymized medical context and query, provide helpful information:
      
      ${context}
      
      User query: ${query}
    `);

    // Return response to client
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("AI consultation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to decrypt data with patient's key
function decryptMedicalData(encryptedData, patientKey) {
  try {
    // Extract initialization vector from data
    const iv = Buffer.from(encryptedData.iv, "hex");

    // Create decipher with patient key
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(patientKey, "hex"),
      iv
    );

    // Decrypt the data
    let decrypted = decipher.update(encryptedData.data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error("Decryption failed - invalid key or corrupted data");
  }
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Secure AI integration service running on port ${PORT}`);
});
