const electron = require('electron');
const $ = require('jquery');

const arrayMove = require('array-move');
const Plyr = require('plyr');

const { getData, getQueue } = require('../src/download.js')
const twist = require('../src/twist.js')
const allAnime = require('../src/allanime.js')

const downloader = require('../src/download.js');
const scraper = require('../src/scraper.js');

const { exists, readdirSync } = require('original-fs');

onPlayer = false;

/*
const { getAnime, getQualities } = require('anigrab').sites.siteLoader(
    'twist'
);
*/
const path = (electron.app || electron.remote.app).getPath('userData')+"/AppStorage"

module.exports = { getOnPlayer, exitPlay, replaceText, toggleNav, loadQueue, loadSettings, loadPlay, loadHome, loadLibrary, loadSearch, updateQueueHTML };

function getOnPlayer() {
    return onPlayer
}

function loadQueue () {
    if (onPlayer) exitPlay();
    $("#main").empty();
    $("#main").load("queue.html", function() {
        updateQueueHTML();
    })
}

function loadSettings() {
    if (onPlayer) exitPlay();

    $("#main").empty();
    $("#main").load("settings.html", function() {
        document.getElementById("toggleDev").checked = settings.devMode;
        document.getElementById("toggleExternal").checked = settings.openExternal;
        document.getElementById("scrape").value = settings.scrape;
        document.getElementById("mode").appendChild(document.createTextNode(remote.getGlobal( "allAnime" ).length == 0 ? "offline" : "online"))
    })
}

skipOP = () => {
    var vid = document.getElementById("vid");
    vid.currentTime = vid.currentTime + 88;
}


nextEP = (title, num) => {
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data)
        var animeInd = data.anime.findIndex(element => element.title == title)
        var findEp = data.anime[animeInd].episodes.find(element => parseInt(element.name.substring(8)) === num)
        if (findEp != undefined) {
            exitPlay();
            loadPlay(path+"/episodes/"+title.replace(/[\W_]+/g,"-")+"/"+findEp.id+".mp4", title, findEp.name);
        }
    })
}

prevEP = (title, num) => {
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data)
        var animeInd = data.anime.findIndex(element => element.title == title)
        var findEp = data.anime[animeInd].episodes.find(element => parseInt(element.name.substring(8)) === num)
        if (findEp != undefined) {
            exitPlay();
            loadPlay(path+"/episodes/"+title.replace(/[\W_]+/g,"-")+"/"+findEp.id+".mp4", title, findEp.name);
        }
    })
}

function exitPlay() {
    onPlayer = false;
    timeStamp = document.getElementById("vid").currentTime
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data)
        data.recent[0].position = timeStamp;
        fs.writeFile(path+"/data.json", JSON.stringify(data), err => {
        })
    })
}

function loadPlay(file, title, name) {
    onPlayer = true;
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data)
        position = 0;
        //console.log(data.recent)
        var index = data.recent.findIndex(e => (e.file == file))
        newD = {
            title: title,
            name: name,
            position: 0,
            file: file
        }
        if (index == -1) {
            data.recent.unshift(newD)
        } else {
            data.recent = arrayMove(data.recent,index, 0)
            
            position = data.recent[0].position;
        }
        fs.writeFile(path+"/data.json", JSON.stringify(data), err => {
            if (settings.openExternal) electron.shell.openPath(file)
            else {
                $("#main").empty();
                $("#main").load("play.html", function() {
                    document.getElementById("vid-src").src = file;
                    player = new Plyr('#vid');
                    document.getElementById("vid").currentTime = position;
                    //document.getElementById("vid").play();
                    document.getElementById("all").addEventListener('click', function() {
                        exitPlay();
                        viewOffline(title);
                    })
                    document.getElementById("title").appendChild(document.createTextNode(title + " " + name))
                    document.getElementById("next").addEventListener('click', function() {
                        nextEP(title, parseInt(name.substring(8))+1)
                    })
                    document.getElementById("prev").addEventListener('click', function() {
                        nextEP(title, parseInt(name.substring(8))-1)
                    })

                })
            }
        })
    })
}

function loadHome() {
    if (onPlayer) exitPlay();
    $("#main").empty();
    $("#main").load("home.html", function() {
        if (settings.devMode != undefined && !settings.devMode) {

            fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
                data = JSON.parse(data)
                if (data.recent.length == 0) {
                    document.getElementById("recent-title").style.display = "none";
                } else {
                    // Making the recently played buttons
                    for (var i = 0; i < Math.min(data.recent.length, 3); i++) (function(i) {
                        var button = document.createElement("button")
                        button.classList.add("hov")
                        button.classList.add("bordered");
                        var eTitle = document.createElement("p")

                        var icon = document.createElement("i")
                        var aTitle = document.createElement("p")
                        aTitle.appendChild(document.createTextNode(data.recent[i].title))
                        icon.classList.add("fa")
                        icon.classList.add("fa-play")

                        eTitle.appendChild(icon);
                        eTitle.appendChild(document.createTextNode(data.recent[i].name));
                        button.appendChild(eTitle);
                        button.appendChild(aTitle);
                        button.addEventListener('click', function() {
                            loadPlay(data.recent[i].file, data.recent[i].title, data.recent[i].name);
                        })
                        document.getElementById("recents").appendChild(button)
                    })(i)
                }
            })
        }
    })
}

