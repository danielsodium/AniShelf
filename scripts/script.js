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

loadSettings = function() {
    $("#main").empty();
    $("#main").load("settings.html")
}


loadHome = function() {
    $("#main").empty();
    $("#main").load("home.html")
}

loadLibrary = function() {
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
                listItem = document.createElement("li");
                newEp = document.createElement("a");
                newEp.addEventListener('click', function() {
                    //downloadEpisode("https://animax.to"+root.querySelector(".message-body img").attrs.rc)
                    electron.shell.openPath(path+"/episodes/"+entry.title+"/"+entry.episodes[i].id+".mp4")
                    //downloadEpisode(episodes[i].attrs.href)
                })
                newEp.appendChild(document.createTextNode(entry.episodes[i].name));
                listItem.appendChild(newEp)

                deleteLink = document.createElement("a");
                deleteIcon = document.createElement("i");
                deleteIcon.classList.add("fa")
                deleteIcon.classList.add("fa-trash")
                deleteLink.addEventListener('click', function() {
                    deleteEpisode(data,entry, entryIndex, i, listItem)
                    
                })
                deleteLink.appendChild(deleteIcon)
                listItem.appendChild(deleteLink)
                document.getElementById("ep-list").appendChild(listItem);
            })(i);
        })
    })
}

deleteEpisode = function(data,entry, entryIndex, i, el, el2) {
    data = data;
    entry = entry;
    element = el;
    uid = entry.episodes[i].id
    let options  = {
        buttons: ["Yes","Cancel"],
        message: "Are you sure you want to delete this episode?"
    }
    let response = electron.remote.dialog.showMessageBox(options)
    response.then(function(res) {
        if (res.response == 0) {
            data.anime[entryIndex].episodes.splice(data.anime[entryIndex].episodes.findIndex(element => element.name == entry.episodes[i].name), 1)
            if (data.anime[entryIndex].episodes.length == 0) {
                data.anime.splice(entryIndex, 1);
            }
            fs.writeFile(path+"/data.json", JSON.stringify(data), err => {
                fs.unlinkSync(path+"/episodes/"+entry.title+"/"+uid+".mp4")
                element.remove();
            })
        }
    })
}

loadSearch = function() {
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
                pipeDownload(response, file, epName);
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

function pipeDownload(inStream, fileStream, title) {
    const fs = require('fs');
    fileStream = fileStream;
    // get total size of the file
    let size = inStream.headers[ 'content-length' ]
    document.getElementById("download-title").innerHTML = "Downloading "+ title;
    document.getElementById("download").style.display = "block"
    let written = 0;
    inStream.on('data', data => {
        // do the piping manually here.
        fileStream.write(data, () => {
            written += data.length;
            var percent = (written/size*100).toFixed(2)
            document.getElementById("progress-bar").value = percent;
            document.getElementById("download-percent").innerHTML = percent+"%";
            if (percent == 100) {
                document.getElementById("download").style.display = "none"
            }
            console.log(`written ${written} of ${size} bytes (${(written/size*100).toFixed(2)}%)`);
        });
    });
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

function searchRes(link) {
    // Show info about anime
    $("#main").empty();
    link = link;
    
    $("#main").load("view.html", function() {
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

