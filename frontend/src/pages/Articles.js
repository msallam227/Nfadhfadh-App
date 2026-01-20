import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Articles = () => {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API}/articles`);
      setArticles(response.data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticle = async (id) => {
    try {
      const response = await axios.get(`${API}/articles/${id}`);
      setSelectedArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-soft text-[#0F4C81] text-xl">{t('loading')}</div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up" data-testid="article-detail">
        <button
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-2 text-[#0F4C81] hover:underline"
          data-testid="back-to-articles-btn"
        >
          <Arrow className="w-4 h-4 rtl:rotate-180" />
          {t('back')}
        </button>

        <Card className="card-soft overflow-hidden">
          {selectedArticle.image_url && (
            <img 
              src={selectedArticle.image_url} 
              alt={selectedArticle.title}
              className="w-full h-64 object-cover"
            />
          )}
          <CardContent className="p-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-[#E0F2FE] text-[#0F4C81] text-sm rounded-full">
                {selectedArticle.category}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">{selectedArticle.title}</h1>
            <p className="text-slate-600 leading-relaxed text-lg">{selectedArticle.content}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up" data-testid="articles-page">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          {t('articles')}
        </h1>
        <p className="text-slate-500 text-lg">
          {language === 'ar' 
            ? 'مقالات مفيدة عن الصحة النفسية والعافية' 
            : 'Helpful articles about mental health and wellness'}
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <Card 
            key={article.id} 
            className="card-soft overflow-hidden cursor-pointer group"
            onClick={() => fetchArticle(article.id)}
            data-testid={`article-card-${article.id}`}
          >
            {article.image_url && (
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={article.image_url} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 start-3 px-3 py-1 bg-white/90 text-[#0F4C81] text-sm rounded-full">
                  {article.category}
                </span>
              </div>
            )}
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-[#0F4C81] transition-colors">
                {article.title}
              </h3>
              <p className="text-slate-500 line-clamp-2 mb-4">{article.summary}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {language === 'ar' ? '5 دقائق قراءة' : '5 min read'}
                </div>
                <Arrow className="w-5 h-5 text-[#0F4C81] transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <Card className="card-soft">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {language === 'ar' ? 'لا توجد مقالات بعد' : 'No articles yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Articles;
