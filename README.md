# 🚀 Slide AI — AI-Powered Presentation Generator

Generate, edit, and export professional slide decks using AI — fully deployed on **Cloudflare Edge**.

**Live Demo**  
👉 https://slide-ai.slide-ai-h.workers.dev

---

## Overview

Slide AI is an AI-powered presentation builder developed with **Next.js App Router**, modern LLM APIs, and deployed entirely on **Cloudflare Workers**.

The application allows users to:

- Generate complete slide decks from natural language
- Edit content interactively
- Regenerate text or images using AI
- Export presentations as **PDF** or **PPTX**

This project was built as a technical case focusing on:

- Production-ready architecture  
- Edge-first deployment  
- Scalable AI integration  
- Secure authentication  

---

## Features

### AI Slide Generation

- Generate full slide decks from user prompts  
- Structured slide format (title, bullets, image prompt, layout)  
- Controlled prompt design for consistent output  

### AI Image Generation

- Generate images per slide  
- Regenerate individual visuals  
- CDN-safe loading with retry handling  

### Interactive Slide Editor

**Left Panel**

- Slide navigation  
- Reordering & selection  

**Right Panel**

- Editable title and bullet points  
- Editable image prompt  
- Layout selection  
- Autosave on change  

### Export

- PDF export (Puppeteer via Cloudflare Worker)  
- PPTX export  
- Theme-aware rendering  
- Edge-compatible processing pipeline  

### Authentication

- Google OAuth (Auth.js / NextAuth)  
- Secure session management  
- User-based document isolation  

---

## Architecture

### Frontend & Backend
- Next.js 16 (App Router)
- Server Components + Client Components separation
- Route Handlers for API logic
- Edge-compatible execution via **OpenNext**

### AI Layer

- Direct LLM integration (**no Vercel AI SDK**)
- Modular AI service structure
- Async handling with loading/error states
- Regenerate workflows

### Database

- PostgreSQL (Neon)
- Drizzle ORM
- Edge + Node runtime compatibility

---

## Cloudflare Deployment

Fully deployed on the **Cloudflare Free Plan**.

### Stack

- OpenNext → Next.js on Workers  
- Cloudflare Workers (Edge runtime)  
- Wrangler for deployment  
- Separate PDF rendering Worker  
- Service Binding between Workers  

## Security

- Google OAuth via Auth.js  
- User-level authorization checks  
- Environment variables stored as Cloudflare Secrets  
- No sensitive credentials in source code  
- Edge-safe session handling  


## Local Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
````

The app will run on **[http://localhost:3000](http://localhost:3000)**

---

## Required Environment Variables

```
DATABASE_URL=
DIRECT_DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
PDF_WORKER_URL=
```

> Do not commit `.env` files to the repository.

---

## Deployment

Build and deploy to Cloudflare:

```bash
npm run cf:build
npx wrangler deploy
```

Service binding configuration:

```
[[services]]
binding = "PDF_RENDERER"
service = "slide-ai-pdf-renderer"
```

---

## Usage Flow

1. Sign in with Google
2. Enter a presentation topic
3. Generate slides
4. Edit or regenerate content
5. Export to PDF or PPTX


## Future Improvements

* Streaming slide generation
* Real-time collaboration
* Slide template library
* Usage analytics
* Rate limiting per user

---

## Author

**Hacer Duz**

Built as part of a technical case focusing on scalable AI application architecture, edge deployment, and production-ready system design.
