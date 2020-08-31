console.log('Hello');

async function getPosts() {
  const response = await fetch('../../../data/posts.json');
  var data = await response.json();
  return data;
}

const posts = getPosts();
console.log(posts);

const toc = document.getElementById('toc');
const list = document.createElement('ul');
toc.innerHTML = '';
toc.appendChild(list);

posts.forEach((post) => {
  let item = document.createElement('li');
  item.innerText = post.title;
  //   list.appendChild(item);
  console.log(post.title);
});
