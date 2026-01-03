# Rafah Admin Dashboard

A modern, responsive admin dashboard built with React, Material-UI, and Appwrite. Features comprehensive internationalization (i18n) support with seamless Arabic (RTL) and English (LTR) language switching.

## 🌟 Features

### Core Features

- **Modern React Architecture**: Built with React 18, Vite, and modern hooks
- **Material-UI Design System**: Consistent, accessible, and beautiful UI components
- **Appwrite Backend Integration**: Real-time data management and authentication
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark/Light Theme Support**: User preference-based theme switching

### 🌍 Enhanced Internationalization (i18n)

- **Seamless Language Switching**: Smooth transitions between Arabic and English
- **Complete RTL Support**: Proper right-to-left layout for Arabic
- **Typography Optimization**: Arabic font support with proper font stacks
- **Component-Level RTL**: All Material-UI components properly configured for RTL
- **Transition Effects**: Smooth animations during language changes
- **Performance Optimized**: Memoized translations and efficient re-renders

### 🎨 Enhanced Layout Features

- **Responsive Sidebar**: Auto-collapse on mobile with smooth animations
- **Enhanced AppBar**: Improved spacing and RTL-aware positioning
- **Mobile Overlay**: Touch-friendly mobile navigation
- **Smooth Transitions**: Enhanced animations for better UX
- **Loading States**: Visual feedback during language transitions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Appwrite server instance

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sukna-admin-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Appwrite**

   - Copy `.env.example` to `.env`
   - Update Appwrite configuration in `src/config/appwrite.js`

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Internationalization Guide

### Language Support

- **English (en)**: Left-to-right (LTR) layout
- **Arabic (ar)**: Right-to-left (RTL) layout with Arabic typography

### Adding New Languages

1. **Create translation file**

   ```javascript
   // src/locales/fr.js
   const frTranslations = {
     app: {
       name: "Sukna",
       title: "Tableau de bord Sukna",
       // ... more translations
     },
   };
   export default frTranslations;
   ```

2. **Update LanguageContext**
   ```javascript
   // src/contexts/LanguageContext.jsx
   const SUPPORTED_LANGUAGES = {
     en: { name: "English", dir: "ltr", translations: enTranslations },
     ar: { name: "العربية", dir: "rtl", translations: arTranslations },
     fr: { name: "Français", dir: "ltr", translations: frTranslations }, // Add new language
   };
   ```

### Using Translations

```javascript
import { useLanguage } from "../contexts/LanguageContext";

const MyComponent = () => {
  const { t, isRTL } = useLanguage();

  return (
    <Box sx={{ direction: isRTL ? "rtl" : "ltr" }}>
      <Typography>{t("common.welcome")}</Typography>
      <Typography>{t("user.greeting", { name: "John" })}</Typography>
    </Box>
  );
};
```

## 🎨 RTL Styling Guide

### CSS Classes

The application includes comprehensive RTL support through CSS classes:

```css
/* Automatic RTL support */
html[dir="rtl"] .text-left {
  text-align: right;
}
html[dir="rtl"] .margin-left {
  margin-right: auto;
  margin-left: 0;
}

/* Utility classes */
.flex-start {
  /* Automatically flips in RTL */
}
.rtl-flip-icon {
  /* Flips icons in RTL */
}
```

### Component Styling

```javascript
// RTL-aware styling
const StyledComponent = styled(Box)(({ theme, isRTL }) => ({
  textAlign: isRTL ? "right" : "left",
  marginLeft: isRTL ? 0 : theme.spacing(2),
  marginRight: isRTL ? theme.spacing(2) : 0,
}));
```

## 🏗️ Architecture

### Context Providers

```
App
├── LanguageProvider (i18n support)
├── ThemeProvider (theme + RTL)
├── AuthProvider (authentication)
└── AppWriteProvider (backend)
```

### Key Components

- **LanguageMenu**: Multi-variant language switcher with loading states
- **DashboardLayout**: Responsive layout with RTL support
- **ThemeContext**: Enhanced theme with RTL typography
- **Navigation**: RTL-aware sidebar and breadcrumbs

## 🔧 Configuration

### Theme Customization

