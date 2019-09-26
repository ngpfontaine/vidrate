/*
BUGS
------

- Firefox, long video, "waiting" event fires right before ending, and doesn't fire "ended"
- if target fps is too high, timeline won't move fast enough. need speed as inverse var?
  ..if rAF fps is lowered by browser, [rate] should be increased
- rAF stops when switching tabs but vid does not
- 'onend event is slow, noticeably
- small hickup on timeline as video is finishing

*/

// Variables for video, time
function player(vid) {

  // vid parameter is a reference to Video.store[i]
  // ..which contains .data, .dom, .player (prototype of this function)

  var parent = this

  this.status = "pause", // Play/pause status container for each vid
  this.width = undefined,
  this.playing = false, // Flag instead of check vid status
  this.dragging = false, // Toggle to indicate if dragging time on timeline
  this.dur = undefined,
  this.time = {
    width: undefined, // Calc width, RAF uses. This is the width of the timeline bar during playback progression. grows from 0 to width of video
    widthPrep: undefined, // Calc width when click, but don't update b/c RAF uses vid.time.width
    fps: 40,
    rate: 0, // Frames to move every 60th of a sec
    now: undefined,
    inc: 0, // RAF incrementer to normalize time
    then: Date.now(),
    delta: undefined,
    interval: undefined,
    fakeToggle: true,
    timelineUpHandler: undefined, // hold event functions for mouse up, so we can remove
    timelineMoveHandler: undefined
  },

  // pass in vid index to return current time as percentage
  this.getCurrentPercent = function() {
    let v = vid.dom.video
    return v.currentTime / v.duration
  },

  this.getCurrentTime = function() {
    let v = vid.dom.video
    return v.currentTime
  },

  // Helper to cancel rAF on video end
  this.Kill = function() {
    parent.status = 'pause';
    parent.playing = false;
    vid.dom.tlBar.style.transform = 'translateX(0px)';
    vid.dom.btnPlay.innerHTML = '<i class="fa fa-play-circle"></i>'
    vid.dom.coverPlay.classList.add('show')
  },


  // Create locationTime & player.time.width, return in array
  this.CalcTimeLoc = function(clickX,offsetL,width) {
    var locationPercent = (clickX-offsetL)/width;
    var locationTime = locationPercent*vid.dom.video.duration;
    parent.time.width = locationPercent*parent.width;
    return [locationTime,parent.time.width];
  },

  // Create locationTime & player.time.width, return in array
  this.CalcTimeLocPrep = function(clickX,offsetL,width) {
    var locationPercent = (clickX-offsetL)/width;
    var locationTime = locationPercent*vid.dom.video.duration;
    parent.time.widthPrep = locationPercent*parent.width;
    return [locationTime,parent.time.widthPrep];
  },

  //
  // Toggle play/pause states
  //

  this.Toggle = function(stateOverride) {
    // (Note) issue here when pause, resize, play - timeline-bar jumps
    parent.time.rate = parent.width/parent.dur/parent.time.fps

    // Force pause w/ arg
    if (stateOverride === 'pause') {
      parent.status = 'pause'
      parent.playing = false
      vid.dom.coverPlay.classList.add('show')
      vid.dom.btnPlay.innerHTML = '<i class="fa fa-play"></i>'
      vid.dom.video.pause()
    }

    else if (stateOverride === "play") {
      parent.status = "play"
      parent.playing = true
      tBarProgress(true, vid)
      vid.dom.btnPlay.innerHTML = '<i class="fa fa-pause"></i>'
      vid.dom.coverPlay.classList.remove('show')
      vid.dom.video.play()
    }

    else if (stateOverride === "buffer") {
      parent.status = "buffer"
      parent.playing = true
      vid.dom.btnPlay.innerHTML = '<i class="fa spin fa-spinner"></i>'
      vid.dom.video.pause()
    }

    // Paused & not at end, play
    else if (!parent.playing && !vid.dom.video.ended) {
      parent.status = 'play'
      parent.playing = true
      tBarProgress(true, vid)
      vid.dom.btnPlay.innerHTML = '<i class="fa fa-pause"></i>'
      vid.dom.coverPlay.classList.remove('show')
      vid.dom.video.play()
    }

    // Ended, restart
    else if (vid.dom.video.ended) {
      parent.status = 'play'
      vid.dom.video.currentTime = 0
      parent.time.width = 0
      parent.playing = true
      vid.dom.coverPlay.classList.remove('show')
      vid.dom.video.play()
      tBarProgress(true, vid)
    }

    // Playing, pause
    else {
      parent.status = 'pause'
      parent.playing = false
      vid.dom.coverPlay.classList.add('show')
      vid.dom.btnPlay.innerHTML = '<i class="fa fa-play"></i>'
      vid.dom.video.pause()
    }

  },

  // Loop through videos on page
  // Get timeline width, and duration values
  // Add video load, ctrl, and ended events
  this.InitEventsAndData = function() {
    parent.status = null
    parent.width = vid.dom.timeline.clientWidth
    // Hide loading indicator when ready

    var btnVol = vid.dom.btnVol
    // Load each Video. this solves situation where cached video never triggers 'loadeddata' event
    vid.dom.video.load()

    parent.time.width = 0

    // Volume mute/unmute display
    vid.dom.video.muted ? btnVol.innerHTML = '<i class="fa fa-volume-off"></i>' : btnVol.innerHTML = '<i class="fa fa-volume-up"></i>'

    // Video controls events
    // (note) add touch event too
    vid.dom.btnPlay.addEventListener('click', function(e) {
      // if (!rating.rated && !rating.inProgress) {
      //   rating.Begin(index)
      // } else {
        parent.Toggle(undefined)
      // }
    })
    // Volume Toggle
    vid.dom.btnVol.addEventListener('click', function() {
      if (vid.dom.video.muted) {
        vid.dom.video.muted = false
        btnVol.innerHTML = '<i class="fa fa-volume-up"></i>'
      } else {
        vid.dom.video.muted = true
        btnVol.innerHTML = '<i class="fa fa-volume-off"></i>'
      }
    })
    // Re-play cover btn
    vid.dom.coverPlay.addEventListener('click', function() {
      parent.Toggle(undefined)
    })
    // On loaded event for each vid
    vid.dom.video.addEventListener('loadeddata', function() {
      if (this.readyState >= 2) {
        let seconds = this.duration % 60
        parent.dur = this.duration
        parent.time.rate = parent.width/parent.dur/parent.time.fps
        parent.playing = false
        parent.time.width = 0
        parent.time.widthPrep = undefined
        // Show vid-cover-play
        vid.dom.coverPlay.classList.add('show')
        // Hide loader
        vid.dom.coverLoading.classList.remove('show')
        // Show timeline
        vid.dom.tlHover.classList.add('show')
      }
    })
    // Kill on 'ended'
    vid.dom.video.addEventListener('ended', function() {
      console.log("ended")
      parent.Kill()
    })
    // Waiting event
    vid.dom.video.addEventListener("waiting", function() {
      console.log("waiting")
      parent.Toggle("buffer")
    })
    vid.dom.video.addEventListener("canplay", function() {
      // if (parent.time.now != undefined || parent.time.now > 0) {
      console.log("canplay")
      if (parent.status === "buffer") {
        parent.Toggle("play")
      }
    })

    // Ctrl - play/pause every vid
    vid.dom.video.addEventListener('click', function() {
      // if (rating.rated) {
        parent.Toggle(undefined)
      // }
    },false)
    
    // Move fake indicator on click, Timeline mouseup/mousedown
    var timeline = vid.dom.timeline
    timeline.addEventListener('mousedown', function(e) {
      tClickDownHandler(e, vid)
    }, false)

    // (note) want to add on window to cursor can exit timeline, but removing the event isn't working
    // timeline.addEventListener('mouseup', function(e) {
    //   tClickUpHandler(e, vid)
    // },false)

    // Preview Hover
    /*gui.vid.cont[index].getElementsByClassName('timeline')[0].addEventListener('mousemove',function(e) {
      var prev = gui.vid.cont[index].getElementsByClassName('timeline-preview')[0]
      let imgB = undefined
      let vid = gui.vid.cont[index]
      // let tl = gui.vid.cont[index].getElementsByClassName('timeline')[0]
      // let mouseTlLeft = e.clientX - tl.offsetLeft - vid.offsetLeft
      // let pct = mouseTlLeft / parent.width
      // let fTime = pct * parent.dur

      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      ctx.drawImage(vidI, 0, 0, prev.clientWidth, prev.clientHeight)
      // canvas.toBlob(function(blob) {
      //   var url = URL.createObjectURL(blob)
      //   prev.getElementsByTagName('img')[0].src = url
      // },'image/jpeg')
      prev.getElementsByTagName('img')[0].src = canvas.toDataURL('img/jpeg',0.1)
    })*/
      
  }

  this.time.interval = 1000/this.time.fps;

}

