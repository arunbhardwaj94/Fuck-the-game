# Bastar Mart - PRD

## Problem Statement
Build a professional full-stack Quick-Commerce website called "Bastar Mart" with a Blinkit-inspired UI. Features include Admin Dashboard for CRUD on products/categories with Cloudinary image upload, user-facing homepage with categories, search, quick add-to-cart, user authentication, checkout flow, and WhatsApp ordering.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (port 3000)
- **Backend**: FastAPI + Motor (async MongoDB) (port 8001, /api prefix)
- **Database**: MongoDB (local) - Collections: users, products, categories, carts, orders
- **Image Storage**: Cloudinary (signed uploads)
- **Auth**: JWT-based (Admin + User separate roles)

## User Personas
1. **Shoppers**: Browse, search, cart, login/signup, checkout, order history, saved addresses
2. **Admin**: Login at /bastar-admin, manage products & categories, upload images

## Core Requirements
- Custom Bastar Mart logo (teal green with speed arrow)
- Blinkit-style Yellow/Green theme, mobile-first
- User auth: Signup, Login, Forgot Password, Profile
- Admin panel at secret route /bastar-admin
- Cloudinary image upload in admin
- Live search with debounce (name + description)
- Circle categories like Blinkit
- Cart with checkout flow (login required)
- WhatsApp order to +916264178646
- Saved addresses, Order history

## What's Been Implemented
### Phase 1 (Jan 2026)
- Full backend: 40+ API endpoints (admin auth, user auth, categories, products, cart, cloudinary, seed, addresses, orders)
- Homepage: hero, circle categories, product grids, custom logo
- Category page, Search page with live suggestions
- Admin dashboard: Products & Categories CRUD with Cloudinary upload

### Phase 2 (Jan 2026)
- Live Search with debounce (searches name + description)
- Admin moved to secret route /bastar-admin
- Circle categories like Blinkit app
- WhatsApp checkout integration
- Custom user logo added everywhere

### Phase 3 (Jan 2026)
- User Authentication: Signup, Login, Forgot Password
- User Profile: Edit name/phone, My Orders, Saved Addresses
- Checkout flow: Login required, address selection, Place Order (COD)
- WhatsApp + Place Order dual checkout
- Header shows user name when logged in
- Mobile nav with Account link

### Phase 4 (Jan 2026)
- Delivery charge logic: ₹25 flat fee below ₹499, FREE above ₹499
- Upsell message in cart: "Add ₹X more for FREE delivery!"
- Price breakdown in cart: Subtotal + Delivery Fee + Total
- Live search improved: 300ms debounce, searches name + description + category name
- Empty search state: "No products found. Try searching something else!"
- Search dropdown: image, name, unit, category, price
- Hero updated to show "Free delivery above ₹499"

## Prioritized Backlog
### P1 (Next)
- Product detail page with full description
- Order status tracking (preparing, out for delivery, delivered)
- Email notifications for order confirmation

### P2 (Future)
- Payment integration (Razorpay/UPI)
- Push notifications
- Analytics dashboard for admin
- Offers & coupons system
- Delivery partner tracking
