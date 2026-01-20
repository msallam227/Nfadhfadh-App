import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  Users, Activity, BookOpen, MessageCircle, 
  Download, LogOut, BarChart3, PieChart,
  TrendingUp, Globe, CreditCard, Eye, X,
  Smile, Calendar, RefreshCw, Trash2, Plus,
  FileText, Edit, Mail, Send
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#0F4C81', '#89CFF0', '#F4E4C1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

const ARTICLE_CATEGORIES = [
  'mental health', 'anxiety', 'depression', 'stress', 'relationships',
  'self-care', 'mindfulness', 'therapy', 'wellness', 'other'
];

const AdminDashboard = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [activeUserTab, setActiveUserTab] = useState('checkins');
  const [deletingUser, setDeletingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Article management state
  const [articles, setArticles] = useState([]);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    summary: '',
    content: '',
    author: 'Nfadhfadh Team',
    category: 'mental health',
    tags: '',
    published_date: new Date().toISOString().split('T')[0],
    image_url: ''
  });
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  
  // Email reminder state
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAdmin, navigate]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const [analyticsRes, usersRes, subsRes, articlesRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/admin/subscriptions`),
        axios.get(`${API}/admin/articles`)
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data.users || []);
      setSubscriptions(subsRes.data);
      setArticles(articlesRes.data.articles || []);
      if (!silent) setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error(language === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    toast.success(language === 'ar' ? 'تم تحديث البيانات' : 'Data refreshed');
  };

  const fetchUserData = async (userId) => {
    setUserDataLoading(true);
    try {
      const response = await axios.get(`${API}/admin/user/${userId}/full`);
      setUserData(response.data);
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل تحميل بيانات المستخدم' : 'Failed to load user data');
    } finally {
      setUserDataLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    fetchUserData(user.id);
  };

  const handleDeleteClick = (user) => {
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      await axios.delete(`${API}/admin/user/${deletingUser.id}`);
      toast.success(language === 'ar' ? 'تم حذف المستخدم' : 'User deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingUser(null);
      fetchData(); // Refresh the list
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل حذف المستخدم' : 'Failed to delete user');
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

  // Article management functions
  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      summary: '',
      content: '',
      author: 'Nfadhfadh Team',
      category: 'mental health',
      tags: '',
      published_date: new Date().toISOString().split('T')[0],
      image_url: ''
    });
    setEditingArticle(null);
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    setArticleSubmitting(true);
    
    try {
      const tagsArray = articleForm.tags
        ? articleForm.tags.split(',').map(t => t.trim()).filter(t => t)
        : [];
      
      const articleData = {
        ...articleForm,
        tags: tagsArray
      };
      
      if (editingArticle) {
        await axios.put(`${API}/admin/articles/${editingArticle.id}`, articleData);
        toast.success(language === 'ar' ? 'تم تحديث المقال' : 'Article updated');
      } else {
        await axios.post(`${API}/admin/articles`, articleData);
        toast.success(language === 'ar' ? 'تم إنشاء المقال' : 'Article created');
      }
      
      setShowArticleForm(false);
      resetArticleForm();
      fetchData();
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل حفظ المقال' : 'Failed to save article');
    } finally {
      setArticleSubmitting(false);
    }
  };

  const handleEditArticle = (article) => {
    setArticleForm({
      title: article.title || '',
      summary: article.summary || '',
      content: article.content || '',
      author: article.author || 'Nfadhfadh Team',
      category: article.category || 'mental health',
      tags: article.tags ? article.tags.join(', ') : '',
      published_date: article.published_date || new Date().toISOString().split('T')[0],
      image_url: article.image_url || ''
    });
    setEditingArticle(article);
    setShowArticleForm(true);
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm(language === 'ar' ? 'هل تريد حذف هذا المقال؟' : 'Delete this article?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/admin/articles/${articleId}`);
      toast.success(language === 'ar' ? 'تم حذف المقال' : 'Article deleted');
      fetchData();
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل حذف المقال' : 'Failed to delete article');
    }
  };

  // Email reminder function
  const handleSendBulkReminders = async () => {
    setSendingReminders(true);
    try {
      const response = await axios.post(`${API}/admin/send-bulk-reminders`);
      toast.success(response.data.message);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to send reminders';
      toast.error(errorMsg);
    } finally {
      setSendingReminders(false);
    }
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
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
              data-testid="admin-refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleLanguage} data-testid="admin-language-toggle">
              <Globe className="w-4 h-4 me-2" />
              {language === 'en' ? 'AR' : 'EN'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
              data-testid="admin-logout-btn"
            >
              <LogOut className="w-4 h-4 me-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="card-soft" data-testid="admin-stat-users">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#0F4C81]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t('totalUsers')}</p>
                  <p className="text-xl font-bold text-slate-900">{analytics?.total_users || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft bg-green-50 border-green-200" data-testid="admin-stat-subscriptions">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-700">{language === 'ar' ? 'المشتركين' : 'Subscribed'}</p>
                  <p className="text-xl font-bold text-green-800">{subscriptions?.active_subscribers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft bg-amber-50 border-amber-200" data-testid="admin-stat-revenue">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-700">{language === 'ar' ? 'الإيرادات' : 'Revenue'}</p>
                  <p className="text-xl font-bold text-amber-800">${subscriptions?.total_revenue?.toFixed(0) || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft" data-testid="admin-stat-checkins">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'التسجيلات' : 'Check-ins'}</p>
                  <p className="text-xl font-bold text-slate-900">{analytics?.total_checkins || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft" data-testid="admin-stat-diary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FCE7F3] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#EC4899]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'اليوميات' : 'Diary'}</p>
                  <p className="text-xl font-bold text-slate-900">{analytics?.total_diary_entries || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft" data-testid="admin-stat-messages">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'الرسائل' : 'Messages'}</p>
                  <p className="text-xl font-bold text-slate-900">{analytics?.total_chat_messages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white rounded-xl p-1 border border-slate-200">
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-[#0F4C81] data-[state=active]:text-white">
              <Users className="w-4 h-4 me-2" />
              {t('userManagement')}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-lg data-[state=active]:bg-[#0F4C81] data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 me-2" />
              {language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-[#0F4C81] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 me-2" />
              {t('analytics')}
            </TabsTrigger>
            <TabsTrigger value="export" className="rounded-lg data-[state=active]:bg-[#0F4C81] data-[state=active]:text-white">
              <Download className="w-4 h-4 me-2" />
              {t('exportData')}
            </TabsTrigger>
          </TabsList>

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
                        className="p-4 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors"
                        data-testid={`admin-user-${user.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#0F4C81] flex items-center justify-center text-white font-bold">
                            {user.username?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.username}</p>
                            <p className="text-sm text-slate-500">{user.country} • {user.occupation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-end me-2">
                            <p className={`text-sm font-medium ${user.subscription_status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                              {user.subscription_status === 'active' ? t('active') : t('inactive')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(user)}
                            className="rounded-lg"
                            data-testid={`view-user-${user.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(user)}
                            className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                            data-testid={`delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-soft">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">
                    {language === 'ar' ? 'توزيع الاشتراكات' : 'Subscription Tiers'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subscriptions?.by_tier?.map((tier) => (
                      <div key={tier.tier} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-800 capitalize">{tier.tier}</p>
                            <p className="text-sm text-slate-500">{tier.count} {language === 'ar' ? 'مشترك' : 'subscribers'}</p>
                          </div>
                          <p className="text-xl font-bold text-green-600">${tier.revenue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-soft">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">
                    {language === 'ar' ? 'المشتركين النشطين' : 'Active Subscribers'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {subscriptions?.subscribers?.map((sub) => (
                        <div key={sub.id} className="p-3 bg-green-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-800">{sub.username}</p>
                            <p className="text-xs text-slate-500">{sub.country}</p>
                          </div>
                          <span className="text-sm font-bold text-green-600">${sub.subscription_price}/mo</span>
                        </div>
                      ))}
                      {(!subscriptions?.subscribers || subscriptions.subscribers.length === 0) && (
                        <p className="text-center text-slate-400 py-8">
                          {language === 'ar' ? 'لا يوجد مشتركين بعد' : 'No subscribers yet'}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
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
                      <p className="text-sm text-slate-500">JSON format</p>
                    </div>
                  </div>
                  <Button onClick={() => handleExport('users')} className="w-full btn-primary" data-testid="export-users-btn">
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
                      <p className="text-sm text-slate-500">JSON format</p>
                    </div>
                  </div>
                  <Button onClick={() => handleExport('moods')} className="w-full btn-primary" data-testid="export-moods-btn">
                    <Download className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'تصدير' : 'Export'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => { setSelectedUser(null); setUserData(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0F4C81] flex items-center justify-center text-white font-bold">
                {selectedUser?.username?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold">{selectedUser?.username}</p>
                <p className="text-sm text-slate-500 font-normal">{selectedUser?.country} • {selectedUser?.occupation}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {userDataLoading ? (
            <div className="py-12 text-center text-slate-500">{t('loading')}</div>
          ) : userData ? (
            <div className="mt-4">
              {/* User Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-[#0F4C81]">{userData.mood_checkins?.total || 0}</p>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'تسجيلات' : 'Check-ins'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-[#EC4899]">{userData.diary_entries?.total || 0}</p>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'يوميات' : 'Diary'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-[#8B5CF6]">{userData.chat_messages?.total || 0}</p>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'رسائل' : 'Messages'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className={`text-2xl font-bold ${userData.user?.subscription_status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                    {userData.user?.subscription_status === 'active' ? '✓' : '—'}
                  </p>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'اشتراك' : 'Subscribed'}</p>
                </div>
              </div>

              {/* Data Tabs */}
              <Tabs value={activeUserTab} onValueChange={setActiveUserTab}>
                <TabsList className="w-full bg-slate-100 rounded-xl p-1">
                  <TabsTrigger value="checkins" className="flex-1 rounded-lg data-[state=active]:bg-white">
                    <Smile className="w-4 h-4 me-1" /> {language === 'ar' ? 'التسجيلات' : 'Check-ins'}
                  </TabsTrigger>
                  <TabsTrigger value="diary" className="flex-1 rounded-lg data-[state=active]:bg-white">
                    <BookOpen className="w-4 h-4 me-1" /> {language === 'ar' ? 'اليوميات' : 'Diary'}
                  </TabsTrigger>
                  <TabsTrigger value="chats" className="flex-1 rounded-lg data-[state=active]:bg-white">
                    <MessageCircle className="w-4 h-4 me-1" /> {language === 'ar' ? 'المحادثات' : 'Chats'}
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[350px] mt-4">
                  <TabsContent value="checkins" className="mt-0">
                    <div className="space-y-2">
                      {userData.mood_checkins?.data?.map((checkin, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-slate-800 capitalize">{t(checkin.feeling) || checkin.feeling}</span>
                              {checkin.note && <p className="text-sm text-slate-500 mt-1">{checkin.note}</p>}
                            </div>
                            <span className="text-xs text-slate-400">{new Date(checkin.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      {(!userData.mood_checkins?.data || userData.mood_checkins.data.length === 0) && (
                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="diary" className="mt-0">
                    <div className="space-y-2">
                      {userData.diary_entries?.data?.map((entry, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700">{entry.content}</p>
                          {entry.reflective_question && (
                            <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                              <p className="text-xs text-slate-500">{entry.reflective_question}</p>
                              {entry.reflective_answer && <p className="text-sm text-slate-700 mt-1">{entry.reflective_answer}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!userData.diary_entries?.data || userData.diary_entries.data.length === 0) && (
                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="chats" className="mt-0">
                    <div className="space-y-2">
                      {userData.chat_messages?.data?.map((msg, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-[#0F4C81] font-medium">Session: {msg.session_id?.slice(0, 8)}...</span>
                            <span className="text-xs text-slate-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2 bg-[#0F4C81] text-white rounded-lg text-sm">
                              <span className="text-xs opacity-70">User:</span> {msg.user_message}
                            </div>
                            {msg.ai_response && (
                              <div className="p-2 bg-white border border-slate-200 rounded-lg text-sm">
                                <span className="text-xs text-slate-400">AI:</span> {msg.ai_response}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!userData.chat_messages?.data || userData.chat_messages.data.length === 0) && (
                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
                      )}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              {language === 'ar' 
                ? `هل أنت متأكد من حذف المستخدم "${deletingUser?.username}"؟ سيتم حذف جميع بياناته بما في ذلك التسجيلات واليوميات والمحادثات.`
                : `Are you sure you want to delete "${deletingUser?.username}"? All their data including check-ins, diary entries, and chats will be permanently deleted.`}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-xl"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              data-testid="confirm-delete-btn"
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
