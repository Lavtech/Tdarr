/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const vm = require('vm');
const importFresh = require('import-fresh');

const details = () => ({
    id: "Tdarr_Plugin_Skip_By_Modified_Date",
    Name: "Skip by modified date",
    Type: "Video",
    Operation: "Filter",
    Description: "This will skip the file if the modified date is older than the specified date. If you like this plugin please Buy me a Beer https://buymeacoffee.com/jjlavery",
    Version: "1.0",
    Link: "https://buymeacoffee.com/jjlavery",
    Inputs: [
        {
            name: 'Specify_date_day',
            type: 'string',
            defaultValue: '01',
            inputUI: {
              type: 'dropdown',
              options: [
                '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
                '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
                '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31',
              ],
            },
            tooltip: 'Enter the number of the day',
          },
          {
            name: 'Specify_date_month',
            type: 'string',
            defaultValue: '01',
            inputUI: {
              type: 'dropdown',
              options: [
                '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
              ],
            },
            tooltip: 'Enter the number of the month',
          },
          {
            name: 'Specify_date_year',
            type: 'string',
            defaultValue: '2024',
            inputUI: {
              type: 'dropdown',
              options: [
                '2024', '2023', '2022', '2021', '2020',
              ],
            },
            tooltip: 'Enter the number of the year',
          },
    ],
});
// This script was made by _davirus_
// you can find me on discord Tdarr chan. 
// I am not online very much but feel free to drop me a message.


const plugin = (file, librarySettings, inputs, otherArguments) => {
    return new Promise((resolve, reject) => {
        const response = {
            processFile: true,
            preset: '',
            container: '.mkv',
            handbrakeMode: false,
            ffmpegMode: true,
            reQueueAfter: true,
            infoLog: '',
        };

        // Extract inputs for the specified date
        const specify_Date_day = parseInt(inputs.Specify_date_day, 10);
        const specify_Date_month = parseInt(inputs.Specify_date_month, 10); // Month is not 0-indexed for logging
        const specify_Date_year = parseInt(inputs.Specify_date_year, 10);

        // Ensure the user provided valid inputs
        if (isNaN(specify_Date_day) || isNaN(specify_Date_month) || isNaN(specify_Date_year)) {
            return resolve({
                processFile: false,
                infoLog: "Invalid date input provided. Skipping file.",
            });
        }

        // Construct a Date object from the user inputs
        const specifiedDate = new Date(specify_Date_year, specify_Date_month - 1, specify_Date_day); // Month is 0-indexed for Date object

        // Validate specifiedDate
        if (isNaN(specifiedDate.getTime())) {
            return resolve({
                processFile: false,
                infoLog: "Invalid specified date constructed. Please correct this before proceeding.",
            });
        }

        // Format specified date for logging
        const formattedSpecifiedDate = {
            day: specify_Date_day.toString().padStart(2, '0'),
            month: specify_Date_month.toString().padStart(2, '0'),
            year: specify_Date_year.toString(),
        };


        // Extract file modified date info from the file object
        if (file && file.meta && file.meta.FileModifyDate) {
            const { day, month, year } = file.meta.FileModifyDate;
            const fileModifiedDate = new Date(year, month - 1, day);


            // Compare specified date to file modified date
            if (specifiedDate > fileModifiedDate) {
                response.infoLog += `------------------------------------------------------------------------------------\n`;
                response.infoLog += `Specified Date to look for: Day: ${formattedSpecifiedDate.day} Month: ${formattedSpecifiedDate.month} Year: ${formattedSpecifiedDate.year}\n`;
                response.infoLog += `File Modified Date: Day: ${day} Month: ${month} Year: ${year}\n`;
                response.infoLog += `------------------------------------------------------------------------------------\n`;
                response.infoLog += `Specified date is newer than or equal to the file modified date. Skipping file.\n\n`;
                response.processFile = false;
            } else {
                response.infoLog += "Specified date is older than or equal to the file modified date. Good to proceed.\n\n";
            }
        } else {
//            console.log("FileModifyDate not found in file.meta object.");
            response.infoLog += `------------------------------------------------------------------------------------\n`;
            response.infoLog += "File Modified Date not found in file.meta object.\n";
            response.infoLog += "The file may be corupt or in a codec not compatible.\n";
            response.infoLog += "Please try another file or fix this one.\n";
            response.infoLog += `------------------------------------------------------------------------------------\n`;
        }


        // Resolve promise to indicate plugin has completed execution
        return resolve(response);

    });
};

module.exports.details = details;
module.exports.plugin = plugin;
