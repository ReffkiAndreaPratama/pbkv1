import { useSearchParams } from "react-router-dom";
import { PracticeRunner } from "./practice-runner";

export function AdaptiveQuizPage() {
  const [params] = useSearchParams();
  const skillId = params.get("skill");
  return <PracticeRunner skillId={skillId} onBackHref={skillId ? "/cases" : "/progress"} />;
}
