-- Requiere que el modelo ONNX ya este cargado en Oracle AI Database.
-- Cambiar doc_model por el nombre real del modelo.

INSERT INTO VANTAGE.BOT_INTENT_EMBEDDINGS
    (EXAMPLE_ID, EMBEDDING_MODEL, EMBEDDING_PROVIDER, EMBEDDING_VECTOR)
SELECT
    e.EXAMPLE_ID,
    'doc_model',
    'ORACLE_DATABASE_ONNX',
    DBMS_VECTOR.UTL_TO_EMBEDDING(
        e.EXAMPLE_TEXT,
        JSON('{"provider":"database","model":"doc_model"}')
    )
FROM VANTAGE.BOT_INTENT_EXAMPLES e
WHERE e.ACTIVE = 'Y'
  AND NOT EXISTS (
      SELECT 1
      FROM VANTAGE.BOT_INTENT_EMBEDDINGS emb
      WHERE emb.EXAMPLE_ID = e.EXAMPLE_ID
        AND emb.EMBEDDING_MODEL = 'doc_model'
  );

COMMIT;
