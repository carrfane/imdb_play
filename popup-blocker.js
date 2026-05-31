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
})();
