# 🛡️ GigShield — AI-Powered Parametric Insurance for India's Gig Economy

## Overview
GigShield is a full-stack, AI-enabled parametric insurance platform designed to protect gig workers (food/grocery/ecommerce delivery) against income loss caused by external disruptions like extreme weather, floods, pollution, curfews, and bandhs.

---

## 🗂️ Project Structure

```
gigshield/
├── frontend/
│   └── index.html          ← Complete single-file frontend (open in browser)
│
└── backend/
    ├── server.js            ← Node.js + Express API server
    └── package.json         ← Backend dependencies
```

---

## 🚀 Quick Start

### Option A — Frontend Only (No Backend Required)
Just open `frontend/index.html` in your browser. The frontend includes a full mock data layer that simulates all backend responses. **Everything works offline.**

### Option B — Full Stack (Frontend + Backend)

**Backend Setup:**
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

**Frontend:**
Open `frontend/index.html` in your browser. It will automatically connect to the backend at `http://localhost:5000`.

---

## 🌟 Features

### Core Platform
| Feature | Description |
|---|---|
| **Worker Onboarding** | 4-step guided signup with city, platform, segment, and earnings |
| **AI Risk Profiling** | Dynamic risk score (0-100) based on city, segment, weather, hours |
| **Parametric Automation** | Auto-trigger claims for ALL workers in a disruption zone |
| **Fraud Detection** | Multi-signal anomaly detection with fraud score & flags |
| **Instant Payouts** | < 30 second UPI/bank transfer on approval |
| **Analytics Dashboard** | Real-time stats, charts, city breakdown, loss ratio |

### Coverage Types
| Disruption | Threshold | Income Payout |
|---|---|---|
| Cyclone | Category 1+ | 100% |
| Flood | Waterlogging reported | 100% |
| Curfew / Section 144 | Govt notification | 85% |
| Heavy Rain | > 100mm/day | 80% |
| Bandh / Strike | Transport/zone closure | 80% |
| Extreme Heat | > 44°C | 70% |
| Severe Pollution | AQI > 300 | 65% |
| Platform App Outage | > 4 hours | 50% |


## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/workers` | List workers (filter by city/platform/segment) |
| POST | `/api/workers/register` | Register new worker |
| POST | `/api/risk/assess` | AI risk assessment for a worker |
| POST | `/api/premium/calculate` | Calculate premium for parameters |
| GET | `/api/policies` | List all policies |
| POST | `/api/policies/create` | Create new weekly policy |
| POST | `/api/policies/:id/renew` | Renew policy for another week |
| GET | `/api/disruptions` | List disruption events |
| POST | `/api/disruptions/create` | Log new disruption |
| GET | `/api/claims` | List all claims |
| POST | `/api/claims/submit` | Submit a claim (with fraud check) |
| POST | `/api/claims/auto-trigger` | Auto-trigger all claims for a disruption |
| GET | `/api/payouts` | List all payouts |
| GET | `/api/analytics/dashboard` | Full analytics dashboard data |

---

## 🏗️ Architecture

```
Frontend (Vanilla HTML/JS)
    ↓ REST API calls
Backend (Node.js + Express)
    ↓
AI Risk Engine (in-memory)
    ↓
Mock Data Store (replace with MongoDB/PostgreSQL)
    ↓
Mock Payment Gateway (replace with Razorpay/UPI API)
    ↓
Mock Weather API (replace with OpenWeatherMap/IMD API)
```

### Production Integrations (Replace Mocks With)
- **Weather**: OpenWeatherMap API / IMD (India Meteorological Dept)
- **AQI**: CPCB Air Quality API
- **Payments**: Razorpay UPI / Cashfree / NPCI
- **Database**: MongoDB Atlas / PostgreSQL
- **Auth**: Firebase Auth / Supabase
- **Platform APIs**: Zomato/Swiggy Partner APIs

---

## 🤖 AI/ML Components

### Risk Scoring Model
- City-level weather risk weight (30%)
- Delivery segment outdoor exposure (20%)
- Daily hours risk factor (15%)
- Historical disruption frequency (35%)

### Fraud Detection Signals
1. **HIGH_CLAIM_FREQUENCY** — > 3 claims in 30 days
2. **DUPLICATE_CLAIM** — Same disruption claimed twice
3. **LOCATION_MISMATCH** — Worker city ≠ disruption city
4. **AMOUNT_EXCEEDS_COVERAGE** — Claim > policy limit

---

## ⚙️ Golden Rules Compliance

✅ **Persona Focus**: Food (Zomato/Swiggy), Grocery (Zepto/Blinkit), E-Commerce (Amazon/Flipkart)  
✅ **Coverage Scope**: INCOME LOSS ONLY — no health/life/accident/vehicle  
✅ **Weekly Pricing**: All premiums structured on weekly basis  
✅ **Parametric Automation**: Auto-trigger without manual claims  
✅ **AI Integration**: Risk scoring + fraud detection  
✅ **Analytics Dashboard**: Full metrics view  

---

## 👥 Team

Built for the 6-Week AI Insurance Hackathon — India's Gig Economy Protection Challenge