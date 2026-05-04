# IT Access Manager - Version Android

## Vue d'ensemble

Ce projet a été configuré pour générer une application Android APK à partir de votre application web React existante en utilisant Capacitor.

## Étapes pour générer l'APK

### 1. Installer les dépendances

```bash
npm install
```

### 2. Build de l'application

```bash
npm run build
```

### 3. Synchroniser avec Android

```bash
npx cap sync android
```

### 4. Ouvrir Android Studio

```bash
npx cap open android
```

### 5. Générer l'APK dans Android Studio

1. Android Studio s'ouvrira
2. Attendez que Gradle sync se termine
3. Allez dans: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. L'APK sera dans: `android/app/build/outputs/apk/debug/app-debug.apk`

## Script automatisé (Windows)

Double-cliquez sur `build-android.bat` pour automatiser les étapes 1-4.

## Prérequis

- Node.js v16+
- Java JDK 17+
- Android Studio avec SDK Android
- Voir `ANDROID_BUILD.md` pour les détails complets

## Configuration

- **App ID**: com.itaccess.manager
- **App Name**: IT Access Manager
- **Min SDK**: 24 (Android 7.0+)
- **Target SDK**: 34 (Android 14)

## Personnalisation

- Modifier `capacitor.config.ts` pour changer l'app ID ou le nom
- Modifier `android/app/src/main/res/values/strings.xml` pour le nom affiché
- Remplacer les icônes dans `android/app/src/main/res/mipmap-*`

## Documentation complète

Voir `ANDROID_BUILD.md` pour une documentation détaillée du build Android.
