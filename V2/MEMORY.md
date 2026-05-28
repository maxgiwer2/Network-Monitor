# Project Memory & Documentation
**Project Name:** Network Monitor System (GLOWNET)
**Tech Stack:** React (Vite), TypeScript, Node.js, Express.js

## Project Overview
ระบบติดตามและตรวจสอบสถานะอุปกรณ์เครือข่าย (Network Monitoring System) ที่ถูกออกแบบมาเพื่อใช้งานในองค์กรที่มีอุปกรณ์เฉพาะทาง (Router/Switch, Firewall, Core Switch) โดยมีฟีเจอร์เด่นด้านแผนผังจำลอง (Network Topology) และการทำ Diagnostics ทดสอบระบบเบื้องต้น

## Phases / Milestones
*ทำงานแบบลำดับขั้น (Phase-by-Phase) โดยทดสอบและแก้ข้อผิดพลาดให้เสร็จก่อนไปขั้นถัดไป*

- [x] **Phase 1-4: Core Foundation & Topology**
  - สร้างโครงสร้างระบบ Client/Server 
  - ระบบตรวจสอบและจำลอง SSH / Ping
  - หน้า NMS Topology จำลองแผนผังแบบลากวาง (Drag & Drop), รองรับ Pan/Zoom
  - ระบบ Polling Simulation จำลองสถานะอุปกรณ์ (Green, Red, Yellow, Gray)

- [x] **Phase 5: Bulk Operations (Import CSV)**
  - สร้าง API `POST /api/devices/bulk` สำหรับการเพิ่มอุปกรณ์แบบทีละมากๆ
  - สร้าง `template.csv` สำหรับให้ผู้ใช้โหลดไปเป็นตัวอย่าง
  - อัปเดตหน้า Device Manager ให้สามารถอัปโหลดไฟล์ CSV และอ่านข้อมูลนำเข้าได้ทันที

- [x] **Phase 6: Hierarchical Network Mapping (Uplink)**
  - ระบบรองรับการจัดการเครือข่ายเป็นลำดับชั้น (Core-Switch -> Firewall -> Switch แต่ละชั้น)
  - เพิ่มฟิลด์ `uplinkId` (Connect To) ลงในทั้งแบบฟอร์มเพิ่มข้อมูลแบบแมนนวล และรองรับผ่าน CSV
  - อัปเดต `NmsTopology.tsx` ให้ลากเส้นเชื่อมโยง (SVG Link) ระหว่าง Custom Device ไปยังอุปกรณ์ Uplink ต้นทางโดยอัตโนมัติ

- [ ] **Phase 7: TBD (Next Step)**
  - (รอการกำหนดจากผู้ใช้งาน)

## Key Technical Decisions & Data Structure
1. **Device Schema (Custom Devices):**
   - `id`: Unique string (auto-generated for custom)
   - `name`: ชื่ออุปกรณ์
   - `ip`: IP Address / Hostname
   - `details`: รายละเอียดเพิ่มเติม
   - `status`: สถานะปัจจุบัน (เช่น ONLINE, OFFLINE)
   - `uplinkId`: (New) รหัสอุปกรณ์ที่เป็นตัวบนของสาย (Parent Node) เพื่อวาดแผนผัง

2. **INITIAL_NODES (Static Nodes):**
   - โหนดมาตรฐานของระบบ (Core Switch 1-3, Data Center, ตึกต่างๆ, ตึก Medicine 16 ชั้น และ Med 11 ชั้น) 
   - รองรับการทำเป็นจุดเชื่อมต่อหลักให้ Custom Devices

3. **Topology Rendering:**
   - ใช้ SVG วาดเส้น (Links) 
   - มีระบบ Glowing filters สำหรับแสดงสถานะแจ้งเตือน (Red glow = Major error, Green glow = Normal)

## Notes from Conversations
- "ใช้ในองค์กรที่มีอุปกรณ์ Router/Switch เฉพาะทาง"
- "เริ่มทำงานจากPhase 1 และทดสอบข้อมผิดพลาดและแก้ไขจนเสร็จ แล้วทำPhase 2 ,Phase 3,Phase 4 ตามลำดับ"
- "หน้า NmsTopology ต้องการให้เพิ่ม แก้ไขจัดกลุ่ม ได้อย่างอิสระ"
- "ทำ network mapping ดู Core-switch firewall switch แต่ละชั้น"
- แผนผังจำลองทำงานได้อิสระ แยกโซนให้ดูง่าย (Data Center, Buildings, Special Departments)
