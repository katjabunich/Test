"use client";

import PhoneFrame from "@/components/onboarding/PhoneFrame";
import MockTasksContent from "@/components/onboarding/MockTasksContent";

export default function SpheresPreview() {
  return (
    <PhoneFrame rotateX={4} rotateY={11} tilt={2}>
      <MockTasksContent />
    </PhoneFrame>
  );
}
