const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Mobile menu
const menuBtn = $('#menuBtn');
const mobileMenu = $('#mobileMenu');
menuBtn?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  menuBtn.classList.toggle('active', open);
  menuBtn.setAttribute('aria-expanded', open);
});
$$('#mobileMenu a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  menuBtn.classList.remove('active');
  menuBtn.setAttribute('aria-expanded', 'false');
}));

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => observer.observe(el));

// Cursor ambient glow (desktop only)
const glow = $('#cursorGlow');
if (window.matchMedia('(pointer:fine)').matches && glow) {
  window.addEventListener('pointermove', e => {
    glow.style.transform = `translate(${e.clientX - 140}px, ${e.clientY - 140}px)`;
  }, { passive: true });
} else if (glow) glow.style.display = 'none';

// Dynamic year
$('#year').textContent = new Date().getFullYear();

// Subtle nav state based on section
const navLinks = $$('.nav-link');
const sections = $$('main section[id]');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.style.color = active ? '#dd3d98' : '';
      });
    }
  });
}, { rootMargin: '-40% 0px -52% 0px' });
sections.forEach(s => sectionObserver.observe(s));

// Portfolio lightbox for every logo/post crop
const lightbox = $('#lightbox');
const lightboxImage = $('#lightboxImage');
const lightboxTitle = $('#lightboxTitle');
const lightboxClose = $('#lightboxClose');
function closeLightbox(){
  if(!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.classList.remove('lightbox-open');
  if(lightboxImage) setTimeout(()=> lightboxImage.src='',220);
}
$$('[data-lightbox]').forEach(card => card.addEventListener('click', () => {
  if(!lightbox || !lightboxImage) return;
  lightboxImage.src = card.dataset.lightbox;
  lightboxImage.alt = card.dataset.title || 'Portfolio work';
  if(lightboxTitle) lightboxTitle.textContent = card.dataset.title || 'Portfolio work';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.classList.add('lightbox-open');
}));
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', e => { if(e.target === lightbox) closeLightbox(); });
window.addEventListener('keydown', e => { if(e.key === 'Escape') closeLightbox(); });

// Premium upgrade: loader
window.addEventListener('load', () => setTimeout(() => $('#siteLoader')?.classList.add('loaded'), 280));

// Work category filter
$$('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
  const filter = btn.dataset.filter;
  $$('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
  $$('[data-work-section]').forEach(section => {
    section.classList.toggle('filter-hidden', filter !== 'all' && section.dataset.workSection !== filter);
  });
  if (filter !== 'all') {
    const target = $(`[data-work-section="${filter}"]`);
    target?.scrollIntoView({behavior:'smooth', block:'start'});
  }
}));

// Enhanced lightbox with previous/next, category and metadata
let lightboxItems = [];
let activeLightboxIndex = 0;
const lbCategory = $('#lightboxCategory');
const lbMeta = $('#lightboxMeta');
const lbCounter = $('#lightboxCounter');
const lbPrev = $('#lightboxPrev');
const lbNext = $('#lightboxNext');
const lbFeatureList = $('#lightboxFeatureList');
const lbSeriesCards = $$('.lightbox-series-card');
const lbCta = $('#lightboxCta');

