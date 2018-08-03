/*
BUGS
------

- if target fps is too high, timeline won't move fast enough. need speed as inverse var?
  ..if rAF fps is lowered by browser, [rate] should be increased
- rAF stops when switching tabs but vid does not
- 'onend event is slow, noticeably
- small hickup on timeline as video is finishing

*/

// Variables for video, time
var player = {

  status: [], // Play/pause status container for each vid
  width: [],
  playingIndex: undefined,
  playing: [], // Flag instead of check vid status
  dragging: undefined, // Toggle to indicate if dragging time on timeline
  dur: [],
  time: {
    width: [], // Calc width, RAF uses. This is the width of the timeline bar during playback progression. grows from 0 to width of video
    widthPrep: [], // Calc width when click, but don't update b/c RAF uses vid.time.width
    fps: 30,
    rate: [], // Frames to move every 60th of a sec
    now: undefined,
    inc: 0, // RAF incrementer to normalize time
    then: Date.now(),
    delta: undefined,
    interval: undefined,
    fakeToggle: true,
    timelineUpHandler: [], // hold event functions for mouse up, so we can remove
    timelineMoveHandler: []
  },

  // pass in vid index to return current time as percentage
  getCurrentPercent: function(index) {
    let v = gui.vid.cont[index].getElementsByTagName('video')[0]
    return v.currentTime / v.duration
  },

  getCurrentTime: function(index) {
    let v = gui.vid.cont[index].getElementsByTagName('video')[0]
    return v.currentTime
  },

  // Helper to cancel rAF on video end
  Kill: function(index) {
    player.status[index] = 'pause';
    player.playing[index] = false;
    gui.vid.cont[index].getElementsByClassName('timeline-bar')[0].style.transform = 'translateX(0px)';
    gui.vid.cont[index].getElementsByClassName('vid-btn-play')[0].innerHTML = '<i class="fa fa-play-circle"></i>'
    gui.vid.coverPlay[index].classList.add('show')
  },


  // Create locationTime & player.time.width, return in array
  CalcTimeLoc(index,clickX,offsetL,width) {
    var locationPercent = (clickX-offsetL)/width;
    var locationTime = locationPercent*gui.vid.cont[index].getElementsByTagName('video')[0].duration;
    player.time.width[index] = locationPercent*player.width;
    return [locationTime,player.time.width[index]];
  },

  // Create locationTime & player.time.width, return in array
  CalcTimeLocPrep(index,clickX,offsetL,width) {
    var locationPercent = (clickX-offsetL)/width;
    var locationTime = locationPercent*gui.vid.cont[index].getElementsByTagName('video')[0].duration;
    player.time.widthPrep[index] = locationPercent*player.width;
    return [locationTime,player.time.widthPrep[index]];
  },

  //
  // Toggle play/pause states
  //

  Toggle(index,stateOverride) {
    // (Note) issue here when pause, resize, play - timeline-bar jumps
    player.time.rate[index] = player.width[index]/player.dur[index]/player.time.fps
    // Specified vid via passed index param
    var vidTarget = gui.vid.cont[index].getElementsByTagName('video')[0]
    player.playingIndex = index

    // Force pause w/ arg
    if (stateOverride === 'pause') {
      player.status[index] = 'pause'
      player.playing[index] = false
      gui.vid.coverPlay[index].classList.add('show')
      gui.vid.cont[index].getElementsByClassName('vid-btn-play')[0].innerHTML = '<i class="fa fa-play-circle"></i>'
      vidTarget.pause()
      player.playingIndex = undefined
    }

    // Paused & not at end, play
    else if (!player.playing[index] && !vidTarget.ended) {
      player.status[index] = 'play'
      player.playing[index] = true
      tBarProgress(true,index)
      gui.vid.cont[index].getElementsByClassName('vid-btn-play')[0].innerHTML = '<i class="fa fa-pause-circle-o"></i>'
      gui.vid.coverPlay[index].classList.remove('show')
      vidTarget.play()
    }

    // Ended, restart
    else if (vidTarget.ended) {
      player.status[index] = 'play'
      vidTarget.currentTime = 0
      player.time.width[index] = 0
      player.playing[index] = true
      gui.vid.coverPlay[index].classList.remove('show')
      vidTarget.play()
      tBarProgress(true,index)
    }

    // Playing, pause
    else {
      player.status[index] = 'pause'
      player.playing[index] = false
      gui.vid.coverPlay[player.playingIndex].classList.add('show')
      gui.vid.cont[index].getElementsByClassName('vid-btn-play')[0].innerHTML = '<i class="fa fa-play-circle"></i>'
      vidTarget.pause()
      player.playingIndex = undefined
    }

  },

  // Loop through videos on page
  // Get timeline width, and duration values
  // Add video load, ctrl, and ended events
  InitEventsAndData: function() {
    for (var i=0; i<gui.vid.cont.length; i++) {
      player.status.push(null);
      player.width.push(gui.vid.cont[i].getElementsByClassName('timeline')[0].clientWidth);
      // Hide loading indicator when ready
      (function(index) {

        var vidContI = gui.vid.cont[index]
        var vidI = vidContI.getElementsByTagName('video')[0]
        var btnVol = gui.vid.cont[index].getElementsByClassName('vid-btn-vol')[0]
        // Load each video. this solves situation where cached video never triggers 'loadeddata' event
        vidI.load()

        player.time.width[i] = 0

        // Volume mute/unmute display
        vidI.muted ? btnVol.innerHTML = '<i class="fa fa-volume-off"></i>' : btnVol.innerHTML = '<i class="fa fa-volume-up"></i>'

        // Video controls events
        // (note) add touch event too
        vidContI.getElementsByClassName('vid-btn-play')[0].addEventListener('click', function() {
          // if (!rating.rated[index] && !rating.inProgress[index]) {
          //   rating.Begin(index)
          // } else {
            player.Toggle(index)
          // }
        })
        // Volume Toggle
        vidContI.getElementsByClassName('vid-btn-vol')[0].addEventListener('click', function() {
          if (vidI.muted) {
            vidI.muted = false
            btnVol.innerHTML = '<i class="fa fa-volume-up"></i>'
          } else {
            vidI.muted = true
            btnVol.innerHTML = '<i class="fa fa-volume-off"></i>'
          }
        })
        // Re-play cover btn
        vidContI.getElementsByClassName('vid-cover-play')[0].addEventListener('click', function() {
          player.Toggle(index)
        })
        // On loaded event for each vid
        vidI.addEventListener('loadeddata', function() {
          console.log('video[]: ' + index + '\nevent: loadeddata' + '\nreadyState: ' + this.readyState + '\n\n')
          if (this.readyState >= 2) {
            let seconds = this.duration % 60
            player.dur.push(this.duration)
            player.time.rate.push(player.width[index]/player.dur[index]/player.time.fps)
            player.playing.push(false)
            player.time.width.push(0)
            player.time.widthPrep.push(undefined)
            // Show vid-cover-play
            gui.vid.cont[index].getElementsByClassName('vid-cover-play')[0].classList.add('show')
            // Hide loader
            gui.vid.coverLoading[index].classList.remove('show')
            // Show timeline
            gui.vid.cont[index].getElementsByClassName('timeline-hover')[0].classList.add('show')
          }
        })

        // Ctrl - play/pause every vid
        gui.vid.cont[i].getElementsByTagName('video')[0].addEventListener('click', function() {
          // if (rating.rated[index]) {
            player.Toggle(index)
          // }
        },false)
        // Kill on 'ended'
        gui.vid.cont[i].getElementsByTagName('video')[0].addEventListener('ended', function() {
          player.Kill(index);
        },false)
        
        // Move fake indicator on click, Timeline mouseup/mousedown
        var timeline = gui.vid.cont[i].getElementsByClassName('timeline')[0]
        timeline.addEventListener('mousedown', function(e) {
          tClickDownHandler(index,e)
        }, false)
        // (note) want to add on window to cursor can exit timeline, but removing the event isn't working
        // timeline.addEventListener('mouseup', function(e) {
        //   tClickUpHandler(index,e)
        // },false)

        // Preview Hover
        /*gui.vid.cont[index].getElementsByClassName('timeline')[0].addEventListener('mousemove',function(e) {
          var prev = gui.vid.cont[index].getElementsByClassName('timeline-preview')[0]
          let imgB = undefined
          let vid = gui.vid.cont[index]
          // let tl = gui.vid.cont[index].getElementsByClassName('timeline')[0]
          // let mouseTlLeft = e.clientX - tl.offsetLeft - vid.offsetLeft
          // let pct = mouseTlLeft / player.width[index]
          // let fTime = pct * player.dur[index]

          let canvas = document.createElement('canvas')
          let ctx = canvas.getContext('2d')
          ctx.drawImage(vidI, 0, 0, prev.clientWidth, prev.clientHeight)
          // canvas.toBlob(function(blob) {
          //   var url = URL.createObjectURL(blob)
          //   prev.getElementsByTagName('img')[0].src = url
          // },'image/jpeg')
          prev.getElementsByTagName('img')[0].src = canvas.toDataURL('img/jpeg',0.1)
        })*/

      })(i);
      
    }
  }

}
player.time.interval = 1000/player.time.fps;

