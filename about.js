
(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;',
      '"':'&quot;', "'":'&#39;'
    }[c])
  );

  function url(value) {
    if(typeof value !== 'string') return '';
    try {
      const result = new URL(value, location.origin);
      return ['https:','http:','mailto:','tel:'].includes(result.protocol)
        ? result.href : '';
    } catch {
      return '';
    }
  }

  const paras = items =>
    (items || []).map(p => `<p>${esc(p)}</p>`).join('');

  function render(data) {
    const a = data.about || {};
    const p = data.aboutPage || {};
    const c = data.contact || {};
    const t = data.training || {};

    document.title = 'About — ' + (data.brand?.name || 'Emmanuel');
    $('brandName').textContent = data.brand?.name || 'EmmanuelKM';
    $('brandMark').textContent = data.brand?.initials || 'EK';
    $('eyebrow').textContent = p.eyebrow || 'ABOUT';
    $('title').textContent = p.title || 'About me.';
    $('intro').textContent = p.intro || a.note || '';
    $('storyTitle').textContent =
      p.storyTitle || a.title || 'A little about me.';
    $('bio').innerHTML = paras(a.bio);
    $('note').textContent = a.note || '';

    $('specs').innerHTML = (a.specs || []).map(s => `
      <div class="spec">
        <dt>${esc(s.key)}</dt><dd>${esc(s.value)}</dd>
      </div>
    `).join('');

    const photos = (p.photos || [])
      .filter(photo => url(photo.image))
      .slice(0,3);

    const focusMap = {
      top:'center top', bottom:'center bottom',
      left:'left center', right:'right center'
    };

    $('photos').innerHTML = photos.map((photo,index) => `
      <figure class="photo">
        <img
          src="${esc(portfolioImageUrl(url(photo.image), 1200))}"
          alt="${esc(photo.caption || 'Emmanuel')}"
          style="object-position:${focusMap[photo.focus] || 'center'}"
          ${index ? 'loading="lazy"' : 'fetchpriority="high"'}
          width="600" height="750">
        <figcaption>${esc(photo.caption)}</figcaption>
      </figure>
    `).join('');

    $('photos').hidden = !photos.length;
    $('photos').style.gridTemplateColumns =
      `repeat(${Math.max(1,photos.length)},minmax(0,1fr))`;

    $('chapters').innerHTML = (p.chapters || []).map(chapter => `
      <section class="chapter">
        <h2>${esc(chapter.title)}</h2>
        <div class="prose">${paras([chapter.body])}</div>
      </section>
    `).join('');

    const groups = data.skills?.groups || [];
    $('skillsList').innerHTML = (groups[0]?.items || []).map(skill => `
      <div class="skill">
        <h3>${esc(skill.label)}</h3>
        <p>${esc(skill.tag)}</p>
      </div>
    `).join('');

    $('tools').innerHTML = groups.slice(1)
      .flatMap(group => group.items || [])
      .map(tool => `<span>${esc(tool.label)}</span>`).join('');
    $('skills').hidden = !groups.length;

    const count = Number(t.count);
    const hasCount =
      t.count !== undefined && t.count !== null && t.count !== ''
      && Number.isFinite(count) && count >= 0;

    $('training').hidden = !hasCount && !t.introduction;
    $('trainingTitle').textContent =
      t.title || 'Sharing what I know.';
    $('count').textContent = hasCount
      ? count + (t.showPlus ? '+' : '') : '';
    $('countLabel').hidden = !hasCount;
    $('trainingIntro').textContent = t.introduction || '';

    $('experience').innerHTML = (p.experience || []).map(job => `
      <article class="experience">
        <div class="date">${esc(job.dates)}</div>
        <div>
          <h3>${esc(job.role)}</h3>
          <p>${esc(job.company)}</p>
          <p>${esc(job.location)}</p>
        </div>
      </article>
    `).join('');
    $('journey').hidden = !(p.experience || []).length;

    const cv = url(c.cv);
    $('cv').hidden = !cv;
    if(cv) $('cv').href = cv;

    $('contactTitle').textContent =
      c.title || 'Let’s work together.';
    $('email').textContent = c.email || 'Get in touch';
    $('email').href = c.email ? 'mailto:' + c.email : '/#contact';

    $('social').innerHTML = (c.links || [])
      .filter(link => link.href && link.href !== '#' && url(link.href))
      .map(link => `
        <a href="${esc(url(link.href))}">${esc(link.label)} ↗</a>
      `).join('');

    $('copyright').textContent = c.copyright || 'EmmanuelKM';
    renderSharedFooter(data);
  }

  const menu = $('menu');
  const nav = $('navigation');

  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
  }

  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });

  nav.addEventListener('click', closeMenu);

  document.addEventListener('keydown', event => {
    if(event.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu();
      menu.focus();
    }
  });

  document.addEventListener('click', event => {
    if(!event.target.closest('header')) closeMenu();
  });

  try {
    render(JSON.parse($('initialData').textContent));
  } catch(error) {
    console.error(error);
  }

  fetchPortfolioContent()
    .then(response => {
      if(!response.ok) throw Error('Content unavailable');
      return response.json();
    })
    .then(render)
    .catch(() => {});
})();
