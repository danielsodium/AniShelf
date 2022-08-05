const https = require('https');
const http = require('http')
const electron = require('electron')
const uuid = require('uuid');
const Stream = require('stream').Transform;

module.exports = { checkIfDownloaded, getQueue, addQueue, checkDownloadStarted, getData };

downloadQueue = [];
timeout = null


function getQueue() {
    return downloadQueue;
}

function getData(link, callback) {
    if (link.indexOf("https") == -1) {
        http.get(link, function (response) {
            var info = "";
            response.on('data', function (response) {
                info += response;
            })
            response.on('end', function () {
                callback(info)
            })
        })
    } else {
        https.get(link, function (response) {
            var info = "";
            response.on('data', function (response) {
                info += response;
            })
            response.on('end', function () {
                callback(info)
            })
        })
    }

}

function addQueue(link, title, epNum, img) {
    downloadQueue.push([link, title, epNum, img, "desc"])
}

function checkDownloadStarted() {
    if (downloadQueue.length == 1) {
        downloadData = downloadQueue[0]
        downloadEpisode(downloadData[0], downloadData[1], downloadData[2], downloadData[3], downloadData[4])
    }
}

function checkIfDownloaded(title, epName, callback) {
    fs.readFile(path + "/data.json", 'utf8', (err, data) => {
        var animeList = JSON.parse(data);
        entry = animeList.anime.findIndex(element => element.title == title)
        if (entry != -1) {
            completed = animeList.anime[entry].episodes.find(element => element.name == epName)
            if (completed != undefined) {
                if (completed.complete == true) {
                    return callback(true)
                } else {
                    return callback(false)
                }
            } else return callback(false)
        } else {
            return callback(false)
        }
    })
}

function continueDownload(link, title,videoID) {
    vidp = path + "/episodes/" + title.replace(/[\W_]+/g, "-") + "/" + videoID + ".mp4"
    fs.stat(vidp, (err, stat) => {
        //if(err) return getEP(link, title, videoID, 0)
        return getEP(link, title, videoID, stat.size)
    })
}

function pipeDownload(inStream, fileStream, videoID, link, title) {
    videoID = videoID;
    const fs = require('fs');
    fileStream = fileStream;
    // get total size of the file
    let size = inStream.headers['content-length']
    console.log(size);
    let written = 0;
    if(inStream.statusCode.toString()[0] != '2') return console.log(`Server responded with ${inStream.status} (${inStream.statusText})`)
    inStream.on('data', data => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            console.log("Timed out?")
            inStream.destroy();
            continueDownload(link, title, videoID);
        }, 10000)
        // do the piping manually here.
        fileStream.write(data, () => {
            written += data.length;
            var percent = (written / size * 100).toFixed(2);
            if (document.getElementById("progress-bar")) {
                document.getElementById("progress-bar").value = percent;
                document.getElementById("download-percent").innerHTML = percent + "%";
            }
            //console.log(`written ${written} of ${size} bytes (${(written / size * 100).toFixed(2)}%)`);
        });
    });
        inStream.on('end', () => {
            clearTimeout(timeout);  
            downloadFinished(videoID)
        })
    inStream.on('error', (err) => {
        console.log(err)
        clearTimeout(timeout)
        inStream.destroy();
    })
}

