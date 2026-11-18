#!/usr/bin/env tsx
/*
  Generates a single idempotent SQL file to:
  - CREATE TABLE IF NOT EXISTS for every sqliteTable defined in src/db/schema.ts
  - ALTER TABLE ... ADD COLUMN IF NOT EXISTS for every column (safe for existing DBs)

  Notes:
  - This generator is intentionally conservative for ALTER TABLE: it avoids NOT NULL and FK constraints
    so it can be applied to non-empty existing tables.
  - CREATE TABLE statements include best-effort NOT NULL/default/FK/PK based on Drizzle definitions.

  Usage:
    npx tsx scripts/generate-schema-repair-sql.ts
*/

import fs from 'node:fs';
import path from 'node:path';

type ColumnDef = {
  propName: string;
  columnName: string;
  sqlType: 'INTEGER' | 'REAL' | 'TEXT';
  primaryKey?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defaultSql?: string;
  references?: { table: string; column: string; onDelete?: string };
};

type TableDef = {
  varName: string;
  tableName: string;
  columns: ColumnDef[];
  extraSql: string[]; // indexes etc
};

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'src', 'db', 'schema.ts');
const OUT_PATH = path.join(ROOT, 'in_progress', 'schema_repair.sql');

function normalizeDefault(raw: string | undefined, sqlType: ColumnDef['sqlType']): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();

  // boolean literals
  if (trimmed === 'true') return '1';
  if (trimmed === 'false') return '0';

  // numeric literal
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return trimmed;

  // quoted string literal
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    // Use single quotes in SQL
    const innerRaw = trimmed.slice(1, -1);
    const inner = innerRaw.replace(/'/g, "''");

    // Common SQLite special defaults are often represented as strings in Drizzle.
    // Prefer emitting them as bare identifiers.
    if (innerRaw === 'CURRENT_TIMESTAMP' || innerRaw === 'CURRENT_DATE' || innerRaw === 'CURRENT_TIME') {
      return innerRaw;
    }

    return `'${inner}'`;
  }

  // CURRENT_TIMESTAMP or other bare identifiers
  if (/^[A-Z_]+$/.test(trimmed)) return trimmed;

  // Fallback: if TEXT, wrap as string
  if (sqlType === 'TEXT') {
    return `'${trimmed.replace(/'/g, "''")}'`;
  }

  return undefined;
}

function extractBalancedBlock(src: string, startIndex: number, openChar: string, closeChar: string): { block: string; endIndex: number } {
  let depth = 0;
  let i = startIndex;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return { block: src.slice(startIndex, i + 1), endIndex: i + 1 };
      }
    }
  }
  throw new Error('Unbalanced block while parsing schema.ts');
}

function parseSchema(schemaText: string): TableDef[] {
  const tableDefs: TableDef[] = [];

  // First pass: map variable -> table name
  const varToTable = new Map<string, string>();
  for (const m of schemaText.matchAll(/export const (\w+)\s*=\s*sqliteTable\('([^']+)'/g)) {
    varToTable.set(m[1], m[2]);
  }

  // Second pass: parse each sqliteTable block
  const tableRe = /export const (\w+)\s*=\s*sqliteTable\('([^']+)'\s*,\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = tableRe.exec(schemaText))) {
    const varName = match[1];
    const tableName = match[2];

    // match.index points at "export const ..."; we need position of the "{" that starts columns object
    const columnsObjectStart = schemaText.indexOf('{', match.index);
    const { block: columnsBlockWithBraces, endIndex: afterColumnsObject } = extractBalancedBlock(schemaText, columnsObjectStart, '{', '}');
    const columnsBlock = columnsBlockWithBraces.slice(1, -1); // remove outer braces

    const columns: ColumnDef[] = [];

    // Parse column lines. This is best-effort and ignores computed/index blocks.
    for (const line of columnsBlock.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      // Match: prop: integer('col' ...)
      const colMatch = trimmed.match(/^(\w+)\s*:\s*(integer|real|text)\('\s*([^']+)\s*'\s*(?:,\s*\{[^}]*\})?\)\s*(.*),?$/);
      if (!colMatch) continue;

      const propName = colMatch[1];
      const builderType = colMatch[2];
      const columnName = colMatch[3];
      const tail = colMatch[4] ?? '';

      const sqlType: ColumnDef['sqlType'] = builderType === 'integer' ? 'INTEGER' : builderType === 'real' ? 'REAL' : 'TEXT';

      const primaryKey = /\.primaryKey\(/.test(tail) || /\.primaryKey\b/.test(tail);
      const autoIncrement = /autoIncrement\s*:\s*true/.test(tail);
      const notNull = /\.notNull\(\)/.test(tail);
      const unique = /\.unique\(\)/.test(tail);

      // default(...) extraction
      let defaultSql: string | undefined;
      const defMatch = tail.match(/\.default\(([^\)]+)\)/);
      if (defMatch) {
        defaultSql = normalizeDefault(defMatch[1], sqlType);
      }

      // references(() => users.id, { onDelete: 'cascade' })
      let references: ColumnDef['references'] | undefined;
      const refMatch = tail.match(/\.references\(\(\)\s*=>\s*(\w+)\.(\w+)\s*,\s*\{[^}]*onDelete\s*:\s*'([^']+)'[^}]*\}\)/);
      const refMatchNoOpt = tail.match(/\.references\(\(\)\s*=>\s*(\w+)\.(\w+)\s*\)/);
      if (refMatch) {
        const refVar = refMatch[1];
        const refCol = refMatch[2];
        const refTable = varToTable.get(refVar);
        if (refTable) {
          references = { table: refTable, column: refCol, onDelete: refMatch[3] };
        }
      } else if (refMatchNoOpt) {
        const refVar = refMatchNoOpt[1];
        const refCol = refMatchNoOpt[2];
        const refTable = varToTable.get(refVar);
        if (refTable) {
          references = { table: refTable, column: refCol };
        }
      }

      columns.push({
        propName,
        columnName,
        sqlType,
        primaryKey,
        autoIncrement,
        notNull,
        unique,
        defaultSql,
        references,
      });
    }

    // Best-effort: add known unique indexes declared in schema.ts that affect runtime correctness.
    const extraSql: string[] = [];
    if (tableName === 'users') {
      extraSql.push(`CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone);`);
    }
    if (tableName === 'invitations') {
      extraSql.push(`CREATE UNIQUE INDEX IF NOT EXISTS invitations_email_role_unique ON invitations(email, role);`);
    }

    tableDefs.push({ varName, tableName, columns, extraSql });

    // Move regex cursor forward so we don't re-parse nested matches
    tableRe.lastIndex = afterColumnsObject;
  }

  // sanity: deterministic order
  tableDefs.sort((a, b) => a.tableName.localeCompare(b.tableName));

  return tableDefs;
}

