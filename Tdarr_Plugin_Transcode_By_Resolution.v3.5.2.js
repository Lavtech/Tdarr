/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_Transcode_By_Resolution.v3.5.2",
    Stage: 'Pre-processing',
    Name: "JL Transcode By Resolution v3.5.2 ( fix max resolution )",
    Stage: "Pre-processing",
    Type: "Video",
    Operation: "Transcode",
    Description:
      "In a single pass ensures all files are in MP4 containers and encoded in h264 (Tiered bitrate based on resolution), removes audio and subtitles that are not in the configured language or marked as commentary.",
    Version: "2.0",
    Tags: "pre-processing,ffmpeg,nvenc h265",
    Inputs: [
        {
        name: "ffmpegPresetSpeed",
        type: 'string',
        defaultValue: 'fast',
        inputUI: {
          type: 'dropdown',
          options: [
            'slow',
            'medium',
            'fast',
           ],
        },
        tooltip: `== FFmpeg Preset ==\\n\\n
          Select the ffmpeg preset.\\n`,
      },
      {
        name: 'Max_Video_Height',
        type: 'number',
        defaultValue: `1080`,
        inputUI: {
          type: 'dropdown',
          options: [
            `720`,
            `1080`,
            `2160`,
            `4320`,
          ],
        },
        tooltip: 'Any thing over this size, I.E. 8K, will be reduced to this.',
      },
      {
        name: "target_bitrate_480p576p",
        type: 'string',
        defaultValue: '500000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 480p and 576p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 1 Mbps:\\n
                1000000`,
      },
      {
        name: "target_bitrate_720p",
        type: 'string',
        defaultValue: '3500000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 720p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 2 Mbps:\\n
                2000000`,
      },
      {
        name: "target_bitrate_1080p",
        type: 'string',
        defaultValue: '5000000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 1080p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 2.5 Mbps:\\n
                2500000`,
      },
      {
        name: "target_bitrate_2KUHD",
        type: 'string',
        defaultValue: '10000000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 2KUHD files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 14 Mbps:\\n
                14000000`,
      },
      {
        name: "target_bitrate_4KUHD",
        type: 'string',
        defaultValue: '12000000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 4KUHD files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 14 Mbps:\\n
                14000000`,
      },
      {
        name: 'downsampling',
        type: 'boolean',
        defaultValue: true,
        inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
        tooltip: 'Specify if you\'d like to downsample the existing audio track(s) to 2ch or keep'
          + 'it as is. (default: true)',
      },
      {
        name: "audio_language",
        type: 'string',
        defaultValue: 'eng',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify language tag/s here for the audio tracks you'd like to keep, recommended to keep "und" as this stands for undertermined, some files may not have the language specified. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng

                \\nExample:\\n
                eng,und

                \\nExample:\\n
                eng,und,jap`,
      },
      {
        name: "audio_commentary",
        type: 'string',
        defaultValue: 'true',
        inputUI: {
            type: 'dropdown',
            options: [
              'true',
              'false',
             ],
          },
        tooltip: `Specify if audio tracks that contain commentary/description should be removed.
                \\nExample:\\n
                true

                \\nExample:\\n
                false`,
      },
      {
        name: "subtitle_language",
        type: 'string',
        defaultValue: 'eng',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng

                \\nExample:\\n
                eng,jap`,
      },
      {
        name: "subtitle_commentary",
        type: 'string',
        defaultValue: 'true',
        inputUI: {
            type: 'dropdown',
            options: [
              'true',
              'false',
             ],
          },
        tooltip: `Specify if subtitle tracks that contain commentary/description should be removed.
                \\nExample:\\n
                true

                \\nExample:\\n
                false`,
      },
    ],
  };
}

/////////////  Fixed /////////////////
// fixed issue with audio getting removed if it was allread aac and 2 channel.
// need to fix the ( Check your plugin stack or transcode settings to make sure that you have conditions to prevent an infinite transcode loop )


//////////// Need to Fix //////////////
// Need to fix the max resolution setting. ( downsample if video has a resolution higher than max resolution preference )
// downsampling works just neeed to make it change the video -b:v ${bitratetarget}k -maxrate ${bitratemax}k -minrate ${bitratemin}
// Based on what resolution is chosen to resze to..... 


// #region Helper Classes/Modules

/**
 * Handles logging in a standardised way.
 */
class Log {
  constructor() {
    this.entries = [];
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  Add(entry) {
    this.entries.push(entry);
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  AddSuccess(entry) {
    this.entries.push(`☑ ${entry}`);
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  AddError(entry) {
    this.entries.push(`☒ ${entry}`);
  }

  /**
   * Returns the log lines separated by new line delimiter.
   */
  GetLogData() {
    return this.entries.join("\n");
  }
}

/**
 * Handles the storage of FFmpeg configuration.
 */
class Configurator {
  constructor(defaultOutputSettings = null) {
    this.shouldProcess = false;
    this.outputSettings = defaultOutputSettings || [];
    this.inputSettings = [];
  }

  AddInputSetting(configuration) {
    this.inputSettings.push(configuration);
  }

  AddOutputSetting(configuration) {
    this.shouldProcess = true;
    this.outputSettings.push(configuration);
  }

  ResetOutputSetting(configuration) {
    this.shouldProcess = false;
    this.outputSettings = configuration;
  }

  RemoveOutputSetting(configuration) {
    var index = this.outputSettings.indexOf(configuration);

    if (index === -1) return;
    this.outputSettings.splice(index, 1);
  }

  GetOutputSettings() {
    return this.outputSettings.join(" ");
  }

  GetInputSettings() {
    return this.inputSettings.join(" ");
  }
}

// #endregion



/**
 * Loops over the file streams and executes the given method on
 * each stream when the matching codec_type is found.
 * @param {Object} file the file.
 * @param {string} type the typeo of stream.
 * @param {function} method the method to call.
 */
function loopOverStreamsOfType(file, type, method) {
  var id = 0;
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id++;
    }
  }
}

/**
 * Removes audio tracks that aren't in the allowed languages or labeled as Commentary tracks.
 * Transcode audio if specified.
 */
function buildAudioConfiguration(inputs, file, logger) {
    var configuration = new Configurator([``]);
    var stream_count = 0;
    var streams_removing = 0;
    var languages = inputs.audio_language.split(",");
    

    function audioProcess(stream, id) {
        stream_count++;
        if ("tags" in stream && "title" in stream.tags && inputs.audio_commentary.toLowerCase() == "true") {
          if (
            stream.tags.title.toLowerCase().includes("commentary") ||
            stream.tags.title.toLowerCase().includes("description") ||
            stream.tags.title.toLowerCase().includes("sdh")
          ) {
            streams_removing++;
            configuration.AddOutputSetting(`-map -0:a:${id}`);
            logger.AddError(
              `Removing Commentary or Description audio track: ${stream.tags.title}`
            );
          }
        }
        if ("tags" in stream) {
          // Remove unwanted languages
          if ("language" in stream.tags) {
            if (languages.indexOf(stream.tags.language.toLowerCase()) === -1) {
              configuration.AddOutputSetting(`-map -0:a:${id}`);
              streams_removing++;
              logger.AddError(
                `Removing audio track in language ${stream.tags.language}`
                );
            }
          }
        }
      }


      loopOverStreamsOfType(file, "audio", audioProcess);

      if (stream_count == streams_removing) {
        logger.AddError(
          `*** All audio tracks would have been removed.  Defaulting to keeping all tracks for this file.`
        );
        configuration.ResetOutputSetting(["-c:a aac -ac 2 -strict -2 -async 1"]);
      }
     
      return configuration;
    }

 




/**
 * Removes subtitles that aren't in the allowed languages or labeled as Commentary tracks.
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-c:s mov_text"]);

  var languages = inputs.subtitle_language.split(",");
  if (languages.length === 0) return configuration;

  loopOverStreamsOfType(file, "subtitle", function (stream, id) {
    if (stream.codec_name === "dvd_subtitle" || stream.codec_tag_string === "hdmv" || stream.codec_tag_string === "pgssub" || stream.codec_tag_string === "hdmv_pgs_subtitle") {
      // unsupported subtitle codec?
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      logger.AddError(
        `Removing unsupported subtitle "${stream.codec_name}"`
      );
      return;
    }

    // Remove unknown sub streams
    if (!("codec_name" in stream)) {
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      logger.AddError(
        `Removing unknown subtitle`
      );
      return;
    }

    if ("tags" in stream) {
      // Remove unwanted languages
      if ("language" in stream.tags) {
        if (languages.indexOf(stream.tags.language.toLowerCase()) === -1) {
          configuration.AddOutputSetting(`-map -0:s:${id}`);
          logger.AddError(
            `Removing subtitle in language ${stream.tags.language}`
          );
          return;
        }
      }

      // Remove commentary subtitles
      if ("title" in stream.tags && (inputs.subtitle_commentary.toLowerCase() == "true")) {
        if (
          stream.tags.title.toLowerCase().includes("commentary") ||
          stream.tags.title.toLowerCase().includes("description") ||
          stream.tags.title.toLowerCase().includes("sdh")
        ) {
          configuration.AddOutputSetting(`-map -0:s:${id}`);
          logger.AddError(
            `Removing Commentary or Description subtitle: ${stream.tags.title}`
          );
          return;
        }
      }
    }
  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No subtitle processing necessary");
  }

  return configuration;
}







/**
 * Attempts to ensure that video streams are h265 encoded and inside an
 * MKV container.
 */
function buildVideoConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-map 0", "-map -0:d", ""]);

  var tiered = {
    "480p": {
      "bitrate": inputs.target_bitrate_480p576p,
      "bitchk": 500,
      "max_increase": 500,
      "cq": 24
    },
    "576p": {
      "bitrate": inputs.target_bitrate_480p576p,
      "bitchk": 500,
      "max_increase": 500,
      "cq": 24
    },
    "720p": {
      "bitrate": inputs.target_bitrate_720p,
      "bitchk": 1500,
      "max_increase": 2000,
      "cq": 30
    },
    "1080p": {
      "bitrate": inputs.target_bitrate_1080p,
      "bitchk": 2000,
      "max_increase": 5000,
      "cq": 31
    },
    "2KUHD": {
        "bitrate": inputs.target_bitrate_2KUHD,
        "bitchk": 2000,
        "max_increase": 4000,
        "cq": 31
      },
    "4KUHD": {
      "bitrate": inputs.target_bitrate_4KUHD,
      "bitchk": 2000,
      "max_increase": 6000,
      "cq": 31
    },
    "Other": {
      "bitrate": inputs.target_bitrate_1080p,
      "bitchk": 2000,
      "max_increase": 2500,
      "cq": 31
    }
  };


  var inputSettings = {
    "h263": "-c:v h263_cuvid",
    "h264": "",
    "hevc": "-c:v hevc_cuvid",
    "mjpeg": "-c:v mjpeg_cuvid",
    "mpeg1": "-c:v mpeg1_cuvid",
    "mpeg2": "-c:v mpeg2_cuvid",
    "vc1": "-c:v vc1_cuvid",
    "vp8": "-c:v vp8_cuvid",
    "vp9": "-c:v vp9_cuvid"
  }

  function videoProcess(stream, id) {
    if (stream.codec_name === "mjpeg") {
      configuration.AddOutputSetting(`-map -v:${id}`);
      return;
    }



  
  var presetSpeed = inputs.ffmpegPresetSpeed;



















//  var videoprofile = (file.ffProbeData.streams[0].profile)
// other variables
  var originalContainer = (file.container);
  var originalResolution = (file.video_resolution);
  var videoCodec = (stream.codec_name);
  var audioCodec = (file.ffProbeData.streams.find(stream => stream.codec_type === 'audio').codec_name);

  var videoNewWidth = 0;
  var bolScaleVideo = false;
  var ScaleVideo = ``;


 // Constant variables. 
const audioStream = file.ffProbeData.streams.find(stream => stream.codec_type === 'audio');
const downsampling = inputs.downsampling;
var chanNum = ``;
//  const targetVideoCodec = inputs.Target_Video_Codec;
const maxVideoHeight = inputs.Max_Video_Height;
const bitrateprobe = parseInt(file.bit_rate) / 1000;
// const minVideoPixels480 = 300000;
// const minVideoPixels720 = 750000;
// const minVideoPixels1080 = 1500000;
// const minVideoPixels2k = 1760000;
// const minVideoPixels4k = 6500000;

//  const minVideoRateSD = (inputs.target_bitrate_480p576p);
//  const minVideoRateHD = (inputs.target_bitrate_720p);
// const minVideoRate2K = (inputs.target_bitrate_1080p);
// const minVideoRate4K = (inputs.target_bitrate_4KUHD);


 






  var bframesSetting = ''; // Initialize to empty, assuming no B-frames by default
  var videoCodec = ''; // Initialize variable to store the video codec
  var videoBitrate = 0; // Initialize variable to store the video bitrate
  var videoHeight = 0; // Initialize variable to store the video height
  var videoWidth = 0; // Initialize variable to store the video width
  var videoStreamID = -1;

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
  // Check if the current stream is a video stream
  if (file.ffProbeData.streams[i].codec_type.toLowerCase() === "video") {
      // Capture the video codec name
      videoCodec = file.ffProbeData.streams[i].codec_name;
      videoStreamID = [i];

      // Attempt to capture the video bitrate; it might not always be directly available or accurate
      // Bitrate could be in file.ffProbeData.streams[i].bit_rate or could be calculated/estimated differently
      videoBitrate = file.ffProbeData.streams[i].bit_rate ? parseInt(file.ffProbeData.streams[i].bit_rate) : 0;

      // Capture the video height and width
      videoHeight = file.ffProbeData.streams[i].height ? parseInt(file.ffProbeData.streams[i].height) : 0;
      videoWidth = file.ffProbeData.streams[i].width ? parseInt(file.ffProbeData.streams[i].width) : 0;

      // Assuming 'hasBframes' and 'bFrameCount' are somehow determinable (which may not be directly possible)
      // For the sake of example, let's say you have a custom attribute or method to determine this
      var hasBframes = true; // This would need to be determined by your actual data or assumptions
      var bFrameCount = 5; // Similarly, this would need to be determined or assumed based on your conditions

      if (hasBframes && bFrameCount === 5) {
        // B-Frame count has to be a max of 4 if transcoding to h264
          bframesSetting = `-bf 4`;
          logger.Add(`☑ Video stream ${i} uses B-frames with a count of: ${bFrameCount}\n`);
          // Including the video height and width in the log
          logger.Add(`☑ Video stream ${i} resolution: ${videoWidth}x${videoHeight}\n`);
          break; // Assuming you only need to find the first video stream that matches this criteria
      }
    }
  }

  
  logger.Add (`☑ Video Stream ID is: ${videoStreamID}`);
  var main10 = ``;
  if (file.ffProbeData.streams[i].profile.includes("10")) {
    //    logger.Add(`Video File profile is: ${file.ffProbeData.streams[0].profile}`);
        var main10 = `-pix_fmt yuv420p`
        logger.Add (`☑ Video File profile is 10 bit. We will transcode to 10 bit.`);
    
        } else {
        logger.Add (`☑ Video File profile is less than 10 bit`);
    
        }

///   This section defines the correct video resolutions to search for. with a little bit of differences in pixel size, so its not so strict.
////////////////////////////////////////////////////////////////////////////
// Function to check if the video is in a recognized resolution and return its name
    function checkResolutionByPixelsWithAllowance(videoWidth, videoHeight) {
        const pixelCount = videoWidth * videoHeight;
        const knownResolutions = [
            { name: "480p", pixels: 307200 },
            { name: "576p", pixels: 414720 },
            { name: "720p", pixels: 921600 },
            { name: "1080p", pixels: 2073600 },
            { name: "2KUHD", pixels: 3686400 },
            { name: "4KUHD", pixels: 8294400 },
        ];

        const allowance = 0.2; // 20% margin

        for (const resolution of knownResolutions) {
            const lowerBound = resolution.pixels * (1 - allowance);
            const upperBound = resolution.pixels * (1 + allowance);
            if (pixelCount >= lowerBound && pixelCount <= upperBound) {
                return resolution.name;
            }
        }

        return null; // If no match found
    }

    function resolutionNameToValue(resolutionName) {
        const resolutionValues = {
            "480p": 1,
            "576p": 2,
            "720p": 3,
            "1080p": 4,
            "2KUHD": 5,
            "4KUHD": 6
        };
        return resolutionValues[resolutionName] || 0; // Default to 0 if resolutionName is not recognized
    }



  







    // let KnownResolution = file.video_resolution;
     const matchedResolution = checkResolutionByPixelsWithAllowance(videoWidth, videoHeight);

    let KnownResolution = checkResolutionByPixelsWithAllowance(videoWidth, videoHeight);
    let maxVidHeightValue = resolutionNameToValue(`${maxVideoHeight}p`);
    let knownResolutionValue = resolutionNameToValue(KnownResolution);
    var selectedTier = [];
    var SelectedTier = [];

    if (knownResolutionValue >= maxVidHeightValue) {
        var selectedTier = tiered[`${maxVideoHeight}p`]; // Ensure maxVideoHeight is a string like "1080"
        //Now calculate your bitrate settings using the selectedTier
        var bitratecheck = (parseInt(selectedTier.bitrate) / 1000) + selectedTier.bitchk;
        var bitratecheck = parseInt(selectedTier.bitrate) / 1000 + selectedTier.bitchk;
        var bitratetarget = (parseInt(selectedTier.bitrate) / 1000);
        var bitratemax = bitratetarget + (selectedTier.max_increase);
        var bitratemin = bitratetarget / 1.5; // Example calculation for min bitrate 
        var bitRatemin = parseFloat(inputs.target_pct_reduction) + 1;
        var bitratemin = parseInt(bitratetarget / "1.50");
        var tierbitrate = parseInt(selectedTier.bitrate / 1000);
        var tierbitchk = parseInt(selectedTier.bitchk);
        var tiermax_increase = parseInt(selectedTier.max_increase);
        var cq = (selectedTier.cq);


        logger.Add(`DEBUG::::::    This is the selectedTier: ${JSON.stringify(selectedTier)}`);
      } else if (knownResolutionValue <= maxVidHeightValue) {
//        var tier = tiered[KnownResolution];
        var SelectedTier = tiered[knownResolutionValue];
        var bitratecheck = (parseInt(selectedTier.bitrate) / 1000) + selectedTier.bitchk;
        var bitratecheck = parseInt(selectedTier.bitrate) / 1000 + selectedTier.bitchk;
        var bitratetarget = (parseInt(selectedTier.bitrate) / 1000);
        var bitratemax = bitratetarget + (selectedTier.max_increase);
        var bitratemin = bitratetarget / 1.5; // Example calculation for min bitrate 
        var bitRatemin = parseFloat(inputs.target_pct_reduction) + 1;
        var bitratemin = parseInt(bitratetarget / "1.50");
        var tierbitrate = parseInt(selectedTier.bitrate / 1000);
        var tierbitchk = parseInt(selectedTier.bitchk);
        var tiermax_increase = parseInt(selectedTier.max_increase);
        var cq = (selectedTier.cq);
          
          logger.Add(`DEBUG::::::    No this is the selectedTier: ${JSON.stringify(SelectedTier)}`);
      }



/////    This section doesnt work. it only works if teh same resolution is selected or the video resolution is getting down sized
/////     the error is TypeError: Cannot read properties of undefined (reading 'bitrate')
  


    logger.Add(`DEBUG::::::    matchedResolution: ${matchedResolution}`);
    if (!matchedResolution) {
        logger.Add(`Video is not in a recognized resolution and will not do anything.`);
        // Here you would exit the script or process accordingly
        return;
    }


//var tier = tiered[KnownResolution];
  // var bitratecheck = parseInt(tier["bitrate"] / 1000) + parseInt(tier["bitchk"]);
  // var bitratetarget = parseInt(tier["bitrate"] / 1000);
  // var bitratemax = parseInt(bitratetarget) + parseInt(tier["max_increase"]);
  // var bitRatemin = parseFloat(inputs.target_pct_reduction) + 1;
  // var bitratemin = parseInt(bitratetarget / "1.50");
  // var tierbitrate = parseInt(tier["bitrate"] / 1000);
  // var tierbitchk = parseInt(tier["bitchk"]);
  // var tiermax_increase = parseInt(tier["max_increase"]);
  // var cq = tier["cq"];


/////    check to see if we need to scale the video resolution.
///// Scale video if necessary
///////////////////////////////////////////////////////////////////////////////////
    var bolScaleVideo = videoHeight > inputs.Max_Video_Height;
    var ScaleVideo = bolScaleVideo ? `-vf scale=-2:${inputs.Max_Video_Height}` : "";

    // Select appropriate tier based on the resolution or Max_Video_Height
    var resolutionKey = Object.keys(tiered).find(key => {
        const [resWidth, resHeight] = key.match(/\d+/g) ? key.match(/\d+/g).map(Number) : [0, 0];
        return videoHeight <= resHeight && videoWidth <= resWidth;
    }) || "Other";








      var copyRightExists = ('Copyright' in file.mediaInfo.track[0]) && (file.mediaInfo.track[0].Copyright === 'tdarrd');

      
      
      if (copyRightExists){

            logger.AddSuccess(`☑The has video been transcoded before: ${copyRightExists}`);
 
      return;
      
      } else {
     
      }

 


  if (audioStream) {
      const audioChannels = audioStream.channels;
//      logger.Add(`The video file has ${audioChannels} audio channels.`);
      if (downsampling === true && audioChannels === 6 && audioCodec !== "aac"){
        chanNum += `-c:a aac -ac 2 -strict -2 -async 1`;
        logger.Add(`☑ Downsampling is enabled`);
        logger.Add(`☑ Audio file has ${audioChannels} audio channels and is not "AAC", Downsampling to 2 channels.`);
      } else if (downsampling === true && audioChannels === 6 && audioCodec === "aac"){ 
        chanNum += `-c:a aac -ac 2 -strict -2 -async 1`;
        logger.Add(`☑ Downsampling is enabled`);
        logger.Add(`☑ Audio file has ${audioChannels} audio channels and is "AAC", Downsampling to 2 channels.`);
      } else if (downsampling === true && audioChannels === 2 && audioCodec === "aac"){ 
        chanNum += `-c:a copy -async 1`;
        logger.Add(`☑ Downsampling is enabled`);
        logger.Add(`☑ Audio file has ${audioChannels} audio channels and is "AAC", Video already has 2 channels so nothing to do.`);
      } else if (downsampling === true && audioChannels === 2 && audioCodec !== "aac"){ 
        chanNum += `-c:a aac -strict -2 -async 1`;
        logger.Add(`☑ Downsampling is enabled`);
        logger.Add(`☑ Audio file has ${audioChannels} audio channels and is "AAC", Video already has 2 channels but wrong codec.`);
      } else if (downsampling !== true && audioCodec === "aac"){
        chanNum += `-c:a copy -async 1`;
        logger.Add(`☑ Downsampling is disabled`);
        logger.Add(`☑ Audio file has "${audioChannels}" Channels and is "AAC"`);
      } else if (downsampling !== true && audioCodec !== "aac"){
        chanNum += `-c:a aac -strict -2 -async 1`;
        logger.Add(`☑ Downsampling is disabled`);
        logger.Add(`☑ Audio file has "${audioChannels}" Channels and is not "AAC"`);
  }
  }







    logger.Add (`☑ Video resolution is "${file.video_resolution}"`);
    logger.Add (`☑ Video container is "${originalContainer}"`);
    logger.Add (`☑ Video codec is "${videoCodec}"`);
    logger.Add (`☑ Audio codec is "${audioCodec}"`);
//    logger.Add (`☑ Video File bitrate is "${bitrateprobe}KB"`);
    

    



// 


//    remove png streams.
    if (stream.codec_name === "png") {
        configuration.AddOutputSetting(`-map -0:v:${id}`);
      } else if ((stream.codec_name === "h264" || stream.codec_name !== "h264") && (file.container !== "mp4" || file.container === "mp4") && bitrateprobe > bitratecheck) {  // Check if should Transcode.
        logger.AddError (`Video File has a bitrate of: "${bitrateprobe}KB" which is higher than specified video bitrate to check for: ${bitratecheck}Kb.`); 
        logger.Add (`☑ So we will transcode and compress.`);
        logger.Add (``);
  
        configuration.RemoveOutputSetting("-c:v copy");
        configuration.AddOutputSetting(
          `-c:v h264_nvenc ${main10} ${ScaleVideo} -movflags +faststart -qmin 0 -cq:v ${cq} -b:v ${bitratetarget}k -maxrate ${bitratemax}k -minrate ${bitratemin} -bufsize 5M -preset ${presetSpeed} ${bframesSetting} -rc-lookahead 100 -spatial_aq:v 1 -aq-strength:v 8 ${chanNum}`
        );
        logger.Add (`☑ Video File bitrate to check for this resolution of "${file.video_resolution}" is "${bitratecheck}KB"`);
        logger.Add (`☑ Video File bitrate compression for this resolution of "${file.video_resolution}" is "${cq}"`);
        logger.Add (`☑ Video File bitratetarget set to "${bitratetarget}KB"`);
        logger.Add (`☑ Video File bitratemax set to "${bitratemax}KB"`);
        logger.Add (`☑ Video File bitratemin set to "${bitratemin}KB"`);
        logger.Add (`☑ To Calculate BitrateMax we do this ${bitratetarget}KB + ${tiermax_increase}KB = "${bitratemax}KB"`);
        logger.Add (`☑ To Calculate BitrateMin we do this ${bitratetarget}KB / 1.50 = "${bitratemin}KB"`);
        logger.Add(`☑ Tagging video`);
  //      logger.Add(`☑ Video File resolution is ${file.video_resolution}`);
  
  
    configuration.AddInputSetting(inputSettings[file.video_codec_name]);

    if (file.video_codec_name === "h264" && (!file.ffProbeData.streams[i].profile.includes("10"))) {
    configuration.AddInputSetting("-c:v h264_cuvid");
    logger.Add(`☑ DEBUG:::: Video is h264 and not High 10`);
    } 
//    else if (file.video_codec_name === "hevc" && (file.ffProbeData.streams[i].profile.includes("10"))) {
//    configuration.AddInputSetting("-c:v hevc_cuvid");
//    logger.Add(`☑ DEBUG:::: Video is hevc and High 10`);
//    }
 
      } else if (bitrateprobe < bitratecheck) {
        logger.AddError (` Video bitrate is: "${bitrateprobe}KB" which is lower than specified video bitrate to check for: "${bitratecheck}KB"`); 
        logger.Add (`☑ So we will transcode and not compress.`);
        logger.Add(`☑ Tagging video`);
        configuration.RemoveOutputSetting("-c:v copy");
        configuration.AddOutputSetting(`-c:v h264_nvenc ${main10} ${ScaleVideo} -movflags +faststart -qmin 0 -cq:v 24 -b:v ${bitrateprobe}k -maxrate ${bitrateprobe}k -bufsize 5M -preset ${presetSpeed} ${chanNum}`)

      return;
      }
    }
  
    loopOverStreamsOfType(file, "video", videoProcess);
  
    if (!configuration.shouldProcess) {
      logger.AddSuccess("No video processing necessary");
    }
  
    return configuration;
  }

//#endregion
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const plugin = (file, librarySettings, inputs, otherArguments) => {
        
        const lib = require('../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    inputs = lib.loadDefaultValues(inputs, details);
    var response = {
        container: ".mp4",
        FFmpegMode: true,
        handBrakeMode: false,
        infoLog: "",
        processFile: false,
        preset: "",
        reQueueAfter: false,
    };


    var logger = new Log();
    var audioSettings = buildAudioConfiguration(inputs, file, logger);
    var videoSettings = buildVideoConfiguration(inputs, file, logger);
    var subtitleSettings = buildSubtitleConfiguration(inputs, file, logger);

    response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()}`
//    response.preset = `,${videoSettings.GetOutputSettings()}`
    response.preset += ` ${audioSettings.GetOutputSettings()}`
    response.preset += ` ${subtitleSettings.GetOutputSettings()}`

    response.preset += ` -metadata copyright=tdarrd -max_muxing_queue_size 9999`;
    
    // Extra parameters
    var id = 0;
    //  var badTypes = ['mov_text', 'eia_608', 'timed_id3', 'mp4s'];
        var badTypes = ['sdh', 'vobsub', 'timed_id3', 'dvd', `hdmv`, `pgs`, `hdmv_pgs_subtitle`];
    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        if (badTypes.includes(file.ffProbeData.streams[i].codec_name)) {
        response.preset += ` -map -0:${i}`;
        };
        id++;

    }
 

    // fix probe size errors
    response.preset += ` -analyzeduration 2147483647 -probesize 2147483647`;

    response.processFile =
    audioSettings.shouldProcess ||
    videoSettings.shouldProcess ||
    subtitleSettings.shouldProcess;

    if (!response.processFile) {
    logger.AddSuccess("No need to process file");
    return response;
    }

response.infoLog += logger.GetLogData();
return response;
}





module.exports.details = details;
module.exports.plugin = plugin;