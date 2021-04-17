const electron = require('electron');
const $ = require('jquery');

const arrayMove = require('array-move');

const { getData, getQueue } = require('../src/download.js')
const { getFour } = require('../src/scraper.js')

const path = (electron.app || electron.remote.app).getPath('userData')+"/AppStorage"

module.exports = { toggleNav, loadQueue, loadSettings, loadPlay, loadHome, loadLibrary, loadSearch, updateQueueHTML };

function loadQueue () {
    $("#main").empty();
    $("#main").load("queue.html", function() {
        updateQueueHTML();
    })
}

function loadSettings() {
    $("#main").empty();
    $("#main").load("settings.html", function() {
        document.getElementById("toggleDev").checked = settings.devMode;
        document.getElementById("toggleExternal").checked = settings.openExternal;
    })
}

function loadPlay(file, title, name) {
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data)
        newD = {
            title: title,
            name: name,
            file: file
        }
        var index = data.recent.findIndex(e => (e.file == file))
        if (index == -1) {
            data.recent.unshift(newD)
            if (data.recent.length > 3) {
                data.recent.pop();
            }
        } else {
            data.recent = arrayMove(data.recent,index, 0)
        }
        fs.writeFile(path+"/data.json", JSON.stringify(data), err => {
            if (settings.openExternal) electron.shell.openPath(file)
            else {
                $("#main").empty();
                $("#main").load("play.html", function() {
                    document.getElementById("vid-src").src = file;
                    document.getElementById("vid").play();
                })
            }
        })
    })
}

function loadHome() {
    $("#main").empty();
    $("#main").load("home.html", function() {
        fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
            data = JSON.parse(data)
            if (data.recent.length == 0) {
                document.getElementById("recent-title").style.display = "none";
            } else {
                // Making the recently played buttons
                for (var i = 0; i < data.recent.length; i++) (function(i) {
                    var button = document.createElement("button")
                    button.classList.add("bordered");
                    var eTitle = document.createElement("p")
                    
                    var icon = document.createElement("i")
                    var aTitle = document.createElement("p")
                    aTitle.appendChild(document.createTextNode(data.recent[i].title))
                    icon.classList.add("fa")
                    icon.classList.add("fa-play")
                    
                    eTitle.appendChild(icon)
                    eTitle.appendChild(document.createTextNode(data.recent[i].name))
                    button.appendChild(eTitle);
                    button.appendChild(aTitle);
                    button.addEventListener('click', function() {
                        loadPlay(data.recent[i].file, data.recent[i].title, data.recent[i].name);
                    })
                    document.getElementById("recents").appendChild(button)
                })(i)
            }
        })
    })
}

const replaceText = (selector, text) => {
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

            // No need to swap any orders now
            for (var i = 0; i < entry.episodes.length; i++) (function(i) {
                listItem = document.createElement("div");
                listItem.setAttribute('id', entryIndex);
                newEp = document.createElement("button");
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
    $("#main").empty();
    $("#main").load("library.html", function() {
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
    })
}

function loadSearch() {
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
            getFour(document.getElementById("searchTerm").value, function(res) {        
                for (var i = 0; i < res.length; i++) (function(i){ 
                    res = res;
                    var searchdiv = document.createElement("li")
                    var img = document.createElement("img");                 // Create a <li> node
                    var textnode = document.createTextNode(res[i].title);         // Create a text node
                    img.src = res[i].img
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
                        searchResFour(res[i].link)
                    })
                    linked.appendChild(searchdiv)
                    document.getElementById("results").appendChild(linked);
                })(i);
    
            })
        });
    })
}

function searchResFour(link) {
    // Show info about anime
    $("#main").empty();
    link = link;
    
    $("#main").load("view.html", function() {
        getData(link, function(data) {
            root = htmlparser.parse(data);
            cover = "https://4anime.to"+root.querySelector(".cover img").attrs.src
            document.getElementById("cover-img").src = cover

            console.log(cover)
            title = root.querySelector(".titlemobile1 center").text
            replaceText("anime-title", title)
            desc = root.querySelectorAll("#description-mob p")
            descT = "";
            for (var i = 0; i < desc.length; i++) descT += desc[i].text
            replaceText("description",  descT)
            var episodes = root.querySelectorAll(".episodes li a");
            for (var i = 0; i < episodes.length; i++) (function(i) {
                listItem = document.createElement("div");
                newEp = document.createElement("button");
                newEp.style.margin = "10px"
                newEp.addEventListener('click', function() {
                    if (settings.devMode) {
                        downloader.addQueue("https://www.w3schools.com/html/mov_bbb.mp4", title, "Episode "+ episodes[i].text.trim(), cover, descT);
                        downloader.checkDownloadStarted();
                    } else {
                        downloader.downloadFour(episodes[i].attrs.href, title, "Episode "+ episodes[i].text.trim(), cover, descT.text);
                    }
                }) 
                newEp.appendChild(document.createTextNode("Episode "+ (episodes[i].text.trim())));
                listItem.appendChild(newEp)
                document.getElementById("ep-list").appendChild(listItem); 
            })(i)
        })
    })
}

function searchResGoGo(link) {
    // Show info about anime
    $("#main").empty();
    link = link;
    
    $("#main").load("view.html", function() {
        console.log("https://www1.gogoanime.ai"+link)
        downloader.getData("https://www1.gogoanime.ai"+link, function(info) {
            root = htmlparser.parse(info)
            episodes = root.querySelector("#episode_page li .active").attrs.ep_end
            console.log(episodes)
            document.getElementById("cover-img").src = root.querySelector(".anime_info_body_bg img").attrs.src
            var title = root.querySelector(".anime_info_body_bg h1").text
            load.replaceText("anime-title", title)

            var descT = root.querySelectorAll(".anime_info_body_bg .type")[1]
            load.replaceText("description",  descT.text)

            // For some reason animax puts latest first so let's swap order
            for (var i = 0; i < parseInt(episodes); i++) (function(i) {
                listItem = document.createElement("li");
                listItem.id = "ep_"+(i+1);
                newEp = document.createElement("a");
                newEp.addEventListener('click', function() {
                    if (settings.devMode) {
                        downloader.addQueue("https://www.w3schools.com/html/mov_bbb.mp4", title, i+1, root.querySelector(".anime_info_body_bg img").attrs.src, descT.text);
                        downloader.checkDownloadStarted();
                    } else {
                        downloader.downloadGoGo(link, title, i+1, root.querySelector(".anime_info_body_bg img").attrs.src, descT.text);
                    }
                }) 
                newEp.appendChild(document.createTextNode("Episode "+ (i+1)));
                listItem.appendChild(newEp)
                document.getElementById("ep-list").appendChild(listItem); 
            })(i);
        })
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
    console.log(downloadQueue)
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