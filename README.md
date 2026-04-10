# Nyumba360 - Rental Property Management Platform

## Overview
Nyumba360 is a digital property management platform that transforms how Kenya's 2+ million informal landlords manage their rental portfolios.

## Tech Stack
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React.js + Tailwind CSS
- **Mobile**: React Native (future)
- **Payments**: M-Pesa Daraja API
- **Digital Signatures**: DocuSeal/Dropbox Sign API

## Project Structure
```
nyumba360/
  backend/          # Node.js API server
  frontend/         # React.js web dashboard
  mobile/           # React Native app
  database/         # Database migrations and seeds
```

## Quick Start

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Set up environment variables
```bash
cd backend
cp .env.example .env
# Configure your .env file with database and M-Pesa credentials
```

### 3. Set up database
```bash
cd backend
npm run migrate
```

### 4. Start development servers
```bash
# From root directory
npm run dev
```

This will start:
- Backend API on http://localhost:5000
- Frontend dashboard on http://localhost:3000

## Core Features
- Property & Unit Management
- Tenant Management
- M-Pesa Rent Collection
- Digital Tenancy Agreements
- Rent Tracking & Arrears
- Maintenance Tickets
- Vacancy Listings
- Expense Tracking

## MVP Timeline
- **Month 1**: UI/UX design, M-Pesa integration, legal review
- **Month 2-3**: Core MVP development
- **Month 3**: Beta testing with 100 landlords
- **Month 4**: Public launch

## License
MIT License
