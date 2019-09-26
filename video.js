var VideoData = [
  {
    "url": [
      ["mp4","./video/bbb.mp4"]
    ],
    "valence": {
      "system": {
        "time": [
          0,
          1.42,
          3.58,
          5.68,
          8.19,
          10.026667
        ],
        "rating": [
          3,
          4,
          1,
          3,
          5,
          5
        ]
      },
      "user": {
        "time": [],
        "rating": []
      }
    }
  }
]

var Video = {

  // Container key for all videos
  store: [],

  // Insert video(s) into page, store references
  AddToPage: function() {

    // Loop through VideoData array
    var i = 0
    var vLen = VideoData.length 
    for (i; i<vLen; i++) {

      // Create obj storage reference
      let ref = {}
      ref.data = VideoData[i]
      ref.dom = {}

      // Create DOM for video
      let vNode = gui.template.template.cloneNode(true)
      vNode.className = 'container-vid' // add class needed by JS
      // Add video to page
      gui.template.holder.appendChild(vNode)

      // Store dom references
      ref.dom.container = gui.template.holder.getElementsByClassName('container-vid')[i]
      ref.dom.video = ref.dom.container.getElementsByTagName('video')[0]
      ref.dom.timeline = ref.dom.container.getElementsByClassName('timeline')[0]
      ref.dom.tlBar = ref.dom.container.getElementsByClassName('timeline-bar')[0]
      ref.dom.tlHover = ref.dom.container.getElementsByClassName('timeline-hover')[0]
      ref.dom.btnPlay = ref.dom.container.getElementsByClassName('vid-btn-play')[0]
      ref.dom.coverPlay = ref.dom.container.getElementsByClassName('vid-cover-play')[0]
      ref.dom.coverLoading = ref.dom.container.getElementsByClassName('vid-cover-loading')[0]
      ref.dom.btnVol = ref.dom.container.getElementsByClassName('vid-btn-vol')[0]

      // (Note) temporary -- mute video for sanity
      ref.dom.video.muted = true

      // Add video tag sources, urls, append in DOM
      for (var j=0; j<ref.data.url.length; j++) {
        let src = document.createElement('source')
        src.type = 'video/' + ref.data.url[j][0]
        src.src = ref.data.url[j][1]
        ref.dom.video.appendChild(src)
      }

      // Create player prototype for video
      ;(function(index, reference) {
        ref.player = new player(reference)
        ref.rating = new rating(index, reference)
      })(i, ref)
      Video.store.push(ref)

      // When ready, Grab values, add ctrl & video events, and del listener
      var canPlayListener = (function(vid) {
        vid.player.InitEventsAndData()
        vid.dom.video.removeEventListener("canplay", canPlayListener)
      })(ref)
      ref.dom.video.addEventListener("canplay", canPlayListener)

      // Setup rating
      Video.store[i].rating.Init()

    } // End loop

  }

}

// Getting started
// Paste Default
// gui.form.cont.classList.add("show")
// gui.form.default.addEventListener("click", function() {
//   gui.form.input.value = JSON.stringify(VideoData[0], undefined, 2)
// })
// // Run Pasted Data
// gui.form.submit.addEventListener("click", function() {
//   VideoData[0] = JSON.parse(gui.form.input.value)
//   Video.AddToPage()
//   gui.form.cont.classList.remove("show")
// })


// Don't display JSON paste overlay, just run from VideoData[0]
window.addEventListener("load", function() {
  Video.AddToPage()
})
