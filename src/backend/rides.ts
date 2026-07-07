import { Pool } from "pg";
import { randomUUID } from "crypto";
import type { Ride, RideStatus } from "@/shared/ride-types";

// PostgreSQL 저장소 — 접속 주소는 .env.local의 DATABASE_URL.
// 로컬(Homebrew)이든 클라우드(Supabase/Neon)든 주소만 바꾸면 그대로 동작한다.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 서버가 처음 DB를 쓸 때 테이블이 없으면 만들어 둔다 (1회만 실행)
let schemaReady: Promise<unknown> | null = null;
function ensureSchema() {
  schemaReady ??= pool.query(`
    CREATE TABLE IF NOT EXISTS rides (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL,
      destination_label TEXT NOT NULL,
      destination_address TEXT NOT NULL,
      pickup_address TEXT NOT NULL,
      rider_name TEXT,
      rider_phone TEXT,
      taxi_number TEXT,
      driver_name TEXT,
      eta_minutes INTEGER,
      cancel_reason TEXT
    )
  `);
  return schemaReady;
}

// DB의 행(snake_case) → 앱에서 쓰는 Ride 객체(camelCase)
interface RideRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  status: RideStatus;
  destination_label: string;
  destination_address: string;
  pickup_address: string;
  rider_name: string | null;
  rider_phone: string | null;
  taxi_number: string | null;
  driver_name: string | null;
  eta_minutes: number | null;
  cancel_reason: string | null;
}

function toRide(row: RideRow): Ride {
  return {
    id: row.id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    status: row.status,
    destinationLabel: row.destination_label,
    destinationAddress: row.destination_address,
    pickupAddress: row.pickup_address,
    riderName: row.rider_name ?? undefined,
    riderPhone: row.rider_phone ?? undefined,
    taxiNumber: row.taxi_number ?? undefined,
    driverName: row.driver_name ?? undefined,
    etaMinutes: row.eta_minutes ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
  };
}

export interface CreateRideInput {
  destinationLabel: string;
  destinationAddress: string;
  pickupAddress: string;
  riderName?: string;
  riderPhone?: string;
}

export async function createRide(input: CreateRideInput): Promise<Ride> {
  await ensureSchema();
  const now = new Date().toISOString();
  const { rows } = await pool.query<RideRow>(
    `INSERT INTO rides
       (id, created_at, updated_at, status,
        destination_label, destination_address, pickup_address,
        rider_name, rider_phone)
     VALUES ($1, $2, $2, 'requested', $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      randomUUID(),
      now,
      input.destinationLabel,
      input.destinationAddress,
      input.pickupAddress,
      input.riderName ?? null,
      input.riderPhone ?? null,
    ]
  );
  return toRide(rows[0]);
}

export async function listRides(): Promise<Ride[]> {
  await ensureSchema();
  const { rows } = await pool.query<RideRow>(
    `SELECT * FROM rides ORDER BY created_at DESC`
  );
  return rows.map(toRide);
}

// UUID 형식이 아닌 id로 조회하면 Postgres가 오류를 내므로 미리 걸러 "없음" 처리
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getRide(id: string): Promise<Ride | undefined> {
  if (!UUID_RE.test(id)) return undefined;
  await ensureSchema();
  const { rows } = await pool.query<RideRow>(
    `SELECT * FROM rides WHERE id = $1`,
    [id]
  );
  return rows[0] ? toRide(rows[0]) : undefined;
}

export interface UpdateRideInput {
  status?: RideStatus;
  taxiNumber?: string;
  driverName?: string;
  etaMinutes?: number;
  cancelReason?: string;
}

export async function updateRide(
  id: string,
  patch: UpdateRideInput
): Promise<Ride | undefined> {
  if (!UUID_RE.test(id)) return undefined;
  await ensureSchema();
  const { rows } = await pool.query<RideRow>(
    `UPDATE rides SET
       status        = COALESCE($2, status),
       taxi_number   = COALESCE($3, taxi_number),
       driver_name   = COALESCE($4, driver_name),
       eta_minutes   = COALESCE($5, eta_minutes),
       cancel_reason = COALESCE($6, cancel_reason),
       updated_at    = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      patch.status ?? null,
      patch.taxiNumber ?? null,
      patch.driverName ?? null,
      patch.etaMinutes ?? null,
      patch.cancelReason ?? null,
    ]
  );
  return rows[0] ? toRide(rows[0]) : undefined;
}
