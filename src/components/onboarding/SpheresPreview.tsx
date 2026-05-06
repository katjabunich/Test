"use client";

import PhoneFrame from "@/components/onboarding/PhoneFrame";
import MockTasksContent from "@/components/onboarding/MockTasksContent";

export default function SpheresPreview() {
  return (
    <PhoneFrame tilt={2}>
      <MockTasksContent />
    </PhoneFrame>
  );
}
