# YouTube Video Translation App

A web application for translating YouTube videos by extracting subtitles, translating them to a target language, generating speech, and syncing the new audio with the original video.

## Features

- Extract subtitles from YouTube videos
- Translate subtitles to various languages using Hugging Face models
- Generate natural speech from translated text using Hugging Face TTS API
- Combine the original video with the new translated audio

## Supported Languages

- Hindi
- Urdu
- Arabic
- Bengali
- Indonesian

## Prerequisites

- Node.js (14.x or higher)
- npm or yarn
- Hugging Face account and API token

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/yt-translation-app.git
   cd yt-translation-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file and add your Hugging Face API token:
   ```
   HF_API_TOKEN=your_huggingface_api_token_here
   ```

5. Create required directories:
   ```
   mkdir -p temp/audio temp/subtitles output uploads
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```

2. Open your browser and visit `http://localhost:3000`

3. Enter a YouTube URL and select a target language

4. Click "Translate Video" and wait for the process to complete

5. The processed video will be available for playback when complete

## How It Works

1. The app extracts subtitles from the YouTube video using youtube-dl
2. The subtitles are translated using Hugging Face translation models
3. The translated text is converted to speech using Hugging Face TTS models
4. FFmpeg is used to combine the original video with the new audio
5. The final video is served to the user

## API Endpoints

- `POST /process-video`: Process a video with the provided URL and target language

## License

MIT #   g e n A i - y t - t r a n s l a t e - t t s  
 