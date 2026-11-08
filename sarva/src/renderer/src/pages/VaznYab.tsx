import VaznYabHero3D from '@/components/UI/vazn-yab/VaznYabHero3D'
import MasterChallenge from '@/components/UI/vazn-yab/MasterChallenge'
import VaznYabSection from '@/components/UI/guide/VaznYabSection'

/**
 * وزن‌یاب — همان سه بخشِ صفحهٔ سایت.
 *
 * تفاوتِ این نسخه با وب در یک چیز است و آن هم به نفعِ آفلاین: اگر اینترنت
 * وصل باشد، وزن از گنجور تأیید می‌شود (نشانِ «ثبت‌شده در گنجور»)؛ اگر نباشد،
 * همان موتورِ عروضِ خودِ سروا پاسخ می‌دهد. کاربر در هر دو حال جواب می‌گیرد.
 */
export default function VaznYab() {
  return (
    <>
      <VaznYabHero3D />
      <MasterChallenge />
      <VaznYabSection />
    </>
  )
}
