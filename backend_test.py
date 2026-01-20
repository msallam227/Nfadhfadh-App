#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NfadhfadhAPITester:
    def __init__(self, base_url="https://bilingual-mood.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.user_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n=== HEALTH CHECK TESTS ===")
        self.run_test("Root endpoint", "GET", "", 200)
        self.run_test("Health endpoint", "GET", "health", 200)

    def test_user_registration(self):
        """Test user registration"""
        print("\n=== USER REGISTRATION TESTS ===")
        
        # Test user registration
        user_data = {
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "password": "testpass123",
            "birthdate": "1990-01-01",
            "country": "egypt",
            "city": "Cairo",
            "occupation": "Engineer",
            "gender": "male",
            "language": "en"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.user_token = response['token']
            self.test_user_id = response['user']['id']
            print(f"   User ID: {self.test_user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        print("\n=== USER LOGIN TESTS ===")
        
        # Test with invalid credentials
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"username": "invalid", "password": "invalid"}
        )

    def test_admin_login(self):
        """Test admin login"""
        print("\n=== ADMIN LOGIN TESTS ===")
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/admin/login",
            200,
            data={"username": "msallam227", "password": "Muhammad#01"}
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_protected_endpoints(self):
        """Test protected endpoints with authentication"""
        if not self.user_token:
            print("❌ Skipping protected tests - no user token")
            return
            
        print("\n=== PROTECTED ENDPOINT TESTS ===")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Test /auth/me
        self.run_test("Get current user", "GET", "auth/me", 200, headers=headers)
        
        # Test feelings endpoint
        self.run_test("Get feelings list", "GET", "feelings", 200, headers=headers)

    def test_mood_checkin(self):
        """Test mood check-in functionality"""
        if not self.user_token:
            print("❌ Skipping mood tests - no user token")
            return
            
        print("\n=== MOOD CHECK-IN TESTS ===")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Create mood check-in
        mood_data = {
            "feeling": "happiness",
            "note": "Test mood check-in"
        }
        
        self.run_test(
            "Create Mood Check-in",
            "POST",
            "mood/checkin",
            200,
            data=mood_data,
            headers=headers
        )
        
        # Get mood check-ins
        self.run_test("Get Mood Check-ins", "GET", "mood/checkins", 200, headers=headers)
        
        # Get mood summary
        self.run_test("Get Mood Summary", "GET", "mood/summary", 200, headers=headers)

    def test_diary_functionality(self):
        """Test diary functionality"""
        if not self.user_token:
            print("❌ Skipping diary tests - no user token")
            return
            
        print("\n=== DIARY TESTS ===")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Get reflective questions
        self.run_test("Get Reflective Questions", "GET", "diary/questions", 200, headers=headers)
        
        # Create diary entry
        diary_data = {
            "content": "Test diary entry content",
            "reflective_question": "What are you grateful for today?",
            "reflective_answer": "I'm grateful for this test"
        }
        
        self.run_test(
            "Create Diary Entry",
            "POST",
            "diary/entry",
            200,
            data=diary_data,
            headers=headers
        )
        
        # Get diary entries
        self.run_test("Get Diary Entries", "GET", "diary/entries", 200, headers=headers)

    def test_chat_functionality(self):
        """Test venting chat functionality"""
        if not self.user_token:
            print("❌ Skipping chat tests - no user token")
            return
            
        print("\n=== CHAT TESTS ===")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Send chat message
        chat_data = {
            "message": "Hello, I'm feeling a bit anxious today"
        }
        
        success, response = self.run_test(
            "Send Chat Message",
            "POST",
            "chat/message",
            200,
            data=chat_data,
            headers=headers
        )
        
        if success and 'session_id' in response:
            self.session_id = response['session_id']
        
        # Get chat sessions
        self.run_test("Get Chat Sessions", "GET", "chat/sessions", 200, headers=headers)
        
        # Get chat history if we have a session
        if self.session_id:
            self.run_test(
                "Get Chat History",
                "GET",
                f"chat/history/{self.session_id}",
                200,
                headers=headers
            )

    def test_strategies_and_articles(self):
        """Test strategies and articles endpoints"""
        if not self.user_token:
            print("❌ Skipping content tests - no user token")
            return
            
        print("\n=== CONTENT TESTS ===")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Get strategies
        self.run_test("Get All Strategies", "GET", "strategies", 200, headers=headers)
        self.run_test("Get Anxiety Strategies", "GET", "strategies?feeling=anxiety", 200, headers=headers)
        
        # Get articles
        self.run_test("Get Articles", "GET", "articles", 200, headers=headers)
        self.run_test("Get Article by ID", "GET", "articles/1", 200, headers=headers)

    def test_payment_functionality(self):
        """Test payment functionality"""
        if not self.user_token:
            print("❌ Skipping payment tests - no user token")
            return
            
        print("\n=== PAYMENT TESTS ===")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Create checkout session
        payment_data = {
            "origin_url": "https://bilingual-mood.preview.emergentagent.com"
        }
        
        self.run_test(
            "Create Checkout Session",
            "POST",
            "payments/create-checkout",
            200,
            data=payment_data,
            headers=headers
        )

    def test_admin_functionality(self):
        """Test admin functionality"""
        if not self.admin_token:
            print("❌ Skipping admin tests - no admin token")
            return
            
        print("\n=== ADMIN TESTS ===")
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Get users
        self.run_test("Admin Get Users", "GET", "admin/users", 200, headers=headers)
        
        # Get analytics
        self.run_test("Admin Get Analytics", "GET", "admin/analytics", 200, headers=headers)
        
        # Export data
        self.run_test("Admin Export Users", "GET", "admin/export/users", 200, headers=headers)
        self.run_test("Admin Export Moods", "GET", "admin/export/moods", 200, headers=headers)

    def test_language_functionality(self):
        """Test language switching"""
        if not self.user_token:
            print("❌ Skipping language tests - no user token")
            return
            
        print("\n=== LANGUAGE TESTS ===")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Update language to Arabic
        self.run_test(
            "Update Language to Arabic",
            "PUT",
            "auth/language",
            200,
            data={"language": "ar"},
            headers=headers
        )
        
        # Update language back to English
        self.run_test(
            "Update Language to English",
            "PUT",
            "auth/language",
            200,
            data={"language": "en"},
            headers=headers
        )

def main():
    print("🚀 Starting Nfadhfadh API Tests...")
    print("=" * 50)
    
    tester = NfadhfadhAPITester()
    
    # Run all tests
    tester.test_health_check()
    
    if tester.test_user_registration():
        tester.test_user_login()
        tester.test_protected_endpoints()
        tester.test_mood_checkin()
        tester.test_diary_functionality()
        tester.test_chat_functionality()
        tester.test_strategies_and_articles()
        tester.test_payment_functionality()
        tester.test_language_functionality()
    
    if tester.test_admin_login():
        tester.test_admin_functionality()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend API tests mostly successful!")
        return 0
    else:
        print("⚠️  Backend API has significant issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())