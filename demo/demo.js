/* Mini-démo Vesper Protocol : trois puzzles de logique ternaire. JavaScript pur, sans dépendance.
   Langue choisie d'après <html lang="..."> (fr par défaut, en). */
(function () {
  'use strict';
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  var NEG = function (a) { return -a; };
  var MIN = Math.min, MAX = Math.max;
  var ADD = function (a, b) { var s = a + b; return s > 1 ? s - 3 : s < -1 ? s + 3 : s; };
  var SYM = { '-1': '−', '0': '0', '1': '+' };
  var fmt = function (v) { return v > 0 ? '+' + v : v < 0 ? '−' + (-v) : '0'; };

  var T = EN ? {
    nom: { '-1': '−1 (negative)', '0': '0 (neutral)', '1': '+1 (positive)' },
    entree: 'Input ', valeur: ', value ', niveau: function (n, t) { return 'Level ' + n + ' of ' + t; },
    ok: '✓ matches', ko: '✗ fix it', vaut: ' is ', conforme: ', matches', cible: ', target ',
    deverrouille: 'Unlocked! ', dernier: 'Last puzzle solved.', suivantMsg: 'Go to the next level.',
    verrouille: 'Locked. ', suivant: 'Next level', terminer: 'Finish the demo', abc: 'Value of ABC',
    levels: [
      ['Door 12-A: the inverter', 'The door opens when the output of NEG is +1. NEG flips the value: −1 becomes +1, +1 becomes −1, and 0 stays 0.'],
      ['Airlock 12-B: AND and OR', 'MIN keeps the smaller value (ternary “AND”), MAX the larger one (ternary “OR”). The airlock needs both conditions at once.'],
      ['Guardian G-7\'s register', 'The three trits form a balanced ternary number: A is worth 9, B is worth 3, C is worth 1. Careful, ADD wraps around: +1 + +1 = −1.']
    ]
  } : {
    nom: { '-1': '−1 (négatif)', '0': '0 (neutre)', '1': '+1 (positif)' },
    entree: 'Entrée ', valeur: ', valeur ', niveau: function (n, t) { return 'Niveau ' + n + ' sur ' + t; },
    ok: '✓ conforme', ko: '✗ à corriger', vaut: ' vaut ', conforme: ', conforme', cible: ', cible ',
    deverrouille: 'Déverrouillé ! ', dernier: 'Dernier puzzle résolu.', suivantMsg: 'Passez au niveau suivant.',
    verrouille: 'Verrouillé. ', suivant: 'Niveau suivant', terminer: 'Terminer la démo', abc: 'Valeur de ABC',
    levels: [
      ['Porte 12-A : l\'inverseur', 'La porte s\'ouvre quand la sortie de NEG vaut +1. NEG inverse la valeur : −1 devient +1, +1 devient −1, et 0 reste 0.'],
      ['Sas 12-B : le ET et le OU', 'MIN garde la plus petite valeur (le « ET » ternaire), MAX la plus grande (le « OU »). Le sas exige les deux conditions à la fois.'],
      ['Registre du Gardien G-7', 'Les trois trits forment un nombre en ternaire équilibré : A vaut 9, B vaut 3, C vaut 1. Attention, ADD tourne en rond : +1 + +1 = −1.']
    ]
  };

  var LEVELS = [
    { inputs: ['A'], start: [0],
      outputs: [{ label: 'NEG(A)', f: function (v) { return NEG(v[0]); }, cible: 1 }] },
    { inputs: ['A', 'B'], start: [-1, -1],
      outputs: [{ label: 'MIN(A, B)', f: function (v) { return MIN(v[0], v[1]); }, cible: 0 },
                { label: 'MAX(A, B)', f: function (v) { return MAX(v[0], v[1]); }, cible: 1 }] },
    { inputs: ['A', 'B', 'C'], start: [0, 0, 0],
      outputs: [{ label: T.abc, f: function (v) { return 9 * v[0] + 3 * v[1] + v[2]; }, cible: 7 },
                { label: 'ADD(A, C)', f: function (v) { return ADD(v[0], v[2]); }, cible: -1 }] }
  ];

  var root = document.getElementById('demo');
  if (!root) return;
  var el = function (id) { return document.getElementById(id); };
  var niveau = 0, etat = [], resolu = [false, false, false];

  function rendre() {
    var L = LEVELS[niveau];
    el('demo-progression').textContent = T.niveau(niveau + 1, LEVELS.length);
    el('demo-titre').textContent = T.levels[niveau][0];
    el('demo-brief').textContent = T.levels[niveau][1];
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
      b.setAttribute('aria-label', T.entree + nom + T.valeur + T.nom[v]);
    });
    var ok = true, lignes = [], resume = [];
    L.outputs.forEach(function (o) {
      var r = o.f(etat), bon = r === o.cible;
      ok = ok && bon;
      lignes.push('<tr><th scope="row"><code>' + o.label + '</code></th><td>' + fmt(r) + '</td><td>' + fmt(o.cible) +
        '</td><td class="' + (bon ? 'demo-ok' : 'demo-ko') + '">' + (bon ? T.ok : T.ko) + '</td></tr>');
      resume.push(o.label + T.vaut + fmt(r) + (bon ? T.conforme : T.cible + fmt(o.cible)));
    });
    el('demo-sorties').innerHTML = lignes.join('');
    var suivant = el('demo-suivant');
    suivant.disabled = !ok;
    suivant.textContent = niveau === LEVELS.length - 1 ? T.terminer : T.suivant;
    var dejaResolu = resolu[niveau];
    if (ok) resolu[niveau] = true;
    el('demo-etat').textContent = ok ? T.deverrouille + (niveau === LEVELS.length - 1 ? T.dernier : T.suivantMsg)
      : T.verrouille + resume.join(' ; ') + '.';
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

  // Bouton « Copier » du code d'intégration (page /demo/ uniquement)
  var copier = el('demo-copier');
  if (copier) copier.addEventListener('click', function () {
    var zone = el('demo-code-integration');
    zone.select();
    var fait = function () { el('demo-copie-etat').textContent = EN ? 'Code copied.' : 'Code copié.'; };
    if (navigator.clipboard) navigator.clipboard.writeText(zone.value).then(fait, function () { document.execCommand('copy'); fait(); });
    else { document.execCommand('copy'); fait(); }
  });

  root.hidden = false;
  if (el('demo-sans-js')) el('demo-sans-js').hidden = true;
  aller(0);
})();
