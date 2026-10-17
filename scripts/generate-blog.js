const fs = require('node:fs');
const path = require('node:path');
const { XMLBuilder, XMLParser, XMLValidator } = require('fast-xml-parser');

const siteRoot = path.resolve(__dirname, '..');
const siteOrigin = 'https://codemonkeyprojectiles.com';
const generatedNotice = 'Generated from blog/data/posts.json by npm run generate. Do not edit manually.';
const startMarker = '<!-- BEGIN GENERATED POST LINKS: ' + generatedNotice + ' -->';
const endMarker = '<!-- END GENERATED POST LINKS -->';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function validatePosts(posts, rootDirectory) {
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('posts.json must contain a nonempty array.');
  }

  const paths = new Set();
  for (const post of posts) {
    for (const field of ['title', 'date', 'path', 'excerpt', 'category']) {
      if (typeof post[field] !== 'string' || post[field].trim() === '') {
        throw new Error('Missing ' + field + ' for post ' + (post.path || '(unknown)'));
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)
      || Number.isNaN(Date.parse(post.date))
      || new Date(post.date).toISOString().slice(0, 10) !== post.date) {
      throw new Error('Invalid publication date: ' + post.date);
    }
    if (!/^\d{4}\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(post.path)
      || paths.has(post.path.toLowerCase())) {
      throw new Error('Invalid or duplicate post path: ' + post.path);
    }
    paths.add(post.path.toLowerCase());
    if (!fs.existsSync(path.join(rootDirectory, 'blog', post.path, 'index.html'))) {
      throw new Error('Missing post page: ' + post.path);
    }
  }
}

function buildXml(data) {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    indentBy: '  ',
  });
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!-- ' + generatedNotice + ' -->\n'
    + builder.build(data);
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error('Invalid generated XML: ' + validation.err.msg);
  }
  return xml;
}

function buildRss(posts) {
  const latestDate = posts.reduce((latest, post) => post.date > latest ? post.date : latest, posts[0].date);
  const feedDate = new Date(latestDate).toUTCString();
  const author = 'timothy@klenkeverse.com (Timothy Klenke)';
  return buildXml({
    rss: {
      '@_version': '2.0',
      channel: {
        title: 'Code Monkey Projectiles',
        link: siteOrigin + '/blog/',
        description: "Timothy Klenke's Blog",
        language: 'en-us',
        pubDate: feedDate,
        lastBuildDate: feedDate,
        ttl: 1440,
        docs: 'https://www.rssboard.org/rss-specification',
        managingEditor: author,
        webMaster: author,
        image: {
          url: siteOrigin + '/blog/img/monkey.jpg',
          title: 'Code Monkey Projectiles',
          link: siteOrigin + '/blog/',
        },
        item: posts.map((post) => ({
          title: post.title,
          link: siteOrigin + '/blog/' + post.path + '/',
          description: post.excerpt,
          pubDate: new Date(post.date).toUTCString(),
          category: post.category,
          guid: post.rssGuid || siteOrigin + '/blog/' + post.path,
          author,
        })),
      },
    },
  });
}

function buildSitemap(posts) {
  return buildXml({
    urlset: {
      '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
      url: [siteOrigin + '/', siteOrigin + '/blog/']
        .concat(posts.map((post) => siteOrigin + '/blog/' + post.path + '/'))
        .map((location) => ({ loc: location })),
    },
  });
}

function buildPostLinks(posts) {
  const years = new Map();
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push(post);
  }

  const lines = ['<ul>'];
  for (const year of [...years.keys()].sort()) {
    lines.push('  <li>' + year, '    <ul>');
    for (const post of years.get(year)) {
      const date = post.date.slice(5).replace('-', '/');
      lines.push('      <li>' + date + ' - <a href="/blog/' + escapeHtml(post.path)
        + '/">' + escapeHtml(post.title) + '</a></li>');
    }
    lines.push('    </ul>', '  </li>');
  }
  lines.push('</ul>');
  return lines.join('\n');
}

function updatePostLinks(html, posts) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end < start
    || html.indexOf(startMarker, start + 1) !== -1
    || html.indexOf(endMarker, end + 1) !== -1) {
    throw new Error('Expected exactly one generated post-links block in blog/index.html.');
  }
  const newline = html.includes('\r\n') ? '\r\n' : '\n';
  const indentation = html.slice(html.lastIndexOf('\n', start) + 1, start);
  const links = buildPostLinks(posts).split('\n').map((line) => indentation + line).join(newline);
  return html.slice(0, start + startMarker.length) + newline + links
    + newline + indentation + html.slice(end);
}

function verifyFeedIdentifiers(existingXml, posts) {
  const parser = new XMLParser();
  const channel = parser.parse(existingXml).rss.channel;
  const existingItems = channel.item ? [].concat(channel.item) : [];
  const identifiers = new Map(posts.map((post) => [
    siteOrigin + '/blog/' + post.path,
    post.rssGuid || siteOrigin + '/blog/' + post.path,
  ]));
  for (const item of existingItems) {
    const link = String(item.link).replace(/\/$/, '');
    if (identifiers.has(link) && String(item.guid) !== identifiers.get(link)) {
      throw new Error('RSS identifier would change for ' + link + '. Preserve it before generating.');
    }
  }
}

function generate(checkOnly) {
  const posts = JSON.parse(fs.readFileSync(path.join(siteRoot, 'blog/data/posts.json'), 'utf8'));
  validatePosts(posts, siteRoot);
  const rssPath = path.join(siteRoot, 'blog/data/rss.xml');
  if (fs.existsSync(rssPath)) {
    verifyFeedIdentifiers(fs.readFileSync(rssPath, 'utf8'), posts);
  }
  const indexPath = path.join(siteRoot, 'blog/index.html');
  const outputs = new Map([
    ['blog/data/rss.xml', buildRss(posts)],
    ['sitemap.xml', buildSitemap(posts)],
    ['blog/index.html', updatePostLinks(fs.readFileSync(indexPath, 'utf8'), posts)],
  ]);
  const changed = [];
  for (const [relativePath, content] of outputs) {
    const filePath = path.join(siteRoot, relativePath);
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== content) {
      changed.push(relativePath);
      if (!checkOnly) fs.writeFileSync(filePath, content, 'utf8');
    }
  }
  if (checkOnly && changed.length > 0) {
    throw new Error('Generated files are stale: ' + changed.join(', ') + '. Run npm run generate.');
  }
  console.log((checkOnly ? 'Checked' : 'Generated') + ' RSS, sitemap, and fallback links for ' + posts.length + ' posts.');
}

if (require.main === module) {
  try {
    generate(process.argv.includes('--check'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { buildRss, buildSitemap, buildPostLinks, updatePostLinks, validatePosts, verifyFeedIdentifiers, startMarker, endMarker };