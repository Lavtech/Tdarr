/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_Transcode_By_Resolution.v3.5.1",
    Stage: 'Pre-processing',
    Name: "JL Transcode By Resolution v3.5.1 ( fixed looping issue )",
    Stage: "Pre-processing",
    Type: "Video",
    Operation: "Transcode",
    Description:
      "In a single pass ensures all files are in MP4 containers and encoded in h264 (Tiered bitrate based on resolution), removes audio and subtitles that are not in the configured language or marked as commentary.",
    Version: "2.0",
    Tags: "pre-processing,ffmpeg,nvenc h265",
    Inputs: [
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
        if ("tags" in stream && "title" in stream.tags && inputs.audio_commentary.toLowerCase() == "true" && file.video_resolution !== "4KUHD") {
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
        if ("tags" in stream && file.video_resolution !== "4KUHD") {
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
  if (languages.length === 0 && file.video_resolution !== "4KUHD") return configuration;

  loopOverStreamsOfType(file, "subtitle", function (stream, id) {
    if (stream.codec_name === "s_dvd_subtitle" || stream.codec_name === "dvd_subtitle" || stream.codec_tag_string === "hdmv" || stream.codec_tag_string === "pgssub" || stream.codec_tag_string === "hdmv_pgs_subtitle") {
      // unsupported subtitle codec?
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      logger.AddError(
        `Removing unsupported subtitle "${stream.codec_name}"`
      );
      return;
    }

    // Remove unknown sub streams
    if (!("codec_name" in stream) && file.video_resolution !== "4KUHD") {
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      logger.AddError(
        `Removing unknown subtitle`
      );
      return;
    }

    if ("tags" in stream && file.video_resolution !== "4KUHD") {
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
      if ("title" in stream.tags && (inputs.subtitle_commentary.toLowerCase() == "true") && file.video_resolution !== "4KUHD") {
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
    "mjpeg": "c:v mjpeg_cuvid",
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
  var bitrateprobe = parseInt((file.bit_rate) / 1000);
  
  /*  Determine tiered bitrate variables */
  var tier = tiered[file.video_resolution];
  var bitratecheck = parseInt(tier["bitrate"] / 1000) + parseInt(tier["bitchk"]);
  var bitratetarget = parseInt(tier["bitrate"] / 1000);
  var bitratemax = parseInt(bitratetarget) + parseInt(tier["max_increase"]);
//    var bitRatemin = parseFloat(inputs.target_pct_reduction) + 1;
  var bitratemin = parseInt(bitratetarget / "1.50");
  var tierbitrate = parseInt(tier["bitrate"] / 1000);
  var tierbitchk = parseInt(tier["bitchk"]);
  var tiermax_increase = parseInt(tier["max_increase"]);
  var main10 = ``;
  var cq = tier["cq"];
  var videoprofile = (file.ffProbeData.streams[0].profile)
// other variables
  var originalContainer = (file.container);
  var videoCodec = (stream.codec_name);
  var audioCodec = (file.ffProbeData.streams.find(stream => stream.codec_type === 'audio').codec_name);



  if (file.ffProbeData.streams[0].profile === "10 bit") {
    var main10 = `-pix_fmt yuv420p`
    logger.Add (`☑ Video File profile is High 10`);
       } else {
        logger.Add (`☑ Video File profile is less than 10 bit`);
       }


const audioStream = file.ffProbeData.streams.find(stream => stream.codec_type === 'audio');
const downsampling = inputs.downsampling;
var chanNum = ``;

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





  

var copyRightExists = ('Copyright' in file.mediaInfo.track[0]) && (file.mediaInfo.track[0].Copyright === 'tdarrd');
// var is4k = file.video_resolution === "4KUHD";
// var ish264 = stream.codec_name === "h264";
// var ismp4 = file.container === "mp4";
// var belowrequestedbitrate = bitrateprobe < bitratecheck; 
// var isaac = audioCodec === "aac";
//var meetsCriteria = file.video_resolution !== "4KUHD" && stream.codec_name === "h264" && file.container === "mp4" && bitrateprobe < bitratecheck;


if (copyRightExists){
//    if (meetsCriteria) {
//      logger.Add(`File is in the right codec "${videoCodec}" codec and in the right container "${originalContainer}" and has the right bitrate, And is tagged as tdarrd`);
      logger.AddSuccess(`☑The has video been transcoded before: ${copyRightExists}`);
//      logger.Add(`☑ Video is 4K: ${is4k}`);
    //   logger.Add(`☑ Video is H264: ${ish264}`);
    //   logger.Add(`☑ Video is MP4: ${ismp4}`);
    //   logger.Add (`☑ Video codec is "${videoCodec}"`);
//      response.processFile = false;
return;

} else {
//    logger.Add(`File is in the right codec "${videoCodec}" codec and in the right container "${originalContainer}" and has the right bitrate, But is not tagged as tdarrd`);
//      logger.Add("Tagging video");
//    configuration.AddOutputSetting(`-c:v copy -c:a copy`)

//    return;
}


    logger.Add (`☑ Video resolution is "${file.video_resolution}"`);
    logger.Add (`☑ Video container is "${originalContainer}"`);
    logger.Add (`☑ Video codec is "${videoCodec}"`);
    logger.Add (`☑ Audio codec is "${audioCodec}"`);
    logger.Add (`☑ Video File bitrate is "${bitrateprobe}KB"`);
    

    






    // remove png streams.
    if (stream.codec_name === "png") {
        configuration.AddOutputSetting(`-map -0:v:${id}`);
      } else if (file.video_resolution !== "4KUHD" && (stream.codec_name === "h264" || stream.codec_name !== "h264") && (file.container !== "mp4" || file.container === "mp4") && bitrateprobe > bitratecheck) {  // Check if should Transcode.
        logger.AddError (`Video File is not 4K and has a bitrate of: "${bitrateprobe}KB" which is higher than specified video bitrate to check for: ${bitratecheck}Kb.`); 
        logger.Add (`☑ So we will transcode and compress.`);
        logger.Add (``);
  
        configuration.RemoveOutputSetting("-c:v copy");
        configuration.AddOutputSetting(
          `-c:v h264_nvenc -pix_fmt yuv420p -qmin 0 -cq:v ${cq} -b:v ${bitratetarget}k -maxrate ${bitratemax}k -minrate ${bitratemin} -bufsize 5M -preset ${presetSpeed} -movflags +faststart -rc-lookahead 100 -spatial_aq:v 1 -aq-strength:v 8 ${chanNum}`
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
  
        // if (file.video_codec_name === "h264" && file.ffProbeData.streams[0].profile !== "High 10") {
        //   configuration.AddInputSetting("-c:v h264_cuvid");

        // }
 
      } else if (file.video_resolution !== "4KUHD" && bitrateprobe < bitratecheck) {
        logger.AddError (` Video File is not 4K and has a bitrate of: "${bitrateprobe}KB" which is lower than specified video bitrate to check for: "${bitratecheck}KB"`); 
        logger.Add (`☑ So we will transcode and not compress.`);
        logger.Add(`☑ Tagging video`);
        configuration.RemoveOutputSetting("-c:v copy");
        configuration.AddOutputSetting(`-c:v h264_nvenc -pix_fmt yuv420p -movflags +faststart -qmin 0 -cq:v 24 -b:v ${bitrateprobe}k -maxrate ${bitrateprobe}k -bufsize 5M -preset ${presetSpeed} ${chanNum}`)

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

//    response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()}`
    response.preset = `,${videoSettings.GetOutputSettings()}`
    response.preset += ` ${audioSettings.GetOutputSettings()}`
    response.preset += ` ${subtitleSettings.GetOutputSettings()}`

    response.preset += ` -metadata copyright=tdarrd -max_muxing_queue_size 9999`;
    
    // Extra parameters
    var id = 0;
    //  var badTypes = ['mov_text', 'eia_608', 'timed_id3', 'mp4s'];
        var badTypes = ['sdh', 'vobsub', 'timed_id3', 'dvd', 'hdmv', 'pgs', 'hdmv_pgs_subtitle', 's_dvd_subtitle', 'dvd_subtitle'];
    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        if (badTypes.includes(file.ffProbeData.streams[i].codec_name)) {
        response.preset += ` -map -0:${i}`;
        };
        id++;

    }
 

    // fix probe size errors
    response.preset += ` -analyzeduration 5400000000 -probesize 5400000000`;

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