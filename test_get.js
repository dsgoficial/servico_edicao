const axios = require('axios');

async function getExecutionStatus(uuid) {
  try {
    // Define the endpoint URL with the UUID
    const url = `http://localhost:3015/api/execucoes/${uuid}`; // Change this to your actual endpoint and make sure to include the UUID in the URL

    // Make the GET request
    const response = await axios.get(url);

    // Log the response from the server
    console.log('Execution Status:', response.data);
  } catch (error) {
    console.error('Error fetching the execution status:', error.response ? error.response.data : error.message);
  }
}

// Example UUID, replace with the actual UUID you want to query
const uuid = '8f328cce-1142-4077-be65-ee7272a940b2';
getExecutionStatus(uuid);