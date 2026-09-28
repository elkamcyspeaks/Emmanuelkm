
function renderSharedFooter(data) {
  const c = data.contact || {};
  const get = id => document.getElementById(id);

  get('footerIntro').textContent = c.footerIntro || '';
  get('footerSignoff').textContent = c.footerSignoff || '';

  function safeUrl(value) {
    if(typeof value !== 'string' || !value || value === '#') return '';
    try {
      const u = new URL(value, location.origin);
      return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
    } catch {
      return '';
    }
  }

  const cv = safeUrl(c.cv);
  get('footerCV').hidden = !cv;
  if(cv) get('footerCV').href = cv;

  const social = get('contactLinks') || get('social');
  social.replaceChildren();

  (c.links || []).forEach(link => {
    const href = safeUrl(link.href);
    if(!href) return;
    const a = document.createElement('a');
    const host = new URL(href).hostname;
    a.href = href;
    a.className = 'sf-social';
    a.setAttribute('aria-label', link.label || host);
    a.title = link.label || host;

    if(host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
      a.textContent = 'in';
    } else if(host === 'behance.net' || host.endsWith('.behance.net')) {
      a.textContent = 'Bē';
    } else {
      a.textContent = (link.label || host).slice(0,2);
    }
    social.appendChild(a);
  });

  const email = get('email');
  if(email) {
    email.href = '/#footerMessage';
    email.textContent = 'Send a message ↗';
  }
}

function openFooterMessage() {
  if(location.hash !== '#footerMessage') return;
  const details = document.getElementById('footerMessage');
  if(details) {
    details.open = true;
    details.scrollIntoView({block:'start'});
  }
}
window.addEventListener('hashchange', openFooterMessage);
window.addEventListener('DOMContentLoaded', openFooterMessage);


// separate-page-content-v1
// loading-speed-v1
let portfolioContentRequest;
async function fetchPortfolioContent(){
  if(!portfolioContentRequest){
    portfolioContentRequest = Promise.all([
      '/content/portfolio.json',
      '/content/about.json',
      '/content/playground.json'
    ].map(async path => {
      const response = await fetch(path, {cache:'no-cache'});
      if(!response.ok) throw new Error('Could not load ' + path);
      return response.json();
    })).then(parts => JSON.stringify(Object.assign({}, ...parts)))
      .catch(error => {
        portfolioContentRequest = null;
        throw error;
      });
  }
  return new Response(await portfolioContentRequest, {
    headers: {'Content-Type':'application/json'}
  });
}
function portfolioImageUrl(source, width){
  if(!source) return source;
  try {
    const url = new URL(source, location.origin);
    if(url.origin !== location.origin ||
       !url.pathname.startsWith('/content/uploads/') ||
       !/\.(jpe?g|png|webp)$/i.test(url.pathname)) return source;
    const params = new URLSearchParams({
      url:url.pathname, w:String(width), q:'85', fm:'webp'
    });
    return '/.netlify/images?' + params;
  } catch { return source; }
}
