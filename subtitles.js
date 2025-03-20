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
      subFormat: 'vtt',
      output: outputPath,
      skipDownload: true,
      verbose: true
    };
    
    const result = await youtubeDl(videoUrl, options);
    console.log("youtube-dl result:", result);
    
    // youtube-dl automatically adds extensions to the output file
    // Look for any files that match our output name pattern
    const files = await fs.readdir(outputDir);
    const subtitleFile = files.find(file => file.startsWith(path.basename(outputName)) && file.endsWith('.vtt'));
    
    if (!subtitleFile) {
      throw new Error('No subtitle file was generated');
    }
    
    const fullSubtitlePath = path.join(outputDir, subtitleFile);
    console.log(`Found subtitle file: ${fullSubtitlePath}`);
    
    // Read the subtitle file
    const subtitleContent = await fs.readFile(fullSubtitlePath, 'utf-8');
    
    // Parse VTT content into structured format
    const subtitles = parseVTT(subtitleContent);
    
    // Clean up temporary file
    await fs.unlink(fullSubtitlePath);
    
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

function parseVTT(vttContent) {
  console.log("Parsing VTT content:", vttContent.substring(0, 200) + "...");
  
  const lines = vttContent.split('\n');
  const subtitles = [];
  let currentSubtitle = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      // Time stamps line
      const [start, end] = line.split('-->').map(time => time.trim());
      currentSubtitle = {
        start: parseTimeStamp(start),
        end: parseTimeStamp(end),
        text: ''
      };
    } else if (line && !line.includes('WEBVTT') && currentSubtitle.start) {
      // Subtitle text
      currentSubtitle.text += line + ' ';
      
      // If next line is empty or we're at the end, save this subtitle
      if (!lines[i + 1]?.trim() || i === lines.length - 1) {
        currentSubtitle.text = currentSubtitle.text.trim();
        subtitles.push(currentSubtitle);
        currentSubtitle = {};
      }
    }
  }
  
  console.log(`Parsed ${subtitles.length} subtitles`);
  return subtitles;
}

function parseTimeStamp(timeStamp) {
  try {
    const [time, milliseconds] = timeStamp.split('.');
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