# Bastar Mart - PRD

## Problem Statement
Build a professional full-stack Quick-Commerce website called "Bastar Mart" with a Blinkit-inspired UI. Features include Admin Dashboard for CRUD on products/categories with Cloudinary image upload, user-facing homepage with categories, search, and quick add-to-cart system.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (port 3000)
- **Backend**: FastAPI + Motor (async MongoDB) (port 8001, /api prefix)
- **Database**: MongoDB (local)
- **Image Storage**: Cloudinary (signed uploads)
- **Auth**: JWT-based admin authentication

## User Personas
1. **Shoppers**: Browse categories, search products, add to cart
2. **Admin**: Login, manage products & categories, upload images

## Core Requirements
- Blinkit-style Yellow/Green theme
- Mobile-first responsive design
- Admin panel with CRUD + image upload
- Category browsing & product search
- Quick add-to-cart with quantity controls
- Cart sidebar with totals
- No "Made with Emergent" watermark

## What's Been Implemented (Jan 2026)
- Full backend with 15+ API endpoints (auth, categories, products, cart, cloudinary, seed)
- Homepage with hero, categories, product grids
- Category page with filtered products
- Search page with text search
- Admin login with JWT auth
- Admin dashboard with Products & Categories tabs (CRUD)
- Cloudinary signed image upload in admin
- Cart system with session-based persistence
- 6 demo categories, 19 demo products seeded
- Mobile bottom navigation

## Prioritized Backlog
### P0 (Done)
- Homepage, Categories, Products, Search, Cart, Admin CRUD, Image Upload

### P1 (Next)
- Checkout flow with order placement
- Order history for users
- Product detail page
- Admin bulk operations (import/export)

### P2 (Future)
- User registration & login
- Address management
- Payment integration (Razorpay/Stripe)
- Push notifications
- Analytics dashboard for admin
- Offers & coupons system
