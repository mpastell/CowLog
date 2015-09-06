
var wjs = require("wcjs-player");

//Start with defaults, that are fixed once video starts playing
var videoWidth = 320;
var videoHeight = 240;
var videoAratio = 4/3;
var videoDuration = null;

//Catch errors from loading video!
function videoerror()
{
    dialog.showErrorBox("Media error", "Can't play selected video format.\n\nSee documentation for information about supported video formats and converters.");
    console.log("Caught video error!");
}

openVideos = function(files){
  var n = files.length;
  $("#videocontainer").empty();
  $("#droplist").empty();

  if (n>1)
  {
    $("#colSelect").show();
    $("<li><a href='#' onclick='setCols(this);return false;'>Auto</a></li>").appendTo("#droplist");
  }
  else {
    $("#colSelect").hide();
  }

  var n = files.length;

  for (var i=0; i<n; i++)
  {
    $("<div id='player" + i + "'></div>").appendTo("#videocontainer")[0];
    videoarray[i] = new wjs(("#player" + i)).addPlayer({autoplay : false, multiscreen: true, allowFullscreen : false});
    videoarray[i].onError(videoerror);
    videoarray[i].addPlaylist("file://" + files[i]);

    if (i === 0)
    {
        videoarray[0].onFrameSetup(function() {
          videoarray[0].pause();
          //console.log(videoarray[0].length()/1000);
          videoDuration = videoarray[0].length()/1000;
          ipc.send("metadata", {duration : videoarray[0].length()/1000});
          videoWidth = videoarray[0].width();
          videoHeight = videoarray[0].height();
          videoAratio = videoWidth/videoHeight;
          setVideoSize();
          });
    }else {
        videoarray[i].onFrameSetup(function()
        {
            videoPause();
        });
    }


    if (n>1){
      $("<li><a href='#' onclick='setCols(this);return false;'>" + (i+1) + "</a></li>").appendTo("#droplist");
    }
    //$(videoarray[i]).data("index", i);
  }
  videoPlay();
  //setVideoSize();
}

//Resize videos based on window size
$( window ).resize(function() {
  setVideoSize();
});

function setCols(sender)
{
  ncols = $(sender).text();
  setVideoSize();
}

//Set video width based on the number of videos and
//aspect ratio
function setVideoSize()
{
  var n = videoarray.length;
  var cols = null;
  if (n > 0){
    if (ncols==="Auto"){
    //Use sqrt of n
      cols = Math.min(n, Math.round(Math.sqrt(n)));
    } else {
      var cols = parseInt(ncols);
    }
    var vw = 100/(cols);
    $(".webchimeras").width(vw + "%");
    var vh = (window.innerWidth/cols)/videoAratio;
    //$(".webchimeras").width(vw);
    console.log(videoAratio);
    $(".webchimeras").height(vh);
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
	     video.time(video.time() + amount*1000);
    });
    ipc.send("timer", videoCurrentTime());
}

function videoSeekTo(time)
{
    videoarray.forEach(function(video){
	     video.time(time*1000);
    });
    ipc.send("timer", videoarray[0].time()/1000);
}


function videoStop()
{
    videoarray.forEach(function(video){
	     video.pause();
         video.time(0);
         //video.stop();
    });
    controls.timer = clearInterval(controls.timer);
}

//Get time only for the first video, because we can anyway use only one time code
function videoCurrentTime()
{
    return(Math.round(videoarray[0].time()/100)/10);
}

function setSpeed(speed)
{
    videoarray.forEach(function(video){
	     video.rate(speed);
    });
}

function getCodeTime(){
    if video.state() === "ended"
    {
        return(videoDuration);
    }
    else {
        return(videoarray[0].time()/1000);
    }
}
