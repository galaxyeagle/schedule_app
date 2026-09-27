# Schedule App

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22981870.svg)](https://doi.org/10.5281/zenodo.22981870)

An interactive scheduling tool that models people's preferred meeting times using **Gaussian (normal) distributions**.

Rather than representing availability as simply *free* or *busy*, the app represents each person's preferred meeting time as a continuous probability distribution:

- **μ (mean)** — preferred meeting time
- **σ (standard deviation)** — flexibility around that time

Multiple users' distributions can be visualized together to explore potential overlaps in meeting preferences.

## Features

- Interactive 24-hour scheduling visualization
- Gaussian preference curves for multiple users
- Drag-and-adjust controls for preferred time and flexibility
- Persistent data using browser `localStorage`
- Responsive web interface

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- SVG visualization
- Browser `localStorage`

## Getting Started

```bash
npm install
npm run dev
