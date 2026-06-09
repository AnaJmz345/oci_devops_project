-- Ejemplo de consulta de similitud para probar desde Database Actions.
-- Cambiar el texto y el modelo segun corresponda.

VAR query_vector CLOB;

BEGIN
  SELECT VECTOR_SERIALIZE(
      DBMS_VECTOR.UTL_TO_EMBEDDING(
        'marca la tarea 5 como terminada',
        JSON('{"provider":"database","model":"doc_model"}')
      )
    )
  INTO :query_vector
  FROM dual;
END;
/

SELECT
    i.INTENT_KEY,
    i.DESCRIPTION,
    x.EXAMPLE_TEXT,
    VECTOR_DISTANCE(emb.EMBEDDING_VECTOR, TO_VECTOR(:query_vector), COSINE) AS DISTANCE,
    1 - VECTOR_DISTANCE(emb.EMBEDDING_VECTOR, TO_VECTOR(:query_vector), COSINE) AS CONFIDENCE
FROM VANTAGE.BOT_INTENT_EMBEDDINGS emb
JOIN VANTAGE.BOT_INTENT_EXAMPLES x ON x.EXAMPLE_ID = emb.EXAMPLE_ID
JOIN VANTAGE.BOT_INTENTS i ON i.INTENT_KEY = x.INTENT_KEY
WHERE i.ACTIVE = 'Y'
ORDER BY VECTOR_DISTANCE(emb.EMBEDDING_VECTOR, TO_VECTOR(:query_vector), COSINE)
FETCH FIRST 5 ROWS ONLY;
