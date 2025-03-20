const fetch = require('node-fetch');
require('dotenv').config();

async function testHuggingFaceConnection() {
  // Check for both possible environment variable names
  const apiToken = process.env.HF_API_TOKEN || process.env.HUGGINGFACE_TOKEN;
  
  if (!apiToken) {
    console.error('Error: No Hugging Face API token found in .env file');
    console.error('Please ensure either HF_API_TOKEN or HUGGINGFACE_TOKEN is set');
    process.exit(1);
  }
  
  console.log('Testing connection to Hugging Face API...');
  
  try {
    // Simple test request to Hugging Face API
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'Hello, this is a test message to verify API connectivity.'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Connection successful! Response:');
      console.log(data);
    } else {
      const error = await response.text();
      console.error(`API returned status ${response.status}: ${error}`);
    }
  } catch (error) {
    console.error('Error connecting to Hugging Face API:', error.message);
  }
}

testHuggingFaceConnection();