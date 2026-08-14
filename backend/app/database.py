"""SQLite database initialization and query helpers."""

import sqlite3
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DATABASE_PATH = Path(__file__).parent.parent / "app.db"


def get_connection() -> sqlite3.Connection:
    """Get a database connection with row factory enabled."""
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_database() -> None:
    """Create database tables if they don't exist."""
    conn = get_connection()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'created',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS inputs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                type TEXT NOT NULL,
                filename TEXT NOT NULL,
                raw_text TEXT,
                file_path TEXT,
                extracted_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS discoveries (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL UNIQUE,
                main_goal TEXT NOT NULL,
                current_process TEXT NOT NULL,
                pain_points TEXT NOT NULL,
                requirements TEXT NOT NULL,
                gaps TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS solutions (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL UNIQUE,
                improvements TEXT NOT NULL,
                features TEXT NOT NULL,
                user_roles TEXT NOT NULL,
                screens TEXT NOT NULL,
                flow_steps TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS pocs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL UNIQUE,
                description TEXT NOT NULL,
                artifact_path TEXT NOT NULL,
                generated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """
        )
        conn.commit()
        logger.info("Database initialized successfully")
    finally:
        conn.close()
