# 🔥 Create-node-advance-app

> **Production-ready Node.js backend generator with TypeScript support**

Generate a fully configured Express.js backend in seconds with database, authentication, validation, and Docker support.

[![npm version](https://badge.fury.io/js/create-node-advance-app.svg)](https://www.npmjs.com/package/create-node-advance-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [What Gets Generated](#-what-gets-generated)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### **🎯 Core Features**
- 📦 **Zero Configuration** - Works out of the box
- 🎨 **TypeScript & JavaScript** - Choose your preferred language
- 🗄️ **Multiple Databases** - MongoDB, PostgreSQL, MySQL support
- 🔐 **JWT Authentication** - Ready-to-use auth system
- ✅ **Request Validation** - Zod or Joi validation
- 📝 **Winston/Pino Logging** - Production-grade logging
- 🐳 **Docker Ready** - Docker and docker-compose included
- 🛡️ **Security** - Helmet, CORS pre-configured
- 🎯 **Best Practices** - Clean architecture, separation of concerns
- 📚 **Comprehensive Docs** - In-folder documentation for every component

### **🏗️ Architecture**
- **MVC Pattern** - Organized folder structure
- **Service Layer** - Business logic separation
- **Error Handling** - Centralized error management
- **Response Utilities** - Consistent API responses
- **Environment Config** - Type-safe environment variables
- **Migration Support** - Database migration setup (Sequelize)

### **📖 Developer Experience**
- **Interactive CLI** - Beautiful prompts and clear output
- **Info Files** - Helpful guides in every folder
- **Code Examples** - Real-world usage patterns
- **Clean Logs** - Emoji-based, readable console output
- **Fast Setup** - From zero to running API in under 2 minutes

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g create-node-advance-app

# Create a new project
create-node-advance-app my-api

# Follow the interactive prompts
# cd into your project
cd my-api

# Install dependencies
npm install

# Start development server
npm run dev
```

**That's it!** Your API is now running on `http://localhost:5000` 🎉

---

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g create-node-advance-app
```

### Using npx (No Installation)
```bash
npx create-node-advance-app my-api
```

### Requirements
- **Node.js** >= 14.0.0
- **npm** or **yarn**

---

## 💻 Usage

### Basic Usage
```bash
# Generate project with default name
create-node-advance-app

# Generate project with custom name
create-node-advance-app my-awesome-api

# The CLI will ask you:
# - Language: TypeScript or JavaScript
# - Database: MongoDB, PostgreSQL, MySQL, or None
# - Authentication: JWT or None
# - Validation: Zod, Joi, or None
# - Logger: Winston, Pino, or None
# - Error Handling: Yes or No
# - Docker: Yes or No
```

### Interactive Prompts

<details>
<summary>📸 See example prompts</summary>

```
🔥 Create-node-advance-app

? Select language: TypeScript
? Select database: PostgreSQL (Sequelize)
? Setup JWT authentication? Yes
? Select validation library: Zod (recommended for TypeScript)
? Select logger: Winston
? Include AppError and response utilities? Yes
? Include Docker support? Yes

📋 Configuration Summary:
──────────────────────────────────────────────────
Project: my-api
Language: TypeScript
Database: PostgreSQL (Sequelize)
Auth: JWT ✓
Validation: Zod
Logger: Winston
Error Utils: ✓
Docker: ✓
──────────────────────────────────────────────────

? Proceed with this configuration? Yes
```

</details>

---

## 📁 Project Structure

```
my-api/
├── src/
│   ├── config/              # Configuration files
│   │   ├── env.ts          # Environment variables (type-safe)
│   │   ├── database.ts     # Database connection
│   │   └── logger.ts       # Logging configuration
│   │
│   ├── routes/             # API routes
│   │   └── info.ts         # 📚 How to create routes
│   │
│   ├── controllers/        # Request handlers
│   │   └── info.ts         # 📚 How to create controllers
│   │
│   ├── services/           # Business logic
│   │   └── info.ts         # 📚 How to create services
│   │
│   ├── models/             # Database models
│   │   └── info.ts         # 📚 How to create models
│   │
│   ├── validators/         # Request validation schemas
│   │   └── info.ts         # 📚 How to create validators
│   │
│   ├── middlewares/        # Custom middleware
│   │   └── info.ts         # 📚 How to create middleware
│   │
│   ├── utils/              # Utility functions
│   │   ├── AppError.ts     # Custom error class
│   │   └── response.ts     # Response helpers
│   │
│   ├── types/              # TypeScript types (TS only)
│   │   └── index.ts        # Shared type definitions
│   │
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
│
├── .env                    # Environment variables
├── .env.example            # Environment template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config (TS only)
├── Dockerfile             # Docker image (optional)
└── docker-compose.yml     # Docker services (optional)
```

### 📚 Info Files

Every folder includes an `info.ts/js` file with:
- ✅ **Purpose** - What the folder is for
- ✅ **Examples** - Complete code examples
- ✅ **Best Practices** - How to structure your code
- ✅ **Common Patterns** - Real-world use cases

---

## ⚙️ Configuration Options

### Language Options
| Option | Description |
|--------|-------------|
| **TypeScript** | Fully typed, recommended for large projects |
| **JavaScript** | Simpler, faster to write |

### Database Options
| Option | Description | ORM |
|--------|-------------|-----|
| **MongoDB** | NoSQL document database | Mongoose |
| **PostgreSQL** | Advanced relational database | Sequelize |
| **MySQL** | Popular relational database | Sequelize |
| **None** | No database setup | - |

### Authentication
- **JWT** - JSON Web Token authentication with bcrypt password hashing
- **None** - No auth setup

### Validation Libraries
| Option | Description | Best For |
|--------|-------------|----------|
| **Zod** | TypeScript-first, type inference | TypeScript projects |
| **Joi** | Mature, feature-rich | JavaScript projects |
| **None** | No validation | Simple APIs |

### Logger Options
| Option | Description |
|--------|-------------|
| **Winston** | Flexible, widely used |
| **Pino** | High performance, JSON logging |
| **None** | Console.log only |

### Additional Features
- **Error Handling** - AppError class and response utilities
- **Docker** - Dockerfile and docker-compose.yml

---

## 📦 What Gets Generated

### Dependencies Installed

**Base Dependencies:**
```json
{
  "express": "^4.18.2",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "helmet": "^7.1.0"
}
```

**Database-Specific:**
- **MongoDB:** `mongoose`
- **PostgreSQL:** `sequelize`, `pg`, `pg-hstore`, `sequelize-cli`
- **MySQL:** `sequelize`, `mysql2`, `sequelize-cli`

**Auth-Specific:**
- `jsonwebtoken`, `bcryptjs`

**Validation-Specific:**
- **Zod:** `zod`
- **Joi:** `joi`

**Logger-Specific:**
- **Winston:** `winston`
- **Pino:** `pino`, `pino-pretty`

### NPM Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",  // Development
    "start": "node dist/server.js",                 // Production
    "build": "tsc",                                 // Build (TS only)
    "db:migrate": "npx sequelize-cli db:migrate",   // Run migrations
    "db:migrate:undo": "npx sequelize-cli db:migrate:undo",
    "db:seed": "npx sequelize-cli db:seed:all"
  }
}
```

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database (PostgreSQL example)
DATABASE_URL=postgresql://postgres:root@localhost:5432/my-back
DB_HOST=localhost
DB_PORT=5432
DB_NAME=my-back
DB_USER=postgres
DB_PASSWORD=root

# JWT (if auth enabled)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🎯 Best Practices Included

### ✅ Security
- Helmet.js for HTTP headers
- CORS configuration
- Environment variables
- Password hashing (bcrypt)
- JWT token authentication

### ✅ Code Organization
- Separation of concerns (MVC pattern)
- Service layer for business logic
- Centralized error handling
- Type-safe environment config
- Consistent response format

### ✅ Developer Experience
- Hot reload with nodemon
- TypeScript type safety
- Comprehensive logging
- Clear error messages
- In-folder documentation

### ✅ Production Ready
- Docker support
- Environment-based config
- Database migrations
- Graceful shutdown
- Error stack traces (dev only)

---

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3000
```

### Database Connection Failed
```bash
# PostgreSQL
# Make sure PostgreSQL is running
brew services start postgresql  # macOS
sudo service postgresql start   # Linux

# MongoDB
brew services start mongodb-community  # macOS
sudo service mongod start              # Linux
```

### TypeScript Errors
```bash
# Rebuild TypeScript
npm run build

# Check tsconfig.json
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Setup
```bash
# Clone the repo
git clone https://github.com/yourusername/Create-node-advance-app.git

# Install dependencies
cd Create-node-advance-app
npm install

# Link for local testing
npm link

# Test the CLI
Create-node-advance-app test-project
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Star History

If you find this project helpful, please consider giving it a star! ⭐

---

## 💬 Support

- 📫 **Issues**: [GitHub Issues](https://github.com/ashishpathak2/create-node-advance-app/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/ashishpathak2/create-node-advance-app)
- 📧 **Email**: pathak1420@gmail.com

---

## 🙏 Acknowledgments

- Built with [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for interactive CLI
- Styled with [Chalk](https://github.com/chalk/chalk) for beautiful terminal output
- Inspired by popular backend generators and best practices

---

## 📊 Stats

![npm](https://img.shields.io/npm/dm/Create-node-advance-app)
---

<div align="center">

**Made with ❤️ by [Ashish](https://github.com/ashishpathak2)**

</div>
