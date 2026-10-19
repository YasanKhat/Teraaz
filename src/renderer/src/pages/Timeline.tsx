import { TimelineView } from '../components/TimelineView'
import { SectionHead } from '../components/ui'
import { timeline } from '../data/timeline'
import { fas } from '../lib/utils'

export function Timeline() {
  return (
    <div>
      <SectionHead
        kicker="تاریخ در یک نگاه"
        title={<>خط زمانِ <span className="gold-text">۱۳۰۰ سال</span> تاریخ</>}
        desc={`${fas(timeline.length)} رویداد کلیدی از جاهلیت تا پایان صفویه و اروپای جدید. روی هر رویداد بزن تا داستانش را بخوانی و به درس مرتبطش برسی.`}
      />
      <TimelineView />
    </div>
  )
}
