---
title: "Raymarching a nebula: the basics, with an example shader"
published: false
description: "Ray, density, Beer–Lambert law and accumulation: a step-by-step GLSL tutorial to code a volumetric nebula, with a complete shader to copy."
tags: gamedev, glsl, shaders, tutorial
canonical_url: https://flexarion-studio.github.io/en/devlog/raymarching-nebula-shader/
cover_image: https://flexarion-studio.github.io/assets/img/og-flexarion.png
---

In an earlier devlog, we explained how we optimised the nebula of Vesper Protocol. Several readers asked us to start from the beginning. So here are the basics of volumetric raymarching, step by step, with a complete GLSL shader you can paste into Shadertoy.

## The principle: stepping through a volume

A typical game engine draws triangles: it projects their vertices onto the screen and colours the pixels they cover. That works very well for a spaceship or a wall. But a nebula has no surface: it is a cloud of gas, more or less dense, that light partly passes through.

**Raymarching** flips the problem around. For each pixel, we cast a ray from the camera and walk along it in small steps. At each step we ask: "how dense is the gas here?" We accumulate what we see until we leave the volume or the gas becomes opaque.

Everything happens in a *fragment shader*, the program the graphics card runs for every pixel. On Shadertoy, this program is called `mainImage` and receives the pixel position.

## Step 1: build the ray

A ray is an origin (the camera, `ro`) and a direction (`rd`). We start by centring the pixel coordinates and correcting for the screen's aspect ratio:

```glsl
vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
vec3 ro = vec3(0.0, 0.0, -3.5);          // camera pulled back along z
vec3 rd = normalize(vec3(uv, 1.5));      // 1.5 = focal length
```

The point at distance `t` along the ray is simply `ro + rd * t`. Increasing the focal length narrows the field of view, like zooming in.

## Step 2: density from noise

We need a function `density(p)` that returns the amount of gas at point `p`. To get natural swirls, we use **value noise**: pseudo-random numbers placed on a 3D grid and smoothly interpolated. By adding several layers of ever finer noise (*octaves*), we get **fBm** (*fractional Brownian motion*), the basis of almost every procedural cloud.

```glsl
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.02 + vec3(1.7, 9.2, 3.1);  // shift each octave
        a *= 0.5;                             // each octave weighs half as much
    }
    return v;
}
```

To break up the overly regular look, we **distort** the coordinates with a first fBm before computing a second one (*domain warping*): the swirls stretch like gas. We then confine this noise inside a soft sphere, otherwise it would fill all of space, and subtract a threshold to carve holes between the clouds.

## Step 3: absorb and emit light

When light passes through a gas, part of it is absorbed. The **Beer–Lambert law** says that the fraction that gets through, the *transmittance*, decreases exponentially with the density crossed:

```text
T = exp(-absorption × density × step_length)
```

Our nebula is also **emissive**: gas heated by the star glows. At each step, we add the light emitted there to the pixel colour, attenuated by all the gas already crossed (the current transmittance). This is front-to-back compositing:

```text
col += T * emission * d * STEP;   // emitted light, seen through the gas
T   *= exp(-d * STEP);            // the gas in front becomes more opaque
```

Order matters: add the light with the old transmittance, then update it.

## Step 4: the full shader

Here is the whole shader, ready to paste into Shadertoy. It adds two details: a small random offset of each ray's starting point, and an early exit once the gas becomes opaque.

```glsl
// Volumetric nebula: teaching example (Flexarion, devlog #4)
// License CC BY-NC 4.0: flexarion-studio.github.io

float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                   mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                   mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.02 + vec3(1.7, 9.2, 3.1);
        a *= 0.5;
    }
    return v;
}

float density(vec3 p) {
    vec3 q = p * 1.6 + vec3(0.0, 0.0, iTime * 0.06);   // the cloud drifts slowly
    float n = fbm(q + 1.5 * fbm(q));                   // noise warped by noise
    float sphere = 1.0 - smoothstep(0.0, 2.3, length(p));
    return max(n * sphere - 0.36, 0.0) * 8.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0, 0.0, -3.5);
    vec3 rd = normalize(vec3(uv, 1.5));

    const float STEP = 0.08;
    float jitter = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);
    float t = 1.0 + jitter * STEP;
    vec3 col = vec3(0.0);
    float T = 1.0;                        // transmittance

    for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = density(p);
        if (d > 0.001) {
            vec3 emission = mix(vec3(0.3, 0.02, 0.02), vec3(1.0, 0.32, 0.08), clamp(d, 0.0, 1.0));
            col += T * emission * d * STEP;
            T *= exp(-d * STEP);           // Beer-Lambert
            if (T < 0.02) break;          // early exit
        }
        t += STEP;
    }

    // Red star in the background, seen through the remaining gas
    float star = 0.012 / (length(uv - vec2(0.55, 0.22)) + 0.02);
    col += T * (vec3(0.012, 0.01, 0.025) + vec3(1.0, 0.35, 0.12) * star);
    fragColor = vec4(pow(col, vec3(0.4545)), 1.0);   // gamma correction
}
```

## The settings that change everything

- **Step size** (`STEP`): a smaller step gives a finer volume, but costs more computation.
- **Number of steps**: 64 steps of 0.08 cover about 5 units, just enough to cross the sphere.
- **Random offset** (`jitter`): without it, regular bands appear in the cloud; with it, they turn into fine grain.
- **Early exit**: no point going on once less than 2% of the light gets through.
- **Gamma correction**: without it, dark areas look crushed.

This shader is deliberately simple: it recomputes all the noise at every step, at full resolution. In the game, we precompute it into a 3D texture and render at half resolution. That is the topic of our [devlog on optimising the nebula shader](https://flexarion-studio.github.io/devlog/optimisation-shaders-nebuleuse/) (in French), which explains how we went from 9 ms to 2.1 ms per frame.

## Try the shader

The render below runs exactly the code from step 4 in your browser, with WebGL.

*Live preview of the shader: [on the Flexarion devlog](https://flexarion-studio.github.io/en/devlog/raymarching-nebula-shader/#shadertoy).*

To tweak it, open a [new shader on Shadertoy](https://www.shadertoy.com/new), replace the default code with the code from step 4, then press Alt + Enter. Try changing `STEP`, the emission colours or the absorption coefficient to see the effect of each parameter.

## Going further

This nebula surrounds Tau-Heliade, the dying star of [Vesper Protocol](https://flexarion-studio.github.io/en/vesper-protocol/). If you prefer logic to rendering, read our [tutorial on ternary logic](https://flexarion-studio.github.io/en/devlog/ternary-logic-hacking-game/), or play the [mini demo](https://flexarion-studio.github.io/en/demo/) in your browser. All English articles are in the [Flexarion devlog](https://flexarion-studio.github.io/en/devlog/).

---

*Originally published on the [Flexarion devlog](https://flexarion-studio.github.io/en/devlog/raymarching-nebula-shader/). Flexarion is a fictional video game studio created for a computer science student project. Text licensed under CC BY-NC 4.0.*
