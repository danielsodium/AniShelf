const https = require('https');
const http = require('http')
const uuid = require('uuid');
const Stream = require('stream').Transform;
const { getAnime, getQualities } = require('anigrab').sites.siteLoader(
    'twist'
);


module.exports = { getQueue, downloadEpisode, downloadGoGo, downloadFour, addQueue, checkDownloadStarted, getData };

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
    console.log(downloadQueue.length)
    if (downloadQueue.length == 1) {
        downloadData = downloadQueue[0]
        downloader.downloadEpisode(downloadData[0], downloadData[1], downloadData[2], downloadData[3], downloadData[4])
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
    console.log("HERE")
    getData("https://www1.gogoanime.ai/" + link.slice(9) + "-episode-" + epNum, function (data) {
        root = htmlparser.parse(data)
        console.log(root.querySelector(".streamtape a").attrs["data-video"])
        getData(root.querySelector(".streamtape a").attrs["data-video"], function (data) {
            var a = data.split("document.getElementById('vid'+'eolink').innerHTML =")[1].split("</script>")[0]
            var edited = ("https:"+a.replace(/['"+; ]+/g, '').trim()).substring(22)
            console.log(edited)
            downloadQueue.push([edited, title, "Episode " + epNum, img, desc]);
            checkDownloadStarted();
        })
    })

}

function downloadEpisode(link, title, epName, image, desc) {
    electron.ipcRenderer.invoke('show-notification', epName, false);
    videoID = uuid.v4()
    if (!fs.existsSync(path + "/episodes/" + title.replace(/[\W_]+/g, "-"))) {
        fs.mkdirSync(path + "/episodes/" + title.replace(/[\W_]+/g, "-"));        
    }

    var options = {
        'method': 'GET',
        'hostname': 'cdn.twist.moe',
        'path': link,
        'headers': {
            'Accept-Encoding': 'identity;q=1, *;q=0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
            'Range': 'bytes=0-',
            'Referer': 'https://twist.moe/',
        },
        'maxRedirects': 100
    };
      
    var getVid = require('follow-redirects').https;

    file = fs.createWriteStream(path + "/episodes/" + title.replace(/[\W_]+/g, "-") + "/" + videoID + ".mp4");
    var req = getVid.request(options, function (response) {
        pipeDownload(response, file, videoID);
    });
    req.end();

}

function pipeDownload(inStream, fileStream, videoID) {
    videoID = videoID;
    const fs = require('fs');
    fileStream = fileStream;
    // get total size of the file
    let size = inStream.headers['content-length']
    console.log(size)
    let written = 0;
    inStream.on('data', data => {
        // do the piping manually here.
        fileStream.write(data, () => {
            written += data.length;
            var percent = (written / size * 100).toFixed(2);
            if (document.getElementById("progress-bar")) {
                document.getElementById("progress-bar").value = percent;
                document.getElementById("download-percent").innerHTML = percent + "%";
            }
            if (percent == 100) {
                downloadFinished(videoID);
            }
            console.log(`written ${written} of ${size} bytes (${(written / size * 100).toFixed(2)}%)`);
        });
    });
}

downloadFinished = function (videoID) {
    link = downloadQueue[0][0];
    title = downloadQueue[0][1];
    epName = downloadQueue[0][2];
    image = downloadQueue[0][3];
    desc = downloadQueue[0][4];
    videoId = videoID;

    // Doesn't matter if this happens before or after, so save me the trouble of doing callbacks for the rest lol
    https.get(image, function (response) {
        var data = new Stream();
        response.on('data', function (chunk) {
            data.push(chunk);
        });

        response.on('end', function () {
            fs.writeFileSync(path + "/images/" + title.replace(/[\W_]+/g, "-") + ".png", data.read());
        });
    }).end();
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
                image: path + "/images/" + title.replace(/[\W_]+/g, "-") + ".png",
                desc: desc,
                episodes: [{
                    name: epName,
                    id: videoID
                }]
            })
        } else {
            if (animeList.anime[entry].episodes.findIndex(element => element.name == epName) != -1) {
                return;
            }
            animeList.anime[entry].episodes.push({
                name: epName,
                id: videoID
            })
        }
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