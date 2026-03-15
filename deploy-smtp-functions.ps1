Write-Host "Deploying SMTP Functions to Supabase..." -ForegroundColor Green
Write-Host ""

Write-Host "First, login to Supabase:" -ForegroundColor Yellow
npx supabase@latest login
Write-Host ""

Write-Host "Deploying test-smtp function..." -ForegroundColor Yellow
npx supabase@latest functions deploy test-smtp
Write-Host ""

Write-Host "Deploying send-email function..." -ForegroundColor Yellow
npx supabase@latest functions deploy send-email
Write-Host ""

Write-Host "Deployment complete!" -ForegroundColor Green
Read-Host "Press Enter to exit"
