const { app, BrowserWindow, protocol } = require('electron')
const path = require('path')
const fs = require('fs')

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-hardware-overlays');

// Add protocol handler
app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, callback) => {
    const url = request.url.substr(7)
    callback(decodeURI(url))
  })
})

const cssPath = path.join(__dirname, 'src', 'css', 'main.css');
if (!fs.existsSync(cssPath)) {
  console.error('CSS file not found:', cssPath);
  // Ensure the css directory exists
  fs.mkdirSync(path.join(__dirname, 'src', 'css'), { recursive: true });
}

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Use absolute path for loading HTML
  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  // Enable DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer Console:', message);
  });
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
