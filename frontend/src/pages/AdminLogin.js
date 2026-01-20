import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Globe, Eye, EyeOff, Shield, User, Lock } from 'lucide-react';
import { toast } from 'sonner';

const AdminLogin = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await adminLogin(username, password);
    
    if (result.success) {
      toast.success(language === 'ar' ? 'تم تسجيل دخول المسؤول!' : 'Admin login successful!');
      navigate('/admin/dashboard');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-slate-600 hover:text-[#0F4C81]"
            data-testid="language-toggle"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </Button>
        </div>

        <Card className="glass-card border-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-fade-in-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">{t('adminLogin')}</CardTitle>
            <CardDescription className="text-slate-500">
              {language === 'ar' ? 'لوحة تحكم المسؤول' : 'Administrator Dashboard'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700">{t('username')}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="ps-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400"
                    placeholder={t('username')}
                    required
                    data-testid="admin-username-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">{t('password')}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ps-10 pe-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-slate-400"
                    placeholder={t('password')}
                    required
                    data-testid="admin-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-slate-800 hover:bg-slate-700 rounded-full"
                disabled={loading}
                data-testid="admin-login-submit-btn"
              >
                {loading ? t('loading') : t('login')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-slate-500 hover:text-[#0F4C81]" data-testid="user-login-link">
                {language === 'ar' ? 'العودة لتسجيل دخول المستخدم' : 'Back to user login'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
