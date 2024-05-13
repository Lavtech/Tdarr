// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const plugin = (file, librarySettings, inputs, otherArguments) => {
//   const lib = require('../methods/lib')();
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
//   inputs = lib.loadDefaultValues(inputs, details);
//   const response = {
//     processFile: true,
//     preset: '',
//     handBrakeMode: false,
//     container: `.mkv`,
//     FFmpegMode: true,
//     reQueueAfter: true,
//     infoLog: '',
//   };
//original_container = `.${file.container}`,

// Specific log to confirm the script is executing
    console.log("13421234243 This is the GitHubScript");
    response.infoLog += ' 13421234243 This is the GitHubScript. \n';


  // Convert file if convert variable is set to true.
//if ($original_container !== `.mkv`)
//    response.preset += `,-map 0 -c copy -max_muxing_queue_size 9999`;
//    response.processFile = true;

//  return response;
// };



module.exports.details = details;
module.exports.plugin = plugin;