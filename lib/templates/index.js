const fs = require('fs');
const path = require('path');

// Helper to write files
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim() + '\n');
}

async function createProject(config) {
  const { 
    projectPath, 
    projectName, 
    language, 
    database, 
    auth, 
    validation,
    logger, 
    errorHandling,
    docker 
  } = config;
  
  const isTS = language === 'TypeScript';
  const ext = isTS ? 'ts' : 'js';

  // Create directories
  const dirs = [
    'src',
    'src/config',
    'src/routes',
    'src/middlewares',
    'src/controllers',
    'src/services',
    'src/utils'
  ];
  
  if (isTS) dirs.push('src/types');
  if (database !== 'none') dirs.push('src/models');
  if (validation !== 'none') dirs.push('src/validators');
  if (database === 'postgresql' || database === 'mysql') {
    dirs.push('src/migrations');
    dirs.push('src/seeders');
  }
  
  dirs.forEach(dir => {
    fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
  });

  // ============================================================
  // 1. PACKAGE.JSON
  // ============================================================
  const dependencies = {
    express: '^4.18.2',
    dotenv: '^16.3.1',
    cors: '^2.8.5',
    helmet: '^7.1.0'
  };

  const devDependencies = {
    nodemon: '^3.0.2'
  };

  if (isTS) {
    devDependencies.typescript = '^5.3.3';
    devDependencies['@types/node'] = '^20.10.6';
    devDependencies['@types/express'] = '^4.17.21';
    devDependencies['@types/cors'] = '^2.8.17';
    devDependencies['ts-node'] = '^10.9.2';
  }

  // Database dependencies
  if (database === 'mongodb') {
    dependencies.mongoose = '^8.0.3';
  } else if (database === 'postgresql' || database === 'mysql') {
    dependencies.sequelize = '^6.35.2';
    devDependencies['sequelize-cli'] = '^6.6.2';
    
    if (database === 'postgresql') {
      dependencies.pg = '^8.11.3';
      dependencies['pg-hstore'] = '^2.3.4';
    } else {
      dependencies.mysql2 = '^3.6.5';
    }
  }

  // Auth dependencies
  if (auth) {
    dependencies.jsonwebtoken = '^9.0.2';
    dependencies.bcryptjs = '^2.4.3';
    if (isTS) {
      devDependencies['@types/jsonwebtoken'] = '^9.0.5';
      devDependencies['@types/bcryptjs'] = '^2.4.6';
    }
  }

  // Validation dependencies
  if (validation === 'zod') {
    dependencies.zod = '^3.22.4';
  } else if (validation === 'joi') {
    dependencies.joi = '^17.11.0';
  }

  // Logger dependencies
  if (logger === 'Winston') {
    dependencies.winston = '^3.11.0';
  } else if (logger === 'Pino') {
    dependencies.pino = '^8.17.2';
    dependencies['pino-pretty'] = '^10.3.1';
  }

  const scripts = {
    start: isTS ? 'node dist/server.js' : 'node src/server.js',
    dev: isTS ? 'nodemon --exec ts-node src/server.ts' : 'nodemon src/server.js'
  };

  if (isTS) {
    scripts.build = 'tsc';
  }

  if (database === 'postgresql' || database === 'mysql') {
    scripts['db:migrate'] = 'npx sequelize-cli db:migrate';
    scripts['db:migrate:undo'] = 'npx sequelize-cli db:migrate:undo';
    scripts['db:seed'] = 'npx sequelize-cli db:seed:all';
  }

  writeFile(path.join(projectPath, 'package.json'), JSON.stringify({
    name: projectName,
    version: '1.0.0',
    description: 'Backend API',
    main: isTS ? 'dist/server.js' : 'src/server.js',
    scripts,
    dependencies,
    devDependencies
  }, null, 2));

  // ============================================================
  // 2. ENVIRONMENT FILES
  // ============================================================
  let envContent = `NODE_ENV=development
PORT=5000
`;

  if (database === 'mongodb') {
    envContent += `\n# Database
MONGODB_URI=mongodb://localhost:27017/${projectName}
`;
  } else if (database === 'postgresql') {
    envContent += `\n# Database
DATABASE_URL=postgresql://postgres:root@localhost:5432/my-back
DB_HOST=localhost
DB_PORT=5432
DB_NAME=my-back
DB_USER=postgres
DB_PASSWORD=root
`;
  } else if (database === 'mysql') {
    envContent += `\n# Database
DATABASE_URL=mysql://root:password@localhost:3306/${projectName}
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${projectName}
DB_USER=root
DB_PASSWORD=password
`;
  }

  if (auth) {
    envContent += `\n# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
`;
  }

  envContent += `\n# CORS
CORS_ORIGIN=http://localhost:3000
`;

  writeFile(path.join(projectPath, '.env'), envContent);
  writeFile(path.join(projectPath, '.env.example'), envContent);

  // ============================================================
  // 3. GITIGNORE
  // ============================================================
  writeFile(path.join(projectPath, '.gitignore'), `node_modules/
.env
.env.local
${isTS ? 'dist/\n' : ''}logs/
*.log
.DS_Store
coverage/
`);

  // ============================================================
  // 4. TYPESCRIPT CONFIG (if TypeScript)
  // ============================================================
  if (isTS) {
    writeFile(path.join(projectPath, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
        types: ['node']
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    }, null, 2));
  }

  // ============================================================
  // 5. src/config/env.ts/js - CENTRALIZED ENVIRONMENT CONSTANTS
  // ============================================================
  const envConfigContent = isTS ? `interface Environment {
  NODE_ENV: string;
  PORT: number;
  ${database === 'mongodb' ? 'MONGODB_URI: string;' : ''}
  ${database === 'postgresql' || database === 'mysql' ? `DATABASE_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;` : ''}
  ${auth ? `JWT_SECRET: string;
  JWT_EXPIRES_IN: string;` : ''}
  CORS_ORIGIN: string;
}

export const ENV: Environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  ${database === 'mongodb' ? "MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/app'," : ''}
  ${database === 'postgresql' || database === 'mysql' ? `DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '${database === 'postgresql' ? '5432' : '3306'}', 10),
  DB_NAME: process.env.DB_NAME || 'my-back',
  DB_USER: process.env.DB_USER || '${database === 'postgresql' ? 'postgres' : 'root'}',
  DB_PASSWORD: process.env.DB_PASSWORD || 'root',` : ''}
  ${auth ? `JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',` : ''}
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
` : `const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  ${database === 'mongodb' ? "MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/app'," : ''}
  ${database === 'postgresql' || database === 'mysql' ? `DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '${database === 'postgresql' ? '5432' : '3306'}', 10),
  DB_NAME: process.env.DB_NAME || 'my-back',
  DB_USER: process.env.DB_USER || '${database === 'postgresql' ? 'postgres' : 'root'}',
  DB_PASSWORD: process.env.DB_PASSWORD || 'root',` : ''}
  ${auth ? `JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',` : ''}
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