//
// On player/window resize
// change: player.width[..], player.time.rate[..]
//

var resizeTimer = undefined;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    console.log('resize');
    for (var i=0; i<gui.vid.cont.length; i++) {
      // (Note) this messes up current timeline, but is necessary for clicking timeline
      player.width[i] = gui.vid.cont[i].getElementsByClassName('timeline')[0].clientWidth
      console.log(player.time.width[player.playingIndex])
      let w = player.getCurrentPercent(player.playingIndex)
      player.time.width[player.playingIndex] = player.width[player.playingIndex] * w
      console.log(player.time.width[player.playingIndex])
      // player.time.rate[i] = player.width[i]/player.dur[i]/player.time.fps
    }
  }, 200);
});

//
// RAF Timeline animation - change bar width while play
// Also updates rating score marks
//

function tBarProgress(tF,index) {
  // Cache index parameter when start, b/c on RAF loop it's undefined
  if (index !== undefined) {
    player.playingIndex = index;
  }
  var timelineBar = gui.vid.cont[index].getElementsByClassName('timeline-bar')[0];

  // Keep feeding inputs
  var rafID = requestAnimationFrame(function() {
    tBarProgress(tF,index)
  })
  
  player.time.now = Date.now();
  player.time.delta = player.time.now - player.time.then;
    
  if (player.time.delta > player.time.interval) { 
    player.time.then = player.time.now - (player.time.delta % player.time.interval);
    
    // Animation
    if (player.time.width[player.playingIndex] <= player.width[player.playingIndex]) {

      //player.time.width += calcRate; // Based on current FPS
      player.time.width[player.playingIndex] += player.time.rate[player.playingIndex]; // Based on set FPS
      
      // Move Bar
      let drawX = (player.width[player.playingIndex]-player.time.width[player.playingIndex]) / player.width[player.playingIndex] * 100
      timelineBar.style.transform = 'translateX(-' + drawX + '%)';

      // Draw horizontal rating line & indicator if rating running
      // if (!rating.rated[player.playingIndex]) {

      //   let ts = player.getCurrentPercent(player.playingIndex)
      //   let x = player.time.width[player.playingIndex] / player.width[player.playingIndex] * 100
      //   let y = 100 - ((rating.scoreNow-1)/(rating.scoreMax-1)*100)

      //   gui.vid.timelineMarkUpdate.setAttribute('x2', x + '%')
      //   gui.vid.timelineMarkUpdate.setAttribute('y2', y + '%')
      //   gui.vid.timelineMarkIndicator.style.top = y + '%'
      //   gui.vid.timelineMarkIndicator.style.left = x + '%';

      //   // (Note) probably shouldn't look this up constantly
      //   let pPage = gui.vid.timelineMarkPolygon.getAttribute('points')
      //   pPageArray = pPage.split(' ')
      //   // Polygon update
      //   let pSet = pPageArray[0].split(',')[0] + ',' + pPageArray[0].split(',')[1] + ' ' +
      //     pPageArray[1].split(',')[0] + ',' + y + ' ' + 
      //     x + ',' + y + ' ' +
      //     x + ',' + pPageArray[3].split(',')[1]
      //   gui.vid.timelineMarkPolygon.setAttribute('points',pSet)
      // }

    }

  }
  
  if (player.status[player.playingIndex] === 'pause') {
    player.playing[index] = false;
    cancelAnimationFrame(rafID);
  }
  
}

