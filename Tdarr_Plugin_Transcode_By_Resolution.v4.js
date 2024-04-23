/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_Transcode_By_Resolution.v4",
    Stage: 'Pre-processing',
    Name: "JL Transcode By Resolution v4 ( getting script from github )",
    Stage: "Pre-processing",
    Type: "Video",
    Operation: "Transcode",
    Description:
      "In a single pass ensures all files are in MP4 containers and encoded in h264 (Tiered bitrate based on resolution), removes audio and subtitles that are not in the configured language or marked as commentary.",
    Version: "2.0",
    Tags: "pre-processing,ffmpeg,nvenc h265",
    Inputs: [],
  };
}

module.exports.plugin = function plugin(file, librarySettings, inputs) {
    const url = 'https://raw.githubusercontent.com/your-username/tdarr-scripts/main/process-media.js';
  
    https.get(url, (resp) => {
      let data = '';
  
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });
  
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        try {
          const script = new vm.Script(data);
          const context = vm.createContext({ file, librarySettings, inputs });
          script.runInContext(context);
          console.log('Script executed successfully:', file.file);
        } catch (err) {
          console.error('Failed to execute the script:', err);
        }
      });
  
    }).on("error", (err) => {
      console.error("Error fetching the script: " + err.message);
    });
  
    return file;
  };



module.exports.details = details;
module.exports.plugin = plugin;