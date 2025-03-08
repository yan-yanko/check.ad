import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

// יצירת לקוח Google Ads
const getGoogleAdsClient = async (userId: string) => {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account) {
    throw new Error("לא נמצא חשבון Google מחובר");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  return google.ads({
    version: "v12",
    auth: oauth2Client,
  });
};

// קבלת נתוני קמפיינים ומדדי ביצוע
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }

    const googleAds = await getGoogleAdsClient(user.id);
    
    // קבלת נתוני קמפיינים
    const campaigns = await googleAds.customers.campaigns.list({
      customerId: user.id,
    });

    // קבלת מדדי ביצוע מורחבים לכל קמפיין
    const campaignsWithMetrics = await Promise.all(
      campaigns.data.campaigns?.map(async (campaign) => {
        const metrics = await googleAds.customers.campaignMetrics.get({
          customerId: user.id,
          campaignId: campaign.id,
          metrics: [
            'impressions',
            'clicks',
            'conversions',
            'costMicros',
            'averageCpc',
            'ctr',
            'conversionRate'
          ]
        });

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          budget: parseFloat(campaign.budget?.amountMicros!) / 1000000,
          metrics: metrics.data,
          targeting: campaign.targetingSettings,
          adGroups: campaign.adGroups,
          startDate: campaign.startDate,
          endDate: campaign.endDate
        };
      }) || []
    );

    return NextResponse.json(campaignsWithMetrics);
  } catch (error) {
    console.error("שגיאה בקבלת נתוני קמפיינים:", error);
    return NextResponse.json(
      { error: "שגיאה בקבלת נתוני הקמפיינים" },
      { status: 500 }
    );
  }
}

// יצירת קמפיין חדש
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }

    const data = await request.json();
    const { name, budget, targeting } = data;

    const googleAds = await getGoogleAdsClient(user.id);

    // יצירת קמפיין חדש ב-Google Ads
    const campaign = await googleAds.customers.campaigns.create({
      customerId: user.id,
      requestBody: {
        name,
        budget: {
          amountMicros: budget * 1000000,
          deliveryMethod: "STANDARD",
        },
        targetSpend: {
          cpcBidCeilingMicros: targeting.maxCpc * 1000000,
        },
        // הגדרות נוספות לפי הצורך
      },
    });

    // שמירת הקמפיין בדאטהבייס
    const savedCampaign = await prisma.campaign.create({
      data: {
        id: campaign.data.id!,
        name: campaign.data.name!,
        platform: "google",
        status: campaign.data.status!,
        budget: budget,
        spend: 0,
        userId: user.id,
      },
    });

    return NextResponse.json(savedCampaign);
  } catch (error) {
    console.error("שגיאה ביצירת קמפיין:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת הקמפיין" },
      { status: 500 }
    );
  }
} 