import { MBTIMap, MBTIResult } from "@/types/mbti";

export function toType(axes: MBTIMap): string {
  return `${axes["E/I"]}${axes["S/N"]}${axes["T/F"]}${axes["J/P"]}`;
}

const TITLES: Record<string, string> = {
  INFP: "理想を追う詩人",
  INFJ: "洞察の導き手",
  ENFP: "情熱の探求者",
  ISTJ: "誠実な管理者",
};

const SUMMARIES: Record<string, string> = {
  INFP: "洞察力が高く想像力に富み、価値観を大切にします。",
  INFJ: "人と物事の本質を見抜き、静かな情熱で導きます。",
  ENFP: "好奇心旺盛で可能性にワクワクし、周囲を鼓舞します。",
  ISTJ: "秩序と責任感を重んじ、着実に物事を進めます。",
};

export function toResult(axes: MBTIMap, story: string): MBTIResult {
  const type = toType(axes);
  const title = TITLES[type] ?? "あなたらしさの物語";
  const summary = SUMMARIES[type] ?? "あなたの価値観と強みが物語に表れています。";
  return { axes, type, title, summary, story };
}

export function parseAxes(jsonText: string): MBTIMap | null {
  try {
    const obj = JSON.parse(jsonText);
    if (obj && obj["E/I"] && obj["S/N"] && obj["T/F"] && obj["J/P"]) {
      return { "E/I": obj["E/I"], "S/N": obj["S/N"], "T/F": obj["T/F"], "J/P": obj["J/P"] } as MBTIMap;
    }
  } catch {}
  return null;
}
