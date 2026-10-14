import { QuizRunner } from "./runner";

export function PretestPage() {
  return (
    <QuizRunner
      title="Pretest"
      subtitle="Ukur kemampuan awalmu sebelum jalur belajar adaptif disusun."
      config="PRETEST"
      onBackHref="/path"
    />
  );
}