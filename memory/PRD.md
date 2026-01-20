# Nfadhfadh - Bilingual Emotional Wellness App

## Original Problem Statement
Build a bilingual (Arabic + English) emotional wellness app called Nfadhfadh with beautiful calming UI, Arabic RTL support, and corporate blue palette. Features include mood check-in, venting chat with AI, diary, mood strategies, mental health articles, subscription payments, user and admin dashboards.

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS + Shadcn/UI
- **AI Integration**: OpenAI GPT-5.2 via Emergent Integrations (Egyptian Arabic dialect)
- **Payments**: Stripe (test key)
- **Email**: SendGrid (SENDGRID_API_KEY required for production)
- **Database**: MongoDB with collections: users, mood_checkins, diary_entries, chat_messages, payment_transactions, articles, email_reminders

## User Personas
1. **Primary User**: Arabic-speaking individuals (Egypt, Gulf, Levant) seeking emotional wellness support
2. **Admin**: CEO/Manager who needs analytics, user data management, and content management

## Core Requirements (Static)
- [x] Bilingual support (Arabic RTL / English LTR)
- [x] User auth (signup/login with all required fields)
- [x] Mood check-in (20 feelings + custom feeling option + note)
- [x] AI venting chat with disclaimer (no medical advice)
- [x] Diary with reflective questions
- [x] Mood-shift strategies
- [x] Mental health articles (PubMed + Admin-created)
- [x] Subscription tiers ($5/$15 based on country)
- [x] User dashboard with mood charts, streaks
- [x] Admin dashboard with analytics/export
- [x] Admin article management (CRUD)
- [x] Email reminder system (SendGrid integration)

## Admin Credentials
- Username: msallam227
- Password: Muhammad#01

## What's Been Implemented (January 2025)

### Core Features
- Complete auth system with JWT
- Multi-step signup with country-based pricing
- Mood check-in with 20 feelings, custom feeling option, and visual icons
- AI chat powered by GPT-5.2 (Egyptian Arabic)
- Diary with reflective question generator
- Strategies categorized by feeling
- Full RTL support for Arabic
- Corporate blue theme design

### Habit Loop Features
- Daily check-in streak counter
- Weekly badges (7+ day streaks)
- Question of the Day
- Notification timer settings

### Articles Section (Refactored Jan 2025)
- PubMed research articles integration
- Admin-created articles with full CRUD operations
- Article fields: Title, Summary, Content, Author, Category, Tags, Published Date, Image URL
- Search by title functionality
- Pagination with infinite scroll

### Admin Dashboard
- User management with view/delete capabilities
- **NEW: Articles tab** for creating/editing/deleting articles
- Subscription analytics
- Mood distribution charts
- Country distribution charts
- Data export (JSON)
- **NEW: Send Reminders button** for bulk email notifications

### Email Reminders (NEW Jan 2025)
- SendGrid integration for daily check-in reminders
- User email reminder settings (enable/disable, time, timezone)
- Admin bulk send reminders functionality
- Test reminder endpoint
- **Note: SENDGRID_API_KEY required in backend/.env for production use**

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- All core features implemented
- Article section refactored
- Email reminder system added

### P1 (High)
- Configure production SendGrid API key for email reminders
- Push notifications (mobile)
- Password reset flow

### P2 (Medium)
- More gamification (30-day, 100-day streak badges)
- PDF export for individual user data
- Audio meditations
- Community support groups

### P3 (Low - Refactoring)
- Break down server.py into modular routers (auth, mood, articles, admin)
- Add comprehensive test coverage

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/admin/login
- GET /api/auth/me

### User Features
- POST /api/mood/checkin
- GET /api/mood/checkins
- GET /api/mood/streak
- GET /api/mood/summary
- GET /api/mood/weekly-report
- POST /api/diary/entry
- GET /api/diary/entries
- POST /api/chat/message
- GET /api/articles
- GET /api/strategies

### Email Reminders
- GET /api/email/reminder-settings
- PUT /api/email/reminder-settings
- POST /api/email/test-reminder

### Admin
- GET /api/admin/analytics
- GET /api/admin/users
- DELETE /api/admin/user/{user_id}
- GET /api/admin/articles
- POST /api/admin/articles
- PUT /api/admin/articles/{article_id}
- DELETE /api/admin/articles/{article_id}
- POST /api/admin/send-bulk-reminders

## Environment Variables Required
```
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
EMERGENT_LLM_KEY=sk-emergent-xxx
STRIPE_API_KEY=sk_test_xxx
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=msallam227
ADMIN_PASSWORD=Muhammad#01
SENDGRID_API_KEY=SG.xxx  # Required for email reminders
SENDER_EMAIL=noreply@yourdomain.com
```

## Test Reports
- /app/test_reports/iteration_1.json - Initial build tests
- /app/test_reports/iteration_2.json - Article management & email tests (16/16 passed)
