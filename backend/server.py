from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'nfadhfadh_secret')
JWT_ALGORITHM = "HS256"

# Admin credentials
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'msallam227')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Muhammad#01')

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()

# Create routers
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    birthdate: str = Field(..., min_length=8)
    country: str = Field(..., min_length=2)
    city: str = Field(..., min_length=2)
    occupation: str = Field(..., min_length=2)
    gender: str = Field(..., pattern="^(male|female)$")
    language: str = Field(default="en", pattern="^(en|ar)$")

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    birthdate: str
    country: str
    city: str
    occupation: str
    gender: str
    language: str
    subscription_tier: Optional[str] = None
    subscription_status: str = "inactive"
    created_at: str

class MoodCheckIn(BaseModel):
    feeling: str
    note: Optional[str] = ""

class MoodCheckInResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    feeling: str
    note: str
    created_at: str

class DiaryEntry(BaseModel):
    content: str
    reflective_question: Optional[str] = None
    reflective_answer: Optional[str] = None

class DiaryEntryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    content: str
    reflective_question: Optional[str] = None
    reflective_answer: Optional[str] = None
    created_at: str

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    response: str
    session_id: str
    disclaimer: str

class LanguageUpdate(BaseModel):
    language: str

class PaymentRequest(BaseModel):
    origin_url: str

class NotificationSettings(BaseModel):
    enabled: bool = True
    reminder_time: str = "09:00"  # HH:MM format
    timezone: str = "UTC"

class WeeklyReportRequest(BaseModel):
    week_start: Optional[str] = None  # ISO date string

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        is_admin = payload.get("is_admin", False)
        if is_admin:
            return {"user_id": user_id, "is_admin": True}
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== PRICING ====================

PRICING_TIERS = {
    "standard": {"price": 5.00, "countries": ["syria", "jordan", "egypt", "morocco", "iraq", "lebanon", "palestine", "yemen", "sudan", "tunisia", "algeria", "libya"]},
    "premium": {"price": 15.00, "countries": ["saudi arabia", "uae", "qatar", "kuwait", "bahrain", "oman"]}
}

def get_price_for_country(country: str) -> tuple:
    country_lower = country.lower().strip()
    for tier, data in PRICING_TIERS.items():
        if country_lower in data["countries"]:
            return tier, data["price"]
    # Default: $10 for all other countries worldwide
    return "international", 10.00

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = str(uuid.uuid4())
    tier, price = get_price_for_country(user.country)
    
    user_doc = {
        "id": user_id,
        "username": user.username,
        "password_hash": hash_password(user.password),
        "birthdate": user.birthdate,
        "country": user.country,
        "city": user.city,
        "occupation": user.occupation,
        "gender": user.gender,
        "language": user.language,
        "subscription_tier": tier,
        "subscription_status": "inactive",
        "subscription_price": price,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": user.username,
            "birthdate": user.birthdate,
            "country": user.country,
            "city": user.city,
            "occupation": user.occupation,
            "gender": user.gender,
            "language": user.language,
            "subscription_tier": tier,
            "subscription_status": "inactive",
            "subscription_price": price
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "birthdate": user["birthdate"],
            "country": user["country"],
            "city": user["city"],
            "occupation": user["occupation"],
            "gender": user["gender"],
            "language": user["language"],
            "subscription_tier": user.get("subscription_tier"),
            "subscription_status": user.get("subscription_status", "inactive"),
            "subscription_price": user.get("subscription_price", 15.00)
        }
    }

@api_router.post("/auth/admin/login")
async def admin_login(credentials: UserLogin):
    if credentials.username != ADMIN_USERNAME or credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = create_token("admin", is_admin=True)
    return {"token": token, "is_admin": True}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    if current_user.get("is_admin"):
        return {"is_admin": True, "username": ADMIN_USERNAME}
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "birthdate": current_user["birthdate"],
        "country": current_user["country"],
        "city": current_user["city"],
        "occupation": current_user["occupation"],
        "gender": current_user["gender"],
        "language": current_user["language"],
        "subscription_tier": current_user.get("subscription_tier"),
        "subscription_status": current_user.get("subscription_status", "inactive"),
        "subscription_price": current_user.get("subscription_price", 15.00)
    }

@api_router.put("/auth/language")
async def update_language(data: LanguageUpdate, current_user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"language": data.language}})
    return {"message": "Language updated", "language": data.language}

# ==================== MOOD CHECK-IN ROUTES ====================

FEELINGS = [
    "happiness", "sadness", "anger", "fear", "anxiety", "stress", "calm", "love",
    "loneliness", "hope", "disappointment", "frustration", "guilt", "shame",
    "pride", "jealousy", "thankful", "excitement", "boredom", "confusion"
]

