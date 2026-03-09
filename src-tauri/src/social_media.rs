use serde::{Deserialize, Serialize};
use crate::AppState;

// ============================================================================
// SOCIAL MEDIA MANAGER - Auto-post to social platforms
// ============================================================================

/// Social media platform
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SocialPlatform {
    Twitter,
    Instagram,
    TikTok,
    YouTube,
    Facebook,
    Discord,
    LinkedIn,
}

/// Post status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PostStatus {
    Draft,
    Scheduled,
    Posted,
    Failed,
}

/// Social media post
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialPost {
    pub id: String,
    pub platform: SocialPlatform,
    pub content: String,
    pub media_urls: Vec<String>,
    pub status: PostStatus,
    pub scheduled_time: Option<u64>,
    pub posted_time: Option<u64>,
    pub likes: u32,
    pub comments: u32,
    pub shares: u32,
    pub created_at: u64,
}

/// Social media config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialMediaConfig {
    pub platforms: Vec<SocialPlatform>,
    pub auto_post: bool,
    pub post_on_stream_start: bool,
    pub post_on_stream_end: bool,
    pub post_on_highlight: bool,
    pub default_hashtags: Vec<String>,
    pub mention_accounts: Vec<String>,
}

impl Default for SocialMediaConfig {
    fn default() -> Self {
        Self {
            platforms: vec![
                SocialPlatform::Twitter,
                SocialPlatform::Instagram,
                SocialPlatform::TikTok,
            ],
            auto_post: false,
            post_on_stream_start: false,
            post_on_stream_end: false,
            post_on_highlight: false,
            default_hashtags: vec![
                "#streaming".to_string(),
                "#gaming".to_string(),
                "#live".to_string(),
            ],
            mention_accounts: Vec::new(),
        }
    }
}

/// Social media statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialMediaStats {
    pub total_posts: u64,
    pub scheduled_posts: u64,
    pub posted_posts: u64,
    pub failed_posts: u64,
    pub total_likes: u64,
    pub total_comments: u64,
    pub total_shares: u64,
}

/// Social media engine state
pub struct SocialMediaEngine {
    pub config: SocialMediaConfig,
    pub posts: Vec<SocialPost>,
    pub stats: SocialMediaStats,
}

impl SocialMediaEngine {
    pub fn new() -> Self {
        Self {
            config: SocialMediaConfig::default(),
            posts: Vec::new(),
            stats: SocialMediaStats {
                total_posts: 0,
                scheduled_posts: 0,
                posted_posts: 0,
                failed_posts: 0,
                total_likes: 0,
                total_comments: 0,
                total_shares: 0,
            },
        }
    }

