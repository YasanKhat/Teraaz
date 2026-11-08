import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * جانشینِ `next/dynamic`.
 *
 * سروا از آن برای عقب‌انداختنِ بسته‌های سنگین (صحنهٔ سه‌بعدیِ پلِ وزن،
 * کهکشانِ بازی‌ها) استفاده می‌کند. اینجا همان کار با `React.lazy` انجام
 * می‌شود: بارِ نخستِ مسیر سبک می‌ماند و صحنه بعد از نشستنِ متن می‌رسد.
 */

type Loader<T> = () => Promise<{ default: ComponentType<T> } | ComponentType<T>>

export default function dynamic<T = Record<string, unknown>>(
  loader: Loader<T>,
  options: { loading?: () => JSX.Element | null; ssr?: boolean } = {},
): ComponentType<T> {
  const Fallback = options.loading ?? (() => null)

  const Lazy = lazy(async () => {
    const mod = (await loader()) as { default?: ComponentType<T> } | ComponentType<T>
    const Component =
      mod && typeof mod === 'object' && 'default' in mod
        ? ((mod as { default: ComponentType<T> }).default as ComponentType<T>)
        : (mod as ComponentType<T>)
    return { default: Component }
  }) as LazyExoticComponent<ComponentType<T>>

  const Wrapped = (props: T) => (
    <Suspense fallback={<Fallback />}>
      <Lazy {...(props as object)} />
    </Suspense>
  )

  Wrapped.displayName = 'Dynamic'
  return Wrapped as ComponentType<T>
}
