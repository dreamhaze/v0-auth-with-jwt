# Implementation Notes - Constructor and Profile Functionality

## Overview
This document describes the implementation of constructor panel functionality and profile pages for the Nuxt 4 frontend.

## Implemented Features

### 1. Constructor Panel (`components/variant/ActionPanel.vue`)
- **Download PDF**: Uses `jspdf` + `html2canvas` to generate PDF from variant content
- **Print**: Uses browser's native `window.print()` with custom print styles
- **Save to Profile**: Saves current variant to user's profile via `POST /api/variants`
- **Share**: Generates shareable link and copies to clipboard, supports Web Share API on mobile

### 2. Profile Page (`pages/profile/index.vue`)
- Fetches user data from `/api/auth/me`
- Displays subscription status, daily limits, and purchased downloads from `/api/variants/export/quota`
- Personal data section with edit functionality
- Navigation to subscription and shop pages

### 3. My Variants Page (`pages/profile/my-variants.vue`)
- Fetches saved variants from `GET /api/variants`
- Displays variant cards with title, creation date, and author info
- Actions: Open (navigate to variant view), Download, Print, Delete
- Delete confirmation modal

### 4. Subscription Page (`pages/profile/subscription.vue`)
- Displays current subscription status
- **Mock activate**: `POST /api/subscription/activate-mock`
- **Mock deactivate**: `POST /api/subscription/reset-mock`
- Subscription plans display (Monthly 299₽, Yearly 2990₽)

### 5. Payment History Page (`pages/profile/payment-history.vue`)
- Fetches from `GET /api/shop/payments/history` (falls back to mock data)
- Displays payment cards with date, amount, description, status
- Summary cards showing total spent and completed payments count

### 6. Variant View Page (`pages/variant/[id].vue`)
- Displays saved variant details
- Download and print functionality
- Fetches from `GET /api/variants/{id}`

## Stores (Pinia)

### `stores/user.ts`
- `fetchUser()`: Loads user from `/api/auth/me`
- `fetchQuota()`: Loads export quota from `/api/variants/export/quota`
- Computed: `subscriptionExpiryFormatted`, `hasActiveSubscription`

### `stores/variants.ts`
- `fetchSavedVariants()`: Loads from `GET /api/variants`
- `saveVariant(variant)`: Saves via `POST /api/variants`
- `deleteVariant(id)`: Deletes via `DELETE /api/variants/{id}`
- Helpers: `formatDate()`, `getVariantTitle()`

## Composables

### `composables/useVariantExport.ts`
- `downloadVariantPdf(elementId)`: Generates and downloads PDF
- `printVariant(elementId)`: Opens print dialog
- `saveVariantToProfile(variant)`: Saves to profile with auth check
- `generateShareableLink(variantId)`: Creates and copies share link
- `shareVariant(variant, variantId)`: Web Share API with clipboard fallback

## Components

### `components/profile/ProfileSidebar.vue`
- Sidebar navigation for profile pages
- Shows subscription status
- Menu items: Profile, My Variants, Subscription, Payment History

### `components/profile/VariantCard.vue`
- Card display for saved variants
- Shows title, date, author info
- Action buttons: Open, Download, Print, Delete

### `components/variant/ActionPanel.vue`
- Action buttons for constructor page
- Download, Print, Save, Share functionality
- Integrated into `variant/Footer.vue`

## API Routes Used
- `GET /api/auth/me` - User profile
- `GET /api/variants` - List saved variants
- `POST /api/variants` - Save variant
- `DELETE /api/variants/{id}` - Delete variant
- `GET /api/variants/export/quota` - Export quota info
- `POST /api/subscription/activate-mock` - Mock subscription activation
- `POST /api/subscription/reset-mock` - Mock subscription reset
- `GET /api/shop/payments/history` - Payment history

## Dependencies Added
- `jspdf` - PDF generation
- `html2canvas` - HTML to canvas conversion for PDF

## Notes
- All profile pages use `auth` middleware for protection
- Mock data is used as fallback when API endpoints are unavailable
- PDF generation happens client-side only
- Share functionality uses Web Share API on mobile with clipboard fallback
