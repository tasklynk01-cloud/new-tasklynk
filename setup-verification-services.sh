#!/bin/bash

# Environment Setup Helper for TaskLynk
# Helps configure verification services

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  TaskLynk Verification Service Setup Helper              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from .env.production..."
    cp .env.production .env
    echo "✅ .env file created"
    echo ""
fi

# Function to update or add env variable
update_env_var() {
    local key=$1
    local value=$2
    local file=".env"
    
    if grep -q "^${key}=" "$file"; then
        # Update existing
        sed -i "s|^${key}=.*|${key}=${value}|" "$file"
        echo "   ✅ Updated ${key}"
    else
        # Add new
        echo "${key}=${value}" >> "$file"
        echo "   ✅ Added ${key}"
    fi
}

# Check current configuration
echo "Current Configuration Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

source .env

if [ -n "$RESEND_API_KEY" ]; then
    echo "📧 Email Service (Resend): ✅ Configured"
    echo "   Key: ${RESEND_API_KEY:0:10}..."
else
    echo "📧 Email Service (Resend): ❌ Not configured"
fi

if [ -n "$AFRICASTALKING_API_KEY" ]; then
    echo "📱 SMS Service (Africa's Talking): ✅ Configured"
    echo "   Username: $AFRICASTALKING_USERNAME"
else
    echo "📱 SMS Service (Africa's Talking): ❌ Not configured"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask user what they want to configure
echo "What would you like to configure?"
echo ""
echo "1) Email Service (Resend) - Recommended"
echo "2) SMS Service (Africa's Talking) - Fallback"
echo "3) Both Services - Best reliability"
echo "4) Test current configuration"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Email Service Configuration"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Go to: https://resend.com/api-keys"
        echo "2. Sign up or login"
        echo "3. Create a new API key"
        echo "4. Copy the key (starts with 're_')"
        echo ""
        read -p "Enter your Resend API key: " resend_key
        
        if [ -z "$resend_key" ]; then
            echo "❌ No key provided. Exiting."
            exit 1
        fi
        
        update_env_var "RESEND_API_KEY" "$resend_key"
        
        echo ""
        echo "✅ Email service configured!"
        echo ""
        read -p "Would you like to test it now? (y/n): " test_email
        
        if [ "$test_email" = "y" ] || [ "$test_email" = "Y" ]; then
            echo ""
            echo "Testing email service..."
            source .env
            node test-sms-verification.js
        fi
        ;;
        
    2)
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "SMS Service Configuration"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Go to: https://account.africastalking.com/auth/register"
        echo "2. Sign up and verify your email"
        echo "3. Go to Apps → Sandbox (for testing)"
        echo "4. Copy your API Key"
        echo ""
        read -p "Enter your Africa's Talking API key: " at_key
        read -p "Enter your username (default: sandbox): " at_user
        
        if [ -z "$at_user" ]; then
            at_user="sandbox"
        fi
        
        if [ -z "$at_key" ]; then
            echo "❌ No key provided. Exiting."
            exit 1
        fi
        
        update_env_var "AFRICASTALKING_API_KEY" "$at_key"
        update_env_var "AFRICASTALKING_USERNAME" "$at_user"
        
        echo ""
        echo "✅ SMS service configured!"
        echo ""
        read -p "Enter your phone number for testing (e.g., +254712345678): " test_phone
        
        if [ -n "$test_phone" ]; then
            echo ""
            echo "Testing SMS service..."
            export TEST_PHONE="$test_phone"
            source .env
            node test-sms-verification.js
        fi
        ;;
        
    3)
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Both Services Configuration"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        # Email
        echo "📧 Email Service (Resend)"
        echo "Go to: https://resend.com/api-keys"
        echo ""
        read -p "Enter your Resend API key: " resend_key
        
        if [ -n "$resend_key" ]; then
            update_env_var "RESEND_API_KEY" "$resend_key"
            echo ""
        fi
        
        # SMS
        echo ""
        echo "📱 SMS Service (Africa's Talking)"
        echo "Go to: https://account.africastalking.com/"
        echo ""
        read -p "Enter your Africa's Talking API key: " at_key
        read -p "Enter your username (default: sandbox): " at_user
        
        if [ -z "$at_user" ]; then
            at_user="sandbox"
        fi
        
        if [ -n "$at_key" ]; then
            update_env_var "AFRICASTALKING_API_KEY" "$at_key"
            update_env_var "AFRICASTALKING_USERNAME" "$at_user"
        fi
        
        echo ""
        echo "✅ Both services configured!"
        echo ""
        read -p "Would you like to test both? (y/n): " test_both
        
        if [ "$test_both" = "y" ] || [ "$test_both" = "Y" ]; then
            read -p "Enter your phone number for SMS test (e.g., +254712345678): " test_phone
            if [ -n "$test_phone" ]; then
                export TEST_PHONE="$test_phone"
            fi
            echo ""
            echo "Testing services..."
            source .env
            node test-sms-verification.js
        fi
        ;;
        
    4)
        echo ""
        echo "Testing current configuration..."
        echo ""
        source .env
        node test-sms-verification.js
        ;;
        
    5)
        echo ""
        echo "Exiting. No changes made."
        exit 0
        ;;
        
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Restart your application: npm run dev"
echo "2. Test registration: http://localhost:5000/auth/register"
echo "3. Update Vercel environment variables (for production)"
echo ""
echo "For detailed instructions, see: VERIFICATION_SERVICE_SETUP_GUIDE.md"
echo ""
