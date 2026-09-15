import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import type { NewQuestInput, Quest } from "./quest-types";

type TodoRow = {
  id: number;
  task: string;
  description: string;
  category: string;
  completed: number;
  due_date: string | null;
  total_seconds: number;
};

let database: DatabaseSync | undefined;

function getDatabasePath() {
  if (process.env.TODO_QUEST_DB_PATH) {
    return process.env.TODO_QUEST_DB_PATH;
  }

  return path.join(process.cwd(), "data", "todoQuest.db");
}

function setupDatabase() {
  const databasePath = getDatabasePath();
  mkdirSync(path.dirname(databasePath), { recursive: true });

  const connection = new DatabaseSync(databasePath, { timeout: 5000 });
  connection.exec("PRAGMA journal_mode = WAL;");
  connection.exec(
    `CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'General',
      completed INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      total_seconds INTEGER NOT NULL DEFAULT 0
    );`,
  );
  importLegacyTodos(connection, databasePath);

  return connection;
}

function importLegacyTodos(connection: DatabaseSync, databasePath: string) {
  const questCount = connection.prepare("SELECT COUNT(*) AS count FROM todos").get() as { count: number };

  if (questCount.count > 0) {
    return;
  }

  const legacyPath = path.resolve(process.cwd(), "..", "todoQuest.db");

  if (databasePath === legacyPath || !existsSync(legacyPath)) {
    return;
  }

  const legacyDatabase = new DatabaseSync(legacyPath, { readOnly: true, timeout: 5000 });
  let transactionStarted = false;

  try {
    const legacyTodosTable = legacyDatabase
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'todos'")
      .get();

    if (!legacyTodosTable) {
      return;
    }

    const legacyRows = legacyDatabase
      .prepare(
        `SELECT id, task, description, category, completed, due_date, total_seconds
         FROM todos
         ORDER BY id`,
      )
      .all() as unknown as TodoRow[];

    const insertQuest = connection.prepare(
      `INSERT OR IGNORE INTO todos (id, task, description, category, completed, due_date, total_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    connection.exec("BEGIN TRANSACTION;");
    transactionStarted = true;

    for (const quest of legacyRows) {
      insertQuest.run(
        quest.id,
        quest.task,
        quest.description,
        quest.category,
        quest.completed,
        quest.due_date,
        quest.total_seconds,
      );
    }

    connection.exec("COMMIT;");
    transactionStarted = false;
  } catch {
    if (transactionStarted) {
      connection.exec("ROLLBACK;");
    }
  } finally {
    legacyDatabase.close();
  }
}

function getDatabase() {
  if (!database) {
    database = setupDatabase();
  }

  return database;
}

function toQuest(row: TodoRow): Quest {
  return {
    id: String(row.id),
    title: row.task,
    description: row.description,
    category: row.category,
    dueDate: row.due_date ?? "",
    completed: Boolean(row.completed),
    focusMinutes: Math.floor(Number(row.total_seconds) / 60),
  };
}

export function getQuests() {
  const rows = getDatabase()
    .prepare(
      `SELECT id, task, description, category, completed, due_date, total_seconds
       FROM todos
       ORDER BY completed ASC, due_date IS NULL, due_date ASC, id DESC`,
    )
    .all() as unknown as TodoRow[];

  return rows.map(toQuest);
}

export function getQuest(id: number) {
  const row = getDatabase()
    .prepare(
      `SELECT id, task, description, category, completed, due_date, total_seconds
       FROM todos
       WHERE id = ?`,
    )
    .get(id) as unknown as TodoRow | undefined;

  return row ? toQuest(row) : undefined;
}

export function createQuest(input: NewQuestInput) {
  const result = getDatabase()
    .prepare(
      `INSERT INTO todos (task, description, category, completed, due_date, total_seconds)
       VALUES (?, ?, ?, 0, ?, 0)`,
    )
    .run(input.title, input.description, input.category, input.dueDate || null);

  return getQuest(Number(result.lastInsertRowid));
}

export function setQuestCompleted(id: number, completed: boolean) {
  const result = getDatabase()
    .prepare("UPDATE todos SET completed = ? WHERE id = ?")
    .run(completed ? 1 : 0, id);

  if (result.changes === 0) {
    return undefined;
  }

  return getQuest(id);
}
