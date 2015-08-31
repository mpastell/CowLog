/*jshint smarttabs:true, globalstrict:true */

//"use strict";

/*Shared functions in cowlog.shared.js
  occasionally need to which version we are using
*/
var ipc = require('ipc');
var fs = require('fs');

cow.videoVersion = true;
cow.liveVersion = false;

//Data about currently playing videos
var currentVideo = {
    names : [],
    duration : null,
    started : false
};

//References to controls;
var controls = {};

//Globals
var projSettings = null; //An object that contains the settings of current project
var files = null; //videofiles
var videoarray = [];
var generator = null;
var modifierArray = [];

$(document).ready(function(){
    document.getElementById('getVideo').addEventListener('change',openLocalVideo,
							 false);

    document.getElementById('getSettings').addEventListener('change', loadSettingsFile, false);
    cow.setDefaults();

    //Init notification boxes
    notification.init();
    cow.setDefaults();
    makeDialogs();

    //Time slider
    controls.slider = $("#timeSlider").slider({
	     stop : function(event, ui) {
	     videoSetTime(ui.value);
	     //Play again if video wasn't paused on start
	    if (!currentVideo.pausedOnSlideStart)
	    {
		      videoPlay();
	    }
	    //$("#onslide").hide();
	   },
	slide : function(event, ui) {
	    //$("#onslide").show()
	    controls.timeindicator.html(ui.value);
	    //controls.timer = clearInterval(controls.timer);
	},
	start : function(event, ui) {
	    currentVideo.pausedOnSlideStart = videoarray[0].paused;
	    //Pause during sliding
	    if (!currentVideo.pausedOnSlideStart)
	    {
		videoPause();
	    }
	}
    });
    controls.timeindicator = $("#currentTime");
    controls.videolength = $("#videoLength");

    $(".controlButtonRow button").addClass("controlButton");
    $("#buttoncontainer > button").addClass("controlButton");

    //Event handlers
    $(window).resize(resizeDivs);
    $("#buttoncontainer").resize(resizeDivs);
    $("a.toggleParagraph").click(toggleParagraph);
});

//Dialog init code
function makeDialogs()
{
    $("#subjectprefs").dialog({
	title : "New subject",
	modal: true,
	width : 400,
	buttons:
	{ "Save": function(){
	    $(this).dialog("close");
	    openVideo();
	},
	  "Cancel" : function(){
	      $(this).dialog("close");
	  }
	},
	autoOpen: false,
	resizable : true
    });

  $("#projectprefs").dialog({
  title : "Create new project",
  modal: true,
  width : 600,
  height : window.innerHeight-200,
  buttons: { "Cancel": function() { $(this).dialog("close");}},
  autoOpen: false,
  resizable : true
  });

  $("#loadProject").dialog({
  title : "Load existing project",
  modal: true,
  width : 500,
  buttons: { "Close": function() { $(this).dialog("close");}},
  autoOpen: false,
  resizable : true
  });

  $("#subjectDate").datetimepicker({
  timeFormat : 'hh:mm:ss',
  showSecond : true
  });

  //Event handlers
  $("#newSubject").click(function()
  {$("#subjectprefs").dialog(
     "option", "position",
     [$(this).position().left, $(this).position().top]
  );

  $("#subjectprefs").dialog("open");
  return false;
  });

  $("#newProject").click(function()
  {$("#projectprefs").dialog(
   "option", "position",
   [$(this).position().left, "top"]
  );


  $("#projectprefs").dialog("open");

  return false;
  });

  $("#openProject").click(function()
  {$("#loadProject").dialog(
  "option", "position",
  [$(this).position().left, $(this).position().top]
  );

   $("#loadProject").dialog("open");
  return false;
  });
}


//http://www.html5rocks.com/en/tutorials/file/dndfiles/
//Open video dialog
function openLocalVideo(evt){
    files = evt.target.files;
    //Init some variables and clear old ones
    currentSubject.results = [];
    $("button").removeClass("active");
    $("#currentCode").html("");
}

//Get videofiles from dialog send to video window
function openVideo()
{
    currentSubject.videos = files;
    currentSubject.name = $("#subjectName").val();
    currentSubject.datetime = new Date(Date.parse($("#subjectDate").val()));
    currentSubject.file = projSettings.dataDirectory + "/" +
                          currentSubject.name + "_" +
                          currentSubject.datetime.toISOString() +
                          ".txt"

    currentVideo.started = false;
    videoarray = [];
    var n = files.length;
    for (var i=0; i<n; i++)
    {
      videoarray[i] = files[i].path;
		  //console.log(files[i].path);
	  }

    ipc.send("openvideos", videoarray);
}

