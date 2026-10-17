const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { XMLParser, XMLValidator } = require('fast-xml-parser');
const {
  buildRss,
  buildSitemap,
  buildPostLinks,
  updatePostLinks,
  validatePosts,
  verifyFeedIdentifiers,
  startMarker,
  endMarker,
} = require('./generate-blog');

const post = {
  title: 'Code & "Design" <Guide>',
  date: '2026-10-17',
  path: '2026/Example',
  category: 'Design & Quality',
  excerpt: 'Use <strong> names & clear "boundaries".',
};
const parser = new XMLParser();

test('RSS round-trips metadata and keeps stable identifiers', () => {
  const xml = buildRss([post]);
  assert.equal(XMLValidator.validate(xml), true);
  const channel = parser.parse(xml).rss.channel;
  assert.equal(channel.item.title, post.title);
  assert.equal(channel.item.description, post.excerpt);
  assert.equal(channel.item.category, post.category);
  assert.equal(channel.item.link, 'https://codemonkeyprojectiles.com/blog/2026/Example/');
  assert.equal(channel.item.guid, 'https://codemonkeyprojectiles.com/blog/2026/Example');
  assert.equal(channel.item.pubDate, 'Sat, 17 Oct 2026 00:00:00 GMT');
  assert.equal(channel.lastBuildDate, channel.item.pubDate);
  assert.equal(buildRss([post]), xml);
  assert.match(xml, /Do not edit manually/);
});

test('historical RSS GUIDs are preserved and accidental changes fail', () => {
  const historicalPost = { ...post, rssGuid: 'https://codemonkeyprojectiles.com/blog/old-path' };
  const xml = buildRss([historicalPost]);
  assert.equal(parser.parse(xml).rss.channel.item.guid, historicalPost.rssGuid);
  assert.doesNotThrow(() => verifyFeedIdentifiers(xml, [historicalPost]));
  assert.throws(() => verifyFeedIdentifiers(xml, [post]), /identifier would change/);
});

test('feed date uses the newest post rather than the current build time', () => {
  const olderPost = { ...post, path: '2025/Older', date: '2025-01-01' };
  const channel = parser.parse(buildRss([post, olderPost])).rss.channel;
  assert.equal(channel.lastBuildDate, 'Sat, 17 Oct 2026 00:00:00 GMT');
});

test('sitemap includes public pages and posts, not templates or filters', () => {
  const xml = buildSitemap([post]);
  assert.equal(XMLValidator.validate(xml), true);
  assert.deepEqual(parser.parse(xml).urlset.url.map((entry) => entry.loc), [
    'https://codemonkeyprojectiles.com/',
    'https://codemonkeyprojectiles.com/blog/',
    'https://codemonkeyprojectiles.com/blog/2026/Example/',
  ]);
  assert.match(xml, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  assert.match(xml, /Do not edit manually/);
});

test('fallback links escape HTML and use correctly nested year lists', () => {
  const html = buildPostLinks([post]);
  assert.match(html, /<li>2026\n    <ul>/);
  assert.match(html, /10\/17 - <a href="\/blog\/2026\/Example\/">/);
  assert.match(html, /Code &amp; &quot;Design&quot; &lt;Guide&gt;/);
});

test('fallback replacement preserves surrounding HTML and CRLF line endings', () => {
  const before = '<head>Keep this</head>\r\n  ' + startMarker + '\r\nold list\r\n  '
    + endMarker + '\r\n<footer>Keep this too</footer>';
  const updated = updatePostLinks(before, [post]);
  assert.ok(updated.startsWith('<head>Keep this</head>\r\n  ' + startMarker));
  assert.ok(updated.endsWith(endMarker + '\r\n<footer>Keep this too</footer>'));
  assert.equal(updated.includes('old list'), false);
  assert.equal(updated.replace(/\r\n/g, '').includes('\n'), false);
  assert.equal(updatePostLinks(updated, [post]), updated);
});

test('missing or repeated generated markers are rejected', () => {
  assert.throws(() => updatePostLinks('<html></html>', [post]), /exactly one/);
  assert.throws(() => updatePostLinks(startMarker + startMarker + endMarker, [post]), /exactly one/);
  assert.throws(() => updatePostLinks(startMarker + endMarker + endMarker, [post]), /exactly one/);
});

test('post validation catches invalid metadata before generating files', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-generator-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const postDirectory = path.join(directory, 'blog', post.path);
  fs.mkdirSync(postDirectory, { recursive: true });
  fs.writeFileSync(path.join(postDirectory, 'index.html'), '<main>Example</main>');
  assert.doesNotThrow(() => validatePosts([post], directory));
  assert.throws(() => validatePosts([], directory), /nonempty/);
  assert.throws(() => validatePosts([{ ...post, title: '' }], directory), /Missing title/);
  assert.throws(() => validatePosts([{ ...post, date: '2026-02-30' }], directory), /Invalid publication date/);
  assert.throws(() => validatePosts([post, post], directory), /duplicate post path/);
  assert.throws(() => validatePosts([{ ...post, path: '2026/../Example' }], directory), /Invalid or duplicate/);
  assert.throws(() => validatePosts([{ ...post, path: '2026/Missing' }], directory), /Missing post page/);
});