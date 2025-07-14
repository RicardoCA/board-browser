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
  const activeDownloads = new Map();
  const recentlyCompleted = new Set();
  const completedDownloads = [];
  const webContentsWithListeners = new Set(); // Para evitar listeners duplicados

  // Handler para enviar lista de downloads para o renderer
  ipcMain.handle('get-completed-downloads', () => {
    return completedDownloads;
  });

  // Handler para enviar downloads ativos
  ipcMain.handle('get-active-downloads', () => {
    return Array.from(activeDownloads.values());
  });

  // Handler para limpar lista de downloads
  ipcMain.handle('clear-completed-downloads', () => {
    completedDownloads.length = 0;
    return true;
  });

  // Função para configurar listeners de download
  function setupDownloadListener(webContents) {
    // Evita duplicar listeners no mesmo webContents
    if (webContentsWithListeners.has(webContents.id)) {
      return;
    }
    webContentsWithListeners.add(webContents.id);
    
    // Remove o ID quando o webContents for destruído
    webContents.on('destroyed', () => {
      webContentsWithListeners.delete(webContents.id);
    });

    webContents.session.on('will-download', (event, item, webContents) => {
      const originalFileName = item.getFilename();
      const downloadId = `${originalFileName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Verifica se este download já existe (evita duplicatas de múltiplos webviews)
      const existingDownload = Array.from(activeDownloads.values()).find(dl => 
        dl.originalFileName === originalFileName && 
        Math.abs(Date.now() - dl.startTime.getTime()) < 1000 // dentro de 1 segundo
      );
      
      if (existingDownload) {
        console.log('Download duplicado detectado, ignorando:', originalFileName);
        return;
      }
      
      // Cria objeto de download ativo
      const downloadInfo = {
        id: downloadId,
        fileName: originalFileName, // Nome que será exibido (será atualizado)
        originalFileName: originalFileName,
        totalBytes: item.getTotalBytes(),
        receivedBytes: 0,
        progress: 0,
        startTime: new Date(),
        state: 'progressing'
      };
      
      // Adiciona o download ao Map de downloads ativos
      activeDownloads.set(downloadId, downloadInfo);
      
      // Notifica o renderer sobre o novo download
      win.webContents.send('download-started', downloadInfo);
      
      // Listener para atualização de progresso
      item.on('updated', (event, state) => {
        if (state === 'progressing') {
          const receivedBytes = item.getReceivedBytes();
          const totalBytes = item.getTotalBytes();
          const progress = totalBytes > 0 ? (receivedBytes / totalBytes) * 100 : 0;
          
          // Atualiza informações do download
          downloadInfo.receivedBytes = receivedBytes;
          downloadInfo.progress = progress;
          downloadInfo.state = state;
          
          // Atualiza no Map
          activeDownloads.set(downloadId, downloadInfo);
          
          // Notifica o renderer sobre o progresso
          win.webContents.send('download-progress', {
            id: downloadId,
            receivedBytes,
            totalBytes,
            progress,
            fileName: downloadInfo.fileName
          });
        }
      });
      
      item.on('done', (event, state) => {
        // Obtém o nome final do arquivo (após save dialog)
        const finalFileName = path.basename(item.getSavePath());
        
        // Atualiza o nome no objeto de download
        downloadInfo.fileName = finalFileName;
        
        // Remove do Map de downloads ativos
        activeDownloads.delete(downloadId);
        
        // Notifica que o download ativo foi removido
        win.webContents.send('download-removed', downloadId);
        
        // Verifica se já não foi mostrado recentemente (usando nome final)
        const completedId = `${finalFileName}_${state}`;
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
          const completedDownloadInfo = {
            fileName: finalFileName, // Usa o nome final
            completedAt: new Date().toLocaleString('pt-BR'),
            path: item.getSavePath(),
            size: item.getTotalBytes()
          };
          completedDownloads.unshift(completedDownloadInfo);
          
          // Limita a lista a 50 downloads para não usar muita memória
          if (completedDownloads.length > 50) {
            completedDownloads.pop();
          }
          
          // Notifica o renderer sobre o novo download concluído
          win.webContents.send('download-completed', completedDownloadInfo);
          
        } else if (state === 'interrupted') {
          // Notifica sobre download interrompido
          win.webContents.send('download-interrupted', { fileName: finalFileName, downloadId });
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

  win.loadFile('index_teste.html');
  //win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});