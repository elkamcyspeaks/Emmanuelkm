
(function(){
  const grid=document.getElementById('workGrid');
  const teams=document.getElementById('heroCompanies');
  if(!grid||!teams)return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let pending=false;

  function measure(){
    pending=false;
    const bar=document.querySelector('.topbar');
    const top=Math.ceil(bar?bar.getBoundingClientRect().height:64)+16;
    const available=window.innerHeight-top-20;
    grid.style.setProperty('--work-pin-top',top+'px');
    [...grid.children].forEach((card,index)=>{
      card.style.zIndex=String(index+1);
      card.classList.toggle(
        'stack-enabled',
        !reduced.matches && card.offsetHeight<=available
      );
    });
    teams.style.setProperty('--teams-width',teams.clientWidth+'px');
    const group=teams.querySelector('.teams-group');
    if(group){
      teams.style.setProperty(
        '--teams-duration',
        Math.max(22,group.scrollWidth/35)+'s'
      );
    }
  }

  function schedule(){
    if(!pending){pending=true;requestAnimationFrame(measure)}
  }

  function buildTeams(){
    const names=[...teams.children].filter(
      node=>node.tagName==='SPAN'
    );
    if(!names.length)return;

    observer.disconnect();
    const track=document.createElement('div');
    track.className='teams-track';
    const group=document.createElement('div');
    group.className='teams-group';
    names.forEach(name=>group.append(name));
    const copy=group.cloneNode(true);
    copy.setAttribute('aria-hidden','true');
    track.append(group,copy);
    teams.replaceChildren(track);
    observe();

    if(!document.getElementById('teamsPause')){
      const pause=document.createElement('button');
      pause.id='teamsPause';
      pause.className='teams-pause';
      pause.type='button';
      pause.textContent='Pause animation';
      pause.setAttribute('aria-controls','heroCompanies');
      pause.setAttribute('aria-pressed','false');
      pause.onclick=()=>{
        const stopped=teams.classList.toggle('is-paused');
        pause.setAttribute('aria-pressed',String(stopped));
        pause.textContent=stopped?'Resume animation':'Pause animation';
      };
      teams.after(pause);
    }
  }

  const observer=new MutationObserver(()=>{
    buildTeams();
    schedule();
  });
  function observe(){
    observer.observe(grid,{childList:true});
    observer.observe(teams,{childList:true});
  }
  observe();
  buildTeams();

  grid.addEventListener('load',schedule,true);
  grid.addEventListener('focusin',event=>{
    const card=event.target.closest('.work-card');
    if(card&&card.classList.contains('stack-enabled')){
      card.scrollIntoView({block:'start',behavior:'instant'});
    }
  });
  window.addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener('change',schedule);
  if(document.fonts)document.fonts.ready.then(schedule);
  schedule();
})();
