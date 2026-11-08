import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * دیوارِ خطا.
 *
 * روی وب، اگر یک صفحه هنگامِ رندر خطا می‌داد، Next آن را با یک صفحهٔ خطا عوض
 * می‌کرد و بقیهٔ سایت سر جایش می‌ماند. در یک برنامهٔ تک‌صفحه‌ای بدونِ این دیوار،
 * یک خطا در هر جای درخت کلِ پنجره را سفید می‌کند — بدترین چیزی که می‌تواند
 * برای کسی که وسطِ یک آزمونِ نهایی است اتفاق بیفتد.
 *
 * پس هر مسیر را جداگانه می‌گیریم: خطا همان‌جا می‌ماند، پیامی به فارسی نشان
 * داده می‌شود و کاربر می‌تواند به صفحهٔ اصلی برگردد یا همان مسیر را دوباره
 * امتحان کند.
 */

type Props = {
  /** با عوض‌شدنِ مسیر، دیوار خودش را بازنشانی می‌کند. */
  resetKey?: string
  children: ReactNode
}

type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // در کنسول هم می‌ماند تا هنگامِ توسعه دیده شود.
    console.error('خطا در رندرِ صفحه:', error, info.componentStack)
  }

  componentDidUpdate(prev: Props): void {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  private retry = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        dir="rtl"
        className="mx-auto my-16 max-w-xl rounded-2xl border border-destructive/40 bg-card p-8 text-center"
      >
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          این صفحه خطا داد
        </h1>
        <p className="mb-6 leading-7 text-muted-foreground">
          بقیهٔ برنامه سر جایش است و کارهای شما ذخیره شده. می‌توانید دوباره
          امتحان کنید یا به صفحهٔ اصلی برگردید.
        </p>

        <pre
          dir="ltr"
          className="mb-6 overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground"
        >
          {error.message}
        </pre>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={this.retry}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            دوباره امتحان کن
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/'
            }}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            صفحهٔ اصلی
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
