// ร้านอาหาร/ของกิน คัดจากผลค้นหา (บล็อก ไกด์ รีวิว) ไม่ใช่การจัดอันดับทางการ
// ไม่มีเวลาเปิด-ปิดหรือราคาที่ยืนยันแล้ว ต้องเช็คก่อนไป ร้านเปลี่ยนบ่อย
// s: sec = มีแหล่งรองสนับสนุน, no = ยังไม่ยืนยัน (มีข้อมูลขัดแย้งหรือไม่ชัด)
// day/meal: ถ้ามี = ใช้ในแผนของเรา

export const FZONES = ['เจียอี้', 'อาลีซาน', 'SML', 'ไทเป', 'อูไหล', 'จีหลง', 'จิ่วเฟิ่น'];
export const FTYPES = [
  ['rice', 'ข้าว & เส้น'], ['snack', 'ของว่าง & ริมทาง'], ['night', 'ตลาดกลางคืน'], ['sweet', 'ของหวาน'],
  ['native', 'อาหารชนเผ่า'], ['sit', 'ร้านนั่งกิน & วิว'], ['tea', 'ชา & ร้านน้ำชา'], ['morning', 'อาหารเช้า'], ['sea', 'อาหารทะเล'],
];

const L = {
  chiayiTurkey: ['ข้าวไก่งวงเจียอี้ (Amcham)', 'https://topics.amcham.com.tw/2025/01/chiayis-humble-turkey-dish'],
  chiayiStation: ['ไกด์ย่านสถานีเจียอี้', 'https://ph.trip.com/moments/chiayi-station-area-2036551'],
  guoJia: ['Guo Jia (Tripadvisor)', 'https://www.tripadvisor.co.uk/Restaurant_Review-g13808399-d6136659-Reviews-Guo_Jia_Chicken_Rice-West_District_Chiayi.html'],
  wenhua: ['ตลาดวันฮัวโร้ด เจียอี้', 'https://www.taiwanobsessed.com/wenhua-road-night-market-chiayi/'],
  ahHong: ['Ah Hong Shi (mmm-yoso)', 'https://mmm-yoso.com/2023/08/13/'],
  alishanHouse: ['Alishan House Restaurant (Trip.com)', 'https://sa.trip.com/travel-guide/chiayi%20county-3182-restaurant/Alishan%20House%20Restaurant-23872156'],
  alishanFood: ['ไกด์อาหารอาลีซาน', 'https://www.tripool.app/en/articles/taiwan-chiayi-alishan-food'],
  itaThao: ['ไกด์อีต้าเส้า', 'https://taiwanderers.com/ita-thao-sun-moon-lake/'],
  smlFood: ['ที่พักและอาหาร SML', 'https://lifeoftaiwan.com/places-to-go/sun-moon-lake/accommodation-food/'],
  smlStreet: ['เรือและสตรีทฟู้ดอีต้าเส้า', 'https://tiffycooks.com/sun-moon-lake-boat-tour-and-ita-thao-street-food/'],
  ximending: ['ร้านอาหารซีเหมินติง', 'https://taiwanderers.com/ximending-taipei-restaurants/'],
  ayChung: ['Ay-Chung (Migrationology)', 'https://migrationology.com/ay-chung-flour-rice-noodles/'],
  taipeiFood: ['ไกด์กินไทเป', 'https://www.taiwanobsessed.com/where-to-eat-taipei/'],
  taipei48: ['กินในไทเป 48 ชม.', 'https://theculturetrip.com/asia/taiwan/articles/what-to-eat-in-48-hours-in-taipei'],
  wulai: ['ถนนเก่าอูไหล', 'https://www.travelking.com.tw/eng/tourguide/scenery104011.html'],
  wulai2: ['ถนนเก่าอูไหล (New Taipei)', 'https://newtaipei.travel/en/attractions/detail/111719'],
  miaokou: ['ตลาดเมี่ยวโข่ว (Taiwanderers)', 'https://taiwanderers.com/keelung-night-market-taiwan/'],
  miaokou2: ['กินตลาดเมี่ยวโข่ว (Nick Kembel)', 'https://www.nickkembel.com/miaokou-night-market-keelung/'],
  jiufen: ['10 อย่างที่ควรกินที่จิ่วเฟิ่น', 'https://www.willflyforfood.net/10-things-to-eat-on-jiufen-old-street-taiwan/'],
  jiufen2: ['กินอะไรที่จิ่วเฟิ่น', 'https://www.englishintaiwan.com/travel-in-taiwan/north-taiwan-travel/jiufen-town-taipei-city-food-to-eat'],
  agy: ['A-Gan-Yi (Michelin)', 'https://guide.michelin.com/en/northern-taiwan/new-taipei-city_2853082/restaurant/a-gan-yi-taro-balls'],
  azhu: ['A-Zhu ไอศกรีมถั่วลิสง', 'https://www.theworldofstreetfood.com/2026/02/the-famous-zhu-peanut-ice-cream-roll-in.html'],
  peanut: ['ไอศกรีมถั่วลิสง (Michelin)', 'https://guide.michelin.com/tw/en/article/features/peanut-ice-cream-roll-taiwan'],
};

