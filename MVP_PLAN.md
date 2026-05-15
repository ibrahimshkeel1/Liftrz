# Trainly MVP Plan

## Product Overview
**Trainly** is a personal trainer discovery marketplace that solves the problem of finding trustworthy trainers by showing real results, verified reviews, and transparent pricing.

**Core Value Prop:**
- Clients see trainer transformations + reviews before hiring
- Trainers build credibility through outcome tracking
- Transparent pricing (no hidden gym commissions)
- Direct trainer-client connection

---

## MVP Phase 1: Core Discovery & Trainer Profiles (Weeks 1-2)

### 1.1 Trainer Discovery Page (Discover.tsx)
**Current:** Basic search + goal filters  
**To Build:**
- [x] Full-text search (name, specialty, location)
- [x] Advanced filters:
  - [x] Price range slider (1,000 - 10,000+)
  - [x] Rating filter (4.0+, 4.5+, etc.)
  - [x] Goal tags (Muscle Gain, Fat Loss, Rehab, Yoga, etc.)
  - [x] Location filter
  - [x] Experience level (Beginner-friendly, Advanced, etc.)
- [x] Sort options (Rating, Price Low→High, Most Recent, Most Popular)
- [x] Trainer cards showing:
  - [x] Profile image, name, specialty
  - [x] Price per session
  - [x] Rating + review count
  - [x] Top results badge (transformation count/success rate)
  - [x] Location
  - [x] Quick stats (avg fat loss, client retention)

### 1.2 Trainer Profile Page (TrainerProfile.tsx)
**Current:** Basic template  
**To Build:**
- [x] Hero section:
  - [x] Large profile photo, name, specialty
  - [x] Key stats: Rating, Reviews, Success Rate, Active Protocols
  - [x] Bio/About section with personality
- [x] Transformations Gallery:
  - [x] Before/After image carousel
  - [x] Duration, description, result each
  - [x] Client testimonial (optional)
- [x] Services Section:
  - [x] Protocols/packages with prices
  - [x] What's included per package
  - [x] Duration
- [x] Reviews Section:
  - [x] Star rating breakdown
  - [x] Individual reviews with star rating + client name
  - [x] "See all reviews" link
- [x] CTA: "Hire This Trainer" button → Lead creation

### 1.3 Database Schema Setup
**Current:** Basic JSON structure  
**To Add:**
```json
trainers: {
  - certifications (array)
  - hourly_rate, package_rate
  - availability (days/hours)
  - acceptance_rate
  - response_time_hours
}
transformations: {
  - client_name
  - client_age
  - starting_condition (text)
  - ending_condition (text)
  - featured (boolean)
}
reviews: {
  - trainer_id
  - client_name
  - rating (1-5)
  - text
  - result_achieved
  - verified (boolean)
}
leads: {
  - client_name, email, phone
  - trainer_id
  - protocol_id (optional)
  - status: ['new', 'contacted', 'negotiating', 'booked', 'rejected']
  - message
  - created_at
}
```

---

## MVP Phase 2: Trainer Onboarding & Profile Management (Weeks 2-3)

### 2.1 Trainer Onboarding Flow (BecomeTrainer.tsx + Onboarding.tsx)
**Current:** Basic form  
**To Build:**
- [x] **Step 1: Account Creation**
  - [x] Name, email, phone
  - [x] Gym/location
  - [x] Profile photo upload
- [x] **Step 2: Professional Info**
  - [x] Specialties (multi-select)
  - [x] Certifications + upload
  - [x] Years of experience
  - [x] Bio/short description
- [x] **Step 3: Pricing**
  - [x] Session rate
  - [x] Package prices (3-month, 6-month, custom)
  - [x] Currency (PKR for now)
- [x] **Step 4: Availability**
  - [x] Days/hours available
  - [x] Client capacity
- [x] **Step 5: Verification**
  - [x] Email verification
  - [x] Phone verification
  - [x] Summary review

