const gui = {

  template: {
    template: document.getElementById('vid-template'),
    holder: document.getElementById('vid-holder')
  },

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

}