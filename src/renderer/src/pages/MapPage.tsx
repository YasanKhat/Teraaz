import { MapView } from '../components/MapView'
import { SectionHead } from '../components/ui'
import { cities, markers, routes } from '../data/map'
import { fas } from '../lib/utils'

export function MapPage() {
  return (
    <div>
      <SectionHead
        kicker="جغرافیای تاریخ"
        title={<>نقشهٔ <span className="gold-text">جهان اسلام</span> و ایران</>}
        desc={`${fas(cities.length)} شهر، ${fas(markers.length)} نشان و ${fas(routes.length)} مسیر تاریخی: از مکه و مدینه تا بغداد، اصفهان و سمرقند. مسیرها را دنبال کن تا ببینی تاریخ چگونه جابه‌جا می‌شود.`}
      />
      <MapView />
    </div>
  )
}
