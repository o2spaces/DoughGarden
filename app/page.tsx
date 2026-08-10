"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProofMode = "room" | "cold" | "combo";
type BakeMode = "dutch" | "open";
type PrepMethod = "fermentolyse" | "autolyse";
type AdaptiveTempSource = "room" | "dough";
type AlertSound = "bell" | "chime" | "soft" | "none";
type PageId =
  | "home"
  | "starter"
  | "recipe"
  | "proof"
  | "bulk"
  | "workflow"
  | "education"
  | "analysis"
  | "data";
type PokeResult = "fast" | "slow" | "none";
type ProofTension = "tight" | "soft" | "weak";
type CrumbPattern = "dense" | "tunnel" | "wild" | "gummy" | "balanced";
type FlavorTarget = "mild" | "balanced" | "tangy";
type LessonLanguage = "all" | "th" | "en";
type LearningLesson = {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  language: Exclude<LessonLanguage, "all">;
  source: string;
  sourceUrl: string;
  videoId: string;
  startSeconds?: number;
  workflowPhase: number | null;
  summary: string;
  watch: string[];
  checklist: string[];
};
type Phase = {
  icon: string;
  title: string;
  subtitle: string;
  hours: number;
  temp: string;
  guide: string[];
  cue: string;
};
type SavedYeast = { id: string; name: string; birth: string; savedAt: string };
type TimerMilestone = { minutes: number; title: string; body: string };
type LevainStage =
  | "fed"
  | "bubbles"
  | "rising"
  | "doubled"
  | "peak"
  | "falling";
type BulkSurface = "flat" | "round" | "domed";
type BulkStrength = "weak" | "developing" | "holding";
type SavedRecipe = {
  id: string;
  name: string;
  savedAt: string;
  targetDough: number;
  hydration: number;
  starterPercent: number;
  saltPercent: number;
  oilPercent: number;
  apFlour: number;
  speltFlour: number;
  wholeWheat: number;
  ryeFlour: number;
  doughTemperature: number;
  flourProfile: string;
};
type LevainObservation = {
  id: string;
  at: string;
  rise: number;
  stage: LevainStage;
  note: string;
};
type LevainBuild = {
  startedAt: string;
  temperature: number;
  starterName: string;
  observations: LevainObservation[];
};
type BulkObservation = {
  id: string;
  at: string;
  elapsedMinutes: number;
  temperature: number;
  rise: number;
  surface: BulkSurface;
  strength: BulkStrength;
  bubbles: boolean;
  jiggle: boolean;
  note: string;
};
type BulkRun = {
  startedAt: string;
  recipeName: string;
  levainStageAtMix: LevainStage | "unknown";
  observations: BulkObservation[];
};
type BannetonShape = "round" | "oval";
type BakeEntry = {
  id: string;
  bakedAt: string;
  recipeName: string;
  predictedBulkMinutes: number;
  actualBulkMinutes: number;
  bulkRise: number;
  averageDoughTemperature: number;
  ovenSpring: number;
  crumb: number;
  sourness: number;
  crust: number;
  notes: string;
};

const PAGE_ITEMS: { id: PageId; label: string; shortLabel: string; icon: string }[] = [
  { id: "home", label: "ภาพรวม", shortLabel: "ภาพรวม", icon: "⌂" },
  { id: "starter", label: "หัวเชื้อ", shortLabel: "หัวเชื้อ", icon: "◌" },
  { id: "recipe", label: "สูตรและตะกร้า", shortLabel: "สูตร", icon: "▤" },
  { id: "proof", label: "พรูฟและอบ", shortLabel: "พรูฟ", icon: "◐" },
  { id: "bulk", label: "ไลฟ์บัลก์", shortLabel: "บัลก์", icon: "◎" },
  { id: "workflow", label: "ขั้นตอนทำ", shortLabel: "ขั้นตอน", icon: "→" },
  { id: "education", label: "เรียนรู้", shortLabel: "เรียน", icon: "▶" },
  { id: "analysis", label: "วิเคราะห์ผล", shortLabel: "วิเคราะห์", icon: "◇" },
  { id: "data", label: "ข้อมูล", shortLabel: "ข้อมูล", icon: "↕" },
];

const LEARNING_LESSONS: LearningLesson[] = [
  {
    id: "starter-peak",
    step: 0,
    title: "เลี้ยงหัวเชื้อและดูจุดพีค",
    subtitle: "ก่อนเริ่มทำโดว์",
    language: "en",
    source: "King Arthur Baking / Beginner Tutorial",
    sourceUrl: "https://www.kingarthurbaking.com/videos/baking-skills/how-to-feed-sourdough-starter",
    videoId: "CTuGXdyrWUo",
    startSeconds: 78,
    workflowPhase: null,
    summary: "ดูการให้อาหาร การขึ้นตัว และสภาพหัวเชื้อที่มีกำลัง ไม่ใช้เวลาอย่างเดียวตัดสินว่าพร้อม",
    watch: ["ระดับเพิ่ม 2–3 เท่า", "ผิวโค้งและมีฟองละเอียด", "กลิ่นโยเกิร์ตหรือผลไม้ ไม่ฉุนจัด"],
    checklist: ["ชั่งหัวเชื้อ น้ำ และแป้ง", "ทำเครื่องหมายระดับเริ่มต้น", "ใช้ช่วงพีคหรือใกล้พีค"],
  },
  {
    id: "prep-rest",
    step: 1,
    title: "ออโตไลซ์และเฟอร์เมนโตไลซ์",
    subtitle: "พักแป้งให้ดูดน้ำ",
    language: "en",
    source: "The Perfect Loaf",
    sourceUrl: "https://www.theperfectloaf.com/beginners-sourdough-bread/",
    videoId: "CTuGXdyrWUo",
    startSeconds: 159,
    workflowPhase: 0,
    summary: "เปรียบเทียบการพักแป้งกับน้ำก่อน และการพักพร้อมหัวเชื้อ โดยยึดวิธีที่เลือกไว้ในสูตร DoughGarden",
    watch: ["ไม่มีผงแป้งแห้ง", "โดว์คลายตัวหลังพัก", "ยังไม่ต้องนวดจนเนียน"],
    checklist: ["ดูว่าเลือก Autolyse หรือ Fermentolyse", "เก็บน้ำไว้ใส่เกลือ", "คลุมไม่ให้ผิวแห้ง"],
  },
  {
    id: "mix-develop",
    step: 2,
    title: "ผสมและพัฒนากลูเตน",
    subtitle: "Mix & Develop",
    language: "th",
    source: "บทเรียนซาวโดว์ภาษาไทย",
    sourceUrl: "https://www.youtube.com/watch?v=gdGvWbXo_n4",
    videoId: "gdGvWbXo_n4",
    workflowPhase: 1,
    summary: "ดูวิธีรวมส่วนผสมให้สม่ำเสมอและสร้างแรงเริ่มต้น โดยใช้กรัมและ Hydration จากสูตรของคุณแทนสูตรในคลิป",
    watch: ["เกลือกระจายทั่ว", "โดว์เริ่มจับตัวเป็นก้อน", "ดึงแล้วไม่ขาดทันที"],
    checklist: ["เติมน้ำทีละน้อย", "หยุดพักเมื่อโดว์ร้อน", "วัดอุณหภูมิกลางโดว์หลังผสม"],
  },
  {
    id: "strength-folds",
    step: 3,
    title: "Stretch & Fold และ Coil Fold",
    subtitle: "พับโดว์เพื่อสร้างแรง",
    language: "en",
    source: "The Perfect Loaf",
    sourceUrl: "https://www.theperfectloaf.com/how-to-stretch-and-fold-sourdough-bread-dough/",
    videoId: "CTuGXdyrWUo",
    startSeconds: 240,
    workflowPhase: 2,
    summary: "ดูทิศทางมือและแรงที่เหมาะสม พับให้โดว์แข็งแรงขึ้นโดยไม่ฉีกและไม่ไล่ฟองทั้งหมด",
    watch: ["ยกแล้วโดว์ยืดเป็นแผ่น", "ก้อนตั้งสูงขึ้นหลังพับ", "รอบหลังต้องเบากว่ารอบแรก"],
    checklist: ["พับครบทุกด้าน", "พักตาม Timer", "หยุดเมื่อโดว์ตึงและเริ่มต้านมือ"],
  },
  {
    id: "bulk-finish",
    step: 4,
    title: "ดูจุดจบ Bulk Fermentation",
    subtitle: "ตัดสินจากโดว์จริง",
    language: "th",
    source: "Sourdough Diary ภาษาไทย / The Perfect Loaf",
    sourceUrl: "https://www.theperfectloaf.com/guides/the-ultimate-guide-to-bread-dough-bulk-fermentation/",
    videoId: "QHMXp9IVYE8",
    workflowPhase: 3,
    summary: "ดูปริมาตร ผิว ฟอง การสั่น และแรงเก็บทรงร่วมกัน แล้วเทียบกับ Live Bulk ของ DoughGarden",
    watch: ["ผิวโค้งนูน ไม่แบน", "มีฟองด้านข้างกล่อง", "สั่นคล้ายเจลแต่ยังเก็บทรง"],
    checklist: ["บันทึกอุณหภูมิโดว์", "บันทึกเปอร์เซ็นต์การขึ้น", "ไม่รอให้ขึ้นสองเท่าโดยอัตโนมัติ"],
  },
  {
    id: "preshape",
    step: 5,
    title: "Preshape และ Bench Rest",
    subtitle: "จัดก้อนก่อนขึ้นรูปจริง",
    language: "en",
    source: "The Perfect Loaf",
    sourceUrl: "https://www.youtube.com/watch?v=Op-LKk-i4zQ",
    videoId: "Op-LKk-i4zQ",
    workflowPhase: 4,
    summary: "ดูการใช้ที่ตัดโดว์รวบผิวให้ตึงแบบไม่บีบแก๊ส แล้วพักให้ก้อนคลายตัวก่อน Final Shape",
    watch: ["มือและที่ตัดอยู่ต่ำชิดโต๊ะ", "ผิวด้านบนตึงขึ้น", "ก้อนไม่ฉีกหรือแผ่ทันที"],
    checklist: ["โรยแป้งให้น้อย", "พัก 15–25 นาที", "ขึ้นรูปต่อเมื่อก้อนคลายตัว"],
  },
  {
    id: "final-shape",
    step: 6,
    title: "Final Shape แบบ Batard",
    subtitle: "สร้าง Surface Tension",
    language: "en",
    source: "The Perfect Loaf",
    sourceUrl: "https://www.youtube.com/watch?v=GkwQR5CnM6Y",
    videoId: "GkwQR5CnM6Y",
    workflowPhase: 5,
    summary: "ดูการพับและม้วนให้แรงตึงสม่ำเสมอ ทั้งกรณีโดว์แข็งแรงและโดว์ค่อนข้างนิ่ม",
    watch: ["พับซ้าย–ขวาเท่ากัน", "ม้วนแน่นแต่ไม่ฉีก", "รอยต่อปิดอยู่ด้านบนในตะกร้า"],
    checklist: ["เตรียมตะกร้าและแป้งข้าวเจ้า", "รักษาฟองภายใน", "เช็กว่าผิวไม่ขาด"],
  },
  {
    id: "final-proof",
    step: 7,
    title: "Final Proof และ Finger Poke",
    subtitle: "เช็กก่อนอบ",
    language: "en",
    source: "The Perfect Loaf",
    sourceUrl: "https://www.theperfectloaf.com/how-to-use-the-dough-poke-test/",
    videoId: "_ih3ox4NiYs",
    workflowPhase: 6,
    summary: "ดูความแตกต่างระหว่าง Underproof, พร้อมอบ และ Overproof พร้อมข้อจำกัดของ Poke Test เมื่อโดว์เย็น",
    watch: ["เด้งเร็ว = ยังตึง", "เด้งช้าและเหลือรอยตื้น = ใกล้พร้อม", "โดว์เย็นอาจเด้งเร็วกว่าความจริง"],
    checklist: ["ดูปริมาตรร่วมกับรอยกด", "เช็กแรงตึงผิว", "ใช้ Final Proof Readiness ประกอบ"],
  },
  {
    id: "score",
    step: 8,
    title: "คว่ำตะกร้าและกรีด",
    subtitle: "Score ให้รอยเปิดควบคุมได้",
    language: "en",
    source: "Bread Scoring Tutorial",
    sourceUrl: "https://www.youtube.com/watch?v=ytnBkVcR7CI",
    videoId: "ytnBkVcR7CI",
    workflowPhase: 7,
    summary: "ดูมุมใบมีด ความลึก และจังหวะกรีดสำหรับรอยขยายหลัก โดยกรีดทันทีหลังนำโดว์เย็นออกจากตู้",
    watch: ["จับใบมีดเอียง 30–45°", "กรีดต่อเนื่อง ไม่ย้ำหลายครั้ง", "ความลึกประมาณ 0.5–1 ซม."],
    checklist: ["เตาและหม้อร้อนพร้อม", "ปัดแป้งส่วนเกิน", "ระวังใบมีดและภาชนะร้อน"],
  },
  {
    id: "steam-bake",
    step: 9,
    title: "อบปิดฝาและสร้างไอน้ำ",
    subtitle: "ช่วง Oven Spring",
    language: "en",
    source: "King Arthur Baking",
    sourceUrl: "https://www.youtube.com/watch?v=VuIT0RJDdZ8",
    videoId: "VuIT0RJDdZ8",
    workflowPhase: 8,
    summary: "ดูการย้ายโดว์ลงภาชนะร้อนและการกักไอน้ำช่วงแรก เพื่อให้รอยกรีดเปิดก่อนเปลือกเซ็ตตัว",
    watch: ["ย้ายโดว์อย่างมั่นคง", "ปิดฝาทันที", "ไม่เติมน้ำใน Dutch Oven"],
    checklist: ["ใส่ถุงมือกันร้อน", "ใช้เวลาและอุณหภูมิจากเว็บ", "ไม่เปิดเตาบ่อยช่วงแรก"],
  },
  {
    id: "dry-bake",
    step: 10,
    title: "Open Bake และ Dry Bake",
    subtitle: "ไล่ไอน้ำและทำสีเปลือก",
    language: "en",
    source: "Home Oven Steam Guide",
    sourceUrl: "https://www.youtube.com/watch?v=mE2f-WVE1bg",
    videoId: "mE2f-WVE1bg",
    workflowPhase: 9,
    summary: "ดูการสร้างไอน้ำอย่างปลอดภัยและจังหวะระบายไอน้ำ จากนั้นลดไฟเพื่อทำสีและทำให้เปลือกแห้ง",
    watch: ["ใช้ถาดโลหะ ไม่ใช้แก้ว", "ระบายไอน้ำหลัง Oven Spring", "สีเปลือกต้องทั่วทั้งก้อน"],
    checklist: ["หลบหน้าและมือจากไอน้ำ", "นำถาดน้ำออก", "วัดแกนกลางก่อนนำออก"],
  },
  {
    id: "cooldown",
    step: 11,
    title: "พักให้เย็นก่อนตัด",
    subtitle: "ให้เนื้อขนมปังเซ็ตตัว",
    language: "en",
    source: "Sourdough Cooling Guide",
    sourceUrl: "https://www.youtube.com/watch?v=jzzGvq3dZ88",
    videoId: "jzzGvq3dZ88",
    workflowPhase: 10,
    summary: "ดูผลของการตัดเร็วต่อความเหนียว ความชื้น และโครงสร้างโพรง แล้วพักก้อนบนตะแกรงให้ลมผ่านรอบด้าน",
    watch: ["ไอน้ำยังออกจากก้อนหลังอบ", "เนื้อยังเซ็ตตัวระหว่างเย็น", "ก้อนใหญ่ต้องพักนานกว่า"],
    checklist: ["ย้ายขึ้นตะแกรงทันที", "พักอย่างน้อย 2 ชั่วโมง", "ถ่ายรูปหน้าตัดหลังเย็นสนิท"],
  },
];

const CRUMB_DIAGNOSIS: Record<
  CrumbPattern,
  { label: string; status: string; causes: string[]; next: string }
> = {
  dense: {
    label: "โพรงเล็ก แน่นทั้งก้อน",
    status: "มักสัมพันธ์กับการหมักหรือโครงสร้างที่ยังไม่พอ",
    causes: ["หัวเชื้อยังไม่พีคหรืออ่อนแรง", "จบบัลก์เร็วเกินไป", "พัฒนากลูเตนไม่พอ"],
    next: "รอบหน้าเช็กหัวเชื้อที่พีค และเพิ่มบัลก์ทีละ 10–15 นาที โดยคงตัวแปรอื่นไว้",
  },
  tunnel: {
    label: "โพรงใหญ่ด้านบน แต่ด้านล่างแน่น",
    status: "ไม่ควรฟันธงว่า Overproof — มักต้องเช็ก Underproof และการขึ้นรูปก่อน",
    causes: ["แก๊สกระจุกจากการขึ้นรูป", "ไฟนอลพรูฟยังไม่พอ", "ไล่อากาศหรือซีลตะเข็บไม่สม่ำเสมอ"],
    next: "ฝึกขึ้นรูปให้แรงตึงสม่ำเสมอ และเพิ่มไฟนอลพรูฟทีละ 10–15 นาที",
  },
  wild: {
    label: "โพรงใหญ่มาก ไม่สม่ำเสมอ",
    status: "อาจมาจากหมักเกิน โครงสร้างอ่อน หรือการขึ้นรูป — ต้องดูอาการโดว์ร่วมกัน",
    causes: ["บัลก์เลยจุดพร้อม", "Hydration สูงเกินกำลังแป้ง", "พับโดว์หรือขึ้นรูปไม่พอ"],
    next: "ลองลดน้ำ 2% ก่อนหนึ่งรอบ หรือจบบัลก์เร็วขึ้น 10–15 นาทีอย่างใดอย่างหนึ่ง",
  },
  gummy: {
    label: "เนื้อเหนียว ชื้น หรือเป็นยาง",
    status: "เกี่ยวได้ทั้งการหมัก การอบ และการพักให้เย็น",
    causes: ["แกนขนมปังยังไม่สุก", "ตัดก่อนเย็นสนิท", "หมักเกินจนโครงสร้างอ่อน"],
    next: "วัดแกนกลางหลังอบ พักบนตะแกรงอย่างน้อย 2 ชั่วโมง แล้วจึงประเมินอีกครั้ง",
  },
  balanced: {
    label: "โพรงสมดุล กระจายทั่วก้อน",
    status: "สัญญาณโดยรวมดี เมื่อเนื้อยืดหยุ่น ไม่แฉะ และเปลือกบางตามเป้าหมาย",
    causes: ["หัวเชื้อพร้อม", "จบบัลก์เหมาะสม", "ขึ้นรูปและไฟนอลพรูฟสมดุล"],
    next: "บันทึกเวลา อุณหภูมิโดว์ และรูปตัดใน Bake Journal เพื่อใช้เป็นค่าฐานของสูตรนี้",
  },
};

const RECIPE_PRESETS = [
  {
    id: "venus-spelt-large",
    name: "ก้อนใหญ่ (ฟูสูง) · Venus–Spelt",
    description:
      "แป้งเท่ากัน · ฟูสูงกว่า · Venus 70 / Spelt 15 / Whole 10 / Rye 5",
    targetDough: 950,
    apFlour: 0,
    speltFlour: 15,
    wholeWheat: 10,
    ryeFlour: 5,
    hydration: 73,
    starterPercent: 20,
    saltPercent: 2,
    oilPercent: 0,
    doughTemperature: 26,
    flourProfile:
      "NS-Venus ญี่ปุ่น · สเปลต์เยอรมัน · โฮลวีตเยอรมัน · ไรย์เยอรมัน · ปริมาณแป้งเท่ากับสูตรก้อนเล็ก แต่คาดว่าจะขึ้นฟูและมีปริมาตรมากกว่า",
  },
  {
    id: "tfm-french-small",
    name: "ก้อนเล็ก (ฟูน้อย) · TFM–French Grain",
    description: "แป้งเท่ากัน · ฟูน้อยกว่า · TFM 75 / Whole Wheat 20 / Rye 5",
    targetDough: 950,
    apFlour: 0,
    speltFlour: 0,
    wholeWheat: 20,
    ryeFlour: 5,
    hydration: 73,
    starterPercent: 20,
    saltPercent: 2,
    oilPercent: 0,
    doughTemperature: 26,
    flourProfile:
      "TFM แป้งขนมปังโปรตีนสูง · โฮลวีตฝรั่งเศส · ไรย์ฝรั่งเศส · ปริมาณแป้งเท่ากับสูตรก้อนใหญ่ แต่คาดว่าจะฟูน้อยกว่าและเนื้อแน่นกว่า",
  },
  {
    id: "thai-balanced",
    name: "ครัวไทยบาลานซ์",
    description: "ฟูดี เนื้อชุ่ม จัดการง่าย",
    targetDough: 800,
    apFlour: 10,
    speltFlour: 0,
    wholeWheat: 10,
    ryeFlour: 0,
    hydration: 71,
    starterPercent: 20,
    saltPercent: 2,
    oilPercent: 0,
    doughTemperature: 26,
    flourProfile: "",
  },
  {
    id: "soft-high",
    name: "นุ่มและขึ้นสูง",
    description: "Bread 80% · AP 15% · Rye 5%",
    targetDough: 800,
    apFlour: 15,
    speltFlour: 0,
    wholeWheat: 0,
    ryeFlour: 5,
    hydration: 71,
    starterPercent: 20,
    saltPercent: 2,
    oilPercent: 2,
    doughTemperature: 26,
    flourProfile: "",
  },
  {
    id: "aromatic-rye",
    name: "หอมไรย์ 5%",
    description: "ชุ่ม หอม หมักไวขึ้นเล็กน้อย",
    targetDough: 800,
    apFlour: 10,
    speltFlour: 0,
    wholeWheat: 5,
    ryeFlour: 5,
    hydration: 72,
    starterPercent: 20,
    saltPercent: 2,
    oilPercent: 0,
    doughTemperature: 25,
    flourProfile: "",
  },
  {
    id: "open-crumb",
    name: "อาร์ติซานโพรงเปิด",
    description: "แป้งแรง 90% · โฮลวีท 10%",
    targetDough: 800,
    apFlour: 0,
    speltFlour: 0,
    wholeWheat: 10,
    ryeFlour: 0,
    hydration: 75,
    starterPercent: 20,
    saltPercent: 2,
    oilPercent: 0,
    doughTemperature: 25,
    flourProfile: "",
  },
] as const;

const BANNETON_PRESETS = [
  { id:"round-8", label:"กลม 8 นิ้ว", shape:"round" as BannetonShape, width:20.3, length:20.3, depth:8 },
  { id:"round-85", label:"กลม 8.5 นิ้ว", shape:"round" as BannetonShape, width:21.6, length:21.6, depth:8.5 },
  { id:"round-9", label:"กลม 9 นิ้ว", shape:"round" as BannetonShape, width:22.9, length:22.9, depth:8.5 },
  { id:"round-10", label:"กลม 10 นิ้ว", shape:"round" as BannetonShape, width:25.4, length:25.4, depth:9 },
  { id:"oval-small", label:"วงรีเล็ก", shape:"oval" as BannetonShape, width:14, length:23, depth:8 },
  { id:"oval-medium", label:"วงรีกลาง", shape:"oval" as BannetonShape, width:15, length:25, depth:8.5 },
  { id:"oval-large", label:"วงรีใหญ่", shape:"oval" as BannetonShape, width:17, length:28, depth:9 },
] as const;

const LEVAIN_STAGE_LABELS: Record<LevainStage, string> = {
  fed: "เพิ่งให้อาหาร",
  bubbles: "เริ่มมีฟอง",
  rising: "กำลังขึ้น",
  doubled: "ขึ้นสองเท่า",
  peak: "ยอดโดม / พีค",
  falling: "เริ่มยุบ",
};
const BULK_SURFACE_LABELS: Record<BulkSurface, string> = {
  flat: "แบน",
  round: "เริ่มโค้ง",
  domed: "นูนชัด",
};
const BULK_STRENGTH_LABELS: Record<BulkStrength, string> = {
  weak: "อ่อน/แผ่",
  developing: "กำลังมีแรง",
  holding: "เก็บทรงดี",
};

const STRENGTH_MILESTONES: TimerMilestone[] = [
  {
    minutes: 30,
    title: "พับโดว์รอบที่ 1",
    body: "ครบ 30 นาที — สเตรตช์แอนด์โฟลด์ให้ครบ 4 ด้าน",
  },
  {
    minutes: 60,
    title: "พับโดว์รอบที่ 2",
    body: "ครบ 60 นาที — คอยล์โฟลด์อย่างนุ่มนวล",
  },
  {
    minutes: 90,
    title: "พับโดว์รอบที่ 3",
    body: "ครบ 90 นาที — คอยล์โฟลด์รอบสุดท้าย แล้วปล่อยโดว์พัก",
  },
];

const DEFAULT_SETTINGS = {
  temperature: 28,
  humidity: 70,
  starterOld: 20,
  feedFlour: 40,
  feedWater: 40,
  wholeWheat: 10,
  apFlour: 10,
  speltFlour: 0,
  ryeFlour: 0,
  flourProfile: "",
  targetDough: 800,
  hydration: 71,
  starterPercent: 20,
  saltPercent: 2,
  oilPercent: 0,
  doughTemperature: 26,
  loafCount: 1,
  loavesPerBake: 1,
  proofMode: "cold" as ProofMode,
  coldHours: 12,
  fridgeTemp: 4,
  prepMethod: "fermentolyse" as PrepMethod,
  adaptiveTempSource: "room" as AdaptiveTempSource,
  bakeMode: "dutch" as BakeMode,
  steamWater: 200,
  ovenVolume: 60,
  trayWidth: 30,
  trayLength: 20,
  steamMinutes: 20,
  ovenSeal: "normal" as "tight" | "normal" | "leaky",
  alertSound: "bell" as AlertSound,
  targetBakeAt: "",
  flourTemperature: 28,
  levainMixTemperature: 26,
  frictionFactor: 3,
  coldWaterTemperature: 8,
  warmWaterTemperature: 40,
  bannetonShape: "round" as BannetonShape,
  bannetonWidth: 22.9,
  bannetonLength: 22.9,
  bannetonDepth: 8.5,
};

