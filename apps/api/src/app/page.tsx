export default function ApiHome() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 720,
        margin: '60px auto',
        padding: '0 20px',
        direction: 'rtl',
        lineHeight: 1.7,
      }}
    >
      <h1 style={{ fontSize: '28px', color: '#1e293b' }}>
        سرویس API پرشین پارت (PersianPart 2.0)
      </h1>
      <p style={{ color: '#475569', fontSize: '16px' }}>
        این سرویس با معماری <strong>oRPC v2</strong> پیاده‌سازی شده و امکان فراخوانی روی پروتکل RPC و همچنین روت‌های استاندارد REST/OpenAPI را فراهم می‌کند.
      </p>

      <section
        style={{
          marginTop: '32px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', color: '#0f172a' }}>
          اندپوینت‌های فعال:
        </h2>
        <ul style={{ paddingRight: '20px', margin: 0, color: '#334155' }}>
          <li>
            <strong>oRPC Endpoint:</strong> <code>/api/rpc</code> (فراخوانی متدهای تایپ‌سیف)
          </li>
          <li>
            <strong>OpenAPI REST:</strong> <code>/api/openapi</code> (دسترسی REST)
          </li>
          <li>
            <strong>Health Check:</strong> <code>/api/openapi/health/ping</code>
          </li>
          <li>
            <strong>Parts Catalog:</strong> <code>/api/openapi/parts</code>
          </li>
        </ul>
      </section>
    </main>
  )
}
