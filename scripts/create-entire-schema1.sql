-- ===================================================================
-- Restaurant AI Ordering System - Complete PostgreSQL Schema
-- Supports multi-store, shared menus, AI agents, and automated timestamps
-- ===================================================================

-- ===================================================================
-- DROP TABLES IN REVERSE DEPENDENCY ORDER
-- ===================================================================
DROP TABLE IF EXISTS print_logs;
DROP TABLE IF EXISTS order_capture_logs;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_types;
DROP TABLE IF EXISTS sms;
DROP TABLE IF EXISTS analytics;
DROP TABLE IF EXISTS menu_price_override;
DROP TABLE IF EXISTS menu_item_assignment;
DROP TABLE IF EXISTS menu_sub_item;
DROP TABLE IF EXISTS menu_template;
DROP TABLE IF EXISTS store_hours;
DROP TABLE IF EXISTS store;
DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS subscription;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS prompt;
DROP TABLE IF EXISTS restaurant;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS transcriptions
-- ===================================================================
-- 1. Create admin table
-- ===================================================================

CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
    is_active boolean DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE admin IS 'Stores Admin and Super Admin accounts with role-based access';
COMMENT ON COLUMN admin.role IS 'Role of the user: admin or super_admin';

-- ===================================================================
-- 2. Create restaurant table
-- ===================================================================

