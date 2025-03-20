const { translateSampleText } = require('./translate-sample');

async function testTranslation() {
  try {
    // Sample text to translate
    const sampleText = "Hello! How are you? This is a test of the translation system.";
    
    // Test translation to different languages
    const languages = ['hi', 'ur', 'ar', 'bn', 'id'];
    
    for (const lang of languages) {
      console.log(`\nTranslating to ${lang}...`);
      const result = await translateSampleText(sampleText, lang);
      console.log('Original:', result.originalText);
      console.log('Translated:', result.translatedText);
      console.log('Model used:', result.modelUsed);
      console.log('-'.repeat(50));
    }
  } catch (error) {
    console.error('Translation test failed:', error.message);
  }
}

// Run the testtestTranslation(); 