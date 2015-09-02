var app = require('app');  // Module to control application life.
var ipc = require('ipc');
var dialog = require('dialog');
var fs = require('fs');
var BrowserWindow = require('browser-window');  // Module to create native browser window.

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
    mainWindow = new BrowserWindow({width: 400, height: 850,
            title : "CowLog",
            icon: __dirname + '/almod.png'});
    mainWindow.loadUrl('file://' + __dirname + '/html/index.html');
    //mainWindow.openDevTools();

    videoWin =  new BrowserWindow({ width: 600, height: 480,
        title : "CowLog video",
        "auto-hide-menu-bar" : true,
        x :100, y :100,
        show : false
    });
    videoWin.loadUrl('file://' + __dirname + '/html/videowindow_multi.html');
    //videoWin.openDevTools();

    prefsWindow = new BrowserWindow({width: 500, height: 600,
        title : "Project preferences",
        icon: __dirname + '/almod.png',
        show : false});
    prefsWindow.loadUrl('file://' + __dirname + '/html/prefs_windows.html');

    //prefsWindow.openDevTools();

    //For development quick access
    //subjectWindow = new BrowserWindow({width: 400, height: 500,
    //    "auto-hide-menu-bar" : true,
    //    icon: __dirname + '/almod.png',
    //    show : true});
    //subjectWindow.loadUrl('file://' + __dirname + '/subject_window.html');
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
        mainWindow.webContents.send('project-settings', arg);
    });

    //Show hidden windows or open new instance
    ipc.on('show', function(event, win) {
        switch (win)
        {
            case "prefs":
                //Clear form by reloading
                prefsWindow.loadUrl('file://' + __dirname + '/html/prefs_windows.html');
                prefsWindow.show();
                break;
            case "subject":
                subjectWindow = new BrowserWindow({width: 400, height: 600,
                    icon: __dirname + '/almod.png',
                    "auto-hide-menu-bar" : true,
                    "title" : "New subject",
                    show : true});
                subjectWindow.loadUrl('file://' + __dirname + '/html/subject_window.html');
                break;
            case "about":
                aboutWindow = new BrowserWindow(
                  {width: 500, height: 450,
                    "auto-hide-menu-bar" : true,
                    "title" : "About CowLog",
                    icon: __dirname + '/almod.png'});
                aboutWindow.loadUrl('file://' + __dirname + '/html/about.html');
                break;
            case "help":
                helpWindow = new BrowserWindow(
                  {width: 500, height: 600,
                    "auto-hide-menu-bar" : true,
                    title : "CowLog help",
                    icon: __dirname + '/almod.png'});
                 helpWindow.loadUrl('file://' + __dirname + '/html/help.html')
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

        var text = fs.readFileSync(path[0], encoding="utf-8");

        var projSettings = JSON.parse(text);
        mainWindow.webContents.send('project-settings', projSettings);
        //prefsWindow.webContents.send('project-settings', projSettings);
    });

    ipc.on('edit-settings', function(event, arg) {
        //console.log("Editing settings")
        var path = dialog.showOpenDialog({title : "Choose project to edit",
            filters :
                [{name : "CowLog project *.json", extensions : ["json"]}]
        });

        var text = fs.readFileSync(path[0], encoding="utf-8");

        var projSettings = JSON.parse(text);
        prefsWindow.webContents.send('project-settings', projSettings);
        prefsWindow.show();
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
            videoWin.hide();
        }
    });



    function exitWindow(window)
    {
      if (window !== null)
      {
        window.close();
        window = null;
      }
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        exiting = true;
        exitWindow(videoWin);
        exitWindow(prefsWindow);
        exitWindow(subjectWindow);
        exitWindow(aboutWindow);
        exitWindow(helpWindow);

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;

    });
});
