const { https } = require("follow-redirects");
const { ipcRenderer, remote } = require( "electron" );
const crypto = require('crypto-js');
const aes = require('crypto-js/aes');

const { getData } = require('../src/download.js')

//constants
const
    baseUrl = 'https://twist.moe',
    cdnUrl = "https://cdn.twist.moe",
    aesKey = '267041df55ca2b36f2e322d05ee2c9cf',
    accessToken = '0df14814b9e590a1f26d3071a4ed7974',
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'

//allAnime = [];

function getAll(callback) {
    getJSON("/api/anime", function(info) {
        callback(info);
    });
}

function decryptSource(source){
    return aes.decrypt(source, aesKey).toString(crypto.enc.Utf8).trim()
}

function getMal(id, callback) {
  getData("https://myanimelist.net/anime/"+id, function(info) {
    root = htmlparser.parse(info)
    var returner = {
      img: root.querySelector(".borderClass a img").attrs["data-src"],
      desc: root.querySelector("tr td p").text,
      score: root.querySelector(".score-label").text,
    }
    callback(returner)
  })
}

function getJSON(endpoint, callback) {
    var options = {
        'method': 'GET',
        'hostname': 'api.twist.moe',
        'path': endpoint,
        'headers': {
            'x-access-token': accessToken,
            'user-agent': userAgent,
        },
        'maxRedirects': 20
      };
      var req = https.request(options, function (res) {
        var chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        res.on("end", function (chunk) {
          var body = Buffer.concat(chunks);
          callback(JSON.parse(body.toString()));
        });
        res.on("error", function (error) {
          callback([]);
        });
      })
      req.end();
      req.on('error', function(e) {
        callback([]);
      });

}

function findMatches(wordToMatch, lang) {
    let searchTitle = lang == "j" ? "title" : "alt_title"
    allAnime = remote.getGlobal( "allAnime" );
    return allAnime.filter(name => {
      const regex = RegExp(wordToMatch, 'gi');
      if (name.alt_title == null){name.alt_title = name.title}
      return name[searchTitle].match(regex)
    })
  }

function getTwist(searchTerm, callback) {
    returner = [];
    results = findMatches(searchTerm, "e")
    for (var i = 0; i < results.length; i++) {
        var title = results[i].alt_title;
        returner.push({
            info : results[i],
            title : title.trim(),
            img : ""
        })
    }
    callback(returner)

}


module.exports = {decryptSource, getTwist, getAll, getJSON, getMal}
