// ที่พัก: รวมตัวเลือกที่ใช้ในแผน (จาก days.js) กับตัวเลือกเพิ่ม
// คัดจากเว็บจองห้อง/รีวิวที่ค้นเจอ ไม่ใช่การจัดอันดับทางการ ราคาเป็นตัวอย่างคนละวัน คนละสกุลเงิน
// ไม่ใช่ราคาวันที่ 16–19 ธ.ค. และยังไม่ทราบห้องว่าง ต้องกรอกวันที่เช็คเอง
// usd = ราคาต่ำสุดที่เจอ (US$ ต่อคืน) ใช้เรียงลำดับเท่านั้น · rating = คะแนนรีวิวเต็ม 10 (ตามแหล่งที่ระบุ)
import { HOTELS } from './days.js';

export const HZONES = ['อาลีซาน', 'อาลีซาน (นอกอุทยาน)', 'SML', 'ไทเป', 'เจียอี้'];
export const HTYPES = [
  ['budget', 'ประหยัด & ฮอสเทล'], ['mid', 'ระดับกลาง'], ['high', 'ระดับสูง'], ['bnb', 'B&B / เกสต์เฮาส์'],
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
const NIGHT = { ali: ['D1', 'คืน 16 ธ.ค.'], sml: ['D2', 'คืน 17 ธ.ค.'], tpe: ['D3', 'คืน 18–19 ธ.ค.'] };

const SRC = { ali: [U.aliStation, U.aliList], sml: [U.smlAgoda, U.smlList], tpe: [U.ximenTrip, U.ximen] };
const planned = Object.entries(HOTELS).flatMap(([k, h]) => h.picks.map((p, i) => ({
  id: `p-${k}-${i}`, n: p.n, z: ZONE[k], d: p.d, price: p.price, q: p.q,
  ...(META[p.n] || { tags: [], usd: null, rating: null }),
  s: /US\$|NT\$/.test(p.price) ? 'sec' : 'no',
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

export const HOTEL_LIST = [...planned, ...extras];