function replaceText(selector, text) {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
}


function viewOffline(title) {
    // Show info about downloaded anime
    $("#main").empty();
    title = title;

    $("#main").load("view.html", function() {
        fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
            data = JSON.parse(data)
            entryIndex = data.anime.findIndex(element => element.title == title)
            entry = data.anime[entryIndex]
            episodes = entry.episodes

            document.getElementById("cover-img").src = entry.image
            replaceText("anime-title", title)
            replaceText("description", entry.desc)
            deleteB = document.createElement("button");
            deleteB.appendChild(document.createTextNode("Toggle Delete"));
            deleteB.style.float = "right"
            deleteB.classList.add("hov")
            deleteB.addEventListener('click', function() {
                var x = document.getElementsByClassName("delete-b")
                for (var i = 0; i < x.length; i++) {
                    if (x[i].style.display == "inline") {
                        x[i].style.display = "none";
                    } else x[i].style.display = "inline";
                }
                /*
                .forEach(element => {
                    element.style[background-color] = "red";
                });*/
            })
            document.getElementById("delete").appendChild(deleteB)
            document.getElementById("delete").appendChild(document.createElement("br"))
            // No need to swap any orders now
            for (var i = 0; i < entry.episodes.length; i++) (function(i) {
                listItem = document.createElement("div");
                listItem.setAttribute('id', entryIndex);
                newEp = document.createElement("button");
                newEp.classList.add("hov")
                newEp.classList.add("check")
                newEp.style.margin = "10px"
                newEp.addEventListener('click', function() {
                    loadPlay(path+"/episodes/"+entry.title.replace(/[\W_]+/g,"-")+"/"+entry.episodes[i].id+".mp4", title, entry.episodes[i].name);
                })
                newEp.appendChild(document.createTextNode(entry.episodes[i].name));
                listItem.appendChild(newEp)

                deleteLink = document.createElement("a");
                deleteIcon = document.createElement("i");
                deleteIcon.classList.add("fa")
                deleteIcon.classList.add("fa-trash")
                deleteIcon.classList.add("delete-b")
                deleteLink.addEventListener('click', function() {
                    deleteEpisode(entry, entryIndex, entry.episodes[i].name, i)
                })
                deleteLink.appendChild(deleteIcon)
                listItem.appendChild(deleteLink)
                document.getElementById("ep-list").appendChild(listItem);
            })(i);
        })
    })
}

function loadLibrary() {
    if (onPlayer) exitPlay();

    $("#main").empty();
    $("#main").load("library.html", function() {
        if (!settings.devMode) {
            fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
                entries = JSON.parse(data).anime
                for (var i = 0; i < entries.length; i++) (function(i){
                    var searchdiv = document.createElement("li")
                    var img = document.createElement("img");                 // Create a <li> node
                    var textnode = document.createTextNode(entries[i].title);         // Create a text node
                    img.src = entries[i].image
                    var title = document.createElement("a");
                    title.className = "poster";
                    title.appendChild(img)
                    var name = document.createElement("a");
                    name.className = "name";
                    name.appendChild(textnode)

                    searchdiv.appendChild(title)
                    searchdiv.appendChild(name)
                    var linked = document.createElement("a")
                    linked.addEventListener('click', function() {
                        viewOffline(entries[i].title)
                    })
                    linked.appendChild(searchdiv)
                    document.getElementById("results").appendChild(linked);
                })(i);


            })
        }
    })
}

