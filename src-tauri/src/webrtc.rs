use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// WEBRTC ENGINE - Co-streaming and Real-time Communication
// ============================================================================

/// WebRTC connection state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WebRTCConnectionState {
    New,
    Connecting,
    Connected,
    Disconnected,
    Failed,
    Closed,
}

/// WebRTC peer type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WebRTCPeerType {
    Host,
    Guest,
}

/// WebRTC peer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCPeer {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub peer_type: WebRTCPeerType,
    pub connection_state: WebRTCConnectionState,
    pub audio_enabled: bool,
    pub video_enabled: bool,
    pub screen_share_enabled: bool,
    pub volume: f32,
    pub is_muted: bool,
    pub is_deafened: bool,
}

/// WebRTC configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCConfig {
    pub stun_servers: Vec<String>,
    pub turn_servers: Vec<TurnServer>,
    pub enable_audio: bool,
    pub enable_video: bool,
    pub enable_screen_share: bool,
    pub max_peers: u32,
    pub bitrate: u32,
    pub codec: String,
}

impl Default for WebRTCConfig {
    fn default() -> Self {
        Self {
            stun_servers: vec![
                "stun:stun.l.google.com:19302".to_string(),
                "stun:stun1.l.google.com:19302".to_string(),
            ],
            turn_servers: Vec::new(),
            enable_audio: true,
            enable_video: true,
            enable_screen_share: true,
            max_peers: 10,
            bitrate: 3000,
            codec: "VP8".to_string(),
        }
    }
}

/// TURN server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TurnServer {
    pub url: String,
    pub username: String,
    pub password: String,
}

/// WebRTC statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCStats {
    pub connected_peers: u32,
    pub total_bytes_sent: u64,
    pub total_bytes_received: u64,
    pub audio_bitrate: f32,
    pub video_bitrate: f32,
    pub packet_loss: f32,
    pub rtt: f32,
    pub jitter: f32,
}

/// WebRTC layout
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCLayout {
    pub layout_type: WebRTCLayoutType,
    pub grid_size: (u32, u32),
    pub host_position: (u32, u32),
    pub guest_positions: HashMap<String, (u32, u32)>,
}

/// WebRTC layout types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WebRTCLayoutType {
    Grid,
    Sidebar,
    PictureInPicture,
    Custom,
}

/// WebRTC engine state
pub struct WebRTCEngine {
    pub config: WebRTCConfig,
    pub peers: HashMap<String, WebRTCPeer>,
    pub local_peer_id: String,
    pub local_username: String,
    pub is_host: bool,
    pub stats: WebRTCStats,
    pub layout: WebRTCLayout,
    pub room_id: Option<String>,
}

impl WebRTCEngine {
    pub fn new() -> Self {
        Self {
            config: WebRTCConfig::default(),
            peers: HashMap::new(),
            local_peer_id: uuid::Uuid::new_v4().to_string(),
            local_username: "Host".to_string(),
            is_host: true,
            stats: WebRTCStats {
                connected_peers: 0,
                total_bytes_sent: 0,
                total_bytes_received: 0,
                audio_bitrate: 0.0,
                video_bitrate: 0.0,
                packet_loss: 0.0,
                rtt: 0.0,
                jitter: 0.0,
            },
            layout: WebRTCLayout {
                layout_type: WebRTCLayoutType::Grid,
                grid_size: (2, 2),
                host_position: (0, 0),
                guest_positions: HashMap::new(),
            },
            room_id: None,
        }
    }

    /// Create room
    pub fn create_room(&mut self, room_id: String) -> Result<(), String> {
        if self.room_id.is_some() {
            return Err("Already in a room".to_string());
        }

        self.room_id = Some(room_id);
        self.is_host = true;
        Ok(())
    }

