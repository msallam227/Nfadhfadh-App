# Nfadhfadh - Bilingual Emotional Wellness App

## Original Problem Statement
Build a bilingual (Arabic + English) emotional wellness app called Nfadhfadh with beautiful calming UI, Arabic RTL support, and corporate blue palette. Features include mood check-in, venting chat with AI, diary, mood strategies, mental health articles, subscription payments, user and admin dashboards.

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS + Shadcn/UI
- **AI Integration**: OpenAI GPT-5.2 via Emergent Integrations (Egyptian Arabic dialect)
- **Payments**: Stripe (test key)
- **Database**: MongoDB with collections: users, mood_checkins, diary_entries, chat_messages, payment_transactions

## User Personas
1. **Primary User**: Arabic-speaking individuals (Egypt, Gulf, Levant) seeking emotional wellness support
2. **Admin**: CEO/Manager who needs analytics and user data management

## Core Requirements (Static)
- [x] Bilingual support (Arabic RTL / English LTR)
- [x] User auth (signup/login with all required fields)
- [x] Mood check-in (20 feelings + note)
- [x] AI venting chat with disclaimer (no medical advice)
- [x] Diary with reflective questions
- [x] Mood-shift strategies
- [x] Mental health articles
- [x] Subscription tiers ($5/$15 based on country)
- [x] User dashboard with mood charts
- [x] Admin dashboard with analytics/export

## What's Been Implemented (Jan 2025)
- Complete auth system with JWT
- Multi-step signup with country-based pricing
- Mood check-in with 20 feelings and visual icons
- AI chat powered by GPT-5.2 (Egyptian Arabic)
- Diary with reflective question generator
- Strategies categorized by feeling
- Articles with Arabic/English content
- Stripe payment integration
- Admin dashboard with charts and export
- Full RTL support for Arabic
- Corporate blue theme design

## Admin Credentials
- Username: msallam227
- Password: Muhammad#01

## Prioritized Backlog
### P0 (Critical) - Done
- All core features implemented

### P1 (High)
- Push notifications for check-in reminders
- Email verification
- Password reset flow

### P2 (Medium)
- Gamification (streaks, badges)
- Community support groups
- More articles via external API integration
- Audio meditations

## Next Tasks
1. Add push notification system for daily check-in reminders
2. Implement email verification flow
3. Add more mental health articles via external API
4. Consider adding audio/meditation features
