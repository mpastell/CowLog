/*jshint smarttabs:true, globalstrict:true */

//"use strict";

//Cow is container for global properties and data
var cow = {};

//Default settings to obtain basic functionality when
//there is not user configuratioran
cow.setDefaults = function()
{
    projSettings = 
    {
	name : "CowLog Default",
	videoDirectory : "",
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
	date : null,
	project : null,
	videos : []
    }




var projSettings = null; //An object that contains the settings of current project

function code(sender){
    var code = sender.innerHTML;
    //The time is different for video and live versions
    var time = (cow.videoVersion)?videoCurrentTime():new Date().toISOString();
    //Display short version of time : live version
    var prettyTime = (cow.videoVersion)?time:time.split("T")[1].split(".")[0];

    //Get the column of sender
    var colIndex = $(sender).parents("tr").find("td").index($(sender).parent());
    //console.log(colIndex)
    var tdIndex = colIndex + 1;
    //console.log(tdIndex);
    
    //If there are no modifiers write to results
    if (!projSettings.modifiers)
    {
	localStorage.results += time + " " + code +
	    " " + tdIndex +   "\r\n";
	$("#currentCode").html("<strong>Time:</strong> " + prettyTime + " <strong>Code: </strong>" + code + "<BR/>");
    }
    else
    {
	//Check if current code has modifiers
	if (projSettings.modifiedCodes.indexOf(code) > -1)
	{
	    //pause until a code with no modifier is hit
	    (cow.videoVersion)?videoPause():cow.modifiedTime = time;
	    cow.currentCodes[colIndex] = code;
	    $(sender).siblings().attr("disabled", "disabled");
	    $(sender).attr("disabled", "disabled");
	    //console.log("Bloody modifiers!");
	}
	else
	{
	    //Play the video version and get the time of 
            //first code in mod sequence live version
	    (cow.videoVersion)?videoPlay():false;
	    time = (cow.videoVersion)?time:cow.modifiedTime;
	    prettyTime = (cow.videoVersion)?time:time.split("T")[1].split(".")[0];
	    
	    cow.currentCodes[colIndex] = code;
	    //Remove extra indices from currentCodes
	    cow.currentCodes = cow.currentCodes.slice(0, tdIndex);
	    //remove active class from other cols
	    //$("button.codeButton").removeClass("active");
	    
	    
	    //console.log("No modifiers!");
	    console.log(cow.currentCodes.join(" "));
	    localStorage.results +=  time + " " + cow.currentCodes.join(" ") + "\r\n";
	    $("#currentCode").html("<strong>Time:</strong> " + prettyTime + " <strong>Code: </strong>" +  cow.currentCodes.join(" "));

	    $("button.codeButton").removeAttr("disabled");
	}
    }

    $(sender).siblings().removeClass("active");
    $(sender).addClass("active");    
}




//Shared javascript for CowLog web and mobile apps
function loadSettings()
{
    var project = $("#storedProjects").val();
    var config = localStorage.getObject(project);
    projSettings = config;
    $("#projName").val(config.name);
    $("#Author").val(config.author);
    $("#email").val(config.email);
    $("#videoDir").val(config.videoDirectory);
    $("#nClasses").val(config.nClasses);
    $("#player").val(config.player);

    if (config.modifiers)
    {
	$("#useModifiers").attr("checked", "checked");
	//modifierArray = config.modifiedCodes;
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
    
    
    localStorage.projectLoaded = true;
    //Disabling settings onload causes problems with Live version
    (cow.videoVersion)?setTimeout(disableSettings, 200):null;

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
    
    localStorage.lastProject = projSettings.name;
    notification.success("Project " + projSettings.name  + " loaded");
    
}

//Read project settings from file
function loadSettingsFile(evt)
{
    var files = evt.target.files;
    input = new FileReader();
    input.readAsText(files[0]);
    input.onload =  LoadEvent;
    //alert(files[0].name);
}

//Settings read event
function LoadEvent(e)
{
    var text = input.result;
    //console.log(text);
    var projSettings = JSON.parse(text);
    //Save to localstorage
    localStorage.setObject("savedProject_" + projSettings.name, projSettings);
    //Update project selector
    getStoredProjects();
    //Set to imported and load it
    $("#storedProjects").val("savedProject_" + projSettings.name);
    loadSettings();
}


//Get loadable projects from 
function getStoredProjects()
{
    var stored = localStorage;
    var projects = [];
    for (var key in stored)
    {
	if (key.match("savedProject_") !== null && key !== "savedProject_")
	{
	    projects.push(key);
	}
    }
    
    if (projects.length === 0)
    {
	//$("#LoadSettings").append("<em>No saved projects</em>");
    }
    else
    {
	var phtml = projects.map(function(x){return "<option value='" + 
					 x +
					"'>" + 
					x.replace('savedProject_', '') + 
					     "</option>";	
					    });	
	$("#storedProjects").html(phtml.join(''));

	
    }
}

//Make an array of buttons
function codes2buttons(codes)
{
    var buttons = codes.map(function(x){return "<button onclick='code(this)' class='codeButton'>" + x + "</button><BR/>";
				       });
    return buttons.join('');
}

//Set end get objects to localstorage 
// http://stackoverflow.com/questions/2010892/storing-objects-in-html5-localstorage
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

function useModifiers()
{
    return($("#useModifiers").attr("checked") === "checked");
}

//Save settings to file using php script on server
function saveSettings()
{
    storeSettings();
    
    if (cow.videoVersion)
    {
	//Save setting as text
	if (navigator.onLine)
	{
	    exportData(JSON.stringify(projSettings, null, " "), projSettings.name + '_CowLogSettings.json');
	}
	else
	{
	    var v = window.open('', 'config', '');
	    v.document.write("<pre>" + JSON.stringify(projSettings, null, " ")  + "</pre>");
	}
	
	$("#projectprefs").dialog("close");
    }
   
    notification.success("Project " + projSettings.name  + " saved succesfully.");
}

//Open settings JSON in new window
function openSettings()
{
    //var projSettings = 
    storeSettings();
    
    var v = window.open('', 'config', '');
    v.document.write("<pre>" + JSON.stringify(projSettings, null, " ")  + "</pre>");
}

//Save classes from code and create buttons
function storeSettings()
{
    var csvArray = $("#classInputs  input").map(function(){
	return this.value;
    }).toArray();
    var codeArray = csvArray.map(function(x){return x.split(',');});
    var modifierArray = null;
    var modifiers = useModifiers();
    var keyCodes = getKeyCodes();
    
    if (modifiers)
    {
	modifierArray = $("#modifiedClasses").val().split(',');
    }
    
    //Clear buttons
    //$("#buttonrow").html("")
    //Add new buttons
    //buttonHTML = codeArray.map(function(x){return codes2buttons(x)});
    //$("#buttonrow").html("<td>" +  buttonHTML.join('</td><td>') + "</td>");
    //setTimeout("resizePrefs()", 100)

    
   //Save setting to localStorage
    projSettings = 
	{
	    name : $("#projName").val(),
	    videoDirectory : $("#videoDir").val(),
	    author : $("#Author").val(),
	    email : $("#email").val(),
	    nClasses : parseInt($("#nClasses").val()),
	    modifiers : modifiers,
	    codes : csvArray,
	    keyCodes : keyCodes,
	    modifiedCodes : modifierArray,
	    player : $("#player").val()
	};
    
    localStorage.setObject("savedProject_" + projSettings.name, projSettings);
    localStorage.lastProject = projSettings.name;
    localStorage.projectLoaded = true;
    
    //Make buttons for coding
    makeButtons();
    //Bind shortcut keys
    (cow.videoVersion)?bindKeys():null;
    getStoredProjects();
    disableSettings();
    //return(projSettings);
}



function disableSettings()
{
    //Disable options
    $("#projectprefs input").attr('disabled', 'disabled');
    $("#player").attr('disabled', 'disabled');
    
    //Re-enable loading
    $("#LoadSettings").children().removeAttr('disabled');

    //$("#classInputs > input").attr('disabled', 'disabled');
    //$("#Inputs > input").attr('disabled', 'disabled');
    //$("#Inputs > input").attr('disabled', 'disabled');
    //$("#modifierInputs > input").attr('disabled', 'disabled');
}

function enableSettings()
{
    $("#projectprefs input").removeAttr('disabled');
    $("#projectprefs select").removeAttr('disabled');
    //$("#classInputs > input").removeAttr('disabled');
    //$("#modifierInputs > input").removeAttr('disabled');
}

function clearSettings()
{
    enableSettings();
    $("#projectprefs input").val("");
    $("#classInputs").html("");
    $("#projectprefs > select").removeAttr('disabled');
    $("#modifierInputs").html("");
    $("#keyInputs").html("");
    $("#prefButtons").html("");
}


//Add buttons to UI based on project configuration
function makeButtons()
{
    var csvArray = $("#classInputs input").map(function(){
	return this.value;
    }).toArray();
    var codeArray = csvArray.map(function(x){
	return x.split(',');
    });
    
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

function getKeyCodes()
{
    return $("#keyInputs input").map(function(){
	return this.value;
    }).toArray();
}

function addCodeFields(classNo){
    var n = parseInt($("#classNo").val());
    var html = "";
    for (i=1; i<=n; i++)
    {
	html += "Code" +  i + " name: <input type='text'><br/>" ;
    }
    
    html += "<button onclick='saveCodes()'>Save</button>";

    $("#addCodes").html(html);
}

function saveCodes()
{
    var inputs = $("#addCodes > input");
    codes = [];
    var select = "</BR><select>";
    var buttons = "";

    for (i = 0; i < inputs.length; i++)
    {
	codes[i] = inputs[i].value;
	select += "<option value='" + codes[i] + "'>" + codes[i] + "</option>";
	buttons += "<button onclick='code(this)'>" +  codes[i] + " </button><BR/>";
    }
    
    select += "</select></BR>";
    $("#codelabel").before(select);
    $("#addCodes").html("");
    $("#buttonrow > td:first").html(buttons);
    $("#codelabel").html("Number of modifiers for code:");

}



function makeKeyInputs()
{
    $("#keyInputButton").hide();
    var allcodes = $("#classInputs  input").map(
	function(){
	    return this.value;}
    ).toArray().join().split(',');
    
    var codeHTML = "<p>Type in the keyboard shortcut for each \
behavior. (e.g. a, shift+a, alt+shift+k). If you want to use more than \
one modifier key (e.g. alt+ctrl+z) you should define them in  \
alphabetical order e.g. alt+ctrl+shift. It is advisable not to use \
keys that are already in use by the browser e.g. ctrl+f, ctrl+l, alt+f, alt+s.</p>\
<fieldset>";
    
    for (var i = 0; i < allcodes.length; i++)
    {
	codeHTML += "<label>" + allcodes[i] + "</label><input type='text' />";
    }
    codeHTML += "</fieldset>";

    $("#keyInputs").html(codeHTML);
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

function exportData(data, filename){
//Export results to text files
//http://stackoverflow.com/questions/921037/jquery-table-to-csv-export
    if (navigator.onLine)
    {
	
	$("body").append(
	    "<form id='exportform' \
action='export.php' method='post'> \
<input type='hidden' id='exportData' name='exportdata'/> \
<input type='hidden' id='exportFile' name='exportfile'/> \
</form>");
	
	$("#exportData").val(data);
	$("#exportFile").val(filename);
	$("#exportform").submit().remove();
    }
    else
    {
	alert("You seem to be offline, can't process request");

    }
}


//Notification messages, shown from actions
var notification = 
    {
	dialog : null,
	content : null,
	//Called onload
	init : function(){
	    this.dialog = $("#notification");
	    this.content = $(this.dialog).find("p");
	},

	message : function(newMessage, type){
	    //Move the position to scrollBottom in liveVersion
	    (cow.liveVersion)?this.dialog.css("top", $("body").scrollTop() + 100):null;
	    this.content.html(newMessage);
	    this.dialog.attr("class", type);
	    this.dialog.slideDown();
	    setTimeout(notification.hide, 2000);
	},

	hide : function(){notification.dialog.slideUp();},
	
	success : function(text){this.message(text, "success");},
	info : function(text){this.message(text, "info");},
	error : function(text){this.message(text, "error");},
	warning : function(text){this.message(text, "warning");},
    };


//Check if a variable exists in localStorage
//Firefox returns null and chrome undefined
function isDefined(key){
    return (typeof localStorage[key] !== "undefined" && localStorage[key] !== null)
}
