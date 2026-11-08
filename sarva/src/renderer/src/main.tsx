import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* قلم‌ها از بستهٔ محلی می‌آیند، نه از Google Fonts: برنامه نباید برای یک فونت
   به شبکه وصل شود. همین دو قلمی‌اند که سروا روی وب استفاده می‌کرد —
   وزیرمتن برای متن و نستعلیق/نسخ برای شعر. */
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/600.css'
import '@fontsource/vazirmatn/700.css'
import '@fontsource/vazirmatn/900.css'
import '@fontsource/noto-naskh-arabic/400.css'
import '@fontsource/noto-naskh-arabic/600.css'
import '@fontsource/noto-naskh-arabic/700.css'

/* قلم‌های سروا: هفت خانواده با همان وزن‌ها و زنجیرهٔ fallbackِ نسخهٔ اصلی.
   پیش از styles.css می‌آید چون آن فایل از متغیّرهایش مصرف می‌کند. */
import './assets/fonts.css'
import './assets/styles.css'
import './styles/rtl.css'

import App from './App'
import { installPlatform } from '@/platform'

installPlatform()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
