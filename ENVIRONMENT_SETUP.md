# Environment Variables Setup Guide

This project now uses `.env` files for configuration instead of relying on Replit's built-in secrets.

## Files Created

### `.env.example`
Template file showing all required environment variables. Safe to commit to version control.

### `.env` (You need to create this)
Your actual environment variables file. **Never commit this file** - it's added to `.gitignore`.

## Required Environment Variables

### Database Configuration
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name
```

### Authentication Configuration
```
SESSION_SECRET=your-secure-session-secret-here
REPLIT_DOMAINS=localhost:5000,yourdomain.com
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id-here
```

### Email Configuration (Optional)
```
SENDGRID_API_KEY=your-sendgrid-api-key-here
```

### Server Configuration
```
NODE_ENV=development
PORT=5000
```

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   - Replace database credentials with your PostgreSQL connection details
   - Set a secure SESSION_SECRET (use a random string generator)
   - Update REPLIT_DOMAINS with your actual domains
   - Add your REPL_ID from Replit
   - Add SENDGRID_API_KEY if you want email functionality

3. The application will automatically load these variables on startup.

## Security Notes

- The `.env` file is automatically excluded from version control
- Never commit sensitive data like API keys or passwords
- Use `.env.example` to document required variables for team members
- In production, use secure environment variable injection instead of files

## What Changed

- Added `dotenv` package for environment file loading
- Updated server startup to load `.env` files automatically
- All authentication, database, and email configurations now read from environment files
- Added proper `.gitignore` rules to protect sensitive data