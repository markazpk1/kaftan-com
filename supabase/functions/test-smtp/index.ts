import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "https://esm.sh/nodemailer@6.9.7"

// @ts-ignore - Deno types
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmtpConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

// @ts-ignore - Deno types
serve(async (req: any) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { smtpConfig, testEmail } = await req.json()

    // Validate required fields
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !testEmail) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required SMTP configuration or test email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid test email address' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create transporter configuration
    const transporterConfig: any = {
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    }

    // Set secure option based on encryption type
    if (smtpConfig.encryption === 'ssl') {
      transporterConfig.secure = true
    } else if (smtpConfig.encryption === 'tls') {
      transporterConfig.secure = false
      transporterConfig.requireTLS = true
    } else {
      transporterConfig.secure = false
    }

    // Create transporter
    const transporter = nodemailer.createTransporter(transporterConfig)

    // Verify connection
    await transporter.verify()

    // Send test email
    const mailOptions = {
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: testEmail,
      subject: 'SMTP Test Email - Fashion Spectrum',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SMTP Test Email</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success {
              color: #28a745;
              font-weight: bold;
            }
            .config-details {
              background: white;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #28a745;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ SMTP Test Successful!</h1>
            <p>Fashion Spectrum Email Configuration</p>
          </div>
          <div class="content">
            <h2 class="success">Connection Test Passed</h2>
            <p>Your SMTP settings are working correctly and this test email was sent successfully.</p>
            
            <div class="config-details">
              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>Host:</strong> ${smtpConfig.host}</li>
                <li><strong>Port:</strong> ${smtpConfig.port}</li>
                <li><strong>Username:</strong> ${smtpConfig.username}</li>
                <li><strong>Encryption:</strong> ${smtpConfig.encryption.toUpperCase()}</li>
                <li><strong>From Email:</strong> ${smtpConfig.fromEmail}</li>
                <li><strong>From Name:</strong> ${smtpConfig.fromName}</li>
              </ul>
            </div>
            
            <p>This is a test email sent from your Fashion Spectrum admin panel to verify that your SMTP configuration is working properly.</p>
            
            <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>This email was sent automatically. Please do not reply to this message.</p>
            <p>© 2024 Fashion Spectrum. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        SMTP Test Email - Fashion Spectrum
        
        ✅ Connection Test Passed!
        
        Your SMTP settings are working correctly and this test email was sent successfully.
        
        Configuration Details:
        - Host: ${smtpConfig.host}
        - Port: ${smtpConfig.port}
        - Username: ${smtpConfig.username}
        - Encryption: ${smtpConfig.encryption.toUpperCase()}
        - From Email: ${smtpConfig.fromEmail}
        - From Name: ${smtpConfig.fromName}
        
        This is a test email sent from your Fashion Spectrum admin panel to verify that your SMTP configuration is working properly.
        
        Test Date: ${new Date().toLocaleString()}
        
        This email was sent automatically. Please do not reply to this message.
        © 2024 Fashion Spectrum. All rights reserved.
      `
    }

    // Add reply-to if specified
    if (smtpConfig.replyTo) {
      // @ts-ignore - Nodemailer supports replyTo
      mailOptions.replyTo = smtpConfig.replyTo
    }

    // Send the email
    await transporter.sendMail(mailOptions)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent successfully to ${testEmail}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('SMTP test error:', error)
    
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `SMTP test failed: ${errorMessage}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
