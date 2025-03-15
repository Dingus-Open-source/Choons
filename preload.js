const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  loadMusic: () => ipcRenderer.invoke('load-music'),
  playTrack: (track) => ipcRenderer.send('play-track', track),
  pauseTrack: () => ipcRenderer.send('pause-track'),
  nextTrack: () => ipcRenderer.send('next-track'),
  prevTrack: () => ipcRenderer.send('prev-track')
})