import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Common
    appName: "Nfadhfadh",
    tagline: "Your emotional wellness companion",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    back: "Back",
    next: "Next",
    close: "Close",
    logout: "Logout",
    settings: "Settings",
    
    // Auth
    login: "Login",
    signup: "Sign Up",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    birthdate: "Birth Date",
    country: "Country",
    city: "City",
    occupation: "Occupation",
    gender: "Gender",
    male: "Male",
    female: "Female",
    selectLanguage: "Select Language",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    adminLogin: "Admin Login",
    
    // Navigation
    dashboard: "Dashboard",
    moodCheckin: "Mood Check-in",
    ventingChat: "Venting Chat",
    diary: "My Diary",
    strategies: "Mood Strategies",
    articles: "Articles",
    subscription: "Subscription",
    
    // Mood Check-in
    howAreYouFeeling: "How are you feeling today?",
    addNote: "Add a note (optional)",
    checkinSuccess: "Mood check-in saved!",
    
    // Feelings
    happiness: "Happiness / Joy",
    sadness: "Sadness",
    anger: "Anger",
    fear: "Fear",
    anxiety: "Anxiety / Worry",
    stress: "Stress / Overwhelm",
    calm: "Calm / Peace",
    love: "Love / Affection",
    loneliness: "Loneliness",
    hope: "Hope",
    disappointment: "Disappointment",
    frustration: "Frustration",
    guilt: "Guilt",
    shame: "Shame",
    pride: "Pride",
    jealousy: "Jealousy",
    thankful: "Thankful",
    excitement: "Excitement",
    boredom: "Boredom",
    confusion: "Confusion",
    
    // Chat
    startConversation: "Start a conversation...",
    chatDisclaimer: "This is not medical advice. For professional mental health support, please consult a licensed healthcare provider.",
    typeMessage: "Type your message...",
    send: "Send",
    newChat: "New Chat",
    
    // Diary
    writeYourThoughts: "Write your thoughts...",
    reflectiveQuestion: "Reflective Question",
    entrySaved: "Entry saved!",
    
    // Subscription
    subscriptionTitle: "Premium Subscription",
    subscriptionDescription: "Unlock all features and support your wellness journey",
    perMonth: "/month",
    subscribe: "Subscribe Now",
    currentPlan: "Current Plan",
    active: "Active",
    inactive: "Inactive",
    
    // Admin
    adminDashboard: "Admin Dashboard",
    totalUsers: "Total Users",
    activeSubscriptions: "Active Subscriptions",
    totalCheckins: "Total Check-ins",
    totalDiaryEntries: "Total Diary Entries",
    exportData: "Export Data",
    userManagement: "User Management",
    analytics: "Analytics",
    
    // Countries
    syria: "Syria",
    jordan: "Jordan",
    egypt: "Egypt",
    morocco: "Morocco",
    iraq: "Iraq",
    saudiArabia: "Saudi Arabia",
    uae: "UAE",
    qatar: "Qatar",
    kuwait: "Kuwait",
    bahrain: "Bahrain",
    oman: "Oman",
  },
  ar: {
    // Common
    appName: "نفضفض",
    tagline: "رفيقك للعافية النفسية",
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    submit: "إرسال",
    back: "رجوع",
    next: "التالي",
    close: "إغلاق",
    logout: "تسجيل خروج",
    settings: "الإعدادات",
    
    // Auth
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    birthdate: "تاريخ الميلاد",
    country: "البلد",
    city: "المدينة",
    occupation: "المهنة",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    selectLanguage: "اختر اللغة",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    dontHaveAccount: "ليس لديك حساب؟",
    adminLogin: "دخول المسؤول",
    
    // Navigation
    dashboard: "لوحة التحكم",
    moodCheckin: "تسجيل المزاج",
    ventingChat: "دردشة التنفيس",
    diary: "يومياتي",
    strategies: "استراتيجيات المزاج",
    articles: "مقالات",
    subscription: "الاشتراك",
    
    // Mood Check-in
    howAreYouFeeling: "إزيك النهاردة؟",
    addNote: "أضف ملاحظة (اختياري)",
    checkinSuccess: "تم حفظ تسجيل المزاج!",
    
    // Feelings
    happiness: "السعادة / الفرح",
    sadness: "الحزن",
    anger: "الغضب",
    fear: "الخوف",
    anxiety: "القلق",
    stress: "التوتر / الإرهاق",
    calm: "الهدوء / السلام",
    love: "الحب / المودة",
    loneliness: "الوحدة",
    hope: "الأمل",
    disappointment: "خيبة الأمل",
    frustration: "الإحباط",
    guilt: "الذنب",
    shame: "الخجل",
    pride: "الفخر",
    jealousy: "الغيرة",
    thankful: "الامتنان",
    excitement: "الحماس",
    boredom: "الملل",
    confusion: "الحيرة",
    
    // Chat
    startConversation: "ابدأ المحادثة...",
    chatDisclaimer: "هذا ليس نصيحة طبية. للحصول على دعم نفسي متخصص، يرجى استشارة مقدم رعاية صحية مرخص.",
    typeMessage: "اكتب رسالتك...",
    send: "إرسال",
    newChat: "محادثة جديدة",
    
    // Diary
    writeYourThoughts: "اكتب أفكارك...",
    reflectiveQuestion: "سؤال للتأمل",
    entrySaved: "تم حفظ المدخل!",
    
    // Subscription
    subscriptionTitle: "الاشتراك المميز",
    subscriptionDescription: "افتح جميع الميزات وادعم رحلة عافيتك",
    perMonth: "/شهر",
    subscribe: "اشترك الآن",
    currentPlan: "الخطة الحالية",
    active: "نشط",
    inactive: "غير نشط",
    
    // Admin
    adminDashboard: "لوحة تحكم المسؤول",
    totalUsers: "إجمالي المستخدمين",
    activeSubscriptions: "الاشتراكات النشطة",
    totalCheckins: "إجمالي التسجيلات",
    totalDiaryEntries: "إجمالي اليوميات",
    exportData: "تصدير البيانات",
    userManagement: "إدارة المستخدمين",
    analytics: "التحليلات",
    
    // Countries
    syria: "سوريا",
    jordan: "الأردن",
    egypt: "مصر",
    morocco: "المغرب",
    iraq: "العراق",
    saudiArabia: "السعودية",
    uae: "الإمارات",
    qatar: "قطر",
    kuwait: "الكويت",
    bahrain: "البحرين",
    oman: "عمان",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [direction, setDirection] = useState('ltr');

  useEffect(() => {
    const savedLang = localStorage.getItem('nfadhfadh_language');
    if (savedLang) {
      setLanguage(savedLang);
      setDirection(savedLang === 'ar' ? 'rtl' : 'ltr');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('nfadhfadh_language', language);
  }, [direction, language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    setDirection(newLang === 'ar' ? 'rtl' : 'ltr');
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    setDirection(lang === 'ar' ? 'rtl' : 'ltr');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
