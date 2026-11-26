// ที่พัก: รวมตัวเลือกที่ใช้ในแผน (จาก days.js) กับตัวเลือกเพิ่ม
// คัดจากเว็บจองห้อง/รีวิวที่ค้นเจอ ไม่ใช่การจัดอันดับทางการ ราคาเป็นตัวอย่างคนละวัน คนละสกุลเงิน
// ไม่ใช่ราคาวันที่ 16–19 ธ.ค. และยังไม่ทราบห้องว่าง ต้องกรอกวันที่เช็คเอง
// usd = ราคาต่ำสุดที่เจอ (US$ ต่อคืน) ใช้เรียงลำดับเท่านั้น · rating = คะแนนรีวิวเต็ม 10 (ตามแหล่งที่ระบุ)
import { HOTELS } from './days.js';

export const HZONES = ['อาลีซาน', 'อาลีซาน (นอกอุทยาน)', 'SML', 'ไทเป', 'เจียอี้'];
export const HTYPES = [
  ['fav', 'ที่เราสนใจ ★'], ['near', 'ใกล้ที่เราสนใจ'], ['main', 'ใกล้สถานีไทเป'], ['ximen', 'อินน์เล็กซีเหมินติง'], ['budget', 'ประหยัด & ฮอสเทล'], ['mid', 'ระดับกลาง'], ['high', 'ระดับสูง'], ['bnb', 'B&B / เกสต์เฮาส์'],
  ['transit', 'ใกล้สถานี / MRT'], ['pier', 'ใกล้ท่าเรือ'], ['view', 'วิวทะเลสาบ'],
];

const U = {
  aliStation: ['โรงแรมใกล้สถานีรถไฟป่าอาลีซาน (Hotels.com)', 'https://ph.hotels.com/de1803931/hotels-near-alishan-forest-station-alishan-taiwan'],
  aliList: ['โรงแรมในอาลีซาน (Hotels.com)', 'https://tw.hotels.com/en/de1708975/hotels-alishan-taiwan'],
  aliBnb: ['B&B ในอาลีซาน (Booking.com)', 'https://www.booking.com/bed-and-breakfast/city/tw/alishan.html?aid=898224'],
  aliBudget: ['ที่พักราคาประหยัดในอาลีซาน (Booking.com)', 'https://www.booking.com/budget/city/tw/alishan.html'],
  smlBudget: ['ที่พักราคาประหยัดที่ SML (Booking.com)', 'https://www.booking.com/budget/city/tw/sun-moon-lake.html?aid=887810'],
  smlList: ['โรงแรมที่ SML (Booking.com)', 'https://www.booking.com/district/tw/yu-chih/sunmoonlake.html?aid=351852'],
  smlAgoda: ['10 โรงแรมที่ SML (Agoda)', 'https://www.agoda.com/sun-moon-lake/maps/nantou-tw.html'],
  smlHc: ['Sun Moon Lake Hotel (HotelsCombined)', 'https://www.hotelscombined.com/Hotel/Sun_Moon_Lake_Hotel.htm'],
  ximen: ['โรงแรมซีเหมินติง (Booking.com)', 'https://www.booking.com/district/tw/t-ai-pei/ximending.html?aid=347580'],
  ximenTrip: ['โรงแรมใกล้ MRT ซีเหมิน (Trip.com)', 'https://uk.trip.com/hotels/landmark/cn/mrt-ximen-station.html'],
  ximenHostel: ['ฮอสเทลแถว MRT ซีเหมิน (Travelocity)', 'https://www.travelocity.com/Ximen-Station-Hostels.d6155815-aaHostels.Travel-Guide-Accommodation'],
  ximenCheap: ['โรงแรมราคาถูกในซีเหมินติง (Expedia)', 'https://expedia.com/Ximending-Taipei-Hotels-Cheap-Hotels.0-n6155805-0-tCheapHotels.Travel-Guide-Filter-Hotels'],
  chiayi: ['โรงแรมใกล้สถานีเจียอี้ (Hotels.com)', 'https://uk.hotels.com/de1803934/hotels-near-chiayi-station-chiayi-and-vicinity-taiwan/'],
  chiayiBk: ['โรงแรมในเจียอี้ (Booking.com)', 'https://www.booking.com/city/tw/chiayi-city.html?aid=802549'],
  maison: ['Maison De Chine (Agoda)', 'https://www.agoda.com/maison-de-chine-hotel/hotel/chiayi-tw.html'],
  hichui: ['Hotel Hi Chuiyang (Agoda)', 'https://www.agoda.com/hotel-hi-chuiyang/hotel/chiayi-tw.html'],
};

