var ipc = require('ipc');
var remote = require('remote');
var dialog = remote.require('dialog');
var fs = remote.require('fs');

var projSettings = null;

function useModifiers()
{
    return($("#useModifiers").attr("checked") === "checked");
}

//Make input boxes for classes
function classBoxes()
{
    var n = parseInt($("#nClasses").val());
    var boxHtml = "<h4>Type in behaviors in each class as comma separated list</h4><div class='form-group'>";
    var modHtml = "";

    for (var i=1; i<=n; i++)
    {
        boxHtml += "<label>Class" +  i + "</label><input class='form-control' type='text'/>";
    }

    //If modifiers are used
    if (useModifiers())
    {
        modHtml = "<h4>Type in behaviors with modifiers as comma separated list</h4>";
        modHtml += "<label>Behaviors with modifiers:</label>" +
        "<input type='text' class='form-control' id='modifiedClasses' /></fieldset>";
    }

    $("#modifierInputs").html(modHtml);

    var buttonHtml = "<p><button class='btn btn-default' onclick='makeKeyInputs()' id='keyInputButton'>Add keyboard shortcuts</button></p>";

    buttonHtml += "</fieldset><button class='btn btn-default btn-success btn-block' \
     onclick='saveSettings()'>\
      <span class='glyphicon glyphicon-save' aria-hidden='true'></span> \
     Save settings</button>";

    $("#classInputs").html(boxHtml);
    $("#prefButtons").html(buttonHtml);
}

//Add input for shortcut keys
function makeKeyInputs()
{
    $("#keyInputButton").hide();
    var allcodes = $("#classInputs  input").map(
	function(){
	    return this.value;}
    ).toArray().join().split(',');

    var codeHTML = "<h4>Define keyboard shortcuts</h4> <p>Type in the keyboard shortcut for each \
behavior. (e.g. a, shift+a, alt+shift+k). If you want to use more than \
one modifier key (e.g. alt+ctrl+z) you should define them in  \
alphabetical order e.g. alt+ctrl+shift.</p> <p>It is advisable not to use \
keys that are already in use by the browser e.g. ctrl+f, ctrl+l, alt+f, alt+s.</p>\
<div class='form-group'>";

    for (var i = 0; i < allcodes.length; i++)
    {
	codeHTML += "<label>" + allcodes[i] + "</label><input class='form-control' type='text' />";
    }
    codeHTML += "</div>";

    $("#keyInputs").html(codeHTML);
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

//Save settings to file using
function saveSettings()
{
    //Place settings to global "projSettings"
    storeSettings();
    var dname = projSettings.name + "_cowlog_project.json"
    var path = dialog.showSaveDialog({title : "Save project settings",
     defaultPath : dname,
     filters :
      [{name : "CowLog project *.json", extensions : ["json"]}]
    });

    var data = JSON.stringify(projSettings, null, " ");
    fs.writeFileSync(path, data);
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

   //Read settings from form
    projSettings =
	  {
	    name : $("#projName").val(),
	    //videoDirectory : $("#videoDir").val(), //Not used, could be added back
        dataDirectory : $("#dataDir").val(),
	    author : $("#Author").val(),
	    email : $("#email").val(),
        videoplayer : $('input[name=playerRadio]:checked').val(),
	    nClasses : parseInt($("#nClasses").val()),
	    modifiers : modifiers,
	    codes : csvArray,
        codeArray : codeArray,
	    keyCodes : keyCodes,
	    modifiedCodes : modifierArray,
	    player : $("#player").val()
	  };
    //Make buttons for coding

    ipc.send("project-settings", projSettings);
    //makeButtons();
    //Bind shortcut keys
    //bindKeys();
    ipc.send("hide-window", "prefs");
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

    html += "<button onclick='saveCodes()' class='btn btn-default'>Save</button>";

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

ipc.on("project-settings", function(settings)
{
    loadSettings(settings);
});

function loadSettings(config)
{
    projSettings = config;
    $("#projName").val(config.name);
    $("#Author").val(config.author);
    $("#email").val(config.email);
    $('input[name=playerRadio]').val([config.videoplayer]);
    //$("#videoDir").val(config.videoDirectory);
    $("#dataDir").val(config.dataDirectory);
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
	     $("#modifiedClasses").val(config.modifiedCodes.join(","));
    }

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
    }
}


function chooseDatadir()
{
  var path = dialog.showOpenDialog({
    properties : ['openDirectory'],
    title : "Choose output directory"
  });
  $("#dataDir").val(path);
}
