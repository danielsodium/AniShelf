const electron = require('electron');
const fs = require('fs');
const htmlparser = require('node-html-parser')
const $ = require('jquery');
const remote = electron.remote;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const path = (electron.app || electron.remote.app).getPath('userData')+"/AppStorage"
const load = require('../src/loader.js');



settings = {};

clearRecents = function() {
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data);
        data.recent = [];
        fs.writeFile(path+"/data.json", JSON.stringify(data), err => {
            console.log("done")
        })
    })
}


openPath = function() {
    console.log(path)
    require('child_process').exec('start '+path);
}

function restartApp() {
    electron.remote.app.relaunch()
    electron.remote.app.exit()
}

loadSettingsFile = function(callback) {
    if (load.getOnPlayer()) load.exitPlay();
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data)
        settings = data.settings;
        callback();
    })
}

toggleCSS = function() {
    document.documentElement.className = "theme-beige";
 }

saveSettingsFile = function() {
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data)
        data.settings = settings;
        console.log(data)
        fs.writeFile(path+"/data.json", JSON.stringify(data), err => {
            console.log("Saved!")
        })
    })
}

closeApp = () => {
    if (load.getOnPlayer()) {
        load.exitPlay()
        let w = remote.getCurrentWindow()
        w.close()
    } else {
        let w = remote.getCurrentWindow()
        w.close()
    }
    
}

toggleSetting = function(setting) {
    console.log("CLICK")
    settings[setting] = !settings[setting];
    saveSettingsFile();
}

changeScrape = function(val) {
    settings.scrape = val;
    console.log(val)
    saveSettingsFile();
}

deleteEpisode = function(entry, entryIndex, entryName, i) {
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data);
        entry = entry;
        uid = entry.episodes[i].id
        let options  = {
            buttons: ["Yes","Cancel"],
            message: "Are you sure you want to delete "+entryName+"?"
        }
        let response = electron.remote.dialog.showMessageBox(options)
        response.then(function(res) {
            if (res.response == 0) {
                data.anime[entryIndex].episodes.splice(data.anime[entryIndex].episodes.findIndex(element => element.name == entry.episodes[i].name), 1)
                var inRecent = data.recent.findIndex(element => element.name == entry.episodes[i].name)
                if (inRecent != -1) data.recent.splice(inRecent, 1)
                if (data.anime[entryIndex].episodes.length == 0) {
                    data.anime.splice(entryIndex, 1);
                }
                fs.writeFile(path+"/data.json", JSON.stringify(data), err => {
                    fs.unlinkSync(path+"/episodes/"+entry.title.replace(/[\W_]+/g,"-")+"/"+uid+".mp4")
                    document.getElementById(entryIndex).remove();
                })
            }
        })
    })
}

window.onload=function(){
    // Load main content
    $(function(){
        loadSettingsFile(function() {
            load.loadHome();
        })
    })
}

