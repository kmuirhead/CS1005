/*
  contact-form.js
  JavaScript validation and pre-filling for the Volunteer and Foster
  Interest Form on contact.html.
  - Each field is checked against the rules in VALIDATION_RULES.
  - Error messages appear directly under the field they describe.
  - Submission is blocked until every field is valid, and the visitor's
    entries are never cleared when an error is shown.
  - Opportunities saved on services.html (localStorage) pre-fill the form.
*/

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// One object per field: what to check and what to say when it fails.
const VALIDATION_RULES = {
  name: {
    required: "Please enter your full name.",
    minLength: 2,
    tooShort: "Your name needs at least 2 characters."
  },
  email: {
    required: "Please enter your email address.",
    pattern: EMAIL_PATTERN,
    badPattern: "Please enter an email address like name@example.com."
  },
  interest: {
    required: "Please choose what you are interested in."
  },
  availability: {
    required: "Please choose your general availability."
  },
  experience: {
    required: "Please choose your experience with pets."
  },
  message: {
    required: "Please tell us a little about yourself.",
    minLength: 20,
    tooShort: "Please write at least 20 characters so our team can get to know you.",
    maxLength: 500,
    tooLong: "Please keep your message to 500 characters or fewer."
  }
};

let form;
let hasTriedToSubmit = false;

/* ---------- Reading values ---------- */

function getFieldValue(fieldName) {
  if (fieldName === "experience") {
    const checked = form.querySelector('input[name="experience"]:checked');
    return checked ? checked.value : "";
  }
  return form.elements[fieldName].value.trim();
}

// The element that receives aria-invalid and focus for a field.
function getFieldElement(fieldName) {
  if (fieldName === "experience") {
    return document.getElementById("exp-none");
  }
  return form.elements[fieldName];
}

/* ---------- Validation ---------- */

// Returns an error message, or an empty string if the field is valid.
function validateField(fieldName) {
  const rules = VALIDATION_RULES[fieldName];
  const value = getFieldValue(fieldName);

  if (rules.required && value === "") {
    return rules.required;
  }
  if (rules.minLength && value.length < rules.minLength) {
    return rules.tooShort;
  }
  if (rules.maxLength && value.length > rules.maxLength) {
    return rules.tooLong;
  }
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.badPattern;
  }
  return "";
}

function showError(fieldName, message) {
  const error = document.getElementById(fieldName + "-error");
  error.textContent = message;
  error.hidden = message === "";

  if (fieldName === "experience") {
    document.getElementById("experience-group").setAttribute("aria-invalid", String(message !== ""));
  } else {
    getFieldElement(fieldName).setAttribute("aria-invalid", String(message !== ""));
  }
}

function checkField(fieldName) {
  const message = validateField(fieldName);
  showError(fieldName, message);
  return message === "";
}

// Checks every field and returns the names of those that failed.
function validateForm() {
  return Object.keys(VALIDATION_RULES).filter(function (fieldName) {
    return !checkField(fieldName);
  });
}

/* ---------- Setting up the page ---------- */

// Adds an empty error message element after each field and links it
// to the field with aria-describedby so screen readers announce it.
function createErrorElements() {
  Object.keys(VALIDATION_RULES).forEach(function (fieldName) {
    const error = document.createElement("p");
    error.id = fieldName + "-error";
    error.className = "field-error";
    error.hidden = true;

    if (fieldName === "experience") {
      const group = document.getElementById("experience-group");
      group.appendChild(error);
      group.setAttribute("aria-describedby", error.id);
    } else {
      const field = getFieldElement(fieldName);
      field.closest(".field").appendChild(error);
      field.setAttribute("aria-describedby", error.id);
    }
  });
}

function createCharacterCounter() {
  const message = form.elements.message;
  const counter = document.createElement("p");
  counter.id = "message-count";
  counter.className = "char-count";
  message.insertAdjacentElement("afterend", counter);
  message.setAttribute("aria-describedby", "message-error message-count");
  updateCharacterCount();
}

function updateCharacterCount() {
  const length = form.elements.message.value.length;
  document.getElementById("message-count").textContent =
    length + " / " + VALIDATION_RULES.message.maxLength + " characters";
}