const premiumLightboxData = [
  {match:'new-work/minimal-w-brand-mark', group:'', meta:'Minimal monogram identity exploration with a clean black, white and cyan visual system.', features:[]},
  {match:'new-work/graphic-designer-awareness', group:'', meta:'Graphic designer awareness campaign focused on strong editorial typography and visual storytelling.', features:[]},
  {match:'new-work/bmw-m3-automotive-poster', group:'', meta:'Dark automotive poster composition focused on hierarchy, atmosphere and premium vehicle presentation.', features:[]},
  {match:'new-work/character-illustration', group:'', meta:'Stylized character illustration exploring line work, silhouette and personality-driven visual design.', features:[]},
  {match:'new-work/rvexora-graphic-design-services', group:'', meta:'RVEXORA branded service campaign promoting graphic design and brand identity work.', features:[]},
  {match:'latest-work/react/', group:'react', meta:'High-performance, responsive React campaign visuals designed to turn a technical service into a clear, premium offer.', features:[['⌘','Clean Code','React-powered presentation'],['▣','Fully Responsive','Looks polished across devices'],['↗','Fast & Performance','Speed and SEO focused messaging'],['✦','Modern UI/UX','Clean, user-focused visual system']]},
  {match:'latest-work/shopify/', group:'shopify', meta:'Conversion-focused Shopify campaign visuals built around storefront clarity, product discovery and a smooth e-commerce experience.', features:[['S','Custom Store','Branded storefront presentation'],['▣','Responsive Commerce','Desktop, tablet and mobile'],['↗','Product Focused','Collections and product discovery'],['✦','Conversion UX','Clear path from browse to checkout']]},
  {match:'latest-work/uiux/', group:'uiux', meta:'A modern UI/UX campaign showing Figma-led layouts, responsive website design and developer-ready presentation systems.', features:[['✎','Custom UI Design','Brand-led interface direction'],['▣','Responsive Design','Desktop, tablet and mobile'],['⌗','Design System','Consistent components and spacing'],['✦','Developer Ready','Organized handoff mindset']]},
  {match:'latest-work/ai/', group:'ai', meta:'AI website automation campaign visuals explaining always-on support, lead capture and smarter customer journeys in a clear business-first way.', features:[['⚡','Instant Response','Always-on website assistance'],['◎','Lead Capture','Qualify and route opportunities'],['↗','Smart Automation','Reduce repetitive manual work'],['✦','Better Experience','Faster, clearer customer journeys']]},
  {match:'assets/logos/', group:'', meta:'Brand identity exploration from the RVEXORA logo archive.', features:[['✦','Identity First','Distinct visual direction'],['◌','Scalable Mark','Built for digital and print'],['Aa','Typography','Clear visual hierarchy'],['◇','Consistency','Designed as a cohesive system']]},
  {match:'assets/thumbnails/', group:'', meta:'Thumbnail and campaign creative focused on strong hierarchy, readability and quick visual impact.', features:[['◎','Fast Read','Immediate headline hierarchy'],['▣','Platform Ready','Built for 16:9 presentation'],['✦','Visual Impact','Clear focal point and contrast'],['↗','Campaign Fit','Consistent service messaging']]},
  {match:'company-profile/', group:'', meta:'Editorial company-profile design focused on structured information, brand consistency and clean corporate presentation.', features:[['▤','Information','Clear content hierarchy'],['▣','Layout System','Consistent page structure'],['✦','Corporate Polish','Professional presentation'],['↗','Readable Flow','Designed for easy scanning']]},
];

function updatePremiumLightbox(card){
  if(!card) return;
  const src = card.dataset.lightbox || '';
  const preset = premiumLightboxData.find(item => src.includes(item.match));
  if (preset && lbMeta && (!card.dataset.meta || card.dataset.meta.includes('latest added work') || card.dataset.meta.includes('selected portfolio work'))) lbMeta.textContent = preset.meta;
  if (preset && lbFeatureList) {
    lbFeatureList.innerHTML = preset.features.map(([icon,title,desc]) => `<div><i>${icon}</i><p><b>${title}</b><small>${desc}</small></p></div>`).join('');
  }
  lbSeriesCards.forEach(btn => {
    const target = btn.dataset.lbJump || '';
    const activeGroup = preset?.group || '';
    btn.classList.toggle('active', activeGroup && target.includes(`/latest-work/${activeGroup}/`));
  });
}

