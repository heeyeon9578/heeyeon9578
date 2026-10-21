import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const output = fileURLToPath(new URL('../assets/doodle-garden.svg', import.meta.url));
const owner = process.env.GARDEN_USER || 'heeyeon9578';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fixture = process.argv.includes('--preview');
let count = null;
let updated = '';
if (fixture) { count = 37; updated = 'PREVIEW'; }
else if (process.env.GITHUB_TOKEN) {
  const now = new Date();
  const from = new Date(now); from.setUTCDate(from.getUTCDate() - 29); from.setUTCHours(0,0,0,0);
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST', headers: {Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({query: `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions}}}}`, variables:{login:owner,from:from.toISOString(),to:now.toISOString()}}),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
  const body = await response.json();
  if (body.errors) throw new Error(body.errors.map(e=>e.message).join('; '));
  count = body.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions;
  if (!Number.isInteger(count) || count < 0) throw new Error('Missing contribution count');
  updated = now.toISOString().slice(0,10);
} else {
  // Local initialization has no invented activity data.
  console.log('No token: creating the initial garden without activity statistics.');
}
const flowers = count === null ? 3 : Math.min(18, 3 + Math.floor(count/5));
let plants = '';
for(let i=0;i<flowers;i++){
 const x=48+(i*101)%580, y=200+(i*37)%74;
 const color=['#e9a3b3','#e9c578','#aca4d4'][i%3];
 plants+=`<g transform="translate(${x} ${y})"><path d="M0 0v14m0-3q-11-10-12-1m12-3q10-10 12-1" fill="none" stroke="#769a75" stroke-width="2.5" stroke-linecap="round"/><g fill="${color}"><circle cy="-5" r="5"/><circle cx="5" r="5"/><circle cy="5" r="5"/><circle cx="-5" r="5"/></g><circle r="3" fill="#fff0bc"/></g>`;
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="340" viewBox="0 0 720 340" role="img" aria-labelledby="title desc">
<title id="title">${escape(owner)}'s Doodle Garden</title><desc id="desc">An animated hand-drawn cat wanders through a garden. ${count===null?'Waiting for the first GitHub activity update.':`${count} contributions in the last 30 days. Flowers appear for every five contributions, up to eighteen.`}</desc>
<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#f8eee4"/><stop offset="1" stop-color="#fdf6ed"/></linearGradient></defs>
<rect x="1" y="1" width="718" height="338" rx="24" fill="url(#sky)" stroke="#e6d9cb"/>
<g font-family="Verdana, sans-serif" fill="#66564c"><text x="32" y="39" font-size="12" letter-spacing="3">DOODLE GARDEN</text><text x="32" y="63" font-size="13">@${escape(owner)}</text></g>
<g fill="#fffaf4"><path d="M410 86q-2-15 15-15 9-22 27-6 21-2 22 21Z"/><path d="M550 113q-2-13 11-13 9-17 23-6 15-1 18 19Z"/></g>
<circle cx="636" cy="62" r="21" fill="#edcc91"/><circle cx="630" cy="58" r="2" fill="#af8e60"/><circle cx="642" cy="58" r="2" fill="#af8e60"/><path d="M632 67q4 4 8 0" fill="none" stroke="#af8e60" stroke-width="1.5"/>
<path d="M2 186Q170 145 350 188T718 176V315Q718 339 694 339H26Q2 339 2 315Z" fill="#dce6cf"/>
<path d="M2 241Q190 220 344 245T718 231V315Q718 339 694 339H26Q2 339 2 315Z" fill="#c7d7b9"/>
<path d="M146 273Q280 222 490 270" fill="none" stroke="#eae1c9" stroke-width="20" stroke-linecap="round"/>
${plants}
<g transform="translate(280 150)"><animateTransform attributeName="transform" type="translate" values="280 150;370 156;330 151;200 156;280 150" dur="24s" repeatCount="indefinite"/>
<ellipse cx="51" cy="100" rx="34" ry="5" fill="#829572" opacity=".25"/>
<g><animateTransform attributeName="transform" type="rotate" values="-3 50 100;3 50 100;-3 50 100" dur="1.1s" repeatCount="indefinite"/>
<path d="M20 89C5 75 13 41 26 33L24 9Q25 2 34 10L49 24Q60 21 70 26L86 10Q94 5 92 15L89 36C105 52 109 79 95 90Q89 100 73 97L65 101 48 99Q31 102 20 89Z" fill="#f6e7c9" stroke="#5c4b40" stroke-width="2.8" stroke-linejoin="round"/>
<g stroke="#5c4b40" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M38 55v6m34-6v6m-22 8q6 7 12 0"/></g><ellipse cx="29" cy="68" rx="7" ry="3.5" fill="#eaa9a1"/><ellipse cx="82" cy="68" rx="7" ry="3.5" fill="#eaa9a1"/>
</g></g>
<g font-family="Verdana, sans-serif" fill="#53644d"><text x="32" y="309" font-size="12">${count===null?'A little friend is settling in.':`${count} contributions / last 30 days`}</text><text x="688" y="309" text-anchor="end" font-size="10">${count===null?'First update pending':`${flowers} flowers · ${updated}`}</text></g>
</svg>`;
if (process.argv.includes('--check')) {
  if (!svg.includes('repeatCount="indefinite"') || flowers<3 || flowers>18 || /NaN|undefined/.test(svg)) throw new Error('Invalid garden');
  console.log(`Garden check passed: ${flowers} flowers.`);
} else { await writeFile(output, svg); console.log(`Wrote garden: ${count ?? 'pending'} contributions, ${flowers} flowers.`); }
