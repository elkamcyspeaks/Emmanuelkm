
(async function(){
  const $=id=>document.getElementById(id);
  const make=(tag,text,cls)=>{
    const n=document.createElement(tag);
    if(text)n.textContent=text;
    if(cls)n.className=cls;
    return n;
  };
  const safe=value=>{
    try{
      const u=new URL(value,location.origin);
      return ['https:','http:'].includes(u.protocol)?u.href:'';
    }catch{return ''}
  };

  const menu=$('menu'),nav=$('navigation');
  function closeMenu(){
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
  }
  menu.onclick=()=>menu.setAttribute(
    'aria-expanded',String(nav.classList.toggle('open'))
  );
  nav.addEventListener('click',closeMenu);
  document.addEventListener('click',e=>{
    if(!nav.contains(e.target)&&!menu.contains(e.target))closeMenu();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&nav.classList.contains('open')){
      closeMenu();menu.focus();
    }
  });

  const dialog=$('imageViewer');
  $('closeImage').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{
    if(e.target===dialog)dialog.close();
  });

  function figure(photo,eager=false){
    if(!photo.image)return null;
    const src=safe(photo.image);
    if(!src)return null;
    const fig=make('figure');
    const button=make('button',null,'case-image-button');
    const img=make('img');
    button.type='button';
    button.setAttribute('aria-label','Enlarge '+(photo.caption||'project image'));
    button.setAttribute('aria-haspopup','dialog');
    img.src=src;
    img.alt=photo.alt||photo.caption||'Project design';
    img.loading=eager?'eager':'lazy';
    img.decoding='async';
    button.append(img);
    button.onclick=()=>{
      $('largeImage').src=src;
      $('largeImage').alt=img.alt;
      $('imageCaption').textContent=photo.caption||'';
      dialog.showModal();
    };
    fig.append(button);
    if(photo.caption)fig.append(make('figcaption',photo.caption));
    return fig;
  }

  try{
    const response=await fetchPortfolioContent();
    const data=await response.json();
    renderSharedFooter(data);
    $('brandName').textContent=(data.brand||{}).name||'EmmanuelKM';
    $('brandMark').textContent=(data.brand||{}).initials||'EK';
    $('contactTitle').textContent=(data.contact||{}).title||
      'Let’s create something great together.';
    $('copyright').textContent=(data.contact||{}).copyright||'';

    const items=((data.work||{}).items||[]).filter(p=>p.published!==false);
    const slug=new URLSearchParams(location.search).get('project');
    const item=items.find(p=>p.slug===slug);
    if(!item){
      $('caseStatus').textContent=
        'This project is unavailable. Please choose a project from Selected Work.';
      return;
    }

    const study=item.caseStudy||{};
    document.title=item.title+' — EmmanuelKM';
    document.querySelector('meta[name="description"]').content=
      study.summary||item.description||item.title;
    $('caseCategory').textContent=item.category||'Selected work';
    $('caseTitle').textContent=item.title;
    $('caseIntro').textContent=study.summary||item.description||'';

    const cover=figure({
      image:study.cover||item.image,
      alt:item.title+' design preview'
    },true);
    if(cover)$('caseCover').append(cover);
    else $('caseCover').hidden=true;

    const url=item.link?safe(item.link):'';
    if(url&&/^https?:\/\//i.test(item.link)){
      $('visitProject').href=url;
      $('visitProject').hidden=false;
    }

    [
      ['My role',study.role],
      ['Timeline',study.timeline],
      ['Tools',study.tools]
    ].forEach(([label,value])=>{
      if(!value)return;
      const block=make('div');
      block.append(make('dt',label),make('dd',value));
      $('caseFacts').append(block);
    });
    $('caseFacts').hidden=!$('caseFacts').children.length;

    const allowed=['full','split','gallery','phones'];
    (study.sections||[]).filter(s=>s.visible!==false).forEach((s,i)=>{
      const images=(s.images||[]).map(p=>figure(p)).filter(Boolean);
      if(!s.heading&&!s.body&&!images.length)return;
      const layout=allowed.includes(s.layout)?s.layout:'full';
      const section=make('section',null,'case-section layout-'+layout);
      section.id='section-'+(i+1);
      const text=make('div',null,'case-copy');

      if(s.heading){
        text.append(make('h2',s.heading));
        const a=make('a',s.heading);
        a.href='#'+section.id;
        $('caseContents').append(a);
      }
      if(s.body){
        String(s.body).split(/\n\s*\n/).forEach(p=>text.append(make('p',p)));
      }
      if(text.children.length)section.append(text);
      if(images.length){
        const media=make('div',null,'case-media');
        images.forEach(f=>media.append(f));
        section.append(media);
      }
      $('caseSections').append(section);
    });

    $('caseContents').hidden=!$('caseContents').children.length;
    if(items.length>1){
      const next=items[(items.indexOf(item)+1)%items.length];
      $('nextProject').href='/project.html?project='+encodeURIComponent(next.slug);
      $('nextProject').textContent='Next project: '+next.title+' ↗';
      $('nextProject').hidden=false;
    }
    $('caseStatus').hidden=true;
    $('caseArticle').hidden=false;
  }catch(error){
    console.error(error);
    $('caseStatus').textContent=
      'The project could not load. Please refresh to try again.';
  }
})();
