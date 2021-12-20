/* SPDX-FileCopyrightText: 2016-present Kriasoft <hello@kriasoft.com> */
/* SPDX-License-Identifier: MIT */

import { knex } from "knex";
import { camelCase, upperFirst } from "lodash";
import { PassThrough } from "stream";
import { updateTypes } from "./main";

let db: ReturnType<typeof knex>;

beforeEach(async function setup() {
  db = knex({ client: "pg", connection: { database: "update_types" } });

  await createDatabase();

  await db.raw(`CREATE DOMAIN short_id AS TEXT CHECK(VALUE ~ '^[0-9a-z]{6}$')`);
  await db.raw(`CREATE TYPE identity_provider AS ENUM ('google', 'facebook', 'linkedin')`); // prettier-ignore

  await db.schema.createTable("user", (table) => {
    table.increments("int").notNullable().primary();
    table.specificType("provider", "identity_provider").notNullable();
    table.specificType("provider_null", "identity_provider");
    table.specificType("provider_array", "identity_provider[]").notNullable();
    table.specificType("int_array", "integer[]").notNullable();
    table.specificType("short_id", "short_id").notNullable();
    table.decimal("decimal").notNullable();
    table.specificType("decimal_array", "decimal[]").notNullable();
    table.double("double").notNullable();
    table.specificType("double_array", "float8[]").notNullable();
    table.float("float").notNullable();
    table.specificType("float_array", "float4[]").notNullable();
    table.specificType("money", "money").notNullable();
    table.bigInteger("bigint").notNullable();
    table.binary("binary").notNullable();
    table.binary("binary_null");
    table.specificType("binary_array", "bytea[]").notNullable();
    table.uuid("uuid").notNullable();
    table.uuid("uuid_null");
    table.specificType("uuid_array", "uuid[]").notNullable();
    table.text("text").notNullable();
    table.text("text_null");
    table.specificType("text_array", "text[]").notNullable();
    table.specificType("citext", "citext").notNullable();
    table.specificType("citext_null", "citext");
    table.specificType("citext_array", "citext[]").notNullable();
    table.specificType("char", "char(2)").notNullable();
    table.string("varchar", 10).notNullable();
    table.boolean("bool").notNullable();
    table.boolean("bool_null");
    table.specificType("bool_array", "bool[]").notNullable();
    table.jsonb("jsonb_object").notNullable().defaultTo("{}");
    table.jsonb("jsonb_object_null").defaultTo("{}");
    table.jsonb("jsonb_array").notNullable().defaultTo("[]");
    table.jsonb("jsonb_array_null").defaultTo("[]");
    table.timestamp("timestamp").notNullable();
    table.timestamp("timestamp_null");
    table.time("time").notNullable();
    table.time("time_null");
    table.specificType("time_array", "time[]").notNullable();
    table.specificType("interval", "interval").notNullable();
    table.text("display name");
    table.text("1invalidIdentifierName");
    table.text(`name with a "`);
  });

  await db.schema.createTable("login", (table) => {
    table.increments("secret").notNullable().primary();
  });

  await db.schema.withSchema("log").createTable("messages", (table) => {
    table.increments("int").notNullable().primary();
    table.text("notes");
    table.timestamp("timestamp").notNullable();
  });

  await db.schema.withSchema("secret").createTable("secret", (table) => {
    table.increments("int").notNullable().primary();
    table.text("notes");
    table.timestamp("timestamp").notNullable();
  });
});

afterEach(async function teardown() {
  await db.destroy();
});

