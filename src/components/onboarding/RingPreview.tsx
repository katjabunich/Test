"use client";

import { useEffect } from "react";
import PhoneFrame from "@/components/onboarding/PhoneFrame";
import MockHabitContent from "@/components/onboarding/MockHabitContent";
import { fireConfetti } from "@/lib/celebrate";

/** Phone-framed habit-completion preview. Confetti fires from the frame's
   centre so it visibly spills out around the device. */
export default function RingPreview() {
  useEffect(() => {
    const t = setTimeout(() => {
      void fireConfetti("#86c79a");
    }, 1550);
    return () => clearTimeout(t);
  }, []);

  return (
    <PhoneFrame rotateX={3} rotateY={-8} tilt={-1}>
      <MockHabitContent />
    </PhoneFrame>
  );
}