```javascript
// src/theme.js
const createCustomTheme = (mode) => ({
  typography: {
    fontFamily: isRTL
      ? '"Noto Sans Arabic", "Tajawal", "Cairo"...'
      : '"Inter", "Roboto"...',
  },
  // RTL-specific component overrides
});
```

### Language Configuration

```javascript
// src/contexts/LanguageContext.jsx
const SUPPORTED_LANGUAGES = {
  en: { name: "English", dir: "ltr" },
  ar: { name: "العربية", dir: "rtl" },
};
```

## 📱 Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: Material-UI standard breakpoints
- **Touch-friendly**: Large touch targets and gestures
- **Adaptive Layout**: Sidebar auto-collapse on mobile

## 🎯 Performance Optimizations

- **Memoized Translations**: Efficient translation caching
- **Lazy Loading**: Code splitting for better performance
- **Optimized Re-renders**: Context optimization to prevent unnecessary renders
- **Smooth Transitions**: Hardware-accelerated animations

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📦 Build & Deployment

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the code examples

---

**Built with ❤️ for the Sukna platform**

## Features

- User management (students, staff, admins)
- Room and contract management
- Payment tracking and processing
- Service and order management
- Activity scheduling and registration
- Checkout request handling
- Advanced analytics and reporting
- Multilingual support (English/Arabic)

## Tech Stack

- React.js with Vite
- Material UI for component library
- Appwrite for backend services
- Chart.js for data visualization
- React Hook Form for form handling
- ExcelJS for report exports

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- NPM 8.x or higher
- Appwrite instance with proper collections set up

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/sukna-admin-dashboard.git
   cd sukna-admin-dashboard
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the project root and add your Appwrite configuration:

   ```
   VITE_APPWRITE_ENDPOINT=https://your-appwrite-endpoint.com/v1
   VITE_APPWRITE_PROJECT_ID=your-project-id
   VITE_APPWRITE_DATABASE_ID=your-database-id
   VITE_APPWRITE_USERS_COLLECTION_ID=your-users-collection-id
   VITE_APPWRITE_ROOMS_COLLECTION_ID=your-rooms-collection-id
   VITE_APPWRITE_CONTRACTS_COLLECTION_ID=your-contracts-collection-id
   VITE_APPWRITE_PAYMENTS_COLLECTION_ID=your-payments-collection-id
   VITE_APPWRITE_SERVICES_COLLECTION_ID=your-services-collection-id
   VITE_APPWRITE_ORDERS_COLLECTION_ID=your-orders-collection-id
   VITE_APPWRITE_ACTIVITIES_COLLECTION_ID=your-activities-collection-id
   VITE_APPWRITE_ACTIVITY_REGISTRATIONS_COLLECTION_ID=your-activity-registrations-collection-id
   VITE_APPWRITE_CHECKOUT_REQUESTS_COLLECTION_ID=your-checkout-requests-collection-id
   VITE_APPWRITE_FOOD_MENU_COLLECTION_ID=your-food-menu-collection-id
   VITE_APPWRITE_FOOD_ORDERS_COLLECTION_ID=your-food-orders-collection-id
   VITE_APPWRITE_FOOD_ORDER_ITEMS_COLLECTION_ID=your-food-order-items-collection-id
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Project Structure

```
sukna-admin-dashboard/
│
├── public/                   # Static assets
│   ├── favicon.ico
│   └── assets/
│       ├── logo/
│       └── images/
│
├── src/
│   ├── App.jsx              # Main application component with routing
│   ├── main.jsx             # Entry point
│   ├── theme.js             # Material UI theme configuration
│   │
│   ├── assets/              # Static assets
│   │   ├── images/
│   │   └── styles/
│   │       └── global.css
│   │
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Common components
│   │   ├── dashboard/       # Dashboard specific components
│   │   ├── forms/           # Form components
│   │   └── navigation/      # Navigation components
│   │
│   ├── contexts/            # React context providers
│   │   ├── AppWriteContext.js
│   │   ├── AuthContext.js
│   │   ├── LanguageContext.js
│   │   ├── NotificationContext.js
│   │   └── ThemeContext.js
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useDebounce.js
│   │   ├── useFetch.js
│   │   ├── usePagination.js
│   │   └── useSort.js
│   │
│   ├── layouts/             # Page layouts
│   │   ├── DashboardLayout.js
│   │   ├── FullscreenLayout.js
│   │   └── PrintLayout.js
│   │
│   ├── locales/             # Localization files
│   │   ├── ar.js            # Arabic translations
│   │   └── en.js            # English translations
│   │
│   ├── pages/               # Main application pages
│   │   ├── Dashboard.js
│   │   ├── Login.js
│   │   └── [other pages]
│   │
│   ├── services/            # API services
│   │   ├── appwriteService.js
│   │   └── [other services]
│   │
│   └── utils/               # Utility functions
│       ├── dateUtils.js
│       └── [other utilities]
│
├── .env                     # Environment variables
├── .eslintrc.cjs            # ESLint configuration
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

