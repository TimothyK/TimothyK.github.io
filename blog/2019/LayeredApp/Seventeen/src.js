function scrollToDiv(id) {
  if (id[0] !== '#') {
    id = '#' + id;
  }
  $('html,body')
    .unbind()
    .animate({ scrollTop: $(id).offset().top - 40 }, 'fast');
}