//
// Add fake indicator on mousedown via this
//
// (Note) show loading indicator when new currentTime change must load video buffer
function tClickDownHandler(index,e) {
  // if (rating.rated[index]) {

    // Up handler
    window.addEventListener('mouseup', player.time.timelineUpHandler[index] = function(e) {
      tClickUpHandler(index,e)
    },false)

    var tl = gui.vid.cont[index].getElementsByClassName('timeline')[0]
    // Need to set here in case of click before play
    player.time.rate[index] = tl.clientWidth/player.dur[index]/player.time.fps
    e.preventDefault()
    player.time.fakeToggle = true
    player.dragging = false
    // Offset left using container & timeline
    let tlLeft = gui.vid.cont[index].offsetLeft+tl.offsetLeft
    // Calc time & placement values from input
    var calcTime = player.CalcTimeLocPrep(index,e.clientX,tlLeft,tl.clientWidth)
    var timelineSel = tl.getElementsByClassName('timeline-sel')[0]
    var timelineFake = tl.getElementsByClassName('timeline-fake')[0]

    // X position will be click's clientX minus video offset and timeline offset
    let x = e.clientX - tl.offsetLeft - gui.vid.cont[index].offsetLeft
    let drawX = x / player.width[index] * 100

    timelineSel.classList.add('show')
    timelineSel.style.transform = 'translateX(' + x + 'px)'
    
    // Add Drag
    // (note) prob shouldn't keep doing player.cont[i], since we never rm it now
    // maybe add on document so we don't lose capture?
    window.addEventListener('mousemove', player.time.timelineMoveHandler[index] = function (e) {
      e.preventDefault()
      var tl = gui.vid.cont[index].getElementsByClassName('timeline')[0]
      let tlLeft = gui.vid.cont[index].offsetLeft+tl.offsetLeft
      tFakeMove(e,tlLeft,player.time.fakeToggle,tl,index)
      let calcTimeMove = player.CalcTimeLocPrep(index,e.clientX,tlLeft,tl.clientWidth)
      // Set video time w/ mousemove
      gui.vid.cont[index].getElementsByTagName('video')[0].currentTime = calcTimeMove[0]
    },false)

  // }
}

