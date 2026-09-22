import { useSearchParams } from "react-router-dom";
import { QuizRunner } from "./runner";

export function AdaptiveQuizPage() {
  const [params] = useSearchParams();
  const skillId = params.get("skill");
  return (
    <QuizRunner
      title="Kuis Adaptif"
      subtitle="Soal menyesuaikan penguasaan skill yang sedang kamu latih."
      config="ADAPTIVE"
      skillId={skillId}
      onBackHref={skillId ? "/cases" : "/progress"}
    />
  );
}