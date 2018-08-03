var VideoData = [
  {
    "id": "12#eBy-038c@y00",
    "url": [
      ["mp4","./video/bbb.mp4"]
    ],
    "valence": {
      "system": {
      },
      "user": {
        "time": [],
        "rating": []
      }
    }
  }
]

// Dom vars for templating loop
const template = {
  template: document.getElementById('vid-template'),
  holder: document.getElementById('vid-holder')
};

var video = {

  // Insert video(s) into document
  // Grab from template, & use VideoData properties
  AddToPage: function() {
    for (var i=0; i<VideoData.length; i++) {
      setTimeout(function() {},3000)
      var vidKey = template.template.cloneNode(true)
      vidKey.id = '' // reset id
      vidKey.className = 'container-vid' // add class needed by JS

      // Add video to page
      template.holder.appendChild(vidKey)

      let videoCont = template.holder.getElementsByClassName('container-vid')[i]
      let video = videoCont.getElementsByTagName('video')[0]

      // (Note) temporary. just mute for sanity
      video.muted = true

      // Add video <source>s, add urls, then append to <video>
      for (var j=0; j<VideoData[i].url.length; j++) {
        let src = document.createElement('source')
        src.type = 'video/' + VideoData[i].url[j][0]
        src.src = VideoData[i].url[j][1]
        video.appendChild(src)
      }
    }

    // Grab values, add ctrl & video events
    // (Note) will be in POST request, after video.AddToPage()
    player.InitEventsAndData()
    // (Note) rating doesn't exist yet
    // rating.Init()

  }

}

// (Note) this will be triggered in/by a post request w/ incoming data
// video.AddToPage()

//
// Dom references, separated by component
//

const gui = {
  vid: {
    cont: document.getElementsByClassName('container-vid'),
    // contLen: document.getElementsByClassName('container-vid').length,
    demo: document.getElementById('demo'),
    coverLoading: document.getElementsByClassName('vid-cover-loading'),
    coverLoadingLen: document.getElementsByClassName('vid-cover-loading').length,
    coverPlay: document.getElementsByClassName('vid-cover-play')
  },
  rate: {
    cont: document.getElementsByClassName('container-rating'),
    ctrls: document.getElementsByClassName('rating-ctrls'),
    timelines: document.getElementsByClassName('rating-timeline'),
    timelinesSystem: document.getElementsByClassName('rating-timeline-system'),
    timelinesInner: document.getElementsByClassName('rating-timeline-inner'),
    timelinesUpdateInner: document.getElementsByClassName('rating-timeline-update-inner'),
    timelinesSystemInner: document.getElementsByClassName('rating-timeline-system-inner'),
    msgs: document.getElementsByClassName('vid-cover-msg'),
    instructions: document.getElementsByClassName('instructions-rating')
  },
  form: {
    cont: document.getElementById("vid-start-form"),
    input: document.getElementById("vid-start-input"),
    default: document.getElementById("vid-data-default"),
    submit: document.getElementById("vid-data-submit"),
  }
};

// Getting started
// Paste Default
// gui.form.default.addEventListener("click", function() {
//   gui.form.input.value = JSON.stringify(VideoData[0], undefined, 2)
// })
// // Run Pasted Data
// gui.form.submit.addEventListener("click", function() {
//   VideoData[0] = JSON.parse(gui.form.input.value)
//   video.AddToPage()
//   gui.form.cont.classList.remove("show")
// })


// Don't display JSON paste overlay, just run from VideoData[0]
gui.form.cont.classList.remove("show")
window.addEventListener("load", function() {
  video.AddToPage(true)
})
