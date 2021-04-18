const { app, BrowserWindow, ipcMain, Notification, nativeImage } = require("electron");
const path = require('path')
    
function createWindow () {

  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  //win.removeMenu()
  win.setIcon(path.join(__dirname, '../assets/images/maid-chan.png'));
  win.loadFile(path.join(path.dirname(__dirname),'views/index.html'))

}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


ipcMain.handle('show-notification', (event, ...args) => {
  const notification = {
      title: (args[1] ? "Download finished" : "Download started"),
      body: `Downloaded ${args[0]}`
  }
  new Notification(notification).show()
});