## Development

### Running in Development Mode

```
npm run dev
```

### Building for Production

```
npm run build
```

### Running Linter

```
npm run lint
```

## Multilingual Support

The application supports both English and Arabic languages. To add or modify translations:

1. Edit the translation files in `src/locales/`
2. Use the `useLanguage` hook in your components:

```jsx
import { useLanguage } from "../contexts/LanguageContext";

function MyComponent() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
    </div>
  );
}
```

## Image Storage Setup

For activities that include images, you need to set up an Appwrite storage bucket:

1. In your Appwrite console, go to Storage and create a new bucket with the ID `activity-images`
2. Set the following permissions:
   - Allow file create, read, update, delete
   - Set maximum file size to 100MB
   - Allow file types: image/jpeg, image/png, image/gif, image/webp

Alternatively, you can use the provided script to create the bucket automatically:

```bash
# Set your Appwrite API key first
export APPWRITE_API_KEY=your-api-key

# Then run the script
node create-storage-bucket.js
```

## License

[MIT](LICENSE)

users 68249b10003c16083520

rooms 68249cb00025da201b9d

contracts 68249e34003899ffa4a3

payments 683f10a3002fcff81e8a

services 682a0ec9001ac190ae4f

activities 68272809001203a3f60e

activityRegistrations 68272bc9003898ae7976

checkoutRequests 68272c59001081a0f67c

serviceOrders 6829f67b0021379e8dd5

foodMenu 68373009002a61f5cf07

foodOrders 6837318d0033889a6907

foodOrderItems 683732e800333949b399

update the db and add the messing collections to the db and change the existing collections as this db discripe "## Database Structure

### Collections

#### 1. Users

Stores user account information.

