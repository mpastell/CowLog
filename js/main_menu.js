var remote = require('remote');
var Menu = remote.require('menu');

var template = [
  {
    label : 'Project',
    submenu :[
      {
        label : "Load project",
        click : function(){$("#loadProject").dialog("open")}
      },
      {
        label : "New project",
        click : function(){$("#projectprefs").dialog("open")}
      }]
  }
]

menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
