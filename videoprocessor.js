const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const youtubeDl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs').promises;

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

async function processVideo(videoUrl, audioPath) {
  let videoPath = null;
  
  try {
    // Download video using youtube-dl
    videoPath = path.join('temp', `video_${Date.now()}.mp4`);
    console.log(`Downloading video from ${videoUrl} to ${videoPath}`);
    
    const downloadOptions = {
      output: videoPath,
      format: 'mp4',
      verbose: true
    };
    
    const result = await youtubeDl(videoUrl, downloadOptions);
    console.log("Video download result:", result);
    
    // Check if the video file exists
    try {
      await fs.access(videoPath);
      console.log(`Video file exists at ${videoPath}`);
    } catch (err) {
      console.error(`Video file doesn't exist at ${videoPath}`);
      
      // Try alternative method with specific format
      const altOptions = {
        output: videoPath,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        mergeOutputFormat: 'mp4',
        verbose: true
      };
      
      console.log("Trying alternative download method...");
      await youtubeDl(videoUrl, altOptions);
      
      try {
        await fs.access(videoPath);
        console.log(`Alternative download successful, file exists at ${videoPath}`);
      } catch (err) {
        throw new Error(`Failed to download video: ${err.message}`);
      }
    }

    // Process video with new audio
    const outputPath = path.join('output', `processed_${Date.now()}.mp4`);
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        // Keep original video stream
        .videoCodec('copy')
        // Replace audio stream
        .audioCodec('aac')
        // Map video from first input
        .outputOptions('-map 0:v:0')
        // Map audio from second input
        .outputOptions('-map 1:a:0')
        // Ensure audio sync
        .outputOptions('-async 1')
        // Output format
        .format('mp4')
        .on('start', (commandLine) => {
          console.log('Started processing video:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', async () => {
          console.log('Video processing completed');
          // Clean up temporary video file
          try {
            await fs.unlink(videoPath);
          } catch (err) {
            console.error('Error cleaning up temp file:', err);
          }
          resolve(outputPath);
        })
        .on('error', async (err) => {
          console.error('Error processing video:', err);
          // Clean up temporary video file
          try {
            if (videoPath) {
              await fs.unlink(videoPath);
            }
          } catch (cleanupErr) {
            console.error('Error cleaning up temp file:', cleanupErr);
          }
          reject(err);
        })
        .save(outputPath);
    });
  } catch (error) {
    console.error('Error in video processing:', error);
    // Clean up temporary video file
    try {
      if (videoPath) {
        await fs.unlink(videoPath);
      }
    } catch (cleanupErr) {
      console.error('Error cleaning up temp file:', cleanupErr);
    }
    throw error;
  }
}

module.exports = {
  processVideo
};