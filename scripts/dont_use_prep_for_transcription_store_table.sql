-- ===================================================================
-- Store Table - Complete Schema with ElevenLabs Agent ID
-- ===================================================================
-- Drop existing table (use with caution in production!)
-- DROP TABLE IF EXISTS public.store CASCADE;

CREATE TABLE IF NOT EXISTS public.store
(
    store_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES public.restaurant(restaurant_id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES public.location(location_id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    elevenlabs_agent_id VARCHAR(255), -- ElevenLabs Conversational AI Agent ID
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT store_restaurant_id_fkey FOREIGN KEY (restaurant_id)
        REFERENCES public.restaurant(restaurant_id) ON DELETE CASCADE,
    CONSTRAINT store_location_id_fkey FOREIGN KEY (location_id)
        REFERENCES public.location(location_id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_restaurant_id ON public.store(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_store_location_id ON public.store(location_id);
CREATE INDEX IF NOT EXISTS idx_store_agent_id ON public.store(elevenlabs_agent_id);
CREATE INDEX IF NOT EXISTS idx_store_active ON public.store(is_active);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_store ON public.store;
CREATE TRIGGER set_updated_at_store
    BEFORE UPDATE 
    ON public.store
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Table ownership
ALTER TABLE IF EXISTS public.store OWNER TO postgres;

-- Comments
COMMENT ON TABLE public.store IS 'Stores/locations belonging to restaurants, includes ElevenLabs agent mapping';
COMMENT ON COLUMN public.store.restaurant_id IS 'Foreign key to restaurant table';
COMMENT ON COLUMN public.store.location_id IS 'Foreign key to location table (optional)';
COMMENT ON COLUMN public.store.elevenlabs_agent_id IS 'ElevenLabs Conversational AI Agent ID for fetching transcriptions';
COMMENT ON COLUMN public.store.is_active IS 'Whether store is currently active';