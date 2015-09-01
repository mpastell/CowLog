/*jshint smarttabs:true, globalstrict:true */

//"use strict";

//Cow is container for global properties and data
var cow = {};
var ipc = require('ipc');
var remote = require('remote');


//Default settings to obtain basic functionality when
//there is not user configuratioran
cow.setDefaults = function()
{
    projSettings =
    {
	name : "CowLog Default",
	videoDirectory : "",
  dataDirectory : null,
  author : "Matti Pastell",
	email : "",
	nClasses : 3,
	modifiers : false,
	codes: [
	    "1,2,3,4,5,6,7,8,9,10",
	    "11,12,13,14,15,16,17,18,19,20",
	    "21,22,23,24,25,26,27,28,29,30",
	],
	keyCodes : [],
	modifiedCodes : [],
	player: "html"
    }
}
//Keeping state of modifier buttons
cow.currentCodes = [];

//Info about current subject
var currentSubject =
    {
	name : null,
	datetime : null,
	project : null,
  results : [],
	videos : [],
  file : null
  }

var projSettings = null; //An object that contains the settings of current project
var lastSender = null; //Keep the last sender for receiving time from IPC

function code(sender)
{
  lastSender = sender;
  ipc.send("video", {cmd: "getTime"} );
}

ipc.on("time", function(time){
  onCode(time);
});

function onCode(time){
    sender = lastSender;

    var prettyTime = Math.round(time*100)/100;

    //Handle end of coding separately
    if (lastSender.id == "endSubject")
    {
      currentSubject.results.push({time : time, code : "END", "class" :0});
      $("#currentCode").html("<strong>Time:</strong> " +
        prettyTime + " <strong>Code: </strong>" + "END" + "<BR/>");
      writeCodes();
      return;
    }

    var code = sender.innerHTML;


    //Get the column of sender
    var colIndex = $(sender).parents("tr").find("td").index($(sender).parent());
    //console.log(colIndex)
    var tdIndex = colIndex + 1;
    //console.log(tdIndex);

    //If there are no modifiers write to results
    if (!projSettings.modifiers)
    {
       currentSubject.results.push({"time" : time, "code" : code,
          "class" : colIndex + 1})

	      $("#currentCode").html("<strong>Time:</strong> " +
        prettyTime + " <strong>Code: </strong>" + code + "<BR/>");
    }
    else
    {
	  //Check if current code has modifiers
	   if (projSettings.modifiedCodes.indexOf(code) > -1)
	    {
	    //pause until a code with no modifier is hit
	    videoPause();
	    cow.currentCodes[colIndex] = code;
	    $(sender).siblings().attr("disabled", "disabled");
	    $(sender).attr("disabled", "disabled");
	    //console.log("Has modifiers");
	}
	else
	{
	    //Play the video version and get the time of
      //first code in mod sequence live version
	    videoPlay();
	    prettyTime = Math.round(time*100)/100;

	    cow.currentCodes[colIndex] = code;
	    //Remove extra indices from currentCodes
	    cow.currentCodes = cow.currentCodes.slice(0, tdIndex);
	    //remove active class from other cols
	    //$("button.codeButton").removeClass("active");
	    //console.log("No modifiers!");
      code = cow.currentCodes.join(" ");
	    currentSubject.results.push({"time" : time, "code" : code})
	    $("#currentCode").html("<strong>Time:</strong> "
          + prettyTime + " <strong>Code: </strong>" +  code);

	    $("button.codeButton").removeAttr("disabled");
	  }
  }
  //Write to file
  writeCodes();

  $(sender).siblings().removeClass("btn-primary");
  $(sender).addClass("btn-primary");
}

function writeCodes()
{
  var datastr = "";
  var res = currentSubject.results;

  //Add header
  if (!projSettings.modifiers)
  {
    header = "time,code,class\n";
  }
  else
  {
    header = "time";
  	for (var i=1; i <= projSettings.nClasses; i++)
  	{
  	    header += ",class" + i;
  	}
  	header += "\n";
  }

  datastr += header;

  for (var i=0; i < res.length; i++)
  {
    datastr += res[i]["time"] + "," + res[i]["code"];
    if (!projSettings.modifiers)
    {
      datastr += "," + res[i]["class"];
    }
    datastr += "\n";
  }

  fs.writeFileSync(currentSubject.file, datastr);
}



