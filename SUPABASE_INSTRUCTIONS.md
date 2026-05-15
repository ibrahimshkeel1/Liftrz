# How to reset your live site (delete all demo data)

## What this does
This wipes **everything** from your live Supabase database — all demo trainers, demo clients, demo bookings, demo reviews, demo payments — everything.

The only thing left is a **single admin login**:
- **Username/email:** `admin`
- **Password:** `HavalBJA`

After this, your site starts completely blank. Real trainers must apply and you (as admin) must approve them before they appear on the site.

## Step-by-step

### 1. Go to Supabase
- Open https://supabase.com
- Click your CoachSet project
- Click **"SQL Editor"** in the left sidebar

### 2. Create a new query
- Click **"New query"**
- Copy everything from the file `supabase-nuke-all.sql`
- Paste it into the SQL editor

### 3. Run it
- Click the **"Run"** button (green play button)
- You should see one result table:

| user_count | trainer_count | booking_count | review_count | lead_count |
|-----------|---------------|---------------|--------------|------------|
| 1         | 0             | 0             | 0            | 0          |

This means:
- ✅ 1 user (the admin)
- ✅ 0 trainers
- ✅ 0 bookings
- ✅ 0 reviews
- ✅ 0 leads

### 4. Check your website
- Open https://coachset-pakistan.vercel.app
- Hard refresh: **Ctrl + Shift + R**
- Go to **Discover** — it should say **"No trainers yet"**
- Go to **Admin** and log in with:
  - Username: `admin`
  - Password: `HavalBJA`

### 5. What happens next
- Trainers must apply through **/register/trainer**
- You log in as admin and approve them
- Once approved, they appear on Discover
- Clients can then find them, send inquiries, book, and leave reviews
- All stats (rating, clients trained, etc.) are calculated from **real bookings and reviews**

## Is this safe?
**Yes.** All data was demo/fake anyway. This gives you a completely clean slate.

## If something goes wrong
The script only touches the `coachset_state` table. If anything breaks, just re-run the SQL script again. It resets everything to the same clean state every time.
