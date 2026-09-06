const EMAIL = 'wanghao9610@gmail.com';
const WECHAT = 'wangh9610';
const GITHUB_USER = 'wanghao9610';

/* --------------------------------------------------------------------------
   Toast + clipboard
   -------------------------------------------------------------------------- */
let toastTimer = null;

function showToast(message, detail) {
  const toast = document.getElementById('toast');
  if (!toast) {
    return;
  }

  toast.innerHTML = '';
  const icon = document.createElement('i');
  icon.className = 'fas fa-check';
  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(icon);
  toast.appendChild(text);

  if (detail) {
    const code = document.createElement('code');
    code.textContent = detail;
    toast.appendChild(code);
  }

  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function copyToClipboardOrFallback(value, successMessage, fallbackHref) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value).then(() => {
      showToast(successMessage, value);
    }).catch(() => {
      window.location.href = fallbackHref;
    });
  } else {
    window.location.href = fallbackHref;
  }
}

function initializeCopyActions() {
  document.querySelectorAll('[data-copy]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      const kind = element.getAttribute('data-copy');
      if (kind === 'email') {
        copyToClipboardOrFallback(EMAIL, 'Email copied', 'mailto:' + EMAIL);
      } else if (kind === 'wechat') {
        copyToClipboardOrFallback(WECHAT, 'WeChat ID copied', 'wechat://' + WECHAT);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Theme
   -------------------------------------------------------------------------- */
function initializeTheme() {
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  if (!toggle) {
    return;
  }

  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (error) {
      /* ignore */
    }
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      let saved = null;
      try {
        saved = localStorage.getItem('theme');
      } catch (error) {
        /* ignore */
      }
      if (!saved) {
        root.setAttribute('data-theme', event.matches ? 'dark' : 'light');
      }
    });
  }
}

/* --------------------------------------------------------------------------
   Last updated
   -------------------------------------------------------------------------- */
function formatUpdatedDate(timestamp) {
  const updated = new Date(timestamp);

  if (Number.isNaN(updated.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(updated);
}

function setLastUpdated(timestamp) {
  const target = document.getElementById('last-updated-value');
  const formattedDate = formatUpdatedDate(timestamp);

  if (target && formattedDate) {
    target.textContent = formattedDate;
    target.dateTime = new Date(timestamp).toISOString();
  }
}

function updateLastModifiedDate() {
  const commitsApiUrl = 'https://api.github.com/repos/' + GITHUB_USER + '/' + GITHUB_USER + '.github.io/commits?path=index.html&per_page=1';

  setLastUpdated(document.lastModified);

  const year = document.getElementById('footer-year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  fetch(commitsApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Unable to fetch latest commit');
      }
      return response.json();
    })
    .then((commits) => {
      const lastCommitDate = commits[0] && commits[0].commit && commits[0].commit.committer.date;
      setLastUpdated(lastCommitDate);
    })
    .catch(() => {
      setLastUpdated(document.lastModified);
    });
}

/* --------------------------------------------------------------------------
   GitHub stats (stars / forks / followers), with static fallbacks in the HTML
   -------------------------------------------------------------------------- */
function formatCount(value) {
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(value);
}

function updateGitHubStats() {
  const repoTargets = document.querySelectorAll('[data-repo]');
  const statTargets = document.querySelectorAll('[data-gh]');

  if (repoTargets.length === 0 && statTargets.length === 0) {
    return;
  }

  const cacheKey = 'gh-stats-v1';
  const cacheTtl = 1000 * 60 * 60 * 6;

  function apply(data) {
    repoTargets.forEach((element) => {
      const repo = data.repos[element.getAttribute('data-repo')];
      if (repo) {
        element.textContent = formatCount(repo.stars);
      }
    });

    document.querySelectorAll('[data-repo-forks]').forEach((element) => {
      const repo = data.repos[element.getAttribute('data-repo-forks')];
      if (repo) {
        element.textContent = formatCount(repo.forks);
      }
    });

    statTargets.forEach((element) => {
      const key = element.getAttribute('data-gh');
      if (data.totals[key] !== undefined) {
        element.textContent = formatCount(data.totals[key]);
      }
    });
  }

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.time < cacheTtl) {
      apply(cached.data);
      return;
    }
  } catch (error) {
    /* ignore */
  }

  Promise.all([
    fetch('https://api.github.com/users/' + GITHUB_USER).then((r) => (r.ok ? r.json() : null)),
    fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100').then((r) => (r.ok ? r.json() : null))
  ]).then(([user, repos]) => {
    if (!user || !Array.isArray(repos)) {
      return;
    }

    const data = { repos: {}, totals: {} };
    let stars = 0;
    let forks = 0;

    repos.forEach((repo) => {
      data.repos[repo.name] = { stars: repo.stargazers_count, forks: repo.forks_count };
      if (!repo.fork) {
        stars += repo.stargazers_count;
        forks += repo.forks_count;
      }
    });

    data.totals = {
      stars: stars,
      forks: forks,
      followers: user.followers,
      repos: user.public_repos
    };

    apply(data);

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data: data }));
    } catch (error) {
      /* ignore */
    }
  }).catch(() => {
    /* keep static fallbacks */
  });
}

