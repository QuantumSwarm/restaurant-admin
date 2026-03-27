-- 3 New tables
-- transcription 
-- overage_charges 
-- credit_usage_log  
-- Table: public.transcriptions

-- DROP TABLE IF EXISTS public.transcriptions;

CREATE TABLE IF NOT EXISTS public.transcriptions
(
    transcription_id integer NOT NULL DEFAULT nextval('transcriptions_transcription_id_seq'::regclass),
    store_id integer NOT NULL,
    conversation_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    session_id character varying(255) COLLATE pg_catalog."default",
    transcript_text text COLLATE pg_catalog."default" NOT NULL,
    duration_seconds integer,
    word_count integer,
    created_at timestamp without time zone NOT NULL,
    fetched_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    metadata jsonb,
    customer_name character varying(255) COLLATE pg_catalog."default",
    phone_number_id character varying(50) COLLATE pg_catalog."default",
    phone_number character varying(50) COLLATE pg_catalog."default",
    CONSTRAINT transcriptions_pkey PRIMARY KEY (transcription_id),
    CONSTRAINT unique_conversation_per_store UNIQUE (store_id, conversation_id),
    CONSTRAINT transcriptions_store_id_fkey FOREIGN KEY (store_id)
        REFERENCES public.store (store_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.transcriptions
    OWNER to caravan_db_atak_user;

COMMENT ON TABLE public.transcriptions
    IS 'Stores conversation transcriptions from ElevenLabs API';

COMMENT ON COLUMN public.transcriptions.conversation_id
    IS 'Unique conversation ID from ElevenLabs';

COMMENT ON COLUMN public.transcriptions.transcript_text
    IS 'Full text of the conversation transcription';

COMMENT ON COLUMN public.transcriptions.metadata
    IS 'Additional data from ElevenLabs API response';

COMMENT ON COLUMN public.transcriptions.customer_name
    IS 'Customer name provided during conversation';

COMMENT ON COLUMN public.transcriptions.phone_number_id
    IS 'System-captured caller ID from phone system';

COMMENT ON COLUMN public.transcriptions.phone_number
    IS 'Phone number verbally provided by customer to agent';
-- Index: idx_transcriptions_conversation

-- DROP INDEX IF EXISTS public.idx_transcriptions_conversation;

CREATE INDEX IF NOT EXISTS idx_transcriptions_conversation
    ON public.transcriptions USING btree
    (conversation_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_transcriptions_customer_name

-- DROP INDEX IF EXISTS public.idx_transcriptions_customer_name;

CREATE INDEX IF NOT EXISTS idx_transcriptions_customer_name
    ON public.transcriptions USING btree
    (customer_name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_transcriptions_phone_number

-- DROP INDEX IF EXISTS public.idx_transcriptions_phone_number;

CREATE INDEX IF NOT EXISTS idx_transcriptions_phone_number
    ON public.transcriptions USING btree
    (phone_number COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_transcriptions_store_created

-- DROP INDEX IF EXISTS public.idx_transcriptions_store_created;

CREATE INDEX IF NOT EXISTS idx_transcriptions_store_created
    ON public.transcriptions USING btree
    (store_id ASC NULLS LAST, created_at DESC NULLS FIRST)
    TABLESPACE pg_default;
-- Index: idx_transcriptions_text_search

-- DROP INDEX IF EXISTS public.idx_transcriptions_text_search;

CREATE INDEX IF NOT EXISTS idx_transcriptions_text_search
    ON public.transcriptions USING gin
    (to_tsvector('english'::regconfig, transcript_text))
    TABLESPACE pg_default;

-- 

-- Table: public.overage_charges

-- DROP TABLE IF EXISTS public.overage_charges;

CREATE TABLE IF NOT EXISTS public.overage_charges
(
    charge_id integer NOT NULL DEFAULT nextval('overage_charges_charge_id_seq'::regclass),
    subscription_id integer NOT NULL,
    credits_over_limit integer NOT NULL,
    amount_charged numeric(10,2) NOT NULL,
    billing_period_start timestamp without time zone NOT NULL,
    billing_period_end timestamp without time zone NOT NULL,
    stripe_invoice_item_id character varying(255) COLLATE pg_catalog."default",
    stripe_invoice_id character varying(255) COLLATE pg_catalog."default",
    status character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'pending'::character varying,
    charged_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT overage_charges_pkey PRIMARY KEY (charge_id),
    CONSTRAINT overage_charges_subscription_id_fkey FOREIGN KEY (subscription_id)
        REFERENCES public.admin_subscriptions (subscription_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT overage_charges_amount_check CHECK (credits_over_limit > 0 AND amount_charged >= 0::numeric),
    CONSTRAINT overage_charges_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'charged'::character varying, 'failed'::character varying, 'refunded'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.overage_charges
    OWNER to caravan_db_atak_user;

COMMENT ON TABLE public.overage_charges
    IS 'Records overage charges when credits exceed monthly limit';
-- Index: idx_overage_charges_charged_at

-- DROP INDEX IF EXISTS public.idx_overage_charges_charged_at;

CREATE INDEX IF NOT EXISTS idx_overage_charges_charged_at
    ON public.overage_charges USING btree
    (charged_at DESC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_overage_charges_status

-- DROP INDEX IF EXISTS public.idx_overage_charges_status;

CREATE INDEX IF NOT EXISTS idx_overage_charges_status
    ON public.overage_charges USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_overage_charges_subscription

-- DROP INDEX IF EXISTS public.idx_overage_charges_subscription;

CREATE INDEX IF NOT EXISTS idx_overage_charges_subscription
    ON public.overage_charges USING btree
    (subscription_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- 

-- Table: public.credit_usage_log

-- DROP TABLE IF EXISTS public.credit_usage_log;

CREATE TABLE IF NOT EXISTS public.credit_usage_log
(
    log_id bigint NOT NULL DEFAULT nextval('credit_usage_log_log_id_seq'::regclass),
    subscription_id integer NOT NULL,
    credits_delta integer NOT NULL,
    credits_balance_after integer NOT NULL,
    source character varying(100) COLLATE pg_catalog."default" NOT NULL,
    source_id character varying(255) COLLATE pg_catalog."default",
    source_metadata jsonb,
    logged_at timestamp without time zone NOT NULL DEFAULT now(),
    logged_by character varying(100) COLLATE pg_catalog."default",
    CONSTRAINT credit_usage_log_pkey PRIMARY KEY (log_id),
    CONSTRAINT credit_usage_log_subscription_id_fkey FOREIGN KEY (subscription_id)
        REFERENCES public.admin_subscriptions (subscription_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT credit_usage_log_source_check CHECK (source::text = ANY (ARRAY['elevenlabs_call'::character varying, 'vapi_call'::character varying, 'manual_adjustment'::character varying, 'monthly_reset'::character varying, 'refund'::character varying, 'other'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.credit_usage_log
    OWNER to caravan_db_atak_user;

COMMENT ON TABLE public.credit_usage_log
    IS 'Audit trail of all credit usage and adjustments';

COMMENT ON COLUMN public.credit_usage_log.credits_delta
    IS 'Credit change amount. Positive = usage, Negative = refund/adjustment';

COMMENT ON COLUMN public.credit_usage_log.source
    IS 'Source of credit usage: elevenlabs_call, vapi_call, manual_adjustment, monthly_reset';

COMMENT ON COLUMN public.credit_usage_log.source_id
    IS 'External reference ID (e.g., conversation_id from ElevenLabs)';
-- Index: idx_credit_usage_log_logged_at

-- DROP INDEX IF EXISTS public.idx_credit_usage_log_logged_at;

CREATE INDEX IF NOT EXISTS idx_credit_usage_log_logged_at
    ON public.credit_usage_log USING btree
    (logged_at DESC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_credit_usage_log_source

-- DROP INDEX IF EXISTS public.idx_credit_usage_log_source;

CREATE INDEX IF NOT EXISTS idx_credit_usage_log_source
    ON public.credit_usage_log USING btree
    (source COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_credit_usage_log_subscription

-- DROP INDEX IF EXISTS public.idx_credit_usage_log_subscription;

CREATE INDEX IF NOT EXISTS idx_credit_usage_log_subscription
    ON public.credit_usage_log USING btree
    (subscription_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- 
-- 3 altered tables
-- store 
-- alter admin
-- alter admin_subscriptions 

-- Table: public.store

-- DROP TABLE IF EXISTS public.store;

CREATE TABLE IF NOT EXISTS public.store
(
    store_id integer NOT NULL DEFAULT nextval('store_store_id_seq'::regclass),
    restaurant_id integer NOT NULL,
    location_id integer NOT NULL,
    address text COLLATE pg_catalog."default" NOT NULL,
    phone_primary character varying(20) COLLATE pg_catalog."default",
    phone_secondary character varying(20) COLLATE pg_catalog."default",
    ai_agent_id character varying(100) COLLATE pg_catalog."default",
    ai_platform_name character varying(50) COLLATE pg_catalog."default",
    is_ai_agent_enabled boolean DEFAULT true,
    time_zone character varying(63) COLLATE pg_catalog."default" DEFAULT 'America/Toronto'::character varying,
    is_active boolean DEFAULT true,
    last_ping timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_sync_at timestamp without time zone,
    last_sync_id character varying(255) COLLATE pg_catalog."default",
    sync_status character varying(20) COLLATE pg_catalog."default" DEFAULT 'idle'::character varying,
    sync_error text COLLATE pg_catalog."default",
    synced_conversations integer DEFAULT 0,
    CONSTRAINT store_pkey PRIMARY KEY (store_id),
    CONSTRAINT store_location_id_fkey FOREIGN KEY (location_id)
        REFERENCES public.location (location_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT store_restaurant_id_fkey FOREIGN KEY (restaurant_id)
        REFERENCES public.restaurant (restaurant_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.store
    OWNER to caravan_db_atak_user;

COMMENT ON TABLE public.store
    IS 'Physical store locations belonging to a restaurant';

COMMENT ON COLUMN public.store.location_id
    IS 'Reference to standardized location (e.g., Brampton)';

COMMENT ON COLUMN public.store.address
    IS 'Full street address of the store';

COMMENT ON COLUMN public.store.phone_primary
    IS 'Primary contact number for the store';

COMMENT ON COLUMN public.store.phone_secondary
    IS 'Secondary contact number';

COMMENT ON COLUMN public.store.ai_agent_id
    IS 'External ID of the AI agent associated with this store';

COMMENT ON COLUMN public.store.ai_platform_name
    IS 'Name of the AI voice platform used (e.g., ElevenLabs)';

COMMENT ON COLUMN public.store.is_ai_agent_enabled
    IS 'Whether the AI voice/ordering agent is currently active at this store';

COMMENT ON COLUMN public.store.time_zone
    IS 'IANA timezone name (e.g., America/Toronto) for correct time display and DST handling';

COMMENT ON COLUMN public.store.last_sync_at
    IS 'Timestamp of the last successful incremental sync from ElevenLabs';

COMMENT ON COLUMN public.store.last_sync_id
    IS 'Optional ID or cursor of the last synced item (for resume/recovery)';

COMMENT ON COLUMN public.store.sync_status
    IS 'Sync state: idle, syncing, error';

COMMENT ON COLUMN public.store.sync_error
    IS 'Last sync error message (if any)';

COMMENT ON COLUMN public.store.synced_conversations
    IS 'Count of conversations synced in the last run';
-- Index: idx_store_enabled

-- DROP INDEX IF EXISTS public.idx_store_enabled;

CREATE INDEX IF NOT EXISTS idx_store_enabled
    ON public.store USING btree
    (is_ai_agent_enabled ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_store_last_sync_at

-- DROP INDEX IF EXISTS public.idx_store_last_sync_at;

CREATE INDEX IF NOT EXISTS idx_store_last_sync_at
    ON public.store USING btree
    (last_sync_at DESC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_store_location

-- DROP INDEX IF EXISTS public.idx_store_location;

CREATE INDEX IF NOT EXISTS idx_store_location
    ON public.store USING btree
    (location_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_store_restaurant

-- DROP INDEX IF EXISTS public.idx_store_restaurant;

CREATE INDEX IF NOT EXISTS idx_store_restaurant
    ON public.store USING btree
    (restaurant_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_store_sync_status

-- DROP INDEX IF EXISTS public.idx_store_sync_status;

CREATE INDEX IF NOT EXISTS idx_store_sync_status
    ON public.store USING btree
    (sync_status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_store_time_zone

-- DROP INDEX IF EXISTS public.idx_store_time_zone;

CREATE INDEX IF NOT EXISTS idx_store_time_zone
    ON public.store USING btree
    (time_zone COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;


-- 
-- Table: public.admin

-- DROP TABLE IF EXISTS public.admin;

CREATE TABLE IF NOT EXISTS public.admin
(
    admin_id integer NOT NULL DEFAULT nextval('admin_admin_id_seq'::regclass),
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    role character varying(20) COLLATE pg_catalog."default" NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    stripe_customer_id character varying(255) COLLATE pg_catalog."default",
    company_name character varying(255) COLLATE pg_catalog."default",
    company_address text COLLATE pg_catalog."default",
    company_phone character varying(50) COLLATE pg_catalog."default",
    company_fax character varying(50) COLLATE pg_catalog."default",
    company_url character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT admin_pkey PRIMARY KEY (admin_id),
    CONSTRAINT admin_email_key UNIQUE (email),
    CONSTRAINT admin_stripe_customer_id_key UNIQUE (stripe_customer_id),
    CONSTRAINT admin_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying::text, 'super_admin'::character varying::text]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.admin
    OWNER to caravan_db_atak_user;

COMMENT ON TABLE public.admin
    IS 'Stores Admin and Super Admin accounts with role-based access';

COMMENT ON COLUMN public.admin.role
    IS 'Role of the user: admin or super_admin';

COMMENT ON COLUMN public.admin.stripe_customer_id
    IS 'Stripe Customer ID for billing integration';

COMMENT ON COLUMN public.admin.company_name
    IS 'Company name for invoicing and display';

COMMENT ON COLUMN public.admin.company_address
    IS 'Company address for invoicing';

COMMENT ON COLUMN public.admin.company_phone
    IS 'Company phone number';

COMMENT ON COLUMN public.admin.company_fax
    IS 'Company fax number';

COMMENT ON COLUMN public.admin.company_url
    IS 'Company website URL';
-- Index: idx_admin_stripe_customer

-- DROP INDEX IF EXISTS public.idx_admin_stripe_customer;

CREATE INDEX IF NOT EXISTS idx_admin_stripe_customer
    ON public.admin USING btree
    (stripe_customer_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

--
-- Table: public.admin_subscriptions

-- DROP TABLE IF EXISTS public.admin_subscriptions;

CREATE TABLE IF NOT EXISTS public.admin_subscriptions
(
    subscription_id integer NOT NULL DEFAULT nextval('admin_subscriptions_subscription_id_seq'::regclass),
    admin_id integer NOT NULL,
    stripe_subscription_id character varying(255) COLLATE pg_catalog."default",
    stripe_customer_id character varying(255) COLLATE pg_catalog."default",
    stripe_price_id character varying(255) COLLATE pg_catalog."default",
    monthly_cost numeric(10,2) NOT NULL,
    credits_limit integer NOT NULL DEFAULT 1000,
    overage_cost_per_100 numeric(10,2) NOT NULL DEFAULT 5.00,
    credits_used integer NOT NULL DEFAULT 0,
    credits_reset_date timestamp without time zone,
    last_overage_check timestamp without time zone,
    billing_cycle_day integer NOT NULL,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    next_billing_date timestamp without time zone,
    status character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'active'::character varying,
    feature_restaurant boolean NOT NULL DEFAULT false,
    feature_reports boolean NOT NULL DEFAULT false,
    feature_download_audio boolean NOT NULL DEFAULT false,
    feature_download_transcription boolean NOT NULL DEFAULT false,
    feature_bulk_sms boolean NOT NULL DEFAULT false,
    feature_sms_confirmation boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    canceled_at timestamp without time zone,
    CONSTRAINT admin_subscriptions_pkey PRIMARY KEY (subscription_id),
    CONSTRAINT admin_subscriptions_admin_id_key UNIQUE (admin_id),
    CONSTRAINT admin_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id),
    CONSTRAINT admin_subscriptions_admin_id_fkey FOREIGN KEY (admin_id)
        REFERENCES public.admin (admin_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT admin_subscriptions_status_check CHECK (status::text = ANY (ARRAY['active'::character varying, 'trialing'::character varying, 'past_due'::character varying, 'canceled'::character varying, 'incomplete'::character varying, 'incomplete_expired'::character varying]::text[])),
    CONSTRAINT admin_subscriptions_billing_day_check CHECK (billing_cycle_day >= 1 AND billing_cycle_day <= 28),
    CONSTRAINT admin_subscriptions_credits_check CHECK (credits_limit > 0 AND credits_used >= 0),
    CONSTRAINT admin_subscriptions_cost_check CHECK (monthly_cost >= 0::numeric AND overage_cost_per_100 >= 0::numeric)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.admin_subscriptions
    OWNER to caravan_db_atak_user;

COMMENT ON TABLE public.admin_subscriptions
    IS 'Admin-level subscriptions with Stripe integration. Each admin has ONE subscription covering all their stores.';

COMMENT ON COLUMN public.admin_subscriptions.credits_limit
    IS 'Monthly credit allowance before overage charges apply';

COMMENT ON COLUMN public.admin_subscriptions.overage_cost_per_100
    IS 'Cost per 100 credits over the limit (e.g., $5.00 = $5 per 100 credits)';

COMMENT ON COLUMN public.admin_subscriptions.credits_used
    IS 'Credits consumed in current billing period';

COMMENT ON COLUMN public.admin_subscriptions.billing_cycle_day
    IS 'Day of month when billing occurs (1-28). Subscription renews on this day each month.';

COMMENT ON COLUMN public.admin_subscriptions.feature_restaurant
    IS 'Enable restaurant management features (stores, menus, etc.)';
-- Index: idx_admin_subscriptions_admin_id

-- DROP INDEX IF EXISTS public.idx_admin_subscriptions_admin_id;

CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_admin_id
    ON public.admin_subscriptions USING btree
    (admin_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_admin_subscriptions_billing_date

-- DROP INDEX IF EXISTS public.idx_admin_subscriptions_billing_date;

CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_billing_date
    ON public.admin_subscriptions USING btree
    (next_billing_date ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_admin_subscriptions_status

-- DROP INDEX IF EXISTS public.idx_admin_subscriptions_status;

CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_status
    ON public.admin_subscriptions USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_admin_subscriptions_stripe_subscription

-- DROP INDEX IF EXISTS public.idx_admin_subscriptions_stripe_subscription;

CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_stripe_subscription
    ON public.admin_subscriptions USING btree
    (stripe_subscription_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: update_admin_subscriptions_updated_at

-- DROP TRIGGER IF EXISTS update_admin_subscriptions_updated_at ON public.admin_subscriptions;

CREATE OR REPLACE TRIGGER update_admin_subscriptions_updated_at
    BEFORE UPDATE 
    ON public.admin_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