### 2.2 Trainer Dashboard (Dashboard.tsx)
**Current:** Empty placeholder  
**To Build:**
- [x] **Overview Cards:**
  - [x] Total leads this month
  - [x] Average response rate %
  - [x] Profile views
  - [x] Rating & review count
- [x] **Leads Table:**
  - [x] Client name, date, status
  - [x] Quick actions: View, Message, Update Status
  - [x] Status breakdown chart (new, contacted, booked, etc.)
- [x] **Performance:**
  - [x] Transformation gallery manager
  - [x] Review submissions
  - [x] Protocol/package library
- [x] **Settings:**
  - [x] Edit availability
  - [x] Update pricing
  - [x] Certification management

### 2.3 Lead Management
**Current:** Basic API scaffold  
**To Build:**
- [x] Lead Detail Page (LeadDetail.tsx)
  - [x] Client info display
  - [x] Lead status history timeline
  - [x] Notes/message thread
  - [x] Action buttons (Accept, Reject, Request Info)
- [x] Database tracking:
  - [x] Auto-timestamp lead creation
  - [x] Status change history
  - [x] Trainer response time tracking

---

## MVP Phase 3: Payments & Booking (Weeks 3-4)

### 3.1 Lead to Booking Flow
**To Build:**
- [x] When client clicks "Hire This Trainer":
  - [x] Lead form (name, email, phone, goals, message)
  - [x] Trainer receives lead notification
  - [x] Simple messaging between trainer/client
- [x] Trainer responds → client can:
  - [x] Accept trainer offer
  - [x] Discuss terms
  - [x] Proceed to payment

### 3.2 Payment Integration
**Current:** None  
**To Implement:**
- [x] Integrate Stripe or JazzCash/EasyPaisa (Pakistan)
  - [x] For MVP, start with simple payment for first session/consultation
  - [x] Store payment status in database
- [x] Payment tracking:
  - [x] Record successful payments
  - [x] Link to lead/trainer relationship

---

## MVP Phase 4: Client-Side Features (Weeks 4-5)

### 4.1 Client Center (New Page)
**To Build:**
- [x] Client account creation
- [x] "My Trainers" - trainers they've hired/are talking to
- [x] "My Protocols" - active training programs
- [x] Progress tracking (optional for MVP but easy to add)

### 4.2 Messaging System
**Current:** None  
**To Build:**
- [x] Simple chat between client and trainer
- [x] Store messages in database
- [x] Real-time notifications (socket.io for MVP+ or polling for MVP)

### 4.3 Reviews & Ratings
**Current:** Static data  
**To Build:**
- [x] After trainer relationship ends, client can leave review
- [x] Review form: Star rating + comment
- [x] Trainer can respond to review
- [x] Reviews displayed on trainer profile

---

## MVP Phase 5: Quality & Performance (Week 5)

### 5.1 Data Validation & Error Handling
- [x] Form validation on all inputs
- [x] Error messages for failed API calls
- [x] Edge cases (trainer not found, missing fields, etc.)

### 5.2 Mobile Optimization
- [x] Already mobile-first with Tailwind
- [x] Verify responsive on all key flows

### 5.3 SEO & Meta Tags
- [x] Dynamic meta tags for trainer profiles
- [x] Trainer profile URLs (e.g., /trainer/zaid-ahmed)

### 5.4 Performance
- [x] Optimize image loading (lazy load transformations)
- [x] Database query optimization
- [x] Remove N+1 queries

---

## Database Schema (Final)

