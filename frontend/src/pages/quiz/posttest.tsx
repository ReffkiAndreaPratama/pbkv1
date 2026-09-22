import { QuizRunner } from "./runner";

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