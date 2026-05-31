(function () {
  'use strict';

  // Permanently override window.open with a no-op.
  // writable: false and configurable: false prevent ad scripts from
  // restoring the original, even via Object.defineProperty.
  Object.defineProperty(window, 'open', {
    value: function () { return null; },
    writable: false,
    configurable: false,
    enumerable: true
  });

  // Block form-based popunders (e.g. createElement('form') + form.submit()).
  // Ad scripts use this to bypass window.open overrides.
  // Only suppress submissions where the form targets a new tab (_blank or named).
  var _nativeSubmit = HTMLFormElement.prototype.submit;
  Object.defineProperty(HTMLFormElement.prototype, 'submit', {
    value: function () {
      var target = this.getAttribute('target');
      if (target && target !== '_self' && target !== '_top' && target !== '_parent') {
        return; // block new-tab form submissions
      }
      return _nativeSubmit.apply(this, arguments);
    },
    writable: false,
    configurable: false,
    enumerable: true
  });

  // Block focus-stealing: ad scripts call iframe.blur() + window.focus() to pull
  // keyboard focus away from the player iframe, breaking space/arrow key controls.
  // Suppress window.focus() entirely — this page has no legitimate use for it.
  Object.defineProperty(window, 'focus', {
    value: function () { return; },
    writable: false,
    configurable: false,
    enumerable: true
  });

  // Also block blur() on iframe elements specifically, since ad scripts call
  // iframe.blur() just before window.focus() to complete the focus steal.
  var _nativeBlur = HTMLElement.prototype.blur;
  Object.defineProperty(HTMLElement.prototype, 'blur', {
    value: function () {
      if (this.tagName === 'IFRAME' || this.tagName === 'OBJECT') {
        return; // don't let ad scripts blur the player iframe
      }
      return _nativeBlur.apply(this, arguments);
    },
    writable: false,
    configurable: false,
    enumerable: true
  });
})();
