/*jshint smarttabs:true, globalstrict:true */

//"use strict";

/*Shared functions in cowlog.shared.js
 occasionally need to which version we are using
 */
var ipc = require('ipc');
var fs = remote.require('fs');
var path = remote.require('path');

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

function continueVideo(showDialog)
{

    var cpath = null;
    //Function can be called from GUI (showDialog=true, or new subject)
    if (showDialog){
        cpath = dialog.showOpenDialog({properties : ["openFile"],
                                defaultPath : projSettings.dataDirectory + "/",
                                title : "Choose coding file to continue",
                                filters : [{name : "CowLog code file *.csv", extensions : ["csv"]}]
                            });
    } else {
        cpath = [currentSubject.file];
    }

    //Get metadata path
    var metafile = path.basename(cpath).replace(".csv", ".json");
    var meta_path = path.dirname(cpath) + "/metadata/" + metafile;

    //Read metadata
    currentSubject = JSON.parse(fs.readFileSync(meta_path, {encoding : "utf-8"}));
    //Just in case files a copied to a different path
    currentSubject.file = cpath[0];

    var rawdata = fs.readFileSync(cpath[0], {encoding : "utf-8"});
    var datarows = rawdata.split("\n");
    var row = null;

    currentSubject.results = [];
    var n = datarows.length
    for (var i=1; i < n-1; i++)
    {
        row = datarows[i].split(",");
        currentSubject.results.push({"time" : parseFloat(row[0]), "code" : row[1],
           "class" : row[2]});
    }


    ipc.send('openvideos', currentSubject.videos);

    //videoSetTime(last["time"]);
};


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
      dt = new Date(Date.parse(subject.datestring + "Z"));
    }
    console.log(dt);
    console.log(dt.toISOString());

    var spath = projSettings.dataDirectory;

    if (spath === null)
    {
        spath = dialog.showOpenDialog({
        properties : ['openDirectory'],
        title : "Choose output directory"
      });
    }

    //Date formatting
    var dstring = dt.toISOString();
    dstring = dstring.replace(/:/g ,"");
    dstring = dstring.replace("." ,"_");
    dstring = dstring.replace(/Z/g ,"");

    console.log(dstring);
    currentSubject.file = spath + "/" + currentSubject.name + "_" + dstring + ".csv";

    //Continue coding
    if (fs.existsSync(currentSubject.file))
    {
        //Continue existing session
        continueVideo(false);

        dialog.showMessageBox({
            title : "Continuing existing session",
            buttons : ["OK"],
            detail : "A data file for this subject and time already exists. Continuing session",
            type : "info"
        });
        return;
    }

    //Write metadata about session
    var metafile = spath + "/metadata/" + currentSubject.name + "_" + dstring + ".json";
    var metadir = spath + "/metadata/";

    if (!fs.existsSync(metadir))
    {
        fs.mkdirSync(metadir);
    }

    var meta = JSON.parse(JSON.stringify(currentSubject)); //Clone..
    delete meta["results"];
    var metadata = JSON.stringify(meta, null, " ");
    fs.writeFileSync(metafile, metadata);
});

//Receive video metadata
ipc.on("metadata", function(metadata){
    currentVideo.duration = metadata["duration"];
    $( "#timeSlider" ).slider( "option", "max", currentVideo.duration);
    controls.videolength.html(Math.round(currentVideo.duration) + " s");

    //Continue coding
    var n = currentSubject.results.length;
    if (n > 1)
    {
        var last = currentSubject.results[n-1];
        videoSetTime(last["time"]);
        $("#currentCode").html("<strong>Time:</strong> " +
            Math.round(last["time"]*100)/100 +
            " <strong>Code: </strong>" + last["code"] + "<BR/>");
    }
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
