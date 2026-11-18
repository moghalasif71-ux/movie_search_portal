// Get a free key from https://www.omdbapi.com/apikey.aspx and paste it here
const API_KEY = "YOUR_OMDB_KEY";
const BASE_URL = "https://www.omdbapi.com/";
const NO_POSTER = "https://placehold.co/300x450?text=No+Poster";

const form = document.getElementById("search-form");
const queryInput = document.getElementById("query");
const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const tabResults = document.getElementById("tab-results");
const tabFavs = document.getElementById("tab-favs");
const favCount = document.getElementById("fav-count");

let lastResults = [];
let view = "results";
let favourites = loadFavs();

function loadFavs() {
  try { return JSON.parse(localStorage.getItem("favs")) || []; }
  catch { return []; }
}
function saveFavs() {
  localStorage.setItem("favs", JSON.stringify(favourites));
  favCount.textContent = favourites.length;
}
const isFav = (id) => favourites.some((m) => m.imdbID === id);

async function searchMovies(query) {
  statusEl.textContent = "Searching...";
  grid.innerHTML = "";
  try {
    const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.Response === "False") {
      lastResults = [];
      statusEl.textContent = data.Error === "Movie not found!"
        ? `No movies found for "${query}". Try another title.`
        : data.Error;
      return;
    }
    lastResults = data.Search;
    statusEl.textContent = `${data.totalResults} results for "${query}"`;
    render();
  } catch {
    statusEl.textContent = "Network error. Check your internet and try again.";
  }
}

async function showDetails(id) {
  try {
    const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${id}&plot=full`);
    const m = await res.json();
    modalBody.innerHTML = `
      <div class="detail">
        <img src="${m.Poster !== "N/A" ? m.Poster : NO_POSTER}" alt="${m.Title} poster">
        <div>
          <h2>${m.Title} (${m.Year})</h2>
          <p class="meta">${m.Runtime} | ${m.Genre}</p>
          <p class="rating">IMDb ${m.imdbRating}</p>
          <p>${m.Plot}</p>
          <p class="meta" style="margin-top:12px">Cast: ${m.Actors}</p>
        </div>
      </div>`;
    modal.showModal();
  } catch {
    statusEl.textContent = "Could not load details. Try again.";
  }
}

function toggleFav(movie) {
  if (isFav(movie.imdbID)) {
    favourites = favourites.filter((m) => m.imdbID !== movie.imdbID);
  } else {
    favourites.push(movie);
  }
  saveFavs();
  render();
}

function render() {
  const list = view === "results" ? lastResults : favourites;
  grid.innerHTML = "";
  if (view === "favs") {
    statusEl.textContent = list.length ? "" : "No favourites yet. Tap the heart on any movie to save it.";
  }
  list.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${movie.Poster !== "N/A" ? movie.Poster : NO_POSTER}" alt="${movie.Title} poster" loading="lazy">
      <button class="heart ${isFav(movie.imdbID) ? "on" : ""}" aria-label="Toggle favourite">${isFav(movie.imdbID) ? "♥" : "♡"}</button>
      <div class="info"><h3>${movie.Title}</h3><p>${movie.Year}</p></div>`;
    card.addEventListener("click", () => showDetails(movie.imdbID));
    card.querySelector(".heart").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFav(movie);
    });
    grid.appendChild(card);
  });
}

function switchView(next) {
  view = next;
  tabResults.classList.toggle("active", next === "results");
  tabFavs.classList.toggle("active", next === "favs");
  if (next === "results") statusEl.textContent = lastResults.length ? "" : "Search for a movie to begin.";
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = queryInput.value.trim();
  if (!q) return;
  view = "results";
  tabResults.classList.add("active");
  tabFavs.classList.remove("active");
  searchMovies(q);
});
tabResults.addEventListener("click", () => switchView("results"));
tabFavs.addEventListener("click", () => switchView("favs"));
document.getElementById("close").addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

saveFavs();
statusEl.textContent = "Search for a movie to begin.";