module.exports = { ENV };
`;

  writeFile(path.join(projectPath, `src/config/env.${ext}`), envConfigContent);

  // ============================================================
  // 6. src/utils/AppError.ts/js - CUSTOM ERROR CLASS
  // ============================================================
  if (errorHandling) {
    const appErrorContent = isTS ? `export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
` : `class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
`;

    writeFile(path.join(projectPath, `src/utils/AppError.${ext}`), appErrorContent);
  }

  // ============================================================
  // 7. src/utils/response.ts/js - RESPONSE HELPERS
  // ============================================================
  if (errorHandling) {
    const responseContent = isTS ? `import { Response } from 'express';

export const successResponse = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (
  res: Response,
  message: string = 'Error occurred',
  statusCode: number = 500,
  errors?: any
) => {
  const response: any = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
` : `const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message = 'Error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = { successResponse, errorResponse };
`;

    writeFile(path.join(projectPath, `src/utils/response.${ext}`), responseContent);
  }

  // ============================================================
  // 8. src/server.ts/js
  // ============================================================
  const serverContent = isTS ? `import dotenv from 'dotenv';
import app from './app';
import { ENV } from './config/env';
${database === 'mongodb' ? "import connectDB from './config/database';" : ''}
${database === 'postgresql' || database === 'mysql' ? "import { connectDatabase } from './config/database';" : ''}
${logger !== 'None' ? "import logger from './config/logger';" : ''}

dotenv.config();

${database === 'mongodb' ? `// Connect to MongoDB
connectDB();
` : ''}
${database === 'postgresql' || database === 'mysql' ? `// Connect to database
connectDatabase();
` : ''}
const server = app.listen(ENV.PORT, () => {
  ${logger !== 'None' 
    ? "logger.info(`Server running on port ${ENV.PORT}`);" 
    : "console.log(`🚀 Server running on port ${ENV.PORT}`);"}
});

// Graceful shutdown
process.on('SIGTERM', () => {
  ${logger !== 'None' ? "logger.info('SIGTERM received, closing server...');" : "console.log('SIGTERM received');"}
  server.close(() => {
    ${logger !== 'None' ? "logger.info('Server closed');" : "console.log('Server closed');"}
    process.exit(0);
  });
});
` : `require('dotenv').config();
const app = require('./app');
const { ENV } = require('./config/env');
${database === 'mongodb' ? "const connectDB = require('./config/database');" : ''}
${database === 'postgresql' || database === 'mysql' ? "const { connectDatabase } = require('./config/database');" : ''}
${logger !== 'None' ? "const logger = require('./config/logger');" : ''}

${database === 'mongodb' ? `// Connect to MongoDB
connectDB();
` : ''}
${database === 'postgresql' || database === 'mysql' ? `// Connect to database
connectDatabase();
` : ''}
const server = app.listen(ENV.PORT, () => {
  ${logger !== 'None' 
    ? "logger.info(`Server running on port ${ENV.PORT}`);" 
    : "console.log(`🚀 Server running on port ${ENV.PORT}`);"}
});

// Graceful shutdown
process.on('SIGTERM', () => {
  ${logger !== 'None' ? "logger.info('SIGTERM received, closing server...');" : "console.log('SIGTERM received');"}
  server.close(() => {
    ${logger !== 'None' ? "logger.info('Server closed');" : "console.log('Server closed');"}
    process.exit(0);
  });
});
`;

  writeFile(path.join(projectPath, `src/server.${ext}`), serverContent);

  // ============================================================
  // 9. src/app.ts/js
  // ============================================================
  const appContent = isTS ? `import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';
${errorHandling ? "import { AppError } from './utils/AppError';\nimport { errorResponse } from './utils/response';" : ''}

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// app.use('/api', routes);

${errorHandling ? `// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(\`Route \${req.originalUrl} not found\`, 404));
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (ENV.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
      error: err
    });
  }

  return errorResponse(res, message, statusCode);
});
` : ''}
export default app;
` : `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ENV } = require('./config/env');
${errorHandling ? "const { AppError } = require('./utils/AppError');\nconst { errorResponse } = require('./utils/response');" : ''}

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// app.use('/api', routes);

${errorHandling ? `// 404 handler
app.use((req, res, next) => {
  next(new AppError(\`Route \${req.originalUrl} not found\`, 404));
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (ENV.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
      error: err
    });
  }

  return errorResponse(res, message, statusCode);
});
` : ''}
module.exports = app;
`;

  writeFile(path.join(projectPath, `src/app.${ext}`), appContent);

  // ============================================================
  // 10. DATABASE CONFIG
  // ============================================================
  if (database === 'mongodb') {
    const mongoContent = isTS ? `import mongoose from 'mongoose';
import { ENV } from './env';
${logger !== 'None' ? "import logger from './logger';" : ''}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    ${logger !== 'None' ? "logger.info('MongoDB connected successfully');" : "console.log('✅ MongoDB connected');"}
  } catch (error) {
    ${logger !== 'None' ? "logger.error('MongoDB connection error:', error);" : "console.error('❌ MongoDB error:', error);"}
    process.exit(1);
  }
};

export default connectDB;
` : `const mongoose = require('mongoose');
const { ENV } = require('./env');
${logger !== 'None' ? "const logger = require('./logger');" : ''}

const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    ${logger !== 'None' ? "logger.info('MongoDB connected successfully');" : "console.log('✅ MongoDB connected');"}
  } catch (error) {
    ${logger !== 'None' ? "logger.error('MongoDB connection error:', error);" : "console.error('❌ MongoDB error:', error);"}
    process.exit(1);
  }
};

module.exports = connectDB;
`;

    writeFile(path.join(projectPath, `src/config/database.${ext}`), mongoContent);
    
    // Info file for models folder
    const mongooseInfoContent = isTS ? `import mongoose, { Document, Schema } from 'mongoose';

/**
 * MODELS FOLDER
 * 
 * This folder contains Mongoose schemas and models for MongoDB.
 * 
 * Purpose:
 * - Define data structure and validation rules
 * - Create database models for collections
 * - Add instance and static methods
 * - Set up hooks (pre/post save, etc.)
 * 
 * How to create a model:
 * 
 * 1. Define interface:
 *    export interface IUser extends Document {
 *      name: string;
 *      email: string;
 *      password: string;
 *      createdAt: Date;
 *      updatedAt: Date;
 *    }
 * 
 * 2. Create schema:
 *    const userSchema = new Schema<IUser>({
 *      name: { type: String, required: true, trim: true },
 *      email: { 
 *        type: String, 
 *        required: true, 
 *        unique: true, 
 *        lowercase: true 
 *      },
 *      password: { type: String, required: true, minlength: 6 }
 *    }, {
 *      timestamps: true  // Auto-creates createdAt, updatedAt
 *    });
 * 
 * 3. Add methods (optional):
 *    userSchema.methods.comparePassword = async function(password: string) {
 *      return bcrypt.compare(password, this.password);
 *    };
 * 
 * 4. Export model:
 *    export const User = mongoose.model<IUser>('User', userSchema);
 * 
 * 5. Use in controllers:
 *    import { User } from '../models/user.model';
 *    
 *    const users = await User.find();
 *    const user = await User.create({ name, email, password });
 *    const user = await User.findById(id);
 *    await User.findByIdAndUpdate(id, updates);
 *    await User.findByIdAndDelete(id);
 * 
 * Common model files:
 * - user.model.ts - User authentication and profile
 * - product.model.ts - Product catalog
 * - order.model.ts - Customer orders
 */

