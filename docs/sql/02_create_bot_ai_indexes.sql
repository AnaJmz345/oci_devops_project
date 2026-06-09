CREATE INDEX VANTAGE.IDX_BOT_INTENT_EXAMPLES_KEY
    ON VANTAGE.BOT_INTENT_EXAMPLES (INTENT_KEY, ACTIVE);

CREATE INDEX VANTAGE.IDX_BOT_CONTEXT_CHAT_STATUS
    ON VANTAGE.BOT_CONVERSATION_CONTEXT (TELEGRAM_CHAT_ID, STATUS, CREATED_AT);

CREATE INDEX VANTAGE.IDX_BOT_AUDIT_INTENT_DATE
    ON VANTAGE.BOT_ACTION_AUDIT (INTENT_KEY, CREATED_AT);

-- Ejecutar solo cuando EMBEDDING_VECTOR tenga datos suficientes.
-- Para catálogos pequeños el índice vectorial es opcional, pero es útil para presentar Oracle AI Vector Search.
BEGIN
  DBMS_VECTOR.CREATE_INDEX(
    idx_name                => 'IDX_BOT_INTENT_EMB_HNSW',
    table_name              => 'VANTAGE.BOT_INTENT_EMBEDDINGS',
    idx_vector_col          => 'EMBEDDING_VECTOR',
    idx_include_cols        => 'EXAMPLE_ID',
    idx_partitioning_scheme => NULL,
    idx_organization        => 'INMEMORY NEIGHBOR GRAPH',
    idx_distance_metric     => 'COSINE',
    idx_accuracy            => 95,
    idx_parameters          => '{"type":"HNSW","neighbors":32,"efConstruction":200}',
    idx_online_build        => TRUE
  );
END;
/
