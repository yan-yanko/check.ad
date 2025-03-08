import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CampaignMetrics {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spend: number;
  conversions: number;
  status: string;
}

interface IssueDetection {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedFix: string;
}

export async function analyzeCampaign(metrics: CampaignMetrics): Promise<IssueDetection[]> {
  const issues: IssueDetection[] = [];

  // בדיקת ניצול תקציב
  const budgetUtilization = (metrics.spend / metrics.budget) * 100;
  if (metrics.status === 'ENABLED') {
    if (metrics.spend === 0) {
      issues.push({
        type: 'תקציב לא מנוצל',
        description: `הקמפיין "${metrics.name}" פעיל אך לא מנצל תקציב`,
        severity: 'high',
        suggestedFix: 'בדוק את הגדרות הקהל, המודעות והמכרז. ייתכן שהמכרז נמוך מדי או שהקהל מצומצם מדי.',
      });
    } else if (budgetUtilization < 80) {
      issues.push({
        type: 'ניצול תקציב נמוך',
        description: `הקמפיין מנצל רק ${budgetUtilization.toFixed(1)}% מהתקציב היומי`,
        severity: 'medium',
        suggestedFix: 'שקול להגדיל את המכרז או להרחיב את קהל היעד כדי להגדיל את החשיפה.',
      });
    }
  }

  // בדיקת המרות
  if (metrics.spend > 0) {
    const costPerConversion = metrics.conversions > 0 ? metrics.spend / metrics.conversions : Infinity;
    
    if (metrics.conversions === 0) {
      issues.push({
        type: 'אין המרות',
        description: `הקמפיין "${metrics.name}" הוציא ${metrics.spend}₪ ללא המרות`,
        severity: 'high',
        suggestedFix: 'בדוק את דפי הנחיתה, הגדרות המעקב אחר המרות, והתאמת המודעות לקהל היעד.',
      });
    } else if (costPerConversion > metrics.budget * 0.3) {
      issues.push({
        type: 'עלות המרה גבוהה',
        description: `עלות ההמרה (${costPerConversion.toFixed(2)}₪) גבוהה מדי ביחס לתקציב`,
        severity: 'medium',
        suggestedFix: 'בדוק את איכות התנועה, התאמת המודעות לקהל, ואופטימיזציה של דפי הנחיתה.',
      });
    }
  }

  // בדיקת סטטוס קמפיין
  if (metrics.status === 'ENABLED' && metrics.spend >= metrics.budget * 0.95) {
    issues.push({
      type: 'תקציב עומד להסתיים',
      description: 'הקמפיין קרוב לניצול מלא של התקציב היומי',
      severity: 'low',
      suggestedFix: 'שקול להגדיל את התקציב אם הקמפיין מביא תוצאות טובות.',
    });
  }

  // ניתוח מתקדם באמצעות AI
  const prompt = `
  נתח את הביצועים של הקמפיין הבא ומצא בעיות והזדמנויות לשיפור:
  
  שם: ${metrics.name}
  פלטפורמה: ${metrics.platform}
  תקציב: ${metrics.budget}₪
  הוצאה: ${metrics.spend}₪
  המרות: ${metrics.conversions}
  סטטוס: ${metrics.status}
  ניצול תקציב: ${budgetUtilization.toFixed(1)}%
  עלות להמרה: ${metrics.conversions > 0 ? (metrics.spend / metrics.conversions).toFixed(2) : 'אין המרות'}₪
  
  אנא התייחס ל:
  1. האם הקמפיין מנצל את התקציב באופן יעיל?
  2. האם יש סימנים לבעיות בקהל היעד?
  3. האם עלות ההמרה סבירה לתחום?
  4. מה ההזדמנויות העיקריות לשיפור?
  5. האם יש המלצות ספציפיות לאופטימיזציה?
  
  תן תשובה קצרה וממוקדת עם המלצות מעשיות.
  `;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "אתה מומחה לניתוח קמפיינים פרסומיים עם ניסיון רב בזיהוי בעיות והזדמנויות לשיפור. התמקד בתובנות מעשיות שניתן ליישם.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiSuggestions = aiResponse.choices[0].message.content;
    if (aiSuggestions) {
      // שמירת הניתוח בדאטהבייס
      await prisma.campaignAnalysis.create({
        data: {
          campaignId: metrics.id,
          analysis: aiSuggestions,
          createdAt: new Date(),
          metrics: {
            budgetUtilization,
            costPerConversion: metrics.conversions > 0 ? metrics.spend / metrics.conversions : 0,
            totalSpend: metrics.spend,
            conversions: metrics.conversions
          }
        },
      });

      // הוספת התובנות לרשימת הבעיות
      issues.push({
        type: 'ניתוח AI',
        description: aiSuggestions,
        severity: 'medium',
        suggestedFix: 'ראה את ההמלצות המפורטות למעלה',
      });
    }
  } catch (error) {
    console.error('שגיאה בניתוח AI:', error);
    issues.push({
      type: 'שגיאת ניתוח',
      description: 'לא ניתן היה להשלים את הניתוח המתקדם',
      severity: 'low',
      suggestedFix: 'נסה שוב מאוחר יותר או פנה לתמיכה.',
    });
  }

  return issues;
} 