// Example: Uncomment to use
// export interface IExample extends Document {
//   field: string;
// }
// 
// const exampleSchema = new Schema<IExample>({
//   field: { type: String, required: true }
// });
// 
// export const Example = mongoose.model<IExample>('Example', exampleSchema);
` : `const mongoose = require('mongoose');

/**
 * MODELS FOLDER
 * 
 * This folder contains Mongoose schemas and models for MongoDB.
 * 
 * Purpose:
 * - Define data structure and validation rules
 * - Create database models for collections
 * - Add instance and static methods
 * - Set up hooks (pre/post save, etc.)
 * 
 * How to create a model:
 * 
 * 1. Create schema:
 *    const userSchema = new mongoose.Schema({
 *      name: { type: String, required: true, trim: true },
 *      email: { 
 *        type: String, 
 *        required: true, 
 *        unique: true, 
 *        lowercase: true 
 *      },
 *      password: { type: String, required: true, minlength: 6 }
 *    }, {
 *      timestamps: true  // Auto-creates createdAt, updatedAt
 *    });
 * 
 * 2. Add methods (optional):
 *    userSchema.methods.comparePassword = async function(password) {
 *      return bcrypt.compare(password, this.password);
 *    };
 * 
 * 3. Export model:
 *    module.exports = mongoose.model('User', userSchema);
 * 
 * 4. Use in controllers:
 *    const User = require('../models/user.model');
 *    
 *    const users = await User.find();
 *    const user = await User.create({ name, email, password });
 *    const user = await User.findById(id);
 *    await User.findByIdAndUpdate(id, updates);
 *    await User.findByIdAndDelete(id);
 * 
 * Common model files:
 * - user.model.js - User authentication and profile
 * - product.model.js - Product catalog
 * - order.model.js - Customer orders
 */

// Example: Uncomment to use
// const exampleSchema = new mongoose.Schema({
//   field: { type: String, required: true }
// });
// 
// module.exports = mongoose.model('Example', exampleSchema);
`;

    writeFile(path.join(projectPath, `src/models/info.${ext}`), mongooseInfoContent);
    
  } else if (database === 'postgresql' || database === 'mysql') {
    const sequelizeContent = isTS ? `import { Sequelize } from 'sequelize';
import { ENV } from './env';
${logger !== 'None' ? "import logger from './logger';" : ''}

export const sequelize = new Sequelize({
  dialect: '${database === 'postgresql' ? 'postgres' : 'mysql'}',
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  database: ENV.DB_NAME,
  username: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  logging: false, // Disable SQL query logging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    ${logger !== 'None' ? "logger.info('Database connected successfully');" : "console.log('✅ Database connected');"}
  } catch (error) {
    ${logger !== 'None' ? "logger.error('Database connection failed:', error);" : "console.error('❌ Database connection failed:', error);"}
    process.exit(1);
  }
};
` : `const { Sequelize } = require('sequelize');
const { ENV } = require('./env');
${logger !== 'None' ? "const logger = require('./logger');" : ''}

const sequelize = new Sequelize({
  dialect: '${database === 'postgresql' ? 'postgres' : 'mysql'}',
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  database: ENV.DB_NAME,
  username: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  logging: false, // Disable SQL query logging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    ${logger !== 'None' ? "logger.info('Database connected successfully');" : "console.log('✅ Database connected');"}
  } catch (error) {
    ${logger !== 'None' ? "logger.error('Database connection failed:', error);" : "console.error('❌ Database connection failed:', error);"}
    process.exit(1);
  }
};

