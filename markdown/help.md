% CowLog help
% Matti Pastell
% January 12, 2016

# Setting up a project

You can set up a project from the `Project`-menu. After
you have created a project you can load and edit it later.

You can choose the number of behavioral classes and
behaviors and set the names of the classes and set keyboard shortcuts
for coding.

You can also choose to use modifiers, in which case the video will pause
when a behavior with modifiers is selected. Modifier names are give as a
comma separated list to a text input box, they can be from any main
behavioral class.

The project output directory will be used to store the coded files.

# Coding and saving

Click the New subject button to open video(s)  and set
subject name and the date and time the video was recorded.
If you don't set a recording time, the start time of
coding session will be used.

You can also open multiple videos. There is no limit on the amount of
concurrently open videos and the actual number you can use depends
on the speed of your computer.

After you have finished coding remember to click the `End coding` button

**The result format depends on he selected configuration.**

If there are no modifiers the result format has three columns:

1.  Time. Seconds from beginning.
2.  Code. The behavioral code.
3.  Class. The class that the code belongs to.

If modifiers are used there are result format will be slightly
different: The first column will contain the time and the following
columns contains the behavioral codes followed by potential modifiers.

# Built-in keyboard shortcuts

CowLog has the following keyboard shortcuts, that can be used when the coding window has focus:

`Ctrl+P` toggle play/pause

<code><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span></code> Seek backward in video

<code><span class="glyphicon glyphicon-arrow-right" aria-hidden="true"></span></code> Seek forward in video


# Analysis

It is up to you to analyse your code. We usually use custom R scripts.
The `Animal`-package mentioned in our paper is not currently available
for this version of CowLog. I haven't had the time to maintain it.

# Video players and supported video formats

CowLog 3 can use HTML5-video player or [VLC](http://videolan.org) player to play the
videos. You can set the used player in the project preferences. VLC player is packaged
is Windows and OS X version, but you need to install it separately on Linux.

I recommend that you try both players in the start of the new project to see which
works better with your video codec.

**HTML5 player** supports the following formats:

* MP4 H.264
* WebM
* Ogg Theora Vorbis

See [https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats](https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats) for
more info.

**VLC player** supported formats are listed on VLC website:
[http://www.videolan.org/vlc/features.php?cat=video](http://www.videolan.org/vlc/features.php?cat=video).
If you can play your video using the VLC player it should work with CowLog.

# Converting videos to suitable codecs

If your codec does not work well (this most often occurs with .wmv files)
you can use e.g. one the following programs to convert video to compatible
format:

-   [Handbrake](http://handbrake.fr/) convert to MP4 for Chrome.
-   [MiroVideoConverter](http://www.mirovideoconverter.com/) convert to
    MP4 (Chrome), and Ogg or VP8 for Chrome of Firefox.
-   [ffmpeg2theora](http://v2v.cc/~j/ffmpeg2theora/) convert to Ogg for
    Chrome or Firefox.

# Citing CowLog

**Citation:** Hänninen, L. & Pastell, M. 2009. CowLog: Open source
software for coding behaviors from digital video. Behavior Research
Methods. 41(2), 472-476.

# License
This software is licensed under the GNU GPL v2 license.

# Bug reports

Report bugs on Github
[https://github.com/mpastell/CowLog](https://github.com/mpastell/CowLog) or via
e-mail.

# Development
This version of CowLog is developed using HTML5 and Javascript using the
[Electron](http://electron.atom.io/) framework.

The program uses the following components:

* [WebChimera.js](https://github.com/RSATom/WebChimera.js)
* [jQuery](https://jquery.com/)
* [Bootstrap](http://getbootstrap.com/)
* [VLC player](http://videolan.org)

The development is hosted on Github
[https://github.com/mpastell/CowLog](https://github.com/mpastell/CowLog)
Contributors are welcome!
