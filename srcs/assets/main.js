const EMAIL = 'wanghao9610@gmail.com';
const WECHAT = 'wangh9610';

function copyToClipboardOrFallback(value, successMessage, fallbackHref) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value).then(() => {
      alert(successMessage + value);
    }).catch(() => {
      window.location.href = fallbackHref;
    });
  } else {
    window.location.href = fallbackHref;
  }
}

window.copyEmail = function copyEmail(event) {
  event.preventDefault();
  copyToClipboardOrFallback(EMAIL, 'E-mail address copied to clipboard: ', 'mailto:' + EMAIL);
};

window.copyWechat = function copyWechat(event) {
  event.preventDefault();
  copyToClipboardOrFallback(WECHAT, 'WeChat ID copied to clipboard: ', 'wechat:' + WECHAT);
};

function updateLastModifiedDate() {
  const updated = new Date(document.lastModified);
  const target = document.getElementById('last-updated-value');

  if (target && !Number.isNaN(updated.getTime())) {
    target.textContent = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(updated);
  }
}

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
  const navLinks = Array.from(document.querySelectorAll('.page-nav a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function setActiveNav(sectionId) {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + sectionId);
    });
  }

  if (sections.length > 0) {
    setActiveNav(sections[0].id);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    }, {
      rootMargin: '-35% 0px -55% 0px',
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
    }, {
      rootMargin: '100px'
    });

    observer.observe(container);
  } else {
    loadMapScript();
  }
}

function initializePaperPreviewHover() {
  document.querySelectorAll('.paper-row').forEach((row) => {
    const previewImage = row.querySelector('.two img');

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
  updateLastModifiedDate();
  prepareExternalLinks();
  initializeSectionNavigation();
  initializePaperPreviewHover();
  initializeMapMyVisitors();
});
