var ipc = require('ipc');
var remote = require('remote');
var dialog = remote.require('dialog');

var files = [];

function chooseVideo(){
  files =  dialog.showOpenDialog(
    {title : "Choose video(s)",
    properties: [ 'openFile', 'multiSelections' ],
    filters :
    [{name : "Video files", extensions : ["mkv", "avi", "mp4", "ogg", "ogv"]},
    {name : "All files", extensions : ["*"]}]
    });
    console.log(files)
}

//Get videofiles from dialog send to video window
function openVideo()
{
    var currentSubject = {};

    currentSubject.videos = files;
    currentSubject.name = $("#subjectName").val();
    currentSubject.datestring = $("#subjectDate").val();

    console.log(currentSubject);

    ipc.send('openvideos', files);
    ipc.send('current-subject', currentSubject);
}

$(document).ready(function(){
  $("#subjectDate").datetimepicker({
      timeFormat : 'hh:mm:ss',
      showSecond : true
    });
});
