"use client";

import { useEffect, useState } from "react";
import { Link, useRouter, useSearchParams } from "@/app/router";
import { apiGet, apiPost, errorText } from "@/lib/api/client";
import { formatRials } from "@/lib/plus/money";
import { NotFound } from "@/pages/NotFound";
import SandboxGateway from "@/components/UI/plus/purchase/SandboxGateway";
import PaymentCelebration from "@/components/UI/plus/purchase/PaymentCelebration";
import PayOrderButton from "@/components/UI/plus/purchase/PayOrderButton";
import RecheckButton from "@/components/UI/plus/RecheckButton";
import SupportButton from "@/components/UI/kit/support-button";

/**
 * مسیرهایِ پرداخت: `#/payment/sandbox` و `#/payment/result`.
 *
 * ⚠️ این دو مسیر پیش از این وجود نداشتند. سرورِ محلی به `/pay` یک
 * `{ status, active }` برمی‌گرداند و `CheckoutPanel` از آن `redirectUrl`
 * می‌خواست — یعنی `window.location.assign(undefined)` و یک پرش به آدرسی
 * بی‌نام. ضمن این‌که دسترسی همان لحظه‌یِ «رفتن به درگاه» داده می‌شد و کسی
 * که «انصراف» می‌زد هم پلاس می‌گرفت. هر دو طرفِ جریان اینجا وصل شده:
 * سرور نشانیِ درگاه را می‌دهد، این صفحه درگاه را نشان می‌دهد، و دسترسی
 * فقط وقتی داده می‌شود که کاربر رویِ درگاه «پرداخت» زده باشد.
 *
 * ⚠️ `SandboxGateway` خودش یک فرمِ واقعی است با
 * `action="/payment/sandbox/submit"` — درست مثلِ نسخه‌یِ سایت که با یک
 * POSTِ تمام‌صفحه به سرور می‌رود. اینجا نمی‌تواند چنین POSTای بفرستد
 * (برنامه تک‌صفحه‌ای است و آن مسیر وجود ندارد)، برای همین فرستادن در
 * میانه راه گرفته می‌شود و همان داده با `apiPost` می‌رود. خودِ کامپوننت
 * دست‌نخورده مانده.
 */

type SandboxData = {
  orderId: string;
  planCode: string;
  providerRef: string;
  amountRials: number;
  orderNumber: string;
  planTitle: string;
  deadline: string;
  state: "open" | "done" | "expired";
};

type Outcome = "paid" | "failed" | "cancelled" | "lost";

function useOrder(orderId: string) {
  const [data, setData] = useState<SandboxData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!orderId) {
      setError("شماره‌ی سفارش در نشانی نبود.");
      setLoading(false);
      return;
    }
    apiGet<SandboxData>(`/api/v1/plus/orders/${orderId}/sandbox`).then((r) => {
      if (!alive) return;
      setLoading(false);
      if (r.ok) setData(r.data);
      else setError(errorText(r));
    });
    return () => {
      alive = false;
    };
  }, [orderId]);

  return { data, error, loading };
}

export default function PaymentRoute({ sub }: { sub: string }) {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";

  if (sub === "sandbox") return <SandboxScreen orderId={orderId} />;
  if (sub === "result") {
    return <ResultScreen orderId={orderId} outcome={(params.get("outcome") ?? "cancelled") as Outcome} />;
  }
  return <NotFound />;
}

/** صفحه‌یِ بانک. */
function SandboxScreen({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data, error, loading } = useOrder(orderId);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function pick(action: Outcome) {
    if (busy) return;

    setBusy(true);
    setFailure(null);
    const sent = await apiPost(`/api/v1/plus/orders/${orderId}/sandbox-submit`, { action });
    if (!sent.ok) {
      setFailure(errorText(sent));
      setBusy(false);
      return;
    }
    router.replace(`/payment/result?order=${encodeURIComponent(orderId)}&outcome=${action}`);
  }

  if (loading) return <Centered>در حال گرفتنِ اطلاعاتِ پرداخت…</Centered>;
  if (error || !data) return <Centered>{error ?? "سفارش پیدا نشد."}</Centered>;

  return (
    <div>
      {failure && (
        <p role="alert" className="container mx-auto mt-6 max-w-md rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {failure}
        </p>
      )}
      <SandboxGateway
        onSubmit={(a) => pick(a as Outcome)}
        providerRef={data.providerRef}
        amount={formatRials(data.amountRials)}
        orderNumber={data.orderNumber}
        planTitle={data.planTitle}
        deadline={data.deadline}
        state={data.state}
      />
      {busy && (
        <p className="container mx-auto -mt-16 max-w-md text-center text-xs text-muted-foreground">
          در حال انتقال…
        </p>
      )}
    </div>
  );
}

