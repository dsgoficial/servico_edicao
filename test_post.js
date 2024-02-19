const axios = require('axios');
const fs = require('fs').promises;

async function postData() {
  try {
    // Read the JSON file
    const json = await fs.readFile('\\\\10.25.163.3\\carta_ortoimagem\\2023_PDDMT23_RS_25k\\JSON\\CO_2958-2-SE.json', 'utf8');
    const jsonData = JSON.parse(json);

    // Define the request body
    const requestBody = {
      json: jsonData, // This comes from the read JSON file
      tipo: 'Carta Ortoimagem 2.4', // Example, change as needed
      login: 'postgres', // Change this
      senha: 'Patolino@@', // Change this
      exportTiff: false // Example, change as needed
    };

    // Define the endpoint URL
    const url = 'http://localhost:3015/api/execucoes/'; // Change this to your actual endpoint

    // Make the POST request
    const response = await axios.post(url, requestBody);

    // Log the response from the server
    console.log(response.data);
  } catch (error) {
    console.error('Error making the request:', error.response ? error.response.data : error.message);
  }
}

// Execute the function
postData();