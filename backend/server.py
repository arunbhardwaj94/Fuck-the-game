from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
import cloudinary
import cloudinary.utils
import cloudinary.uploader
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cloudinary config
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

JWT_SECRET = os.environ.get("JWT_SECRET", "fallback_secret")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@bastarmart.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123")

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class CategoryCreate(BaseModel):
    name: str
    image: Optional[str] = ""
    description: Optional[str] = ""

class CategoryResponse(BaseModel):
    id: str
    name: str
    image: str
    description: str
    product_count: int = 0

class ProductCreate(BaseModel):
    name: str
    price: float
    mrp: Optional[float] = None
    description: Optional[str] = ""
    category_id: str
    image: Optional[str] = ""
    unit: Optional[str] = "1 pc"
    in_stock: Optional[bool] = True

class ProductResponse(BaseModel):
    id: str
    name: str
    price: float
    mrp: float
    description: str
    category_id: str
    category_name: str = ""
    image: str
    unit: str
    in_stock: bool

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1

class AdminLogin(BaseModel):
    email: str
    password: str

# ============ AUTH ============

async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if data.email != ADMIN_EMAIL or data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode(
        {"email": data.email, "role": "admin", "exp": datetime.now(timezone.utc).timestamp() + 86400},
        JWT_SECRET, algorithm="HS256"
    )
    return {"token": token, "email": data.email}

@api_router.get("/admin/verify")
async def verify_token(admin=Depends(verify_admin)):
    return {"valid": True, "email": admin.get("email")}

# ============ CLOUDINARY ============

@api_router.get("/cloudinary/signature")
async def generate_signature(folder: str = "bastarmart"):
    timestamp = int(time.time())
    params = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params, os.environ.get("CLOUDINARY_API_SECRET"))
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "folder": folder
    }

# ============ CATEGORIES ============

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    for cat in categories:
        count = await db.products.count_documents({"category_id": cat["id"]})
        cat["product_count"] = count
    return categories

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, admin=Depends(verify_admin)):
    cat_dict = data.model_dump()
    cat_dict["id"] = str(uuid.uuid4())
    await db.categories.insert_one(cat_dict)
    return {**cat_dict, "product_count": 0}

