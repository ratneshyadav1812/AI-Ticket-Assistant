# AI Ticket Assistant

An intelligent ticket management system that leverages AI to automatically analyze, categorize, and assign support tickets to appropriate moderators. Built with Node.js/Express backend, React/Vite frontend, MongoDB, and Google's Generative AI.

## Features

- **AI-Powered Ticket Analysis**: Automatically analyze incoming tickets using Google's Generative AI
- **Smart Moderator Assignment**: Intelligently assign tickets to available moderators based on ticket content and moderator expertise
- **User Authentication**: Secure user registration and login with JWT-based authentication
- **Role-Based Access**: Support for different user roles (Admin, Moderator, User)
- **Email Notifications**: Send email notifications on user signup and ticket events
- **Event-Driven Architecture**: Use Inngest for reliable event handling and asynchronous workflows
- **Real-time API**: RESTful API for ticket management and user operations
- **Responsive UI**: Modern React-based frontend with TailwindCSS styling

## Architecture

### Backend (`ai-ticket-assistant/`)

**Tech Stack:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Google Generative AI API
- Inngest for event-driven workflows
- JWT for authentication
- Bcrypt for password hashing

**Key Directories:**
- `controllers/` - Request handlers for tickets and users
- `models/` - MongoDB schemas for User and Ticket
- `routes/` - API endpoint definitions
- `middlewares/` - Auth, CSRF protection, validation
- `inngest/` - Event functions (signup, ticket creation)
- `services/` - Business logic (moderator assignment)
- `utils/` - Helper utilities (AI, email, tokens, cookies)
- `validation/` - Zod schemas for input validation
- `scripts/` - Admin creation script

### Frontend (`ai-ticket-frontend/`)

**Tech Stack:**
- React 19
- Vite for build tooling
- TailwindCSS + DaisyUI for styling
- React Router for navigation
- React Markdown for ticket display

**Key Directories:**
- `src/pages/` - Page components (login, signup, tickets, admin)
- `src/components/` - Reusable UI components
- `src/auth/` - Authentication context and hooks
- `src/assets/` - Static assets

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance (local or Atlas)
- Google Cloud account with Generative AI API enabled
- SMTP server credentials (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ratneshyadav1812/AI-Ticket-Assistant.git
   cd AI-Ticket-Assistant
   ```

2. **Setup Backend**
   ```bash
   cd ai-ticket-assistant
   npm install
   ```
   
   Create a `.env` file with the following variables:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/ai-ticket-assistant
   JWT_SECRET=your-secret-key-min-32-chars-long
   GROQ_API_KEY=your-google-generative-ai-api-key
   CLIENT_ORIGINS=http://localhost:5173
   NODE_ENV=development
   COOKIE_SAME_SITE=lax
   ```

3. **Setup Frontend**
   ```bash
   cd ../ai-ticket-frontend
   npm install
   ```
   
   Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the Backend**
   ```bash
   cd ai-ticket-assistant
   npm run dev
   ```
   
   The server will run at `http://localhost:3000`

3. **Start Inngest Dev** (in a separate terminal)
   ```bash
   cd ai-ticket-assistant
   npm run inngest-dev
   ```

4. **Start the Frontend** (in another terminal)
   ```bash
   cd ai-ticket-frontend
   npm run dev
   ```
   
   The frontend will run at `http://localhost:5173`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Tickets (`/api/tickets`)
- `GET /api/tickets` - Get all tickets (with filtering and pagination)
- `POST /api/tickets` - Create a new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket status or details
- `DELETE /api/tickets/:id` - Delete a ticket

### Health Check
- `GET /api/health` - Server health check

## User Roles

- **Admin**: Full system access, can manage moderators and view all tickets
- **Moderator**: Can view and manage assigned tickets
- **User**: Can create and view their own tickets

## Event Workflows

### User Signup
When a new user signs up, the `onUserSignup` Inngest function:
- Sends a welcome email to the user
- Logs signup event
- Initializes user settings

### Ticket Creation
When a ticket is created, the `onTicketCreated` Inngest function:
- Analyzes ticket content using Google Generative AI
- Determines ticket category and priority
- Assigns ticket to appropriate moderator using smart assignment logic
- Sends notification to assigned moderator

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run inngest-dev` - Start Inngest dev server for local event testing
- `npm run seed:admin` - Create an admin user in the database
- `npm run check` - Syntax check the JavaScript files

## Project Structure

```
AI-Ticket-Assistant/
├── ai-ticket-assistant/          # Backend (Node.js/Express)
│   ├── controllers/              # Request handlers
│   ├── models/                   # MongoDB schemas
│   ├── routes/                   # API routes
│   ├── middlewares/              # Auth, validation, etc.
│   ├── inngest/                  # Event functions
│   ├── services/                 # Business logic
│   ├── utils/                    # Helper utilities
│   ├── validation/               # Input schemas
│   ├── scripts/                  # Admin setup
│   └── index.js                  # Main server file
│
└── ai-ticket-frontend/           # Frontend (React/Vite)
    ├── src/
    │   ├── pages/                # Page components
    │   ├── components/           # Reusable components
    │   ├── auth/                 # Auth context
    │   └── assets/               # Static files
    ├── vite.config.js            # Vite configuration
    └── index.html                # HTML entry point
```

## Configuration

### Environment Variables

**Backend (.env)**
- `PORT` - Server port (default: 3000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `GROQ_API_KEY` - Google Generative AI API key
- `CLIENT_ORIGINS` - Allowed frontend origins (comma-separated)
- `NODE_ENV` - Environment (development/production/test)
- `COOKIE_SAME_SITE` - Cookie SameSite attribute (strict/lax/none)

**Frontend (.env)**
- `VITE_API_URL` - Backend API URL

## Dependencies

### Backend Key Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `@google/generative-ai` - AI integration
- `inngest` - Event handling
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `nodemailer` - Email notifications
- `zod` - Schema validation

### Frontend Key Dependencies
- `react` - UI library
- `react-router-dom` - Routing
- `tailwindcss` - CSS framework
- `daisyui` - Component library
- `react-markdown` - Markdown rendering
- `vite` - Build tool

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

---

**Created by:** [ratneshyadav1812](https://github.com/ratneshyadav1812)  
**Repository:** [AI-Ticket-Assistant](https://github.com/ratneshyadav1812/AI-Ticket-Assistant)