// คุณสมบัติเพิ่มของตัวเลือกที่อยู่ใน days.js (ชื่อต้องตรงกัน)
const META = {
  'Welove meworld Inn (唯樂米窩-西門館)': { tags: ['mid'], usd: 128, rating: 7.7 },
  'Gau Shan Ching Hotel (阿里山高山青大飯店)': { tags: ['mid', 'transit'], usd: 69, rating: null },
  'Alishan Gou Hotel': { tags: ['budget', 'transit'], usd: null, rating: null },
  'Alishan Hotel (Alishan House)': { tags: ['high', 'transit'], usd: 385, rating: 8.8 },
  'FRIDAY Inn Guest House': { tags: ['mid', 'pier', 'bnb'], usd: 68, rating: 9.4 },
  'Sun Moon Lake Crystal Resort': { tags: ['mid', 'pier'], usd: 72, rating: 8.4 },
  'Sun Moon Lake Full House Resort': { tags: ['mid', 'pier'], usd: 62, rating: 8.6 },
  'Hu Yue Lakeview Hotel': { tags: ['view', 'pier'], usd: null, rating: null },
  'Wyndham Sun Moon Lake': { tags: ['high', 'pier'], usd: 248, rating: 9.2 },
  'CityInn Hotel Plus – Ximending Branch': { tags: ['mid', 'transit'], usd: 62, rating: 9.1 },
  'WESTGATE Hotel': { tags: ['mid', 'transit'], usd: 113, rating: 9.4 },
  'Hotel Midtown Richardson': { tags: ['transit'], usd: null, rating: 8.0 },
  'Airline Inn Taipei Ximen': { tags: ['transit'], usd: null, rating: 8.4 },
  'Tomorrow Hotel': { tags: ['budget', 'transit'], usd: null, rating: null },
};
const ZONE = { ali: 'อาลีซาน', sml: 'SML', tpe: 'ไทเป' };
const NIGHT = { ali: ['D1', 'คืน 16 ธ.ค.'], tpe: ['D2', 'คืน 17–19 ธ.ค.'] };

const SRC = { ali: [U.aliStation, U.aliList], sml: [U.smlAgoda, U.smlList], tpe: [U.ximenTrip, U.ximen] };
const planned = Object.entries(HOTELS).flatMap(([k, h]) => h.picks.map((p, i) => ({
  id: `p-${k}-${i}`, n: p.n, z: ZONE[k], d: p.d, price: p.price, q: p.q,
  ...(META[p.n] || { tags: [], usd: null, rating: null }),
  s: /US\$|NT\$|฿/.test(p.price) ? 'sec' : 'no',
  src: SRC[k],
  plan: { day: NIGHT[k][0], night: NIGHT[k][1], main: i === 0, key: k },
})));

