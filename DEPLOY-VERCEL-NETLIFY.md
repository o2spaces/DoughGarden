# Deploy DoughGarden

แพ็กเกจนี้ปรับเป็น Standard Next.js แล้ว โดยใช้ `next build --webpack` แทนคำสั่ง Build เฉพาะของ OpenAI Sites

## Vercel

1. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น GitHub repository
2. ใน Vercel เลือก **Add New → Project** และ Import repository
3. Framework Preset เลือก **Next.js**
4. Root Directory ใช้ `./`
5. Build Command ใช้ `npm run build` หรือปล่อยให้ระบบอ่านจาก `vercel.json`
6. กด Deploy

หากเป็น repository เดิม ให้แทนที่ `package.json` และเพิ่ม `vercel.json` จากแพ็กเกจนี้ จากนั้น Commit และ Redeploy

## Netlify

1. เลือก **Add new site → Import an existing project**
2. เชื่อม repository เดียวกัน
3. Build Command ใช้ `npm run build`
4. ไม่ต้องกำหนด Publish Directory เองสำหรับ Next.js
5. กด Deploy

## ทดสอบในเครื่อง

```bash
npm install
npm run build
npm run dev
```
