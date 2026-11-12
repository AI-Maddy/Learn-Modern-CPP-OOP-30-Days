window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: '.*|',
    processHtmlClass: 'arithmatex'
  }
};

// MathJax loads after this file; skip until it is ready (or if the CDN is
// unreachable) instead of throwing on every page load.
document$.subscribe(() => {
  if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
    MathJax.typesetPromise()
  }
})
