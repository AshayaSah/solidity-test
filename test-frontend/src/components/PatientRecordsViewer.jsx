// src/components/PatientRecordsViewer.jsx
import React, { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { decryptFile } from "../utils/encryptionUtils";

const PatientRecordsViewer = () => {
  const { currentAccount, medicalRecordsContract, isPatient } = useWeb3();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [decryptionKey, setDecryptionKey] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    title: "",
    message: "",
    type: "",
  });

  const displayToast = (title, message, type) => {
    setToastMessage({ title, message, type });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Fetch patient records from blockchain when component mounts
  useEffect(() => {
    if (currentAccount && medicalRecordsContract) {
      fetchPatientRecords();
    }
  }, [currentAccount, medicalRecordsContract]);

  const fetchPatientRecords = async () => {
    try {
      setLoading(true);
      setError("");

      // Check if user is registered patient
      if (!isPatient) {
        displayToast(
          "Access Denied",
          "Only registered patients can view their records.",
          "error"
        );
        setLoading(false);
        return;
      }

      // Get patient's records using the appropriate method from your contract
      try {
        // Attempt to get patient records from the contract
        const patientRecords = await medicalRecordsContract.methods
          .getPatientRecords(currentAccount)
          .call();

        console.log("Patient records:", patientRecords);

        // Process the records based on the format returned by your contract
        const recordsArray = Array.isArray(patientRecords)
          ? patientRecords.map(processRecord)
          : [];

        setRecords(recordsArray);

        if (recordsArray.length === 0) {
          displayToast(
            "Information",
            "No medical records found for this patient.",
            "info"
          );
        }
      } catch (contractError) {
        console.error("Contract method error:", contractError);

        // Alternative: Try another potential method if the first one fails
        try {
          // Get patient details which might include records
          const patientDetails = await medicalRecordsContract.methods
            .getPatientDetails()
            .call({ from: currentAccount });

          console.log("Patient details:", patientDetails);

          // Extract records from patient details if available
          const recordsArray = patientDetails.records
            ? Array.isArray(patientDetails.records)
              ? patientDetails.records.map(processRecord)
              : []
            : [];

          setRecords(recordsArray);

          if (recordsArray.length === 0) {
            displayToast(
              "Information",
              "No medical records found for this patient.",
              "info"
            );
          }
        } catch (detailsError) {
          console.error("Failed to get patient details:", detailsError);
          throw new Error(
            "Could not retrieve patient records from the blockchain."
          );
        }
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      setError("Failed to fetch medical records. " + error.message);
      displayToast("Error", "Failed to fetch medical records.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Process record data from contract into a consistent format
  const processRecord = (record) => {
    // Handle different possible record formats
    if (typeof record === "object") {
      // If record is an object with properties
      const metadata = record.metadata
        ? typeof record.metadata === "string"
          ? JSON.parse(record.metadata || "{}")
          : record.metadata
        : {};

      return {
        id: record.id || record.recordId || "unknown",
        recordType: record.recordType || "Unknown Type",
        ipfsHash: record.ipfsHash || record.dataHash || "",
        doctorName: record.doctorName || "Unknown Doctor",
        timestamp: record.timestamp
          ? new Date(Number(record.timestamp) * 1000).toLocaleString()
          : "Unknown Date",
        metadata: metadata,
      };
    } else if (typeof record === "string") {
      // If record is just an ID or hash
      return {
        id: record,
        recordType: "Medical Record",
        ipfsHash: record,
        doctorName: "Unknown",
        timestamp: "Unknown Date",
        metadata: {},
      };
    }

    // Default fallback
    return {
      id: "unknown",
      recordType: "Unknown Type",
      ipfsHash: "",
      doctorName: "Unknown",
      timestamp: "Unknown Date",
      metadata: {},
    };
  };

  // Function to load a single record's details if needed
  const loadRecordDetails = async (recordId) => {
    try {
      const recordDetails = await medicalRecordsContract.methods
        .getRecord(recordId)
        .call();

      return processRecord(recordDetails);
    } catch (error) {
      console.error("Error loading record details:", error);
      return null;
    }
  };

  const viewRecord = async (record) => {
    try {
      setLoading(true);

      // If the record doesn't have complete details, try to load them
      if (!record.ipfsHash || record.recordType === "Unknown Type") {
        const detailedRecord = await loadRecordDetails(record.id);
        if (detailedRecord) {
          setSelectedRecord(detailedRecord);
        } else {
          setSelectedRecord(record);
        }
      } else {
        setSelectedRecord(record);
      }

      setDecryptedContent(null); // Reset previous decrypted content
    } catch (error) {
      console.error("Error viewing record:", error);
      displayToast("Error", "Failed to load record details", "error");
    } finally {
      setLoading(false);
    }
  };

  const decryptRecord = async () => {
    if (!decryptionKey) {
      displayToast("Error", "Please enter your decryption key", "error");
      return;
    }

    if (!selectedRecord) {
      displayToast("Error", "No record selected", "error");
      return;
    }

    try {
      setLoading(true);

      // In a real application, you would fetch the encrypted file from IPFS here
      // For demonstration purposes, we'll simulate this process
      const encryptedData = await fetchFromIPFS(selectedRecord.ipfsHash);

      // Decrypt the file using patient's key
      const decryptedData = await decryptFile(encryptedData, decryptionKey);

      setDecryptedContent(decryptedData);
      displayToast("Success", "Record decrypted successfully", "success");
    } catch (error) {
      console.error("Decryption error:", error);
      setError("Failed to decrypt record. Please check your decryption key.");
      displayToast("Error", "Failed to decrypt record", "error");
    } finally {
      setLoading(false);
    }
  };

  // Simulated function to fetch data from IPFS
  // In a real app, you would use a proper IPFS client library
  const fetchFromIPFS = async (ipfsHash) => {
    // Simulate API call to IPFS gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulated encrypted data
        resolve({
          encryptedData: "simulated-encrypted-data-" + ipfsHash,
          iv: "simulated-iv",
        });
      }, 1000);
    });
  };

  // Dummy implementation of decryptFile if not already defined
  if (typeof decryptFile !== "function") {
    window.decryptFile = async (encryptedData, key) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            content:
              "This is simulated decrypted content for demonstration purposes.",
            type: "text/plain",
            name: "medical-record.txt",
          });
        }, 1000);
      });
    };
  }

  return (
    <div className="w-full mx-auto mt-4 max-w-4xl p-6 border border-gray-200 rounded-lg shadow-lg bg-white">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Your Medical Records
        </h2>

        <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-md">
          <svg
            className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm">
            Your medical records are securely stored on the blockchain and
            remain encrypted. To view a record, select it from the list below
            and enter your personal decryption key.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
          {/* Records List */}
          <div className="w-full md:w-1/2">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              Available Records
            </h3>

            {loading && !records.length ? (
              <div className="flex justify-center items-center h-40">
                <svg
                  className="animate-spin h-8 w-8 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : records.length > 0 ? (
              <div className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {records.map((record, index) => (
                  <div
                    key={record.id || index}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedRecord?.id === record.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => viewRecord(record)}
                  >
                    <h4 className="font-medium">{record.recordType}</h4>
                    <p className="text-sm text-gray-600">
                      Dr. {record.doctorName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {record.timestamp}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-md">
                No medical records found.
              </div>
            )}

            <button
              className="mt-4 py-2 px-4 w-full border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={fetchPatientRecords}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh Records"}
            </button>
          </div>

          {/* Record Viewer */}
          <div className="w-full md:w-1/2">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              Record Viewer
            </h3>

            {selectedRecord ? (
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-lg">
                  {selectedRecord.recordType}
                </h4>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Doctor:</span>{" "}
                    {selectedRecord.doctorName}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Date:</span>{" "}
                    {selectedRecord.timestamp}
                  </p>
                  {selectedRecord.metadata?.description && (
                    <p className="text-sm">
                      <span className="font-medium">Notes:</span>{" "}
                      {selectedRecord.metadata.description}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Record ID:</span>{" "}
                    <span className="text-xs font-mono">
                      {selectedRecord.id}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">IPFS Hash:</span>{" "}
                    <span className="text-xs font-mono">
                      {selectedRecord.ipfsHash}
                    </span>
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter Decryption Key
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={decryptionKey}
                      onChange={(e) => setDecryptionKey(e.target.value)}
                      placeholder="Your personal decryption key"
                    />
                  </div>
                  <button
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}
                    onClick={decryptRecord}
                    disabled={loading}
                  >
                    {loading ? "Decrypting..." : "Decrypt Record"}
                  </button>
                </div>

                {decryptedContent && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium mb-2">Decrypted Content:</h5>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">
                        {typeof decryptedContent === "object"
                          ? JSON.stringify(decryptedContent, null, 2)
                          : decryptedContent}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md p-8 text-center text-gray-500">
                Select a record from the list to view details.
              </div>
            )}
          </div>
        </div>
      </div>

      {showToast && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
            toastMessage.type === "error"
              ? "bg-red-500"
              : toastMessage.type === "info"
              ? "bg-blue-500"
              : "bg-green-500"
          } text-white max-w-xs z-50`}
        >
          <div className="font-bold">{toastMessage.title}</div>
          <div>{toastMessage.message}</div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordsViewer;