    /// Join room
    pub fn join_room(&mut self, room_id: String) -> Result<(), String> {
        if self.room_id.is_some() {
            return Err("Already in a room".to_string());
        }

        self.room_id = Some(room_id);
        self.is_host = false;
        Ok(())
    }

    /// Leave room
    pub fn leave_room(&mut self) -> Result<(), String> {
        if self.room_id.is_none() {
            return Err("Not in a room".to_string());
        }

        self.room_id = None;
        self.peers.clear();
        self.is_host = true;
        Ok(())
    }

    /// Add peer
    pub fn add_peer(&mut self, peer: WebRTCPeer) -> Result<(), String> {
        if self.peers.len() >= self.config.max_peers as usize {
            return Err("Maximum peers reached".to_string());
        }

        self.peers.insert(peer.id.clone(), peer);
        self.stats.connected_peers = self.peers.len() as u32;
        Ok(())
    }

    /// Remove peer
    pub fn remove_peer(&mut self, peer_id: String) -> Result<(), String> {
        if !self.peers.contains_key(&peer_id) {
            return Err("Peer not found".to_string());
        }

        self.peers.remove(&peer_id);
        self.stats.connected_peers = self.peers.len() as u32;
        Ok(())
    }

    /// Update peer
    pub fn update_peer(&mut self, peer_id: String, updates: WebRTCPeerUpdate) -> Result<(), String> {
        if let Some(peer) = self.peers.get_mut(&peer_id) {
            if let Some(audio_enabled) = updates.audio_enabled {
                peer.audio_enabled = audio_enabled;
            }
            if let Some(video_enabled) = updates.video_enabled {
                peer.video_enabled = video_enabled;
            }
            if let Some(screen_share_enabled) = updates.screen_share_enabled {
                peer.screen_share_enabled = screen_share_enabled;
            }
            if let Some(volume) = updates.volume {
                peer.volume = volume;
            }
            if let Some(is_muted) = updates.is_muted {
                peer.is_muted = is_muted;
            }
            if let Some(is_deafened) = updates.is_deafened {
                peer.is_deafened = is_deafened;
            }
            Ok(())
        } else {
            Err("Peer not found".to_string())
        }
    }

    /// Mute peer
    pub fn mute_peer(&mut self, peer_id: String) -> Result<(), String> {
        if let Some(peer) = self.peers.get_mut(&peer_id) {
            peer.is_muted = true;
            Ok(())
        } else {
            Err("Peer not found".to_string())
        }
    }

    /// Unmute peer
    pub fn unmute_peer(&mut self, peer_id: String) -> Result<(), String> {
        if let Some(peer) = self.peers.get_mut(&peer_id) {
            peer.is_muted = false;
            Ok(())
        } else {
            Err("Peer not found".to_string())
        }
    }

    /// Set peer volume
    pub fn set_peer_volume(&mut self, peer_id: String, volume: f32) -> Result<(), String> {
        if let Some(peer) = self.peers.get_mut(&peer_id) {
            peer.volume = volume.clamp(0.0, 1.0);
            Ok(())
        } else {
            Err("Peer not found".to_string())
        }
    }

    /// Update configuration
    pub fn update_config(&mut self, config: WebRTCConfig) {
        self.config = config;
    }

    /// Update layout
    pub fn update_layout(&mut self, layout: WebRTCLayout) {
        self.layout = layout;
    }

    /// Update statistics
    pub fn update_stats(&mut self, stats: WebRTCStats) {
        self.stats = stats;
    }

    /// Get peer
    pub fn get_peer(&self, peer_id: String) -> Option<WebRTCPeer> {
        self.peers.get(&peer_id).cloned()
    }

    /// Get all peers
    pub fn get_peers(&self) -> Vec<WebRTCPeer> {
        self.peers.values().cloned().collect()
    }

    /// Is in room
    pub fn is_in_room(&self) -> bool {
        self.room_id.is_some()
    }
}

