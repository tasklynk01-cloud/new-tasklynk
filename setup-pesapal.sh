#!/bin/bash

# Pesapal Quick Setup Script
# This script helps configure Pesapal environment variables

echo "========================================="
echo "  PESAPAL CONFIGURATION SETUP"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
fi

# Backup existing .env
cp .env .env.backup
echo "✅ Backup created: .env.backup"
echo ""

# Your credentials
CONSUMER_KEY="mQHar5k8QPNFTzfy6tJc77baFchUn48t"
CONSUMER_SECRET="sXoImQmH0WQMtoUvlFjKluKlVQs="
IPN_ID="a0dc42d6-ee78-4bcf-9d98-db00bffce0fc"
BASE_URL="https://pay.pesapal.com"

echo "📝 Configuring Pesapal credentials..."
echo ""

# Function to update or add environment variable
update_env_var() {
    local key=$1
    local value=$2
    local file=".env"
    
    if grep -q "^${key}=" "$file"; then
        # Update existing
        sed -i "s|^${key}=.*|${key}=\"${value}\"|" "$file"
        echo "  ✓ Updated ${key}"
    elif grep -q "^#${key}=" "$file"; then
        # Uncomment and update
        sed -i "s|^#${key}=.*|${key}=\"${value}\"|" "$file"
        echo "  ✓ Uncommented and set ${key}"
    else
        # Add new
        echo "${key}=\"${value}\"" >> "$file"
        echo "  ✓ Added ${key}"
    fi
}

# Update Pesapal variables
update_env_var "PESAPAL_CONSUMER_KEY" "$CONSUMER_KEY"
update_env_var "PESAPAL_CONSUMER_SECRET" "$CONSUMER_SECRET"
update_env_var "PESAPAL_IPN_ID" "$IPN_ID"
update_env_var "PESAPAL_BASE_URL" "$BASE_URL"

echo ""
echo "========================================="
echo "  ✅ CONFIGURATION COMPLETE"
echo "========================================="
echo ""
echo "Configured:"
echo "  • PESAPAL_CONSUMER_KEY"
echo "  • PESAPAL_CONSUMER_SECRET"
echo "  • PESAPAL_IPN_ID"
echo "  • PESAPAL_BASE_URL"
echo ""
echo "Optional (for production):"
echo "  • PESAPAL_WEBHOOK_SECRET (generate with: openssl rand -base64 32)"
echo ""
echo "IPN URL (already registered):"
echo "  https://tasklynk.co.ke/api/v2/payments/pesapal/ipn"
echo ""
echo "Callback URL:"
echo "  https://tasklynk.co.ke/api/v2/payments/pesapal/callback"
echo ""
echo "Next steps:"
echo "  1. Review .env file"
echo "  2. Generate webhook secret (optional but recommended):"
echo "     openssl rand -base64 32"
echo "  3. Add webhook secret to .env:"
echo "     PESAPAL_WEBHOOK_SECRET=\"your-secret-here\""
echo "  4. Configure webhook secret in Pesapal dashboard"
echo "  5. Test payment flow: npm run dev"
echo ""
echo "Documentation: PESAPAL_COMPLETE_SETUP_GUIDE.md"
echo ""
