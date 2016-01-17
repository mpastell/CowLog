var app = require('electron').app;
const ipc = require('electron').ipcMain;
var dialog = require('electron').dialog;
var BrowserWindow = require('electron').BrowserWindow;
var fs = require('fs');

//Set plugin path for VLC player
//See: https://github.com/RSATom/WebChimera.js/wiki/Electron-v0.36.x-compatibility-issue-on-Windows
if (process.platform === 'win32')
{
  process.env['VLC_PLUGIN_PATH'] = __dirname + "/node_modules/webchimera.js/Release/plugins";
}

// Report crashes to our server.
//require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;
var videoWin = null;
var prefsWindow = null;
var subjectWindow = null;
var aboutWindow = null;
var helpWindow = null;
var exiting = false;

//Runtime variables
var projSettings = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    //if (process.platform != 'darwin') {
        app.quit();
    //}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 400, height: 850,
            title : "CowLog",
            icon: __dirname + '/almod.png'});
    mainWindow.loadURL('file://' + __dirname + '/html/index.html');
    //mainWindow.openDevTools();

    videoWin =  new BrowserWindow({ width: 600, height: 600,
        title : "CowLog video",
        "auto-hide-menu-bar" : true,
        icon: __dirname + '/almod.png',
        x :100, y :100,
        show : false
    });

    //If webchimera.js loads use it as default, otherwise use HTML5
    try
    {
      var wcjs = require("webchimera.js");
      videoWin.loadURL('file://' + __dirname + '/html/videowindow_wcjs.html');
    } catch(e)
    {
        console.log('ERROR loading webchimera.js module\n', e);
        console.log('Using HTML5 player');
        videoWin.loadURL('file://' + __dirname + '/html/videowindow_html5.html');
    }

    //videoWin.openDevTools({detach : true});

    prefsWindow = new BrowserWindow({width: 500, height: 600,
        title : "Project preferences",
        icon: __dirname + '/almod.png',
        show : false});
    prefsWindow.loadURL('file://' + __dirname + '/html/prefs_window.html');
    //prefsWindow.openDevTools({detach : true});

    //For development quick access
    //subjectWindow = new BrowserWindow({width: 400, height: 500,
    //    "auto-hide-menu-bar" : true,
    //    icon: __dirname + '/almod.png',
    //    show : true});
    //subjectWindow.loadURL('file://' + __dirname + '/subject_window.html');
    //subjectWindow.openDevTools();

    //Control player in videowindow
    ipc.on('video', function(event, arg) {
        videoWin.webContents.send('video', arg);
    });

    //Open videos in player
    ipc.on('openvideos', function(event, files) {
        videoWin.show();
        videoWin.webContents.send('openvideos', files);
    });

    //Video metadata
    ipc.on('metadata', function(event, arg) {
        mainWindow.webContents.send('metadata', arg)
    });

    //Video timer for progress indicator
    ipc.on('timer', function(event, arg) {
        mainWindow.webContents.send('timer', arg)
    });

    //Time for behaviors
    ipc.on('time', function(event, arg) {
        mainWindow.webContents.send('time', arg)
    });

    //New subject opened from subjectDialog
    ipc.on('current-subject', function(event, arg)
    {
        mainWindow.webContents.send('current-subject', arg);
    });

    //Settings saved from prefs window to main
    ipc.on('project-settings', function(event, arg) {
        projSettings = arg;

        if (projSettings.videoplayer === "vlc")
        {
            videoWin.loadURL('file://' + __dirname + '/html/videowindow_wcjs.html');
        }
        else {
            videoWin.loadURL('file://' + __dirname + '/html/videowindow_html5.html');
        }

        mainWindow.webContents.send('project-settings', arg);
    });

    //Show hidden windows or open new instance
    ipc.on('show', function(event, win) {
        switch (win)
        {
            case "prefs":
                //Clear form by reloading
                prefsWindow.loadURL('file://' + __dirname + '/html/prefs_window.html');
                prefsWindow.show();
                break;
            case "subject":
                subjectWindow = new BrowserWindow({width: 400, height: 600,
                    icon: __dirname + '/almod.png',
                    "auto-hide-menu-bar" : true,
                    "title" : "New subject",
                    show : true});
                subjectWindow.loadURL('file://' + __dirname + '/html/subject_window.html');
                break;
            case "about":
                aboutWindow = new BrowserWindow(
                  {width: 500, height: 450,
                    "auto-hide-menu-bar" : true,
                    "title" : "About CowLog",
                    icon: __dirname + '/almod.png'});
                aboutWindow.loadURL('file://' + __dirname + '/html/about.html');
                break;
            case "help":
                helpWindow = new BrowserWindow(
                  {width: 500, height: 600,
                    "auto-hide-menu-bar" : true,
                    title : "CowLog help",
                    icon: __dirname + '/almod.png'});
                 helpWindow.loadURL('file://' + __dirname + '/html/help.html')
            default:
                break;
        }
    });

    //Hide windows
    ipc.on('hide-window', function(event, arg) {
        switch (arg) {
            case "prefs":
                prefsWindow.hide();
                break;
            case "subject":
                subjectWindow.hide();
                break;
            default:
                break;
        }
    });

    //Settings from file
    ipc.on('load-settings', function(event, arg) {
        var path = dialog.showOpenDialog({title : "Open project",
            filters :
                [{name : "CowLog project *.json", extensions : ["json"]}]
        });

      if (path)
      {
        var text = fs.readFileSync(path[0], encoding="utf-8");

        projSettings = JSON.parse(text);

        if (projSettings.videoplayer === "vlc")
        {
            videoWin.loadURL('file://' + __dirname + '/html/videowindow_wcjs.html');
        }
        else {
            videoWin.loadURL('file://' + __dirname + '/html/videowindow_html5.html');
        }

        mainWindow.webContents.send('project-settings', projSettings);
      }
        //prefsWindow.webContents.send('project-settings', projSettings);
    });

    ipc.on('edit-settings', function(event, arg) {
        //console.log("Editing settings")
        var path = dialog.showOpenDialog({title : "Choose project to edit",
            filters :
                [{name : "CowLog project *.json", extensions : ["json"]}]
        });

        if (path)
        {
          var text = fs.readFileSync(path[0], encoding="utf-8");
          var projSettings = JSON.parse(text);
          prefsWindow.webContents.send('project-settings', projSettings);
          prefsWindow.show();
        }

      });

    //Send messages to main window
    ipc.on('main', function(event, arg) {
        mainWindow.webContents.send('main', arg);
    });

    //Keep prefswindow in background unless app exits
    prefsWindow.on('close', function(e)
    {
        if (!exiting)
        {
            e.preventDefault();
            prefsWindow.hide();
        }
    });

    //Keep videowindow in background unless app exits
    videoWin.on('close', function(e)
    {
        if (!exiting)
        {
            e.preventDefault();
            videoWin.reload();
            videoWin.hide();
        }
    });

    function exitWindow(window)
    {
      try {
        if (window !== null)
        {
          window.close();
        }
        window = null;
      }
      catch (e)
      {
        console.log(e);
      }
    }

    // Emitted when the main window is closed.
    mainWindow.on('closed', function() {
        exiting = true;

        exitWindow(videoWin);
        exitWindow(prefsWindow);
        exitWindow(subjectWindow);
        exitWindow(aboutWindow);
        exitWindow(helpWindow);
        mainWindow = null;

    });
});