const X = (o) => ({ s: o.usd || o.price.includes('US$') || o.price.includes('€') ? 'sec' : 'no', src: [], ...o });
const extras = [
  // ---- อาลีซาน ----
  X({ id: 'e1', n: 'Applause In The Mountain', z: 'อาลีซาน', tags: ['mid'], rating: 8.8, usd: null, d: '3 ดาว ในอาลีซาน คะแนนรีวิว 8.8/10 (Excellent) ตามเว็บจอง ยังไม่ทราบระยะถึงสถานีรถไฟป่า', price: 'ไม่พบราคา', q: 'Applause In The Mountain Alishan', src: [U.aliStation] }),
  X({ id: 'e2', n: 'Gau Shan Ching Hotel', z: 'อาลีซาน', tags: ['transit'], usd: null, rating: null, d: 'อยู่ในรายการโรงแรมใกล้สถานีอาลีซาน มีอาหารเช้าฟรี (ตามเว็บจอง)', price: 'ไม่พบราคา', q: 'Gau Shan Ching Hotel Alishan', src: [U.aliStation] }),
  X({ id: 'e3', n: 'Yingshan Hotel', z: 'อาลีซาน', tags: ['budget'], usd: null, rating: null, d: '2 ดาว อยู่ในรายการที่พักอาลีซาน', price: 'ไม่พบราคา', q: 'Yingshan Hotel Alishan', src: [U.aliList] }),
  X({ id: 'e4', n: 'TONG PU HOTEL', z: 'อาลีซาน', tags: [], usd: null, rating: null, d: 'ถูกกล่าวถึงในรายการตัวเลือกใกล้เคียง ยังไม่พบรายละเอียด', price: 'ไม่พบราคา', q: 'TONG PU HOTEL Alishan', src: [U.aliList] }),
  X({ id: 'e5', n: 'Hotel Indigo Alishan (IHG)', z: 'อาลีซาน (นอกอุทยาน)', tags: ['high'], usd: 392, rating: null, d: 'อยู่ที่ฟานลู่ ไม่ใช่ในอุทยาน ไม่เหมาะกับรถไฟพระอาทิตย์ขึ้นเช้ามืด', price: 'ตัวอย่าง ~US$392 ต่อคืน', q: 'Hotel Indigo Alishan', src: [U.aliList] }),
  X({ id: 'e6', n: 'Alishan Sunrise B&B', z: 'อาลีซาน (นอกอุทยาน)', tags: ['bnb', 'budget'], usd: 59, rating: null, d: 'อยู่แถวฟานลู่ รีวิวดีมาก (226 รีวิว) ไกลจากสถานีรถไฟป่า', price: 'ตัวอย่าง ~US$59 ต่อคืน', q: 'Alishan Sunrise B&B Fanlu', src: [U.aliBnb] }),
  X({ id: 'e7', n: 'Cuiti B&B', z: 'อาลีซาน (นอกอุทยาน)', tags: ['bnb'], usd: 70, rating: null, d: 'อยู่ที่เฟิ่นฉีหู รีวิว 704 รายการ ไกลจากสถานีรถไฟป่า (ไกด์บอกอยู่ห่างหลายสิบกิโลเมตร)', price: 'ตัวอย่าง ~US$70 ต่อคืน', q: 'Cuiti B&B Fenqihu', src: [U.aliBnb] }),
  X({ id: 'e8', n: 'Siangting B&B', z: 'อาลีซาน (นอกอุทยาน)', tags: ['bnb'], usd: 82, rating: null, d: 'อยู่ที่เฟิ่นฉีหู', price: 'ตัวอย่าง ~US$82–109 ต่อคืน (สองแหล่งไม่ตรงกัน)', q: 'Siangting B&B Fenqihu', src: [U.aliBnb] }),
  X({ id: 'e9', n: 'Zhongshan Hostel (เฟิ่นฉีหู)', z: 'อาลีซาน (นอกอุทยาน)', tags: ['budget', 'bnb'], usd: 39, rating: null, d: 'ฮอสเทลที่เฟิ่นฉีหู', price: 'ตัวอย่าง ~US$39–85 ต่อคืน (สองแหล่งไม่ตรงกัน)', q: 'Zhongshan Hostel Fenqihu', src: [U.aliBudget] }),
  X({ id: 'e10', n: 'Alishan B&B YunMinGi', z: 'อาลีซาน (นอกอุทยาน)', tags: ['bnb'], usd: 94, rating: null, d: 'อยู่ที่เฟิ่นฉีหู', price: 'ตัวอย่าง ~US$94–130 ต่อคืน (หลายแหล่งไม่ตรงกัน)', q: 'Alishan B&B YunMinGi', src: [U.aliBnb] }),
  X({ id: 'e11', n: 'Yeashow Villa (เฟิ่นฉีหู)', z: 'อาลีซาน (นอกอุทยาน)', tags: ['bnb'], usd: 49, rating: 8.3, d: 'ใกล้อาลีซานตามเว็บจอง คะแนน 8.3/10', price: 'ตัวอย่าง ~US$49 ต่อคืน', q: 'Yeashow Villa Fenchihu', src: [U.aliStation] }),

  // ---- SML ----
  X({ id: 'e12', n: 'Fleur de Chine Hotel', z: 'SML', tags: ['high'], usd: 107, rating: 9.1, d: 'คะแนน 9.1/10 บน Booking.com ตั้งอยู่ในเขตยูฉือ (ตำแหน่งเทียบกับท่าเรืออีต้าเส้ายังไม่ยืนยัน)', price: 'ตัวอย่าง ~US$107 ต่อคืน', q: 'Fleur de Chine Hotel Sun Moon Lake', src: [U.smlBudget] }),
  X({ id: 'e13', n: 'Sun Moon Lake Hotel', z: 'SML', tags: ['high'], usd: 91, rating: null, d: '4 ดาว HotelsCombined ระบุราคาต่ำสุดที่เจอ ~US$91 ราคาเฉลี่ย ~US$145', price: 'ตัวอย่าง ~US$91–145 ต่อคืน', q: 'Sun Moon Lake Hotel', src: [U.smlHc] }),
  X({ id: 'e14', n: 'Owl Hostel (貓頭鷹旅店)', z: 'SML', tags: ['budget'], usd: 40, rating: 9.0, d: 'ฮอสเทลราคาถูกสุดในรายการ คะแนน 9.0/10 มีล็อกเกอร์ · ตำแหน่งยังไม่ยืนยัน', price: 'ตัวอย่าง ~US$40 ต่อคืน', q: 'Owl Hostel Sun Moon Lake', src: [U.smlBudget] }),
  X({ id: 'e15', n: "Sun Moon Lake Teachers' Hostel", z: 'SML', tags: ['budget'], usd: 91, rating: null, d: 'ที่พักราคาประหยัดในรายการ Booking.com', price: 'ตัวอย่าง ~US$91 ต่อคืน', q: "Sun Moon Lake Teachers' Hostel", src: [U.smlBudget] }),
  X({ id: 'e16', n: 'Itathao Vocation Hotel', z: 'SML', tags: ['pier'], usd: null, rating: null, d: 'อยู่ใกล้ท่าเรืออีต้าเส้า มีอาหารเช้าบุฟเฟต์ ให้เช่าจักรยานได้ (ตามเว็บจอง)', price: 'ไม่พบราคา', q: 'Itathao Vocation Hotel', src: [U.smlList] }),
  X({ id: 'e17', n: 'Shui Yang Lakeview House', z: 'SML', tags: ['pier', 'view'], usd: null, rating: null, d: 'เดิน 1 นาทีถึงทะเลสาบ 4 นาทีถึงท่าเรืออีต้าเส้า 20 ห้อง มีลิฟต์', price: 'ไม่พบราคา', q: 'Shui Yang Lakeview House Sun Moon Lake', src: [U.smlList] }),

  // ---- ไทเป ซีเหมินติง ----
  X({ id: 'e18', n: 'Swiio Hotel Ximending', z: 'ไทเป', tags: ['transit'], usd: null, rating: 8.7, d: 'ห่าง MRT ซีเหมิน ~340 ม. คะแนน 8.7/10 (337 รีวิว)', price: 'ไม่พบราคา', q: 'Swiio Hotel Ximending', src: [U.ximenTrip] }),
  X({ id: 'e19', n: 'Ximen Hotel', z: 'ไทเป', tags: ['transit'], usd: null, rating: 8.5, d: 'ห่าง MRT ซีเหมิน ~320 ม. คะแนน 8.5/10 (1,236 รีวิว)', price: 'ไม่พบราคา', q: 'Ximen Hotel Taipei', src: [U.ximenTrip] }),
  X({ id: 'e20', n: 'Green World Zhonghua', z: 'ไทเป', tags: ['transit'], usd: null, rating: 8.4, d: 'ห่าง MRT ซีเหมิน ~260 ม. คะแนน 8.4/10 (1,007 รีวิว)', price: 'ไม่พบราคา', q: 'Green World Zhonghua Taipei', src: [U.ximenTrip] }),
  X({ id: 'e21', n: 'amba Taipei Ximending', z: 'ไทเป', tags: ['mid'], usd: 93, rating: null, d: 'โรงแรมในย่านซีเหมินติง', price: 'ตัวอย่าง ~US$93 ต่อคืน', q: 'amba Taipei Ximending', src: [U.ximen] }),
  X({ id: 'e22', n: 'Meander Taipei', z: 'ไทเป', tags: ['budget'], usd: 78, rating: null, d: 'ฮอสเทลสไตล์บูทีค ในกลุ่มที่แพงที่สุดของฮอสเทลแถวซีเหมิน', price: 'ตัวอย่าง ~US$78 ต่อคืน', q: 'Meander Taipei hostel', src: [U.ximenHostel] }),
  X({ id: 'e23', n: 'Backpackers Hostel – Ximending Branch', z: 'ไทเป', tags: ['budget'], usd: 25, rating: null, d: 'ฮอสเทลย่านซีเหมิน', price: 'ตัวอย่าง ~US$25–65 ต่อคืน (หลายแหล่งไม่ตรงกัน)', q: 'Backpackers Hostel Ximending Branch', src: [U.ximenHostel] }),
  X({ id: 'e24', n: 'Fun Inn Taipei Hostel', z: 'ไทเป', tags: ['budget'], usd: 17, rating: null, d: 'ฮอสเทลที่ถูกที่สุดในรายการ (เตียงรวม)', price: 'ตัวอย่าง ~US$17–20 ต่อคืน', q: 'Fun Inn Taipei Hostel', src: [U.ximenCheap] }),
  X({ id: 'e25', n: 'Taiwan Youth Hostel & Capsule Hotel', z: 'ไทเป', tags: ['budget'], usd: 31, rating: null, d: 'แคปซูล/ฮอสเทลแถวซีเหมิน', price: 'ตัวอย่าง ~US$31–39 ต่อคืน', q: 'Taiwan Youth Hostel Capsule Hotel Taipei', src: [U.ximenHostel] }),
  X({ id: 'e26', n: 'Inn Cube Ximen', z: 'ไทเป', tags: ['budget'], usd: 29, rating: null, d: 'ที่พักแบบแคปซูลแถวซีเหมิน', price: 'ตัวอย่าง ~US$29 ต่อคืน', q: 'Inn Cube Ximen Taipei', src: [U.ximenHostel] }),

  // ---- เจียอี้ (ตัวเลือกสำรองถ้าไม่ทันบัสขึ้นเขาวันที่ 16) ----
  X({ id: 'e27', n: 'Kite Hostel (เจียอี้)', z: 'เจียอี้', tags: ['budget', 'transit'], usd: 26, rating: null, d: 'เดินจากสถานีรถไฟเจียอี้ ~12 นาที ใกล้ตลาดกลางคืนเหวินฮวา', price: 'ตัวอย่าง ~US$26 ต่อคืน', q: 'Kite Hostel Chiayi', src: [U.chiayi] }),
  X({ id: 'e28', n: 'Ron Gong Hotel', z: 'เจียอี้', tags: ['budget'], usd: null, rating: null, d: 'Skyscanner จัดเป็นตัวเลือกที่ถูกสุดแถวสถานี (ไม่ระบุวันที่ของราคา)', price: 'ตัวอย่างเฉลี่ย ~€19 ต่อคืน', q: 'Ron Gong Hotel Chiayi', src: [U.chiayi] }),
  X({ id: 'e29', n: 'Chiayi King Hotel', z: 'เจียอี้', tags: ['mid', 'transit'], usd: 46, rating: null, d: '3.5 ดาว เดิน 5 นาทีจากถนนจงซานและสถานีรถไฟ คะแนน 8.0–8.6 ตามแต่ละเว็บ', price: 'ตัวอย่าง ~US$46 ต่อคืน', q: 'Chiayi King Hotel', src: [U.chiayiBk] }),
  X({ id: 'e30', n: 'Hotel Hi Chuiyang', z: 'เจียอี้', tags: ['mid'], usd: null, rating: null, d: 'ห่างสถานีรถไฟ ~755 ม. คะแนนทำเล 8.2 มีอาหารเช้าบุฟเฟต์', price: 'ไม่พบราคา', q: 'Hotel Hi Chuiyang Chiayi', src: [U.hichui] }),
  X({ id: 'e31', n: 'Hotel Liyaou', z: 'เจียอี้', tags: ['transit'], usd: null, rating: 9.0, d: 'เดิน 6 นาทีจากสถานีรถไฟ คะแนน 9.0/10 แต่มาจากรีวิวเพียง 4 รายการ', price: 'ไม่พบราคา', q: 'Hotel Liyaou Chiayi', src: [U.chiayi] }),
  X({ id: 'e32', n: 'Holiday Inn Express Chiayi', z: 'เจียอี้', tags: ['mid'], usd: null, rating: 8.1, d: 'คะแนน 8.1/10 จาก 7,024 รีวิว', price: 'ไม่พบราคา', q: 'Holiday Inn Express Chiayi', src: [U.chiayi] }),
  X({ id: 'e33', n: 'Maison De Chine Hotel', z: 'เจียอี้', tags: ['high'], usd: null, rating: 9.2, d: '4 ดาว ห่างสถานีรถไฟ ~0.91 กม. คะแนน 9.2 บน Agoda', price: 'ไม่พบราคา', q: 'Maison De Chine Hotel Chiayi', src: [U.maison] }),
];