//
// On player/window resize
// change: player.width[..], player.time.rate[..]
//

var resizeTimer = undefined;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    console.log('resize');
    for (var i=0; i<Video.store.length; i++) {
      // (Note) this messes up current timeline, but is necessary for clicking timeline
      Video.store[i].player.width = Video.store[i].dom.timeline.clientWidth
      console.log(Video.store[i].player.time.width)
      let w = Video.store[i].player.getCurrentPercent(Video.store[i].player.playingIndex)
      Video.store[i].player.time.width = Video.store[i].player.width * w
      console.log(Video.store[i].player.time.width)
      // player.time.rate = player.width/player.dur/player.time.fps
    }
  }, 200);
});

//
// RAF Timeline animation - change bar width while play
// Also updates rating score marks
//

function tBarProgress(tF, vid) {
  // Cache index parameter when start, b/c on RAF loop it's undefined
  var timelineBar = vid.dom.tlBar;

  // Keep feeding inputs
  var rafID = requestAnimationFrame(function() {
    tBarProgress(tF, vid)
  })
  
  vid.player.time.now = Date.now();
  vid.player.time.delta = vid.player.time.now - vid.player.time.then;
  
  if (vid.player.time.delta > vid.player.time.interval) { 
    vid.player.time.then = vid.player.time.now - (vid.player.time.delta % vid.player.time.interval);
    
    // Animation
    if (vid.player.time.width <= vid.player.width) {
      // vid.player.time.rate = vid.dom.timeline.clientWidth/vid.player.dur/vid.player.time.fps
      // console.log(vid.player.time.rate)

      //player.time.width += calcRate; // Based on current FPS
      vid.player.time.width += vid.player.time.rate // Based on set FPS
      // vid.player.time.width += (vid.player.time.delta/vid.player.time.width)
      // console.log(vid.player.time.width)
      
      // Move Bar
      // let drawX = (vid.player.width-vid.player.time.width) / vid.player.width * 100
      let dX = (vid.dom.video.currentTime/vid.player.dur) * 100
      timelineBar.style.transform = 'translateX(-' + (100-dX) + '%)';

      // Draw horizontal rating line & indicator if rating running
      if (vid.rating.rated === false) {

        let ts = vid.player.getCurrentPercent(vid.player.playingIndex)
        let x = vid.player.time.width / vid.player.width * 100
        let y = 100 - ((vid.rating.scoreNow-1)/(vid.rating.scoreMax-1)*100)

        gui.vid.timelineMarkUpdate.setAttribute('x2', dX + '%')
        gui.vid.timelineMarkUpdate.setAttribute('y2', y + '%')
        gui.vid.timelineMarkIndicator.style.top = y + '%'
        gui.vid.timelineMarkIndicator.style.left = dX + '%';

        // (Note) probably shouldn't look this up constantly
        let pPage = gui.vid.timelineMarkPolygon.getAttribute('points')
        pPageArray = pPage.split(' ')
        // Polygon update
        let pSet = pPageArray[0].split(',')[0] + ',' + pPageArray[0].split(',')[1] + ' ' +
          pPageArray[1].split(',')[0] + ',' + y + ' ' + 
          dX + ',' + y + ' ' +
          dX + ',' + pPageArray[3].split(',')[1]
        gui.vid.timelineMarkPolygon.setAttribute('points',pSet)
      }

    }

  }
  
  if (vid.player.status === 'pause' || vid.player.status === "buffer") {
    // vid.player.playing = false;
    cancelAnimationFrame(rafID);
  }
  
}

