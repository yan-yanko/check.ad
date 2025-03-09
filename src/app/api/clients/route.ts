import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// קבלת כל הלקוחות של המשתמש
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

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      include: {
        accounts: {
          include: {
            campaigns: true,
          },
        },
        issues: true,
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("שגיאה בקבלת לקוחות:", error);
    return NextResponse.json(
      { error: "שגיאה בקבלת הלקוחות" },
      { status: 500 }
    );
  }
}

// יצירת לקוח חדש
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
    const { name, logo } = data;

    const client = await prisma.client.create({
      data: {
        name,
        logo,
        userId: user.id,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("שגיאה ביצירת לקוח:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת הלקוח" },
      { status: 500 }
    );
  }
}

// עדכון לקוח קיים
export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }

    const data = await request.json();
    const { id, name, logo } = data;

    const client = await prisma.client.update({
      where: { id },
      data: { name, logo },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("שגיאה בעדכון לקוח:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון הלקוח" },
      { status: 500 }
    );
  }
}

// מחיקת לקוח
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "חסר מזהה לקוח" }, { status: 400 });
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("שגיאה במחיקת לקוח:", error);
    return NextResponse.json(
      { error: "שגיאה במחיקת הלקוח" },
      { status: 500 }
    );
  }
} 