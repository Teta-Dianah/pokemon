var API = 'https://pokeapi.co/api/v2/pokemon';
var allPokemon = [];
var activeType = 'all';

var typeColors = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0',
  electric: '#f8d030', grass: '#78c850', ice: '#98d8d8',
  fighting: '#c03028', poison: '#a040a0', ground: '#e0c068',
  flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8',
  dark: '#705848', steel: '#b8b8d0', fairy: '#ee99ac'
};

// --- INDEX PAGE ---

function loadPokedex() {
  var grid = document.getElementById('grid');
  if (!grid) return;

  grid.innerHTML = '<p class="loading">Loading Pokemon...</p>';

  fetch(API + '?limit=50')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var promises = [];
      for (var i = 0; i < data.results.length; i++) {
        promises.push(fetch(data.results[i].url).then(function (r) { return r.json(); }));
      }
      return Promise.all(promises);
    })
    .then(function (results) {
      allPokemon = results;
      buildFilters();
      showCards(allPokemon);
    });
}

function buildFilters() {
  var container = document.getElementById('filters');
  if (!container) return;

  var typesFound = {};
  for (var i = 0; i < allPokemon.length; i++) {
    for (var j = 0; j < allPokemon[i].types.length; j++) {
      typesFound[allPokemon[i].types[j].type.name] = true;
    }
  }

  var html = '<button class="filter-btn active" data-type="all" style="background:#888">All</button>';
  var typeList = Object.keys(typesFound).sort();
  for (var i = 0; i < typeList.length; i++) {
    var color = typeColors[typeList[i]] || '#888';
    html += '<button class="filter-btn" data-type="' + typeList[i] + '" style="background:' + color + '">' + typeList[i] + '</button>';
  }
  container.innerHTML = html;

  container.addEventListener('click', function (e) {
    if (e.target.className.indexOf('filter-btn') === -1) return;
    activeType = e.target.getAttribute('data-type');

    var btns = container.querySelectorAll('.filter-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove('active');
    }
    e.target.classList.add('active');

    filterAndShow();
  });
}

function filterAndShow() {
  var searchBox = document.getElementById('search');
  var term = searchBox ? searchBox.value.toLowerCase() : '';

  var filtered = allPokemon.filter(function (p) {
    var nameMatch = p.name.indexOf(term) !== -1;
    if (activeType === 'all') return nameMatch;
    var typeMatch = false;
    for (var i = 0; i < p.types.length; i++) {
      if (p.types[i].type.name === activeType) typeMatch = true;
    }
    return nameMatch && typeMatch;
  });

  showCards(filtered);
}

function showCards(list) {
  var grid = document.getElementById('grid');
  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = '<p class="loading">No Pokemon found.</p>';
    return;
  }

  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    var img = p.sprites.front_default;
    var mainType = p.types[0].type.name;
    var color = typeColors[mainType] || '#888';

    var card = document.createElement('div');
    card.className = 'card';
    card.style.borderColor = color;
    card.innerHTML =
      '<img src="' + img + '" alt="' + p.name + '" />' +
      '<h3>' + p.name + '</h3>' +
      '<span class="pokemon-id">#' + p.id + '</span>' +
      '<span class="card-type" style="background:' + color + '">' + mainType + '</span>' +
      '<a href="details.html?name=' + p.name + '" class="details-link">View Details</a>';

    grid.appendChild(card);
  }
}

function setupSearch() {
  var searchBox = document.getElementById('search');
  if (!searchBox) return;

  searchBox.addEventListener('input', function () {
    filterAndShow();
  });
}

// --- DETAILS PAGE ---

function loadDetail() {
  var detail = document.getElementById('detail');
  if (!detail) return;

  var params = new URLSearchParams(location.search);
  var name = params.get('name');

  if (!name) {
    detail.innerHTML = '<p>No Pokemon specified.</p>';
    return;
  }

  detail.innerHTML = '<p class="loading">Loading...</p>';

  fetch(API + '/' + name)
    .then(function (res) { return res.json(); })
    .then(function (p) {
      var types = '';
      for (var i = 0; i < p.types.length; i++) {
        var typeName = p.types[i].type.name;
        var color = typeColors[typeName] || '#888';
        types += '<span class="type-badge" style="background:' + color + '">' + typeName + '</span>';
      }

      var stats = '';
      for (var i = 0; i < p.stats.length; i++) {
        var percent = Math.min(p.stats[i].base_stat, 150) / 150 * 100;
        stats +=
          '<div class="stat-row">' +
            '<span class="stat-name">' + p.stats[i].stat.name + '</span>' +
            '<div class="stat-bar"><div class="stat-fill" style="width:' + percent + '%"></div></div>' +
            '<span class="stat-value">' + p.stats[i].base_stat + '</span>' +
          '</div>';
      }

      var abilities = '';
      for (var i = 0; i < p.abilities.length; i++) {
        if (i > 0) abilities += ', ';
        abilities += p.abilities[i].ability.name;
      }

      detail.innerHTML =
        '<img src="' + p.sprites.front_default + '" alt="' + p.name + '" />' +
        '<h2>' + p.name + ' <small>#' + p.id + '</small></h2>' +
        '<div class="types">' + types + '</div>' +
        '<table>' +
          '<tr><td>Height</td><td>' + (p.height / 10) + ' m</td></tr>' +
          '<tr><td>Weight</td><td>' + (p.weight / 10) + ' kg</td></tr>' +
          '<tr><td>Abilities</td><td>' + abilities + '</td></tr>' +
        '</table>' +
        '<h3 class="stats-title">Base Stats</h3>' +
        stats;

      document.title = p.name.charAt(0).toUpperCase() + p.name.slice(1);
    });
}

loadPokedex();
setupSearch();
loadDetail();