function columnSqlForCreate(c: ColumnDef): string {
  const parts: string[] = [];
  parts.push(`${c.columnName} ${c.sqlType}`);

  if (c.primaryKey) {
    parts.push('PRIMARY KEY');
    if (c.autoIncrement && c.sqlType === 'INTEGER') parts.push('AUTOINCREMENT');
  }

  if (c.notNull && !c.primaryKey) parts.push('NOT NULL');

  if (c.unique && !c.primaryKey) parts.push('UNIQUE');

  if (c.defaultSql) parts.push(`DEFAULT ${c.defaultSql}`);

  if (c.references) {
    parts.push(`REFERENCES ${c.references.table}(${c.references.column})`);
    if (c.references.onDelete) {
      const od = c.references.onDelete.toLowerCase();
      if (od === 'cascade') parts.push('ON DELETE CASCADE');
      if (od === 'set null') parts.push('ON DELETE SET NULL');
    }
  }

  return parts.join(' ');
}

function columnSqlForAlter(c: ColumnDef): string {
  // Be conservative to avoid failing on non-empty tables.
  // - no PRIMARY KEY / AUTOINCREMENT
  // - no NOT NULL
  // - no FK constraints
  // - keep DEFAULT if we can safely translate it
  const parts: string[] = [];
  parts.push(`${c.columnName} ${c.sqlType}`);
  if (c.defaultSql) parts.push(`DEFAULT ${c.defaultSql}`);
  return parts.join(' ');
}

function generateSql(tables: TableDef[]): string {
  const lines: string[] = [];
  lines.push('-- TaskLynk comprehensive schema repair (SQLite/Turso)');
  lines.push('-- Generated from src/db/schema.ts');
  lines.push('--');
  lines.push('-- This script is designed to be safely re-runnable:');
  lines.push('--  - CREATE TABLE IF NOT EXISTS for all tables');
  lines.push('--  - ALTER TABLE ADD COLUMN IF NOT EXISTS for all columns');
  lines.push('--');
  lines.push('-- If your SQLite engine does not support "ADD COLUMN IF NOT EXISTS",');
  lines.push('-- you can remove the "IF NOT EXISTS" portions and re-run carefully.');
  lines.push('PRAGMA foreign_keys = ON;');
  lines.push('');

  for (const t of tables) {
    if (t.columns.length === 0) continue;
    lines.push(`-- ---------------------------------------------------------------------`);
    lines.push(`-- ${t.tableName}`);
    lines.push(`-- ---------------------------------------------------------------------`);

    lines.push(`CREATE TABLE IF NOT EXISTS ${t.tableName} (`);
    const colLines = t.columns.map((c) => `  ${columnSqlForCreate(c)}`);
    lines.push(colLines.join(',\n'));
    lines.push(');');

    for (const extra of t.extraSql) lines.push(extra);

    lines.push('');

    // ALTERs: skip the PK column because adding it later is not meaningful.
    for (const c of t.columns) {
      if (c.primaryKey) continue;
      lines.push(`ALTER TABLE ${t.tableName} ADD COLUMN IF NOT EXISTS ${columnSqlForAlter(c)};`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  const schemaText = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const tables = parseSchema(schemaText);
  if (tables.length === 0) {
    throw new Error('No sqliteTable definitions found in schema.ts');
  }

  const sql = generateSql(tables);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, sql, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`✅ Wrote schema repair SQL to: ${path.relative(ROOT, OUT_PATH)}`);
  // eslint-disable-next-line no-console
  console.log(`   Tables: ${tables.length}`);
}

main();
