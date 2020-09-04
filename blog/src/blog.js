async function getPosts() {
  const response = await fetch('../../../data/posts.json');
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

  const toc = document.getElementById('toc');
  toc.innerHTML = '';

  toc.appendChild(buildPostsTable(categoryBuilder, posts));
  toc.appendChild(buildPostsTable(yearBuilder, posts));
}

function findActivePost(posts) {
  var matches = posts.filter((x) =>
    document.location.pathname.includes(x.path)
  );
  return matches.length == 1 ? matches[0] : null;
}

function buildPostsTable(builder, posts) {
  var table = document.createElement('div');
  table.id = 'toc-' + builder.name;
  table.classList.add('my-5');

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

  return table;
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
    <span class="badge badge-primary badge-pill">${count}</span>
  </div>
</h6>
`;

  return header;
}

function buildCardBody(builder, group, posts) {
  const categoryId = document.createElement('div');
  categoryId.id = builder.name + '-' + group.toLowerCase().replace(' ', '-');
  categoryId.classList.add('collapse');
  if (posts.includes(activePost)) {
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
  link.classList.add('list-group-item', 'list-group-item-action', 'p-2');
  if (post === activePost) {
    link.classList.add('active');
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
  return result;
}