function loadSearch() {
    if (onPlayer) exitPlay();

    $("#main").empty();
    $("#main").load("search.html", function() {
        var input = document.getElementById("searchTerm");
        input.addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.getElementById("search").click();
            }
        });
        document.getElementById("search").addEventListener('click', () => {
            $("#results").empty();
            getAnimeSearch(document.getElementById("searchTerm").value, function(res) {
                if (res.length == 0) {
                    document.getElementById("results").appendChild(document.createTextNode("No results found."))
                } else {
                    console.log(res);
                    for (var i = 0; i < res.length; i++) (function(i) {
                        var searchdiv = document.createElement("div")
                        var img = document.createElement("img");                 // Create a <li> node
                        var textnode = document.createTextNode(res[i].englishName);         // Create a text node
                        img.src = res[i].thumbnail;
                        var title = document.createElement("a");  
                        title.className = "poster";
                        title.appendChild(img)
                        var name = document.createElement("a");  
                        name.className = "name";
                        name.appendChild(textnode)
                        name.style.textDecoration = "none"
                        name.style.color = "black"
                        searchdiv.appendChild(title)
                        searchdiv.appendChild(name)
                        searchdiv.style.width = "200px"
                        searchdiv.style.textAlign = "center"
                        var linked = document.createElement("a");
                        linked.addEventListener('click', function() {
                            searchResAll(res[i]);
                        })
                        linked.appendChild(searchdiv)
                        document.getElementById("results").appendChild(linked);

                    })(i);
                }
                

            })
        });
    })
}



function searchResAll(info) {
    console.log(info);
    $("#main").empty();
    $("#main").load("view.html", function() {
        link = `https://allanime.site/graphql?variables=%7B%22showId%22%3A%22${info._id}%22%2C%22episodeNumStart%22%3A0%2C%22episodeNumEnd%22%3A1000%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%2273d998d209d6d8de325db91ed8f65716dce2a1c5f4df7d304d952fa3f223c9e8%22%7D%7D`
        downloader.getData(link, function(e) {
            console.log(e)
            episodes = JSON.parse(e).data.episodeInfos;
            root = htmlparser.parse(info);
            img = info.thumbnail;
            title = info.englishName;
            desc = `Type: ${info.type}\nAlso known as: ${info.nativeName}\n${info.season.quarter} ${info.season.year}\nScore: ${info.score}`;
            replaceText("description",  desc)
            replaceText("anime-title", title)
            document.getElementById("cover-img").src = info.thumbnail;
            results = root.querySelectorAll("#menu1 a")
            // For some reason animax puts latest first so let's swap order
    
            for (var i = episodes.length-1; i >= 0; i--) (function(i) {
                listItem = document.createElement("div");
                newEp = document.createElement("button");
                newEp.classList.add("hov")
                
                listItem.id = "ep_"+(i+1);
                newEp.style.margin = "10px"
                
                newEp.addEventListener('click', function() {
                    link = `https://allanime.site/graphql?variables=%7B%22showId%22%3A%22${info._id}%22%2C%22translationType%22%3A%22sub%22%2C%22episodeString%22%3A%22${episodes[i].episodeIdNum}%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%2229f49ce1a69320b2ab11a475fd114e5c07b03a7dc683f77dd502ca42b26df232%22%7D%7D`;
                    allAnime.downloadAllAni(link, info.englishName);

                })
                newEp.appendChild(document.createTextNode("Episode " +parseInt(episodes[i].episodeIdNum)));
                listItem.appendChild(newEp)
                document.getElementById("ep-list").appendChild(listItem);
            })(i);
        })
    })
}

function getAnimeSearch(val, callback) {

    scraper.getAllAni(val, function(res) {
        callback(res);
    })
}




function toggleNav() {
    if (document.getElementById("left-bar").style.width === "200px") {
        document.getElementById("left-bar").style.width = "50px";
        document.getElementById("right-bar").style.marginLeft = "100px";
        document.getElementById("settings").style.display = "none";
        document.getElementById("collapse-icon").classList.remove("fa-chevron-left")
        document.getElementById("collapse-icon").classList.add("fa-chevron-right")
        document.getElementById("left-bar").classList.add("collapsed")
    } else {
        document.getElementById("left-bar").style.width = "200px";
        document.getElementById("right-bar").style.marginLeft = "250px";
        document.getElementById("settings").style.display = "block";
        document.getElementById("collapse-icon").classList.add("fa-chevron-left")
        document.getElementById("collapse-icon").classList.remove("fa-chevron-right")
        document.getElementById("left-bar").classList.remove("collapsed")
    }

}


function updateQueueHTML() {
    downloadQueue = getQueue()
    if (downloadQueue.length != 0) {
        document.getElementById("download-title").innerHTML = downloadQueue[0][1]+" "+downloadQueue[0][2];
        if (downloadQueue.length > 1) {
            for (var i = 0; i < downloadQueue.length; i++) (function(i) {
                var listItem = document.createElement("li")
                var nestedDiv = document.createElement("div");
                nestedDiv.style.display = "flex";
                var title = document.createElement("p")
                title.appendChild(document.createTextNode(downloadQueue[i][1]+" "+downloadQueue[i][2]))
                nestedDiv.appendChild(title);
                listItem.appendChild(nestedDiv);
                document.getElementById("queue").appendChild(listItem);
            })(i)

        }
    } else {
        $("#main").empty();
        $("#main").load('emptyqueue.html');
    }
}
