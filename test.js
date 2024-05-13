/// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    const importFresh = require('import-fresh');
    const library = importFresh('../methods/library.js');
    
      //Must return this object at some point
      const response = {
         processFile : false,
         preset : '',
         container : '.mkv',
         handbrakeMode : false,
         ffmpegMode : true,
         reQueueAfter : true,
         infoLog : '',
    
      }

    // Specific log to confirm the script is executing
    console.log("13421234243 This is the GitHubScript");
    response.infoLog += '☒ 13421234243 This is the GitHubScript. \n';

    // Returning the response object which Tdarr expects
    return response;
};


module.exports.details = details;
module.exports.plugin = plugin;