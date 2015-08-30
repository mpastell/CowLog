//An object to interface VLC plugin with HTML5 compatible commands

//video is the ID of VLC player plugin
function Vlc(video)
{
    this.video = video;
    this.playing = false;

    this.play = function()
    {
	//Simple play command always starts from beginning...
	if (!this.playing)
	{
	    this.playing = true;
	    this.video.playlist.play();
	}
	else
	{
	    //If the video is paused then toggle
	    if (this.video.input.state == 4)
	    {
		this.video.playlist.togglePause();
	    }
	}
    }

    this.pause = function()
    {
	//If the video is already paused don't toggle
	if (this.video.input.state != 4)
	    {
		this.video.playlist.togglePause();
	    }
    }
    
    this.stop = function()
    {
	if (this.video.input.state != 4)
	{
	    this.video.playlist.togglePause();
	}
	this.video.input.time = 0;
    }

    //http://stackoverflow.com/questions/5222209/getter-setter-in-constructor
    Object.defineProperties(this, {
        "currentTime": {
            "get": function() {return this.video.input.time/1000},
            "set": function(x) {this.video.input.time = x*1000}
        }})

    Object.defineProperties(this, {
        "playbackRate": {
            "get": function() {return this.video.input.rate},
            "set": function(x) {this.video.input.rate = x}
        }})

    Object.defineProperties(this, {
        "width": {
            "get": function() {return this.video.width},
            "set": function(x) {this.video.width = x}
        }})

    Object.defineProperties(this, {
        "height": {
            "get": function() {return this.video.height},
            "set": function(x) {this.video.height = x}
        }})
    
    Object.defineProperties(this, {
        "videoWidth": {
            "get": function() {return this.video.video.width}
        }})

    Object.defineProperties(this, {
        "videoHeight": {
            "get": function() {return this.video.video.height}
        }})

    Object.defineProperties(this, {
        "paused": {
            "get": function() {return (this.video.input.state === 4)}
        }})

    
    
    
    
    //get x(){return "hello!"}
    

    //this.currentTime = function()
    //{
    //	this.video.input.time / 1000;
    //  }

    
}

