import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ categories, tags });
}