function refreshLightboxItems(){ lightboxItems = $$('[data-lightbox]'); }
function showLightboxAt(index){
  refreshLightboxItems();
  if (!lightboxItems.length || !lightbox || !lightboxImage) return;
  activeLightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
  const card = lightboxItems[activeLightboxIndex];
  lightboxImage.src = card.dataset.lightbox;
  lightboxImage.alt = card.dataset.title || 'Portfolio work';
  if (lightboxTitle) lightboxTitle.textContent = card.dataset.title || 'Portfolio work';
  if (lbCategory) lbCategory.textContent = card.dataset.category || 'Portfolio';
  if (lbMeta) lbMeta.textContent = card.dataset.meta || '';
  if (lbCounter) lbCounter.textContent = `${String(activeLightboxIndex + 1).padStart(2,'0')} / ${String(lightboxItems.length).padStart(2,'0')}`;
  updatePremiumLightbox(card);
  lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden','false'); document.body.classList.add('lightbox-open');
}
refreshLightboxItems();
lightboxItems.forEach((card, i) => {
  // Capture phase prevents duplicate original handler from being the only behavior; our state remains authoritative.
  card.addEventListener('click', () => showLightboxAt(i));
});
lbPrev?.addEventListener('click', e => { e.stopPropagation(); showLightboxAt(activeLightboxIndex - 1); });
lbNext?.addEventListener('click', e => { e.stopPropagation(); showLightboxAt(activeLightboxIndex + 1); });
window.addEventListener('keydown', e => {
  if (!lightbox?.classList.contains('open')) return;
  if (e.key === 'ArrowLeft') showLightboxAt(activeLightboxIndex - 1);
  if (e.key === 'ArrowRight') showLightboxAt(activeLightboxIndex + 1);
});

// Back to top
const backToTop = $('#backToTop');
const footerBackToTop = $('.footer-back-to-top');
const scrollPageToTop = (event) => {
  event?.preventDefault();
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  window.scrollTo({top: 0, left: 0, behavior});
};
window.addEventListener('scroll', () => backToTop?.classList.toggle('show', window.scrollY > 900), {passive:true});
backToTop?.addEventListener('click', scrollPageToTop);
footerBackToTop?.addEventListener('click', scrollPageToTop);

