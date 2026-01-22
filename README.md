# Fuel Gambia Mobile App

A production-ready React Native mobile application for a government fuel subsidy and commercial fuel platform in The Gambia.

## Features

### Three User Types

1. **Fuel Beneficiary (Government Employee)**
   - Document upload and verification
   - Monthly fuel allocation tracking
   - QR code generation for subsidized fuel
   - Transaction history

2. **Normal User (Commercial Customer)**
   - Fuel purchase with payment integration
   - QR code generation after payment
   - Transaction history
   - Payment methods (Mobile Money, Card, Bank Transfer)

3. **Fuel Station Attendant**
   - QR code scanner for customer coupons
   - Coupon validation
   - Fuel dispensing and allocation
   - Inventory management
   - Transaction receipts

## Tech Stack

- **React Native** (Expo)
- **TypeScript**
- **React Navigation** (Stack + Tabs)
- **Zustand** (State Management)
- **Axios** (API Client)
- **React Query** (Server State)
- **React Hook Form + Zod** (Form Validation)
- **react-native-vision-camera** (QR Scanning)
- **react-native-qrcode-svg** (QR Generation)
- **MMKV** (Local Storage)
- **SQLite** (Offline Queue)
- **Firebase Auth** (OTP Login)
- **Firebase Cloud Messaging** (Push Notifications)

## Project Structure

```
/src
  /app
    App.tsx
    index.tsx
  /navigation
    RootNavigator.tsx
    AuthNavigator.tsx
    BeneficiaryNavigator.tsx
    CustomerNavigator.tsx
    AttendantNavigator.tsx
  /features
    /auth
      SignupScreen.tsx
      LoginScreen.tsx
      OTPScreen.tsx
      ProfileScreen.tsx
    /onboarding
      OnboardingScreen.tsx
    /beneficiary
      BeneficiaryDashboard.tsx
      DocumentUploadScreen.tsx
      VerificationStatusScreen.tsx
    /customer
      CustomerDashboard.tsx
      FuelPurchaseScreen.tsx
    /attendant
      AttendantDashboard.tsx
      CouponValidationScreen.tsx
      FuelAllocationScreen.tsx
      ReceiptScreen.tsx
    /payments
      PaymentScreen.tsx
    /qr
      QRCodeScreen.tsx
      QRScannerScreen.tsx
    /inventory
      InventoryScreen.tsx
    /notifications
      NotificationsScreen.tsx
    /transactions
      TransactionHistoryScreen.tsx
  /components
    /ui
      Button.tsx
      Input.tsx
      Card.tsx
      Loading.tsx
    QRCode.tsx
  /services
    api.ts
    authService.ts
    userService.ts
    beneficiaryService.ts
    paymentService.ts
    transactionService.ts
    inventoryService.ts
    notificationService.ts
  /store
    authStore.ts
    beneficiaryStore.ts
    customerStore.ts
    attendantStore.ts
    notificationStore.ts
    index.ts
  /utils
    constants.ts
    storage.ts
    qr.ts
    validation.ts
    format.ts
    offlineQueue.ts
  /types
    index.ts
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install iOS pods (iOS only):
```bash
cd ios && pod install && cd ..
```

3. Start the development server:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Android:
```bash
npm run android
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```
API_BASE_URL=http://localhost:3000/api
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
```

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Phone Number)
3. Enable Cloud Messaging
4. Add your app's bundle identifier
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

## Features Implementation

### Authentication Flow

1. **Signup**: User selects role (Beneficiary, Customer, Attendant)
2. **Login**: Phone number + OTP verification
3. **Role-based Navigation**: Different navigators based on user role

### QR Code System

- **Subsidy QR**: Contains user ID, coupon ID, fuel type, remaining amount, expiry
- **Paid QR**: Contains transaction ID, fuel type, paid amount, expiry
- QR codes expire after 30 days (subsidy) or 24 hours (paid)

### Payment Integration

- Mock payment flow implemented
- Ready for Flutterwave/Paystack integration
- Supports Mobile Money, Card, and Bank Transfer

### Offline Mode

- SQLite queue for failed operations
- Automatic retry when online
- Inventory sync queue

## API Integration

All API services are currently using mock implementations. Replace mock functions in `/src/services` with actual API calls:

```typescript
// Example: authService.ts
async verifyOTP(phoneNumber: string, otp: string): Promise<AuthResponse | null> {
  const response = await apiClient.post<AuthResponse>('/auth/verify-otp', {
    phoneNumber,
    otp,
  });
  return response.success && response.data ? response.data : null;
}
```

## Security

- Token-based authentication
- Encrypted local storage (MMKV)
- Role-based navigation guards
- QR payload validation
- Device binding for attendants

## UI/UX

- Modern, premium design
- iOS and Android native feel
- Smooth animations and transitions
- Accessible components
- Error handling and loading states

## Testing

```bash
# Run linter
npm run lint

# Run tests (when implemented)
npm test
```

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Contributing

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Implement proper error handling
4. Add loading states for async operations
5. Follow the existing code structure

## License

Private - Fuel Gambia Platform

## Support

For issues and questions, please contact the development team.