// ---- ที่เราสนใจ: ข้อมูลจากภาพหน้าจอ Trip.com ที่ส่งมา (24 พ.ย. 2569) ราคาเปลี่ยนได้ทุกวัน ----
const TRIP = () => [];
const favs = [
  X({ id: 'v1', n: 'Dafang Tea Homestay', night: 'ali-alt', loc: 'XIDING', img: 'img/hotel-v1.jpg', img2: 'img/hotel-v1-room.jpg', z: 'อาลีซาน (นอกอุทยาน)', tags: ['fav', 'bnb'], usd: 80, rating: null, s: 'sec',
    d: 'No. 66-8 Xiding, Gongtian Village, Fanlu Township, Chiayi County · ย่านเซี่ยติ่ง ริมถนนสาย 18 ระหว่างทางขึ้นอาลีซาน วิวภูเขา ใกล้ทางเดินหลายเส้น (จากรีวิว) · ห้อง Double 1 queen bed 15 ตร.ม. ชั้น 2 มีหน้าต่าง ฮีตเตอร์ ห้องน้ำในตัว Wi-Fi · รวมอาหารเช้า 2 ที่ · ยกเลิกฟรีถึง 23:59 วันที่ 11 ธ.ค. ไม่ต้องจ่ายจนถึง 9 ธ.ค. (ดูเมื่อ 23 พ.ย.) · ไกลจากสถานีรถไฟป่าอาลีซาน (~25–30 กม. ค่าประมาณ) ไปรถไฟพระอาทิตย์ขึ้นจู้ซานไม่ได้ถ้าไม่มีรถ',
    price: 'THB 2,476 ต่อคืน (ก่อนหน้านี้เห็น 2,479 รวมภาษี 2,863) · 16–17 ธ.ค. 1 คืน 2 คน', q: 'Dafang Tea Homestay Xiding Fanlu Chiayi',
    src: [['Dafang Tea Homestay (Trip.com)', 'https://www.trip.com/w/XWNpYWUCIX2']] }),
  X({ id: 'v2', n: 'Fenchihu Hotel (奮起湖大飯店)', night: 'ali-alt', loc: 'FENQIHU', img: 'img/hotel-v2.jpg', img2: 'img/hotel-v2-room.jpg', z: 'อาลีซาน (นอกอุทยาน)', tags: ['fav', 'mid'], usd: 112, rating: null, s: 'sec',
    d: 'No. 178-1 Fenqihu, Zhuqi Township, Chiayi County · อยู่ในหมู่บ้านเก่าเฟิ่นฉีหู ห้องแบบเสื่อทาทามิญี่ปุ่น (จากรีวิว) · มีอาหารเช้าและยกเลิกฟรี · Wi-Fi ในห้อง ชั้นปลอดบุหรี่ · บัส 7322/7329 บางเที่ยววิ่งผ่านเฟิ่นฉีหู (ทางการ) · ไกลจากสถานีอาลีซาน ไปรถไฟพระอาทิตย์ขึ้นจู้ซานรอบเช้ามืดไม่ได้ถ้าไม่มีรถ',
    price: 'THB 3,499 ต่อคืน (ลดจาก 3,717) · 16–17 ธ.ค. 1 คืน 2 คน', q: 'Fenchihu Hotel Fenqihu Chiayi', src: TRIP('Fenchihu Hotel') }),
  X({ id: 'v3', n: 'ILLUME TAIPEI', night: 'tpe', loc: 'DUNHUA', img: 'img/hotel-v3.jpg', img2: 'img/hotel-v3-room.jpg', z: 'ไทเป', tags: ['fav', 'high'], usd: null, rating: null, s: 'no',
    d: 'No. 100 Dunhua North Road, Songshan District, Taipei · 4 ดาว อันดับ 12 ของโรงแรม 4 ดาวในไทเป (Trip.Best) · สระว่ายน้ำกลางแจ้งน้ำอุ่น มีคลาสโยคะ · อยู่ย่านซงซาน/ถนนตุนฮว่าเหนือ ไม่ใช่ซีเหมินติง ไกลจากสถานีไทเปซึ่งเป็นจุดขึ้น HSR และ Airport MRT · ⚠️ ตอนที่ดู (16 → 17–20 ธ.ค. 3 คืน) Trip.com ขึ้นว่า “This hotel is not currently accepting bookings”',
    price: 'ไม่มีราคา · Trip.com ไม่รับจองช่วงนี้ ณ วันที่ดู · 17–20 ธ.ค. 3 คืน 2 คน', q: 'ILLUME TAIPEI Dunhua North Road', src: TRIP('ILLUME TAIPEI') }),
];