// Magnetic CTA micro-interaction, desktop only
if (window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width/2)) * .12;
      const y = (e.clientY - (r.top + r.height/2)) * .12;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });
  const showcase = $('#heroShowcase');
  showcase?.addEventListener('pointermove', e => {
    const r = showcase.getBoundingClientRect();
    const rx = ((e.clientY-r.top)/r.height-.5)*-4;
    const ry = ((e.clientX-r.left)/r.width-.5)*5;
    showcase.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  showcase?.addEventListener('pointerleave', () => showcase.style.transform = '');
}

// Testimonial creative rail controls
const testimonialTrack = $('#testimonialTrack');
const testimonialSlider = $('#testimonialSlider');
if (testimonialTrack && testimonialSlider) {
  const scrollTestimonials = (dir) => {
    const slide = testimonialTrack.querySelector('.testimonial-slide');
    const amount = slide ? slide.getBoundingClientRect().width + 16 : testimonialTrack.clientWidth * .8;
    testimonialTrack.scrollBy({left: dir * amount, behavior:'smooth'});
  };
  testimonialSlider.querySelector('.testimonial-arrow.prev')?.addEventListener('click', () => scrollTestimonials(-1));
  testimonialSlider.querySelector('.testimonial-arrow.next')?.addEventListener('click', () => scrollTestimonials(1));
}


// Project-specific budget ranges (Pakistan-friendly freelance pricing, shown in USD).
const projectTypeSelect = $('#projectType');
const budgetRangeSelect = $('#budgetRange');
const budgetHint = $('#budgetHint');

const projectBudgetRanges = {
  'Brand Identity': [
    'Basic logo — $10 – $25',
    'Logo + mini brand kit — $25 – $60',
    'Complete brand identity — $60 – $150',
    'Premium / larger scope — $150 – $300'
  ],
  'Social Media Design': [
    'Single post / creative — $10 – $15',
    '5-post pack — $15 – $35',
    '10-post campaign — $35 – $70',
    'Monthly / larger campaign — $70 – $150'
  ],
  'Thumbnail Design': [
    'Single thumbnail — $10 – $15',
    '5-thumbnail pack — $15 – $30',
    '10-thumbnail pack — $30 – $60',
    'Ongoing series — $60 – $100'
  ],
  'Company Profile': [
    '4–6 pages — $25 – $50',
    '7–10 pages — $50 – $90',
    '11–16 pages — $90 – $150',
    'Large company profile — $150 – $250'
  ],
  'UI/UX Design': [
    'Single landing page UI — $25 – $60',
    'Small website UI — $60 – $120',
    'Multi-page UI/UX — $120 – $250',
    'Dashboard / product UI — $250 – $450'
  ],
  'Website Development': [
    'Landing page — $50 – $120',
    'Small business website — $120 – $250',
    'Advanced website — $250 – $500',
    'Large custom website — $500 – $800'
  ],
  'React / Front-End': [
    'Simple React landing page — $80 – $150',
    'Business React website — $150 – $300',
    'Advanced React front-end — $300 – $600',
    'Large custom front-end — $600 – $1,000'
  ],
  'Other': [
    'Small task — $10 – $30',
    'Medium project — $30 – $100',
    'Larger project — $100 – $300',
    'Custom project — $300 – $1,000'
  ]
};

function updateBudgetRanges() {
  if (!projectTypeSelect || !budgetRangeSelect) return;
  const type = projectTypeSelect.value || 'Other';
  const ranges = projectBudgetRanges[type] || projectBudgetRanges.Other;
  budgetRangeSelect.innerHTML = '';

  const undecided = document.createElement('option');
  undecided.value = 'Not decided yet';
  undecided.textContent = 'Not decided yet';
  budgetRangeSelect.appendChild(undecided);

  ranges.forEach(range => {
    const option = document.createElement('option');
    option.value = range;
    option.textContent = range;
    budgetRangeSelect.appendChild(option);
  });

  if (budgetHint) {
    budgetHint.textContent = 'Suggested range for ' + type + ' — affordable Pakistan-based freelance pricing in USD. Final quote depends on scope.';
  }
}

projectTypeSelect?.addEventListener('change', updateBudgetRanges);
updateBudgetRanges();

// Direct project inquiry delivery via EmailJS.
// EmailJS configuration supplied by the site owner.
const EMAILJS_SERVICE_ID = 'service_cfv29j7';
const EMAILJS_TEMPLATE_ID = 'template_pddtibm';
const EMAILJS_PUBLIC_KEY = 'Acwb4HMeLkvwUxG7Z';

if (window.emailjs) {
  window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

const projectForm = $('#projectForm');
projectForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const note = $('#formNote');
  const submit = projectForm.querySelector('.form-submit');
  const data = new FormData(projectForm);
  const honey = String(data.get('_honey') || '').trim();
  if (honey) return; // simple bot trap

  if (!projectForm.checkValidity()) {
    projectForm.reportValidity();
    if (note) {
      note.textContent = 'Please complete the required fields before sending.';
      note.classList.remove('success');
      note.classList.add('error');
    }
    return;
  }

  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const projectType = String(data.get('type') || '').trim();
  const budget = String(data.get('budget') || '').trim();
  const brief = String(data.get('message') || '').trim();

  // Multiple common variable aliases are intentionally included so the
  // EmailJS template can use whichever field names were configured there.
  const templateParams = {
    to_email: 'baigribal@gmail.com',
    recipient_email: 'baigribal@gmail.com',
    from_name: name,
    name,
    user_name: name,
    from_email: email,
    email,
    user_email: email,
    reply_to: email,
    project_type: projectType,
    type: projectType,
    budget_range: budget,
    budget,
    project_brief: brief,
    message: brief,
    subject: `New RVEXORA inquiry — ${projectType || 'Project'}`
  };

  if (submit) {
    submit.disabled = true;
    submit.dataset.originalText = submit.innerHTML;
    submit.innerHTML = 'Sending…';
  }
  if (note) {
    note.textContent = 'Sending your inquiry…';
    note.classList.remove('success', 'error');
  }

  try {
    if (!window.emailjs) throw new Error('EmailJS SDK did not load');

    await window.emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    projectForm.reset();
    updateBudgetRanges();
    if (note) {
      note.textContent = 'Thanks — your inquiry was sent successfully. I’ll get back to you soon.';
      note.classList.remove('error');
      note.classList.add('success');
    }
  } catch (error) {
    console.error('EmailJS inquiry error:', error);
    if (note) {
      note.innerHTML = 'The inquiry could not be sent right now. Please use <a href="mailto:baigribal@gmail.com?subject=RVEXORA%20Project%20Inquiry">Email me</a> or WhatsApp above.';
      note.classList.remove('success');
      note.classList.add('error');
    }
  } finally {
    if (submit) {
      submit.disabled = false;
      submit.innerHTML = submit.dataset.originalText || 'Send inquiry <span>↗</span>';
    }
  }
});

