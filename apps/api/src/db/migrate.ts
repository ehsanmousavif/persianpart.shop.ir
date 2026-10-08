import { pool } from './index'

export async function runMigrationsAndSeed(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. CustomerTypes
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        markup_percent NUMERIC NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // 2. Customers
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        store_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        mobile TEXT NOT NULL UNIQUE,
        phone TEXT,
        province TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        customer_type_id TEXT NOT NULL REFERENCES customer_types(id),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        internal_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // 3. Staff Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'support')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // 4. OTPs
    await client.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id TEXT PRIMARY KEY,
        mobile TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed BOOLEAN NOT NULL DEFAULT FALSE,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_otps_mobile ON otps(mobile);
    `)

    // 5. Taxonomy: Categories, Brands, Tags
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        ordering INTEGER NOT NULL DEFAULT 0,
        parent_id TEXT REFERENCES categories(id),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // 6. Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        category_id TEXT REFERENCES categories(id),
        brand_id TEXT REFERENCES brands(id),
        color TEXT,
        finish TEXT,
        grade TEXT,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        width NUMERIC NOT NULL CHECK (width > 0),
        height NUMERIC NOT NULL CHECK (height > 0),
        pieces_per_carton INTEGER NOT NULL CHECK (pieces_per_carton > 0),
        sqm_per_carton NUMERIC NOT NULL CHECK (sqm_per_carton > 0),
        cover TEXT,
        gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
        rich_description TEXT,
        base_price_per_sqm NUMERIC NOT NULL DEFAULT 0 CHECK (base_price_per_sqm >= 0),
        inventory_sqm NUMERIC NOT NULL DEFAULT 0 CHECK (inventory_sqm >= 0),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    `)

    // 7. Orders, OrderItems, OrderTimelines
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        status TEXT NOT NULL CHECK (status IN ('pending_review', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
        total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
        total_sqm NUMERIC NOT NULL DEFAULT 0,
        total_cartons INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        cancellation_deadline TIMESTAMPTZ NOT NULL,
        cancellation_reason TEXT,
        cancellation_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        sku TEXT NOT NULL,
        product_name TEXT NOT NULL,
        requested_sqm NUMERIC NOT NULL CHECK (requested_sqm > 0),
        carton_count INTEGER NOT NULL CHECK (carton_count > 0),
        sqm_per_carton NUMERIC NOT NULL CHECK (sqm_per_carton > 0),
        actual_sqm NUMERIC NOT NULL CHECK (actual_sqm > 0),
        base_price_per_sqm NUMERIC NOT NULL CHECK (base_price_per_sqm >= 0),
        customer_type_id TEXT NOT NULL,
        customer_type_name TEXT NOT NULL,
        markup_percent NUMERIC NOT NULL,
        final_price_per_sqm NUMERIC NOT NULL CHECK (final_price_per_sqm >= 0),
        line_total NUMERIC NOT NULL CHECK (line_total >= 0)
      );

      CREATE TABLE IF NOT EXISTS order_timelines (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'staff', 'system')),
        actor_id TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // 8. Import Runs (CSV History)
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_runs (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('preview', 'applied', 'failed')),
        total_rows INTEGER NOT NULL DEFAULT 0,
        valid_rows INTEGER NOT NULL DEFAULT 0,
        changed_rows INTEGER NOT NULL DEFAULT 0,
        unchanged_rows INTEGER NOT NULL DEFAULT 0,
        unknown_sku_rows INTEGER NOT NULL DEFAULT 0,
        invalid_rows INTEGER NOT NULL DEFAULT 0,
        report JSONB NOT NULL DEFAULT '{}'::jsonb,
        applied_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // 9. Immutable Audit Events
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'staff', 'system')),
        actor_id TEXT NOT NULL,
        actor_name TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
    `)

    // 10. Global Configs (Singleton JSON store)
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_configs (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // Seed defaults if empty
    // Seed CustomerTypes
    await client.query(`
      INSERT INTO customer_types (id, name, slug, markup_percent, is_active, description)
      VALUES 
        ('ct-wholesale', 'عمده‌فروش / پیمانکار', 'wholesale', 5, true, 'نرخ ویژه بنکداران و پیمانکاران پروژه‌ای'),
        ('ct-retail', 'خرده‌فروش / عاملیت', 'retail', 10, true, 'نرخ استاندارد همکاران و فروشگاه‌های شهری')
      ON CONFLICT (id) DO NOTHING;
    `)

    // Seed Default Staff (Admin & Support)
    // password for both is 'admin123456' hashed or dev standard
    await client.query(`
      INSERT INTO staff_users (id, name, mobile, email, password_hash, role, is_active)
      VALUES
        ('staff-admin', 'مدیر ارشد پرشین پارت', '09120000001', 'admin@persianpart.shop', 'admin123456', 'admin', true),
        ('staff-support', 'کارشناس پشتیبانی و فروش', '09120000002', 'support@persianpart.shop', 'support123456', 'support', true)
      ON CONFLICT (id) DO NOTHING;
    `)

    // Seed a Default Active Customer for dev/testing
    await client.query(`
      INSERT INTO customers (id, store_name, contact_name, mobile, phone, province, city, address, customer_type_id, is_active, internal_notes)
      VALUES
        ('cust-1', 'بازرگانی کاشی و سرامیک البرز', 'مهندس رضایی', '09121111111', '02188776655', 'تهران', 'تهران', 'خیابان ملاصدرا، پلاک ۱۲', 'ct-wholesale', true, 'مشتری معتبر خوش‌حساب')
      ON CONFLICT (id) DO NOTHING;
    `)

    // Seed Categories
    await client.query(`
      INSERT INTO categories (id, name, slug, ordering, is_active)
      VALUES
        ('cat-porcelain', 'پرسلان لعابدار', 'porcelain', 1, true),
        ('cat-slab', 'اسلب سایز بزرگ', 'slab', 2, true),
        ('cat-wall', 'کاشی دیواری', 'wall', 3, true)
      ON CONFLICT (id) DO NOTHING;
    `)

    // Seed Brands
    await client.query(`
      INSERT INTO brands (id, name, slug, is_active)
      VALUES
        ('brand-persian', 'کاشی پرشین', 'persian-tile', true),
        ('brand-alborz', 'سرامیک البرز', 'alborz-ceramic', true)
      ON CONFLICT (id) DO NOTHING;
    `)

    // Seed Sample Products
    await client.query(`
      INSERT INTO products (
        id, sku, name, slug, category_id, brand_id, color, finish, grade, tags,
        width, height, pieces_per_carton, sqm_per_carton, cover, gallery,
        base_price_per_sqm, inventory_sqm, is_active
      )
      VALUES
        (
          'prod-1', 'TILE-CALACATTA-60120', 'سرامیک پرسلان کالیبره طرح کلکته', 'tile-calacatta-60120',
          'cat-porcelain', 'brand-persian', 'سفید طوسی', 'polished', 'grade_1', '["کف", "پرسلان", "کالیبره"]'::jsonb,
          60, 120, 2, 1.44, '/media/calacatta.jpg', '[]'::jsonb,
          450000, 850.5, true
        ),
        (
          'prod-2', 'SLAB-NERO-120240', 'اسلب سوپر پرسلان مشکی مارکینا', 'slab-nero-120240',
          'cat-slab', 'brand-persian', 'مشکی طلایی', 'glossy', 'grade_1', '["اسلب", "لاکچری"]'::jsonb,
          120, 240, 1, 2.88, '/media/nero.jpg', '[]'::jsonb,
          1150000, 320.0, true
        ),
        (
          'prod-3', 'WALL-TRAVERTINE-3090', 'کاشی پرسلان دیواری طرح تراورتن', 'wall-travertine-3090',
          'cat-wall', 'brand-alborz', 'کرم روشن', 'matte', 'grade_2', '["دیوار", "مات"]'::jsonb,
          30, 90, 4, 1.08, '/media/travertine.jpg', '[]'::jsonb,
          320000, 1200.0, true
        )
      ON CONFLICT (id) DO NOTHING;
    `)

    // Seed Global Configs
    await client.query(`
      INSERT INTO global_configs (key, value)
      VALUES
        ('commerce', '{"currency": "Toman", "priceRoundingPolicy": "ceil_to_1000", "availabilityThresholds": {"limitedStockMaxSqm": 50}}'::jsonb),
        ('ordering', '{"customerCancellationWindowMinutes": 120, "orderingEnabled": true}'::jsonb),
        ('catalog', '{"activeFilters": ["dimensions", "brand", "color", "finish", "grade", "category"], "inventoryDisplayBehavior": "badge_only"}'::jsonb),
        ('support', '{"supportPhone": "۰۲۱-۸۸۸۸۸۸۸۸", "supportContact": "امور مشتریان پرشین پارت", "workingHours": "شنبه تا چهارشنبه ۸:۳۰ تا ۱۷:۰۰", "supportMessages": {"outOfHoursMessage": "در ساعات غیر اداری، سفارش‌ها در اولین روز کاری بررسی می‌شوند."}}'::jsonb)
      ON CONFLICT (key) DO NOTHING;
    `)

    await client.query('COMMIT')
    console.log('[PostgreSQL Migration] All tables, indexes, constraints, and seed data initialized successfully!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[PostgreSQL Migration Error]:', err)
    throw err
  } finally {
    client.release()
  }
}
