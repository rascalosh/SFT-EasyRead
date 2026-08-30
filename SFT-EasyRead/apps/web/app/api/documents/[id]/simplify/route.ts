import { NextResponse } from "next/server";
import { simplifyDocument } from "@repo/web/services/simplify.service";
import { getCurrentUser } from "@repo/web/proxy"

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const user = await getCurrentUser();

	if (!user) {
		return NextResponse.json(
			{ message: "Unauthorized" },
			{ status: 401 }
		);
	}

	const { id } = await params;
	const simplification = await simplifyDocument(id, user.id);

	return NextResponse.json(simplification);
}