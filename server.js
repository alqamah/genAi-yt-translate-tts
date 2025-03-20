const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { getSubtitles } = require('./subtitles');
// const { translateText } = require('./translate');
// const { generateSpeech } = require('./tts');
// const { processVideo } = require('./videoProcessor');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create required directories
(async () => {
  const dirs = ['temp', 'temp/audio', 'temp/subtitles', 'output', 'uploads'];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true })
      .catch(err => console.error(`Error creating directory ${dir}:`, err));
  }
})();

// Routes
app.post('/process-video', async (req, res) => {
  console.log('Received request:', req.body);
  
  // Validate input
  const { videoUrl, targetLanguage } = req.body;
  
  if (!videoUrl) {
    return res.status(400).json({ 
      error: 'Missing videoUrl parameter',
      status: 'error'
    });
  }
  
  // if (!targetLanguage) {
  //   return res.status(400).json({ 
  //     error: 'Missing targetLanguage parameter',
  //     status: 'error'
  //   });
  // }
  
  // Process the video in steps
  try {
    // Step 1: Extract subtitles
    console.log(`Step 1: Extracting subtitles from ${videoUrl}`);
    const subtitles = await getSubtitles(videoUrl);
    console.log(`Extracted subtitles array length: ${subtitles.length}`);
    console.log('First few subtitles:', subtitles.slice(0, 3));
    
    // Find the most recent subtitle file
    const subtitlesDir = path.join('temp', 'subtitles');
    const files = await fs.readdir(subtitlesDir);
    const subtitleFiles = files.filter(file => file.startsWith('subs_') && file.endsWith('.srt'));
    const latestSubtitleFile = subtitleFiles.sort().pop();
    
    if (!latestSubtitleFile) {
      throw new Error('No subtitle file found');
    }
    
    const subtitlesPath = path.join(subtitlesDir, latestSubtitleFile);
    console.log(`Using subtitle file: ${subtitlesPath}`);
    
    // Verify file was created and read its contents
    try {
      const fileContent = await fs.readFile(subtitlesPath, 'utf8');
      console.log('File size:', fileContent.length, 'bytes');
      console.log('First 500 characters of subtitle file:', fileContent.substring(0, 500));
    } catch (readError) {
      console.error('Error reading subtitle file:', readError);
    }
    
    if (!subtitles || subtitles.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to extract subtitles',
        status: 'error' 
      });
    }
    
    // Step 2: Translate subtitles
    // console.log(`Step 2: Translating subtitles to ${targetLanguage}`);
    // const translatedSubtitles = await translateText(subtitles, targetLanguage);
    // console.log(`Translated ${translatedSubtitles.length} subtitles`);
    
    // Step 3: Generate speech from translated text
    // console.log(`Step 3: Generating speech in ${targetLanguage}`);
    // const audioPath = await generateSpeech(translatedSubtitles, targetLanguage);
    // console.log(`Generated audio at ${audioPath}`);
    
    // Step 4: Process video with new audio
    // console.log(`Step 4: Processing video with new audio`);
    // const outputPath = await processVideo(videoUrl, audioPath);
    // console.log(`Processed video saved to ${outputPath}`);
    
    // Return the processed video URL
    // const outputVideoUrl = path.basename(outputPath);
    // console.log(`Returning video URL: ${videoUrl}`);
    
    res.json({ 
      success: true, 
      subtitlesPath: subtitlesPath,
      status: 'success'
    });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ 
      error: error.message || 'Unknown error occurred',
      status: 'error'
    });
  }
});

// Serve processed videos
app.use('/output', express.static(path.join(__dirname, 'output')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});