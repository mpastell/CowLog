
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
    //var currentDiv = $("<div class='videoWindow'></div>").appendTo("#videocontainer");
    //videoarray[i] = $("<video id='video' class='player' onerror='videoerror()' \
    //width='49%'></video>"
    //).appendTo(currentDiv)[0];
    videoarray[i] = $("<video id='video' class='player' onerror='videoerror()'></video>").appendTo("#videocontainer")[0];

    if (i === 0)
    {
        videoarray[0].addEventListener('loadeddata', function() {
          console.log(videoarray[0].duration);
          ipc.send("metadata", {duration : videoarray[0].duration})
          }, false);
    }

    if (n>1){
      $("<li><a href='#' onclick='setCols(this);return false;'>" + (i+1) + "</a></li>").appendTo("#droplist");
    }

    $(videoarray[i]).width("100%");
    videoarray[i].src = files[i];
    $(videoarray[i]).data("index", i);
    setVideoSize();
  }
}

//Resize videos based on window size
$( window ).resize(function() {
  console.log("resized");
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
    $("video").width(vw + "%");
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

function getCodeTime(){
    return(videoarray[0].currentTime)
}
