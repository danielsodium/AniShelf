
module.exports = { getAnimax, getFour, getGoGo, getAnimeout };

const { getData, getJSON, decryptSource } = require('../src/download.js')

/*
const { search, getQualities } = require('anigrab').sites.siteLoader(
    'twist'
);

function getGrab(searchTerm, callback) {
    console.log("gettting....")
    var getS = async function(callback) {callback(await search(searchTerm))}
    getS(function(info) {
        console.log(info)
        var returner = [];
        for (var i = 0; i < info.length; i++) {
            returner.push({
                link : info[i].url,
                title : info[i].title,
                img : "undefined"
            })
        }
        callback(returner);
    })
}
*/
function getAnimax(searchTerm, callback) {
    getData("https://animax.to/?c=search&q="+searchTerm, function(info) {
        root = htmlparser.parse(info)
        var returner = [];
        var array = root.querySelectorAll('.columns2 .column a img')
        for (var i = 0; i < array.length; i++) {
            var title = array[i].parentNode.childNodes[2].text;
            returner.push({
                link : array[i].parentNode.attrs.href,
                title : title.trim(),
                img : "https://animax.to"+array[i].attributes.src
            })
        }
        callback(returner);
    })
}

function getAnimax(searchTerm, callback) {
    getData("https://animax.to/?c=search&q="+searchTerm, function(info) {
        root = htmlparser.parse(info)
        var returner = [];
        var array = root.querySelectorAll('.columns2 .column a img')
        for (var i = 0; i < array.length; i++) {
            var title = array[i].parentNode.childNodes[2].text;
            returner.push({
                link : array[i].parentNode.attrs.href,
                title : title.trim(),
                img : "https://animax.to"+array[i].attributes.src
            })
        }
        callback(returner);
    })
}

function getFour(searchTerm, callback) {
    getData("https://4anime.to/?s="+encodeURI(searchTerm.split(' ').join('+')), function(data) {
        root = htmlparser.parse(data);
        var returner = [];
        var links = root.querySelectorAll(".container #headerDIV_2");
        for (var i = 1; i < links.length; i++) {
            returner.push({
                link : links[i].querySelector("a").attrs.href,
                title : links[i].querySelector("a div").text,
                img : links[i].querySelector("a img").attrs.src
            }) 
        }
        callback(returner);
    }) 
}

function getGoGo(searchTerm, callback) {
    getData("https://www1.gogoanime.ai/search.html?keyword="+encodeURI(searchTerm), function(data) {
        root = htmlparser.parse(data)
        var returner = [];
        elements = root.querySelectorAll(".items li")
        for (var i = 0; i < elements.length; i++) {
            returner.push({
                link : elements[i].querySelector(".name a").attrs.href,
                title : elements[i].querySelector(".name a").innerText.trim(),
                img : elements[i].querySelector("img").attrs.src
            })    
        }
        callback(returner);
    }) 
}

function getAnimeout(searchTerm, callback) {
    getData("https://animeout.xyz/?s="+encodeURI(searchTerm.split(' ').join('+')), function(data) {
        var returner = [];
        root = htmlparser.parse(data)
        links = root.querySelectorAll(".wrap-content .row article .post-content")
        for (var i = 0; i < links.length; i++) {
            returner.push({
                img : "",//links[i].querySelector(".post-image a img").attrs.src,
                link : links[i].querySelector("h3 a").attrs.href,
                title: links[i].querySelector("h3").text
            })
        }
        callback(returner);
    })
}