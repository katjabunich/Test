"use client";

import PhoneFrame from "@/components/onboarding/PhoneFrame";
import MockTodayContent from "@/components/onboarding/MockTodayContent";

export default function HeroPreview() {
  return (
    <PhoneFrame tilt={-2}>
      <MockTodayContent />
    </PhoneFrame>
  );
}
