$(document).ready(function () {
  $('main').scrollspy({ target: '#nav-toolbar' });

  //scrollspy events are raised on window instead of #nav-toolbar
  //https://stackoverflow.com/questions/48693913/bootstrap-4-activate-bs-scrollspy-event-is-not-firing
  $(window).on('activate.bs.scrollspy', function () {
    var activeChild = document.querySelector(
      '#nav-toolbar li.btn-child a.active'
    );

    if (activeChild === null) {
      $('#nav-toolbar li.btn-parent').show();
      $('#nav-toolbar li.btn-child').hide();
      return;
    }

    var groups = ['btn-ui', 'btn-bus', 'btn-data', 'btn-db'];
    var activeGroup;
    for (group of groups)
      if (activeChild.parentElement.classList.contains(group)) {
        $('#nav-toolbar li.btn-parent.' + group).hide();
        $('#nav-toolbar li.btn-child.' + group).show();
      } else {
        $('#nav-toolbar li.btn-parent.' + group).show();
        $('#nav-toolbar li.btn-child.' + group).hide();
      }
  });
});

// Smooth Scrolling
$('#nav-toolbar a').on('click', function (event) {
  if (this.hash !== '') {
    event.preventDefault();
    // event.stopPropagation();
    const hash = this.hash;

    $('main').animate(
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