# Questions of the Day
QUESTIONS_OF_THE_DAY = {
    "en": [
        "What's one thing you're looking forward to today?",
        "How did you sleep last night?",
        "What's something kind you can do for yourself today?",
        "Who made you smile recently?",
        "What's one small win you had this week?",
        "What are you grateful for right now?",
        "How are you taking care of your mental health today?",
        "What's one thing you'd like to let go of?",
        "What brings you peace?",
        "How can you show yourself compassion today?",
        "What's one boundary you need to set?",
        "What emotion do you need to process?",
        "What would make today a good day?",
        "How are you feeling in your body right now?",
        "What's one thing you're proud of?",
        "What support do you need today?",
        "How can you be gentle with yourself?",
        "What's weighing on your mind?",
        "What brings you joy?",
        "How are you really doing?",
    ],
    "ar": [
        "ما الشيء الذي تتطلع إليه اليوم؟",
        "كيف كان نومك الليلة الماضية؟",
        "ما الشيء اللطيف الذي يمكنك فعله لنفسك اليوم؟",
        "من جعلك تبتسم مؤخراً؟",
        "ما هو الإنجاز الصغير الذي حققته هذا الأسبوع؟",
        "ما الذي تشعر بالامتنان له الآن؟",
        "كيف تعتني بصحتك النفسية اليوم؟",
        "ما الشيء الذي تريد التخلي عنه؟",
        "ما الذي يجلب لك السلام؟",
        "كيف يمكنك إظهار التعاطف مع نفسك اليوم؟",
        "ما الحدود التي تحتاج لوضعها؟",
        "ما الشعور الذي تحتاج لمعالجته؟",
        "ما الذي سيجعل يومك جيداً؟",
        "كيف تشعر في جسدك الآن؟",
        "ما الشيء الذي تفتخر به؟",
        "ما الدعم الذي تحتاجه اليوم؟",
        "كيف يمكنك أن تكون لطيفاً مع نفسك؟",
        "ما الذي يثقل عقلك؟",
        "ما الذي يجلب لك السعادة؟",
        "كيف حالك حقاً؟",
    ]
}

async def calculate_streak(user_id: str) -> dict:
    """Calculate user's check-in streak"""
    checkins = await db.mood_checkins.find(
        {"user_id": user_id}, {"_id": 0, "created_at": 1}
    ).sort("created_at", -1).to_list(365)
    
    if not checkins:
        return {"current_streak": 0, "longest_streak": 0, "checked_in_today": False, "weekly_badge": False}
    
    # Get unique dates (in user's timezone, simplified to UTC)
    check_dates = set()
    for c in checkins:
        date_str = c["created_at"][:10]  # Get YYYY-MM-DD
        check_dates.add(date_str)
    
    sorted_dates = sorted(check_dates, reverse=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    
    checked_in_today = today in check_dates
    
    # Calculate current streak
    current_streak = 0
    check_date = today if checked_in_today else yesterday
    
    for i in range(365):
        target_date = (datetime.now(timezone.utc) - timedelta(days=i if checked_in_today else i+1)).strftime("%Y-%m-%d")
        if target_date in check_dates:
            current_streak += 1
        else:
            break
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    prev_date = None
    
    for date_str in sorted(check_dates):
        current_date = datetime.strptime(date_str, "%Y-%m-%d")
        if prev_date is None:
            temp_streak = 1
        elif (current_date - prev_date).days == 1:
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 1
        prev_date = current_date
    
    longest_streak = max(longest_streak, temp_streak)
    
    # Weekly badge (7+ days streak)
    weekly_badge = current_streak >= 7
    
    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "checked_in_today": checked_in_today,
        "weekly_badge": weekly_badge,
        "total_checkins": len(checkins)
    }

@api_router.get("/feelings")
async def get_feelings():
    return {"feelings": FEELINGS}

