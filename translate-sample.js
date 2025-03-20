const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Translates a sample text to the target language
 * @param {string} text Text to translate
 * @param {string} targetLanguage Target language code (e.g., 'hi', 'ur', 'ar')
 * @returns {Promise<Object>} Object containing original and translated text
 */
async function translateSampleText(text, targetLanguage) {
  try {
    // Get the appropriate model for the target language
    const { model, isMultilingual } = getTranslationModel(targetLanguage);
    
    console.log(`Using model: ${model} for language: ${targetLanguage}`);
    
    // Get the API token from environment variables
    const apiToken = process.env.HF_API_TOKEN || process.env.HUGGINGFACE_TOKEN;
    
    if (!apiToken) {
      throw new Error('No Hugging Face API token found in environment variables');
    }
    
    // Prepare the API request payload
    let payload = {
      inputs: text
    };
    
    // Add target language parameter for multilingual models
    if (isMultilingual) {
      payload.parameters = { target_language: targetLanguage };
    }
    
    // Make the API request
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    // Extract the translated text from the response
    let translatedText;
    if (Array.isArray(result) && result.length > 0) {
      translatedText = result[0].translation_text || result[0].generated_text;
    } else if (result.translation_text) {
      translatedText = result.translation_text;
    } else if (result.generated_text) {
      translatedText = result.generated_text;
    } else {
      translatedText = JSON.stringify(result);
    }
    
    return {
      originalText: text,
      translatedText: translatedText,
      modelUsed: model
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Determines the appropriate translation model for the target language
 * @param {string} targetLanguage Target language code
 * @returns {Object} Object containing model name and multilingual flag
 */
function getTranslationModel(targetLanguage) {
  // Map of language codes to specific models
  const languageModels = {
    'hi': { model: 'Helsinki-NLP/opus-mt-en-hi', isMultilingual: false },
    'ur': { model: 'Helsinki-NLP/opus-mt-en-ur', isMultilingual: false },
    'ar': { model: 'Helsinki-NLP/opus-mt-en-ar', isMultilingual: false },
    'bn': { model: 'Helsinki-NLP/opus-mt-en-mul', isMultilingual: true },
    'id': { model: 'Helsinki-NLP/opus-mt-en-mul', isMultilingual: true }
  };
  
  // Default to a multilingual model if the specific language isn't found
  return languageModels[targetLanguage] || 
    { model: 'facebook/m2m100_418M', isMultilingual: true };
}

module.exports = { translateSampleText };
