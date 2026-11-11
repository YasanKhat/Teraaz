"use client";

import "./hunt.css";

/** قهرمانِ صفحهٔ تنظیماتِ «جاسوسِ نقش‌ها»: چهار مظنون پشتِ پنجره‌های یک ساختمان،
 *  و نشانه‌روی که روی‌شان می‌چرخد.
 *
 *  این نشانه‌گذاری رونوشتِ مستقیمِ اچ‌تی‌ام‌الِ زندهٔ `/game/jasoos` است —
 *  مسیرها و کلاس‌ها همان‌هایی‌اند که سایت می‌فرستد، و `hunt.css` هم سی‌اس‌اسِ
 *  همان ماژول است. نقشِ اینجا فقط تزیین است، برای همین `aria-hidden` است. */
export default function HuntHero() {
  return (
    <div className="hunt-module__hXhGKa__hero">
      <div className="hunt-module__hXhGKa__stage hunt-module__hXhGKa__heroStage" aria-hidden="true">
        <span className="hunt-module__hXhGKa__moon">
        </span>
        <div className="hunt-module__hXhGKa__facade">
          <svg className="hunt-module__hXhGKa__skyline" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 60V34h18V22h14v12h10V12h16v48zM70 60V30h22V18h8v12h14v30zM130 60V24h12V8h18v16h10v36zM186 60V36h26V20h12v40zM236 60V14h20v10h12v36zM284 60V28h18V16h14v44zM330 60V22h14v10h16V6h14v54zM380 60V30h20v30z" />
          </svg>
          <div className="hunt-module__hXhGKa__windows">
            <div className="hunt-module__hXhGKa__window" style={{ "--i": 0 } as React.CSSProperties}>
              <span className="hunt-module__hXhGKa__pane">
                <span className="hunt-module__hXhGKa__agent">
                  <svg viewBox="0 0 120 130" className="hunt-module__hXhGKa__agentSvg" aria-hidden="true">
                    <path d="M6 130c3-30 20-44 54-44s51 14 54 44z" />
                    <path d="M50 70h20v20H50z" />
                    <circle cx="60" cy="54" r="21" />
                    <ellipse cx="60" cy="38" rx="34" ry="6" />
                    <path d="M40 38c0-16 8-22 20-22s20 6 20 22z" />
                    <path d="M40 34h40v4H40z" className="hunt-module__hXhGKa__agentShade" />
                    <g>
                      <ellipse cx="52" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" />
                      <ellipse cx="68" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" />
                      <g className="hunt-module__hXhGKa__pupils">
                        <circle cx="52" cy="55" r="1.7" />
                        <circle cx="68" cy="55" r="1.7" />
                      </g>
                    </g>
                    <path d="M80 44c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" className="hunt-module__hXhGKa__sweat" />
                  </svg>
                </span>
                <span className="hunt-module__hXhGKa__sash">
                </span>
              </span>
              <span className="hunt-module__hXhGKa__plate">
                <span className="hunt-module__hXhGKa__role">
                  نهاد
                </span>
              </span>
            </div>
            <div className="hunt-module__hXhGKa__window" style={{ "--i": 1 } as React.CSSProperties}>
              <span className="hunt-module__hXhGKa__pane">
                <span className="hunt-module__hXhGKa__agent">
                  <svg viewBox="0 0 120 130" className="hunt-module__hXhGKa__agentSvg" aria-hidden="true">
                    <path d="M6 130c3-30 20-44 54-44s51 14 54 44z" />
                    <path d="M50 70h20v20H50z" />
                    <circle cx="60" cy="54" r="21" />
                    <path d="M38 50c0-18 10-26 22-26s22 8 22 26c-8-4-36-4-44 0z" />
                    <g>
                      <ellipse cx="52" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" />
                      <ellipse cx="68" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" />
                      <g className="hunt-module__hXhGKa__pupils">
                        <circle cx="52" cy="55" r="1.7" />
                        <circle cx="68" cy="55" r="1.7" />
                      </g>
                    </g>
                    <path d="M80 44c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" className="hunt-module__hXhGKa__sweat" />
                  </svg>
                </span>
                <span className="hunt-module__hXhGKa__sash">
                </span>
              </span>
              <span className="hunt-module__hXhGKa__plate">
                <span className="hunt-module__hXhGKa__role">
                  مفعول
                </span>
              </span>
            </div>
            <div className="hunt-module__hXhGKa__window" style={{ "--i": 2 } as React.CSSProperties}>
              <span className="hunt-module__hXhGKa__pane">
                <span className="hunt-module__hXhGKa__agent">
                  <svg viewBox="0 0 120 130" className="hunt-module__hXhGKa__agentSvg" aria-hidden="true">
                    <path d="M6 130c3-30 20-44 54-44s51 14 54 44z" />
                    <path d="M50 70h20v20H50z" />
                    <circle cx="60" cy="54" r="21" />
                    <path d="M39 46c0-15 9-22 21-22s21 7 21 22z" />
                    <path d="M36 46h52c-2 5-10 6-18 6H36z" />
                    <g>
                      <ellipse cx="52" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" />
                      <ellipse cx="68" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" />
                      <g className="hunt-module__hXhGKa__pupils">
                        <circle cx="52" cy="55" r="1.7" />
                        <circle cx="68" cy="55" r="1.7" />
                      </g>
                    </g>
                    <path d="M80 44c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" className="hunt-module__hXhGKa__sweat" />
                  </svg>
                </span>
                <span className="hunt-module__hXhGKa__sash">
                </span>
              </span>
              <span className="hunt-module__hXhGKa__plate">
                <span className="hunt-module__hXhGKa__role">
                  متمم
                </span>
              </span>
            </div>
            <div className="hunt-module__hXhGKa__window" style={{ "--i": 3 } as React.CSSProperties}>
              <span className="hunt-module__hXhGKa__pane">
                <span className="hunt-module__hXhGKa__agent">
                  <svg viewBox="0 0 120 130" className="hunt-module__hXhGKa__agentSvg" aria-hidden="true">
                    <path d="M6 130c3-30 20-44 54-44s51 14 54 44z" />
                    <path d="M40 90l20 22 20-22-4 40H44z" className="hunt-module__hXhGKa__agentShade" />
                    <path d="M50 70h20v20H50z" />
                    <circle cx="60" cy="54" r="21" />
                    <path d="M33 60c0-22 11-34 27-34s27 12 27 34l-6 20c0-24-8-34-21-34s-21 10-21 34z" />
                    <g>
                      <ellipse cx="52" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" />
                      <ellipse cx="68" cy="55" rx="4.2" ry="3.2" className="hunt-module__hXhGKa__eyeWhite" />
                      <g className="hunt-module__hXhGKa__pupils">
                        <circle cx="52" cy="55" r="1.7" />
                        <circle cx="68" cy="55" r="1.7" />
                      </g>
                    </g>
                    <path d="M80 44c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" className="hunt-module__hXhGKa__sweat" />
                  </svg>
                </span>
                <span className="hunt-module__hXhGKa__sash">
                </span>
              </span>
              <span className="hunt-module__hXhGKa__plate">
                <span className="hunt-module__hXhGKa__role">
                  صفت
                </span>
              </span>
            </div>
          </div>
        </div>
        <span className="hunt-module__hXhGKa__reticle" data-on="true">
          <svg viewBox="-50 -50 100 100">
            <g className="hunt-module__hXhGKa__reticleUnder">
              <circle r="30" />
              <path d="M-47 0h32M15 0h32M0-47v32M0 15v32" />
            </g>
            <g className="hunt-module__hXhGKa__reticleInk">
              <circle r="30" />
              <path d="M-47 0h32M15 0h32M0-47v32M0 15v32" />
              <circle r="1.8" className="hunt-module__hXhGKa__reticleDot" />
              <path d="M-9-30v6M9-30v6M-9 30v-6M9 30v-6" className="hunt-module__hXhGKa__reticleTicks" />
            </g>
          </svg>
        </span>
      </div>
    </div>
  );
}