// ---- ใกล้ที่พักที่เราสนใจ: จากการค้นเว็บ 24 พ.ย. 2569 ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคาวันที่ไป · กรองไว้ไม่เกินราว 5,000 บาท/คืน ----
const KY = (n, u) => [[n, u]];
const near = [
  X({ id: 'n1', n: 'SunSweetHouse', loc: 'XIDING', z: 'อาลีซาน (นอกอุทยาน)', tags: ['near', 'bnb'], usd: null, rating: null, d: 'No. 66-10 Xiding, Fanlu · ติดกับ Dafang Tea Homestay บทความรีวิวบอกว่าวิวภูเขาเกิน 180 องศา', price: 'ไม่พบราคา', q: 'SunSweetHouse Xiding Fanlu', src: KY('รีวิว Taiwan Everything', 'https://taiwaneverything.cc/?p=21121') }),
  X({ id: 'n2', n: 'Alishan Tea Homestay', loc: 'XIDING', z: 'อาลีซาน (นอกอุทยาน)', tags: ['near', 'bnb', 'budget'], usd: 60, rating: null, d: 'Hotels.com ระบุที่อยู่ No. 4 Shizhuo (สือจั๋ว ห่างเซี่ยติ่งขึ้นไปอีกช่วงหนึ่ง) มีห้องวิวภูเขา · Traveloka ให้ที่อยู่อื่นในชื่อเดียวกัน ต้องเช็คก่อนจอง', price: 'ตัวอย่าง จาก ~US$60 เฉลี่ย ~US$92–101 ต่อคืน', q: 'Alishan Tea Homestay Shizhuo', src: KY('Kayak', 'https://www.kayak.com/Alishan-Hotels-Alishan-Tea-Homestay.467401.ksp') }),
  X({ id: 'n3', n: 'Alishan B&B Yunmingi Aliscenery', loc: 'XIDING', z: 'อาลีซาน (นอกอุทยาน)', tags: ['near', 'bnb'], usd: 120, rating: null, d: 'อยู่กลางไร่ชา ห้องวิวดี (จากรีวิว) · อยู่เขตจู๋ฉี ไม่ใช่สือจั๋ว ตำแหน่งจริงให้ดูในแผนที่', price: 'ตัวอย่าง ~US$120+ ต่อคืน', q: 'Alishan B&B Yunmingi Aliscenery', src: KY('Hotels.com', 'https://tw.hotels.com/ho486882/a-li-shan-yuan-ming-ju-shan-zhuang-zhu-qi-tai-wan') }),
  X({ id: 'n4', n: 'Fenglutang B&B', loc: 'FENQIHU', z: 'อาลีซาน (นอกอุทยาน)', tags: ['near', 'bnb'], usd: null, rating: null, d: 'B&B ที่เฟิ่นฉีหู', price: 'ไม่พบราคา', q: 'Fenglutang Bed and Breakfast Fenqihu', src: KY('Expedia', 'https://www.expedia.com/Fenglutang-Bed-And-Breakfast.d3000723354-aaBedAndBreakfast.Travel-Guide-Accommodation') }),
  X({ id: 'n5', n: 'K Hotels Taipei Nanjing', loc: 'DUNHUA', z: 'ไทเป', tags: ['near', 'mid', 'transit'], usd: 88, rating: null, d: '4 ดาว ย่านซงซาน ห่าง Taipei Arena ~0.2 ไมล์ เดิน ~5 นาทีถึง Taipei Arena และสถานี MRT · ใกล้ ILLUME', price: 'ตัวอย่าง ~US$88–93 ต่อคืน', q: 'K Hotels Taipei Nanjing', src: KY('Expedia', 'https://www.expedia.com/cn/Taipei-Arena-Hotels.0-l6080191-0.Travel-Guide-Filter-Hotels') }),
  X({ id: 'n6', n: 'Hej Taipei Arena Hotel', loc: 'DUNHUA', z: 'ไทเป', tags: ['near', 'mid'], usd: 94, rating: null, d: '4 ดาว ห่าง Taipei Arena ~700 ม. มีร้านอาหาร · ใกล้ ILLUME', price: 'ตัวอย่าง ~US$94–107 ต่อคืน', q: 'Hej Taipei Arena Hotel', src: KY('Booking.com', 'https://www.booking.com/landmark/tw/taipei-arena.html') }),
  X({ id: 'n7', n: 'Capital Hotel Arena', loc: 'DUNHUA', z: 'ไทเป', tags: ['near', 'mid', 'transit'], usd: null, rating: null, d: '4 ดาว เดิน ~1 นาทีถึงสถานี MRT Taipei Arena', price: 'ไม่พบราคา', q: 'Capital Hotel Arena Taipei', src: KY('Hotels.com', 'https://th.hotels.com/ho234234/rong-r-m-kh-pi-txl-sakha-xari-na-thipe-tihwan') }),
  X({ id: 'n8', n: 'Brother Hotel', loc: 'DUNHUA', z: 'ไทเป', tags: ['near', 'mid', 'transit'], usd: null, rating: null, d: '4 ดาว เดิน ~1 นาทีถึง MRT หนานจิงฟู่ซิง (สายสีเขียวและสีน้ำตาล) ~2 นาทีถึง Taipei Arena', price: 'ไม่พบราคา', q: 'Brother Hotel Taipei', src: KY('Booking.com', 'https://www.booking.com/landmark/tw/taipei-arena.html') }),
  X({ id: 'n9', n: 'Les Suites Taipei Ching-Cheng', loc: 'DUNHUA', z: 'ไทเป', tags: ['near', 'mid', 'transit'], usd: null, rating: null, d: '4 ดาว อยู่หน้า MRT หนานจิงฟู่ซิง', price: 'ไม่พบราคา', q: 'Les Suites Taipei Ching-Cheng', src: KY('Booking.com', 'https://www.booking.com/landmark/tw/taipei-arena.html') }),
  X({ id: 'n10', n: 'Fullerton Hotel – Maison North', loc: 'DUNHUA', z: 'ไทเป', tags: ['near', 'mid'], usd: 100, rating: null, d: '4 ดาว ห่าง Taipei Arena ~0.7 ไมล์', price: 'ตัวอย่าง ~US$100 ต่อคืน', q: 'Taipei Fullerton Hotel Maison North', src: KY('Expedia', 'https://www.expedia.com/cn/Taipei-Arena-Hotels.0-l6080191-0.Travel-Guide-Filter-Hotels') }),
];