CREATE TABLE restaurant (
    restaurant_id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admin(admin_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE restaurant IS 'Represents a restaurant brand or business with multiple store locations';
COMMENT ON COLUMN restaurant.admin_id IS 'Foreign key to the admin managing this restaurant';

-- ===================================================================
-- 3. Create location table (e.g., Brampton, Richmond Hill)
-- ===================================================================

CREATE TABLE location (
    location_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active boolean DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE location IS 'Geographic areas where stores are located (e.g., city or neighborhood)';
COMMENT ON COLUMN location.name IS 'Name of the location, e.g., Brampton, Richmond Hill';

-- ===================================================================
-- 4. Create store table (updated with ai_platform_name and time_zone)
-- ===================================================================

CREATE TABLE store (
    store_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurant(restaurant_id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES location(location_id),
    address TEXT NOT NULL,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    ai_agent_id VARCHAR(100),
    ai_platform_name VARCHAR(50),
    is_ai_agent_enabled BOOLEAN DEFAULT TRUE,
    time_zone VARCHAR(63) DEFAULT 'America/Toronto', -- IANA timezone standard
    is_active boolean DEFAULT true,
    last_ping TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_store_restaurant ON store(restaurant_id);
CREATE INDEX idx_store_location ON store(location_id);
CREATE INDEX idx_store_enabled ON store(is_ai_agent_enabled);
CREATE INDEX idx_store_time_zone ON store(time_zone);

COMMENT ON TABLE store IS 'Physical store locations belonging to a restaurant';
COMMENT ON COLUMN store.location_id IS 'Reference to standardized location (e.g., Brampton)';
COMMENT ON COLUMN store.address IS 'Full street address of the store';
COMMENT ON COLUMN store.phone_primary IS 'Primary contact number for the store';
COMMENT ON COLUMN store.phone_secondary IS 'Secondary contact number';
COMMENT ON COLUMN store.ai_agent_id IS 'External ID of the AI agent associated with this store';
COMMENT ON COLUMN store.ai_platform_name IS 'Name of the AI voice platform used (e.g., ElevenLabs)';
COMMENT ON COLUMN store.is_ai_agent_enabled IS 'Whether the AI voice/ordering agent is currently active at this store';
COMMENT ON COLUMN store.time_zone IS 'IANA timezone name (e.g., America/Toronto) for correct time display and DST handling';

-- ===================================================================
-- 5. Create store_hours table
-- ===================================================================

CREATE TABLE store_hours (
    store_hour_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES store(store_id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_store_day_unique ON store_hours(store_id, day_of_week);
CREATE INDEX idx_store_hours_open ON store_hours(open_time, close_time);

COMMENT ON TABLE store_hours IS 'Operating hours for each store by day of the week';
COMMENT ON COLUMN store_hours.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN store_hours.open_time IS 'Opening time of the store on this day';
COMMENT ON COLUMN store_hours.close_time IS 'Closing time of the store on this day';
COMMENT ON COLUMN store_hours.is_closed IS 'If true, store is closed on this day (overrides times)';

-- ===================================================================
-- 6. Create customer table (with combined name field)
-- ===================================================================

CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    phone_number_id VARCHAR(20), -- Stable identifier: hashed E.164 or NULL if blocked
    phone_number_provided VARCHAR(20), -- Raw input as spoken or entered
    name VARCHAR(100), -- Full or first name only; optional
    session_token UUID DEFAULT gen_random_uuid(), -- For web/cart recovery
    email VARCHAR(255),
    preferred_contact_method VARCHAR(10) DEFAULT 'call' 
        CHECK (preferred_contact_method IN ('sms', 'call', 'email')),
    is_active boolean DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customer_phone_id ON customer(phone_number_id);
CREATE INDEX idx_customer_session_token ON customer(session_token);
CREATE INDEX idx_customer_phone_provided ON customer(phone_number_provided);

-- Comments
COMMENT ON TABLE customer IS 'Represents a customer entity — known or anonymous — with support for voice, SMS, and future web ordering';
COMMENT ON COLUMN customer.phone_number_id IS 'Stable, privacy-preserving identifier derived from E.164 format; NULL if caller ID blocked';
COMMENT ON COLUMN customer.phone_number_provided IS 'Original phone number as provided (may include formatting); for display and contact';
COMMENT ON COLUMN customer.name IS 'Customer name (full or first only) as provided during interaction';
COMMENT ON COLUMN customer.session_token IS 'UUID used to maintain cart/session across web or app visits without login';
COMMENT ON COLUMN customer.email IS 'Email address for receipts or marketing (optional)';
COMMENT ON COLUMN customer.preferred_contact_method IS 'How the customer prefers to be reached; default is call';

-- ===================================================================
-- 7. Create plans table
-- ===================================================================

CREATE TABLE plans (
    plan_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    stripe_price_id VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    features JSONB,
    is_active boolean DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE plans IS 'Stores subscription plans configurable by Super Admins';
COMMENT ON COLUMN plans.stripe_price_id IS 'Stripe Price ID for billing';

-- ===================================================================
-- 8. Create subscription table
-- ===================================================================

CREATE TABLE subscription (
    subscription_id SERIAL PRIMARY KEY,
    store_id INTEGER UNIQUE NOT NULL REFERENCES store(store_id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(100) NOT NULL,
    plan_id INTEGER NOT NULL REFERENCES plans(plan_id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    credit_amount DECIMAL(10, 2) DEFAULT 0.0,
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE subscription IS 'Stores subscription details for each store, integrated with Stripe';
COMMENT ON COLUMN subscription.credit_amount IS 'Prorated credit after cancellation';

-- ===================================================================
-- 9. Create prompt table
-- ===================================================================

CREATE TABLE prompt (
    prompt_id SERIAL PRIMARY KEY,
    store_id INTEGER UNIQUE NOT NULL REFERENCES store(store_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE prompt IS 'Stores the prompt for each store, editable only by Super Admins';

-- ===================================================================
-- 10. Create menu_category table
-- ===================================================================

CREATE TABLE menu_category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT, -- Optional general note for the category (e.g., "All mains include rice and naan")
    display_order SMALLINT DEFAULT 99,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE menu_category IS 'Standardized categories for organizing menu items';
COMMENT ON COLUMN menu_category.name IS 'Name of the category (e.g., Platters, Drinks)';
COMMENT ON COLUMN menu_category.description IS 'General description or note that applies to all items in this category';
COMMENT ON COLUMN menu_category.display_order IS 'Order in which the category should appear in UI or voice flow';
COMMENT ON COLUMN menu_category.is_active IS 'Whether this category is currently used';

-- ===================================================================
-- 11. Create menu_template table (Master Menu - Shared Across Stores)
-- ===================================================================

CREATE TABLE menu_template (
    template_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurant(restaurant_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL,
    category_id INTEGER REFERENCES menu_category(category_id),
    image_url VARCHAR(500),
    calories INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_template_restaurant ON menu_template(restaurant_id);
CREATE INDEX idx_menu_template_category ON menu_template(category_id);
CREATE INDEX idx_menu_template_active ON menu_template(is_active);

COMMENT ON TABLE menu_template IS 'Central master list of all possible menu items for a restaurant brand';
COMMENT ON COLUMN menu_template.restaurant_id IS 'The restaurant that owns this menu item';
COMMENT ON COLUMN menu_template.base_price IS 'Default price used unless overridden by a store';
COMMENT ON COLUMN menu_template.image_url IS 'URL to display image of the dish';
COMMENT ON COLUMN menu_template.calories IS 'Estimated calorie count';
COMMENT ON COLUMN menu_template.is_active IS 'Whether this item is generally available (can still be hidden per-store)';

-- ===================================================================
-- 12. Create menu_sub_item table (Sub Menu Items)
-- ===================================================================
CREATE TABLE menu_sub_item (
    sub_item_id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES menu_template(template_id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_menu_sub_item_template_id ON menu_sub_item(template_id);

-- Comments
COMMENT ON TABLE menu_sub_item IS 'Represents individual sub-items or components of a menu template item (e.g., add-ons, extras, sides, etc.)';
COMMENT ON COLUMN menu_sub_item.sub_item_id IS 'Primary key for each menu sub-item entry.';
COMMENT ON COLUMN menu_sub_item.template_id IS 'Foreign key linking this sub-item to its parent menu template.';
COMMENT ON COLUMN menu_sub_item.quantity IS 'Default quantity of the sub-item included with the menu item.';
COMMENT ON COLUMN menu_sub_item.name IS 'Descriptive name of the sub-item (e.g., Fries, Drink, Extra Sauce).';
COMMENT ON COLUMN menu_sub_item.description IS 'Optional descriptive text providing more details about the sub-item.';
COMMENT ON COLUMN menu_sub_item.created_at IS 'Timestamp when this sub-item was created.';
COMMENT ON COLUMN menu_sub_item.updated_at IS 'Timestamp when this sub-item was last updated.';

-- ===================================================================
-- 13. Create menu_item_assignment table (Which Stores Offer Which Items)
-- ===================================================================

CREATE TABLE menu_item_assignment (
    assignment_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES store(store_id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES menu_template(template_id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT TRUE,
    display_order SMALLINT DEFAULT 99,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(store_id, template_id)
);

CREATE INDEX idx_menu_assignment_store ON menu_item_assignment(store_id);
CREATE INDEX idx_menu_assignment_template ON menu_item_assignment(template_id);
CREATE INDEX idx_menu_assignment_available ON menu_item_assignment(is_available);

COMMENT ON TABLE menu_item_assignment IS 'Links menu items from the master template to individual stores';
COMMENT ON COLUMN menu_item_assignment.is_available IS 'Whether this store currently offers the item to customers';
COMMENT ON COLUMN menu_item_assignment.display_order IS 'Order in which the item appears on the menu at this store';

-- ===================================================================
-- 14. Create menu_price_override table (Optional Store-Specific Pricing)
-- ===================================================================

CREATE TABLE menu_price_override (
    override_id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES menu_item_assignment(assignment_id) ON DELETE CASCADE,
    overridden_price NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(100),
    effective_from TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_override_assignment ON menu_price_override(assignment_id);
CREATE INDEX idx_menu_override_expires ON menu_price_override(expires_at);

COMMENT ON TABLE menu_price_override IS 'Allows individual stores to set custom prices for menu items';
COMMENT ON COLUMN menu_price_override.overridden_price IS 'Price used instead of base_price for this store only';
COMMENT ON COLUMN menu_price_override.reason IS 'Why the price was changed (for audit)';
COMMENT ON COLUMN menu_price_override.effective_from IS 'When the override takes effect';
COMMENT ON COLUMN menu_price_override.expires_at IS 'Optional expiry date (e.g., for promotions)';

-- ===================================================================
-- 15. Create order types table
-- ===================================================================
CREATE TABLE order_types (
     order_type_id SERIAL PRIMARY KEY,
     name character varying(50) NOT NULL,
     is_active boolean DEFAULT true,
     created_at timestamp without time zone DEFAULT now(),
     updated_at timestamp without time zone DEFAULT now()
);

COMMENT ON TABLE order_types IS 'Defines different types of order fulfillment (takeout, delivery, dine-in)';
COMMENT ON COLUMN order_types.name IS 'Name of the order type';
COMMENT ON COLUMN order_types.is_active IS 'Indicates whether this order type is currently available';

-- ===================================================================
-- 16. Create order table
-- ===================================================================

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES store(store_id),
    customer_id VARCHAR(20) NOT NULL, -- References customer.phone_number_id (not customer_id)
    session_id VARCHAR(36) NOT NULL,
    system_caller_id VARCHAR(36) NULL,
    printer_status VARCHAR(10) NOT NULL DEFAULT 'pending'
        CHECK (printer_status IN ('pending', 'sent', 'error')),
    total_price NUMERIC(10, 2) NOT NULL,
    order_type integer NOT NULL REFERENCES order_types(order_type_id),
    notes TEXT,
    pickup_time TIMESTAMPTZ NULL,
    transcript_summary TEXT NULL,
    is_cancel BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_session ON "orders"(session_id);
CREATE INDEX idx_order_customer_id ON "orders"(customer_id);
CREATE INDEX idx_order_printer_status ON "orders"(printer_status);
CREATE INDEX idx_order_store_created ON "orders"(store_id, created_at);

-- Comments
COMMENT ON TABLE "orders" IS 'Orders placed via AI agent; tracks if kitchen ticket was sent or failed';
COMMENT ON COLUMN "orders".customer_id IS 'References the customer via phone_number_id (E.164 or hash), not the customer primary key';
COMMENT ON COLUMN "orders".session_id IS 'Used for cart recovery and tracking before confirmation';
COMMENT ON COLUMN "orders".printer_status IS 'Indicates whether the order was successfully sent to the printer/kitchen (sent/error)';
COMMENT ON COLUMN "orders".total_price IS 'Total price of the order at checkout time';
COMMENT ON COLUMN "orders".order_type IS 'References the order type for this order';
COMMENT ON COLUMN "orders".notes IS 'Any general instructions from the customer';

-- ===================================================================
-- 17. Create order_item table
-- ===================================================================

CREATE TABLE order_item (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES "orders"(order_id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES menu_template(template_id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    price_at_time NUMERIC(10, 2) NOT NULL,
    customer_requests VARCHAR(120),
    is_cancel BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_template ON order_item(template_id);

COMMENT ON TABLE order_item IS 'Individual items within an order';
COMMENT ON COLUMN order_item.template_id IS 'References the master menu item (via template), not per-store copy';
COMMENT ON COLUMN order_item.price_at_time IS 'Price captured at time of order (factoring in any active overrides)';
COMMENT ON COLUMN order_item.customer_requests IS 'Customization requests per item (max 120 chars)';

-- ===================================================================
-- 18. Create order_capture_logs table
-- ===================================================================
CREATE TABLE order_capture_logs (
    id SERIAL PRIMARY KEY,
    conversation_id character varying(100) NOT NULL,
    event_type character varying(150),
    status character varying(50) NOT NULL,
    request_headers jsonb,
    request_body jsonb,
    error_message text,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    request_id uuid DEFAULT gen_random_uuid(),
    duration_ms integer
);

-- Indexes
CREATE INDEX "idx_order_capture_logs_conversation_id" ON "order_capture_logs" ("conversation_id");
CREATE INDEX "idx_order_capture_logs_received_at" ON "order_capture_logs" ("received_at" DESC);
CREATE INDEX "idx_order_capture_logs_status" ON "order_capture_logs" ("status");

-- Comments
COMMENT ON TABLE order_capture_logs IS 'Logs for Eleven Labs order capture webhook events.';
COMMENT ON COLUMN order_capture_logs.id IS 'Primary key identifier for each log entry.';
COMMENT ON COLUMN order_capture_logs.conversation_id IS 'Conversation identifier provided by Eleven Labs.';
COMMENT ON COLUMN order_capture_logs.event_type IS 'Type of webhook event, e.g., order.created.';
COMMENT ON COLUMN order_capture_logs.status IS 'Processing status: success or failed.';
COMMENT ON COLUMN order_capture_logs.request_headers IS 'Raw request headers received from Eleven Labs webhook.';
COMMENT ON COLUMN order_capture_logs.request_body IS 'Raw JSON body received from Eleven Labs webhook.';
COMMENT ON COLUMN order_capture_logs.error_message IS 'Error details captured if the operation failed.';
COMMENT ON COLUMN order_capture_logs.received_at IS 'Timestamp when the webhook was received by the server.';
COMMENT ON COLUMN order_capture_logs.processed_at IS 'Timestamp when webhook processing completed.';
COMMENT ON COLUMN order_capture_logs.request_id IS 'Unique UUID for correlating logs across systems.';
COMMENT ON COLUMN order_capture_logs.duration_ms IS 'Time taken (in milliseconds) to process the webhook.';

-- ===================================================================
-- 19. Create order_capture_logs table
-- ===================================================================
CREATE TABLE print_logs (
    log_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    printer_name VARCHAR(150) NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_print_logs_order_id ON print_logs (order_id);
CREATE INDEX idx_print_logs_status ON print_logs (status);
CREATE INDEX idx_print_logs_created_at ON print_logs (created_at DESC);

-- Comments
COMMENT ON TABLE print_logs IS 'Logs of printing operations, including status and errors, allowing multiple entries per order.';
COMMENT ON COLUMN print_logs.log_id IS 'Primary key for each print log entry.';
COMMENT ON COLUMN print_logs.order_id IS 'Associated order ID (can be repeated for multiple print attempts).';
COMMENT ON COLUMN print_logs.printer_name IS 'Name or identifier of the printer used (nullable).';
COMMENT ON COLUMN print_logs.status IS 'Status of the print operation: success or failed.';
COMMENT ON COLUMN print_logs.error_message IS 'Error details if the print job failed.';
COMMENT ON COLUMN print_logs.created_at IS 'Timestamp when the print was logged.';

-- Added Feb  14, enhancement 
-- Transcriptions Table Schema
-- Stores transcriptions fetched from ElevenLabs API

CREATE TABLE IF NOT EXISTS public.transcriptions
(
    transcription_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES public.store(store_id) ON DELETE CASCADE,
    conversation_id VARCHAR(255) NOT NULL, -- ElevenLabs conversation ID
    session_id VARCHAR(255), -- ElevenLabs session ID (optional)
    transcript_text TEXT NOT NULL, -- Full transcription text
    duration_seconds INTEGER, -- Call duration in seconds
    word_count INTEGER, -- Number of words in transcript
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, -- When call happened
    fetched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(), -- When we fetched from API
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Metadata from ElevenLabs
    metadata JSONB, -- Store any additional ElevenLabs data
    
    CONSTRAINT unique_conversation_per_store UNIQUE(store_id, conversation_id)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_transcriptions_store_created 
    ON public.transcriptions(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcriptions_conversation 
    ON public.transcriptions(conversation_id);

-- Full text search index for transcript content
CREATE INDEX IF NOT EXISTS idx_transcriptions_text_search 
    ON public.transcriptions USING gin(to_tsvector('english', transcript_text));

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER set_updated_at_transcriptions
    BEFORE UPDATE 
    ON public.transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.transcriptions IS 'Stores conversation transcriptions from ElevenLabs API';
COMMENT ON COLUMN public.transcriptions.conversation_id IS 'Unique conversation ID from ElevenLabs';
COMMENT ON COLUMN public.transcriptions.transcript_text IS 'Full text of the conversation transcription';
COMMENT ON COLUMN public.transcriptions.metadata IS 'Additional data from ElevenLabs API response'; 
--
-- End of Stores transcriptions fetched from ElevenLabs API


-- ===================================================================
-- 20. Create trigger function for automatic updated_at
-- ===================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ===================================================================
-- 17. Create triggers for tables with updated_at
-- ===================================================================

CREATE TRIGGER set_updated_at_admin
    BEFORE UPDATE ON admin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_restaurant
    BEFORE UPDATE ON restaurant
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_store
    BEFORE UPDATE ON store
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_customer
    BEFORE UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_plans
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_subscription
    BEFORE UPDATE ON subscription
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_prompt
    BEFORE UPDATE ON prompt
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_menu_template
    BEFORE UPDATE ON menu_template
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_menu_item_assignment
    BEFORE UPDATE ON menu_item_assignment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_menu_price_override
    BEFORE UPDATE ON menu_price_override
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_order
    BEFORE UPDATE ON "orders"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();






-- ===================================================================
-- END OF SCHEMA
-- ===================================================================
