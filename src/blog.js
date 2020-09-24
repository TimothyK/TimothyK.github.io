async function getPosts() {
  const response = await fetch('blog/data/posts.json');
  return await response.json();
}

getPosts().then((posts) => buildMostRecent(posts.slice(-3)));

function buildMostRecent(posts) {
  var container = document.getElementById('most-recent-posts');
  var mostRecent = posts[posts.length - 1];

  for (const post of posts.reverse()) {
    const card = buildCard(post, post === mostRecent);
    container.appendChild(card);
  }
}

function buildCard(post, isMostRecent) {
  const card = document.createElement('div');
  card.classList.add('card', 'bg-dark', 'border-light');

  let codeBadge = '';
  if (post.codeUrl !== undefined) {
    codeBadge = '<i class="fab fa-github"></i>';
  }

  let downloadBadge = '';
  if (post.downloadUrl !== undefined) {
    downloadBadge = '<i class="fas fa-download"></i>';
  }

  let mostRecentBadge = '';
  if (isMostRecent) {
    mostRecentBadge =
      '<span class="badge badge-warning badge-pill">Most Recent</span>';
  }

  card.innerHTML = `
  <div class="card-header">
    <h3>
      <a href="blog/${post.path}">
        ${post.title}
      </a>
    </h3>
    <div class="d-flex flex-wrap">
      <span class="text-muted">${post.date}</span>
      <span class="ml-auto">
        ${codeBadge}
        ${downloadBadge}
        ${mostRecentBadge}
        <span class="badge badge-success badge-pill">
          ${post.category}
        </span>
      </span>
    </div>
  </div>
  <div class="card-body py-2">
    <p class="mb-0">
      ${post.excerpt}
    </p>
  </div>
  <div class="card-footer text-right">
    <a class="mt-5" href="blog/${post.path}">Read More...</a>
  </div>
  `;
  return card;
}

/*
  <div class="card bg-dark border-light">
  <div class="card-header">
    <h3>
      <a href="blog/2019/LayeredApp/Seventeen/">
        The 17-Layered App
      </a>
    </h3>
    <span class="text-muted">2019-07-30</span>
    <span class="badge badge-success badge-pill">
      Design Patterns
    </span>
    <span class="badge badge-warning badge-pill"> Most Recent </span>
  </div>
  <div class="card-body">
    <p class="mt-3">
      In this post, I will dive down deeper into the layers and see
      exactly how these could fit together. Each high-level layer is
      implemented by smaller focused layers, making 17 in all, at
      least in this example.
    </p>
  </div>
  <div class="card-footer text-right">
    <a class="mt-5" href="blog/">Read More...</a>
  </div>
</div>

  */