//
// Add fake indicator on mousedown via this
//
// (Note) show loading indicator when new currentTime change must load video buffer
function tClickDownHandler(e, vid) {

  if (vid.rating.rated === undefined || vid.rating.rated === true) {

    // Up handler
    window.addEventListener('mouseup', vid.player.time.timelineUpHandler = function(e) {
      tClickUpHandler(e, vid)
    },false)

    var tl = vid.dom.timeline
    // Need to set here in case of click before play
    vid.player.time.rate = tl.clientWidth/vid.player.dur/vid.player.time.fps
    e.preventDefault()
    vid.player.time.fakeToggle = true
    vid.player.dragging = false
    // Offset left using container & timeline
    let tlLeft = vid.dom.container.offsetLeft+tl.offsetLeft
    // Calc time & placement values from input
    var calcTime = vid.player.CalcTimeLocPrep(e.clientX, tlLeft, tl.clientWidth)
    var timelineSel = tl.getElementsByClassName('timeline-sel')[0]
    var timelineFake = tl.getElementsByClassName('timeline-fake')[0]

    // X position will be click's clientX minus video offset and timeline offset
    let x = e.clientX - tl.offsetLeft - vid.dom.container.offsetLeft
    // let drawX = x / vid.player.width * 100

    timelineSel.classList.add('show')
    timelineSel.style.transform = 'translateX(' + x + 'px)'
    
    // Add Drag
    // (note) prob shouldn't keep doing player.cont[i], since we never rm it now
    // maybe add on document so we don't lose capture?
    window.addEventListener('mousemove', vid.player.time.timelineMoveHandler = function (e) {
      e.preventDefault()
      var tl = vid.dom.timeline
      let tlLeft = vid.dom.container.offsetLeft+tl.offsetLeft
      tFakeMove(e, tlLeft, vid.player.time.fakeToggle, tl, vid)
      let calcTimeMove = vid.player.CalcTimeLocPrep(e.clientX, tlLeft, tl.clientWidth)
      // Set video time w/ mousemove
      vid.dom.video.currentTime = calcTimeMove[0]
    },false)

  }

}