```
users {
  id: string (auto-generated)
  name: string
  email: string
  phone: string
  idNumber: string
  emergencyContactPhone : string
  emergencyContactName : string
   status : string (active, suspended)
  role: string (student, admin, staff)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 2. Rooms

Stores information about available rooms.

```
rooms {
  id: string
  roomNumber: string
  type: string (single, double, suite)
  capacity: number
  rentAmount: number
  status: string (available, occupied, maintenance)
  building: string
  floor: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 3. Contracts

Stores housing contracts between students and the facility.

```
contracts {
  id: string
  userId: string (reference to users)
  studentName: string
  contractId: string
  roomIds: array<string> (references to rooms)
  roomNumbers: array<string>
  startDate: timestamp
  endDate: timestamp
  status: string (active, expired, terminated)
  releaseClause: string
  isDiscounted: boolean
  discountedAmount: number
  discountPeriod: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 4. Payments

Tracks rent payments and due amounts.

```
payments {
  id: string (auto-generated)
  paymentId: string // Generated ID like "PAY20240115001"
  userId: string (reference to users)
  paymentType: string // "service", "contract", "food"

  // References (one of these will be populated based on paymentType)
  serviceOrderId: string (optional - reference to serviceOrders)
  contractId: string (optional - reference to contracts)
  foodOrderId: string (optional - reference to foodOrders)

  // Common payment fields
  amount: number
  status: string // "pending", "paid", "failed", "refunded", "partial"
  paymentMethod: string // "cash", "card", "bank_transfer", "online"

  // Timestamps
  dueDate: timestamp
  paidDate: timestamp (optional)
  createdAt: timestamp
  updatedAt: timestamp

  // Additional details
  description: string // Description of what's being paid for
  invoiceNumber: string (optional)
  transactionId: string (optional) // For online payments
  notes: string (optional)

  // For installments/recurring payments
  isRecurring: boolean
  installmentNumber: number (optional) // 1 of 12, 2 of 12, etc.
  totalInstallments: number (optional)

  // Financial tracking
  taxAmount: number (optional)
  discountAmount: number (optional)
  finalAmount: number // amount - discountAmount + taxAmount
}
```

#### 5. Services

Contains services available for ordering (food, cleaning, etc.).

```
services {
  id: string
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  type: string (food, cleaning, maintenance)
  category: number
  price: number
  duration: number
  imageUrl: string
  providerContact: string
  providerName: string
  isAvailable: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 6. ServiceOrders

Tracks service orders by students.

```
serviceOrders {
  id: string
  serviceOrderId: string // Generated ID like "ORD20240115001"
  userId: string (reference to users)
  serviceId: string (reference to services)
  serviceName: string // Denormalized for faster queries
  quantity: number
  pricePerUnit: number
  totalAmount: number
  status: string (pending, processing, completed, cancelled)
  roomNumber: string
  roomId: string
  specialInstructions: string // Optional
  orderTime: timestamp
  completionTime: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 7. FoodMenu

Contains food menu items available for ordering.

```
foodMenu {
  id: string (auto-generated)
  itemId: string // Generated ID like "ITEM001"
  itemName: string
  itemDescription: string
  category: string (appetizers, mainCourse, desserts, beverages, snacks)
  price: number
  imageUrl: string // Optional
  isAvailable: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 8. FoodOrders

Tracks food orders placed by students.

```
foodOrders {
  id: string (auto-generated)
  orderId: string // Generated ID like "FO20240115001"
  userId: string (reference to users)
  roomId: string (reference to rooms) // Room document reference
  roomNumber: string // Denormalized for faster queries
  totalAmount: number
  status: string (pending, preparing, ready, delivered, cancelled)
  deliveryNotes: string // Special delivery instructions
  paymentStatus: string (pending, paid)
  orderTime: timestamp
  estimatedDeliveryTime: timestamp
  actualDeliveryTime: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 9. FoodOrderItems

Tracks individual items within each food order.

```
foodOrderItems {
  id: string (auto-generated)
  orderId: string (reference to foodOrders)
  itemId: string (reference to foodMenu)
  itemName: string // Denormalized for faster queries
  quantity: number
  pricePerItem: number
  totalPrice: number // quantity * pricePerItem
  specialInstructions: string // Item-specific notes
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 10. Activities

Records upcoming trips and activities.

```
activities {
  id: string
  title: string
  description: string
  type: string (trip, event, workshop)
  location: string
  imageUrl: string
  maxParticipants: number
  startDate: timestamp
  endDate: timestamp
  registrationDeadline: timestamp
  supervisor: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 11. Activity Registrations

Tracks student registrations for activities.

```
activityRegistrations {
  id: string
  activityId: string (reference to activities)
  userId: string (reference to users)
  registrationDate: timestamp
  status: string (confirmed, cancelled)
  note: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 12. Checkout Requests

Manages temporary checkout requests.

```
checkoutRequests {
  id: string
  requestId: string
  userId: string (reference to users)
  startDate: timestamp
  endDate: timestamp
  reason: string
  accompaniedBy: string
  status: string (pending, approved, rejected, completed)
  actionNotes: string
  actionBy: string
  actionAt:timestamp
  createdAt: timestamp
  updatedAt: timestamp

}

```

## Relationships

1. **User to Contracts**: One-to-many (one user can have multiple contracts)
2. **Contracts to Rooms**: Many-to-many (contracts list rooms assigned)
3. **User to Payments**: One-to-many (user can have multiple payments)
4. **Contracts to Payments**: One-to-many (a contract can have multiple payments)
5. **User to Orders**: One-to-many (user can place multiple orders)
6. **Services to Orders**: Many-to-many (orders can include multiple services)
7. **User to Activity Registrations**: One-to-many (user can register for multiple activities)
8. **Activities to Activity Registrations**: One-to-many (an activity can have multiple registrations)
9. **User to Food Orders**: One-to-many (user can place multiple food orders)
10. **Food Orders to Food Order Items**: One-to-many (a food order can have multiple items)
11. **Food Menu to Food Order Items**: One-to-many (a menu item can be in multiple orders)
12. **Rooms to Food Orders**: One-to-many (a room can have multiple food orders)
    "