module.exports = { sequelize, connectDatabase };
`;

    writeFile(path.join(projectPath, `src/config/database.${ext}`), sequelizeContent);

    // Sequelize config file for CLI
    const sequelizeConfigContent = `module.exports = {
  development: {
    username: process.env.DB_USER || '${database === 'postgresql' ? 'postgres' : 'root'}',
    password: process.env.DB_PASSWORD || '${database === 'postgresql' ? 'root' : 'password'}',
    database: process.env.DB_NAME || 'my-back',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || ${database === 'postgresql' ? '5432' : '3306'},
    dialect: '${database === 'postgresql' ? 'postgres' : 'mysql'}'
  },
  test: {
    username: process.env.DB_USER || '${database === 'postgresql' ? 'postgres' : 'root'}',
    password: process.env.DB_PASSWORD || '${database === 'postgresql' ? 'root' : 'password'}',
    database: \`\${process.env.DB_NAME || 'my-back'}_test\`,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || ${database === 'postgresql' ? '5432' : '3306'},
    dialect: '${database === 'postgresql' ? 'postgres' : 'mysql'}'
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: '${database === 'postgresql' ? 'postgres' : 'mysql'}',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
`;

    writeFile(path.join(projectPath, '.sequelizerc'), `const path = require('path');

module.exports = {
  'config': path.resolve('config', 'database.js'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src', 'seeders'),
  'migrations-path': path.resolve('src', 'migrations')
};
`);

    fs.mkdirSync(path.join(projectPath, 'config'), { recursive: true });
    writeFile(path.join(projectPath, 'config/database.js'), sequelizeConfigContent);

    // Info file for models folder
    const sequelizeInfoContent = isTS ? `import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * MODELS FOLDER
 * 
 * This folder contains Sequelize models for ${database === 'postgresql' ? 'PostgreSQL' : 'MySQL'}.
 * 
 * Purpose:
 * - Define table structure and data types
 * - Set up relationships between tables
 * - Add validations and constraints
 * - Create model methods and hooks
 * 
 * How to create a model:
 * 
 * 1. Define interfaces:
 *    interface UserAttributes {
 *      id: number;
 *      name: string;
 *      email: string;
 *      createdAt?: Date;
 *      updatedAt?: Date;
 *    }
 *    
 *    interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}
 * 
 * 2. Create model class:
 *    export class User extends Model<UserAttributes, UserCreationAttributes> 
 *      implements UserAttributes {
 *      public id!: number;
 *      public name!: string;
 *      public email!: string;
 *      public readonly createdAt!: Date;
 *      public readonly updatedAt!: Date;
 *    }
 * 
 * 3. Initialize model:
 *    User.init({
 *      id: {
 *        type: DataTypes.INTEGER,
 *        autoIncrement: true,
 *        primaryKey: true
 *      },
 *      name: {
 *        type: DataTypes.STRING,
 *        allowNull: false
 *      },
 *      email: {
 *        type: DataTypes.STRING,
 *        allowNull: false,
 *        unique: true,
 *        validate: { isEmail: true }
 *      }
 *    }, {
 *      sequelize,
 *      tableName: 'users',
 *      timestamps: true  // Auto-creates createdAt, updatedAt
 *    });
 * 
 * 4. Add associations (optional):
 *    User.hasMany(Post, { foreignKey: 'userId' });
 *    Post.belongsTo(User, { foreignKey: 'userId' });
 * 
 * 5. Use in controllers:
 *    import { User } from '../models/user.model';
 *    
 *    const users = await User.findAll();
 *    const user = await User.create({ name, email });
 *    const user = await User.findByPk(id);
 *    await User.update({ name }, { where: { id } });
 *    await User.destroy({ where: { id } });
 * 
 * Generate migration:
 *    npx sequelize-cli migration:generate --name create-users
 * 
 * Common model files:
 * - user.model.ts - User authentication and profile
 * - product.model.ts - Product catalog
 * - order.model.ts - Customer orders
 */

// Example: Uncomment to use
// interface ExampleAttributes {
//   id: number;
//   field: string;
// }
// 
// interface ExampleCreationAttributes extends Optional<ExampleAttributes, 'id'> {}
// 
// export class Example extends Model<ExampleAttributes, ExampleCreationAttributes> {
//   public id!: number;
//   public field!: string;
// }
// 
// Example.init({
//   id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//   field: { type: DataTypes.STRING, allowNull: false }
// }, { sequelize, tableName: 'examples' });
` : `const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * MODELS FOLDER
 * 
 * This folder contains Sequelize models for ${database === 'postgresql' ? 'PostgreSQL' : 'MySQL'}.
 * 
 * Purpose:
 * - Define table structure and data types
 * - Set up relationships between tables
 * - Add validations and constraints
 * - Create model methods and hooks
 * 
 * How to create a model:
 * 
 * 1. Create model class:
 *    class User extends Model {}
 * 
 * 2. Initialize model:
 *    User.init({
 *      id: {
 *        type: DataTypes.INTEGER,
 *        autoIncrement: true,
 *        primaryKey: true
 *      },
 *      name: {
 *        type: DataTypes.STRING,
 *        allowNull: false
 *      },
 *      email: {
 *        type: DataTypes.STRING,
 *        allowNull: false,
 *        unique: true,
 *        validate: { isEmail: true }
 *      }
 *    }, {
 *      sequelize,
 *      tableName: 'users',
 *      timestamps: true  // Auto-creates createdAt, updatedAt
 *    });
 * 
 * 3. Add associations (optional):
 *    User.hasMany(Post, { foreignKey: 'userId' });
 *    Post.belongsTo(User, { foreignKey: 'userId' });
 * 
 * 4. Use in controllers:
 *    const User = require('../models/user.model');
 *    
 *    const users = await User.findAll();
 *    const user = await User.create({ name, email });
 *    const user = await User.findByPk(id);
 *    await User.update({ name }, { where: { id } });
 *    await User.destroy({ where: { id } });
 * 
 * Generate migration:
 *    npx sequelize-cli migration:generate --name create-users
 * 
 * Common model files:
 * - user.model.js - User authentication and profile
 * - product.model.js - Product catalog
 * - order.model.js - Customer orders
 */

// Example: Uncomment to use
// class Example extends Model {}
// 
// Example.init({
//   id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//   field: { type: DataTypes.STRING, allowNull: false }
// }, { sequelize, tableName: 'examples' });
// 
// module.exports = { Example };
`;

    writeFile(path.join(projectPath, `src/models/info.${ext}`), sequelizeInfoContent);
  }

  // ============================================================
  // 11. LOGGER CONFIG - UPDATED WITH CLEAN OUTPUT
  // ============================================================
  if (logger === 'Winston') {
    const winstonContent = isTS ? `import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => {
      const emoji = level === 'info' ? '✅' : level === 'error' ? '❌' : 'ℹ️';
      return \`\${emoji} \${message}\`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message }) => {
          const emoji = level.includes('info') ? '✅' : level.includes('error') ? '❌' : 'ℹ️';
          return \`\${emoji} \${message}\`;
        })
      ),
    }),
  ],
});

export default logger;
` : `const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => {
      const emoji = level === 'info' ? '✅' : level === 'error' ? '❌' : 'ℹ️';
      return \`\${emoji} \${message}\`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message }) => {
          const emoji = level.includes('info') ? '✅' : level.includes('error') ? '❌' : 'ℹ️';
          return \`\${emoji} \${message}\`;
        })
      ),
    }),
  ],
});

module.exports = logger;
`;

    writeFile(path.join(projectPath, `src/config/logger.${ext}`), winstonContent);
  } else if (logger === 'Pino') {
    const pinoContent = isTS ? `import pino from 'pino';
import { ENV } from './env';

const logger = pino({
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: ENV.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
});

export default logger;
` : `const pino = require('pino');
const { ENV } = require('./env');

const logger = pino({
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: ENV.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
});

module.exports = logger;
`;

    writeFile(path.join(projectPath, `src/config/logger.${ext}`), pinoContent);
  }

  // ============================================================
  // 12. VALIDATORS (if validation library chosen)
  // ============================================================
  if (validation === 'zod') {
    const zodValidatorContent = isTS ? `import { z } from 'zod';

/**
 * VALIDATORS FOLDER
 * 
 * This folder contains request validation schemas using Zod.
 * 
 * Purpose:
 * - Validate incoming request data (body, params, query)
 * - Ensure type safety with TypeScript inference
 * - Provide clear error messages for invalid data
 * 
 * How to create a validator:
 * 
 * 1. Define your schema:
 *    export const createUserSchema = z.object({
 *      name: z.string().min(1, 'Name is required'),
 *      email: z.string().email('Invalid email'),
 *      age: z.number().min(18).optional()
 *    });
 * 
 * 2. Infer TypeScript type:
 *    export type CreateUserInput = z.infer<typeof createUserSchema>;
 * 
 * 3. Use in middleware:
 *    const validateRequest = (schema: z.ZodSchema) => {
 *      return (req, res, next) => {
 *        const result = schema.safeParse(req.body);
 *        if (!result.success) {
 *          return res.status(400).json({
 *            success: false,
 *            errors: result.error.errors
 *          });
 *        }
 *        req.body = result.data;
 *        next();
 *      };
 *    };
 * 
 * Example validators for common use cases:
 * - user.validator.ts - User registration, login, update
 * - product.validator.ts - Product creation, update
 * - auth.validator.ts - Authentication requests
 */

// Example: Uncomment to use
// export const exampleSchema = z.object({
//   field: z.string()
// });
` : `const { z } = require('zod');

/**
 * VALIDATORS FOLDER
 * 
 * This folder contains request validation schemas using Zod.
 * 
 * Purpose:
 * - Validate incoming request data (body, params, query)
 * - Provide clear error messages for invalid data
 * 
 * How to create a validator:
 * 
 * 1. Define your schema:
 *    const createUserSchema = z.object({
 *      name: z.string().min(1, 'Name is required'),
 *      email: z.string().email('Invalid email'),
 *      age: z.number().min(18).optional()
 *    });
 * 
 * 2. Use in middleware:
 *    const validateRequest = (schema) => {
 *      return (req, res, next) => {
 *        const result = schema.safeParse(req.body);
 *        if (!result.success) {
 *          return res.status(400).json({
 *            success: false,
 *            errors: result.error.errors
 *          });
 *        }
 *        req.body = result.data;
 *        next();
 *      };
 *    };
 * 
 * Example validators for common use cases:
 * - user.validator.js - User registration, login, update
 * - product.validator.js - Product creation, update
 * - auth.validator.js - Authentication requests
 */

// Example: Uncomment to use
// const exampleSchema = z.object({
//   field: z.string()
// });
// 
// module.exports = { exampleSchema };
`;

    writeFile(path.join(projectPath, `src/validators/info.${ext}`), zodValidatorContent);
  } else if (validation === 'joi') {
    const joiValidatorContent = isTS ? `import Joi from 'joi';

/**
 * VALIDATORS FOLDER
 * 
 * This folder contains request validation schemas using Joi.
 * 
 * Purpose:
 * - Validate incoming request data (body, params, query)
 * - Provide clear error messages for invalid data
 * 
 * How to create a validator:
 * 
 * 1. Define your schema:
 *    export const createUserSchema = Joi.object({
 *      name: Joi.string().required(),
 *      email: Joi.string().email().required(),
 *      age: Joi.number().min(18).optional()
 *    });
 * 
 * 2. Use in middleware:
 *    const validateRequest = (schema: Joi.Schema) => {
 *      return (req, res, next) => {
 *        const { error, value } = schema.validate(req.body);
 *        if (error) {
 *          return res.status(400).json({
 *            success: false,
 *            errors: error.details
 *          });
 *        }
 *        req.body = value;
 *        next();
 *      };
 *    };
 * 
 * Example validators for common use cases:
 * - user.validator.ts - User registration, login, update
 * - product.validator.ts - Product creation, update
 * - auth.validator.ts - Authentication requests
 */

// Example: Uncomment to use
// export const exampleSchema = Joi.object({
//   field: Joi.string().required()
// });
` : `const Joi = require('joi');

/**
 * VALIDATORS FOLDER
 * 
 * This folder contains request validation schemas using Joi.
 * 
 * Purpose:
 * - Validate incoming request data (body, params, query)
 * - Provide clear error messages for invalid data
 * 
 * How to create a validator:
 * 
 * 1. Define your schema:
 *    const createUserSchema = Joi.object({
 *      name: Joi.string().required(),
 *      email: Joi.string().email().required(),
 *      age: Joi.number().min(18).optional()
 *    });
 * 
 * 2. Use in middleware:
 *    const validateRequest = (schema) => {
 *      return (req, res, next) => {
 *        const { error, value } = schema.validate(req.body);
 *        if (error) {
 *          return res.status(400).json({
 *            success: false,
 *            errors: error.details
 *          });
 *        }
 *        req.body = value;
 *        next();
 *      };
 *    };
 * 
 * Example validators for common use cases:
 * - user.validator.js - User registration, login, update
 * - product.validator.js - Product creation, update
 * - auth.validator.js - Authentication requests
 */

// Example: Uncomment to use
// const exampleSchema = Joi.object({
//   field: Joi.string().required()
// });
// 
// module.exports = { exampleSchema };
`;

    writeFile(path.join(projectPath, `src/validators/info.${ext}`), joiValidatorContent);
  }

  // ============================================================
  // 13. INFO FILES FOR FOLDER STRUCTURE
  // ============================================================
  
  // Routes info
  writeFile(path.join(projectPath, `src/routes/info.${ext}`), isTS 
    ? `import { Router } from 'express';

/**
 * ROUTES FOLDER
 * 
 * This folder contains API route definitions.
 * 
 * Purpose:
 * - Define API endpoints and HTTP methods
 * - Map routes to controller functions
 * - Apply middleware (auth, validation, etc.)
 * - Group related routes together
 * 
 * How to create routes:
 * 
 * 1. Create a router:
 *    import { Router } from 'express';
 *    const router = Router();
 * 
 * 2. Define routes:
 *    import { getUsers, createUser } from '../controllers/user.controller';
 *    import { authenticate } from '../middlewares/auth.middleware';
 *    import { validateRequest } from '../middlewares/validation.middleware';
 *    import { createUserSchema } from '../validators/user.validator';
 *    
 *    router.get('/', authenticate, getUsers);
 *    router.post('/', 
 *      authenticate, 
 *      validateRequest(createUserSchema), 
 *      createUser
 *    );
 *    router.get('/:id', authenticate, getUserById);
 *    router.put('/:id', authenticate, updateUser);
 *    router.delete('/:id', authenticate, deleteUser);
 * 
 * 3. Export router:
 *    export default router;
 * 
 * 4. Register in main routes:
 *    import userRoutes from './user.routes';
 *    router.use('/users', userRoutes);
 * 
 * Route naming conventions:
 * - user.routes.ts - User-related endpoints
 * - auth.routes.ts - Authentication endpoints
 * - product.routes.ts - Product endpoints
 * 
 * Example structure:
 *    GET    /api/users       - Get all users
 *    POST   /api/users       - Create user
 *    GET    /api/users/:id   - Get user by ID
 *    PUT    /api/users/:id   - Update user
 *    DELETE /api/users/:id   - Delete user
 */

const router = Router();

// Example: Uncomment to use
// import exampleRoutes from './example.routes';
// router.use('/examples', exampleRoutes);

export default router;`
    : `const { Router } = require('express');

/**
 * ROUTES FOLDER
 * 
 * This folder contains API route definitions.
 * 
 * Purpose:
 * - Define API endpoints and HTTP methods
 * - Map routes to controller functions
 * - Apply middleware (auth, validation, etc.)
 * - Group related routes together
 * 
 * How to create routes:
 * 
 * 1. Create a router:
 *    const { Router } = require('express');
 *    const router = Router();
 * 
 * 2. Define routes:
 *    const { getUsers, createUser } = require('../controllers/user.controller');
 *    const { authenticate } = require('../middlewares/auth.middleware');
 *    const { validateRequest } = require('../middlewares/validation.middleware');
 *    const { createUserSchema } = require('../validators/user.validator');
 *    
 *    router.get('/', authenticate, getUsers);
 *    router.post('/', 
 *      authenticate, 
 *      validateRequest(createUserSchema), 
 *      createUser
 *    );
 *    router.get('/:id', authenticate, getUserById);
 *    router.put('/:id', authenticate, updateUser);
 *    router.delete('/:id', authenticate, deleteUser);
 * 
 * 3. Export router:
 *    module.exports = router;
 * 
 * 4. Register in main routes:
 *    const userRoutes = require('./user.routes');
 *    router.use('/users', userRoutes);
 * 
 * Route naming conventions:
 * - user.routes.js - User-related endpoints
 * - auth.routes.js - Authentication endpoints
 * - product.routes.js - Product endpoints
 * 
 * Example structure:
 *    GET    /api/users       - Get all users
 *    POST   /api/users       - Create user
 *    GET    /api/users/:id   - Get user by ID
 *    PUT    /api/users/:id   - Update user
 *    DELETE /api/users/:id   - Delete user
 */

const router = Router();

// Example: Uncomment to use
// const exampleRoutes = require('./example.routes');
// router.use('/examples', exampleRoutes);

module.exports = router;`
  );

  // Controllers info
  writeFile(path.join(projectPath, `src/controllers/info.${ext}`), isTS 
    ? `import { Request, Response, NextFunction } from 'express';
${errorHandling ? "import { successResponse, errorResponse } from '../utils/response';\nimport { AppError } from '../utils/AppError';" : ''}

/**
 * CONTROLLERS FOLDER
 * 
 * This folder contains controller functions that handle HTTP requests.
 * 
 * Purpose:
 * - Process incoming requests
 * - Call service layer for business logic
 * - Return HTTP responses
 * - Handle errors appropriately
 * 
 * How to create a controller:
 * 
 * 1. Import dependencies:
 *    import { Request, Response, NextFunction } from 'express';
${errorHandling ? "*    import { successResponse, errorResponse } from '../utils/response';" : ''}
 *    import { UserService } from '../services/user.service';
 * 
 * 2. Create controller functions:
 *    export const getUsers = async (
 *      req: Request, 
 *      res: Response, 
 *      next: NextFunction
 *    ) => {
 *      try {
 *        const users = await UserService.getAllUsers();
${errorHandling ? "*        return successResponse(res, users, 'Users retrieved successfully');" : "*        return res.json({ success: true, data: users });"}
 *      } catch (error) {
 *        next(error);
 *      }
 *    };
 * 
 *    export const createUser = async (
 *      req: Request, 
 *      res: Response, 
 *      next: NextFunction
 *    ) => {
 *      try {
 *        const user = await UserService.createUser(req.body);
${errorHandling ? "*        return successResponse(res, user, 'User created', 201);" : "*        return res.status(201).json({ success: true, data: user });"}
 *      } catch (error) {
 *        next(error);
 *      }
 *    };
 * 
 * Controller best practices:
 * - Keep controllers thin - delegate logic to services
 * - Always use try-catch and pass errors to next()
 * - Use consistent response format
 * - Validate input (use validators + middleware)
 * - Return appropriate HTTP status codes
 * 
 * Common controller files:
 * - user.controller.ts - User CRUD operations
 * - auth.controller.ts - Login, register, logout
 * - product.controller.ts - Product management
 */

// Example: Uncomment to use
// export const exampleController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // Your logic here
${errorHandling ? "//     return successResponse(res, {}, 'Success');" : "//     return res.json({ success: true });"}
//   } catch (error) {
//     next(error);
//   }
// };`
    : `${errorHandling ? "const { successResponse, errorResponse } = require('../utils/response');\nconst { AppError } = require('../utils/AppError');" : ''}

/**
 * CONTROLLERS FOLDER
 * 
 * This folder contains controller functions that handle HTTP requests.
 * 
 * Purpose:
 * - Process incoming requests
 * - Call service layer for business logic
 * - Return HTTP responses
 * - Handle errors appropriately
 * 
 * How to create a controller:
 * 
 * 1. Import dependencies:
${errorHandling ? "*    const { successResponse } = require('../utils/response');" : ''}
 *    const UserService = require('../services/user.service');
 * 
 * 2. Create controller functions:
 *    const getUsers = async (req, res, next) => {
 *      try {
 *        const users = await UserService.getAllUsers();
${errorHandling ? "*        return successResponse(res, users, 'Users retrieved successfully');" : "*        return res.json({ success: true, data: users });"}
 *      } catch (error) {
 *        next(error);
 *      }
 *    };
 * 
 *    const createUser = async (req, res, next) => {
 *      try {
 *        const user = await UserService.createUser(req.body);
${errorHandling ? "*        return successResponse(res, user, 'User created', 201);" : "*        return res.status(201).json({ success: true, data: user });"}
 *      } catch (error) {
 *        next(error);
 *      }
 *    };
 * 
 * 3. Export functions:
 *    module.exports = { getUsers, createUser };
 * 
 * Controller best practices:
 * - Keep controllers thin - delegate logic to services
 * - Always use try-catch and pass errors to next()
 * - Use consistent response format
 * - Validate input (use validators + middleware)
 * - Return appropriate HTTP status codes
 * 
 * Common controller files:
 * - user.controller.js - User CRUD operations
 * - auth.controller.js - Login, register, logout
 * - product.controller.js - Product management
 */

// Example: Uncomment to use
// const exampleController = async (req, res, next) => {
//   try {
//     // Your logic here
${errorHandling ? "//     return successResponse(res, {}, 'Success');" : "//     return res.json({ success: true });"}
//   } catch (error) {
//     next(error);
//   }
// };
// 
// module.exports = { exampleController };`
  );

  // Services info
  writeFile(path.join(projectPath, `src/services/info.${ext}`), isTS 
    ? `${database === 'mongodb' ? "// import { User } from '../models/user.model';" : database === 'postgresql' || database === 'mysql' ? "// import { User } from '../models/user.model';" : ''}
${errorHandling ? "import { AppError } from '../utils/AppError';" : ''}

/**
 * SERVICES FOLDER
 * 
 * This folder contains business logic and data access layer.
 * 
 * Purpose:
 * - Encapsulate business logic
 * - Interact with database models
 * - Handle data transformations
 * - Reusable functions across controllers
 * 
 * How to create a service:
 * 
 * 1. Import model and utilities:
 *    import { User } from '../models/user.model';
${errorHandling ? "*    import { AppError } from '../utils/AppError';" : ''}
 * 
 * 2. Create service class or functions:
 *    export class UserService {
 *      static async getAllUsers() {
${database === 'mongodb' ? '*        return await User.find().select(\'-password\');' : database === 'postgresql' || database === 'mysql' ? '*        return await User.findAll({ attributes: { exclude: [\'password\'] } });' : '*        // Database query here'}
 *      }
 * 
 *      static async getUserById(id: string) {
${database === 'mongodb' ? '*        const user = await User.findById(id).select(\'-password\');' : database === 'postgresql' || database === 'mysql' ? '*        const user = await User.findByPk(id);' : '*        // Database query here'}
${errorHandling ? "*        if (!user) throw new AppError('User not found', 404);" : "*        if (!user) throw new Error('User not found');"}
 *        return user;
 *      }
 * 
 *      static async createUser(data: any) {
${database === 'mongodb' ? '*        return await User.create(data);' : database === 'postgresql' || database === 'mysql' ? '*        return await User.create(data);' : '*        // Create record'}
 *      }
 * 
 *      static async updateUser(id: string, data: any) {
${database === 'mongodb' ? '*        const user = await User.findByIdAndUpdate(id, data, { new: true });' : database === 'postgresql' || database === 'mysql' ? '*        await User.update(data, { where: { id } });\n*        return await User.findByPk(id);' : '*        // Update record'}
${errorHandling ? "*        if (!user) throw new AppError('User not found', 404);" : "*        if (!user) throw new Error('User not found');"}
 *        return user;
 *      }
 * 
 *      static async deleteUser(id: string) {
${database === 'mongodb' ? '*        const user = await User.findByIdAndDelete(id);' : database === 'postgresql' || database === 'mysql' ? '*        const deleted = await User.destroy({ where: { id } });' : '*        // Delete record'}
${errorHandling ? "*        if (!user) throw new AppError('User not found', 404);" : "*        if (!user) throw new Error('User not found');"}
 *        return user;
 *      }
 *    }
 * 
 * Service best practices:
 * - Keep business logic out of controllers
 * - Make services reusable
 * - Throw meaningful errors
 * - Use transactions for multiple database operations
 * - Keep services focused (Single Responsibility)
 * 
 * Common service files:
 * - user.service.ts - User business logic
 * - auth.service.ts - Authentication logic
 * - email.service.ts - Email sending logic
 */

// Example: Uncomment to use
// export class ExampleService {
//   static async exampleMethod() {
//     // Business logic here
//   }
// }`
    : `${database === 'mongodb' ? "// const User = require('../models/user.model');" : database === 'postgresql' || database === 'mysql' ? "// const { User } = require('../models/user.model');" : ''}
${errorHandling ? "const { AppError } = require('../utils/AppError');" : ''}

/**
 * SERVICES FOLDER
 * 
 * This folder contains business logic and data access layer.
 * 
 * Purpose:
 * - Encapsulate business logic
 * - Interact with database models
 * - Handle data transformations
 * - Reusable functions across controllers
 * 
 * How to create a service:
 * 
 * 1. Import model and utilities:
 *    const User = require('../models/user.model');
${errorHandling ? "*    const { AppError } = require('../utils/AppError');" : ''}
 * 
 * 2. Create service functions:
 *    class UserService {
 *      static async getAllUsers() {
${database === 'mongodb' ? '*        return await User.find().select(\'-password\');' : database === 'postgresql' || database === 'mysql' ? '*        return await User.findAll({ attributes: { exclude: [\'password\'] } });' : '*        // Database query here'}
 *      }
 * 
 *      static async getUserById(id) {
${database === 'mongodb' ? '*        const user = await User.findById(id).select(\'-password\');' : database === 'postgresql' || database === 'mysql' ? '*        const user = await User.findByPk(id);' : '*        // Database query here'}
${errorHandling ? "*        if (!user) throw new AppError('User not found', 404);" : "*        if (!user) throw new Error('User not found');"}
 *        return user;
 *      }
 * 
 *      static async createUser(data) {
${database === 'mongodb' ? '*        return await User.create(data);' : database === 'postgresql' || database === 'mysql' ? '*        return await User.create(data);' : '*        // Create record'}
 *      }
 * 
 *      static async updateUser(id, data) {
${database === 'mongodb' ? '*        const user = await User.findByIdAndUpdate(id, data, { new: true });' : database === 'postgresql' || database === 'mysql' ? '*        await User.update(data, { where: { id } });\n*        return await User.findByPk(id);' : '*        // Update record'}
${errorHandling ? "*        if (!user) throw new AppError('User not found', 404);" : "*        if (!user) throw new Error('User not found');"}
 *        return user;
 *      }
 * 
 *      static async deleteUser(id) {
${database === 'mongodb' ? '*        const user = await User.findByIdAndDelete(id);' : database === 'postgresql' || database === 'mysql' ? '*        const deleted = await User.destroy({ where: { id } });' : '*        // Delete record'}
${errorHandling ? "*        if (!user) throw new AppError('User not found', 404);" : "*        if (!user) throw new Error('User not found');"}
 *        return user;
 *      }
 *    }
 * 
 * 3. Export service:
 *    module.exports = UserService;
 * 
 * Service best practices:
 * - Keep business logic out of controllers
 * - Make services reusable
 * - Throw meaningful errors
 * - Use transactions for multiple database operations
 * - Keep services focused (Single Responsibility)
 * 
 * Common service files:
 * - user.service.js - User business logic
 * - auth.service.js - Authentication logic
 * - email.service.js - Email sending logic
 */

// Example: Uncomment to use
// class ExampleService {
//   static async exampleMethod() {
//     // Business logic here
//   }
// }
// 
// module.exports = ExampleService;`
  );

  // Middlewares info
  writeFile(path.join(projectPath, `src/middlewares/info.${ext}`), isTS 
    ? `import { Request, Response, NextFunction } from 'express';
${errorHandling ? "import { AppError } from '../utils/AppError';\nimport { errorResponse } from '../utils/response';" : ''}

/**
 * MIDDLEWARES FOLDER
 * 
 * This folder contains Express middleware functions.
 * 
 * Purpose:
 * - Intercept and process requests before reaching controllers
 * - Authentication and authorization
 * - Request validation
 * - Error handling
 * - Logging and monitoring
 * 
 * How to create middleware:
 * 
 * 1. Basic middleware:
 *    export const logRequest = (
 *      req: Request, 
 *      res: Response, 
 *      next: NextFunction
 *    ) => {
 *      console.log(\`\${req.method} \${req.path}\`);
 *      next();
 *    };
 * 
 * 2. Authentication middleware:
 *    import jwt from 'jsonwebtoken';
 *    
 *    export const authenticate = (
 *      req: Request, 
 *      res: Response, 
 *      next: NextFunction
 *    ) => {
 *      try {
 *        const token = req.headers.authorization?.split(' ')[1];
${errorHandling ? "*        if (!token) throw new AppError('No token provided', 401);" : "*        if (!token) return res.status(401).json({ error: 'No token' });"}
 *        
 *        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
 *        req.user = decoded;
 *        next();
 *      } catch (error) {
 *        next(error);
 *      }
 *    };
 * 
 * 3. Validation middleware:
 *    import { z } from 'zod';
 *    
 *    export const validateRequest = (schema: z.ZodSchema) => {
 *      return (req: Request, res: Response, next: NextFunction) => {
 *        const result = schema.safeParse(req.body);
 *        if (!result.success) {
${errorHandling ? "*          return errorResponse(res, 'Validation failed', 400, result.error.errors);" : "*          return res.status(400).json({ errors: result.error.errors });"}
 *        }
 *        req.body = result.data;
 *        next();
 *      };
 *    };
 * 
 * 4. Error handling middleware:
 *    export const errorHandler = (
 *      err: any,
 *      req: Request,
 *      res: Response,
 *      next: NextFunction
 *    ) => {
 *      const statusCode = err.statusCode || 500;
 *      res.status(statusCode).json({
 *        success: false,
 *        message: err.message,
 *        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
 *      });
 *    };
 * 
 * Common middleware files:
 * - auth.middleware.ts - Authentication/authorization
 * - validation.middleware.ts - Request validation
 * - upload.middleware.ts - File uploads
 * - rateLimit.middleware.ts - Rate limiting
 */

// Example: Uncomment to use
// export const exampleMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // Middleware logic here
//   next();
// };`
    : `${errorHandling ? "const { AppError } = require('../utils/AppError');\nconst { errorResponse } = require('../utils/response');" : ''}

/**
 * MIDDLEWARES FOLDER
 * 
 * This folder contains Express middleware functions.
 * 
 * Purpose:
 * - Intercept and process requests before reaching controllers
 * - Authentication and authorization
 * - Request validation
 * - Error handling
 * - Logging and monitoring
 * 
 * How to create middleware:
 * 
 * 1. Basic middleware:
 *    const logRequest = (req, res, next) => {
 *      console.log(\`\${req.method} \${req.path}\`);
 *      next();
 *    };
 * 
 * 2. Authentication middleware:
 *    const jwt = require('jsonwebtoken');
 *    
 *    const authenticate = (req, res, next) => {
 *      try {
 *        const token = req.headers.authorization?.split(' ')[1];
${errorHandling ? "*        if (!token) throw new AppError('No token provided', 401);" : "*        if (!token) return res.status(401).json({ error: 'No token' });"}
 *        
 *        const decoded = jwt.verify(token, process.env.JWT_SECRET);
 *        req.user = decoded;
 *        next();
 *      } catch (error) {
 *        next(error);
 *      }
 *    };
 * 
 * 3. Validation middleware:
 *    const { z } = require('zod');
 *    
 *    const validateRequest = (schema) => {
 *      return (req, res, next) => {
 *        const result = schema.safeParse(req.body);
 *        if (!result.success) {
${errorHandling ? "*          return errorResponse(res, 'Validation failed', 400, result.error.errors);" : "*          return res.status(400).json({ errors: result.error.errors });"}
 *        }
 *        req.body = result.data;
 *        next();
 *      };
 *    };
 * 
 * 4. Error handling middleware:
 *    const errorHandler = (err, req, res, next) => {
 *      const statusCode = err.statusCode || 500;
 *      res.status(statusCode).json({
 *        success: false,
 *        message: err.message,
 *        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
 *      });
 *    };
 * 
 * 5. Export middleware:
 *    module.exports = { logRequest, authenticate, validateRequest };
 * 
 * Common middleware files:
 * - auth.middleware.js - Authentication/authorization
 * - validation.middleware.js - Request validation
 * - upload.middleware.js - File uploads
 * - rateLimit.middleware.js - Rate limiting
 */

// Example: Uncomment to use
// const exampleMiddleware = (req, res, next) => {
//   // Middleware logic here
//   next();
// };
// 
// module.exports = { exampleMiddleware };`
  );

  // ============================================================
  // 14. DOCKER FILES (if enabled)
  // ============================================================
  if (docker) {
    writeFile(path.join(projectPath, 'Dockerfile'), `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
${isTS ? 'RUN npm run build\n' : ''}
EXPOSE 5000

CMD ["npm", "start"]
`);

    let composeContent = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "\${PORT:-5000}:5000"
    env_file:
      - .env
    restart: unless-stopped
`;

    if (database === 'mongodb') {
      composeContent += `    depends_on:
      - mongodb

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
`;
    } else if (database === 'postgresql') {
      composeContent += `    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: \${DB_NAME:-my-back}
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-root}
    ports:
      - "\${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`;
    } else if (database === 'mysql') {
      composeContent += `    depends_on:
      - mysql

  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: \${DB_NAME:-${projectName}}
      MYSQL_USER: \${DB_USER:-user}
      MYSQL_PASSWORD: \${DB_PASSWORD:-password}
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD:-password}
    ports:
      - "\${DB_PORT:-3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
`;
    }

    writeFile(path.join(projectPath, 'docker-compose.yml'), composeContent);
    
    writeFile(path.join(projectPath, '.dockerignore'), `node_modules
npm-debug.log
.env
.git
.gitignore
README.md
${isTS ? 'dist\n' : ''}logs
*.log
`);
  }

  // ============================================================
  // 15. README.md
  // ============================================================
  const readmeContent = `# ${projectName}

Backend API built with create-node-advance-app

## Features

- ✅ ${language}
- ✅ ${database === 'mongodb' ? 'MongoDB + Mongoose' : database === 'postgresql' ? 'PostgreSQL + Sequelize' : database === 'mysql' ? 'MySQL + Sequelize' : 'No Database'}
${auth ? '- ✅ JWT Authentication' : ''}
${validation !== 'none' ? `- ✅ ${validation === 'zod' ? 'Zod' : 'Joi'} Validation` : ''}
${logger !== 'None' ? `- ✅ ${logger} Logger` : ''}
${errorHandling ? '- ✅ Custom Error Handling & Response Utilities' : ''}
${docker ? '- ✅ Docker Support' : ''}
- ✅ Environment Configuration
- ✅ CORS & Security (Helmet)

## Setup

\`\`\`bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

${database === 'postgresql' || database === 'mysql' ? `# Run database migrations
npx sequelize-cli db:migrate

