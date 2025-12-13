use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

const CACHE_TTL_HOURS: i64 = 24;
const MAX_CACHE_ENTRIES: i64 = 50000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedNeutralization {
    pub content_hash: String,
    pub original: String,
    pub neutralized: String,
    pub techniques: Vec<String>,
    pub severity: i32,
    pub created_at: i64,
    pub hit_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_entries: i64,
    pub cache_hits: i64,
    pub cache_misses: i64,
    pub hit_rate: f64,
}

pub struct NeutralizationCache {
    conn: Arc<Mutex<Connection>>,
    hits: Arc<Mutex<i64>>,
    misses: Arc<Mutex<i64>>,
}

impl NeutralizationCache {
    pub fn new(db_path: Option<PathBuf>) -> Result<Self, String> {
        let path = db_path.unwrap_or_else(|| {
            directories::ProjectDirs::from("com", "feelingwise", "FeelingWise")
                .map(|dirs| dirs.data_dir().join("cache.db"))
                .unwrap_or_else(|| PathBuf::from("cache.db"))
        });

        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create cache directory: {}", e))?;
        }

        let conn = Connection::open(&path)
            .map_err(|e| format!("Failed to open cache database: {}", e))?;

        // Initialize schema
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS neutralization_cache (
                content_hash TEXT PRIMARY KEY,
                original TEXT NOT NULL,
                neutralized TEXT NOT NULL,
                techniques TEXT NOT NULL,
                severity INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                hit_count INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_created_at ON neutralization_cache(created_at);
            CREATE INDEX IF NOT EXISTS idx_hit_count ON neutralization_cache(hit_count);

            CREATE TABLE IF NOT EXISTS cache_stats (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                total_hits INTEGER DEFAULT 0,
                total_misses INTEGER DEFAULT 0
            );

            INSERT OR IGNORE INTO cache_stats (id, total_hits, total_misses) VALUES (1, 0, 0);
            "#
        ).map_err(|e| format!("Failed to initialize cache schema: {}", e))?;