@api_router.get("/mood/question-of-day")
async def get_question_of_day(current_user: dict = Depends(get_current_user)):
    """Get today's question based on day of year"""
    lang = current_user.get("language", "en")
    questions = QUESTIONS_OF_THE_DAY.get(lang, QUESTIONS_OF_THE_DAY["en"])
    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    question_index = day_of_year % len(questions)
    return {"question": questions[question_index], "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}

@api_router.post("/mood/checkin")
async def create_mood_checkin(mood: MoodCheckIn, current_user: dict = Depends(get_current_user)):
    mood_id = str(uuid.uuid4())
    mood_doc = {
        "id": mood_id,
        "user_id": current_user["id"],
        "feeling": mood.feeling,
        "note": mood.note or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.mood_checkins.insert_one(mood_doc)
    
    # Calculate streak after check-in
    streak_info = await calculate_streak(current_user["id"])
    
    return {
        "id": mood_id,
        "user_id": current_user["id"],
        "feeling": mood.feeling,
        "note": mood.note or "",
        "created_at": mood_doc["created_at"],
        "streak": streak_info
    }

@api_router.get("/mood/checkins")
async def get_mood_checkins(current_user: dict = Depends(get_current_user)):
    checkins = await db.mood_checkins.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"checkins": checkins}

@api_router.get("/mood/streak")
async def get_mood_streak(current_user: dict = Depends(get_current_user)):
    """Get user's current streak information"""
    streak_info = await calculate_streak(current_user["id"])
    return streak_info

@api_router.get("/mood/summary")
async def get_mood_summary(current_user: dict = Depends(get_current_user)):
    checkins = await db.mood_checkins.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).to_list(1000)
    
    feeling_counts = {}
    for checkin in checkins:
        feeling = checkin["feeling"]
        feeling_counts[feeling] = feeling_counts.get(feeling, 0) + 1
    
    total = len(checkins)
    streak_info = await calculate_streak(current_user["id"])
    
    return {
        "total_checkins": total,
        "feeling_distribution": feeling_counts,
        "most_common": max(feeling_counts, key=feeling_counts.get) if feeling_counts else None,
        "streak": streak_info
    }

