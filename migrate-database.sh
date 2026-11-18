#!/bin/bash

# Database Migration Script - Ensure pending_registrations table exists
# This script checks if critical tables exist and creates them if missing

echo "🔍 Checking database tables..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo "💡 Please create .env.production with TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Check if required environment variables are set
if [ -z "$TURSO_CONNECTION_URL" ] || [ -z "$TURSO_AUTH_TOKEN" ]; then
    echo "❌ Error: TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN not set in .env.production"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Push schema to database using drizzle-kit
echo "📦 Pushing schema to database..."
echo "This will create/update all tables defined in src/db/schema.ts"
echo ""

npm run db:push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema synchronized successfully!"
    echo "📋 The following tables should now be available:"
    echo "   - pending_registrations"
    echo "   - users"
    echo "   - jobs"
    echo "   - And all other schema-defined tables"
else
    echo ""
    echo "❌ Database push failed"
    echo "💡 Try running: npm install && npm run db:push"
    exit 1
fi

echo ""
echo "✨ Database migration complete!"
