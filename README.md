# Luji Contacts - Professional Contact Management System

A modern, feature-rich contact management system built with **React + TypeScript + Cloudflare Workers**, featuring advanced contact organization, group management, and rich text editing capabilities.

## 🚀 Live Application

**Production URL**: [https://luji-contacts.info-eac.workers.dev](https://luji-contacts.info-eac.workers.dev)

## ✨ Key Features

### 👥 Advanced Contact Management
- **Complete Contact Profiles**: Name, email, phone, address, social media, and notes
- **Profile Images**: Upload and manage contact photos with automatic compression
- **Rich Text Notes**: Advanced text editor with formatting, colors, lists, and links
- **Contact Search**: Real-time search across all contact fields
- **Bulk Operations**: Select and delete multiple contacts efficiently
- **Contact Export**: Export contacts to various formats

### 📋 Intelligent Group Management
- **Dynamic Groups**: Create and manage contact groups with descriptions
- **Smart Interaction**: Single-click to filter contacts, double-click to manage groups
- **Group Side Panel**: Sliding panel interface for seamless group management
- **Contact Assignment**: Add and remove contacts from groups with bulk operations
- **Group Filtering**: View contacts by group with real-time filtering

### 🎨 Modern User Interface
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Professional Styling**: Clean, modern interface with Tailwind CSS
- **Smooth Animations**: Professional transitions and hover effects
- **Dark/Light Mode**: Automatic theme detection and switching
- **Mobile-First**: Optimized mobile experience with touch-friendly controls

### 🔧 Technical Excellence
- **Cloud-Native**: Built on Cloudflare Workers for global performance
- **Real-Time**: Instant updates and synchronization across devices
- **Secure**: JWT authentication with bcrypt password hashing
- **Scalable**: D1 database with optimized queries and pagination
- **Fast**: Vite build system with code splitting and optimization

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and enhanced developer experience
- **Vite**: Lightning-fast build system with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide Icons**: Beautiful, consistent icon system
- **ReactQuill**: Advanced rich text editor for notes

### Backend (Cloudflare Workers + Hono)
- **Hono Framework**: Fast, lightweight web framework for Workers
- **RESTful API**: Clean, well-structured API endpoints
- **JWT Authentication**: Secure token-based authentication
- **Middleware**: Request validation, authentication, and error handling
- **File Upload**: Profile image handling with compression and optimization

### Database & Storage
- **Cloudflare D1**: SQLite-based database with global replication
- **Cloudflare R2**: Object storage for profile images and file exports
- **Optimized Queries**: Efficient SQL with proper indexing and pagination
- **Data Validation**: Server-side validation for all operations

## 🚀 Recent Enhancements

### Contact Management Improvements
- **Persistent Contact Names**: Contact names always visible across all edit tabs
- **Enhanced Rich Text Editor**: Complete formatting toolbar with headers, colors, lists, links, and code blocks
- **Professional Modal Sizing**: Properly sized modals for all forms and interfaces

### Group Management Features
- **Group Side Panel**: Beautiful sliding panel interface replacing traditional modals
- **Direct Group Interaction**: Single-click filtering and double-click management
- **Add New Group**: Prominent button in group panel for easy group creation
- **Complete API Integration**: Full CRUD operations for group contact management

### User Experience Enhancements
- **Smooth Animations**: Professional transitions and hover effects throughout
- **Error Handling**: Graceful error handling with user-friendly messages
- **Mobile Optimization**: Touch-friendly interface with responsive design
- **Performance**: Optimized loading and pagination for large contact lists

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account with Workers and D1 access

### Local Development

1. **Clone and Install**:
```bash
git clone https://github.com/Lujendo/luji-contacts.git
cd luji-contacts
npm install
```

2. **Environment Setup**:
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
# JWT_SECRET, DATABASE_URL, etc.
```

3. **Database Setup**:
```bash
# Create D1 database
wrangler d1 create luji-contacts-db

# Run migrations
wrangler d1 migrations apply luji-contacts-db
```

4. **Start Development Server**:
```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

### Building and Deployment

1. **Build for Production**:
```bash
npm run build
```

2. **Preview Build Locally**:
```bash
npm run preview
```

3. **Deploy to Cloudflare Workers**:
```bash
npm run deploy
```

## 📱 Usage Guide

### Contact Management
1. **Add Contacts**: Click "Add Contact" to create new contacts with full profile information
2. **Edit Contacts**: Click any contact to view/edit with persistent name display across tabs
3. **Rich Text Notes**: Use the advanced editor in the Notes tab for formatted content
4. **Profile Images**: Upload and manage contact photos with automatic optimization

### Group Management
1. **View Groups**: Click the groups icon to open the sliding group panel
2. **Filter by Group**: Single-click any group to filter contacts
3. **Manage Groups**: Double-click any group to add/remove contacts
4. **Create Groups**: Use the "Add New Group" button in the group panel

### Advanced Features
- **Search**: Use the search bar for real-time contact filtering
- **Bulk Operations**: Select multiple contacts for batch operations
- **Export**: Export contact data in various formats
- **Mobile**: Full functionality available on mobile devices

## 🔧 Technical Stack

### Frontend Technologies
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **ReactQuill** for rich text editing
- **Lucide React** for consistent iconography
- **Axios** for API communication

### Backend Technologies
- **Cloudflare Workers** for serverless compute
- **Hono** framework for fast API development
- **Cloudflare D1** for global SQLite database
- **Cloudflare R2** for object storage
- **JWT** for secure authentication

### Development Tools
- **TypeScript** for enhanced developer experience
- **ESLint** and **Prettier** for code quality
- **Wrangler** for Cloudflare Workers deployment
- **Git** for version control

## 📊 Performance

- **Global CDN**: Deployed on Cloudflare's global network
- **Fast Loading**: Optimized bundles with code splitting
- **Responsive**: Works smoothly on all device sizes
- **Scalable**: Handles large contact databases efficiently
- **Reliable**: Built-in error handling and recovery

## 🔗 Links

- **Live Application**: [https://luji-contacts.info-eac.workers.dev](https://luji-contacts.info-eac.workers.dev)
- **GitHub Repository**: [https://github.com/Lujendo/luji-contacts](https://github.com/Lujendo/luji-contacts)
- **Cloudflare Workers**: [https://developers.cloudflare.com/workers/](https://developers.cloudflare.com/workers/)
- **React Documentation**: [https://react.dev/](https://react.dev/)
- **Hono Framework**: [https://hono.dev/](https://hono.dev/)
