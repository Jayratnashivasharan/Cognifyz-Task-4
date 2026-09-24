/* =====================================================================
   Task 4 - validation.js
   Complex, live form validation for the registration form.

   Exposes window.Users, a tiny localStorage-backed "database" of
   registered users, shared with dashboard.js.
   ===================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "task4.users";

  // -----------------------------------------------------------------
  // A very small shared "data layer". Both this file and dashboard.js
  // use these functions instead of touching localStorage directly.
  // -----------------------------------------------------------------
  var Users = {
    all: function () {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        var list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
      } catch (error) {
        // Corrupted or blocked storage: fail safe with an empty list
        return [];
      }
    },
    save: function (list) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (error) {
        // Storage full or unavailable (e.g. private browsing) - ignore quietly
      }
      document.dispatchEvent(new CustomEvent("usersChanged"));
    },
    add: function (user) {
      var list = Users.all();
      list.push(user);
      Users.save(list);
    },
    usernameTaken: function (username) {
      var needle = username.trim().toLowerCase();
      return Users.all().some(function (u) {
        return u.username.toLowerCase() === needle;
      });
    }
  };
  window.Users = Users;

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("registerForm");
    if (!form) {
      return;
    }

    var nameField = document.getElementById("reg-name");
    var usernameField = document.getElementById("reg-username");
    var usernameStatus = document.getElementById("usernameStatus");
    var emailField = document.getElementById("reg-email");
    var phoneField = document.getElementById("reg-phone");
    var passwordField = document.getElementById("reg-password");
    var confirmField = document.getElementById("reg-confirm");
    var confirmStatus = document.getElementById("confirmStatus");
    var bioField = document.getElementById("reg-bio");
    var bioCounter = document.getElementById("bioCounter");
    var termsField = document.getElementById("reg-terms");
    var togglePasswordBtn = document.getElementById("togglePassword");
    var strengthSegments = document.querySelectorAll(".strength-seg");
    var strengthLabel = document.getElementById("strengthLabel");
    var successBox = document.getElementById("registerSuccess");
    var successText = document.getElementById("registerSuccessText");

    var usernameCheckTimer = null;

    // -----------------------------------------------------------------
    // Field rules. Each returns true when the current value is valid.
    // -----------------------------------------------------------------
    var rules = {
      name: function (v) {
        return v.trim().length >= 3;
      },
      username: function (v) {
        return /^[a-zA-Z0-9_]{3,16}$/.test(v.trim()) && !Users.usernameTaken(v);
      },
      email: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
      },
      phone: function (v) {
        return v.replace(/\D/g, "").length === 10;
      },
      password: function (v) {
        return passwordRuleResults(v).every(function (r) {
          return r.met;
        });
      },
      confirm: function (v) {
        return v.length > 0 && v === passwordField.value;
      },
      terms: function () {
        return termsField.checked;
      }
    };

    // Returns the 5 password rules with a live "met" flag - reused by
    // both the checklist UI and the strength meter.
    function passwordRuleResults(value) {
      return [
        { key: "length", met: value.length >= 8 },
        { key: "upper", met: /[A-Z]/.test(value) },
        { key: "lower", met: /[a-z]/.test(value) },
        { key: "number", met: /[0-9]/.test(value) },
        { key: "special", met: /[^A-Za-z0-9]/.test(value) }
      ];
    }

    // -----------------------------------------------------------------
    // DYNAMIC DOM: password rule checklist + 4-segment strength meter
    // -----------------------------------------------------------------
    function updatePasswordUI() {
      var value = passwordField.value;
      var results = passwordRuleResults(value);
      var metCount = results.filter(function (r) { return r.met; }).length;

      results.forEach(function (r) {
        var item = document.querySelector('[data-rule="' + r.key + '"]');
        if (!item) return;
        var icon = item.querySelector("i");
        item.classList.toggle("rule-met", r.met);
        icon.className = r.met ? "bi bi-check-circle-fill" : "bi bi-circle";
      });

      // Fill 0-4 strength segments based on how many rules pass
      var labels = ["Enter a password", "Weak", "Fair", "Good", "Strong"];
      var level = value.length === 0 ? 0 : Math.max(1, metCount);
      strengthSegments.forEach(function (seg, index) {
        seg.classList.toggle("filled", index < level);
        seg.className = "strength-seg" + (index < level ? " filled seg-" + level : "");
      });
      strengthLabel.textContent = labels[value.length === 0 ? 0 : Math.min(level, 4)];
    }

    // -----------------------------------------------------------------
    // DYNAMIC DOM: username availability message, debounced slightly so
    // it does not flicker while the user is still typing.
    // -----------------------------------------------------------------
    function updateUsernameStatus() {
      window.clearTimeout(usernameCheckTimer);
      var value = usernameField.value.trim();

      if (value.length === 0) {
        usernameStatus.textContent = "";
        usernameStatus.className = "form-text";
        return;
      }

      usernameCheckTimer = window.setTimeout(function () {
        if (!/^[a-zA-Z0-9_]{3,16}$/.test(value)) {
          usernameStatus.textContent = "3-16 characters: letters, numbers and underscore only.";
          usernameStatus.className = "form-text text-danger";
        } else if (Users.usernameTaken(value)) {
          usernameStatus.textContent = "That username is already registered on this device.";
          usernameStatus.className = "form-text text-danger";
        } else {
          usernameStatus.textContent = "Username is available.";
          usernameStatus.className = "form-text text-success";
        }
      }, 250);
    }

    // -----------------------------------------------------------------
    // DYNAMIC DOM: live confirm-password message
    // -----------------------------------------------------------------
    function updateConfirmStatus() {
      if (confirmField.value.length === 0) {
        confirmStatus.textContent = "";
        confirmStatus.className = "form-text";
        return;
      }
      var match = confirmField.value === passwordField.value;
      confirmStatus.textContent = match ? "Passwords match." : "Passwords do not match.";
      confirmStatus.className = "form-text " + (match ? "text-success" : "text-danger");
    }

    // -----------------------------------------------------------------
    // DYNAMIC DOM: phone number formatted live as "98765 43210"
    // -----------------------------------------------------------------
    function formatPhone() {
      var digits = phoneField.value.replace(/\D/g, "").slice(0, 10);
      phoneField.value = digits.length > 5 ? digits.slice(0, 5) + " " + digits.slice(5) : digits;
    }

    // -----------------------------------------------------------------
    // DYNAMIC DOM: bio character counter
    // -----------------------------------------------------------------
    function updateBioCounter() {
      var length = bioField.value.length;
      bioCounter.textContent = length + " / 140 characters";
      bioCounter.classList.toggle("text-danger", length >= 130);
    }

    // -----------------------------------------------------------------
    // Generic per-field validation + Bootstrap valid/invalid classes
    // -----------------------------------------------------------------
    function validateField(field) {
      var rule = rules[field.name];
      if (!rule) {
        return true;
      }
      var value = field.type === "checkbox" ? field.checked : field.value;
      var isValid = rule(value);
      field.classList.toggle("is-invalid", !isValid);
      field.classList.toggle("is-valid", isValid && String(value).length > 0 || (field.type === "checkbox" && isValid));
      return isValid;
    }

    // Wire up live listeners
    nameField.addEventListener("input", function () { validateField(nameField); });

    usernameField.addEventListener("input", function () {
      updateUsernameStatus();
      validateField(usernameField);
    });

    emailField.addEventListener("input", function () { validateField(emailField); });

    phoneField.addEventListener("input", function () {
      formatPhone();
      validateField(phoneField);
    });

    passwordField.addEventListener("input", function () {
      updatePasswordUI();
      validateField(passwordField);
      if (confirmField.value) {
        updateConfirmStatus();
        validateField(confirmField);
      }
    });

    confirmField.addEventListener("input", function () {
      updateConfirmStatus();
      validateField(confirmField);
    });

    bioField.addEventListener("input", updateBioCounter);

    termsField.addEventListener("change", function () { validateField(termsField); });

    togglePasswordBtn.addEventListener("click", function () {
      var showing = passwordField.type === "text";
      passwordField.type = showing ? "password" : "text";
      togglePasswordBtn.querySelector("i").className = showing ? "bi bi-eye" : "bi bi-eye-slash";
      togglePasswordBtn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      togglePasswordBtn.setAttribute("aria-pressed", showing ? "false" : "true");
    });

    // -----------------------------------------------------------------
    // Submit: validate every field, then store the user or show errors
    // -----------------------------------------------------------------
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      successBox.classList.add("d-none");

      var fields = [nameField, usernameField, emailField, phoneField, passwordField, confirmField, termsField];
      var allValid = true;
      var firstInvalid = null;

      fields.forEach(function (field) {
        var ok = validateField(field);
        if (!ok && !firstInvalid) {
          firstInvalid = field;
        }
        allValid = allValid && ok;
      });

      if (!allValid) {
        if (firstInvalid) {
          firstInvalid.focus();
        }
        return;
      }

      // Never store the password. Only the fields needed for the dashboard are kept.
      Users.add({
        id: Date.now(),
        name: nameField.value.trim(),
        username: usernameField.value.trim(),
        email: emailField.value.trim(),
        phone: phoneField.value.trim(),
        bio: bioField.value.trim(),
        createdAt: new Date().toISOString()
      });

      successText.textContent = "Welcome, " + nameField.value.trim() + "! Your account was created on this device.";
      successBox.classList.remove("d-none");

      form.reset();
      fields.forEach(function (field) {
        field.classList.remove("is-valid", "is-invalid");
      });
      updatePasswordUI();
      updateBioCounter();
      usernameStatus.textContent = "";
      confirmStatus.textContent = "";
    });

    form.addEventListener("reset", function () {
      form.querySelectorAll(".form-control, .form-check-input").forEach(function (field) {
        field.classList.remove("is-valid", "is-invalid");
      });
      window.setTimeout(function () {
        updatePasswordUI();
        updateBioCounter();
        usernameStatus.textContent = "";
        confirmStatus.textContent = "";
      }, 0);
    });

    // Initial state (also runs after the section becomes visible again)
    updatePasswordUI();
    updateBioCounter();
  });
})();
