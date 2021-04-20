const electron = require('electron');
const fs = require('fs');
const htmlparser = require('node-html-parser')
const $ = require('jquery');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const path = (electron.app || electron.remote.app).getPath('userData')+"/AppStorage"
const twist = require('../src/twist.js')

const downloader = require('../src/download.js')
const load = require('../src/loader.js')

settings = {};

loadSettingsFile = function() {
    fs.readFile(path+"/data.json", 'utf8' , (err, data) => {
        data = JSON.parse(data)
        settings = data.settings;
    })
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

toggleSetting = function(setting) {
    settings[setting] = !settings[setting];
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
        loadSettingsFile();
        load.loadHome();
    })
    
}

