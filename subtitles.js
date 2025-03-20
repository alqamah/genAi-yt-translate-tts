const youtubeDl = require('youtube-dl-exec');
const fs = require('fs').promises;
const path = require('path');

async function getSubtitles(videoUrl) {
  try {
    // Create the output directory if it doesn't exist
    const outputDir = path.join('temp', 'subtitles');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputName = `subs_${Date.now()}`;
    const outputPath = path.join(outputDir, outputName);
    
    console.log(`Extracting subtitles from ${videoUrl} to ${outputPath}`);
    
    // Extract subtitles using youtube-dl with verbose logging
    const options = {
      writeSub: true,
      writeAutoSub: true,
      subFormat: 'srt',
      output: outputPath,
      skipDownload: true,
      verbose: true
    };
    
    const result = await youtubeDl(videoUrl, options);
    console.log("youtube-dl result:", result);
    
    // Look for the subtitle file
    const files = await fs.readdir(outputDir);
    const subtitleFile = files.find(file => file.startsWith(outputName) && file.endsWith('.srt'));
    
    if (!subtitleFile) {
      throw new Error('No subtitle file was generated');
    }
    
    const fullSubtitlePath = path.join(outputDir, subtitleFile);
    console.log(`Found subtitle file: ${fullSubtitlePath}`);
    
    // Read the subtitle file
    const subtitleContent = await fs.readFile(fullSubtitlePath, 'utf-8');
    console.log('Subtitle content preview:', subtitleContent.substring(0, 200));
    
    // Parse SRT content into structured format
    const subtitles = parseSRT(subtitleContent);
    
    if (subtitles.length === 0) {
      // If no subtitles were parsed, create a placeholder
      return [{
        start: 0,
        end: 5000,
        text: "No subtitles found. This is a placeholder text for translation."
      }];
    }
    
    return subtitles;
  } catch (error) {
    console.error('Error extracting subtitles:', error);
    
    // Return a placeholder subtitle in case of error
    return [{
      start: 0,
      end: 5000,
      text: "Failed to extract subtitles. This is a placeholder text for translation."
    }];
  }
}

function parseSRT(srtContent) {
  console.log("Parsing SRT content...");
  
  const lines = srtContent.split('\n');
  const subtitles = [];
  let currentSubtitle = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // If line is a number, it's the start of a new subtitle
    if (/^\d+$/.test(line)) {
      if (currentSubtitle.text) {
        subtitles.push(currentSubtitle);
      }
      currentSubtitle = {};
      continue;
    }
    
    // If line contains '-->', it's the timestamp
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(time => time.trim());
      currentSubtitle = {
        start: parseTimeStamp(start),
        end: parseTimeStamp(end),
        text: ''
      };
    } else if (currentSubtitle.start) {
      // This is subtitle text
      currentSubtitle.text += line + ' ';
    }
  }
  
  // Add the last subtitle if it exists
  if (currentSubtitle.text) {
    currentSubtitle.text = currentSubtitle.text.trim();
    subtitles.push(currentSubtitle);
  }
  
  console.log(`Parsed ${subtitles.length} subtitles`);
  return subtitles;
}

function parseTimeStamp(timeStamp) {
  try {
    const [time, milliseconds] = timeStamp.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + Number(milliseconds || 0);
  } catch (error) {
    console.error('Error parsing timestamp:', timeStamp, error);
    return 0;
  }
}

module.exports = {
  getSubtitles
};