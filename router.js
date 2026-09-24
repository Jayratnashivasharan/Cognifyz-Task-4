/* =====================================================================
   Task 4 - router.js
   A small hash-based client-side router.

   How it works
   - Every "page" is a <section class="app-view" data-view="/route"> in
     index.html. Only one is visible at a time.
   - The current route lives in the URL as a hash, e.g. "#/register".
     That means Back, Forward and a full page reload all land on the
     right view, without any server involved.
   - Links use a plain "#/route" href and are also marked with
     [data-route-link] so this file can intercept the click, update the
     hash, and let the "hashchange" handling below do the rest.
   ===================================================================== */

(function () {
  "use strict";

  var KNOWN_ROUTES = ["/", "/register", "/users", "/about"];
  var views = document.querySelectorAll(".app-view");
  var navLinks = document.querySelectorAll("[data-route-link]");
  var progressBar = document.getElementById("routeProgress");
  var main = document.getElementById("main");

  // Read the route out of the URL, e.g. "#/users" -> "/users".
  // Falls back to "/" for an empty hash or an unknown route (a tiny 404).
  function currentRoute() {
    var hash = window.location.hash || "#/";
    var route = hash.replace(/^#/, "");
    if (route === "") {
      route = "/";
    }
    return KNOWN_ROUTES.indexOf(route) === -1 ? "/" : route;
  }

  // Show the view matching the route, hide the rest.
  function render() {
    var route = currentRoute();

    // Brief progress-bar animation so a route change is visible even
    // though everything here is instant (there is no real loading).
    progressBar.classList.remove("run");
    // Force a reflow so the animation can restart every time.
    void progressBar.offsetWidth;
    progressBar.classList.add("run");

    views.forEach(function (view) {
      var isActive = view.getAttribute("data-view") === route;
      view.classList.toggle("active-view", isActive);
    });

    navLinks.forEach(function (link) {
      var linkRoute = link.getAttribute("data-route");
      var isActive = linkRoute === route;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    // Close the mobile menu if a link inside it was just used
    var openMenu = document.getElementById("navMenu");
    if (openMenu && openMenu.classList.contains("show") && window.bootstrap) {
      window.bootstrap.Collapse.getOrCreateInstance(openMenu).hide();
    }

    // Move focus to the main region and scroll up, like a real page change
    window.scrollTo({ top: 0, behavior: "auto" });
    main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });

    // Let other scripts react to the route change (e.g. refresh the dashboard)
    document.dispatchEvent(new CustomEvent("routechange", { detail: { route: route } }));
  }

  // Normal <a href="#/x"> clicks already change location.hash on their own,
  // which fires "hashchange" below. We only need to step in when the link
  // points at the CURRENT route, because in that case the browser does not
  // fire "hashchange" (the hash did not actually change).
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (link.getAttribute("href") === window.location.hash) {
        render();
      }
    });
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);
})();
