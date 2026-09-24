# Task 4 - Complex Form Validation and Dynamic DOM Manipulation

## Objective

Extend form validation and implement dynamic updates to the DOM. This project is a small
client-side application with:

1. **Complex form validation** - a registration form with live, rule-by-rule feedback and a
   password strength meter.
2. **Dynamic DOM manipulation** - a Users dashboard that adds, edits, searches, sorts and
   deletes rows entirely in the browser, without reloading the page.
3. **Client-side routing** - four views (Home, Register, Users, About) in one `index.html`,
   switched by a small hash-based router, for a smoother experience than separate pages.

## Technologies

```text
HTML5
CSS3
JavaScript
Bootstrap 5
Bootstrap Icons
```

Bootstrap 5.3.3 and Bootstrap Icons 1.11.3 are loaded from the jsDelivr CDN, so an internet
connection is needed the first time you open the page.

## A note on the backend

The task brief for this step does not ask for a server, and adds "client-side routing" as a
requirement, so this task is a **static, front-end-only application** (unlike Tasks 1 and 2,
which used Express and EJS). Registered users are kept in this browser's `localStorage`, which
plays the same role Task 2's in-memory array played on the server: it is temporary, it is not
sent anywhere, and it is specific to one browser on one device. If you need this task to run
through an Express server instead, let me know and I can adapt it.

## Project Structure

```text
task-4-dynamic-form-validation/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── router.js       (client-side routing)
│   ├── validation.js   (complex form validation + local "database")
│   ├── dashboard.js     (dynamic DOM manipulation)
│   └── app.js           (small page-wide helpers)
└── README.md
```

## How to Run

This is a static website. Simply open:

```text
index.html
```

in a browser. Alternatively, use the **Live Server** extension in VS Code.

## Feature Tour

### 1. Client-Side Routing (`js/router.js`)

- Every view is a `<section class="app-view" data-view="/route">` in `index.html`.
- The router reads `location.hash` (e.g. `#/users`), shows the matching section, and hides the
  rest - no page reload, and no server request.
- The browser's **Back** and **Forward** buttons work correctly, and reloading the page on any
  route (e.g. `index.html#/about`) opens that same view directly.
- An unknown route (e.g. `#/nope`) falls back to Home instead of showing a blank page.
- The active nav link is highlighted, the mobile menu closes automatically after a click, and a
  thin progress bar briefly animates under the navbar on every route change.

### 2. Complex Form Validation (`js/validation.js`, Register view)

Every field is checked live, as the user types, not only on submit:

| Field | Rule |
|---|---|
| Full Name | At least 3 characters |
| Username | 3-16 characters (letters, numbers, underscore), and **checked live against existing users** so a duplicate is caught before submitting |
| Email | Valid email format |
| Phone | Exactly 10 digits, **auto-formatted** as you type (`98765 43210`) |
| Password | 5 independent rules: 8+ characters, one uppercase, one lowercase, one number, one special character - each shown as its own checklist item that turns green as it is met |
| Confirm Password | Must match, with a live "Passwords match" / "do not match" message |
| Bio | Optional, with a live `x / 140 characters` counter |
| Terms | Must be checked |

The password field also has a **4-segment strength meter** (Weak / Fair / Good / Strong) that
fills and changes colour as more rules are met, and a show/hide toggle. On a valid submission,
the user is saved (without the password) and a success message appears; the form then clears
itself.

### 3. Dynamic DOM Manipulation (`js/dashboard.js`, Users view)

- User cards are built with `document.createElement`, not `innerHTML` with user data, so nothing
  typed by a visitor can be interpreted as HTML.
- **Search** filters the list on every keystroke (by name, username or email).
- **Sort** re-orders the list (Newest, Oldest, Name A-Z, Name Z-A) instantly.
- **Inline bio editing**: click into a user's bio, type, click away - the change is saved and a
  toast confirms it, with no page reload.
- **Delete** (per user) and **Clear All** open a confirmation modal before removing anything.
- The visible count, the "X shown" badge, and the navbar's Users badge all update live.
- An empty state appears both when there are no users at all, and when a search matches nothing.

## Testing

### Test 1 - Routing
Click through Home, Register, Users and About. Use the browser's Back/Forward buttons, and try
reloading the page while on `#/users` - it should reopen the Users view directly.

### Test 2 - Password Strength
On the Register page, type into Password one character at a time (e.g. `a`, then `abcdefgh`,
then `Abcdefgh`, then `Abcdefgh1`, then `Abcdefgh1!`) and watch the checklist and the meter
update after each rule is met.

### Test 3 - Duplicate Username
Register a user (e.g. username `jayratna23`), then start a second registration with the same
username. Expected: "That username is already registered on this device," and the second
submission is blocked.

### Test 4 - Password Mismatch
Enter different values in Password and Confirm Password. Expected: "Passwords do not match,"
shown live, before you even submit.

### Test 5 - Dashboard Search and Sort
Register two or three users, open `/users`, then type part of a name into Search, and try each
option in the Sort dropdown. The grid should update instantly with no reload.

### Test 6 - Delete and Clear All
Click the delete icon on a user card, confirm in the dialog, and check the card disappears and
the counts update. Try "Clear All" the same way.

### Test 7 - Persistence
Register a couple of users, then reload the page (a normal browser refresh). They should still
appear on `/users`, because they are saved in `localStorage`. They will not appear in a
different browser or a private/incognito window.