//
// Release fake indicator on mouse up
//

function tClickUpHandler(index,e) {
  // if (rating.rated[index]) {
    player.time.fakeToggle = false
    var tl = gui.vid.cont[index].getElementsByClassName('timeline')[0]

    var timelineSel = tl.getElementsByClassName('timeline-sel')[0]
    var timelineBar = tl.getElementsByClassName('timeline-bar')[0]
    var timelineBarFake = tl.getElementsByClassName('timeline-bar-fake')[0]
    timelineBarFake.classList.remove('show')

    // Offset left using container & timeline
    let tlLeft = gui.vid.cont[index].offsetLeft+tl.offsetLeft
    
    // Equalize
    player.time.width[index] = player.time.widthPrep[index]
    var calcTime = player.CalcTimeLoc(index,e.clientX,tlLeft,tl.clientWidth)
    
    let x = e.clientX - tlLeft

    // Vid to new location
    // (note) need to search up to find parent sibling
    gui.vid.cont[index].getElementsByTagName('video')[0].currentTime = calcTime[0]
    
    // Move bar
    // timelineBar.style.transform = 'translateX(-' + (tl.clientWidth-x) + 'px)'
    timelineBar.style.transform = 'translateX(-' + (tl.clientWidth-x) / player.width[index] * 100 + '%)'
    
    // Hide select indicator
    timelineSel.classList.remove('show')

    // Remove self
    window.removeEventListener('mouseup', player.time.timelineUpHandler[index], false)

    // Remove move handler
    window.removeEventListener('mousemove', player.time.timelineMoveHandler[index], false)

  // }
}

//
// Move timeline w/ fake click
//

function tFakeMove(xVal,offLeft,trueFalse,target,index) {
  player.dragging = true;
  var timelineBarFake = target.getElementsByClassName('timeline-bar-fake')[0];
  var timelineSel = target.getElementsByClassName('timeline-sel')[0];
  var width = target.clientWidth
  if (trueFalse) {
    var dist =  width-(xVal.clientX-offLeft);
    let drawX = dist / player.width[index] * 100;
    timelineBarFake.style.transform = 'translateX(-' + dist + 'px)';
    timelineBarFake.classList.add('show');
    // Move selection bar w/ drag
    timelineSel.style.transform = 'translateX(' + (width-dist) + 'px)';
  }
}
