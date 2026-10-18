import { useEffect, useMemo, useState } from 'react'
import type * as React from 'react'
import {
  Boxes,
  Download,
  Package,
  PackageSearch,
  Pencil,
  Plus,
  Tag,
  Trash2,
  TrendingUp
} from 'lucide-react'
import clsx from 'clsx'
import {
  currentStock,
  inventoryValue,
  lowStockProducts,
  stockState
} from '../domain/calc'
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_COLORS } from '../domain/catalogs'
import { money } from '../lib/format'
import { fa } from '../lib/digits'
import { downloadCsv } from '../lib/export'
import { todayIso } from '../lib/jalali'
import { useApp } from '../store/useApp'
import { confirmAction, toast, useNav } from '../store/ui'
import type { Product } from '../domain/types'
import {
  AmountInput,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Pagination,
  Progress,
  SearchField,
  matchesSearch
} from '../components/kit'

type StockFilter = 'all' | 'ok' | 'low' | 'out'

const UNITS = ['عدد', 'تخته', 'متر', 'سرویس', 'بسته', 'کیلوگرم']

export function ProductsPage(): React.JSX.Element {
  const data = useApp()
  const saveProduct = useApp((state) => state.saveProduct)
  const deleteProduct = useApp((state) => state.deleteProduct)
  const createIntent = useNav((state) => state.create)
  const clearCreate = useNav((state) => state.clearCreate)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  useEffect(() => {
    if (createIntent) {
      setEditing(null)
      setFormOpen(true)
      clearCreate()
    }
  }, [createIntent, clearCreate])

  const filtered = useMemo(() => {
    return data.products
      .filter((product) => category === 'all' || product.category === category)
      .filter((product) => {
        if (stockFilter === 'all') return true
        return stockState(product, data) === stockFilter
      })
      .filter((product) =>
        matchesSearch(`${product.name} ${product.code} ${product.category} ${product.unit}`, query)
      )
      .sort((a, b) => currentStock(a, data) - currentStock(b, data))
  }, [data, category, stockFilter, query])

  const pageSize = 9
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [query, category, stockFilter])

  const inventory = inventoryValue(data)
  const low = lowStockProducts(data)
  const averageMargin = data.products.length
    ? data.products.reduce(
        (sum, product) => sum + (product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0),
        0
      ) / data.products.length
    : 0

  const remove = async (product: Product): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'حذف کالا',
      message: `«${product.name}» حذف شود؟ اگر در فاکتورها استفاده شده باشد، حذف انجام نمی‌شود.`,
      confirmLabel: 'حذف کالا',
      danger: true
    })
    if (!confirmed) return
    const result = deleteProduct(product.id)
    if (!result.ok) {
      toast.error('حذف انجام نشد', result.error)
      return
    }
    toast.success('کالا حذف شد', product.name)
  }

  const exportRows = (): void => {
    const rows: (string | number)[][] = [
      ['نام', 'کد', 'دسته', 'واحد', 'قیمت فروش', 'بهای تمام‌شده', 'موجودی', 'حداقل موجودی']
    ]
    for (const product of filtered) {
      rows.push([
        product.name,
        product.code,
        product.category,
        product.unit,
        product.price,
        product.cost,
        currentStock(product, data),
        product.minStock
      ])
    }
    downloadCsv(`taraz-products-${todayIso().replaceAll('-', '')}.csv`, rows)
    toast.success('خروجی CSV آماده شد')
  }

  return (
    <div className="page">
      <PageHeader
        title="کالا و خدمات"
        subtitle="قیمت‌گذاری، بهای تمام‌شده و موجودی انبار؛ همیشه به‌روز با هر فاکتور فروش و خرید."
        actions={
          <>
            <Button variant="ghost" icon={Download} onClick={exportRows}>
              خروجی CSV
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              کالا یا خدمت جدید
            </Button>
          </>
        }
      />

      <div className="grid grid-4">
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">ارزش موجودی انبار</span>
            <span className="kpi-icon">
              <Boxes size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {money(inventory)}
            <span className="unit">تومان</span>
          </div>
          <div className="kpi-foot">
            <span>بر مبنای بهای تمام‌شده</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">تعداد اقلام</span>
            <span className="kpi-icon blue">
              <Package size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {fa(data.products.length)}
            <span className="unit">قلم</span>
          </div>
          <div className="kpi-foot">
            <span>در {fa(new Set(data.products.map((item) => item.category)).size)} دسته</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">نیازمند تأمین</span>
            <span className="kpi-icon gold">
              <PackageSearch size={16} />
            </span>
          </div>
          <div className="kpi-value" style={{ color: low.length ? 'var(--warning)' : 'var(--success)' }}>
            {fa(low.length)}
            <span className="unit">قلم</span>
          </div>
          <div className="kpi-foot">
            <span>{low.length ? 'موجودی زیر حداقل است' : 'همه اقلام در حد مطلوب'}</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">حاشیه سود میانگین</span>
            <span className="kpi-icon violet">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="kpi-value">{fa(Math.round(averageMargin))}٪</div>
          <div className="kpi-foot">
            <span>اختلاف قیمت فروش و بهای تمام‌شده</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-head" style={{ paddingBottom: 14, flexWrap: 'wrap' }}>
          <div>
            <div className="card-title">فهرست کالاها و خدمات</div>
            <div className="card-sub">کالاهای کم‌موجود در ابتدای فهرست نمایش داده می‌شوند.</div>
          </div>
          <SearchField value={query} onChange={setQuery} placeholder="نام یا کد کالا…" />
        </div>
        <div className="card-pad" style={{ paddingTop: 0, paddingBottom: 14 }}>
          <div className="filter-bar">
            <div className="filter-group">
              <button
                className={clsx('chip', category === 'all' && 'active')}
                onClick={() => setCategory('all')}
              >
                همه دسته‌ها
              </button>
              {PRODUCT_CATEGORIES.map((item) => (
                <button
                  key={item}
                  className={clsx('chip', category === item && 'active')}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="segmented">
              {([
                { key: 'all', label: 'همه' },
                { key: 'ok', label: 'موجود' },
                { key: 'low', label: 'کم‌موجود' },
                { key: 'out', label: 'ناموجود' }
              ] as { key: StockFilter; label: string }[]).map((item) => (
                <button
                  key={item.key}
                  className={clsx('segment', stockFilter === item.key && 'active')}
                  onClick={() => setStockFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="کالایی مطابق فیلترها نیست"
            text="دسته یا وضعیت موجودی دیگری را انتخاب کنید یا یک کالای جدید بسازید."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setFormOpen(true)}>
                افزودن کالا
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>کالا / خدمت</th>
                    <th>دسته</th>
                    <th>قیمت فروش</th>
                    <th>بهای تمام‌شده</th>
                    <th>حاشیه سود</th>
                    <th>موجودی</th>
                    <th className="text-end">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((product) => {
                    const stock = currentStock(product, data)
                    const state = stockState(product, data)
                    const unlimited = product.category === 'خدمات'
                    const margin =
                      product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0
                    const ratio = product.minStock > 0 ? Math.min(100, (Math.max(0, stock) / (product.minStock * 2)) * 100) : 100
                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="customer-cell">
                            <span
                              className="product-thumb"
                              style={{
                                background: `${PRODUCT_CATEGORY_COLORS[product.category] ?? '#0E7C66'}18`,
                                color: PRODUCT_CATEGORY_COLORS[product.category] ?? 'var(--accent)',
                                borderColor: `${PRODUCT_CATEGORY_COLORS[product.category] ?? '#0E7C66'}30`
                              }}
                            >
                              {product.name.slice(0, 2)}
                            </span>
                            <div>
                              <div className="c-name">{product.name}</div>
                              <div className="c-sub ltr" style={{ direction: 'ltr' }}>
                                {product.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral">
                            <Tag size={10} />
                            {product.category}
                          </span>
                        </td>
                        <td className="num cell-main">{money(product.price)}</td>
                        <td className="num muted">{money(product.cost)}</td>
                        <td>
                          <BadgeMargin margin={margin} />
                        </td>
                        <td>
                          {unlimited ? (
                            <span className="badge badge-accent">بی‌نهایت</span>
                          ) : (
                            <div className="stock-meter">
                              <div className="stock-label">
                                <span>{fa(stock)} {product.unit}</span>
                                <span>حداقل {fa(product.minStock)}</span>
                              </div>
                              <Progress
                                value={ratio}
                                tone={state === 'ok' ? 'accent' : 'gold'}
                                className="thin"
                              />
                              <div className="mt-1">
                                {state === 'out' ? (
                                  <span className="badge badge-danger">ناموجود</span>
                                ) : state === 'low' ? (
                                  <span className="badge badge-warning">کم‌موجود</span>
                                ) : (
                                  <span className="badge badge-success">موجود</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-btn sm ghost"
                              title="ویرایش"
                              onClick={() => {
                                setEditing(product)
                                setFormOpen(true)
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className="icon-btn sm ghost"
                              title="حذف"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => remove(product)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={setPage}
              total={filtered.length}
              pageSize={pageSize}
            />
          </>
        )}
      </Card>

      <ProductForm
        open={formOpen}
        product={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={(draft) => {
          saveProduct({ ...draft, id: editing?.id })
          toast.success(editing ? 'کالا ویرایش شد' : 'کالای جدید ثبت شد', draft.name)
          setFormOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function BadgeMargin({ margin }: { margin: number }): React.JSX.Element {
  const tone = margin >= 35 ? 'success' : margin >= 20 ? 'warning' : 'danger'
  return (
    <span className={`badge badge-${tone}`}>
      {fa(Math.round(margin))}٪
    </span>
  )
}

function ProductForm({
  open,
  product,
  onClose,
  onSave
}: {
  open: boolean
  product: Product | null
  onClose: () => void
  onSave: (draft: Omit<Product, 'createdAt' | 'id'>) => void
}): React.JSX.Element {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<string>('فرش')
  const [unit, setUnit] = useState('عدد')
  const [price, setPrice] = useState(0)
  const [cost, setCost] = useState(0)
  const [openingStock, setOpeningStock] = useState(0)
  const [minStock, setMinStock] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? '')
    setCode(product?.code ?? '')
    setCategory(product?.category ?? 'فرش')
    setUnit(product?.unit ?? 'عدد')
    setPrice(product?.price ?? 0)
    setCost(product?.cost ?? 0)
    setOpeningStock(product?.openingStock ?? 0)
    setMinStock(product?.minStock ?? 0)
    setError('')
  }, [open, product])

  const submit = (): void => {
    if (!name.trim()) {
      setError('نام کالا یا خدمت را وارد کنید.')
      return
    }
    if (price <= 0) {
      setError('قیمت فروش باید بیشتر از صفر باشد.')
      return
    }
    if (cost < 0) {
      setError('بهای تمام‌شده نمی‌تواند منفی باشد.')
      return
    }
    onSave({
      name: name.trim(),
      code: code.trim() || `SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
      category,
      unit,
      price: Math.round(price),
      cost: Math.round(cost),
      openingStock: Math.max(0, Math.round(openingStock)),
      minStock: Math.max(0, Math.round(minStock))
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'ویرایش کالا' : 'کالا یا خدمت جدید'}
      subtitle="با هر فاکتور فروش و خرید، موجودی این کالا به‌صورت خودکار به‌روز می‌شود."
      size="wide"
      footer={
        <>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" icon={Package} onClick={submit}>
            {product ? 'ذخیره تغییرات' : 'ثبت کالا'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="نام کالا / خدمت" required className="full">
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثلاً فرش دستباف تبریز ۶ متری"
            autoFocus
          />
        </Field>
        <Field label="کد کالا" hint="در صورت خالی بودن، خودکار ساخته می‌شود">
          <input
            className="input ltr"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="FR-601"
          />
        </Field>
        <Field label="دسته‌بندی">
          <select
            className="select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {PRODUCT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="واحد شمارش">
          <select className="select" value={unit} onChange={(event) => setUnit(event.target.value)}>
            {UNITS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="قیمت فروش" required>
          <AmountInput value={price} onChange={setPrice} />
        </Field>
        <Field label="بهای تمام‌شده" hint="برای محاسبهٔ سود و ارزش انبار">
          <AmountInput value={cost} onChange={setCost} />
        </Field>
        <Field label="موجودی افتتاحیه" hint="پیش از فاکتورهای ثبت‌شده">
          <input
            className="input ltr"
            type="number"
            min={0}
            value={openingStock}
            onChange={(event) => setOpeningStock(Number(event.target.value) || 0)}
          />
        </Field>
        <Field label="حداقل موجودی" hint="برای هشدار کم‌موجودی">
          <input
            className="input ltr"
            type="number"
            min={0}
            value={minStock}
            onChange={(event) => setMinStock(Number(event.target.value) || 0)}
          />
        </Field>
      </div>

      {price > 0 ? (
        <div className="insight mt-2">
          <TrendingUp size={15} />
          <div>
            حاشیه سود این کالا:{' '}
            <b>{fa(Math.round(((price - cost) / price) * 100))}٪</b> · سود هر واحد:{' '}
            <b>{money(Math.max(0, price - cost))} تومان</b>
          </div>
        </div>
      ) : null}
      {error ? <div className="field-error mt-1">{error}</div> : null}
    </Modal>
  )
}
