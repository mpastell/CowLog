//Only the first video will return time...

var ipc = require('ipc');
var remote = require("remote");
var dialog = remote.require("dialog");
var ratio;
//References to controls;
var controls = {};


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

//Catch errors from loading video!
function videoerror()
{
    dialog.showErrorBox("Media error", "Can't play selected video format.\n\nSee documentation for information about supported video formats and converters.");
    console.log("Caught video error!");
}

openVideos = function(files){
  var n = files.length;
  $("#videocontainer").html("");
  var n = files.length;


  for (var i=0; i<n; i++)
  {
    var currentDiv = $("<div class='videoWindow'></div>").appendTo("#videocontainer");
    videoarray[i] = $("<video id='video' class='player' onerror='videoerror()' \
    width='100%'></video>"
    ).appendTo(currentDiv)[0];

    if (i === 0)
    {
        videoarray[0].addEventListener('loadeddata', function() {
          console.log(videoarray[0].duration);
          ipc.send("metadata", {duration : videoarray[0].duration})
          }, false);
    }

    //var videoURL = window.URL.createObjectURL(files[i]);
    videoarray[i].src = files[i];
    $(videoarray[i]).data("index", i);
  }
}

//Video control for the whole array of videos
function videoPlay()
{
    videoarray.forEach(function(video){
	video.play();
    });
    //Set the timer for updating slider
    controls.timer = setInterval(
	function(){
	    var time = videoCurrentTime();
      ipc.send("timer", time);
	},
	1000);
}


function videoPause()
{
    videoarray.forEach(function(video)
		       {video.pause();
		       });
    controls.timer = clearInterval(controls.timer);
}

function videoSeekBy(amount)
{
    videoarray.forEach(function(video){
	     video.currentTime = video.currentTime + amount;
    });
    ipc.send("timer", video.currentTime);
}

function videoSeekTo(time)
{
    videoarray.forEach(function(video){
	     video.currentTime = time;
    });
    ipc.send("timer", video.currentTime);
}


function videoStop()
{
    videoarray.forEach(function(video){
	     video.pause();
       video.currentTime = 0;
    });
    controls.timer = clearInterval(controls.timer);
}

//Get time only for the first video, because we can anyway use only one time code
function videoCurrentTime()
{
    return(Math.round(videoarray[0].currentTime*100)/100);
}

function setSpeed(speed)
{
    videoarray.forEach(function(video){
	     video.playbackRate = speed;
    });
}
