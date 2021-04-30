const { app, BrowserWindow, ipcMain, Notification, nativeImage } = require("electron");
const path = require('path')
const EventEmitter = require('events')
const { getAll } = require("./twist.js")

const loadingEvents = new EventEmitter()
function createWindow () {

  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    frame: false,
    icon : "../icon.ico",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  return win;
  
}

app.whenReady().then(() => {

  const window = createWindow()
  window.loadFile(path.join(path.dirname(__dirname),'views/splash.html'));
  loadingEvents.on('finished', () => {
    window.loadFile(path.join(path.dirname(__dirname),'views/index.html'));
 }) 
 downloadData();
  /*
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
  */
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


function downloadData() {
  getAll(function(info) {
      global.allAnime = info;
      loadingEvents.emit('finished')
  });
}

ipcMain.handle('show-notification', (event, ...args) => {
  const notification = {
      title: args[0],
      body: args[1]
  }
  new Notification(notification).show()
});

ipcMain.on( "setAllAnime", ( event, allAnime ) => {
  global.allAnime = allAnime;
});