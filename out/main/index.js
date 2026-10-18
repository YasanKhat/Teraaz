"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Database = require("better-sqlite3");
const fs = require("node:fs");
const path$1 = require("node:path");
const icon = path.join(__dirname, "../../resources/icon.png");
let litDb = null;
let usrDb = null;
function projectRoot() {
  return electron.app.isPackaged ? process.resourcesPath : process.cwd();
}
function getDb() {
  if (!litDb) {
    const p = path$1.join(projectRoot(), "resources", "db", "literature.db");
    if (!fs.existsSync(p)) {
      console.error("[DB] LITERATURE_DB_MISSING at", p);
      throw new Error(
        "[DB] literature.db not found — run: node tools/run-with-electron-node.mjs tools/seed/build-db.mjs"
      );
    }
    litDb = new Database(p);
    litDb.pragma("journal_mode = WAL");
    litDb.pragma("foreign_keys = ON");
    console.log("[DB] LITERATURE_OK", p);
  }
  return litDb;
}
function getUserDb() {
  if (!usrDb) {
    const dir = electron.app.getPath("userData");
    fs.mkdirSync(dir, { recursive: true });
    const p = path$1.join(dir, "user.db");
    usrDb = new Database(p);
    usrDb.pragma("journal_mode = WAL");
    usrDb.pragma("foreign_keys = ON");
    const hasSettings = usrDb.prepare(
      `SELECT COUNT(*) AS c FROM sqlite_master
 WHERE type = 'table' AND name = 'settings'`
    ).get().c;
    if (hasSettings === 0) {
      const schemaPath = path$1.join(projectRoot(), "database", "schema.user.sql");
      if (fs.existsSync(schemaPath)) {
        usrDb.exec(fs.readFileSync(schemaPath, "utf-8"));
        console.log("[DB] USER_DB_CREATED from database/schema.user.sql");
      } else {
        console.error("[DB] USER_SCHEMA_MISSING at", schemaPath);
      }
    }
    usrDb.exec(
      `CREATE TABLE IF NOT EXISTS notes (
 id INTEGER PRIMARY KEY,
 target_id INTEGER NOT NULL UNIQUE,
 body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
 );
 CREATE INDEX IF NOT EXISTS idx_notes_time ON notes(updated_at);`
    );
    console.log("[DB] USER_OK", p);
  }
  return usrDb;
}
function closeDb() {
  try {
    litDb?.close();
  } catch {
  }
  try {
    usrDb?.close();
  } catch {
  }
  litDb = null;
  usrDb = null;
  console.log("[DB] CLOSED");
}
function dbHealthCheck() {
  const verses = getDb().prepare(`SELECT COUNT(*) AS c FROM contents WHERE type IN (1, 3, 7)`).get().c;
  let poemFont = "nastaliq";
  try {
    const row = getUserDb().prepare(`SELECT value FROM settings WHERE key = 'poem_font'`).get();
    if (row) poemFont = JSON.parse(row.value);
  } catch {
  }
  return { verses, poemFont };
}
const FORMS = [
  { "key": "ghazal", "title": "غزل", "category": "nazm", "unitMisraCount": 2, "hasBand": false, "description": "غزل از دلِ تغزلِ قصیده زاده شد: قالبی کوتاه (معمولاً ۵ تا ۱۵ بیت) که مصراعِ آغازین با همه‌ی مصراع‌های زوج هم‌قافیه است (الف‌الف / ب‌الف / ج‌الف) و تخلص معمولاً در بیتِ پایانی می‌آید؛ نخست برای عشق بود، سپس با سنایی و عطار رنگِ عرفان گرفت و با حافظ به اوج پیوندِ عشق، عرفان و نقد رسید. سرآمدان: حافظ، سعدی، مولانا، صائب؛ و در معاصر: شهریار، ابتهاج و منزوی." },
  { "key": "qasida", "title": "قصیده", "category": "nazm", "unitMisraCount": 2, "hasBand": false, "description": "کهن‌ترین قالبِ بلندِ شعر فارسی (از ادبیات عرب) با معمولاً بیش از پانزده بیت؛ مصراعِ آغازین با همه‌ی مصراع‌های زوج هم‌قافیه است. اجزایش: تغزل یا تشبیب، تخلص (بیتِ رابط)، تنه‌ی اصلی (مدح، مرثیه یا حکمت) و دعای پایانی. سرآمدان: رودکی، عنصری، فرخی، خاقانی، ناصرخسرو و ملک‌الشعرای بهار." },
  { "key": "masnavi", "title": "مثنوی", "category": "nazm", "unitMisraCount": 2, "hasBand": false, "description": "به معنای «دوتایی»: در هر بیت هر دو مصراع هم‌قافیه‌اند و بیتِ بعد قافیه‌ای تازه می‌گیرد (الف‌الف / ب‌ب / ج‌ج) تا شاعر بتواند قصه‌های دراز بگوید؛ سقفی برای بلندی ندارد (شاهنامه نزدیک به شصت‌هزار بیت است). مضمون: حماسه و تاریخ (شاهنامه)، عاشقانه (خسرو و شیرین)، عرفان و تعلیم (مثنوی معنوی، منطق‌الطیر). سرآمدان: فردوسی، نظامی، مولانا، عطار." },
  { "key": "robaei", "title": "رباعی", "category": "nazm", "unitMisraCount": 4, "hasBand": false, "description": "قالبی کاملاً ایرانی و موجز: چهار مصرع که یک، دو و چهارم هم‌قافیه‌اند (قافیه‌ی مصراعِ سوم اختیاری است)؛ فقط در وزنِ اختصاصیِ رباعی («لا حول و لا قوه الا بالله») و زحافاتش سروده می‌شود و ضربه‌ی اصلی در مصراعِ پایانی وارد می‌آید. استادِ مسلم: خیام؛ و دیگران: ابوسعید ابوالخیر و عطار." },
  { "key": "qete", "title": "قطعه", "category": "nazm", "unitMisraCount": 2, "hasBand": false, "description": "مثل تکه‌ای از وسطِ قصیده: بی‌مقدمه وارد اصلِ مطلب می‌شود؛ مصراعِ نخست با مصراع‌های زوج هم‌قافیه نیست و فقط مصراع‌های زوج قافیه دارند (الف‌ب / ج‌ب / د‌ب)؛ دست‌کم دو بیت است. برای پند و اندرز، حکایتِ کوتاه و ماده‌تاریخ؛ بر پایه‌ی منطق است، نه شورِ عاشقانه. سرآمدان: انوری، ابن یمین، سعدی و پروین اعتصامی." },
  { "key": "dobeiti", "title": "دوبیتی", "category": "nazm", "unitMisraCount": 4, "hasBand": false, "description": "خواهرِ دوقلوی رباعی با همان چیدمانِ قافیه اما در وزنی دیگر («مفاعیلن مفاعیلن فعولن») که ریتمی نرم‌تر و عامیانه‌تر دارد؛ به آن «فهلویات» هم می‌گفتند. مضمونش سوزِ دل، عشق‌های ساده‌ی محلی و غمِ غربت است و زبانش به محاوره نزدیک. سرآمدان: باباطاهر عریان و فایز دشتی." },
  { "key": "chahar_pareh", "title": "چهارپاره", "category": "nazm", "unitMisraCount": 4, "hasBand": true, "description": "چهارپاره (دوبیتیِ پیوسته): بندهای چهار‌مصراعیِ پیاپی که در هر بند فقط مصراعِ دوم و چهارم هم‌قافیه‌اند و بندِ بعد با قافیه‌ای تازه آغاز می‌شود؛ پس از مشروطه برای گریز از محدودیتِ قافیه‌ی غزل به وجود آمد. سرآمدان: فریدون توللی، فریدون مشیری و فروغ فرخزاد (در آغازِ راه)." },
  { "key": "tarji_band", "title": "ترجیع‌بند", "category": "nazm", "unitMisraCount": 2, "hasBand": true, "description": "مجموعه‌ای از چند بندِ غزل‌گونه که با یک بیتِ رابطِ ثابت، «ترجیع»، به هم می‌پیوندند؛ همان بیت پس از هر بند عیناً تکرار می‌شود. نمونه‌ی جاودانه: ترجیع‌بند هاتف اصفهانی. ثبت در فانوس: بدنه‌ها is_band=0 و سطر ترجیع is_band=1 و band_index=شماره‌ی بند." },
  { "key": "tarkib_band", "title": "ترکیب‌بند", "category": "nazm", "unitMisraCount": 2, "hasBand": true, "description": "خواهرِ ترجیع‌بند با یک فرقِ کلیدی: بیتِ رابطِ پایانِ هر بند تکرار نمی‌شود؛ هر بار بیتِ واسطِ تازه‌ای با قافیه‌ی مستقل می‌آید. نمونه‌ی جاودانه: ترکیب‌بند عاشورایی محتشم کاشانی." },
  { "key": "mosammat", "title": "مسمط (مخمس/مسدس/...)", "category": "nazm", "unitMisraCount": null, "hasBand": false, "description": "رشته‌های چندمصراعی: در هر رشته چند مصراع هم‌قافیه‌اند و مصراعِ پایانیِ رشته قافیه‌ای متفاوت دارد؛ اما مصراع‌های پایانیِ همه‌ی رشته‌ها با هم هم‌قافیه‌اند. سه‌مصراعی=مثلث، چهار=مربع، پنج=مخمس، شش=مسدس. ابداعش را به منوچهری دامغانی نسبت می‌دهند." },
  { "key": "mostazad", "title": "مستزاد", "category": "nazm", "unitMisraCount": 2, "hasBand": false, "description": "به معنای «زیاد شده»: شاعر یک غزل یا قصیده می‌نویسد و بخشِ کوتاهی به نام «زایده» به آن می‌افزاید؛ زایده‌ها خودشان هم‌قافیه‌اند و معنای مصراعِ اصلی را تکمیل می‌کنند یا طعنه‌اش می‌زنند. دو الگوی رایج دارد: زایده به‌جای/کنار مصرعِ دوم هر بیت (zayde_at=misra2 — مثل مستزاد مسعود سعد سلمان) و زایده پس از پایانِ بیت، زیر آن (zayde_at=beyt). در کلاسیک برای عرفان و مدح بود و در مشروطه تیزترین سلاحِ طنزِ سیاسی شد. سرآمدان: مسعود سعد سلمان، نسیم شمال، میرزاده عشقی و ملک‌الشعرای بهار." },
  { "key": "sher_now", "title": "شعر نو", "category": "nazm", "unitMisraCount": null, "hasBand": false, "description": "کلان‌قالبِ نوپس‌نیمایی: با نیما یوشیج قواعدِ هزارساله‌ی عروض و قافیه دگرگون شد و شعرِ معاصر به سه شاخه‌ی اصلی رسید — نیمایی، سپید و آزاد." },
  { "key": "sher_azad", "title": "شعر آزاد", "category": "nazm", "unitMisraCount": null, "hasBand": false, "description": "آزادی از همه‌ی قیدهای کلاسیک: نه تعهد به مصراعِ برابر، نه قانونِ عروض و قافیه؛ وزن و قافیه برای موسیقیِ شعر به کار می‌رود و هر سطر تمام‌عرض چاپ می‌شود. از پایه‌گذارانش هوشنگ ابتهاج (سایه) و سیاوش کسرایی‌اند." },
  { "key": "sher_nimai", "title": "شعر نیمایی", "category": "nazm", "unitMisraCount": null, "hasBand": false, "description": "وزنِ عروضی برقرار است اما شاعر مجبور نیست طولِ مصراع‌ها را برابر نگه دارد؛ هرجا حرفش تمام شد مصراع را می‌بندد. قافیه هم هست اما جای مشخصی ندارد. سرآمدان: نیما یوشیج، مهدی اخوان ثالث و سهراب سپهری." },
  { "key": "sher_sepid", "title": "شعر سپید", "category": "nazm", "unitMisraCount": null, "hasBand": false, "description": "وزنِ عروضی (ریتمِ مساوی) کاملاً کنار گذاشته می‌شود؛ شعر با منطقِ نثر و «موسیقیِ درونیِ واژگان» پیش می‌رود و قافیه هم الزامی نیست. استادِ مسلم: احمد شاملو." },
  { "key": "tasnif", "title": "تصنیف (ترانه)", "category": "nazm", "unitMisraCount": null, "hasBand": true, "description": "مرزِ پیوندِ شعر و موسیقی: کلمات از آغاز در آغوشِ ملودی و ریتم زاده می‌شوند، پس به‌جای عروضِ سنتی، «آهنگ و ضرب‌آهنگ» فرمان می‌راند و مصراع‌ها می‌توانند نابرابر باشند؛ ساختارش معمولاً چند «بند» است که با «بندگردان» (بخشِ تکرارشونده) به هم می‌پیوندند. دو دوره‌ی طلایی: عاشقانه‌های قاجاری (علی‌اکبر شیدا) و حماسیِ مشروطه (عارف قزوینی و ملک‌الشعرای بهار). در فانوس سطرها تمام‌عرض و بندگردان با کارتِ متمایز چاپ می‌شود." },
  { "key": "nasr", "title": "نثر", "category": "nasr", "unitMisraCount": null, "hasBand": false, "description": "نثر: گفتارِ آزاد از قافیه و وزن؛ در فانوس هر اثرِ نثری یک واحدِ یکپارچه است که اجزایش (بندها و شعرهای درون‌نثر) با ترتیبِ واقعیِ متن و با آجرهای ۰ تا ۸ چیده می‌شوند." },
  { "key": "tak_beyt", "title": "تک‌بیت (مفرد)", "category": "nazm", "unitMisraCount": 2, "hasBand": false, "description": "کوتاه‌ترین و مستقل‌ترین قالبِ شعر کلاسیک فارسی: کل شعر یک بیت (دو مصرع) است و تمام پیام شاعر در همان یک بیت می‌گنجد. برای بیان پند حکیمانه و ضرب‌المثل؛ دو گونه دارد: قافیه‌ی مصرع (الف-الف) و قافیه‌ی آزاد (الف-ب)." }
];
const FORMS_BY_KEY = Object.fromEntries(FORMS.map((f) => [f.key, f]));
FORMS.filter((f) => f.category === "nazm");
function formTitle(key) {
  return key && FORMS_BY_KEY[key]?.title || key || "";
}
const DEVICES = [
  // group: bayan (meaning/image arts)
  { "name": "تشبیه", "group": "علم بیان", "description": "مانند کردن چیزی به چیز دیگر؛ مثل «روی او چون ماه است»." },
  { "name": "استعاره", "group": "علم بیان", "description": "آوردن مشبه‌به به‌جای مشبه؛ مثل «شیری در میدان جنگید» (منظور پهلوان است)." },
  { "name": "تشخیص", "group": "علم بیان", "description": "جان‌بخشیدن و نسبت‌دادن حالات انسانی به غیرانسان؛ مثل گریه‌ی ابر." },
  { "name": "مجاز", "group": "علم بیان", "description": "به‌کاربردن کلمه در غیر معنای اصلی‌اش با وجود رابطه‌ای میان دو معنی؛ مثل «ایران پیروز شد» به‌جای «تیم ایران»." },
  { "name": "کنایه", "group": "علم بیان", "description": "جمله‌ای با معنای دور و نزدیک که منظور، معنای دور است؛ مثل «ریش‌سفید» کنایه از باتجربه." },
  // group: badi lafzi (sound/surface arts)
  { "name": "جناس تام", "group": "بدیع لفظی", "description": "دو کلمه با املای یکسان اما معنایی متفاوت؛ مثل شیرِ جنگل و شیرِ آب." },
  { "name": "جناس ناقص", "group": "بدیع لفظی", "description": "دو کلمه که فقط در یک حرف یا حرکت فرق دارند؛ مثل جام و کام / مِهر و مُهر." },
  { "name": "واج‌آرایی", "group": "بدیع لفظی", "description": "تکرار یک واج در بیت برای ساختن موسیقی؛ مثل «خیزید و خز آرید که هنگام خزان است»." },
  { "name": "تکرار", "group": "بدیع لفظی", "description": "تکرار یک کلمه در بیت برای تأکید و زیبایی." },
  { "name": "سجع", "group": "بدیع لفظی", "description": "قافیه‌دار بودن کلمات در نثر و جمله‌ها؛ مثل گلستان سعدی." },
  { "name": "موازنه و ترصیع", "group": "بدیع لفظی", "description": "تقابل و هم‌وزن بودن کلمات دو مصرع با یکدیگر؛ مثل «ای منور به تو نجوم جلال / وی مقرر به تو رسوم کمال»." },
  { "name": "رد القافیه", "group": "بدیع لفظی", "description": "تکرار قافیه‌ی مصراع اولِ غزل یا قصیده در پایان بیت دوم یا ابیات دیگر." },
  // group: badi manavi (meaning-relation arts)
  { "name": "مراعات النظیر", "group": "بدیع معنوی", "description": "آوردن کلماتی که اعضای یک مجموعه‌اند؛ مثل ابر، باد، مه و خورشید." },
  { "name": "تضاد", "group": "بدیع معنوی", "description": "آوردن کلمات متضاد در یک بیت؛ مثل شب و روز، سیاه و سفید." },
  { "name": "تناقض", "group": "بدیع معنوی", "description": "ترکیب دو مفهوم ناسازگار که در ظاهر غیرممکن است؛ مثل «فریادِ بی‌صدا» یا «پیدای پنهان»." },
  { "name": "ایهام", "group": "بدیع معنوی", "description": "کلمه‌ای که دو معنی دارد و هر دو معنی در شعر قابل برداشت است؛ مثل «بو» که هم رایحه می‌دهد هم آرزو." },
  { "name": "ایهام تناسب", "group": "بدیع معنوی", "description": "کلمه‌ای دو معنی که یک معنایش در شعر است و معنای دیگرش با واژه‌های دیگر بیت مراعات‌النظیر می‌سازد." },
  { "name": "تلمیح", "group": "بدیع معنوی", "description": "اشاره به یک داستان تاریخی، قرآنی، اسطوره‌ای یا حدیث؛ مثل اشاره به قصه‌ی یوسف و زلیخا." },
  { "name": "تضمین", "group": "بدیع معنوی", "description": "آوردن آیه، حدیث یا شعر شاعری دیگر در میان شعر خود." },
  { "name": "اغراق", "group": "بدیع معنوی", "description": "بزرگ‌نمایی بیش از حد در توصیف چیزی؛ مثل «ببارید چون سیل خون از نبرد»." },
  { "name": "حسن تعلیل", "group": "بدیع معنوی", "description": "آوردن دلیلی ادبی و غیرواقعی برای پدیده‌ای واقعی؛ مثل «باران می‌بارد چون آسمان به حال من می‌گرید»." },
  { "name": "حس‌آمیزی", "group": "بدیع معنوی", "description": "آمیختن دو حس از حواس پنج‌گانه؛ مثل «صدای تلخ» یا «نگاه سرد»." },
  { "name": "اسلوب معادله", "group": "بدیع معنوی", "description": "دو مصرع مستقل از هم که یکی مصداق و مثالی برای اثبات دیگری است." },
  { "name": "لف و نشر", "group": "بدیع معنوی", "description": "چند کلمه در یک مصرع و توضیح‌های مربوط به همان‌ها به ترتیب در مصرع بعد." },
  { "name": "استفهام انکاری", "group": "بدیع معنوی", "description": "پرسشی که هدفش جواب گرفتن نیست، بلکه تأکید بر نفی چیزی است؛ مثل «چه کسی زمان را نگه می‌دارد؟» یعنی هیچ‌کس." },
  { "name": "ارسال المثل", "group": "بدیع معنوی", "description": "به‌کاربردن یک ضرب‌المثل معروف در شعر، یا شعری که خود ضرب‌المثل شده است." }
];
[
  { name: "علم بیان", devices: DEVICES.filter((d) => d.group === "علم بیان").map((d) => d.name) },
  { name: "بدیع لفظی", devices: DEVICES.filter((d) => d.group === "بدیع لفظی").map((d) => d.name) },
  { name: "بدیع معنوی", devices: DEVICES.filter((d) => d.group === "بدیع معنوی").map((d) => d.name) }
];
const DEVICES_BY_NAME = Object.fromEntries(DEVICES.map((x) => [x.name, x]));
const LINE_LAYOUT_FORMS = /* @__PURE__ */ new Set([
  "sher_now",
  "sher_azad",
  "sher_nimai",
  "sher_sepid",
  "tasnif"
]);
function misrasOf(formKey, v) {
  const out = [];
  const bodyKind = LINE_LAYOUT_FORMS.has(formKey) ? "line" : "hemistich";
  if (v.misra1) out.push({ text: v.misra1, kind: bodyKind });
  if (v.zayde && v.zayde_at === "misra1") out.push({ text: v.zayde, kind: "zayde" });
  if (v.misra2) out.push({ text: v.misra2, kind: bodyKind });
  if (v.zayde && (v.zayde_at === "misra2" || v.zayde_at === "beyt"))
    out.push({ text: v.zayde, kind: "zayde" });
  return out;
}
function crumbOf(db, sectionId) {
  if (sectionId == null) return null;
  const stmt = db.prepare("SELECT id, parent_id, title FROM sections WHERE id = ? AND is_work = 0");
  const chain = [];
  let cur = sectionId;
  let guard = 0;
  while (cur != null && guard++ < 32) {
    const row = stmt.get(cur);
    if (!row) return chain.length ? chain.reverse().join(" / ") : null;
    chain.push(row.title);
    cur = row.parent_id;
  }
  return chain.reverse().join(" / ");
}
let _metaStmt = null;
const metaStmt = () => {
  if (!_metaStmt) {
    _metaStmt = getDb().prepare(
      "SELECT id, value1, value2 FROM meta_data WHERE target_id = ? AND meta_type = ? ORDER BY id"
    );
  }
  return _metaStmt;
};
function metaVal(db, targetId, type) {
  const r = metaStmt().get(String(targetId), type);
  return r?.value1 ?? null;
}
function metaAll(db, targetId, type) {
  return metaStmt().all(String(targetId), type);
}
function metaWords(db, anchorId) {
  return metaAll(db, anchorId, "Word").filter((x) => x.value1).map((x) => ({ word_id: x.id, word: x.value1, meaning_in_context: x.value2 ?? "", general_meaning: null }));
}
function metaDevices(db, anchorId) {
  return metaAll(db, anchorId, "Device").filter((x) => x.value1).map((x) => ({
    device_id: x.id,
    name: x.value1,
    category: DEVICES_BY_NAME[x.value1]?.group ?? null,
    description: DEVICES_BY_NAME[x.value1]?.description ?? null,
    explanation: x.value2 ?? null
  }));
}
function metaRhyme(db, anchorId) {
  return metaVal(db, anchorId, "Rhyme");
}
function meterOfWork(db, workId) {
  const direct = metaVal(db, String(workId), "Meter");
  if (direct) return direct;
  const r = db.prepare(
    `SELECT m.value1 AS v FROM meta_data m
 JOIN contents g ON g.id = CAST(m.target_id AS INTEGER)
 WHERE m.meta_type = 'Meter' AND m.value1 IS NOT NULL AND g.section_id = ?
 ORDER BY g.order_index LIMIT 1`
  ).get(workId);
  return r?.v ?? null;
}
function metaMeaning(db, anchorId) {
  return metaVal(db, anchorId, "Meaning_Block");
}
function workMeta(db, workId) {
  const t = String(workId);
  return {
    form: metaVal(db, t, "Form"),
    meter: meterOfWork(db, workId),
    language: metaVal(db, t, "Language") ?? "فارسی",
    meaning: metaVal(db, t, "Meaning_Work"),
    tafsir: metaVal(db, t, "Tafsir_Work"),
    fal: metaVal(db, t, "Fal")
  };
}
function linesOfWork(db, workId) {
  return db.prepare("SELECT id, section_id, order_index, text, type FROM contents WHERE section_id = ? ORDER BY order_index").all(workId);
}
function assembleVerses(db, lines, formKey, bandOffset = 0) {
  const verses = [];
  let bandNo = bandOffset;
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i];
    if (![1, 3, 7].includes(row.type)) continue;
    let m2 = null;
    let m2Order = null;
    let zayde = null;
    let zaydeOrder = null;
    let zaydeType = null;
    for (let j = i + 1; j < lines.length; j++) {
      const nx = lines[j];
      if ([0, 1, 3, 7, 8].includes(nx.type)) break;
      if (nx.type === 2 || nx.type === 4) {
        m2 = nx.text;
        m2Order = nx.order_index;
      } else if (nx.type === 5 || nx.type === 6) {
        zayde = nx.text;
        zaydeOrder = nx.order_index;
        zaydeType = nx.type;
      }
    }
    let zaydeAt = null;
    if (zaydeType === 6) zaydeAt = "beyt";
    else if (zaydeType === 5) zaydeAt = m2 != null && zaydeOrder != null && m2Order != null && zaydeOrder < m2Order ? "misra1" : "misra2";
    const isBand = row.type === 3 ? 1 : 0;
    if (isBand) bandNo++;
    const v = {
      verse_id: row.id,
      order_index: row.order_index,
      meter_text: null,
      is_band: isBand,
      band_index: isBand ? bandNo : null,
      rhyme_text: metaRhyme(db, row.id),
      misra1: row.text,
      misra2: m2,
      zayde,
      zayde_at: zaydeAt,
      misras: [],
      meaning: metaMeaning(db, row.id)
    };
    v.misras = misrasOf(formKey, v);
    verses.push(v);
  }
  return verses;
}
const ANCHORS = [1, 3, 7];
function resolveAnchor(db, rowId) {
  const row = db.prepare("SELECT id, section_id, order_index, text, type FROM contents WHERE id = ?").get(rowId);
  if (!row) return void 0;
  if (ANCHORS.includes(row.type)) return row;
  return db.prepare(
    `SELECT id, section_id, order_index, text, type FROM contents
 WHERE section_id = ? AND order_index < ? AND type IN (1,3,7)
 ORDER BY order_index DESC LIMIT 1`
  ).get(row.section_id, row.order_index);
}
function getVerseDetail(verseId) {
  const db = getDb();
  const anchor = resolveAnchor(db, verseId);
  if (!anchor || !ANCHORS.includes(anchor.type)) return null;
  const work = db.prepare(
    `SELECT s.id AS poem_id, s.title AS poem_title, s.parent_id AS section_id, a.name AS author_name
 FROM sections s JOIN authors a ON a.id = s.author_id WHERE s.id = ? AND s.is_work = 1`
  ).get(anchor.section_id);
  if (!work) return null;
  const meta = workMeta(db, work.poem_id);
  const formKey = meta.form ?? "ghazal";
  const lines = linesOfWork(db, anchor.section_id);
  const start = lines.findIndex((l) => l.id === anchor.id);
  const v = assembleVerses(db, lines.slice(start), formKey)[0];
  if (!v) return null;
  return {
    verse_id: v.verse_id,
    order_index: v.order_index,
    meter_text: v.meter_text ?? meta.meter,
    rhyme_text: v.rhyme_text,
    misras: v.misras,
    poem_id: work.poem_id,
    poem_title: work.poem_title,
    crumb: crumbOf(db, work.section_id),
    author_name: work.author_name,
    simple_meaning: v.meaning,
    tafsir: metaVal(db, v.verse_id, "Tafsir_Block") ?? meta.tafsir,
    words: metaWords(db, v.verse_id),
    devices: metaDevices(db, v.verse_id)
  };
}
function getParagraphDetail(paragraphId) {
  const db = getDb();
  const p = db.prepare(
    `SELECT c.id, c.order_index, c.text, c.section_id,
 w.parent_id AS parent_folder, w.id AS work_id,
 a.name AS author_name
 FROM contents c
 JOIN sections w ON w.id = c.section_id AND w.is_work = 1
 JOIN authors a ON a.id = c.author_id
 WHERE c.id = ? AND c.type IN (0, 8)`
  ).get(paragraphId);
  if (!p) return null;
  const meta = workMeta(db, p.work_id);
  return {
    paragraph_id: p.id,
    order_index: p.order_index,
    text: p.text,
    crumb: crumbOf(db, p.parent_folder),
    author_name: p.author_name,
    simple_meaning: metaMeaning(db, p.id),
    tafsir: metaVal(db, p.id, "Tafsir_Block") ?? meta.tafsir,
    words: metaWords(db, p.id),
    devices: metaDevices(db, p.id)
  };
}
const POET_SELECT = `
 SELECT a.id, a.id AS code, a.name, a.pen_name, a.era,
 a.century AS century_shamsi, a.birth_year, a.death_year,
 a.birth_city AS birth_place, a.lat AS birth_lat, a.lng AS birth_lng, a.bio,
 (SELECT COUNT(*) FROM sections s WHERE s.author_id = a.id AND s.is_work = 0) AS sections_count,
 (SELECT COUNT(*) FROM sections s
 JOIN meta_data fm ON fm.target_id = CAST(s.id AS TEXT) AND fm.meta_type = 'Form'
 WHERE s.author_id = a.id AND s.is_work = 1 AND COALESCE(fm.value1, 'ghazal') <> 'nasr') AS poem_works,
 (SELECT COUNT(*) FROM sections s
 JOIN meta_data fm ON fm.target_id = CAST(s.id AS TEXT) AND fm.meta_type = 'Form'
 WHERE s.author_id = a.id AND s.is_work = 1 AND fm.value1 = 'nasr') AS nasr_works
 FROM authors a`;
