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
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { smtpConfig, to, subject, htmlContent, textContent } = await req.json()

    // Validate required fields
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !to || !subject) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid recipient email address' }),
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

    // Prepare mail options
    const mailOptions: any = {
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: to,
      subject: subject,
      html: htmlContent || `<p>${textContent || ''}</p>`,
      text: textContent || htmlContent?.replace(/<[^>]*>/g, '') || ''
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
        message: `Email sent successfully to ${to}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Email send error:', error)
    
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Failed to send email: ${errorMessage}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
