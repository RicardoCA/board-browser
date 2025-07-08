const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
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
    frame: true,
    autoHideMenuBar: false
  });

  // Remove o menu completamente
  Menu.setApplicationMenu(null);

  // Controle para evitar múltiplos alerts
  const activeDownloads = new Set();
  const recentlyCompleted = new Set();
  const completedDownloads = []; // Array para armazenar downloads concluídos

  // Handler para enviar lista de downloads para o renderer
  ipcMain.handle('get-completed-downloads', () => {
    return completedDownloads;
  });

  // Handler para limpar lista de downloads
  ipcMain.handle('clear-completed-downloads', () => {
    completedDownloads.length = 0;
    return true;
  });

  // Função para configurar listeners de download
  function setupDownloadListener(webContents) {
    webContents.session.on('will-download', (event, item, webContents) => {
      const fileName = item.getFilename();
      const downloadId = `${fileName}_${Date.now()}`;
      
      // Adiciona o download ao conjunto de downloads ativos
      activeDownloads.add(downloadId);
      
      item.on('done', (event, state) => {
        // Remove do conjunto de downloads ativos
        activeDownloads.delete(downloadId);
        
        // Verifica se já não foi mostrado recentemente
        const completedId = `${fileName}_${state}`;
        if (recentlyCompleted.has(completedId)) {
          return; // Já foi mostrado, não mostra novamente
        }
        
        // Adiciona ao conjunto de recentemente completados
        recentlyCompleted.add(completedId);
        
        // Remove após 2 segundos para permitir novos downloads do mesmo arquivo
        setTimeout(() => {
          recentlyCompleted.delete(completedId);
        }, 2000);
        
        if (state === 'completed') {
          // Adiciona o download à lista de concluídos
          const downloadInfo = {
            fileName: fileName,
            completedAt: new Date().toLocaleString('pt-BR'),
            path: item.getSavePath(),
            size: item.getTotalBytes()
          };
          completedDownloads.unshift(downloadInfo); // Adiciona no início da lista
          
          // Limita a lista a 50 downloads para não usar muita memória
          if (completedDownloads.length > 50) {
            completedDownloads.pop();
          }
          
          // Notifica o renderer sobre o novo download
          win.webContents.send('download-completed', downloadInfo);
          
          /*dialog.showMessageBox(win, {
            type: 'info',
            title: 'Download Complete',
            message: `The download of "${fileName}" is complete!`,
            buttons: ['OK']
          });*/
        } else if (state === 'interrupted') {
          /*dialog.showMessageBox(win, {
            type: 'error',
            title: 'Download Stoped',
            message: `The download of the file "${fileName}" has been stopped.`,
            buttons: ['OK']
          });*/
        }
      });
    });
  }

  // Adiciona o listener para a janela principal
  setupDownloadListener(win.webContents);

  // Listener para quando webviews são criadas
  win.webContents.on('did-attach-webview', (event, webContents) => {
    console.log('Webview anexada, configurando listener de download');
    setupDownloadListener(webContents);
  });

  // Alternativa: usar o evento 'web-contents-created' para capturar todas as webviews
  app.on('web-contents-created', (event, contents) => {
    if (contents.getType() === 'webview') {
      console.log('Nova webview criada, configurando listener de download');
      setupDownloadListener(contents);
    }
  });

  win.loadFile('index.html');
  //win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});