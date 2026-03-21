#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Bastar Mart
Tests all CRUD operations, authentication, and cart functionality
"""

import requests
import sys
import json
from datetime import datetime

class BastarMartAPITester:
    def __init__(self, base_url="https://ecommerce-preview-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.session_id = f"test_session_{datetime.now().strftime('%H%M%S')}"

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_admin_auth(self):
        """Test admin authentication"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test invalid login
        self.run_test(
            "Admin login with invalid credentials",
            "POST",
            "admin/login",
            401,
            {"email": "wrong@email.com", "password": "wrongpass"}
        )
        
        # Test valid login
        response = self.run_test(
            "Admin login with valid credentials",
            "POST", 
            "admin/login",
            200,
            {"email": "admin@bastarmart.com", "password": "Admin@123"}
        )
        
        if response and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            
            # Test token verification
            self.run_test(
                "Admin token verification",
                "GET",
                "admin/verify",
                200
            )
        else:
            print("❌ Failed to get admin token - stopping admin tests")

    def test_categories(self):
        """Test category CRUD operations"""
        print("\n📂 Testing Categories...")
        
        # Get categories
        categories = self.run_test(
            "Get all categories",
            "GET",
            "categories",
            200
        )
        
        if categories:
            print(f"   Found {len(categories)} categories")
            
            # Test category creation (admin required)
            if self.token:
                new_category = self.run_test(
                    "Create new category",
                    "POST",
                    "categories",
                    200,
                    {
                        "name": "Test Category",
                        "description": "Test category description",
                        "image": "https://via.placeholder.com/200"
                    }
                )
                
                if new_category and 'id' in new_category:
                    cat_id = new_category['id']
                    print(f"   Created category with ID: {cat_id}")
                    
                    # Test category update
                    self.run_test(
                        "Update category",
                        "PUT",
                        f"categories/{cat_id}",
                        200,
                        {
                            "name": "Updated Test Category",
                            "description": "Updated description",
                            "image": "https://via.placeholder.com/200"
                        }
                    )
                    
                    # Test category deletion
                    self.run_test(
                        "Delete category",
                        "DELETE",
                        f"categories/{cat_id}",
                        200
                    )
            else:
                print("   Skipping category CRUD tests (no admin token)")

    def test_products(self):
        """Test product CRUD operations"""
        print("\n📦 Testing Products...")
        
        # Get all products
        products = self.run_test(
            "Get all products",
            "GET",
            "products",
            200
        )
        
        if products:
            print(f"   Found {len(products)} products")
            
            # Test product search
            search_results = self.run_test(
                "Search products for 'milk'",
                "GET",
                "products?search=milk",
                200
            )
            
            if search_results:
                print(f"   Search returned {len(search_results)} results")
            
            # Test category filtering
            if products and len(products) > 0:
                first_product = products[0]
                category_id = first_product.get('category_id')
                if category_id:
                    filtered_products = self.run_test(
                        f"Filter products by category",
                        "GET",
                        f"products?category_id={category_id}",
                        200
                    )
                    
                    if filtered_products:
                        print(f"   Category filter returned {len(filtered_products)} products")
                
                # Test get single product
                product_id = first_product.get('id')
                if product_id:
                    self.run_test(
                        "Get single product",
                        "GET",
                        f"products/{product_id}",
                        200
                    )
            
            # Test product creation (admin required)
            if self.token:
                # Get a category ID for the new product
                categories = self.run_test(
                    "Get categories for product creation",
                    "GET",
                    "categories",
                    200
                )
                
                if categories and len(categories) > 0:
                    category_id = categories[0]['id']
                    new_product = self.run_test(
                        "Create new product",
                        "POST",
                        "products",
                        200,
                        {
                            "name": "Test Product",
                            "price": 99.99,
                            "mrp": 120.00,
                            "description": "Test product description",
                            "category_id": category_id,
                            "image": "https://via.placeholder.com/200",
                            "unit": "1 pc",
                            "in_stock": True
                        }
                    )
                    
                    if new_product and 'id' in new_product:
                        product_id = new_product['id']
                        print(f"   Created product with ID: {product_id}")
                        
                        # Test product update
                        self.run_test(
                            "Update product",
                            "PUT",
                            f"products/{product_id}",
                            200,
                            {
                                "name": "Updated Test Product",
                                "price": 89.99,
                                "mrp": 110.00,
                                "description": "Updated description",
                                "category_id": category_id,
                                "image": "https://via.placeholder.com/200",
                                "unit": "1 pc",
                                "in_stock": True
                            }
                        )
                        
                        # Test product deletion
                        self.run_test(
                            "Delete product",
                            "DELETE",
                            f"products/{product_id}",
                            200
                        )
            else:
                print("   Skipping product CRUD tests (no admin token)")

    def test_cart_operations(self):
        """Test cart functionality"""
        print("\n🛒 Testing Cart Operations...")
        
        # Get empty cart
        self.run_test(
            "Get empty cart",
            "GET",
            f"cart/{self.session_id}",
            200
        )
        
        # Get products to add to cart
        products = self.run_test(
            "Get products for cart testing",
            "GET",
            "products?limit=5",
            200
        )
        
        if products and len(products) > 0:
            product_id = products[0]['id']
            print(f"   Using product ID: {product_id}")
            
            # Add item to cart
            cart_response = self.run_test(
                "Add item to cart",
                "POST",
                f"cart/{self.session_id}/add",
                200,
                {"product_id": product_id, "quantity": 2}
            )
            
            if cart_response:
                print(f"   Cart total: ₹{cart_response.get('total', 0)}")
                print(f"   Cart items: {len(cart_response.get('items', []))}")
                
                # Update cart item quantity
                self.run_test(
                    "Update cart item quantity",
                    "POST",
                    f"cart/{self.session_id}/update",
                    200,
                    {"product_id": product_id, "quantity": 3}
                )
                
                # Remove item from cart (set quantity to 0)
                self.run_test(
                    "Remove item from cart",
                    "POST",
                    f"cart/{self.session_id}/update",
                    200,
                    {"product_id": product_id, "quantity": 0}
                )
                
                # Clear entire cart
                self.run_test(
                    "Clear cart",
                    "DELETE",
                    f"cart/{self.session_id}",
                    200
                )

    def test_cloudinary_integration(self):
        """Test Cloudinary signature generation"""
        print("\n☁️ Testing Cloudinary Integration...")
        
        if self.token:
            signature_response = self.run_test(
                "Get Cloudinary signature",
                "GET",
                "cloudinary/signature?folder=bastarmart",
                200
            )
            
            if signature_response:
                required_fields = ['signature', 'timestamp', 'cloud_name', 'api_key', 'folder']
                missing_fields = [field for field in required_fields if field not in signature_response]
                
                if not missing_fields:
                    self.log_test("Cloudinary signature contains all required fields", True)
                    print(f"   Cloud name: {signature_response.get('cloud_name')}")
                    print(f"   Folder: {signature_response.get('folder')}")
                else:
                    self.log_test("Cloudinary signature missing fields", False, f"Missing: {missing_fields}")
        else:
            print("   Skipping Cloudinary tests (no admin token)")

    def test_data_seeding(self):
        """Test data seeding endpoint"""
        print("\n🌱 Testing Data Seeding...")
        
        seed_response = self.run_test(
            "Seed initial data",
            "POST",
            "seed",
            200
        )
        
        if seed_response:
            print(f"   Seed response: {seed_response.get('message', 'No message')}")

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Bastar Mart Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity
        try:
            response = requests.get(f"{self.base_url}/api/categories", timeout=10)
            if response.status_code in [200, 404, 500]:
                print("✅ Backend server is reachable")
            else:
                print(f"⚠️ Backend returned status {response.status_code}")
        except Exception as e:
            print(f"❌ Cannot reach backend: {e}")
            return False
        
        # Run test suites
        self.test_data_seeding()
        self.test_admin_auth()
        self.test_categories()
        self.test_products()
        self.test_cart_operations()
        self.test_cloudinary_integration()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} tests failed")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return False

def main():
    """Main test runner"""
    tester = BastarMartAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())