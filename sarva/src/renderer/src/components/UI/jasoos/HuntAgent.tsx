"use client";

/** چهار مظنونِ پشتِ پنجره‌ها — همان چهار نگاره‌ای که سایت در قهرمان و درونِ
 *  بازی می‌کشد. مسیرها رونوشتِ مستقیمِ اچ‌تی‌ام‌الِ زندهٔ `/game/jasoos` اند؛
 *  تنها چیزی که از خودم افزوده‌ام `--ex`/`--ey` است (دنبال‌کردنِ نشانه با چشم)،
 *  که سایت همان‌ها را هم روی گره می‌نویسد. */
export default function HuntAgent({ outfit = 0 }: { outfit?: number }) {
  const agents: Record<number, React.ReactNode> = {
  0: (
    <svg viewBox="0 0 120 130" className="hunt-module__hXhGKa__agentSvg" aria-hidden="true"><path d="M6 130c3-30 20-44 54-44s51 14 54 44z" /><path d="M50 70h20v20H50z" /><circle cx="60" cy="54" r="21" /><ellipse cx="60" cy="38" rx="34" ry="6" /><path d="M40 38c0-16 8-22 20-22s20 6 20 22z" /><path d="M40 34h40v4H40z" className="hunt-module__hXhGKa__agentShade" /><g><ellipse cx="52" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" /><ellipse cx="68" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" /><g className="hunt-module__hXhGKa__pupils"><circle cx="52" cy="55" r="1.7" /><circle cx="68" cy="55" r="1.7" /></g></g><path d="M80 44c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" className="hunt-module__hXhGKa__sweat" /></svg>
  ),
  1: (
    <svg viewBox="0 0 120 130" className="hunt-module__hXhGKa__agentSvg" aria-hidden="true"><path d="M6 130c3-30 20-44 54-44s51 14 54 44z" /><path d="M50 70h20v20H50z" /><circle cx="60" cy="54" r="21" /><path d="M38 50c0-18 10-26 22-26s22 8 22 26c-8-4-36-4-44 0z" /><g><ellipse cx="52" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" /><ellipse cx="68" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" /><g className="hunt-module__hXhGKa__pupils"><circle cx="52" cy="55" r="1.7" /><circle cx="68" cy="55" r="1.7" /></g></g><path d="M80 44c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" className="hunt-module__hXhGKa__sweat" /></svg>
  ),
  2: (
    <svg viewBox="0 0 120 130" className="hunt-module__hXhGKa__agentSvg" aria-hidden="true"><path d="M6 130c3-30 20-44 54-44s51 14 54 44z" /><path d="M50 70h20v20H50z" /><circle cx="60" cy="54" r="21" /><path d="M39 46c0-15 9-22 21-22s21 7 21 22z" /><path d="M36 46h52c-2 5-10 6-18 6H36z" /><g><ellipse cx="52" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" /><ellipse cx="68" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" /><g className="hunt-module__hXhGKa__pupils"><circle cx="52" cy="55" r="1.7" /><circle cx="68" cy="55" r="1.7" /></g></g><path d="M80 44c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" className="hunt-module__hXhGKa__sweat" /></svg>
  ),
  3: (
    <svg viewBox="0 0 120 130" className="hunt-module__hXhGKa__agentSvg" aria-hidden="true"><path d="M6 130c3-30 20-44 54-44s51 14 54 44z" /><path d="M40 90l20 22 20-22-4 40H44z" className="hunt-module__hXhGKa__agentShade" /><path d="M50 70h20v20H50z" /><circle cx="60" cy="54" r="21" /><path d="M33 60c0-22 11-34 27-34s27 12 27 34l-6 20c0-24-8-34-21-34s-21 10-21 34z" /><g><ellipse cx="52" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" /><ellipse cx="68" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" /><g className="hunt-module__hXhGKa__pupils"><circle cx="52" cy="55" r="1.7" /><circle cx="68" cy="55" r="1.7" /></g></g><path d="M80 44c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" className="hunt-module__hXhGKa__sweat" /></svg>
  ),
  };
  return <>{agents[outfit] ?? agents[0]}</>;
}
