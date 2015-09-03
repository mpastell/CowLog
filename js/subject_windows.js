var ipc = require('ipc');
var remote = require('remote');
var dialog = remote.require('dialog');

var files = [];

function chooseVideo(){
  files =  dialog.showOpenDialog(
    {title : "Choose video(s)",
    properties: [ 'openFile', 'multiSelections' ],
    filters :
    [{name : "Video files", extensions : ["mkv", "avi", "mp4", "m4v", "ogg", "ogv"]},
    {name : "All files", extensions : ["*"]}]
    });
    //console.log(files)
    $("#videos").html("<h5>Selected:</h5>" + files.join("<br/>"));

    $("#openButton").html('<button onclick="openVideo()" class="btn btn-default">' +
      '<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Start coding</button>');
}

//Get videofiles from dialog send to video window
function openVideo()
{
    var currentSubject = {};

    currentSubject.videos = files;
    currentSubject.name = $("#subjectName").val();
    currentSubject.datestring = $("#subjectDate").val();

    console.log(currentSubject);

    ipc.send('current-subject', currentSubject);
    ipc.send('openvideos', files);
    ipc.send('hide-window', 'subject')
}

$(document).ready(function(){
  $("#subjectDate").datetimepicker({
      timeFormat : 'hh:mm:ss',
      showSecond : true
    });
});
