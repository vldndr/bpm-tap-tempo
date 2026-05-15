# BPM Tap Tempo Web Component `<bpm-tap-tempo>`

A highly customizable, dependency-free vanilla Web Component for calculating and visualizing musical tempo. 

<img width="231" height="333.5" alt="image" src="https://github.com/user-attachments/assets/a294ab84-3bc5-44e2-8b81-1b11300af401" />

## Overview

The `<bpm-tap-tempo>` component is designed to be dropped into any web application, regardless of the overarching framework (React, Vue, Angular, or Vanilla JS). It provides musicians, audio engineers, and developers with an interactive metronome and tap-tempo calculator featuring visual pendulum animations, audio cues, and different dynamic themes.

## Features

* **Framework Agnostic:** Built using standard Web Component APIs (`HTMLElement`, Shadow DOM).
* **Tap Tempo Engine:** Calculates BPM based on user click/touch intervals.
* **Audio-Visual Metronome:** Uses the Web Audio API for precise scheduling, paired with CSS/SVG animations for visual feedback.
* **Time Signatures:** Supports dynamic time signature switching (2/4, 3/4, 4/4, 5/4, 6/8, 7/8) with corresponding beat-dot visualizations.
* **4 Built-in Themes:**
  * Modern (displayed in the first screenshot)
  * Dark
    <img width="191.5" height="322.5" alt="image" src="https://github.com/user-attachments/assets/4f80ebef-7a4f-4e28-9ead-181e4ab9f65e" />
  * Light
    <img width="181" height="318.5" alt="image" src="https://github.com/user-attachments/assets/90a36dcd-99ab-4128-81ef-3821f1433d23" />
  * Vintage
    <img width="354" height="415.5" alt="image" src="https://github.com/user-attachments/assets/2a74679c-9e7a-46f7-a3c6-e12ca693f136" />

## Installation & Usage

Because this is a vanilla Web Component, no build tools or package managers are required.

### 1. Include the files
Ensure the component's JavaScript and CSS files are accessible in your project. Include the script in your HTML `<head>`:

```html
<script src="bpm-tap-tempo.js" defer></script>
```

### 2. Add the element to your DOM
Place the custom tag anywhere in your HTML body:

```html
<bpm-tap-tempo theme="modern" min-bpm="40" max-bpm="240"></bpm-tap-tempo>
```

---

## API & Configuration

The component can be controlled via HTML attributes. Changes to these attributes are observed and will update the UI in real-time.

### Attributes

| Attribute  | Type     | Default | Description |
| :---       | :---     | :---    | :---        |
| `theme`    | `String` | `modern`| Sets the visual theme (`modern`, `dark`, `light`, `vintage`). |
| `min-bpm`  | `Number` | `40`    | The minimum allowed tempo. |
| `max-bpm`  | `Number` | `240`   | The maximum allowed tempo. |
| `bpm`      | `Number` | `120`   | The initial/current tempo. |
| `time-sig` | `String` | `4/4`   | The initial time signature (e.g., `3/4`, `6/8`). |

---

## Custom Events API

To be sure that this component acts as a modular piece within any larger application or framework, it implements a robust event-driven architecture using the native `CustomEvent` API. All custom events are dispatched with `bubbles: true` and `composed: true`, meaning they successfully pierce the Shadow DOM and can be listened to on any parent element.

All event data is passed via the standard `event.detail` property.

### Available Events

#### 1. `bpm-change`: Triggered whenever the BPM value changes as a result of user interaction (either by tapping the button/space bar or using the slider).
#### 2. `bpm-set`: Triggered when the BPM is updated.
#### 3. `timesig-change`: Triggered when the user clicks one of the Time Signature buttons (e.g., switching from 4/4 to 3/4).
#### 4. `metronome-start`: Triggered when the metronome is toggled on.
#### 5. `metronome-stop`: Triggered when the metronome is toggled off.
#### 6. `metronome-tick`: Played continuously while the metronome is playing, in sync with the audio tick and visual flash.

## Live Demo

You can view the component directly in the browser here:  
**[Live Demo](https://vldndr.github.io/bpm-tap-tempo/)**