/* --------------------------------------------------------------------------
   Links, navigation, reveal
   -------------------------------------------------------------------------- */
function prepareExternalLinks() {
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) {
      return;
    }

    const shouldOpenNewTab = /^https?:\/\//.test(href) || href.toLowerCase().endsWith('.pdf');

    if (shouldOpenNewTab) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
  });
}

function initializeSectionNavigation() {
  const nav = document.getElementById('site-nav');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function setActiveNav(sectionId) {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + sectionId);
    });
  }

  function updateNavShadow() {
    if (nav) {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    }
  }

  updateNavShadow();
  window.addEventListener('scroll', updateNavShadow, { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    }, {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach((section) => observer.observe(section));
  } else {
    window.addEventListener('scroll', () => {
      let current = null;
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        if (sections[i].getBoundingClientRect().top <= 120) {
          current = sections[i];
          break;
        }
      }
      if (current) {
        setActiveNav(current.id);
      }
    }, { passive: true });
  }
}

function initializeReveal() {
  const elements = Array.from(document.querySelectorAll('.reveal'));

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  elements.forEach((element) => observer.observe(element));
}

/* --------------------------------------------------------------------------
   Visitors map (lazy)
   -------------------------------------------------------------------------- */
function initializeMapMyVisitors() {
  const container = document.getElementById('mapmyvisitors-container');

  if (!container) {
    return;
  }

  const section = document.getElementById('visitors') || container.closest('.visitors-section');
  let observer = null;
  let renderObserver = null;
  let fallbackTimer = null;

  function hasRenderedMap() {
    return Array.from(container.childNodes).some((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim().length > 0;
      }
      return node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== 'script';
    });
  }

  function hideVisitorsSection() {
    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    if (observer) {
      observer.disconnect();
    }
    if (renderObserver) {
      renderObserver.disconnect();
    }
    if (section) {
      section.hidden = true;
    }
  }

  function watchForRenderedMap() {
    if (hasRenderedMap()) {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (renderObserver) {
        renderObserver.disconnect();
        renderObserver = null;
      }
      return;
    }

    if (fallbackTimer) {
      return;
    }

    if ('MutationObserver' in window) {
      renderObserver = new MutationObserver(() => {
        if (hasRenderedMap()) {
          window.clearTimeout(fallbackTimer);
          fallbackTimer = null;
          renderObserver.disconnect();
          renderObserver = null;
        }
      });
      renderObserver.observe(container, { childList: true, subtree: true });
    }

    fallbackTimer = window.setTimeout(() => {
      if (!hasRenderedMap()) {
        hideVisitorsSection();
      }
    }, 8000);
  }

  function loadMapScript() {
    if (document.getElementById('mapmyvisitors')) {
      watchForRenderedMap();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = 'mapmyvisitors';
    script.src = 'https://mapmyvisitors.com/map.js?d=nq_TN8mwe6ePYMGkPX8UT8YNMkNICnUTSaVc7okfb5k&cl=ffffff&w=500&co=000000&ct=808080&t=n';
    script.onload = watchForRenderedMap;
    script.onerror = hideVisitorsSection;
    container.appendChild(script);
    watchForRenderedMap();
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMapScript();
          observer.disconnect();
        }
      });
    }, { rootMargin: '100px' });

    observer.observe(container);
  } else {
    loadMapScript();
  }
}

/* --------------------------------------------------------------------------
   Paper preview hover (touch / keyboard friendly)
   -------------------------------------------------------------------------- */
function initializePaperPreviewHover() {
  document.querySelectorAll('.paper').forEach((row) => {
    const previewImage = row.querySelector('.thumb-hover');

    if (previewImage) {
      previewImage.loading = 'eager';
      const preloadImage = new Image();
      preloadImage.src = previewImage.currentSrc || previewImage.src;
    }

    const activate = () => row.classList.add('is-preview-active');
    const deactivate = () => row.classList.remove('is-preview-active');

    row.addEventListener('mouseenter', activate);
    row.addEventListener('mouseleave', deactivate);
    row.addEventListener('focusin', activate);
    row.addEventListener('focusout', (event) => {
      if (!row.contains(event.relatedTarget)) {
        deactivate();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  initializeCopyActions();
  updateLastModifiedDate();
  updateGitHubStats();
  prepareExternalLinks();
  initializeSectionNavigation();
  initializeReveal();
  initializePaperPreviewHover();
  initializeMapMyVisitors();
});
