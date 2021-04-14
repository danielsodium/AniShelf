const electron = require('electron');
const https = require('https');
const fs = require('fs');
const htmlparser = require('node-html-parser')
const $ = require('jquery');
const uuid = require('uuid')
const path = (electron.app || electron.remote.app).getPath('userData')+"/AppStorage"

const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
}

loadHome = function() {
    $("#right-bar").empty();
    $("#right-bar").load("home.html")
}

loadLibrary = function() {
    $("#right-bar").empty();
    $("#right-bar").load("library.html", function() {
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

function viewOffline(title) {
    // Show info about downloaded anime
    $("#right-bar").empty();
    title = title;
    
    $("#right-bar").load("view.html", function() {
        fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
            entry = JSON.parse(data).anime.find(element => element.title == title)
            episodes = entry.episodes
            
            document.getElementById("cover-img").src = entry.image
            replaceText("anime-title", title)
            replaceText("description", entry.desc)

            // No need to swap any orders now
            for (var i = 0; i < entry.episodes.length; i++) (function(i) {
                listItem = document.createElement("li");
                newEp = document.createElement("a");
                newEp.addEventListener('click', function() {
                    //downloadEpisode("https://animax.to"+root.querySelector(".message-body img").attrs.rc)
                    electron.shell.openPath(path+"/episodes/"+entry.title+"/"+entry.episodes[i].id+".mp4")
                    //downloadEpisode(episodes[i].attrs.href)
                })
                newEp.appendChild(document.createTextNode(entry.episodes[i].name));
                listItem.appendChild(newEp)
                document.getElementById("ep-list").appendChild(listItem);
            })(i);
        })
    })
}

loadSearch = function() {
    $("#right-bar").empty();
    $("#right-bar").load("search.html", function() {
        var input = document.getElementById("searchTerm");
        input.addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.getElementById("search").click();
            }
        });
        document.getElementById("search").addEventListener('click', () => {
            getMal(document.getElementById("searchTerm").value, function(res) {        
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
                        searchRes(res[i].link)
                    })
                    linked.appendChild(searchdiv)
                    document.getElementById("results").appendChild(linked);
                })(i);
    
            })
        });
    })
}

getData = function(link, callback) {
    https.get(link, function(response) {  
        var info = "";
        response.on('data', function(response) {
            info+=response;
        })
        response.on('end', function() {
           callback(info)
        })
    })
}

getMal = function(searchTerm, callback) {
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

downloadEpisode = function(link, title, epName, image, desc) {
    electron.ipcRenderer.invoke('show-notification', epName, false);
    videoID = uuid.v4()
    if (!fs.existsSync(path+"/episodes/"+title)){
        fs.mkdirSync(path+"/episodes/"+title);
    }
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        if (err) {
            console.error(err)
            return
        }
        
        var animeList = JSON.parse(data);
        entry = animeList.anime.findIndex(element => element.title == title)
        if (entry == -1) {
            animeList.anime.push({
                title: title,
                image: image,
                desc: desc,
                episodes: [{
                    name: epName,
                    id : videoID
                }]
            })
        } else {
            if (animeList.anime[entry].episodes.findIndex(element => element.name == epName) != -1) {
                return;
            }
            animeList.anime[entry].episodes.push({
                name: epName,
                id : videoID
            })
        }
        fs.writeFile(path+"/data.json", JSON.stringify(animeList), err => {
            if (err) {
              console.error(err)
              return;
            }
            file = fs.createWriteStream(path+"/episodes/"+title+"/"+videoID+".mp4");
            https.get(link, function(response) {
                response.pipe(file);
                electron.ipcRenderer.invoke('show-notification', epName, true);
            });
          })


    })
    /*
    file = fs.createWriteStream(path+"/episodes/"+title+"/"+videoID+".mp4");
    https.get(link, function(response) {
        response.pipe(file);
        console.log("done")
    });*/

}

function toggleNav() {
    if (document.getElementById("left-bar").style.width === "200px") {
        document.getElementById("left-bar").style.width = "50px";
        document.getElementById("right-bar").style.marginLeft = "100px";
        document.getElementById("left-bar").classList.add("collapsed")
    } else {
        document.getElementById("left-bar").style.width = "200px";
        document.getElementById("right-bar").style.marginLeft = "250px";
        document.getElementById("left-bar").classList.remove("collapsed")
    }
    
}

function searchRes(link) {
    // Show info about anime
    $("#right-bar").empty();
    link = link;
    
    $("#right-bar").load("view.html", function() {
        getData("https://animax.to"+link, function(info) {
            root = htmlparser.parse(info)
            episodes = root.querySelectorAll("table.table tbody tr a")
            
            document.getElementById("cover-img").src = "https://animax.to"+root.querySelector(".message-body img").attrs.rc
            var title = root.querySelector("h1 a").text
            replaceText("anime-title", title)

            var descT = root.querySelectorAll(".message-body span")
            replaceText("description",  descT[descT.length-1].text)

            // For some reason animax puts latest first so let's swap order
            for (var i = episodes.length-1; i >= 0; i--) (function(i) {
                listItem = document.createElement("li");
                newEp = document.createElement("a");
                newEp.addEventListener('click', function() {
                    //downloadEpisode("https://animax.to"+root.querySelector(".message-body img").attrs.rc)
                    downloadEpisode("https://www.sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4", title, episodes[i].text, "https://animax.to"+root.querySelector(".message-body img").attrs.rc, descT[descT.length-1].text)
                    //downloadEpisode(episodes[i].attrs.href)
                }) 
                newEp.appendChild(document.createTextNode(episodes[i].text));
                listItem.appendChild(newEp)
                document.getElementById("ep-list").appendChild(listItem); 
            })(i);
        })
    })
}

window.onload=function(){
    // Load main content
    $(function(){
        loadHome();
    })
    
}

