import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { BookOpen, Clock, ArrowRight, ArrowLeft, Search, X, Loader2, ExternalLink } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Articles = () => {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerRef = useRef();
  const loadMoreRef = useRef();

  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    fetchSuggestions();
    fetchArticles(1, '');
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API}/articles/search-suggestions`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchArticles = async (pageNum, search, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = { page: pageNum, limit: 10 };
      if (search) params.search = search;
      
      const response = await axios.get(`${API}/articles`, { params });
      const data = response.data;
      
      if (append) {
        setArticles(prev => [...prev, ...data.articles]);
      } else {
        setArticles(data.articles || []);
      }
      
      setHasMore(data.has_more);
      setTotal(data.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setPage(1);
    fetchArticles(1, searchQuery);
  };

  const handleSuggestionClick = (term) => {
    setSearchQuery(term);
    setActiveSearch(term);
    setPage(1);
    fetchArticles(1, term);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setPage(1);
    fetchArticles(1, '');
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchArticles(page + 1, activeSearch, true);
    }
  }, [loadingMore, hasMore, page, activeSearch]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  const fetchArticle = async (id) => {
    try {
      const response = await axios.get(`${API}/articles/${id}`);
      setSelectedArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  if (selectedArticle) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up" data-testid="article-detail">
        <button
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-2 text-[#0F4C81] hover:underline"
          data-testid="back-to-articles-btn"
        >
          <Arrow className="w-4 h-4 rtl:rotate-180" />
          {language === 'ar' ? 'العودة للمقالات' : 'Back to Articles'}
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
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block px-3 py-1 bg-[#E0F2FE] text-[#0F4C81] text-sm rounded-full">
                {selectedArticle.category}
              </span>
              <span className="text-sm text-slate-500">{selectedArticle.source}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">{selectedArticle.title}</h1>
            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">{selectedArticle.content}</p>
            
            {selectedArticle.url && (
              <a 
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-[#0F4C81] hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                {language === 'ar' ? 'قراءة المزيد' : 'Read Full Article'}
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up" data-testid="articles-page">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
          {t('articles')}
        </h1>
        <p className="text-slate-500">
          {language === 'ar' 
            ? 'مقالات مفيدة عن الصحة النفسية والعافية' 
            : 'Helpful articles about mental health and wellness'}
        </p>
      </div>

      {/* Search Box */}
      <Card className="card-soft">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث عن مقالات... (قلق، سعادة، توتر)' : 'Search articles... (anxiety, happiness, stress)'}
                className="ps-10 pe-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#89CFF0]"
                data-testid="article-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <Button type="submit" className="btn-primary h-12 px-6" data-testid="article-search-btn">
              <Search className="w-5 h-5" />
            </Button>
          </form>

          {/* Search Suggestions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.slice(0, 10).map((suggestion) => (
              <button
                key={suggestion.term}
                onClick={() => handleSuggestionClick(suggestion.term)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  activeSearch === suggestion.term
                    ? 'bg-[#0F4C81] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-[#E0F2FE] hover:text-[#0F4C81]'
                }`}
                data-testid={`suggestion-${suggestion.term}`}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Search Badge */}
      {activeSearch && (
        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            {language === 'ar' ? 'نتائج البحث عن:' : 'Showing results for:'}
          </span>
          <span className="px-3 py-1 bg-[#0F4C81] text-white rounded-full text-sm flex items-center gap-2">
            {activeSearch}
            <button onClick={clearSearch}>
              <X className="w-4 h-4" />
            </button>
          </span>
          <span className="text-slate-400 text-sm">
            ({total} {language === 'ar' ? 'مقال' : 'articles'})
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#0F4C81] animate-spin" />
        </div>
      ) : (
        <>
          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article, index) => (
              <Card 
                key={`${article.id}-${index}`}
                className="card-soft overflow-hidden cursor-pointer group"
                onClick={() => fetchArticle(article.id)}
                data-testid={`article-card-${article.id}`}
              >
                {article.image_url && (
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 start-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-white/90 text-[#0F4C81] text-xs rounded-full">
                        {article.category}
                      </span>
                      <span className="px-2 py-1 bg-white/90 text-slate-600 text-xs rounded-full">
                        {article.source}
                      </span>
                    </div>
                  </div>
                )}
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-[#0F4C81] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4">{article.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {language === 'ar' ? '5 دقائق قراءة' : '5 min read'}
                    </div>
                    <Arrow className="w-4 h-4 text-[#0F4C81] transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {articles.length === 0 && !loading && (
            <Card className="card-soft">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  {activeSearch 
                    ? (language === 'ar' ? 'لم نجد مقالات لهذا البحث' : 'No articles found for this search')
                    : (language === 'ar' ? 'لا توجد مقالات بعد' : 'No articles yet')}
                </p>
                {activeSearch && (
                  <Button onClick={clearSearch} variant="outline" className="mt-4 rounded-xl">
                    {language === 'ar' ? 'مسح البحث' : 'Clear Search'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Load More / Infinite Scroll Trigger */}
          {hasMore && articles.length > 0 && (
            <div 
              ref={loadMoreRef}
              className="flex justify-center py-8"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading more...'}
                </div>
              ) : (
                <Button 
                  onClick={loadMore}
                  variant="outline"
                  className="rounded-xl"
                  data-testid="load-more-btn"
                >
                  {language === 'ar' ? 'تحميل المزيد' : 'Load More'}
                </Button>
              )}
            </div>
          )}

          {/* End of Articles */}
          {!hasMore && articles.length > 0 && (
            <p className="text-center text-slate-400 py-4">
              {language === 'ar' ? 'لقد وصلت إلى نهاية المقالات' : "You've reached the end"}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Articles;
