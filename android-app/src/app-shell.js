/* Native shell behaviour for the packaged app. Injected into every bundled
   page by scripts/build-www.mjs; it is a no-op in a normal browser. */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;

  var App = Cap.Plugins.App;
  var Browser = Cap.Plugins.Browser;
  var StatusBar = Cap.Plugins.StatusBar;

  if (StatusBar) {
    StatusBar.setBackgroundColor({ color: '#1B2D2A' }).catch(function () {});
  }

  // Links that leave the bundle - socials, WhatsApp, the live HMS backend -
  // belong in the system browser, not trapped inside the WebView.
  document.addEventListener(
    'click',
    function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;

      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;

      var url;
      try {
        url = new URL(href, location.href);
      } catch (err) {
        return;
      }
      if (url.origin === location.origin) return;

      e.preventDefault();
      // tel:/mailto:/whatsapp: are handed to Android; the rest open in-browser.
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        if (Browser) Browser.open({ url: url.href });
      } else {
        window.location.href = url.href;
      }
    },
    true,
  );

  // Hardware back walks the history, and only exits from the entry page.
  if (App) {
    App.addListener('backButton', function (info) {
      if (info.canGoBack) window.history.back();
      else App.exitApp();
    });
  }
})();
