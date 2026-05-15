# BPM Tap Tempo Web Component `<bpm-tap-tempo>`

A highly customizable, dependency-free vanilla Web Component for calculating and visualizing musical tempo. 

<img width="462" height="667" alt="image" src="https://github.com/user-attachments/assets/a294ab84-3bc5-44e2-8b81-1b11300af401" />

## 📖 Overview

The `<bpm-tap-tempo>` component is designed to be dropped into any web application, regardless of the overarching framework (React, Vue, Angular, or Vanilla JS). It provides musicians, audio engineers, and developers with an interactive metronome and tap-tempo calculator featuring visual pendulum animations, audio cues, and different dynamic themes.

## ✨ Features

* **Framework Agnostic:** Built using standard Web Component APIs (`HTMLElement`, Shadow DOM).
* **Tap Tempo Engine:** Calculates BPM based on user click/touch intervals.
* **Audio-Visual Metronome:** Uses the Web Audio API for precise scheduling, paired with CSS/SVG animations for visual feedback.
* **Time Signatures:** Supports dynamic time signature switching (2/4, 3/4, 4/4, 5/4, 6/8, 7/8) with corresponding beat-dot visualizations.
* **4 Built-in Themes:**
  * Modern (displayed in the first screenshot)
  * Dark
    <img width="383" height="645" alt="image" src="https://github.com/user-attachments/assets/4f80ebef-7a4f-4e28-9ead-181e4ab9f65e" />
  * Light
    <img width="362" height="637" alt="image" src="https://github.com/user-attachments/assets/90a36dcd-99ab-4128-81ef-3821f1433d23" />
  * Vintage
    <img width="708" height="831" alt="image" src="https://github.com/user-attachments/assets/2a74679c-9e7a-46f7-a3c6-e12ca693f136" />

## 🚀 Installation & Usage

Because this is a vanilla Web Component, no build tools or package managers are required.

### Include the files
Ensure the component's JavaScript and CSS files are accessible in your project. Include the script in your HTML `<head>`:

```html
<script src="bpm-tap-tempo.js" defer></script>
