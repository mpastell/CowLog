/*jshint smarttabs:true, globalstrict:true */

//"use strict";

/*Shared functions in cowlog.shared.js 
  occasionally need to which version we are using
*/
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
var files = null;
var videoarray = [];
var generator = null;
var modifierArray = [];

$(document).ready(function(){
    document.getElementById('getVideo').addEventListener('change',openLocalVideo,
							 false);

    document.getElementById('getSettings').addEventListener('change', loadSettingsFile, false);
    cow.setDefaults();

    var remote = require('remote');
    var fs = remote.require('fs');
    fs.writeFileSync("Koe.txt", "Jotain");

    //Init notification boxes
    notification.init();
    //$("body").click(notification.hide) // Alternative to timers
    
    //if (localStorage.player != undefined)
    //{
    //	$("#player").val(localStorage.player);
    //}
    
    //getStoredProjects();

    //If last project is defined and has a name attempt to load it
    if (isDefined("lastProject"))
    {
     	if (localStorage.lastProject.length > 0)
	{
    	    $("#storedProjects").val("savedProject_" + localStorage.lastProject);
    	    //loadSettings();
    	    //Strange refresh behavior in firefox, workaround
    	    $("#subjectprefs input").removeAttr("disabled");
    	    $("#subjectprefs input").each(function()
    					  {$(this).val("");});
    	}
	else
	{
	    cow.setDefaults();	    
	}
    }
    else
    {
	cow.setDefaults();
    }

    //Table of contents for Help
    helpToc();
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

    //Uncomment for testing video styles
    // files = JSON.parse(localStorage.files);
    // openVideo();
});	  




