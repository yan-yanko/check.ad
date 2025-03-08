# Marketing QA SaaS

מערכת חכמה לבקרת איכות ואופטימיזציה של קמפיינים שיווקיים, מבוססת AI.

## תכונות עיקריות

- 🤖 בדיקות אוטומטיות של קמפיינים פרסומיים
- 💡 הצעות חכמות לתיקון בעיות מבוססות AI
- 📊 דשבורד מרכזי לניהול כל הפלטפורמות
- 🔍 זיהוי דליפות תקציב
- 📈 ניתוח ביצועים בזמן אמת
- 📱 תמיכה בפלטפורמות:
  - Google Ads
  - Facebook/Meta Ads
  - LinkedIn Ads

## התקנה

1. התקן את הדרישות:
```bash
npm install
```

2. הגדר את משתני הסביבה:
```bash
cp .env.example .env
```
עדכן את הערכים ב-.env עם המפתחות שלך.

3. הפעל את הדאטהבייס:
```bash
npx prisma migrate dev
```

4. הפעל את השרת:
```bash
npm run dev
```

## טכנולוגיות

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Prisma
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4
- **Authentication**: NextAuth.js
- **Analytics**: Google Analytics

## תרומה

מוזמנים לתרום! אנא קראו את [CONTRIBUTING.md](CONTRIBUTING.md) למידע נוסף.

## רישיון

MIT 