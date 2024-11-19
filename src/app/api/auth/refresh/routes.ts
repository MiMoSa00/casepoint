// import { NextRequest, NextResponse } from "next/server";
// import { refreshAuthToken } from "@/utils/tokenUtils";

// export async function POST(request: NextRequest) {
//     try {
//         const { refreshToken } = await request.json() as { refreshToken?: string };
        
//         if (!refreshToken) {
//             return NextResponse.json(
//                 { success: false, message: 'No refresh token provided' },
//                 { status: 400 }
//             );
//         }

//         const newTokens = await refreshAuthToken(refreshToken);
        
//         const redirectUrl = new URL(request.url).searchParams.get('redirect');

//         return NextResponse.json({ 
//             success: true, 
//             tokens: newTokens,
//             redirectUrl: redirectUrl || '/dashboard'
//         });
//     } catch (error) {
//         console.error('Token refresh error:', error);
//         return NextResponse.json(
//             { success: false, message: 'Failed to refresh token' },
//             { status: 401 }
//         );
//     }
// }