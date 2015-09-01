//Create menu runs in index.html
var remote = require('remote');
var Menu = remote.require('menu');
var dialog = remote.require('dialog');
var fs = remote.require('fs');
var ipc = require('ipc');

var template = [
  {
    label : 'Project',
    submenu :[
      {
        label : "Load project",
        click : function(){ipc.send('load-settings', '');}
      },
      {
        label : "New project",
        click : function(){
          ipc.send('show', 'prefs');}
      },
      {
          label : "Edit project",
          click : function(){
            ipc.send('edit-settings', '');}
      }]
    },{
      label : 'Help',
      submenu : [
        {
          label : "About CowLog",
          click : function(){ipc.send('show', 'about');}
        },
        {
          label : "Documentation",
          click : function(){ipc.send('show', 'help');}
        }
      ]
  }
];

menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