/** آنچه پس از برگشتن از درگاه دیده می‌شود.

    ⚠️ «موفق بودن» را سرور می‌گوید و نه نشانی. `outcome` در آدرس فقط تعیین
    می‌کند کدام پیامِ شکست خوانده شود؛ اگر کسی
    `?order=…&outcome=paid` را با دست بنویسد ولی سفارش پرداخت‌نشده باشد،
    صفحه همان پیامِ شکست را نشان می‌دهد. */
function ResultScreen({ orderId, outcome }: { orderId: string; outcome: Outcome }) {
  const router = useRouter();
  const { data, error, loading } = useOrder(orderId);

  if (loading) return <Centered>در حال گرفتنِ نتیجه‌ی پرداخت…</Centered>;
  if (error || !data) return <Centered>{error ?? "سفارش پیدا نشد."}</Centered>;

  const amount = formatRials(data.amountRials);
  const receipt = (
    <dl className="mx-auto mt-6 grid max-w-sm gap-2 text-sm">
      <Row label="شماره سفارش" value={data.orderNumber} mono />
      <Row label="مبلغ" value={amount} />
      <Row label="بابت" value={data.planTitle} />
    </dl>
  );

  if (data.state === "done") {
    return (
      <main dir="rtl" className="container relative z-20 mx-auto mb-24 mt-14 max-w-md px-4">
        <PaymentCelebration
          title="پرداخت موفق بود"
          subtitle={`${data.planTitle} — ${amount}`}
          celebrate
          primary={{ href: "/panel/subscription", label: "رفتن به اشتراک من" }}
        >
          {receipt}
        </PaymentCelebration>
      </main>
    );
  }

  const copy: Record<Exclude<Outcome, "paid">, { title: string; body: string }> = {
    failed: {
      title: "پرداخت انجام نشد",
      body: "بانک این پرداخت را تأیید نکرد. مبلغی کم نشده؛ می‌توانی دوباره تلاش کنی."
    },
    cancelled: {
      title: "پرداخت لغو شد",
      body: "از درگاه برگشتی و مبلغی کم نشد. هر وقت خواستی می‌توانی دوباره بخری."
    },
    lost: {
      title: "برگشت به سروا انجام نشد",
      body: "پرداخت ثبت شده اما پیامش به سروا نرسیده — مثل وقتی که اینترنت وسطِ برگشتن قطع می‌شود. با «بررسی دوباره» وضعیت را می‌گیری."
    }
  };
  const text = outcome === "paid" ? copy.cancelled : copy[outcome];

  return (
    <main dir="rtl" className="container relative z-20 mx-auto mb-24 mt-14 max-w-md px-4">
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
        <h1 className="text-xl font-extrabold">{text.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text.body}</p>

        {receipt}

        <div className="mt-6 flex flex-col items-center gap-3">
          {outcome === "lost" ? (
            <RecheckButton
              orderId={orderId}
              onVerified={() => router.replace(`/payment/result?order=${encodeURIComponent(orderId)}&outcome=paid`)}
            />
          ) : (
            <PayOrderButton orderId={orderId} planCode={data.planCode} label="تلاش دوباره" />
          )}
          <Link href="/checkout" className="text-xs text-muted-foreground underline underline-offset-4">
            انتخابِ دوبارهٔ مدتِ اشتراک
          </Link>
        </div>

        <div className="mt-7 flex flex-col items-center gap-2 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">سؤالی داری؟</p>
          <SupportButton />
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono" : "font-medium"}>{value}</dd>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main dir="rtl" className="container mx-auto mb-24 mt-20 max-w-md px-4 text-center text-sm text-muted-foreground">
      {children}
    </main>
  );
}
