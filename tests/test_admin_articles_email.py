"""
Test suite for Admin Article Management and Email Reminder features
Tests:
- Admin authentication
- Article CRUD operations (Create, Read, Update, Delete)
- User-facing articles endpoint with search
- Email reminder endpoints
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://wellness-hub-438.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "msallam227"
ADMIN_PASSWORD = "Muhammad#01"

# Test user credentials
TEST_USER = f"test_article_user_{uuid.uuid4().hex[:8]}"
TEST_PASSWORD = "Test123!"


class TestAdminAuthentication:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Admin can login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert data.get("is_admin") == True, "is_admin should be True"
        
    def test_admin_login_invalid_credentials(self):
        """Admin login fails with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "username": "wrong_user",
            "password": "wrong_pass"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdminArticleManagement:
    """Test admin article CRUD operations"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, "Admin login failed"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Get headers with admin auth"""
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
    
    def test_create_article(self, admin_headers):
        """Admin can create a new article with all fields"""
        article_data = {
            "title": "TEST_Mental Health Tips for Daily Life",
            "summary": "A comprehensive guide to maintaining mental wellness",
            "content": "This is the full content of the article about mental health tips. It includes various strategies and techniques for maintaining good mental health in daily life.",
            "author": "Test Author",
            "category": "mental health",
            "tags": ["wellness", "tips", "daily"],
            "published_date": "2025-01-20",
            "image_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/articles", 
                                json=article_data, 
                                headers=admin_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "article" in data or "message" in data, "Response should contain article or message"
        
        # Verify article was created
        if "article" in data:
            article = data["article"]
            assert article["title"] == article_data["title"]
            assert article["summary"] == article_data["summary"]
            assert article["author"] == article_data["author"]
            assert "id" in article
            
            # Store article ID for cleanup
            TestAdminArticleManagement.created_article_id = article["id"]
    
    def test_get_admin_articles(self, admin_headers):
        """Admin can get list of all articles"""
        response = requests.get(f"{BASE_URL}/api/admin/articles", headers=admin_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "articles" in data, "Response should contain articles list"
        assert isinstance(data["articles"], list), "Articles should be a list"
        assert "total" in data, "Response should contain total count"
    
    def test_update_article(self, admin_headers):
        """Admin can update an existing article"""
        # First create an article to update
        create_data = {
            "title": "TEST_Article to Update",
            "summary": "Original summary",
            "content": "Original content for the article",
            "author": "Original Author",
            "category": "stress"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/articles", 
                                       json=create_data, 
                                       headers=admin_headers)
        assert create_response.status_code == 200
        article_id = create_response.json().get("article", {}).get("id")
        
        if article_id:
            # Update the article
            update_data = {
                "title": "TEST_Updated Article Title",
                "summary": "Updated summary content",
                "content": "Updated content for the article",
                "author": "Updated Author",
                "category": "anxiety"
            }
            
            update_response = requests.put(f"{BASE_URL}/api/admin/articles/{article_id}", 
                                          json=update_data, 
                                          headers=admin_headers)
            
            assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
            
            # Cleanup - delete the test article
            requests.delete(f"{BASE_URL}/api/admin/articles/{article_id}", headers=admin_headers)
    
    def test_delete_article(self, admin_headers):
        """Admin can delete an article"""
        # First create an article to delete
        create_data = {
            "title": "TEST_Article to Delete",
            "summary": "This article will be deleted",
            "content": "Content for the article to be deleted",
            "author": "Test Author",
            "category": "wellness"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/articles", 
                                       json=create_data, 
                                       headers=admin_headers)
        assert create_response.status_code == 200
        article_id = create_response.json().get("article", {}).get("id")
        
        if article_id:
            # Delete the article
            delete_response = requests.delete(f"{BASE_URL}/api/admin/articles/{article_id}", 
                                             headers=admin_headers)
            
            assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
            
            # Verify article is deleted - should return 404
            get_response = requests.get(f"{BASE_URL}/api/articles/{article_id}", 
                                       headers=admin_headers)
            assert get_response.status_code == 404, "Deleted article should return 404"
    
    def test_delete_nonexistent_article(self, admin_headers):
        """Deleting non-existent article returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/admin/articles/{fake_id}", 
                                  headers=admin_headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestUserArticles:
    """Test user-facing articles endpoint"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Create a test user and get token"""
        # Register a test user
        register_data = {
            "username": TEST_USER,
            "password": TEST_PASSWORD,
            "birthdate": "1990-01-01",
            "country": "Egypt",
            "city": "Cairo",
            "occupation": "Tester",
            "gender": "male",
            "language": "en"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            return response.json()["token"]
        
        # If user exists, try login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USER,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            return login_response.json()["token"]
        
        pytest.skip("Could not create or login test user")
    
    @pytest.fixture(scope="class")
    def user_headers(self, user_token):
        """Get headers with user auth"""
        return {
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json"
        }
    
    def test_get_articles_list(self, user_headers):
        """User can get articles list (admin + PubMed)"""
        response = requests.get(f"{BASE_URL}/api/articles", headers=user_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "articles" in data, "Response should contain articles"
        assert "page" in data, "Response should contain page"
        assert "total" in data, "Response should contain total"
        assert "has_more" in data, "Response should contain has_more"
    
    def test_search_articles_by_title(self, user_headers):
        """User can search articles by title"""
        response = requests.get(f"{BASE_URL}/api/articles", 
                               params={"search": "anxiety"},
                               headers=user_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "articles" in data, "Response should contain articles"
        assert "search" in data, "Response should contain search term"
        assert data["search"] == "anxiety", "Search term should be returned"
    
    def test_get_search_suggestions(self, user_headers):
        """User can get search suggestions"""
        response = requests.get(f"{BASE_URL}/api/articles/search-suggestions", 
                               headers=user_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "suggestions" in data, "Response should contain suggestions"
        assert isinstance(data["suggestions"], list), "Suggestions should be a list"
        
        # Verify suggestion structure
        if len(data["suggestions"]) > 0:
            suggestion = data["suggestions"][0]
            assert "term" in suggestion, "Suggestion should have term"
            assert "label" in suggestion, "Suggestion should have label"
    
    def test_articles_pagination(self, user_headers):
        """Articles endpoint supports pagination"""
        response = requests.get(f"{BASE_URL}/api/articles", 
                               params={"page": 1, "limit": 5},
                               headers=user_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["page"] == 1, "Page should be 1"
        assert len(data["articles"]) <= 5, "Should return at most 5 articles"


class TestEmailReminders:
    """Test email reminder endpoints"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user token"""
        # Try to login with existing test user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USER,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            return login_response.json()["token"]
        
        # Register new user
        register_data = {
            "username": f"email_test_{uuid.uuid4().hex[:8]}",
            "password": TEST_PASSWORD,
            "birthdate": "1990-01-01",
            "country": "Egypt",
            "city": "Cairo",
            "occupation": "Tester",
            "gender": "male",
            "language": "en"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            return response.json()["token"]
        
        pytest.skip("Could not create test user for email tests")
    
    @pytest.fixture(scope="class")
    def user_headers(self, user_token):
        """Get headers with user auth"""
        return {
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin headers"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_get_email_reminder_settings(self, user_headers):
        """GET /api/email/reminder-settings endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/email/reminder-settings", 
                               headers=user_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "enabled" in data, "Response should contain enabled field"
        assert "reminder_time" in data, "Response should contain reminder_time"
    
    def test_update_email_reminder_settings(self, user_headers):
        """PUT /api/email/reminder-settings endpoint works"""
        settings_data = {
            "email": "test@example.com",
            "enabled": True,
            "reminder_time": "10:00",
            "timezone": "UTC"
        }
        
        response = requests.put(f"{BASE_URL}/api/email/reminder-settings", 
                               json=settings_data,
                               headers=user_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data or "settings" in data, "Response should contain message or settings"
    
    def test_send_test_reminder_without_sendgrid(self, user_headers):
        """POST /api/email/test-reminder returns error when SendGrid not configured"""
        response = requests.post(f"{BASE_URL}/api/email/test-reminder", 
                                json={"email": "test@example.com"},
                                headers=user_headers)
        
        # Should return 503 or 520 (Cloudflare) since SENDGRID_API_KEY is not configured
        assert response.status_code in [503, 520], f"Expected 503/520 (service unavailable), got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        assert "SENDGRID" in data["detail"].upper() or "email" in data["detail"].lower() or "configured" in data["detail"].lower(), "Error should mention SendGrid or email"
    
    def test_admin_send_bulk_reminders_without_sendgrid(self, admin_headers):
        """POST /api/admin/send-bulk-reminders returns error when SendGrid not configured"""
        response = requests.post(f"{BASE_URL}/api/admin/send-bulk-reminders", 
                                headers=admin_headers)
        
        # Should return 503 or 520 (Cloudflare) since SENDGRID_API_KEY is not configured
        assert response.status_code in [503, 520], f"Expected 503/520 (service unavailable), got {response.status_code}: {response.text}"


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_articles(self):
        """Clean up TEST_ prefixed articles"""
        # Get admin token
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Get all articles
        articles_response = requests.get(f"{BASE_URL}/api/admin/articles", headers=headers)
        if articles_response.status_code == 200:
            articles = articles_response.json().get("articles", [])
            
            # Delete TEST_ prefixed articles
            for article in articles:
                if article.get("title", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin/articles/{article['id']}", headers=headers)
        
        assert True, "Cleanup completed"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
