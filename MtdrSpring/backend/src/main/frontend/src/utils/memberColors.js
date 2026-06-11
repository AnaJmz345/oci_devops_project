export const MEMBER_COLORS = [
  '#C74634',
  '#F1B13F',
  '#4C825C',
  '#2b2dbf',
  '#9b59b6',
  '#e07b39',
  '#16a085',
  '#8e44ad',
];

export function getMemberColorByIndex(index = 0) {
  const safeIndex = Number.isFinite(index) ? Math.abs(index) : 0;
  return MEMBER_COLORS[safeIndex % MEMBER_COLORS.length];
}

export function getRecordOracleId(record) {
  return record?.oracleId ?? record?.oracle_id;
}

function getFallbackColorIndex(value) {
  const text = String(value ?? '');
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % MEMBER_COLORS.length;
  }

  return hash;
}

export function getDeveloperColor(oracleId, users = []) {
  const normalizedOracleId = String(oracleId ?? '');
  const developers = (users || []).filter((user) => user?.role === 'DEVELOPER');
  const developerIndex = developers.findIndex((user) =>
    String(getRecordOracleId(user)) === normalizedOracleId
  );

  if (developerIndex >= 0) {
    return getMemberColorByIndex(developerIndex);
  }

  return getMemberColorByIndex(getFallbackColorIndex(normalizedOracleId));
}
