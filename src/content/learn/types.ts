import type { IconName } from "@/components/ui/Icon";
import type { SkillKey } from "@/lib/taxonomy";

export interface LessonStep {
  text: string;
  tip?: string;
}
export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
}
export interface Lesson {
  id: string;
  title: string;
  intro: string;
  steps: LessonStep[];
  quiz?: QuizItem[];
  task?: string;
}
export interface LearnSkill {
  id: string;
  skill: SkillKey;
  icon: IconName;
  title: string;
  summary: string;
  level: "beginner";
  minutes: number;
  status: "published" | "review";
  lessons: Lesson[];
}

/** Shape of a per-locale JSON file (src/content/learn/<locale>.json). */
export interface RawLearnContent {
  skills: Record<string, { title: string; summary: string; lessons: Lesson[] }>;
}