// ---- ใกล้สถานีไทเป (Taipei Main Station): จากการค้นเว็บ 24 พ.ย. 2569 งบราว 3,000 บาท/คืน 17–20 ธ.ค. ----
const mainStn = [
  X({ id: 'm1', n: 'Just Live Inn – Taipei Station', loc: 'TPE_MAIN', z: 'ไทเป', tags: ['main', 'budget', 'transit'], usd: null, rating: 9.3, d: 'เดิน ~5 นาทีถึง MRT สถานีไทเป · คะแนน 9.3/10 จาก ~1,220 รีวิว (Booking.com) · ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคา 17–20 ธ.ค.', price: 'ไม่พบราคา', q: 'Just Live Inn Taipei Station', src: [['Booking.com: ย่านสถานีไทเป', 'https://www.booking.com/district/tw/t-ai-pei/taipeimainstration.html']] }),
  X({ id: 'm2', n: 'Hinoen Hotel', loc: 'TPE_MAIN', z: 'ไทเป', tags: ['main', 'mid'], usd: 74, rating: 9.2, d: 'ห่างสถานีไทเป ~0.3 ไมล์ (~500 ม.) · คะแนน 9.2/10 จาก ~608 รีวิว · ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคา 17–20 ธ.ค.', price: 'ตัวอย่าง ~US$74 ต่อคืน (ช่วงต้น ม.ค. 2026)', q: 'Hinoen Hotel Taipei', src: [['Expedia: โรงแรมใกล้สถานีไทเป', 'https://www.expedia.com/cn/Taipei-Main-Station-Hotels.0-l825684918979485696-0.Travel-Guide-Filter-Hotels']] }),
  X({ id: 'm3', n: 'CityInn Hotel Taipei Station Branch III (新驛旅店台北車站三館)', loc: 'TPE_MAIN', z: 'ไทเป', tags: ['main', 'mid', 'transit'], usd: null, rating: 9.2, d: '3.5 ดาว เดิน ~6 นาทีถึง MRT สถานีไทเป · คะแนน 9.2 · ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคา 17–20 ธ.ค.', price: 'ไม่พบราคา', q: 'CityInn Hotel Taipei Station Branch III', src: [['Funtime: ที่พักใกล้สถานีไทเป', 'https://www.funtime.com.tw/blog/funtime/taipei-main-station-accommodations']] }),
  X({ id: 'm4', n: 'CityInn Hotel Taipei Station Branch I (新驛旅店台北車站一館)', loc: 'TPE_MAIN', z: 'ไทเป', tags: ['main', 'budget'], usd: 55, rating: null, d: '3 ดาว เดิน ~10 นาทีถึงสถานีไทเปและสถานีบัส · ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคา 17–20 ธ.ค.', price: 'ตัวอย่างต่ำสุด ~NT$1,798 ต่อคืน (Kayak เฉพาะบางวัน)', q: 'CityInn Hotel Taipei Station Branch I', src: [['Funtime: ที่พักใกล้สถานีไทเป', 'https://www.funtime.com.tw/blog/funtime/taipei-main-station-accommodations']] }),
  X({ id: 'm5', n: '璞漣商務旅館 台北車站館', loc: 'TPE_MAIN', z: 'ไทเป', tags: ['main', 'budget'], usd: 45, rating: null, d: '3 ดาว ใกล้สถานีบัสไทเป (臺北轉運站) · ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคา 17–20 ธ.ค.', price: 'ตัวอย่างต่ำสุด ~NT$1,447 ต่อคืน (Kayak เฉพาะบางวัน)', q: '璞漣商務旅館 台北車站館', src: [['Funtime: ที่พักใกล้สถานีไทเป', 'https://www.funtime.com.tw/blog/funtime/taipei-main-station-accommodations']] }),
  X({ id: 'm6', n: 'Twin Star Inn (雙星寓所)', loc: 'TPE_MAIN', z: 'ไทเป', tags: ['main', 'budget'], usd: null, rating: null, d: 'ถนนจงเซี่ยวตะวันตก ตอน 1 ข้างสถานีไทเป · เช็คอินด้วยตัวเอง (จากบล็อก) · ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคา 17–20 ธ.ค.', price: 'ไม่พบราคา', q: '雙星寓所 Twin Star Inn Taipei', src: [['Funtime: ที่พักใกล้สถานีไทเป', 'https://www.funtime.com.tw/blog/funtime/taipei-main-station-accommodations']] }),
  X({ id: 'm7', n: 'Roaders Plus Hotel – Station Front (路徒PLUS行旅 站前館)', loc: 'TPE_MAIN', z: 'ไทเป', tags: ['main', 'mid', 'transit'], usd: null, rating: null, d: 'No. 80 ถนนจงเซี่ยวตะวันตก ตอน 1 หน้าสถานีไทเป · ระดับกลาง อาจเกินงบ · ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคา 17–20 ธ.ค.', price: 'ไม่พบราคา', q: 'Roaders Plus Hotel Taipei Station', src: [['Funtime: ที่พักใกล้สถานีไทเป', 'https://www.funtime.com.tw/blog/funtime/taipei-main-station-accommodations']] }),
  X({ id: 'm8', n: 'The Tango Hotel Taipei Nanshi', loc: 'TPE_MAIN', z: 'ไทเป', tags: ['main', 'mid'], usd: null, rating: null, d: 'เดิน ~10 นาทีถึงสถานีไทเป · ~1,297 รีวิว · ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคา 17–20 ธ.ค.', price: 'ไม่พบราคา', q: 'The Tango Hotel Taipei Nanshi', src: [['Booking.com: ย่านสถานีไทเป', 'https://www.booking.com/district/tw/t-ai-pei/taipeimainstration.html']] }),
];

