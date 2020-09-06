async function getPosts() {
  const response = await fetch(root() + '/data/posts.json');
  return await response.json();
}

getPosts().then((posts) => buildTableOfContents(posts));

const categoryBuilder = {
  getGroup: (post) => post.category,
  name: 'category',
  showCategory: false,
};

const yearBuilder = {
  getGroup: (post) => new Date(post.date).getUTCFullYear().toString(),
  name: 'year',
  showCategory: true,
};

let mostRecentPost;
let activePost;

function buildTableOfContents(posts) {
  mostRecentPost = posts[posts.length - 1];
  activePost = findActivePost(posts);

  navbarPartial();
  titlePartial(posts);
  footerPartial();

  postsTablePartial(categoryBuilder, posts);
  postsTablePartial(yearBuilder, posts);
}

function findActivePost(posts) {
  var matches = posts.filter((x) =>
    document.location.pathname.includes(x.path)
  );
  return matches.length == 1 ? matches[0] : null;
}

function navbarPartial() {
  const navbar = document.querySelector('nav');
  navbar.innerHTML = '';
  navbar.appendChild(buildNavbar());
}

function buildNavbar() {
  const navbar = document.createElement('div');
  navbar.classList.add('container');
  navbar.innerHTML = `<div class="navbar-brand">
    <a href="${root()}"
      ><img
        src="${root()}/img/monkey.jpg"
        alt="logo"
        class="rounded-circle"
        height="90"
    /></a>
    <a href="${root()}"
      ><h3 class="d-inline align-middle pl-2">
        Code Monkey Projectiles
      </h3></a
    >
  </div>
  <div>
    <small>A blog by <a href="${root()}/..">Timothy Klenke</a></small>
  </div>`;

  return navbar;
}

function footerPartial() {
  const navbar = document.querySelector('footer');
  navbar.innerHTML = '';
  navbar.appendChild(buildFooter());
}

function buildFooter() {
  const footer = document.createElement('div');
  footer.classList.add('container');

  footer.innerHTML = `<div class="row">
  <div class="col">
    <a href="${root()}">
      Code Monkey Projectiles
    </a>
    <br />
    <small>by <a href="${root()}/..">Timothy Klenke</a></small>
  </div>
  </div>`;

  if (activePost === null) return footer;

  const row = footer.querySelector('.row');

  var share = document.createElement('div');
  share.classList.add('col-md-5', 'mb-3');
  share.innerHTML = `<span class="align-middle">Share</span>
  <span class="align-middle p-3">
    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(
      document.URL
    )}&text=${encodeURIComponent(
    activePost.title
  )}"><i class="fab fa-twitter fa-2x"></i></a>
  </span>
  <span class="align-middle p-3">
    <a href="http://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
      document.URL
    )}&title=${encodeURIComponent(
    activePost.title
  )}"><i class="fab fa-linkedin fa-2x"></i></a>
  </span>
  <span class="align-middle p-3">
  <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    document.URL
  )}"><i class="fab fa-facebook fa-2x"></i></a>
  </span>
  `;

  // row.appendChild(share);
  row.insertBefore(share, row.firstChild);

  return footer;
}

function titlePartial(posts) {
  if (activePost === null) return;

  document.getElementById('Title-Header').remove();

  const main = document.querySelector('main');
  safeInsertBefore(buildTitle(posts), main);
  safeInsertBefore(buildCodeLink(), main);
  safeAppendChild(buildPartNav(posts), main.parentElement);
}

function safeInsertBefore(newNode, target) {
  if (newNode === null) return;

  target.parentElement.insertBefore(newNode, target);
}

function safeAppendChild(newNode, target) {
  if (newNode === null) return;

  target.appendChild(newNode);
}

function buildTitle(posts) {
  const section = document.createElement('section');
  section.id = 'Title-Header';

  section.innerHTML = `            <div class="row">
  <div class="col-md" id="Title">
    <h1>${activePost.title}</h1>
  </div>

  <div class="col-md-3 text-right">
    <span id="Category" class="badge badge-secondary badge-pill"
      >${activePost.category}</span
    >
    <br />
    <span id="Date" class="text-muted">${activePost.date}</span>
  </div>
</div>`;

  safeAppendChild(buildPartNav(posts), section.querySelector('#Title'));

  return section;
}

function buildPartNav(posts) {
  if (activePost.parentKey === undefined) {
    return null;
  }

  const nav = document.createElement('nav');
  nav.classList.add('small');

  const parts = posts.filter((post) => post.parentKey === activePost.parentKey);
  nav.appendChild(buildPartNavList(parts));

  return nav;
}

