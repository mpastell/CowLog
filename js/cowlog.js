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

    cow.setDefaults();

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
    //$("a.toggleParagraph").click(toggleParagraph);
});

//New subject dialog
function openVideo(evt){
    //currentVideo,started = false;
    ipc.send('show', 'subject'); //Open dialog
    $("button").removeClass("active");
    $("#currentCode").html("");
}

ipc.on('current-subject', function(subject)
{
    //console.log(subject);
    currentSubject = subject;
    currentSubject.results = [];

    var dt = null;

    if (isNaN(Date.parse(subject.datestring)))
    {
      dt = new Date();
    }
    else {
      dt = new Date(Date.parse(subject.datestring));
    }
    console.log(dt);
    console.log(dt.toISOString());

    var path = projSettings.dataDirectory;

    if (path === null)
    {
        path = dialog.showOpenDialog({
        properties : ['openDirectory'],
        title : "Choose output directory"
      });
    }

    currentSubject.file = path + "/" +
    currentSubject.name + "_" + dt.toISOString() +
    ".csv"
});

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

function resizeDivs()
{
    $("#right").width($("#content").width() - $("#buttoncontainer").width()-2);
    $("#right").height(window.innerHeight - $("#header").height() -
    $("#prefnav").height() - 50);
    $("#startUp").hide();
    //$("body").css("background-color", "white");

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
