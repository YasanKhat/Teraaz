export type NavLink = { href: string; label: string };

// Single source of truth for the header's "بیشتر" dropdown and the matching
// entries in the footer's quick-access list — add a link here once and both
// navs stay in sync instead of drifting apart.
export const MORE_NAV_LINKS: NavLink[] = [
  { href: "/learn", label: "درسنامهٔ تعاملی" },
  { href: "/timeline", label: "خط زمان ادبیات" },
  { href: "/exam", label: "امتحانات نهایی" },
  { href: "/shab-emtehan", label: "شب امتحان" },
  { href: "/vazn-yab", label: "وزن‌یاب" },
  { href: "/game", label: "بازی" },
  { href: "/about", label: "درباره" },
];

/* گروه‌ها و پیوندها رونوشتِ فوترِ زنده‌اند (sarvaedu.ir، ۱۴۰۴/۰۸/۱۷، از
   sarvaedu.ir.har-3.txt). آنچه درست شد: «کنکور» و «شب امتحان» در ستونِ
   «ابزارها» کم بودند. توجه: «عروض سماعی» در ستونِ «یادگیری» است و «شب امتحان»
   در هر دو ستون می‌آید — سایت هم همین را می‌نویسد. */

/** The footer, grouped by what a page is *for* rather than as one flat list.
 *
 *  A reader looking for the lesson notes and a reader looking for the meter
 *  finder are after different things; a single «دسترسی سریع» column of eight
 *  links made them read the whole list either way. Four short columns, each
 *  with a heading, are scanned instead of read. */
export const FOOTER_SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: "یادگیری",
    links: [
      { href: "/doroos", label: "درسنامه" },
      { href: "/learn", label: "درسنامهٔ تعاملی" },
      { href: "/shab-emtehan", label: "شب امتحان" },
      { href: "/timeline", label: "خط زمان ادبیات" },
      { href: "/guide", label: "راهنمای یادگیری" },
      { href: "/quiz", label: "عروض سماعی" },
    ],
  },
  {
    title: "ابزارها",
    links: [
      { href: "/vazn-yab", label: "وزن‌یاب" },
      { href: "/exam", label: "امتحانات نهایی" },
      { href: "/konkur", label: "کنکور" },
      { href: "/shab-emtehan", label: "شب امتحان" },
      { href: "/game", label: "بازی" },
    ],
  },
  {
    title: "انجمن",
    links: [
      { href: "/sarvaclub", label: "سروا کلاب" },
      { href: "/panel", label: "پنل کاربری" },
    ],
  },
  {
    title: "سروا",
    links: [
      { href: "/", label: "صفحهٔ اصلی" },
      { href: "/about", label: "دربارهٔ ما" },
    ],
  },
];