```json
{
  "trainers": [
    {
      "id": "unique-id",
      "name": "string",
      "email": "string",
      "phone": "string",
      "specialty": "string",
      "bio": "string",
      "image": "url",
      "location": "string",
      "price_per_session": number,
      "packages": [
        {
          "id": "package-id",
          "name": "string",
          "duration_weeks": number,
          "price": number,
          "description": "string",
          "features": ["string"]
        }
      ],
      "certifications": ["string"],
      "years_experience": number,
      "availability": {
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "hours": { "start": "09:00", "end": "18:00" }
      },
      "rating": number,
      "reviews_count": number,
      "success_rate": "string",
      "active_protocols": number,
      "avg_fat_loss": "string",
      "client_retention": "string",
      "goals": ["string"],
      "acceptance_rate": number,
      "response_time_hours": number,
      "verified": boolean,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "transformations": [
    {
      "id": "unique-id",
      "trainer_id": "string",
      "client_name": "string",
      "client_age": number,
      "title": "string",
      "description": "string",
      "duration": "string",
      "before_image": "url",
      "after_image": "url",
      "result": "string",
      "testimonial": "string",
      "created_at": "timestamp"
    }
  ],
  "reviews": [
    {
      "id": "unique-id",
      "trainer_id": "string",
      "client_name": "string",
      "rating": 1-5,
      "text": "string",
      "result_achieved": "string",
      "verified": boolean,
      "created_at": "timestamp"
    }
  ],
  "leads": [
    {
      "id": "unique-id",
      "trainer_id": "string",
      "client_name": "string",
      "client_email": "string",
      "client_phone": "string",
      "message": "string",
      "status": "new|contacted|negotiating|booked|rejected",
      "status_history": [
        {
          "status": "string",
          "timestamp": "timestamp",
          "note": "string"
        }
      ],
      "selected_protocol_id": "string (optional)",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "messages": [
    {
      "id": "unique-id",
      "lead_id": "string",
      "sender_type": "trainer|client",
      "sender_id": "string",
      "text": "string",
      "created_at": "timestamp",
      "read": boolean
    }
  ],
  "clients": [
    {
      "id": "unique-id",
      "name": "string",
      "email": "string",
      "phone": "string",
      "goals": ["string"],
      "age": number,
      "hired_trainers": ["trainer_id"],
      "created_at": "timestamp"
    }
  ],
  "payments": [
    {
      "id": "unique-id",
      "lead_id": "string",
      "trainer_id": "string",
      "amount": number,
      "currency": "PKR",
      "status": "pending|completed|failed|refunded",
      "transaction_id": "string",
      "created_at": "timestamp"
    }
  ]
}
```

---

## Implementation Roadmap

| Phase | Focus | Timeline | Key Features |
|-------|-------|----------|--------------|
| **Phase 1** | Discovery & Profiles | Week 1-2 | Trainer discovery, profiles, transformations |
| **Phase 2** | Trainer Management | Week 2-3 | Onboarding, dashboard, lead management |
| **Phase 3** | Payments | Week 3-4 | Lead forms, payment processing |
| **Phase 4** | Client UX | Week 4-5 | Messaging, reviews, client profiles |
| **Phase 5** | Polish | Week 5 | QA, performance, optimization |

---

## Success Metrics (MVP Launch)

- [ ] 10+ trainers can register and list own profiles
- [ ] 50+ trainer profiles searchable/filterable
- [ ] Clients can find trainers → create leads → message
- [ ] Trainers can manage leads + respond
- [ ] Payment processing working for at least 1 transaction
- [ ] Mobile responsive on all major flows
- [ ] <2s page load time
- [ ] 0 critical bugs

---

## Tech Stack (Current & To Keep)

- **Frontend:** React 19 + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express.js
- **Database:** JSON file (local, keep for MVP)
- **Animations:** Motion.js
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Payment:** Stripe (later) or local integration
- **Hosting:** Vercel (frontend) + local Node server (backend) for MVP

---

## Next Steps

1. **Week 1 Start:** Build advanced filters on Discover page
2. **Week 1 Mid:** Complete trainer profile gallery + reviews section
3. **Update db.json with fuller dataset** (5-10 complete trainers with transformations/reviews)
4. **Build trainer onboarding workflow**
5. **Implement lead capture → trainer notification**

**Most Important for MVP:** Make discovery & profile pages feel complete and trustworthy. That's the core value prop.
