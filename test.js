// eslint-disable-next-line no-unused-vars
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
    
      response.infoLog += ""
    
      if((true) || file.forceProcessing === true){
          response.preset = ', -map 0 -c copy'
          response.container = '.mkv'
          response.handbrakeMode = false
          response.ffmpegMode = true
          response.processFile = library.actions.remuxContainer(file, 'mkv').processFile
          response.infoLog +=  library.actions.remuxContainer(file, 'mkv').note
          return response
         }else{
          response.infoLog += library.actions.remuxContainer(file, 'mkv').note
          return response
         }
    }
    
    module.exports.details = details;
    module.exports.plugin = plugin;
    