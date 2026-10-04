# Onion Quality AI - Mobile Application

React Native + Expo mobile client for real-time onion batch assessment, defect inspection, and digital quality certification.

## Features
- **10 Dedicated Screens**:
  1. `Splash`: Agricultural AI branding & neural initialization
  2. `Login`: Inspector authentication, demo access, backend server IP configuration
  3. `Dashboard`: Aggregates Total Assessments, Onions Analyzed, Average Grade A %, Average URS %
  4. `New Assessment`: Lot setup, variety picker, lighting & angle guidelines
  5. `Image Capture`: Camera capture (`expo-camera`/`expo-image-picker`), gallery picker, preview & retake
  6. `AI Processing`: Real network call to `POST http://<BACKEND_URL>/analyze` with step status
  7. `Quality Results`: Displays YOLO counts for the 5 classes (Healthy, Damaged, Rotten, Sprouted, Undersized), percentage distribution, and Grade A / URS badges
  8. `Digital Report`: Official quality inspection certificate with digital signature stamp and export/share capabilities
  9. `Assessment History`: SQLite-backed historical records with search and filter
  10. `Assessment Details`: Detailed past audit inspection view

## Connecting to Backend

In `LoginScreen.tsx` (or `src/api/config.ts`), you can configure the backend URL:
- **Android Emulator**: `http://10.0.2.2:8000` (default for Android)
- **iOS Simulator / Web**: `http://localhost:8000`
- **Physical Phone**: `http://<YOUR_PC_LAN_IP>:8000` (e.g. `http://192.168.1.100:8000`)

The analyze button sends a multipart form request to:
```text
POST http://<BACKEND_URL>/analyze
```

## Running the App

```bash
cd mobile
npm install
npx expo start
```
