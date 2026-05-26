# Network Monitor System (GLOWNET)

ระบบติดตามและตรวจสอบสถานะอุปกรณ์เครือข่าย (Network Monitoring System) ที่ถูกออกแบบมาเพื่อใช้งานในองค์กรที่มีอุปกรณ์เฉพาะทาง เช่น Router, Switch, Firewall, Core Switch 

ระบบประกอบด้วยฟีเจอร์เด่นด้านแผนผังจำลอง (Network Topology) ลำดับชั้นแบบ Drag & Drop พร้อมกับการเชื่อมต่ออุปกรณ์แบบ Hierarchical (Uplink) และระบบ Diagnostics พื้นฐาน

---

## ฟีเจอร์หลัก (Key Features)

### 1. NMS Topology (แผนผังเครือข่าย)
* **Interactive Map:** หน้าต่างคอนโซลจำลองแผนผังเครือข่าย สามารถทำการลาก/วาง (Drag & Drop), ซูม (Zoom In/Out), และ Pan หน้าจอได้อิสระ
* **Device Status Simulation:** จำลองระบบ Polling และแจ้งเตือนสถานะอุปกรณ์ตามสี 
  * 🟢 `Green` (Normal)
  * 🟡 `Yellow` (Minor Issue / Jitter)
  * 🔴 `Red` (Major Error / Unreachable)
  * ⚪ `Gray` (Unknown / Packet Loss)
* **Hierarchical Mapping (Uplink):** โครงสร้างวาดสาย Cable เชื่อมต่อแบบมีลำดับชั้น หากเพิ่มอุปกรณ์ใหม่สามารถผูกสายเชื่อมกับ Core Switch, Firewall หรือตึกปลายทางได้ทันที

### 2. Device Management & Bulk Import
* **Manual Setup:** เพิ่มอุปกรณ์ที่ต้องการ Monitor ได้แบบ Manual รองรับการกำหนด IP/Hostname, รายละเอียด และ อุปกรณ์ต้นทาง (Uplink)
* **Bulk CSV Import:** เพิ่มข้อมูลอุปกรณ์ทีละมากๆ ด้วยไฟล์ CSV เพื่อความรวดเร็วในการตั้งค่าระบบ

### 3. Diagnostics & Terminal (Simulation)
* **SSH Simulator:** จำลองการเข้าควบคุมอุปกรณ์ผ่าน SSH ในหน้าจอแบบ CRT 
* **Network Tools:** จำลองผลลัพธ์ของคำสั่งเครือข่ายพื้นฐาน (Ping, Interface Check, Route) ผ่านการกดเมนูลัด

---

## วิธีการติดตั้งและใช้งาน (Installation & Usage)

โปรเจกต์นี้แยกการทำงานเป็น 2 ส่วน คือ **Frontend (React/Vite)** และ **Backend (Node.js/Express)**

### 1. การติดตั้ง (Prerequisites)
ตรวจสอบให้แน่ใจว่าเครื่องของคุณมี Node.js ติดตั้งไว้แล้ว

```bash
# 1. โคลนโปรเจกต์ลงมาที่เครื่อง
git clone https://github.com/maxgiwer2/Network-Monitor.git

# 2. เข้าไปในโฟลเดอร์โปรเจกต์
cd Network-Monitor

# 3. ติดตั้ง Dependencies ของแพ็กเกจ
npm install
```

### 2. การเริ่มต้นระบบ (Starting the Services)
ในโปรเจกต์นี้มีการตั้งค่าให้เปิดระบบผ่าน Script คู่ขนาน 

```bash
# เปิดระบบทั้งฝั่ง Server และ Client พร้อมกัน
npm run dev
```

*(หากต้องการเปิดแยกทีละเซิร์ฟเวอร์)*
- เปิด Backend API (Port 5000): `npm run dev:server`
- เปิด Frontend Vite (Port 3000): `npm run dev:client`

---

## โครงสร้างข้อมูลสำหรับ CSV Import

หากต้องการเพิ่มอุปกรณ์ทีละมากๆ เข้าสู่ระบบ ให้เตรียมไฟล์ CSV ที่มี Column หัวตารางดังนี้:

| name          | ip         | details              | uplink |
|---------------|------------|----------------------|--------|
| Floor1-Switch | 192.168.1.5| Floor 1 Dist. Switch | core1  |
| Firewall-DMZ  | 10.10.1.50 | Backup Firewall      | dc_fw  |

*หมายเหตุ: ฟิลด์ `uplink` สามารถระบุเป็น ID ของอุปกรณ์ในระบบ หรือ Static Nodes (เช่น `core1`, `core2`, `core3`, `dc_fw`)*

---

## เทคโนโลยีที่ใช้งาน (Tech Stack)

* **Frontend:** React, TypeScript, Vite, CSS (CRT / Cyberpunk Styling)
* **Backend:** Node.js, Express.js
* **Storage:** Local Memory (JSON / Array Object Simulation)