//
// Release fake indicator on mouse up
//

function tClickUpHandler(e, vid) {
  // if (rating.rated) {
    vid.player.time.fakeToggle = false
    var tl = vid.dom.timeline

    var timelineSel = tl.getElementsByClassName('timeline-sel')[0]
    var timelineBar = tl.getElementsByClassName('timeline-bar')[0]
    var timelineBarFake = tl.getElementsByClassName('timeline-bar-fake')[0]
    timelineBarFake.classList.remove('show')

    // Offset left using container & timeline
    let tlLeft = vid.dom.container.offsetLeft+tl.offsetLeft
    
    // Equalize
    vid.player.time.width = vid.player.time.widthPrep
    var calcTime = vid.player.CalcTimeLoc(e.clientX, tlLeft, tl.clientWidth)
    
    let x = e.clientX - tlLeft

    // Vid to new location
    // (note) need to search up to find parent sibling
    vid.dom.video.currentTime = calcTime[0]
    
    // Move bar
    // timelineBar.style.transform = 'translateX(-' + (tl.clientWidth-x) + 'px)'
    timelineBar.style.transform = 'translateX(-' + (tl.clientWidth-x) / vid.player.width * 100 + '%)'
    
    // Hide select indicator
    timelineSel.classList.remove('show')

    // Remove self
    window.removeEventListener('mouseup', vid.player.time.timelineUpHandler, false)

    // Remove move handler
    window.removeEventListener('mousemove', vid.player.time.timelineMoveHandler, false)

  // }
}

//
// Move timeline w/ fake click
//

function tFakeMove(xVal, offLeft, trueFalse, target, vid) {
  vid.player.dragging = true;
  var timelineBarFake = target.getElementsByClassName('timeline-bar-fake')[0];
  var timelineSel = target.getElementsByClassName('timeline-sel')[0];
  var width = target.clientWidth
  if (trueFalse) {
    var dist =  width-(xVal.clientX-offLeft);
    // let drawX = dist / vid.player.width * 100;
    timelineBarFake.style.transform = 'translateX(-' + dist + 'px)';
    timelineBarFake.classList.add('show');
    // Move selection bar w/ drag
    timelineSel.style.transform = 'translateX(' + (width-dist) + 'px)';
  }
}
