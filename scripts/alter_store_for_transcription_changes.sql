ALTER TABLE public.store
ADD COLUMN IF NOT EXISTS last_sync_at timestamp without time zone,
ADD COLUMN IF NOT EXISTS last_sync_id character varying(255),
ADD COLUMN IF NOT EXISTS sync_status character varying(20) DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS sync_error text,
ADD COLUMN IF NOT EXISTS synced_conversations integer DEFAULT 0;

COMMENT ON COLUMN public.store.last_sync_at IS 'Timestamp of the last successful incremental sync from ElevenLabs';
COMMENT ON COLUMN public.store.last_sync_id IS 'Optional ID or cursor of the last synced item (for resume/recovery)';
COMMENT ON COLUMN public.store.sync_status IS 'Sync state: idle, syncing, error';
COMMENT ON COLUMN public.store.sync_error IS 'Last sync error message (if any)';
COMMENT ON COLUMN public.store.synced_conversations IS 'Count of conversations synced in the last run';

CREATE INDEX IF NOT EXISTS idx_store_last_sync_at ON public.store USING btree (last_sync_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_store_sync_status ON public.store USING btree (sync_status ASC NULLS LAST);
COMMIT;