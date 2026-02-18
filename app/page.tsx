/**
 * Home Page Component
 * 
 * Landing page for the AI Trip Planner application
 * Features:
 * - Hero section with trip creation interface
 * - Trip statistics showing app usage metrics
 * 
 * @component
 */

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Hero from "./_components/Hero";
import { TripStatistics } from "./_components/TripStatistics";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section: Main CTA with trip input and suggestions */}
      <Hero />
      
      {/* Trip Statistics: Real-time app usage metrics */}
      <TripStatistics />
    </div>
  );
}
