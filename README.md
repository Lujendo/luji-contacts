# Luji Contacts - Cloudflare Workers Contact Management System

A modern, cloud-based contact management system built with **Vite + React + Hono + Cloudflare Workers**, featuring **D1 Database** and **R2 Storage**.

## 🚀 Live Application

**Production URL**: [https://luji-contacts.info-eac.workers.dev](https://luji-contacts.info-eac.workers.dev)

## 📋 Migration Summary

This application was successfully migrated from a traditional **Express.js + React** setup to a modern **Cloudflare Workers** environment:

### Source Application (contacts1)
- **Backend**: Express.js with Sequelize ORM
- **Database**: MySQL/MariaDB
- **Frontend**: React with Create React App
- **File Storage**: Local file system with multer
- **Authentication**: JWT with bcrypt

### Target Application (luji-contacts)
- **Backend**: Hono framework on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-based)
- **Frontend**: React with Vite
- **File Storage**: Cloudflare R2
- **Authentication**: JWT with bcryptjs
- **Styling**: Tailwind CSS v3

## 🏗️ Architecture

### Backend (Cloudflare Workers + Hono)
- **API Routes**: RESTful API with proper authentication
- **Database**: Cloudflare D1 with custom SQL queries
- **File Storage**: Cloudflare R2 for profile images and exports
- **Authentication**: JWT-based with middleware protection

## Getting Started

To start a new project with this template, run:

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/vite-react-template
```

A live deployment of this template is available at:
[https://react-vite-template.templates.workers.dev](https://react-vite-template.templates.workers.dev)

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npm run build && npm run deploy
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
