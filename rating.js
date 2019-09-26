// Vars for rating values, marker/timeline drawing
// Methods to init events & values, change rating, begin rating, mark & score, and complete rating
function rating(index, vid) {

  var parent = this

  this.scoreMax = 5, // Should be even, using 0-scoreMax
  this.scoreMin = 1,
  this.scoreNow = undefined, // Mutable rating value, changes over course of rating
  // simulation: [], // We'll add obj indices via the vid index, then timestamp every change
  this.markBegin = [], // Save initial maker point for line tag's x1 & y1 values, in index per video
  this.markEnd = [], // Save x2 & y2 values to create x1 & y1 for horizontal update line
  this.rated = undefined, // Flag to check if vid has been rated
  this.inProgress = false, // Flag to check if rating in progress
  this.vertAngle = 0, // Offset from vertical px for x value of transition between rating states
  this.endHandler = undefined, // Named function holder for 'ended' event to add/remove so timeline click isn't triggering
  this.rateKeydown = undefined,

  // Function to change video index up, down, or neutral in rating & write value & timestamp
  this.Change = function(index, dir) {
    // Can click before rating starts, only enable when running
    if (parent.inProgress) {
      if (dir === 'up' && parent.scoreNow < parent.scoreMax) {
        parent.scoreMax === 2 ? parent.scoreNow = parent.scoreMax : parent.scoreNow++
        parent.Mark(index)
      } else if (dir === 'down' && parent.scoreNow > parent.scoreMin) {
        // If only 3 states, just make up/down go to up/down, instead of moving through neutral first
        parent.scoreMax === 2 ? parent.scoreNow = parent.scoreMin : parent.scoreNow--
        parent.Mark(index)
      } else if (dir === 'neutral' && parent.scoreNow != (parent.scoreMax+parent.scoreMin)/2) {
        parent.scoreNow = (parent.scoreMax + parent.scoreMin)/2
        parent.Mark(index)
      } else if (dir === 'top' && parent.scoreNow != parent.scoreMax) {
        parent.scoreNow = parent.scoreMax
        parent.Mark(index)
      } else if (dir === 'bot' && parent.scoreNow != parent.scoreMin) {
        parent.scoreNow = parent.scoreMin
        parent.Mark(index)
      }
    }
  },

  // Begin rating, create initial markBegin values, markUpdate values
  // Trigger mark() & vid.player.Toggle()
  // Add 'ended' event to video for completion
  this.Begin = function (index) {
    let vidI = vid.dom.container
    vidI.getElementsByClassName('vid-cover-rate')[0].classList.remove('show')

    vid.player.playingIndex = index

    // Add VideoData to rating, and blank user rating
    // (Note) this isn't working correctly. May be inheriting association w/ VideoData
    // let genRating = new this.CreateSimRating(VideoData[index].id,VideoData[index].url[0][1],VideoData[index].valence.system.time,VideoData[index].valence.system.rating)
    // parent.simulation.push(genRating)

    // In progress
    parent.inProgress = true
    // Rating icon
    vidI.getElementsByClassName('container-rating')[0].getElementsByClassName('tab-icon')[0].innerHTML = '<i class="fa fa-spinner spinner-loader spin"></i>'

    // Show ctrls
    gui.rate.ctrls[index].classList.add('show')
    // Enable ctrls
    // gui.rate.ctrls[index].classList.add('enable')

    // Reset parent.scoreNow, in-case it has been modified by another rating
    parent.scoreNow = (parent.scoreMax + parent.scoreMin)/2

    // Show Rating timeline
    gui.rate.cont[index].classList.add('show')

    // Disable play/pause button
    // vidI.getElementsByClassName('vid-btn-play')[0].classList.add('disable')
    vidI.getElementsByClassName('vid-btn-play')[0].innerHTML = '<i class="fa fa-pause-circle-o"></i>'
    // Set marker begin values
    let ts = vid.player.getCurrentPercent(index)
    parent.markBegin[0] = (vid.player.width * ts) + parent.vertAngle
    parent.markBegin[1] = 100 - ((parent.scoreNow-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100)

    // Set marker update begin
    let markUpdate = document.createElementNS('http://www.w3.org/2000/svg','line')
    // (Note) this will create problems if rate multiple videos. should be in html maybe
    markUpdate.id = 'mark-update'
    markUpdate.classList.add('user')
    markUpdate.setAttribute('x1', parent.markBegin[0] + 'px')
    markUpdate.setAttribute('y1', parent.markBegin[1] + '%')
    markUpdate.setAttribute('x2', parent.markBegin[0] + 'px')
    markUpdate.setAttribute('y2', parent.markBegin[1] + '%')
    gui.rate.timelinesUpdateInner[index].appendChild(markUpdate)
    // Add reference in guiVid{}
    gui.vid.timelineMarkUpdate = document.getElementById('mark-update')

    // Create update polygon
    let markPolygon = document.createElementNS('http://www.w3.org/2000/svg','polygon')
    markPolygon.classList.add('timeline-mark-polygon')
    markPolygon.classList.add('user')
    let px1 = 0
    let py1 = 100
    let px2 = 0
    let py2 = parent.markBegin[1]
    let px3 = 0
    let py3 = parent.markBegin[1]
    let px4 = 0
    let py4 = 100
    let pvals = px1 + ',' + py1 + ' ' +
      px2 + ',' + py2 + ' ' + 
      px3 + ',' + py3 + ' ' +
      px4 + ',' + py4
    markPolygon.setAttribute('points',pvals)
    gui.rate.timelinesUpdateInner[index].appendChild(markPolygon)
    gui.vid.timelineMarkPolygon = vidI.getElementsByClassName('timeline-mark-polygon')[0]

    // Indicator marker
    let markIndicator = document.createElement('div')
    markIndicator.classList.add('mark-indicator')
    markIndicator.id = 'mark-indicator'
    gui.rate.timelines[index].appendChild(markIndicator)
    // Add as reference in guiVid{}
    gui.vid.timelineMarkIndicator = document.getElementById('mark-indicator')

    // Write value & timestamp to score vid index
    let t = Number(vid.player.getCurrentTime(index).toFixed(2))

    // Initialize the object
    VideoData[index].valence.user = {}
    VideoData[index].valence.user.time = []
    VideoData[index].valence.user.rating = []
    
    VideoData[index].valence.user.time.push(t)
    VideoData[index].valence.user.rating.push(parent.scoreNow)

    let drawX = vid.player.time.width / vid.player.width * 100
    // Save begin for next line
    parent.markBegin[0] = drawX+parent.vertAngle
    parent.markBegin[1] = 100 - ((parent.scoreNow-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100)
    
    vid.player.Toggle(index)

    // Set rating to neutral
    parent.scoreNow = (parent.scoreMax + parent.scoreMin) / 2

    // Rating complete
    vidI.getElementsByTagName('video')[0].addEventListener('ended', parent.endHandler = function() {
      parent.Complete(index)
    },false)
  },

  // Called from parent.Change() & parent.Complete()
  // Modify mark tag values & append to timeline
  // Update markBegin values
  // Use lastOverride as true to set drawX to 100 - this marks the last value at 100%. Called by parent.Complete
  this.Mark = function (index, lastOverride) {
    // Write value & timestamp to score vid index
    let ts = vid.player.getCurrentPercent(index)
    let t = Number(vid.player.getCurrentTime(index).toFixed(2))
    VideoData[index].valence.user.time.push(t)
    VideoData[index].valence.user.rating.push(parent.scoreNow)
    // parent.simulation[index].valence.user.time.push(t)
    // parent.simulation[index].valence.user.rating.push(parent.scoreNow)

    // When drawing, we go by the previous one
    let prevRating = VideoData[index].valence.user.rating[VideoData[index].valence.user.rating.length-2]

    // (note) this is undefined on first call
    let drawX = vid.player.time.width / vid.player.width * 100
    let dX = (vid.dom.video.currentTime/vid.player.dur) * 100
    let drawY = 100 - ((parent.scoreNow-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100)
    // Indicator Mark
    gui.vid.timelineMarkIndicator.style.top = 100 - ((parent.scoreNow-1)/(parent.scoreMax-1)*100) + '%'
    gui.vid.timelineMarkIndicator.style.left = dX + '%';

    // Mark at end of timeline
    if (lastOverride) { dX = 100 }

    // Update mark
    gui.vid.timelineMarkUpdate.setAttribute('x1', dX + '%')
    gui.vid.timelineMarkUpdate.setAttribute('y1', drawY + '%')
    gui.vid.timelineMarkUpdate.setAttribute('x2', dX + '%')
    gui.vid.timelineMarkUpdate.setAttribute('y2', drawY + '%')

    // Update polygon
    let mPvals = dX + ',' + 100 + ' ' +
      dX + ',' + drawY + ' ' +
      dX + ',' + drawY + ' ' +
      dX + ',' + 100
    gui.vid.timelineMarkPolygon.setAttribute('points',mPvals)

    // Create line, horizontal
    let lh = document.createElementNS('http://www.w3.org/2000/svg','line')
    lh.classList.add('user')
    lh.setAttribute('x1', parent.markBegin[0] + '%')
    lh.setAttribute('y1', parent.markBegin[1] + '%')
    lh.setAttribute('x2', dX + '%')
    lh.setAttribute('y2', parent.markBegin[1] + '%')

    // Create line, vertical
    let lv = document.createElementNS('http://www.w3.org/2000/svg','line')
    lv.classList.add('user')
    lv.classList.add('vert')
    lv.setAttribute('x1', dX + '%')
    lv.setAttribute('y1', parent.markBegin[1] + '%')
    lv.setAttribute('x2', dX+parent.vertAngle + '%')
    lv.setAttribute('y2', 100 - ((parent.scoreNow-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100) + '%')

    gui.rate.timelinesInner[index].appendChild(lh)
    gui.rate.timelinesInner[index].appendChild(lv)

    // Create polygon
    let p = document.createElementNS('http://www.w3.org/2000/svg','polygon')
    p.classList.add('user')

    // Create vert values for polygon & text
    let px1 = parent.markBegin[0]
    let py1 = 100
    let px2 = parent.markBegin[0]
    let py2 = parent.markBegin[1]
    let px3 = dX
    let py3 = parent.markBegin[1]
    let px4 = dX
    let py4 = 100
    let pvals = px1 + ',' + py1 + ' ' +
      px2 + ',' + py2 + ' ' + 
      px3 + ',' + py3 + ' ' +
      px4 + ',' + py4

    // Dont draw lowest - probably only use for 0
    // if (prevRating > parent.scoreMin) {
      let rt = document.createElement('span')
      rt.classList.add('rating-no')
      rt.style.left =  (px1+px4)/2 + '%'
      rt.style.top = py2 + '%'
      rt.innerHTML = prevRating
      gui.rate.timelines[index].appendChild(rt)
    // }

    p.setAttribute('points',pvals)
    gui.rate.timelinesInner[index].insertBefore(p,gui.rate.timelinesInner[index].getElementsByClassName('user')[0])

    // Save begin for next line
    parent.markBegin[0] = dX+parent.vertAngle
    parent.markBegin[1] = 100 - ((parent.scoreNow-1)/(parent.scoreMax-1)*100)
  },

  // After video has been rated
  // Enable timeline, play button, check rating tab, mark video as rated
  this.Complete = function (index) {
    let vidI = gui.vid.cont[index]
    vidI.getElementsByTagName('video')[0].removeEventListener('ended', parent.endHandler, false)

    parent.Mark(index, true)
    vid.player.Toggle("pause")

    parent.rated = true
    gui.rate.ctrls[index].classList.remove('show')
    // Remove 'in progress' icon
    vidI.getElementsByClassName('container-rating')[0].getElementsByClassName('tab-icon')[0].innerHTML = ''
    // Clear update marker
    gui.rate.timelinesUpdateInner[index].innerHTML = ''
    // Hide indicator marker
    gui.vid.timelineMarkIndicator.style.display = 'none'
    // Show play/pause btn
    gui.vid.cont[index].getElementsByClassName('vid-btn-play')[0].classList.remove('disable')
    // Re-enable timeline
    vidI.getElementsByClassName('timeline')[0].classList.remove('disable')
    vidI.getElementsByClassName('timeline-hover')[0].classList.remove('disable')
    // Show play button
    vidI.getElementsByClassName('vid-btn-play')[0].innerHTML = '<i class="fa fa-play-circle"></i>'
    // Add check icon to Rating tab
    gui.rate.timelines[index].classList.add('complete')
    gui.rate.timelinesSystem[index].classList.add('complete')  
    // vidI.getElementsByClassName('container-rating')[0].getElementsByClassName('tab-icon')[0].innerHTML = '<i class="fa fa-check check"></i>'
    // Show rating complete cover
    vidI.getElementsByClassName('vid-cover-rating-complete')[0].classList.add('show')

    // Add event to Completion screen button to trigger parent.SystemRating and output system rating
    vidI.getElementsByClassName('btn-rating-complete')[0].addEventListener('click', function() {
      vidI.getElementsByClassName('vid-cover-rating-complete')[0].classList.remove('show')
      parent.SystemRating(index, 'system', VideoData[index].valence.system.time, VideoData[index].valence.system.rating)
    })

    // Remove keydown rating event
    document.removeEventListener('keydown', parent.rateKeydown, false)

  },

  // Use to draw rating graph from data input arg - example: system rating when ready
  // Use style to denote 'user' or 'system' styling
  this.SystemRating = function(index, style, vTime, vRate) {
    // Display score values
    document.getElementById('pre').innerHTML = JSON.stringify(VideoData[index], null, 2)

    vid.dom.container.getElementsByClassName('container-rating-system')[0].classList.add('show')
    var firstHolder = [] // Hold first, then prev values to draw lines
    var firstFlag = false
    var dur = gui.vid.cont[index].getElementsByTagName('video')[0].duration
    var len = vTime.length
    for (var i=0; i<len; i++) {
      // console.log(firstHolder)
      if (!firstFlag) {
        // firstHolder[0] = time[0]
        // firstHolder[1] = rating[0]
        firstFlag = true
      }
      else {
        // Horizontal
        let lh = document.createElementNS('http://www.w3.org/2000/svg','line')
        lh.classList.add(style)
        lh.setAttribute('x1', vTime[i-1]/dur*100 + '%')
        // console.log(vRate[iP]/parent.scoreMax)
        lh.setAttribute('y1', 100 - ((vRate[i-1]-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100) + '%')
        lh.setAttribute('x2', vTime[i]/dur*100 + '%')
        lh.setAttribute('y2', 100 - ((vRate[i-1]-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100) + '%')
        // Vertical
        let lv = document.createElementNS('http://www.w3.org/2000/svg','line')
        lv.classList.add(style)
        lv.classList.add('vert')
        lv.setAttribute('x1', vTime[i]/dur*100 + '%')
        lv.setAttribute('y1', 100 - ((vRate[i-1]-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100) + '%')
        lv.setAttribute('x2', vTime[i]/dur*100 + '%')
        lv.setAttribute('y2', 100 - (vRate[i]-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100 + '%')

        let p = document.createElementNS('http://www.w3.org/2000/svg','polygon')
        p.classList.add(style)

        // create vert values for polygon, and text
        let px1 = (vTime[i-1]/dur*100)
        let py1 = 100
        let px2 = (vTime[i-1]/dur*100)
        let py2 = (100-((vRate[i-1]-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100))
        let px3 = (vTime[i]/dur*100)
        let py3 = (100-((vRate[i-1]-parent.scoreMin)/(parent.scoreMax-parent.scoreMin)*100))
        let px4 = (vTime[i]/dur*100)
        let py4 = 100

        let pvals = px1 + ',' + py1 + ' ' +
          px2 + ',' + py2 + ' ' + 
          px3 + ',' + py3 + ' ' +
          px4 + ',' + py4

        p.setAttribute('points',pvals)

        // create text rating number
        if (vRate[i-1] > 0) {
          var rt = document.createElement('span')
          rt.classList.add('rating-no')
          rt.style.left =  (px1+px4)/2 + '%'
          rt.style.top = py2 + '%'
          rt.innerHTML = vRate[i-1]
        }

        if (style === 'system') {
          // gui.rate.timelinesInner[index].insertBefore(lh,gui.rate.timelinesInner[index].getElementsByClassName('user')[0])
          // gui.rate.timelinesInner[index].insertBefore(lv,gui.rate.timelinesInner[index].getElementsByClassName('user')[0])
          // gui.rate.timelinesInner[index].insertBefore(p,gui.rate.timelinesInner[index].getElementsByClassName('system')[0])
          gui.rate.timelinesSystemInner[index].appendChild(lh)
          gui.rate.timelinesSystemInner[index].appendChild(lv)
          gui.rate.timelinesSystemInner[index].insertBefore(p,gui.rate.timelinesSystemInner[index].getElementsByClassName(style)[0])
          if (vRate[i-1] > 0) {
            gui.rate.timelinesSystem[index].appendChild(rt)
          }
        } else if (style === 'user') {
          gui.rate.timelinesInner[index].appendChild(lh)
          gui.rate.timelinesInner[index].appendChild(lv)
        }

        firstHolder[0] = vTime[i]
        firstHolder[1] = vRate[i]
      }
    }

  },

  // Generate Obj for parent.simulation, take arguement for {..}.simulation.id
  this.CreateSimRating = function(videoId, url, systemTime, systemRating) {
    this.id = videoId
    this.url = url
    this.valence = {}
    this.valence.user = []
    this.valence.user.time = []
    this.valence.user.rating = []
    this.valence.system = []
    this.valence.system.time = systemTime
    this.valence.system.rating = systemRating
  },

  // Loop through videos, initialize marker variables - first flag, and array for line's x1 & y1 values
  // Can't initialize in obj b/c we don't know the number of videos until load
  // Add rating events to ctrls
  this.Init = function() {
    for (var i=0; i < VideoData.length; i++) {

      gui.vid.cont[i].getElementsByClassName("container-rating-user")[0].classList.add("show")
      gui.vid.cont[i].getElementsByClassName("container-rating-system")[0].classList.add("show")

      if (parent.rated === false || parent.rated === undefined) {
        parent.rated = false
        gui.vid.cont[i].getElementsByClassName('timeline')[0].classList.add('disable')
      }

      // Insert horizontal lines into rating timeline
      let yFrag = document.createDocumentFragment()
      let yFrag02 = document.createDocumentFragment()
      for (var j=1; j <= parent.scoreMax; j++) {
        let yLines = document.createElement('div')
        let yLines02 = document.createElement('div')
        yFrag.appendChild(yLines)
        yFrag02.appendChild(yLines02)
      }
      gui.vid.cont[i].getElementsByClassName('rating-y-lines')[0].appendChild(yFrag)
      gui.vid.cont[i].getElementsByClassName('rating-y-lines')[1].appendChild(yFrag02)

      parent.inProgress = false
      // (note) this will be incoming from API
      // (note) parent.simulation will be filled as well. need f() to draw that
      parent.rated = false
      for (var j=0; j<gui.vid.cont[i].getElementsByClassName('vid-cover-msg').length; j++) {
        gui.vid.cont[i].getElementsByClassName('vid-cover-msg')[j].classList.remove('show')
      }
      if (parent.rated) {
        // > 1 per video
        gui.rate.ctrls[i].classList.remove('show')
      }
      // Hasn't been rated, change display accordingly
      else {
        // Disable timeline during duration
        // gui.vid.cont[i].getElementsByClassName('timeline')[0].classList.add('disable')
        // gui.vid.cont[i].getElementsByClassName('timeline-hover')[0].classList.add('disable')
        gui.vid.cont[i].getElementsByClassName('vid-cover-rate')[0].classList.add('show')
        gui.vid.cont[i].getElementsByClassName('container-rating-user')[0].classList.remove('show')
        gui.vid.cont[i].getElementsByClassName('container-rating-system')[0].classList.remove('show')
      }

      // Set score to neutral
      parent.scoreNow = (parent.scoreMax + parent.scoreMin) / 2

      //
      // Rating instructions
      //

      var instr = gui.vid.cont[i].getElementsByClassName('instructions-rating');
      var instrLen = instr.length;

      var instrInc = 0;
      // Bind video index
      (function(vidI) {
        for (var i=0; i<instrLen; i++) {

          (function(instrI) {
            instr[instrI].getElementsByClassName('btn-rating-instructions')[0].addEventListener('click', function() {
              // Increment
              // instrInc < instrLen-1 ? instrInc++ : instrInc = 0
              instrInc++
              // Hide all instructions
              for (var j=0; j<instrLen; j++) {
                instr[j].classList.remove('show')
              }
              // Show
              if (instrInc < instrLen) {
                instr[instrInc].classList.add('show')              
              }
              // Show Ctrl panel
              if (instrInc === 1) {
                setTimeout(function() {
                  gui.rate.ctrls[vidI].classList.add('show')
                },750)
              }
              // Show rating timeline
              if (instrInc === 3) {
                setTimeout(function() {
                  gui.rate.cont[vidI].classList.add('show')
                },750)
              }
            })

            // Skip & begin
            var skipAndBegin = instr[instrI].getElementsByClassName('btn-begin-rating')[0];
            skipAndBegin.addEventListener('click', function() {
              parent.Begin(vidI)
            })
            
          })(i)

        }
      })(i);

      //
      // Rating ctrls events
      //

      (function(index) {
        // Top
        gui.rate.ctrls[index].getElementsByClassName('rating-ctrl top')[0].addEventListener('click', function(e) {
          parent.Change(index, 'top')
        })
        // Up
        gui.rate.ctrls[index].getElementsByClassName('rating-ctrl up')[0].addEventListener('click', function(e) {
          parent.Change(index,'up')
        })
        // Neutral
        gui.rate.ctrls[index].getElementsByClassName('rating-ctrl neutral')[0].addEventListener('click', function(e) {
          parent.Change(index,'neutral')
        })
        // Down
        gui.rate.ctrls[index].getElementsByClassName('rating-ctrl down')[0].addEventListener('click', function(e) {
          parent.Change(index,'down')
        })
        // Bot
        gui.rate.ctrls[index].getElementsByClassName('rating-ctrl bot')[0].addEventListener('click', function(e) {
          parent.Change(index,'bot')
        })
        // Keyboard rating events
        document.addEventListener('keydown', parent.rateKeydown = function(e) {
          if (e.keyCode === 38) {
            e.preventDefault()
            parent.Change(index,'up')  
          } else if (e.keyCode === 40) {
            e.preventDefault()
            parent.Change(index,'down')  
          } else if (e.keyCode === 32) {
            e.preventDefault()
            parent.Change(index,'neutral')  
          } else if (e.keyCode === 33) {
            e.preventDefault()
            parent.Change(index,'top')  
          } else if (e.keyCode === 34) {
            e.preventDefault()
            parent.Change(index,'bot')  
          }
        }, false)

      })(i)

    }
  }

}