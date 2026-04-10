# Nyumba360 API Documentation

## Overview
This document provides comprehensive API documentation for the Nyumba360 Rental Property Management Platform, including all newly implemented features for Product 5.

## Base URL
```
http://localhost:5001/api
```

## Authentication
All endpoints (except auth routes) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## NEW FEATURES - PRODUCT 5

### 1. Expense Tracking

#### Create Expense
```http
POST /api/expenses
Content-Type: application/json
Authorization: Bearer <token>

{
  "property_id": "property_id",
  "unit_id": "unit_id",
  "expense_type": "repair",
  "category": "operational",
  "description": "Kitchen sink repair",
  "amount": 2500,
  "payment_method": "mpesa",
  "vendor": {
    "name": "John Plumber",
    "phone": "0712345678"
  },
  "is_recurring": false,
  "tax_deductible": true
}
```

#### Get Expenses
```http
GET /api/expenses?property_id=xxx&category=operational&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Expense Summary
```http
GET /api/expenses/summary?property_id=xxx&start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

#### Get Expense Trends
```http
GET /api/expenses/trends?property_id=xxx&months=12
Authorization: Bearer <token>
```

#### Get Vendor Analysis
```http
GET /api/expenses/vendor-analysis?property_id=xxx
Authorization: Bearer <token>
```

#### Update Expense
```http
PUT /api/expenses/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 3000,
  "notes": "Updated cost due to additional materials"
}
```

#### Delete Expense
```http
DELETE /api/expenses/:id
Authorization: Bearer <token>
```

---

### 2. Maintenance Management (Enhanced)

#### Create Maintenance Ticket
```http
POST /api/maintenance
Content-Type: application/json
Authorization: Bearer <token>

{
  "property_id": "property_id",
  "unit_id": "unit_id",
  "tenant_id": "tenant_id",
  "title": "Broken water heater",
  "description": "Water heater not heating water properly",
  "category": "plumbing",
  "priority": "high",
  "access_instructions": "Call tenant before entering",
  "permission_to_enter": true
}
```

#### Get Maintenance Tickets
```http
GET /api/maintenance?property_id=xxx&status=open&priority=high&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Maintenance Statistics
```http
GET /api/maintenance/stats?property_id=xxx&start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

#### Get Maintenance Trends
```http
GET /api/maintenance/trends?property_id=xxx&months=12
Authorization: Bearer <token>
```

#### Get Category Breakdown
```http
GET /api/maintenance/category-breakdown?property_id=xxx
Authorization: Bearer <token>
```

#### Get Vendor Performance
```http
GET /api/maintenance/vendor-performance?property_id=xxx
Authorization: Bearer <token>
```

#### Add Note to Ticket
```http
POST /api/maintenance/:id/notes
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Ordered replacement parts",
  "is_internal": false
}
```

#### Update Maintenance Ticket
```http
PUT /api/maintenance/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "in_progress",
  "assigned_to": {
    "name": "John Plumber",
    "phone": "0712345678",
    "company": "Quick Fix Plumbing"
  },
  "estimated_cost": 3500
}
```

---

### 3. Vacancy Listings (Enhanced)

#### Create Vacancy Listing
```http
POST /api/vacancies
Content-Type: application/json
Authorization: Bearer <token>

{
  "property_id": "property_id",
  "unit_id": "unit_id",
  "title": "Modern 1-Bedroom Apartment in Kilimani",
  "description": "Spacious 1-bedroom apartment with modern amenities",
  "monthly_rent": 35000,
  "security_deposit": 35000,
  "amenities": ["parking", "balcony", "gym"],
  "pet_policy": {
    "allowed": false
  },
  "parking": {
    "available": true,
    "spaces": 1,
    "type": "covered"
  },
  "requirements": {
    "minimum_income": 105000,
    "background_check_required": true
  }
}
```

#### Get Vacancy Listings
```http
GET /api/vacancies?search=kilimani&min_rent=20000&max_rent=50000&featured=true&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Featured Listings
```http
GET /api/vacancies/featured?limit=10
Authorization: Bearer <token>
```

#### Get My Listings
```http
GET /api/vacancies/my-listings?status=active&page=1&limit=20
Authorization: Bearer <token>
```

#### Publish Listing
```http
POST /api/vacancies/:id/publish
Authorization: Bearer <token>
```

#### Promote Listing
```http
POST /api/vacancies/:id/promote
Content-Type: application/json
Authorization: Bearer <token>

{
  "promotion_type": "boost",
  "promotion_budget": 5000,
  "duration_days": 30
}
```

#### Add Inquiry
```http
POST /api/vacancies/:id/inquiries
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "0723456789",
  "email": "jane@example.com",
  "message": "Interested in viewing the property",
  "preferred_contact": "phone"
}
```

#### Get Listing Analytics
```http
GET /api/vacancies/analytics?property_id=xxx
Authorization: Bearer <token>
```

---

### 4. Rental History Export

#### Get Rental History
```http
GET /api/rental-history/tenant/:tenant_id
Authorization: Bearer <token>
```

#### Download Rental History PDF
```http
GET /api/rental-history/tenant/:tenant_id/download/pdf
Authorization: Bearer <token>
```

#### Download Rental History CSV
```http
GET /api/rental-history/tenant/:tenant_id/download/csv
Authorization: Bearer <token>
```

#### Get Rental History Summary
```http
GET /api/rental-history/tenant/:tenant_id/summary
Authorization: Bearer <token>
```

#### Verify Rental History
```http
POST /api/rental-history/tenant/:tenant_id/verify
Content-Type: application/json

