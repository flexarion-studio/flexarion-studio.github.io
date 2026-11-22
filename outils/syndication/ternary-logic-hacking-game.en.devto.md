---
title: "Ternary logic explained through a hacking game"
published: false
description: "Trits, balanced ternary, NEG, MIN, MAX and addition modulo 3: an approachable tutorial on ternary logic, through the puzzles of Vesper Protocol."
tags: gamedev, tutorial, beginners, computerscience
canonical_url: https://flexarion.eu/en/devlog/ternary-logic-hacking-game/
cover_image: https://flexarion.eu/assets/img/og-flexarion.png
---

In Vesper Protocol, alien machines don't think in 0s and 1s, but in −1, 0 and +1. This tutorial explains ternary logic through the game's puzzles: how to count with three states, how ternary logic gates work, and why they trip up even experienced developers.

## Why three states instead of two?

A conventional computer handles **bits**: each memory cell is either 0 or 1. That is an engineering choice, not a law of nature. Nothing prevents you from building a machine where each cell can hold three values. Such a digit is called a **trit** (short for *trinary digit*).

A trit carries more information than a bit: about 1.58 bits (that's log₂ 3). With 6 trits you can encode 3⁶ = 729 different values, versus 64 with 6 bits. It isn't just a curiosity: in 1958, Moscow State University built **Setun**, a real ternary computer, of which around fifty units were produced.

For Vesper Protocol, we wanted computing that feels alien while staying logical. Ternary was perfect: players already know binary, or have heard of it, and must "unlearn" it to understand the machines of the Vesper.

## Balanced ternary: counting with −1, 0 and +1

There are two ways to write numbers in base 3. The most intuitive one uses the digits 0, 1 and 2. The Vesper uses −1, 0 and +1 instead: this is **balanced ternary**. In the game's console they are written `−`, `0` and `+`.

It is still a positional system: each trit is multiplied by a power of 3, starting from the right (1, 3, 9, 27…).

```text
+0−  =  (+1 × 9) + (0 × 3) + (−1 × 1)  =  9 + 0 − 1  =  8
−++  =  (−1 × 9) + (+1 × 3) + (+1 × 1)  = −9 + 3 + 1  = −5
```

Two properties make this system very elegant (mathematician Donald Knuth described it as one of the prettiest number systems):

- **No separate sign**: negative numbers are written naturally, with no sign bit and no two's complement.
- **Negating = flipping every trit**: `+0−` is 8, so `−0+` is −8. No arithmetic needed.

Two trits cover every value from −4 to +4; three trits, from −13 to +13. That detail matters in the game: a Vesper register doesn't overflow where a binary register would.

## Ternary logic gates

In logic, the three states can be read as *false* (−1), *unknown* (0) and *true* (+1). This is the three-valued logic described by logician Stephen Kleene. Binary operations then have direct equivalents.

### NEG: the inverter

NEG swaps −1 and +1 and leaves 0 untouched. An inverted "unknown" stays unknown.

| x | NEG x |
| --- | --- |
| −1 | +1 |
| 0 | 0 |
| +1 | −1 |

### MIN and MAX: three-state AND and OR

In binary, AND is 1 only if both inputs are 1: it's the minimum of the two. OR is 1 if either input is 1: it's the maximum. Ternary keeps exactly that idea.

| MIN (x, y) | y = −1 | y = 0 | y = +1 |
| --- | --- | --- | --- |
| x = −1 | −1 | −1 | −1 |
| x = 0 | −1 | 0 | 0 |
| x = +1 | −1 | 0 | +1 |

MAX reads the same way, taking the larger value: MAX(−1, 0) = 0, MAX(0, +1) = +1. An AND is only true if everything is true, and a single "false" is enough to make it false.

### ADD: addition modulo 3

Adding two trits can leave the range: +1 + +1 = 2. In balanced ternary, 2 is written `+−` (3 − 1): you keep the trit −1 and carry +1. The Vesper's virtual machine keeps only the rightmost trit, without the carry:

```text
ADD(+1, +1) = −1      ADD(−1, −1) = +1      ADD(+1, −1) = 0
```

It's counter-intuitive, and that's deliberate: many puzzles rely on this "wrap-around".

## How it becomes a puzzle in Vesper Protocol

In the game, every door or machine reads a register. The player plugs in a console, watches the values and writes a short routine with the available instructions. Here is a typical puzzle from the first sector:

```text
// Door 12-A: opens when R0 = +1
// Allowed instructions: NEG, MAX
R0 = 0
R1 = −1

NEG R1        // R1 = +1
MAX R0, R1    // R0 = max(0, +1) = +1  → door open
```

The difficulty comes from the constraints: a machine only accepts a reduced instruction set, and some instructions heat up the suit. So the player looks for the shortest routine.

### The classic trap: thinking in binary

During our playtests, players who already code all fell into the same traps:

- **Assuming NEG always changes the value**: NEG(0) = 0. A neutral register can't be inverted.
- **Reading MIN(0, +1) as "true"**: the result is 0. An AND with an unknown stays unknown.
- **Forgetting the wrap-around**: ADD(+1, +1) isn't +1 but −1.

These mistakes are the best part of the game: players realise they can't apply their habits to a machine they don't know. That's exactly the mindset of a security auditor facing unknown firmware.

## Exercises: your turn

Three short exercises to check everything is clear. Click to reveal the answer. Prefer hands-on? Try the [playable mini demo](https://flexarion.eu/en/demo/), with three ternary locks.

1. What is `+−0` in decimal? — *Answer:* 9 − 3 + 0 = **6**.
2. What is MAX(NEG(+1), 0)? — *Answer:* NEG(+1) = −1, then MAX(−1, 0) = **0**.
3. How do you write 5 in balanced ternary, with three trits? — *Answer:* `+−−`: 9 − 3 − 1 = **5**.

## Going further

Ternary logic is at the heart of [Vesper Protocol](https://flexarion.eu/en/vesper-protocol/), our space hacking game. On the rendering side, our [tutorial on raymarching a nebula](https://flexarion.eu/en/devlog/raymarching-nebula-shader/) explains how we draw the sky around Tau-Heliade. All English articles are in the [Flexarion devlog](https://flexarion.eu/en/devlog/); more articles, a lore codex and the full press kit are available [in French](https://flexarion.eu/devlog/).

---

*Originally published on the [Flexarion devlog](https://flexarion.eu/en/devlog/ternary-logic-hacking-game/). Flexarion is a fictional video game studio created for a computer science student project. Text licensed under CC BY-NC 4.0.*