function downloadEpisode(link, title, epName, image, desc) {
    electron.ipcRenderer.invoke('show-notification', "Starting Download", title + " " + epName);
    videoID = uuid.v4()
    if (!fs.existsSync(path + "/episodes/" + title.replace(/[\W_]+/g, "-"))) {
        fs.mkdirSync(path + "/episodes/" + title.replace(/[\W_]+/g, "-"));
        console.log(image)
        // Doesn't matter if this happens before or after, so save me the trouble of doing callbacks for the rest lol
        https.get(image, function (response) {
            response.pipe(fs.createWriteStream(path + "/images/" + title.replace(/[\W_]+/g, "-") + ".jpg"))
        }).end();
    }
    fs.readFile(path + "/data.json", 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            return
        }
        var animeList = JSON.parse(data);
        entry = animeList.anime.findIndex(element => element.title == title)
        if (entry == -1) {
            animeList.anime.push({
                title: title,
                image: path + "/images/" + title.replace(/[\W_]+/g, "-") + ".jpg",
                desc: desc,
                episodes: [{
                    name: epName,
                    id: videoID,
                    complete: false
                }]
            })
        } else {
            var completed = animeList.anime[entry].episodes.find(element => element.name == epName)
            if (completed != undefined) {
                if (completed.complete) return downloadQueue.shift();
                else {
                    return fs.stat(path + "/episodes/" + title.replace(/[\W_]+/g, "-") + "/" + completed.id + ".mp4", (err, stat) => {
                        if(err) return getEP(link, title, videoID, 0)
                        // DOWNLOAD WITH STAT SIZE
                        return getEP(link, title, completed.id, stat.size)
                    })
                }

            } else {
                animeList.anime[entry].episodes.push({
                    name: epName,
                    id: videoID,
                    complete: false
                })
            }

        }
        fs.writeFile(path + "/data.json", JSON.stringify(animeList), err => {
            if (err) {
                console.error(err)
                return;
            }
            return getEP(link, title, videoID, 0);
        })
    })
}

function getEP(link, title, videoID, start) {
    console.log(link.substring(40))
    var options = {
        'method': 'GET',
        'hostname': 'workfields.backup-server222.lol',
        'path': link.substring(39),//'/7d2473746a243c24296b63626f673429706f62636975294c4b6b68756b724a41574a674e76723055297573642937286b7632242a2475727463676b63744f62243c245f69737273646347686f6b63247b',
        'headers': {
        },
        'maxRedirects': 20
      };
    /*var options = {
        'method': 'GET',
        'hostname': 'workfields.backup-server222.lol',
        'path': link.substring(29),
        'headers': {
        },
        'maxRedirects': 100
    };*/
    var getVid = require('follow-redirects').https;
    if (start == 0) {
        file = fs.createWriteStream(path + "/episodes/" + title.replace(/[\W_]+/g, "-") + "/" + videoID + ".mp4");
        var req = getVid.request(options, function (response) {
            pipeDownload(response, file, videoID, link, title);
        });
        req.on('error', function(e) {
            file.end()
            console.log(e)
            continueDownload(link, title, videoID)
        });
        req.end();
    } else {
        file = fs.createWriteStream(path + "/episodes/" + title.replace(/[\W_]+/g, "-") + "/" + videoID + ".mp4", {flags:'a'});
        var req = getVid.request(options, function (response) {
            pipeDownload(response, file, videoID, link, title);
        });
        req.on('error', function(e) {
            file.end()
            console.log(e)
            clearTimeout(timeout)
            continueDownload(link, title, videoID)
        });
        req.end();
    }

}


downloadFinished = function (videoID) {
    link = downloadQueue[0][0];
    title = downloadQueue[0][1];
    epName = downloadQueue[0][2];
    image = downloadQueue[0][3];
    desc = downloadQueue[0][4];
    videoId = videoID;
    electron.ipcRenderer.invoke('show-notification', "Finished Download", title + " " + epName);


    
    fs.readFile(path + "/data.json", 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            return
        }
        var animeList = JSON.parse(data);
        entry = animeList.anime.findIndex(element => element.title == title)
        ep = animeList.anime[entry].episodes.findIndex(element => element.name == epName)
        animeList.anime[entry].episodes[ep].complete = true;
        fs.writeFile(path + "/data.json", JSON.stringify(animeList), err => {
            if (err) {
                console.error(err)
                return;
            }
            downloadQueue.shift();
            if (downloadQueue.length > 0) {
                downloadData = downloadQueue[0]
                downloadEpisode(downloadData[0], downloadData[1], downloadData[2], downloadData[3], downloadData[4])
            }
        })
    })
}