    /// Create post
    pub fn create_post(&mut self, platform: SocialPlatform, content: String, media_urls: Vec<String>) -> Result<SocialPost, String> {
        let post = SocialPost {
            id: uuid::Uuid::new_v4().to_string(),
            platform,
            content,
            media_urls,
            status: PostStatus::Draft,
            scheduled_time: None,
            posted_time: None,
            likes: 0,
            comments: 0,
            shares: 0,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        
        self.posts.push(post.clone());
        self.stats.total_posts += 1;
        
        Ok(post)
    }

    /// Schedule post
    pub fn schedule_post(&mut self, post_id: String, scheduled_time: u64) -> Result<(), String> {
        if let Some(post) = self.posts.iter_mut().find(|p| p.id == post_id) {
            post.status = PostStatus::Scheduled;
            post.scheduled_time = Some(scheduled_time);
            self.stats.scheduled_posts += 1;
            Ok(())
        } else {
            Err("Post not found".to_string())
        }
    }

    /// Post now
    pub fn post_now(&mut self, post_id: String) -> Result<(), String> {
        if let Some(post) = self.posts.iter_mut().find(|p| p.id == post_id) {
            post.status = PostStatus::Posted;
            post.posted_time = Some(std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs());
            self.stats.posted_posts += 1;
            Ok(())
        } else {
            Err("Post not found".to_string())
        }
    }

    /// Get all posts
    pub fn get_posts(&self) -> Vec<SocialPost> {
        self.posts.clone()
    }

    /// Get post by ID
    pub fn get_post(&self, post_id: String) -> Option<SocialPost> {
        self.posts.iter().find(|p| p.id == post_id).cloned()
    }

    /// Delete post
    pub fn delete_post(&mut self, post_id: String) -> Result<(), String> {
        if let Some(pos) = self.posts.iter().position(|p| p.id == post_id) {
            self.posts.remove(pos);
            Ok(())
        } else {
            Err("Post not found".to_string())
        }
    }

    /// Update config
    pub fn update_config(&mut self, config: SocialMediaConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> SocialMediaConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> SocialMediaStats {
        self.stats.clone()
    }

    /// Auto-post on stream start
    pub fn auto_post_stream_start(&mut self, stream_title: String) -> Result<(), String> {
        if !self.config.auto_post || !self.config.post_on_stream_start {
            return Ok(());
        }
        
        let content = format!(
            "🔴 LIVE NOW: {}\n\n{}",
            stream_title,
            self.config.default_hashtags.join(" ")
        );
        
        let platforms: Vec<_> = self.config.platforms.clone();
        for platform in platforms {
            let _ = self.create_post(platform, content.clone(), Vec::new());
            // In real implementation, would post immediately
        }
        
        Ok(())
    }

    /// Auto-post on stream end
    pub fn auto_post_stream_end(&mut self, stream_duration: u64) -> Result<(), String> {
        if !self.config.auto_post || !self.config.post_on_stream_end {
            return Ok(());
        }
        
        let hours = stream_duration / 3600;
        let minutes = (stream_duration % 3600) / 60;
        
        let content = format!(
            "✅ Stream ended! Thanks for watching!\n\nDuration: {}h {}m\n\n{}",
            hours,
            minutes,
            self.config.default_hashtags.join(" ")
        );
        
        let platforms: Vec<_> = self.config.platforms.clone();
        for platform in platforms {
            let _ = self.create_post(platform, content.clone(), Vec::new());
            // In real implementation, would post immediately
        }
        
        Ok(())
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_social_media_config(state: tauri::State<AppState>) -> SocialMediaConfig {
    state.social_media_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_social_media_config(
    config: SocialMediaConfig,
    state: tauri::State<AppState>,
) {
    state.social_media_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn create_social_post(
    platform: String,
    content: String,
    media_urls: Vec<String>,
    state: tauri::State<AppState>,
) -> Result<SocialPost, String> {
    let platform = match platform.as_str() {
        "twitter" => SocialPlatform::Twitter,
        "instagram" => SocialPlatform::Instagram,
        "tiktok" => SocialPlatform::TikTok,
        "youtube" => SocialPlatform::YouTube,
        "facebook" => SocialPlatform::Facebook,
        "discord" => SocialPlatform::Discord,
        "linkedin" => SocialPlatform::LinkedIn,
        _ => return Err("Invalid platform".to_string()),
    };
    
    state.social_media_engine.lock().unwrap().create_post(platform, content, media_urls)
}

#[tauri::command]
fn schedule_social_post(
    post_id: String,
    scheduled_time: u64,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.social_media_engine.lock().unwrap().schedule_post(post_id, scheduled_time)
}

#[tauri::command]
fn post_social_now(
    post_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.social_media_engine.lock().unwrap().post_now(post_id)
}

#[tauri::command]
fn get_social_posts(state: tauri::State<AppState>) -> Vec<SocialPost> {
    state.social_media_engine.lock().unwrap().get_posts()
}

#[tauri::command]
fn get_social_post(
    post_id: String,
    state: tauri::State<AppState>,
) -> Option<SocialPost> {
    state.social_media_engine.lock().unwrap().get_post(post_id)
}

#[tauri::command]
fn delete_social_post(
    post_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.social_media_engine.lock().unwrap().delete_post(post_id)
}

#[tauri::command]
fn get_social_media_stats(state: tauri::State<AppState>) -> SocialMediaStats {
    state.social_media_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_social_platforms() -> Vec<String> {
    vec![
        "twitter".to_string(),
        "instagram".to_string(),
        "tiktok".to_string(),
        "youtube".to_string(),
        "facebook".to_string(),
        "discord".to_string(),
        "linkedin".to_string(),
    ]
}

#[tauri::command]
fn auto_post_stream_start(
    stream_title: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.social_media_engine.lock().unwrap().auto_post_stream_start(stream_title)
}

#[tauri::command]
fn auto_post_stream_end(
    stream_duration: u64,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.social_media_engine.lock().unwrap().auto_post_stream_end(stream_duration)
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_social_media_engine_creation() {
        let config = SocialMediaConfig::default();
        let engine = SocialMediaEngine {
            config: config.clone(),
            posts: Vec::new(),
            stats: SocialMediaStats {
                total_posts: 0,
                scheduled_posts: 0,
                posted_posts: 0,
                failed_posts: 0,
                total_likes: 0,
                total_comments: 0,
                total_shares: 0,
            },
        };

        assert_eq!(engine.config.platforms.len(), 3);
        assert_eq!(engine.config.auto_post, false);
        assert!(engine.posts.is_empty());
    }

    #[test]
    fn test_social_post_creation() {
        let post = SocialPost {
            id: "post123".to_string(),
            platform: SocialPlatform::Twitter,
            content: "Test post".to_string(),
            media_urls: vec!["https://example.com/image.jpg".to_string()],
            status: PostStatus::Draft,
            scheduled_time: Some(1234567890),
            posted_time: None,
            likes: 0,
            comments: 0,
            shares: 0,
            created_at: 1234567890,
        };

        assert_eq!(post.id, "post123");
        assert_eq!(post.platform, SocialPlatform::Twitter);
        assert_eq!(post.status, PostStatus::Draft);
        assert_eq!(post.media_urls.len(), 1);
    }

    #[test]
    fn test_social_media_config_default() {
        let config = SocialMediaConfig::default();
        
        assert_eq!(config.platforms.len(), 3);
        assert_eq!(config.auto_post, false);
        assert_eq!(config.post_on_stream_start, false);
        assert_eq!(config.default_hashtags.len(), 3);
        assert!(config.mention_accounts.is_empty());
    }

    #[test]
    fn test_social_media_stats() {
        let stats = SocialMediaStats {
            total_posts: 100,
            scheduled_posts: 20,
            posted_posts: 75,
            failed_posts: 5,
            total_likes: 5000,
            total_comments: 1000,
            total_shares: 500,
        };

        assert_eq!(stats.total_posts, 100);
        assert_eq!(stats.posted_posts, 75);
        assert_eq!(stats.total_likes, 5000);
    }

    #[test]
    fn test_social_platform_variants() {
        let platforms = vec![
            SocialPlatform::Twitter,
            SocialPlatform::Instagram,
            SocialPlatform::TikTok,
            SocialPlatform::YouTube,
            SocialPlatform::Facebook,
            SocialPlatform::Discord,
            SocialPlatform::LinkedIn,
        ];

        assert_eq!(platforms.len(), 7);
        assert_eq!(platforms[0], SocialPlatform::Twitter);
        assert_eq!(platforms[6], SocialPlatform::LinkedIn);
    }

    #[test]
    fn test_post_status_variants() {
        let statuses = vec![
            PostStatus::Draft,
            PostStatus::Scheduled,
            PostStatus::Posted,
            PostStatus::Failed,
        ];

        assert_eq!(statuses.len(), 4);
        assert_eq!(statuses[0], PostStatus::Draft);
        assert_eq!(statuses[2], PostStatus::Posted);
    }
}
