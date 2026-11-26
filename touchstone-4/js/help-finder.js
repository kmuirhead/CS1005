/*
  help-finder.js
  "Find Your Way to Help" on services.html.
  Visitors filter adoption, foster, and volunteer opportunities by type and
  by when they are free, then save the ones that interest them. The saved
  list and the chosen filters are kept in localStorage, so they are still
  there after a refresh and can pre-fill the form on contact.html.
*/

// Filter buttons. The values match the "interest" options on the contact form.
const HELP_TYPES = [
  { value: "all", label: "Show All" },
  { value: "adoption", label: "Adopt" },
  { value: "foster", label: "Foster" },
  { value: "volunteer", label: "Volunteer" }
];

// Readable labels for the time values (these match the form's availability options).
const TIME_LABELS = {
  "weekday-mornings": "Weekday mornings",
  "weekday-evenings": "Weekday evenings",
  "weekends": "Weekends"
};

// Every way a visitor can help, stored as an array of objects.
const OPPORTUNITIES = [
  {
    id: "adopt-biscuit",
    title: "Meet Biscuit the Tabby Cat",
    type: "adoption",
    times: ["weekday-evenings", "weekends"],
    commitment: "30-minute meet and greet",
    description: "Schedule a visit with Biscuit, our three-year-old pet spotlight who loves sunny windowsills."
  },
  {
    id: "adopt-dog",
    title: "Adopt a Dog",
    type: "adoption",
    times: ["weekends"],
    commitment: "Saturday adoption events",
    description: "Meet adoptable dogs of every size at our Saturday adoption events."
  },
  {
    id: "adopt-small-animal",
    title: "Adopt a Small Animal",
    type: "adoption",
    times: ["weekday-evenings", "weekends"],
    commitment: "Visit by appointment",
    description: "Guinea pigs and rabbits make great first pets for apartments and families."
  },
  {
    id: "foster-short-term",
    title: "Short-Term Foster",
    type: "foster",
    times: ["weekday-evenings", "weekends"],
    commitment: "2 to 3 weeks",
    description: "Give a pet a calm home between the shelter and adoption. Great for first-time fosters."
  },
  {
    id: "foster-kitten",
    title: "Kitten Foster",
    type: "foster",
    times: ["weekday-mornings", "weekday-evenings"],
    commitment: "4 to 8 weeks",
    description: "Help young kittens grow strong enough for adoption. Best if someone is home during the day."
  },
  {
    id: "foster-medical",
    title: "Medical Recovery Foster",
    type: "foster",
    times: ["weekday-mornings", "weekday-evenings"],
    commitment: "2 to 6 weeks",
    description: "Care for a pet healing after surgery or illness. We cover all veterinary costs."
  },
  {
    id: "volunteer-animal-care",
    title: "Animal Care Volunteer",
    type: "volunteer",
    times: ["weekday-mornings", "weekday-evenings", "weekends"],
    commitment: "About 2 hours per shift",
    description: "Feed, walk, and socialize dogs and cats at our adoption center."
  },
  {
    id: "volunteer-events",
    title: "Adoption Event Volunteer",
    type: "volunteer",
    times: ["weekends"],
    commitment: "3 to 4 hours on Saturdays",
    description: "Set up events, greet visitors, and introduce potential adopters to our pets."
  },
  {
    id: "volunteer-transport",
    title: "Transport Volunteer",
    type: "volunteer",
    times: ["weekday-mornings", "weekday-evenings"],
    commitment: "1 to 3 hours per trip",
    description: "Drive animals to veterinary appointments, foster homes, and adoption events."
  },
  {
    id: "volunteer-outreach",
    title: "Community Outreach Volunteer",
    type: "volunteer",
    times: ["weekday-evenings", "weekends"],
    commitment: "A few events per month",
    description: "Represent the rescue at community fairs and help spread the word about our mission."
  }
];

// Current state of the feature. Restored from localStorage in initHelpFinder().
const finderState = {
  type: "all",
  time: "any",
  saved: [] // array of { id, title, type, times }
};

/* ---------- Helpers ---------- */

function getTypeLabel(type) {
  const match = HELP_TYPES.find(function (item) {
    return item.value === type;
  });
  return match ? match.label : type;
}

function isSaved(id) {
  return finderState.saved.some(function (item) {
    return item.id === id;
  });
}

function getFilteredOpportunities() {
  return OPPORTUNITIES.filter(function (opportunity) {
    const typeMatches = finderState.type === "all" || opportunity.type === finderState.type;
    const timeMatches = finderState.time === "any" || opportunity.times.includes(finderState.time);
    return typeMatches && timeMatches;
  });
}

