import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Globe, User, LogOut, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { user, logout, updateLanguage } = useAuth();
  const navigate = useNavigate();

  const handleLanguageChange = async (newLang) => {
    changeLanguage(newLang);
    await updateLanguage(newLang);
    toast.success(language === 'ar' ? 'تم تحديث اللغة' : 'Language updated');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up" data-testid="settings-page">
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
