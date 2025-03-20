const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function generateSpeech(subtitles, targetLanguage) {
  try {
    const outputDir = path.join('temp', 'audio');
    await fs.mkdir(outputDir, { recursive: true });
    
    const audioFiles = [];
    
    // Map language code to appropriate HF model
    const ttsModel = getTTSModelForLanguage(targetLanguage);
    
    // Generate audio for each subtitle
    for (const subtitle of subtitles) {
      const outputPath = path.join(outputDir, `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`);
      
      // Call Hugging Face TTS API
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${ttsModel}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: subtitle.text
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      await fs.writeFile(outputPath, buffer);
      
      audioFiles.push({
        path: outputPath,
        start: subtitle.start,
        end: subtitle.end
      });
      
      // Add a small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Combine all audio files with correct timing
    const finalAudioPath = path.join('temp', `final_audio_${Date.now()}.mp3`);
    await combineAudioFiles(audioFiles, finalAudioPath);
    
    // Clean up individual audio files
    for (const file of audioFiles) {
      await fs.unlink(file.path);
    }
    
    return finalAudioPath;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

function getTTSModelForLanguage(languageCode) {
  // Map language codes to Hugging Face TTS models
  const modelMap = {
    'hi': 'facebook/mms-tts-hin', // Hindi
    'ur': 'facebook/mms-tts-urd', // Urdu
    'ar': 'facebook/mms-tts-arb', // Arabic
    'bn': 'facebook/mms-tts-ben', // Bengali
    'id': 'facebook/mms-tts-ind'  // Indonesian
  };
  
  return modelMap[languageCode] || 'facebook/mms-tts-eng'; // Default to English
}

async function combineAudioFiles(audioFiles, outputPath) {
  // Implementation using fluent-ffmpeg to combine audio files
  const ffmpeg = require('fluent-ffmpeg');
  const ffmpegStatic = require('ffmpeg-static');
  ffmpeg.setFfmpegPath(ffmpegStatic);

  return new Promise((resolve, reject) => {
    let command = ffmpeg();
    
    // Add input files with specific timing
    audioFiles.forEach(file => {
      command = command
        .input(file.path)
        .inputOptions([`-itsoffset ${file.start/1000}`]);
    });
    
    command
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .mergeToFile(outputPath);
  });
}

module.exports = {
  generateSpeech
};