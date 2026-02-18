import {NextRequest} from "next/server";
export async function POST(request: NextRequest) {
    const {messages}= await request.json();
}