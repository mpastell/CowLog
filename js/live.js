
/*Shared functions in cowlog.shared.js 
  occasionally need to which version we are using
*/
cow.videoVersion = false;
cow.liveVersion = true;
    
var buttonColCount = 3 ;
var buttonRowCount = 10

var VideoCowlog = false;
var LiveCowlog = true;
var modifierArray = [];

$(document).ready(function() {
    //Hide some stuff
    $("div.notification").hide();
    $("#projectButtons").hide();

    notification.init();
    
    resizeButtons();
    window.onresize = resizeButtons;
    getStoredProjects();

    if (typeof(localStorage.lastProject) !== "undefined" && localStorage.lastProject !== null)
    {
	if (localStorage.lastProject.length > 0)
	{
	    $("#storedProjects").val("savedProject_" + localStorage.lastProject);
	    loadSettings();
	}
	else
	{
	    localStorage.projectLoaded = "false";
	}
    }
    else
    {
	localStorage.projectLoaded = "false";
    }
    
    //Notify user of appcache updates
    window.applicationCache.addEventListener('updateready', function(e) {
	if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
	    notification.info("There is a new version of CowLog live available, refresh the application to update.")}});
	    
});

function stop()
{
    var time = new Date().toISOString();
    localStorage.results += time + " END\n";
    //$("#stopSpan").hide();
    $("#sendSpan").show();
}

function resizeButtons()
{
    var buttonSpace = window.innerHeight - $("#codeHeader").height();
    $("td button").height(buttonSpace/(buttonRowCount*1.13));
    var width = (100/buttonColCount);
    $("td").css("width",  width + "%");
   // $("td button").width(window.innerWidth/(buttonColCount + 0.4));
    //$(".buttons").height(window.innerHeight - $("#controlNav").height() - $("#code").height());
}

function start()
{
    localStorage.results = "";
    $("#startSpan").hide();
    $("#sendSpan").hide();
    $("#stopSpan").show();
    $("div.notification").hide();

    buttonColCount = $("#buttonrow td").toArray().length;
    if (projSettings != null)
    {
	var counts = projSettings.codes.map(function(x){return x.split(',').length});
	buttonRowCount = Math.max.apply(null, counts);
    }
    else
    {
	buttonRowCount = 10;
    }
    
    resizeButtons();
}

function discardResults()
{
    $("#startSpan").show().trigger("create");
}


//Form version of mailing
//     if (navigator.onLine)
//     {
	
// 	$("body").append(
// 	    "<form id='exportform' \
// action='maildata.php' method='post' target='_blank'> \
// <input type='hidden' id='email' name='email'/> \
// <input type='hidden' id='subject' name='subject'/> \
// <input type='hidden' id='message' name='message'/> \
// </form>");
	
// 	$("#email").val($("#address").val());
// 	$("#subject").val("CowLog coding data");
// 	$("#message").val(localStorage.results);
// 	$("#exportform").submit().remove();
//     }
//     else
//     {
// 	alert("You seem to be offline, can't process request");

//     }
  





function toggleBlock(id)
{   
    var div = document.getElementById(id);
    
    //Get the state of desired DIV
    var state = div.style.display;

    //Hide the whole prefs class
    //$(".prefs").hide()
    //Try to set smart width
    //$(".prefs").width($("#content").width() - $("#buttoncontainer").width() - 100)


    //Show the desired div if it was hidden
    if (state == "block")
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



//Make input boxes for classes
function classBoxes()
{
    var n = parseInt($("#nClasses").val());
    var boxHtml = "<h3>Type in behaviors in each class as comma separated list</h3><fieldset>";
    
    for (i=1; i<=n; i++)
    {
	boxHtml += "<div><label>Class" + i
	    + "</label><input type='text'/></div>";
    }
    
    //If modifiers are used
    if (useModifiers())
    {
	var modHtml = " <h3>Type in behaviors with modifiers as comma separated list</h3><fieldset><div class='row'>";
	modHtml += "<label>Behaviors</label><input type='text'id='modifiedClasses'></div></fieldset>" ;
	$("#modifierInputs").html(modHtml).trigger("create");

    }

    boxHtml += "</fieldset>"
    $("#classInputs").html(boxHtml).trigger("create");
    
    //    boxHtml += "<p><button onclick='makeKeyInputs()'>Add keyboard shortcuts</button></p>"
    //    boxHtml += "<div id='keyInputs'></div>"

    $("#projectButtons").show();
}


function sendResults()
{
    to = projSettings.email;
    subject = encodeURI('CowLog results for ') + $("#subject").val(); 
    body = localStorage.results;
    sendMail(to, subject, body);
}

function mailSettings()
{
    storeSettings();
    to = projSettings.email;
    subject = "CowLog project: " + projSettings.name;
    body = JSON.stringify(projSettings, null, 2);
    sendMail(to, subject, body);
}



function sendMail(toAddress, subject, body)
{
    if (toAddress.search("@") === -1)
    {
	notification.error('Give valid e-mail address in "Project settings" first.');
	return false;
    }
    
    if (!navigator.onLine)
    {
	var sMailTo = "mailto:"  + toAddress;
	sMailTo += "?subject=" + subject;
	sMailTo += "&body=" + encodeURI(body);
	window.location.href = sMailTo;
    }
    else
    {
	var sender =new XMLHttpRequest();
	sender.open("POST","maildata.php",false);
	sender.setRequestHeader("Content-type",
				"application/x-www-form-urlencoded");
	var message = "email=" + toAddress;
	message += "&subject=" + subject;
	message += "&message=" + body;
	sender.send(message);
	
	if (sender.status==200)
	{
	    notification.success("Mail sent succesfully to " + toAddress);
	    //$("#sendStatus").show().html("Results succesfully mailed to: " + toAddress);
	    //$("#startSpan").show();
	    //$("#sendSpan").hide().slideUp("slow");
	    
	}
	else
	{
	    var sMailTo = "mailto:"  + toAddress;
	    sMailTo += "?subject=" + subject;
	    sMailTo += "&body=" + encodeURI(body);
	    window.location.href = sMailTo;

	    //$('<a href="' + sMailTo + '">click</a>').appendTo('body').click().remove();
	    //$("#sendStatus").html("Unable to send results, check your internet connection and try again");
	}
    }
	
	//console.log(sender.status);

    //
    //
}

//Check if a project has been defined and you can start coding
function checkforProject()
{
    
    if (localStorage.projectLoaded === "false")
    {
	$("#configButton").show().trigger("create");
	$("#startButton").addClass("ui-disabled");
    }
    else
    {
	$("#configButton").hide();
	$("#startButton").removeClass("ui-disabled");
    }
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
    x = localStorage.results.split('\n');
    var begin = x.length - 2;
    x.splice(begin, 2);
    
    if (x.length > 0) 
    {
	localStorage.results = x.join("\n") + "\n";
	var last = x.pop();
	//$("#currentCode").html(last);
	var time = last.split(" ")[0];
	var code = last.split(" ")[1];
	$("#currentCode").html(time.split("T")[1].split(".")[0] + " " + code);
    }
    else
    {
	localStorage.results = "";
    }
    console.log("After\n", localStorage.results);
}


//Dummy functions to keep compatibility with desktop version
function resizePrefs(){};
function resizeVideo(){};


