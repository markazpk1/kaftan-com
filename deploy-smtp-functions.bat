@echo off
echo Deploying SMTP Functions to Supabase...
echo.

echo First, login to Supabase:
npx supabase@latest login
echo.

echo Deploying test-smtp function...
npx supabase@latest functions deploy test-smtp
echo.

echo Deploying send-email function...
npx supabase@latest functions deploy send-email
echo.

echo Deployment complete!
pause
