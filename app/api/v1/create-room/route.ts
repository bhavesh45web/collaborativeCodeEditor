import {NextRequest, NextResponse} from "next/server";

export const rooms: Map<string, Set<String>> = new Map<string, Set<String>>();

export async function POST(req: NextRequest) {
    const body = await req.json();

    if (rooms.has(body.roomNo)) {
        return NextResponse.json({ error: "Room already exists" }, { status: 409 });
    }

    rooms.set(body.roomNo, new Set());

    console.log(rooms);

    return NextResponse.json({ message: "Room created successfully" }, { status: 201 });
}