@api_router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, data: CategoryCreate, admin=Depends(verify_admin)):
    result = await db.categories.update_one({"id": category_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    cat = await db.categories.find_one({"id": category_id}, {"_id": 0})
    count = await db.products.count_documents({"category_id": category_id})
    return {**cat, "product_count": count}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin=Depends(verify_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.products.delete_many({"category_id": category_id})
    return {"message": "Category and its products deleted"}

# ============ PRODUCTS ============

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(category_id: Optional[str] = None, search: Optional[str] = None, limit: int = 50):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    products = await db.products.find(query, {"_id": 0}).to_list(limit)
    cat_cache = {}
    for p in products:
        cid = p.get("category_id", "")
        if cid not in cat_cache:
            cat = await db.categories.find_one({"id": cid}, {"_id": 0})
            cat_cache[cid] = cat["name"] if cat else ""
        p["category_name"] = cat_cache[cid]
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    cat = await db.categories.find_one({"id": product.get("category_id", "")}, {"_id": 0})
    product["category_name"] = cat["name"] if cat else ""
    return product

@api_router.post("/products", response_model=ProductResponse)
async def create_product(data: ProductCreate, admin=Depends(verify_admin)):
    prod_dict = data.model_dump()
    prod_dict["id"] = str(uuid.uuid4())
    if not prod_dict.get("mrp"):
        prod_dict["mrp"] = prod_dict["price"]
    await db.products.insert_one(prod_dict)
    cat = await db.categories.find_one({"id": prod_dict["category_id"]}, {"_id": 0})
    prod_dict["category_name"] = cat["name"] if cat else ""
    return prod_dict

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, data: ProductCreate, admin=Depends(verify_admin)):
    update_data = data.model_dump()
    if not update_data.get("mrp"):
        update_data["mrp"] = update_data["price"]
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    cat = await db.categories.find_one({"id": product.get("category_id", "")}, {"_id": 0})
    product["category_name"] = cat["name"] if cat else ""
    return product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(verify_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ============ CART ============

@api_router.get("/cart/{session_id}")
async def get_cart(session_id: str):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        return {"session_id": session_id, "items": [], "total": 0}
    items_with_details = []
    total = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item_total = product["price"] * item["quantity"]
            total += item_total
            items_with_details.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "name": product["name"],
                "price": product["price"],
                "mrp": product.get("mrp", product["price"]),
                "image": product.get("image", ""),
                "unit": product.get("unit", "1 pc"),
                "item_total": item_total
            })
    return {"session_id": session_id, "items": items_with_details, "total": round(total, 2)}

@api_router.post("/cart/{session_id}/add")
async def add_to_cart(session_id: str, item: CartItem):
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        await db.carts.insert_one({"session_id": session_id, "items": [item.model_dump()]})
    else:
        existing = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
        if existing:
            await db.carts.update_one(
                {"session_id": session_id, "items.product_id": item.product_id},
                {"$set": {"items.$.quantity": existing["quantity"] + item.quantity}}
            )
        else:
            await db.carts.update_one({"session_id": session_id}, {"$push": {"items": item.model_dump()}})
    return await get_cart(session_id)

@api_router.post("/cart/{session_id}/update")
async def update_cart_item(session_id: str, item: CartItem):
    if item.quantity <= 0:
        await db.carts.update_one(
            {"session_id": session_id},
            {"$pull": {"items": {"product_id": item.product_id}}}
        )
    else:
        await db.carts.update_one(
            {"session_id": session_id, "items.product_id": item.product_id},
            {"$set": {"items.$.quantity": item.quantity}}
        )
    return await get_cart(session_id)

@api_router.delete("/cart/{session_id}")
async def clear_cart(session_id: str):
    await db.carts.delete_one({"session_id": session_id})
    return {"message": "Cart cleared"}

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data():
    existing = await db.categories.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "categories": existing}

    categories = [
        {"id": str(uuid.uuid4()), "name": "Dairy & Breakfast", "image": "https://images.pexels.com/photos/3038/morning-breakfast-kitchen-cutting-board.jpg?auto=compress&cs=tinysrgb&w=400", "description": "Milk, Bread, Butter & more"},
        {"id": str(uuid.uuid4()), "name": "Fruits & Vegetables", "image": "https://images.pexels.com/photos/7333130/pexels-photo-7333130.jpeg?auto=compress&cs=tinysrgb&w=400", "description": "Fresh fruits & veggies"},
        {"id": str(uuid.uuid4()), "name": "Snacks & Munchies", "image": "https://images.pexels.com/photos/36236282/pexels-photo-36236282.jpeg?auto=compress&cs=tinysrgb&w=400", "description": "Chips, Namkeen & more"},
        {"id": str(uuid.uuid4()), "name": "Cold Drinks & Juices", "image": "https://images.unsplash.com/photo-1690988109092-6b29ef11107f?w=400", "description": "Soft drinks, Juices & Water"},
        {"id": str(uuid.uuid4()), "name": "Instant & Frozen Food", "image": "https://images.pexels.com/photos/5425794/pexels-photo-5425794.jpeg?auto=compress&cs=tinysrgb&w=400", "description": "Noodles, Frozen Snacks & more"},
        {"id": str(uuid.uuid4()), "name": "Atta, Rice & Dal", "image": "https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=400", "description": "Staples for your kitchen"},
    ]
    await db.categories.insert_many(categories)

    products = [
        # Dairy & Breakfast
        {"id": str(uuid.uuid4()), "name": "Amul Toned Milk", "price": 31, "mrp": 31, "description": "Fresh toned milk, 500ml pouch", "category_id": categories[0]["id"], "image": "https://images.pexels.com/photos/1435706/pexels-photo-1435706.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "500 ml", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Amul Butter", "price": 58, "mrp": 60, "description": "Pasteurised butter, 100g", "category_id": categories[0]["id"], "image": "https://images.pexels.com/photos/531334/pexels-photo-531334.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "100 g", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Britannia Brown Bread", "price": 45, "mrp": 50, "description": "Whole wheat bread, 400g", "category_id": categories[0]["id"], "image": "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "400 g", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Amul Paneer", "price": 90, "mrp": 95, "description": "Fresh cottage cheese, 200g", "category_id": categories[0]["id"], "image": "https://images.pexels.com/photos/4331491/pexels-photo-4331491.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "200 g", "in_stock": True},
        # Fruits & Vegetables
        {"id": str(uuid.uuid4()), "name": "Banana - Robusta", "price": 44, "mrp": 50, "description": "Fresh bananas, 6 pcs approx", "category_id": categories[1]["id"], "image": "https://images.pexels.com/photos/2316466/pexels-photo-2316466.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "6 pcs", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Apple - Shimla", "price": 149, "mrp": 170, "description": "Premium red apples, 4 pcs", "category_id": categories[1]["id"], "image": "https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "4 pcs", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Onion", "price": 35, "mrp": 40, "description": "Fresh onions, 1kg", "category_id": categories[1]["id"], "image": "https://images.pexels.com/photos/4197444/pexels-photo-4197444.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "1 kg", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Tomato - Local", "price": 29, "mrp": 35, "description": "Farm fresh tomatoes, 500g", "category_id": categories[1]["id"], "image": "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "500 g", "in_stock": True},
        # Snacks & Munchies
        {"id": str(uuid.uuid4()), "name": "Lay's Classic Salted", "price": 20, "mrp": 20, "description": "Classic salted potato chips", "category_id": categories[2]["id"], "image": "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "52 g", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Haldiram Aloo Bhujia", "price": 55, "mrp": 60, "description": "Crispy aloo bhujia namkeen", "category_id": categories[2]["id"], "image": "https://images.pexels.com/photos/8601399/pexels-photo-8601399.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "200 g", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Oreo Original", "price": 30, "mrp": 30, "description": "Chocolate sandwich cookies", "category_id": categories[2]["id"], "image": "https://images.pexels.com/photos/3735149/pexels-photo-3735149.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "120 g", "in_stock": True},
        # Cold Drinks & Juices
        {"id": str(uuid.uuid4()), "name": "Coca-Cola", "price": 40, "mrp": 40, "description": "Refreshing cola drink", "category_id": categories[3]["id"], "image": "https://images.unsplash.com/photo-1690988109092-6b29ef11107f?w=400", "unit": "750 ml", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Real Mango Juice", "price": 99, "mrp": 110, "description": "Real fruit power mango", "category_id": categories[3]["id"], "image": "https://images.pexels.com/photos/2668835/pexels-photo-2668835.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "1 L", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Bisleri Water", "price": 20, "mrp": 20, "description": "Packaged drinking water", "category_id": categories[3]["id"], "image": "https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "1 L", "in_stock": True},
        # Instant & Frozen Food
        {"id": str(uuid.uuid4()), "name": "Maggi 2-Minute Noodles", "price": 14, "mrp": 14, "description": "India's favourite instant noodles", "category_id": categories[4]["id"], "image": "https://images.pexels.com/photos/2456435/pexels-photo-2456435.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "70 g", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "McCain French Fries", "price": 115, "mrp": 130, "description": "Crispy golden french fries", "category_id": categories[4]["id"], "image": "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "420 g", "in_stock": True},
        # Atta, Rice & Dal
        {"id": str(uuid.uuid4()), "name": "Aashirvaad Atta", "price": 255, "mrp": 280, "description": "Whole wheat flour, 5kg", "category_id": categories[5]["id"], "image": "https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "5 kg", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "India Gate Basmati Rice", "price": 399, "mrp": 450, "description": "Premium basmati rice, 5kg", "category_id": categories[5]["id"], "image": "https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "5 kg", "in_stock": True},
        {"id": str(uuid.uuid4()), "name": "Toor Dal", "price": 135, "mrp": 150, "description": "Unpolished toor dal, 1kg", "category_id": categories[5]["id"], "image": "https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=400", "unit": "1 kg", "in_stock": True},
    ]
    await db.products.insert_many(products)

    # Create text index for search
    await db.products.create_index([("name", "text"), ("description", "text")])

    return {"message": "Data seeded successfully", "categories": len(categories), "products": len(products)}

# ============ SETUP ============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
