// AiConsultation.js
import React, { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";

const AiConsultation = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { accounts, contract } = useWeb3();
  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
    type: "",
  });

  // Secure patient key handling - this key should be provided by the user
  // and never stored permanently in the application
  const [patientKey, setPatientKey] = useState("");

  const showToast = (title, message, type) => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast({ show: false, title: "", message: "", type: "" });
    }, 3000);
  };

  const handleConsultation = async () => {
    if (!query.trim()) {
      showToast(
        "Error",
        "Please enter a question for the AI assistant",
        "error"
      );
      return;
    }

    if (!patientKey) {
      showToast(
        "Error",
        "Please enter your decryption key for secure AI consultation",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      // Get temporary access token from smart contract
      const accessToken = await contract.methods
        .generateAccessToken()
        .send({ from: accounts[0] });

      // Make request to AI service
      const response = await fetch(
        "http://localhost:3001/api/ai/health-assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientAddress: accounts[0],
            patientKey: patientKey,
            query: query,
            accessToken: accessToken.events.AccessGranted.returnValues.token,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResponse(data.response);
      } else {
        throw new Error(data.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("AI consultation error:", error);
      showToast(
        "Error",
        error.message || "Failed to get AI consultation",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-4 p-6 border border-gray-200 rounded-lg shadow-lg bg-white">
      <div className="flex flex-col space-y-5">
        <h2 className="text-lg font-medium">AI Health Assistant</h2>

        <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-md">
          <svg
            className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
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
            Your medical data remains encrypted. Enter your personal decryption
            key to allow the AI to provide personalized health insights. The key
            is used only for this session and never stored.
          </p>
        </div>

        <div>
          <label className="block mb-2 font-medium">Your Decryption Key</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={patientKey}
            onChange={(e) => setPatientKey(e.target.value)}
            placeholder="Enter your personal decryption key"
            rows="2"
          />

          <label className="block mb-2 font-medium">
            Ask a Health Question
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: What should I know about my current medication plan?"
            rows="4"
          />
        </div>

        <button
          className={`py-2 px-4 rounded-md text-white font-medium ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={handleConsultation}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Get AI Consultation
            </span>
          ) : (
            "Get AI Consultation"
          )}
        </button>

        {response && (
          <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
            <p className="font-bold mb-2">AI Response:</p>
            <p>{response}</p>
          </div>
        )}

        {toast.show && (
          <div
            className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
              toast.type === "error" ? "bg-red-500" : "bg-green-500"
            } text-white`}
          >
            <div className="font-bold">{toast.title}</div>
            <div>{toast.message}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiConsultation;
