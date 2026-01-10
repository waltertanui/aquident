export type Gender = "M" | "F";

export interface WalkinInput {
  name: string;
  g: Gender;
  a: number;
  contacts: string;
  res: string;
  op: string;
  dr: string;
  ins?: string;
}

export interface StoredPatient extends WalkinInput {
  no: number;
  old?: number;
  newId?: number;
  cpb?: string;
  inv?: number;
  bal?: number;
  tca?: number;
}

const KEY = "aquident.walkins";
const SEQ_KEY = "aquident.walkins.seq";

function readSeq(): number {
  const raw = localStorage.getItem(SEQ_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

function writeSeq(n: number): void {
  localStorage.setItem(SEQ_KEY, String(n));
}

export function getWalkins(): StoredPatient[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredPatient[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setWalkins(items: StoredPatient[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function saveWalkin(input: WalkinInput): StoredPatient {
  const seq = readSeq() + 1;
  writeSeq(seq);
  const record: StoredPatient = {
    no: seq,
    newId: seq,
    ...input,
  };
  const items = getWalkins();
  items.push(record);
  setWalkins(items);
  return record;
}