//Restore project settings from loaded project
//projSettings object written in LoadEvent
function loadSettings()
{
    config = projSettings;
    $("#projName").val(config.name);
    $("#Author").val(config.author);
    $("#email").val(config.email);
    $("#videoDir").val(config.videoDirectory);
    $("#nClasses").val(config.nClasses);
    $("#player").val(config.player);

    if (config.modifiers)
    {
	     $("#useModifiers").attr("checked", "checked");
    }
    else
    {
	     $("#useModifiers").removeAttr("checked");
    }

    classBoxes();

    var inputs = $("#classInputs input");

    for (i = 0; i< config.nClasses; i++)
    {
	     inputs[i].value = config.codes[i];
    }

    if (config.modifiers)
    {
	     $("#modifiedClasses").val(modifierArray.join(","));
    }

    makeButtons();
    //If config has keyboard shortcuts defined
    if (config.keyCodes.length > 0)
    {
  	   //Make inputs
  	    makeKeyInputs();
  	    var keyInputs = $("#keyInputs input");
    	//Fill in the values
    	for (var i in keyInputs)
    	{
    	    keyInputs[i].value = projSettings.keyCodes[i];
    	}
    	//Make the bindings
  	   bindKeys();
    }
    notification.success("Project " + projSettings.name  + " loaded");
}

//Make an array of buttons
function codes2buttons(codes)
{
    var buttons = codes.map(function(x){return "<button onclick='code(this)' class='btn btn-block'>" + x + "</button>";
				       });
    return buttons.join('');
}



//Save settings to file using
function saveSettings()
{
    //Place settings to global "projSettings"
    storeSettings();
    var dname = projSettings.name + "_cowlog_project.json"
    var path = dialog.showSaveDialog({title : "Save project settings",
     defaultPath : dname,
     filters :
      [{name : ".json", extensions : [".json"]}]
    });

    var data = JSON.stringify(projSettings, null, " ");
    fs.writeFileSync(path, data);

    $("#projectprefs").dialog("close");
    notification.success("Project " + projSettings.name  + " saved succesfully.");
}

//Receive project settings from preds_window
ipc.on("project-settings", function(settings)
{
    projSettings = settings;
    //Make buttons for coding
    makeButtons();
    //Bind shortcut keys
    bindKeys();
});

//Add buttons to UI based on project configuration
function makeButtons()
{

    var codeArray = projSettings.codeArray;

    //Clear buttons
    $("#buttonrow").html("");
    //Add new buttons
    var buttonHTML = codeArray.map(function(x){
	     return codes2buttons(x);
    });

    $("#buttonrow").html("<td>" +  buttonHTML.join('</td><td>') + "</td>");

    if (cow.videoVersion)
    {
  	var widths = $("#buttonrow button").map(function(){
  	    return this.clientWidth;
  	}).toArray();
	 var maxWidth = Math.max.apply(null, widths);
	 $("button.codeButton").width(maxWidth);
  }
}

function bindKeys()
{
  var n = projSettings.keyCodes.length;
  //If we have some keys to bind...
  if (n > 0)
  {
	//Put behaviors to one array
	var codes = projSettings.codes.join().split(',');
	var keys = projSettings.keyCodes;

  	for (var i =0; i < n; i++)
  	{
      if (keys[i] !== "")
      {
  	      bindButton(keys[i], codes[i]);
  	      console.log("Bound " + keys[i] + " to " + codes[i]);
      }
  	}

  }
}

//Bind a coding button to a key
function bindButton(keys, content)
{
    //Find an element with specified content
    var bButton = $('#buttonrow button').filter(function(){return($(this).html() == content)});
    $(document).bind('keydown', keys, function(){bButton.click()});
}
