import {readFileSync as read, writeFileSync as write, mkdirSync} from 'node:fs';

const origin='https://emmanuelkm.netlify.app';
const data=JSON.parse(read('content/portfolio.json','utf8'));
const name=data.hero?.name||'Emmanuel Kamal Muhammed';
const photo=data.hero?.photo||'/content/uploads/img_3716-1.jpg';
const urls=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const absolute=value=>{
  try {
    const u=new URL(value,origin);
    return /^https?:$/.test(u.protocol)?u.href:'';
  } catch { return ''; }
};
const short=value=>String(value||'').replace(/\s+/g,' ').trim().slice(0,180);

function metadata(html,title,description,path,image,type='website'){
  html=html.replace(/<!-- seo-v1:start -->[\s\S]*?<!-- seo-v1:end -->/g,'');
  html=html.replace(/<title>[\s\S]*?<\/title>/gi,'');
  html=html.replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi,'');
  html=html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,'');

  const meta=(key,value)=>
    `<meta ${key.startsWith('og:')?'property':'name'}="${key}" content="${esc(value)}">`;

  const tags=[
    `<title>${esc(title)}</title>`,
    meta('description',short(description)),
    `<link rel="canonical" href="${esc(origin+path)}">`,
    meta('og:type',type),
    meta('og:site_name','EmmanuelKM'),
    meta('og:title',title),
    meta('og:description',short(description)),
    meta('og:url',origin+path),
    meta('twitter:card','summary_large_image'),
    meta('twitter:title',title),
    meta('twitter:description',short(description))
  ];

  if(image){
    tags.push(
      meta('og:image',absolute(image)),
      meta('og:image:alt',title),
      meta('twitter:image',absolute(image)),
      meta('twitter:image:alt',title)
    );
  }

  const block='\n<!-- seo-v1:start -->\n'+tags.join('\n')+
    '\n<!-- seo-v1:end -->\n';
  if(!/<meta\s+charset=[^>]+>/i.test(html))throw Error('Missing charset');
  return html.replace(/<meta\s+charset=[^>]+>/i,m=>m+block);
}

for(const [file,path,title,description] of [
  ['index.html','/',name+' | UI/UX Designer & Web Developer',data.hero?.role],
  ['about.html','/about','About '+name+' | EmmanuelKM',
   'Meet Emmanuel, a UI/UX designer, web developer and creative based in Jos, Nigeria. Explore his skills, experience and design journey.'],
  ['playground.html','/playground','Graphic Design & Creative Explorations | EmmanuelKM',
   'Explore flyer designs, graphics and visual experiments by Emmanuel, a designer based in Jos, Nigeria.']
]){
  let html=metadata(read(file,'utf8'),title,description,path,photo);
  if(file==='index.html'){
    html=html.replace(
      'document.title = h.name;',
      '/* Page title is generated at build time. */'
    );
  }
  write(file,html);
  urls.push(origin+path);
}

const template=read('project.html','utf8');
const items=(data.work?.items||[]).filter(p=>p.published!==false);
const seen=new Set();
mkdirSync('projects',{recursive:true});

for(const item of items){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)||seen.has(item.slug)){
    throw Error('Invalid or duplicate project slug: '+item.slug);
  }
  seen.add(item.slug);

  const study=item.caseStudy||{};
  const path='/projects/'+item.slug;
  let html=metadata(
    template,item.title+' | EmmanuelKM',
    study.summary||item.description,
    path,study.cover||item.image||photo,'article'
  );

  html=html.replace(
    '<html lang="en">',
    `<html lang="en" data-project="${esc(item.slug)}">`
  );
  html=html.replace(
    '<article id="caseArticle" hidden>',
    '<article id="caseArticle">'
  );
  html=html.replace(
    '<p id="caseStatus" role="status">Loading project…</p>',
    '<p id="caseStatus" role="status" hidden></p>'
  );

  const fill=(id,value)=>{
    const pattern=new RegExp(
      '(<([a-z0-9]+)\\b[^>]*id="'+id+'"[^>]*>)[\\s\\S]*?(</\\2>)'
    );
    if(!pattern.test(html))throw Error('Missing project element: '+id);
    html=html.replace(pattern,(_,open,tag,close)=>open+value+close);
  };

  fill('caseTitle',esc(item.title));
  fill('caseIntro',esc(study.summary||item.description||''));
  fill('caseCategory',esc(item.category||'Selected work'));

  const figure=p=>p.image&&absolute(p.image)?
    `<figure><a href="${esc(absolute(p.image))}" target="_blank" rel="noopener noreferrer"><img src="${esc(absolute(p.image))}" alt="${esc(p.alt||p.caption||item.title+' design preview')}" loading="lazy" decoding="async"></a>${p.caption?'<figcaption>'+esc(p.caption)+'</figcaption>':''}</figure>`:'';

  fill('caseCover',figure({image:study.cover||item.image}));
  fill('caseFacts',[
    ['My role',study.role],
    ['Timeline',study.timeline],
    ['Tools',study.tools]
  ].filter(([,v])=>v).map(([k,v])=>
    `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`
  ).join(''));

  const sections=(study.sections||[]).filter(s=>s.visible!==false);
  fill('caseContents',sections.map((s,i)=>s.heading?
    `<a href="#section-${i+1}">${esc(s.heading)}</a>`:''
  ).join(''));

  fill('caseSections',sections.map((s,i)=>{
    const layout=['full','split','gallery','phones'].includes(s.layout)?
      s.layout:'full';
    const heading=s.heading?'<h2>'+esc(s.heading)+'</h2>':'';
    const paragraphs=String(s.body||'').split(/\n\s*\n/).filter(Boolean)
      .map(p=>'<p>'+esc(p)+'</p>').join('');
    const images=(s.images||[]).map(figure).join('');
    return `<section class="case-section layout-${layout}" id="section-${i+1}"><div class="case-copy">${heading}${paragraphs}</div><div class="case-media">${images}</div></section>`;
  }).join(''));

  html=html.replace(
    '<noscript>Please enable JavaScript to view this case study.</noscript>',''
  );
  write('projects/'+item.slug+'.html',html);
  urls.push(origin+path);
}

write('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
  urls.map(url=>'<url><loc>'+esc(url)+'</loc></url>').join('\n')+
  '\n</urlset>\n'
);
write('robots.txt',
  'User-agent: *\nAllow: /\nDisallow: /admin/\n\n'+
  'Sitemap: '+origin+'/sitemap.xml\n'
);
console.log('SEO pages generated: '+urls.length);