{
  "verification_code": "NY1234567890"
}
```

#### Share Rental History
```http
POST /api/rental-history/tenant/:tenant_id/share
Content-Type: application/json
Authorization: Bearer <token>

{
  "recipient_email": "bank@credit.com",
  "message": "Please verify rental history for loan application",
  "include_pdf": true
}
```

#### Get My Rental History (Tenants)
```http
GET /api/rental-history/my-history
Authorization: Bearer <token>
```

---

### 5. Agent Portal

#### Create Agent Profile
```http
POST /api/agents/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "agency_name": "Prime Properties Kenya",
  "license_number": "AG-2024-1234",
  "license_expiry": "2025-12-31",
  "specialization": ["residential", "property_management"],
  "service_areas": [{
    "county": "Nairobi",
    "areas": ["Kilimani", "Westlands", "Lavington"]
  }],
  "commission_structure": "percentage",
  "commission_rate": 8,
  "bio": "Experienced property manager with 10+ years in Nairobi real estate",
  "experience_years": 10,
  "languages": ["English", "Swahili"],
  "bank_details": {
    "bank_name": "Equity Bank",
    "account_name": "Prime Properties Kenya",
    "account_number": "1234567890"
  }
}
```

#### Get Agent Profile
```http
GET /api/agents/profile
Authorization: Bearer <token>
```

#### Update Agent Profile
```http
PUT /api/agents/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "commission_rate": 7.5,
  "specialization": ["residential", "commercial", "property_management"]
}
```

#### Get Agent Statistics
```http
GET /api/agents/stats
Authorization: Bearer <token>
```

#### Search Agents
```http
GET /api/agents/search?county=Nairobi&specialization=residential&min_rating=4&page=1&limit=20
```

#### Get Top Performing Agents
```http
GET /api/agents/top-performers?county=Nairobi&limit=10
```

#### Create Management Contract
```http
POST /api/agents/contracts
Content-Type: application/json
Authorization: Bearer <token>

{
  "landlord_id": "landlord_user_id",
  "property_ids": ["property_id_1", "property_id_2"],
  "management_type": "full_management",
  "end_date": "2025-12-31",
  "commission_structure": {
    "type": "percentage",
    "percentage_rate": 8,
    "setup_fee": 5000
  },
  "services_included": ["tenant_screening", "rent_collection", "maintenance_coordination"],
  "performance_targets": {
    "occupancy_rate_target": 95,
    "rent_collection_rate_target": 98
  }
}
```

#### Get Management Contracts
```http
GET /api/agents/contracts
Authorization: Bearer <token>
```

#### Get Managed Properties
```http
GET /api/agents/properties
Authorization: Bearer <token>
```

---

## Response Formats

### Success Response
```json
{
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error type",
  "details": "Detailed error message"
}
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_records": 200,
    "records_per_page": 20
  }
}
```

---

## Rate Limiting

Different endpoints have different rate limits:
- General endpoints: 100 requests per 15 minutes
- Notification endpoints: 50 requests per 15 minutes
- SMS endpoints: 20 requests per 15 minutes
- Email endpoints: 30 requests per 15 minutes
- Bulk operations: 10 requests per 15 minutes
- Emergency notifications: 5 requests per 15 minutes

---

## File Uploads

For endpoints that support file uploads (images, documents):
- Use `multipart/form-data`
- Maximum file size: 10MB
- Supported formats: JPG, PNG, PDF, DOC, DOCX

---

## Webhooks

### Payment Confirmation
```http
POST /api/payments/webhook/mpesa
Content-Type: application/json

{
  "transaction_id": "tx123",
  "amount": 35000,
  "status": "completed",
  "tenant_id": "tenant123",
  "property_id": "prop123"
}
```

---

## Environment Variables

Required environment variables:
```
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/nyumba360
JWT_SECRET=your-jwt-secret
MPESA_CONSUMER_KEY=your-mpesa-key
MPESA_CONSUMER_SECRET=your-mpesa-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=http://localhost:5001/api/payments/mpesa/callback
```

---

## Testing

### Example cURL Commands

#### Create Expense
```bash
curl -X POST http://localhost:5001/api/expenses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "expense_type": "repair",
    "description": "Fix leaking faucet",
    "amount": 1500,
    "payment_method": "mpesa"
  }'
```

#### Get Rental History PDF
```bash
curl -X GET http://localhost:5001/api/rental-history/tenant/60f7b3b3b3b3b3b3b3b3b3b3/download/pdf \
  -H "Authorization: Bearer <token>" \
  --output rental_history.pdf
```

---

## Support

For API support and documentation updates, contact:
- Email: api@nyumba360.co.ke
- Phone: +254 700 000 000
- Documentation: https://docs.nyumba360.co.ke
