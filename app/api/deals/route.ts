import { NextRequest, NextResponse } from "next/server";
import { parseDealQuery, queryDeals } from "@/lib/search";

export function GET(request: NextRequest) {
  const query = parseDealQuery(request.nextUrl.searchParams);
  return NextResponse.json(queryDeals(query));
}