// Astra 6 polish: scroll progress + active section navigation
(() => {
  const progress = document.getElementById('scrollProgress');
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const sections = navLinks.map(link => document.getElementById(link.dataset.nav)).filter(Boolean);

  const updateProgress = () => {
    if (!progress) return;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const pct = Math.min(100, Math.max(0, (doc.scrollTop / max) * 100));
    progress.style.width = `${pct}%`;
  };

  const updateActiveNav = () => {
    if (!sections.length) return;
    const marker = window.innerHeight * 0.28;
    let current = sections[0].id;
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= marker) current = section.id;
    });
    navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.nav === current));
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateProgress();
      updateActiveNav();
      ticking = false;
    });
  };

  updateProgress();
  updateActiveNav();
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
})();

// Premium series shortcuts inside the redesigned lightbox
lbSeriesCards.forEach(btn => btn.addEventListener('click', e => {
  e.stopPropagation();
  refreshLightboxItems();
  const target = btn.dataset.lbJump;
  const idx = lightboxItems.findIndex(item => item.dataset.lightbox === target);
  if (idx >= 0) showLightboxAt(idx);
}));

lbCta?.addEventListener('click', () => closeLightbox());


// Keep large archives compact until the visitor asks to see more.
function setupExpandableArchive(selector, initialCount, moreLabel) {
  const gallery = document.querySelector(selector);
  if (!gallery) return;
  const items = [...gallery.children].filter(el => el.matches('button, article, a'));
  if (items.length <= initialCount) return;

  gallery.classList.add('archive-collapsed');
  items.forEach((item, index) => {
    if (index >= initialCount) item.classList.add('archive-extra');
  });

  const wrap = document.createElement('div');
  wrap.className = 'archive-toggle-wrap';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'archive-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `${moreLabel} <span>↓</span>`;
  wrap.appendChild(button);
  gallery.insertAdjacentElement('afterend', wrap);

  button.addEventListener('click', () => {
    const expanded = gallery.classList.toggle('archive-expanded');
    gallery.classList.toggle('archive-collapsed', !expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.innerHTML = expanded ? `Show less <span>↑</span>` : `${moreLabel} <span>↓</span>`;
    if (!expanded) gallery.closest('section')?.scrollIntoView({behavior:'smooth', block:'start'});
  });
}
setupExpandableArchive('.logo-gallery', 8, 'See more logos');
setupExpandableArchive('.posts-gallery', 12, 'See more posts');
setupExpandableArchive('.thumbnail-gallery', 4, 'See more thumbnails');
setupExpandableArchive('.profile-gallery', 3, 'See more profile pages');
