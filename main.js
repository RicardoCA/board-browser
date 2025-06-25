const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      autoHideMenuBar: true
    },
    // Adicione estas duas linhas para remover completamente o menu
    frame: true, // Mantém a barra de título padrão
    autoHideMenuBar: false // Desativa a barra de menu completamente
  });

  // Remove o menu completamente
  Menu.setApplicationMenu(null);

  win.loadFile('index.html');
  //win.webContents.openDevTools();
}
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