//Receive video metadata
ipc.on("metadata", function(metadata){
  currentVideo.duration = metadata["duration"];
  $( "#timeSlider" ).slider( "option", "max", currentVideo.duration);
  controls.videolength.html(Math.round(currentVideo.duration) + " s");
});

//Receive video time for slider
ipc.on("timer", function(time){
  controls.slider.slider( "option", "value", time);
  controls.timeindicator.html(time);
});

//Video control for the whole array of videos
function videoPlay()
{
    ipc.send("video", {cmd : "play"});
}

function videoStop()
{
    ipc.send("video", {cmd : "stop"});
    var time = 0;
    controls.slider.slider( "option", "value", time);
    controls.timeindicator.html(time);
}

function videoPause()
{
  ipc.send("video", {cmd : "pause"});
}

function videoFwd()
{
    var amount = parseFloat($("#seekInput").val());
    ipc.send("video", {cmd : "seekBy", "val" : amount});
}

function videoBack()
{
    var amount = parseFloat($("#seekInput").val());
    ipc.send("video", {cmd : "seekBy", "val" : -amount});
}

function videoSetTime(time)
{
    ipc.send("video", {cmd : "seekTo", "val" : time});
}

function setSpeed()
{
    var rate = parseFloat(document.getElementById("speed").value);
    ipc.send("video", {cmd : "setSpeed", "val" : rate});
}

function toggleBlock(id)
{
    var div = document.getElementById(id);

    //Get the state of desired DIV
    var state = div.style.display;

    //Hide the whole prefs class
    $(".prefs").hide();
    //Try to set smart width
    //$(".prefs").width($("#content").width() - $("#buttoncontainer").width() - 100)
    resizePrefs();

    //Show the desired div if it was hidden
    if (state === "block")
    {
	div.style.display = "none";
	//link.innerHTML = "Show help";
    }
    else
    {
	div.style.display = "block";
	//link.innerHTML = "Hide help";
    }
}

function resizePrefs()
{
    $(".prefs").width($("#content").width() - $("#buttoncontainer").width() - 100);
}

//Make input boxes for classes
function classBoxes()
{
    var n = parseInt($("#nClasses").val());
    var boxHtml = "<h3>Type in behaviors in each class as comma separated list</h3><fieldset>";
    var modHtml = "";

    for (var i=1; i<=n; i++)
    {
	boxHtml += "<label>Class" +  i + "</label><input type='text'/>";
    }

    //If modifiers are used
    if (useModifiers())
    {
	modHtml = "<h3>Type in behaviors with modifiers as comma separated list</h3>";
	modHtml += "<fieldset><label>Behaviors with modifiers:</label><input type='text' id='modifiedClasses' /></fieldset>";
    }

    $("#modifierInputs").html(modHtml);

    var buttonHtml = "<p><button onclick='makeKeyInputs()' id='keyInputButton'>Add keyboard shortcuts</button></p>";

    buttonHtml += "</fieldset><button onclick='saveSettings()'>Save settings</button>";
    buttonHtml += "<button onclick='openSettings()'>Open settings</button>";

    $("#classInputs").html(boxHtml);
    $("#prefButtons").html(buttonHtml);
}

function resizeDivs()
{
    $("#right").width($("#content").width() - $("#buttoncontainer").width()-2);
    $("#right").height(window.innerHeight - $("#header").height() -
		       $("#prefnav").height() - 50);
    $("#startUp").hide();
    //$("body").css("background-color", "white");

}

function helpToc()
{
    var headers = $("#help h3");
    //headers.each(function(i){$(this).attr("name", "help-" + i)});


    var hlist = headers.map(function(i){
	return ("<li>"  + this.innerHTML + "</li>");
    }).toArray().join('');
    $("#helpToc").html("<h2>Table of contents</h2>" +
		       "<ul>" + hlist + "</ul>");
}

function toggleParagraph()
{
    $(this).next().toggle();
    return(false);
}

//Remove the last entered code
function undo()
{
    if (currentSubject.results.length === 0)
    {
	     $("#currentCode").html("No codes");
	      return;
    }

    currentSubject.results.pop();
    //Write to file
    writeCodes();
	  var last = currentSubject.results[currentSubject.results.length-1];
    videoSetTime(last["time"]);
	  $("#currentCode").html("<strong>Time:</strong> " +
          Math.round(last["time"]*100)/100 +
          " <strong>Code: </strong>" + last["code"] + "<BR/>");
}
