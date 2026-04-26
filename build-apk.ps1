# CAF Pharmacy APK Build Script
# This script automates the APK build process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CAF Pharmacy APK Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the frontend directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the frontend directory" -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Please edit .env file with your production API URL before continuing!" -ForegroundColor Yellow
    Write-Host "Press any key to continue after editing .env..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Check if keystore.properties exists
if (-not (Test-Path "android/keystore.properties")) {
    Write-Host "Error: android/keystore.properties not found!" -ForegroundColor Red
    Write-Host "Please follow these steps:" -ForegroundColor Yellow
    Write-Host "1. Generate keystore: keytool -genkeypair -v -keystore release-key.jks -alias caf_release -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor Yellow
    Write-Host "2. Copy android/keystore.properties.example to android/keystore.properties" -ForegroundColor Yellow
    Write-Host "3. Edit android/keystore.properties with your keystore details" -ForegroundColor Yellow
    exit 1
}

# Check ANDROID_HOME
if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
    Write-Host "Warning: ANDROID_HOME or ANDROID_SDK_ROOT not set!" -ForegroundColor Yellow
    Write-Host "Please set it to your Android SDK location, e.g.:" -ForegroundColor Yellow
    Write-Host '$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"' -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Do you want to continue anyway? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "y") {
        exit 1
    }
}

Write-Host "Step 1: Installing dependencies..." -ForegroundColor Green
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Building React app..." -ForegroundColor Green
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to build React app" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Syncing with Capacitor..." -ForegroundColor Green
pnpm exec cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to sync with Capacitor" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Building signed APK..." -ForegroundColor Green
.\android\gradlew.bat -p android assembleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to build APK" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your APK is ready at:" -ForegroundColor Cyan
Write-Host "android/app/build/outputs/apk/release/app-release.apk" -ForegroundColor Yellow
Write-Host ""

# Get APK size
$apkPath = "android/app/build/outputs/apk/release/app-release.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Copy the APK to your Android device" -ForegroundColor White
Write-Host "2. Install it (you may need to allow installation from unknown sources)" -ForegroundColor White
Write-Host "3. Test all features with your production backend" -ForegroundColor White
Write-Host ""
Write-Host "Or install via ADB:" -ForegroundColor Green
Write-Host "adb install $apkPath" -ForegroundColor Yellow
Write-Host ""