function persistState() {
  saveToStorage(STORAGE_KEYS.savedInterests, finderState.saved);
  saveToStorage(STORAGE_KEYS.finderFilters, {
    type: finderState.type,
    time: finderState.time
  });
}

/* ---------- Rendering ---------- */

function renderTypeButtons() {
  const container = document.getElementById("type-filters");
  container.innerHTML = "";

  HELP_TYPES.forEach(function (helpType) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = helpType.label;
    button.setAttribute("aria-pressed", String(helpType.value === finderState.type));
    button.addEventListener("click", function () {
      setTypeFilter(helpType.value);
    });
    container.appendChild(button);
  });
}

function createOpportunityCard(opportunity) {
  const saved = isSaved(opportunity.id);

  const item = document.createElement("li");
  item.className = saved ? "opportunity is-saved" : "opportunity";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = getTypeLabel(opportunity.type);

  const heading = document.createElement("h3");
  heading.textContent = opportunity.title;

  const description = document.createElement("p");
  description.textContent = opportunity.description;

  const meta = document.createElement("p");
  meta.className = "meta";
  const times = opportunity.times.map(function (time) {
    return TIME_LABELS[time];
  });
  meta.innerHTML = "<strong>Time:</strong> " + opportunity.commitment +
    "<br><strong>Best for:</strong> " + times.join(", ");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "save-button";
  button.setAttribute("aria-pressed", String(saved));
  button.setAttribute("aria-label", (saved ? "Remove " : "Save ") + opportunity.title);
  button.textContent = saved ? "Saved ✓" : "Save";
  button.addEventListener("click", function () {
    toggleSaved(opportunity);
  });

  item.append(tag, heading, description, meta, button);
  return item;
}

function renderOpportunities() {
  const list = document.getElementById("opportunity-list");
  const count = document.getElementById("result-count");
  const matches = getFilteredOpportunities();

  list.innerHTML = "";
  matches.forEach(function (opportunity) {
    list.appendChild(createOpportunityCard(opportunity));
  });

  if (matches.length === 0) {
    count.textContent = "No opportunities match those filters. Try \"Any time\" or \"Show All.\"";
  } else {
    count.textContent = "Showing " + matches.length + " of " + OPPORTUNITIES.length + " opportunities";
  }
}

function renderInterestPanel() {
  const list = document.getElementById("interest-list");
  const empty = document.getElementById("interest-empty");
  const cta = document.getElementById("interest-cta");

  list.innerHTML = "";
  finderState.saved.forEach(function (item) {
    const row = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = item.title;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove " + item.title + " from my interests");
    remove.addEventListener("click", function () {
      toggleSaved(item);
    });

    row.append(name, remove);
    list.appendChild(row);
  });

  const hasSaved = finderState.saved.length > 0;
  empty.hidden = hasSaved;
  cta.hidden = !hasSaved;
  cta.textContent = "Send My " + finderState.saved.length + " Interest" +
    (finderState.saved.length === 1 ? "" : "s") + " to the Team";
}

function renderAll() {
  renderTypeButtons();
  renderOpportunities();
  renderInterestPanel();
}

/* ---------- User actions ---------- */

function setTypeFilter(type) {
  finderState.type = type;
  persistState();
  renderAll();
}

function setTimeFilter(time) {
  finderState.time = time;
  persistState();
  renderOpportunities();
}

function toggleSaved(opportunity) {
  if (isSaved(opportunity.id)) {
    finderState.saved = finderState.saved.filter(function (item) {
      return item.id !== opportunity.id;
    });
  } else {
    finderState.saved.push({
      id: opportunity.id,
      title: opportunity.title,
      type: opportunity.type,
      times: opportunity.times
    });
  }
  persistState();
  renderOpportunities();
  renderInterestPanel();
}

/* ---------- Start-up ---------- */

function restoreState() {
  const filters = loadFromStorage(STORAGE_KEYS.finderFilters, {});
  finderState.saved = loadFromStorage(STORAGE_KEYS.savedInterests, []);

  if (HELP_TYPES.some(function (t) { return t.value === filters.type; })) {
    finderState.type = filters.type;
  }
  if (filters.time === "any" || TIME_LABELS[filters.time]) {
    finderState.time = filters.time;
  }
}

function initHelpFinder() {
  const timeSelect = document.getElementById("time-filter");
  if (!timeSelect) {
    return; // Not on the services page.
  }

  restoreState();
  timeSelect.value = finderState.time;
  timeSelect.addEventListener("change", function () {
    setTimeFilter(timeSelect.value);
  });

  renderAll();
}

document.addEventListener("DOMContentLoaded", initHelpFinder);
