"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProofMode = "room" | "cold" | "combo";
type BakeMode = "dutch" | "open";
type AlertSound = "bell" | "chime" | "soft" | "none";
type Phase = { icon: string; title: string; subtitle: string; hours: number; temp: string; guide: string[]; cue: string };
type SavedYeast = { id: string; name: string; birth: string; savedAt: string };
type TimerMilestone = { minutes: number; title: string; body: string };

const STRENGTH_MILESTONES: TimerMilestone[] = [
  { minutes: 30, title: "พับโดว์รอบที่ 1", body: "ครบ 30 นาที — สเตรตช์แอนด์โฟลด์ให้ครบ 4 ด้าน" },
  { minutes: 60, title: "พับโดว์รอบที่ 2", body: "ครบ 60 นาที — คอยล์โฟลด์อย่างนุ่มนวล" },
  { minutes: 90, title: "พับโดว์รอบที่ 3", body: "ครบ 90 นาที — คอยล์โฟลด์รอบสุดท้าย แล้วปล่อยโดว์พัก" },
];

const DEFAULT_SETTINGS = {
  temperature: 28, humidity: 70, starterOld: 20, feedFlour: 40, feedWater: 40,
  wholeWheat: 30, targetDough: 800, hydration: 72, starterPercent: 20,
  loafCount: 1, loavesPerBake: 1,
  proofMode: "cold" as ProofMode, coldHours: 12, fridgeTemp: 4,
  bakeMode: "dutch" as BakeMode, steamWater: 200, ovenVolume: 60,
  trayWidth: 30, trayLength: 20, steamMinutes: 20,
  ovenSeal: "normal" as "tight" | "normal" | "leaky",
  alertSound: "bell" as AlertSound,
  targetBakeAt: "",
};

type SavedSettings = typeof DEFAULT_SETTINGS;
const validNumber = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const normalizeSettings = (data: Record<string, unknown> | null | undefined): SavedSettings => ({
  temperature: validNumber(data?.temperature, DEFAULT_SETTINGS.temperature),
  humidity: validNumber(data?.humidity, DEFAULT_SETTINGS.humidity),
  starterOld: validNumber(data?.starterOld, DEFAULT_SETTINGS.starterOld),
  feedFlour: validNumber(data?.feedFlour, DEFAULT_SETTINGS.feedFlour),
  feedWater: validNumber(data?.feedWater, DEFAULT_SETTINGS.feedWater),
  wholeWheat: validNumber(data?.wholeWheat, DEFAULT_SETTINGS.wholeWheat),
  targetDough: validNumber(data?.targetDough, DEFAULT_SETTINGS.targetDough),
  hydration: validNumber(data?.hydration, DEFAULT_SETTINGS.hydration),
  starterPercent: validNumber(data?.starterPercent, DEFAULT_SETTINGS.starterPercent),
  loafCount: Math.min(6, Math.max(1, Math.round(validNumber(data?.loafCount, DEFAULT_SETTINGS.loafCount)))),
  loavesPerBake: Math.min(6, Math.max(1, Math.round(validNumber(data?.loavesPerBake, DEFAULT_SETTINGS.loavesPerBake)))),
  proofMode: data?.proofMode === "room" || data?.proofMode === "cold" || data?.proofMode === "combo" ? data.proofMode : DEFAULT_SETTINGS.proofMode,
  coldHours: validNumber(data?.coldHours, DEFAULT_SETTINGS.coldHours),
  fridgeTemp: validNumber(data?.fridgeTemp, DEFAULT_SETTINGS.fridgeTemp),
  bakeMode: data?.bakeMode === "dutch" || data?.bakeMode === "open" ? data.bakeMode : DEFAULT_SETTINGS.bakeMode,
  steamWater: validNumber(data?.steamWater, DEFAULT_SETTINGS.steamWater),
  ovenVolume: validNumber(data?.ovenVolume, DEFAULT_SETTINGS.ovenVolume),
  trayWidth: validNumber(data?.trayWidth, DEFAULT_SETTINGS.trayWidth),
  trayLength: validNumber(data?.trayLength, DEFAULT_SETTINGS.trayLength),
  steamMinutes: validNumber(data?.steamMinutes, DEFAULT_SETTINGS.steamMinutes),
  ovenSeal: data?.ovenSeal === "tight" || data?.ovenSeal === "normal" || data?.ovenSeal === "leaky" ? data.ovenSeal : DEFAULT_SETTINGS.ovenSeal,
  alertSound: data?.alertSound === "bell" || data?.alertSound === "chime" || data?.alertSound === "soft" || data?.alertSound === "none" ? data.alertSound : DEFAULT_SETTINGS.alertSound,
  targetBakeAt: typeof data?.targetBakeAt === "string" ? data.targetBakeAt : DEFAULT_SETTINGS.targetBakeAt,
});

