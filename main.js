var app = require('app');  // Module to control application life.
var ipc = require('ipc');
var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;
var videoWin = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 1000, height: 800, icon: __dirname + '/almod.png'});

    // and load the index.html of the app.
    mainWindow.loadUrl('file://' + __dirname + '/index.html');
    mainWindow.openDevTools();

    videoWin =  new BrowserWindow({ width: 600, height: 480,
       "auto-hide-menu-bar" : true,
        x :100, y :100});
    videoWin.loadUrl('file://' + __dirname + '/videowindow_multi.html');
    videoWin.openDevTools();

    ipc.on('video', function(event, arg) {
        videoWin.webContents.send('video', arg);
    });

    ipc.on('openvideos', function(event, files) {
        videoWin.webContents.send('openvideos', files);
    });

    ipc.on('main', function(event, arg) {
        mainWindow.webContents.send('main', arg)
    });

    ipc.on('metadata', function(event, arg) {
        mainWindow.webContents.send('metadata', arg)
    });

    //Timer for display
    ipc.on('timer', function(event, arg) {
        mainWindow.webContents.send('timer', arg)
    });

    //Time for behaviors
    ipc.on('time', function(event, arg) {
        mainWindow.webContents.send('time', arg)
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
      videoWin.close();
      videoWin = null;
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
      app.quit();
  });
});
