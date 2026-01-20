import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Users, Activity, BookOpen, MessageCircle, 
  Download, LogOut, BarChart3, PieChart,
  TrendingUp, Globe
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#0F4C81', '#89CFF0', '#F4E4C1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

const AdminDashboard = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`),
        axios.get(`${API}/admin/users`)
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error(language === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`${API}/admin/export/${type}`);
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nfadhfadh_${type}_export.json`;
      a.click();
      toast.success(language === 'ar' ? 'تم تصدير البيانات' : 'Data exported');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-pulse-soft text-[#0F4C81] text-xl">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">ن</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">{t('adminDashboard')}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2"
              data-testid="admin-language-toggle"
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'AR' : 'EN'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              data-testid="admin-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="card-soft" data-testid="admin-stat-users">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#0F4C81]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t('totalUsers')}</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics?.total_users || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft" data-testid="admin-stat-subscriptions">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t('activeSubscriptions')}</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics?.active_subscriptions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft" data-testid="admin-stat-checkins">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t('totalCheckins')}</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics?.total_checkins || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft" data-testid="admin-stat-diary">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FCE7F3] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#EC4899]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t('totalDiaryEntries')}</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics?.total_diary_entries || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft" data-testid="admin-stat-messages">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{language === 'ar' ? 'الرسائل' : 'Messages'}</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics?.total_chat_messages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white rounded-xl p-1 border border-slate-200">
            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-[#0F4C81] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 me-2" />
              {t('analytics')}
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-[#0F4C81] data-[state=active]:text-white">
              <Users className="w-4 h-4 me-2" />
              {t('userManagement')}
            </TabsTrigger>
            <TabsTrigger value="export" className="rounded-lg data-[state=active]:bg-[#0F4C81] data-[state=active]:text-white">
              <Download className="w-4 h-4 me-2" />
              {t('exportData')}
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Distribution Chart */}
              <Card className="card-soft" data-testid="admin-mood-chart">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#0F4C81]" />
                    {language === 'ar' ? 'توزيع المشاعر' : 'Mood Distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={analytics?.mood_distribution || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          nameKey="feeling"
                          label={({ feeling, count }) => `${t(feeling) || feeling}: ${count}`}
                        >
                          {(analytics?.mood_distribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Country Distribution Chart */}
              <Card className="card-soft" data-testid="admin-country-chart">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#0F4C81]" />
                    {language === 'ar' ? 'توزيع الدول' : 'Country Distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.country_distribution || []}>
                        <XAxis dataKey="country" stroke="#94A3B8" fontSize={12} />
                        <YAxis stroke="#94A3B8" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gender Distribution */}
              <Card className="card-soft" data-testid="admin-gender-chart">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">
                    {language === 'ar' ? 'توزيع الجنس' : 'Gender Distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={analytics?.gender_distribution || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          nameKey="gender"
                          label={({ gender, count }) => `${t(gender) || gender}: ${count}`}
                        >
                          {(analytics?.gender_distribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0F4C81' : '#89CFF0'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="card-soft">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">{t('userManagement')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div 
                        key={user.id}
                        className="p-4 bg-slate-50 rounded-xl flex items-center justify-between"
                        data-testid={`admin-user-${user.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#0F4C81] flex items-center justify-center text-white font-bold">
                            {user.username?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.username}</p>
                            <p className="text-sm text-slate-500">
                              {user.country} • {user.occupation}
                            </p>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className={`text-sm font-medium ${user.subscription_status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                            {user.subscription_status === 'active' ? t('active') : t('inactive')}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-soft">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#0F4C81]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {language === 'ar' ? 'تصدير بيانات المستخدمين' : 'Export User Data'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {language === 'ar' ? 'جميع بيانات المستخدمين بصيغة JSON' : 'All user data in JSON format'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleExport('users')}
                    className="w-full btn-primary"
                    data-testid="export-users-btn"
                  >
                    <Download className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'تصدير' : 'Export'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-soft">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                      <Activity className="w-6 h-6 text-[#F59E0B]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {language === 'ar' ? 'تصدير بيانات المزاج' : 'Export Mood Data'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {language === 'ar' ? 'جميع تسجيلات المزاج بصيغة JSON' : 'All mood check-ins in JSON format'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleExport('moods')}
                    className="w-full btn-primary"
                    data-testid="export-moods-btn"
                  >
                    <Download className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'تصدير' : 'Export'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