//Dialog init code
function makeDialogs()
{
    $("#subjectprefs").dialog({
	title : "Subject preferences",
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
    
    //$("#subjectTime").datepicker();
    

    $("#help").dialog({
	title : "CowLog Help",
	modal: false,
	width : "600",
	height : window.innerHeight-100,
	buttons: { "Close": function() { $(this).dialog("close");}},
	autoOpen: false,
	resizable : true,
	draggable : true,
	position : "top"
    });

    //Buttons
    //$("#newSubject").button({icons : {primary : 'ui-icon-folder-open'}});
    //Event handlers
    $("#newSubject").click(function()
			   {$("#subjectprefs").dialog(
			       "option", "position",
			       [$(this).position().left, $(this).position().top]
			   );
			    if (isChrome)
			    {
				$("#videocontainer").html("");
			    }
			    
			    $("#subjectprefs").dialog("open");
			    return false;
			   });

    $("#newProject").click(function()
			   {$("#projectprefs").dialog(
			       "option", "position",
			       [$(this).position().left, "top"]
			   );
			    
			    if (isChrome)
			    {
				$("#videocontainer").html("");
			    }
			    
			    $("#projectprefs").dialog("open");
			    
			    return false;
			   });

    $("#openProject").click(function()
			    {$("#loadProject").dialog(
				"option", "position",
				[$(this).position().left, $(this).position().top]
			    );
			     
			     if (isChrome)
			     {
				 $("#videocontainer").html("");
			     }
			     
			     $("#loadProject").dialog("open");
			    return false;
			    });

    

    $("#showHelp").click(function()
			   {$("#help").dialog(
			       "option", "position",
			       [$(this).position().left, 0]
			   );
			    $("#help").dialog("open");
			    return false;});
}



//http://www.html5rocks.com/en/tutorials/file/dndfiles/
function openLocalVideo(evt){
    files = evt.target.files;

    //Init some variables and clear old ones
    localStorage.results = "";
    
    $("button").removeClass("active");
    $("#currentCode").html("");
}

function openVideo()
{
    //$("#videocontainer").resizable("destroy");
    //Check which player is going to be used
    currentVideo.started = false;
    var value = projSettings.player;
    videoarray = [];
    $("#videocontainer").html("");
    var n = files.length;
    console.log(currentVideo);

    window.URL = window.URL || window.webkitURL;
    var size = 95;//99/n;  
    
    for (var i=0; i<n; i++)
    {
	var currentDiv = $("<div class='videoWindow'><h3 class='videohead'>" + files[i].name + "</h3></div>").appendTo("#videocontainer");
	
	if (value === "html")
	{
	    videoarray[i] = $("<video id='video' class='player'></video>").appendTo(currentDiv)[0];
	    var videoURL = window.URL.createObjectURL(files[i]);
		console.log(files[i].path);
	    $(videoarray[i]).data("index", i);
	    //videoarray[i].onloadeddata =  htmlVideoProperties;
	    
	    //This only fires in Firefox, chrome needs workAround!
	    if (!isChrome())
	    {
		videoarray[i].onloadedmetadata =  htmlVideoProperties;
	    }
	    else
	    {
		if (i === (n-1))
		{
		    setTimeout(chromeSetVideos, 100);
		}
	    }
	    
	    videoarray[i].src = videoURL;
	}
	
	if (value === "vlc")
	{
	    var newVideo =  $("<embed type='application/x-vlc-plugin' pluginspage='http://www.videolan.org' version='VideoLAN.VLCPlugin.2' width='99.5%' height='99.5%' id='vlc' toolbar='false'></embed>").appendTo(currentDiv)[0];
	    videoarray[i] = new Vlc(newVideo);
	    $(videoarray[i]).data("index", i);
	    //Full URL of the file comes from project video directory and selected file
	    var fileURL = "file:///" + getVideoDir() + files[i].name;
	    videoarray[i].video.playlist.add(fileURL);
	    //currentDiv.resizable().draggable({containment : "document"});
	    //Add event handler only to last video in VLC array, because there doesn't seem to be a way to recognize the sender
	    if (i === (n-1))
	    {
		videoarray[i].video.addEventListener('MediaPlayerPlaying',vlcVideoProperties, false);
		//console.log("last!");
	    }
	}
	//Open VLC videos:
	//Start playing and pause when playing event fires
	if (value==="vlc"){videoPlay();}
	
	console.log(files[i].name);
	resizeDivs();
    }
}



//Set videoproperties, onloadeddata event
function htmlVideoProperties()
{
    //console.log("event");
    //Lock aspectratio for resizable
    var video = this;
    var height = video.videoHeight;
    var width = video.videoWidth;
    var ratio = width/height;
    $(video).parent().resizable(
	{aspectRatio : ratio,
	 minWidth : 50}).draggable();
    $(video).parent().width(width);
    $(video).parent().height(height);
    
    //Set the duration to the duration of first video
    if ($(video).data("index") === 0)
    {
	currentVideo.duration = this.duration;
	$( "#timeSlider" ).slider( "option", "max", currentVideo.duration);
	controls.videolength.html(currentVideo.duration + " s");
    }
}

//Get VLC video properties when it first starts playing
function vlcVideoProperties()
{
    if (!currentVideo.started)
    {
	currentVideo.started = true;
	videoPause();

	currentVideo.duration = videoarray[0].video.input.length/1000;	
	$( "#timeSlider" ).slider( "option", "max", currentVideo.duration);
	controls.videolength.html(currentVideo.duration + " s");
	
	var n = videoarray.length;
	var video = null;
	var height = null;
	var width = null;
	var ratio = null;
	
	for (var i=0; i<n; i++)
	{
	    video = videoarray[i];
	    height = video.videoHeight;
	    width = video.videoWidth;
	    ratio = width/height;	    
	    console.log(ratio)
	    $(video.video).parent().resizable(
		{aspectRatio : ratio,
		 minWidth : 50}).draggable();
	    
	    $(video.video).parent().width(width);
	    $(video.video).parent().height(height);
	}
    }
}

//
//var d = null;
function chromeSetVideos()
{
    console.log("chromeevent");
    var videos = $("video");
    if (isNaN(videos[0].duration))
    {
	console.log("Not loaded");
	setTimeout(chromeSetVideos, 100);
    }
    else
    {
	console.log(videos[0].duration);
	currentVideo.duration = videos[0].duration;
	videos.map(function(){
	        var video = this;
	    var height = video.videoHeight;
	    var width = video.videoWidth;
	    var ratio = width/height;
	    $(video).parent().resizable(
		{aspectRatio : ratio,
		 minWidth : 50}).draggable();
	    $(video).parent().width(width);
	    $(video).parent().height(height);
	    
    //Set the duration to the duration of first video
	    if ($(video).data("index") === 0)
	    {
		currentVideo.duration = this.duration;
		$( "#timeSlider" ).slider( "option", "max", currentVideo.duration);
		controls.videolength.html(currentVideo.duration + " s");
	    }
	});
    }
}


function getVideoDir()
{
    var dir = $("#videoDir").val().replace(/\\/g, "/");
    if (dir.charAt(dir.length-1) !== "/")
    {
	dir += '/';
    }
    
    return dir;
}



function saveData()
{
    var name = $("#subjectName").val();
    var dateTime = $("#subjectDate").val().split(" ");
    var filename = "";
    var header = "";

    if (dateTime.length === 2)
    {
	var date = dateTime[0];
	date = date.replace(/\//g, "");
	
	var time = dateTime[1];
	time = time.replace(/:/g, "");
	

	filename =  name + "_" + date + "_" + time + ".txt";

    }
    else
    {
	filename = name + ".txt";
    }
    
    if (projSettings.modifiers)
    {
	header = "Time Code Class\n";
    }
    else
    {
	header = "Time";
	for (var i=1; i <= projSettings.nClasses; i++)
	{
	    header += " Class" + i;
	}
	header += "\n"; 
    }
    
    var data = header + localStorage.results; 
    
    exportData(data, filename);
}


function openData()
{
    generator = window.open('', 'results', '');
    generator.document.body.innerHTML = "<pre>" + localStorage.results + "</pre>"; 
}


function writeresults()
{
    //Hack for chrome
    if (isChrome())
    {
	if (generator.document.body === null)
	{
	    setTimeout(writeresults(), 100);
	}
	else
	{
	generator.document.body.innerText = localStorage.results;
	}
    }
    //Firefox
    else
    {
	generator.document.write('<pre>' + localStorage.results + '</pre>');
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
	    controls.slider.slider( "option", "value", time);
	    controls.timeindicator.html(time);
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

function videoFwd()
{
    var amount = parseFloat($("#seekInput").val());
    videoarray.forEach(function(video){
	video.currentTime = video.currentTime + amount;
    });
}

function videoBack()
{
    var amount = parseFloat($("#seekInput").val());
    videoarray.forEach(function(video){
	video.currentTime = video.currentTime - amount;
    });
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


function videoSetTime(time)
{
    videoarray.forEach(function(video){
	video.currentTime = time;
    });
}

function setSpeed()
{
    videoarray.forEach(function(video){
	video.playbackRate = parseFloat(document.getElementById("speed").value);
    });
}

function setSize()
{
    var mult = document.getElementById("size").value;
    //video.width = video.videoWidth*mult;
    //video.height = video.videoHeight*mult;
    $("#videocontainer").width(video.videoWidth*mult);
    $("#videocontainer").height(video.videoHeight*mult);
}

function endCoding(){
    var time = videoCurrentTime();
    localStorage.results += time + " END\n";
    $("#currentCode").html("<strong>Time:</strong> " + time +  " <strong>Code: END </strong>");
    notification.info("Coding finished. Remember to save!")
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

function resizeVideo(e)
{
    var divWidth = $("#content").width() - $("#buttoncontainer").width() - 50;
    //console.log(divWidth);
    if (video.videoWidth > divWidth)
    {
	$("#video").width(divWidth);
    }
    
    //$("#video").width($("#content").width() - $("#buttoncontainer").width() - 50)
}


function isChrome()
{
 return navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
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
    //console.log($(this).html())
}

//Remove the last entered code
function undo()
{
    if (localStorage.results === "")
    {
	$("#currentCode").html("No codes");
	return;
    }
    
    console.log("Before undo\n", localStorage.results);
    //Split results to an array and remove two elements from the end
    //The last one is always empty string
    var x = localStorage.results.split('\n');
    var begin = x.length - 2;
    x.splice(begin, 2);
    
    if (x.length > 0) 
    {
	localStorage.results = x.join("\n") + "\n";
	var last = x.pop();
	//$("#currentCode").html(last);
	var time = last.split(" ")[0];
	var code = last.split(" ")[1];
	
	if (!useModifiers())
	{
	    $("#currentCode").html("<strong>Time:</strong> " + time + " <strong>Code: </strong>" + code + "<BR/>");
	    
	}
	else
	{
	    //Remove the time from last code
	    var Codes = last.split(" ");
	    Codes.shift();
	    $("#currentCode").html("<strong>Time:</strong> " + time + " <strong>Code: </strong>" +  Codes.join(" "));
	
	}


	
    }
    else
    {
	localStorage.results = "";
    }
    console.log("After\n", localStorage.results);
}

