/*
  storage.js
  Shared localStorage helpers used by services.html and contact.html.
  Keeping the keys in one object means both pages read and write the
  same data.
*/

const STORAGE_KEYS = {
  savedInterests: "tcar-saved-interests", // array of saved opportunity objects
  finderFilters: "tcar-finder-filters"    // { type, time } chosen in the finder
};

// Read a JSON value from localStorage, or return the fallback if nothing
// is stored or storage is unavailable (for example, in private browsing).
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

// Save any value to localStorage as JSON.
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage is full or blocked; the page still works without saving.
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Ignore: nothing to remove.
  }
}
