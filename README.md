
# CowLog

[CowLog](http://cowlog.org) is a software for recording behaviors from digital video initially developed in the Research Center for Animal Welfare and Department of Agricultural Sciences in the University of Helsinki. It is currently maintained and developed in the [Natural Resources Institute Finland (Luke)](http://www.luke.fi/en) and as my personal free time project.

This repository contains the new desktop branch CowLog 3 of the software based on HTML5 and Javascript using  [Electron](http://electron.atom.io/).


The program uses the following frameworks and libraries:

* [WebChimera.js](https://github.com/RSATom/WebChimera.js)
* [jQuery](https://jquery.com/)
* [Bootstrap](http://getbootstrap.com/)

## Get the release

If you want to use CowLog for your research can download most recent [release](https://github.com/mpastell/CowLog/releases) binary for your platform.

## Run most recent version from this repository

If you want to use the most recent version from this repository e.g. for
contributing code you need to first  install [Electron](http://electron.atom.io/).
Then you can run the application using:

```
git clone https://github.com/mpastell/CowLog.git
cd CowLog
electron CowLog
```

You will need to add compiled [WebChimera.js](https://github.com/RSATom/WebChimera.js)
to `node_modules` to use VLC support.

If you want to modify the source I suggest you read the Electron documentation first.

## Tools

The following tools are used to build the release binaries:

* [electron-packager](https://github.com/maxogden/electron-packager) to make binary build for all platforms.
* [node-appdmg](https://github.com/LinusU/node-appdmg) to package OS X release.
* [Inno Setup](http://www.jrsoftware.org/isinfo.php) to make windows installer.
