const https = require('https');
const http = require('http')
const electron = require('electron')
const uuid = require('uuid');
const Stream = require('stream').Transform;

module.exports = { checkIfDownloaded, getQueue, downloadEpisode, downloadGoGo, downloadFour, addQueue, checkDownloadStarted, getData };

downloadQueue = [];


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

function addQueue(link, title, epNum, img, desc) {
    downloadQueue.push([link, title, epNum, img, desc])
}

function checkDownloadStarted() {
    if (downloadQueue.length == 1) {
        downloadData = downloadQueue[0]
        downloadEpisode(downloadData[0], downloadData[1], downloadData[2], downloadData[3], downloadData[4])
    }
}

function downloadFour(link, title, epNum, img, desc) {
    getFourEp(link.substring(17), function (data) {
        root = htmlparser.parse(data);
        downloadQueue.push([root.querySelector("video source").attrs.src, title, title + " " + epNum, img, desc]);
        checkDownloadStarted();
    })
}

function getFourEp(link, callback) {
    var getDa = require('follow-redirects').https;

    var options = {
        'method': 'GET',
        'hostname': '4anime.to',
        'path': link,
        'headers': {
            'Cookie': '__cfduid=d8f30551cdf7b386613e3afb7a42d92a61618620457'
        },
        'maxRedirects': 20
    };

    var req = getDa.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            callback(body.toString());
        });

        res.on("error", function (error) {
            console.error(error);
        });
    });

    req.end();
}

function getFourEp(link, callback) {
    var getDa = require('follow-redirects').https;

    var options = {
        'method': 'GET',
        'hostname': '4anime.to',
        'path': link,
        'headers': {
            'Cookie': '__cfduid=d8f30551cdf7b386613e3afb7a42d92a61618620457'
        },
        'maxRedirects': 20
    };

    var req = getDa.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            callback(body.toString());
        });

        res.on("error", function (error) {
            console.error(error);
        });
    });

    req.end();
}


function downloadGoGo(link, title, epNum, img, desc) {
    getData("https://www1.gogoanime.ai/" + link.slice(9) + "-episode-" + epNum, function (data) {
        root = htmlparser.parse(data)
        getData(root.querySelector(".streamtape a").attrs["data-video"], function (data) {
            var a = data.split("document.getElementById('vid'+'eolink').innerHTML =")[1].split("</script>")[0]
            var edited = ("https:"+a.replace(/['"+; ]+/g, '').trim()).substring(22)
            console.log(edited)
            downloadQueue.push([edited, title, "Episode " + epNum, img, desc]);
            checkDownloadStarted();
        })
    })

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

function downloadEpisode(link, title, epName, image, desc) {
    electron.ipcRenderer.invoke('show-notification', "Starting Download", title + " " + epName);
    videoID = uuid.v4()
    if (!fs.existsSync(path + "/episodes/" + title.replace(/[\W_]+/g, "-"))) {
        fs.mkdirSync(path + "/episodes/" + title.replace(/[\W_]+/g, "-"));
        // Doesn't matter if this happens before or after, so save me the trouble of doing callbacks for the rest lol
        https.get("https://genoanime.com"+image.substring(1), function (response) {
            var data = new Stream();
            response.on('data', function (chunk) {
                data.push(chunk);
            });

            response.on('end', function () {
                fs.writeFileSync(path + "/images/" + title.replace(/[\W_]+/g, "-") + ".jpg", data.read());
            });
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
function continueDownload(link, title,videoID) {
    vidp = path + "/episodes/" + title.replace(/[\W_]+/g, "-") + "/" + videoID + ".mp4"
    fs.stat(vidp, (err, stat) => {
        //if(err) return getEP(link, title, videoID, 0)
        return getEP(link, title, videoID, stat.size)
    })
}
timeout = null
function getEP(link, title, videoID, start) {
    console.log(link)
    if (settings.scrape == "twist") {
        var options = {
            'method': 'GET',
            'hostname': 'cdn.twist.moe',
            'path': link,
            'headers': {
                'Accept-Encoding': 'identity;q=1, *;q=0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
                'Range': `bytes=${start}-`,
                'Referer': 'https://twist.moe/',
                'Keep-Alive': 'timeout=60000'
            },
            'maxRedirects': 100
        };
    } else if (settings.scrape == "geno") {
        var newrl = new URL(link)
        var options = {
            'method': 'GET',
            'hostname': newrl.hostname,
            'path': newrl.pathname,
            'headers': {
                'Accept-Encoding': 'identity;q=1, *;q=0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
                'Range': `bytes=${start}-`,
                'Referer': 'https://twist.moe/',
                'Keep-Alive': 'timeout=60000'
            },
            'maxRedirects': 100
        };
        console.log(newrl)
    }
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

function pipeDownload(inStream, fileStream, videoID, link, title) {
    videoID = videoID;
    const fs = require('fs');
    fileStream = fileStream;
    // get total size of the file
    let size = inStream.headers['content-length']
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
