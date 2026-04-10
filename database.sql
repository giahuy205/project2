--
-- PostgreSQL database dump
--


CREATE FUNCTION public.block_delete_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Không được phép xóa hóa đơn đã xuất! Vui lòng dùng chức năng Hoàn trả nếu cần.';
    RETURN NULL;
END;
$$;


CREATE FUNCTION public.check_admin_privilege() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_role VARCHAR(20);
BEGIN
    -- 1. Lấy role của người đang thực hiện chỉnh sửa
    -- Lưu ý: Bạn cần gửi account_id từ Backend vào một biến session hoặc 
    -- xử lý logic này ở tầng Flask. 
    -- Tuy nhiên, nếu muốn bắt chặt ở DB, ta dựa vào id người cập nhật:
    
    SELECT role INTO v_role FROM public.accounts WHERE id = NEW.updated_by_id; -- Giả sử bạn có cột này ở bảng products

    IF v_role != 'admin' THEN
        RAISE EXCEPTION 'Quyền hạn không đủ! Chỉ Admin mới có thể thay đổi giá sản phẩm.';
    END IF;

    RETURN NEW;
END;
$$;


CREATE FUNCTION public.log_price_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Chỉ ghi log nếu giá nhập hoặc giá bán có sự thay đổi
    IF (OLD.import_price <> NEW.import_price OR OLD.sale_price <> NEW.sale_price) THEN
        INSERT INTO public.price_histories (
            product_id, 
            old_import_price, new_import_price, 
            old_selling_price, new_selling_price, 
            updated_by, updated_at
        )
        VALUES (
            OLD.id, 
            OLD.import_price, NEW.import_price, 
            OLD.sale_price, NEW.sale_price, 
            NEW.updated_by_id, CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$;


CREATE FUNCTION public.update_order_amounts_final() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_tax_rate numeric;
    v_item_tax numeric;
BEGIN
    -- 1. Lấy mức thuế suất bằng cách nối từ Product sang Category
    SELECT c.tax_rate INTO v_tax_rate 
    FROM public.products p
    JOIN public.categories c ON p.categories_id = c.id
    WHERE p.id = NEW.product_id;

    -- Nếu sản phẩm không thuộc danh mục nào, mặc định thuế = 0
    v_tax_rate := COALESCE(v_tax_rate, 0);

    -- 2. Gán mức thuế tại thời điểm bán vào dòng chi tiết hóa đơn
    -- (Đảm bảo bạn đã ALTER TABLE order_items ADD COLUMN applied_tax_rate numeric)
    NEW.applied_tax_rate := v_tax_rate;

    -- 3. Tính tiền hàng chưa thuế cho món này (Số lượng * Đơn giá)
    NEW.sub_total := NEW.quantity * NEW.unit_price;
    
    -- 4. Tính tiền thuế riêng cho món hàng này
    v_item_tax := NEW.sub_total * v_tax_rate;

    -- 5. Cập nhật tổng số tiền vào bảng orders (đầu hóa đơn)
    UPDATE public.orders
    SET 
        net_amount = net_amount + NEW.sub_total,
        tax = tax + v_item_tax,
        total_amount = total_amount + (NEW.sub_total + v_item_tax)
    WHERE id = NEW.order_id;

    -- Trả về dòng dữ liệu mới đã được điền đủ sub_total và applied_tax_rate
    RETURN NEW; 
END;
$$;


CREATE FUNCTION public.update_order_amounts_v3() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_tax_rate numeric;
    v_item_tax numeric;
BEGIN
    -- 1. Lấy mức thuế suất bằng cách nối từ Product sang Category
    SELECT c.tax_rate INTO v_tax_rate 
    FROM public.products p
    JOIN public.categories c ON p.categories_id = c.id
    WHERE p.id = NEW.product_id;

    -- Nếu sản phẩm không thuộc danh mục nào hoặc danh mục chưa có thuế, mặc định là 0
    v_tax_rate := COALESCE(v_tax_rate, 0);

    -- 2. Tính tiền hàng chưa thuế cho món này
    NEW.sub_total := NEW.quantity * NEW.unit_price;
    
    -- 3. Tính tiền thuế riêng cho món hàng này
    v_item_tax := NEW.sub_total * v_tax_rate;

    -- 4. Cập nhật bảng tổng orders
    UPDATE public.orders
    SET 
        net_amount = net_amount + NEW.sub_total,
        tax = tax + v_item_tax,
        total_amount = total_amount + (NEW.sub_total + v_item_tax)
    WHERE id = NEW.order_id;

    RETURN NEW;
END;
$$;


CREATE FUNCTION public.update_stock_and_log_import() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_old_stock numeric;
    v_new_stock numeric;
BEGIN
    -- 1. Lấy số lượng hiện tại của sản phẩm (Dùng FOR UPDATE để khóa dòng, tránh lỗi khi nhập nhiều phiếu cùng lúc)
    SELECT stock_quantity INTO v_old_stock 
    FROM public.products 
    WHERE id = NEW.product_id 
    FOR UPDATE;

    -- 2. Tính toán tồn kho mới
    v_new_stock := v_old_stock + NEW.quantity;

    -- 3. Cập nhật bảng sản phẩm
    UPDATE public.products 
    SET stock_quantity = v_new_stock 
    WHERE id = NEW.product_id;

    -- 4. Ghi lịch sử vào inventory_logs
    INSERT INTO public.inventory_logs (
        product_id, 
        change_amount, 
        old_stock, 
        new_stock, 
        type, 
        note, 
        time
    )
    VALUES (
        NEW.product_id, 
        NEW.quantity,    -- Số dương (nhập hàng)
        v_old_stock, 
        v_new_stock, 
        'IMPORT', 
        'Nhập hàng từ phiếu ID: ' || NEW.import_id, 
        CURRENT_TIMESTAMP
    );

    RETURN NEW;
END;
$$;


CREATE FUNCTION public.update_stock_and_log_return() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_old_stock numeric;
    v_new_stock numeric;
BEGIN
    -- 1. Lấy số lượng tồn kho hiện tại của sản phẩm
    SELECT stock_quantity INTO v_old_stock 
    FROM public.products 
    WHERE id = NEW.product_id 
    FOR UPDATE;

    -- 2. Logic cộng kho: Chỉ cộng lại nếu hàng còn tốt (Good)
    -- Nếu hàng hỏng (Damaged), kho giữ nguyên để không bán nhầm hàng lỗi
    IF NEW.item_condition = 'Good' THEN
        v_new_stock := v_old_stock + NEW.quantity;
        UPDATE public.products SET stock_quantity = v_new_stock WHERE id = NEW.product_id;
    ELSE
        v_new_stock := v_old_stock; 
    END IF;

    -- 3. Ghi nhật ký kho (inventory_logs)
    INSERT INTO public.inventory_logs (
        product_id, change_amount, old_stock, new_stock, type, note, time
    )
    VALUES (
        NEW.product_id, 
        NEW.quantity, 
        v_old_stock, 
        v_new_stock, 
        'RETURN', 
        'Hoàn trả từ Phiếu hoàn ID: ' || NEW.return_id, 
        CURRENT_TIMESTAMP
    );

    -- 4. Tự động cộng dồn tổng tiền hoàn lại vào bảng returns (phần Header)
    UPDATE public.returns 
    SET total_refund_amount = total_refund_amount + (NEW.quantity * NEW.refund_price)
    WHERE id = NEW.return_id;

    RETURN NEW;
END;
$$;


CREATE FUNCTION public.update_stock_and_log_sale() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_old_stock numeric;
    v_new_stock numeric;
BEGIN
    -- 1. Lấy số lượng tồn kho hiện tại và khóa dòng đó để tránh tranh chấp (Race condition)
    SELECT stock_quantity INTO v_old_stock 
    FROM public.products 
    WHERE id = NEW.product_id 
    FOR UPDATE;

    -- 2. Tính toán số lượng mới
    v_new_stock := v_old_stock - NEW.quantity;

    -- 3. Cập nhật số lượng mới vào bảng products
    UPDATE public.products 
    SET stock_quantity = v_new_stock 
    WHERE id = NEW.product_id;

    -- 4. Ghi nhật ký chi tiết vào inventory_logs
    INSERT INTO public.inventory_logs (
        product_id, 
        change_amount, 
        old_stock, 
        new_stock, 
        type, 
        note, 
        time
    )
    VALUES (
        NEW.product_id, 
        -NEW.quantity, -- Số âm thể hiện việc xuất kho
        v_old_stock, 
        v_new_stock, 
        'SALE', 
        'Hóa đơn ID: ' || NEW.order_id, 
        CURRENT_TIMESTAMP
    );

    RETURN NEW;
END;
$$;


CREATE FUNCTION public.update_total_import_cost() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Cộng dồn (số lượng * đơn giá) vào tổng tiền của phiếu nhập tương ứng
    UPDATE public.imports 
    SET total_cost = total_cost + (NEW.quantity * NEW.unit_price)
    WHERE id = NEW.import_id;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;


CREATE TABLE public.accounts (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100),
    role character varying(20) DEFAULT 'staff'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


CREATE TABLE public.categories (
    id integer CONSTRAINT "categories _id_not_null" NOT NULL,
    name character varying(100) CONSTRAINT "categories _name_not_null" NOT NULL,
    note character varying(255),
    tax_rate numeric DEFAULT 0.08
);


CREATE SEQUENCE public."categories _id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."categories _id_seq" OWNED BY public.categories.id;


CREATE TABLE public.import_items (
    id integer NOT NULL,
    import_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(15,2) NOT NULL
);


CREATE SEQUENCE public.import_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_items_id_seq OWNED BY public.import_items.id;


CREATE TABLE public.imports (
    id integer NOT NULL,
    supplier_name character varying(255),
    total_cost numeric(15,2) DEFAULT 0,
    import_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE SEQUENCE public.imports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 230
-- Name: imports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imports_id_seq OWNED BY public.imports.id;


--
-- TOC entry 229 (class 1259 OID 16699)
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_logs (
    id integer NOT NULL,
    product_id integer NOT NULL,
    change_amount numeric NOT NULL,
    old_stock numeric NOT NULL,
    new_stock numeric NOT NULL,
    type character varying(50),
    note character varying(200),
    "time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 228 (class 1259 OID 16698)
-- Name: inventory_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 228
-- Name: inventory_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_logs_id_seq OWNED BY public.inventory_logs.id;


--
-- TOC entry 227 (class 1259 OID 16595)
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer,
    quantity numeric NOT NULL,
    unit_price numeric NOT NULL,
    sub_total numeric,
    applied_tax_rate numeric,
    CONSTRAINT check_order_items_positive CHECK (((quantity > (0)::numeric) AND (unit_price >= (0)::numeric)))
);


--
-- TOC entry 226 (class 1259 OID 16594)
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 226
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 224 (class 1259 OID 16430)
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer CONSTRAINT orders_order_id_not_null NOT NULL,
    order_date date,
    net_amount numeric DEFAULT 0 NOT NULL,
    tax numeric DEFAULT 0 NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    CONSTRAINT check_order_total_positive CHECK ((total_amount >= (0)::numeric))
);


--
-- TOC entry 225 (class 1259 OID 16444)
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 225
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.id;


--
-- TOC entry 241 (class 1259 OID 16844)
-- Name: price_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_histories (
    id integer CONSTRAINT price_historis_id_not_null NOT NULL,
    product_id integer CONSTRAINT price_historis_product_id_not_null NOT NULL,
    old_import_price numeric(12,2),
    new_import_price numeric(12,2),
    old_selling_price numeric(12,2),
    new_selling_price numeric(12,2),
    updated_by integer CONSTRAINT price_historis_updated_by_not_null NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 240 (class 1259 OID 16843)
-- Name: price_historis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_historis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 240
-- Name: price_historis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_historis_id_seq OWNED BY public.price_histories.id;


--
-- TOC entry 221 (class 1259 OID 16400)
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer CONSTRAINT "products_id _not_null" NOT NULL,
    categories_id integer NOT NULL,
    barcode character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    import_price numeric NOT NULL,
    sale_price numeric NOT NULL,
    stock_quantity numeric DEFAULT 0,
    low_stock numeric DEFAULT 10,
    created_at timestamp with time zone,
    updated_by_id integer,
    CONSTRAINT check_positive_prices CHECK (((import_price >= (0)::numeric) AND (sale_price >= (0)::numeric)))
);


--
-- TOC entry 223 (class 1259 OID 16409)
-- Name: products_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 223
-- Name: products_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_categories_id_seq OWNED BY public.products.categories_id;


--
-- TOC entry 222 (class 1259 OID 16403)
-- Name: products_id _seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."products_id _seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 222
-- Name: products_id _seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."products_id _seq" OWNED BY public.products.id;


--
-- TOC entry 237 (class 1259 OID 16795)
-- Name: return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.return_items (
    id integer NOT NULL,
    return_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    refund_price numeric(15,2) NOT NULL,
    item_condition character varying(100) DEFAULT 'Good'::character varying,
    CONSTRAINT return_items_quantity_check CHECK ((quantity > 0))
);


--
-- TOC entry 236 (class 1259 OID 16794)
-- Name: return_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.return_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 236
-- Name: return_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.return_items_id_seq OWNED BY public.return_items.id;


--
-- TOC entry 235 (class 1259 OID 16778)
-- Name: returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.returns (
    id integer NOT NULL,
    order_id integer,
    return_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_refund_amount numeric(15,2) DEFAULT 0,
    reason text
);


--
-- TOC entry 234 (class 1259 OID 16777)
-- Name: returns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 234
-- Name: returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.returns_id_seq OWNED BY public.returns.id;


--
-- TOC entry 4938 (class 2604 OID 16827)
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- TOC entry 4916 (class 2604 OID 16393)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public."categories _id_seq"'::regclass);


--
-- TOC entry 4932 (class 2604 OID 16735)
-- Name: import_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_items ALTER COLUMN id SET DEFAULT nextval('public.import_items_id_seq'::regclass);


--
-- TOC entry 4929 (class 2604 OID 16725)
-- Name: imports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imports ALTER COLUMN id SET DEFAULT nextval('public.imports_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 16702)
-- Name: inventory_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs ALTER COLUMN id SET DEFAULT nextval('public.inventory_logs_id_seq'::regclass);


--
-- TOC entry 4926 (class 2604 OID 16598)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 4922 (class 2604 OID 16445)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- TOC entry 4942 (class 2604 OID 16847)
-- Name: price_histories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_histories ALTER COLUMN id SET DEFAULT nextval('public.price_historis_id_seq'::regclass);


--
-- TOC entry 4918 (class 2604 OID 16404)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public."products_id _seq"'::regclass);


--
-- TOC entry 4919 (class 2604 OID 16410)
-- Name: products categories_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN categories_id SET DEFAULT nextval('public.products_categories_id_seq'::regclass);


--
-- TOC entry 4936 (class 2604 OID 16798)
-- Name: return_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items ALTER COLUMN id SET DEFAULT nextval('public.return_items_id_seq'::regclass);


--
-- TOC entry 4933 (class 2604 OID 16781)
-- Name: returns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns ALTER COLUMN id SET DEFAULT nextval('public.returns_id_seq'::regclass);


--
-- TOC entry 4974 (class 2606 OID 16841)
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- TOC entry 4976 (class 2606 OID 16837)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 4978 (class 2606 OID 16839)
-- Name: accounts accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_username_key UNIQUE (username);


--
-- TOC entry 4949 (class 2606 OID 16399)
-- Name: categories categories _pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories _pkey" PRIMARY KEY (id);


--
-- TOC entry 4968 (class 2606 OID 16740)
-- Name: import_items import_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_items
    ADD CONSTRAINT import_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4966 (class 2606 OID 16730)
-- Name: imports imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imports
    ADD CONSTRAINT imports_pkey PRIMARY KEY (id);


--
-- TOC entry 4964 (class 2606 OID 16712)
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 16606)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4960 (class 2606 OID 16456)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4980 (class 2606 OID 16853)
-- Name: price_histories price_historis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_histories
    ADD CONSTRAINT price_historis_pkey PRIMARY KEY (id);


--
-- TOC entry 4955 (class 2606 OID 16424)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4972 (class 2606 OID 16807)
-- Name: return_items return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4970 (class 2606 OID 16788)
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- TOC entry 4957 (class 2606 OID 16876)
-- Name: products unique_barcode; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT unique_barcode UNIQUE (barcode);


--
-- TOC entry 4951 (class 2606 OID 16666)
-- Name: categories unique_category_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT unique_category_name UNIQUE (name);


--
-- TOC entry 4958 (class 1259 OID 16653)
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_date ON public.orders USING btree (order_date);


--
-- TOC entry 4952 (class 1259 OID 16877)
-- Name: idx_products_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_barcode ON public.products USING btree (barcode);


--
-- TOC entry 4953 (class 1259 OID 16654)
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_name ON public.products USING btree (name);


--
-- TOC entry 4997 (class 2620 OID 16752)
-- Name: import_items trg_after_insert_import_item; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_after_insert_import_item AFTER INSERT ON public.import_items FOR EACH ROW EXECUTE FUNCTION public.update_stock_and_log_import();


--
-- TOC entry 4995 (class 2620 OID 16720)
-- Name: order_items trg_after_insert_order_item; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_after_insert_order_item AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_stock_and_log_sale();


--
-- TOC entry 4999 (class 2620 OID 16819)
-- Name: return_items trg_after_insert_return_item; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_after_insert_return_item AFTER INSERT ON public.return_items FOR EACH ROW EXECUTE FUNCTION public.update_stock_and_log_return();


--
-- TOC entry 4993 (class 2620 OID 16871)
-- Name: products trg_log_price_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_price_changes AFTER UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.log_price_changes();


--
-- TOC entry 4994 (class 2620 OID 16677)
-- Name: orders trg_prevent_delete_order; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_delete_order BEFORE DELETE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.block_delete_order();


--
-- TOC entry 4996 (class 2620 OID 16759)
-- Name: order_items trg_update_order_totals; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_order_totals BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_order_amounts_final();


--
-- TOC entry 4998 (class 2620 OID 16754)
-- Name: import_items trg_update_total_import; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_total_import AFTER INSERT ON public.import_items FOR EACH ROW EXECUTE FUNCTION public.update_total_import_cost();


--
-- TOC entry 4991 (class 2606 OID 16854)
-- Name: price_histories fk_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_histories
    ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4992 (class 2606 OID 16859)
-- Name: price_histories fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_histories
    ADD CONSTRAINT fk_user FOREIGN KEY (updated_by) REFERENCES public.accounts(id) ON DELETE RESTRICT;


--
-- TOC entry 4986 (class 2606 OID 16741)
-- Name: import_items import_items_import_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_items
    ADD CONSTRAINT import_items_import_id_fkey FOREIGN KEY (import_id) REFERENCES public.imports(id) ON DELETE CASCADE;


--
-- TOC entry 4987 (class 2606 OID 16746)
-- Name: import_items import_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_items
    ADD CONSTRAINT import_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4985 (class 2606 OID 16713)
-- Name: inventory_logs inventory_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4983 (class 2606 OID 16646)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 4984 (class 2606 OID 16618)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) NOT VALID;


--
-- TOC entry 4981 (class 2606 OID 16425)
-- Name: products products_categories_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_categories_id_fkey FOREIGN KEY (categories_id) REFERENCES public.categories(id) NOT VALID;


--
-- TOC entry 4982 (class 2606 OID 16865)
-- Name: products products_updated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_updated_by_id_fkey FOREIGN KEY (updated_by_id) REFERENCES public.accounts(id);


--
-- TOC entry 4989 (class 2606 OID 16813)
-- Name: return_items return_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4990 (class 2606 OID 16808)
-- Name: return_items return_items_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;


--
-- TOC entry 4988 (class 2606 OID 16789)
-- Name: returns returns_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


-- Completed on 2026-04-10 09:36:56

--
-- PostgreSQL database dump complete
--

\unrestrict h8L3RWTGwlKQadZfjAVk7IFasvWZovx1xr9Cckn68fnZVS6VCHRDoaiLvrffcnv

