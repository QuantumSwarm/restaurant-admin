ALTER TABLE store 
ADD COLUMN elevenlabs_agent_id VARCHAR(255);

CREATE INDEX idx_store_agent_id ON store(elevenlabs_agent_id);

COMMENT ON COLUMN store.elevenlabs_agent_id IS 'ElevenLabs Conversational AI Agent ID';