/* ---------- Pre-filling from saved interests ---------- */

// Finds the interest type that appears most often in the saved list.
function getMostCommonType(savedItems) {
  const counts = {};
  savedItems.forEach(function (item) {
    counts[item.type] = (counts[item.type] || 0) + 1;
  });
  return Object.keys(counts).sort(function (a, b) {
    return counts[b] - counts[a];
  })[0];
}

function prefillFromSavedInterests() {
  const saved = loadFromStorage(STORAGE_KEYS.savedInterests, []);
  if (saved.length === 0) {
    return;
  }
  const filters = loadFromStorage(STORAGE_KEYS.finderFilters, {});
  const titles = saved.map(function (item) {
    return item.title;
  });

  if (form.elements.interest.value === "") {
    form.elements.interest.value = getMostCommonType(saved);
  }
  if (form.elements.availability.value === "" && filters.time && filters.time !== "any") {
    form.elements.availability.value = filters.time;
  }
  if (form.elements.message.value.trim() === "") {
    form.elements.message.value = "I'm interested in: " + titles.join(", ") + ".";
    updateCharacterCount();
  }

  showPrefillNotice(titles);
}

function showPrefillNotice(titles) {
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.id = "prefill-notice";

  const text = document.createElement("p");
  text.innerHTML = "<strong>Welcome back!</strong> We filled in part of this form using the " +
    titles.length + " opportunit" + (titles.length === 1 ? "y" : "ies") +
    " you saved: ";
  text.appendChild(document.createTextNode(titles.join(", ") + "."));

  const actions = document.createElement("p");
  const edit = document.createElement("a");
  edit.href = "services.html#help-finder";
  edit.textContent = "Change my saved interests";
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "link-button";
  clear.textContent = "Clear saved interests";
  clear.addEventListener("click", clearSavedInterests);
  actions.append(edit, document.createTextNode(" | "), clear);

  notice.append(text, actions);
  form.insertAdjacentElement("beforebegin", notice);
}

function clearSavedInterests() {
  removeFromStorage(STORAGE_KEYS.savedInterests);
  const notice = document.getElementById("prefill-notice");
  if (notice) {
    notice.remove();
  }
}

/* ---------- Submitting ---------- */

function showSuccess(name) {
  const success = document.createElement("div");
  success.className = "notice notice-success";
  success.setAttribute("role", "status");
  success.tabIndex = -1;
  success.innerHTML = "<p><strong>Thank you!</strong> Your interest form was received. " +
    "A member of our team will reach out within three business days.</p>";
  success.querySelector("strong").textContent = "Thank you, " + name + "!";
  form.insertAdjacentElement("beforebegin", success);
  success.focus();
}

function handleSubmit(event) {
  event.preventDefault();
  hasTriedToSubmit = true;

  const invalidFields = validateForm();
  if (invalidFields.length > 0) {
    getFieldElement(invalidFields[0]).focus();
    return;
  }

  // This demo site has no server, so we confirm the submission on the page.
  const name = getFieldValue("name");
  clearSavedInterests();
  document.querySelectorAll(".notice-success").forEach(function (old) {
    old.remove();
  });
  form.reset();
  updateCharacterCount();
  hasTriedToSubmit = false;
  Object.keys(VALIDATION_RULES).forEach(function (fieldName) {
    showError(fieldName, "");
  });
  showSuccess(name);
}

// After the first submit attempt, re-check a field as the visitor types or
// chooses, so each error disappears the moment it is fixed. Fields are not
// checked on blur: adding a message then would shift the layout mid-click.
function handleFieldChange(event) {
  const fieldName = event.target.name;
  if (fieldName === "message") {
    updateCharacterCount();
  }
  if (hasTriedToSubmit && VALIDATION_RULES[fieldName]) {
    checkField(fieldName);
  }
}

function initContactForm() {
  form = document.getElementById("interest-form");
  if (!form) {
    return;
  }
  form.noValidate = true; // JavaScript shows its own messages instead of the browser's.

  createErrorElements();
  createCharacterCounter();
  prefillFromSavedInterests();

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("input", handleFieldChange);
  form.addEventListener("change", handleFieldChange);
}

document.addEventListener("DOMContentLoaded", initContactForm);
