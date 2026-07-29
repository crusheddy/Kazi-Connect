/* One-off: Kazi Connect is pre-launch with no client engagements yet.
   The Results page presented illustrative case studies as delivered
   outcomes, so it is removed entirely along with every link to it.
   Run from the project root:  node remove-results.js */
const fs = require('fs');

const pages = ['index.html','services.html','software.html','sectors.html',
               'about.html','contact.html','legal.html','investor.html'];

let navRemoved = 0, crossRemoved = 0;
for (const p of pages) {
  const file = 'site/' + p;
  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  // 1. nav + footer list items pointing at the results page
  src = src.replace(/^[ \t]*<li><a href="results\.html">Results<\/a><\/li>\r?\n/gm, () => {
    navRemoved++; return '';
  });

  // 2. "read more" crosslink cards pointing at the results page
  src = src.replace(/[ \t]*<a class="crosslink reveal" href="results\.html">[\s\S]*?<\/a>\r?\n/g, () => {
    crossRemoved++; return '';
  });

  if (src !== before) { fs.writeFileSync(file, src); console.log('cleaned  ' + file); }
  else console.log('no change ' + file);
}

if (fs.existsSync('site/results.html')) {
  fs.unlinkSync('site/results.html');
  console.log('\ndeleted  site/results.html');
}
console.log(`removed ${navRemoved} nav/footer links, ${crossRemoved} crosslink cards`);