type SavedSettings = typeof DEFAULT_SETTINGS;
const validNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const normalizeSettings = (
  data: Record<string, unknown> | null | undefined,
): SavedSettings => ({
  temperature: validNumber(data?.temperature, DEFAULT_SETTINGS.temperature),
  humidity: validNumber(data?.humidity, DEFAULT_SETTINGS.humidity),
  starterOld: validNumber(data?.starterOld, DEFAULT_SETTINGS.starterOld),
  feedFlour: validNumber(data?.feedFlour, DEFAULT_SETTINGS.feedFlour),
  feedWater: validNumber(data?.feedWater, DEFAULT_SETTINGS.feedWater),
  wholeWheat: validNumber(data?.wholeWheat, DEFAULT_SETTINGS.wholeWheat),
  apFlour: validNumber(
    data?.apFlour,
    data && "wholeWheat" in data ? 0 : DEFAULT_SETTINGS.apFlour,
  ),
  speltFlour: validNumber(data?.speltFlour, DEFAULT_SETTINGS.speltFlour),
  ryeFlour: validNumber(data?.ryeFlour, DEFAULT_SETTINGS.ryeFlour),
  flourProfile:
    typeof data?.flourProfile === "string"
      ? data.flourProfile
      : DEFAULT_SETTINGS.flourProfile,
  targetDough: validNumber(data?.targetDough, DEFAULT_SETTINGS.targetDough),
  hydration: validNumber(data?.hydration, DEFAULT_SETTINGS.hydration),
  starterPercent: validNumber(
    data?.starterPercent,
    DEFAULT_SETTINGS.starterPercent,
  ),
  saltPercent: validNumber(data?.saltPercent, DEFAULT_SETTINGS.saltPercent),
  oilPercent: validNumber(data?.oilPercent, DEFAULT_SETTINGS.oilPercent),
  doughTemperature: validNumber(
    data?.doughTemperature,
    DEFAULT_SETTINGS.doughTemperature,
  ),
  loafCount: Math.min(
    6,
    Math.max(
      1,
      Math.round(validNumber(data?.loafCount, DEFAULT_SETTINGS.loafCount)),
    ),
  ),
  loavesPerBake: Math.min(
    6,
    Math.max(
      1,
      Math.round(
        validNumber(data?.loavesPerBake, DEFAULT_SETTINGS.loavesPerBake),
      ),
    ),
  ),
  proofMode:
    data?.proofMode === "room" ||
    data?.proofMode === "cold" ||
    data?.proofMode === "combo"
      ? data.proofMode
      : DEFAULT_SETTINGS.proofMode,
  coldHours: validNumber(data?.coldHours, DEFAULT_SETTINGS.coldHours),
  fridgeTemp: validNumber(data?.fridgeTemp, DEFAULT_SETTINGS.fridgeTemp),
  prepMethod:
    data?.prepMethod === "autolyse" || data?.prepMethod === "fermentolyse"
      ? data.prepMethod
      : DEFAULT_SETTINGS.prepMethod,
  adaptiveTempSource:
    data?.adaptiveTempSource === "dough" || data?.adaptiveTempSource === "room"
      ? data.adaptiveTempSource
      : DEFAULT_SETTINGS.adaptiveTempSource,
  bakeMode:
    data?.bakeMode === "dutch" || data?.bakeMode === "open"
      ? data.bakeMode
      : DEFAULT_SETTINGS.bakeMode,
  steamWater: validNumber(data?.steamWater, DEFAULT_SETTINGS.steamWater),
  ovenVolume: validNumber(data?.ovenVolume, DEFAULT_SETTINGS.ovenVolume),
  trayWidth: validNumber(data?.trayWidth, DEFAULT_SETTINGS.trayWidth),
  trayLength: validNumber(data?.trayLength, DEFAULT_SETTINGS.trayLength),
  steamMinutes: validNumber(data?.steamMinutes, DEFAULT_SETTINGS.steamMinutes),
  ovenSeal:
    data?.ovenSeal === "tight" ||
    data?.ovenSeal === "normal" ||
    data?.ovenSeal === "leaky"
      ? data.ovenSeal
      : DEFAULT_SETTINGS.ovenSeal,
  alertSound:
    data?.alertSound === "bell" ||
    data?.alertSound === "chime" ||
    data?.alertSound === "soft" ||
    data?.alertSound === "none"
      ? data.alertSound
      : DEFAULT_SETTINGS.alertSound,
  targetBakeAt:
    typeof data?.targetBakeAt === "string"
      ? data.targetBakeAt
      : DEFAULT_SETTINGS.targetBakeAt,
  flourTemperature: validNumber(
    data?.flourTemperature,
    DEFAULT_SETTINGS.flourTemperature,
  ),
  levainMixTemperature: validNumber(
    data?.levainMixTemperature,
    DEFAULT_SETTINGS.levainMixTemperature,
  ),
  frictionFactor: validNumber(
    data?.frictionFactor,
    DEFAULT_SETTINGS.frictionFactor,
  ),
  coldWaterTemperature: validNumber(
    data?.coldWaterTemperature,
    DEFAULT_SETTINGS.coldWaterTemperature,
  ),
  warmWaterTemperature: validNumber(
    data?.warmWaterTemperature,
    DEFAULT_SETTINGS.warmWaterTemperature,
  ),
  bannetonShape:
    data?.bannetonShape === "oval" || data?.bannetonShape === "round"
      ? data.bannetonShape
      : DEFAULT_SETTINGS.bannetonShape,
  bannetonWidth: validNumber(
    data?.bannetonWidth,
    DEFAULT_SETTINGS.bannetonWidth,
  ),
  bannetonLength: validNumber(
    data?.bannetonLength,
    DEFAULT_SETTINGS.bannetonLength,
  ),
  bannetonDepth: validNumber(
    data?.bannetonDepth,
    DEFAULT_SETTINGS.bannetonDepth,
  ),
});

const normalizeRecipe = (
  data: Record<string, unknown> | null | undefined,
): SavedRecipe | null => {
  if (!data?.id || !data?.name || typeof data.hydration !== "number")
    return null;
  return {
    id: String(data.id),
    name: String(data.name),
    savedAt:
      typeof data.savedAt === "string"
        ? data.savedAt
        : new Date().toISOString(),
    targetDough: validNumber(data.targetDough, DEFAULT_SETTINGS.targetDough),
    hydration: validNumber(data.hydration, DEFAULT_SETTINGS.hydration),
    starterPercent: validNumber(
      data.starterPercent,
      DEFAULT_SETTINGS.starterPercent,
    ),
    saltPercent: validNumber(data.saltPercent, DEFAULT_SETTINGS.saltPercent),
    oilPercent: validNumber(data.oilPercent, DEFAULT_SETTINGS.oilPercent),
    apFlour: validNumber(data.apFlour, 0),
    speltFlour: validNumber(data.speltFlour, 0),
    wholeWheat: validNumber(data.wholeWheat, 0),
    ryeFlour: validNumber(data.ryeFlour, 0),
    doughTemperature: validNumber(
      data.doughTemperature,
      DEFAULT_SETTINGS.doughTemperature,
    ),
    flourProfile:
      typeof data.flourProfile === "string" ? data.flourProfile : "",
  };
};

const normalizeBulkRun = (
  data: Record<string, unknown> | null | undefined,
): BulkRun | null => {
  if (!data?.startedAt || typeof data.startedAt !== "string") return null;
  const rawObservations = Array.isArray(data.observations)
    ? data.observations
    : [];
  const observations = rawObservations
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    )
    .map(
      (item): BulkObservation => ({
        id: typeof item.id === "string" ? item.id : `${Date.now()}`,
        at: typeof item.at === "string" ? item.at : new Date().toISOString(),
        elapsedMinutes: Math.max(0, validNumber(item.elapsedMinutes, 0)),
        temperature: validNumber(
          item.temperature,
          DEFAULT_SETTINGS.doughTemperature,
        ),
        rise: Math.max(0, Math.min(150, validNumber(item.rise, 0))),
        surface:
          item.surface === "round" || item.surface === "domed"
            ? item.surface
            : "flat",
        strength:
          item.strength === "developing" || item.strength === "holding"
            ? item.strength
            : "weak",
        bubbles: item.bubbles === true,
        jiggle: item.jiggle === true,
        note: typeof item.note === "string" ? item.note : "",
      }),
    )
    .sort((a, b) => a.elapsedMinutes - b.elapsedMinutes);
  const levainStageAtMix = data.levainStageAtMix;
  return {
    startedAt: data.startedAt,
    recipeName:
      typeof data.recipeName === "string" ? data.recipeName : "สูตรที่กำลังทำ",
    levainStageAtMix:
      levainStageAtMix === "fed" ||
      levainStageAtMix === "bubbles" ||
      levainStageAtMix === "rising" ||
      levainStageAtMix === "doubled" ||
      levainStageAtMix === "peak" ||
      levainStageAtMix === "falling"
        ? levainStageAtMix
        : "unknown",
    observations,
  };
};

const normalizeBakeEntry = (
  data: Record<string, unknown> | null | undefined,
): BakeEntry | null => {
  if (!data?.id || !data?.recipeName) return null;
  return {
    id: String(data.id),
    bakedAt:
      typeof data.bakedAt === "string"
        ? data.bakedAt
        : new Date().toISOString(),
    recipeName: String(data.recipeName),
    predictedBulkMinutes: Math.max(
      1,
      validNumber(data.predictedBulkMinutes, 240),
    ),
    actualBulkMinutes: Math.max(1, validNumber(data.actualBulkMinutes, 240)),
    bulkRise: Math.max(0, validNumber(data.bulkRise, 0)),
    averageDoughTemperature: validNumber(
      data.averageDoughTemperature,
      DEFAULT_SETTINGS.doughTemperature,
    ),
    ovenSpring: Math.min(5, Math.max(1, validNumber(data.ovenSpring, 3))),
    crumb: Math.min(5, Math.max(1, validNumber(data.crumb, 3))),
    sourness: Math.min(5, Math.max(1, validNumber(data.sourness, 3))),
    crust: Math.min(5, Math.max(1, validNumber(data.crust, 3))),
    notes: typeof data.notes === "string" ? data.notes : "",
  };
};

const clamp = (n: number, min = 0) =>
  Math.max(min, Number.isFinite(n) ? n : min);
const round = (n: number) => Math.round(n * 10) / 10;
const clock = (date: Date) =>
  date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
