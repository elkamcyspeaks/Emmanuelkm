
(function(){
  function node(tag,text,cls){
    const n=document.createElement(tag);
    if(text!==undefined)n.textContent=text;
    if(cls)n.className=cls;
    return n;
  }
  function render(data){
    const section=document.getElementById('homeJourney');
    const settings=data.homeJourney||{};
    section.hidden=settings.enabled===false;
    document.getElementById('journeyHeading').textContent=
      settings.title||'My Professional Journey';

    const rows=document.getElementById('journeyRows');
    rows.replaceChildren();
    const limit=Math.max(1,Math.min(10,Number(settings.limit)||2));
    ((data.aboutPage||{}).experience||[]).slice(0,limit).forEach(item=>{
      const row=node('article',undefined,'journey-row');
      const body=node('div');
      body.append(
        node('h3',item.role||''),
        node('p',[item.company,item.location].filter(Boolean).join(' · '))
      );
      row.append(node('span',item.dates||'','journey-date'),body);
      rows.append(row);
    });

    const link=section.querySelector('.journey-more');
    link.href='/about.html#journey';
    link.textContent=(settings.linkLabel||'See full work experience')+' ↗';

    const stats=document.getElementById('journeyStats');
    stats.replaceChildren();
    (settings.stats||[]).slice(0,4).forEach(item=>{
      const card=node('div',undefined,'journey-stat');
      card.append(node('strong',String(item.value)),node('span',item.label));
      stats.append(card);
    });
  }
  fetchPortfolioContent().then(r=>r.json()).then(render).catch(error=>{
    console.error(error);
  });
})();
