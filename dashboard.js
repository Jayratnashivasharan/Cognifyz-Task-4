/* =====================================================================
   Task 4 - dashboard.js
   Dynamic DOM manipulation: the Users dashboard is built, searched,
   sorted, edited and deleted entirely in the browser, using the
   window.Users helper defined in validation.js.
   ===================================================================== */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("usersGrid");
    var emptyState = document.getElementById("usersEmpty");
    var emptyText = document.getElementById("usersEmptyText");
    var searchInput = document.getElementById("userSearch");
    var sortSelect = document.getElementById("userSort");
    var visibleBadge = document.getElementById("visibleCountBadge");
    var navUserCount = document.getElementById("navUserCount");
    var clearAllBtn = document.getElementById("clearUsersBtn");

    var confirmModalEl = document.getElementById("confirmModal");
    var confirmModalBody = document.getElementById("confirmModalBody");
    var confirmModalAction = document.getElementById("confirmModalAction");
    var confirmModal = window.bootstrap ? new window.bootstrap.Modal(confirmModalEl) : null;

    var toastEl = document.getElementById("appToast");
    var toastBody = document.getElementById("appToastBody");

    if (!grid) {
      return;
    }

    function showToast(message) {
      toastBody.textContent = message;
      if (window.bootstrap) {
        window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3200 }).show();
      }
    }

    function initials(name) {
      var parts = name.trim().split(/\s+/).slice(0, 2);
      return parts.map(function (p) { return p.charAt(0).toUpperCase(); }).join("") || "?";
    }

    function formatDate(iso) {
      try {
        return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
      } catch (e) {
        return "";
      }
    }

    // Build one user card as real DOM nodes (not innerHTML with user data,
    // so nothing typed by a user can be interpreted as HTML/script).
    function buildCard(user) {
      var col = document.createElement("div");
      col.className = "col-12 col-md-6 col-xl-4";
      col.dataset.userId = String(user.id);

      var card = document.createElement("article");
      card.className = "card card-lift user-card h-100";

      var body = document.createElement("div");
      body.className = "card-body";

      var top = document.createElement("div");
      top.className = "d-flex align-items-start gap-3 mb-2";

      var avatar = document.createElement("span");
      avatar.className = "user-avatar";
      avatar.textContent = initials(user.name);
      avatar.setAttribute("aria-hidden", "true");

      var identity = document.createElement("div");
      identity.className = "flex-grow-1 min-w-0";

      var nameEl = document.createElement("h3");
      nameEl.className = "h6 mb-0 text-truncate";
      nameEl.textContent = user.name;

      var usernameEl = document.createElement("p");
      usernameEl.className = "text-muted-custom small mb-0";
      usernameEl.textContent = "@" + user.username;

      identity.appendChild(nameEl);
      identity.appendChild(usernameEl);

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-sm btn-outline-danger btn-icon";
      deleteBtn.setAttribute("aria-label", "Delete " + user.name);
      deleteBtn.innerHTML = '<i class="bi bi-trash3" aria-hidden="true"></i>';
      deleteBtn.addEventListener("click", function () {
        askToDelete(user.id, user.name);
      });

      top.appendChild(avatar);
      top.appendChild(identity);
      top.appendChild(deleteBtn);

      var details = document.createElement("ul");
      details.className = "list-unstyled user-details mb-3";

      [
        ["envelope", user.email],
        ["telephone", user.phone || "Not provided"],
        ["calendar3", "Joined " + formatDate(user.createdAt)]
      ].forEach(function (pair) {
        var li = document.createElement("li");
        var icon = document.createElement("i");
        icon.className = "bi bi-" + pair[0] + " me-2";
        icon.setAttribute("aria-hidden", "true");
        li.appendChild(icon);
        li.appendChild(document.createTextNode(pair[1]));
        details.appendChild(li);
      });

      var bioLabel = document.createElement("label");
      bioLabel.className = "form-label small text-muted-custom mb-1";
      bioLabel.textContent = "Bio (click to edit)";
      bioLabel.setAttribute("for", "bio-" + user.id);

      var bioBox = document.createElement("textarea");
      bioBox.className = "form-control form-control-sm user-bio";
      bioBox.id = "bio-" + user.id;
      bioBox.rows = 2;
      bioBox.maxLength = 140;
      bioBox.value = user.bio || "";
      bioBox.placeholder = "No bio yet - click to add one";

      // Dynamic DOM manipulation: editing a bio updates the in-memory
      // array and localStorage as soon as the field loses focus.
      bioBox.addEventListener("blur", function () {
        var list = window.Users.all();
        var target = list.find(function (u) { return u.id === user.id; });
        if (target && target.bio !== bioBox.value.trim()) {
          target.bio = bioBox.value.trim();
          window.Users.save(list);
          showToast("Bio updated for " + user.name + ".");
        }
      });

      body.appendChild(top);
      body.appendChild(details);
      body.appendChild(bioLabel);
      body.appendChild(bioBox);
      card.appendChild(body);
      col.appendChild(card);
      return col;
    }

    function askToDelete(id, name) {
      confirmModalBody.textContent = 'Delete "' + name + '"? This cannot be undone.';
      confirmModalAction.onclick = function () {
        var list = window.Users.all().filter(function (u) { return u.id !== id; });
        window.Users.save(list);
        showToast(name + " was deleted.");
        if (confirmModal) confirmModal.hide();
      };
      if (confirmModal) {
        confirmModal.show();
      } else if (window.confirm(confirmModalBody.textContent)) {
        confirmModalAction.onclick();
      }
    }

    clearAllBtn.addEventListener("click", function () {
      var count = window.Users.all().length;
      if (count === 0) {
        showToast("There are no users to clear.");
        return;
      }
      confirmModalBody.textContent = "Delete all " + count + " registered users? This cannot be undone.";
      confirmModalAction.onclick = function () {
        window.Users.save([]);
        showToast("All users were cleared.");
        if (confirmModal) confirmModal.hide();
      };
      if (confirmModal) {
        confirmModal.show();
      } else if (window.confirm(confirmModalBody.textContent)) {
        confirmModalAction.onclick();
      }
    });

    function applySort(list, sortKey) {
      var copy = list.slice();
      switch (sortKey) {
        case "oldest":
          return copy.sort(function (a, b) { return a.id - b.id; });
        case "name-asc":
          return copy.sort(function (a, b) { return a.name.localeCompare(b.name); });
        case "name-desc":
          return copy.sort(function (a, b) { return b.name.localeCompare(a.name); });
        case "newest":
        default:
          return copy.sort(function (a, b) { return b.id - a.id; });
      }
    }

    // Re-render the grid. This is called after every add/edit/delete,
    // and whenever the search box or sort dropdown changes.
    function renderGrid() {
      var all = window.Users.all();
      var query = searchInput.value.trim().toLowerCase();

      var filtered = query
        ? all.filter(function (u) {
            return (
              u.name.toLowerCase().indexOf(query) !== -1 ||
              u.username.toLowerCase().indexOf(query) !== -1 ||
              u.email.toLowerCase().indexOf(query) !== -1
            );
          })
        : all;

      var sorted = applySort(filtered, sortSelect.value);

      grid.innerHTML = "";
      sorted.forEach(function (user) {
        grid.appendChild(buildCard(user));
      });

      var showEmpty = sorted.length === 0;
      emptyState.classList.toggle("d-none", !showEmpty);
      grid.classList.toggle("d-none", showEmpty);

      if (showEmpty) {
        emptyText.textContent = all.length === 0
          ? "No registrations found."
          : 'No users match "' + searchInput.value.trim() + '".';
      }

      visibleBadge.textContent = sorted.length + (sorted.length === 1 ? " shown" : " shown");
      navUserCount.textContent = String(all.length);
    }

    searchInput.addEventListener("input", renderGrid);
    sortSelect.addEventListener("change", renderGrid);

    // Re-render whenever the data changes (add, edit, delete, clear-all)
    // or whenever the user navigates to the Users route.
    document.addEventListener("usersChanged", renderGrid);
    document.addEventListener("routechange", function (event) {
      if (event.detail.route === "/users") {
        renderGrid();
      }
    });

    renderGrid();
  });
})();
