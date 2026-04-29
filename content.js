(function () {
  'use strict';

  // Extract title ID from URL: /title/tt1234567/
  const match = window.location.pathname.match(/\/title\/(tt\d+)/);
  if (!match) return;

  const titleId = match[1];
  const playUrl = `https://www.playimdb.com/title/${titleId}/`;

  // Avoid injecting more than once
  if (document.getElementById('playimdb-btn')) return;

  // Wait for the h1 title element to appear (IMDB renders client-side)
  function inject() {
    if (document.getElementById('playimdb-btn')) return;

    const h1 = document.querySelector('[data-testid="hero__pageTitle"]');
    if (!h1) return; // not ready yet

    // Insert the button after the metadata list sibling, or after the h1 itself
    const titleWrapper = h1.parentElement;
    const metaList = titleWrapper?.querySelector('ul');
    const anchor = metaList || h1;

    const wrapper = document.createElement('div');
    wrapper.id = 'playimdb-wrapper';

    const btn = document.createElement('a');
    btn.id = 'playimdb-btn';
    btn.href = playUrl;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'Watch on PlayIMDB');
    btn.innerHTML = `
      <span class="playimdb-icon">&#9654;</span>
      <span class="playimdb-label">Watch on PlayIMDB</span>
    `;

    wrapper.appendChild(btn);
    anchor.insertAdjacentElement('afterend', wrapper);
  }

  // Use a MutationObserver to handle client-side rendering
  const observer = new MutationObserver(() => {
    if (document.getElementById('playimdb-btn')) {
      observer.disconnect();
      return;
    }
    inject();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also try immediately in case the DOM is already ready
  inject();
})();