        // Load stats
        let (hits, misses): (i64, i64) = conn.query_row(
            "SELECT total_hits, total_misses FROM cache_stats WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?))
        ).unwrap_or((0, 0));

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            hits: Arc::new(Mutex::new(hits)),
            misses: Arc::new(Mutex::new(misses)),
        })
    }

    /// Generate a hash for content
    pub fn hash_content(content: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        hex::encode(hasher.finalize())
    }

    /// Look up a cached neutralization
    pub fn get(&self, original: &str) -> Option<CachedNeutralization> {
        let content_hash = Self::hash_content(original);
        let conn = self.conn.lock().ok()?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .ok()?
            .as_secs() as i64;

        let cutoff = now - (CACHE_TTL_HOURS * 3600);

        match conn.query_row(
            r#"
            SELECT content_hash, original, neutralized, techniques, severity, created_at, hit_count
            FROM neutralization_cache
            WHERE content_hash = ?1 AND created_at > ?2
            "#,
            params![content_hash, cutoff],
            |row| {
                let techniques_json: String = row.get(3)?;
                let techniques: Vec<String> = serde_json::from_str(&techniques_json).unwrap_or_default();

                Ok(CachedNeutralization {
                    content_hash: row.get(0)?,
                    original: row.get(1)?,
                    neutralized: row.get(2)?,
                    techniques,
                    severity: row.get(4)?,
                    created_at: row.get(5)?,
                    hit_count: row.get(6)?,
                })
            }
        ) {
            Ok(cached) => {
                // Update hit count
                let _ = conn.execute(
                    "UPDATE neutralization_cache SET hit_count = hit_count + 1 WHERE content_hash = ?1",
                    params![content_hash]
                );

                // Record hit
                *self.hits.lock().unwrap() += 1;
                let _ = conn.execute(
                    "UPDATE cache_stats SET total_hits = total_hits + 1 WHERE id = 1",
                    []
                );

                Some(cached)
            }
            Err(_) => {
                // Record miss
                *self.misses.lock().unwrap() += 1;
                let _ = conn.execute(
                    "UPDATE cache_stats SET total_misses = total_misses + 1 WHERE id = 1",
                    []
                );

                None
            }
        }
    }

    /// Store a neutralization result
    pub fn set(
        &self,
        original: &str,
        neutralized: &str,
        techniques: &[String],
        severity: i32,
    ) -> Result<(), String> {
        let content_hash = Self::hash_content(original);
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("Time error: {}", e))?
            .as_secs() as i64;

        let techniques_json = serde_json::to_string(techniques)
            .map_err(|e| format!("Failed to serialize techniques: {}", e))?;

        conn.execute(
            r#"
            INSERT OR REPLACE INTO neutralization_cache
            (content_hash, original, neutralized, techniques, severity, created_at, hit_count)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)
            "#,
            params![content_hash, original, neutralized, techniques_json, severity, now]
        ).map_err(|e| format!("Failed to cache result: {}", e))?;

        // Prune old entries if needed
        self.prune_if_needed(&conn);

        Ok(())
    }

    /// Get cache statistics
    pub fn get_stats(&self) -> CacheStats {
        let hits = self.hits.lock().map(|g| *g).unwrap_or(0);
        let misses = self.misses.lock().map(|g| *g).unwrap_or(0);
        let total = hits + misses;

        let total_entries = self.conn.lock()
            .map(|conn| {
                conn.query_row(
                    "SELECT COUNT(*) FROM neutralization_cache",
                    [],
                    |row| row.get(0)
                ).unwrap_or(0)
            })
            .unwrap_or(0);

        CacheStats {
            total_entries,
            cache_hits: hits,
            cache_misses: misses,
            hit_rate: if total > 0 { hits as f64 / total as f64 } else { 0.0 },
        }
    }

    /// Clear all cached entries
    pub fn clear(&self) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;

        conn.execute("DELETE FROM neutralization_cache", [])
            .map_err(|e| format!("Failed to clear cache: {}", e))?;

        Ok(())
    }

    /// Remove expired and excess entries
    fn prune_if_needed(&self, conn: &Connection) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        let cutoff = now - (CACHE_TTL_HOURS * 3600);

        // Remove expired entries
        let _ = conn.execute(
            "DELETE FROM neutralization_cache WHERE created_at < ?1",
            params![cutoff]
        );

        // Remove excess entries (keep most recently used)
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM neutralization_cache",
            [],
            |row| row.get(0)
        ).unwrap_or(0);

        if count > MAX_CACHE_ENTRIES {
            let to_remove = count - MAX_CACHE_ENTRIES;
            let _ = conn.execute(
                r#"
                DELETE FROM neutralization_cache WHERE content_hash IN (
                    SELECT content_hash FROM neutralization_cache
                    ORDER BY hit_count ASC, created_at ASC
                    LIMIT ?1
                )
                "#,
                params![to_remove]
            );
        }
    }
}

// In-memory LRU cache for hot entries
use std::collections::HashMap;

pub struct LruCache {
    map: HashMap<String, (CachedNeutralization, u64)>,
    max_size: usize,
    access_counter: u64,
}

impl LruCache {
    pub fn new(max_size: usize) -> Self {
        Self {
            map: HashMap::new(),
            max_size,
            access_counter: 0,
        }
    }

    pub fn get(&mut self, key: &str) -> Option<&CachedNeutralization> {
        if let Some((entry, access)) = self.map.get_mut(key) {
            self.access_counter += 1;
            *access = self.access_counter;
            Some(entry)
        } else {
            None
        }
    }

    pub fn insert(&mut self, key: String, value: CachedNeutralization) {
        self.access_counter += 1;

        // Evict least recently used if at capacity
        if self.map.len() >= self.max_size && !self.map.contains_key(&key) {
            if let Some(lru_key) = self.map.iter()
                .min_by_key(|(_, (_, access))| access)
                .map(|(k, _)| k.clone())
            {
                self.map.remove(&lru_key);
            }
        }

        self.map.insert(key, (value, self.access_counter));
    }

    pub fn contains(&self, key: &str) -> bool {
        self.map.contains_key(key)
    }

    pub fn len(&self) -> usize {
        self.map.len()
    }

    pub fn is_empty(&self) -> bool {
        self.map.is_empty()
    }
}
