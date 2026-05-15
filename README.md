<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b26c5b33-e3b4-4728-b123-f462b30d9d0a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase

For persistent marketplace storage, create a Supabase project and run [supabase/schema.sql](./supabase/schema.sql).

Set these environment variables in Vercel and locally:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
