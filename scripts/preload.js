const fs = require('fs');
const electron = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    var path = (electron.app || electron.remote.app).getPath('userData')+"/AppStorage"
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
        fs.mkdirSync(path+"/episodes");
        fs.mkdirSync(path+"/images");
        settings = {
            devMode : true,
            openExternal : false
        }
        anime = {settings: settings, anime: []}
        fs.appendFile(path+"/data.json", JSON.stringify(anime), function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
    }
})