` : ''}# Start development server
npm run dev
\`\`\`

## Project Structure

\`\`\`
src/
├── config/          # Configuration files
│   ├── env.${ext}         # Environment constants
│   ├── database.${ext}    # Database connection
${logger !== 'None' ? `│   └── logger.${ext}       # Logger setup\n` : ''}├── routes/          # API routes
├── controllers/     # Route controllers
├── services/        # Business logic
├── models/          # Database models
${validation !== 'none' ? `├── validators/      # Request validators\n` : ''}├── middlewares/     # Custom middleware
├── utils/           # Utility functions
${errorHandling ? `│   ├── AppError.${ext}    # Custom error class
│   └── response.${ext}    # Response helpers
` : ''}├── app.${ext}            # Express app
└── server.${ext}         # Server entry point
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm start\` - Start production server
${isTS ? '- `npm run build` - Build TypeScript\n' : ''}${database === 'postgresql' || database === 'mysql' ? `- \`npm run db:migrate\` - Run database migrations
- \`npm run db:migrate:undo\` - Undo last migration
- \`npm run db:seed\` - Run database seeders
` : ''}
## API Endpoints

### Health Check
\`\`\`
GET /
\`\`\`

Add your routes in \`src/routes/\`

${errorHandling ? `## Error Handling

