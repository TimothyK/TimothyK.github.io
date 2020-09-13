$('body').scrollspy({ target: '#nav-toolbar' });

// Smooth Scrolling
$('#nav-toolbar a').on('click', function (event) {
  if (this.hash !== '') {
    // event.preventDefault();
    event.stopPropagation();

    const hash = this.hash;

    $('html, body').animate(
      {
        scrollTop: $(hash).offset().top,
      },
      'fast',
      function () {
        window.location.hash = hash;
      }
    );
  }
});