const clamp = (n: number, min = 0) => Math.max(min, Number.isFinite(n) ? n : min);
const round = (n: number) => Math.round(n * 10) / 10;
const clock = (date: Date) => date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
const duration = (hours: number) => {
  const mins = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} ชม.${m ? ` ${m} นาที` : ""}` : `${m} นาที`;
};
const countdown = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600).toString().padStart(2, "0");
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};
const starterDaysOld = (birth: string, currentDate: string) => {
  if (!birth || !currentDate) return 0;
  const born = new Date(`${birth}T00:00:00`);
  const current = new Date(`${currentDate}T00:00:00`);
  return Math.max(0, Math.floor((current.getTime() - born.getTime()) / 86400000));
};

export default function Home() {
  const [temperature, setTemperature] = useState(28);
  const [humidity, setHumidity] = useState(70);
  const [starterOld, setStarterOld] = useState(20);
  const [feedFlour, setFeedFlour] = useState(40);
  const [feedWater, setFeedWater] = useState(40);
  const [wholeWheat, setWholeWheat] = useState(30);
  const [targetDough, setTargetDough] = useState(800);
  const [hydration, setHydration] = useState(72);
  const [starterPercent, setStarterPercent] = useState(20);
  const [loafCount, setLoafCount] = useState(1);
  const [loavesPerBake, setLoavesPerBake] = useState(1);
  const [proofMode, setProofMode] = useState<ProofMode>("cold");
  const [coldHours, setColdHours] = useState(12);
  const [fridgeTemp, setFridgeTemp] = useState(4);
  const [bakeMode, setBakeMode] = useState<BakeMode>("dutch");
  const [steamWater, setSteamWater] = useState(200);
  const [proofOpen, setProofOpen] = useState(true);
  const [bakeOpen, setBakeOpen] = useState(false);
  const [ovenVolume, setOvenVolume] = useState(60);
  const [trayWidth, setTrayWidth] = useState(30);
  const [trayLength, setTrayLength] = useState(20);
  const [steamMinutes, setSteamMinutes] = useState(20);
  const [ovenSeal, setOvenSeal] = useState<"tight" | "normal" | "leaky">("normal");
  const [alertSound, setAlertSound] = useState<AlertSound>("bell");
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [targetBakeAt, setTargetBakeAt] = useState("");
  const [activeNav, setActiveNav] = useState("day-tracker");
  const [activePhase, setActivePhase] = useState(0);
  const [phaseStart, setPhaseStart] = useState<number | null>(null);
  const [phaseEnd, setPhaseEnd] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(0);
  const [notifyStatus, setNotifyStatus] = useState<"default" | "granted" | "denied">("default");
  const [toast, setToast] = useState("");
  const [yeastName, setYeastName] = useState("เจ้าก้อนแป้ง");
  const [yeastBirth, setYeastBirth] = useState("");
  const [savedYeasts, setSavedYeasts] = useState<SavedYeast[]>([]);
  const [activeYeastId, setActiveYeastId] = useState("");
  const [today, setToday] = useState("");
  const alertedMilestones = useRef<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const adaptive = useMemo(() => {
    const tempFactor = Math.pow(2, (26 - temperature) / 10);
    const humidityFactor = humidity < 55 ? 1.06 : humidity > 82 ? 0.96 : 1;
    const wholeFactor = 1 - wholeWheat * 0.0015;
    const starterFactor = Math.pow(20 / Math.max(starterPercent, 5), 0.42);
    const bulk = 4.5 * tempFactor * humidityFactor * wholeFactor * starterFactor;
    const roomProof = 2.1 * tempFactor * humidityFactor;
    const starterPeak = 6 * tempFactor * Math.pow(Math.max(feedFlour / Math.max(starterOld, 1), .25) / 2, .22);
    return { tempFactor, bulk, roomProof, starterPeak };
  }, [temperature, humidity, wholeWheat, starterPercent, feedFlour, starterOld]);

  const recipe = useMemo(() => {
    const totalDough = targetDough * loafCount;
    const totalFlour = totalDough / (1 + hydration / 100 + .02);
    const levain = totalFlour * starterPercent / 100;
    const levainFlour = levain / 2;
    const levainWater = levain / 2;
    const whole = totalFlour * wholeWheat / 100;
    const white = Math.max(0, totalFlour - whole - levainFlour);
    const water = Math.max(0, totalFlour * hydration / 100 - levainWater);
    const salt = totalFlour * .02;
    return { totalDough, totalFlour, levain, whole, white, water, salt, baked: totalDough * .997 * .86, bakedEach: targetDough * .997 * .86 };
  }, [targetDough, loafCount, hydration, starterPercent, wholeWheat]);

  const yeastAge = useMemo(() => {
    if (!yeastBirth || !today) return { days: 0, years: 0, months: 0, ready: false };
    const born = new Date(`${yeastBirth}T00:00:00`);
    const current = new Date(`${today}T00:00:00`);
    const days = Math.max(0, Math.floor((current.getTime() - born.getTime()) / 86400000));
    const years = Math.floor(days / 365.2425);
    const months = Math.floor((days - years * 365.2425) / 30.44);
    return { days, years, months, ready: current >= born };
  }, [yeastBirth, today]);

  const finalProofHours = proofMode === "room" ? adaptive.roomProof : proofMode === "cold" ? coldHours : .75 * adaptive.tempFactor + coldHours;
  const bakeBatches = Math.ceil(loafCount / Math.min(loafCount, loavesPerBake));
  const extraShapingHours = Math.max(0, loafCount - 1) * 13 / 60;
  const bakeCycleHours = (bakeMode === "dutch" ? .33 : steamMinutes / 60) + .38;
  const steamCalculation = useMemo(() => {
    const area = Math.max(100, trayWidth * trayLength);
    const sealFactor = ovenSeal === "tight" ? .85 : ovenSeal === "leaky" ? 1.2 : 1;
    const areaFactor = Math.min(1.2, Math.max(.8, Math.sqrt(area / 600)));
    const raw = (ovenVolume * 2.2 + steamMinutes * 3) * sealFactor * areaFactor;
    const recommended = Math.round(Math.min(350, Math.max(100, raw)) / 10) * 10;
    return { area, sealFactor, areaFactor, recommended, low: Math.round(recommended * .8 / 10) * 10, high: Math.round(recommended * 1.2 / 10) * 10, depth: round(recommended / area * 10) };
  }, [ovenVolume, trayWidth, trayLength, steamMinutes, ovenSeal]);

  const phases = useMemo<Phase[]>(() => [
    { icon:"01", title:"ออโตไลซ์", subtitle:"พักแป้งกับน้ำ", hours:.75, temp:`${temperature}°C`, cue:"แป้งดูดน้ำทั่ว ไม่มีผงแห้ง เนื้อเริ่มยืดได้", guide:["ผสมแป้งขาว แป้งโฮลวีท และน้ำ โดยเก็บน้ำไว้ 20–30 กรัม", "ปิดฝาหรือคลุมผ้าเพื่อไม่ให้ผิวแห้ง", "ยังไม่ใส่เกลือและหัวเชื้อในขั้นตอนนี้"] },
    { icon:"02", title:"มิกซ์แอนด์ดีเวลลอป", subtitle:"ใส่หัวเชื้อและเกลือ", hours:.25, temp:`${temperature}°C`, cue:"โดว์เนียนขึ้น จับตัวเป็นก้อน และดึงได้โดยไม่ขาดทันที", guide:["บีบหัวเชื้อให้กระจายทั่วโดว์ แล้วพัก 5 นาที", "ละลายเกลือในน้ำที่เก็บไว้ ค่อย ๆ นวดเข้าโดว์", "ใช้รูโบด์หรือสแลปแอนด์โฟลด์ 5–8 นาทีตามความแข็งแรง"] },
    { icon:"03", title:"สเตร็งธ์บิลดิง", subtitle:"พับโดว์ 3 รอบ", hours:1.5, temp:`${temperature}°C`, cue:"หลังพับรอบสุดท้ายโดว์ตั้งทรง ผิวตึง และมีฟองเล็กด้านข้าง", guide:["นาที 30: สเตรตช์แอนด์โฟลด์รอบที่ 1 ให้ครบ 4 ด้าน", "นาที 60: คอยล์โฟลด์รอบที่ 2 อย่างนุ่มนวล", "นาที 90: คอยล์โฟลด์รอบที่ 3 แล้วปล่อยโดว์พัก"] },
    { icon:"04", title:"บัลก์เฟอร์เมนเทชัน", subtitle:"หมักรวมแบบอะแดปทีฟ", hours:Math.max(.5, adaptive.bulk - 1.5), temp:`${temperature}°C`, cue:temperature >= 27 ? "เล็งปริมาตรเพิ่ม 30–40% มีฟองริมภาชนะ และผิวโค้ง" : "เล็งปริมาตรเพิ่ม 50–60% มีฟองริมภาชนะ และโดว์สั่นดึ๋ง", guide:[`บัลก์รวมประมาณ ${duration(adaptive.bulk)} ที่ ${temperature}°C`, "ทำเครื่องหมายระดับเริ่มต้นบนภาชนะใสเพื่อดูเปอร์เซ็นต์การขึ้น", "อย่ารอให้ขึ้นเท่าตัว เพราะโดว์ยังหมักต่อระหว่างขึ้นรูปและไฟนอลพรูฟ"] },
    { icon:"05", title:"พรีเชปและเบนช์เรสต์", subtitle:loafCount>1?`แบ่งและพรีเชป ${loafCount} โลฟ`:"ขึ้นรูปเบื้องต้น", hours:(20+Math.max(0,loafCount-1)*5)/60, temp:"อุณหภูมิห้อง", cue:"ก้อนคลายตัวเล็กน้อยแต่ยังรักษาทรง ไม่แผ่แบน", guide:[loafCount>1?`ชั่งและแบ่งโดว์เป็น ${loafCount} ก้อน ก้อนละประมาณ ${targetDough} กรัม`:"เทโดว์ลงโต๊ะโดยรักษาแก๊ส ใช้ที่ตัดรวบให้เป็นก้อนกลม", "รวบแต่ละก้อนให้กลมโดยรักษาแก๊ส แล้วพัก 15–20 นาที", "ถ้าโดว์แผ่มาก ให้รวบซ้ำเบา ๆ และพักอีก 10 นาที"] },
    { icon:"06", title:"ไฟนอลเชป", subtitle:loafCount>1?`ขึ้นรูป ${loafCount} โลฟและลงตะกร้า`:"ขึ้นรูปและลงตะกร้า", hours:(15+Math.max(0,loafCount-1)*8)/60, temp:"อุณหภูมิห้อง", cue:"ผิวด้านนอกตึง รอยต่อปิดสนิท โดยไม่ฉีกผิวโดว์", guide:["โรยแป้งบาง ๆ พลิกด้านเรียบลง แล้วพับสร้างแรงตึง", loafCount>1?`ขึ้นรูปทีละก้อน ใช้เวลารวมประมาณ ${15+Math.max(0,loafCount-1)*8} นาที`:"ม้วนให้แน่นพอดี ไม่บีบไล่แก๊สทั้งหมด", "วางด้านรอยต่อขึ้นในตะกร้าที่โรยแป้งข้าวเจ้า"] },
    { icon:"07", title:"ไฟนอลพรูฟ", subtitle:proofMode === "room" ? "นอกตู้เย็น" : proofMode === "cold" ? "ในตู้เย็น" : "ผสมรูม + โคลด์", hours:finalProofHours, temp:proofMode === "room" ? `${temperature}°C` : `${fridgeTemp}°C`, cue:proofMode === "room" ? "กดนิ้วแล้วรอยบุ๋มเด้งกลับช้า ๆ และเหลือรอยตื้น" : "โดว์เย็นและแน่นขึ้น ปริมาตรเพิ่มเล็กน้อย ตัดลายได้คม", guide:proofMode === "room" ? [`พักประมาณ ${duration(adaptive.roomProof)} ที่ ${temperature}°C`, "คลุมถุงเพื่อกันผิวแห้ง เริ่มทดสอบกดนิ้วก่อนครบเวลา 20 นาที", "เด้งกลับเร็ว = ยังอ่อน / ไม่เด้งเลย = เกิน / เด้งช้า = พร้อมอบ"] : proofMode === "cold" ? [`ปิดถุงให้สนิท แช่ ${fridgeTemp}°C ประมาณ ${coldHours} ชั่วโมง`, "นำออกจากตู้เย็นแล้วกรีดและอบได้ทันที ไม่ต้องคืนอุณหภูมิ", "ตู้เย็นเกิน 6°C โดว์จะหมักเร็วขึ้น ควรลดเวลาโคลด์พรูฟ"] : [`พักนอกตู้ประมาณ ${duration(.75 * adaptive.tempFactor)} ก่อนเข้าตู้เย็น`, `แช่ ${fridgeTemp}°C ต่ออีก ${coldHours} ชั่วโมง`, "เหมาะเมื่อบัลก์จบค่อนข้างเร็วและต้องการเพิ่มกลิ่นรส"] },
    { icon:"08", title:"พรีฮีตและสกอร์", subtitle:"อุ่นเตาและกรีด", hours:.75, temp:"250°C", cue:"เตาและภาชนะสะสมความร้อนเต็มที่ ใบมีดกรีดลึก 0.5–1 ซม.", guide:bakeMode === "dutch" ? ["วางดัตช์โอเวนพร้อมฝาในเตา อุ่นที่ 250°C อย่างน้อย 45 นาที", "คว่ำโดว์เย็นลงกระดาษรอง ปัดแป้งส่วนเกินและกรีดมุม 30–45°", "ระวังภาชนะร้อนจัด ใช้ถุงมือกันความร้อนทั้งสองมือ"] : ["วางเบกกิงสตีลหรือเบกกิงสโตนชั้นกลาง และถาดโลหะหนาชั้นล่าง", "อุ่นเตา 250°C อย่างน้อย 45–60 นาที", "ต้มน้ำให้เดือดเตรียมไว้ ห้ามใช้ภาชนะแก้วสำหรับสร้างไอน้ำ"] },
    { icon:"09", title:"สตีมเบก", subtitle:bakeMode === "dutch" ? `อบปิดฝา · ${bakeBatches} รอบอบ` : `อบเปิดพร้อมไอน้ำ · ${bakeBatches} รอบอบ`, hours:bakeMode === "dutch" ? .33 : steamMinutes / 60, temp:"240–250°C", cue:"ก้อนขยายเต็มที่ รอยกรีดเปิดและเริ่มเกิดหูขนมปัง", guide:bakeMode === "dutch" ? [`อบพร้อมกัน ${Math.min(loafCount,loavesPerBake)} โลฟ · รวม ${bakeBatches} รอบอบ`, "ยกโดว์ลงดัตช์โอเวนร้อน ปิดฝา และอบ 20 นาทีที่ 240–250°C", bakeBatches>1?"จบรอบดรายเบกแล้ว อุ่นหม้อกลับให้ร้อน 10–15 นาทีก่อนรอบถัดไป":"ไม่จำเป็นต้องใส่น้ำ เพราะความชื้นจากโดว์ถูกกักไว้ในหม้อ"] : [`อบพร้อมกัน ${Math.min(loafCount,loavesPerBake)} โลฟ · รวม ${bakeBatches} รอบอบ`, `เทน้ำเดือด ${steamWater} มล. ลงถาดโลหะร้อน แล้วอบ ${steamMinutes} นาที`, "เทน้ำจากด้านข้างอย่างระวังไอน้ำลวก และอย่าราดโดนกระจกเตา"] },
    { icon:"10", title:"ดรายเบก", subtitle:"ไล่ความชื้นและทำสี", hours:.38, temp:"220–230°C", cue:"เปลือกน้ำตาลเข้มทั่ว เคาะก้นมีเสียงโปร่ง อุณหภูมิแกน 96–98°C", guide:bakeMode === "dutch" ? ["เปิดฝา ลดไฟเหลือ 220–230°C แล้วอบต่อ 20–25 นาที", "ถ้าสีเร็วให้ลดเหลือ 210°C แต่ไม่ควรรีบนำออก", "แง้มประตูเตา 3–5 นาทีท้ายเพื่อเปลือกกรอบ"] : ["นำถาดน้ำออกหรือระบายไอน้ำ ลดไฟเหลือ 220–230°C", "อบต่อ 20–25 นาที หมุนก้อนถ้าสีไม่สม่ำเสมอ", "แง้มประตูเตา 3–5 นาทีท้ายเพื่อเปลือกกรอบ"] },
    { icon:"11", title:"คูลดาวน์", subtitle:"พักให้เนื้อเซ็ตตัว", hours:2, temp:"อุณหภูมิห้อง", cue:"ก้อนเย็นเกือบสนิท เปลือกแห้ง และไอน้ำภายในกระจายตัวแล้ว", guide:["ย้ายขึ้นตะแกรงทันที ให้อากาศผ่านรอบก้อน", "รออย่างน้อย 2 ชั่วโมงก่อนตัด; ก้อนใหญ่รอ 3 ชั่วโมง", "การตัดเร็วทำให้เนื้อเหนียวและดูเหมือนอบไม่สุก"] },
  ], [temperature, adaptive.bulk, adaptive.roomProof, adaptive.tempFactor, proofMode, finalProofHours, fridgeTemp, coldHours, bakeMode, steamWater, steamMinutes, loafCount, loavesPerBake, bakeBatches, targetDough]);

  const playAlertSound = (sound: AlertSound = alertSound) => {
    if (sound === "none" || typeof window === "undefined" || !("AudioContext" in window)) return;
    try {
      const context = audioContextRef.current || new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const patterns: Record<Exclude<AlertSound, "none">, { frequency: number; delay: number; duration: number; volume: number }[]> = {
        bell: [
          { frequency: 880, delay: 0, duration: .28, volume: .18 },
          { frequency: 880, delay: .36, duration: .28, volume: .18 },
          { frequency: 1174.66, delay: .72, duration: .48, volume: .2 },
          { frequency: 880, delay: 1.35, duration: .28, volume: .18 },
          { frequency: 880, delay: 1.71, duration: .28, volume: .18 },
          { frequency: 1174.66, delay: 2.07, duration: .48, volume: .2 },
          { frequency: 1318.51, delay: 2.7, duration: .28, volume: .16 },
          { frequency: 1174.66, delay: 3.06, duration: .28, volume: .16 },
          { frequency: 880, delay: 3.42, duration: .75, volume: .19 },
        ],
        chime: [
          { frequency: 659.25, delay: 0, duration: .18, volume: .14 },
          { frequency: 783.99, delay: .22, duration: .18, volume: .14 },
          { frequency: 987.77, delay: .44, duration: .35, volume: .17 },
          { frequency: 659.25, delay: .95, duration: .18, volume: .14 },
          { frequency: 783.99, delay: 1.17, duration: .18, volume: .14 },
          { frequency: 987.77, delay: 1.39, duration: .35, volume: .17 },
          { frequency: 987.77, delay: 1.95, duration: .18, volume: .15 },
          { frequency: 783.99, delay: 2.17, duration: .18, volume: .15 },
          { frequency: 659.25, delay: 2.39, duration: .55, volume: .16 },
        ],
        soft: [
          { frequency: 440, delay: 0, duration: .42, volume: .08 },
          { frequency: 554.37, delay: .48, duration: .42, volume: .08 },
          { frequency: 659.25, delay: .96, duration: .7, volume: .09 },
          { frequency: 440, delay: 1.85, duration: .42, volume: .08 },
          { frequency: 554.37, delay: 2.33, duration: .42, volume: .08 },
          { frequency: 659.25, delay: 2.81, duration: .8, volume: .09 },
        ],
      };
      const start = context.currentTime + .03;
      patterns[sound].forEach(note => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = sound === "bell" ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(note.frequency, start + note.delay);
        gain.gain.setValueAtTime(.0001, start + note.delay);
        gain.gain.exponentialRampToValueAtTime(note.volume, start + note.delay + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, start + note.delay + note.duration);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(start + note.delay); oscillator.stop(start + note.delay + note.duration + .05);
      });
    } catch { setToast("เบราว์เซอร์นี้ไม่สามารถเล่นเสียงแจ้งเตือนได้"); }
  };

  const changeAlertSound = (sound: AlertSound) => {
    setAlertSound(sound);
    setSoundMenuOpen(false);
    const next = { ...currentSettings(), alertSound: sound };
    try { localStorage.setItem("doughgarden-settings", JSON.stringify(next)); } catch { /* The selector remains usable without storage. */ }
    if (sound !== "none") playAlertSound(sound);
  };

  useEffect(() => {
    if (!running || !phaseStart || !phaseEnd) return;
    const milestones: TimerMilestone[] = activePhase === 2
      ? STRENGTH_MILESTONES
      : [{ minutes: phases[activePhase].hours * 60, title: phases[activePhase].title, body: phases[activePhase].cue }];
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      milestones.forEach((milestone, index) => {
        const target = phaseStart + milestone.minutes * 60000;
        if (time >= target && !alertedMilestones.current.has(index)) {
          alertedMilestones.current.add(index);
          setToast(`ครบ ${milestone.minutes} นาที — ${milestone.title}`);
          if (notifyStatus === "granted" && "Notification" in window) {
            try { new Notification(`DoughGarden — ${milestone.title}`, { body: milestone.body, tag: `doughgarden-${activePhase}-${index}` }); } catch { /* Some mobile browsers require installed-app notifications. */ }
          }
          playAlertSound();
          if (index === milestones.length - 1) setRunning(false);
        }
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phaseStart, phaseEnd, phases, activePhase, notifyStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localToday = new Date();
      localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
      setToday(localToday.toISOString().slice(0, 10));
      if ("Notification" in window) setNotifyStatus(Notification.permission);
      try {
        const saved = JSON.parse(localStorage.getItem("doughgarden-yeast") || "null");
        if (saved?.name) setYeastName(saved.name);
        if (saved?.birth) setYeastBirth(saved.birth);
        const savedList = JSON.parse(localStorage.getItem("doughgarden-starters") || "[]");
        if (Array.isArray(savedList)) {
          const validList = savedList.filter((item): item is SavedYeast => Boolean(item?.id && item?.name && item?.birth));
          if (!validList.length && saved?.birth) {
            const migrated: SavedYeast = { id: `เดิม-${Date.now()}`, name: saved.name || "เจ้าก้อนแป้ง", birth: saved.birth, savedAt: new Date().toISOString() };
            localStorage.setItem("doughgarden-starters", JSON.stringify([migrated]));
            setSavedYeasts([migrated]); setActiveYeastId(migrated.id);
          } else {
            setSavedYeasts(validList);
            if (validList[0]) setActiveYeastId(validList[0].id);
          }
        }
        const settings = normalizeSettings(JSON.parse(localStorage.getItem("doughgarden-settings") || "null"));
        setTemperature(settings.temperature); setHumidity(settings.humidity);
        setStarterOld(settings.starterOld); setFeedFlour(settings.feedFlour); setFeedWater(settings.feedWater);
        setWholeWheat(settings.wholeWheat); setTargetDough(settings.targetDough); setHydration(settings.hydration); setStarterPercent(settings.starterPercent); setLoafCount(settings.loafCount); setLoavesPerBake(Math.min(settings.loafCount,settings.loavesPerBake));
        setProofMode(settings.proofMode); setColdHours(settings.coldHours); setFridgeTemp(settings.fridgeTemp);
        setBakeMode(settings.bakeMode); setSteamWater(settings.steamWater); setOvenVolume(settings.ovenVolume);
        setTrayWidth(settings.trayWidth); setTrayLength(settings.trayLength); setSteamMinutes(settings.steamMinutes); setOvenSeal(settings.ovenSeal); setAlertSound(settings.alertSound); setTargetBakeAt(settings.targetBakeAt);
      } catch {
        // The tracker remains usable if local storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sectionIds = ["day-tracker", "recipe", "proof", "baking", "assistant"];
    let frame = 0;
    const updateActiveNav = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const marker = window.scrollY + 130;
        let current = sectionIds[0];
        sectionIds.forEach(id => {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top + window.scrollY <= marker) current = id;
        });
        setActiveNav(current);
      });
    };
    updateActiveNav();
    window.addEventListener("scroll", updateActiveNav, { passive: true });
    window.addEventListener("resize", updateActiveNav);
    window.addEventListener("hashchange", updateActiveNav);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveNav);
      window.removeEventListener("resize", updateActiveNav);
      window.removeEventListener("hashchange", updateActiveNav);
    };
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) { setToast("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน"); return; }
    const result = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setNotifyStatus(result);
    if (result === "granted") {
      try {
        new Notification("DoughGarden — ทดสอบแจ้งเตือน", { body: "ระบบแจ้งเตือนพร้อมแล้ว จะเตือนเมื่อถึงเวลาพับโดว์แต่ละรอบ", tag: "doughgarden-test" });
        playAlertSound();
        setToast("ส่งแจ้งเตือนทดสอบแล้ว");
      } catch { setToast("อนุญาตแล้ว แต่เบราว์เซอร์นี้ต้องติดตั้งเว็บเป็นแอปก่อนแจ้งเตือน"); }
    } else setToast("ยังไม่ได้อนุญาตการแจ้งเตือน");
  };
  const startPhase = () => {
    alertedMilestones.current = new Set();
    if (audioContextRef.current?.state === "suspended") void audioContextRef.current.resume();
    if (!audioContextRef.current && "AudioContext" in window) audioContextRef.current = new AudioContext();
    const start = Date.now();
    const end = start + phases[activePhase].hours * 3600000;
    setNow(start); setPhaseStart(start); setPhaseEnd(end); setRunning(true);
    setToast(activePhase === 2 ? "เริ่มจับเวลา — จะเตือนที่นาที 30, 60 และ 90" : `เริ่ม ${phases[activePhase].title} แล้ว`);
  };
  const completePhase = () => {
    const next = Math.min(phases.length - 1, activePhase + 1);
    setActivePhase(next); setRunning(false); setPhaseStart(null); setPhaseEnd(null); alertedMilestones.current = new Set();
    document.getElementById("assistant")?.scrollIntoView({ behavior:"smooth" });
  };
  const selectPhase = (index: number) => { setActivePhase(index); setRunning(false); setPhaseStart(null); setPhaseEnd(null); alertedMilestones.current = new Set(); };
  const saveYeast = () => {
    if (!yeastBirth) { setToast("กรุณาเลือกวันเกิดหัวเชื้อก่อนบันทึก"); return; }
    const name = yeastName.trim() || "เจ้าก้อนแป้ง";
    const id = activeYeastId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: SavedYeast = { id, name, birth: yeastBirth, savedAt: new Date().toISOString() };
    const next = [record, ...savedYeasts.filter(item => item.id !== id)];
    try {
      localStorage.setItem("doughgarden-starters", JSON.stringify(next));
      localStorage.setItem("doughgarden-yeast", JSON.stringify({ name, birth: yeastBirth }));
      setSavedYeasts(next); setActiveYeastId(id); setYeastName(name);
      setToast(`บันทึก “${name}” แล้ว`);
    } catch { setToast("บันทึกไม่ได้ กรุณาอนุญาตการจัดเก็บข้อมูลของเว็บไซต์"); }
  };
  const resetYeast = () => {
    setYeastName(""); setYeastBirth(""); setActiveYeastId("");
    localStorage.removeItem("doughgarden-yeast");
    setToast("ล้างช่องกรอกแล้ว รายการที่บันทึกยังอยู่");
  };
  const selectYeast = (record: SavedYeast) => {
    setYeastName(record.name); setYeastBirth(record.birth); setActiveYeastId(record.id);
    localStorage.setItem("doughgarden-yeast", JSON.stringify({ name: record.name, birth: record.birth }));
    setToast(`เปิดข้อมูล “${record.name}” แล้ว`);
  };
  const deleteYeast = (id: string) => {
    const next = savedYeasts.filter(item => item.id !== id);
    localStorage.setItem("doughgarden-starters", JSON.stringify(next));
    setSavedYeasts(next);
    if (activeYeastId === id) { setActiveYeastId(""); setYeastName(""); setYeastBirth(""); localStorage.removeItem("doughgarden-yeast"); }
    setToast("ลบรายการหัวเชื้อแล้ว");
  };
  const currentSettings = (): SavedSettings => ({ temperature, humidity, starterOld, feedFlour, feedWater, wholeWheat, targetDough, hydration, starterPercent, loafCount, loavesPerBake, proofMode, coldHours, fridgeTemp, bakeMode, steamWater, ovenVolume, trayWidth, trayLength, steamMinutes, ovenSeal, alertSound, targetBakeAt });
  const saveSettings = () => {
    localStorage.setItem("doughgarden-settings", JSON.stringify(currentSettings()));
    setToast("บันทึกค่าที่ปรับไว้ในเครื่องนี้แล้ว");
  };
  const resetClimate = () => { setTemperature(DEFAULT_SETTINGS.temperature); setHumidity(DEFAULT_SETTINGS.humidity); localStorage.setItem("doughgarden-settings", JSON.stringify({ ...currentSettings(), temperature: DEFAULT_SETTINGS.temperature, humidity: DEFAULT_SETTINGS.humidity })); setToast("รีเซ็ตอุณหภูมิและความชื้นแล้ว"); };
  const resetStarter = () => { setStarterOld(DEFAULT_SETTINGS.starterOld); setFeedFlour(DEFAULT_SETTINGS.feedFlour); setFeedWater(DEFAULT_SETTINGS.feedWater); localStorage.setItem("doughgarden-settings", JSON.stringify({ ...currentSettings(), starterOld: DEFAULT_SETTINGS.starterOld, feedFlour: DEFAULT_SETTINGS.feedFlour, feedWater: DEFAULT_SETTINGS.feedWater })); setToast("รีเซ็ตค่าหัวเชื้อแล้ว"); };
  const resetRecipe = () => { setWholeWheat(DEFAULT_SETTINGS.wholeWheat); setTargetDough(DEFAULT_SETTINGS.targetDough); setHydration(DEFAULT_SETTINGS.hydration); setStarterPercent(DEFAULT_SETTINGS.starterPercent); setLoafCount(DEFAULT_SETTINGS.loafCount); setLoavesPerBake(DEFAULT_SETTINGS.loavesPerBake); localStorage.setItem("doughgarden-settings", JSON.stringify({ ...currentSettings(), wholeWheat: DEFAULT_SETTINGS.wholeWheat, targetDough: DEFAULT_SETTINGS.targetDough, hydration: DEFAULT_SETTINGS.hydration, starterPercent: DEFAULT_SETTINGS.starterPercent, loafCount: DEFAULT_SETTINGS.loafCount, loavesPerBake: DEFAULT_SETTINGS.loavesPerBake })); setToast("รีเซ็ตสูตรแล้ว"); };
  const resetProofBake = () => {
    setProofMode(DEFAULT_SETTINGS.proofMode); setColdHours(DEFAULT_SETTINGS.coldHours); setFridgeTemp(DEFAULT_SETTINGS.fridgeTemp);
    setBakeMode(DEFAULT_SETTINGS.bakeMode); setSteamWater(DEFAULT_SETTINGS.steamWater); setOvenVolume(DEFAULT_SETTINGS.ovenVolume);
    setTrayWidth(DEFAULT_SETTINGS.trayWidth); setTrayLength(DEFAULT_SETTINGS.trayLength); setSteamMinutes(DEFAULT_SETTINGS.steamMinutes); setOvenSeal(DEFAULT_SETTINGS.ovenSeal);
    localStorage.setItem("doughgarden-settings", JSON.stringify({ ...currentSettings(), proofMode: DEFAULT_SETTINGS.proofMode, coldHours: DEFAULT_SETTINGS.coldHours, fridgeTemp: DEFAULT_SETTINGS.fridgeTemp, bakeMode: DEFAULT_SETTINGS.bakeMode, steamWater: DEFAULT_SETTINGS.steamWater, ovenVolume: DEFAULT_SETTINGS.ovenVolume, trayWidth: DEFAULT_SETTINGS.trayWidth, trayLength: DEFAULT_SETTINGS.trayLength, steamMinutes: DEFAULT_SETTINGS.steamMinutes, ovenSeal: DEFAULT_SETTINGS.ovenSeal }));
    setToast("รีเซ็ตไฟนอลพรูฟและการอบแล้ว");
  };
  const exportSettings = () => {
    const payload = { app: "DoughGarden", version: 1, exportedAt: new Date().toISOString(), settings: currentSettings(), yeast: { name: yeastName.trim() || "เจ้าก้อนแป้ง", birth: yeastBirth } };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `DoughGarden-settings-${new Date().toISOString().slice(0,10)}.json`; link.click();
    URL.revokeObjectURL(url); setToast("ส่งออกไฟล์ค่าตั้งแล้ว");
  };
  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const settings = normalizeSettings(payload?.settings || payload);
      setTemperature(settings.temperature); setHumidity(settings.humidity);
      setStarterOld(settings.starterOld); setFeedFlour(settings.feedFlour); setFeedWater(settings.feedWater);
      setWholeWheat(settings.wholeWheat); setTargetDough(settings.targetDough); setHydration(settings.hydration); setStarterPercent(settings.starterPercent); setLoafCount(settings.loafCount); setLoavesPerBake(Math.min(settings.loafCount,settings.loavesPerBake));
      setProofMode(settings.proofMode); setColdHours(settings.coldHours); setFridgeTemp(settings.fridgeTemp);
      setBakeMode(settings.bakeMode); setSteamWater(settings.steamWater); setOvenVolume(settings.ovenVolume);
      setTrayWidth(settings.trayWidth); setTrayLength(settings.trayLength); setSteamMinutes(settings.steamMinutes); setOvenSeal(settings.ovenSeal); setAlertSound(settings.alertSound); setTargetBakeAt(settings.targetBakeAt);
      if (payload?.yeast?.name) setYeastName(payload.yeast.name);
      if (typeof payload?.yeast?.birth === "string") setYeastBirth(payload.yeast.birth);
      localStorage.setItem("doughgarden-settings", JSON.stringify(settings));
      if (payload?.yeast) localStorage.setItem("doughgarden-yeast", JSON.stringify(payload.yeast));
      setToast("นำเข้าค่าตั้งสำเร็จแล้ว");
    } catch { setToast("ไฟล์นี้ไม่ใช่ไฟล์ค่าตั้งของ DoughGarden"); }
    event.target.value = "";
  };
  const totalHours = phases.reduce((sum, p) => sum + p.hours, 0) + Math.max(0,bakeBatches-1)*(bakeCycleHours+.2);
  const hoursUntilFirstBake = phases.slice(0, 8).reduce((sum, phase) => sum + phase.hours, 0);
  const bakePlan = useMemo(() => {
    if (!targetBakeAt) return null;
    const firstBake = new Date(targetBakeAt);
    if (Number.isNaN(firstBake.getTime())) return null;
    const start = new Date(firstBake.getTime() - hoursUntilFirstBake * 3600000);
    const allBakesDone = new Date(firstBake.getTime() + (bakeBatches * bakeCycleHours + Math.max(0, bakeBatches - 1) * .2) * 3600000);
    return { firstBake, start, allBakesDone, startsInPast: start.getTime() < Date.now() };
  }, [targetBakeAt, hoursUntilFirstBake, bakeBatches, bakeCycleHours]);
  const thaiDateTime = (date: Date) => date.toLocaleString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const targetBakeDate = targetBakeAt.split("T")[0] || "";
  const targetBakeTime = targetBakeAt.split("T")[1] || "";
  const setBakeDate = (date: string) => setTargetBakeAt(date ? `${date}T${targetBakeTime || "09:00"}` : "");
  const setBakeTime = (time: string) => {
    const localDate = new Date();
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    setTargetBakeAt(time ? `${targetBakeDate || localDate.toISOString().slice(0, 10)}T${time}` : "");
  };
  const starterHydration = ((starterOld / 2 + feedWater) / Math.max(.1, starterOld / 2 + feedFlour)) * 100;

  return <main>
    {toast && <button className="toast" onClick={() => setToast("")}>✓ {toast}</button>}
    <nav className="nav shell">
      <a className="brand" href="#top"><span>D</span><strong>DoughGarden<small>กระดุ๊กกระดิ๊ก กระจุ๊กกระจิ๊กหัวใจ</small></strong></a>
      <div className="nav-links">{[["day-tracker","เดย์แทร็กเกอร์"],["recipe","สูตร"],["proof","ไฟนอลพรูฟ"],["baking","การอบ"],["assistant","ผู้ช่วยทำขนมปัง"]].map(([id,label])=><a href={`#${id}`} className={activeNav===id?"active":""} aria-current={activeNav===id?"page":undefined} onClick={()=>setActiveNav(id)} key={id}>{label}</a>)}</div>
      <div className="nav-actions"><div className="sound-picker"><button type="button" className={`speaker-btn ${alertSound!=="none"?"on":""}`} aria-label="เลือกเสียงแจ้งเตือน" aria-expanded={soundMenuOpen} onClick={()=>setSoundMenuOpen(!soundMenuOpen)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 8.5c1.4 1.8 1.4 5.2 0 7M18.7 6c3 3.2 3 8.8 0 12"/></svg></button>{soundMenuOpen&&<div className="sound-popover" role="dialog" aria-label="เลือกเสียงแจ้งเตือน"><div className="sound-popover-head"><strong>เสียงแจ้งเตือน</strong><button type="button" onClick={()=>setSoundMenuOpen(false)}>×</button></div><p>แตะชื่อเสียงเพื่อเลือกและลองฟัง</p>{([['bell','ริงริงคลาสสิก','จังหวะเสียงเรียกเข้าชัดเจน'],['chime','ดิจิทัลคอล','จังหวะสั้น กระชับ'],['soft','ริงโทนนุ่มนวล','เบากว่า เหมาะกับช่วงกลางคืน'],['none','ปิดเสียง','ใช้เฉพาะกล่องแจ้งเตือน']] as [AlertSound,string,string][]).map(([key,label,description])=><button type="button" className={`sound-choice ${alertSound===key?"active":""}`} onClick={()=>changeAlertSound(key)} key={key}><span>{key==='none'?'×':'♪'}</span><strong>{label}<small>{description}</small></strong><b>{alertSound===key?'✓':''}</b></button>)}</div>}</div><button className={`notify-btn ${notifyStatus === "granted" ? "on" : ""}`} onClick={requestNotifications}>{notifyStatus === "granted" ? "● ทดสอบแจ้งเตือน" : "◌ เปิดแจ้งเตือน"}</button></div>
    </nav>

    <section className="hero shell" id="top">
      <div className="hero-copy"><p className="eyebrow">อะแดปทีฟเบรดแอสซิสแทนต์</p><h1>ทุกขั้นตอน<br/><em>ในจังหวะที่พอดี</em></h1><p>คำนวณเวลาตามอุณหภูมิจริง บอกวิธีทำ เกณฑ์สังเกต และแจ้งเตือนตั้งแต่เลี้ยงหัวเชื้อจนขนมปังเย็นพร้อมตัด</p><div className="hero-actions"><a href="#assistant">เริ่มผู้ช่วยทำขนมปัง</a><span>รวมประมาณ <b>{duration(totalHours)}</b></span></div></div>
      <div className="climate-card"><div className="climate-value"><span>อุณหภูมิห้อง</span><strong>{temperature}<small>°C</small></strong></div><input aria-label="อุณหภูมิห้อง" type="range" min="18" max="35" step=".5" value={temperature} onChange={e=>setTemperature(+e.target.value)}/><div className="scale"><span>18° เย็น</span><span>26° ฐาน</span><span>35° ร้อน</span></div><div className="climate-grid"><label>ความชื้น<strong>{humidity}%</strong><input aria-label="ความชื้น" type="range" min="35" max="95" value={humidity} onChange={e=>setHumidity(+e.target.value)}/></label><div><span>บัลก์อะแดปทีฟ</span><strong>{duration(adaptive.bulk)}</strong></div><div><span>รูมพรูฟ</span><strong>{duration(adaptive.roomProof)}</strong></div></div><p>เวลาจะปรับทันทีเมื่อเปลี่ยนอุณหภูมิ แต่ให้ยืนยันด้วยสภาพโดว์เสมอ</p><div className="setting-actions compact"><button onClick={saveSettings}>บันทึกค่า</button><button className="secondary" onClick={resetClimate}>รีเซ็ต</button></div></div>
    </section>

    <section className="bake-planner shell" aria-labelledby="bake-planner-title">
      <div className="bake-planner-copy"><p className="section-kicker">แพลนเวลาอบ</p><h2 id="bake-planner-title">อยากอบวันไหน<br/>ต้องเริ่มทำเมื่อไร</h2><span>ระบบคำนวณย้อนกลับตามอุณหภูมิ สูตร ไฟนอลพรูฟ และจำนวนโลฟที่เลือกไว้</span></div>
      <div className="bake-planner-inputs"><label>วันที่อยากอบ<input aria-label="วันที่อยากอบ" type="date" value={targetBakeDate} onChange={e=>setBakeDate(e.target.value)}/></label><label>เวลาเข้าอบรอบแรก<input aria-label="เวลาเข้าอบรอบแรก" type="time" value={targetBakeTime} onChange={e=>setBakeTime(e.target.value)}/></label></div>
      <div className={`bake-plan-result ${bakePlan?.startsInPast?"warning":""}`}>{bakePlan?<><div><span>อยากอบ</span><strong>{thaiDateTime(bakePlan.firstBake)}</strong></div><i>←</i><div className="start-answer"><span>ต้องเริ่มทำ</span><strong>{thaiDateTime(bakePlan.start)}</strong></div><small>คำนวณย้อนกลับ {duration(hoursUntilFirstBake)}{loafCount>1?` · ทำ ${loafCount} โลฟ · อบ ${bakeBatches} รอบ`:""}</small>{bakeBatches>1&&<small>อบครบทุกรอบประมาณ {thaiDateTime(bakePlan.allBakesDone)}</small>}{bakePlan.startsInPast&&<em>เวลาที่ต้องเริ่มผ่านไปแล้ว กรุณาเลือกเวลาอบที่ช้ากว่านี้</em>}</>:<><div className="plan-placeholder"><span>เลือกวันที่และเวลาอยากอบ</span><strong>แล้วเวลาที่ต้องเริ่มทำจะแสดงตรงนี้</strong></div></>}</div>
    </section>

    <section className="day-tracker shell" id="day-tracker">
      <div className="tracker-intro"><p className="section-kicker">มายสตาร์ตเตอร์ — เดย์แทร็กเกอร์</p><h2>{yeastName.trim() || "ตั้งชื่อยีสต์ของคุณ"}</h2><span>ติดตามวันแรกที่หัวเชื้อถือกำเนิดจนถึงวันนี้</span></div>
      <div className="tracker-fields"><label>ชื่อหัวเชื้อ <small>{yeastName.length}/60</small><input aria-label="ชื่อหัวเชื้อ" type="text" maxLength={60} value={yeastName} onChange={e=>setYeastName(e.target.value)} placeholder="เช่น น้องฟูฟ่อง"/></label><label>วันเกิดหัวเชื้อ<input aria-label="วันเกิดหัวเชื้อ" type="date" max={today || undefined} value={yeastBirth} onChange={e=>setYeastBirth(e.target.value)}/></label><button type="button" onClick={saveYeast}>{activeYeastId ? "อัปเดต" : "บันทึก"}</button><button type="button" className="secondary" onClick={resetYeast}>เพิ่มรายการใหม่</button></div>
      <div className={`age-display ${yeastAge.ready?"ready":""}`}><span>อายุปัจจุบัน</span>{yeastBirth&&yeastAge.ready?<><strong>{yeastAge.days}<small> วัน</small></strong><p>เดย์ {yeastAge.days + 1}{yeastAge.years>0?` · ${yeastAge.years} ปี ${yeastAge.months} เดือน`:""}</p></>:<><strong>—</strong><p>เลือกวันเกิดเพื่อเริ่มนับ</p></>}</div>
      <div className="saved-starters"><div className="saved-starters-head"><strong>หัวเชื้อที่บันทึกไว้</strong><span>{savedYeasts.length} รายการ · เก็บไว้ในเบราว์เซอร์เครื่องนี้</span></div>{savedYeasts.length ? <div className="saved-starters-list">{savedYeasts.map(record=>{const age=starterDaysOld(record.birth,today);return <article className={record.id===activeYeastId?"active":""} key={record.id}><button type="button" className="starter-select" onClick={()=>selectYeast(record)}><strong>{record.name}</strong><span>เกิด {new Date(`${record.birth}T00:00:00`).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"})}</span><b>อายุ {age.toLocaleString("th-TH")} วัน · เดย์ {(age+1).toLocaleString("th-TH")}</b></button><button type="button" className="starter-delete" aria-label={`ลบ ${record.name}`} onClick={()=>deleteYeast(record.id)}>ลบ</button></article>})}</div>:<p className="saved-empty">ยังไม่มีรายการ กรอกชื่อและวันเกิดแล้วกด “บันทึก”</p>}</div>
    </section>

    <section className="starter-strip shell">
      <div><p className="section-kicker">สตาร์ตเตอร์เรดดี</p><h2>เลี้ยงหัวเชื้อ</h2></div>
      <div className="mini-input"><label>หัวเชื้อเดิม</label><span><input type="number" value={starterOld} onChange={e=>setStarterOld(clamp(+e.target.value))}/> กรัม</span></div><b>＋</b>
      <div className="mini-input"><label>แป้งใหม่</label><span><input type="number" value={feedFlour} onChange={e=>setFeedFlour(clamp(+e.target.value))}/> กรัม</span></div><b>＋</b>
      <div className="mini-input"><label>น้ำ</label><span><input type="number" value={feedWater} onChange={e=>setFeedWater(clamp(+e.target.value))}/> กรัม</span></div>
      <div className="starter-result"><span>พร้อมใช้ประมาณ</span><strong>{duration(adaptive.starterPeak)}</strong><small>{round(starterOld+feedFlour+feedWater)} กรัม · ไฮเดรชัน {Math.round(starterHydration)}%</small></div>
    </section>
    <div className="shell setting-actions starter-actions"><button onClick={saveSettings}>บันทึกค่าการเลี้ยงหัวเชื้อ</button><button className="secondary" onClick={resetStarter}>รีเซ็ต</button></div>

    <section className="section shell" id="recipe"><header><p className="section-kicker">01 — เรซิพี</p><h2>ตั้งสูตรและขนาดก้อน</h2><span>สูตรทั้งหมดคำนวณรวมแป้งและน้ำในหัวเชื้อแล้ว</span></header>
      <div className="recipe-grid"><div className="control-card"><div className="control-row"><label>โฮลวีท <strong>{wholeWheat}%</strong></label><input type="range" min="0" max="80" step="5" value={wholeWheat} onChange={e=>setWholeWheat(+e.target.value)}/></div><div className="control-row"><label>ไฮเดรชัน <strong>{hydration}%</strong></label><input type="range" min="55" max="90" value={hydration} onChange={e=>setHydration(+e.target.value)}/></div><div className="control-row"><label>หัวเชื้อ <strong>{starterPercent}%</strong></label><input type="range" min="5" max="35" value={starterPercent} onChange={e=>setStarterPercent(+e.target.value)}/></div><div className="loaf-settings"><div><span>จำนวนโลฟ</span><div className="loaf-buttons">{[1,2,3,4,5,6].map(n=><button type="button" className={loafCount===n?"selected":""} onClick={()=>{setLoafCount(n);setLoavesPerBake(current=>Math.min(current,n));}} key={n}>{n}</button>)}</div></div>{loafCount>1&&<div><span>เตาอบพร้อมกัน</span><div className="loaf-buttons">{Array.from({length:loafCount},(_,i)=>i+1).map(n=><button type="button" className={loavesPerBake===n?"selected":""} onClick={()=>setLoavesPerBake(n)} key={n}>{n}</button>)}</div></div>}</div><label className="weight-input">น้ำหนักโดว์ต่อโลฟ <span><input type="number" min="300" max="1800" value={targetDough} onChange={e=>setTargetDough(clamp(+e.target.value,300))}/> กรัม</span></label><div className="presets">{[600,800,1000,1200].map(n=><button className={targetDough===n?"selected":""} onClick={()=>setTargetDough(n)} key={n}>{n} กรัม</button>)}</div><div className="multi-loaf-time"><span>เวลาหมักใช้ร่วมกัน</span><strong>เพิ่มขึ้นรูป {duration(extraShapingHours)}</strong><strong>อบ {bakeBatches} รอบ</strong></div></div>
      <div className="formula-card"><div className="formula-head"><div><span>ยัวร์ฟอร์มูลา · {loafCount} โลฟ</span><h3>{wholeWheat ? `โฮลวีท ${wholeWheat}%` : "คลาสสิกไวต์"}</h3><small>{loafCount} × {targetDough} กรัม</small></div><strong>{recipe.totalDough}<small> กรัม</small></strong></div><div className="ingredients"><p><span>แป้งขาว</span><b>{round(recipe.white)} กรัม</b></p><p><span>แป้งโฮลวีท</span><b>{round(recipe.whole)} กรัม</b></p><p><span>น้ำ</span><b>{round(recipe.water)} กรัม</b></p><p><span>หัวเชื้อ 100%</span><b>{round(recipe.levain)} กรัม</b></p><p><span>เกลือ 2%</span><b>{round(recipe.salt)} กรัม</b></p></div><div className="weight-flow"><span>รวม {recipe.totalDough} กรัม</span><i>→</i><span>หลังอบต่อโลฟ <b>{Math.round(recipe.bakedEach)} กรัม</b> · รวม <b>{Math.round(recipe.baked)} กรัม</b></span></div></div></div>
      <div className="setting-actions section-wide"><button onClick={saveSettings}>บันทึกค่าสูตร</button><button className="secondary" onClick={resetRecipe}>รีเซ็ตสูตร</button></div>
    </section>

    <section className="section shell setup-section" id="proof"><header><p className="section-kicker">02 — พรีแพร์ยัวร์โพรเซส</p><h2>ตั้งค่าไฟนอลพรูฟและวิธีอบ</h2><span>เลือกสองส่วนนี้ก่อนเริ่มเวิร์กโฟลว์ ระบบจะนำค่าไปปรับขั้นตอนและเวลาให้ทันที</span></header>
      <div className={`accordion ${proofOpen?"open":""}`}>
        <button className="accordion-head" onClick={()=>setProofOpen(!proofOpen)} aria-expanded={proofOpen}><span><b>02A</b><i>ไฟนอลพรูฟ</i><strong>{proofMode==='room'?`นอกตู้ · ${duration(adaptive.roomProof)}`:proofMode==='cold'?`ตู้เย็น · ${coldHours} ชม. ${fridgeTemp}°C`:`รูม + โคลด์ · ${coldHours} ชม.`}</strong></span><em>{proofOpen?"−":"＋"}</em></button>
        {proofOpen&&<div className="accordion-body"><div className="mode-tabs">{([['room','นอกตู้เย็น'],['cold','ในตู้เย็น'],['combo','รูม + โคลด์']] as [ProofMode,string][]).map(([key,label])=><button className={proofMode===key?"active":""} onClick={()=>setProofMode(key)} key={key}>{label}</button>)}</div>
        <div className="proof-grid"><article className={proofMode==='room'?"chosen":""}><span>รูมพรูฟ</span><h3>นอกตู้เย็น</h3><strong>{duration(adaptive.roomProof)} <small>ที่ {temperature}°C</small></strong><p>เร็ว เหมาะกับการอบภายในวันเดียว รสเปรี้ยวน้อยกว่า แต่ต้องจับจังหวะให้แม่น</p><ul><li>คลุมถุงกันผิวแห้ง</li><li>เริ่มฟิงเกอร์โพกเทสต์ก่อนครบ 20 นาที</li><li>เด้งกลับช้าและเหลือรอยตื้น = พร้อม</li></ul></article>
        <article className={proofMode==='cold'?"chosen":""}><span>โคลด์รีทาร์ด</span><h3>ในตู้เย็น</h3><strong>{coldHours} ชม. <small>ที่ {fridgeTemp}°C</small></strong><p>ตัดลายง่าย กลิ่นรสซับซ้อน และอบจากตู้เย็นได้ทันที</p><div className="dual-setting"><label>เวลา<input type="number" min="6" max="24" value={coldHours} onChange={e=>setColdHours(clamp(+e.target.value,6))}/>ชม.</label><label>ตู้เย็น<input type="number" min="2" max="8" value={fridgeTemp} onChange={e=>setFridgeTemp(clamp(+e.target.value,2))}/>°C</label></div><ul><li>แนะนำ 8–16 ชม. ที่ 3–5°C</li><li>ถ้าตู้เย็นอุ่นกว่า 6°C ให้ลดเวลา</li></ul></article>
        <article className={proofMode==='combo'?"chosen":""}><span>ไฮบริด</span><h3>รูม + โคลด์</h3><strong>{duration(.75*adaptive.tempFactor)} + {coldHours} ชม.</strong><p>เริ่มกระตุ้นนอกตู้แล้วชะลอในตู้เย็น เหมาะเมื่อโดว์ยังตึงหลังขึ้นรูป</p><ul><li>พักนอกตู้จนโดว์เริ่มผ่อนคลาย</li><li>เข้าตู้ก่อนขึ้นมากเกินไป</li><li>อบเย็นตรงจากตู้เย็น</li></ul></article></div></div>}
      </div>

      <div className={`accordion ${bakeOpen?"open":""}`} id="baking">
        <button className="accordion-head" onClick={()=>setBakeOpen(!bakeOpen)} aria-expanded={bakeOpen}><span><b>02B</b><i>เบกกิงเมธอด</i><strong>{bakeMode==='dutch'?"ดัตช์โอเวน · ไม่เติมน้ำ":`โอเพนเบก · น้ำ ${steamWater} มล.`}</strong></span><em>{bakeOpen?"−":"＋"}</em></button>
        {bakeOpen&&<div className="accordion-body"><div className="mode-tabs bake-tabs"><button className={bakeMode==='dutch'?"active":""} onClick={()=>setBakeMode('dutch')}>ดัตช์โอเวน</button><button className={bakeMode==='open'?"active":""} onClick={()=>setBakeMode('open')}>อบแบบเปิด + ไอน้ำ</button></div>
        {bakeMode==='dutch'?<div className="bake-guide"><article className="method-hero"><span>ดัตช์โอเวน</span><h3>กักไอน้ำจากตัวโดว์<br/>ไม่ต้องเติมน้ำ</h3><p>เหมาะสำหรับเตาอบบ้าน ควบคุมไอน้ำง่ายและช่วยให้โอเวนสปริงหรือการพองตัวในเตาดี</p><div className="heat-pill">250°C · พรีฮีต 45 นาที</div></article><div className="bake-steps"><div><b>01</b><span><strong>อุ่นหม้อพร้อมฝา</strong>250°C อย่างน้อย 45 นาที</span></div><div><b>02</b><span><strong>อบปิดฝา</strong>240–250°C · 20 นาที</span></div><div><b>03</b><span><strong>เปิดฝา ลดไฟ</strong>220–230°C · 20–25 นาที</span></div><div><b>04</b><span><strong>ทำเปลือกให้กรอบ</strong>แง้มประตูเตา 3–5 นาทีท้าย</span></div></div></div>
        :<><div className="steam-calculator"><div className="steam-inputs"><h3>คำนวณปริมาณน้ำสำหรับถาดไอน้ำ</h3><p>กรอกค่าจริงของเตาและถาด ระบบจะให้ช่วงเริ่มต้นที่ปลอดภัยสำหรับทดลอง</p><div className="calc-fields"><label>ความจุเตา<span><input type="number" min="20" max="120" value={ovenVolume} onChange={e=>setOvenVolume(clamp(+e.target.value,20))}/> ลิตร</span></label><label>ถาดกว้าง<span><input type="number" min="10" max="60" value={trayWidth} onChange={e=>setTrayWidth(clamp(+e.target.value,10))}/> ซม.</span></label><label>ถาดยาว<span><input type="number" min="10" max="60" value={trayLength} onChange={e=>setTrayLength(clamp(+e.target.value,10))}/> ซม.</span></label><label>เวลาต้องการไอน้ำ<span><input type="number" min="10" max="25" value={steamMinutes} onChange={e=>setSteamMinutes(clamp(+e.target.value,10))}/> นาที</span></label></div><div className="seal-select"><span>การเก็บไอน้ำของเตา</span>{([['tight','แน่น'],['normal','ปกติ'],['leaky','รั่วง่าย']] as const).map(([key,label])=><button key={key} className={ovenSeal===key?"active":""} onClick={()=>setOvenSeal(key)}>{label}</button>)}</div></div>
        <div className="steam-result"><span>ปริมาณแนะนำ</span><strong>{steamCalculation.recommended}<small> มล.</small></strong><p>ช่วงทดลอง {steamCalculation.low}–{steamCalculation.high} มล.</p><button onClick={()=>setSteamWater(steamCalculation.recommended)}>ใช้ค่าที่แนะนำ</button><small>ระดับน้ำในถาดประมาณ {steamCalculation.depth} มม.</small></div></div>
        <div className="formula-explain"><h3>วิธีคำนวณ</h3><code>น้ำ = (ความจุเตา × 2.2 + นาทีไอน้ำ × 3) × ตัวคูณการรั่ว × ตัวคูณพื้นที่ถาด</code><div className="formula-values"><p><b>ฐานเตา</b>{ovenVolume} × 2.2 = {round(ovenVolume*2.2)} มล.</p><p><b>ฐานเวลา</b>{steamMinutes} × 3 = {steamMinutes*3} มล.</p><p><b>ตัวคูณการรั่ว</b>{steamCalculation.sealFactor}×</p><p><b>พื้นที่ถาด</b>{steamCalculation.area} ซม² → {round(steamCalculation.areaFactor)}×</p></div><ul><li>สูตรนี้เป็นค่าเริ่มต้นเชิงปฏิบัติ ไม่ใช่ปริมาณน้ำเพื่อทำให้เตาอิ่มตัวทางฟิสิกส์ เพราะเตาบ้านระบายอากาศและควบแน่นต่างกัน</li><li>เริ่มจากค่ากลาง ถ้าเปลือกเซ็ตเร็วหรือรอยกรีดไม่เปิด เพิ่มครั้งละ 25 มล.; ถ้ามีน้ำเหลือหลัง 20 นาที ลดครั้งละ 25 มล.</li><li>ถาดพื้นที่มากระเหยเร็วกว่า สูตรจึงเพิ่มน้ำเล็กน้อย แต่ระดับน้ำต้องไม่สูงจนกระเด็นเมื่อเดือด</li></ul></div>
        <div className="bake-guide open-guide"><article className="method-hero"><span>โอเพนเบก</span><h3>ใช้จริง {steamWater} มล.</h3><p>อุ่นเบกกิงสโตนหรือเบกกิงสตีลชั้นกลางและถาดโลหะหนาชั้นล่าง 250°C นาน 45–60 นาที</p><label className="water-setting">ปรับด้วยตนเอง <input type="range" min="100" max="350" step="25" value={steamWater} onChange={e=>setSteamWater(+e.target.value)}/><strong>{steamWater} มล.</strong></label></article><div className="bake-steps"><div><b>01</b><span><strong>เตรียมน้ำเดือด</strong>ตวง {steamWater} มล. ก่อนนำโดว์เข้าเตา</span></div><div><b>02</b><span><strong>เทจากด้านข้าง</strong>ลงถาดโลหะร้อน แล้วปิดประตูทันที</span></div><div><b>03</b><span><strong>อบพร้อมไอน้ำ</strong>240–250°C · {steamMinutes} นาที</span></div><div><b>04</b><span><strong>นำถาดออก ลดไฟ</strong>220–230°C · 20–25 นาที</span></div></div></div></>}
        <div className="safety"><span>!</span><p><strong>ความปลอดภัยเรื่องไอน้ำ</strong>ใช้น้ำเดือดกับถาดโลหะเท่านั้น ห้ามใช้ภาชนะแก้ว ห้ามราดน้ำโดนกระจกเตา และหลบหน้า/มือจากไอน้ำเมื่อเปิดประตู</p></div></div>}
      </div>
      <div className="setting-actions section-wide"><button onClick={saveSettings}>บันทึกค่าไฟนอลพรูฟและการอบ</button><button className="secondary" onClick={resetProofBake}>รีเซ็ตส่วนนี้</button></div>
    </section>

    <section className="section shell" id="assistant"><header><p className="section-kicker">03 — ไกด์เด็ดเวิร์กโฟลว์</p><h2>ผู้ช่วยทำขนมปังทีละขั้น</h2><span>เวิร์กโฟลว์ใช้ไฟนอลพรูฟและวิธีอบที่เลือกไว้ด้านบนโดยอัตโนมัติ</span></header>
      <div className="workflow"><div className="phase-nav">{phases.map((phase,index)=><button key={phase.title} className={`${index===activePhase?"active":""} ${index<activePhase?"done":""}`} onClick={()=>selectPhase(index)}><span>{index<activePhase?"✓":phase.icon}</span><div><strong>{phase.title}</strong><small>{phase.subtitle}</small></div><b>{duration(phase.hours)}</b></button>)}</div>
      <article className="guide-card"><div className="guide-top"><div><p>ขั้นตอน {activePhase+1} จาก {phases.length}</p><h3>{phases[activePhase].title}</h3><span>{phases[activePhase].subtitle}</span></div><div className="phase-temp">{phases[activePhase].temp}</div></div>
        <div className="timer"><span>{running && phaseEnd ? activePhase===2&&phaseStart ? countdown(Math.min(phaseEnd,phaseStart+(Math.floor(Math.max(0,now-phaseStart)/1800000)+1)*1800000)-now) : countdown(phaseEnd-now) : activePhase===2 ? "30 นาที" : duration(phases[activePhase].hours)}</span><small>{running ? activePhase===2&&phaseStart ? `รอบที่ ${Math.min(3,Math.floor(Math.max(0,now-phaseStart)/1800000)+1)} จาก 3` : `สิ้นสุดประมาณ ${clock(new Date(phaseEnd!))}` : activePhase===2 ? "นับถอยหลังแยกรอบละ 30 นาที" : "เวลาที่แนะนำ"}</small></div>
        {activePhase===2&&<div className="milestone-schedule"><p>ตัวนับถอยหลังการพับโดว์ 3 รอบ</p><div>{STRENGTH_MILESTONES.map((milestone,index)=>{const target=phaseStart?phaseStart+milestone.minutes*60000:0;const previousTarget=phaseStart?phaseStart+index*30*60000:0;const reached=Boolean(phaseStart&&now>=target);const current=Boolean(running&&phaseStart&&now>=previousTarget&&now<target);return <span className={`${reached?"reached":""} ${current?"current":""}`} key={milestone.minutes}><b>{reached?"✓":index+1}</b><strong>{reached?"ครบแล้ว":current?countdown(target-now):running?"รอรอบก่อน":"30:00"}</strong><small>{milestone.title}</small></span>})}</div></div>}
        <div className="instruction"><h4>วิธีทำในขั้นตอนนี้</h4><ol>{phases[activePhase].guide.map((g,i)=><li key={g}><span>{i+1}</span>{g}</li>)}</ol></div>
        <div className="cue"><span>◎</span><p><strong>เกณฑ์พร้อมไปขั้นต่อไป</strong>{phases[activePhase].cue}</p></div>
        <div className="guide-actions"><button className="start" onClick={startPhase}>{running?"เริ่มนับใหม่":"▶ เริ่มจับเวลา"}</button><button className="next" onClick={completePhase} disabled={activePhase===phases.length-1}>ทำเสร็จแล้ว · ขั้นต่อไป →</button></div>
      </article></div>
    </section>
    <section className="data-transfer shell" id="data-transfer"><div><p className="section-kicker">แบ็กอัปค่าตั้ง</p><h2>ส่งออกและนำเข้าค่า</h2><p>เก็บสูตร อุณหภูมิ วิธีพรูฟ วิธีอบ และข้อมูลหัวเชื้อเป็นไฟล์เดียว เพื่อนำไปใช้ต่อบนเครื่องอื่น</p></div><div className="transfer-actions"><button onClick={exportSettings}>↓ ส่งออกค่า</button><button className="secondary" onClick={()=>importRef.current?.click()}>↑ นำเข้าค่า</button><input ref={importRef} type="file" accept="application/json,.json" onChange={importSettings}/></div></section>
    <footer><div className="shell"><span>DoughGarden<small>กระดุ๊กกระดิ๊ก กระจุ๊กกระจิ๊กหัวใจ</small></span><p>อะแดปทีฟไทม์เป็นค่าประมาณ—อุณหภูมิโดว์ ความแข็งแรงของหัวเชื้อ และชนิดแป้งทำให้เวลาเปลี่ยนได้ ให้สภาพโดว์เป็นคำตอบสุดท้าย</p><a href="#top">กลับด้านบน ↑</a></div></footer>
  </main>;
}
