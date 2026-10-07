import { describe, expect, it } from "vitest";
import { detectDistance, detectHours, detectIntent, detectJobType, detectTown, detectWork, detectYesNo } from "../intents";

describe("Saathi intent detection (spec A2 phrases)", () => {
  it.each([
    ["मुझे नौकरी चाहिए।", "job"],
    ["I need a job", "job"],
    ["mujhe naukri chahiye", "job"],
    ["मुझे कोई काम सीखना है।", "learn"],
    ["I want to learn tailoring", "learn"],
    ["मेरे पास मोबाइल नहीं है।", "no_phone"],
    ["I don't have a phone", "no_phone"],
    ["मेरे पास सिलाई का अनुभव है।", "experience"],
    ["मुझे खाना बनाना आता है।", "experience"],
    ["मेरे पास कौन-कौन से काम के विकल्प हैं?", "options"],
    ["मेरे आसपास कौन-सी vacancies हैं?", "nearby"],
    ["What work is near me?", "nearby"],
    ["मेरी पर्ची निकालो।", "parchi"],
    ["print my parchi", "parchi"],
    ["यह नौकरी कितनी salary देती है?", "salary"],
    ["इस काम के लिए क्या skill चाहिए?", "skill_req"],
    ["नमस्ते", "greet"],
    ["They asked me for money, is this fake?", "report"],
  ])("%s → %s", (text, intent) => {
    expect(detectIntent(text)).toBe(intent);
  });

  it("A19: sewing + wanting work is a job request with the sewing skill", () => {
    const text = "मुझे सिलाई आती है और मुझे काम चाहिए।";
    expect(detectIntent(text)).toBe("job");
    expect(detectWork(text)).toEqual({ skill: "sewing", category: "tailoring_assistant" });
  });

  it("extracts slots", () => {
    expect(detectTown("Pilani।")?.id).toBe("pilani");
    expect(detectTown("मैं पिलानी में रहता हूँ")?.id).toBe("pilani");
    expect(detectDistance("10 किमी तक")).toBe(10);
    expect(detectJobType("part time chahiye")).toBe("part_time");
    expect(detectJobType("पूरे दिन का काम")).toBe("full_time");
    expect(detectHours("सुबह का समय")).toBe("morning");
    expect(detectYesNo("नहीं, पहली बार")).toBe("no");
    expect(detectYesNo("हाँ, 2 साल")).toBe("yes");
    expect(detectWork("I can cook")).toMatchObject({ skill: "cooking" });
  });
});
