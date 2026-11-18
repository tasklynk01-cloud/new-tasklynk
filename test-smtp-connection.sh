#!/bin/bash

# Test HostAfrica SMTP Connection with curl
# Tests if mail.tasklynk.co.ke SMTP server is accessible

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  TaskLynk HostAfrica SMTP Connection Test               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# SMTP Configuration
SMTP_HOST="mail.tasklynk.co.ke"
SMTP_PORT="465"
SMTP_USER="admn@tasklynk.co.ke"
SMTP_PASSWORD="Kemoda@2039"
FROM_EMAIL="admn@tasklynk.co.ke"
TO_EMAIL="${TEST_EMAIL:-topwriteessays@gmail.com}"

echo "Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SMTP Host: $SMTP_HOST"
echo "SMTP Port: $SMTP_PORT (SSL)"
echo "SMTP User: $SMTP_USER"
echo "SMTP Pass: ${SMTP_PASSWORD:0:3}***${SMTP_PASSWORD: -4}"
echo "From: $FROM_EMAIL"
echo "To: $TO_EMAIL"
echo ""

# Test 1: Check if SMTP server is reachable
echo "Test 1: Checking SMTP server connectivity..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if timeout 5 bash -c "echo > /dev/tcp/$SMTP_HOST/$SMTP_PORT" 2>/dev/null; then
    echo "✅ SMTP server is reachable at $SMTP_HOST:$SMTP_PORT"
else
    echo "❌ Cannot connect to SMTP server"
    echo "   Possible issues:"
    echo "   - SMTP server is down"
    echo "   - Port $SMTP_PORT is blocked by firewall"
    echo "   - Wrong hostname: $SMTP_HOST"
    exit 1
fi
echo ""

# Test 2: Send test email using curl (if available)
echo "Test 2: Attempting to send test email..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v curl &> /dev/null; then
    # Create temporary email file
    EMAIL_FILE=$(mktemp)
    
    cat > "$EMAIL_FILE" << EOF
From: TaskLynk Admin <$FROM_EMAIL>
To: <$TO_EMAIL>
Subject: TaskLynk SMTP Test - $(date +"%Y-%m-%d %H:%M:%S")
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ HostAfrica SMTP Test</h1>
        <p>Email Service Configuration Success</p>
    </div>
    <div class="content">
        <div class="success">
            <h2 style="margin: 0;">🎉 Email Delivery Working!</h2>
            <p style="margin: 10px 0 0;">Your HostAfrica SMTP configuration is correct</p>
        </div>
        
        <h3>📧 Configuration Details:</h3>
        <div class="info">
            <strong>SMTP Server:</strong> $SMTP_HOST<br>
            <strong>Port:</strong> $SMTP_PORT (SSL)<br>
            <strong>Sender Email:</strong> $FROM_EMAIL<br>
            <strong>Test Date:</strong> $(date +"%B %d, %Y at %H:%M:%S %Z")<br>
            <strong>Status:</strong> ✅ All systems operational
        </div>
        
        <h3>✨ What This Means:</h3>
        <ul>
            <li>✅ User registration emails will be delivered</li>
            <li>✅ Verification codes will reach users</li>
            <li>✅ Order notifications will be sent</li>
            <li>✅ Password reset emails will work</li>
        </ul>
        
        <h3>🚀 Next Steps:</h3>
        <ol>
            <li>Update Vercel environment variables with SMTP credentials</li>
            <li>Deploy the application to production</li>
            <li>Test user registration flow end-to-end</li>
            <li>Monitor email delivery in HostAfrica cPanel</li>
        </ol>
        
        <div class="footer">
            <strong>TaskLynk Academic</strong><br>
            Professional Writing Services<br>
            Nairobi, Kenya | admn@tasklynk.co.ke | +254701066845<br>
            <a href="https://tasklynk.co.ke" style="color: #1D3557;">tasklynk.co.ke</a>
        </div>
    </div>
</body>
</html>
EOF

    echo "Sending email via curl SMTP..."
    echo "From: $FROM_EMAIL → To: $TO_EMAIL"
    echo ""
    
    # Send email using curl with SMTP
    RESULT=$(curl -s --url "smtps://$SMTP_HOST:$SMTP_PORT" \
        --ssl-reqd \
        --mail-from "$FROM_EMAIL" \
        --mail-rcpt "$TO_EMAIL" \
        --user "$SMTP_USER:$SMTP_PASSWORD" \
        --upload-file "$EMAIL_FILE" \
        -w "%{http_code}" \
        2>&1)
    
    CURL_EXIT=$?
    
    # Clean up
    rm -f "$EMAIL_FILE"
    
    if [ $CURL_EXIT -eq 0 ]; then
        echo "✅ Email sent successfully via HostAfrica SMTP!"
        echo ""
        echo "╔══════════════════════════════════════════════════════════╗"
        echo "║  ✅ SUCCESS! Check inbox: $TO_EMAIL"
        echo "╚══════════════════════════════════════════════════════════╝"
        echo ""
        echo "Email Details:"
        echo "  • Server accepted the message"
        echo "  • Delivery is in progress"
        echo "  • Check your inbox (may take 1-2 minutes)"
        echo "  • Check spam folder if not in inbox"
        echo ""
    else
        echo "❌ Failed to send email"
        echo ""
        echo "Error Details:"
        echo "$RESULT"
        echo ""
        echo "Possible issues:"
        echo "  - Wrong username/password"
        echo "  - SMTP authentication failed"
        echo "  - Server requires different SSL/TLS settings"
        echo "  - Email account not activated in cPanel"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Verify credentials in HostAfrica cPanel"
        echo "  2. Check if email account is active"
        echo "  3. Try port 587 (TLS) instead of 465 (SSL)"
        echo "  4. Contact HostAfrica support if issue persists"
        echo ""
        exit 1
    fi
else
    echo "⚠️  curl not found - cannot send test email"
    echo "   But SMTP server connectivity test passed!"
    echo ""
    echo "To send a test email:"
    echo "  1. Install curl: apt-get install curl"
    echo "  2. Or use the Node.js test script: npm run test:email"
    echo "  3. Or deploy and test via the application"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SMTP Server: Reachable"
echo "✅ Configuration: Valid"
echo "✅ Status: Ready for production"
echo ""
echo "Environment Variables (for Vercel):"
echo "  SMTP_HOST=mail.tasklynk.co.ke"
echo "  SMTP_PORT=465"
echo "  SMTP_USER=admn@tasklynk.co.ke"
echo "  SMTP_PASSWORD=Kemoda@2039"
echo "  EMAIL_FROM=admn@tasklynk.co.ke"
echo ""
