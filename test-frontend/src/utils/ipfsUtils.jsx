// src/utils/ipfsUtils.js
import { create } from "ipfs-http-client";

// Connect to local IPFS node or Infura IPFS
const ipfs = create({
  host: "localhost",
  port: 5001,
  protocol: "http",
});

// In production, you might want to use a service like Infura:
// const ipfs = create({
//   host: 'ipfs.infura.io',
//   port: 5001,
//   protocol: 'https',
//   headers: {
//     authorization: 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')
//   }
// });

export const uploadToIPFS = async (encryptedData) => {
  try {
    // Convert string to Buffer for IPFS
    const buffer = Buffer.from(encryptedData);

    // Add data to IPFS
    const result = await ipfs.add(buffer);
    return result.path; // This is the IPFS hash (CID)
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
};

export const downloadFromIPFS = async (ipfsHash) => {
  try {
    const stream = ipfs.cat(ipfsHash);
    let data = "";

    for await (const chunk of stream) {
      data += chunk.toString();
    }

    return data;
  } catch (error) {
    console.error("Error downloading from IPFS:", error);
    throw error;
  }
};
