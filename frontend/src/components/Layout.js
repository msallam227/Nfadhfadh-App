import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  LayoutDashboard, Smile, MessageCircle, BookOpen, 
  Lightbulb, Newspaper, CreditCard, Settings, 
  LogOut, Menu, X, Globe
} from 'lucide-react';

const Layout = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/mood-checkin', icon: Smile, label: t('moodCheckin') },
    { path: '/venting-chat', icon: MessageCircle, label: t('ventingChat') },
    { path: '/diary', icon: BookOpen, label: t('diary') },
    { path: '/strategies', icon: Lightbulb, label: t('strategies') },
    { path: '/articles', icon: Newspaper, label: t('articles') },
    { path: '/subscription', icon: CreditCard, label: t('subscription') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  const NavItem = ({ item, onClick }) => (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-[#0F4C81] text-white shadow-lg' 
          : 'text-slate-600 hover:bg-slate-100'
        }
      `}
      data-testid={`nav-${item.path.slice(1)}`}
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile Header */}
      <header className="lg:hidden glass-nav sticky top-0 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-100"
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
            <div className="w-8 h-8 bg-[#0F4C81] rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">ن</span>
            </div>
            <span className="font-bold text-slate-800">{t('appName')}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="text-slate-600"
            data-testid="mobile-language-toggle"
          >
            <Globe className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 start-0 h-full w-72 bg-white border-e border-slate-200 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full rtl:lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#0F4C81] rounded-2xl flex items-center justify-center">
                  <span className="text-xl font-bold text-white">ن</span>
                </div>
                <div>
                  <h1 className="font-bold text-slate-800 text-lg">{t('appName')}</h1>
                  <p className="text-xs text-slate-500">{t('tagline')}</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 mx-4 mt-4 bg-gradient-to-br from-[#E0F2FE] to-[#F0F9FF] rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0F4C81] flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{user?.username}</p>
                <p className="text-xs text-slate-500 truncate">{user?.country}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-6">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavItem 
                  key={item.path} 
                  item={item} 
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 space-y-3">
            <Button
              variant="ghost"
              onClick={toggleLanguage}
              className="w-full justify-start text-slate-600 hover:bg-slate-100 rounded-xl"
              data-testid="sidebar-language-toggle"
            >
              <Globe className="w-5 h-5 me-3" />
              {language === 'en' ? 'العربية' : 'English'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:bg-red-50 rounded-xl"
              data-testid="sidebar-logout-btn"
            >
              <LogOut className="w-5 h-5 me-3" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ms-72 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