// ---- อินน์เล็กในซีเหมินติงแบบ Welove meworld: จากการค้นเว็บ 24 พ.ย. 2569 ----
const ximenInn = [
  X({ id: 'x2', n: 'Cattail Pocket Inn (貓尾口袋旅店 西門館)', loc: 'HOTEL_TPE', z: 'ไทเป', tags: ['ximen', 'mid'], usd: null, rating: 9.0, d: 'เปิดปี 2024 มีแค่ 10 ห้อง ห้องแนวดีไซน์ · Kangding Rd Lane 25 No. 1 ฝั่งซีเหมินติง · Agoda ให้คะแนนบริการ ความสะอาด และทำเลเกิน 9 · ห้องน้อย ควรจองเร็ว · ยังไม่ได้เช็คราคาวันที่ 17–20 ธ.ค.', price: 'ไม่พบราคา', q: '貓尾口袋旅店 西門館', src: [['Agoda', 'https://www.agoda.com/zh-tw/cattail-pocket-inn/hotel/taipei-tw.html']] }),
  X({ id: 'x3', n: 'Ling Lan Hotel (苓旅 萬年館)', loc: 'HOTEL_TPE', z: 'ไทเป', tags: ['ximen', 'budget'], usd: null, rating: null, d: 'อยู่ในตึกว่านเหนียนกลางซีเหมินติง คะแนนรีวิวราว 4.5/5 · รีวิวบอกตึกเก่ารีโนเวทใหม่แล้วสะอาด เป็นตัวเลือกราคาประหยัด · ยังไม่ได้เช็คราคาวันที่ 17–20 ธ.ค.', price: 'ไม่พบราคา', q: '苓旅 萬年館 西門町', src: [['HK01: โรงแรมซีเหมินติง', 'https://www.hk01.com/旅遊/897474/西門町酒店12間推介-近台北捷運站人均-116-親子房-落地窗靚景']] }),
  X({ id: 'x4', n: 'inhouse Boutique', loc: 'HOTEL_TPE', z: 'ไทเป', tags: ['ximen', 'mid'], usd: null, rating: 9.0, d: '4 ดาว คะแนน 9.0/10 จาก ~633 รีวิว (Expedia) อยู่อันดับต้นของโรงแรมบูทีคซีเหมินติง · ยังไม่ได้เช็คระยะถึง MRT ซีเหมิน · ยังไม่ได้เช็คราคาวันที่ 17–20 ธ.ค.', price: 'ไม่พบราคา', q: 'inhouse Boutique Taipei', src: [['Expedia: บูทีคซีเหมินติง', 'https://www.expedia.com/cn/Ximending-Taipei-Hotels-Boutique-Hotel.0-n6155805-0-tBoutiqueHotel.Travel-Guide-Filter-Hotels']] }),
  X({ id: 'x5', n: 'citizenM Taipei North Gate', loc: 'HOTEL_TPE', z: 'ไทเป', tags: ['ximen', 'mid', 'transit'], usd: null, rating: null, d: 'โรงแรมดีไซน์ห้องเล็กแนวคนรุ่นใหม่ ใกล้ MRT เป่ยเหมิน (ระหว่างซีเหมินติงกับสถานีไทเป) · ราคาอาจเกินงบ · ยังไม่ได้เช็คราคาวันที่ 17–20 ธ.ค.', price: 'ไม่พบราคา', q: 'citizenM Taipei North Gate', src: [['HK01: โรงแรมซีเหมินติง', 'https://www.hk01.com/旅遊/897474/西門町酒店12間推介-近台北捷運站人均-116-親子房-落地窗靚景']] }),
];

export const HOTEL_LIST = [...favs, ...planned, ...mainStn, ...ximenInn, ...near, ...extras];
export const FAV_HOTELS = favs;