/// WebRTC peer update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCPeerUpdate {
    pub audio_enabled: Option<bool>,
    pub video_enabled: Option<bool>,
    pub screen_share_enabled: Option<bool>,
    pub volume: Option<f32>,
    pub is_muted: Option<bool>,
    pub is_deafened: Option<bool>,
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Create WebRTC room
#[tauri::command]
pub fn create_webrtc_room(
    room_id: String,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.create_room(room_id)
}

/// Join WebRTC room
#[tauri::command]
pub fn join_webrtc_room(
    room_id: String,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.join_room(room_id)
}

/// Leave WebRTC room
#[tauri::command]
pub fn leave_webrtc_room(state: State<Arc<Mutex<WebRTCEngine>>>) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.leave_room()
}

/// Get room ID
#[tauri::command]
pub fn get_webrtc_room_id(state: State<Arc<Mutex<WebRTCEngine>>>) -> Option<String> {
    let engine = state.lock().unwrap();
    engine.room_id.clone()
}

/// Is in room
#[tauri::command]
pub fn is_in_webrtc_room(state: State<Arc<Mutex<WebRTCEngine>>>) -> bool {
    let engine = state.lock().unwrap();
    engine.is_in_room()
}

/// Add WebRTC peer
#[tauri::command]
pub fn add_webrtc_peer(
    peer: WebRTCPeer,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.add_peer(peer)
}

/// Remove WebRTC peer
#[tauri::command]
pub fn remove_webrtc_peer(
    peer_id: String,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.remove_peer(peer_id)
}

/// Get WebRTC peers
#[tauri::command]
pub fn get_webrtc_peers(state: State<Arc<Mutex<WebRTCEngine>>>) -> Vec<WebRTCPeer> {
    let engine = state.lock().unwrap();
    engine.get_peers()
}

/// Update WebRTC peer
#[tauri::command]
pub fn update_webrtc_peer(
    peer_id: String,
    updates: WebRTCPeerUpdate,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.update_peer(peer_id, updates)
}

/// Mute WebRTC peer
#[tauri::command]
pub fn mute_webrtc_peer(
    peer_id: String,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.mute_peer(peer_id)
}

/// Unmute WebRTC peer
#[tauri::command]
pub fn unmute_webrtc_peer(
    peer_id: String,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.unmute_peer(peer_id)
}

/// Set WebRTC peer volume
#[tauri::command]
pub fn set_webrtc_peer_volume(
    peer_id: String,
    volume: f32,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.set_peer_volume(peer_id, volume)
}

/// Get WebRTC configuration
#[tauri::command]
pub fn get_webrtc_config(state: State<Arc<Mutex<WebRTCEngine>>>) -> WebRTCConfig {
    let engine = state.lock().unwrap();
    engine.config.clone()
}

/// Update WebRTC configuration
#[tauri::command]
pub fn update_webrtc_config(
    config: WebRTCConfig,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) {
    let mut engine = state.lock().unwrap();
    engine.update_config(config);
}

/// Get WebRTC statistics
#[tauri::command]
pub fn get_webrtc_stats(state: State<Arc<Mutex<WebRTCEngine>>>) -> WebRTCStats {
    let engine = state.lock().unwrap();
    engine.stats.clone()
}

/// Get WebRTC layout
#[tauri::command]
pub fn get_webrtc_layout(state: State<Arc<Mutex<WebRTCEngine>>>) -> WebRTCLayout {
    let engine = state.lock().unwrap();
    engine.layout.clone()
}

/// Update WebRTC layout
#[tauri::command]
pub fn update_webrtc_layout(
    layout: WebRTCLayout,
    state: State<Arc<Mutex<WebRTCEngine>>>,
) {
    let mut engine = state.lock().unwrap();
    engine.update_layout(layout);
}

/// Get WebRTC layout types
#[tauri::command]
pub fn get_webrtc_layout_types() -> Vec<String> {
    vec![
        "Grid".to_string(),
        "Sidebar".to_string(),
        "PictureInPicture".to_string(),
        "Custom".to_string(),
    ]
}