The project includes:
- \`AppError\` class for consistent error handling
- \`successResponse\` helper for success responses
- \`errorResponse\` helper for error responses

Example usage:

\`\`\`${ext}
import { AppError } from './utils/AppError';
import { successResponse, errorResponse } from './utils/response';

// Throw custom error
throw new AppError('User not found', 404);

// Success response
successResponse(res, data, 'User created', 201);

// Error response
errorResponse(res, 'Invalid input', 400);
\`\`\`

` : ''}${database === 'postgresql' || database === 'mysql' ? `## Database Migrations

Create a new migration:

\`\`\`bash
npx sequelize-cli migration:generate --name create-users-table
\`\`\`

Run migrations:

\`\`\`bash
npm run db:migrate
\`\`\`

` : ''}${docker ? `## Docker

\`\`\`bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down
\`\`\`

` : ''}## Environment Variables

See \`.env.example\` for all available environment variables.

## License

MIT
`;

  writeFile(path.join(projectPath, 'README.md'), readmeContent);

  // ============================================================
  // 16. TYPES (if TypeScript)
  // ============================================================
  if (isTS) {
    writeFile(path.join(projectPath, 'src/types/index.ts'), `// Add your TypeScript types and interfaces here

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
`);
  }
}

module.exports = { createProject };