export const FOODS = [
  // ---------- เจียอี้ ----------
  { id: 'f1', n: 'Chiayi Sanya Turkey Rice', z: 'เจียอี้', tags: ['rice'], dish: 'ข้าวหน้าไก่งวง (และก๋วยเตี๋ยวซี่โครงหมู)', note: 'อยู่ตรงข้ามสถานีรถไฟเจียอี้ เปิดมาราว 50 ปี ตามไกด์ · จากสถานี HSR ต้องนั่งรถฟรีสาย 7211/7212 ~25 นาที (ใช้ตั๋ว HSR) แล้วขึ้นบัส 7322 จากสถานีรถไฟต่อ (ตามแผน) · ถ้าเที่ยว 7322 ไม่สะดวก ให้ซื้อของกินที่ HSR แล้วขึ้น 7329 แทน', s: 'sec', src: [L.chiayiStation], day: 'D1', meal: 'กลางวัน', q: 'Chiayi Sanya Turkey Rice' },
  { id: 'f2', n: 'Guo Jia Turkey Rice', z: 'เจียอี้', tags: ['rice'], dish: 'ข้าวหน้าไก่งวง', note: 'มี 2 สาขา คือถนนเหวินฮวาและถนนต้าหยา รีวิวบอกสาขาเหวินฮวาเปิดนานกว่า · ไม่อยู่ใกล้สถานี HSR', s: 'sec', src: [L.guoJia, L.chiayiTurkey], q: 'Guo Jia Turkey Rice Chiayi' },
  { id: 'f3', n: 'Ah Hong Shi Turkey Rice', z: 'เจียอี้', tags: ['rice'], dish: 'ข้าวหน้าไก่งวง', note: 'ถนนกว่างฮัว เจียอี้ · ชาวเจียอี้เถียงกันว่าร้านไหนดีที่สุด', s: 'sec', src: [L.ahHong], q: 'Ah Hong Shi Turkey Rice Chiayi' },
  { id: 'f4', n: 'Chiayi Shuipen Turkey Rice (สาขาจงซาน)', z: 'เจียอี้', tags: ['rice'], dish: 'ข้าวหน้าไก่งวง', note: 'รีวิวบอกใกล้สถานีรถไฟเจียอี้', s: 'sec', src: [L.chiayiTurkey], q: 'Chiayi Shuipen Turkey Rice Zhongshan' },
  { id: 'f5', n: 'Democracy Turkey Rice', z: 'เจียอี้', tags: ['rice'], dish: 'ข้าวหน้าไก่งวง', note: 'ถูกกล่าวถึงในไกด์ข้าวไก่งวงเจียอี้ ข้อมูลอื่นยังไม่ยืนยัน', s: 'no', src: [L.chiayiTurkey], q: 'Democracy Turkey Rice Chiayi' },
  { id: 'f6', n: 'ตลาดกลางคืนถนนเหวินฮวา เจียอี้', z: 'เจียอี้', tags: ['night', 'snack'], dish: 'ของกินท้องถิ่นเจียอี้หลายแผง', note: 'เดินจากสถานีรถไฟเจียอี้ไปทางตะวันออก ~15 นาที · เปิดกลางคืน ไม่เข้ากับตารางวันที่ 16 (ต้องขึ้นเขา)', s: 'sec', src: [L.wenhua], q: 'Wenhua Road Night Market Chiayi' },

  // ---------- อาลีซาน ----------
  { id: 'f7', n: 'Alishan House Restaurant', z: 'อาลีซาน', tags: ['sit'], dish: 'อาหารจีน/ท้องถิ่น วิวภูเขา', note: 'ในโรงแรมประวัติศาสตร์กว่า 100 ปีในเขตอาลีซาน รีวิวบอกวิวดี รสพอใช้ ราคาใกล้ร้านนอกอุทยาน · ร้านในอุทยานส่วนใหญ่เปิดราว 10:00–18:00 ตามไกด์ ควรกินก่อนค่ำ', s: 'sec', src: [L.alishanHouse, L.alishanFood], day: 'D1', meal: 'เย็น', q: 'Alishan House Restaurant' },
  { id: 'f8', n: 'อาหารชนเผ่าโจว (Tsou) ในอาลีซาน', z: 'อาลีซาน', tags: ['native'], dish: 'หมูป่าย่าง ข้าวหลามไม้ไผ่ เหล้าข้าวฟ่าง', note: 'ไกด์บอกบางร้านต้องจองล่วงหน้า · ยังไม่ได้เลือกร้านเจาะจง', s: 'sec', src: [L.alishanFood], q: 'Tsou aboriginal cuisine Alishan' },
  { id: 'f9', n: 'ผักภูเขาและวัตถุดิบท้องถิ่นอาลีซาน', z: 'อาลีซาน', tags: ['sit'], dish: 'ผักภูเขา กุ้งน้ำจืดทอด สลัดพื้นเมือง', note: 'ไกด์บอกอาหารที่ดีที่สุดคือผลผลิตภูเขา ร้านหลายแห่งปลูกผักเองหรือซื้อจากหมู่บ้านใกล้เคียง · รสชาติและคุณภาพแตกต่างกัน ควรดูรีวิวก่อน', s: 'sec', src: [L.alishanFood], q: 'Alishan restaurant mountain vegetables' },
  { id: 'f10', n: 'Mafei Restaurant (YUYUPAS)', z: 'อาลีซาน', tags: ['sit', 'tea'], dish: 'อาหาร ชาและกาแฟบนเขา', note: 'อยู่ในสวนวัฒนธรรม YUYUPAS สูงราว 1,300 ม. มีไร่ชาและกาแฟ รีวิวชมบรรยากาศ · ไกลจากย่านสถานีอาลีซาน ไม่ได้อยู่ในเส้นทางของเรา', s: 'sec', src: [L.alishanFood], q: 'Mafei Restaurant YUYUPAS Alishan' },
  { id: 'f11', n: 'ข้าวกล่องรถไฟเฟิ่นฉีหู', z: 'อาลีซาน', tags: ['rice', 'snack'], dish: 'ข้าวกล่องรถไฟ', note: 'ไกด์จัดเป็นของที่ควรลอง · บัส 7329 รอบที่ผ่านเฟิ่นฉีหูอาจแวะได้ แต่ยังไม่ยืนยันว่ามีเวลาจอดพอซื้อ', s: 'no', src: [L.alishanFood], q: 'Fenqihu railway lunchbox' },

  // ---------- SML ----------
  { id: 'f12', n: 'ถนนช้อปปิ้ง/ตลาดอีต้าเส้า (Ita Thao Old Street)', z: 'SML', tags: ['night', 'snack', 'native'], dish: 'หมูป่าย่าง ของกินชนเผ่าเส้า และเมนูสร้างสรรค์', note: 'ไกด์เรียกว่าเป็นย่านตลาดที่มีธีมชนเผ่าที่สุดของ SML · มีคำเตือนว่าราคาร้านอาหารสูงกว่าเมืองใหญ่ เพราะนักท่องเที่ยวค้างคืนไม่มีทางเลือกมาก', s: 'sec', src: [L.itaThao, L.smlStreet], day: 'D2', meal: 'เย็น', q: 'Ita Thao Old Street Sun Moon Lake' },
  { id: 'f13', n: 'Mann Gay Dan', z: 'SML', tags: ['native', 'sit'], dish: 'กุ้งน้ำจืด หมูป่าย่าง ปลาจากทะเลสาบ', note: 'ร้านอาหารชนเผ่าเส้าที่เป็นร้านเดียวที่ผมเจอชื่อเฉพาะ ตั้งอยู่ที่อีต้าเส้า · เปิด-ปิดและราคาไม่ยืนยัน', s: 'sec', src: [L.smlFood], day: 'D2', meal: 'เย็น', q: 'Mann Gay Dan Ita Thao' },
  { id: 'f14', n: 'หมูป่าย่างอีต้าเส้า', z: 'SML', tags: ['native', 'snack'], dish: 'หมูป่าย่างไฟ', note: 'อาหารหลักของชนเผ่าเส้า หาได้ตามแผงริมทางและร้านในหมู่บ้านอีต้าเส้า', s: 'sec', src: [L.itaThao], q: 'Ita Thao grilled wild boar' },
  { id: 'f15', n: 'ชาดำ SML', z: 'SML', tags: ['tea'], dish: 'ชาดำ (ชาอัสสัม) พื้นที่', note: 'ไกด์จัดเป็นของขึ้นชื่อท้องถิ่น พร้อมผักภูเขา · ไม่ได้ระบุร้านเจาะจง', s: 'sec', src: [L.itaThao], q: 'Sun Moon Lake black tea' },
  { id: 'f16', n: 'ย่านสุ่ยเซอ (Shuishe business circle)', z: 'SML', tags: ['night', 'sit'], dish: 'ร้านอาหารหลากหลาย', note: 'เป็นศูนย์กลางนักท่องเที่ยวของ SML ตอนค่ำมีร้านให้เลือกหลากหลาย · เหมาะถ้าบัสจอดที่สุ่ยเซอและยังไม่ได้ไปอีต้าเส้า', s: 'sec', src: [L.smlFood], q: 'Shuishe Sun Moon Lake restaurants' },

  // ---------- ไทเป ----------
  { id: 'f17', n: 'Ay-Chung Flour-Rice Noodle (อาจ๋งหมี่ซั่ว)', z: 'ไทเป', tags: ['rice', 'snack'], dish: 'หมี่ซั่วหมี่เส้นเล็กข้นหนืด', note: 'เลขที่ 8-1 ถนนเอ๋อเหมย ซีเหมินติง เปิดมาตั้งแต่ปี 1975 ตามไกด์ · ไม่มีที่นั่ง ยืนกิน รสจัด คนแบ่งความเห็นว่าอร่อยหรือเกินจริง', s: 'sec', src: [L.ayChung, L.ximending], day: 'D5', meal: 'กลางวัน', q: 'Ay-Chung Flour-Rice Noodle Ximending' },
  { id: 'f18', n: 'Hot-Star Fried Chicken (ซีเหมินติง)', z: 'ไทเป', tags: ['snack'], dish: 'ไก่ทอดชิ้นใหญ่', note: 'แหล่งหนึ่งระบุเลขที่ 104 ถนนฮั่นจง เปิด 12:00–22:00 แต่อีกไกด์บอกว่าปิดไปแล้วและแนะนำ MONGA แทน · ยังไม่ยืนยันว่ายังเปิดไหม', s: 'no', src: [L.ximending], q: 'Hot-Star Fried Chicken Ximending' },
  { id: 'f19', n: 'MONGA', z: 'ไทเป', tags: ['snack'], dish: 'ไก่ทอด นักเก็ตไก่ไม่มีกระดูก', note: 'ไกด์แนะนำเป็นทางเลือกแทน Hot-Star ในย่านซีเหมินติง', s: 'sec', src: [L.ximending], q: 'MONGA fried chicken Ximending' },
  { id: 'f20', n: 'Shi Yun Taiwanese Fried Chicken', z: 'ไทเป', tags: ['snack', 'night'], dish: 'ไก่ทอดไต้หวัน', note: 'อยู่ในรายการแถวซีเหมินติง/ตลาดกลางคืนซื่อต้า (ข้อมูลอื่นยังไม่ยืนยัน)', s: 'no', src: [L.ximending], q: 'Shi Yun Taiwanese Fried Chicken Taipei' },
  { id: 'f21', n: 'Din Tai Fung', z: 'ไทเป', tags: ['sit', 'rice'], dish: 'เสี่ยวหลงเปา (ซุปติ่มซำ)', note: 'ไกด์เตือนว่าสาขา Taipei 101 รอ 1–2 ชม. ช่วงแน่น แนะนำสาขาอื่นในไทเป · ยังไม่ได้เลือกสาขา', s: 'sec', src: [L.taipeiFood], q: 'Din Tai Fung Taipei' },
  { id: 'f22', n: 'Lao Shan Dong (ก๋วยเตี๋ยวเนื้อ)', z: 'ไทเป', tags: ['rice'], dish: 'ก๋วยเตี๋ยวเนื้อตุ๋น', note: 'ไกด์แนะนำเป็นร้านก๋วยเตี๋ยวเนื้อของไต้หวัน · รีวิวหนึ่งบอกน้ำซุปสไตล์ซีอิ๊ว-โป๊ยกั๊กค่อนข้างหนัก ขึ้นกับรสนิยม', s: 'sec', src: [L.taipeiFood, L.taipei48], q: 'Lao Shan Dong beef noodles Taipei' },
  { id: 'f23', n: 'Liu Shandong beef noodles', z: 'ไทเป', tags: ['rice'], dish: 'ก๋วยเตี๋ยวเนื้อ', note: 'ถูกกล่าวถึงในไกด์กินไทเป ข้อมูลอื่นยังไม่ยืนยัน', s: 'no', src: [L.taipeiFood], q: 'Liu Shandong beef noodles Taipei' },
  { id: 'f24', n: 'Yongkang Beef Noodles', z: 'ไทเป', tags: ['rice'], dish: 'ก๋วยเตี๋ยวเนื้อ', note: 'หลายไกด์กล่าวถึง · ข้อมูลอื่นยังไม่ยืนยัน', s: 'no', src: [L.taipeiFood], q: 'Yongkang Beef Noodles Taipei' },
  { id: 'f25', n: 'Fu Hang Soy Milk', z: 'ไทเป', tags: ['morning'], dish: 'นมถั่วเหลืองเค็มกับแป้งทอด', note: 'ไกด์แนะนำเป็นอาหารเช้าอันดับต้น ๆ จุดเด่นคือนมถั่วเหลืองเค็ม · ไม่ได้เช็คเวลาเปิดและสาขา', s: 'sec', src: [L.taipeiFood], q: 'Fu Hang Soy Milk Taipei' },
  { id: 'f26', n: 'Yonghe Soy Milk King', z: 'ไทเป', tags: ['morning'], dish: 'นมถั่วเหลืองและอาหารเช้า', note: 'ยอดนิยม แต่ไกด์หนึ่งบอกสู้ร้านดั้งเดิมไม่ได้', s: 'sec', src: [L.taipeiFood], q: 'Yonghe Soy Milk King Taipei' },
  { id: 'f27', n: 'ตลาดกลางคืนเหราเหอ (Raohe)', z: 'ไทเป', tags: ['night'], dish: 'ตลาดกลางคืนสำหรับมือใหม่', note: 'ไกด์แนะนำเป็นตลาดที่ไปง่ายสุดสำหรับคนมาครั้งแรก', s: 'sec', src: [L.taipeiFood], q: 'Raohe Night Market Taipei' },
  { id: 'f28', n: 'ตลาดกลางคืนซื่อหลิน (Shilin)', z: 'ไทเป', tags: ['night'], dish: 'ตลาดใหญ่และดังที่สุด มีฟู้ดคอร์ตใต้ดินฝั่งตะวันตก', note: 'ไม่อยู่ในแผน · ใช้เป็นตัวเลือกถ้าอยากกินตลาดกลางคืนในไทเปวันศุกร์/เสาร์', s: 'sec', src: [L.taipeiFood], q: 'Shilin Night Market Taipei' },

  // ---------- อูไหล ----------
  { id: 'f29', n: 'ถนนเก่าอูไหล (Wulai Old Street)', z: 'อูไหล', tags: ['native', 'snack'], dish: 'ไส้กรอกหมูป่า ข้าวหลามไม้ไผ่ มันภูเขา เหล้าข้าวฟ่าง', note: 'ส่วนใหญ่เป็นแผงริมทาง ไม่ใช่ร้านนั่งกิน · ไกด์หนึ่งบอกแผงส่วนใหญ่เปิด 10:00–18:00 จึงควรกินช่วงเย็นต้น ๆ ไม่ใช่ค่ำ · เลี่ยงช่วงมื้อและวันหยุดเพราะคนต่อคิว', s: 'sec', src: [L.wulai, L.wulai2], day: 'D3', meal: 'เย็น', q: 'Wulai Old Street' },
  { id: 'f30', n: 'Taiya Po Po (อูไหล)', z: 'อูไหล', tags: ['sit', 'native'], dish: 'อาหารชนเผ่าอาตายัล', note: 'ร้านนั่งกินที่ผู้เขียนบล็อกปี 2013 แนะนำ · ข้อมูลเก่ามาก ยังไม่ยืนยันว่ายังเปิดอยู่', s: 'no', src: [L.wulai], q: 'Taiya Po Po Wulai' },

  // ---------- จีหลง ----------
  { id: 'f31', n: 'ตลาดกลางคืนเมี่ยวโข่ว จีหลง', z: 'จีหลง', tags: ['night', 'snack', 'sea'], dish: 'ของกินริมทางกว่า 100–200 แผง', note: 'จำนวนแผงแต่ละแหล่งไม่ตรงกัน · ในแผนไปช่วงค่ำ ซึ่งเป็นเวลาที่ตลาดกลางคืนเปิดเต็มที่', s: 'sec', src: [L.miaokou, L.miaokou2], day: 'D4', meal: 'เย็น', q: 'Keelung Miaokou Night Market' },
  { id: 'f32', n: 'ซุปปูข้น (Crab Thick Soup) เมี่ยวโข่ว', z: 'จีหลง', tags: ['sea', 'snack'], dish: 'ซุปปูข้น', note: 'ไกด์จัดเป็นของที่ต้องลองที่เมี่ยวโข่ว · แผงที่ขายอยู่ตรงไหนยังไม่ยืนยัน', s: 'sec', src: [L.miaokou2], day: 'D4', meal: 'เย็น', q: 'Miaokou crab thick soup Keelung' },
  { id: 'f33', n: 'กั๋วเปา (Gua Bao) เมี่ยวโข่ว', z: 'จีหลง', tags: ['snack'], dish: 'ซาลาเปาไส้หมูสามชั้น', note: 'ไกด์จัดเป็นของที่ต้องลอง', s: 'sec', src: [L.miaokou2], day: 'D4', meal: 'เย็น', q: 'Miaokou gua bao Keelung' },
  { id: 'f34', n: 'แซนด์วิชบำรุง (Nutritious Sandwich)', z: 'จีหลง', tags: ['snack'], dish: 'แซนด์วิชทอด', note: 'หลายแหล่งจัดเป็นเมนูเด่น บล็อกหนึ่งระบุแผงเลข 58 แต่บอกว่าไม่ได้อร่อยเกินคาด · ปรับความคาดหวังไว้', s: 'sec', src: [L.miaokou2], day: 'D4', meal: 'เย็น', q: 'Miaokou nutritious sandwich Keelung' },
  { id: 'f35', n: 'ติ่งเปียนฉั่ว และ เพาเพาปิง', z: 'จีหลง', tags: ['rice', 'sweet'], dish: 'ติ่งเปียนฉั่ว / เพาเพาปิง (ชื่อเมนูตามรายการที่ค้นเจอ)', note: 'มีในรายการเมนูของตลาด ข้อมูลร้านยังไม่ยืนยัน', s: 'no', src: [L.miaokou], q: 'Miaokou ding bian cuo Keelung' },

  // ---------- จิ่วเฟิ่น ----------
  { id: 'f36', n: 'A-Gan-Yi (อาก้านอี๋) ลูกชิ้นเผือก', z: 'จิ่วเฟิ่น', tags: ['sweet', 'snack'], dish: 'ลูกชิ้นเผือกและมันเทศ ปั้นด้วยมือ', note: 'มีในรายการ Michelin Guide · แหล่งข้อมูลให้ที่อยู่ไม่ตรงกัน (ถนนจีซานเลขที่ 9 หรือถนนซูฉีเลขที่ 5) ให้ดูแผนที่ยืนยันหน้างาน', s: 'sec', src: [L.agy, L.jiufen], day: 'D4', meal: 'กลางวัน', q: 'A-Gan-Yi taro balls Jiufen' },
  { id: 'f37', n: 'Grandma Lai (ลายอาโผ่) ลูกชิ้นเผือก', z: 'จิ่วเฟิ่น', tags: ['sweet'], dish: 'ลูกชิ้นเผือก เนื้อแน่นหนึบกว่า', note: 'ร้านลูกชิ้นเผือกยอดนิยมอีกร้านคู่กับ A-Gan-Yi', s: 'sec', src: [L.jiufen], q: 'Grandma Lai taro balls Jiufen' },
  { id: 'f38', n: 'A-Zhu Peanut Ice Cream Roll', z: 'จิ่วเฟิ่น', tags: ['sweet', 'snack'], dish: 'ไอศกรีมถั่วลิสงม้วนแป้งห่อผักชี', note: 'เลขที่ 20 ถนนจีซาน · บางร้านใช้เป็นแป้งมันแทนไอศกรีมนม ไม่ใช่ไอศกรีมนมเสมอไป', s: 'sec', src: [L.azhu, L.peanut], day: 'D4', meal: 'กลางวัน', q: 'A-Zhu Peanut Ice Cream Roll Jiufen' },
  { id: 'f39', n: 'ลูกชิ้นปลาจางจี และจินจือ', z: 'จิ่วเฟิ่น', tags: ['snack', 'sea'], dish: 'ลูกชิ้นปลา / ลูกชิ้นเนื้อ', note: 'ไกด์ระบุว่าเป็นแผงดังบนถนนเก่า (Zhang Ji ลูกชิ้นปลา, Jin Zhi ลูกชิ้นเนื้อ) · มีร้านซุปปลา Grandma\'s Fish Soup ใกล้ทางเข้า', s: 'sec', src: [L.jiufen], q: 'Jiufen fish ball soup Zhang Ji' },
  { id: 'f40', n: 'A-Mei Tea House (อาเหมยเฉิงฉือ)', z: 'จิ่วเฟิ่น', tags: ['tea', 'sit'], dish: 'ชาและขนม วิวทะเล', note: 'ร้านน้ำชาแลนด์มาร์กของจิ่วเฟิ่น ชื่อดังเรื่องวิวทะเลและถูกโยงกับเรื่อง Spirited Away · ไม่ได้เช็คเวลาเปิดและคิว', s: 'sec', src: [L.jiufen2], q: 'A-Mei Tea House Jiufen' },
];
