/* =====================================================================
   Task 4 - app.js
   Small page-wide bits that do not belong in the router, validation or
   dashboard modules.
   ===================================================================== */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    // Show the correct "Users" count in the navbar badge as soon as the
    // page loads, even before the visitor opens the Users route.
    var navUserCount = document.getElementById("navUserCount");
    if (navUserCount && window.Users) {
      navUserCount.textContent = String(window.Users.all().length);
    }
    document.addEventListener("usersChanged", function () {
      if (navUserCount && window.Users) {
        navUserCount.textContent = String(window.Users.all().length);
      }
    });
  });
})();
