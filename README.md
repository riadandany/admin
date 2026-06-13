# RYNC DRAW

موقع رسم في الهواء بحركة اليد (HTML/CSS/JS فقط).

## النشر على Vercel
1. فك ضغط الملف.
2. ادخل على https://vercel.com/new
3. اسحب المجلد كاملاً (أو ارفعه على GitHub ثم Import).
4. Vercel سيكتشف أنه موقع ثابت تلقائياً — اضغط Deploy.

## التشغيل محلياً
افتح `index.html` عبر خادم محلي (الكاميرا تتطلب HTTPS أو localhost):
```
npx serve .
```

## الملفات
- `index.html` — الهيكل
- `style.css`  — التصميم الفخم
- `script.js`  — تتبع اليد + الرسم (MediaPipe Hands عبر CDN)
- `logo.png`   — شعار RYNC
- `vercel.json` — إعدادات النشر
