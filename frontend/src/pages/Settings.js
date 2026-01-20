import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Globe, User, LogOut, CreditCard, Bell, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { user, logout, updateLanguage } = useAuth();
  const navigate = useNavigate();
  
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const response = await axios.get(`${API}/notifications/settings`);
      setNotificationEnabled(response.data.enabled);
      setReminderTime(response.data.reminder_time);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const handleLanguageChange = async (newLang) => {
    changeLanguage(newLang);
    await updateLanguage(newLang);
    toast.success(language === 'ar' ? 'تم تحديث اللغة' : 'Language updated');
  };

  const handleNotificationSave = async () => {
    setSavingNotifications(true);
    try {
      await axios.put(`${API}/notifications/settings`, {
        enabled: notificationEnabled,
        reminder_time: reminderTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });
      toast.success(language === 'ar' ? 'تم حفظ إعدادات التذكير' : 'Reminder settings saved');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل في حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Generate time options (every 30 minutes)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      const time = `${hour}:${minute}`;
      const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString(
        language === 'ar' ? 'ar-EG' : 'en-US',
        { hour: 'numeric', minute: '2-digit', hour12: true }
      );
      timeOptions.push({ value: time, label: displayTime });
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t('settings')}</h1>
        <p className="text-slate-500 mt-1">
          {language === 'ar' ? 'إدارة إعدادات حسابك' : 'Manage your account settings'}
        </p>
      </div>

      {/* Profile Info */}
      <Card className="card-soft">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-[#0F4C81]" />
            {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">{t('username')}</p>
              <p className="font-medium text-slate-800">{user?.username}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">{t('country')}</p>
              <p className="font-medium text-slate-800">{user?.country}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">{t('city')}</p>
              <p className="font-medium text-slate-800">{user?.city}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">{t('occupation')}</p>
              <p className="font-medium text-slate-800">{user?.occupation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Reminder Settings */}
      <Card className="card-soft">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#8B5CF6]" />
            {language === 'ar' ? 'تذكير التسجيل اليومي' : 'Daily Check-in Reminder'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-slate-500">
            {language === 'ar' 
              ? 'حدد الوقت الذي تريد أن نذكرك فيه بتسجيل مزاجك يومياً'
              : 'Set a time to remind you to check in your mood daily'}
          </p>
          
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">
                {language === 'ar' ? 'تفعيل التذكير' : 'Enable Reminder'}
              </p>
              <p className="text-sm text-slate-500">
                {language === 'ar' ? 'استلم تذكير يومي' : 'Receive daily reminder'}
              </p>
            </div>
            <Switch
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
              data-testid="notification-toggle"
            />
          </div>

          {/* Time Selection */}
          {notificationEnabled && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4" />
                {language === 'ar' ? 'وقت التذكير' : 'Reminder Time'}
              </Label>
              <Select value={reminderTime} onValueChange={setReminderTime}>
                <SelectTrigger className="h-12 rounded-xl" data-testid="reminder-time-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <p className="text-xs text-slate-400">
                {language === 'ar' 
                  ? `سيتم تذكيرك في ${timeOptions.find(t => t.value === reminderTime)?.label || reminderTime} يومياً`
                  : `You'll be reminded at ${timeOptions.find(t => t.value === reminderTime)?.label || reminderTime} daily`}
              </p>
            </div>
          )}

          <Button
            onClick={handleNotificationSave}
            disabled={savingNotifications}
            className="w-full btn-primary"
            data-testid="save-notification-btn"
          >
            {savingNotifications 
              ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (language === 'ar' ? 'حفظ إعدادات التذكير' : 'Save Reminder Settings')}
          </Button>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="card-soft">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0F4C81]" />
            {t('selectLanguage')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>{language === 'ar' ? 'اللغة المفضلة' : 'Preferred Language'}</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-12 rounded-xl" data-testid="language-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card className="card-soft">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0F4C81]" />
            {t('subscription')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">{t('currentPlan')}</p>
              <p className={`text-sm ${user?.subscription_status === 'active' ? 'text-green-600' : 'text-slate-500'}`}>
                {user?.subscription_status === 'active' ? t('active') : t('inactive')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/subscription')}
              className="rounded-xl"
              data-testid="manage-subscription-btn"
            >
              {language === 'ar' ? 'إدارة' : 'Manage'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="card-soft border-red-100">
        <CardContent className="p-6">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5 me-2" />
            {t('logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
