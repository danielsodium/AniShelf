const { https } = require("follow-redirects");
const $ = require('jquery');
const electron = require('electron')
const downloader = require('../src/download.js')

function scrapeGeno(options, postData, callback) {
    var req = https.request(options, function (res) {
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
  
  
  req.setHeader('content-type', 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW');
    if (postData != null) req.write(postData);
  
    req.end();
  
}


function replaceText(selector, text) {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
}

function getGeno(searchTerm, callback) {
    returner = [];
    var postData = "------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"anime\"\r\n\r\n"+searchTerm+"\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--";
    var options = {
      'method': 'POST',
      'hostname': 'genoanime.com',
      'path': '/data/searchdata.php',
      'headers': {},
      'maxRedirects': 20
    };
    
    scrapeGeno(options, postData, function(info) {
      root = htmlparser.parse(info);
      results = root.querySelectorAll("h5 a")
      images = root.querySelectorAll(".set-bg")
      for (var i = 0; i < results.length; i++) {
        returner.push({
            info : results[i].attrs.href,
            title : results[i].text,
            img : images[i].attrs["data-setbg"]
        })
      }
      callback(returner)
    })    
    

}

function searchResGeno(link) {
    // Show info about anime
    $("#main").empty();
    link = link;
    var options = {
        'method': 'GET',
        'hostname': 'genoanime.com',
        'path': link.substring(1),
        'headers': {},
        'maxRedirects': 20
      };
    $("#main").load("view.html", function() {
        scrapeGeno(options, null, function(info) {
            root = htmlparser.parse(info);
            img = root.querySelector(".col-lg-3 .set-bg").attrs["data-setbg"]
            title = root.querySelector(".anime__details__title h3").text
            desc = root.querySelector(".anime__details__text p").text
            replaceText("description",  desc)
            replaceText("anime-title", title)
            document.getElementById("cover-img").src = "https://genoanime.com"+img.substring(1)
            results = root.querySelectorAll("#menu1 a")
            // For some reason animax puts latest first so let's swap order
            for (var i = 0; i < results.length; i++) (function(i) {
                listItem = document.createElement("div");
                newEp = document.createElement("button");
                newEp.classList.add("hov")
                
                listItem.id = "ep_"+(i+1);
                newEp.style.margin = "10px"
                newEp.addEventListener('click', function() {
                    if (settings.devMode) {
                        downloadGeno(results[i].attrs.href, title, img, desc, parseInt(results[i].text.substring(3)))
                    } else {
                        downloadGeno(results[i].attrs.href, title, img, desc, parseInt(results[i].text.substring(3)))
                    }
                })
                newEp.appendChild(document.createTextNode("Episode " +parseInt(results[i].text.substring(3), 10)));
                listItem.appendChild(newEp)
                document.getElementById("ep-list").appendChild(listItem);
            })(i);

        })
    })
}

function downloadGeno(link, title, img, desc, num) {
    electron.ipcRenderer.invoke('show-notification', "Getting download link", title + " Episode " + num);
    title = title;
    img = img;
    desc = desc;
    num = num;
    var options = {
        'method': 'POST',
        'hostname': 'genoanime.com',
        'path': link.substring(1),
        'headers': {},
        'maxRedirects': 20
    };
    scrapeGeno(options, null, function(info) {
        var cut = info.split("?id='+'")[1].split("&")[0]
        console.log(cut)
        options = {
        'method': 'POST',
        'hostname': 'genoanime.com',
        'path': '/player/genovids.php',
        'headers': {},
        'maxRedirects': 20
        };
        console.log(title)
        var postData = "------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"id\"\r\n\r\n"+cut+"\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--";
        scrapeGeno(options, postData, function(info) {
            info = JSON.parse(info)
            if (settings.devMode) {
            } else {
                downloader.checkIfDownloaded(info.alt_title, "Episode "+ num, function(exists) {
                    if (!exists) {
                        console.log(title)
                        downloader.addQueue(info.url[0].src, title,"Episode "+  num, img, desc);
                        downloader.checkDownloadStarted();
                    }
                })
            }
            console.log(info)
        })
    
    })
}


module.exports = {getGeno, searchResGeno};