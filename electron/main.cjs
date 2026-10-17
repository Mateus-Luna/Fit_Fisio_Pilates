
const {
  app,
  BrowserWindow,
  dialog,
} = require('electron');

let serverInstance = null;

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadURL('http://127.0.0.1:3000').catch((err) => {
    console.error('Falha ao abrir a URL no BrowserWindow:', err);
  });
}

async function startApplication() {
  process.env.PORT = '3000';
  process.env.NODE_ENV = app.isPackaged
    ? 'production'
    : (process.env.NODE_ENV || 'development');

  if (app.isPackaged) {
    process.env.FITFISIO_DATA_DIR = app.getPath('userData');
  }

  const { serverReady } = require('../server.js');

  serverInstance = await serverReady;

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

app.whenReady().then(startApplication).catch((error) => {
  console.error('Falha ao iniciar o FitFisio:', error);

  dialog.showErrorBox(
    'Não foi possível iniciar o FitFisio',
    'O sistema não conseguiu iniciar. Verifique os arquivos da instalação.',
  );

  app.quit();
});

app.on('before-quit', () => {
  if (serverInstance) {
    if (typeof serverInstance.closeAllConnections === 'function') {
      serverInstance.closeAllConnections();
    }
    serverInstance.close();
    serverInstance = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
