// const fetch = require('node-fetch');
// require('dotenv').config();

// async function translateText(subtitles, targetLanguage) {
//   try {
//     const translatedSubtitles = [];
    
//     // Get the appropriate translation model for the target language
//     const translationModel = getTranslationModel(targetLanguage);
    
//     // Process subtitles in batches to avoid rate limiting
//     for (const subtitle of subtitles) {
//       // Call Hugging Face translation API
//       const response = await fetch(
//         `https://api-inference.huggingface.co/models/${translationModel}`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             inputs: subtitle.text
//           })
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Hugging Face API error: ${response.statusText}`);
//       }
      
//       const data = await response.json();
//       const translatedText = Array.isArray(data) ? data[0].translation_text : data.generated_text;
      
//       translatedSubtitles.push({
//         ...subtitle,
//         text: translatedText
//       });
      
//       // Add a small delay between requests to avoid rate limiting
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
    
//     return translatedSubtitles;
//   } catch (error) {
//     console.error('Error translating text:', error);
//     throw error;
//   }
// }

// function getTranslationModel(targetLanguage) {
//   // Map language codes to Hugging Face translation models
//   const modelMap = {
//     'hi': 'Helsinki-NLP/opus-mt-en-hi',  // English to Hindi
//     'ur': 'Helsinki-NLP/opus-mt-en-ur',  // English to Urdu
//     'ar': 'Helsinki-NLP/opus-mt-en-ar',  // English to Arabic
//     'bn': 'Helsinki-NLP/opus-mt-en-bn',  // English to Bengali
//     'id': 'Helsinki-NLP/opus-mt-en-id'   // English to Indonesian
//   };
  
//   return modelMap[targetLanguage] || 'facebook/m2m100_418M'; // Default to a multilingual model
// }

// module.exports = {
//   translateText
// };



const fetch = require('node-fetch');
require('dotenv').config();

async function translateText(subtitles, targetLanguage) {
  try {
    const translatedSubtitles = [];
    
    // Get the appropriate translation model for the target language
    const translationModel = getTranslationModel(targetLanguage);
    console.log(`Using translation model: ${translationModel}`);
    
    // Process subtitles in batches to avoid rate limiting
    for (const subtitle of subtitles) {
      // Skip empty subtitles
      if (!subtitle.text || subtitle.text.trim() === '') {
        translatedSubtitles.push(subtitle);
        continue;
      }
      
      // Call Hugging Face translation API
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${translationModel}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: subtitle.text,
            options: {
              wait_for_model: true  // Ensure model is loaded before processing
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Handle different response formats from different models
      let translatedText;
      if (Array.isArray(data)) {
        translatedText = data[0].translation_text;
      } else if (data.generated_text) {
        translatedText = data.generated_text;
      } else if (data[0] && data[0].generated_text) {
        translatedText = data[0].generated_text;
      } else {
        console.warn('Unexpected response format:', JSON.stringify(data));
        translatedText = subtitle.text; // Fallback to original text
      }
      
      translatedSubtitles.push({
        ...subtitle,
        text: translatedText
      });
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return translatedSubtitles;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

function getTranslationModel(targetLanguage) {
  // Map language codes to Hugging Face translation models
  const modelMap = {
    'hi': 'Helsinki-NLP/opus-mt-en-hi',  // English to Hindi
    'ur': 'Helsinki-NLP/opus-mt-en-ur',  // English to Urdu
    // Added newer/better models as alternatives
    'hi-alt': 'facebook/nllb-200-distilled-600M',  // Multilingual model with good Hindi support
    'ur-alt': 'facebook/nllb-200-distilled-600M',  // Multilingual model with good Urdu support
    'ar': 'Helsinki-NLP/opus-mt-en-ar',  // English to Arabic
    'bn': 'Helsinki-NLP/opus-mt-en-bn',  // English to Bengali
    'id': 'Helsinki-NLP/opus-mt-en-id'   // English to Indonesian
  };
  
  return modelMap[targetLanguage] || 'facebook/nllb-200-distilled-600M'; // Better default multilingual model
}

module.exports = {
  translateText
};