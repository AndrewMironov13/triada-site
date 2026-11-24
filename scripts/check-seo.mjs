// Release check against built files, before uploading an indexable client site.
import {readFileSync, existsSync} from 'node:fs'
import {resolve} from 'node:path'
import assert from 'node:assert/strict'
const primary = process.argv[2]
assert(primary, 'Usage: node scripts/check-seo.mjs https://primary-domain/')
const site=new URL(primary).href
assert.equal(new URL(site).protocol,'https:')
assert.equal(new URL(site).pathname,'/')
const root=resolve(process.argv[3] || 'dist')
const html=readFileSync(resolve(root,'index.html'),'utf8')
const robots=readFileSync(resolve(root,'robots.txt'),'utf8')
const sitemap=readFileSync(resolve(root,'sitemap.xml'),'utf8')
assert(!/%[A-Z_]+%/.test(html),'Unresolved template token')
assert(!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html),'Homepage still noindex')
assert(!/Disallow:\s*\//.test(robots),'Robots still blocks site')
assert(html.includes(`<link rel="canonical" href="${site}">`),'Canonical differs from primary domain')
assert(html.includes(`<meta property="og:url" content="${site}">`),'OG URL differs from primary domain')
assert(robots.includes(`Sitemap: ${site}sitemap.xml`),'Robots references wrong sitemap')
assert(sitemap.includes(`<loc>${site}</loc>`),'Sitemap has wrong domain')
assert.equal((sitemap.match(/<loc>/g)||[]).length,1,'Review sitemap inventory: one marketing URL is expected')
const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
const org=graph.find(x=>x['@type']==='Organization')
assert.equal(org.url,site)
assert.equal(org.hasOfferCatalog.itemListElement.length,9)
const centers=graph.filter(x=>x['@type']==='AutoRepair')
assert.equal(centers.length,2)
for(const center of centers){
 assert(center.address.streetAddress && center.address.addressLocality==='Саратов')
 assert(center.telephone && center.openingHoursSpecification.length)
 assert.equal(center.parentOrganization['@id'],org['@id'])
}
assert(!html.includes('aggregateRating'),'No self-serving review markup expected')
assert.equal((html.match(/<h1\b/g)||[]).length,1,'Review primary heading')
assert(/<title>[^<]*Саратов[^<]*<\/title>/.test(html),'Title must describe local market')
assert(!html.includes('triada.example'),'Placeholder domain remains')
assert(!html.includes('andrewmironov13.github.io'),'Demo domain remains')
for(const path of ['politika/index.html','404.html','og.jpg','favicon.svg','media/hero/mazda-studio.webp'])assert(existsSync(resolve(root,path)),`Missing ${path}`)
for(const image of html.matchAll(/<img\b[^>]*>/g))assert(/\balt=/.test(image[0]),'Image missing alt attribute')
assert(/name="robots" content="noindex/.test(readFileSync(resolve(root,'404.html'),'utf8')))
console.log('SEO release checks passed: primary URL, index controls, sitemap, headings, structured data and required files')
