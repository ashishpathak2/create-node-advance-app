#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const templates = require('../lib/templates');

async function main() {
  const args = process.argv.slice(2);
  const projectName = args[0] || 'my-backend';

  console.log(chalk.cyan.bold('\n🔥 Backend Forge v2.0\n'));

  // Get configuration
  const config = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Select language:',
      choices: ['TypeScript', 'JavaScript'],
      default: 'TypeScript'
    },
    {
      type: 'list',
      name: 'database',
      message: 'Select database:',
      choices: [
        { name: 'MongoDB (Mongoose)', value: 'mongodb' },
        { name: 'PostgreSQL (Sequelize)', value: 'postgresql' },
        { name: 'MySQL (Sequelize)', value: 'mysql' },
        { name: 'None', value: 'none' }
      ],
      default: 'mongodb'
    },
    {
      type: 'confirm',
      name: 'auth',
      message: 'Setup JWT authentication?',
      default: true
    },
    {
      type: 'list',
      name: 'validation',
      message: 'Select validation library:',
      choices: [
        { name: 'Zod (recommended for TypeScript)', value: 'zod' },
        { name: 'Joi', value: 'joi' },
        { name: 'None', value: 'none' }
      ],
      default: 'zod'
    },
    {
      type: 'list',
      name: 'logger',
      message: 'Select logger:',
      choices: ['Winston', 'Pino', 'None'],
      default: 'Winston'
    },
    {
      type: 'confirm',
      name: 'errorHandling',
      message: 'Include AppError and response utilities?',
      default: true
    },
    {
      type: 'confirm',
      name: 'docker',
      message: 'Include Docker support?',
      default: true
    }
  ]);

  config.projectName = projectName;
  config.projectPath = path.join(process.cwd(), projectName);

  // Check if directory exists
  if (fs.existsSync(config.projectPath)) {
    console.log(chalk.red(`\n❌ Directory "${projectName}" already exists!\n`));
    process.exit(1);
  }

  // Display configuration summary
  console.log(chalk.yellow('\n📋 Configuration Summary:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`${chalk.bold('Project:')} ${projectName}`);
  console.log(`${chalk.bold('Language:')} ${config.language}`);
  console.log(`${chalk.bold('Database:')} ${config.database === 'mongodb' ? 'MongoDB (Mongoose)' : config.database === 'postgresql' ? 'PostgreSQL (Sequelize)' : config.database === 'mysql' ? 'MySQL (Sequelize)' : 'None'}`);
  console.log(`${chalk.bold('Auth:')} ${config.auth ? 'JWT ✓' : 'No'}`);
  console.log(`${chalk.bold('Validation:')} ${config.validation === 'none' ? 'None' : config.validation.charAt(0).toUpperCase() + config.validation.slice(1)}`);
  console.log(`${chalk.bold('Logger:')} ${config.logger}`);
  console.log(`${chalk.bold('Error Utils:')} ${config.errorHandling ? '✓' : '✗'}`);
  console.log(`${chalk.bold('Docker:')} ${config.docker ? '✓' : '✗'}`);
  console.log(chalk.gray('─'.repeat(50)));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with this configuration?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('\n❌ Project generation cancelled.\n'));
    process.exit(0);
  }

  try {
    console.log(chalk.yellow('\n📦 Creating project...\n'));

    await templates.createProject(config);

    console.log(chalk.green('✅ Project created successfully!\n'));
    console.log(chalk.white('Next steps:\n'));
    console.log(chalk.gray(`  cd ${projectName}`));
    console.log(chalk.gray('  npm install'));

    if (config.database === 'postgresql' || config.database === 'mysql') {
      console.log(chalk.green('  Create a Database in your DBMS'));
      console.log(chalk.greenBright('  Update database name and credentials in .env'));

      // console.log(chalk.gray('  npx sequelize-cli db:migrate'));
    } else if (config.database === 'mongodb') {
      console.log(chalk.gray('  # Configure MongoDB URI in .env'));
    }

    console.log(chalk.gray('  npm run dev\n'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();