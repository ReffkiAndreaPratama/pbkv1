import { useSearchParams } from "react-router-dom";
import { QuizRunner } from "./runner";

export function PretestPage() {
  return (
    <QuizRunner
      title="Pretest"
      subtitle="Ukur kemampuan awalmu sebelum jalur belajar adaptif disusun."
      config="PRETEST"
      onBackHref="/"
    />
  );
}

export function PosttestPage() {
  return (
    <QuizRunner
      title="Posttest"
      subtitle="Uji pemahaman akhir setelah menyelesaikan materi & simulasi. Minimal lulus: 70."
      config="POSTTEST"
      onBackHref="/progress"
    />
  );
}

export function AdaptiveQuizPage() {
  const [params] = useSearchParams();
  const skillId = params.get("skill") || null;
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