/// Get WebRTC codecs
#[tauri::command]
pub fn get_webrtc_codecs() -> Vec<String> {
    vec![
        "VP8".to_string(),
        "VP9".to_string(),
        "H264".to_string(),
        "AV1".to_string(),
    ]
}

/// Generate room ID
#[tauri::command]
pub fn generate_webrtc_room_id() -> String {
    uuid::Uuid::new_v4().to_string()[..8].to_string()
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_webrtc_peer_creation() {
        let peer = WebRTCPeer {
            id: "peer1".to_string(),
            username: "guest123".to_string(),
            display_name: "Guest123".to_string(),
            peer_type: WebRTCPeerType::Guest,
            connection_state: WebRTCConnectionState::Connected,
            audio_enabled: true,
            video_enabled: true,
            screen_share_enabled: false,
            volume: 1.0,
            is_muted: false,
            is_deafened: false,
        };

        assert_eq!(peer.id, "peer1");
        assert_eq!(peer.peer_type, WebRTCPeerType::Guest);
        assert_eq!(peer.connection_state, WebRTCConnectionState::Connected);
        assert!(peer.audio_enabled);
    }

    #[test]
    fn test_webrtc_config_default() {
        let config = WebRTCConfig::default();
        
        assert_eq!(config.stun_servers.len(), 2);
        assert_eq!(config.enable_audio, true);
        assert_eq!(config.enable_video, true);
        assert_eq!(config.max_peers, 10);
        assert_eq!(config.bitrate, 3000);
        assert_eq!(config.codec, "VP8");
    }

    #[test]
    fn test_turn_server_creation() {
        let turn = TurnServer {
            url: "turn:turn.example.com:3478".to_string(),
            username: "user123".to_string(),
            password: "pass123".to_string(),
        };

        assert_eq!(turn.url, "turn:turn.example.com:3478");
        assert_eq!(turn.username, "user123");
    }

    #[test]
    fn test_webrtc_stats_creation() {
        let stats = WebRTCStats {
            connected_peers: 3,
            total_bytes_sent: 1000000,
            total_bytes_received: 500000,
            audio_bitrate: 128.0,
            video_bitrate: 3000.0,
            packet_loss: 0.5,
            rtt: 25.0,
            jitter: 10.0,
        };

        assert_eq!(stats.connected_peers, 3);
        assert_eq!(stats.total_bytes_sent, 1000000);
        assert_eq!(stats.video_bitrate, 3000.0);
    }

    #[test]
    fn test_webrtc_connection_state_variants() {
        let states = vec![
            WebRTCConnectionState::New,
            WebRTCConnectionState::Connecting,
            WebRTCConnectionState::Connected,
            WebRTCConnectionState::Disconnected,
            WebRTCConnectionState::Failed,
            WebRTCConnectionState::Closed,
        ];

        assert_eq!(states.len(), 6);
        assert_eq!(states[0], WebRTCConnectionState::New);
    }

    #[test]
    fn test_webrtc_peer_type_variants() {
        let types = vec![
            WebRTCPeerType::Host,
            WebRTCPeerType::Guest,
        ];

        assert_eq!(types.len(), 2);
        assert_eq!(types[0], WebRTCPeerType::Host);
    }

    #[test]
    fn test_webrtc_config_creation() {
        let config = WebRTCConfig {
            stun_servers: vec!["stun:stun.example.com:3478".to_string()],
            turn_servers: vec![],
            enable_audio: true,
            enable_video: true,
            enable_screen_share: false,
            max_peers: 5,
            bitrate: 5000,
            codec: "H264".to_string(),
        };

        assert_eq!(config.stun_servers.len(), 1);
        assert_eq!(config.max_peers, 5);
        assert_eq!(config.codec, "H264");
    }
}
