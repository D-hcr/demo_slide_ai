# 🚀 Slide AI — AI-Powered Presentation Generator

> Generate, edit, and export professional slide decks using AI — deployed on Cloudflare Edge.

**Live Demo:**  
👉 https://slide-ai.slide-ai-h.workers.dev

---

## 📌 Overview

**Slide AI** is an AI-powered presentation builder developed using **Next.js App Router**, modern LLM APIs, and deployed fully on **Cloudflare Workers**.

The application allows users to generate complete slide decks from natural language, edit content interactively, regenerate text or images using AI, and export presentations to **PDF** or **PPTX**.

This project was built as a technical case focusing on:

- Production-ready architecture  
- Edge deployment  
- Scalable AI integration  
- Secure authentication  

---

## ✨ Features

### AI Slide Generation
- Generate full slide decks from user prompts
- Structured slide format (title, bullets, image prompt, layout)
- Controlled prompt design for consistency

### AI Image Generation
- Generate images per slide
- Regenerate individual images
- CDN-safe loading with retry handling

### Slide Editor
**Left Panel**
- Slide navigation
- Reordering & selection

**Right Panel**
- Editable title & bullet points
- Editable image prompt
- Layout selection
- Autosave on change

### Export
- 📄 PDF export (Puppeteer via Cloudflare Worker)
- 📊 PPTX export
- Theme-aware rendering
- Edge-compatible pipeline

### Authentication
- Google OAuth (Auth.js / NextAuth)
- Secure session management
- User-based document isolation

---

## 🏗 Architecture

### Frontend & Backend
- Next.js 16 (App Router)
- Server Components + Client Components separation
- Route Handlers for API logic
- Edge-compatible execution

### AI Layer
- Direct LLM integration (no Vercel AI SDK)
- Modular AI service structure
- Async handling with loading/error states
- Regenerate workflows

### Database
- PostgreSQL (Neon)
- Drizzle ORM
- Edge + Node runtime compatibility

---

## ☁️ Cloudflare Deployment

Fully deployed on **Cloudflare Free Plan**

**Stack**
- OpenNext → Next.js on Workers
- Cloudflare Workers (Edge runtime)
- Wrangler for deployment
- Separate PDF rendering Worker
- Service Binding between Workers

### Infrastructure Flow

