import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./ConvexClientProvider";
import FloatingAIAssistant from "./_components/FloatingAIAssistant";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  title: "TripCoPilot | Smart Travel Itinerary Generator",
  description:
    "Plan your perfect trip in seconds with TripCoPilot. Get personalized itineraries, hotel recommendations, and activity suggestions with just one click!",
  keywords: [
    "TripCoPilot",
    "Travel Itinerary Generator",
    "Smart Trip Planner",
    "AI Travel Assistant",
    "Best Trip Planning App",
    "AI Vacation Planner",
    "TripCoPilot Next.js",
  ],
  authors: [{ name: "TubeGuruji" }],
  openGraph: {
    title: "TripCoPilot | Smart Travel Itinerary Generator",
    description:
      "Plan trips effortlessly with AI! Create detailed travel itineraries, find top destinations, and discover the best hotels and activities instantly with TripCoPilot.",
    url: "https://yourdomain.com",
    siteName: "TripCoPilot",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "TripCoPilot Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripCoPilot | Smart Travel Itinerary Generator",
    description:
      "Your personal AI travel assistant – plan trips, book hotels, and explore destinations in seconds with TripCoPilot.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};


const outfit = Outfit({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={outfit.className}
        >
          <ConvexClientProvider>
            <Provider>
              {children}
              <FloatingAIAssistant />
            </Provider>
          </ConvexClientProvider>
          <script src="https://maps.olakrutrim.com/ola-maps-web-sdk.js"></script>

        </body>
      </html>
    </ClerkProvider>
  );
}
