AL SAYYED POULTRY v1.1 — cloud sync ke saath

PEHLE (sirf ek dafa) Firebase rules mein poultry ki ijazat dein:
 Firebase Console > al-sayyed-mobile > Firestore Database > Rules
 Maujooda rules ko DELETE na karein. "match /databases/{database}/documents {" ke andar,
 shops wale hisse ke neeche, ye add karein, phir Publish:

    match /poultry/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

DEPLOY: is zip ki saari files (index.html, sw.js, manifest.json, _headers, icons) upload karein.
UPDATE: version number index.html (VER) aur sw.js (CACHE) dono mein barhayen.
APP MEIN: Aur > Cloud Sync > email + password > Login. Doosre phone par bhi isi email se login karein.
