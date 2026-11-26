import {NextRequest, NextResponse} from "next/server";

import {rooms} from "@/app/api/v1/create-room/route";

export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!rooms.has(body.roomNo)) {
        return NextResponse.json({ error : "Room does not exists" }, { status: 403 });
    }

    else{
        return NextResponse.json({ message : "Entered in room" }, { status: 201 });
    }

}