test("updateTypes", async function () {
  const output = new PassThrough();
  const overrides = {
    "identity_provider.linkedin": "LinkedIn",
  };

  await updateTypes(db, {
    output,
    overrides,
    prefix: 'import { PostgresInterval} from "postgres-interval";',
    suffix: "// user supplied suffix",
    schema: ["public", "log", "!secret"],
    exclude: ["login"],
  });

  expect(await toString(output)).toMatchInlineSnapshot(`
    "// The TypeScript definitions below are automatically generated.
    // Do not touch them, or risk, your modifications being lost.

    import { PostgresInterval} from \\"postgres-interval\\";

    export enum IdentityProvider {
      Google = \\"google\\",
      Facebook = \\"facebook\\",
      LinkedIn = \\"linkedin\\",
    }

    export enum Table {
      LogMessages = \\"log.messages\\",
      User = \\"user\\",
    }

    export type Tables = {
      \\"log.messages\\": LogMessages,
      \\"user\\": User,
    };

    export type LogMessages = {
      int: number;
      notes: string | null;
      timestamp: Date;
    };

    export type User = {
      int: number;
      provider: IdentityProvider;
      provider_null: IdentityProvider | null;
      provider_array: IdentityProvider[];
      int_array: number[];
      short_id: string;
      decimal: string;
      decimal_array: string[];
      double: number;
      double_array: number[];
      float: number;
      float_array: number[];
      money: string;
      bigint: string;
      binary: Buffer;
      binary_null: Buffer | null;
      binary_array: Buffer[];
      uuid: string;
      uuid_null: string | null;
      uuid_array: string[];
      text: string;
      text_null: string | null;
      text_array: string[];
      citext: string;
      citext_null: string | null;
      citext_array: string[];
      char: string;
      varchar: string;
      bool: boolean;
      bool_null: boolean | null;
      bool_array: boolean[];
      jsonb_object: Record<string, unknown>;
      jsonb_object_null: Record<string, unknown> | null;
      jsonb_array: unknown[];
      jsonb_array_null: unknown[] | null;
      timestamp: Date;
      timestamp_null: Date | null;
      time: string;
      time_null: string | null;
      time_array: string[];
      interval: PostgresInterval;
      \\"display name\\": string | null;
      \\"1invalidIdentifierName\\": string | null;
      \\"name with a \\\\\\"\\": string | null;
    };

    // user supplied suffix
    "
  `);
});

test("updateTypes with custom overrides functions", async function () {
  const output = new PassThrough();

  await updateTypes(db, {
    output,
    overrides: {
      "identity_provider.linkedin": "LinkedIn",
      $enum: (name) => name, // disable default
      $column: (name) => upperFirst(camelCase(name)),
      // use default for enumValues
      $table: (name) => `prefix${upperFirst(name)}`,
    },
  });

  expect(await toString(output)).toMatchInlineSnapshot(`
"// The TypeScript definitions below are automatically generated.
// Do not touch them, or risk, your modifications being lost.

export enum identity_provider {
  Google = \\"google\\",
  Facebook = \\"facebook\\",
  LinkedIn = \\"linkedin\\",
}

export enum Table {
  prefixLogin = \\"login\\",
  prefixUser = \\"user\\",
}

export type prefixLogin = {
  Secret: number;
};

export type prefixUser = {
  Int: number;
  Provider: identity_provider;
  ProviderNull: identity_provider | null;
  ProviderArray: identity_provider[];
  IntArray: number[];
  ShortId: string;
  Decimal: string;
  DecimalArray: string[];
  Double: number;
  DoubleArray: number[];
  Float: number;
  FloatArray: number[];
  Money: string;
  Bigint: string;
  Binary: Buffer;
  BinaryNull: Buffer | null;
  BinaryArray: Buffer[];
  Uuid: string;
  UuidNull: string | null;
  UuidArray: string[];
  Text: string;
  TextNull: string | null;
  TextArray: string[];
  Citext: string;
  CitextNull: string | null;
  CitextArray: string[];
  Char: string;
  Varchar: string;
  Bool: boolean;
  BoolNull: boolean | null;
  BoolArray: boolean[];
  JsonbObject: Record<string, unknown>;
  JsonbObjectNull: Record<string, unknown> | null;
  JsonbArray: unknown[];
  JsonbArrayNull: unknown[] | null;
  Timestamp: Date;
  TimestampNull: Date | null;
  Time: string;
  TimeNull: string | null;
  TimeArray: string[];
  Interval: PostgresInterval;
};

"
`);
});

async function createDatabase(): Promise<void> {
  try {
    await db.select(db.raw("version()")).first();
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (err instanceof Error && (err as any).code !== "3D000") throw err;
    // Create a new test database if it doesn't exist
    const tmp = knex({ client: "pg", connection: { database: "template1" } });
    try {
      const dbName = db.client.config.connection.database;
      await tmp.raw("create database ?", [dbName]);
    } finally {
      await tmp.destroy();
    }
  }

  await db.schema.raw("DROP SCHEMA IF EXISTS public CASCADE");
  await db.schema.raw("DROP SCHEMA IF EXISTS log CASCADE");
  await db.schema.raw("DROP SCHEMA IF EXISTS secret CASCADE");
  await db.schema.raw("CREATE SCHEMA public");
  await db.schema.raw("CREATE SCHEMA log");
  await db.schema.raw("CREATE SCHEMA secret");
  await db.raw(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await db.raw(`CREATE EXTENSION IF NOT EXISTS "hstore"`);
  await db.raw(`CREATE EXTENSION IF NOT EXISTS "citext"`);
}

function toString(stream: PassThrough): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}
