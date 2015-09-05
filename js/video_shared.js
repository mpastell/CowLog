var ipc = require('ipc');
var remote = require("remote");
var dialog = remote.require("dialog");
var ratio;
//References to controls;
var controls = {};
var ncols = "Auto";

ipc.on('openvideos', function(files)
{
  openVideos(files);
});

//Video player control
ipc.on('video', function(msg)
{
  var cmd = msg["cmd"];
  var val = msg["val"];
  switch (cmd) {
    case "play":
      videoPlay();
      break;
    case "pause":
      videoPause();
      break;
    case "stop":
      videoStop();
      break;
    case "seekBy":
      videoSeekBy(val);
      break;
    case "seekTo":
      videoSeekTo(val);
      break;
    case "setSpeed":
      setSpeed(val);
      break;
    case "getTime":
      ipc.send("time", videoarray[0].currentTime); //Send time for behavior codes
      break;
    default:
      console.log("Default");
  }
});

var videoarray = [];
