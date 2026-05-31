(function () {
  'use strict';

  // Permanently override window.open with a no-op.
  // writable: false and configurable: false prevent ad scripts from
  // restoring the original, even via Object.defineProperty.
  Object.defineProperty(window, 'open', {
    value: function () { return null; },
    writable: false,
    configurable: false
  });
})();
