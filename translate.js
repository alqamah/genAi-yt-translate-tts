const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Translates an array of subtitles to the target language
 * @param {Array} subtitles Array of subtitle objects with text property
 * @param {string} targetLanguage Target language code (e.g., 'hi', 'ur', 'ar')
 * @returns {Promise<Array>} Translated subtitles array
 */
async function translateText(subtitles, targetLanguage) {
  try {
    const translatedSubtitles = [];
    const batchSize = 5; // Number of translations to process in parallel
    const { model, isMultilingual } = getTranslationModel(targetLanguage);
    
    console.log(`Starting translation to ${targetLanguage} using model: ${model}`);

    // Process subtitles in batches
    for (let i = 0; i < subtitles.length; i += batchSize) {
      const batch = subtitles.slice(i, i + batchSize);
      const translationPromises = batch.map(subtitle => 
        translateSingle(subtitle, model, targetLanguage, isMultilingual)
      );

      // Wait for all translations in the current batch
      const results = await Promise.allSettled(translationPromises);
      
      // Process results and handle any failures
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          translatedSubtitles.push(result.value);
        } else {
          console.error(`Failed to translate subtitle ${i + index}:`, result.reason);
          // Keep original text if translation fails
          translatedSubtitles.push({
            ...batch[index],
            text: batch[index].text,
            translationError: result.reason.message
          });
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < subtitles.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return translatedSubtitles;
  } catch (error) {
    console.error('Error in translation process:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Translates a single subtitle
 * @param {Object} subtitle Subtitle object with text property
 * @param {string} model Translation model to use
 * @param {string} targetLanguage Target language code
 * @param {boolean} isMultilingual Whether the model is multilingual
 * @returns {Promise<Object>} Translated subtitle object
 */
async function translateSingle(subtitle, model, targetLanguage, isMultilingual) {
  if (!subtitle.text || subtitle.text.trim() === '') {
    return subtitle;
  }

  const payload = isMultilingual ? {
    inputs: subtitle.text,
    parameters: {
      src_lang: "eng_Latn",
      tgt_lang: getLanguageCode(targetLanguage)
    }
  } : {
    inputs: subtitle.text
  };

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        options: { wait_for_model: true }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const translatedText = extractTranslatedText(data);

  return {
    ...subtitle,
    text: translatedText,
    originalText: subtitle.text // Keep original text for reference
  };
}

/**
 * Extracts translated text from API response
 * @param {Object|Array} data API response data
 * @returns {string} Translated text
 */
function extractTranslatedText(data) {
  if (Array.isArray(data)) {
    return data[0].translation_text || data[0].generated_text;
  }
  if (data.generated_text) {
    return data.generated_text;
  }
  if (data[0]?.generated_text) {
    return data[0].generated_text;
  }
  throw new Error('Unexpected API response format');
}

/**
 * Gets the appropriate translation model for the target language
 * @param {string} targetLanguage Target language code
 * @returns {Object} Model information
 */
function getTranslationModel(targetLanguage) {
  // High-quality dedicated models for specific languages
  const dedicatedModels = {
    'hi': { model: 'Helsinki-NLP/opus-mt-en-hi', isMultilingual: false },
    'ur': { model: 'Helsinki-NLP/opus-mt-en-ur', isMultilingual: false },
    'ar': { model: 'Helsinki-NLP/opus-mt-en-ar', isMultilingual: false },
    'bn': { model: 'Helsinki-NLP/opus-mt-en-bn', isMultilingual: false },
    'id': { model: 'Helsinki-NLP/opus-mt-en-id', isMultilingual: false }
  };

  // Fallback to powerful multilingual model
  const defaultModel = {
    model: 'facebook/nllb-200-distilled-600M',
    isMultilingual: true
  };

  return dedicatedModels[targetLanguage] || defaultModel;
}

/**
 * Gets the language code format for multilingual models
 * @param {string} langCode Basic language code
 * @returns {string} Formatted language code
 */
function getLanguageCode(langCode) {
  const languageMap = {
    'hi': 'hin_Deva',
    'ur': 'urd_Arab',
    'ar': 'ara_Arab',
    'bn': 'ben_Beng',
    'id': 'ind_Latn'
  };

  return languageMap[langCode] || langCode;
}

/**
 * Translates a sample text to the target language
 * @param {string} text Text to translate
 * @param {string} targetLanguage Target language code (e.g., 'hi', 'ur', 'ar')
 * @returns {Promise<Object>} Object containing original and translated text
 */
async function translateSampleText(text, targetLanguage) {
  try {
    const { model, isMultilingual } = getTranslationModel(targetLanguage);
    console.log(`Translating sample text to ${targetLanguage} using model: ${model}`);

    const payload = isMultilingual ? {
      inputs: text,
      parameters: {
        src_lang: "eng_Latn",
        tgt_lang: getLanguageCode(targetLanguage)
      }
    } : {
      inputs: text
    };

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          options: { wait_for_model: true }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const translatedText = extractTranslatedText(data);

    return {
      originalText: text,
      translatedText: translatedText,
      targetLanguage: targetLanguage,
      modelUsed: model
    };
  } catch (error) {
    console.error('Error in translation process:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

module.exports = {
  translateText,
  translateSampleText
};