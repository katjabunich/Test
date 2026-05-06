"use client";

import PhoneFrame from "@/components/onboarding/PhoneFrame";
import MockTodayContent from "@/components/onboarding/MockTodayContent";

export default function HeroPreview() {
  return (
    <PhoneFrame
      rotateX={4}
      rotateY={-12}
      tilt={-2}
      accent="#f5c563"
      ambient="#f5c563"
    >
      <MockTodayContent />
    </PhoneFrame>
  );
}
