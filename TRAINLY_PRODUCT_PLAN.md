# Trainly Pakistan Marketplace Build Plan

## Summary
Trainly should become a Pakistan-focused trainer marketplace where clients discover verified trainers, book through the platform, and Trainly earns commission from each paid booking.

The MVP should prioritize trust and money control:
- Verified trainer onboarding.
- Client and trainer registration paths.
- Paid booking deposits or full package payments.
- Trainly-controlled payment verification.
- Commission and payout tracking.
- Owner/admin backend for approvals, payments, payouts, reviews, and disputes.

Default MVP settings:
- Commission rate: 15%.
- Payment methods: Bank transfer, JazzCash, EasyPaisa.
- Launch cities: Lahore, Karachi, Islamabad/Rawalpindi.
- Trainer phone/WhatsApp hidden until a payment is verified.

## Product Changes
- Add role-based users: client, trainer, admin.
- Add trainer onboarding with identity, location, specialties, pricing, certifications, transformation proof, consent, and payout details.
- Add client registration with contact details, city, goals, and booking history.
- Add paid booking flow where clients pay Trainly first, then admin verifies the payment.
- Add anti-bypass controls by hiding direct trainer contact before verified booking.
- Add verified reviews only from completed bookings.
- Add refund/cancellation/dispute tracking.
- Add trainer ranking based on verification, booking completion, rating, response speed, and profile completeness.
- Add notification-ready states for WhatsApp/SMS.

## Backend Changes
The production version should use PostgreSQL and Prisma. The MVP keeps the current Express JSON backend but structures the data around the production model.

Core data:
- Users
- Trainer profiles
- Trainer documents
- Trainer packages
- Bookings
- Payments
- Payouts
- Reviews
- Disputes
- Stats events
- Platform settings

Important API groups:
- `/api/auth/*`
- `/api/trainers/*`
- `/api/trainer/*`
- `/api/client/*`
- `/api/bookings/*`
- `/api/admin/*`
- `/api/disputes/*`

## Frontend Changes
- Home becomes Pakistan-specific and SEO-focused.
- Discover filters by city, area, service mode, gender, specialty, price, rating, and verification status.
- Trainer profile shows verified stats, packages, reviews, and a booking flow with hidden contact until payment.
- Trainer registration becomes a full onboarding wizard.
- Trainer dashboard shows clients, bookings, revenue, commission, payout, rating, reviews, and response time.
- Client dashboard shows bookings, payment status, trainer contact unlock status, active protocols, and reviews.
- Admin backend shows platform revenue, commission, pending trainer approvals, pending payment verifications, payouts, disputes, and reviews.

## SEO Requirements
- Add Pakistan-focused metadata, title tags, descriptions, Open Graph tags, Twitter tags, canonical URL, structured data, robots.txt, and sitemap.xml.
- Add indexable content around personal trainers in Pakistan, Lahore, Karachi, Islamabad, online coaching, home training, gym-based training, verified reviews, and PKR pricing.
- Use clean internal links for discovery, trainer registration, client registration, and admin login.
- Production SEO will still require server rendering or prerendering, fast hosting, original city/specialty landing pages, backlinks, and a real deployed domain.

## Test Plan
- Client, trainer, and admin registration/login flows work.
- Trainer remains hidden until approved.
- Booking calculates 15% commission correctly.
- Payment verification activates booking and unlocks contact.
- Trainer dashboard stats match bookings and reviews.
- Admin dashboard totals GMV, commission, pending payouts, pending approvals, and disputes.
- Only completed bookings can create verified reviews.
- `npm run lint` and `npm run build` pass.

## Assumptions
- Trainly collects payments first and pays trainers manually in the MVP.
- Commission starts at 15%.
- Payment gateway integration is phase two.
- WhatsApp/SMS integrations are added as hooks first.
- Legal/privacy pages are required before launch because CNIC, payment, and health-related data are involved.