const POET_ORDER = " ORDER BY a.century IS NULL, a.century, CAST(a.id AS INTEGER)";
function getPoets() {
  return getDb().prepare(POET_SELECT + POET_ORDER).all();
}
function getFeaturedPoets() {
  return getDb().prepare(
    `${POET_SELECT}
 JOIN meta_data pm ON pm.target_id = a.id AND pm.meta_type = 'Author_Tag' AND pm.value1 = 'Popular'
 ORDER BY pm.id`
  ).all();
}
function getPoetProfile(authorId) {
  const poet = getDb().prepare(`${POET_SELECT} WHERE a.id = ?`).get(authorId);
  return poet ? { poet } : null;
}
function getPoetTree(authorId) {
  const db = getDb();
  const author = db.prepare("SELECT id, id AS code, name, pen_name FROM authors WHERE id = ?").get(authorId);
  if (!author) return null;
  const descCol = db.prepare(`SELECT COUNT(*) AS c FROM pragma_table_info('sections') WHERE name = 'description'`).get().c === 1;
  const sections = db.prepare(
    `SELECT id, parent_id, title, ${descCol ? "description" : "NULL AS description"}, order_index
 FROM sections WHERE author_id = ? AND is_work = 0 ORDER BY order_index, id`
  ).all(authorId);
  const totalStmt = db.prepare(
    `WITH RECURSIVE sub(id) AS (
 SELECT id FROM sections WHERE id = ?
 UNION ALL
 SELECT s.id FROM sections s JOIN sub ON s.parent_id = sub.id
 )
 SELECT COUNT(*) AS c FROM sections w WHERE w.is_work = 1 AND w.id IN (SELECT id FROM sub)`
  );
  const sectionRows = sections.map((s) => ({
    ...s,
    works_total: totalStmt.get(s.id).c
  }));
  const works = db.prepare(
    `SELECT s.id AS work_id, s.parent_id AS section_id, s.title, s.order_index, fm.value1 AS form,
 (SELECT g.text FROM contents g WHERE g.section_id = s.id AND g.type IN (1,3,7) ORDER BY g.order_index LIMIT 1) AS first_poem,
 (SELECT g.text FROM contents g WHERE g.section_id = s.id AND g.type = 0 ORDER BY g.order_index LIMIT 1) AS first_prose,
 (SELECT COUNT(*) FROM contents g WHERE g.section_id = s.id AND g.type IN (1,3,7)) AS poem_units,
 (SELECT COUNT(*) FROM contents g WHERE g.section_id = s.id AND g.type IN (0,8)) AS prose_units
 FROM sections s
 LEFT JOIN meta_data fm ON fm.target_id = CAST(s.id AS TEXT) AND fm.meta_type = 'Form'
 WHERE s.author_id = ? AND s.is_work = 1
 ORDER BY s.order_index, s.id`
  ).all(authorId);
  const workRows = works.map((w) => {
    const isNasr = (w.form ?? "ghazal") === "nasr";
    return {
      work_id: w.work_id,
      section_id: w.section_id,
      kind: isNasr ? "prose" : "poem",
      poem_id: isNasr ? null : w.work_id,
      title: w.title,
      order_index: w.order_index,
      units_count: isNasr ? w.prose_units : w.poem_units,
      preview: isNasr ? w.first_prose ? w.first_prose.slice(0, 90) : null : w.first_poem
    };
  });
  return { author, sections: sectionRows, works: workRows };
}
function getPoem(poemId) {
  const db = getDb();
  const head = db.prepare(
    `SELECT s.id, s.parent_id AS section_id, s.title, a.name AS author_name
 FROM sections s JOIN authors a ON a.id = s.author_id
 WHERE s.id = ? AND s.is_work = 1`
  ).get(poemId);
  if (!head) return null;
  const meta = workMeta(db, head.id);
  const formKey = meta.form ?? "ghazal";
  const lines = linesOfWork(db, head.id);
  const verses = assembleVerses(db, lines, formKey);
  const notes = lines.filter((l) => l.type === 0 || l.type === 8).map((l) => ({
    block_id: l.id,
    order_index: l.order_index,
    kind: l.type === 8 ? "note" : "prose",
    text: l.text,
    meaning: metaMeaning(db, l.id),
    tafsir: metaVal(db, l.id, "Tafsir_Block"),
    words: metaWords(db, l.id),
    devices: metaDevices(db, l.id)
  }));
  const fm = FORMS_BY_KEY[formKey];
  const meter = meta.meter ?? (verses.length ? verses.find((v) => v.meter_text)?.meter_text ?? null : null);
  return {
    poem_id: head.id,
    code: String(head.id),
    title: head.title,
    plain_prose: meta.meaning,
    verse_count: verses.length,
    form_key: formKey,
    form_title: fm?.title ?? formKey,
    form_description: fm?.description ?? null,
    unit_misra_count: fm?.unitMisraCount ?? null,
    has_band: lines.some((l) => l.type === 3) ? 1 : 0,
    meter_name: meter,
    bahr: meter,
    language_title: meta.language,
    crumb: crumbOf(db, head.section_id),
    author_name: head.author_name,
    tafsir: meta.tafsir,
    fal_meaning: meta.fal,
    verses,
    notes
  };
}
function getProseWork(workId) {
  const db = getDb();
  const work = db.prepare(
    `SELECT s.id AS work_id, s.parent_id AS section_id, s.title, a.name AS author_name
 FROM sections s JOIN authors a ON a.id = s.author_id
 WHERE s.id = ? AND s.is_work = 1`
  ).get(workId);
  if (!work) return null;
  const meta = workMeta(db, workId);
  const formKey = meta.form ?? "nasr";
  const lines = linesOfWork(db, workId);
  const parts = [];
  let chunk = [];
  let chunkStart = 0;
  let bandSeen = 0;
  const flushPoem = () => {
    if (!chunk.length) return;
    const verses = assembleVerses(db, chunk, formKey, bandSeen);
    bandSeen += chunk.filter((l) => l.type === 3).length;
    parts.push({ order_index: chunkStart, type: "poem", poem: { verses } });
    chunk = [];
  };
  for (const row of lines) {
    if (row.type === 0 || row.type === 8) {
      flushPoem();
      parts.push({
        order_index: row.order_index,
        type: "paragraph",
        paragraph: { paragraph_id: row.id, order_index: row.order_index, kind: row.type === 8 ? "note" : "prose", text: row.text, meaning: metaMeaning(db, row.id) }
      });
    } else {
      if (!chunk.length) chunkStart = row.order_index;
      chunk.push(row);
    }
  }
  flushPoem();
  return {
    work: {
      work_id: work.work_id,
      title: work.title,
      plain_prose: meta.meaning,
      crumb: crumbOf(db, work.section_id),
      author_name: work.author_name
    },
    parts
  };
}
function getSimilarPoems(poemId) {
  const db = getDb();
  const base = db.prepare("SELECT id, author_id FROM sections WHERE id = ? AND is_work = 1").get(poemId);
  if (!base) return [];
  const bMeta = workMeta(db, base.id);
  const form = bMeta.form ?? "ghazal";
  const meter = bMeta.meter;
  if (!meter) return [];
  return db.prepare(
    `SELECT DISTINCT s2.id AS poem_id, s2.title, fm.value1 AS form_key,
 a.id AS author_id, COALESCE(a.pen_name, a.name) AS author_name,
 mm.value1 AS bahr,
 sr.rhyme_count AS score, 1 AS same_meter, 1 AS same_rhyme, 1 AS same_form,
 sr.shared_rhyme,
 lead.text AS lead_misra1,
 (SELECT g2.text FROM contents g2 WHERE g2.section_id = s2.id AND g2.type IN (2,4)
 AND g2.order_index > lead.order_index ORDER BY g2.order_index LIMIT 1) AS lead_misra2
 FROM sections s2
 JOIN authors a ON a.id = s2.author_id
 JOIN meta_data fm ON fm.target_id = CAST(s2.id AS TEXT) AND fm.meta_type = 'Form' AND fm.value1 = ?
 JOIN meta_data mm ON mm.target_id = CAST(s2.id AS TEXT) AND mm.meta_type = 'Meter' AND mm.value1 = ?
 JOIN (
 SELECT g.section_id AS wid, COUNT(DISTINCT rm.value1) AS rhyme_count, MIN(rm.value1) AS shared_rhyme
 FROM meta_data rm JOIN contents g ON g.id = CAST(rm.target_id AS INTEGER)
 WHERE rm.meta_type = 'Rhyme' AND rm.value1 IS NOT NULL
 AND rm.value1 IN (
 SELECT rb.value1 FROM meta_data rb JOIN contents gb ON gb.id = CAST(rb.target_id AS INTEGER)
 WHERE gb.section_id = ? AND rb.meta_type = 'Rhyme' AND rb.value1 IS NOT NULL)
 GROUP BY g.section_id
 ) sr ON sr.wid = s2.id
 JOIN contents lead ON lead.id = (
 SELECT gl.id FROM contents gl
 JOIN meta_data rl ON rl.target_id = CAST(gl.id AS TEXT) AND rl.meta_type = 'Rhyme'
 WHERE gl.section_id = s2.id AND gl.type IN (1,3) AND rl.value1 IN (
 SELECT rb.value1 FROM meta_data rb JOIN contents gb ON gb.id = CAST(rb.target_id AS INTEGER)
 WHERE gb.section_id = ? AND rb.meta_type = 'Rhyme' AND rb.value1 IS NOT NULL)
 ORDER BY gl.order_index LIMIT 1
 )
 WHERE s2.is_work = 1 AND s2.id <> ? AND s2.author_id <> ?
 ORDER BY score DESC, s2.id
 LIMIT 6`
  ).all(form, meter, base.id, base.id, base.id, base.author_id).map((r) => ({ ...r, form_title: formTitle(r.form_key) }));
}
function getPoetStats(authorId) {
  const db = getDb();
  const totals = db.prepare(
    `SELECT
 (SELECT COUNT(*) FROM sections s JOIN meta_data fm ON fm.target_id = CAST(s.id AS TEXT) AND fm.meta_type='Form'
 WHERE s.author_id = ? AND s.is_work = 1 AND COALESCE(fm.value1,'ghazal') <> 'nasr') AS poems,
 (SELECT COUNT(*) FROM contents c WHERE c.author_id = ? AND c.type IN (1,3,7)) AS verses,
 (SELECT COUNT(DISTINCT mx.label) FROM (SELECT COALESCE(
 (SELECT m1.value1 FROM meta_data m1 WHERE m1.meta_type='Meter' AND m1.target_id=CAST(w.id AS TEXT) AND m1.value1 IS NOT NULL LIMIT 1),
 (SELECT m2.value1 FROM meta_data m2 JOIN contents g2 ON g2.id=CAST(m2.target_id AS INTEGER) WHERE m2.meta_type='Meter' AND m2.value1 IS NOT NULL AND g2.section_id=w.id ORDER BY g2.order_index LIMIT 1)
 ) AS label FROM sections w WHERE w.author_id = ? AND w.is_work = 1) mx WHERE mx.label IS NOT NULL) AS meters,
 (SELECT COUNT(DISTINCT fm2.value1) FROM sections s2
 JOIN meta_data fm2 ON fm2.target_id = CAST(s2.id AS TEXT) AND fm2.meta_type='Form'
 WHERE s2.author_id = ? AND s2.is_work = 1 AND COALESCE(fm2.value1,'ghazal') <> 'nasr') AS forms`
  ).get(authorId, authorId, authorId, authorId);
  const byMeter = db.prepare(
    `SELECT label, COUNT(*) AS count
 FROM (SELECT COALESCE(
 (SELECT m1.value1 FROM meta_data m1 WHERE m1.meta_type='Meter' AND m1.target_id=CAST(w.id AS TEXT) AND m1.value1 IS NOT NULL LIMIT 1),
 (SELECT m2.value1 FROM meta_data m2 JOIN contents g2 ON g2.id=CAST(m2.target_id AS INTEGER) WHERE m2.meta_type='Meter' AND m2.value1 IS NOT NULL AND g2.section_id=w.id ORDER BY g2.order_index LIMIT 1)
 ) AS label FROM sections w WHERE w.author_id = ? AND w.is_work = 1) mx
 WHERE label IS NOT NULL
 GROUP BY label ORDER BY count DESC, label LIMIT 8`
  ).all(authorId);
  const byForm = db.prepare(
    `SELECT fm.value1 AS key, COUNT(*) AS count
 FROM sections s JOIN meta_data fm ON fm.target_id = CAST(s.id AS TEXT) AND fm.meta_type='Form'
 WHERE s.author_id = ? AND s.is_work = 1
 GROUP BY fm.value1 ORDER BY count DESC, key`
  ).all(authorId).map((r) => ({ label: formTitle(r.key), count: r.count }));
  return { ...totals, byMeter, byForm };
}
function normalize(s) {
  return (s ?? "").replace(/[ً-ٟـ]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/‌/g, " ").replace(/[«»()،؛:.\[\]!؟?"'…\-]/g, " ").replace(/\s+/g, " ").trim();
}
function normLoose(s) {
  return normalize(s ?? "").replace(/\s+/g, "");
}
const METER_NONE = "__none__";
const METER_CATALOG = [
  "تن متفاعلتن متفاعلتن",
  "فاعلُ فاعلُ فاعلُ فاعلُ فع",
  "فاعلات فاعلاتن فاعلات فاعلاتن(رمل مثمن مکفوف)",
  "فاعلات فع فاعلات فع",
  "فاعلات فع فاعلات فع فاعلات فع فاعلات فع",
  "فاعلات فعلن فاعلات فعلن",
  "فاعلات مفتعلن فاعلات مفتعلن",
  "فاعلات مفتعلن فعلن",
  "فاعلات مفعولن فاعلات مفتعلن",
  "فاعلات مفعولن فاعلات مفعولن",
  "فاعلاتن فاعلاتن",
  "فاعلاتن فاعلاتن فاعلاتن",
  "فاعلاتن فاعلاتن فاعلاتن فاعلاتن (رمل مثمن سالم)",
  "فاعلاتن فاعلاتن فاعلاتن فاعلن (رمل مثمن محذوف)",
  "فاعلاتن فاعلاتن فاعلاتن فاعلن فاعلاتن فاعلن",
  "فاعلاتن فاعلاتن فاعلاتن فع (رمل مثمن محجوف مطموس)",
  "فاعلاتن فاعلاتن فاعلاتن فعولن فاعلن",
  "فاعلاتن فاعلاتن فاعلن",
  "فاعلاتن فاعلاتن فاعلن (رمل مسدس محذوف یا وزن مثنوی)",
  "فاعلاتن فاعلاتن فع فاعلاتن",
  "فاعلاتن فاعلن فاعلاتن فاعلن",
  "فاعلاتن فع فاعلاتن فع",
  "فاعلاتن فع مفاعلتن",
  "فاعلاتن فعولن فعولن",
  "فاعلاتن مفاعلن فاعلاتن مفاعلن",
  "فاعلاتن مفاعلن فعلن",
  "فاعلن فاعلات مفتعلن",
  "فاعلن فاعلاتن فاعلن فاعلاتن",
  "فاعلن فاعلن فاعلاتن",
  "فاعلن فاعلن فاعلن",
  "فاعلن فاعلن فاعلن فاعلن",
  "فاعلن فاعلن فاعلن فع",
  "فاعلن فعل فاعلن فعل",
  "فاعلن فعل فاعلن فعل فاعلن فعل فاعلن فعل",
  "فاعلن مفاعل مفعولن",
  "فاعلن مفاعلن فع فاعلن مفاعلن فع",
  "فاعلن مفاعیلن فاعلن مفاعیلن (مقتضب مثمن مطوی مقطوع)",
  "فاعلن مفعولن فاعلن مفعولن",
  "فعلات فاعلاتن فعلات فاعلاتن (رمل مثمن مشکول)",
  "فعلات فاعلاتن فعلات فاعلن",
  "فعلات فاعلاتن فعلات فعلن",
  "فعلات فاعلاتن فعلات فع‌لن",
  "فعلات فع فعلات فع فعلات فع فعلات فع",
  "فعلات فع لن فعلات فع لن",
  "فعلات فعلن فعلات فعلن",
  "فعلات مستفعل فع فعلات مستفعل فع",
  "فعلاتن فاعلاتن فعلاتن فاعلاتن",
  "فعلاتن فعلاتن فعل",
  "فعلاتن فعلاتن فعلاتن",
  "فعلاتن فعلاتن فعلاتن فع",
  "فعلاتن فعلاتن فعلاتن فعلاتن (رمل مثمن مخبون)",
  "فعلاتن فعلاتن فعلاتن فعلن (رمل مثمن مخبون محذوف)",
  "فعلاتن فعلاتن فعلاتن فعلن فعلاتن فعلن",
  "فعلاتن فعلاتن فعلن (رمل مسدس مخبون محذوف)",
  "فعلاتن فعلن فعلاتن فعلن",
  "فعلاتن مفاعلن فع فعلاتن مفاعلن فع",
  "فعلاتن مفاعلن فعلاتن",
  "فعلاتن مفاعلن فعلاتن مفاعلن",
  "فعلاتن مفاعلن فعلن (خفیف مسدس مخبون)",
  "فعلن فعلن فعلن فعلن(متدارک مثمن مخبون)",
  "فعلن مفتعلن مفتعلن مفتعلن",
  "فعولن فعولن فعولن",
  "فعولن فعولن فعولن فعل (متقارب مثمن محذوف یا وزن شاهنامه)",
  "فعولن فعولن فعولن فعولن (متقارب مثمن سالم)",
  "فعولن فعولن فعولن فعولن فعولن",
  "فعولن فعولن فعولن فعولن فعولن فعل",
  "فعولن فعولن مفاعلن",
  "فعولن مفاعلن فعولن مفاعلن",
  "فعولن مفاعلن مفاعیلن",
  "فعولن مفاعیلن فعولن مفاعیلن",
  "فعولن مفاعیلن فعولن مفاعیلن (طویل مثمن سالم)",
  "متفاعلاتن متفاعلاتن",
  "متفاعلتن متفاعلتن",
  "متفاعلتن متفاعلتن متفاعلتن متفاعلتن",
  "متفاعلن فعلن متفاعلن فعلن",
  "متفاعلن فعولن متفاعلن فعولن",
  "متفاعلن متفاعلن",
  "متفاعلن متفاعلن متفاعلن",
  "متفاعلن متفاعلن متفاعلن متفاعلن",
  "متفاعلن مفتعلن متفاعلن مفتعلن",
  "متفعلن متفعلن متفعلن متفعلن",
  "مستفعلتن مستفعلتن",
  "مستفعلتن مفاعلن مفتعلن",
  "مستفعلن فاعلاتن مستفعلن فاعلاتن",
  "مستفعلن فع مستفعلن فاعلن",
  "مستفعلن فع مستفعلن فع (متقارب مثمن اثلم)",
  "مستفعلن فع مفاعلن فع",
  "مستفعلن فعلاتن فع",
  "مستفعلن فعلاتن مستفعلن فعلاتن",
  "مستفعلن فعلن مستفعلن فع",
  "مستفعلن فعلن مستفعلن فعلن (بسیط مخبون)",
  "مستفعلن فعولن مستفعلن فعولن",
  "مستفعلن مستفعلن",
  "مستفعلن مستفعلن فاعلن",
  "مستفعلن مستفعلن فع",
  "مستفعلن مستفعلن فعولن",
  "مستفعلن مستفعلن مستفعلن",
  "مستفعلن مستفعلن مستفعلن فع",
  "مستفعلن مستفعلن مستفعلن مستفعلن (رجز مثمن سالم)",
  "مستفعلن مستفعلن مفعولن",
  "مستفعلن مفعولن مستفعلن فع لن",
  "مفاعلاتن مفاعلاتن",
  "مفاعلتن مفاعلتن مفاعلتن مفاعلتن",
  "مفاعلن فاعلن مفاعلن فاعلن",
  "مفاعلن فع مفاعلن فع",
  "مفاعلن فع مفاعلن فع مفاعلن فع مفاعلن فع",
  "مفاعلن فع مفاعلن فعلن",
  "مفاعلن فعلاتن مفاعلن فعلاتن (مجتث مثمن مخبون)",
  "مفاعلن فعلاتن مفاعلن فعلن (مجتث مثمن مخبون محذوف)",
  "مفاعلن فعلن فاعلات مفتعلن",
  "مفاعلن فعولن مفاعلن فعولن",
  "مفاعلن مستفعل مفتعلن",
  "مفاعلن مفاعلن فاعلن",
  "مفاعلن مفاعلن مفاعلن",
  "مفاعلن مفاعلن مفاعلن مفاعلن",
  "مفاعلن مفعولن مفاعلن مفعولن",
  "مفاعیل فاعلات مفاعیل فاعلن",
  "مفاعیل فاعلات مفعول فاعلن",
  "مفاعیل فاعلن",
  "مفاعیل فعولن مفاعلن",
  "مفاعیل فعولن مفاعیل فعولن",
  "مفاعیل مفاعیل فاعلن",
  "مفاعیل مفاعیل فعولن",
  "مفاعیل مفاعیل مفاعیل فعولن",
  "مفاعیل مفاعیل مفاعیل فعولن (هزج مثمن مکفوف محذوف)",
  "مفاعیل مفتعلن فع مفاعیل مفتعلن فع",
  "مفاعیلن فاعلن مفاعیلن فع",
  "مفاعیلن فعولن مفاعیلن فعولن",
  "مفاعیلن مفاعیلن",
  "مفاعیلن مفاعیلن فعولن (هزج مسدس محذوف یا وزن دوبیتی)",
  "مفاعیلن مفاعیلن فعولن فعلاتن",
  "مفاعیلن مفاعیلن مفاعیلن",
  "مفاعیلن مفاعیلن مفاعیلن فعل",
  "مفاعیلن مفاعیلن مفاعیلن فعولن",
  "مفاعیلن مفاعیلن مفاعیلن مفاعیلن (هزج مثمن سالم)",
  "مفاعیلن مفاعیلن مفاعیلن مفاعیلن مفاعیلن مفاعیلن",
  "مفتعلات فاعلن مفتعلات فاعلن",
  "مفتعلن فاعلات مفتعلن",
  "مفتعلن فاعلات مفتعلن فع (منسرح مثمن مطوی منحور)",
  "مفتعلن فاعلن مفتعلن فاعلن (منسرح مطوی مکشوف)",
  "مفتعلن فع مفاعلن فع",
  "مفتعلن فع مفتعلن فع",
  "مفتعلن فع مفتعلن مفتعلن فع مفتعلن",
  "مفتعلن فع مفتعلن مفتعلن فع مفتعلن فع",
  "مفتعلن فع مفتعلن فع مفتعلن فع مفتعلن",
  "مفتعلن فعلاتن فعلن",
  "مفتعلن فع‌لن مفتعلن فع‌لن",
  "مفتعلن فعولن فعولن",
  "مفتعلن فعولن مفتعلن فعولن",
  "مفتعلن مفاعلن مفتعلن مفاعلن (رجز مثمن مطوی مخبون)",
  "مفتعلن مفتعلن فاعلن (سریع مطوی مکشوف)",
  "مفتعلن مفتعلن فاعلن فعل",
  "مفتعلن مفتعلن فع مفتعلن مفتعلن فع",
  "مفتعلن مفتعلن فعولن فعولن",
  "مفتعلن مفتعلن مستفعل مفعولن",
  "مفتعلن مفتعلن مفتعلن",
  "مفتعلن مفتعلن مفتعلن فع",
  "مفتعلن مفتعلن مفتعلن مفتعلن (رجز مثمن مطوی)",
  "مفتعلن مفتعلن مفعول مفاعیلن",
  "مفتعلن مفعولن مفتعلن مفعولن",
  "مفعول فاعلات فعل",
  "مفعول فاعلات فعولن",
  "مفعول فاعلات مفاعیل فاعلاتن",
  "مفعول فاعلات مفاعیل فاعلن (مضارع مثمن اخرب مکفوف محذوف)",
  "مفعول فاعلات مفاعیل فع",
  "مفعول فاعلات مفاعیلن",
  "مفعول فاعلات مفاعیلن (مضارع مسدس اخرب مکفوف)",
  "مفعول فاعلات مفعولن",
  "مفعول فاعلاتن مفاعیل فاعلاتن",
  "مفعول فاعلاتن مفاعیلن",
  "مفعول فاعلاتن مفعول فاعلاتن (مضارع مثمن اخرب)",
  "مفعول فاعلاتن مفعول فاعلن",
  "مفعول فاعلاتن مفعول فع",
  "مفعول فاعلاتن مفعولن",
  "مفعول فاعلن فعولن",
  "مفعول فاعلن مفعول فاعلن",
  "مفعول فعل مفعول فعل",
  "مفعول مفاعلتن فعلن",
  "مفعول مفاعلن فعولن (هزج مسدس اخرب مقبوض محذوف)",
  "مفعول مفاعلن مفاعلن فاع (هزج اخرب مقبوض ازل)",
  "مفعول مفاعلن مفاعیلن (هزج مسدس اخرب مقبوض)",
  "مفعول مفاعلن مفعول مفاعلن",
  "مفعول مفاعلن مفعولن",
  "مفعول مفاعیل فاعلاتن",
  "مفعول مفاعیل فاعلن",
  "مفعول مفاعیل فعولن مفعولن",
  "مفعول مفاعیل مفاعیل فع",
  "مفعول مفاعیل مفاعیل فعل (وزن رباعی)",
  "مفعول مفاعیل مفاعیل فعولن (هزج مثمن اخرب مکفوف محذوف)",
  "مفعول مفاعیل مفاعیل مفاعیلن",
  "مفعول مفاعیل مفاعیلن",
  "مفعول مفاعیل مفاعیلن فع",
  "مفعول مفاعیل مفتعلن",
  "مفعول مفاعیلن فعل",
  "مفعول مفاعیلن فعلن",
  "مفعول مفاعیلن مفعول فعولن",
  "مفعول مفاعیلن مفعول مفاعیلن (هزج مثمن اخرب)",
  "مفعول مفتعلن مفعول مفتعلن",
  "مفعول مفعول فاعلاتن",
  "مفعول مفعول فعل",
  "مفعول مفعولن مفاعیلن فعولن",
  "مفعولن فع مفعولن فع",
  "مفعولن مفعول مفاعیلن",
  "مفعولن مفعولن مفعول مفاعیلن",
  "مفعولن مفعولن مفعولن فع لن",
  "مفعولن مفعولن مفعولن مفعولن"
];
const LANG_CATALOG = ["فارسی", "عربی", "ترکی", "کردی", "مازندرانی", "گیلکی", "گویش کهن اصفهانی (فهلوی)"];
function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n++;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}
function ftsQueryOf(terms) {
  if (!terms.length) return null;
  return terms.map((t) => `${t.replace(/["*^():]/g, "")}*`).join(" AND ");
}
const FORM_OF = `(SELECT fm.value1 FROM meta_data fm WHERE fm.target_id = CAST(w.id AS TEXT) AND fm.meta_type = 'Form' LIMIT 1)`;
function searchGrouped(params) {
  const db = getDb();
  const p = params ?? {};
  const qn = normalize(p.q ?? "");
  const termList = qn.split(" ").filter(Boolean);
  const singleTerm = termList.length === 1 ? termList[0] : null;
  const ftsQuery = ftsQueryOf(termList);
  const conds = [];
  const args = [];
  if (p.authorId) {
    conds.push("w.author_id = ?");
    args.push(p.authorId);
  }
  if (p.city) {
    conds.push("a.birth_city = ?");
    args.push(p.city);
  }
  if (p.era) {
    conds.push("a.era = ?");
    args.push(p.era);
  }
  const devs = (p.devices ?? []).filter((d) => !!d);
  if (devs.length) {
    conds.push(
      `EXISTS (SELECT 1 FROM meta_data md JOIN contents gd ON gd.id = CAST(md.target_id AS INTEGER)
 WHERE md.meta_type = 'Device' AND gd.section_id = w.id
 AND md.value1 IN (${devs.map(() => "?").join(",")}))`
    );
    args.push(...devs);
  }
  if (p.formKey) {
    conds.push(`EXISTS (SELECT 1 FROM meta_data mf WHERE mf.target_id = CAST(w.id AS TEXT) AND mf.meta_type = 'Form' AND mf.value1 = ?)`);
    args.push(p.formKey);
  }
  if (p.languageId) {
    if (p.languageId === "فارسی") {
      conds.push(`NOT EXISTS (SELECT 1 FROM meta_data ml WHERE ml.target_id = CAST(w.id AS TEXT) AND ml.meta_type = 'Language' AND ml.value1 <> 'فارسی')`);
    } else {
      conds.push(`EXISTS (SELECT 1 FROM meta_data ml WHERE ml.target_id = CAST(w.id AS TEXT) AND ml.meta_type = 'Language' AND ml.value1 = ?)`);
      args.push(p.languageId);
    }
  }
  const condsPoem = [...conds];
  const argsPoem = [...args];
  if (p.meterId === METER_NONE) {
    condsPoem.push(`NOT EXISTS (SELECT 1 FROM meta_data mm WHERE mm.meta_type = 'Meter' AND (mm.target_id = CAST(w.id AS TEXT) OR mm.target_id IN (SELECT CAST(gm.id AS TEXT) FROM contents gm WHERE gm.section_id = w.id)))`);
  } else if (p.meterId) {
    condsPoem.push(`EXISTS (SELECT 1 FROM meta_data mm WHERE mm.meta_type = 'Meter' AND mm.value1 = ? AND (mm.target_id = CAST(w.id AS TEXT) OR mm.target_id IN (SELECT CAST(gm.id AS TEXT) FROM contents gm WHERE gm.section_id = w.id)))`);
    argsPoem.push(p.meterId);
  }
  if (p.minCouplets != null || p.maxCouplets != null) {
    condsPoem.push(
      `(SELECT COUNT(*) FROM contents cx WHERE cx.section_id = w.id AND cx.type IN (1,3,7)) BETWEEN ? AND ?`
    );
    argsPoem.push(p.minCouplets ?? 0, p.maxCouplets ?? 99999);
  }
  if (p.rhyme && p.rhyme.trim()) {
    const rq = normLoose(p.rhyme);
    if (rq.length > 0) {
      const allRhymes = db.prepare(`SELECT DISTINCT value1 AS v FROM meta_data WHERE meta_type = 'Rhyme' AND value1 IS NOT NULL`).all().map((r) => r.v);
      const matched = allRhymes.filter((v) => normLoose(v).includes(rq));
      if (matched.length === 0) {
        condsPoem.push("1=0");
      } else {
        condsPoem.push(
          `EXISTS (SELECT 1 FROM meta_data mr JOIN contents gr ON gr.id = CAST(mr.target_id AS INTEGER)
 WHERE mr.meta_type = 'Rhyme' AND gr.section_id = w.id AND mr.value1 IN (${matched.map(() => "?").join(",")}))`
        );
        argsPoem.push(...matched);
      }
    }
  }
  const wherePoem = `AND COALESCE(${FORM_OF}, 'ghazal') <> 'nasr'` + (condsPoem.length ? " AND " + condsPoem.join(" AND ") : "");
  const whereProse = `AND ${FORM_OF} = 'nasr'` + (conds.length ? " AND " + conds.join(" AND ") : "");
  const out = [];
  const HEAD = `w.id AS work_id, w.title,
 a.id AS author_id, a.id AS author_code, COALESCE(a.pen_name, a.name) AS author_name,
 w.parent_id AS folder_id, a.century AS century_shamsi`;
  const verseRows = !ftsQuery ? [] : (() => {
    try {
      return db.prepare(
        `SELECT c.id AS row_id, c.order_index,
 (SELECT la.id FROM contents la WHERE la.section_id = c.section_id
 AND la.order_index <= c.order_index AND la.type IN (1,3,7)
 ORDER BY la.order_index DESC LIMIT 1) AS anchor_id,
 ${HEAD}, COALESCE(${FORM_OF}, 'ghazal') AS form_key, bm25(search_fts) AS rank
 FROM search_fts
 JOIN contents c ON c.id = CAST(search_fts.content_id AS INTEGER)
 JOIN sections w ON w.id = c.section_id AND w.is_work = 1
 JOIN authors a ON a.id = w.author_id
 WHERE search_fts MATCH ? AND c.type IN (1,2,3,4,5,6,7) ${wherePoem}
 ORDER BY a.century IS NULL, a.century, c.section_id, c.order_index
 LIMIT 600`
      ).all(ftsQuery, ...argsPoem);
    } catch (e) {
      console.error("[SEARCH] FTS_FAIL fallback=js-like", String(e).slice(0, 120));
      const rows = db.prepare(
        `SELECT c.id AS row_id, c.order_index, c.text,
 (SELECT la.id FROM contents la WHERE la.section_id = c.section_id
 AND la.order_index <= c.order_index AND la.type IN (1,3,7)
 ORDER BY la.order_index DESC LIMIT 1) AS anchor_id,
 ${HEAD}, COALESCE(${FORM_OF}, 'ghazal') AS form_key, 0 AS rank
 FROM contents c
 JOIN sections w ON w.id = c.section_id AND w.is_work = 1
 JOIN authors a ON a.id = w.author_id
 WHERE c.type IN (1,2,3,4,5,6,7) ${wherePoem}
 ORDER BY a.century IS NULL, a.century, c.section_id, c.order_index
 LIMIT 4000`
      ).all(...argsPoem);
      return rows.filter((r) => {
        const n = normalize(r.text);
        return termList.every((t) => n.includes(t));
      });
    }
  })();
  const byPoem = /* @__PURE__ */ new Map();
  for (const r of verseRows) {
    if (r.anchor_id == null) continue;
    const arr = byPoem.get(r.work_id) ?? [];
    if (arr.length < 40 && !arr.some((x) => x.anchor_id === r.anchor_id)) {
      arr.push({ ...r, order_index: r.order_index });
      byPoem.set(r.work_id, arr);
    }
  }
  for (const [workId, hits] of byPoem) {
    hits.sort((a, b) => a.order_index - b.order_index);
    const first = hits[0];
    const lines = linesOfWork(db, workId);
    let hitCount = 0;
    if (singleTerm) {
      const full = normalize(lines.filter((l) => l.type !== 0 && l.type !== 8).map((l) => l.text).join(" "));
      hitCount = countOccurrences(full, singleTerm);
    } else if (termList.length > 1) {
      hitCount = hits.length;
    }
    const anchorIdxs = lines.map((l, i) => [1, 3, 7].includes(l.type) ? i : -1).filter((i) => i >= 0);
    const firstIdx = lines.findIndex((l) => l.id === first.anchor_id);
    const anchorPos = anchorIdxs.indexOf(firstIdx);
    const sliceIdx = [anchorIdxs[anchorPos - 1], anchorIdxs[anchorPos], anchorIdxs[anchorPos + 1]].filter((i) => i != null && i >= 0);
    const ctx = sliceIdx.map((li, k) => {
      const v = assembleVerses(db, lines.slice(li), first.form_key)[0];
      const anchorOrder = lines[li].order_index;
      return {
        verse_id: v.verse_id,
        order_index: anchorOrder,
        is_band: lines[li].type === 3 ? 1 : 0,
        hit: v.verse_id === first.anchor_id,
        misras: v.misras
      };
    });
    out.push({
      kind: "poem",
      poem_id: workId,
      title: first.title,
      form_key: first.form_key,
      form_title: FORMS.find((f) => f.key === first.form_key)?.title ?? first.form_key,
      author_id: first.author_id,
      author_code: first.author_code,
      author_name: first.author_name,
      crumb: crumbOf(db, first.folder_id),
      century_shamsi: first.century_shamsi,
      hit_count: hitCount,
      hit_order: first.order_index,
      context: ctx
    });
  }
  if (!ftsQuery && (p.formKey || p.meterId || p.authorId || p.languageId || p.rhyme || p.minCouplets != null || p.maxCouplets != null || p.city || p.era || devs.length)) {
    const poemList = db.prepare(
      `SELECT ${HEAD}, COALESCE(${FORM_OF}, 'ghazal') AS form_key
 FROM sections w JOIN authors a ON a.id = w.author_id
 WHERE w.is_work = 1 ${wherePoem}
 AND EXISTS (SELECT 1 FROM contents ce WHERE ce.section_id = w.id AND ce.type IN (1,3,7))
 ORDER BY a.century IS NULL, a.century, w.id
 LIMIT 80`
    ).all(...argsPoem);
    for (const r of poemList) {
      if (out.some((o) => o.kind === "poem" && o.poem_id === r.work_id)) continue;
      const lines = linesOfWork(db, r.work_id);
      const firstAnchor = lines.findIndex((l) => [1, 3, 7].includes(l.type));
      if (firstAnchor < 0) continue;
      const v = assembleVerses(db, lines.slice(firstAnchor), r.form_key)[0];
      out.push({
        kind: "poem",
        poem_id: r.work_id,
        title: r.title,
        form_key: r.form_key,
        form_title: FORMS.find((f) => f.key === r.form_key)?.title ?? r.form_key,
        author_id: r.author_id,
        author_code: r.author_code,
        author_name: r.author_name,
        crumb: crumbOf(db, r.folder_id),
        century_shamsi: r.century_shamsi,
        hit_count: 0,
        hit_order: 0,
        context: [{ verse_id: v.verse_id, order_index: v.order_index, is_band: v.is_band, hit: false, misras: v.misras }]
      });
    }
  }
  let ftsSnippet = null;
  if (ftsQuery) {
    try {
      const snipStmt = db.prepare(
        `SELECT snippet(search_fts, 0, '', '', ' … ', 40) AS s FROM search_fts
 WHERE search_fts MATCH ? AND content_id = ? LIMIT 1`
      );
      ftsSnippet = (contentId) => {
        try {
          return snipStmt.get(ftsQuery, contentId)?.s ?? null;
        } catch {
          return null;
        }
      };
    } catch {
      ftsSnippet = null;
    }
  }
  const partRows = !ftsQuery ? [] : (() => {
    try {
      return db.prepare(
        `SELECT c.id AS part_id, c.order_index, c.text, ${HEAD}
 FROM search_fts
 JOIN contents c ON c.id = CAST(search_fts.content_id AS INTEGER)
 JOIN sections w ON w.id = c.section_id AND w.is_work = 1
 JOIN authors a ON a.id = w.author_id
 WHERE search_fts MATCH ? ${whereProse}
 ORDER BY a.century IS NULL, a.century, c.section_id, c.order_index
 LIMIT 200`
      ).all(ftsQuery, ...args);
    } catch {
      const rows = db.prepare(
        `SELECT c.id AS part_id, c.order_index, c.text, ${HEAD}
 FROM contents c
 JOIN sections w ON w.id = c.section_id AND w.is_work = 1
 JOIN authors a ON a.id = w.author_id
 WHERE 1 = 1 ${whereProse}
 ORDER BY a.century IS NULL, a.century, c.section_id, c.order_index
 LIMIT 2000`
      ).all(...args);
      return rows.filter((r) => {
        const n = normalize(r.text);
        return termList.every((t) => n.includes(t));
      });
    }
  })();
  const byWork = /* @__PURE__ */ new Map();
  for (const r of partRows) {
    const arr = byWork.get(r.work_id) ?? [];
    arr.push(r);
    byWork.set(r.work_id, arr);
  }
  for (const [, hits] of byWork) {
    hits.sort((a, b) => a.order_index - b.order_index);
    const first = hits[0];
    let snippet = ftsSnippet?.(first.part_id) ?? null;
    if (!snippet) {
      const normText = normalize(first.text ?? "");
      snippet = normText.slice(0, 220);
      if (singleTerm) {
        const idx = normText.indexOf(singleTerm);
        if (idx >= 0) {
          const start = Math.max(0, idx - 60);
          snippet = (start > 0 ? "…" : "") + normText.slice(start, idx + singleTerm.length + 120) + "…";
        }
      }
    }
    let hitCount = 0;
    if (singleTerm) {
      hitCount = hits.reduce((acc, h) => acc + countOccurrences(normalize(h.text ?? ""), singleTerm), 0);
    } else if (termList.length > 1) {
      hitCount = hits.length;
    }
    out.push({
      kind: "prose",
      paragraph_id: first.part_id,
      work_id: first.work_id,
      title: first.title,
      author_id: first.author_id,
      author_code: first.author_code,
      author_name: first.author_name,
      crumb: crumbOf(db, first.folder_id),
      century_shamsi: first.century_shamsi,
      hit_count: hitCount,
      paragraphs_count: hits.length,
      snippet
    });
  }
  if (!ftsQuery && (p.authorId || p.city || p.era || devs.length)) {
    const proseList = db.prepare(
      `SELECT ${HEAD},
 (SELECT g1.id FROM contents g1 WHERE g1.section_id = w.id AND g1.type = 0 ORDER BY g1.order_index LIMIT 1) AS part_id,
 (SELECT substr(g2.text,1,220) FROM contents g2 WHERE g2.section_id = w.id AND g2.type = 0 ORDER BY g2.order_index LIMIT 1) AS snippet
 FROM sections w JOIN authors a ON a.id = w.author_id
 WHERE w.is_work = 1 ${whereProse}
 ORDER BY a.century IS NULL, a.century, w.id
 LIMIT 40`
    ).all(...args);
    for (const r of proseList) {
      if (!r.part_id || out.some((o) => o.kind === "prose" && o.work_id === r.work_id)) continue;
      out.push({
        kind: "prose",
        paragraph_id: r.part_id,
        work_id: r.work_id,
        title: r.title,
        author_id: r.author_id,
        author_code: r.author_code,
        author_name: r.author_name,
        crumb: crumbOf(db, r.folder_id),
        century_shamsi: r.century_shamsi,
        hit_count: 0,
        paragraphs_count: 0,
        snippet: r.snippet ?? ""
      });
    }
  }
  out.sort((a, b) => {
    const ca = a.century_shamsi ?? 99;
    const cb = b.century_shamsi ?? 99;
    if (ca !== cb) return ca - cb;
    const ia = a.kind === "poem" ? a.poem_id ?? 0 : a.work_id ?? 0;
    const ib = b.kind === "poem" ? b.poem_id ?? 0 : b.work_id ?? 0;
    return ia - ib;
  });
  return out;
}
function getFilterOptions() {
  const db = getDb();
  const authors = db.prepare(`SELECT id, COALESCE(pen_name, name) AS name FROM authors ORDER BY century IS NULL, century, CAST(id AS INTEGER)`).all();
  const forms = FORMS.filter((f) => f.category === "nazm").map((f) => ({
    key: f.key,
    title: f.title,
    description: f.description
  }));
  const meters = METER_CATALOG.map((m) => ({ id: m, display: m }));
  const languages = LANG_CATALOG.map((l) => ({ id: l, title: l }));
  const devices = db.prepare(`SELECT DISTINCT value1 AS v FROM meta_data WHERE meta_type = 'Device' AND value1 IS NOT NULL ORDER BY v`).all().map((r) => r.v);
  const cities = db.prepare(`SELECT DISTINCT birth_city AS v FROM authors WHERE birth_city IS NOT NULL AND birth_city <> '' ORDER BY v`).all().map((r) => r.v);
  const eras = db.prepare(`SELECT DISTINCT era AS v FROM authors WHERE era IS NOT NULL AND era <> '' ORDER BY v`).all().map((r) => r.v);
  return { authors, forms, meters, languages, rhymes: [], devices, cities, eras };
}
function toggleSave(kind, refId) {
  const u = getUserDb();
  const existing = u.prepare(`SELECT id FROM bookmarks WHERE target_type = ? AND target_id = ?`).get(kind, refId);
  if (existing) {
    u.prepare(`DELETE FROM bookmarks WHERE id = ?`).run(existing.id);
    return { saved: false };
  }
  u.prepare(`INSERT INTO bookmarks (target_type, target_id) VALUES (?, ?)`).run(kind, refId);
  return { saved: true };
}
function getSaveStates(kind, ids) {
  if (!ids.length) return {};
  const u = getUserDb();
  const rows = u.prepare(
    `SELECT target_id FROM bookmarks WHERE target_type = ? AND target_id IN (${ids.map(() => "?").join(",")})`
  ).all(kind, ...ids);
  const set = new Set(rows.map((r) => r.target_id));
  return Object.fromEntries(ids.map((id) => [id, set.has(id)]));
}
const FIRST_ANCHOR = `(SELECT g0.text FROM contents g0 WHERE g0.section_id = s.id AND g0.type IN (1,3,7) ORDER BY g0.order_index LIMIT 1)`;
function listSaves() {
  const u = getUserDb();
  const rows = u.prepare(`SELECT id AS save_id, target_type AS kind, target_id AS ref_id, created_at FROM bookmarks ORDER BY created_at DESC, id DESC`).all();
  const db = getDb();
  const poemInfo = db.prepare(
    `SELECT s.id AS poem_id, s.title, s.parent_id AS section_id,
 a.id AS author_id, a.id AS author_code, COALESCE(a.pen_name, a.name) AS author_name,
 ${FIRST_ANCHOR} AS preview,
 (SELECT m2.text FROM contents c1 JOIN contents m2 ON m2.section_id=c1.section_id AND m2.type IN (2,4)
   AND m2.order_index>c1.order_index WHERE c1.section_id=s.id AND c1.type IN (1,3)
   ORDER BY c1.order_index, m2.order_index LIMIT 1) AS misra2_first
 FROM sections s JOIN authors a ON a.id = s.author_id WHERE s.id = ? AND s.is_work = 1`
  );
  const formStmt = db.prepare(`SELECT value1 v FROM meta_data WHERE target_id=? AND meta_type='Form'`);
  const verseInfo = db.prepare(
    `SELECT c.id AS verse_id, c.section_id AS poem_id,
 (SELECT g2.text FROM contents g2 WHERE g2.section_id = c.section_id AND g2.type IN (2,4)
 AND g2.order_index > c.order_index ORDER BY g2.order_index LIMIT 1) AS misra2,
 c.text AS misra1,
 s.parent_id AS folder_id, s.title,
 a.id AS author_id, a.id AS author_code, COALESCE(a.pen_name, a.name) AS author_name
 FROM contents c JOIN sections s ON s.id = c.section_id JOIN authors a ON a.id = c.author_id
 WHERE c.id = ? AND c.type IN (1,3,7)`
  );
  const partInfo = db.prepare(
    `SELECT c.id AS part_id, c.section_id AS work_id, substr(c.text,1,90) AS preview,
 s.parent_id AS folder_id, s.title,
 a.id AS author_id, a.id AS author_code, COALESCE(a.pen_name, a.name) AS author_name
 FROM contents c JOIN sections s ON s.id = c.section_id JOIN authors a ON a.id = c.author_id
 WHERE c.id = ? AND c.type IN (0,8)`
  );
  const out = [];
  for (const r of rows) {
    if (r.kind === "poem" || r.kind === "work") {
      const x = poemInfo.get(r.ref_id);
      if (!x) continue;
      const isPoemTarget = r.kind === "poem";
      const fm = formStmt.get(String(x.poem_id))?.v ?? null;
      out.push({
        save_id: r.save_id,
        kind: r.kind,
        ref_id: r.ref_id,
        poem_id: isPoemTarget ? x.poem_id : null,
        work_id: isPoemTarget ? null : x.poem_id,
        title: x.title,
        preview: x.preview,
        misra1: isPoemTarget ? x.preview : null,
        misra2: isPoemTarget ? x.misra2_first ?? null : null,
        form_title: fm ? formTitle(fm) : null,
        author_id: x.author_id,
        author_code: x.author_code,
        author_name: x.author_name,
        crumb: crumbOf(db, x.section_id),
        created_at: r.created_at
      });
    } else if (r.kind === "verse") {
      const x = verseInfo.get(r.ref_id);
      if (!x) continue;
      const fmv = formStmt.get(String(x.poem_id))?.v ?? null;
      out.push({
        save_id: r.save_id,
        kind: "verse",
        ref_id: r.ref_id,
        poem_id: x.poem_id,
        work_id: null,
        title: x.title,
        preview: [x.misra1, x.misra2].filter(Boolean).join("  "),
        misra1: x.misra1,
        misra2: x.misra2 ?? null,
        form_title: fmv ? formTitle(fmv) : null,
        author_id: x.author_id,
        author_code: x.author_code,
        author_name: x.author_name,
        crumb: crumbOf(db, x.folder_id),
        created_at: r.created_at
      });
    } else {
      const x = partInfo.get(r.ref_id);
      if (!x) continue;
      out.push({
        save_id: r.save_id,
        kind: "work",
        ref_id: r.ref_id,
        poem_id: null,
        work_id: x.work_id,
        title: x.title,
        preview: x.preview,
        misra1: null,
        misra2: null,
        form_title: "نثر",
        author_id: x.author_id,
        author_code: x.author_code,
        author_name: x.author_name,
        crumb: crumbOf(db, x.folder_id),
        created_at: r.created_at
      });
    }
  }
  return out;
}
function getNotesFor(ids) {
  if (!ids.length) return {};
  const u = getUserDb();
  const rows = u.prepare(`SELECT target_id, body FROM notes WHERE target_id IN (${ids.map(() => "?").join(",")})`).all(...ids);
  const map = {};
  for (const r of rows) map[r.target_id] = r.body;
  return Object.fromEntries(ids.map((id) => [id, map[id] ?? ""]));
}
function setNote(targetId, body) {
  const u = getUserDb();
  const clean = (body ?? "").trim();
  if (!clean) {
    u.prepare("DELETE FROM notes WHERE target_id = ?").run(targetId);
    return { noted: false };
  }
  u.prepare(
    `INSERT INTO notes (target_id, body) VALUES (?, ?)
 ON CONFLICT(target_id) DO UPDATE SET body = excluded.body,
 updated_at = datetime('now','localtime')`
  ).run(targetId, clean);
  return { noted: true };
}
function deleteNote(targetId) {
  getUserDb().prepare("DELETE FROM notes WHERE target_id = ?").run(targetId);
  return { noted: false };
}
function listNotes() {
  const u = getUserDb();
  const rows = u.prepare("SELECT target_id, body, updated_at FROM notes ORDER BY updated_at DESC, id DESC").all();
  const db = getDb();
  const stmt = db.prepare(
    `SELECT c.id, c.type, c.text,
 (SELECT g2.text FROM contents g2 WHERE g2.section_id = c.section_id AND g2.type IN (2,4)
 AND g2.order_index > c.order_index ORDER BY g2.order_index LIMIT 1) AS misra2_text,
 s.id AS work_id, s.title AS work_title, s.parent_id AS folder_id,
 a.id AS author_id, COALESCE(a.pen_name, a.name) AS author_name
 FROM contents c
 JOIN sections s ON s.id = c.section_id AND s.is_work = 1
 JOIN authors a ON a.id = c.author_id
 WHERE c.id = ?`
  );
  const formStmt = db.prepare(
    `SELECT value1 AS v FROM meta_data WHERE target_id = ? AND meta_type = 'Form' LIMIT 1`
  );
  const out = [];
  for (const r of rows) {
    const x = stmt.get(r.target_id);
    if (!x) continue;
    if (x.type === 8) continue;
    const form = formStmt.get(String(x.work_id))?.v ?? null;
    out.push({
      target_id: r.target_id,
      body: r.body,
      updated_at: r.updated_at,
      block_type: x.type,
      block_text: x.text,
      misra2_text: x.type === 1 || x.type === 3 ? x.misra2_text : null,
      work_id: x.work_id,
      work_title: x.work_title,
      author_id: x.author_id,
      author_name: x.author_name,
      crumb: crumbOf(db, x.folder_id),
      form
    });
  }
  return out;
}
function trigramSet(s) {
  const padded = ` ${s} `;
  const set = /* @__PURE__ */ new Set();
  for (let i = 0; i + 3 <= padded.length; i++) set.add(padded.slice(i, i + 3));
  return set;
}
function diceSimilarity(a, b) {
  if (a === b) return 1;
  const A = trigramSet(a);
  const B = trigramSet(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return 2 * hit / (A.size + B.size);
}
const firstLetterOf = (misra1) => normalize(misra1 ?? "").charAt(0);
const lastLetterOf = (misra1, misra2, zayde) => {
  const n = normalize(zayde || misra2 || misra1 || "");
  return n ? n.charAt(n.length - 1) : "";
};
function versePartsOf(verseId) {
  const db = getDb();
  const row = db.prepare("SELECT id, section_id, order_index, text, type FROM contents WHERE id = ?").get(verseId);
  if (!row || ![1, 3, 7].includes(row.type)) return null;
  let misra2 = null;
  let zayde = null;
  const followers = db.prepare(
    `SELECT text, type FROM contents WHERE section_id = ? AND order_index > ? ORDER BY order_index LIMIT 6`
  ).all(row.section_id, row.order_index);
  const zs = [];
  for (const f of followers) {
    if ([0, 1, 3, 7, 8].includes(f.type)) break;
    if (f.type === 2 || f.type === 4) misra2 = f.text;
    else if (f.type === 5 || f.type === 6) zs.push(f.text);
  }
  if (zs.length) zayde = zs.join(" ");
  return { misra1: row.text, misra2, zayde };
}
function headOf(verseId) {
  const db = getDb();
  const row = db.prepare(
    `SELECT c.id AS verse_id, c.section_id AS poem_id, s.title AS poem_title, a.name AS author_name
 FROM contents c
 JOIN sections s ON s.id = c.section_id AND s.is_work = 1
 JOIN authors a ON a.id = c.author_id
 WHERE c.id = ? AND c.type IN (1,3,7)`
  ).get(verseId);
  if (!row) return void 0;
  const parts = versePartsOf(verseId);
  if (!parts) return void 0;
  return { ...row, ...parts };
}
function hydrateVerse(verseId) {
  const db = getDb();
  const head = headOf(verseId);
  if (!head) return null;
  const meta = workMeta(db, head.poem_id);
  const lines = linesOfWork(db, head.poem_id);
  const start = lines.findIndex((l) => l.id === verseId);
  const v = assembleVerses(db, lines.slice(start), meta.form ?? "ghazal")[0];
  if (!v) return null;
  return {
    verse_id: head.verse_id,
    poem_id: head.poem_id,
    misras: v.misras,
    poem_title: head.poem_title,
    author_name: head.author_name
  };
}
let _all = null;
function allVersesWithLetters() {
  if (_all) return _all;
  const rows = getDb().prepare(`SELECT id FROM contents WHERE type IN (1,3,7)`).all();
  _all = rows.map((r) => {
    const parts = versePartsOf(r.id);
    if (!parts) return null;
    return { id: r.id, first: firstLetterOf(parts.misra1), last: lastLetterOf(parts.misra1, parts.misra2, parts.zayde) };
  }).filter((r) => !!r && !!r.first && !!r.last);
  return _all;
}
function startGame(_level) {
  const all = allVersesWithLetters();
  if (!all.length) return null;
  const starting = new Set(all.map((r) => r.first));
  const ok = all.filter((r) => starting.has(r.last));
  const pick = ok[Math.floor(Math.random() * ok.length)];
  if (!pick) return null;
  const verse = hydrateVerse(pick.id);
  if (!verse) return null;
  return { verse, letter: pick.last };
}
function pickAppVerse(letter, usedPoemIds, usedVerseIds) {
  const pool = allVersesWithLetters().filter((r) => r.first === letter && !usedVerseIds.includes(r.id));
  const prefer = pool.filter((r) => {
    const h = headOf(r.id);
    return h && !usedPoemIds.includes(h.poem_id);
  });
  const list = prefer.length ? prefer : pool;
  const pick = list[Math.floor(Math.random() * list.length)];
  return pick ? { verse_id: pick.id } : void 0;
}
let _misras = null;
function candidateMisras(letter) {
  if (!_misras) {
    _misras = getDb().prepare(`SELECT id AS verse_id, section_id AS poem_id FROM contents WHERE type IN (1,3,7)`).all().map((r) => {
      const parts = versePartsOf(r.verse_id);
      return parts ? { ...r, misra1: parts.misra1, misra2: parts.misra2 } : null;
    }).filter(Boolean);
  }
  const out = [];
  for (const r of _misras) {
    for (const text of [r.misra1, r.misra2]) {
      if (!text) continue;
      const norm = normalize(text);
      if (norm[0] === letter) out.push({ verse_id: r.verse_id, poem_id: r.poem_id, text, norm });
    }
  }
  return out;
}
function playerTurn(line, requiredLetter, usedPoemIds, usedVerseIds, threshold) {
  const th = Math.min(0.95, Math.max(0.5, Number(threshold) || 0.7));
  const fail = (reason, similarity2 = null) => ({ ok: false, reason, required_letter: requiredLetter, similarity: similarity2 });
  const norm = normalize(line ?? "");
  const words = norm.split(" ").filter(Boolean);
  const solidChars = norm.replace(/\s/g, "");
  if (words.length < 2 || solidChars.length < 8) return fail("too_short");
  if (norm[0] !== requiredLetter) return fail("wrong_letter");
  const candidates = candidateMisras(requiredLetter);
  let bestAny = null;
  let bestAllowed = null;
  for (const row of candidates) {
    const sim = diceSimilarity(norm, row.norm);
    if (!bestAny || sim > bestAny.sim) bestAny = { sim, row };
    const allowed = !usedPoemIds.includes(row.poem_id) && !usedVerseIds.includes(row.verse_id);
    if (allowed && (!bestAllowed || sim > bestAllowed.sim)) bestAllowed = { sim, row };
  }
  if (!bestAllowed || bestAllowed.sim < th) {
    if (bestAny && bestAny.sim >= th) return fail("repeated", round3(bestAny.sim));
    return fail("no_match", bestAllowed ? round3(bestAllowed.sim) : bestAny ? round3(bestAny.sim) : null);
  }
  const accepted = hydrateVerse(bestAllowed.row.verse_id);
  if (!accepted) return fail("no_match", null);
  const similarity = round3(bestAllowed.sim);
  const head = headOf(accepted.verse_id);
  const replyLetter = head ? lastLetterOf(head.misra1, head.misra2, head.zayde) : "";
  if (!replyLetter) {
    return { ok: true, accepted, similarity, response: null, letter: null };
  }
  const nextPoems = [...usedPoemIds, accepted.poem_id];
  const nextVerses = [...usedVerseIds, accepted.verse_id];
  const replyRow = pickAppVerse(replyLetter, nextPoems, nextVerses);
  if (!replyRow) {
    return { ok: true, accepted, similarity, response: null, letter: null };
  }
  const response = hydrateVerse(replyRow.verse_id) ?? null;
  const rHead = response ? headOf(response.verse_id) : void 0;
  return {
    ok: true,
    accepted,
    similarity,
    response,
    letter: response && rHead ? lastLetterOf(rHead.misra1, rHead.misra2, rHead.zayde) : null
  };
}
function round3(n) {
  return Math.round(n * 1e3) / 1e3;
}
function getSettings() {
  const db = getUserDb();
  const rows = db.prepare(`SELECT key, value FROM settings ORDER BY key`).all();
  const map = {};
  for (const r of rows) {
    try {
      map[r.key] = JSON.parse(r.value);
    } catch {
      map[r.key] = r.value;
    }
  }
  return map;
}
function setSetting(key, value) {
  const db = getUserDb();
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
 ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, JSON.stringify(value));
}
const FAL_WORKS = `
 SELECT s.id FROM sections s
 JOIN meta_data f ON f.target_id = CAST(s.id AS TEXT) AND f.meta_type = 'Fal'
 WHERE s.is_work = 1 AND TRIM(COALESCE(f.value1, '')) <> ''`;
function getFalStats() {
  const db = getDb();
  return db.prepare(
    `SELECT COUNT(DISTINCT s.id) AS poems_with_fal,
 COUNT(DISTINCT s.author_id) AS authors_with_fal,
 (SELECT COUNT(*) FROM contents c WHERE c.section_id IN (${FAL_WORKS}) AND c.type IN (1,3,7)) AS verses_with_fal
 FROM sections s
 JOIN meta_data f ON f.target_id = CAST(s.id AS TEXT) AND f.meta_type = 'Fal'
 WHERE s.is_work = 1 AND TRIM(COALESCE(f.value1, '')) <> ''`
  ).get();
}
function drawFal() {
  const db = getDb();
  const poem = db.prepare(
    `SELECT s.id AS poem_id, s.parent_id AS section_id, s.title AS poem_title,
 a.name AS author_name, f.value1 AS fal_meaning
 FROM sections s
 JOIN authors a ON a.id = s.author_id
 JOIN meta_data f ON f.target_id = CAST(s.id AS TEXT) AND f.meta_type = 'Fal'
 WHERE s.is_work = 1 AND TRIM(COALESCE(f.value1, '')) <> ''
 ORDER BY RANDOM() LIMIT 1`
  ).get();
  if (!poem) return null;
  const row = db.prepare(
    `SELECT id FROM contents WHERE section_id = ? AND type IN (1,3,7) ORDER BY RANDOM() LIMIT 1`
  ).get(poem.poem_id);
  if (!row) return null;
  const meta = workMeta(db, poem.poem_id);
  const lines = linesOfWork(db, poem.poem_id);
  const start = lines.findIndex((l) => l.id === row.id);
  const v = assembleVerses(db, lines.slice(start), meta.form ?? "ghazal")[0];
  if (!v) return null;
  return {
    verse_id: v.verse_id,
    misra1: v.misra1 ?? "",
    misra2: v.misra2 ?? "",
    misras: v.misras,
    poem_id: poem.poem_id,
    poem_title: poem.poem_title,
    crumb: crumbOf(db, poem.section_id),
    author_name: poem.author_name,
    fal_meaning: poem.fal_meaning
  };
}
function registerIpcHandlers() {
  electron.ipcMain.handle("reader:verse-detail", (_e, verseId) => getVerseDetail(verseId));
  electron.ipcMain.handle(
    "reader:paragraph-detail",
    (_e, paragraphId) => getParagraphDetail(paragraphId)
  );
  electron.ipcMain.handle("library:poets", () => getPoets());
  electron.ipcMain.handle("library:featured", () => getFeaturedPoets());
  electron.ipcMain.handle("library:poet", (_e, authorId) => getPoetProfile(authorId));
  electron.ipcMain.handle("library:tree", (_e, authorId) => getPoetTree(authorId));
  electron.ipcMain.handle("library:poem", (_e, poemId) => getPoem(poemId));
  electron.ipcMain.handle("library:work", (_e, workId) => getProseWork(workId));
  electron.ipcMain.handle("library:similar", (_e, poemId) => getSimilarPoems(poemId));
  electron.ipcMain.handle("library:stats", (_e, authorId) => getPoetStats(authorId));
  electron.ipcMain.handle("search:grouped", (_e, params) => searchGrouped(params));
  electron.ipcMain.handle("search:filters", () => getFilterOptions());
  electron.ipcMain.handle("saved:list", () => listSaves());
  electron.ipcMain.handle("saved:toggle", (_e, kind, refId) => toggleSave(kind, refId));
  electron.ipcMain.handle("saved:states", (_e, kind, ids) => getSaveStates(kind, ids));
  electron.ipcMain.handle("notes:list", () => listNotes());
  electron.ipcMain.handle("notes:for", (_e, ids) => getNotesFor(ids));
  electron.ipcMain.handle("notes:set", (_e, targetId, body) => setNote(targetId, body));
  electron.ipcMain.handle("notes:del", (_e, targetId) => deleteNote(targetId));
  electron.ipcMain.handle("moshaere:start", (_e, level) => startGame());
  electron.ipcMain.handle(
    "moshaere:turn",
    (_e, line, requiredLetter, usedPoemIds, usedVerseIds, threshold) => playerTurn(line, requiredLetter, usedPoemIds, usedVerseIds, threshold)
  );
  electron.ipcMain.handle("fal:stats", () => getFalStats());
  electron.ipcMain.handle("fal:draw", () => drawFal());
  electron.ipcMain.handle("settings:get", () => getSettings());
  electron.ipcMain.handle("settings:set", (_e, key, value) => setSetting(key, value));
  electron.ipcMain.handle("db:health", () => dbHealthCheck());
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1100,
    height: 760,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.fanoos.app");
  registerIpcHandlers();
  try {
    console.log("[Fanoos] DB Health →", JSON.stringify(dbHealthCheck()));
  } catch (err) {
    console.error("[Fanoos] DB Health FAILED →", err);
  }
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  closeDb();
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
