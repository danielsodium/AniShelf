const { https } = require("follow-redirects");
const $ = require('jquery');
const electron = require('electron')
const downloader = require('../src/download.js')
const loader = require('../src/loader.js')

function downloadAllAni(link,title) {
    electron.ipcRenderer.invoke('show-notification', "Getting download link", title);

    title = title;
    downloader.getData(link, function(info) {
        parsed = JSON.parse(info).data.episode;
        console.log(parsed);

        for (var i = 0; i < parsed.sourceUrls.length; i++) {
            console.log(parsed.sourceUrls[i]);
            if (parsed.sourceUrls[i].sourceUrl.includes("workfields")) {
                link = parsed.sourceUrls[i].sourceUrl;
                downloader.checkIfDownloaded(title, "Episode "+ parsed.episodeString, function(exists) {
                    if (!exists) {
                        downloader.addQueue(link, title,"Episode " + parsed.episodeString, parsed.show.thumbnail);
                        downloader.checkDownloadStarted();
                    }
                })
            }
        }
    })
}


module.exports = {downloadAllAni};