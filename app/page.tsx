"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProofMode = "room" | "cold" | "combo";
type BakeMode = "dutch" | "open";
type Phase = { icon: string; title: string; subtitle: string; hours: number; temp: string; guide: string[]; cue: string };
type SavedYeast = { id: string; name: string; birth: string; savedAt: string };

const DEFAULT_SETTINGS = {
  temperature: 28, humidity: 70, starterOld: 20, feedFlour: 40, feedWater: 40,
  wholeWheat: 30, targetDough: 800, hydration: 72, starterPercent: 20,
  proofMode: "cold" as ProofMode, coldHours: 12, fridgeTemp: 4,
  bakeMode: "dutch" as BakeMode, steamWater: 200, ovenVolume: 60,
  trayWidth: 30, trayLength: 20, steamMinutes: 20,
  ovenSeal: "normal" as "tight" | "normal" | "leaky",
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
  const [activePhase, setActivePhase] = useState(0);
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
  const didAlert = useRef(false);
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
    const totalFlour = targetDough / (1 + hydration / 100 + .02);
    const levain = totalFlour * starterPercent / 100;
    const levainFlour = levain / 2;
    const levainWater = levain / 2;
    const whole = totalFlour * wholeWheat / 100;
    const white = Math.max(0, totalFlour - whole - levainFlour);
    const water = Math.max(0, totalFlour * hydration / 100 - levainWater);
    const salt = totalFlour * .02;
    return { totalFlour, levain, whole, white, water, salt, baked: targetDough * .997 * .86 };
  }, [targetDough, hydration, starterPercent, wholeWheat]);

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
    { icon:"05", title:"พรีเชปและเบนช์เรสต์", subtitle:"ขึ้นรูปเบื้องต้น", hours:.33, temp:"อุณหภูมิห้อง", cue:"ก้อนคลายตัวเล็กน้อยแต่ยังรักษาทรง ไม่แผ่แบน", guide:["เทโดว์ลงโต๊ะโดยรักษาแก๊ส ใช้ที่ตัดรวบให้เป็นก้อนกลม", "พักโดยไม่คลุม 15–20 นาที ให้ผิวตึงเล็กน้อย", "ถ้าโดว์แผ่มาก ให้รวบซ้ำเบา ๆ และพักอีก 10 นาที"] },
    { icon:"06", title:"ไฟนอลเชป", subtitle:"ขึ้นรูปและลงตะกร้า", hours:.25, temp:"อุณหภูมิห้อง", cue:"ผิวด้านนอกตึง รอยต่อปิดสนิท โดยไม่ฉีกผิวโดว์", guide:["โรยแป้งบาง ๆ พลิกด้านเรียบลง แล้วพับสร้างแรงตึง", "ม้วนให้แน่นพอดี ไม่บีบไล่แก๊สทั้งหมด", "วางด้านรอยต่อขึ้นในตะกร้าที่โรยแป้งข้าวเจ้า"] },
    { icon:"07", title:"ไฟนอลพรูฟ", subtitle:proofMode === "room" ? "นอกตู้เย็น" : proofMode === "cold" ? "ในตู้เย็น" : "ผสมรูม + โคลด์", hours:finalProofHours, temp:proofMode === "room" ? `${temperature}°C` : `${fridgeTemp}°C`, cue:proofMode === "room" ? "กดนิ้วแล้วรอยบุ๋มเด้งกลับช้า ๆ และเหลือรอยตื้น" : "โดว์เย็นและแน่นขึ้น ปริมาตรเพิ่มเล็กน้อย ตัดลายได้คม", guide:proofMode === "room" ? [`พักประมาณ ${duration(adaptive.roomProof)} ที่ ${temperature}°C`, "คลุมถุงเพื่อกันผิวแห้ง เริ่มทดสอบกดนิ้วก่อนครบเวลา 20 นาที", "เด้งกลับเร็ว = ยังอ่อน / ไม่เด้งเลย = เกิน / เด้งช้า = พร้อมอบ"] : proofMode === "cold" ? [`ปิดถุงให้สนิท แช่ ${fridgeTemp}°C ประมาณ ${coldHours} ชั่วโมง`, "นำออกจากตู้เย็นแล้วกรีดและอบได้ทันที ไม่ต้องคืนอุณหภูมิ", "ตู้เย็นเกิน 6°C โดว์จะหมักเร็วขึ้น ควรลดเวลาโคลด์พรูฟ"] : [`พักนอกตู้ประมาณ ${duration(.75 * adaptive.tempFactor)} ก่อนเข้าตู้เย็น`, `แช่ ${fridgeTemp}°C ต่ออีก ${coldHours} ชั่วโมง`, "เหมาะเมื่อบัลก์จบค่อนข้างเร็วและต้องการเพิ่มกลิ่นรส"] },
    { icon:"08", title:"พรีฮีตและสกอร์", subtitle:"อุ่นเตาและกรีด", hours:.75, temp:"250°C", cue:"เตาและภาชนะสะสมความร้อนเต็มที่ ใบมีดกรีดลึก 0.5–1 ซม.", guide:bakeMode === "dutch" ? ["วางดัตช์โอเวนพร้อมฝาในเตา อุ่นที่ 250°C อย่างน้อย 45 นาที", "คว่ำโดว์เย็นลงกระดาษรอง ปัดแป้งส่วนเกินและกรีดมุม 30–45°", "ระวังภาชนะร้อนจัด ใช้ถุงมือกันความร้อนทั้งสองมือ"] : ["วางเบกกิงสตีลหรือเบกกิงสโตนชั้นกลาง และถาดโลหะหนาชั้นล่าง", "อุ่นเตา 250°C อย่างน้อย 45–60 นาที", "ต้มน้ำให้เดือดเตรียมไว้ ห้ามใช้ภาชนะแก้วสำหรับสร้างไอน้ำ"] },
    { icon:"09", title:"สตีมเบก", subtitle:bakeMode === "dutch" ? "อบปิดฝา" : "อบเปิดพร้อมไอน้ำ", hours:bakeMode === "dutch" ? .33 : steamMinutes / 60, temp:"240–250°C", cue:"ก้อนขยายเต็มที่ รอยกรีดเปิดและเริ่มเกิดหูขนมปัง", guide:bakeMode === "dutch" ? ["ยกโดว์ลงดัตช์โอเวนร้อน ปิดฝาทันที", "อบ 20 นาทีที่ 240–250°C", "ไม่จำเป็นต้องใส่น้ำ เพราะความชื้นจากโดว์ถูกกักไว้ในหม้อ"] : [`เทน้ำเดือด ${steamWater} มล. ลงถาดโลหะร้อน แล้วปิดเตาทันที`, `อบ ${steamMinutes} นาทีที่ 240–250°C หลีกเลี่ยงการเปิดประตูเตา`, "เทน้ำจากด้านข้างอย่างระวังไอน้ำลวก และอย่าราดโดนกระจกเตา"] },
    { icon:"10", title:"ดรายเบก", subtitle:"ไล่ความชื้นและทำสี", hours:.38, temp:"220–230°C", cue:"เปลือกน้ำตาลเข้มทั่ว เคาะก้นมีเสียงโปร่ง อุณหภูมิแกน 96–98°C", guide:bakeMode === "dutch" ? ["เปิดฝา ลดไฟเหลือ 220–230°C แล้วอบต่อ 20–25 นาที", "ถ้าสีเร็วให้ลดเหลือ 210°C แต่ไม่ควรรีบนำออก", "แง้มประตูเตา 3–5 นาทีท้ายเพื่อเปลือกกรอบ"] : ["นำถาดน้ำออกหรือระบายไอน้ำ ลดไฟเหลือ 220–230°C", "อบต่อ 20–25 นาที หมุนก้อนถ้าสีไม่สม่ำเสมอ", "แง้มประตูเตา 3–5 นาทีท้ายเพื่อเปลือกกรอบ"] },
    { icon:"11", title:"คูลดาวน์", subtitle:"พักให้เนื้อเซ็ตตัว", hours:2, temp:"อุณหภูมิห้อง", cue:"ก้อนเย็นเกือบสนิท เปลือกแห้ง และไอน้ำภายในกระจายตัวแล้ว", guide:["ย้ายขึ้นตะแกรงทันที ให้อากาศผ่านรอบก้อน", "รออย่างน้อย 2 ชั่วโมงก่อนตัด; ก้อนใหญ่รอ 3 ชั่วโมง", "การตัดเร็วทำให้เนื้อเหนียวและดูเหมือนอบไม่สุก"] },
  ], [temperature, adaptive.bulk, adaptive.roomProof, adaptive.tempFactor, proofMode, finalProofHours, fridgeTemp, coldHours, bakeMode, steamWater, steamMinutes]);

  useEffect(() => {
    if (!running || !phaseEnd) return;
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= phaseEnd && !didAlert.current) {
        didAlert.current = true;
        setRunning(false);
        setToast(`ครบเวลา ${phases[activePhase].title} — ตรวจสภาพโดว์ก่อน`);
        if (notifyStatus === "granted" && "Notification" in window) {
          new Notification("DoughGarden — ถึงเวลาตรวจโดว์", { body: `${phases[activePhase].title}: ${phases[activePhase].cue}` });
        }
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phaseEnd, phases, activePhase, notifyStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localToday = new Date();
      localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
      setToday(localToday.toISOString().slice(0, 10));
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
        setWholeWheat(settings.wholeWheat); setTargetDough(settings.targetDough); setHydration(settings.hydration); setStarterPercent(settings.starterPercent);
        setProofMode(settings.proofMode); setColdHours(settings.coldHours); setFridgeTemp(settings.fridgeTemp);
        setBakeMode(settings.bakeMode); setSteamWater(settings.steamWater); setOvenVolume(settings.ovenVolume);
        setTrayWidth(settings.trayWidth); setTrayLength(settings.trayLength); setSteamMinutes(settings.steamMinutes); setOvenSeal(settings.ovenSeal);
      } catch {
        // The tracker remains usable if local storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) { setToast("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน"); return; }
    const result = await Notification.requestPermission();
    setNotifyStatus(result);
    setToast(result === "granted" ? "เปิดการแจ้งเตือนแล้ว" : "ยังไม่ได้อนุญาตการแจ้งเตือน");
  };
  const startPhase = () => {
    didAlert.current = false;
    const end = Date.now() + phases[activePhase].hours * 3600000;
    setNow(Date.now()); setPhaseEnd(end); setRunning(true); setToast(`เริ่ม ${phases[activePhase].title} แล้ว`);
  };
  const completePhase = () => {
    const next = Math.min(phases.length - 1, activePhase + 1);
    setActivePhase(next); setRunning(false); setPhaseEnd(null); didAlert.current = false;
    document.getElementById("assistant")?.scrollIntoView({ behavior:"smooth" });
  };
  const selectPhase = (index: number) => { setActivePhase(index); setRunning(false); setPhaseEnd(null); didAlert.current = false; };
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
  const currentSettings = (): SavedSettings => ({ temperature, humidity, starterOld, feedFlour, feedWater, wholeWheat, targetDough, hydration, starterPercent, proofMode, coldHours, fridgeTemp, bakeMode, steamWater, ovenVolume, trayWidth, trayLength, steamMinutes, ovenSeal });
  const saveSettings = () => {
    localStorage.setItem("doughgarden-settings", JSON.stringify(currentSettings()));
    setToast("บันทึกค่าที่ปรับไว้ในเครื่องนี้แล้ว");
  };
  const resetClimate = () => { setTemperature(DEFAULT_SETTINGS.temperature); setHumidity(DEFAULT_SETTINGS.humidity); localStorage.setItem("doughgarden-settings", JSON.stringify({ ...currentSettings(), temperature: DEFAULT_SETTINGS.temperature, humidity: DEFAULT_SETTINGS.humidity })); setToast("รีเซ็ตอุณหภูมิและความชื้นแล้ว"); };
  const resetStarter = () => { setStarterOld(DEFAULT_SETTINGS.starterOld); setFeedFlour(DEFAULT_SETTINGS.feedFlour); setFeedWater(DEFAULT_SETTINGS.feedWater); localStorage.setItem("doughgarden-settings", JSON.stringify({ ...currentSettings(), starterOld: DEFAULT_SETTINGS.starterOld, feedFlour: DEFAULT_SETTINGS.feedFlour, feedWater: DEFAULT_SETTINGS.feedWater })); setToast("รีเซ็ตค่าหัวเชื้อแล้ว"); };
  const resetRecipe = () => { setWholeWheat(DEFAULT_SETTINGS.wholeWheat); setTargetDough(DEFAULT_SETTINGS.targetDough); setHydration(DEFAULT_SETTINGS.hydration); setStarterPercent(DEFAULT_SETTINGS.starterPercent); localStorage.setItem("doughgarden-settings", JSON.stringify({ ...currentSettings(), wholeWheat: DEFAULT_SETTINGS.wholeWheat, targetDough: DEFAULT_SETTINGS.targetDough, hydration: DEFAULT_SETTINGS.hydration, starterPercent: DEFAULT_SETTINGS.starterPercent })); setToast("รีเซ็ตสูตรแล้ว"); };
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
      setWholeWheat(settings.wholeWheat); setTargetDough(settings.targetDough); setHydration(settings.hydration); setStarterPercent(settings.starterPercent);
      setProofMode(settings.proofMode); setColdHours(settings.coldHours); setFridgeTemp(settings.fridgeTemp);
      setBakeMode(settings.bakeMode); setSteamWater(settings.steamWater); setOvenVolume(settings.ovenVolume);
      setTrayWidth(settings.trayWidth); setTrayLength(settings.trayLength); setSteamMinutes(settings.steamMinutes); setOvenSeal(settings.ovenSeal);
      if (payload?.yeast?.name) setYeastName(payload.yeast.name);
      if (typeof payload?.yeast?.birth === "string") setYeastBirth(payload.yeast.birth);
      localStorage.setItem("doughgarden-settings", JSON.stringify(settings));
      if (payload?.yeast) localStorage.setItem("doughgarden-yeast", JSON.stringify(payload.yeast));
      setToast("นำเข้าค่าตั้งสำเร็จแล้ว");
    } catch { setToast("ไฟล์นี้ไม่ใช่ไฟล์ค่าตั้งของ DoughGarden"); }
    event.target.value = "";
  };
  const totalHours = phases.reduce((sum, p) => sum + p.hours, 0);
  const starterHydration = ((starterOld / 2 + feedWater) / Math.max(.1, starterOld / 2 + feedFlour)) * 100;

  return <main>
    {toast && <button className="toast" onClick={() => setToast("")}>✓ {toast}</button>}
    <nav className="nav shell">
      <a className="brand" href="#top"><span>D</span><strong>DoughGarden<small>กระดุ๊กกระดิ๊ก กระจุ๊กกระจิ๊กหัวใจ</small></strong></a>
      <div className="nav-links"><a href="#day-tracker">เดย์แทร็กเกอร์</a><a href="#recipe">สูตร</a><a href="#proof">ไฟนอลพรูฟ</a><a href="#baking">การอบ</a><a href="#assistant">ผู้ช่วยทำขนมปัง</a></div>
      <button className={`notify-btn ${notifyStatus === "granted" ? "on" : ""}`} onClick={requestNotifications}>{notifyStatus === "granted" ? "● แจ้งเตือนเปิดอยู่" : "◌ เปิดแจ้งเตือน"}</button>
    </nav>

    <section className="hero shell" id="top">
      <div className="hero-copy"><p className="eyebrow">อะแดปทีฟเบรดแอสซิสแทนต์</p><h1>ทุกขั้นตอน<br/><em>ในจังหวะที่พอดี</em></h1><p>คำนวณเวลาตามอุณหภูมิจริง บอกวิธีทำ เกณฑ์สังเกต และแจ้งเตือนตั้งแต่เลี้ยงหัวเชื้อจนขนมปังเย็นพร้อมตัด</p><div className="hero-actions"><a href="#assistant">เริ่มผู้ช่วยทำขนมปัง</a><span>รวมประมาณ <b>{duration(totalHours)}</b></span></div></div>
      <div className="climate-card"><div className="climate-value"><span>อุณหภูมิห้อง</span><strong>{temperature}<small>°C</small></strong></div><input aria-label="อุณหภูมิห้อง" type="range" min="18" max="35" step=".5" value={temperature} onChange={e=>setTemperature(+e.target.value)}/><div className="scale"><span>18° เย็น</span><span>26° ฐาน</span><span>35° ร้อน</span></div><div className="climate-grid"><label>ความชื้น<strong>{humidity}%</strong><input aria-label="ความชื้น" type="range" min="35" max="95" value={humidity} onChange={e=>setHumidity(+e.target.value)}/></label><div><span>บัลก์อะแดปทีฟ</span><strong>{duration(adaptive.bulk)}</strong></div><div><span>รูมพรูฟ</span><strong>{duration(adaptive.roomProof)}</strong></div></div><p>เวลาจะปรับทันทีเมื่อเปลี่ยนอุณหภูมิ แต่ให้ยืนยันด้วยสภาพโดว์เสมอ</p><div className="setting-actions compact"><button onClick={saveSettings}>บันทึกค่า</button><button className="secondary" onClick={resetClimate}>รีเซ็ต</button></div></div>
    </section>

    <section className="day-tracker shell" id="day-tracker">
      <div className="tracker-intro"><p className="section-kicker">มายสตาร์ตเตอร์ — เดย์แทร็กเกอร์</p><h2>{yeastName.trim() || "ตั้งชื่อยีสต์ของคุณ"}</h2><span>ติดตามวันแรกที่หัวเชื้อถือกำเนิดจนถึงวันนี้</span></div>
      <div className="tracker-fields"><label>ชื่อหัวเชื้อ<input aria-label="ชื่อหัวเชื้อ" type="text" maxLength={30} value={yeastName} onChange={e=>setYeastName(e.target.value)} placeholder="เช่น น้องฟูฟ่อง"/></label><label>วันเกิดหัวเชื้อ<input aria-label="วันเกิดหัวเชื้อ" type="date" max={today || undefined} value={yeastBirth} onChange={e=>setYeastBirth(e.target.value)}/></label><button type="button" onClick={saveYeast}>{activeYeastId ? "อัปเดต" : "บันทึก"}</button><button type="button" className="secondary" onClick={resetYeast}>เพิ่มรายการใหม่</button></div>
      <div className={`age-display ${yeastAge.ready?"ready":""}`}><span>อายุปัจจุบัน</span>{yeastBirth&&yeastAge.ready?<><strong>{yeastAge.days}<small> วัน</small></strong><p>เดย์ {yeastAge.days + 1}{yeastAge.years>0?` · ${yeastAge.years} ปี ${yeastAge.months} เดือน`:""}</p></>:<><strong>—</strong><p>เลือกวันเกิดเพื่อเริ่มนับ</p></>}</div>
      <div className="saved-starters"><div className="saved-starters-head"><strong>หัวเชื้อที่บันทึกไว้</strong><span>{savedYeasts.length} รายการ · เก็บไว้ในเบราว์เซอร์เครื่องนี้</span></div>{savedYeasts.length ? <div className="saved-starters-list">{savedYeasts.map(record=><article className={record.id===activeYeastId?"active":""} key={record.id}><button type="button" className="starter-select" onClick={()=>selectYeast(record)}><strong>{record.name}</strong><span>เกิด {new Date(`${record.birth}T00:00:00`).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"})}</span></button><button type="button" className="starter-delete" aria-label={`ลบ ${record.name}`} onClick={()=>deleteYeast(record.id)}>ลบ</button></article>)}</div>:<p className="saved-empty">ยังไม่มีรายการ กรอกชื่อและวันเกิดแล้วกด “บันทึก”</p>}</div>
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
      <div className="recipe-grid"><div className="control-card"><div className="control-row"><label>โฮลวีท <strong>{wholeWheat}%</strong></label><input type="range" min="0" max="80" step="5" value={wholeWheat} onChange={e=>setWholeWheat(+e.target.value)}/></div><div className="control-row"><label>ไฮเดรชัน <strong>{hydration}%</strong></label><input type="range" min="55" max="90" value={hydration} onChange={e=>setHydration(+e.target.value)}/></div><div className="control-row"><label>หัวเชื้อ <strong>{starterPercent}%</strong></label><input type="range" min="5" max="35" value={starterPercent} onChange={e=>setStarterPercent(+e.target.value)}/></div><label className="weight-input">น้ำหนักโดว์เป้าหมาย <span><input type="number" min="300" max="1800" value={targetDough} onChange={e=>setTargetDough(clamp(+e.target.value,300))}/> กรัม</span></label><div className="presets">{[600,800,1000,1200].map(n=><button className={targetDough===n?"selected":""} onClick={()=>setTargetDough(n)} key={n}>{n} กรัม</button>)}</div></div>
      <div className="formula-card"><div className="formula-head"><div><span>ยัวร์ฟอร์มูลา</span><h3>{wholeWheat ? `โฮลวีท ${wholeWheat}%` : "คลาสสิกไวต์"}</h3></div><strong>{targetDough}<small> กรัม</small></strong></div><div className="ingredients"><p><span>แป้งขาว</span><b>{round(recipe.white)} กรัม</b></p><p><span>แป้งโฮลวีท</span><b>{round(recipe.whole)} กรัม</b></p><p><span>น้ำ</span><b>{round(recipe.water)} กรัม</b></p><p><span>หัวเชื้อ 100%</span><b>{round(recipe.levain)} กรัม</b></p><p><span>เกลือ 2%</span><b>{round(recipe.salt)} กรัม</b></p></div><div className="weight-flow"><span>โดว์ {targetDough} กรัม</span><i>→</i><span>หลังอบประมาณ <b>{Math.round(recipe.baked)} กรัม</b></span></div></div></div>
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
        <div className="timer"><span>{running && phaseEnd ? countdown(phaseEnd-now) : duration(phases[activePhase].hours)}</span><small>{running ? `สิ้นสุดประมาณ ${clock(new Date(phaseEnd!))}` : "เวลาที่แนะนำ"}</small></div>
        <div className="instruction"><h4>วิธีทำในขั้นตอนนี้</h4><ol>{phases[activePhase].guide.map((g,i)=><li key={g}><span>{i+1}</span>{g}</li>)}</ol></div>
        <div className="cue"><span>◎</span><p><strong>เกณฑ์พร้อมไปขั้นต่อไป</strong>{phases[activePhase].cue}</p></div>
        <div className="guide-actions"><button className="start" onClick={startPhase}>{running?"เริ่มนับใหม่":"▶ เริ่มจับเวลา"}</button><button className="next" onClick={completePhase} disabled={activePhase===phases.length-1}>ทำเสร็จแล้ว · ขั้นต่อไป →</button></div>
      </article></div>
    </section>
    <section className="data-transfer shell" id="data-transfer"><div><p className="section-kicker">แบ็กอัปค่าตั้ง</p><h2>ส่งออกและนำเข้าค่า</h2><p>เก็บสูตร อุณหภูมิ วิธีพรูฟ วิธีอบ และข้อมูลหัวเชื้อเป็นไฟล์เดียว เพื่อนำไปใช้ต่อบนเครื่องอื่น</p></div><div className="transfer-actions"><button onClick={exportSettings}>↓ ส่งออกค่า</button><button className="secondary" onClick={()=>importRef.current?.click()}>↑ นำเข้าค่า</button><input ref={importRef} type="file" accept="application/json,.json" onChange={importSettings}/></div></section>
    <footer><div className="shell"><span>DoughGarden<small>กระดุ๊กกระดิ๊ก กระจุ๊กกระจิ๊กหัวใจ</small></span><p>อะแดปทีฟไทม์เป็นค่าประมาณ—อุณหภูมิโดว์ ความแข็งแรงของหัวเชื้อ และชนิดแป้งทำให้เวลาเปลี่ยนได้ ให้สภาพโดว์เป็นคำตอบสุดท้าย</p><a href="#top">กลับด้านบน ↑</a></div></footer>
  </main>;
}
