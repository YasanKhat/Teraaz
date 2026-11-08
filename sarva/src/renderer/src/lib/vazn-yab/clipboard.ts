/**
 * رونوشت‌برداری از متن.
 *
 * سایت روی HTTPS اجرا می‌شود و همان یک خط `navigator.clipboard.writeText` کافی‌اش
 * است. این پورت یک برنامه‌ی الکترون است که صفحه را از `file://` بالا می‌آورد، و
 * در بعضی محیط‌ها Clipboard API یا نیست یا اجازه نمی‌دهد؛ در آن حالت خطا خاموش
 * خورده می‌شد و کاربر با زدنِ دکمه هیچ بازخوردی نمی‌دید. برای همین اینجا یک
 * راهِ پشتیبان دارد: یک textareaی موقت و فرمانِ قدیمیِ `copy`.
 *
 * برگشتی‌اش روشن می‌کند که آیا متن واقعاً رونوشت شد، تا UI بتواند درست پاسخ
 * بدهد.
 */

export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* می‌رویم سراغِ راهِ پشتیبان */
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
