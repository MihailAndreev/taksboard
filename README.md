# TaskBoard - Multi-page SPA with Vite

A modern, client-side single-page application built with Vite featuring custom routing, component-based architecture, and clean separation of concerns.

## Project Structure

```
taskboard/
├── index.html              # Main entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── .gitignore              # Git ignore rules
├── src/
│   ├── main.js             # Application bootstrap and routing setup
│   ├── router.js           # Custom client-side router
│   ├── components/         # Reusable components
│   │   ├── header/
│   │   │   ├── header.js   # Header component logic
│   │   │   └── header.css  # Header styles
│   │   └── footer/
│   │       ├── footer.js   # Footer component logic
│   │       └── footer.css  # Footer styles
│   ├── pages/              # Page components
│   │   ├── index/
│   │   │   ├── index.js    # Home page (/)
│   │   │   └── index.css   # Home page styles
│   │   └── dashboard/
│   │       ├── dashboard.js # Dashboard page (/dashboard)
│   │       └── dashboard.css # Dashboard styles
│   └── styles/
│       └── global.css       # Global styles and resets
└── dist/                   # Build output (generated)
```

## Routing

The app uses a custom client-side router with support for parameterized routes.

### Available Routes

- `GET /` - Home page (Index)
- `GET /dashboard` - Dashboard page
- `GET /login` - Login page (placeholder)
- `GET /register` - Register page (placeholder)
- `GET /projects` - Projects page (placeholder)
- `GET /projects/:id/tasks` - Tasks for specific project (placeholder)

### Dynamic Navigation

Use `data-link` attribute on links:

```html
<a href="/dashboard" data-link="/dashboard">Go to Dashboard</a>
```

Or use the router programmatically:

```javascript
window.appRouter.go('/dashboard');
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Architecture

### Router

The custom `Router` class handles:
- Route definition and matching
- Parameter extraction from routes (e.g., `:id`)
- Dynamic content loading
- History management
- Browser back/forward button support

### Components

- **Header**: Navigation bar with links to main pages
- **Footer**: Footer with links and contact information

### Pages

Each page is a module that exports a function returning HTML content:

```javascript
export async function renderPageName() {
  return `<div>Page content</div>`;
}
```

## Features

- ✅ Client-side routing without external libraries
- ✅ Component-based architecture
- ✅ Dynamic route parameters
- ✅ History API integration
- ✅ Responsive design
- ✅ CSS animations
- ✅ Modern ES modules
- ✅ Vite for fast development

## Browser Support

Works in all modern browsers supporting ES modules and History API (ES6+).

## Future Enhancements

- Add actual content to placeholder pages
- Implement form handling
- Add state management
- Database integration
- Authentication system
