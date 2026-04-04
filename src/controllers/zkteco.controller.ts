import type { Request, Response } from 'express';
import { execute, query } from '@/database/connection';

type ZkParsedRecord = {
  pin: string;
  dateTime: string; // "YYYY-MM-DD HH:mm:ss" (device local time)
};

type AttendanceLogRow = {
  id: number;
  userId: string;
  timestamp: string;
  deviceId: string;
  eventType?: 'check_in' | 'check_out';
};

function asString(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function getDeviceId(req: Request): string {
  const q = req.query as any;
  const b = req.body as any;
  return (
    asString(q?.SN) ||
    asString(q?.sn) ||
    asString(b?.SN) ||
    asString(b?.sn) ||
    asString(b?.device_id) ||
    asString(b?.deviceId) ||
    'unknown'
  ).trim();
}

function extractPayload(req: Request): string {
  // ZKTeco commonly posts x-www-form-urlencoded with DATA=...\r\n...
  // Some devices can post text/plain; in that case we parse req.body as string.
  const body: any = req.body as any;
  if (typeof body === 'string') return body;
  if (body && typeof body === 'object') {
    const data = body.DATA ?? body.data ?? body.Data ?? body.attlog ?? body.ATTLOG;
    if (typeof data === 'string') return data;
  }
  return '';
}

function parseZkRecords(payload: string): ZkParsedRecord[] {
  const text = asString(payload).trim();
  if (!text) return [];

  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const records: ZkParsedRecord[] = [];
  for (const line of lines) {
    // Skip headers like: "PIN\tDateTime\tStatus\tVerify\tWorkCode"
    const lower = line.toLowerCase();
    if (lower.startsWith('pin') && lower.includes('datetime')) continue;

    // Expected: PIN\tYYYY-MM-DD HH:mm:ss\t...
    if (line.includes('\t')) {
      const parts = line.split(/\t+/);
      const pin = asString(parts[0]).trim();
      const dt = asString(parts[1]).trim();
      if (pin && dt) records.push({ pin, dateTime: dt });
      continue;
    }

    // Fallback: "PIN 2026-04-04 08:00:00 ..." (rare)
    const m = line.match(/^(\S+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
    if (m) {
      records.push({ pin: m[1].trim(), dateTime: m[2].trim() });
    }
  }

  return records;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

async function resolveUserIdsByPin(pins: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniquePins = Array.from(new Set(pins.map((p) => String(p).trim()).filter(Boolean)));
  if (uniquePins.length === 0) return map;

  const fillFrom = async (table: 'hr_employees' | 'teachers') => {
    for (const pinChunk of chunk(uniquePins.filter((p) => !map.has(p)), 200)) {
      const placeholders = pinChunk.map(() => '?').join(',');
      const rows = await query<{ employeeId: string; userId: string }>(
        `SELECT employeeId, userId FROM ${table} WHERE employeeId IN (${placeholders})`,
        pinChunk
      );
      for (const r of rows) {
        const employeeId = asString((r as any).employeeId).trim();
        const userId = asString((r as any).userId).trim();
        if (employeeId && userId && !map.has(employeeId)) map.set(employeeId, userId);
      }
    }
  };

  // Prefer HR employees mapping; fallback to teachers.
  await fillFrom('hr_employees');
  await fillFrom('teachers');

  return map;
}

function annotateCheckInOut(logs: AttendanceLogRow[]): AttendanceLogRow[] {
  // Best-effort check-in/check-out labeling without changing schema.
  // For each user_id per day, earliest is check_in, next is check_out, alternating.
  const keyFor = (l: AttendanceLogRow) => `${l.userId}::${String(l.timestamp).slice(0, 10)}`;
  const groups = new Map<string, AttendanceLogRow[]>();
  for (const l of logs) {
    const k = keyFor(l);
    const list = groups.get(k) || [];
    list.push(l);
    groups.set(k, list);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    for (let i = 0; i < list.length; i++) {
      list[i].eventType = i % 2 === 0 ? 'check_in' : 'check_out';
    }
  }

  return logs;
}

export class ZktecoController {
  static async getRequest(req: Request, res: Response): Promise<void> {
    // Device polls this endpoint; always respond OK.
    res.status(200).type('text/plain').send('OK');
  }

  static async postCdata(req: Request, res: Response): Promise<void> {
    const deviceId = getDeviceId(req);

    try {
      const payload = extractPayload(req);
      const records = parseZkRecords(payload);

      if (records.length === 0) {
        console.warn('[ZKTeco] Empty/invalid payload', {
          deviceId,
          contentType: req.headers['content-type'],
          query: req.query,
        });
        res.status(200).type('text/plain').send('OK');
        return;
      }

      const pinList = records.map((r) => r.pin);
      const userMap = await resolveUserIdsByPin(pinList);

      const uniqueRows = new Map<string, { userId: string; timestamp: string; deviceId: string }>();
      const unknownPins = new Set<string>();

      for (const r of records) {
        const userId = userMap.get(r.pin);
        if (!userId) {
          unknownPins.add(r.pin);
          continue;
        }

        // Keep timestamp as device-sent string to avoid timezone surprises.
        const ts = r.dateTime;
        const key = `${userId}::${ts}::${deviceId}`;
        if (!uniqueRows.has(key)) {
          uniqueRows.set(key, { userId, timestamp: ts, deviceId });
        }
      }

      if (unknownPins.size > 0) {
        console.warn('[ZKTeco] Unknown PIN(s) (not found in hr_employees/teachers)', {
          deviceId,
          pins: Array.from(unknownPins).slice(0, 20),
          count: unknownPins.size,
        });
      }

      const rowsToInsert = Array.from(uniqueRows.values());
      console.log('[ZKTeco] Received attendance logs', {
        deviceId,
        rawRecords: records.length,
        resolved: rowsToInsert.length,
      });

      // Insert in chunks; duplicate protection is enforced by UNIQUE KEY + INSERT IGNORE.
      for (const batch of chunk(rowsToInsert, 300)) {
        const placeholders = batch.map(() => '(?, ?, ?)').join(',');
        const params = batch.flatMap((r) => [r.userId, r.timestamp, r.deviceId]);
        await execute(
          `INSERT IGNORE INTO attendance_logs (user_id, \`timestamp\`, device_id) VALUES ${placeholders}`,
          params
        );
      }
    } catch (error: any) {
      // IMPORTANT: always return OK to device to prevent resend loops.
      console.error('[ZKTeco] Failed to process cdata', {
        deviceId,
        message: error?.message,
      });
    }

    res.status(200).type('text/plain').send('OK');
  }

  static async getAttendanceLogs(req: Request, res: Response): Promise<void> {
    try {
      const { userId, deviceId, from, to } = req.query as any;
      const limitRaw = asString((req.query as any).limit);
      const limit = Math.min(Math.max(parseInt(limitRaw || '200', 10) || 200, 1), 1000);

      const where: string[] = [];
      const params: any[] = [];

      if (userId) {
        where.push('user_id = ?');
        params.push(String(userId));
      }
      if (deviceId) {
        where.push('device_id = ?');
        params.push(String(deviceId));
      }
      if (from) {
        where.push('`timestamp` >= ?');
        params.push(String(from));
      }
      if (to) {
        where.push('`timestamp` <= ?');
        params.push(String(to));
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const rows = await query<any>(
        `SELECT id, user_id as userId, \`timestamp\` as timestamp, device_id as deviceId
         FROM attendance_logs
         ${whereSql}
         ORDER BY \`timestamp\` DESC
         LIMIT ${limit}`,
        params
      );

      const logs: AttendanceLogRow[] = rows.map((r: any) => ({
        id: Number(r.id),
        userId: asString(r.userId),
        timestamp: asString(r.timestamp),
        deviceId: asString(r.deviceId),
      }));

      annotateCheckInOut(logs);

      res.status(200).json({
        success: true,
        count: logs.length,
        logs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch attendance logs',
      });
    }
  }
}
