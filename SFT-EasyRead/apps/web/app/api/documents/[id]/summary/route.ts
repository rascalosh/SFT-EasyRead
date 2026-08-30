import { NextResponse } from "next/server"
import { getCurrentUser } from "@repo/web/proxy"
import { summarizeDocument } from "@repo/web/services/summary.service"

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const summary = await summarizeDocument(id, user.id);

        return NextResponse.json(summary, {
            status: 201,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { message: "Failed to summarize document" },
            { status: 500 }
        );
    }
}