@api_router.get("/mood/weekly-report")
async def get_weekly_report(current_user: dict = Depends(get_current_user)):
    """Generate weekly emotional report"""
    lang = current_user.get("language", "en")
    
    # Get checkins from last 7 days
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    checkins = await db.mood_checkins.find(
        {"user_id": current_user["id"], "created_at": {"$gte": week_ago}}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Get diary entries from last 7 days
    diary_entries = await db.diary_entries.find(
        {"user_id": current_user["id"], "created_at": {"$gte": week_ago}}, {"_id": 0}
    ).to_list(50)
    
    # Analyze feelings
    feeling_counts = {}
    daily_feelings = {}
    for checkin in checkins:
        feeling = checkin["feeling"]
        feeling_counts[feeling] = feeling_counts.get(feeling, 0) + 1
        
        date = checkin["created_at"][:10]
        if date not in daily_feelings:
            daily_feelings[date] = []
        daily_feelings[date].append(feeling)
    
    # Determine dominant mood
    dominant_mood = max(feeling_counts, key=feeling_counts.get) if feeling_counts else None
    
    # Calculate mood trend (positive/negative/neutral)
    positive_feelings = ["happiness", "calm", "love", "hope", "pride", "thankful", "excitement"]
    negative_feelings = ["sadness", "anger", "fear", "anxiety", "stress", "loneliness", "disappointment", "frustration", "guilt", "shame", "jealousy"]
    
    positive_count = sum(feeling_counts.get(f, 0) for f in positive_feelings)
    negative_count = sum(feeling_counts.get(f, 0) for f in negative_feelings)
    
    if positive_count > negative_count:
        trend = "positive"
        trend_message = "You've had more positive emotions this week!" if lang == "en" else "كانت لديك مشاعر إيجابية أكثر هذا الأسبوع!"
    elif negative_count > positive_count:
        trend = "negative"
        trend_message = "This week has been challenging. Remember to be kind to yourself." if lang == "en" else "كان هذا الأسبوع صعباً. تذكر أن تكون لطيفاً مع نفسك."
    else:
        trend = "neutral"
        trend_message = "Your emotions have been balanced this week." if lang == "en" else "كانت مشاعرك متوازنة هذا الأسبوع."
    
    # Get streak info
    streak_info = await calculate_streak(current_user["id"])
    
    return {
        "week_start": week_ago[:10],
        "week_end": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "total_checkins": len(checkins),
        "total_diary_entries": len(diary_entries),
        "feeling_distribution": feeling_counts,
        "daily_feelings": daily_feelings,
        "dominant_mood": dominant_mood,
        "mood_trend": trend,
        "trend_message": trend_message,
        "positive_count": positive_count,
        "negative_count": negative_count,
        "streak": streak_info,
        "insights": {
            "most_common": dominant_mood,
            "days_checked_in": len(daily_feelings),
            "consistency": f"{len(daily_feelings)}/7 days"
        }
    }

# ==================== NOTIFICATION SETTINGS ====================

@api_router.get("/notifications/settings")
async def get_notification_settings(current_user: dict = Depends(get_current_user)):
    """Get user's notification settings"""
    settings = await db.notification_settings.find_one(
        {"user_id": current_user["id"]}, {"_id": 0}
    )
    
    if not settings:
        # Default settings
        return {
            "user_id": current_user["id"],
            "enabled": True,
            "reminder_time": "09:00",
            "timezone": "UTC"
        }
    
    return settings

@api_router.put("/notifications/settings")
async def update_notification_settings(settings: NotificationSettings, current_user: dict = Depends(get_current_user)):
    """Update user's notification settings"""
    settings_doc = {
        "user_id": current_user["id"],
        "enabled": settings.enabled,
        "reminder_time": settings.reminder_time,
        "timezone": settings.timezone,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notification_settings.update_one(
        {"user_id": current_user["id"]},
        {"$set": settings_doc},
        upsert=True
    )
    
    return {"message": "Notification settings updated", "settings": settings_doc}

# ==================== DIARY ROUTES ====================

REFLECTIVE_QUESTIONS = {
    "en": [
        "What are you grateful for today?",
        "What challenged you today and how did you handle it?",
        "What made you smile today?",
        "What would you do differently if you could relive today?",
        "What are three things you accomplished today?"
    ],
    "ar": [
        "ما الذي تشعر بالامتنان له اليوم؟",
        "ما الذي تحداك اليوم وكيف تعاملت معه؟",
        "ما الذي جعلك تبتسم اليوم؟",
        "ما الذي ستفعله بشكل مختلف لو عشت اليوم مرة أخرى؟",
        "ما هي ثلاثة أشياء حققتها اليوم؟"
    ]
}

@api_router.get("/diary/questions")
async def get_reflective_questions(current_user: dict = Depends(get_current_user)):
    lang = current_user.get("language", "en")
    return {"questions": REFLECTIVE_QUESTIONS.get(lang, REFLECTIVE_QUESTIONS["en"])}

@api_router.post("/diary/entry")
async def create_diary_entry(entry: DiaryEntry, current_user: dict = Depends(get_current_user)):
    entry_id = str(uuid.uuid4())
    entry_doc = {
        "id": entry_id,
        "user_id": current_user["id"],
        "content": entry.content,
        "reflective_question": entry.reflective_question,
        "reflective_answer": entry.reflective_answer,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.diary_entries.insert_one(entry_doc)
    return {
        "id": entry_id,
        "user_id": current_user["id"],
        "content": entry.content,
        "reflective_question": entry.reflective_question,
        "reflective_answer": entry.reflective_answer,
        "created_at": entry_doc["created_at"]
    }

@api_router.get("/diary/entries")
async def get_diary_entries(current_user: dict = Depends(get_current_user)):
    entries = await db.diary_entries.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"entries": entries}

# ==================== VENTING CHAT ROUTES ====================

SYSTEM_PROMPT_EN = """You are a compassionate and supportive emotional wellness companion. Your role is to:
1. Listen actively and empathetically to the user's feelings
2. Ask gentle, open-ended questions to help them explore their emotions
3. Validate their feelings without judgment
4. NEVER give medical advice, diagnoses, or treatment recommendations
5. NEVER suggest medication or therapy specifics
6. If someone mentions self-harm or crisis, gently encourage them to seek professional help

Respond with warmth, understanding, and gentle curiosity. Keep responses conversational and supportive."""

SYSTEM_PROMPT_AR = """أنت رفيق دعم عاطفي رحيم ومتفهم. دورك هو:
١. الاستماع بنشاط وتعاطف لمشاعر المستخدم
٢. طرح أسئلة لطيفة ومفتوحة لمساعدتهم على استكشاف مشاعرهم
٣. التحقق من صحة مشاعرهم دون حكم
٤. لا تقدم أبدًا نصائح طبية أو تشخيصات أو توصيات علاجية
٥. لا تقترح أبدًا أدوية أو تفاصيل علاج محددة
٦. إذا ذكر شخص ما إيذاء النفس أو الأزمة، شجعه بلطف على طلب المساعدة المهنية

استجب بدفء وتفهم وفضول لطيف. اجعل الردود محادثية وداعمة. تحدث باللهجة المصرية."""

DISCLAIMER_EN = "This is not medical advice. For professional mental health support, please consult a licensed healthcare provider."
DISCLAIMER_AR = "هذا ليس نصيحة طبية. للحصول على دعم نفسي متخصص، يرجى استشارة مقدم رعاية صحية مرخص."

@api_router.post("/chat/message")
async def send_chat_message(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    user_lang = current_user.get("language", "en")
    session_id = message.session_id or str(uuid.uuid4())
    
    system_prompt = SYSTEM_PROMPT_AR if user_lang == "ar" else SYSTEM_PROMPT_EN
    disclaimer = DISCLAIMER_AR if user_lang == "ar" else DISCLAIMER_EN
    
    # Get chat history for this session
    history = await db.chat_messages.find(
        {"user_id": current_user["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-5.2")
        
        # Build context from history
        context_messages = []
        for msg in history[-10:]:  # Last 10 messages for context
            context_messages.append(f"User: {msg['user_message']}")
            context_messages.append(f"Assistant: {msg['ai_response']}")
        
        full_message = message.message
        if context_messages:
            context = "\n".join(context_messages)
            full_message = f"Previous conversation:\n{context}\n\nCurrent message: {message.message}"
        
        user_msg = UserMessage(text=full_message)
        response = await chat.send_message(user_msg)
        
        # Save to database
        chat_doc = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "session_id": session_id,
            "user_message": message.message,
            "ai_response": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(chat_doc)
        
        return {
            "response": response,
            "session_id": session_id,
            "disclaimer": disclaimer
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        fallback = "أنا هنا عشان أسمعك. ممكن تقولي أكتر عن اللي بتحس بيه؟" if user_lang == "ar" else "I'm here to listen. Can you tell me more about how you're feeling?"
        return {
            "response": fallback,
            "session_id": session_id,
            "disclaimer": disclaimer
        }

@api_router.get("/chat/sessions")
async def get_chat_sessions(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {"_id": "$session_id", "last_message": {"$last": "$created_at"}, "message_count": {"$sum": 1}}},
        {"$sort": {"last_message": -1}}
    ]
    sessions = await db.chat_messages.aggregate(pipeline).to_list(20)
    return {"sessions": [{"session_id": s["_id"], "last_message": s["last_message"], "message_count": s["message_count"]} for s in sessions]}

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.chat_messages.find(
        {"user_id": current_user["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return {"messages": messages}

# ==================== MOOD STRATEGIES ====================

MOOD_STRATEGIES = {
    "en": {
        "anxiety": ["Practice deep breathing for 5 minutes", "Write down your worries", "Go for a short walk", "Listen to calming music"],
        "stress": ["Take a 10-minute break", "Stretch your body", "Drink water and hydrate", "Talk to someone you trust"],
        "sadness": ["Allow yourself to feel", "Connect with a loved one", "Do something creative", "Watch something that makes you smile"],
        "anger": ["Count to 10 slowly", "Remove yourself from the situation", "Exercise to release energy", "Write about what's bothering you"],
        "loneliness": ["Reach out to a friend", "Join an online community", "Adopt a routine", "Practice self-compassion"],
        "fear": ["Identify what you can control", "Ground yourself with 5 senses", "Talk about your fears", "Focus on the present moment"]
    },
    "ar": {
        "anxiety": ["مارس التنفس العميق لمدة ٥ دقائق", "اكتب مخاوفك", "امشِ لمسافة قصيرة", "استمع لموسيقى هادئة"],
        "stress": ["خذ استراحة ١٠ دقائق", "قم بتمديد جسمك", "اشرب ماء وترطّب", "تحدث مع شخص تثق به"],
        "sadness": ["اسمح لنفسك بالشعور", "تواصل مع شخص تحبه", "افعل شيئًا إبداعيًا", "شاهد شيئًا يجعلك تبتسم"],
        "anger": ["عد ببطء إلى ١٠", "ابتعد عن الموقف", "مارس الرياضة لإطلاق الطاقة", "اكتب عما يزعجك"],
        "loneliness": ["تواصل مع صديق", "انضم إلى مجتمع عبر الإنترنت", "اتبع روتينًا يوميًا", "مارس التعاطف مع الذات"],
        "fear": ["حدد ما يمكنك التحكم فيه", "ارتكز على حواسك الخمس", "تحدث عن مخاوفك", "ركز على اللحظة الحالية"]
    }
}

@api_router.get("/strategies")
async def get_strategies(feeling: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    lang = current_user.get("language", "en")
    strategies = MOOD_STRATEGIES.get(lang, MOOD_STRATEGIES["en"])
    if feeling and feeling.lower() in strategies:
        return {"feeling": feeling, "strategies": strategies[feeling.lower()]}
    return {"strategies": strategies}

# ==================== ARTICLES ====================
import aiohttp
import feedparser
import re

# API endpoints
PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
WHO_HEALTH_TOPICS_URL = "https://www.who.int/api/news/healthtopics"

# Fallback articles when APIs fail
FALLBACK_ARTICLES = {
    "ar": [
        {"id": "1", "title": "كيف تتعامل مع القلق اليومي", "summary": "نصائح عملية للتعامل مع مشاعر القلق", "content": "القلق شعور طبيعي يمر به الجميع. تعلم كيف تتعرف على علامات القلق وكيف تتعامل معها بطرق صحية. من المهم أن تفهم أن القلق جزء من حياتنا، ولكن يمكننا التحكم فيه من خلال التنفس العميق، والتأمل، وممارسة الرياضة بانتظام.", "category": "anxiety", "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b", "source": "Nfadhfadh"},
        {"id": "2", "title": "أهمية النوم الجيد للصحة النفسية", "summary": "كيف يؤثر النوم على مزاجك", "content": "النوم الجيد أساسي للصحة النفسية. عندما ننام جيداً، يستطيع دماغنا معالجة المشاعر والذكريات. حاول النوم 7-8 ساعات يومياً، وتجنب الشاشات قبل النوم.", "category": "wellness", "image_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55", "source": "Nfadhfadh"},
        {"id": "3", "title": "تمارين التأمل للمبتدئين", "summary": "ابدأ رحلتك في التأمل", "content": "التأمل يساعد على تهدئة العقل وتقليل التوتر. ابدأ بخمس دقائق يومياً، اجلس في مكان هادئ، وركز على تنفسك.", "category": "meditation", "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773", "source": "Nfadhfadh"},
        {"id": "4", "title": "بناء علاقات صحية", "summary": "كيف تبني وتحافظ على علاقات إيجابية", "content": "العلاقات الصحية تدعم صحتنا النفسية. تعلم كيف تتواصل بشكل أفضل، واستمع للآخرين، وعبر عن مشاعرك بصدق.", "category": "relationships", "image_url": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac", "source": "Nfadhfadh"},
        {"id": "5", "title": "التعامل مع الضغط النفسي", "summary": "استراتيجيات فعالة للتخفيف من التوتر", "content": "الضغط النفسي جزء من الحياة، لكن يمكننا تعلم كيفية التعامل معه. مارس الرياضة، تحدث مع صديق، وخذ فترات راحة منتظمة.", "category": "stress", "image_url": "https://images.unsplash.com/photo-1493836512294-502baa1986e2", "source": "Nfadhfadh"},
    ],
    "en": [
        {"id": "1", "title": "How to Deal with Daily Anxiety", "summary": "Practical tips for managing anxiety", "content": "Anxiety is a natural feeling everyone experiences. Learn how to recognize anxiety signs and deal with them in healthy ways through deep breathing, meditation, and regular exercise.", "category": "anxiety", "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b", "source": "Nfadhfadh"},
        {"id": "2", "title": "The Importance of Good Sleep", "summary": "How sleep affects your mood", "content": "Good sleep is essential for mental health. When we sleep well, our brain processes emotions and memories. Try to sleep 7-8 hours daily and avoid screens before bed.", "category": "wellness", "image_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55", "source": "Nfadhfadh"},
        {"id": "3", "title": "Meditation for Beginners", "summary": "Start your meditation journey", "content": "Meditation helps calm the mind and reduce stress. Start with five minutes daily, sit in a quiet place, and focus on your breathing.", "category": "meditation", "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773", "source": "Nfadhfadh"},
        {"id": "4", "title": "Building Healthy Relationships", "summary": "How to build positive relationships", "content": "Healthy relationships support our mental health. Learn to communicate better, listen to others, and express your feelings honestly.", "category": "relationships", "image_url": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac", "source": "Nfadhfadh"},
        {"id": "5", "title": "Dealing with Stress", "summary": "Effective strategies for stress relief", "content": "Stress is part of life, but we can learn to manage it. Exercise regularly, talk to a friend, and take regular breaks.", "category": "stress", "image_url": "https://images.unsplash.com/photo-1493836512294-502baa1986e2", "source": "Nfadhfadh"},
    ]
}

async def fetch_pubmed_articles(search_term: str = "mental health", max_results: int = 5):
    """Fetch mental health articles from PubMed (NCBI E-utilities)"""
    articles = []
    
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
            # Step 1: Search for article IDs
            search_params = {
                "db": "pubmed",
                "term": f"{search_term}[Title/Abstract]",
                "retmax": max_results,
                "sort": "pub+date",
                "retmode": "json"
            }
            
            async with session.get(PUBMED_SEARCH_URL, params=search_params) as response:
                if response.status != 200:
                    return articles
                    
                search_data = await response.json()
                id_list = search_data.get("esearchresult", {}).get("idlist", [])
                
                if not id_list:
                    return articles
            
            # Step 2: Fetch article summaries
            fetch_params = {
                "db": "pubmed",
                "id": ",".join(id_list),
                "retmode": "json"
            }
            
            async with session.get(PUBMED_FETCH_URL, params=fetch_params) as response:
                if response.status != 200:
                    return articles
                    
                fetch_data = await response.json()
                results = fetch_data.get("result", {})
                
                for pmid in id_list:
                    article_data = results.get(pmid, {})
                    if article_data and isinstance(article_data, dict):
                        title = article_data.get("title", "")
                        # Clean HTML from title
                        title = re.sub(r'<[^>]+>', '', title)
                        
                        articles.append({
                            "id": f"pubmed_{pmid}",
                            "title": title[:150],
                            "summary": article_data.get("sorttitle", title)[:200],
                            "content": f"Published in: {article_data.get('fulljournalname', 'PubMed')}. {article_data.get('sortfirstauthor', '')}. {title}",
                            "category": "research",
                            "image_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d",
                            "source": "PubMed",
                            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                            "published": article_data.get("pubdate", "")
                        })
                        
    except Exception as e:
        logger.error(f"Error fetching PubMed articles: {e}")
    
    return articles

async def fetch_who_articles():
    """Fetch mental health topics from WHO"""
    articles = []
    
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(WHO_HEALTH_TOPICS_URL) as response:
                if response.status != 200:
                    return articles
                
                data = await response.json()
                topics = data if isinstance(data, list) else data.get("value", [])
                
                # Filter for mental health related topics
                mental_keywords = ["mental", "depression", "anxiety", "stress", "suicide", "substance", "psychological", "wellbeing"]
                
                for topic in topics[:50]:
                    name = topic.get("Name", "").lower()
                    if any(keyword in name for keyword in mental_keywords):
                        articles.append({
                            "id": f"who_{topic.get('Id', '')}",
                            "title": topic.get("Name", ""),
                            "summary": topic.get("MetaDescription", "")[:200] if topic.get("MetaDescription") else "WHO Health Topic",
                            "content": topic.get("MetaDescription", topic.get("Name", "")),
                            "category": "who",
                            "image_url": "https://images.unsplash.com/photo-1584982751601-97dcc096659c",
                            "source": "World Health Organization",
                            "url": f"https://www.who.int/health-topics/{topic.get('Name', '').lower().replace(' ', '-')}"
                        })
                        
                        if len(articles) >= 5:
                            break
                            
    except Exception as e:
        logger.error(f"Error fetching WHO articles: {e}")
    
    return articles

async def fetch_psychology_articles(language: str = "en"):
    """Fetch psychology/mental health articles from multiple sources"""
    articles = []
    
    # Fetch from PubMed
    search_terms = ["mental health wellness", "anxiety treatment", "depression therapy", "stress management", "mindfulness meditation"]
    for term in search_terms[:2]:
        pubmed_articles = await fetch_pubmed_articles(term, 3)
        articles.extend(pubmed_articles)
    
    # Fetch from WHO
    who_articles = await fetch_who_articles()
    articles.extend(who_articles)
    
    # Add fallback/curated articles
    fallback = FALLBACK_ARTICLES.get(language, FALLBACK_ARTICLES["en"])
    articles.extend(fallback)
    
    # Remove duplicates by title
    seen_titles = set()
    unique_articles = []
    for article in articles:
        title_key = article["title"].lower()[:50]
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_articles.append(article)
    
    return unique_articles[:20]  # Return max 20 articles

@api_router.get("/articles")
async def get_articles(current_user: dict = Depends(get_current_user)):
    lang = current_user.get("language", "en")
    articles = await fetch_psychology_articles(lang)
    return {"articles": articles, "language": lang, "count": len(articles)}

@api_router.get("/articles/refresh")
async def refresh_articles(current_user: dict = Depends(get_current_user)):
    """Force refresh articles from external sources"""
    lang = current_user.get("language", "en")
    articles = await fetch_psychology_articles(lang)
    return {"articles": articles, "refreshed": True, "count": len(articles)}

@api_router.get("/articles/{article_id}")
async def get_article(article_id: str, current_user: dict = Depends(get_current_user)):
    lang = current_user.get("language", "en")
    articles = await fetch_psychology_articles(lang)
    for article in articles:
        if article["id"] == article_id:
            return article
    raise HTTPException(status_code=404, detail="Article not found")

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments/create-checkout")
async def create_checkout(payment: PaymentRequest, request: Request, current_user: dict = Depends(get_current_user)):
    try:
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        price = user.get("subscription_price", 15.00)
        tier = user.get("subscription_tier", "premium")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        success_url = f"{payment.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{payment.origin_url}/payment/cancel"
        
        checkout_request = CheckoutSessionRequest(
            amount=float(price),
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": current_user["id"],
                "tier": tier,
                "type": "subscription"
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction
        payment_doc = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "user_id": current_user["id"],
            "amount": price,
            "currency": "usd",
            "tier": tier,
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(payment_doc)
        
        return {"url": session.url, "session_id": session.session_id}
    except Exception as e:
        logger.error(f"Payment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    try:
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction
        if status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            # Update user subscription
            payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if payment:
                await db.users.update_one(
                    {"id": payment["user_id"]},
                    {"$set": {"subscription_status": "active"}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            if webhook_response.metadata and "user_id" in webhook_response.metadata:
                await db.users.update_one(
                    {"id": webhook_response.metadata["user_id"]},
                    {"$set": {"subscription_status": "active"}}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users")
async def admin_get_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return {"users": users}

@api_router.delete("/admin/user/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user and all their data"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete all user data
    await db.users.delete_one({"id": user_id})
    await db.mood_checkins.delete_many({"user_id": user_id})
    await db.diary_entries.delete_many({"user_id": user_id})
    await db.chat_messages.delete_many({"user_id": user_id})
    await db.payment_transactions.delete_many({"user_id": user_id})
    await db.notification_settings.delete_many({"user_id": user_id})
    
    return {"message": "User and all associated data deleted", "user_id": user_id}

@api_router.get("/admin/analytics")
async def admin_get_analytics(admin: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    active_subscriptions = await db.users.count_documents({"subscription_status": "active"})
    total_checkins = await db.mood_checkins.count_documents({})
    total_diary_entries = await db.diary_entries.count_documents({})
    total_chat_messages = await db.chat_messages.count_documents({})
    
    # Mood distribution
    mood_pipeline = [
        {"$group": {"_id": "$feeling", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    mood_distribution = await db.mood_checkins.aggregate(mood_pipeline).to_list(20)
    
    # Country distribution
    country_pipeline = [
        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    country_distribution = await db.users.aggregate(country_pipeline).to_list(20)
    
    # Gender distribution
    gender_pipeline = [
        {"$group": {"_id": "$gender", "count": {"$sum": 1}}}
    ]
    gender_distribution = await db.users.aggregate(gender_pipeline).to_list(10)
    
    return {
        "total_users": total_users,
        "active_subscriptions": active_subscriptions,
        "total_checkins": total_checkins,
        "total_diary_entries": total_diary_entries,
        "total_chat_messages": total_chat_messages,
        "mood_distribution": [{"feeling": m["_id"], "count": m["count"]} for m in mood_distribution],
        "country_distribution": [{"country": c["_id"], "count": c["count"]} for c in country_distribution],
        "gender_distribution": [{"gender": g["_id"], "count": g["count"]} for g in gender_distribution]
    }

@api_router.get("/admin/export/users")
async def admin_export_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(10000)
    return {"data": users, "type": "users", "exported_at": datetime.now(timezone.utc).isoformat()}

@api_router.get("/admin/export/moods")
async def admin_export_moods(admin: dict = Depends(get_admin_user)):
    moods = await db.mood_checkins.find({}, {"_id": 0}).to_list(10000)
    return {"data": moods, "type": "mood_checkins", "exported_at": datetime.now(timezone.utc).isoformat()}

# ==================== ADMIN PER-USER DATA ====================

@api_router.get("/admin/user/{user_id}/checkins")
async def admin_get_user_checkins(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get all mood check-ins for a specific user"""
    checkins = await db.mood_checkins.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user, "checkins": checkins, "total": len(checkins)}

@api_router.get("/admin/user/{user_id}/diary")
async def admin_get_user_diary(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get all diary entries for a specific user"""
    entries = await db.diary_entries.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user, "diary_entries": entries, "total": len(entries)}

@api_router.get("/admin/user/{user_id}/chats")
async def admin_get_user_chats(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get all chat messages for a specific user"""
    messages = await db.chat_messages.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    
    # Group by session
    sessions = {}
    for msg in messages:
        sid = msg.get("session_id", "unknown")
        if sid not in sessions:
            sessions[sid] = []
        sessions[sid].append(msg)
    
    return {"user": user, "chat_sessions": sessions, "total_messages": len(messages), "total_sessions": len(sessions)}

@api_router.get("/admin/user/{user_id}/full")
async def admin_get_user_full_data(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get complete data for a specific user including all activities"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    checkins = await db.mood_checkins.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    diary = await db.diary_entries.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    chats = await db.chat_messages.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    payments = await db.payment_transactions.find({"user_id": user_id}, {"_id": 0}).to_list(50)
    
    return {
        "user": user,
        "mood_checkins": {"data": checkins, "total": len(checkins)},
        "diary_entries": {"data": diary, "total": len(diary)},
        "chat_messages": {"data": chats, "total": len(chats)},
        "payments": {"data": payments, "total": len(payments)}
    }

@api_router.get("/admin/subscriptions")
async def admin_get_subscriptions(admin: dict = Depends(get_admin_user)):
    """Get detailed subscription statistics"""
    # All subscribed users
    subscribed = await db.users.find(
        {"subscription_status": "active"}, 
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    
    # Subscription by tier
    tier_pipeline = [
        {"$match": {"subscription_status": "active"}},
        {"$group": {"_id": "$subscription_tier", "count": {"$sum": 1}, "total_revenue": {"$sum": "$subscription_price"}}}
    ]
    by_tier = await db.users.aggregate(tier_pipeline).to_list(10)
    
    # Payment transactions
    paid_transactions = await db.payment_transactions.find(
        {"payment_status": "paid"}, {"_id": 0}
    ).to_list(1000)
    
    total_revenue = sum(t.get("amount", 0) for t in paid_transactions)
    
    return {
        "active_subscribers": len(subscribed),
        "subscribers": subscribed,
        "by_tier": [{"tier": t["_id"], "count": t["count"], "revenue": t.get("total_revenue", 0)} for t in by_tier],
        "total_revenue": total_revenue,
        "total_transactions": len(paid_transactions)
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Nfadhfadh API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
