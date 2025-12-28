"use client";

import { Suspense } from "react";
import { HomePageContent } from "./home-page-content";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