function buildPartNavList(posts) {
  const list = document.createElement('ul');
  list.classList.add('pagination');

  list.innerHTML =
    '<li class="page-item disabled"><a class="page-link">Part</a></li>';
  for (const post of posts) {
    const item = document.createElement('li');
    item.classList.add('page-item');
    if (post === activePost) {
      item.classList.add('active');
    }

    const link = document.createElement('a');
    link.href = root() + post.path;
    link.classList.add('page-link');
    link.innerText = post.part;
    item.appendChild(link);

    list.appendChild(item);
  }

  return list;
}

function buildCodeLink() {
  if (activePost.codeUrl === undefined) return null;

  const button = document.createElement('a');
  button.classList.add('mb-4', 'btn', 'btn-outline-primary');
  button.href = activePost.codeUrl;

  // button.innerHTML = `<a href="${activePost.codeUrl}"><span class="align-middle"><i class="fab fa-github fa-2x"></i></span></a>
  // <a href="${activePost.codeUrl}"><span class="align-middle">Show me the code!</span></a>`;
  button.innerHTML = `<i class="fab fa-github"></i> Show me the code!`;

  return button;
}

function postsTablePartial(builder, posts) {
  var table = document.createElement('div');
  table.id = 'toc-' + builder.name;

  var groups = posts
    .map((post) => builder.getGroup(post))
    .filter(distinct)
    .sort();

  for (const group of groups) {
    const card = buildCard(
      builder,
      group,
      posts.filter((post) => builder.getGroup(post) === group)
    );
    table.appendChild(card);
  }

  var og = document.getElementById(table.id);
  og.parentElement.replaceChild(table, og);
}

function buildCard(builder, group, posts) {
  const card = document.createElement('div');
  card.classList.add('card');

  card.appendChild(buildCardHeader(builder, group, posts.length));
  card.appendChild(buildCardBody(builder, group, posts));

  return card;
}

function buildCardHeader(builder, group, count) {
  const header = document.createElement('div');
  header.classList.add('card-header', 'bg-dark', 'text-white', 'p-2');

  header.innerHTML = `<h6 class="m-0">
  <div
    href="#${builder.name}-${group.toLowerCase().replace(' ', '-')}"
    data-toggle="collapse"
    data-parent="#toc-${builder.name}"
    class="d-flex justify-content-between align-items-center"
  >
    ${group}
    <span class="badge badge-danger badge-pill">${count}</span>
  </div>
</h6>
`;

  return header;
}

function buildCardBody(builder, group, posts) {
  const categoryId = document.createElement('div');
  categoryId.id = builder.name + '-' + group.toLowerCase().replace(' ', '-');
  categoryId.classList.add('collapse');
  if (posts.includes(activePost ?? mostRecentPost)) {
    categoryId.classList.add('show');
  }

  const body = document.createElement('div');
  body.classList.add('card-body', 'p-0');
  categoryId.appendChild(body);

  const list = document.createElement('div');
  list.classList.add('list-group');
  body.appendChild(list);

  for (const post of posts) {
    list.appendChild(buildPostListItem(builder, post));
  }

  return categoryId;
}

function buildPostListItem(builder, post) {
  const link = document.createElement('a');
  link.href = root() + post.path;
  link.title = post.excerpt;
  link.classList.add('list-group-item', 'list-group-item-action', 'p-2');
  if (post === activePost) {
    link.classList.add('active');
  }

  let codeBadge = '';
  if (post.codeUrl !== undefined) {
    codeBadge = '<i class="fab fa-github"></i>';
  }

  let mostRecentBadge = '';
  if (mostRecentPost === post) {
    mostRecentBadge =
      '<span class="badge badge-warning badge-pill">Most Recent</span>';
  }

  let categoryBadge = '';
  if (builder.showCategory) {
    categoryBadge = `<span class="badge badge-secondary badge-pill">${post.category}</span>`;
  }

  link.innerHTML = `${post.title} 
  <p class="d-flex justify-content-between align-items-center mb-0">
  <span>
    <small class="${post !== activePost ? 'text-muted' : ''}">${
    post.date
  }</small>
  </span>
  <span>
    ${codeBadge}
    ${mostRecentBadge}
    ${categoryBadge}
  </span>
  </p>`;

  return link;
}

function distinct(value, index, self) {
  return self.indexOf(value) === index;
}

function root() {
  const depth = document.location.pathname.split('/').length - 3;
  let result = '';
  for (let i = 0; i < depth; i++) {
    result += '../';
  }
  return result === '' ? '.' : result;
}