const duration = (hours: number) => {
  const mins = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} ชม.${m ? ` ${m} นาที` : ""}` : `${m} นาที`;
};
const countdown = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};
const starterDaysOld = (birth: string, currentDate: string) => {
  if (!birth || !currentDate) return 0;
  const born = new Date(`${birth}T00:00:00`);
  const current = new Date(`${currentDate}T00:00:00`);
  return Math.max(
    0,
    Math.floor((current.getTime() - born.getTime()) / 86400000),
  );
};

export default function Home() {
  const [temperature, setTemperature] = useState(28);
  const [humidity, setHumidity] = useState(70);
  const [starterOld, setStarterOld] = useState(20);
  const [feedFlour, setFeedFlour] = useState(40);
  const [feedWater, setFeedWater] = useState(40);
  const [wholeWheat, setWholeWheat] = useState(10);
  const [apFlour, setApFlour] = useState(10);
  const [speltFlour, setSpeltFlour] = useState(0);
  const [ryeFlour, setRyeFlour] = useState(0);
  const [flourProfile, setFlourProfile] = useState("");
  const [targetDough, setTargetDough] = useState(800);
  const [hydration, setHydration] = useState(71);
  const [starterPercent, setStarterPercent] = useState(20);
  const [saltPercent, setSaltPercent] = useState(2);
  const [oilPercent, setOilPercent] = useState(0);
  const [doughTemperature, setDoughTemperature] = useState(26);
  const [recipeName, setRecipeName] = useState("สูตรครัวไทยของฉัน");
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState("");
  const [loafCount, setLoafCount] = useState(1);
  const [loavesPerBake, setLoavesPerBake] = useState(1);
  const [proofMode, setProofMode] = useState<ProofMode>("cold");
  const [coldHours, setColdHours] = useState(12);
  const [fridgeTemp, setFridgeTemp] = useState(4);
  const [prepMethod, setPrepMethod] = useState<PrepMethod>("fermentolyse");
  const [adaptiveTempSource, setAdaptiveTempSource] =
    useState<AdaptiveTempSource>("room");
  const [bakeMode, setBakeMode] = useState<BakeMode>("dutch");
  const [steamWater, setSteamWater] = useState(200);
  const [proofOpen, setProofOpen] = useState(true);
  const [bakeOpen, setBakeOpen] = useState(false);
  const [ovenVolume, setOvenVolume] = useState(60);
  const [trayWidth, setTrayWidth] = useState(30);
  const [trayLength, setTrayLength] = useState(20);
  const [steamMinutes, setSteamMinutes] = useState(20);
  const [ovenSeal, setOvenSeal] = useState<"tight" | "normal" | "leaky">(
    "normal",
  );
  const [alertSound, setAlertSound] = useState<AlertSound>("bell");
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [targetBakeAt, setTargetBakeAt] = useState("");
  const [flourTemperature, setFlourTemperature] = useState(28);
  const [levainMixTemperature, setLevainMixTemperature] = useState(26);
  const [frictionFactor, setFrictionFactor] = useState(3);
  const [coldWaterTemperature, setColdWaterTemperature] = useState(8);
  const [warmWaterTemperature, setWarmWaterTemperature] = useState(40);
  const [bannetonShape, setBannetonShape] =
    useState<BannetonShape>("round");
  const [bannetonWidth, setBannetonWidth] = useState(22.9);
  const [bannetonLength, setBannetonLength] = useState(22.9);
  const [bannetonDepth, setBannetonDepth] = useState(8.5);
  const [activePage, setActivePage] = useState<PageId>("home");
  const [activeLessonId, setActiveLessonId] = useState(LEARNING_LESSONS[0].id);
  const [lessonLanguage, setLessonLanguage] =
    useState<LessonLanguage>("all");
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [learningLoaded, setLearningLoaded] = useState(false);
  const [activePhase, setActivePhase] = useState(0);
  const [phaseStart, setPhaseStart] = useState<number | null>(null);
  const [phaseEnd, setPhaseEnd] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(0);
  const [notifyStatus, setNotifyStatus] = useState<
    "default" | "granted" | "denied"
  >("default");
  const [toast, setToast] = useState("");
  const [yeastName, setYeastName] = useState("เจ้าก้อนแป้ง");
  const [yeastBirth, setYeastBirth] = useState("");
  const [savedYeasts, setSavedYeasts] = useState<SavedYeast[]>([]);
  const [activeYeastId, setActiveYeastId] = useState("");
  const [levainStartedAt, setLevainStartedAt] = useState("");
  const [levainTemperature, setLevainTemperature] = useState(28);
  const [levainRise, setLevainRise] = useState(0);
  const [levainStage, setLevainStage] = useState<LevainStage>("fed");
  const [levainNote, setLevainNote] = useState("");
  const [levainObservations, setLevainObservations] = useState<
    LevainObservation[]
  >([]);
  const [bulkRun, setBulkRun] = useState<BulkRun | null>(null);
  const [bulkTemperature, setBulkTemperature] = useState(26);
  const [bulkRise, setBulkRise] = useState(0);
  const [bulkSurface, setBulkSurface] = useState<BulkSurface>("flat");
  const [bulkStrength, setBulkStrength] = useState<BulkStrength>("weak");
  const [bulkBubbles, setBulkBubbles] = useState(false);
  const [bulkJiggle, setBulkJiggle] = useState(false);
  const [bulkNote, setBulkNote] = useState("");
  const [bakeEntries, setBakeEntries] = useState<BakeEntry[]>([]);
  const [journalBulkMinutes, setJournalBulkMinutes] = useState(0);
  const [journalOvenSpring, setJournalOvenSpring] = useState(3);
  const [journalCrumb, setJournalCrumb] = useState(3);
  const [journalSourness, setJournalSourness] = useState(3);
  const [journalCrust, setJournalCrust] = useState(3);
  const [journalNotes, setJournalNotes] = useState("");
  const [pokeResult, setPokeResult] = useState<PokeResult>("slow");
  const [proofRise, setProofRise] = useState(30);
  const [proofTension, setProofTension] =
    useState<ProofTension>("soft");
  const [proofJiggle, setProofJiggle] = useState(true);
  const [crumbPattern, setCrumbPattern] =
    useState<CrumbPattern>("balanced");
  const [starterFeedRatio, setStarterFeedRatio] = useState(5);
  const [starterSeed, setStarterSeed] = useState(10);
  const [flavorTarget, setFlavorTarget] =
    useState<FlavorTarget>("balanced");
  const [today, setToday] = useState("");
  const alertedMilestones = useRef<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const recipeCalibration = useMemo(() => {
    const key = recipeName.trim().toLocaleLowerCase("th-TH");
    const matching = bakeEntries
      .filter(
        (entry) => entry.recipeName.trim().toLocaleLowerCase("th-TH") === key,
      )
      .slice(0, 6);
    if (!matching.length)
      return {
        factor: 1,
        count: 0,
        confidence: 0,
        label: "ยังไม่มีประวัติสูตรนี้",
      };
    const weighted = matching.reduce(
      (result, entry, index) => {
        const weight = Math.max(1, matching.length - index);
        const ratio = entry.actualBulkMinutes / entry.predictedBulkMinutes;
        return {
          total: result.total + ratio * weight,
          weight: result.weight + weight,
        };
      },
      { total: 0, weight: 0 },
    );
    const factor = Math.min(1.22, Math.max(0.78, weighted.total / weighted.weight));
    const difference = Math.round((factor - 1) * 100);
    return {
      factor,
      count: matching.length,
      confidence: Math.min(95, 35 + matching.length * 12),
      label:
        difference === 0
          ? "สูตรนี้ตรงกับค่าฐาน"
          : `สูตรนี้มัก${difference < 0 ? "เร็วกว่า" : "ช้ากว่า"}ค่าฐาน ${Math.abs(difference)}%`,
    };
  }, [bakeEntries, recipeName]);

  const proofReadiness = useMemo(() => {
    const pokeScore = pokeResult === "slow" ? 35 : pokeResult === "fast" ? 12 : 4;
    const riseScore = proofRise >= 20 && proofRise <= 45 ? 25 : proofRise < 12 ? 5 : 12;
    const tensionScore = proofTension === "soft" ? 22 : proofTension === "tight" ? 12 : 4;
    const jiggleScore = proofJiggle ? 18 : 6;
    const score = Math.min(100, pokeScore + riseScore + tensionScore + jiggleScore);
    return {
      score,
      key: score >= 76 ? "ready" : score >= 52 ? "check" : "wait",
      label: score >= 76 ? "ใกล้พร้อมอบ" : score >= 52 ? "เริ่มเช็กถี่ขึ้น" : "ยังควรรอ",
      detail:
        score >= 76
          ? "อาการหลายข้อไปทางเดียวกัน เตรียมอุ่นเตาและยืนยันว่าผิวยังมีแรงตึง"
          : score >= 52
            ? "ยังไม่ควรดู Finger Poke อย่างเดียว เช็กปริมาตร แรงตึง และการสั่นร่วมกัน"
            : "โดว์ยังตึงหรือปริมาตรยังน้อย ให้พักต่อแล้วตรวจซ้ำใน 10–15 นาที",
    };
  }, [pokeResult, proofRise, proofTension, proofJiggle]);

  const starterFeedPlan = useMemo(() => {
    const ratioBase: Record<number, number> = { 1: 4, 2: 6, 5: 10, 10: 14 };
    const baseHours = ratioBase[starterFeedRatio] || 10;
    const temperatureFactor = Math.pow(1.12, 26 - levainTemperature);
    const low = Math.max(2.5, baseHours * temperatureFactor * 0.85);
    const high = Math.max(low + 1, baseHours * temperatureFactor * 1.15);
    return {
      flour: starterSeed * starterFeedRatio,
      water: starterSeed * starterFeedRatio,
      total: starterSeed * (1 + starterFeedRatio * 2),
      low,
      high,
    };
  }, [starterFeedRatio, starterSeed, levainTemperature]);

  const flavorPlan = useMemo(() => {
    if (flavorTarget === "mild")
      return {
        label: "นุ่มนวล เปรี้ยวน้อย",
        starter: 20,
        dough: 26,
        cold: 8,
        note: "ใช้หัวเชื้อช่วงพีคและลดเวลาพักเย็น ไม่ปล่อยให้หัวเชื้อยุบ",
      };
    if (flavorTarget === "tangy")
      return {
        label: "เปรี้ยวชัดขึ้นอย่างควบคุม",
        starter: 15,
        dough: 24,
        cold: 16,
        note: "ใช้การหมักที่เย็นและยาวขึ้น แต่ต้องหยุดบัลก์ตามสภาพโดว์ ไม่ไล่ตามเวลาอย่างเดียว",
      };
    return {
      label: "สมดุล กลิ่นข้าวชัด",
      starter: 20,
      dough: 25,
      cold: 12,
      note: "ใช้หัวเชื้อใกล้พีคและคุมโดว์ช่วง 24–26°C เพื่อบาลานซ์กลิ่นและความเปรี้ยว",
    };
  }, [flavorTarget]);

  const visibleLessons = useMemo(
    () =>
      lessonLanguage === "all"
        ? LEARNING_LESSONS
        : LEARNING_LESSONS.filter(
            (lesson) => lesson.language === lessonLanguage,
          ),
    [lessonLanguage],
  );
  const activeLesson =
    LEARNING_LESSONS.find((lesson) => lesson.id === activeLessonId) ||
    visibleLessons[0] ||
    LEARNING_LESSONS[0];
  const learningProgress = Math.round(
    (completedLessons.length / LEARNING_LESSONS.length) * 100,
  );

  const levainStageForAdaptive =
    bulkRun?.levainStageAtMix && bulkRun.levainStageAtMix !== "unknown"
      ? bulkRun.levainStageAtMix
      : levainStage;
  const levainRiseForAdaptive =
    bulkRun?.levainStageAtMix === "peak" ||
    bulkRun?.levainStageAtMix === "doubled"
      ? 100
      : levainRise;
  const hasLevainActivityData =
    levainObservations.length > 0 ||
    Boolean(
      bulkRun?.levainStageAtMix && bulkRun.levainStageAtMix !== "unknown",
    );
  const levainActivity = useMemo(() => {
    if (!hasLevainActivityData)
      return { factor: 1, label: "ยังไม่ใช้ข้อมูล Levain", tone: "neutral" };
    if (
      levainStageForAdaptive === "peak" ||
      (levainStageForAdaptive === "doubled" && levainRiseForAdaptive >= 100)
    )
      return { factor: 0.92, label: "Levain พีค · หมักไวขึ้น", tone: "strong" };
    if (
      levainStageForAdaptive === "rising" ||
      levainStageForAdaptive === "doubled" ||
      levainRiseForAdaptive >= 70
    )
      return {
        factor: 1.04,
        label: "Levain ใกล้พีค · ช้าลงเล็กน้อย",
        tone: "near",
      };
    if (levainStageForAdaptive === "falling")
      return {
        factor: 1.12,
        label: "Levain เลยพีค · เผื่อเวลามากขึ้น",
        tone: "past",
      };
    return {
      factor: 1.15,
      label: "Levain ยังอ่อน · เผื่อเวลามากขึ้น",
      tone: "weak",
    };
  }, [hasLevainActivityData, levainStageForAdaptive, levainRiseForAdaptive]);

  const fermentationTemperature =
    adaptiveTempSource === "dough" ? doughTemperature : temperature;
  const adaptive = useMemo(() => {
    const tempFactor = Math.pow(2, (26 - fermentationTemperature) / 10);
    const roomTempFactor = Math.pow(2, (26 - temperature) / 10);
    const humidityFactor = humidity < 55 ? 1.06 : humidity > 82 ? 0.96 : 1;
    const wholeFactor =
      1 - (wholeWheat + speltFlour * 0.5 + ryeFlour * 1.4) * 0.0015;
    const starterFactor = Math.pow(20 / Math.max(starterPercent, 5), 0.42);
    const baseBulk =
      4.5 *
      tempFactor *
      humidityFactor *
      wholeFactor *
      starterFactor *
      levainActivity.factor;
    const bulk = baseBulk * recipeCalibration.factor;
    const roomProof = 2.1 * roomTempFactor * humidityFactor;
    const starterPeak =
      6 *
      roomTempFactor *
      Math.pow(Math.max(feedFlour / Math.max(starterOld, 1), 0.25) / 2, 0.22);
    return { tempFactor, baseBulk, bulk, roomProof, starterPeak };
  }, [
    temperature,
    fermentationTemperature,
    humidity,
    wholeWheat,
    speltFlour,
    ryeFlour,
    starterPercent,
    feedFlour,
    starterOld,
    levainActivity.factor,
    recipeCalibration.factor,
  ]);

  const recipe = useMemo(() => {
    const totalDough = targetDough * loafCount;
    const totalFlour =
      totalDough / (1 + hydration / 100 + saltPercent / 100 + oilPercent / 100);
    const levain = (totalFlour * starterPercent) / 100;
    const levainFlour = levain / 2;
    const levainWater = levain / 2;
    const whole = (totalFlour * wholeWheat) / 100;
    const ap = (totalFlour * apFlour) / 100;
    const spelt = (totalFlour * speltFlour) / 100;
    const rye = (totalFlour * ryeFlour) / 100;
    const breadPercent = Math.max(
      0,
      100 - wholeWheat - apFlour - speltFlour - ryeFlour,
    );
    const breadTotal = (totalFlour * breadPercent) / 100;
    const bread = Math.max(0, breadTotal - levainFlour);
    const water = Math.max(0, (totalFlour * hydration) / 100 - levainWater);
    const salt = (totalFlour * saltPercent) / 100;
    const oil = (totalFlour * oilPercent) / 100;
    return {
      totalDough,
      totalFlour,
      levain,
      whole,
      ap,
      spelt,
      rye,
      bread,
      breadPercent,
      water,
      salt,
      oil,
      baked: totalDough * 0.997 * 0.86,
      bakedEach: targetDough * 0.997 * 0.86,
    };
  }, [
    targetDough,
    loafCount,
    hydration,
    starterPercent,
    saltPercent,
    oilPercent,
    wholeWheat,
    apFlour,
    speltFlour,
    ryeFlour,
  ]);

  const waterTemperaturePlan = useMemo(() => {
    const rawTarget =
      doughTemperature * 4 -
      temperature -
      flourTemperature -
      levainMixTemperature -
      frictionFactor;
    const target = Math.min(50, Math.max(1, rawTarget));
    const totalWater = Math.max(0, recipe.water);
    const spread = warmWaterTemperature - coldWaterTemperature;
    const warmRatio =
      spread > 0
        ? Math.min(1, Math.max(0, (target - coldWaterTemperature) / spread))
        : 0;
    const warmWater = totalWater * warmRatio;
    const coldWater = totalWater - warmWater;
    const outsideRange =
      rawTarget < coldWaterTemperature
        ? "colder"
        : rawTarget > warmWaterTemperature
          ? "warmer"
          : "mix";
    return {
      rawTarget,
      target,
      totalWater,
      warmWater,
      coldWater,
      outsideRange,
    };
  }, [
    doughTemperature,
    temperature,
    flourTemperature,
    levainMixTemperature,
    frictionFactor,
    coldWaterTemperature,
    warmWaterTemperature,
    recipe.water,
  ]);

  const bannetonPlan = useMemo(() => {
    const topArea =
      bannetonShape === "round"
        ? Math.PI * Math.pow(bannetonWidth / 2, 2)
        : (Math.PI * bannetonWidth * bannetonLength) / 4;
    const bottomArea = topArea * 0.52;
    const volume =
      (bannetonDepth / 3) *
      (topArea + Math.sqrt(topArea * bottomArea) + bottomArea);
    const doughFactor = bannetonShape === "round" ? 0.38 : 0.43;
    const recommended = Math.round((volume * doughFactor) / 10) * 10;
    const low = Math.round((recommended * 0.88) / 10) * 10;
    const high = Math.round((recommended * 1.12) / 10) * 10;
    const fitRatio = targetDough / Math.max(1, recommended);
    const fit =
      fitRatio < 0.84
        ? { key: "small", label: "โดว์น้อยไป", detail: "ก้อนอาจแผ่และไม่พยุงเต็มผิวตะกร้า" }
        : fitRatio > 1.16
          ? { key: "large", label: "โดว์มากไป", detail: "เสี่ยงล้นและติดผ้าระหว่าง Final Proof" }
          : { key: "good", label: "ขนาดเหมาะสม", detail: "น้ำหนักโดว์อยู่ในช่วงที่ตะกร้าพยุงทรงได้ดี" };
    return { topArea, volume, recommended, low, high, fitRatio, fit };
  }, [
    bannetonShape,
    bannetonWidth,
    bannetonLength,
    bannetonDepth,
    targetDough,
  ]);

  const bulkRiseTarget = useMemo(() => {
    const coldTarget =
      fermentationTemperature >= 29
        ? 25
        : fermentationTemperature >= 27
          ? 30
          : fermentationTemperature >= 24
            ? 50
            : 75;
    return proofMode === "room" ? Math.min(80, coldTarget + 15) : coldTarget;
  }, [fermentationTemperature, proofMode]);

  const levainPeakHours = useMemo(() => {
    const tempFactor = Math.pow(2, (26 - levainTemperature) / 10);
    return (
      6 *
      tempFactor *
      Math.pow(Math.max(feedFlour / Math.max(starterOld, 1), 0.25) / 2, 0.22)
    );
  }, [levainTemperature, feedFlour, starterOld]);

  const levainReadiness = useMemo(() => {
    if (levainStage === "falling")
      return {
        key: "past",
        label: "เลยพีคแล้ว",
        detail: "เริ่มยุบ ควรให้อาหารใหม่หรือใช้ทันทีถ้ายังมีกำลัง",
      };
    if (
      levainStage === "peak" ||
      (levainStage === "doubled" && levainRise >= 100)
    )
      return {
        key: "ready",
        label: "พร้อมใช้",
        detail: "ขึ้นอย่างน้อยสองเท่า มีฟองทั่ว และยอดยังนูน",
      };
    if (
      levainStage === "rising" ||
      levainStage === "doubled" ||
      levainRise >= 70
    )
      return {
        key: "near",
        label: "ใกล้พร้อม",
        detail: "รอให้ขึ้นเต็มกำลังและยอดโดมก่อนนำไปผสม",
      };
    return {
      key: "waiting",
      label: "กำลังพัฒนา",
      detail: "ติดตามเปอร์เซ็นต์การขึ้น ฟอง และรูปทรงของยอดต่อ",
    };
  }, [levainStage, levainRise]);

  const yeastAge = useMemo(() => {
    if (!yeastBirth || !today)
      return { days: 0, years: 0, months: 0, ready: false };
    const born = new Date(`${yeastBirth}T00:00:00`);
    const current = new Date(`${today}T00:00:00`);
    const days = Math.max(
      0,
      Math.floor((current.getTime() - born.getTime()) / 86400000),
    );
    const years = Math.floor(days / 365.2425);
    const months = Math.floor((days - years * 365.2425) / 30.44);
    return { days, years, months, ready: current >= born };
  }, [yeastBirth, today]);

  const fermentolyseHours =
    doughTemperature >= 30 ? 0.33 : doughTemperature >= 27 ? 0.5 : 0.67;
  const autolyseHours =
    doughTemperature >= 30 ? 0.33 : doughTemperature >= 27 ? 0.5 : 0.75;
  const prepRestHours =
    prepMethod === "autolyse" ? autolyseHours : fermentolyseHours;
  const mixDevelopHours = prepMethod === "autolyse" ? 0.33 : 0.25;
  const bulkElapsedBeforePhaseFour =
    (prepMethod === "fermentolyse" ? prepRestHours : 0) + mixDevelopHours + 1.5;
  const bulkReadiness = useMemo(() => {
    const precision = adaptiveTempSource === "dough" ? 0.11 : 0.17;
    return {
      startCheck: adaptive.bulk * (1 - precision - 0.08),
      windowStart: adaptive.bulk * (1 - precision),
      windowEnd: adaptive.bulk * (1 + precision),
      remainingStart: Math.max(
        0.25,
        adaptive.bulk * (1 - precision) - bulkElapsedBeforePhaseFour,
      ),
      remainingEnd: Math.max(
        0.5,
        adaptive.bulk * (1 + precision) - bulkElapsedBeforePhaseFour,
      ),
    };
  }, [adaptive.bulk, adaptiveTempSource, bulkElapsedBeforePhaseFour]);
  const latestBulkObservation = bulkRun?.observations.at(-1) || null;
  const liveBulk = useMemo(() => {
    const observations = bulkRun?.observations || [];
    const latest = observations.at(-1) || null;
    if (!bulkRun || !latest) {
      return {
        key: "waiting",
        label: "ยังไม่ได้เริ่มบันทึก",
        detail:
          "เริ่มรอบ Bulk แล้วบันทึกการเปลี่ยนแปลงเพื่อคำนวณเวลาจากโดว์จริง",
        cueScore: 0,
        elapsedMinutes: 0,
        remainingMinutes: Math.round(adaptive.bulk * 60),
        readyLow: null as Date | null,
        readyHigh: null as Date | null,
        confidence: 0,
        rate: 0,
      };
    }
    const started = new Date(bulkRun.startedAt).getTime();
    const currentTime = now || Date.now();
    const elapsedMinutes = Math.max(
      latest.elapsedMinutes,
      Number.isFinite(started) ? (currentTime - started) / 60000 : 0,
    );
    const baselineRemaining = Math.max(0, adaptive.bulk * 60 - elapsedMinutes);
    const currentTempFactor = Math.pow(
      2,
      (fermentationTemperature - latest.temperature) / 10,
    );
    const tempAdjustedBaseline = baselineRemaining * currentTempFactor;
    const previous = observations.length > 1 ? observations.at(-2)! : null;
    const deltaMinutes = previous
      ? latest.elapsedMinutes - previous.elapsedMinutes
      : latest.elapsedMinutes;
    const deltaRise = previous ? latest.rise - previous.rise : latest.rise;
    const rate =
      deltaMinutes >= 10 && deltaRise > 0 ? (deltaRise / deltaMinutes) * 60 : 0;
    const remainingRise = Math.max(0, bulkRiseTarget - latest.rise);
    const observedRemaining =
      rate > 0 ? (remainingRise / rate) * 60 * 0.88 : tempAdjustedBaseline;
    const hasUsefulRate = rate >= 2;
    let remainingMinutes = hasUsefulRate
      ? observedRemaining * 0.62 + tempAdjustedBaseline * 0.38
      : tempAdjustedBaseline;
    const cueScore =
      (latest.surface === "domed" ? 1 : 0) +
      (latest.bubbles ? 1 : 0) +
      (latest.jiggle ? 1 : 0) +
      (latest.strength === "holding" ? 1 : 0);
    const overRisk =
      latest.rise >= bulkRiseTarget + 18 ||
      (latest.rise >= bulkRiseTarget + 8 && latest.strength === "weak");
    const ready = latest.rise >= bulkRiseTarget * 0.9 && cueScore >= 3;
    const near = latest.rise >= bulkRiseTarget * 0.65 || remainingMinutes <= 50;
    const developing = latest.rise >= Math.min(20, bulkRiseTarget * 0.4);
    let key = "early";
    let label = "ยังเร็วเกินไป";
    let detail = "ให้โดว์พัฒนาต่อและบันทึกอีกครั้งใน 30–45 นาที";
    if (developing) {
      key = "developing";
      label = "กำลังพัฒนา";
      detail = "การหมักเดินแล้ว ติดตามอุณหภูมิและเปอร์เซ็นต์การขึ้นต่อ";
    }
    if (near) {
      key = "near";
      label = "เริ่มตรวจถี่ขึ้น";
      detail =
        "บันทึกทุก 15–20 นาที และดูผิว ฟอง การสั่น กับแรงเก็บทรงพร้อมกัน";
    }
    if (ready) {
      key = "ready";
      label = "พร้อมพรีเชป";
      detail = "ปริมาตรและอาการโดว์สอดคล้องกัน สามารถจบบัลก์ได้";
      remainingMinutes = 0;
    }
    if (overRisk) {
      key = "risk";
      label = "เสี่ยงหมักเกิน";
      detail =
        "จบบัลก์และพรีเชปทันทีอย่างนุ่มนวล ตรวจว่าโดว์ยังเก็บทรงได้หรือไม่";
      remainingMinutes = 0;
    }
    const confidence = Math.min(
      95,
      28 + observations.length * 14 + (hasUsefulRate ? 18 : 0) + cueScore * 5,
    );
    const readyLow = new Date(currentTime + remainingMinutes * 0.78 * 60000);
    const readyHigh = new Date(currentTime + remainingMinutes * 1.22 * 60000);
    return {
      key,
      label,
      detail,
      cueScore,
      elapsedMinutes,
      remainingMinutes,
      readyLow,
      readyHigh,
      confidence,
      rate,
    };
  }, [bulkRun, now, adaptive.bulk, fermentationTemperature, bulkRiseTarget]);
  const proofAdaptive = useMemo(() => {
    const startTemperature =
      latestBulkObservation?.temperature ?? doughTemperature;
    const massFactor = Math.pow(Math.max(350, targetDough) / 800, 0.42);
    const coolingTau = Math.min(4.2, Math.max(1.6, 2.25 * massFactor));
    const coolToEightHours =
      fridgeTemp < 8 && startTemperature > 8
        ? coolingTau *
          Math.log(
            Math.max(
              1,
              (startTemperature - fridgeTemp) / Math.max(0.5, 8 - fridgeTemp),
            ),
          )
        : 0;
    const coreAfterTwoHours =
      fridgeTemp + (startTemperature - fridgeTemp) * Math.exp(-2 / coolingTau);
    const bulkRatio = latestBulkObservation
      ? latestBulkObservation.rise / Math.max(1, bulkRiseTarget)
      : 0.75;
    const heatAdjustment = Math.max(0, startTemperature - 25) * 0.55;
    const fridgeAdjustment = (fridgeTemp - 4) * 1.15;
    const massAdjustment = Math.max(0, targetDough - 800) / 500;
    const bulkAdjustment = (bulkRatio - 0.75) * 3.2;
    const recommendedCold = Math.min(
      18,
      Math.max(
        6,
        12 -
          heatAdjustment -
          fridgeAdjustment -
          massAdjustment -
          bulkAdjustment,
      ),
    );
    const windowLow = Math.max(6, recommendedCold - 2);
    const windowHigh = Math.min(20, recommendedCold + 2.5);
    const roomFinish = Math.max(
      0.45,
      adaptive.roomProof *
        Math.min(1.1, Math.max(0.48, 1.05 - bulkRatio * 0.42)),
    );
    const comboRoom = Math.max(
      0.35,
      Math.min(1.25, 0.72 * adaptive.tempFactor * (1.12 - bulkRatio * 0.3)),
    );
    const coldStatus =
      coldHours < windowLow
        ? { key: "short", label: "ยังสั้นกว่าช่วงแนะนำ" }
        : coldHours > windowHigh
          ? { key: "risk", label: "เสี่ยงพรูฟเกิน" }
          : { key: "good", label: "อยู่ในช่วงแนะนำ" };
    return {
      startTemperature,
      coolingTau,
      coolToEightHours,
      coreAfterTwoHours,
      bulkRatio,
      recommendedCold,
      windowLow,
      windowHigh,
      roomFinish,
      comboRoom,
      coldStatus,
    };
  }, [
    latestBulkObservation,
    doughTemperature,
    targetDough,
    fridgeTemp,
    bulkRiseTarget,
    adaptive.roomProof,
    adaptive.tempFactor,
    coldHours,
  ]);
  const finalProofHours =
    proofMode === "room"
      ? proofAdaptive.roomFinish
      : proofMode === "cold"
        ? coldHours
        : proofAdaptive.comboRoom + coldHours;
  const bakeBatches = Math.ceil(loafCount / Math.min(loafCount, loavesPerBake));
  const extraShapingHours = (Math.max(0, loafCount - 1) * 13) / 60;
  const bakeCycleHours =
    (bakeMode === "dutch" ? 0.33 : steamMinutes / 60) + 0.38;
  const steamCalculation = useMemo(() => {
    const area = Math.max(100, trayWidth * trayLength);
    const sealFactor =
      ovenSeal === "tight" ? 0.85 : ovenSeal === "leaky" ? 1.2 : 1;
    const areaFactor = Math.min(1.2, Math.max(0.8, Math.sqrt(area / 600)));
    const raw = (ovenVolume * 2.2 + steamMinutes * 3) * sealFactor * areaFactor;
    const recommended = Math.round(Math.min(350, Math.max(100, raw)) / 10) * 10;
    return {
      area,
      sealFactor,
      areaFactor,
      recommended,
      low: Math.round((recommended * 0.8) / 10) * 10,
      high: Math.round((recommended * 1.2) / 10) * 10,
      depth: round((recommended / area) * 10),
    };
  }, [ovenVolume, trayWidth, trayLength, steamMinutes, ovenSeal]);

  const phases = useMemo<Phase[]>(
    () => [
      prepMethod === "autolyse"
        ? {
            icon: "01",
            title: "ออโตไลซ์",
            subtitle: "พักแป้งกับน้ำก่อน ยังไม่ใส่หัวเชื้อและเกลือ",
            hours: prepRestHours,
            temp: `โดว์ ${doughTemperature}°C`,
            cue: "แป้งดูดน้ำทั่ว ไม่มีผงแห้ง โดว์คลายตัวและยืดได้ดีขึ้น",
            guide: [
              `ผสมแป้ง Bread / AP / Spelt / Whole Wheat / Rye ตามสูตรกับน้ำ โดยเก็บน้ำไว้ 20–30 กรัม`,
              "ยังไม่ใส่หัวเชื้อและเกลือ ผสมเพียงจนไม่เหลือผงแห้ง ไม่ต้องนวดให้เนียน",
              `คลุมและพัก ${duration(prepRestHours)} — ระวังไม่พักนานเกินไปในห้องที่ร้อน`,
            ],
          }
        : {
            icon: "01",
            title: "เฟอร์เมนโตไลซ์",
            subtitle: "ละลายหัวเชื้อในน้ำ ใส่แป้งแล้วพัก",
            hours: prepRestHours,
            temp: `โดว์ ${doughTemperature}°C`,
            cue: "หัวเชื้อกระจายทั่ว แป้งดูดน้ำ ไม่มีผงแห้ง และโดว์เริ่มยืด",
            guide: [
              `ละลายหัวเชื้อ ${round(recipe.levain)} กรัมในน้ำ โดยเก็บน้ำไว้ 20–30 กรัมสำหรับละลายเกลือ`,
              "ใส่แป้ง Bread / AP / Spelt / Whole Wheat / Rye ตามสูตรที่เลือก ผสมจนไม่เหลือผงแห้ง ไม่ต้องนวดให้เนียน",
              `คลุมและพัก ${duration(prepRestHours)} — หลังผสมวัดอุณหภูมิกลางโด เป้าหมาย ${doughTemperature}°C`,
            ],
          },
      {
        icon: "02",
        title: "มิกซ์แอนด์ดีเวลลอป",
        subtitle:
          prepMethod === "autolyse"
            ? "เติมหัวเชื้อ ตามด้วยน้ำเกลือและพัฒนากลูเตน"
            : "เติมน้ำเกลือและพัฒนากลูเตน",
        hours: mixDevelopHours,
        temp: `โดว์ ${doughTemperature}°C`,
        cue: "หัวเชื้อและน้ำเกลือกระจายทั่ว โดว์เนียนขึ้น จับตัวเป็นก้อน และดึงได้โดยไม่ขาดทันที",
        guide:
          prepMethod === "autolyse"
            ? [
                `ปาดหัวเชื้อสุก ${round(recipe.levain)} กรัมลงบนโดว์ บีบและพับจนกระจายทั่ว`,
                "ละลายเกลือในน้ำ 20–30 กรัมที่เก็บไว้ แล้วค่อย ๆ เติมจนโดว์ดูดหมด",
                oilPercent > 0
                  ? `เมื่อโดว์เริ่มมีกลูเตน ใส่น้ำมัน ${round(recipe.oil)} กรัม แล้วพับจนซึมหมด`
                  : "พัก 5 นาที แล้วใช้รูโบด์หรือสแลปแอนด์โฟลด์ 5–8 นาทีตามความแข็งแรง",
              ]
            : [
                "ละลายเกลือในน้ำ 20–30 กรัมที่เก็บไว้",
                "ค่อย ๆ เทลงโดว์ ใช้วิธีบีบและพับจนโดว์ดูดน้ำเกลือหมด",
                oilPercent > 0
                  ? `เมื่อโดว์เริ่มมีกลูเตน ใส่น้ำมัน ${round(recipe.oil)} กรัม แล้วพับจนซึมหมด`
                  : "พัก 5 นาที แล้วใช้รูโบด์หรือสแลปแอนด์โฟลด์ 5–8 นาทีตามความแข็งแรง",
              ],
      },
      {
        icon: "03",
        title: "สเตร็งธ์บิลดิง",
        subtitle: "พับโดว์ 3 รอบ",
        hours: 1.5,
        temp: `โดว์ ${doughTemperature}°C`,
        cue: "หลังพับรอบสุดท้ายโดว์ตั้งทรง ผิวตึง และมีฟองเล็กด้านข้าง",
        guide: [
          "นาที 30: สเตรตช์แอนด์โฟลด์รอบที่ 1 ให้ครบ 4 ด้าน",
          "นาที 60: คอยล์โฟลด์รอบที่ 2 อย่างนุ่มนวล",
          "นาที 90: คอยล์โฟลด์รอบที่ 3 แล้วหยุดจับโดว์เพื่อรักษาฟอง",
        ],
      },
      {
        icon: "04",
        title: "บัลก์เฟอร์เมนเทชัน",
        subtitle: `คาดว่าพร้อม ${duration(bulkReadiness.windowStart)}–${duration(bulkReadiness.windowEnd)} หลังเริ่มหมัก`,
        hours: Math.max(0.25, adaptive.bulk - bulkElapsedBeforePhaseFour),
        temp: `${adaptiveTempSource === "dough" ? "โดว์" : "ห้อง"} ${fermentationTemperature}°C`,
        cue: `พร้อมจริงเมื่อขึ้นประมาณ ${bulkRiseTarget}% ผิวโค้งนูน มีฟองริมกล่อง สั่นคล้ายเจล และยังมีแรงเก็บทรง`,
        guide: [
          `เริ่มตรวจตั้งแต่บัลก์รวม ${duration(bulkReadiness.startCheck)}; ช่วงคาดว่าพร้อม ${duration(bulkReadiness.windowStart)}–${duration(bulkReadiness.windowEnd)} หลังหัวเชื้อเริ่มทำงาน`,
          `ระบบคำนวณจากอุณหภูมิ${adaptiveTempSource === "dough" ? "กลางโดว์ที่วัดจริง" : "ห้อง"} ${fermentationTemperature}°C · ก่อนถึงขั้นตอนนี้หมักไปแล้วประมาณ ${duration(bulkElapsedBeforePhaseFour)}`,
          `ทำเครื่องหมายระดับเริ่มต้นในกล่องผนังตรง และเริ่มพรีเชปเมื่อเพิ่มประมาณ ${bulkRiseTarget}%`,
          proofMode === "room"
            ? "รูมพรูฟยังหมักต่อ จึงหยุดบัลก์ก่อนโดว์พองเต็มและยืนยันด้วยสภาพโดว์"
            : "โดว์ยังหมักต่อระหว่างขึ้นรูปและช่วงแรกในตู้เย็น จึงไม่ควรรอให้ขึ้นสองเท่า",
        ],
      },
      {
        icon: "05",
        title: "พรีเชปและเบนช์เรสต์",
        subtitle:
          loafCount > 1 ? `แบ่งและพรีเชป ${loafCount} โลฟ` : "ขึ้นรูปเบื้องต้น",
        hours: (20 + Math.max(0, loafCount - 1) * 5) / 60,
        temp: "อุณหภูมิห้อง",
        cue: "ก้อนคลายตัวเล็กน้อยแต่ยังรักษาทรง ไม่แผ่แบน",
        guide: [
          loafCount > 1
            ? `ชั่งและแบ่งโดว์เป็น ${loafCount} ก้อน ก้อนละประมาณ ${targetDough} กรัม`
            : "เทโดว์ลงโต๊ะโดยรักษาแก๊ส ใช้ที่ตัดรวบให้เป็นก้อนกลม",
          "รวบแต่ละก้อนให้กลมโดยรักษาแก๊ส แล้วพัก 15–20 นาที",
          "ถ้าโดว์แผ่มาก ให้รวบซ้ำเบา ๆ และพักอีก 10 นาที",
        ],
      },
      {
        icon: "06",
        title: "ไฟนอลเชป",
        subtitle:
          loafCount > 1
            ? `ขึ้นรูป ${loafCount} โลฟและลงตะกร้า`
            : "ขึ้นรูปและลงตะกร้า",
        hours: (15 + Math.max(0, loafCount - 1) * 8) / 60,
        temp: "อุณหภูมิห้อง",
        cue: "ผิวด้านนอกตึง รอยต่อปิดสนิท โดยไม่ฉีกผิวโดว์",
        guide: [
          "โรยแป้งบาง ๆ พลิกด้านเรียบลง แล้วพับสร้างแรงตึง",
          loafCount > 1
            ? `ขึ้นรูปทีละก้อน ใช้เวลารวมประมาณ ${15 + Math.max(0, loafCount - 1) * 8} นาที`
            : "ม้วนให้แน่นพอดี ไม่บีบไล่แก๊สทั้งหมด",
          "วางด้านรอยต่อขึ้นในตะกร้าที่โรยแป้งข้าวเจ้า",
        ],
      },
      {
        icon: "07",
        title: "ไฟนอลพรูฟ",
        subtitle:
          proofMode === "room"
            ? "นอกตู้เย็น"
            : proofMode === "cold"
              ? "ในตู้เย็น"
              : "ผสมรูม + โคลด์",
        hours: finalProofHours,
        temp: proofMode === "room" ? `${temperature}°C` : `${fridgeTemp}°C`,
        cue:
          proofMode === "room"
            ? "กดนิ้วแล้วรอยบุ๋มเด้งกลับช้า ๆ และเหลือรอยตื้น"
            : "โดว์เย็นและแน่นขึ้น ปริมาตรเพิ่มเล็กน้อย ตัดลายได้คม",
        guide:
          proofMode === "room"
            ? [
                `พักประมาณ ${duration(proofAdaptive.roomFinish)} ที่ ${temperature}°C ตามสภาพโดว์หลังจบบัลก์`,
                "คลุมถุงเพื่อกันผิวแห้ง เริ่มทดสอบกดนิ้วก่อนครบเวลา 20 นาที",
                "เด้งกลับเร็ว = ยังอ่อน / ไม่เด้งเลย = เกิน / เด้งช้า = พร้อมอบ",
              ]
            : proofMode === "cold"
              ? [
                  `ปิดถุงให้สนิท แช่ ${fridgeTemp}°C ประมาณ ${coldHours} ชั่วโมง`,
                  "นำออกจากตู้เย็นแล้วกรีดและอบได้ทันที ไม่ต้องคืนอุณหภูมิ",
                  "ตู้เย็นเกิน 6°C โดว์จะหมักเร็วขึ้น ควรลดเวลาโคลด์พรูฟ",
                ]
              : [
                  `พักนอกตู้ประมาณ ${duration(proofAdaptive.comboRoom)} ก่อนเข้าตู้เย็น`,
                  `แช่ ${fridgeTemp}°C ต่ออีก ${coldHours} ชั่วโมง`,
                  "เหมาะเมื่อบัลก์จบค่อนข้างเร็วและต้องการเพิ่มกลิ่นรส",
                ],
      },
      {
        icon: "08",
        title: "พรีฮีตและสกอร์",
        subtitle: "อุ่นเตาและกรีด",
        hours: 0.75,
        temp: "250°C",
        cue: "เตาและภาชนะสะสมความร้อนเต็มที่ ใบมีดกรีดลึก 0.5–1 ซม.",
        guide:
          bakeMode === "dutch"
            ? [
                "วางดัตช์โอเวนพร้อมฝาในเตา อุ่นที่ 250°C อย่างน้อย 45 นาที",
                "คว่ำโดว์เย็นลงกระดาษรอง ปัดแป้งส่วนเกินและกรีดมุม 30–45°",
                "ระวังภาชนะร้อนจัด ใช้ถุงมือกันความร้อนทั้งสองมือ",
              ]
            : [
                "วางเบกกิงสตีลหรือเบกกิงสโตนชั้นกลาง และถาดโลหะหนาชั้นล่าง",
                "อุ่นเตา 250°C อย่างน้อย 45–60 นาที",
                "ต้มน้ำให้เดือดเตรียมไว้ ห้ามใช้ภาชนะแก้วสำหรับสร้างไอน้ำ",
              ],
      },
      {
        icon: "09",
        title: "สตีมเบก",
        subtitle:
          bakeMode === "dutch"
            ? `อบปิดฝา · ${bakeBatches} รอบอบ`
            : `อบเปิดพร้อมไอน้ำ · ${bakeBatches} รอบอบ`,
        hours: bakeMode === "dutch" ? 0.33 : steamMinutes / 60,
        temp: "240–250°C",
        cue: "ก้อนขยายเต็มที่ รอยกรีดเปิดและเริ่มเกิดหูขนมปัง",
        guide:
          bakeMode === "dutch"
            ? [
                `อบพร้อมกัน ${Math.min(loafCount, loavesPerBake)} โลฟ · รวม ${bakeBatches} รอบอบ`,
                "ยกโดว์ลงดัตช์โอเวนร้อน ปิดฝา และอบ 20 นาทีที่ 240–250°C",
                bakeBatches > 1
                  ? "จบรอบดรายเบกแล้ว อุ่นหม้อกลับให้ร้อน 10–15 นาทีก่อนรอบถัดไป"
                  : "ไม่จำเป็นต้องใส่น้ำ เพราะความชื้นจากโดว์ถูกกักไว้ในหม้อ",
              ]
            : [
                `อบพร้อมกัน ${Math.min(loafCount, loavesPerBake)} โลฟ · รวม ${bakeBatches} รอบอบ`,
                `เทน้ำเดือด ${steamWater} มล. ลงถาดโลหะร้อน แล้วอบ ${steamMinutes} นาที`,
                "เทน้ำจากด้านข้างอย่างระวังไอน้ำลวก และอย่าราดโดนกระจกเตา",
              ],
      },
      {
        icon: "10",
        title: "ดรายเบก",
        subtitle: "ไล่ความชื้นและทำสี",
        hours: 0.38,
        temp: "220–230°C",
        cue: "เปลือกน้ำตาลเข้มทั่ว เคาะก้นมีเสียงโปร่ง อุณหภูมิแกน 96–98°C",
        guide:
          bakeMode === "dutch"
            ? [
                "เปิดฝา ลดไฟเหลือ 220–230°C แล้วอบต่อ 20–25 นาที",
                "ถ้าสีเร็วให้ลดเหลือ 210°C แต่ไม่ควรรีบนำออก",
                "แง้มประตูเตา 3–5 นาทีท้ายเพื่อเปลือกกรอบ",
              ]
            : [
                "นำถาดน้ำออกหรือระบายไอน้ำ ลดไฟเหลือ 220–230°C",
                "อบต่อ 20–25 นาที หมุนก้อนถ้าสีไม่สม่ำเสมอ",
                "แง้มประตูเตา 3–5 นาทีท้ายเพื่อเปลือกกรอบ",
              ],
      },
      {
        icon: "11",
        title: "คูลดาวน์",
        subtitle: "พักให้เนื้อเซ็ตตัว",
        hours: 2,
        temp: "อุณหภูมิห้อง",
        cue: "ก้อนเย็นเกือบสนิท เปลือกแห้ง และไอน้ำภายในกระจายตัวแล้ว",
        guide: [
          "ย้ายขึ้นตะแกรงทันที ให้อากาศผ่านรอบก้อน",
          "รออย่างน้อย 2 ชั่วโมงก่อนตัด; ก้อนใหญ่รอ 3 ชั่วโมง",
          "การตัดเร็วทำให้เนื้อเหนียวและดูเหมือนอบไม่สุก",
        ],
      },
    ],
    [
      temperature,
      doughTemperature,
      prepMethod,
      prepRestHours,
      mixDevelopHours,
      recipe.levain,
      recipe.oil,
      oilPercent,
      bulkRiseTarget,
      bulkReadiness,
      adaptive.bulk,
      proofAdaptive,
      adaptiveTempSource,
      fermentationTemperature,
      bulkElapsedBeforePhaseFour,
      proofMode,
      finalProofHours,
      fridgeTemp,
      coldHours,
      bakeMode,
      steamWater,
      steamMinutes,
      loafCount,
      loavesPerBake,
      bakeBatches,
      targetDough,
    ],
  );

  const playAlertSound = (sound: AlertSound = alertSound) => {
    if (
      sound === "none" ||
      typeof window === "undefined" ||
      !("AudioContext" in window)
    )
      return;
    try {
      const context = audioContextRef.current || new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const patterns: Record<
        Exclude<AlertSound, "none">,
        { frequency: number; delay: number; duration: number; volume: number }[]
      > = {
        bell: [
          { frequency: 880, delay: 0, duration: 0.28, volume: 0.18 },
          { frequency: 880, delay: 0.36, duration: 0.28, volume: 0.18 },
          { frequency: 1174.66, delay: 0.72, duration: 0.48, volume: 0.2 },
          { frequency: 880, delay: 1.35, duration: 0.28, volume: 0.18 },
          { frequency: 880, delay: 1.71, duration: 0.28, volume: 0.18 },
          { frequency: 1174.66, delay: 2.07, duration: 0.48, volume: 0.2 },
          { frequency: 1318.51, delay: 2.7, duration: 0.28, volume: 0.16 },
          { frequency: 1174.66, delay: 3.06, duration: 0.28, volume: 0.16 },
          { frequency: 880, delay: 3.42, duration: 0.75, volume: 0.19 },
        ],
        chime: [
          { frequency: 659.25, delay: 0, duration: 0.18, volume: 0.14 },
          { frequency: 783.99, delay: 0.22, duration: 0.18, volume: 0.14 },
          { frequency: 987.77, delay: 0.44, duration: 0.35, volume: 0.17 },
          { frequency: 659.25, delay: 0.95, duration: 0.18, volume: 0.14 },
          { frequency: 783.99, delay: 1.17, duration: 0.18, volume: 0.14 },
          { frequency: 987.77, delay: 1.39, duration: 0.35, volume: 0.17 },
          { frequency: 987.77, delay: 1.95, duration: 0.18, volume: 0.15 },
          { frequency: 783.99, delay: 2.17, duration: 0.18, volume: 0.15 },
          { frequency: 659.25, delay: 2.39, duration: 0.55, volume: 0.16 },
        ],
        soft: [
          { frequency: 440, delay: 0, duration: 0.42, volume: 0.08 },
          { frequency: 554.37, delay: 0.48, duration: 0.42, volume: 0.08 },
          { frequency: 659.25, delay: 0.96, duration: 0.7, volume: 0.09 },
          { frequency: 440, delay: 1.85, duration: 0.42, volume: 0.08 },
          { frequency: 554.37, delay: 2.33, duration: 0.42, volume: 0.08 },
          { frequency: 659.25, delay: 2.81, duration: 0.8, volume: 0.09 },
        ],
      };
      const start = context.currentTime + 0.03;
      patterns[sound].forEach((note) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = sound === "bell" ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(note.frequency, start + note.delay);
        gain.gain.setValueAtTime(0.0001, start + note.delay);
        gain.gain.exponentialRampToValueAtTime(
          note.volume,
          start + note.delay + 0.02,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + note.delay + note.duration,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start + note.delay);
        oscillator.stop(start + note.delay + note.duration + 0.05);
      });
    } catch {
      setToast("เบราว์เซอร์นี้ไม่สามารถเล่นเสียงแจ้งเตือนได้");
    }
  };

  const changeAlertSound = (sound: AlertSound) => {
    setAlertSound(sound);
    setSoundMenuOpen(false);
    const next = { ...currentSettings(), alertSound: sound };
    try {
      localStorage.setItem("doughgarden-settings", JSON.stringify(next));
    } catch {
      /* The selector remains usable without storage. */
    }
    if (sound !== "none") playAlertSound(sound);
  };

  const openPage = (page: PageId) => {
    setActivePage(page);
    setSoundMenuOpen(false);
    try {
      localStorage.setItem("doughgarden-active-page", page);
      window.history.replaceState(null, "", `#${page}`);
    } catch {
      /* Navigation remains usable when browser storage is unavailable. */
    }
    window.requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  };

  useEffect(() => {
    if (!running || !phaseStart || !phaseEnd) return;
    const milestones: TimerMilestone[] =
      activePhase === 2
        ? STRENGTH_MILESTONES
        : [
            {
              minutes: phases[activePhase].hours * 60,
              title: phases[activePhase].title,
              body: phases[activePhase].cue,
            },
          ];
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      milestones.forEach((milestone, index) => {
        const target = phaseStart + milestone.minutes * 60000;
        if (time >= target && !alertedMilestones.current.has(index)) {
          alertedMilestones.current.add(index);
          setToast(`ครบ ${milestone.minutes} นาที — ${milestone.title}`);
          if (notifyStatus === "granted" && "Notification" in window) {
            try {
              new Notification(`DoughGarden — ${milestone.title}`, {
                body: milestone.body,
                tag: `doughgarden-${activePhase}-${index}`,
              });
            } catch {
              /* Some mobile browsers require installed-app notifications. */
            }
          }
          playAlertSound();
          if (index === milestones.length - 1) setRunning(false);
        }
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phaseStart, phaseEnd, phases, activePhase, notifyStatus]);

  useEffect(() => {
    if (!bulkRun?.startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [bulkRun?.startedAt]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localToday = new Date();
      localToday.setMinutes(
        localToday.getMinutes() - localToday.getTimezoneOffset(),
      );
      setToday(localToday.toISOString().slice(0, 10));
      setNow(Date.now());
      if ("Notification" in window) setNotifyStatus(Notification.permission);
      try {
        const saved = JSON.parse(
          localStorage.getItem("doughgarden-yeast") || "null",
        );
        if (saved?.name) setYeastName(saved.name);
        if (saved?.birth) setYeastBirth(saved.birth);
        const savedList = JSON.parse(
          localStorage.getItem("doughgarden-starters") || "[]",
        );
        if (Array.isArray(savedList)) {
          const validList = savedList.filter((item): item is SavedYeast =>
            Boolean(item?.id && item?.name && item?.birth),
          );
          if (!validList.length && saved?.birth) {
            const migrated: SavedYeast = {
              id: `เดิม-${Date.now()}`,
              name: saved.name || "เจ้าก้อนแป้ง",
              birth: saved.birth,
              savedAt: new Date().toISOString(),
            };
            localStorage.setItem(
              "doughgarden-starters",
              JSON.stringify([migrated]),
            );
            setSavedYeasts([migrated]);
            setActiveYeastId(migrated.id);
          } else {
            setSavedYeasts(validList);
            if (validList[0]) setActiveYeastId(validList[0].id);
          }
        }
        const recipeList = JSON.parse(
          localStorage.getItem("doughgarden-recipes") || "[]",
        );
        if (Array.isArray(recipeList)) {
          const validRecipes = recipeList
            .map((item) => normalizeRecipe(item))
            .filter((item): item is SavedRecipe => item !== null);
          setSavedRecipes(validRecipes);
        }
        const bakeJournalList = JSON.parse(
          localStorage.getItem("doughgarden-bake-journal") || "[]",
        );
        if (Array.isArray(bakeJournalList)) {
          const validEntries = bakeJournalList
            .map((item) => normalizeBakeEntry(item))
            .filter((item): item is BakeEntry => item !== null);
          setBakeEntries(validEntries);
        }
        const levainBuild = JSON.parse(
          localStorage.getItem("doughgarden-levain-build") || "null",
        ) as LevainBuild | null;
        if (levainBuild?.startedAt) {
          setLevainStartedAt(levainBuild.startedAt);
          setLevainTemperature(
            validNumber(levainBuild.temperature, temperature),
          );
          if (levainBuild.starterName) setYeastName(levainBuild.starterName);
          if (Array.isArray(levainBuild.observations)) {
            const observations = levainBuild.observations.filter(
              (item) => item?.id && item?.at && typeof item?.rise === "number",
            );
            setLevainObservations(observations);
            const latest = observations[observations.length - 1];
            if (latest) {
              setLevainRise(latest.rise);
              setLevainStage(latest.stage);
            }
          }
        }
        const savedBulkRun = normalizeBulkRun(
          JSON.parse(localStorage.getItem("doughgarden-bulk-run") || "null"),
        );
        if (savedBulkRun) {
          setBulkRun(savedBulkRun);
          const latest = savedBulkRun.observations.at(-1);
          if (latest) {
            setBulkTemperature(latest.temperature);
            setBulkRise(latest.rise);
            setBulkSurface(latest.surface);
            setBulkStrength(latest.strength);
            setBulkBubbles(latest.bubbles);
            setBulkJiggle(latest.jiggle);
          }
        }
        const settings = normalizeSettings(
          JSON.parse(localStorage.getItem("doughgarden-settings") || "null"),
        );
        setTemperature(settings.temperature);
        setHumidity(settings.humidity);
        setStarterOld(settings.starterOld);
        setFeedFlour(settings.feedFlour);
        setFeedWater(settings.feedWater);
        setWholeWheat(settings.wholeWheat);
        setApFlour(settings.apFlour);
        setSpeltFlour(settings.speltFlour);
        setRyeFlour(settings.ryeFlour);
        setFlourProfile(settings.flourProfile);
        setTargetDough(settings.targetDough);
        setHydration(settings.hydration);
        setStarterPercent(settings.starterPercent);
        setSaltPercent(settings.saltPercent);
        setOilPercent(settings.oilPercent);
        setDoughTemperature(settings.doughTemperature);
        setLoafCount(settings.loafCount);
        setLoavesPerBake(Math.min(settings.loafCount, settings.loavesPerBake));
        setProofMode(settings.proofMode);
        setColdHours(settings.coldHours);
        setFridgeTemp(settings.fridgeTemp);
        setPrepMethod(settings.prepMethod);
        setAdaptiveTempSource(settings.adaptiveTempSource);
        setBakeMode(settings.bakeMode);
        setSteamWater(settings.steamWater);
        setOvenVolume(settings.ovenVolume);
        setTrayWidth(settings.trayWidth);
        setTrayLength(settings.trayLength);
        setSteamMinutes(settings.steamMinutes);
        setOvenSeal(settings.ovenSeal);
        setAlertSound(settings.alertSound);
        setTargetBakeAt(settings.targetBakeAt);
        setFlourTemperature(settings.flourTemperature);
        setLevainMixTemperature(settings.levainMixTemperature);
        setFrictionFactor(settings.frictionFactor);
        setColdWaterTemperature(settings.coldWaterTemperature);
        setWarmWaterTemperature(settings.warmWaterTemperature);
        setBannetonShape(settings.bannetonShape);
        setBannetonWidth(settings.bannetonWidth);
        setBannetonLength(settings.bannetonLength);
        setBannetonDepth(settings.bannetonDepth);
        const latestSavedBulk = savedBulkRun?.observations.at(-1);
        if (latestSavedBulk) {
          setDoughTemperature(latestSavedBulk.temperature);
          setAdaptiveTempSource("dough");
        }
      } catch {
        // The tracker remains usable if local storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const validPages = new Set(PAGE_ITEMS.map((item) => item.id));
    const selectFromLocation = () => {
      try {
        const hashPage = window.location.hash.replace("#", "") as PageId;
        const savedPage = localStorage.getItem("doughgarden-active-page") as PageId | null;
        if (validPages.has(hashPage)) setActivePage(hashPage);
        else if (savedPage && validPages.has(savedPage)) setActivePage(savedPage);
      } catch {
        /* Keep the default page if URL or storage access is restricted. */
      }
    };
    selectFromLocation();
    window.addEventListener("hashchange", selectFromLocation);
    return () => window.removeEventListener("hashchange", selectFromLocation);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("doughgarden-learning") || "null",
        );
        if (Array.isArray(saved?.completed)) {
          const validIds = new Set(LEARNING_LESSONS.map((lesson) => lesson.id));
          setCompletedLessons(
            saved.completed.filter(
              (id: unknown): id is string =>
                typeof id === "string" && validIds.has(id),
            ),
          );
        }
        if (
          typeof saved?.activeLessonId === "string" &&
          LEARNING_LESSONS.some(
            (lesson) => lesson.id === saved.activeLessonId,
          )
        )
          setActiveLessonId(saved.activeLessonId);
        if (["all", "th", "en"].includes(saved?.language))
          setLessonLanguage(saved.language as LessonLanguage);
      } catch {
        /* Learning progress remains usable without storage. */
      }
      setLearningLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!learningLoaded) return;
    try {
      localStorage.setItem(
        "doughgarden-learning",
        JSON.stringify({
          completed: completedLessons,
          activeLessonId,
          language: lessonLanguage,
        }),
      );
    } catch {
      /* Learning progress remains usable without storage. */
    }
  }, [
    learningLoaded,
    completedLessons,
    activeLessonId,
    lessonLanguage,
  ]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setToast("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
      return;
    }
    const result =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    setNotifyStatus(result);
    if (result === "granted") {
      try {
        new Notification("DoughGarden — ทดสอบแจ้งเตือน", {
          body: "ระบบแจ้งเตือนพร้อมแล้ว จะเตือนเมื่อถึงเวลาพับโดว์แต่ละรอบ",
          tag: "doughgarden-test",
        });
        playAlertSound();
        setToast("ส่งแจ้งเตือนทดสอบแล้ว");
      } catch {
        setToast(
          "อนุญาตแล้ว แต่เบราว์เซอร์นี้ต้องติดตั้งเว็บเป็นแอปก่อนแจ้งเตือน",
        );
      }
    } else setToast("ยังไม่ได้อนุญาตการแจ้งเตือน");
  };
  const startPhase = () => {
    alertedMilestones.current = new Set();
    if (audioContextRef.current?.state === "suspended")
      void audioContextRef.current.resume();
    if (!audioContextRef.current && "AudioContext" in window)
      audioContextRef.current = new AudioContext();
    const start = Date.now();
    const end = start + phases[activePhase].hours * 3600000;
    if (!bulkRun) {
      if (
        (activePhase === 0 && prepMethod === "fermentolyse") ||
        (activePhase === 1 && prepMethod === "autolyse")
      ) {
        startBulkRun(new Date(start));
      } else if (activePhase === 3) {
        startBulkRun(new Date(start - bulkElapsedBeforePhaseFour * 3600000));
      }
    }
    setNow(start);
    setPhaseStart(start);
    setPhaseEnd(end);
    setRunning(true);
    setToast(
      activePhase === 2
        ? "เริ่มจับเวลา — จะเตือนที่นาที 30, 60 และ 90"
        : `เริ่ม ${phases[activePhase].title} แล้ว`,
    );
  };
  const completePhase = () => {
    const next = Math.min(phases.length - 1, activePhase + 1);
    setActivePhase(next);
    setRunning(false);
    setPhaseStart(null);
    setPhaseEnd(null);
    alertedMilestones.current = new Set();
    document
      .getElementById("assistant")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const selectPhase = (index: number) => {
    setActivePhase(index);
    setRunning(false);
    setPhaseStart(null);
    setPhaseEnd(null);
    alertedMilestones.current = new Set();
  };
  const selectPrepMethod = (method: PrepMethod) => {
    setPrepMethod(method);
    if (activePhase <= 1) {
      setRunning(false);
      setPhaseStart(null);
      setPhaseEnd(null);
      alertedMilestones.current = new Set();
    }
    setToast(
      method === "autolyse"
        ? "เลือกออโตไลซ์ — แป้งกับน้ำก่อน ยังไม่ใส่หัวเชื้อและเกลือ"
        : "เลือกเฟอร์เมนโตไลซ์ — ผสมหัวเชื้อพร้อมแป้งและน้ำ",
    );
  };
  const saveYeast = () => {
    if (!yeastBirth) {
      setToast("กรุณาเลือกวันเกิดหัวเชื้อก่อนบันทึก");
      return;
    }
    const name = yeastName.trim() || "เจ้าก้อนแป้ง";
    const id =
      activeYeastId ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: SavedYeast = {
      id,
      name,
      birth: yeastBirth,
      savedAt: new Date().toISOString(),
    };
    const next = [record, ...savedYeasts.filter((item) => item.id !== id)];
    try {
      localStorage.setItem("doughgarden-starters", JSON.stringify(next));
      localStorage.setItem(
        "doughgarden-yeast",
        JSON.stringify({ name, birth: yeastBirth }),
      );
      setSavedYeasts(next);
      setActiveYeastId(id);
      setYeastName(name);
      setToast(`บันทึก “${name}” แล้ว`);
    } catch {
      setToast("บันทึกไม่ได้ กรุณาอนุญาตการจัดเก็บข้อมูลของเว็บไซต์");
    }
  };
  const resetYeast = () => {
    setYeastName("");
    setYeastBirth("");
    setActiveYeastId("");
    localStorage.removeItem("doughgarden-yeast");
    setToast("ล้างช่องกรอกแล้ว รายการที่บันทึกยังอยู่");
  };
  const selectYeast = (record: SavedYeast) => {
    setYeastName(record.name);
    setYeastBirth(record.birth);
    setActiveYeastId(record.id);
    localStorage.setItem(
      "doughgarden-yeast",
      JSON.stringify({ name: record.name, birth: record.birth }),
    );
    setToast(`เปิดข้อมูล “${record.name}” แล้ว`);
  };
  const deleteYeast = (id: string) => {
    const next = savedYeasts.filter((item) => item.id !== id);
    localStorage.setItem("doughgarden-starters", JSON.stringify(next));
    setSavedYeasts(next);
    if (activeYeastId === id) {
      setActiveYeastId("");
      setYeastName("");
      setYeastBirth("");
      localStorage.removeItem("doughgarden-yeast");
    }
    setToast("ลบรายการหัวเชื้อแล้ว");
  };
  const applyRecipe = (
    values: Pick<
      SavedRecipe,
      | "name"
      | "targetDough"
      | "hydration"
      | "starterPercent"
      | "saltPercent"
      | "oilPercent"
      | "apFlour"
      | "speltFlour"
      | "wholeWheat"
      | "ryeFlour"
      | "doughTemperature"
      | "flourProfile"
    >,
    id = "",
  ) => {
    setRecipeName(values.name);
    setTargetDough(values.targetDough);
    setHydration(values.hydration);
    setStarterPercent(values.starterPercent);
    setSaltPercent(values.saltPercent);
    setOilPercent(values.oilPercent);
    setApFlour(values.apFlour);
    setSpeltFlour(values.speltFlour);
    setWholeWheat(values.wholeWheat);
    setRyeFlour(values.ryeFlour);
    setFlourProfile(values.flourProfile);
    setDoughTemperature(values.doughTemperature);
    setActiveRecipeId(id);
    setToast(`เปิดสูตร “${values.name}” แล้ว`);
  };
  const applyPreset = (preset: (typeof RECIPE_PRESETS)[number]) => {
    applyRecipe(preset);
    setActiveRecipeId("");
  };
  const setFlourPercent = (
    kind: "ap" | "spelt" | "whole" | "rye",
    raw: number,
  ) => {
    const value = Math.max(0, Math.round(raw));
    if (kind === "ap")
      setApFlour(Math.min(value, 90 - speltFlour - wholeWheat - ryeFlour));
    if (kind === "spelt")
      setSpeltFlour(Math.min(value, 90 - apFlour - wholeWheat - ryeFlour));
    if (kind === "whole")
      setWholeWheat(Math.min(value, 90 - apFlour - speltFlour - ryeFlour));
    if (kind === "rye")
      setRyeFlour(Math.min(value, 90 - apFlour - speltFlour - wholeWheat));
    setFlourProfile("");
    setActiveRecipeId("");
  };
  const saveRecipe = () => {
    const name = recipeName.trim() || `สูตร ${savedRecipes.length + 1}`;
    const id =
      activeRecipeId ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: SavedRecipe = {
      id,
      name,
      savedAt: new Date().toISOString(),
      targetDough,
      hydration,
      starterPercent,
      saltPercent,
      oilPercent,
      apFlour,
      speltFlour,
      wholeWheat,
      ryeFlour,
      doughTemperature,
      flourProfile,
    };
    const next = [record, ...savedRecipes.filter((item) => item.id !== id)];
    localStorage.setItem("doughgarden-recipes", JSON.stringify(next));
    setSavedRecipes(next);
    setActiveRecipeId(id);
    setRecipeName(name);
    localStorage.setItem(
      "doughgarden-settings",
      JSON.stringify(currentSettings()),
    );
    setToast(`บันทึกสูตร “${name}” แล้ว`);
  };
  const deleteRecipe = (id: string) => {
    const item = savedRecipes.find((recipeItem) => recipeItem.id === id);
    if (!window.confirm(`ลบสูตร “${item?.name || "สูตรนี้"}” ใช่หรือไม่?`))
      return;
    const next = savedRecipes.filter((item) => item.id !== id);
    localStorage.setItem("doughgarden-recipes", JSON.stringify(next));
    setSavedRecipes(next);
    if (activeRecipeId === id) setActiveRecipeId("");
    setToast("ลบสูตรที่บันทึกแล้ว");
  };
  const editRecipe = (item: SavedRecipe) => {
    applyRecipe(item, item.id);
    window.setTimeout(
      () =>
        document
          .getElementById("recipe-editor")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
    setToast(`กำลังแก้ไขสูตร “${item.name}”`);
  };
  const localDateTimeValue = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };
  const persistLevainBuild = (
    startedAt: string,
    observations: LevainObservation[],
  ) => {
    const build: LevainBuild = {
      startedAt,
      temperature: levainTemperature,
      starterName: yeastName.trim() || "หัวเชื้อของฉัน",
      observations,
    };
    localStorage.setItem("doughgarden-levain-build", JSON.stringify(build));
  };
  const startLevainBuild = () => {
    const startedAt = levainStartedAt || localDateTimeValue();
    const initial: LevainObservation = {
      id: `${Date.now()}`,
      at: new Date(startedAt).toISOString(),
      rise: 0,
      stage: "fed",
      note: "เริ่มรอบการเลี้ยง",
    };
    setLevainStartedAt(startedAt);
    setLevainRise(0);
    setLevainStage("fed");
    setLevainNote("");
    setLevainObservations([initial]);
    persistLevainBuild(startedAt, [initial]);
    setToast("เริ่มติดตามรอบการเลี้ยงหัวเชื้อแล้ว");
  };
  const addLevainObservation = (forceReady = false) => {
    const startedAt = levainStartedAt || localDateTimeValue();
    const stage: LevainStage = forceReady ? "peak" : levainStage;
    const rise = forceReady ? Math.max(100, levainRise) : levainRise;
    const observation: LevainObservation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      rise,
      stage,
      note: forceReady
        ? levainNote.trim() || "ทำเครื่องหมายว่าพร้อมใช้"
        : levainNote.trim(),
    };
    const next = [...levainObservations, observation];
    setLevainStartedAt(startedAt);
    setLevainStage(stage);
    setLevainRise(rise);
    setLevainNote("");
    setLevainObservations(next);
    persistLevainBuild(startedAt, next);
    setToast(
      forceReady
        ? "ทำเครื่องหมายว่าหัวเชื้อพร้อมใช้แล้ว"
        : "บันทึกพัฒนาการหัวเชื้อแล้ว",
    );
  };
  const resetLevainBuild = () => {
    setLevainStartedAt("");
    setLevainRise(0);
    setLevainStage("fed");
    setLevainNote("");
    setLevainObservations([]);
    localStorage.removeItem("doughgarden-levain-build");
    setToast("เริ่มรอบการเลี้ยงใหม่ได้แล้ว");
  };
  const persistBulkRun = (run: BulkRun | null) => {
    if (run) localStorage.setItem("doughgarden-bulk-run", JSON.stringify(run));
    else localStorage.removeItem("doughgarden-bulk-run");
  };
  const startBulkRun = (startedAt = new Date()) => {
    const initial: BulkObservation = {
      id: `${Date.now()}-bulk-start`,
      at: startedAt.toISOString(),
      elapsedMinutes: 0,
      temperature: doughTemperature,
      rise: 0,
      surface: "flat",
      strength: "weak",
      bubbles: false,
      jiggle: false,
      note: "เริ่มบัลก์",
    };
    const run: BulkRun = {
      startedAt: startedAt.toISOString(),
      recipeName: recipeName.trim() || "สูตรกำหนดเอง",
      levainStageAtMix: hasLevainActivityData ? levainStage : "unknown",
      observations: [initial],
    };
    setBulkRun(run);
    setBulkTemperature(doughTemperature);
    setBulkRise(0);
    setBulkSurface("flat");
    setBulkStrength("weak");
    setBulkBubbles(false);
    setBulkJiggle(false);
    setBulkNote("");
    setNow(Date.now());
    persistBulkRun(run);
    setToast("เริ่ม Live Bulk Tracker แล้ว");
  };
  const addBulkObservation = () => {
    if (!bulkRun) {
      setToast("กรุณากดเริ่มรอบ Bulk ก่อนบันทึก");
      return;
    }
    const at = new Date();
    const started = new Date(bulkRun.startedAt).getTime();
    const elapsedMinutes = Math.max(
      0,
      Math.round((at.getTime() - started) / 60000),
    );
    const observation: BulkObservation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: at.toISOString(),
      elapsedMinutes,
      temperature: Math.min(35, Math.max(18, bulkTemperature)),
      rise: Math.min(150, Math.max(0, bulkRise)),
      surface: bulkSurface,
      strength: bulkStrength,
      bubbles: bulkBubbles,
      jiggle: bulkJiggle,
      note: bulkNote.trim(),
    };
    const next = {
      ...bulkRun,
      observations: [...bulkRun.observations, observation].sort(
        (a, b) => a.elapsedMinutes - b.elapsedMinutes,
      ),
    };
    setBulkRun(next);
    setDoughTemperature(observation.temperature);
    setAdaptiveTempSource("dough");
    setBulkNote("");
    setNow(at.getTime());
    persistBulkRun(next);
    setToast("บันทึกสภาพโดว์และคำนวณเวลาใหม่แล้ว");
  };
  const deleteBulkObservation = (id: string) => {
    if (!bulkRun) return;
    const observations = bulkRun.observations.filter((item) => item.id !== id);
    const next = { ...bulkRun, observations };
    setBulkRun(next);
    persistBulkRun(next);
    const latest = observations.at(-1);
    if (latest) {
      setBulkTemperature(latest.temperature);
      setBulkRise(latest.rise);
      setBulkSurface(latest.surface);
      setBulkStrength(latest.strength);
      setBulkBubbles(latest.bubbles);
      setBulkJiggle(latest.jiggle);
    }
    setToast("ลบรายการวัดแล้ว");
  };
  const resetBulkRun = () => {
    if (
      bulkRun &&
      !window.confirm("จบรอบและล้างข้อมูล Live Bulk นี้ใช่หรือไม่?")
    )
      return;
    setBulkRun(null);
    setBulkRise(0);
    setBulkSurface("flat");
    setBulkStrength("weak");
    setBulkBubbles(false);
    setBulkJiggle(false);
    setBulkNote("");
    persistBulkRun(null);
    setToast("ล้างรอบ Live Bulk แล้ว");
  };
  const loadBulkExample = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 165 * 60000);
    const makeAt = (minutes: number) =>
      new Date(start.getTime() + minutes * 60000).toISOString();
    const observations: BulkObservation[] = [
      {
        id: "sample-0",
        at: makeAt(0),
        elapsedMinutes: 0,
        temperature: 25.5,
        rise: 0,
        surface: "flat",
        strength: "weak",
        bubbles: false,
        jiggle: false,
        note: "หลังผสมโดว์",
      },
      {
        id: "sample-1",
        at: makeAt(75),
        elapsedMinutes: 75,
        temperature: 25.8,
        rise: 12,
        surface: "round",
        strength: "developing",
        bubbles: false,
        jiggle: false,
        note: "พับรอบที่ 2 แล้ว",
      },
      {
        id: "sample-2",
        at: makeAt(135),
        elapsedMinutes: 135,
        temperature: 26,
        rise: 28,
        surface: "round",
        strength: "holding",
        bubbles: true,
        jiggle: false,
        note: "มีฟองเล็กริมกล่อง",
      },
      {
        id: "sample-3",
        at: makeAt(165),
        elapsedMinutes: 165,
        temperature: 26.2,
        rise: 38,
        surface: "domed",
        strength: "holding",
        bubbles: true,
        jiggle: true,
        note: "เริ่มสั่นคล้ายเจล ยังเก็บทรงดี",
      },
    ];
    const run: BulkRun = {
      startedAt: start.toISOString(),
      recipeName: "ตัวอย่าง · Venus–Spelt 950 กรัม",
      levainStageAtMix: "peak",
      observations,
    };
    setBulkRun(run);
    setBulkTemperature(26.2);
    setBulkRise(38);
    setBulkSurface("domed");
    setBulkStrength("holding");
    setBulkBubbles(true);
    setBulkJiggle(true);
    setBulkNote("");
    setDoughTemperature(26.2);
    setAdaptiveTempSource("dough");
    setNow(end.getTime());
    persistBulkRun(run);
    window.setTimeout(
      () =>
        document
          .getElementById("bulk-tracker")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
    setToast("โหลดตัวอย่าง Live Bulk แล้ว สามารถทดลองเปลี่ยนค่าได้");
  };
  const saveBakeEntry = () => {
    const actualBulkMinutes = Math.max(
      1,
      journalBulkMinutes || Math.round(liveBulk.elapsedMinutes) || Math.round(adaptive.bulk * 60),
    );
    const bulkTemperatures = bulkRun?.observations.map((item) => item.temperature) || [];
    const averageDoughTemperature = bulkTemperatures.length
      ? bulkTemperatures.reduce((sum, value) => sum + value, 0) /
        bulkTemperatures.length
      : doughTemperature;
    const entry: BakeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bakedAt: new Date().toISOString(),
      recipeName: recipeName.trim() || "สูตรกำหนดเอง",
      predictedBulkMinutes: Math.max(1, Math.round(adaptive.baseBulk * 60)),
      actualBulkMinutes,
      bulkRise: latestBulkObservation?.rise ?? bulkRiseTarget,
      averageDoughTemperature: round(averageDoughTemperature),
      ovenSpring: journalOvenSpring,
      crumb: journalCrumb,
      sourness: journalSourness,
      crust: journalCrust,
      notes: journalNotes.trim(),
    };
    const next = [entry, ...bakeEntries];
    setBakeEntries(next);
    localStorage.setItem("doughgarden-bake-journal", JSON.stringify(next));
    setJournalBulkMinutes(0);
    setJournalNotes("");
    setToast("บันทึกผลอบแล้ว ระบบเรียนรู้เวลาของสูตรนี้ใหม่ทันที");
  };
  const deleteBakeEntry = (id: string) => {
    const next = bakeEntries.filter((entry) => entry.id !== id);
    setBakeEntries(next);
    localStorage.setItem("doughgarden-bake-journal", JSON.stringify(next));
    setToast("ลบผลอบและคำนวณการเรียนรู้ใหม่แล้ว");
  };
  const loadJournalExample = () => {
    const base = Math.max(1, Math.round(adaptive.baseBulk * 60));
    const makeEntry = (
      daysAgo: number,
      ratio: number,
      ovenSpring: number,
      crumb: number,
      note: string,
    ): BakeEntry => ({
      id: `journal-sample-${daysAgo}`,
      bakedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      recipeName: recipeName.trim() || "สูตรกำหนดเอง",
      predictedBulkMinutes: base,
      actualBulkMinutes: Math.round(base * ratio),
      bulkRise: bulkRiseTarget,
      averageDoughTemperature: doughTemperature,
      ovenSpring,
      crumb,
      sourness: 3,
      crust: 4,
      notes: note,
    });
    const samples = [
      makeEntry(3, 0.91, 5, 4, "จบบัลก์เร็วขึ้น ก้อนสูงและหูเปิดดี"),
      makeEntry(9, 0.95, 4, 4, "โดว์เก็บทรงดี เนื้อชุ่ม"),
      makeEntry(15, 0.9, 4, 3, "อากาศร้อนกว่าปกติเล็กน้อย"),
    ];
    const ids = new Set(samples.map((entry) => entry.id));
    const next = [...samples, ...bakeEntries.filter((entry) => !ids.has(entry.id))];
    setBakeEntries(next);
    localStorage.setItem("doughgarden-bake-journal", JSON.stringify(next));
    setToast("เพิ่มผลอบตัวอย่าง 3 ครั้งแล้ว ระบบกำลังเรียนรู้สูตรนี้");
  };
  const currentSettings = (): SavedSettings => ({
    temperature,
    humidity,
    starterOld,
    feedFlour,
    feedWater,
    wholeWheat,
    apFlour,
    speltFlour,
    ryeFlour,
    flourProfile,
    targetDough,
    hydration,
    starterPercent,
    saltPercent,
    oilPercent,
    doughTemperature,
    loafCount,
    loavesPerBake,
    proofMode,
    coldHours,
    fridgeTemp,
    prepMethod,
    adaptiveTempSource,
    bakeMode,
    steamWater,
    ovenVolume,
    trayWidth,
    trayLength,
    steamMinutes,
    ovenSeal,
    alertSound,
    targetBakeAt,
    flourTemperature,
    levainMixTemperature,
    frictionFactor,
    coldWaterTemperature,
    warmWaterTemperature,
    bannetonShape,
    bannetonWidth,
    bannetonLength,
    bannetonDepth,
  });
  const saveSettings = () => {
    localStorage.setItem(
      "doughgarden-settings",
      JSON.stringify(currentSettings()),
    );
    setToast("บันทึกค่าที่ปรับไว้ในเครื่องนี้แล้ว");
  };
  const resetClimate = () => {
    setTemperature(DEFAULT_SETTINGS.temperature);
    setHumidity(DEFAULT_SETTINGS.humidity);
    setAdaptiveTempSource(DEFAULT_SETTINGS.adaptiveTempSource);
    localStorage.setItem(
      "doughgarden-settings",
      JSON.stringify({
        ...currentSettings(),
        temperature: DEFAULT_SETTINGS.temperature,
        humidity: DEFAULT_SETTINGS.humidity,
        adaptiveTempSource: DEFAULT_SETTINGS.adaptiveTempSource,
      }),
    );
    setToast("รีเซ็ตสภาพแวดล้อมและกลับไปคำนวณจากอุณหภูมิห้องแล้ว");
  };
  const resetStarter = () => {
    setStarterOld(DEFAULT_SETTINGS.starterOld);
    setFeedFlour(DEFAULT_SETTINGS.feedFlour);
    setFeedWater(DEFAULT_SETTINGS.feedWater);
    localStorage.setItem(
      "doughgarden-settings",
      JSON.stringify({
        ...currentSettings(),
        starterOld: DEFAULT_SETTINGS.starterOld,
        feedFlour: DEFAULT_SETTINGS.feedFlour,
        feedWater: DEFAULT_SETTINGS.feedWater,
      }),
    );
    setToast("รีเซ็ตค่าหัวเชื้อแล้ว");
  };
  const resetRecipe = () => {
    setRecipeName("สูตรครัวไทยของฉัน");
    setActiveRecipeId("");
    setWholeWheat(DEFAULT_SETTINGS.wholeWheat);
    setApFlour(DEFAULT_SETTINGS.apFlour);
    setSpeltFlour(DEFAULT_SETTINGS.speltFlour);
    setRyeFlour(DEFAULT_SETTINGS.ryeFlour);
    setFlourProfile(DEFAULT_SETTINGS.flourProfile);
    setTargetDough(DEFAULT_SETTINGS.targetDough);
    setHydration(DEFAULT_SETTINGS.hydration);
    setStarterPercent(DEFAULT_SETTINGS.starterPercent);
    setSaltPercent(DEFAULT_SETTINGS.saltPercent);
    setOilPercent(DEFAULT_SETTINGS.oilPercent);
    setDoughTemperature(DEFAULT_SETTINGS.doughTemperature);
    setLoafCount(DEFAULT_SETTINGS.loafCount);
    setLoavesPerBake(DEFAULT_SETTINGS.loavesPerBake);
    localStorage.setItem(
      "doughgarden-settings",
      JSON.stringify({
        ...currentSettings(),
        wholeWheat: DEFAULT_SETTINGS.wholeWheat,
        apFlour: DEFAULT_SETTINGS.apFlour,
        speltFlour: DEFAULT_SETTINGS.speltFlour,
        ryeFlour: DEFAULT_SETTINGS.ryeFlour,
        flourProfile: DEFAULT_SETTINGS.flourProfile,
        targetDough: DEFAULT_SETTINGS.targetDough,
        hydration: DEFAULT_SETTINGS.hydration,
        starterPercent: DEFAULT_SETTINGS.starterPercent,
        saltPercent: DEFAULT_SETTINGS.saltPercent,
        oilPercent: DEFAULT_SETTINGS.oilPercent,
        doughTemperature: DEFAULT_SETTINGS.doughTemperature,
        loafCount: DEFAULT_SETTINGS.loafCount,
        loavesPerBake: DEFAULT_SETTINGS.loavesPerBake,
      }),
    );
    setToast("รีเซ็ตสูตรแล้ว");
  };
  const resetProofBake = () => {
    setProofMode(DEFAULT_SETTINGS.proofMode);
    setColdHours(DEFAULT_SETTINGS.coldHours);
    setFridgeTemp(DEFAULT_SETTINGS.fridgeTemp);
    setPrepMethod(DEFAULT_SETTINGS.prepMethod);
    setBakeMode(DEFAULT_SETTINGS.bakeMode);
    setSteamWater(DEFAULT_SETTINGS.steamWater);
    setOvenVolume(DEFAULT_SETTINGS.ovenVolume);
    setTrayWidth(DEFAULT_SETTINGS.trayWidth);
    setTrayLength(DEFAULT_SETTINGS.trayLength);
    setSteamMinutes(DEFAULT_SETTINGS.steamMinutes);
    setOvenSeal(DEFAULT_SETTINGS.ovenSeal);
    localStorage.setItem(
      "doughgarden-settings",
      JSON.stringify({
        ...currentSettings(),
        proofMode: DEFAULT_SETTINGS.proofMode,
        coldHours: DEFAULT_SETTINGS.coldHours,
        fridgeTemp: DEFAULT_SETTINGS.fridgeTemp,
        prepMethod: DEFAULT_SETTINGS.prepMethod,
        bakeMode: DEFAULT_SETTINGS.bakeMode,
        steamWater: DEFAULT_SETTINGS.steamWater,
        ovenVolume: DEFAULT_SETTINGS.ovenVolume,
        trayWidth: DEFAULT_SETTINGS.trayWidth,
        trayLength: DEFAULT_SETTINGS.trayLength,
        steamMinutes: DEFAULT_SETTINGS.steamMinutes,
        ovenSeal: DEFAULT_SETTINGS.ovenSeal,
      }),
    );
    setToast("รีเซ็ตวิธีพักแป้ง ไฟนอลพรูฟ และการอบแล้ว");
  };
  const exportSettings = () => {
    const payload = {
      app: "DoughGarden",
      version: 8,
      exportedAt: new Date().toISOString(),
      settings: currentSettings(),
      yeast: { name: yeastName.trim() || "เจ้าก้อนแป้ง", birth: yeastBirth },
      recipes: savedRecipes,
      levainBuild: {
        startedAt: levainStartedAt,
        temperature: levainTemperature,
        starterName: yeastName.trim() || "หัวเชื้อของฉัน",
        observations: levainObservations,
      },
      bulkRun,
      bakeJournal: bakeEntries,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `DoughGarden-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("ส่งออกไฟล์ค่าตั้งแล้ว");
  };
  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const settings = normalizeSettings(payload?.settings || payload);
      setTemperature(settings.temperature);
      setHumidity(settings.humidity);
      setStarterOld(settings.starterOld);
      setFeedFlour(settings.feedFlour);
      setFeedWater(settings.feedWater);
      setWholeWheat(settings.wholeWheat);
      setApFlour(settings.apFlour);
      setSpeltFlour(settings.speltFlour);
      setRyeFlour(settings.ryeFlour);
      setFlourProfile(settings.flourProfile);
      setTargetDough(settings.targetDough);
      setHydration(settings.hydration);
      setStarterPercent(settings.starterPercent);
      setSaltPercent(settings.saltPercent);
      setOilPercent(settings.oilPercent);
      setDoughTemperature(settings.doughTemperature);
      setLoafCount(settings.loafCount);
      setLoavesPerBake(Math.min(settings.loafCount, settings.loavesPerBake));
      setProofMode(settings.proofMode);
      setColdHours(settings.coldHours);
      setFridgeTemp(settings.fridgeTemp);
      setPrepMethod(settings.prepMethod);
      setAdaptiveTempSource(settings.adaptiveTempSource);
      setBakeMode(settings.bakeMode);
      setSteamWater(settings.steamWater);
      setOvenVolume(settings.ovenVolume);
      setTrayWidth(settings.trayWidth);
      setTrayLength(settings.trayLength);
      setSteamMinutes(settings.steamMinutes);
      setOvenSeal(settings.ovenSeal);
      setAlertSound(settings.alertSound);
      setTargetBakeAt(settings.targetBakeAt);
      setFlourTemperature(settings.flourTemperature);
      setLevainMixTemperature(settings.levainMixTemperature);
      setFrictionFactor(settings.frictionFactor);
      setColdWaterTemperature(settings.coldWaterTemperature);
      setWarmWaterTemperature(settings.warmWaterTemperature);
      setBannetonShape(settings.bannetonShape);
      setBannetonWidth(settings.bannetonWidth);
      setBannetonLength(settings.bannetonLength);
      setBannetonDepth(settings.bannetonDepth);
      if (payload?.yeast?.name) setYeastName(payload.yeast.name);
      if (typeof payload?.yeast?.birth === "string")
        setYeastBirth(payload.yeast.birth);
      if (Array.isArray(payload?.recipes)) {
        const recipes = payload.recipes
          .map((item: Record<string, unknown>) => normalizeRecipe(item))
          .filter(
            (item: SavedRecipe | null): item is SavedRecipe => item !== null,
          );
        setSavedRecipes(recipes);
        localStorage.setItem("doughgarden-recipes", JSON.stringify(recipes));
      }
      if (payload?.levainBuild?.startedAt) {
        setLevainStartedAt(payload.levainBuild.startedAt);
        setLevainTemperature(
          validNumber(payload.levainBuild.temperature, settings.temperature),
        );
        const observations = Array.isArray(payload.levainBuild.observations)
          ? payload.levainBuild.observations
          : [];
        setLevainObservations(observations);
        const latest = observations[observations.length - 1];
        if (latest) {
          setLevainRise(validNumber(latest.rise, 0));
          setLevainStage(
            LEVAIN_STAGE_LABELS[latest.stage as LevainStage]
              ? latest.stage
              : "fed",
          );
        }
        localStorage.setItem(
          "doughgarden-levain-build",
          JSON.stringify(payload.levainBuild),
        );
      }
      const importedBulkRun = normalizeBulkRun(payload?.bulkRun);
      if (importedBulkRun) {
        setBulkRun(importedBulkRun);
        localStorage.setItem(
          "doughgarden-bulk-run",
          JSON.stringify(importedBulkRun),
        );
        const latest = importedBulkRun.observations.at(-1);
        if (latest) {
          setBulkTemperature(latest.temperature);
          setBulkRise(latest.rise);
          setBulkSurface(latest.surface);
          setBulkStrength(latest.strength);
          setBulkBubbles(latest.bubbles);
          setBulkJiggle(latest.jiggle);
          setDoughTemperature(latest.temperature);
          setAdaptiveTempSource("dough");
        }
      }
      if (Array.isArray(payload?.bakeJournal)) {
        const importedEntries = payload.bakeJournal
          .map((item: Record<string, unknown>) => normalizeBakeEntry(item))
          .filter((item: BakeEntry | null): item is BakeEntry => item !== null);
        setBakeEntries(importedEntries);
        localStorage.setItem(
          "doughgarden-bake-journal",
          JSON.stringify(importedEntries),
        );
      }
      localStorage.setItem("doughgarden-settings", JSON.stringify(settings));
      if (payload?.yeast)
        localStorage.setItem(
          "doughgarden-yeast",
          JSON.stringify(payload.yeast),
        );
      setToast("นำเข้าค่าตั้งสำเร็จแล้ว");
    } catch {
      setToast("ไฟล์นี้ไม่ใช่ไฟล์ค่าตั้งของ DoughGarden");
    }
    event.target.value = "";
  };
  const totalHours =
    phases.reduce((sum, p) => sum + p.hours, 0) +
    Math.max(0, bakeBatches - 1) * (bakeCycleHours + 0.2);
  const hoursUntilFirstBake = phases
    .slice(0, 8)
    .reduce((sum, phase) => sum + phase.hours, 0);
  const bakePlan = useMemo(() => {
    if (!targetBakeAt) return null;
    const firstBake = new Date(targetBakeAt);
    if (Number.isNaN(firstBake.getTime())) return null;
    const start = new Date(firstBake.getTime() - hoursUntilFirstBake * 3600000);
    const feedStarterAt = new Date(start.getTime() - levainPeakHours * 3600000);
    const allBakesDone = new Date(
      firstBake.getTime() +
        (bakeBatches * bakeCycleHours + Math.max(0, bakeBatches - 1) * 0.2) *
          3600000,
    );
    return {
      firstBake,
      start,
      feedStarterAt,
      allBakesDone,
      startsInPast: start.getTime() < Date.now(),
    };
  }, [
    targetBakeAt,
    hoursUntilFirstBake,
    levainPeakHours,
    bakeBatches,
    bakeCycleHours,
  ]);
  const thaiDateTime = (date: Date) =>
    date.toLocaleString("th-TH", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const compactThaiDateTime = (date: Date) =>
    date.toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const phaseTimeline = useMemo(() => {
    if (!bakePlan) return null;
    let cursor = new Date(bakePlan.start);
    return phases.map((phase, index) => {
      if (index === 8) cursor = new Date(bakePlan.firstBake);
      const start = new Date(cursor);
      const end = new Date(start.getTime() + phase.hours * 3600000);
      cursor = end;
      return { start, end };
    });
  }, [bakePlan, phases]);
  const targetBakeDate = targetBakeAt.split("T")[0] || "";
  const targetBakeTime = targetBakeAt.split("T")[1] || "";
  const setBakeDate = (date: string) =>
    setTargetBakeAt(date ? `${date}T${targetBakeTime || "09:00"}` : "");
  const setBakeTime = (time: string) => {
    const localDate = new Date();
    localDate.setMinutes(
      localDate.getMinutes() - localDate.getTimezoneOffset(),
    );
    setTargetBakeAt(
      time
        ? `${targetBakeDate || localDate.toISOString().slice(0, 10)}T${time}`
        : "",
    );
  };
  const starterHydration =
    ((starterOld / 2 + feedWater) / Math.max(0.1, starterOld / 2 + feedFlour)) *
    100;
  const levainPredictedPeak = levainStartedAt
    ? new Date(new Date(levainStartedAt).getTime() + levainPeakHours * 3600000)
    : null;
  const latestLevainObservation =
    levainObservations[levainObservations.length - 1];

  return (
    <main data-active-page={activePage}>
      {toast && (
        <button className="toast" onClick={() => setToast("")}>
          ✓ {toast}
        </button>
      )}
      <nav className="nav shell" aria-label="เมนูหลัก">
        <button className="brand" type="button" onClick={() => openPage("home")}>
          <span>D</span>
          <strong>
            DoughGarden<small>กระดุ๊กกระดิ๊ก กระจุ๊กกระจิ๊กหัวใจ</small>
          </strong>
        </button>
        <div className="nav-links">
          {PAGE_ITEMS.map((item) => (
            <button
              type="button"
              className={activePage === item.id ? "active" : ""}
              aria-current={activePage === item.id ? "page" : undefined}
              onClick={() => openPage(item.id)}
              key={item.id}
            >
              <span aria-hidden="true">{item.icon}</span>
              <b>{item.label}</b>
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <div className="sound-picker">
            <button
              type="button"
              className={`speaker-btn ${alertSound !== "none" ? "on" : ""}`}
              aria-label="เลือกเสียงแจ้งเตือน"
              aria-expanded={soundMenuOpen}
              onClick={() => setSoundMenuOpen(!soundMenuOpen)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                <path d="M16 8.5c1.4 1.8 1.4 5.2 0 7M18.7 6c3 3.2 3 8.8 0 12" />
              </svg>
            </button>
            {soundMenuOpen && (
              <div
                className="sound-popover"
                role="dialog"
                aria-label="เลือกเสียงแจ้งเตือน"
              >
                <div className="sound-popover-head">
                  <strong>เสียงแจ้งเตือน</strong>
                  <button type="button" onClick={() => setSoundMenuOpen(false)}>
                    ×
                  </button>
                </div>
                <p>แตะชื่อเสียงเพื่อเลือกและลองฟัง</p>
                {(
                  [
                    ["bell", "ริงริงคลาสสิก", "จังหวะเสียงเรียกเข้าชัดเจน"],
                    ["chime", "ดิจิทัลคอล", "จังหวะสั้น กระชับ"],
                    ["soft", "ริงโทนนุ่มนวล", "เบากว่า เหมาะกับช่วงกลางคืน"],
                    ["none", "ปิดเสียง", "ใช้เฉพาะกล่องแจ้งเตือน"],
                  ] as [AlertSound, string, string][]
                ).map(([key, label, description]) => (
                  <button
                    type="button"
                    className={`sound-choice ${alertSound === key ? "active" : ""}`}
                    onClick={() => changeAlertSound(key)}
                    key={key}
                  >
                    <span>{key === "none" ? "×" : "♪"}</span>
                    <strong>
                      {label}
                      <small>{description}</small>
                    </strong>
                    <b>{alertSound === key ? "✓" : ""}</b>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className={`notify-btn ${notifyStatus === "granted" ? "on" : ""}`}
            onClick={requestNotifications}
          >
            {notifyStatus === "granted"
              ? "● ทดสอบแจ้งเตือน"
              : "◌ เปิดแจ้งเตือน"}
          </button>
        </div>
      </nav>

      <section className="hero shell" id="top" hidden={activePage !== "home"}>
        <div className="hero-copy">
          <p className="eyebrow">อะแดปทีฟเบรดแอสซิสแทนต์</p>
          <h1>
            ทุกขั้นตอน
            <br />
            <em>ในจังหวะที่พอดี</em>
          </h1>
          <p>
            คำนวณเวลาตามอุณหภูมิจริง บอกวิธีทำ เกณฑ์สังเกต
            และแจ้งเตือนตั้งแต่เลี้ยงหัวเชื้อจนขนมปังเย็นพร้อมตัด
          </p>
          <div className="hero-actions">
            <button type="button" onClick={() => openPage("workflow")}>
              เริ่มผู้ช่วยทำขนมปัง
            </button>
            <span>
              รวมประมาณ <b>{duration(totalHours)}</b>
            </span>
          </div>
        </div>
        <div className="climate-card">
          <div className="adaptive-source-head">
            <span>ให้อะแดปทีฟตาม</span>
            <div
              className="adaptive-source-tabs"
              role="group"
              aria-label="เลือกแหล่งอุณหภูมิสำหรับคำนวณ"
            >
              <button
                type="button"
                className={adaptiveTempSource === "room" ? "active" : ""}
                onClick={() => setAdaptiveTempSource("room")}
              >
                อุณหภูมิห้อง
              </button>
              <button
                type="button"
                className={adaptiveTempSource === "dough" ? "active" : ""}
                onClick={() => setAdaptiveTempSource("dough")}
              >
                อุณหภูมิโดว์
              </button>
            </div>
          </div>
          <div className="climate-value">
            <span>
              {adaptiveTempSource === "dough"
                ? "อุณหภูมิกลางโดว์ที่วัดจริง"
                : "อุณหภูมิห้อง"}
            </span>
            <strong>
              {fermentationTemperature}
              <small>°C</small>
            </strong>
          </div>
          <div className="temperature-inputs">
            <label className={adaptiveTempSource === "room" ? "active" : ""}>
              <span>
                อุณหภูมิห้อง <b>{temperature}°C</b>
              </span>
              <input
                aria-label="อุณหภูมิห้อง"
                type="range"
                min="18"
                max="35"
                step=".5"
                value={temperature}
                onChange={(e) => setTemperature(+e.target.value)}
              />
            </label>
            <label className={adaptiveTempSource === "dough" ? "active" : ""}>
              <span>
                อุณหภูมิโดว์ <b>{doughTemperature}°C</b>
              </span>
              <input
                aria-label="อุณหภูมิโดว์"
                type="range"
                min="20"
                max="32"
                step=".5"
                value={doughTemperature}
                onChange={(e) => setDoughTemperature(+e.target.value)}
              />
            </label>
          </div>
          <div className="scale">
            <span>เย็น · หมักช้า</span>
            <span>26° ฐาน</span>
            <span>ร้อน · หมักเร็ว</span>
          </div>
          <div className="bulk-ready-summary">
            <div>
              <span>เริ่มตรวจโดว์</span>
              <strong>{duration(bulkReadiness.startCheck)}</strong>
              <small>หลังเริ่มบัลก์</small>
            </div>
            <div className="ready-window">
              <span>ช่วงคาดว่าพร้อมจริง</span>
              <strong>
                {duration(bulkReadiness.windowStart)}–
                {duration(bulkReadiness.windowEnd)}
              </strong>
              <small>ยืนยันด้วยอาการโดว์ด้านล่าง</small>
            </div>
          </div>
          <div className="climate-grid">
            <label>
              ความชื้น<strong>{humidity}%</strong>
              <input
                aria-label="ความชื้น"
                type="range"
                min="35"
                max="95"
                value={humidity}
                onChange={(e) => setHumidity(+e.target.value)}
              />
            </label>
            <div>
              <span>บัลก์ค่ากลาง</span>
              <strong>{duration(adaptive.bulk)}</strong>
            </div>
            <div>
              <span>รูมพรูฟ</span>
              <strong>{duration(adaptive.roomProof)}</strong>
            </div>
          </div>
          <div className="real-ready-cues">
            <strong>โดว์พร้อมพรีเชปจริงเมื่อ</strong>
            <span>ขึ้นประมาณ {bulkRiseTarget}%</span>
            <span>ผิวโค้งและมีฟองริมกล่อง</span>
            <span>สั่นคล้ายเจลแต่ยังเก็บทรง</span>
            <span>ยืดหยุ่น ไม่เหลวแผ่</span>
          </div>
          <p>
            {adaptiveTempSource === "dough"
              ? "วัดกลางก้อนหลังผสม และวัดซ้ำช่วงท้ายบัลก์ หากอุณหภูมิเปลี่ยนให้ปรับค่านี้ ระบบจะคำนวณเวลาใหม่ทันที"
              : "ใช้เมื่อยังไม่ได้วัดโดว์จริง หากวัดได้แล้ว เลือกอุณหภูมิโดว์จะแม่นกว่าสำหรับบัลก์"}
          </p>
          <div className="setting-actions compact">
            <button onClick={saveSettings}>บันทึกค่า</button>
            <button className="secondary" onClick={resetClimate}>
              รีเซ็ต
            </button>
          </div>
        </div>
      </section>

      <section
        className="bake-planner shell"
        aria-labelledby="bake-planner-title"
        hidden={activePage !== "home"}
      >
        <div className="bake-planner-copy">
          <p className="section-kicker">แพลนเวลาอบ</p>
          <h2 id="bake-planner-title">
            อยากอบวันไหน
            <br />
            ต้องเริ่มทำเมื่อไร
          </h2>
          <span>
            ระบบคำนวณย้อนกลับตามอุณหภูมิ สูตร ไฟนอลพรูฟ และจำนวนโลฟที่เลือกไว้
          </span>
        </div>
        <div className="bake-planner-inputs">
          <label>
            วันที่อยากอบ
            <input
              aria-label="วันที่อยากอบ"
              type="date"
              value={targetBakeDate}
              onChange={(e) => setBakeDate(e.target.value)}
            />
          </label>
          <label>
            เวลาเข้าอบรอบแรก
            <input
              aria-label="เวลาเข้าอบรอบแรก"
              type="time"
              value={targetBakeTime}
              onChange={(e) => setBakeTime(e.target.value)}
            />
          </label>
        </div>
        <div
          className={`bake-plan-result ${bakePlan?.startsInPast ? "warning" : ""}`}
        >
          {bakePlan ? (
            <>
              <div>
                <span>อยากอบ</span>
                <strong>{thaiDateTime(bakePlan.firstBake)}</strong>
              </div>
              <i>←</i>
              <div className="start-answer">
                <span>ต้องเริ่มทำโดว์</span>
                <strong>{thaiDateTime(bakePlan.start)}</strong>
              </div>
              <small className="starter-plan-time">
                เลี้ยงหัวเชื้อสำหรับรอบนี้ประมาณ{" "}
                <b>{thaiDateTime(bakePlan.feedStarterAt)}</b> · คาดว่าพีคใน{" "}
                {duration(levainPeakHours)}
              </small>
              <small>
                คำนวณย้อนกลับ {duration(hoursUntilFirstBake)}
                {loafCount > 1
                  ? ` · ทำ ${loafCount} โลฟ · อบ ${bakeBatches} รอบ`
                  : ""}
              </small>
              {bakeBatches > 1 && (
                <small>
                  อบครบทุกรอบประมาณ {thaiDateTime(bakePlan.allBakesDone)}
                </small>
              )}
              {bakePlan.startsInPast && (
                <em>
                  เวลาที่ต้องเริ่มผ่านไปแล้ว กรุณาเลือกเวลาอบที่ช้ากว่านี้
                </em>
              )}
            </>
          ) : (
            <>
              <div className="plan-placeholder">
                <span>เลือกวันที่และเวลาอยากอบ</span>
                <strong>แล้วเวลาที่ต้องเริ่มทำจะแสดงตรงนี้</strong>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="day-tracker shell" id="day-tracker" hidden={activePage !== "starter"}>
        <div className="tracker-intro">
          <p className="section-kicker">มายสตาร์ตเตอร์ — เดย์แทร็กเกอร์</p>
          <h2>{yeastName.trim() || "ตั้งชื่อยีสต์ของคุณ"}</h2>
          <span>ติดตามวันแรกที่หัวเชื้อถือกำเนิดจนถึงวันนี้</span>
        </div>
        <div className="tracker-fields">
          <label>
            ชื่อหัวเชื้อ <small>{yeastName.length}/60</small>
            <input
              aria-label="ชื่อหัวเชื้อ"
              type="text"
              maxLength={60}
              value={yeastName}
              onChange={(e) => setYeastName(e.target.value)}
              placeholder="เช่น น้องฟูฟ่อง"
            />
          </label>
          <label>
            วันเกิดหัวเชื้อ
            <input
              aria-label="วันเกิดหัวเชื้อ"
              type="date"
              max={today || undefined}
              value={yeastBirth}
              onChange={(e) => setYeastBirth(e.target.value)}
            />
          </label>
          <button type="button" onClick={saveYeast}>
            {activeYeastId ? "อัปเดต" : "บันทึก"}
          </button>
          <button type="button" className="secondary" onClick={resetYeast}>
            เพิ่มรายการใหม่
          </button>
        </div>
        <div className={`age-display ${yeastAge.ready ? "ready" : ""}`}>
          <span>อายุปัจจุบัน</span>
          {yeastBirth && yeastAge.ready ? (
            <>
              <strong>
                {yeastAge.days}
                <small> วัน</small>
              </strong>
              <p>
                เดย์ {yeastAge.days + 1}
                {yeastAge.years > 0
                  ? ` · ${yeastAge.years} ปี ${yeastAge.months} เดือน`
                  : ""}
              </p>
            </>
          ) : (
            <>
              <strong>—</strong>
              <p>เลือกวันเกิดเพื่อเริ่มนับ</p>
            </>
          )}
        </div>
        <div className="saved-starters">
          <div className="saved-starters-head">
            <strong>หัวเชื้อที่บันทึกไว้</strong>
            <span>
              {savedYeasts.length} รายการ · เก็บไว้ในเบราว์เซอร์เครื่องนี้
            </span>
          </div>
          {savedYeasts.length ? (
            <div className="saved-starters-list">
              {savedYeasts.map((record) => {
                const age = starterDaysOld(record.birth, today);
                return (
                  <article
                    className={record.id === activeYeastId ? "active" : ""}
                    key={record.id}
                  >
                    <button
                      type="button"
                      className="starter-select"
                      onClick={() => selectYeast(record)}
                    >
                      <strong>{record.name}</strong>
                      <span>
                        เกิด{" "}
                        {new Date(
                          `${record.birth}T00:00:00`,
                        ).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <b>
                        อายุ {age.toLocaleString("th-TH")} วัน · เดย์{" "}
                        {(age + 1).toLocaleString("th-TH")}
                      </b>
                    </button>
                    <button
                      type="button"
                      className="starter-delete"
                      aria-label={`ลบ ${record.name}`}
                      onClick={() => deleteYeast(record.id)}
                    >
                      ลบ
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="saved-empty">
              ยังไม่มีรายการ กรอกชื่อและวันเกิดแล้วกด “บันทึก”
            </p>
          )}
        </div>
      </section>

      <section className="starter-strip shell" hidden={activePage !== "starter"}>
        <div>
          <p className="section-kicker">สตาร์ตเตอร์เรดดี</p>
          <h2>เลี้ยงหัวเชื้อ</h2>
        </div>
        <div className="mini-input">
          <label>หัวเชื้อเดิม</label>
          <span>
            <input
              type="number"
              value={starterOld}
              onChange={(e) => setStarterOld(clamp(+e.target.value))}
            />{" "}
            กรัม
          </span>
        </div>
        <b>＋</b>
        <div className="mini-input">
          <label>แป้งใหม่</label>
          <span>
            <input
              type="number"
              value={feedFlour}
              onChange={(e) => setFeedFlour(clamp(+e.target.value))}
            />{" "}
            กรัม
          </span>
        </div>
        <b>＋</b>
        <div className="mini-input">
          <label>น้ำ</label>
          <span>
            <input
              type="number"
              value={feedWater}
              onChange={(e) => setFeedWater(clamp(+e.target.value))}
            />{" "}
            กรัม
          </span>
        </div>
        <div className="starter-result">
          <span>พร้อมใช้ประมาณ</span>
          <strong>{duration(adaptive.starterPeak)}</strong>
          <small>
            {round(starterOld + feedFlour + feedWater)} กรัม · ไฮเดรชัน{" "}
            {Math.round(starterHydration)}%
          </small>
        </div>
      </section>
      <div
        className="shell setting-actions starter-actions"
        hidden={activePage !== "starter"}
      >
        <button onClick={saveSettings}>บันทึกค่าการเลี้ยงหัวเชื้อ</button>
        <button className="secondary" onClick={resetStarter}>
          รีเซ็ต
        </button>
      </div>

      <section className="levain-tracker shell" id="levain-tracker" hidden={activePage !== "starter"}>
        <div className="levain-heading">
          <p className="section-kicker">
            เลอแวงบิลด์ — {yeastName.trim() || "หัวเชื้อสำหรับรอบนี้"}
          </p>
          <h2>ติดตามพัฒนาการก่อนนำไปทำขนมปัง</h2>
          <p>
            บันทึกเปอร์เซ็นต์การขึ้นและสภาพจริง ไม่ตัดสินจากเวลาเพียงอย่างเดียว
          </p>
        </div>
        <div className={`levain-readiness ${levainReadiness.key}`}>
          <span>สถานะปัจจุบัน</span>
          <strong>{levainReadiness.label}</strong>
          <p>{levainReadiness.detail}</p>
          <div>
            <b>{levainRise}%</b>
            <i>
              <em style={{ width: `${Math.min(150, levainRise) / 1.5}%` }} />
            </i>
          </div>
          {levainPredictedPeak && (
            <small>คาดว่าพีคประมาณ {thaiDateTime(levainPredictedPeak)}</small>
          )}
        </div>
        <div className="levain-controls">
          <label>
            เริ่มให้อาหาร
            <input
              type="datetime-local"
              value={levainStartedAt}
              onChange={(e) => setLevainStartedAt(e.target.value)}
            />
          </label>
          <label>
            อุณหภูมิหัวเชื้อ
            <span>
              <input
                type="number"
                min="18"
                max="35"
                step=".5"
                value={levainTemperature}
                onChange={(e) =>
                  setLevainTemperature(clamp(+e.target.value, 18))
                }
              />{" "}
              °C
            </span>
          </label>
          <label className="levain-rise-control">
            ปริมาตรเพิ่มขึ้น <strong>{levainRise}%</strong>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={levainRise}
              onChange={(e) => setLevainRise(+e.target.value)}
            />
          </label>
          <label>
            ลักษณะที่เห็น
            <select
              value={levainStage}
              onChange={(e) => setLevainStage(e.target.value as LevainStage)}
            >
              {(
                Object.entries(LEVAIN_STAGE_LABELS) as [LevainStage, string][]
              ).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="levain-note">
            โน้ต
            <textarea
              value={levainNote}
              maxLength={180}
              onChange={(e) => setLevainNote(e.target.value)}
              placeholder="เช่น ฟองทั่ว ยอดยังนูน กลิ่นโยเกิร์ตอ่อน ๆ"
            />
          </label>
          <div className="levain-actions">
            <button type="button" onClick={startLevainBuild}>
              เริ่มรอบใหม่
            </button>
            <button type="button" onClick={() => addLevainObservation(false)}>
              ＋ บันทึกพัฒนาการ
            </button>
            <button
              type="button"
              className="ready"
              onClick={() => addLevainObservation(true)}
            >
              ✓ พร้อมใช้ทำขนมปัง
            </button>
            <button
              type="button"
              className="secondary"
              onClick={resetLevainBuild}
            >
              รีเซ็ตแทร็กเกอร์
            </button>
          </div>
        </div>
        <div className="levain-history">
          <div className="levain-history-head">
            <strong>ไทม์ไลน์รอบการเลี้ยง</strong>
            <span>
              {levainObservations.length} บันทึก · อัตราเลี้ยง{" "}
              {round(starterOld)} : {round(feedFlour)} : {round(feedWater)}
            </span>
          </div>
          {levainObservations.length ? (
            <div className="levain-observations">
              {[...levainObservations].reverse().map((item, index) => (
                <article className={index === 0 ? "latest" : ""} key={item.id}>
                  <time>{thaiDateTime(new Date(item.at))}</time>
                  <strong>
                    {LEVAIN_STAGE_LABELS[item.stage]} · ขึ้น {item.rise}%
                  </strong>
                  {item.note && <p>{item.note}</p>}
                </article>
              ))}
            </div>
          ) : (
            <p className="levain-empty">
              กด “เริ่มรอบใหม่” หลังให้อาหาร
              แล้วกลับมาบันทึกทุกครั้งที่เห็นการเปลี่ยนแปลง
            </p>
          )}
        </div>
        {latestLevainObservation && (
          <div className="levain-use-note">
            <b>ข้อมูลล่าสุด</b>
            <span>
              {LEVAIN_STAGE_LABELS[latestLevainObservation.stage]} ·{" "}
              {latestLevainObservation.rise}%
            </span>
            <small>ก่อนใช้จริงควรเห็นฟองทั่ว ยอดยังนูน และไม่เริ่มยุบ</small>
          </div>
        )}
      </section>

      <section className="section shell" id="recipe" hidden={activePage !== "recipe"}>
        <header>
          <p className="section-kicker">01 — เรซิพีไลบรารี</p>
          <h2>เลือก ปรับ และบันทึกสูตร</h2>
          <span>สัดส่วนแป้งรวม 100% และคำนวณแป้ง/น้ำที่อยู่ในหัวเชื้อแล้ว</span>
        </header>
        <div className="recipe-preset-grid">
          {RECIPE_PRESETS.map((preset) => (
            <button
              type="button"
              onClick={() => applyPreset(preset)}
              key={preset.id}
            >
              <span>{preset.name}</span>
              <small>{preset.description}</small>
              <b>
                น้ำ {preset.hydration}% · Starter {preset.starterPercent}%
              </b>
            </button>
          ))}
        </div>
        <div className="recipe-grid">
          <div className="control-card" id="recipe-editor">
            <div className="recipe-name-field">
              <label>
                ชื่อสูตรของฉัน
                <input
                  type="text"
                  maxLength={60}
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="เช่น สูตรวันอาทิตย์"
                />
              </label>
              <span>
                {activeRecipeId
                  ? "กำลังแก้สูตรที่บันทึกไว้"
                  : "บันทึกเป็นสูตรใหม่"}
              </span>
            </div>
            <div className="flour-mix">
              <div className="bread-share">
                <span>แป้งขนมปัง (Bread Flour)</span>
                <strong>{recipe.breadPercent}%</strong>
                <small>ส่วนที่เหลืออัตโนมัติ · อย่างน้อย 10%</small>
              </div>
              <label>
                แป้งอเนกประสงค์ (AP)
                <span>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={apFlour}
                    onChange={(e) => setFlourPercent("ap", +e.target.value)}
                  />
                  %
                </span>
              </label>
              <label>
                สเปลต์ (Spelt)
                <span>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={speltFlour}
                    onChange={(e) => setFlourPercent("spelt", +e.target.value)}
                  />
                  %
                </span>
              </label>
              <label>
                โฮลวีท
                <span>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={wholeWheat}
                    onChange={(e) => setFlourPercent("whole", +e.target.value)}
                  />
                  %
                </span>
              </label>
              <label>
                ไรย์
                <span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={ryeFlour}
                    onChange={(e) => setFlourPercent("rye", +e.target.value)}
                  />
                  %
                </span>
              </label>
            </div>
            {flourProfile && (
              <div className="flour-profile">
                <b>รายละเอียดสูตรนี้</b>
                <span>{flourProfile}</span>
                <small>
                  คำว่า “ก้อนใหญ่/ก้อนเล็ก” หมายถึงปริมาตรหลังฟู
                  ไม่ใช่ปริมาณแป้ง · ปรับเปอร์เซ็นต์แป้งเมื่อใด
                  ระบบจะเปลี่ยนกลับเป็นสูตรกำหนดเอง
                </small>
              </div>
            )}
            <div className="control-row">
              <label>
                ไฮเดรชันจริง <strong>{hydration}%</strong>
              </label>
              <input
                type="range"
                min="55"
                max="90"
                value={hydration}
                onChange={(e) => {
                  setHydration(+e.target.value);
                  setActiveRecipeId("");
                }}
              />
            </div>
            <div className="control-row">
              <label>
                หัวเชื้อ 100% Hydration <strong>{starterPercent}%</strong>
              </label>
              <input
                type="range"
                min="5"
                max="35"
                value={starterPercent}
                onChange={(e) => {
                  setStarterPercent(+e.target.value);
                  setActiveRecipeId("");
                }}
              />
            </div>
            <div className="recipe-minor-settings">
              <label>
                เกลือ
                <span>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step=".1"
                    value={saltPercent}
                    onChange={(e) => setSaltPercent(clamp(+e.target.value, 1))}
                  />
                  %
                </span>
              </label>
              <label>
                น้ำมัน
                <span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step=".5"
                    value={oilPercent}
                    onChange={(e) => setOilPercent(clamp(+e.target.value))}
                  />
                  %
                </span>
              </label>
              <label>
                อุณหภูมิกลางโดเป้าหมาย
                <span>
                  <input
                    type="number"
                    min="20"
                    max="30"
                    step=".5"
                    value={doughTemperature}
                    onChange={(e) =>
                      setDoughTemperature(clamp(+e.target.value, 20))
                    }
                  />
                  °C
                </span>
              </label>
            </div>
            <div className="loaf-settings">
              <div>
                <span>จำนวนโลฟ</span>
                <div className="loaf-buttons">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      type="button"
                      className={loafCount === n ? "selected" : ""}
                      onClick={() => {
                        setLoafCount(n);
                        setLoavesPerBake((current) => Math.min(current, n));
                      }}
                      key={n}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {loafCount > 1 && (
                <div>
                  <span>เตาอบพร้อมกัน</span>
                  <div className="loaf-buttons">
                    {Array.from({ length: loafCount }, (_, i) => i + 1).map(
                      (n) => (
                        <button
                          type="button"
                          className={loavesPerBake === n ? "selected" : ""}
                          onClick={() => setLoavesPerBake(n)}
                          key={n}
                        >
                          {n}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <label className="weight-input">
              น้ำหนักโดว์ต่อโลฟ{" "}
              <span>
                <input
                  type="number"
                  min="300"
                  max="1800"
                  value={targetDough}
                  onChange={(e) => setTargetDough(clamp(+e.target.value, 300))}
                />{" "}
                กรัม
              </span>
            </label>
            <div className="presets">
              {[600, 800, 950, 1000, 1200].map((n) => (
                <button
                  className={targetDough === n ? "selected" : ""}
                  onClick={() => setTargetDough(n)}
                  key={n}
                >
                  {n} กรัม
                </button>
              ))}
            </div>
            <div className="multi-loaf-time">
              <span>เวลาหมักใช้ร่วมกัน</span>
              <strong>เพิ่มขึ้นรูป {duration(extraShapingHours)}</strong>
              <strong>อบ {bakeBatches} รอบ</strong>
            </div>
          </div>
          <div className="formula-card">
            <div className="formula-head">
              <div>
                <span>ยัวร์ฟอร์มูลา · {loafCount} โลฟ</span>
                <h3>{recipeName.trim() || "สูตรกำหนดเอง"}</h3>
                <small>
                  {loafCount} × {targetDough} กรัม · Bulk เป้าหมาย{" "}
                  {bulkRiseTarget}%
                </small>
              </div>
              <strong>
                {recipe.totalDough}
                <small> กรัม</small>
              </strong>
            </div>
            <div className="ingredients">
              <p>
                <span>แป้งขนมปัง</span>
                <b>{round(recipe.bread)} กรัม</b>
              </p>
              {apFlour > 0 && (
                <p>
                  <span>แป้งอเนกประสงค์</span>
                  <b>{round(recipe.ap)} กรัม</b>
                </p>
              )}
              {speltFlour > 0 && (
                <p>
                  <span>แป้งสเปลต์</span>
                  <b>{round(recipe.spelt)} กรัม</b>
                </p>
              )}
              {wholeWheat > 0 && (
                <p>
                  <span>แป้งโฮลวีท</span>
                  <b>{round(recipe.whole)} กรัม</b>
                </p>
              )}
              {ryeFlour > 0 && (
                <p>
                  <span>แป้งไรย์</span>
                  <b>{round(recipe.rye)} กรัม</b>
                </p>
              )}
              <p>
                <span>น้ำเย็น</span>
                <b>{round(recipe.water)} กรัม</b>
              </p>
              <p>
                <span>หัวเชื้อ 100%</span>
                <b>{round(recipe.levain)} กรัม</b>
              </p>
              <p>
                <span>เกลือ {saltPercent}%</span>
                <b>{round(recipe.salt)} กรัม</b>
              </p>
              {oilPercent > 0 && (
                <p>
                  <span>น้ำมัน {oilPercent}%</span>
                  <b>{round(recipe.oil)} กรัม</b>
                </p>
              )}
            </div>
            <div className="bulk-target-card">
              <span>
                เป้าหมายบัลก์จากอุณหภูมิ
                {adaptiveTempSource === "dough" ? "โดว์" : "ห้อง"}
              </span>
              <strong>ขึ้นประมาณ {bulkRiseTarget}%</strong>
              <small>
                {adaptiveTempSource === "dough" ? "โดว์" : "ห้อง"}{" "}
                {fermentationTemperature}°C · พร้อมประมาณ{" "}
                {duration(bulkReadiness.windowStart)}–
                {duration(bulkReadiness.windowEnd)} ·{" "}
                {proofMode === "room"
                  ? "Final Proof อุณหภูมิห้อง"
                  : "ขึ้นรูปแล้วเข้าตู้เย็น"}{" "}
                · ใช้สภาพโดว์ยืนยันเสมอ
              </small>
            </div>
            <div className={`recipe-learning-badge ${recipeCalibration.count?"learned":"empty"}`}><div><span>V27 · ระบบเรียนรู้สูตรนี้</span><strong>{recipeCalibration.label}</strong></div><p>{recipeCalibration.count?`${recipeCalibration.count} ผลอบ · ความมั่นใจ ${recipeCalibration.confidence}% · เวลาบัลก์ถูกปรับ ${Math.round((recipeCalibration.factor-1)*100)}%`:`บันทึกผลอบใน Bake Journal แล้วรอบถัดไปจะปรับเวลาเฉพาะสูตรนี้`}</p></div>
            <div className="weight-flow">
              <span>รวม {recipe.totalDough} กรัม</span>
              <i>→</i>
              <span>
                หลังอบต่อโลฟ <b>{Math.round(recipe.bakedEach)} กรัม</b> · รวม{" "}
                <b>{Math.round(recipe.baked)} กรัม</b>
              </span>
            </div>
          </div>
        </div>
        <div className="ddt-calculator">
          <div className="ddt-copy">
            <p className="section-kicker">V23 · DESIRED DOUGH TEMPERATURE</p>
            <h3>
              ควรใช้น้ำกี่องศา
              <br />
              เพื่อให้โดว์ได้ตามเป้า
            </h3>
            <p>
              คำนวณแบบ 4 Factors จากอุณหภูมิห้อง แป้ง Levain
              และความร้อนจากการผสม แล้วแบ่งน้ำเย็น–น้ำอุ่นตามน้ำจริงในสูตร
            </p>
            <code>
              อุณหภูมิน้ำ = (โดว์เป้าหมาย × 4) − ห้อง − แป้ง − Levain − Friction
            </code>
          </div>
          <div className="ddt-inputs">
            <label>
              โดว์เป้าหมาย
              <span>
                <input
                  type="number"
                  min="20"
                  max="30"
                  step=".1"
                  value={doughTemperature}
                  onChange={(e) => setDoughTemperature(+e.target.value)}
                />
                °C
              </span>
            </label>
            <label>
              อุณหภูมิห้อง
              <span>
                <input
                  type="number"
                  min="15"
                  max="38"
                  step=".1"
                  value={temperature}
                  onChange={(e) => setTemperature(+e.target.value)}
                />
                °C
              </span>
            </label>
            <label>
              อุณหภูมิแป้ง
              <span>
                <input
                  type="number"
                  min="15"
                  max="38"
                  step=".1"
                  value={flourTemperature}
                  onChange={(e) => setFlourTemperature(+e.target.value)}
                />
                °C
              </span>
            </label>
            <label>
              อุณหภูมิ Levain
              <span>
                <input
                  type="number"
                  min="15"
                  max="35"
                  step=".1"
                  value={levainMixTemperature}
                  onChange={(e) => setLevainMixTemperature(+e.target.value)}
                />
                °C
              </span>
            </label>
            <label>
              Friction จากการผสม
              <span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step=".5"
                  value={frictionFactor}
                  onChange={(e) => setFrictionFactor(+e.target.value)}
                />
                °C
              </span>
            </label>
          </div>
          <div className="ddt-result">
            <span>อุณหภูมิน้ำที่ควรใช้</span>
            <strong>
              {round(waterTemperaturePlan.rawTarget)}
              <small>°C</small>
            </strong>
            <p>
              {waterTemperaturePlan.outsideRange === "colder"
                ? `ต่ำกว่าน้ำเย็น ${coldWaterTemperature}°C — ใช้น้ำแช่เย็นหรือแทนน้ำบางส่วนด้วยน้ำแข็ง`
                : waterTemperaturePlan.outsideRange === "warmer"
                  ? `สูงกว่าน้ำอุ่น ${warmWaterTemperature}°C — เพิ่มอุณหภูมิน้ำอุ่นอย่างระมัดระวัง`
                  : `ผสมน้ำเย็นและน้ำอุ่นตามสัดส่วนด้านล่าง`}
            </p>
            <div className="water-source-inputs">
              <label>
                น้ำเย็น
                <input
                  type="number"
                  min="1"
                  max="25"
                  step=".5"
                  value={coldWaterTemperature}
                  onChange={(e) => setColdWaterTemperature(+e.target.value)}
                />
                °C
              </label>
              <label>
                น้ำอุ่น
                <input
                  type="number"
                  min="25"
                  max="60"
                  step=".5"
                  value={warmWaterTemperature}
                  onChange={(e) => setWarmWaterTemperature(+e.target.value)}
                />
                °C
              </label>
            </div>
            <div className="water-blend">
              <div>
                <span>น้ำเย็น</span>
                <strong>{round(waterTemperaturePlan.coldWater)} กรัม</strong>
              </div>
              <b>＋</b>
              <div>
                <span>น้ำอุ่น</span>
                <strong>{round(waterTemperaturePlan.warmWater)} กรัม</strong>
              </div>
              <b>＝</b>
              <div>
                <span>น้ำในสูตร</span>
                <strong>{round(waterTemperaturePlan.totalWater)} กรัม</strong>
              </div>
            </div>
            <div className="ddt-actions">
              <button type="button" onClick={saveSettings}>
                บันทึกค่า
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setFlourTemperature(DEFAULT_SETTINGS.flourTemperature);
                  setLevainMixTemperature(
                    DEFAULT_SETTINGS.levainMixTemperature,
                  );
                  setFrictionFactor(DEFAULT_SETTINGS.frictionFactor);
                  setColdWaterTemperature(
                    DEFAULT_SETTINGS.coldWaterTemperature,
                  );
                  setWarmWaterTemperature(
                    DEFAULT_SETTINGS.warmWaterTemperature,
                  );
                }}
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </div>
        <div className="setting-actions section-wide">
          <button onClick={saveRecipe}>
            {activeRecipeId ? "อัปเดตสูตรนี้" : "บันทึกเป็นสูตรใหม่"}
          </button>
          <button className="secondary" onClick={resetRecipe}>
            เริ่มสูตรใหม่
          </button>
        </div>
        <div className="saved-recipes">
          <div className="saved-recipes-head">
            <strong>สูตรที่บันทึกไว้</strong>
            <span>{savedRecipes.length} สูตร · มีปุ่มแก้ไขและลบแยกชัดเจน</span>
          </div>
          {savedRecipes.length ? (
            <div className="saved-recipe-list">
              {savedRecipes.map((item) => (
                <article
                  className={item.id === activeRecipeId ? "active" : ""}
                  key={item.id}
                >
                  <button
                    type="button"
                    className="saved-recipe-main"
                    onClick={() => applyRecipe(item, item.id)}
                  >
                    <strong>{item.name}</strong>
                    <span>
                      Bread{" "}
                      {Math.max(
                        0,
                        100 -
                          item.apFlour -
                          item.speltFlour -
                          item.wholeWheat -
                          item.ryeFlour,
                      )}
                      % · AP {item.apFlour}% · Spelt {item.speltFlour}% · Whole{" "}
                      {item.wholeWheat}% · Rye {item.ryeFlour}%
                    </span>
                    <small>
                      น้ำ {item.hydration}% · Starter {item.starterPercent}% ·
                      โดว์ {item.doughTemperature}°C
                    </small>
                  </button>
                  <div className="saved-recipe-actions">
                    <button
                      type="button"
                      className="edit"
                      onClick={() => editRecipe(item)}
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      className="delete"
                      onClick={() => deleteRecipe(item.id)}
                    >
                      ลบ
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="saved-recipe-empty">
              เลือกสูตรแนะนำหรือปรับค่าด้านบน แล้วกด “บันทึกเป็นสูตรใหม่”
            </p>
          )}
        </div>
      </section>

      <section className="section shell banneton-section" id="banneton" hidden={activePage !== "recipe"}>
        <header>
          <p className="section-kicker">01B — BANNETON CALCULATOR · V27</p>
          <h2>เลือกตะกร้าให้พอดีกับน้ำหนักโดว์</h2>
          <span>
            ใช้รูปทรงและขนาดด้านในของตะกร้าเพื่อประมาณน้ำหนักโดว์ที่พยุงทรงได้ดี
            พร้อมเทียบกับสูตรปัจจุบันให้ทันที
          </span>
        </header>
        <div className="banneton-grid">
          <div className="banneton-controls">
            <div className="banneton-presets">
              <span>ขนาดที่ใช้บ่อย</span>
              <div>
                {BANNETON_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    className={
                      bannetonShape === preset.shape &&
                      bannetonWidth === preset.width &&
                      bannetonLength === preset.length
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setBannetonShape(preset.shape);
                      setBannetonWidth(preset.width);
                      setBannetonLength(preset.length);
                      setBannetonDepth(preset.depth);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="banneton-shapes">
              <button
                type="button"
                className={bannetonShape === "round" ? "active" : ""}
                onClick={() => {
                  setBannetonShape("round");
                  setBannetonLength(bannetonWidth);
                }}
              >
                <b>○</b>
                <span>ทรงกลม</span>
              </button>
              <button
                type="button"
                className={bannetonShape === "oval" ? "active" : ""}
                onClick={() => setBannetonShape("oval")}
              >
                <b>⬭</b>
                <span>ทรงวงรี</span>
              </button>
            </div>
            <div className="banneton-dimensions">
              <label>
                {bannetonShape === "round" ? "เส้นผ่านศูนย์กลาง" : "ความกว้าง"}
                <span>
                  <input
                    type="number"
                    min="10"
                    max="40"
                    step=".1"
                    value={bannetonWidth}
                    onChange={(event) => {
                      const value = +event.target.value;
                      setBannetonWidth(value);
                      if (bannetonShape === "round") setBannetonLength(value);
                    }}
                  />
                  ซม.
                </span>
              </label>
              {bannetonShape === "oval" && (
                <label>
                  ความยาว
                  <span>
                    <input
                      type="number"
                      min="15"
                      max="50"
                      step=".1"
                      value={bannetonLength}
                      onChange={(event) => setBannetonLength(+event.target.value)}
                    />
                    ซม.
                  </span>
                </label>
              )}
              <label>
                ความลึก
                <span>
                  <input
                    type="number"
                    min="4"
                    max="18"
                    step=".1"
                    value={bannetonDepth}
                    onChange={(event) => setBannetonDepth(+event.target.value)}
                  />
                  ซม.
                </span>
              </label>
            </div>
          </div>
          <div className={`banneton-result ${bannetonPlan.fit.key}`}>
            <div className="banneton-illustration" aria-hidden="true">
              <span className={bannetonShape}>DG</span>
            </div>
            <p>น้ำหนักโดว์แนะนำ</p>
            <strong>
              {bannetonPlan.recommended.toLocaleString("th-TH")}
              <small>กรัม</small>
            </strong>
            <span>
              ช่วงใช้งานประมาณ {bannetonPlan.low.toLocaleString("th-TH")}–
              {bannetonPlan.high.toLocaleString("th-TH")} กรัม
            </span>
            <div className="banneton-fit">
              <b>{bannetonPlan.fit.label}</b>
              <p>
                สูตรปัจจุบัน {targetDough.toLocaleString("th-TH")} กรัม · {bannetonPlan.fit.detail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTargetDough(bannetonPlan.recommended);
                setToast("ปรับน้ำหนักโดว์ตามตะกร้าแล้ว");
              }}
            >
              ใช้น้ำหนักนี้กับสูตร
            </button>
            <small>
              เป็นค่าประมาณจากขนาดด้านใน ความชัน และความลึกของตะกร้า
              ควรจดผลจริงใน Bake Journal เพื่อปรับสูตรรอบต่อไป
            </small>
          </div>
        </div>
      </section>

      <section className="section shell setup-section" id="proof" hidden={activePage !== "proof"}>
        <header>
          <p className="section-kicker">02 — พรีแพร์ยัวร์โพรเซส</p>
          <h2>ตั้งค่าวิธีพักแป้ง ไฟนอลพรูฟ และวิธีอบ</h2>
          <span>
            เลือกวิธีพักแป้งก่อนเริ่ม จากนั้นกำหนดไฟนอลพรูฟและการอบ
            ระบบจะปรับขั้นตอนและเวลาให้ทันที
          </span>
        </header>
        <div className="prep-method-picker">
          <div>
            <p className="section-kicker">ขั้นตอนที่ 1</p>
            <h3>เลือกวิธีพักแป้งก่อนพัฒนากลูเตน</h3>
            <span>
              ระบบจะเปลี่ยนชื่อขั้นตอน ลำดับการใส่หัวเชื้อ และเวลาใน Guided
              Workflow
            </span>
          </div>
          <div className="prep-method-options">
            <button
              type="button"
              className={prepMethod === "fermentolyse" ? "active" : ""}
              onClick={() => selectPrepMethod("fermentolyse")}
            >
              <strong>เฟอร์เมนโตไลซ์</strong>
              <small>แป้ง + น้ำ + หัวเชื้อ แล้วพัก</small>
              <b>{duration(fermentolyseHours)}</b>
            </button>
            <button
              type="button"
              className={prepMethod === "autolyse" ? "active" : ""}
              onClick={() => selectPrepMethod("autolyse")}
            >
              <strong>ออโตไลซ์</strong>
              <small>แป้ง + น้ำก่อน ยังไม่ใส่หัวเชื้อและเกลือ</small>
              <b>{duration(autolyseHours)}</b>
            </button>
          </div>
        </div>
        <div className={`accordion ${proofOpen ? "open" : ""}`}>
          <button
            className="accordion-head"
            onClick={() => setProofOpen(!proofOpen)}
            aria-expanded={proofOpen}
          >
            <span>
              <b>02A</b>
              <i>ไฟนอลพรูฟ</i>
              <strong>
                {proofMode === "room"
                  ? `นอกตู้ · ${duration(proofAdaptive.roomFinish)}`
                  : proofMode === "cold"
                    ? `ตู้เย็น · ${coldHours} ชม. ${fridgeTemp}°C`
                    : `รูม + โคลด์ · ${coldHours} ชม.`}
              </strong>
            </span>
            <em>{proofOpen ? "−" : "＋"}</em>
          </button>
          {proofOpen && (
            <div className="accordion-body">
              <div className="mode-tabs">
                {(
                  [
                    ["room", "นอกตู้เย็น"],
                    ["cold", "ในตู้เย็น"],
                    ["combo", "รูม + โคลด์"],
                  ] as [ProofMode, string][]
                ).map(([key, label]) => (
                  <button
                    className={proofMode === key ? "active" : ""}
                    onClick={() => setProofMode(key)}
                    key={key}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="proof-adaptive-panel">
                <div className="proof-adaptive-copy">
                  <span>V23 · FINAL PROOF ADAPTIVE</span>
                  <h3>คำนวณจากความร้อนที่อยู่ในก้อนจริง</h3>
                  <p>
                    ใช้โดว์ {round(proofAdaptive.startTemperature)}°C ·{" "}
                    {targetDough} กรัม · ตู้เย็น {fridgeTemp}°C และระดับ Bulk
                    ล่าสุด {Math.round(proofAdaptive.bulkRatio * 100)}%
                  </p>
                </div>
                <div className="proof-adaptive-metrics">
                  <div>
                    <span>แกนโดว์หลังเข้าตู้ 2 ชม.</span>
                    <strong>{round(proofAdaptive.coreAfterTwoHours)}°C</strong>
                  </div>
                  <div>
                    <span>เย็นถึงประมาณ 8°C</span>
                    <strong>{duration(proofAdaptive.coolToEightHours)}</strong>
                  </div>
                  <div>
                    <span>ช่วงโคลด์แนะนำ</span>
                    <strong>
                      {duration(proofAdaptive.windowLow)}–
                      {duration(proofAdaptive.windowHigh)}
                    </strong>
                  </div>
                  <div className={proofAdaptive.coldStatus.key}>
                    <span>เวลาที่ตั้งไว้</span>
                    <strong>{proofAdaptive.coldStatus.label}</strong>
                  </div>
                </div>
                <div className="proof-adaptive-action">
                  <div>
                    <span>ค่ากลางที่แนะนำ</span>
                    <strong>{duration(proofAdaptive.recommendedCold)}</strong>
                    <small>
                      ก้อนใหญ่เย็นช้ากว่า จึงยังหมักต่อช่วงต้นนานกว่า
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setColdHours(
                        Math.round(proofAdaptive.recommendedCold * 2) / 2,
                      )
                    }
                  >
                    ใช้เวลานี้
                  </button>
                </div>
              </div>
              <div className="proof-grid">
                <article className={proofMode === "room" ? "chosen" : ""}>
                  <span>รูมพรูฟ</span>
                  <h3>นอกตู้เย็น</h3>
                  <strong>
                    {duration(proofAdaptive.roomFinish)}{" "}
                    <small>ที่ {temperature}°C</small>
                  </strong>
                  <p>
                    เร็ว เหมาะกับการอบภายในวันเดียว รสเปรี้ยวน้อยกว่า
                    แต่ต้องจับจังหวะให้แม่น
                  </p>
                  <ul>
                    <li>คลุมถุงกันผิวแห้ง</li>
                    <li>เริ่มฟิงเกอร์โพกเทสต์ก่อนครบ 20 นาที</li>
                    <li>เด้งกลับช้าและเหลือรอยตื้น = พร้อม</li>
                  </ul>
                </article>
                <article className={proofMode === "cold" ? "chosen" : ""}>
                  <span>โคลด์รีทาร์ด</span>
                  <h3>ในตู้เย็น</h3>
                  <strong>
                    {coldHours} ชม. <small>ที่ {fridgeTemp}°C</small>
                  </strong>
                  <p>ตัดลายง่าย กลิ่นรสซับซ้อน และอบจากตู้เย็นได้ทันที</p>
                  <div className="dual-setting">
                    <label>
                      เวลา
                      <input
                        type="number"
                        min="6"
                        max="24"
                        value={coldHours}
                        onChange={(e) =>
                          setColdHours(clamp(+e.target.value, 6))
                        }
                      />
                      ชม.
                    </label>
                    <label>
                      ตู้เย็น
                      <input
                        type="number"
                        min="2"
                        max="8"
                        value={fridgeTemp}
                        onChange={(e) =>
                          setFridgeTemp(clamp(+e.target.value, 2))
                        }
                      />
                      °C
                    </label>
                  </div>
                  <ul>
                    <li>
                      รอบนี้แนะนำ {duration(proofAdaptive.windowLow)}–
                      {duration(proofAdaptive.windowHigh)}
                    </li>
                    <li>
                      วัดจากอุณหภูมิเริ่มต้น น้ำหนักก้อน และอุณหภูมิตู้จริง
                    </li>
                  </ul>
                </article>
                <article className={proofMode === "combo" ? "chosen" : ""}>
                  <span>ไฮบริด</span>
                  <h3>รูม + โคลด์</h3>
                  <strong>
                    {duration(proofAdaptive.comboRoom)} + {coldHours} ชม.
                  </strong>
                  <p>
                    เริ่มกระตุ้นนอกตู้แล้วชะลอในตู้เย็น
                    เหมาะเมื่อโดว์ยังตึงหลังขึ้นรูป
                  </p>
                  <ul>
                    <li>พักนอกตู้จนโดว์เริ่มผ่อนคลาย</li>
                    <li>เข้าตู้ก่อนขึ้นมากเกินไป</li>
                    <li>อบเย็นตรงจากตู้เย็น</li>
                  </ul>
                </article>
              </div>
            </div>
          )}
        </div>

        <div className={`accordion ${bakeOpen ? "open" : ""}`} id="baking">
          <button
            className="accordion-head"
            onClick={() => setBakeOpen(!bakeOpen)}
            aria-expanded={bakeOpen}
          >
            <span>
              <b>02B</b>
              <i>เบกกิงเมธอด</i>
              <strong>
                {bakeMode === "dutch"
                  ? "ดัตช์โอเวน · ไม่เติมน้ำ"
                  : `โอเพนเบก · น้ำ ${steamWater} มล.`}
              </strong>
            </span>
            <em>{bakeOpen ? "−" : "＋"}</em>
          </button>
          {bakeOpen && (
            <div className="accordion-body">
              <div className="mode-tabs bake-tabs">
                <button
                  className={bakeMode === "dutch" ? "active" : ""}
                  onClick={() => setBakeMode("dutch")}
                >
                  ดัตช์โอเวน
                </button>
                <button
                  className={bakeMode === "open" ? "active" : ""}
                  onClick={() => setBakeMode("open")}
                >
                  อบแบบเปิด + ไอน้ำ
                </button>
              </div>
              {bakeMode === "dutch" ? (
                <div className="bake-guide">
                  <article className="method-hero">
                    <span>ดัตช์โอเวน</span>
                    <h3>
                      กักไอน้ำจากตัวโดว์
                      <br />
                      ไม่ต้องเติมน้ำ
                    </h3>
                    <p>
                      เหมาะสำหรับเตาอบบ้าน
                      ควบคุมไอน้ำง่ายและช่วยให้โอเวนสปริงหรือการพองตัวในเตาดี
                    </p>
                    <div className="heat-pill">250°C · พรีฮีต 45 นาที</div>
                  </article>
                  <div className="bake-steps">
                    <div>
                      <b>01</b>
                      <span>
                        <strong>อุ่นหม้อพร้อมฝา</strong>250°C อย่างน้อย 45 นาที
                      </span>
                    </div>
                    <div>
                      <b>02</b>
                      <span>
                        <strong>อบปิดฝา</strong>240–250°C · 20 นาที
                      </span>
                    </div>
                    <div>
                      <b>03</b>
                      <span>
                        <strong>เปิดฝา ลดไฟ</strong>220–230°C · 20–25 นาที
                      </span>
                    </div>
                    <div>
                      <b>04</b>
                      <span>
                        <strong>ทำเปลือกให้กรอบ</strong>แง้มประตูเตา 3–5
                        นาทีท้าย
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="steam-calculator">
                    <div className="steam-inputs">
                      <h3>คำนวณปริมาณน้ำสำหรับถาดไอน้ำ</h3>
                      <p>
                        กรอกค่าจริงของเตาและถาด
                        ระบบจะให้ช่วงเริ่มต้นที่ปลอดภัยสำหรับทดลอง
                      </p>
                      <div className="calc-fields">
                        <label>
                          ความจุเตา
                          <span>
                            <input
                              type="number"
                              min="20"
                              max="120"
                              value={ovenVolume}
                              onChange={(e) =>
                                setOvenVolume(clamp(+e.target.value, 20))
                              }
                            />{" "}
                            ลิตร
                          </span>
                        </label>
                        <label>
                          ถาดกว้าง
                          <span>
                            <input
                              type="number"
                              min="10"
                              max="60"
                              value={trayWidth}
                              onChange={(e) =>
                                setTrayWidth(clamp(+e.target.value, 10))
                              }
                            />{" "}
                            ซม.
                          </span>
                        </label>
                        <label>
                          ถาดยาว
                          <span>
                            <input
                              type="number"
                              min="10"
                              max="60"
                              value={trayLength}
                              onChange={(e) =>
                                setTrayLength(clamp(+e.target.value, 10))
                              }
                            />{" "}
                            ซม.
                          </span>
                        </label>
                        <label>
                          เวลาต้องการไอน้ำ
                          <span>
                            <input
                              type="number"
                              min="10"
                              max="25"
                              value={steamMinutes}
                              onChange={(e) =>
                                setSteamMinutes(clamp(+e.target.value, 10))
                              }
                            />{" "}
                            นาที
                          </span>
                        </label>
                      </div>
                      <div className="seal-select">
                        <span>การเก็บไอน้ำของเตา</span>
                        {(
                          [
                            ["tight", "แน่น"],
                            ["normal", "ปกติ"],
                            ["leaky", "รั่วง่าย"],
                          ] as const
                        ).map(([key, label]) => (
                          <button
                            key={key}
                            className={ovenSeal === key ? "active" : ""}
                            onClick={() => setOvenSeal(key)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="steam-result">
                      <span>ปริมาณแนะนำ</span>
                      <strong>
                        {steamCalculation.recommended}
                        <small> มล.</small>
                      </strong>
                      <p>
                        ช่วงทดลอง {steamCalculation.low}–{steamCalculation.high}{" "}
                        มล.
                      </p>
                      <button
                        onClick={() =>
                          setSteamWater(steamCalculation.recommended)
                        }
                      >
                        ใช้ค่าที่แนะนำ
                      </button>
                      <small>
                        ระดับน้ำในถาดประมาณ {steamCalculation.depth} มม.
                      </small>
                    </div>
                  </div>
                  <div className="formula-explain">
                    <h3>วิธีคำนวณ</h3>
                    <code>
                      น้ำ = (ความจุเตา × 2.2 + นาทีไอน้ำ × 3) × ตัวคูณการรั่ว ×
                      ตัวคูณพื้นที่ถาด
                    </code>
                    <div className="formula-values">
                      <p>
                        <b>ฐานเตา</b>
                        {ovenVolume} × 2.2 = {round(ovenVolume * 2.2)} มล.
                      </p>
                      <p>
                        <b>ฐานเวลา</b>
                        {steamMinutes} × 3 = {steamMinutes * 3} มล.
                      </p>
                      <p>
                        <b>ตัวคูณการรั่ว</b>
                        {steamCalculation.sealFactor}×
                      </p>
                      <p>
                        <b>พื้นที่ถาด</b>
                        {steamCalculation.area} ซม² →{" "}
                        {round(steamCalculation.areaFactor)}×
                      </p>
                    </div>
                    <ul>
                      <li>
                        สูตรนี้เป็นค่าเริ่มต้นเชิงปฏิบัติ
                        ไม่ใช่ปริมาณน้ำเพื่อทำให้เตาอิ่มตัวทางฟิสิกส์
                        เพราะเตาบ้านระบายอากาศและควบแน่นต่างกัน
                      </li>
                      <li>
                        เริ่มจากค่ากลาง ถ้าเปลือกเซ็ตเร็วหรือรอยกรีดไม่เปิด
                        เพิ่มครั้งละ 25 มล.; ถ้ามีน้ำเหลือหลัง 20 นาที ลดครั้งละ
                        25 มล.
                      </li>
                      <li>
                        ถาดพื้นที่มากระเหยเร็วกว่า สูตรจึงเพิ่มน้ำเล็กน้อย
                        แต่ระดับน้ำต้องไม่สูงจนกระเด็นเมื่อเดือด
                      </li>
                    </ul>
                  </div>
                  <div className="bake-guide open-guide">
                    <article className="method-hero">
                      <span>โอเพนเบก</span>
                      <h3>ใช้จริง {steamWater} มล.</h3>
                      <p>
                        อุ่นเบกกิงสโตนหรือเบกกิงสตีลชั้นกลางและถาดโลหะหนาชั้นล่าง
                        250°C นาน 45–60 นาที
                      </p>
                      <label className="water-setting">
                        ปรับด้วยตนเอง{" "}
                        <input
                          type="range"
                          min="100"
                          max="350"
                          step="25"
                          value={steamWater}
                          onChange={(e) => setSteamWater(+e.target.value)}
                        />
                        <strong>{steamWater} มล.</strong>
                      </label>
                    </article>
                    <div className="bake-steps">
                      <div>
                        <b>01</b>
                        <span>
                          <strong>เตรียมน้ำเดือด</strong>ตวง {steamWater} มล.
                          ก่อนนำโดว์เข้าเตา
                        </span>
                      </div>
                      <div>
                        <b>02</b>
                        <span>
                          <strong>เทจากด้านข้าง</strong>ลงถาดโลหะร้อน
                          แล้วปิดประตูทันที
                        </span>
                      </div>
                      <div>
                        <b>03</b>
                        <span>
                          <strong>อบพร้อมไอน้ำ</strong>240–250°C ·{" "}
                          {steamMinutes} นาที
                        </span>
                      </div>
                      <div>
                        <b>04</b>
                        <span>
                          <strong>นำถาดออก ลดไฟ</strong>220–230°C · 20–25 นาที
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="safety">
                <span>!</span>
                <p>
                  <strong>ความปลอดภัยเรื่องไอน้ำ</strong>
                  ใช้น้ำเดือดกับถาดโลหะเท่านั้น ห้ามใช้ภาชนะแก้ว
                  ห้ามราดน้ำโดนกระจกเตา และหลบหน้า/มือจากไอน้ำเมื่อเปิดประตู
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="setting-actions section-wide">
          <button onClick={saveSettings}>
            บันทึกวิธีพักแป้ง ไฟนอลพรูฟ และการอบ
          </button>
          <button className="secondary" onClick={resetProofBake}>
            รีเซ็ตส่วนนี้
          </button>
        </div>
      </section>

      <section className="section shell bulk-tracker-section" id="bulk-tracker" hidden={activePage !== "bulk"}>
        <header>
          <div>
            <p className="section-kicker">03 — LIVE BULK TRACKER · V22</p>
            <h2>
              ดูโดว์จริง
              <br />
              แล้วคำนวณเวลาใหม่
            </h2>
          </div>
          <span>
            บันทึกอุณหภูมิ ปริมาตร ผิว ฟอง การสั่น และแรงเก็บทรง
            ระบบจะรวมข้อมูลเหล่านี้กับความพร้อมของ Levain
            เพื่อประเมินเวลาที่เหลือ
          </span>
        </header>

        <div className="bulk-tracker-toolbar">
          <div>
            <strong>
              {bulkRun ? bulkRun.recipeName : "ยังไม่มีรอบ Bulk ที่กำลังติดตาม"}
            </strong>
            <span>
              {bulkRun
                ? `เริ่ม ${thaiDateTime(new Date(bulkRun.startedAt))}`
                : "เริ่มจากศูนย์หรือโหลดข้อมูลตัวอย่างเพื่อทดลอง"}
            </span>
          </div>
          <div>
            <button type="button" className="sample" onClick={loadBulkExample}>
              ดูตัวอย่าง
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => startBulkRun()}
            >
              {bulkRun ? "เริ่มรอบใหม่" : "▶ เริ่ม Bulk"}
            </button>
            {bulkRun && (
              <button
                type="button"
                className="secondary"
                onClick={resetBulkRun}
              >
                จบรอบ/ล้าง
              </button>
            )}
          </div>
        </div>

        <div className="bulk-live-grid">
          <article className={`bulk-live-result ${liveBulk.key}`}>
            <div className="bulk-status-head">
              <span>สถานะจากข้อมูลจริง</span>
              <b>{liveBulk.confidence}% ความมั่นใจ</b>
            </div>
            <h3>{liveBulk.label}</h3>
            <p>{liveBulk.detail}</p>
            <div className="bulk-live-numbers">
              <div>
                <span>ผ่านไปแล้ว</span>
                <strong>{duration(liveBulk.elapsedMinutes / 60)}</strong>
              </div>
              <div>
                <span>ขึ้นจริง / เป้าหมาย</span>
                <strong>
                  {latestBulkObservation?.rise ?? 0}%{" "}
                  <small>/ {bulkRiseTarget}%</small>
                </strong>
              </div>
              <div>
                <span>คาดว่าพร้อม</span>
                <strong>
                  {liveBulk.remainingMinutes <= 0
                    ? "ตอนนี้"
                    : liveBulk.readyLow && liveBulk.readyHigh
                      ? `${clock(liveBulk.readyLow)}–${clock(liveBulk.readyHigh)}`
                      : "—"}
                </strong>
              </div>
              <div>
                <span>อัตราขึ้นล่าสุด</span>
                <strong>
                  {liveBulk.rate > 0
                    ? `${round(liveBulk.rate)}%/ชม.`
                    : "รอข้อมูลเพิ่ม"}
                </strong>
              </div>
            </div>
            <div
              className="bulk-progress"
              aria-label={`โดว์ขึ้น ${latestBulkObservation?.rise ?? 0} เปอร์เซ็นต์ จากเป้าหมาย ${bulkRiseTarget} เปอร์เซ็นต์`}
            >
              <i
                style={{
                  width: `${Math.min(100, ((latestBulkObservation?.rise ?? 0) / Math.max(1, bulkRiseTarget)) * 100)}%`,
                }}
              />
              <span
                style={{
                  left: `${Math.min(96, (bulkRiseTarget / Math.max(bulkRiseTarget + 20, 1)) * 100)}%`,
                }}
              >
                เป้า
              </span>
            </div>
          </article>

          <aside className={`bulk-levain-link ${levainActivity.tone}`}>
            <span>เชื่อมกับ LEVAIN TRACKER</span>
            <h3>{levainActivity.label}</h3>
            <p>
              {bulkRun?.levainStageAtMix &&
              bulkRun.levainStageAtMix !== "unknown"
                ? `ตอนผสมใช้ Levain สถานะ “${LEVAIN_STAGE_LABELS[bulkRun.levainStageAtMix]}”`
                : "หากบันทึก Levain ก่อนผสม ระบบจะเก็บสถานะไว้กับรอบ Bulk"}
            </p>
            <div>
              <span>ผลต่อเวลาฐาน</span>
              <strong>
                {levainActivity.factor === 1
                  ? "ไม่ปรับ"
                  : `${levainActivity.factor < 1 ? "เร็วขึ้น" : "เผื่อเพิ่ม"} ${Math.abs(Math.round((levainActivity.factor - 1) * 100))}%`}
              </strong>
            </div>
            <small>
              สถานะ Levain ถูกบันทึก ณ ตอนเริ่ม Bulk แม้ภายหลัง Levain Tracker
              จะเปลี่ยนรอบ
            </small>
          </aside>
        </div>

        {bulkRun ? (
          <div className="bulk-workspace">
            <div className="bulk-observation-form">
              <div className="bulk-form-head">
                <div>
                  <span>บันทึกครั้งใหม่</span>
                  <h3>ตอนนี้โดว์เป็นอย่างไร</h3>
                </div>
                <strong>ครั้งที่ {bulkRun.observations.length}</strong>
              </div>
              <div className="bulk-number-fields">
                <label>
                  อุณหภูมิโดว์
                  <span>
                    <input
                      type="number"
                      min="18"
                      max="35"
                      step=".1"
                      value={bulkTemperature}
                      onChange={(e) => setBulkTemperature(+e.target.value)}
                    />{" "}
                    °C
                  </span>
                </label>
                <label>
                  ปริมาตรเพิ่ม
                  <span>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      step="1"
                      value={bulkRise}
                      onChange={(e) => setBulkRise(+e.target.value)}
                    />{" "}
                    %
                  </span>
                </label>
              </div>
              <div className="bulk-choice-group">
                <span>ผิวโดว์</span>
                <div>
                  {(
                    Object.entries(BULK_SURFACE_LABELS) as [
                      BulkSurface,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <button
                      type="button"
                      className={bulkSurface === key ? "active" : ""}
                      onClick={() => setBulkSurface(key)}
                      key={key}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bulk-choice-group">
                <span>แรงเก็บทรง</span>
                <div>
                  {(
                    Object.entries(BULK_STRENGTH_LABELS) as [
                      BulkStrength,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <button
                      type="button"
                      className={bulkStrength === key ? "active" : ""}
                      onClick={() => setBulkStrength(key)}
                      key={key}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bulk-cue-toggles">
                <button
                  type="button"
                  className={bulkBubbles ? "active" : ""}
                  onClick={() => setBulkBubbles(!bulkBubbles)}
                >
                  <b>{bulkBubbles ? "✓" : "○"}</b>
                  <span>
                    มีฟองริมกล่อง<small>เห็นฟองเล็กด้านข้าง/ด้านบน</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={bulkJiggle ? "active" : ""}
                  onClick={() => setBulkJiggle(!bulkJiggle)}
                >
                  <b>{bulkJiggle ? "✓" : "○"}</b>
                  <span>
                    สั่นคล้ายเจล<small>เขย่ากล่องแล้วสั่นทั้งก้อน</small>
                  </span>
                </button>
              </div>
              <label className="bulk-note">
                บันทึกเพิ่มเติม
                <textarea
                  rows={2}
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  placeholder="เช่น หลังคอยล์โฟลด์รอบสุดท้าย โดว์ตึงและมีฟองเล็ก"
                />
              </label>
              <button
                type="button"
                className="bulk-save"
                onClick={addBulkObservation}
              >
                ＋ บันทึกและคำนวณใหม่
              </button>
            </div>

            <div className="bulk-timeline">
              <div className="bulk-timeline-head">
                <div>
                  <span>ไทม์ไลน์รอบนี้</span>
                  <h3>{bulkRun.observations.length} จุดวัด</h3>
                </div>
                <small>เป้าหมายขึ้น {bulkRiseTarget}%</small>
              </div>
              <div className="bulk-timeline-list">
                {[...bulkRun.observations].reverse().map((item, index) => (
                  <article
                    className={index === 0 ? "latest" : ""}
                    key={item.id}
                  >
                    <div className="bulk-timeline-time">
                      <strong>{duration(item.elapsedMinutes / 60)}</strong>
                      <span>{clock(new Date(item.at))}</span>
                    </div>
                    <div className="bulk-timeline-data">
                      <strong>
                        {item.rise}% · {item.temperature}°C
                      </strong>
                      <span>
                        {BULK_SURFACE_LABELS[item.surface]} ·{" "}
                        {BULK_STRENGTH_LABELS[item.strength]}
                      </span>
                      <small>
                        {[
                          item.bubbles ? "มีฟอง" : "",
                          item.jiggle ? "สั่นคล้ายเจล" : "",
                          item.note,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "ยังไม่มีอาการเพิ่มเติม"}
                      </small>
                    </div>
                    {bulkRun.observations.length > 1 && (
                      <button
                        type="button"
                        aria-label="ลบจุดวัดนี้"
                        onClick={() => deleteBulkObservation(item.id)}
                      >
                        ×
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bulk-empty">
            <span>◎</span>
            <div>
              <h3>เริ่มรอบจริง หรือทดลองตัวอย่างก่อน</h3>
              <p>
                ตัวอย่างมีข้อมูล 4 จุดวัดตลอด 2 ชม. 45 นาที
                เพื่อให้เห็นการคำนวณสถานะและเวลาที่เหลือทันที
              </p>
            </div>
            <button type="button" onClick={loadBulkExample}>
              โหลดตัวอย่าง Live Bulk
            </button>
          </div>
        )}
      </section>

      <section className="section shell" id="assistant" hidden={activePage !== "workflow"}>
        <header>
          <p className="section-kicker">04 — ไกด์เด็ดเวิร์กโฟลว์</p>
          <h2>ผู้ช่วยทำขนมปังทีละขั้น</h2>
          <span>
            {bakePlan
              ? "แสดงวันและเวลาเริ่ม–เสร็จจากแผนเวลาอบที่เลือกไว้ด้านบน"
              : "เลือกวันและเวลาในแผนเวลาอบ แล้วตารางของทุกขั้นตอนจะแสดงที่นี่"}
          </span>
        </header>
        <div className="workflow">
          <div className="phase-nav">
            {phases.map((phase, index) => {
              const timing = phaseTimeline?.[index];
              return (
                <button
                  key={phase.title}
                  className={`${index === activePhase ? "active" : ""} ${index < activePhase ? "done" : ""}`}
                  onClick={() => selectPhase(index)}
                >
                  <span>{index < activePhase ? "✓" : phase.icon}</span>
                  <div>
                    <strong>{phase.title}</strong>
                    <small>{phase.subtitle}</small>
                    {timing && (
                      <span className="phase-nav-time">
                        <time>เริ่ม {compactThaiDateTime(timing.start)}</time>
                        <time>เสร็จ {compactThaiDateTime(timing.end)}</time>
                      </span>
                    )}
                  </div>
                  <b>{duration(phase.hours)}</b>
                </button>
              );
            })}
          </div>
          <article className="guide-card">
            <div className="guide-top">
              <div>
                <p>
                  ขั้นตอน {activePhase + 1} จาก {phases.length}
                </p>
                <h3>{phases[activePhase].title}</h3>
                <span>{phases[activePhase].subtitle}</span>
              </div>
              <div className="phase-temp">{phases[activePhase].temp}</div>
            </div>
            {phaseTimeline && (
              <div className="phase-date-time">
                <div>
                  <span>เริ่มขั้นตอน</span>
                  <strong>
                    {thaiDateTime(phaseTimeline[activePhase].start)}
                  </strong>
                </div>
                <i>→</i>
                <div>
                  <span>เสร็จประมาณ</span>
                  <strong>
                    {thaiDateTime(phaseTimeline[activePhase].end)}
                  </strong>
                </div>
              </div>
            )}
            <div className="timer">
              <span>
                {running && phaseEnd
                  ? activePhase === 2 && phaseStart
                    ? countdown(
                        Math.min(
                          phaseEnd,
                          phaseStart +
                            (Math.floor(
                              Math.max(0, now - phaseStart) / 1800000,
                            ) +
                              1) *
                              1800000,
                        ) - now,
                      )
                    : countdown(phaseEnd - now)
                  : activePhase === 2
                    ? "30 นาที"
                    : duration(phases[activePhase].hours)}
              </span>
              <small>
                {running
                  ? activePhase === 2 && phaseStart
                    ? `รอบที่ ${Math.min(3, Math.floor(Math.max(0, now - phaseStart) / 1800000) + 1)} จาก 3`
                    : `สิ้นสุดประมาณ ${clock(new Date(phaseEnd!))}`
                  : activePhase === 2
                    ? "นับถอยหลังแยกรอบละ 30 นาที"
                    : "เวลาที่แนะนำ"}
              </small>
            </div>
            {activePhase === 2 && (
              <div className="milestone-schedule">
                <p>ตัวนับถอยหลังการพับโดว์ 3 รอบ</p>
                <div>
                  {STRENGTH_MILESTONES.map((milestone, index) => {
                    const target = phaseStart
                      ? phaseStart + milestone.minutes * 60000
                      : 0;
                    const previousTarget = phaseStart
                      ? phaseStart + index * 30 * 60000
                      : 0;
                    const reached = Boolean(phaseStart && now >= target);
                    const current = Boolean(
                      running &&
                        phaseStart &&
                        now >= previousTarget &&
                        now < target,
                    );
                    return (
                      <span
                        className={`${reached ? "reached" : ""} ${current ? "current" : ""}`}
                        key={milestone.minutes}
                      >
                        <b>{reached ? "✓" : index + 1}</b>
                        <strong>
                          {reached
                            ? "ครบแล้ว"
                            : current
                              ? countdown(target - now)
                              : running
                                ? "รอรอบก่อน"
                                : "30:00"}
                        </strong>
                        <small>{milestone.title}</small>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="instruction">
              <h4>วิธีทำในขั้นตอนนี้</h4>
              <ol>
                {phases[activePhase].guide.map((g, i) => (
                  <li key={g}>
                    <span>{i + 1}</span>
                    {g}
                  </li>
                ))}
              </ol>
            </div>
            {activePhase === 3 && (
              <div className="bulk-readiness-panel">
                <div>
                  <span>เริ่มตรวจ</span>
                  <strong>{duration(bulkReadiness.startCheck)}</strong>
                  <small>นับจากเริ่มหมัก</small>
                </div>
                <div>
                  <span>คาดว่าพร้อมจริง</span>
                  <strong>
                    {duration(bulkReadiness.windowStart)}–
                    {duration(bulkReadiness.windowEnd)}
                  </strong>
                  <small>ช่วงที่ควรเช็กถี่ขึ้น</small>
                </div>
                <div>
                  <span>เวลาเหลือในขั้นนี้</span>
                  <strong>
                    {duration(bulkReadiness.remainingStart)}–
                    {duration(bulkReadiness.remainingEnd)}
                  </strong>
                  <small>หลังพับโดว์ครบ</small>
                </div>
              </div>
            )}
            <div className="cue">
              <span>◎</span>
              <p>
                <strong>เกณฑ์พร้อมไปขั้นต่อไป</strong>
                {phases[activePhase].cue}
              </p>
            </div>
            <div className="guide-actions">
              <button className="start" onClick={startPhase}>
                {running ? "เริ่มนับใหม่" : "▶ เริ่มจับเวลา"}
              </button>
              <button
                className="next"
                onClick={completePhase}
                disabled={activePhase === phases.length - 1}
              >
                ทำเสร็จแล้ว · ขั้นต่อไป →
              </button>
              <button
                type="button"
                className="learn"
                onClick={() => {
                  const lesson = LEARNING_LESSONS.find(
                    (item) => item.workflowPhase === activePhase,
                  );
                  if (lesson) setActiveLessonId(lesson.id);
                  openPage("education");
                }}
              >
                ▶ ดูวิดีโอขั้นตอนนี้
              </button>
            </div>
          </article>
        </div>
      </section>
      <section
        className="section shell learning-section"
        id="learning"
        hidden={activePage !== "education"}
      >
        <header>
          <p className="section-kicker">05 — LEARNING STUDIO · V27</p>
          <h2>เรียนทำซาวโดว์ทีละขั้น พร้อมวิดีโอ</h2>
          <span>
            เลือกบทแล้วแสดงเพียงวิดีโอเดียว พร้อมจุดสังเกตภาษาไทยและเชื่อมกลับไปยัง Workflow
          </span>
        </header>
        <div className="learning-progress-card">
          <div>
            <span>ความคืบหน้าการเรียน</span>
            <strong>
              {completedLessons.length} จาก {LEARNING_LESSONS.length} บท
            </strong>
          </div>
          <div
            className="learning-progress-track"
            role="progressbar"
            aria-label="ความคืบหน้าบทเรียน"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={learningProgress}
          >
            <i style={{ width: `${learningProgress}%` }} />
          </div>
          <b>{learningProgress}%</b>
        </div>
        <div className="learning-layout">
          <aside className="lesson-catalog" aria-label="รายการบทเรียน">
            <div className="lesson-catalog-head">
              <div>
                <span>บทเรียนทั้งหมด</span>
                <strong>{visibleLessons.length} บท</strong>
              </div>
              <div className="lesson-language-tabs" aria-label="กรองภาษาวิดีโอ">
                {([
                  ["all", "ทั้งหมด"],
                  ["th", "ไทย"],
                  ["en", "อังกฤษ"],
                ] as [LessonLanguage, string][]).map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={lessonLanguage === key ? "active" : ""}
                    onClick={() => {
                      setLessonLanguage(key);
                      if (
                        key !== "all" &&
                        activeLesson.language !== key
                      ) {
                        const first = LEARNING_LESSONS.find(
                          (lesson) => lesson.language === key,
                        );
                        if (first) setActiveLessonId(first.id);
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="lesson-list">
              {visibleLessons.map((lesson) => {
                const done = completedLessons.includes(lesson.id);
                return (
                  <button
                    type="button"
                    key={lesson.id}
                    className={`${activeLesson.id === lesson.id ? "active" : ""} ${done ? "done" : ""}`}
                    onClick={() => setActiveLessonId(lesson.id)}
                  >
                    <span>{done ? "✓" : String(lesson.step).padStart(2, "0")}</span>
                    <div>
                      <strong>{lesson.title}</strong>
                      <small>{lesson.subtitle}</small>
                    </div>
                    <b>{lesson.language === "th" ? "TH" : "EN"}</b>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="lesson-player">
            <div className="lesson-player-head">
              <div>
                <span>
                  บทที่ {String(activeLesson.step).padStart(2, "0")} · {activeLesson.language === "th" ? "ภาษาไทย" : "ภาษาอังกฤษ"}
                </span>
                <h3>{activeLesson.title}</h3>
                <p>{activeLesson.subtitle}</p>
              </div>
              <b className={completedLessons.includes(activeLesson.id) ? "done" : ""}>
                {completedLessons.includes(activeLesson.id)
                  ? "✓ ดูจบแล้ว"
                  : "ยังไม่ได้ดูจบ"}
              </b>
            </div>
            <div className="lesson-recipe-note">
              <span>สูตรปัจจุบันของคุณ</span>
              <strong>
                น้ำ {hydration}% · Starter {starterPercent}% · โดว์ {doughTemperature}°C
              </strong>
              <p>
                ใช้วิดีโอเพื่อดูเทคนิคและสภาพโดว์เท่านั้น ให้ใช้กรัม อุณหภูมิ และเวลาจาก DoughGarden
              </p>
            </div>
            <div className="lesson-video-frame">
              <iframe
                key={activeLesson.id}
                src={`https://www.youtube-nocookie.com/embed/${activeLesson.videoId}?rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=th${activeLesson.startSeconds ? `&start=${activeLesson.startSeconds}` : ""}`}
                title={`วิดีโอบทเรียน ${activeLesson.title}`}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="lesson-source-row">
              <span>
                แหล่งวิดีโอ/อ่านเพิ่ม <b>{activeLesson.source}</b>
              </span>
              <a
                href={activeLesson.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                เปิดต้นฉบับ ↗
              </a>
            </div>
            <p className="lesson-summary">{activeLesson.summary}</p>
            <div className="lesson-notes-grid">
              <div>
                <h4>สิ่งที่ต้องสังเกตในวิดีโอ</h4>
                <ul>
                  {activeLesson.watch.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>เช็กลิสต์ก่อนทำจริง</h4>
                <ul>
                  {activeLesson.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="lesson-actions">
              <button
                type="button"
                className={completedLessons.includes(activeLesson.id) ? "completed" : ""}
                onClick={() =>
                  setCompletedLessons((current) =>
                    current.includes(activeLesson.id)
                      ? current.filter((id) => id !== activeLesson.id)
                      : [...current, activeLesson.id],
                  )
                }
              >
                {completedLessons.includes(activeLesson.id)
                  ? "✓ ดูบทนี้จบแล้ว"
                  : "ทำเครื่องหมายว่าดูจบ"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  if (activeLesson.workflowPhase === null) {
                    openPage("starter");
                    return;
                  }
                  setActivePhase(activeLesson.workflowPhase);
                  openPage("workflow");
                }}
              >
                {activeLesson.workflowPhase === null
                  ? "ไปเมนูหัวเชื้อ →"
                  : "ไปทำขั้นตอนนี้ →"}
              </button>
            </div>
            <small className="lesson-embed-note">
              หากผู้สร้างปิดการเล่นแบบฝัง ให้กด “เปิดต้นฉบับ” เพื่อดูบนเว็บไซต์ของผู้สร้างโดยตรง
            </small>
          </article>
        </div>
      </section>
      <section
        className="section shell analysis-lab-section"
        id="analysis-lab"
        hidden={activePage !== "analysis"}
      >
        <header>
          <p className="section-kicker">06 — DOUGH DIAGNOSTICS · V27</p>
          <h2>เช็กโดว์และวิเคราะห์ผลแบบไม่ฟันธงจากอาการเดียว</h2>
          <span>
            รวมหลายสัญญาณเข้าด้วยกัน แล้วเสนอสิ่งที่ควรทดลองเปลี่ยนครั้งละหนึ่งตัวแปร
          </span>
        </header>
        <div className="analysis-lab-grid">
          <article className="analysis-tool proof-readiness-tool">
            <div className="analysis-tool-head">
              <span>FINAL PROOF READINESS</span>
              <strong className={proofReadiness.key}>{proofReadiness.score}%</strong>
            </div>
            <h3>{proofReadiness.label}</h3>
            <p>{proofReadiness.detail}</p>
            <div className="analysis-fields">
              <label>
                โดว์ขึ้นหลังขึ้นรูป <b>{proofRise}%</b>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={proofRise}
                  onChange={(event) => setProofRise(+event.target.value)}
                />
              </label>
              <div className="analysis-choice-group">
                <span>Finger Poke</span>
                {([
                  ["fast", "เด้งเร็ว"],
                  ["slow", "เด้งช้า เหลือรอยตื้น"],
                  ["none", "ไม่เด้ง"],
                ] as [PokeResult, string][]).map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={pokeResult === key ? "active" : ""}
                    onClick={() => setPokeResult(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="analysis-choice-group">
                <span>แรงตึงผิว</span>
                {([
                  ["tight", "ตึงมาก"],
                  ["soft", "นุ่มแต่ยังเก็บทรง"],
                  ["weak", "อ่อน/แผ่"],
                ] as [ProofTension, string][]).map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={proofTension === key ? "active" : ""}
                    onClick={() => setProofTension(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`analysis-toggle ${proofJiggle ? "active" : ""}`}
                onClick={() => setProofJiggle(!proofJiggle)}
                aria-pressed={proofJiggle}
              >
                {proofJiggle ? "✓" : "○"} เขย่าตะกร้าแล้วโดว์สั่นเบา ๆ
              </button>
            </div>
            <small>
              คะแนนนี้เป็นตัวช่วยคัดกรอง ไม่ใช่คำยืนยัน 100% โดยเฉพาะโดว์เย็นหรือแป้งโฮลเกรนสูง
            </small>
          </article>

          <article className="analysis-tool crumb-tool">
            <div className="analysis-tool-head">
              <span>CRUMB ANALYSIS</span>
              <strong>5 แบบ</strong>
            </div>
            <h3>เลือกหน้าตัดที่ใกล้เคียงที่สุด</h3>
            <div className="crumb-patterns">
              {(Object.keys(CRUMB_DIAGNOSIS) as CrumbPattern[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  className={crumbPattern === key ? "active" : ""}
                  onClick={() => setCrumbPattern(key)}
                >
                  <span aria-hidden="true">
                    {key === "dense"
                      ? "····"
                      : key === "tunnel"
                        ? "○··"
                        : key === "wild"
                          ? "○◌○"
                          : key === "gummy"
                            ? "≈≈"
                            : "◌·○"}
                  </span>
                  <b>{CRUMB_DIAGNOSIS[key].label}</b>
                </button>
              ))}
            </div>
            <div className="crumb-result">
              <strong>{CRUMB_DIAGNOSIS[crumbPattern].status}</strong>
              <ol>
                {CRUMB_DIAGNOSIS[crumbPattern].causes.map((cause) => (
                  <li key={cause}>{cause}</li>
                ))}
              </ol>
              <p>
                <b>ทดลองรอบถัดไป:</b> {CRUMB_DIAGNOSIS[crumbPattern].next}
              </p>
            </div>
          </article>

          <article className="analysis-tool starter-plan-tool">
            <div className="analysis-tool-head">
              <span>STARTER FEEDING PLANNER</span>
              <strong>Adaptive</strong>
            </div>
            <h3>สัดส่วนให้อาหารตามเวลาที่มี</h3>
            <p>
              เวลาเป็นช่วงประมาณจากสัดส่วนและอุณหภูมิจริง ต้องยืนยันด้วยการขึ้น 2–3 เท่า ผิวโดม และกลิ่น
            </p>
            <label className="starter-seed-input">
              หัวเชื้อแม่
              <span>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={starterSeed}
                  onChange={(event) => setStarterSeed(clamp(+event.target.value, 2))}
                />
                กรัม
              </span>
            </label>
            <div className="feed-ratio-tabs">
              {[1, 2, 5, 10].map((ratio) => (
                <button
                  type="button"
                  key={ratio}
                  className={starterFeedRatio === ratio ? "active" : ""}
                  onClick={() => setStarterFeedRatio(ratio)}
                >
                  1:{ratio}:{ratio}
                </button>
              ))}
            </div>
            <div className="feed-plan-result">
              <div>
                <span>หัวเชื้อแม่</span>
                <strong>{starterSeed} กรัม</strong>
              </div>
              <div>
                <span>น้ำ</span>
                <strong>{starterFeedPlan.water} กรัม</strong>
              </div>
              <div>
                <span>แป้ง</span>
                <strong>{starterFeedPlan.flour} กรัม</strong>
              </div>
              <div className="peak-window">
                <span>คาดว่าพีคที่ {levainTemperature}°C</span>
                <strong>
                  {duration(starterFeedPlan.low)}–{duration(starterFeedPlan.high)}
                </strong>
                <small>ได้รวม {starterFeedPlan.total} กรัม</small>
              </div>
            </div>
          </article>

          <article className="analysis-tool flavor-tool">
            <div className="analysis-tool-head">
              <span>FLAVOR TARGET</span>
              <strong>ไม่ไล่ความเปรี้ยวสูงสุด</strong>
            </div>
            <h3>เลือกรสเป้าหมายของก้อนนี้</h3>
            <div className="flavor-tabs">
              {([
                ["mild", "เปรี้ยวน้อย"],
                ["balanced", "สมดุล"],
                ["tangy", "เปรี้ยวชัด"],
              ] as [FlavorTarget, string][]).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={flavorTarget === key ? "active" : ""}
                  onClick={() => setFlavorTarget(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flavor-result">
              <strong>{flavorPlan.label}</strong>
              <div>
                <span>Starter {flavorPlan.starter}%</span>
                <span>โดว์ {flavorPlan.dough}°C</span>
                <span>Cold {flavorPlan.cold} ชม.</span>
              </div>
              <p>{flavorPlan.note}</p>
              <button
                type="button"
                onClick={() => {
                  setStarterPercent(flavorPlan.starter);
                  setDoughTemperature(flavorPlan.dough);
                  setColdHours(flavorPlan.cold);
                  setProofMode("cold");
                  setAdaptiveTempSource("dough");
                  setToast("ใช้ค่ารสเป้าหมายกับสูตรปัจจุบันแล้ว");
                }}
              >
                ใช้ค่ากับสูตรปัจจุบัน
              </button>
            </div>
            <small>
              อุณหภูมิ เวลา แป้ง และสุขภาพหัวเชื้อทำงานร่วมกัน ผลจริงอาจต่างจากค่าประมาณ
            </small>
          </article>
        </div>
      </section>

      <section className="section shell bake-journal-section" id="bake-journal" hidden={activePage !== "analysis"}>
        <header>
          <p className="section-kicker">07 — BAKE JOURNAL · V27</p>
          <h2>บันทึกผลจริง แล้วให้เว็บเรียนรู้สูตรนี้</h2>
          <span>
            เปรียบเทียบเวลาบัลก์ที่คำนวณกับเวลาที่โดว์พร้อมจริง
            ระบบจะใช้ผลล่าสุดสูงสุด 6 ครั้งเพื่อปรับเวลาเฉพาะชื่อสูตรนี้
          </span>
        </header>
        <div className="journal-learning-summary">
          <div>
            <span>สูตรที่กำลังเรียนรู้</span>
            <strong>{recipeName || "สูตรกำหนดเอง"}</strong>
          </div>
          <div>
            <span>ข้อสรุป</span>
            <strong>{recipeCalibration.label}</strong>
          </div>
          <div>
            <span>ข้อมูล / ความมั่นใจ</span>
            <strong>
              {recipeCalibration.count} ครั้ง · {recipeCalibration.confidence}%
            </strong>
          </div>
          <div className="journal-adjustment">
            <span>เวลาที่ปรับ</span>
            <strong>
              {Math.round(adaptive.baseBulk * 60)} → {Math.round(adaptive.bulk * 60)} นาที
            </strong>
          </div>
        </div>
        <div className="journal-grid">
          <div className="journal-form">
            <div className="journal-form-head">
              <div>
                <span>บันทึกผลอบครั้งใหม่</span>
                <h3>โดว์พร้อมจริงเมื่อไร และผลอบเป็นอย่างไร</h3>
              </div>
              <button type="button" onClick={loadJournalExample}>
                โหลดตัวอย่าง 3 ครั้ง
              </button>
            </div>
            <label className="journal-bulk-time">
              เวลาบัลก์จริง
              <span>
                <input
                  type="number"
                  min="30"
                  max="1440"
                  step="5"
                  value={journalBulkMinutes || ""}
                  placeholder={String(
                    Math.round(liveBulk.elapsedMinutes) ||
                      Math.round(adaptive.bulk * 60),
                  )}
                  onChange={(event) => setJournalBulkMinutes(+event.target.value)}
                />
                นาที
              </span>
              <small>
                เวลาฐานที่ระบบคาด {Math.round(adaptive.baseBulk * 60)} นาที ·
                ถ้าเว้นว่างจะใช้เวลาจาก Live Bulk หรือค่าคำนวณล่าสุด
              </small>
            </label>
            {([
              ["Oven spring", journalOvenSpring, setJournalOvenSpring],
              ["เนื้อใน", journalCrumb, setJournalCrumb],
              ["ความเปรี้ยว", journalSourness, setJournalSourness],
              ["เปลือก", journalCrust, setJournalCrust],
            ] as [string, number, (value: number) => void][]).map(
              ([label, value, setter]) => (
                <div className="journal-rating" key={label}>
                  <span>{label}</span>
                  <div>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        type="button"
                        key={score}
                        className={value === score ? "active" : ""}
                        onClick={() => setter(score)}
                        aria-label={`${label} ${score} จาก 5`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ),
            )}
            <label className="journal-notes">
              สิ่งที่สังเกต
              <textarea
                rows={3}
                value={journalNotes}
                onChange={(event) => setJournalNotes(event.target.value)}
                placeholder="เช่น โดว์ตึงดี หูเปิด เนื้อชุ่ม รอบหน้าลดบัลก์อีก 10 นาที"
              />
            </label>
            <button type="button" className="journal-save" onClick={saveBakeEntry}>
              ＋ บันทึกผลอบและปรับเวลา
            </button>
          </div>
          <div className="journal-history">
            <div className="journal-history-head">
              <div>
                <span>ประวัติการอบ</span>
                <h3>{bakeEntries.length} รายการทั้งหมด</h3>
              </div>
              <small>รายการชื่อสูตรตรงกันจะถูกใช้เรียนรู้</small>
            </div>
            {bakeEntries.length ? (
              <div className="journal-list">
                {bakeEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className={entry.recipeName === recipeName ? "matching" : ""}
                  >
                    <div className="journal-entry-top">
                      <div>
                        <strong>{entry.recipeName}</strong>
                        <span>{compactThaiDateTime(new Date(entry.bakedAt))}</span>
                      </div>
                      <button
                        type="button"
                        aria-label="ลบผลอบนี้"
                        onClick={() => deleteBakeEntry(entry.id)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="journal-entry-metrics">
                      <span>
                        <small>คาด</small>
                        <b>{entry.predictedBulkMinutes} นาที</b>
                      </span>
                      <i>→</i>
                      <span>
                        <small>จริง</small>
                        <b>{entry.actualBulkMinutes} นาที</b>
                      </span>
                      <span>
                        <small>โดว์เฉลี่ย</small>
                        <b>{entry.averageDoughTemperature}°C</b>
                      </span>
                    </div>
                    <div className="journal-entry-scores">
                      <span>Spring {entry.ovenSpring}/5</span>
                      <span>เนื้อ {entry.crumb}/5</span>
                      <span>เปรี้ยว {entry.sourness}/5</span>
                      <span>เปลือก {entry.crust}/5</span>
                    </div>
                    {entry.notes && <p>{entry.notes}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="journal-empty">
                <span>✎</span>
                <h3>ยังไม่มีผลอบ</h3>
                <p>กดโหลดตัวอย่างเพื่อดูการเรียนรู้ หรือบันทึกผลจริงหลังอบ</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="data-transfer shell" id="data-transfer" hidden={activePage !== "data"}>
        <div>
          <p className="section-kicker">แบ็กอัปค่าตั้ง</p>
          <h2>ส่งออกและนำเข้าค่า</h2>
          <p>
            เก็บคลังสูตร อุณหภูมิ วิธีพรูฟ วิธีอบ หัวเชื้อ ไทม์ไลน์ Levain และ
            Live Bulk ขนาดตะกร้า และ Bake Journal เป็นไฟล์เดียว
          </p>
        </div>
        <div className="transfer-actions">
          <button onClick={exportSettings}>↓ ส่งออกค่า</button>
          <button
            className="secondary"
            onClick={() => importRef.current?.click()}
          >
            ↑ นำเข้าค่า
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            onChange={importSettings}
          />
        </div>
      </section>
      <footer>
        <div className="shell">
          <span>
            DoughGarden<small>กระดุ๊กกระดิ๊ก กระจุ๊กกระจิ๊กหัวใจ</small>
          </span>
          <p>
            อะแดปทีฟไทม์เป็นค่าประมาณ—อุณหภูมิโดว์ ความแข็งแรงของหัวเชื้อ
            และชนิดแป้งทำให้เวลาเปลี่ยนได้ ให้สภาพโดว์เป็นคำตอบสุดท้าย
          </p>
          <a href="#top">กลับด้านบน ↑</a>
        </div>
      </footer>
    </main>
  );
}
