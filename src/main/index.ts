import { app, shell, BrowserWindow, ipcMain, screen, WebContentsView } from 'electron'
import path, { join } from 'path';
import { WINDOW_MIN_HEIGHT } from '@/common/constans/common';
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): BrowserWindow {
  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return mainWindow;
}

let win: any;
let mainWin: any;
const init = (mainWin, mainView) => {
  ipcMain.on('detach:service', async (event, arg: { type: string }) => {
    const data = await operation[arg.type]();
    event.returnValue = data;
  });
  const createWin = createDetachWin(mainWin, mainView);
}

const operation = {
  minimize: () => {
    win.focus();
    win.minimize();
  },
  maximize: () => {
    win.isMaximized() ? win.unmaximize() : win.maximize();
  },
  close: () => {
    win.close();
  },
  endFullScreen: () => {
    win.isFullScreen() && win.setFullScreen(false);
  },
};

function createDetachWin(mainWin, mainView) {
  console.log('mainWindow------', mainWin);
  const detachWin = new BrowserWindow({
    height: mainWin.getBounds().height,
    minHeight: WINDOW_MIN_HEIGHT,
    width: mainWin.getBounds().width,
    autoHideMenuBar: true,
    // 无边框窗口
    frame: true,
    // 无标题
    titleBarStyle: 'hidden',
    show: true,
    x: mainWin.getBounds().x,
    y: mainWin.getBounds().y,
    trafficLightPosition: { x: 12, y: 21 },
    webPreferences: {
      webSecurity: false,
      backgroundThrottling: false,
      contextIsolation: false,
      webviewTag: true,
      devTools: true,
      nodeIntegration: true,
      navigateOnDragDrop: true,
      spellcheck: false,
    },
  });
  win = detachWin;
  if (process.env.NODE_ENV === 'development') {
    detachWin.loadURL('http://localhost:8080');
    // Load the url of the dev server if in development mode
  } else {
    // detachWin.loadURL(`file://${path.join(__static, './detach/index.html')}`);
  }
  detachWin.once('ready-to-show', async () => {
    console.log('detachWin-------ready-to-show')
    detachWin.show();
  });
  detachWin.on('maximize', () => {
    detachWin.webContents.executeJavaScript('window.maximizeTrigger()');
    const view = new WebContentsView();
    if (!view) return;
    detachWin.contentView.addChildView(view);
    const display = screen.getDisplayMatching(detachWin.getBounds());
    view.setBounds({
      x: 0,
      y: WINDOW_MIN_HEIGHT,
      width: display.workArea.width,
      height: display.workArea.height - WINDOW_MIN_HEIGHT,
    });
  });
  // 最小化
  detachWin.on('unmaximize', () => {
    detachWin.webContents.executeJavaScript('window.unmaximizeTrigger()');
    const view = new WebContentsView();
    if (!view) return;
    const bounds = detachWin.getBounds();
    const display = screen.getDisplayMatching(bounds);
    const width =
      (display.scaleFactor * bounds.width) % 1 == 0
        ? bounds.width
        : bounds.width - 2;
    const height =
      (display.scaleFactor * bounds.height) % 1 == 0
        ? bounds.height
        : bounds.height - 2;
    view.setBounds({
      x: 0,
      y: WINDOW_MIN_HEIGHT,
      width,
      height: height - WINDOW_MIN_HEIGHT,
    });
  });
  return detachWin;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  mainWin = createWindow();
  const view = new WebContentsView();
  init(mainWin, view)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) 
      init(mainWin, view)
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
