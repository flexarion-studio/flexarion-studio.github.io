/* Mini-démo Vesper Protocol : trois puzzles de logique ternaire. JavaScript pur, sans dépendance. */
(function () {
  'use strict';
  var NEG = function (a) { return -a; };
  var MIN = Math.min, MAX = Math.max;
  var ADD = function (a, b) { var s = a + b; return s > 1 ? s - 3 : s < -1 ? s + 3 : s; };
  var SYM = { '-1': '−', '0': '0', '1': '+' };
  var NOM = { '-1': '−1 (négatif)', '0': '0 (neutre)', '1': '+1 (positif)' };
  var fmt = function (v) { return v > 0 ? '+' + v : v < 0 ? '−' + (-v) : '0'; };

  var LEVELS = [
    { titre: 'Porte 12-A : l\'inverseur',
      brief: 'La porte s\'ouvre quand la sortie de NEG vaut +1. NEG inverse la valeur : −1 devient +1, +1 devient −1, et 0 reste 0.',
      inputs: ['A'], start: [0],
      outputs: [{ label: 'NEG(A)', f: function (v) { return NEG(v[0]); }, cible: 1 }] },
    { titre: 'Sas 12-B : le ET et le OU',
      brief: 'MIN garde la plus petite valeur (le « ET » ternaire), MAX la plus grande (le « OU »). Le sas exige les deux conditions à la fois.',
      inputs: ['A', 'B'], start: [-1, -1],
      outputs: [{ label: 'MIN(A, B)', f: function (v) { return MIN(v[0], v[1]); }, cible: 0 },
                { label: 'MAX(A, B)', f: function (v) { return MAX(v[0], v[1]); }, cible: 1 }] },
    { titre: 'Registre du Gardien G-7',
      brief: 'Les trois trits forment un nombre en ternaire équilibré : A vaut 9, B vaut 3, C vaut 1. Attention, ADD tourne en rond : +1 + +1 = −1.',
      inputs: ['A', 'B', 'C'], start: [0, 0, 0],
      outputs: [{ label: 'Valeur de ABC', f: function (v) { return 9 * v[0] + 3 * v[1] + v[2]; }, cible: 7 },
                { label: 'ADD(A, C)', f: function (v) { return ADD(v[0], v[2]); }, cible: -1 }] }
  ];

  var root = document.getElementById('demo');
  if (!root) return;
  var el = function (id) { return document.getElementById(id); };
  var niveau = 0, etat = [], resolu = [false, false, false];

  function rendre() {
    var L = LEVELS[niveau];
    el('demo-progression').textContent = 'Niveau ' + (niveau + 1) + ' sur ' + LEVELS.length;
    el('demo-titre').textContent = L.titre;
    el('demo-brief').textContent = L.brief;
    var box = el('demo-entrees');
    box.innerHTML = '';
    L.inputs.forEach(function (nom, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'trit';
      b.setAttribute('aria-describedby', 'demo-aide');
      b.addEventListener('click', function () { changer(i, 1); });
      b.addEventListener('keydown', function (e) {
        var d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); changer(i, d); }
      });
      box.appendChild(b);
    });
    el('demo-precedent').disabled = niveau === 0;
    maj(false);
  }

  function changer(i, d) {
    var v = etat[i] + d;
    etat[i] = v > 1 ? -1 : v < -1 ? 1 : v;
    maj(true);
  }

  function maj(annoncer) {
    var L = LEVELS[niveau];
    var boutons = el('demo-entrees').querySelectorAll('.trit');
    L.inputs.forEach(function (nom, i) {
      var b = boutons[i], v = etat[i];
      b.dataset.v = v;
      b.innerHTML = '<span aria-hidden="true">' + SYM[v] + '</span><small aria-hidden="true">' + nom + ' = ' + fmt(v) + '</small>';
      b.setAttribute('aria-label', 'Entrée ' + nom + ', valeur ' + NOM[v]);
    });
    var ok = true, lignes = [], resume = [];
    L.outputs.forEach(function (o) {
      var r = o.f(etat), bon = r === o.cible;
      ok = ok && bon;
      lignes.push('<tr><th scope="row"><code>' + o.label + '</code></th><td>' + fmt(r) + '</td><td>' + fmt(o.cible) +
        '</td><td class="' + (bon ? 'demo-ok' : 'demo-ko') + '">' + (bon ? '✓ conforme' : '✗ à corriger') + '</td></tr>');
      resume.push(o.label + ' vaut ' + fmt(r) + (bon ? ', conforme' : ', cible ' + fmt(o.cible)));
    });
    el('demo-sorties').innerHTML = lignes.join('');
    var suivant = el('demo-suivant');
    suivant.disabled = !ok;
    suivant.textContent = niveau === LEVELS.length - 1 ? 'Terminer la démo' : 'Niveau suivant';
    var dejaResolu = resolu[niveau];
    if (ok) resolu[niveau] = true;
    el('demo-etat').textContent = ok ? 'Déverrouillé ! ' + (niveau === LEVELS.length - 1 ? 'Dernier puzzle résolu.' : 'Passez au niveau suivant.')
      : 'Verrouillé. ' + resume.join(' ; ') + '.';
    if (ok && annoncer && !dejaResolu) suivant.focus();
  }

  function aller(n) {
    niveau = n;
    etat = LEVELS[n].start.slice();
    el('demo-fin').hidden = true;
    el('demo-jeu').hidden = false;
    rendre();
  }

  el('demo-suivant').addEventListener('click', function () {
    if (niveau < LEVELS.length - 1) { aller(niveau + 1); el('demo-titre').focus(); }
    else { el('demo-jeu').hidden = true; el('demo-fin').hidden = false; el('demo-fin-titre').focus(); }
  });
  el('demo-precedent').addEventListener('click', function () { if (niveau > 0) { aller(niveau - 1); el('demo-titre').focus(); } });
  el('demo-reset').addEventListener('click', function () { aller(niveau); });
  el('demo-rejouer').addEventListener('click', function () { resolu = [false, false, false]; aller(0); el('demo-titre').focus(); });

  root.hidden = false;
  el('demo-sans-js').hidden = true;
  aller(0);
})();
