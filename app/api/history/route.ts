import { NextResponse } from "next/server";
import { getGenerations } from "@/lib/supabase";

export async function GET() {
  try {
    const generations = await getGenerations(50);
    return NextResponse.json({ success: true, generations });
  } catch (error) {
    console.error("이력 조회 오류:", error);
    return NextResponse.json(
      { error: "이력 조회 실패" },
      { status: 500 }
    );
  }
}
