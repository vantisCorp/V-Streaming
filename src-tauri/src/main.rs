// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use v_streaming::*;
use v_streaming::{capture, composition, audio, encoding, streaming, plugin, gpu, vtuber, ui, onboarding, cloud, multichat, webrtc, interaction, ai_highlight, social_media, game_state, live_captions, translation, ai_coach, tip_ecosystem, sponsor_marketplace, smart_home, telemetry, performance, business, analytics};

use std::collections::HashMap;
use std::sync::Mutex;

// Tauri commands

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to V-Streaming!", name)
}

// ============================================================================
// CAPTURE COMMANDS
// ============================================================================

#[tauri::command]
fn enumerate_capture_sources(state: tauri::State<AppState>) -> Result<Vec<capture::CaptureSourceInfo>, String> {
    state.capture_engine.lock().unwrap().enumerate_sources().map_err(|e| e.to_string())
}

#[tauri::command]
fn start_capture(state: tauri::State<AppState>, source: capture::CaptureSource) -> Result<(), String> {
    state.capture_engine.lock().unwrap().start_capture(source).map_err(|e| e.to_string())
}

#[tauri::command]
fn stop_capture_source(state: tauri::State<AppState>, source_id: String) -> Result<(), String> {
    state.capture_engine.lock().unwrap().stop_capture_source(source_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn stop_capture(state: tauri::State<AppState>) -> Result<(), String> {
    state.capture_engine.lock().unwrap().stop_capture().map_err(|e| e.to_string())
}

#[tauri::command]
fn is_capturing(state: tauri::State<AppState>) -> bool {
    state.capture_engine.lock().unwrap().is_capturing()
}

#[tauri::command]
fn get_active_sources(state: tauri::State<AppState>) -> Vec<capture::CaptureSource> {
    state.capture_engine.lock().unwrap().get_active_sources()
}

#[tauri::command]
fn get_capture_performance_stats(state: tauri::State<AppState>) -> capture::CapturePerformanceStats {
    state.capture_engine.lock().unwrap().get_performance_stats()
}

#[tauri::command]
fn get_capture_presets() -> Vec<capture::CapturePreset> {
    capture::get_default_presets()
}

// ============================================================================
// AUDIO COMMANDS
// ============================================================================

#[tauri::command]
fn enumerate_audio_devices(state: tauri::State<AppState>) -> Result<Vec<audio::AudioDeviceInfo>, String> {
    state.audio_engine.lock().unwrap().enumerate_devices().map_err(|e| e.to_string())
}

#[tauri::command]
fn start_audio_processing(state: tauri::State<AppState>) -> Result<(), String> {
    state.audio_engine.lock().unwrap().start_processing().map_err(|e| e.to_string())
}

#[tauri::command]
fn stop_audio_processing(state: tauri::State<AppState>) -> Result<(), String> {
    state.audio_engine.lock().unwrap().stop_processing().map_err(|e| e.to_string())
}

#[tauri::command]
fn is_audio_processing(state: tauri::State<AppState>) -> bool {
    state.audio_engine.lock().unwrap().is_processing()
}

#[tauri::command]
fn create_audio_track(state: tauri::State<AppState>, name: String, device_id: String) -> Result<audio::AudioTrack, String> {
    state.audio_engine.lock().unwrap().create_track(name, device_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_audio_track(state: tauri::State<AppState>, track_id: usize) -> Result<(), String> {
    state.audio_engine.lock().unwrap().remove_track(track_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_audio_tracks(state: tauri::State<AppState>) -> Vec<audio::AudioTrack> {
    state.audio_engine.lock().unwrap().get_tracks()
}

#[tauri::command]
fn update_audio_track(state: tauri::State<AppState>, track_id: usize, updates: audio::TrackUpdate) -> Result<(), String> {
    state.audio_engine.lock().unwrap().update_track(track_id, updates).map_err(|e| e.to_string())
}

#[tauri::command]
fn apply_audio_effect(state: tauri::State<AppState>, track_id: usize, effect: audio::AudioEffect) -> Result<(), String> {
    state.audio_engine.lock().unwrap().apply_effect(track_id, effect).map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_audio_effect(state: tauri::State<AppState>, track_id: usize, effect_index: usize) -> Result<(), String> {
    state.audio_engine.lock().unwrap().remove_effect(track_id, effect_index).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_master_volume(state: tauri::State<AppState>, volume: f32) -> Result<(), String> {
    state.audio_engine.lock().unwrap().set_master_volume(volume).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_master_volume(state: tauri::State<AppState>) -> f32 {
    state.audio_engine.lock().unwrap().get_master_volume()
}

#[tauri::command]
fn sync_audio_with_video(state: tauri::State<AppState>, video_timestamp: u64) -> Result<i32, String> {
    state.audio_engine.lock().unwrap().sync_with_video(video_timestamp).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_audio_performance_stats(state: tauri::State<AppState>) -> audio::AudioPerformanceStats {
    state.audio_engine.lock().unwrap().get_performance_stats()
}

// ============================================================================
// GPU COMMANDS
// ============================================================================

#[tauri::command]
fn initialize_gpu(state: tauri::State<AppState>) -> Result<(), String> {
    state.gpu_context.lock().unwrap().initialize().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_gpu_info(state: tauri::State<AppState>) -> gpu::GpuInfo {
    state.gpu_context.lock().unwrap().get_gpu_info()
}

#[tauri::command]
fn create_texture(state: tauri::State<AppState>, width: u32, height: u32, format: gpu::TextureFormat) -> Result<gpu::Texture, String> {
    state.gpu_context.lock().unwrap().create_texture(width, height, format).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_texture(state: tauri::State<AppState>, texture_id: u32) -> Result<gpu::Texture, String> {
    state.gpu_context.lock().unwrap().get_texture(texture_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_texture(state: tauri::State<AppState>, texture_id: u32) -> Result<(), String> {
    state.gpu_context.lock().unwrap().delete_texture(texture_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn hdr_to_sdr(state: tauri::State<AppState>, texture_id: u32, method: gpu::TonemapMethod) -> Result<(), String> {
    state.gpu_context.lock().unwrap().hdr_to_sdr(texture_id, method).map_err(|e| e.to_string())
}

#[tauri::command]
fn apply_color_grading(state: tauri::State<AppState>, texture_id: u32, grading: gpu::ColorGrading) -> Result<(), String> {
    state.gpu_context.lock().unwrap().apply_color_grading(texture_id, grading).map_err(|e| e.to_string())
}

#[tauri::command]
fn apply_texture_filter(state: tauri::State<AppState>, texture_id: u32, filter: gpu::TextureFilter) -> Result<(), String> {
    state.gpu_context.lock().unwrap().apply_filter(texture_id, filter).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_gpu_memory_usage(state: tauri::State<AppState>) -> gpu::GpuMemoryUsage {
    state.gpu_context.lock().unwrap().get_memory_usage()
}

// ============================================================================
// COMPOSITION COMMANDS
// ============================================================================

#[tauri::command]
fn create_scene(state: tauri::State<AppState>, name: String) -> Result<composition::Scene, String> {
    state.composition_engine.lock().unwrap().create_scene(name)
}

#[tauri::command]
fn delete_scene(state: tauri::State<AppState>, scene_id: String) -> Result<(), String> {
    let id: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    state.composition_engine.lock().unwrap().delete_scene(id)
}

#[tauri::command]
fn get_scenes(state: tauri::State<AppState>) -> Result<Vec<composition::Scene>, String> {
    state.composition_engine.lock().unwrap().get_scenes()
}

#[tauri::command]
fn set_active_scene(state: tauri::State<AppState>, scene_id: String) -> Result<(), String> {
    let id: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    state.composition_engine.lock().unwrap().set_active_scene(id)
}

#[tauri::command]
fn get_active_scene(state: tauri::State<AppState>) -> Result<Option<composition::Scene>, String> {
    state.composition_engine.lock().unwrap().get_active_scene()
}

#[tauri::command]
fn add_layer(state: tauri::State<AppState>, scene_id: String, layer: composition::Layer) -> Result<(), String> {
    let id: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    state.composition_engine.lock().unwrap().add_layer(id, layer).map(|_| ())
}

#[tauri::command]
fn remove_layer(state: tauri::State<AppState>, scene_id: String, layer_id: String) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().remove_layer(sid, lid)
}

#[tauri::command]
fn update_layer(state: tauri::State<AppState>, scene_id: String, layer_id: String, updates: composition::LayerUpdate) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().update_layer(sid, lid, updates).map(|_| ())
}

#[tauri::command]
fn get_layers(state: tauri::State<AppState>, scene_id: String) -> Result<Vec<composition::Layer>, String> {
    let id: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    state.composition_engine.lock().unwrap().get_layers(id)
}

#[tauri::command]
fn set_layer_visibility(state: tauri::State<AppState>, scene_id: String, layer_id: String, visible: bool) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().set_layer_visibility(sid, lid, visible)
}

#[tauri::command]
fn set_layer_locked(state: tauri::State<AppState>, scene_id: String, layer_id: String, locked: bool) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().set_layer_locked(sid, lid, locked)
}

#[tauri::command]
fn move_layer(state: tauri::State<AppState>, scene_id: String, layer_id: String, new_index: usize) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().move_layer(sid, lid, new_index)
}

#[tauri::command]
fn duplicate_layer(state: tauri::State<AppState>, scene_id: String, layer_id: String) -> Result<composition::Layer, String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().duplicate_layer(sid, lid)
}

#[tauri::command]
fn set_layer_blend_mode(state: tauri::State<AppState>, scene_id: String, layer_id: String, blend_mode: composition::BlendMode) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().set_layer_blend_mode(sid, lid, blend_mode)
}

#[tauri::command]
fn apply_layer_filter(state: tauri::State<AppState>, scene_id: String, layer_id: String, filter: composition::Filter) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().apply_layer_filter(sid, lid, filter)
}

#[tauri::command]
fn remove_layer_filter(state: tauri::State<AppState>, scene_id: String, layer_id: String, filter_index: usize) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().remove_layer_filter(sid, lid, filter_index)
}

#[tauri::command]
fn set_layer_transform(state: tauri::State<AppState>, scene_id: String, layer_id: String, transform: composition::LayerTransform) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().set_layer_transform(sid, lid, transform)
}

#[tauri::command]
fn set_layer_crop(state: tauri::State<AppState>, scene_id: String, layer_id: String, crop: composition::LayerCrop) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().set_layer_crop(sid, lid, crop)
}

#[tauri::command]
fn set_layer_mask(state: tauri::State<AppState>, scene_id: String, layer_id: String, mask: composition::LayerMask) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lid: usize = layer_id.parse().map_err(|_| "Invalid layer ID".to_string())?;
    state.composition_engine.lock().unwrap().set_layer_mask(sid, lid, mask)
}

#[tauri::command]
fn create_layer_group(state: tauri::State<AppState>, scene_id: String, name: String, layer_ids: Vec<String>) -> Result<composition::LayerGroup, String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let lids: Vec<usize> = layer_ids.iter().map(|id| id.parse().map_err(|_| "Invalid layer ID".to_string())).collect::<Result<Vec<_>, _>>()?;
    state.composition_engine.lock().unwrap().create_layer_group(sid, name, lids)
}

#[tauri::command]
fn delete_layer_group(state: tauri::State<AppState>, scene_id: String, group_id: String) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let gid: usize = group_id.parse().map_err(|_| "Invalid group ID".to_string())?;
    state.composition_engine.lock().unwrap().delete_layer_group(sid, gid)
}

#[tauri::command]
fn set_layer_group_collapsed(state: tauri::State<AppState>, scene_id: String, group_id: String, collapsed: bool) -> Result<(), String> {
    let sid: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    let gid: usize = group_id.parse().map_err(|_| "Invalid group ID".to_string())?;
    state.composition_engine.lock().unwrap().set_layer_group_collapsed(sid, gid, collapsed)
}

#[tauri::command]
fn set_scene_transition(state: tauri::State<AppState>, scene_id: String, transition: composition::SceneTransition) -> Result<(), String> {
    let id: usize = scene_id.parse().map_err(|_| "Invalid scene ID".to_string())?;
    state.composition_engine.lock().unwrap().set_scene_transition(id, transition)
}

#[tauri::command]
fn set_dual_output(state: tauri::State<AppState>, enabled: bool) -> Result<(), String> {
    state.composition_engine.lock().unwrap().set_dual_output_enabled(enabled)
}

#[tauri::command]
fn is_dual_output_enabled(state: tauri::State<AppState>) -> bool {
    state.composition_engine.lock().unwrap().get_canvas_outputs().map(|o| o.dual_output_enabled).unwrap_or(false)
}

#[tauri::command]
fn set_output_format(state: tauri::State<AppState>, format: composition::OutputFormat) -> Result<(), String> {
    state.composition_engine.lock().unwrap().set_output_format(0, format)
}

#[tauri::command]
fn get_output_format(state: tauri::State<AppState>) -> Result<composition::CanvasOutputs, String> {
    state.composition_engine.lock().unwrap().get_canvas_outputs()
}

// ============================================================================
// VTUBER COMMANDS
// ============================================================================

#[tauri::command]
fn load_vrm_model(state: tauri::State<AppState>, file_path: String) -> Result<(), String> {
    let name = file_path.rsplit('/').next().unwrap_or(&file_path).to_string();
    state.vtuber_engine.lock().unwrap().load_vrm_model(file_path, name).map(|_| ())
}

#[tauri::command]
fn load_live2d_model(state: tauri::State<AppState>, file_path: String) -> Result<(), String> {
    let name = file_path.rsplit('/').next().unwrap_or(&file_path).to_string();
    state.vtuber_engine.lock().unwrap().load_live2d_model(file_path, name).map(|_| ())
}

#[tauri::command]
fn unload_model(state: tauri::State<AppState>, model_id: usize) -> Result<(), String> {
    state.vtuber_engine.lock().unwrap().unload_model(model_id)
}

#[tauri::command]
fn is_model_loaded(state: tauri::State<AppState>) -> bool {
    state.vtuber_engine.lock().unwrap().get_active_model().ok().flatten().is_some()
}

#[tauri::command]
fn get_model_info(state: tauri::State<AppState>) -> Result<Option<vtuber::VtuberModel>, String> {
    state.vtuber_engine.lock().unwrap().get_active_model()
}

#[tauri::command]
fn start_face_tracking(state: tauri::State<AppState>, camera_id: String) -> Result<(), String> {
    state.vtuber_engine.lock().unwrap().initialize_face_tracking(camera_id)
}

#[tauri::command]
fn stop_face_tracking(state: tauri::State<AppState>) -> Result<(), String> {
    state.vtuber_engine.lock().unwrap().stop_face_tracking()
}

#[tauri::command]
fn is_face_tracking_active(state: tauri::State<AppState>) -> bool {
    state.vtuber_engine.lock().unwrap().get_face_tracking_data().ok().flatten().is_some()
}

#[tauri::command]
fn get_face_tracking_data(state: tauri::State<AppState>) -> Result<Option<vtuber::FaceTrackingData>, String> {
    state.vtuber_engine.lock().unwrap().get_face_tracking_data()
}

#[tauri::command]
fn set_model_transform(state: tauri::State<AppState>, model_id: usize, scale: f32, position: (f32, f32), rotation: f32) -> Result<(), String> {
    state.vtuber_engine.lock().unwrap().update_model_transform(model_id, scale, position, rotation)
}

#[tauri::command]
fn get_model_transform(state: tauri::State<AppState>, model_id: usize) -> Result<vtuber::VtuberModel, String> {
    state.vtuber_engine.lock().unwrap().get_model(model_id)
}

#[tauri::command]
fn set_expression(state: tauri::State<AppState>, model_id: usize, expression_name: String) -> Result<(), String> {
    state.vtuber_engine.lock().unwrap().set_expression(model_id, expression_name)
}

#[tauri::command]
fn get_expressions(state: tauri::State<AppState>, model_id: usize) -> Result<Vec<String>, String> {
    state.vtuber_engine.lock().unwrap().get_expressions(model_id)
}

#[tauri::command]
fn set_bone_transform(state: tauri::State<AppState>, model_id: usize, bone_name: String, transform: vtuber::BoneTransform) -> Result<(), String> {
    state.vtuber_engine.lock().unwrap().update_bone(model_id, bone_name, transform)
}

#[tauri::command]
fn get_bones(state: tauri::State<AppState>, model_id: usize) -> Result<std::collections::HashMap<String, vtuber::BoneTransform>, String> {
    state.vtuber_engine.lock().unwrap().get_bones(model_id)
}

#[tauri::command]
fn set_tracking_feature_enabled(state: tauri::State<AppState>, feature: vtuber::TrackingFeature, enabled: bool) -> Result<(), String> {
    state.vtuber_engine.lock().unwrap().set_tracking_feature(feature, enabled)
}

#[tauri::command]
fn is_tracking_feature_enabled(_state: tauri::State<AppState>, _feature: vtuber::TrackingFeature) -> bool {
    // Feature tracking status not directly queryable, return true as default
    true
}

// ============================================================================
// UI COMMANDS
// ============================================================================

#[tauri::command]
fn get_ui_settings(state: tauri::State<AppState>) -> Result<ui::UserSettings, String> {
    state.ui_engine.lock().unwrap().get_settings()
}

#[tauri::command]
fn update_ui_settings(state: tauri::State<AppState>, settings: ui::SettingsUpdate) -> Result<(), String> {
    state.ui_engine.lock().unwrap().update_settings(settings).map(|_| ())
}

#[tauri::command]
fn set_interface_mode(state: tauri::State<AppState>, mode: ui::InterfaceMode) -> Result<(), String> {
    state.ui_engine.lock().unwrap().switch_interface_mode(mode)
}

#[tauri::command]
fn get_interface_mode(state: tauri::State<AppState>) -> Result<ui::InterfaceMode, String> {
    state.ui_engine.lock().unwrap().get_interface_mode()
}

#[tauri::command]
fn set_theme(state: tauri::State<AppState>, theme: ui::Theme) -> Result<(), String> {
    state.ui_engine.lock().unwrap().set_theme(theme)
}

#[tauri::command]
fn get_theme(state: tauri::State<AppState>) -> Result<ui::Theme, String> {
    state.ui_engine.lock().unwrap().get_theme()
}

#[tauri::command]
fn add_keyboard_shortcut(state: tauri::State<AppState>, action: String, shortcut: String) -> Result<(), String> {
    state.ui_engine.lock().unwrap().set_keyboard_shortcut(action, shortcut)
}

#[tauri::command]
fn remove_keyboard_shortcut(state: tauri::State<AppState>, action: String) -> Result<(), String> {
    state.ui_engine.lock().unwrap().set_keyboard_shortcut(action, String::new())
}

#[tauri::command]
fn get_keyboard_shortcuts(state: tauri::State<AppState>) -> Result<std::collections::HashMap<String, String>, String> {
    state.ui_engine.lock().unwrap().get_keyboard_shortcuts()
}

#[tauri::command]
fn undo(state: tauri::State<AppState>) -> Result<(), String> {
    state.ui_engine.lock().unwrap().undo().map(|_| ())
}

#[tauri::command]
fn redo(state: tauri::State<AppState>) -> Result<(), String> {
    state.ui_engine.lock().unwrap().redo().map(|_| ())
}

#[tauri::command]
fn can_undo(state: tauri::State<AppState>) -> bool {
    state.ui_engine.lock().unwrap().get_undo_redo_info().map(|info| info.can_undo).unwrap_or(false)
}

#[tauri::command]
fn can_redo(state: tauri::State<AppState>) -> bool {
    state.ui_engine.lock().unwrap().get_undo_redo_info().map(|info| info.can_redo).unwrap_or(false)
}

#[tauri::command]
fn export_settings(state: tauri::State<AppState>) -> Result<String, String> {
    state.ui_engine.lock().unwrap().export_settings()
}

#[tauri::command]
fn import_settings(state: tauri::State<AppState>, json: String) -> Result<(), String> {
    state.ui_engine.lock().unwrap().import_settings(json)
}

#[tauri::command]
fn save_settings_to_file(state: tauri::State<AppState>, file_path: String) -> Result<(), String> {
    state.ui_engine.lock().unwrap().save_settings_to_file(file_path)
}

#[tauri::command]
fn load_settings_from_file(state: tauri::State<AppState>, file_path: String) -> Result<(), String> {
    state.ui_engine.lock().unwrap().load_settings_from_file(file_path)
}

// ============================================================================
// ONBOARDING COMMANDS
// ============================================================================

#[tauri::command]
fn start_onboarding(state: tauri::State<AppState>) -> Result<(), String> {
    state.onboarding_engine.lock().unwrap().start_onboarding()
}

#[tauri::command]
fn stop_onboarding(state: tauri::State<AppState>) -> Result<(), String> {
    state.onboarding_engine.lock().unwrap().stop_onboarding()
}

#[tauri::command]
fn is_onboarding_active(state: tauri::State<AppState>) -> bool {
    state.onboarding_engine.lock().unwrap().is_onboarding_active().unwrap_or(false)
}

#[tauri::command]
fn get_onboarding_step(state: tauri::State<AppState>) -> Result<Option<onboarding::OnboardingStep>, String> {
    state.onboarding_engine.lock().unwrap().get_current_step()
}

#[tauri::command]
fn next_onboarding_step(state: tauri::State<AppState>) -> Result<(), String> {
    state.onboarding_engine.lock().unwrap().next_step().map(|_| ())
}

#[tauri::command]
fn previous_onboarding_step(state: tauri::State<AppState>) -> Result<(), String> {
    state.onboarding_engine.lock().unwrap().previous_step().map(|_| ())
}

#[tauri::command]
fn skip_onboarding(state: tauri::State<AppState>) -> Result<(), String> {
    state.onboarding_engine.lock().unwrap().skip_step()
}

#[tauri::command]
fn get_onboarding_progress(state: tauri::State<AppState>) -> Result<onboarding::OnboardingProgress, String> {
    state.onboarding_engine.lock().unwrap().get_progress()
}

#[tauri::command]
fn set_onboarding_preference(state: tauri::State<AppState>, key: String, value: String) -> Result<(), String> {
    state.onboarding_engine.lock().unwrap().save_preference(key, value)
}

#[tauri::command]
fn get_onboarding_preferences(state: tauri::State<AppState>) -> Result<onboarding::UserPreferences, String> {
    state.onboarding_engine.lock().unwrap().get_all_preferences()
}

#[tauri::command]
fn export_onboarding_data(state: tauri::State<AppState>) -> Result<String, String> {
    state.onboarding_engine.lock().unwrap().export_data()
}

#[tauri::command]
fn import_onboarding_data(state: tauri::State<AppState>, json: String) -> Result<(), String> {
    state.onboarding_engine.lock().unwrap().import_data(json)
}

#[tauri::command]
fn reset_onboarding(state: tauri::State<AppState>) -> Result<(), String> {
    state.onboarding_engine.lock().unwrap().reset_onboarding()
}

// ============================================================================
// ENCODING COMMANDS
// ============================================================================

#[tauri::command]
fn get_available_encoders(state: tauri::State<AppState>) -> Vec<encoding::EncoderInfo> {
    state.encoding_engine.lock().unwrap().available_encoders.clone()
}

#[tauri::command]
fn start_encoding(
    video_config: encoding::VideoEncodingConfig,
    audio_config: encoding::AudioEncodingConfig,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.encoding_engine.lock().unwrap().start_encoding(video_config, audio_config)
}

#[tauri::command]
fn stop_encoding(state: tauri::State<AppState>) -> Result<(), String> {
    state.encoding_engine.lock().unwrap().stop_encoding()
}

#[tauri::command]
fn is_encoding_active(state: tauri::State<AppState>) -> bool {
    state.encoding_engine.lock().unwrap().active
}

#[tauri::command]
fn get_encoding_stats(state: tauri::State<AppState>) -> encoding::EncodingStats {
    state.encoding_engine.lock().unwrap().stats.clone()
}

#[tauri::command]
fn get_video_config(state: tauri::State<AppState>) -> encoding::VideoEncodingConfig {
    state.encoding_engine.lock().unwrap().video_config.clone()
}

#[tauri::command]
fn get_audio_config(state: tauri::State<AppState>) -> encoding::AudioEncodingConfig {
    state.encoding_engine.lock().unwrap().audio_config.clone()
}

#[tauri::command]
fn update_video_config(
    config: encoding::VideoEncodingConfig,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.encoding_engine.lock().unwrap().video_config = config;
    Ok(())
}

#[tauri::command]
fn update_audio_config(
    config: encoding::AudioEncodingConfig,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.encoding_engine.lock().unwrap().audio_config = config;
    Ok(())
}

#[tauri::command]
fn get_presets_for_codec(codec: encoding::VideoCodec) -> Vec<encoding::EncodingPreset> {
    encoding::EncodingEngine::get_presets_for_codec(&codec)
}

#[tauri::command]
fn get_recommended_bitrate(
    width: u32,
    height: u32,
    fps: u32,
    codec: encoding::VideoCodec,
) -> u32 {
    encoding::EncodingEngine::get_recommended_bitrate((width, height), fps, &codec)
}

#[tauri::command]
fn get_encoding_presets() -> Vec<String> {
    vec![
        "Ultrafast".to_string(),
        "Superfast".to_string(),
        "Veryfast".to_string(),
        "Faster".to_string(),
        "Fast".to_string(),
        "Medium".to_string(),
        "Slow".to_string(),
        "Slower".to_string(),
        "Veryslow".to_string(),
        "Placebo".to_string(),
    ]
}

#[tauri::command]
fn get_rate_control_methods() -> Vec<String> {
    vec![
        "CBR".to_string(),
        "VBR".to_string(),
        "CQP".to_string(),
        "CRF".to_string(),
    ]
}

#[tauri::command]
fn get_video_codecs() -> Vec<String> {
    vec![
        "H264".to_string(),
        "H265".to_string(),
        "AV1".to_string(),
    ]
}

#[tauri::command]
fn get_audio_codecs() -> Vec<String> {
    vec![
        "AAC".to_string(),
        "Opus".to_string(),
        "MP3".to_string(),
    ]
}

#[tauri::command]
fn get_hardware_encoders() -> Vec<String> {
    vec![
        "NVENC".to_string(),
        "AMF".to_string(),
        "QuickSync".to_string(),
        "Software".to_string(),
        "Auto".to_string(),
    ]
}

// ============================================================================
// STREAMING COMMANDS
// ============================================================================

#[tauri::command]
fn get_streaming_platforms() -> Vec<String> {
    vec![
        "Twitch".to_string(),
        "YouTube".to_string(),
        "Kick".to_string(),
        "Facebook".to_string(),
        "TikTok".to_string(),
        "Trovo".to_string(),
        "DLive".to_string(),
        "Custom".to_string(),
    ]
}

#[tauri::command]
fn get_platform_preset(platform: String) -> Result<streaming::StreamingPlatformConfig, String> {
    let platform_enum = match platform.to_lowercase().as_str() {
        "twitch" => streaming::StreamingPlatform::Twitch,
        "youtube" => streaming::StreamingPlatform::YouTube,
        "kick" => streaming::StreamingPlatform::Kick,
        "facebook" => streaming::StreamingPlatform::Facebook,
        "tiktok" => streaming::StreamingPlatform::TikTok,
        "trovo" => streaming::StreamingPlatform::Trovo,
        "dlive" => streaming::StreamingPlatform::DLive,
        "custom" => streaming::StreamingPlatform::Custom,
        _ => return Err("Unknown platform".to_string()),
    };

    Ok(streaming::StreamingPlatformConfig::get_preset(platform_enum))
}

#[tauri::command]
fn start_streaming(
    config: streaming::StreamingConfig,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.streaming_engine.lock().unwrap().start_streaming(config)
}

#[tauri::command]
fn stop_streaming(state: tauri::State<AppState>) -> Result<(), String> {
    state.streaming_engine.lock().unwrap().stop_streaming()
}

#[tauri::command]
fn is_streaming_active(state: tauri::State<AppState>) -> bool {
    state.streaming_engine.lock().unwrap().active
}

#[tauri::command]
fn get_streaming_stats(state: tauri::State<AppState>) -> streaming::StreamingStats {
    state.streaming_engine.lock().unwrap().stats.clone()
}

#[tauri::command]
fn get_streaming_config(state: tauri::State<AppState>) -> streaming::StreamingConfig {
    state.streaming_engine.lock().unwrap().config.clone()
}

#[tauri::command]
fn update_streaming_config(
    config: streaming::StreamingConfig,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.streaming_engine.lock().unwrap().config = config;
    Ok(())
}

#[tauri::command]
fn get_streaming_protocols() -> Vec<String> {
    vec![
        "RTMP".to_string(),
        "RTMPS".to_string(),
        "SRT".to_string(),
        "WebRTC".to_string(),
        "HLS".to_string(),
        "DASH".to_string(),
    ]
}

#[tauri::command]
fn add_multistream_target(
    target: streaming::MultistreamTarget,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.streaming_engine.lock().unwrap().add_multistream_target(target)
}

#[tauri::command]
fn remove_multistream_target(
    id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.streaming_engine.lock().unwrap().remove_multistream_target(id)
}

#[tauri::command]
fn get_multistream_targets(state: tauri::State<AppState>) -> Vec<streaming::MultistreamTarget> {
    state.streaming_engine.lock().unwrap().multistream_targets.clone()
}

#[tauri::command]
fn update_multistream_target(
    id: String,
    enabled: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.streaming_engine.lock().unwrap().update_multistream_target(id, enabled)
}

#[tauri::command]
fn set_multistream_enabled(
    enabled: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.streaming_engine.lock().unwrap().multistream_enabled = enabled;
    Ok(())
}

#[tauri::command]
fn is_multistream_enabled(state: tauri::State<AppState>) -> bool {
    state.streaming_engine.lock().unwrap().multistream_enabled
}

#[tauri::command]
fn get_srt_default_config() -> streaming::SRTConfig {
    streaming::SRTConfig::default()
}

#[tauri::command]
fn test_stream_connection(
    _rtmp_url: String,
    _stream_key: String,
) -> Result<bool, String> {
    // Simulate connection test
    // In production, this would actually test the connection
    Ok(true)
}

// ============================================================================
// CLOUD COMMANDS
// ============================================================================

#[tauri::command]
fn get_cloud_providers() -> Vec<String> {
    vec![
        "Custom".to_string(),
        "AWS".to_string(),
        "GoogleCloud".to_string(),
        "Azure".to_string(),
        "Restream".to_string(),
        "Castr".to_string(),
        "Streamlabs".to_string(),
    ]
}

#[tauri::command]
fn connect_cloud(
    auth_config: cloud::CloudAuthConfig,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().connect(auth_config)
}

#[tauri::command]
fn disconnect_cloud(state: tauri::State<AppState>) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().disconnect()
}

#[tauri::command]
fn is_cloud_connected(state: tauri::State<AppState>) -> bool {
    state.cloud_engine.lock().unwrap().connected
}

#[tauri::command]
fn get_cloud_stats(state: tauri::State<AppState>) -> cloud::CloudStats {
    state.cloud_engine.lock().unwrap().stats.clone()
}

#[tauri::command]
fn get_multistreaming_config(state: tauri::State<AppState>) -> cloud::MultistreamingConfig {
    state.cloud_engine.lock().unwrap().multistreaming_config.clone()
}

#[tauri::command]
fn update_multistreaming_config(
    config: cloud::MultistreamingConfig,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().multistreaming_config = config;
    Ok(())
}

#[tauri::command]
fn add_cloud_multistream_target(
    target: cloud::MultistreamTarget,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().add_multistream_target(target)
}

#[tauri::command]
fn remove_cloud_multistream_target(
    id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().remove_multistream_target(id)
}

#[tauri::command]
fn update_cloud_multistream_target(
    id: String,
    enabled: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().update_multistream_target(id, enabled)
}

#[tauri::command]
fn get_vod_config(state: tauri::State<AppState>) -> cloud::VODRecordingConfig {
    state.cloud_engine.lock().unwrap().vod_config.clone()
}

#[tauri::command]
fn update_vod_config(
    config: cloud::VODRecordingConfig,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().vod_config = config;
    Ok(())
}

#[tauri::command]
fn start_vod_recording(state: tauri::State<AppState>) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().start_vod_recording()
}

#[tauri::command]
fn stop_vod_recording(state: tauri::State<AppState>) -> Result<(), String> {
    state.cloud_engine.lock().unwrap().stop_vod_recording()
}

#[tauri::command]
fn get_vod_recording_status(state: tauri::State<AppState>) -> cloud::VODRecordingStatus {
    state.cloud_engine.lock().unwrap().vod_status.clone()
}

#[tauri::command]
fn is_vod_recording(state: tauri::State<AppState>) -> bool {
    state.cloud_engine.lock().unwrap().vod_status.is_recording
}

#[tauri::command]
fn get_vod_formats() -> Vec<String> {
    vec![
        "MP4".to_string(),
        "MKV".to_string(),
        "MOV".to_string(),
        "FLV".to_string(),
    ]
}

#[tauri::command]
fn get_vod_qualities() -> Vec<String> {
    vec![
        "Original".to_string(),
        "High".to_string(),
        "Medium".to_string(),
        "Low".to_string(),
    ]
}

#[tauri::command]
fn test_cloud_connection(
    _provider: String,
    _api_key: String,
) -> Result<bool, String> {
    // Simulate connection test
    // In production, this would actually test the connection
    Ok(true)
}

#[tauri::command]
fn get_cloud_storage_usage(state: tauri::State<AppState>) -> f32 {
    state.cloud_engine.lock().unwrap().stats.storage_used_gb
}

// ============================================================================
// MULTICHAT COMMANDS
// ============================================================================

#[tauri::command]
fn get_chat_platforms() -> Vec<String> {
    multichat::get_chat_platforms()
}

#[tauri::command]
fn connect_chat_platform(
    platform: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let platform_enum: multichat::ChatPlatform = platform.parse().map_err(|_| format!("Invalid platform: {}", platform))?;
    state.multichat_engine.lock().unwrap().connect_platform(platform_enum)
}

#[tauri::command]
fn disconnect_chat_platform(
    platform: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let platform_enum: multichat::ChatPlatform = platform.parse().map_err(|_| format!("Invalid platform: {}", platform))?;
    state.multichat_engine.lock().unwrap().disconnect_platform(platform_enum)
}

#[tauri::command]
fn get_connected_platforms(state: tauri::State<AppState>) -> Vec<String> {
    state.multichat_engine.lock().unwrap().connected_platforms.iter().map(|p| p.to_string()).collect()
}

#[tauri::command]
fn get_chat_messages(state: tauri::State<AppState>) -> Vec<multichat::ChatMessage> {
    state.multichat_engine.lock().unwrap().messages.clone()
}

#[tauri::command]
fn get_recent_chat_messages(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<multichat::ChatMessage> {
    state.multichat_engine.lock().unwrap().get_recent_messages(count)
}

#[tauri::command]
fn add_chat_message(
    message: multichat::ChatMessage,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.multichat_engine.lock().unwrap().add_message(message)
}

#[tauri::command]
fn clear_chat_messages(state: tauri::State<AppState>) {
    state.multichat_engine.lock().unwrap().clear_messages();
}

#[tauri::command]
fn get_chat_stats(state: tauri::State<AppState>) -> multichat::ChatStats {
    state.multichat_engine.lock().unwrap().stats.clone()
}

#[tauri::command]
fn get_multichat_config(state: tauri::State<AppState>) -> multichat::MultichatConfig {
    state.multichat_engine.lock().unwrap().config.clone()
}

#[tauri::command]
fn update_multichat_config(
    config: multichat::MultichatConfig,
    state: tauri::State<AppState>,
) {
    state.multichat_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn get_chat_filters(state: tauri::State<AppState>) -> Vec<multichat::ChatFilter> {
    state.multichat_engine.lock().unwrap().filters.clone()
}

#[tauri::command]
fn add_chat_filter(
    filter: multichat::ChatFilter,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.multichat_engine.lock().unwrap().add_filter(filter)
}

#[tauri::command]
fn remove_chat_filter(
    filter_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.multichat_engine.lock().unwrap().remove_filter(filter_id)
}

#[tauri::command]
fn update_chat_filter(
    filter_id: String,
    enabled: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.multichat_engine.lock().unwrap().update_filter(filter_id, enabled)
}

#[tauri::command]
fn get_chat_commands(state: tauri::State<AppState>) -> Vec<multichat::ChatCommand> {
    state.multichat_engine.lock().unwrap().commands.clone()
}

#[tauri::command]
fn get_chat_users(state: tauri::State<AppState>) -> Vec<multichat::ChatUser> {
    state.multichat_engine.lock().unwrap().users.values().cloned().collect()
}

#[tauri::command]
fn send_chat_message(
    platform: String,
    message: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let msg = multichat::ChatMessage {
        id: uuid::Uuid::new_v4().to_string(),
        platform: platform.parse().map_err(|_| "Invalid platform".to_string())?,
        username: "streamer".to_string(),
        display_name: "Streamer".to_string(),
        message,
        timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs(),
        badges: vec![],
        emotes: vec![],
        color: None,
        is_moderator: true,
        is_subscriber: false,
        is_vip: false,
        is_owner: true,
    };
    state.multichat_engine.lock().unwrap().add_message(msg)
}

#[tauri::command]
fn get_chat_filter_types() -> Vec<String> {
    multichat::get_chat_filter_types()
}

#[tauri::command]
fn get_chat_filter_actions() -> Vec<String> {
    multichat::get_chat_filter_actions()
}

// ============================================================================
// WEBRTC COMMANDS
// ============================================================================

#[tauri::command]
fn create_webrtc_room(
    room_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().create_room(room_id)
}

#[tauri::command]
fn join_webrtc_room(
    room_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().join_room(room_id)
}

#[tauri::command]
fn leave_webrtc_room(state: tauri::State<AppState>) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().leave_room()
}

#[tauri::command]
fn get_webrtc_room_id(state: tauri::State<AppState>) -> Option<String> {
    state.webrtc_engine.lock().unwrap().room_id.clone()
}

#[tauri::command]
fn is_in_webrtc_room(state: tauri::State<AppState>) -> bool {
    state.webrtc_engine.lock().unwrap().is_in_room()
}

#[tauri::command]
fn add_webrtc_peer(
    peer: webrtc::WebRTCPeer,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().add_peer(peer)
}

#[tauri::command]
fn remove_webrtc_peer(
    peer_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().remove_peer(peer_id)
}

#[tauri::command]
fn get_webrtc_peers(state: tauri::State<AppState>) -> Vec<webrtc::WebRTCPeer> {
    state.webrtc_engine.lock().unwrap().get_peers()
}

#[tauri::command]
fn update_webrtc_peer(
    peer_id: String,
    updates: webrtc::WebRTCPeerUpdate,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().update_peer(peer_id, updates)
}

#[tauri::command]
fn mute_webrtc_peer(
    peer_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().mute_peer(peer_id)
}

#[tauri::command]
fn unmute_webrtc_peer(
    peer_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().unmute_peer(peer_id)
}

#[tauri::command]
fn set_webrtc_peer_volume(
    peer_id: String,
    volume: f32,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.webrtc_engine.lock().unwrap().set_peer_volume(peer_id, volume)
}

#[tauri::command]
fn get_webrtc_config(state: tauri::State<AppState>) -> webrtc::WebRTCConfig {
    state.webrtc_engine.lock().unwrap().config.clone()
}

#[tauri::command]
fn update_webrtc_config(
    config: webrtc::WebRTCConfig,
    state: tauri::State<AppState>,
) {
    state.webrtc_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn get_webrtc_stats(state: tauri::State<AppState>) -> webrtc::WebRTCStats {
    state.webrtc_engine.lock().unwrap().stats.clone()
}

#[tauri::command]
fn get_webrtc_layout(state: tauri::State<AppState>) -> webrtc::WebRTCLayout {
    state.webrtc_engine.lock().unwrap().layout.clone()
}

#[tauri::command]
fn update_webrtc_layout(
    layout: webrtc::WebRTCLayout,
    state: tauri::State<AppState>,
) {
    state.webrtc_engine.lock().unwrap().update_layout(layout);
}

#[tauri::command]
fn get_webrtc_layout_types() -> Vec<String> {
    webrtc::get_webrtc_layout_types()
}

#[tauri::command]
fn get_webrtc_codecs() -> Vec<String> {
    webrtc::get_webrtc_codecs()
}

#[tauri::command]
fn generate_webrtc_room_id() -> String {
    webrtc::generate_webrtc_room_id()
}

// ============================================================================
// INTERACTION COMMANDS
// ============================================================================

#[tauri::command]
fn get_interaction_trigger_types() -> Vec<String> {
    interaction::get_interaction_trigger_types()
}

#[tauri::command]
fn get_interaction_action_types() -> Vec<String> {
    interaction::get_interaction_action_types()
}

#[tauri::command]
fn add_interaction_trigger(
    trigger: interaction::InteractionTrigger,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().add_trigger(trigger)
}

#[tauri::command]
fn remove_interaction_trigger(
    trigger_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().remove_trigger(trigger_id)
}

#[tauri::command]
fn get_interaction_triggers(state: tauri::State<AppState>) -> Vec<interaction::InteractionTrigger> {
    state.interaction_engine.lock().unwrap().triggers.clone()
}

#[tauri::command]
fn update_interaction_trigger(
    trigger_id: String,
    enabled: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().update_trigger(trigger_id, enabled)
}

#[tauri::command]
fn trigger_interaction(
    trigger_id: String,
    state: tauri::State<AppState>,
) -> Result<interaction::InteractionAction, String> {
    state.interaction_engine.lock().unwrap().trigger_interaction(trigger_id)
}

#[tauri::command]
fn get_mini_game_types() -> Vec<String> {
    interaction::get_mini_game_types()
}

#[tauri::command]
fn create_mini_game(
    game: interaction::MiniGame,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().create_mini_game(game)
}

#[tauri::command]
fn start_mini_game(
    game_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().start_mini_game(game_id)
}

#[tauri::command]
fn stop_mini_game(
    game_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().stop_mini_game(game_id)
}

#[tauri::command]
fn join_mini_game(
    game_id: String,
    username: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().join_mini_game(game_id, username)
}

#[tauri::command]
fn submit_mini_game_answer(
    game_id: String,
    username: String,
    answer: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().submit_mini_game_answer(game_id, username, answer)
}

#[tauri::command]
fn get_mini_games(state: tauri::State<AppState>) -> Vec<interaction::MiniGame> {
    state.interaction_engine.lock().unwrap().get_mini_games()
}

#[tauri::command]
fn get_active_mini_games(state: tauri::State<AppState>) -> Vec<interaction::MiniGame> {
    state.interaction_engine.lock().unwrap().get_active_mini_games()
}

#[tauri::command]
fn get_mini_game(
    game_id: String,
    state: tauri::State<AppState>,
) -> Option<interaction::MiniGame> {
    state.interaction_engine.lock().unwrap().get_mini_game(game_id)
}

#[tauri::command]
fn remove_mini_game(
    game_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.interaction_engine.lock().unwrap().remove_mini_game(game_id)
}

#[tauri::command]
fn get_mini_game_templates() -> Vec<interaction::MiniGame> {
    interaction::get_mini_game_templates()
}

#[tauri::command]
fn get_interaction_stats(state: tauri::State<AppState>) -> interaction::InteractionStats {
    state.interaction_engine.lock().unwrap().stats.clone()
}

// ============================================================================
// AI HIGHLIGHT COMMANDS
// ============================================================================

#[tauri::command]
fn get_highlight_config(state: tauri::State<AppState>) -> ai_highlight::HighlightDetectionConfig {
    state.ai_highlight_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_highlight_config(
    config: ai_highlight::HighlightDetectionConfig,
    state: tauri::State<AppState>,
) {
    state.ai_highlight_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn create_highlight_clip(
    name: String,
    highlight_type: String,
    start_time: f64,
    end_time: f64,
    state: tauri::State<AppState>,
) -> Result<ai_highlight::HighlightClip, String> {
    let highlight_type = match highlight_type.as_str() {
        "kill" => ai_highlight::HighlightType::Kill,
        "death" => ai_highlight::HighlightType::Death,
        "victory" => ai_highlight::HighlightType::Victory,
        "defeat" => ai_highlight::HighlightType::Defeat,
        "funny_moment" => ai_highlight::HighlightType::FunnyMoment,
        "chat_reaction" => ai_highlight::HighlightType::ChatReaction,
        "donation" => ai_highlight::HighlightType::Donation,
        "raid" => ai_highlight::HighlightType::Raid,
        "custom" => ai_highlight::HighlightType::Custom,
        _ => return Err("Invalid highlight type".to_string()),
    };
    
    state.ai_highlight_engine.lock().unwrap().create_clip(name, highlight_type, start_time, end_time)
}

#[tauri::command]
fn get_highlight_clips(state: tauri::State<AppState>) -> Vec<ai_highlight::HighlightClip> {
    state.ai_highlight_engine.lock().unwrap().get_clips()
}

#[tauri::command]
fn get_highlight_clip(
    clip_id: String,
    state: tauri::State<AppState>,
) -> Option<ai_highlight::HighlightClip> {
    state.ai_highlight_engine.lock().unwrap().get_clip(clip_id)
}

#[tauri::command]
fn delete_highlight_clip(
    clip_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.ai_highlight_engine.lock().unwrap().delete_clip(clip_id)
}

#[tauri::command]
fn get_highlight_stats(state: tauri::State<AppState>) -> ai_highlight::HighlightStats {
    state.ai_highlight_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn start_highlight_recording(state: tauri::State<AppState>) -> Result<(), String> {
    state.ai_highlight_engine.lock().unwrap().start_recording()
}

#[tauri::command]
fn stop_highlight_recording(state: tauri::State<AppState>) -> Result<(), String> {
    state.ai_highlight_engine.lock().unwrap().stop_recording()
}

#[tauri::command]
fn is_highlight_recording(state: tauri::State<AppState>) -> bool {
    state.ai_highlight_engine.lock().unwrap().is_recording_status()
}

#[tauri::command]
fn get_highlight_types() -> Vec<String> {
    vec![
        "kill".to_string(),
        "death".to_string(),
        "victory".to_string(),
        "defeat".to_string(),
        "funny_moment".to_string(),
        "chat_reaction".to_string(),
        "donation".to_string(),
        "raid".to_string(),
        "custom".to_string(),
    ]
}

// ============================================================================
// SOCIAL MEDIA COMMANDS
// ============================================================================

#[tauri::command]
fn get_social_media_config(state: tauri::State<AppState>) -> social_media::SocialMediaConfig {
    state.social_media_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_social_media_config(
    config: social_media::SocialMediaConfig,
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
) -> Result<social_media::SocialPost, String> {
    let platform = match platform.as_str() {
        "twitter" => social_media::SocialPlatform::Twitter,
        "instagram" => social_media::SocialPlatform::Instagram,
        "tiktok" => social_media::SocialPlatform::TikTok,
        "youtube" => social_media::SocialPlatform::YouTube,
        "facebook" => social_media::SocialPlatform::Facebook,
        "discord" => social_media::SocialPlatform::Discord,
        "linkedin" => social_media::SocialPlatform::LinkedIn,
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
fn get_social_posts(state: tauri::State<AppState>) -> Vec<social_media::SocialPost> {
    state.social_media_engine.lock().unwrap().get_posts()
}

#[tauri::command]
fn get_social_post(
    post_id: String,
    state: tauri::State<AppState>,
) -> Option<social_media::SocialPost> {
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
fn get_social_media_stats(state: tauri::State<AppState>) -> social_media::SocialMediaStats {
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

// ============================================================================
// GAME STATE COMMANDS
// ============================================================================

#[tauri::command]
fn get_game_state_config(state: tauri::State<AppState>) -> game_state::GameStateConfig {
    state.game_state_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_game_state_config(
    config: game_state::GameStateConfig,
    state: tauri::State<AppState>,
) {
    state.game_state_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn connect_game(
    game_type: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let game_type = match game_type.as_str() {
        "cs2" => game_state::GameType::CS2,
        "lol" => game_state::GameType::LoL,
        "valorant" => game_state::GameType::Valorant,
        "dota2" => game_state::GameType::Dota2,
        "overwatch2" => game_state::GameType::Overwatch2,
        "apexlegends" => game_state::GameType::ApexLegends,
        "fortnite" => game_state::GameType::Fortnite,
        "minecraft" => game_state::GameType::Minecraft,
        "custom" => game_state::GameType::Custom,
        _ => return Err("Invalid game type".to_string()),
    };
    
    state.game_state_engine.lock().unwrap().connect_game(game_type)
}

#[tauri::command]
fn disconnect_game(state: tauri::State<AppState>) -> Result<(), String> {
    state.game_state_engine.lock().unwrap().disconnect_game()
}

#[tauri::command]
fn is_game_connected(state: tauri::State<AppState>) -> bool {
    state.game_state_engine.lock().unwrap().is_connected_status()
}

#[tauri::command]
fn get_current_game_data(state: tauri::State<AppState>) -> Option<game_state::GameData> {
    state.game_state_engine.lock().unwrap().get_current_game()
}

#[tauri::command]
fn add_game_event(
    event_type: String,
    description: String,
    data: HashMap<String, String>,
    state: tauri::State<AppState>,
) -> Result<game_state::GameEvent, String> {
    let event_type = match event_type.as_str() {
        "kill" => game_state::GameEventType::Kill,
        "death" => game_state::GameEventType::Death,
        "assist" => game_state::GameEventType::Assist,
        "round_start" => game_state::GameEventType::RoundStart,
        "round_end" => game_state::GameEventType::RoundEnd,
        "match_start" => game_state::GameEventType::MatchStart,
        "match_end" => game_state::GameEventType::MatchEnd,
        "level_up" => game_state::GameEventType::LevelUp,
        "achievement" => game_state::GameEventType::Achievement,
        "custom" => game_state::GameEventType::Custom,
        _ => return Err("Invalid event type".to_string()),
    };
    
    state.game_state_engine.lock().unwrap().add_event(event_type, description, data)
}

#[tauri::command]
fn get_game_events(state: tauri::State<AppState>) -> Vec<game_state::GameEvent> {
    state.game_state_engine.lock().unwrap().get_events()
}

#[tauri::command]
fn get_recent_game_events(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<game_state::GameEvent> {
    state.game_state_engine.lock().unwrap().get_recent_events(count)
}

#[tauri::command]
fn get_game_state_stats(state: tauri::State<AppState>) -> game_state::GameStateStats {
    state.game_state_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_supported_games() -> Vec<String> {
    vec![
        "cs2".to_string(),
        "lol".to_string(),
        "valorant".to_string(),
        "dota2".to_string(),
        "overwatch2".to_string(),
        "apexlegends".to_string(),
        "fortnite".to_string(),
        "minecraft".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_game_event_types() -> Vec<String> {
    vec![
        "kill".to_string(),
        "death".to_string(),
        "assist".to_string(),
        "round_start".to_string(),
        "round_end".to_string(),
        "match_start".to_string(),
        "match_end".to_string(),
        "level_up".to_string(),
        "achievement".to_string(),
        "custom".to_string(),
    ]
}

// ============================================================================
// LIVE CAPTIONS COMMANDS
// ============================================================================

#[tauri::command]
fn get_caption_config(state: tauri::State<AppState>) -> live_captions::CaptionConfig {
    state.live_captions_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_caption_config(
    config: live_captions::CaptionConfig,
    state: tauri::State<AppState>,
) {
    state.live_captions_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn start_caption_processing(state: tauri::State<AppState>) -> Result<(), String> {
    state.live_captions_engine.lock().unwrap().start_processing()
}

#[tauri::command]
fn stop_caption_processing(state: tauri::State<AppState>) -> Result<(), String> {
    state.live_captions_engine.lock().unwrap().stop_processing()
}

#[tauri::command]
fn is_caption_processing(state: tauri::State<AppState>) -> bool {
    state.live_captions_engine.lock().unwrap().is_processing_status()
}

#[tauri::command]
fn add_caption_segment(
    text: String,
    start_time: f64,
    end_time: f64,
    confidence: f32,
    state: tauri::State<AppState>,
) -> Result<live_captions::CaptionSegment, String> {
    state.live_captions_engine.lock().unwrap().add_segment(text, start_time, end_time, confidence)
}

#[tauri::command]
fn get_caption_segments(state: tauri::State<AppState>) -> Vec<live_captions::CaptionSegment> {
    state.live_captions_engine.lock().unwrap().get_segments()
}

#[tauri::command]
fn get_recent_caption_segments(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<live_captions::CaptionSegment> {
    state.live_captions_engine.lock().unwrap().get_recent_segments(count)
}

#[tauri::command]
fn clear_caption_segments(state: tauri::State<AppState>) {
    state.live_captions_engine.lock().unwrap().clear_segments();
}

#[tauri::command]
fn get_caption_stats(state: tauri::State<AppState>) -> live_captions::CaptionStats {
    state.live_captions_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn set_caption_speaker(
    speaker: String,
    state: tauri::State<AppState>,
) {
    state.live_captions_engine.lock().unwrap().set_speaker(speaker);
}

#[tauri::command]
fn get_caption_languages() -> Vec<String> {
    vec![
        "english".to_string(),
        "spanish".to_string(),
        "french".to_string(),
        "german".to_string(),
        "italian".to_string(),
        "portuguese".to_string(),
        "russian".to_string(),
        "japanese".to_string(),
        "korean".to_string(),
        "chinese".to_string(),
        "arabic".to_string(),
        "hindi".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_caption_model_sizes() -> Vec<String> {
    vec![
        "tiny".to_string(),
        "base".to_string(),
        "small".to_string(),
        "medium".to_string(),
        "large".to_string(),
        "large_v2".to_string(),
        "large_v3".to_string(),
    ]
}

// ============================================================================
// TRANSLATION COMMANDS
// ============================================================================

#[tauri::command]
fn get_translation_config(state: tauri::State<AppState>) -> translation::TranslationConfig {
    state.translation_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_translation_config(
    config: translation::TranslationConfig,
    state: tauri::State<AppState>,
) {
    state.translation_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn translate_text(
    text: String,
    source_language: Option<String>,
    is_chat: bool,
    state: tauri::State<AppState>,
) -> Result<translation::TranslationResult, String> {
    let source_lang = if let Some(lang) = source_language {
        Some(match lang.as_str() {
            "english" => translation::TranslationLanguage::English,
            "spanish" => translation::TranslationLanguage::Spanish,
            "french" => translation::TranslationLanguage::French,
            "german" => translation::TranslationLanguage::German,
            "italian" => translation::TranslationLanguage::Italian,
            "portuguese" => translation::TranslationLanguage::Portuguese,
            "russian" => translation::TranslationLanguage::Russian,
            "japanese" => translation::TranslationLanguage::Japanese,
            "korean" => translation::TranslationLanguage::Korean,
            "chinese" => translation::TranslationLanguage::Chinese,
            "arabic" => translation::TranslationLanguage::Arabic,
            "hindi" => translation::TranslationLanguage::Hindi,
            "dutch" => translation::TranslationLanguage::Dutch,
            "polish" => translation::TranslationLanguage::Polish,
            "turkish" => translation::TranslationLanguage::Turkish,
            "vietnamese" => translation::TranslationLanguage::Vietnamese,
            "thai" => translation::TranslationLanguage::Thai,
            "indonesian" => translation::TranslationLanguage::Indonesian,
            "custom" => translation::TranslationLanguage::Custom,
            _ => return Err("Invalid language".to_string()),
        })
    } else {
        None
    };
    
    state.translation_engine.lock().unwrap().translate(text, source_lang, is_chat)
}

#[tauri::command]
fn get_translations(state: tauri::State<AppState>) -> Vec<translation::TranslationResult> {
    state.translation_engine.lock().unwrap().get_translations()
}

#[tauri::command]
fn get_recent_translations(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<translation::TranslationResult> {
    state.translation_engine.lock().unwrap().get_recent_translations(count)
}

#[tauri::command]
fn clear_translations(state: tauri::State<AppState>) {
    state.translation_engine.lock().unwrap().clear_translations();
}

#[tauri::command]
fn get_translation_stats(state: tauri::State<AppState>) -> translation::TranslationStats {
    state.translation_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_translation_languages() -> Vec<String> {
    vec![
        "english".to_string(),
        "spanish".to_string(),
        "french".to_string(),
        "german".to_string(),
        "italian".to_string(),
        "portuguese".to_string(),
        "russian".to_string(),
        "japanese".to_string(),
        "korean".to_string(),
        "chinese".to_string(),
        "arabic".to_string(),
        "hindi".to_string(),
        "dutch".to_string(),
        "polish".to_string(),
        "turkish".to_string(),
        "vietnamese".to_string(),
        "thai".to_string(),
        "indonesian".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_translation_services() -> Vec<String> {
    vec![
        "google".to_string(),
        "deepl".to_string(),
        "microsoft".to_string(),
        "amazon".to_string(),
        "custom".to_string(),
    ]
}

// ============================================================================
// AI COACH COMMANDS
// ============================================================================

#[tauri::command]
fn get_coach_config(state: tauri::State<AppState>) -> ai_coach::CoachConfig {
    state.ai_coach_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_coach_config(
    config: ai_coach::CoachConfig,
    state: tauri::State<AppState>,
) {
    state.ai_coach_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn generate_coach_tip(
    tip_type: String,
    title: String,
    description: String,
    priority: String,
    actionable: bool,
    state: tauri::State<AppState>,
) -> Result<ai_coach::CoachTip, String> {
    let tip_type = match tip_type.as_str() {
        "engagement" => ai_coach::CoachTipType::Engagement,
        "content" => ai_coach::CoachTipType::Content,
        "technical" => ai_coach::CoachTipType::Technical,
        "monetization" => ai_coach::CoachTipType::Monetization,
        "schedule" => ai_coach::CoachTipType::Schedule,
        "custom" => ai_coach::CoachTipType::Custom,
        _ => return Err("Invalid tip type".to_string()),
    };
    
    let priority = match priority.as_str() {
        "low" => ai_coach::CoachTipPriority::Low,
        "medium" => ai_coach::CoachTipPriority::Medium,
        "high" => ai_coach::CoachTipPriority::High,
        "critical" => ai_coach::CoachTipPriority::Critical,
        _ => return Err("Invalid priority".to_string()),
    };
    
    state.ai_coach_engine.lock().unwrap().generate_tip(tip_type, title, description, priority, actionable)
}

#[tauri::command]
fn acknowledge_coach_tip(
    tip_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.ai_coach_engine.lock().unwrap().acknowledge_tip(tip_id)
}

#[tauri::command]
fn get_coach_tips(state: tauri::State<AppState>) -> Vec<ai_coach::CoachTip> {
    state.ai_coach_engine.lock().unwrap().get_tips()
}

#[tauri::command]
fn get_recent_coach_tips(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<ai_coach::CoachTip> {
    state.ai_coach_engine.lock().unwrap().get_recent_tips(count)
}

#[tauri::command]
fn start_stream_analytics(state: tauri::State<AppState>) -> Result<(), String> {
    state.ai_coach_engine.lock().unwrap().start_stream_analytics()
}

#[tauri::command]
fn update_stream_analytics(
    viewers: u32,
    chat_messages: u64,
    unique_chatters: u32,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.ai_coach_engine.lock().unwrap().update_stream_analytics(viewers, chat_messages, unique_chatters)
}

#[tauri::command]
fn end_stream_analytics(state: tauri::State<AppState>) -> Result<ai_coach::StreamAnalytics, String> {
    state.ai_coach_engine.lock().unwrap().end_stream_analytics()
}

#[tauri::command]
fn get_stream_analytics(state: tauri::State<AppState>) -> Vec<ai_coach::StreamAnalytics> {
    state.ai_coach_engine.lock().unwrap().get_analytics()
}

#[tauri::command]
fn get_coach_stats(state: tauri::State<AppState>) -> ai_coach::CoachStats {
    state.ai_coach_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_coach_tip_types() -> Vec<String> {
    vec![
        "engagement".to_string(),
        "content".to_string(),
        "technical".to_string(),
        "monetization".to_string(),
        "schedule".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_coach_tip_priorities() -> Vec<String> {
    vec![
        "low".to_string(),
        "medium".to_string(),
        "high".to_string(),
        "critical".to_string(),
    ]
}

// ============================================================================
// TIP ECOSYSTEM COMMANDS
// ============================================================================

#[tauri::command]
fn get_tip_config(state: tauri::State<AppState>) -> tip_ecosystem::TipConfig {
    state.tip_ecosystem_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_tip_config(
    config: tip_ecosystem::TipConfig,
    state: tauri::State<AppState>,
) {
    state.tip_ecosystem_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn add_tip(
    username: String,
    display_name: String,
    amount: f64,
    currency: String,
    payment_method: String,
    message: Option<String>,
    is_anonymous: bool,
    is_recurring: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let currency = match currency.as_str() {
        "usd" => tip_ecosystem::TipCurrency::USD,
        "eur" => tip_ecosystem::TipCurrency::EUR,
        "gbp" => tip_ecosystem::TipCurrency::GBP,
        "jpy" => tip_ecosystem::TipCurrency::JPY,
        "btc" => tip_ecosystem::TipCurrency::BTC,
        "eth" => tip_ecosystem::TipCurrency::ETH,
        "custom" => tip_ecosystem::TipCurrency::Custom,
        _ => return Err("Invalid currency".to_string()),
    };
    
    let payment_method = match payment_method.as_str() {
        "paypal" => tip_ecosystem::TipPaymentMethod::PayPal,
        "stripe" => tip_ecosystem::TipPaymentMethod::Stripe,
        "crypto" => tip_ecosystem::TipPaymentMethod::Crypto,
        "streamlabs" => tip_ecosystem::TipPaymentMethod::Streamlabs,
        "streamelements" => tip_ecosystem::TipPaymentMethod::StreamElements,
        "custom" => tip_ecosystem::TipPaymentMethod::Custom,
        _ => return Err("Invalid payment method".to_string()),
    };
    
    let tip = tip_ecosystem::Tip {
        id: uuid::Uuid::new_v4().to_string(),
        username,
        display_name,
        amount,
        currency,
        payment_method,
        message,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        is_anonymous,
        is_recurring,
    };
    
    state.tip_ecosystem_engine.lock().unwrap().add_tip(tip)
}

#[tauri::command]
fn get_tips(state: tauri::State<AppState>) -> Vec<tip_ecosystem::Tip> {
    state.tip_ecosystem_engine.lock().unwrap().get_tips()
}

#[tauri::command]
fn get_recent_tips(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<tip_ecosystem::Tip> {
    state.tip_ecosystem_engine.lock().unwrap().get_recent_tips(count)
}

#[tauri::command]
fn get_tip_stats(state: tauri::State<AppState>) -> tip_ecosystem::TipStats {
    state.tip_ecosystem_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn create_tip_goal(
    title: String,
    description: String,
    target_amount: f64,
    currency: String,
    deadline: Option<u64>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let currency = match currency.as_str() {
        "usd" => tip_ecosystem::TipCurrency::USD,
        "eur" => tip_ecosystem::TipCurrency::EUR,
        "gbp" => tip_ecosystem::TipCurrency::GBP,
        "jpy" => tip_ecosystem::TipCurrency::JPY,
        "btc" => tip_ecosystem::TipCurrency::BTC,
        "eth" => tip_ecosystem::TipCurrency::ETH,
        "custom" => tip_ecosystem::TipCurrency::Custom,
        _ => return Err("Invalid currency".to_string()),
    };
    
    state.tip_ecosystem_engine.lock().unwrap().create_goal(title, description, target_amount, currency, deadline).map(|_| ())
}

#[tauri::command]
fn get_tip_goals(state: tauri::State<AppState>) -> Vec<tip_ecosystem::TipGoal> {
    state.tip_ecosystem_engine.lock().unwrap().get_goals()
}

#[tauri::command]
fn update_tip_goal(
    goal_id: String,
    amount: f64,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.tip_ecosystem_engine.lock().unwrap().update_goal(goal_id, amount)
}

#[tauri::command]
fn delete_tip_goal(
    goal_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.tip_ecosystem_engine.lock().unwrap().delete_goal(goal_id)
}

#[tauri::command]
fn create_tip_reward(
    title: String,
    description: String,
    min_amount: f64,
    currency: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let currency = match currency.as_str() {
        "usd" => tip_ecosystem::TipCurrency::USD,
        "eur" => tip_ecosystem::TipCurrency::EUR,
        "gbp" => tip_ecosystem::TipCurrency::GBP,
        "jpy" => tip_ecosystem::TipCurrency::JPY,
        "btc" => tip_ecosystem::TipCurrency::BTC,
        "eth" => tip_ecosystem::TipCurrency::ETH,
        "custom" => tip_ecosystem::TipCurrency::Custom,
        _ => return Err("Invalid currency".to_string()),
    };
    
    state.tip_ecosystem_engine.lock().unwrap().create_reward(title, description, min_amount, currency).map(|_| ())
}

#[tauri::command]
fn get_tip_rewards(state: tauri::State<AppState>) -> Vec<tip_ecosystem::TipReward> {
    state.tip_ecosystem_engine.lock().unwrap().get_rewards()
}

#[tauri::command]
fn update_tip_reward(
    reward_id: String,
    enabled: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.tip_ecosystem_engine.lock().unwrap().update_reward(reward_id, enabled)
}

#[tauri::command]
fn delete_tip_reward(
    reward_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.tip_ecosystem_engine.lock().unwrap().delete_reward(reward_id)
}

#[tauri::command]
fn get_tip_currencies() -> Vec<String> {
    vec![
        "usd".to_string(),
        "eur".to_string(),
        "gbp".to_string(),
        "jpy".to_string(),
        "btc".to_string(),
        "eth".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_tip_payment_methods() -> Vec<String> {
    vec![
        "paypal".to_string(),
        "stripe".to_string(),
        "crypto".to_string(),
        "streamlabs".to_string(),
        "streamelements".to_string(),
        "custom".to_string(),
    ]
}

// ============================================================================
// SPONSOR MARKETPLACE COMMANDS
// ============================================================================

#[tauri::command]
fn get_sponsorship_config(state: tauri::State<AppState>) -> sponsor_marketplace::SponsorshipConfig {
    state.sponsor_marketplace_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_sponsorship_config(
    config: sponsor_marketplace::SponsorshipConfig,
    state: tauri::State<AppState>,
) {
    state.sponsor_marketplace_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn get_sponsorships(state: tauri::State<AppState>) -> Vec<sponsor_marketplace::Sponsorship> {
    state.sponsor_marketplace_engine.lock().unwrap().get_sponsorships()
}

#[tauri::command]
fn get_sponsorship(
    sponsorship_id: String,
    state: tauri::State<AppState>,
) -> Option<sponsor_marketplace::Sponsorship> {
    state.sponsor_marketplace_engine.lock().unwrap().get_sponsorship(sponsorship_id)
}

#[tauri::command]
fn apply_for_sponsorship(
    sponsorship_id: String,
    streamer_username: String,
    streamer_email: String,
    streamer_followers: u32,
    streamer_average_viewers: u32,
    cover_letter: String,
    proposed_rate: Option<f64>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    use sponsor_marketplace::SponsorshipApplication;
    let application = SponsorshipApplication {
        id: uuid::Uuid::new_v4().to_string(),
        sponsorship_id: sponsorship_id.clone(),
        streamer_username,
        streamer_email,
        streamer_followers,
        streamer_average_viewers,
        cover_letter,
        proposed_rate,
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    state.sponsor_marketplace_engine.lock().unwrap().apply_for_sponsorship(sponsorship_id, application)
}

#[tauri::command]
fn get_sponsorship_applications(state: tauri::State<AppState>) -> Vec<sponsor_marketplace::SponsorshipApplication> {
    state.sponsor_marketplace_engine.lock().unwrap().get_applications()
}

#[tauri::command]
fn update_sponsorship_status(
    sponsorship_id: String,
    status: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let status = match status.as_str() {
        "available" => sponsor_marketplace::SponsorshipStatus::Available,
        "applied" => sponsor_marketplace::SponsorshipStatus::Applied,
        "in_review" => sponsor_marketplace::SponsorshipStatus::InReview,
        "accepted" => sponsor_marketplace::SponsorshipStatus::Accepted,
        "active" => sponsor_marketplace::SponsorshipStatus::Active,
        "completed" => sponsor_marketplace::SponsorshipStatus::Completed,
        "rejected" => sponsor_marketplace::SponsorshipStatus::Rejected,
        "cancelled" => sponsor_marketplace::SponsorshipStatus::Cancelled,
        _ => return Err("Invalid status".to_string()),
    };
    
    state.sponsor_marketplace_engine.lock().unwrap().update_sponsorship_status(sponsorship_id, status)
}

#[tauri::command]
fn get_sponsorship_stats(state: tauri::State<AppState>) -> sponsor_marketplace::SponsorshipStats {
    state.sponsor_marketplace_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_sponsorship_types() -> Vec<String> {
    vec![
        "onetime".to_string(),
        "recurring".to_string(),
        "affiliate".to_string(),
        "product_placement".to_string(),
        "brand_ambassador".to_string(),
    ]
}

#[tauri::command]
fn get_sponsorship_statuses() -> Vec<String> {
    vec![
        "available".to_string(),
        "applied".to_string(),
        "in_review".to_string(),
        "accepted".to_string(),
        "active".to_string(),
        "completed".to_string(),
        "rejected".to_string(),
        "cancelled".to_string(),
    ]
}

// ============================================================================
// TELEMETRY COMMANDS
// ============================================================================

#[tauri::command]
fn get_telemetry_config(state: tauri::State<AppState>) -> telemetry::TelemetryConfig {
    state.telemetry_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_telemetry_config(
    config: telemetry::TelemetryConfig,
    state: tauri::State<AppState>,
) {
    state.telemetry_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn log_telemetry_event(
    event_type: String,
    data: HashMap<String, String>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let event_type = match event_type.as_str() {
        "app_start" => telemetry::TelemetryEventType::AppStart,
        "app_close" => telemetry::TelemetryEventType::AppClose,
        "stream_start" => telemetry::TelemetryEventType::StreamStart,
        "stream_end" => telemetry::TelemetryEventType::StreamEnd,
        "feature_used" => telemetry::TelemetryEventType::FeatureUsed,
        "error" => telemetry::TelemetryEventType::Error,
        "warning" => telemetry::TelemetryEventType::Warning,
        "performance" => telemetry::TelemetryEventType::Performance,
        "custom" => telemetry::TelemetryEventType::Custom,
        _ => return Err("Invalid event type".to_string()),
    };
    
    state.telemetry_engine.lock().unwrap().log_event(event_type, data)
}

#[tauri::command]
fn get_telemetry_events(state: tauri::State<AppState>) -> Vec<telemetry::TelemetryEvent> {
    state.telemetry_engine.lock().unwrap().get_events()
}

#[tauri::command]
fn get_recent_telemetry_events(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<telemetry::TelemetryEvent> {
    state.telemetry_engine.lock().unwrap().get_recent_events(count)
}

#[tauri::command]
fn clear_telemetry_events(state: tauri::State<AppState>) {
    state.telemetry_engine.lock().unwrap().clear_events();
}

#[tauri::command]
fn report_error(
    error_type: String,
    message: String,
    stack_trace: Option<String>,
    severity: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let severity = match severity.as_str() {
        "info" => telemetry::ErrorSeverity::Info,
        "warning" => telemetry::ErrorSeverity::Warning,
        "error" => telemetry::ErrorSeverity::Error,
        "critical" => telemetry::ErrorSeverity::Critical,
        _ => return Err("Invalid severity".to_string()),
    };
    
    state.telemetry_engine.lock().unwrap().report_error(error_type, message, stack_trace, severity)
}

#[tauri::command]
fn get_error_reports(state: tauri::State<AppState>) -> Vec<telemetry::ErrorReport> {
    state.telemetry_engine.lock().unwrap().get_error_reports()
}

#[tauri::command]
fn get_recent_error_reports(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<telemetry::ErrorReport> {
    state.telemetry_engine.lock().unwrap().get_recent_error_reports(count)
}

#[tauri::command]
fn acknowledge_error(
    error_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.telemetry_engine.lock().unwrap().acknowledge_error(error_id)
}

#[tauri::command]
fn get_telemetry_stats(state: tauri::State<AppState>) -> telemetry::TelemetryStats {
    state.telemetry_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_telemetry_event_types() -> Vec<String> {
    vec![
        "app_start".to_string(),
        "app_close".to_string(),
        "stream_start".to_string(),
        "stream_end".to_string(),
        "feature_used".to_string(),
        "error".to_string(),
        "warning".to_string(),
        "performance".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_error_severities() -> Vec<String> {
    vec![
        "info".to_string(),
        "warning".to_string(),
        "error".to_string(),
        "critical".to_string(),
    ]
}

// ============================================================================
// PERFORMANCE COMMANDS
// ============================================================================

#[tauri::command]
fn get_performance_config(state: tauri::State<AppState>) -> performance::PerformanceConfig {
    state.performance_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_performance_config(
    config: performance::PerformanceConfig,
    state: tauri::State<AppState>,
) {
    state.performance_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn start_profiling(state: tauri::State<AppState>) -> Result<(), String> {
    state.performance_engine.lock().unwrap().start_profiling()
}

#[tauri::command]
fn stop_profiling(state: tauri::State<AppState>) -> Result<(), String> {
    state.performance_engine.lock().unwrap().stop_profiling()
}

#[tauri::command]
fn is_profiling(state: tauri::State<AppState>) -> bool {
    state.performance_engine.lock().unwrap().is_profiling_status()
}

#[tauri::command]
fn get_performance_samples(state: tauri::State<AppState>) -> Vec<performance::PerformanceSample> {
    state.performance_engine.lock().unwrap().get_samples()
}

#[tauri::command]
fn get_recent_performance_samples(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<performance::PerformanceSample> {
    state.performance_engine.lock().unwrap().get_recent_samples(count)
}

#[tauri::command]
fn clear_performance_samples(state: tauri::State<AppState>) {
    state.performance_engine.lock().unwrap().clear_samples();
}

#[tauri::command]
fn create_performance_profile(
    name: String,
    description: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.performance_engine.lock().unwrap().create_profile(name, description).map(|_| ())
}

#[tauri::command]
fn get_performance_profiles(state: tauri::State<AppState>) -> Vec<performance::PerformanceProfile> {
    state.performance_engine.lock().unwrap().get_profiles()
}

#[tauri::command]
fn delete_performance_profile(
    profile_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.performance_engine.lock().unwrap().delete_profile(profile_id)
}

#[tauri::command]
fn get_performance_alerts(state: tauri::State<AppState>) -> Vec<performance::PerformanceAlert> {
    state.performance_engine.lock().unwrap().get_alerts()
}

#[tauri::command]
fn acknowledge_performance_alert(
    alert_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.performance_engine.lock().unwrap().acknowledge_alert(alert_id)
}

#[tauri::command]
fn get_performance_stats(state: tauri::State<AppState>) -> performance::PerformanceStats {
    state.performance_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_performance_metric_types() -> Vec<String> {
    vec![
        "cpu".to_string(),
        "memory".to_string(),
        "gpu".to_string(),
        "network".to_string(),
        "disk".to_string(),
        "frame_time".to_string(),
        "encoding".to_string(),
        "streaming".to_string(),
        "custom".to_string(),
    ]
}

// ============================================================================
// BUSINESS COMMANDS
// ============================================================================

#[tauri::command]
fn get_business_config(state: tauri::State<AppState>) -> business::BusinessConfig {
    state.business_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_business_config(
    config: business::BusinessConfig,
    state: tauri::State<AppState>,
) {
    state.business_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn start_trial(
    user_id: String,
    state: tauri::State<AppState>,
) -> Result<business::UserSubscription, String> {
    state.business_engine.lock().unwrap().start_trial(user_id)
}

#[tauri::command]
fn subscribe(
    user_id: String,
    tier: String,
    yearly: bool,
    state: tauri::State<AppState>,
) -> Result<business::UserSubscription, String> {
    let tier = match tier.as_str() {
        "free" => business::SubscriptionTier::Free,
        "pro" => business::SubscriptionTier::Pro,
        "enterprise" => business::SubscriptionTier::Enterprise,
        _ => return Err("Invalid tier".to_string()),
    };
    
    state.business_engine.lock().unwrap().subscribe(user_id, tier, yearly)
}

#[tauri::command]
fn cancel_subscription(state: tauri::State<AppState>) -> Result<(), String> {
    state.business_engine.lock().unwrap().cancel_subscription()
}

#[tauri::command]
fn get_subscription(state: tauri::State<AppState>) -> Option<business::UserSubscription> {
    state.business_engine.lock().unwrap().get_subscription()
}

#[tauri::command]
fn get_subscription_plans(state: tauri::State<AppState>) -> Vec<business::SubscriptionPlan> {
    state.business_engine.lock().unwrap().get_plans()
}

#[tauri::command]
fn get_available_features(state: tauri::State<AppState>) -> Vec<business::Feature> {
    state.business_engine.lock().unwrap().get_available_features()
}

#[tauri::command]
fn is_feature_available(
    feature_id: String,
    state: tauri::State<AppState>,
) -> bool {
    state.business_engine.lock().unwrap().is_feature_available(feature_id)
}

#[tauri::command]
fn get_usage_stats(state: tauri::State<AppState>) -> business::UsageStats {
    state.business_engine.lock().unwrap().get_usage_stats()
}

#[tauri::command]
fn update_usage_stats(
    stats: business::UsageStats,
    state: tauri::State<AppState>,
) {
    state.business_engine.lock().unwrap().update_usage_stats(stats);
}

#[tauri::command]
fn get_subscription_tiers() -> Vec<String> {
    vec![
        "free".to_string(),
        "pro".to_string(),
        "enterprise".to_string(),
    ]
}

#[tauri::command]
fn get_subscription_statuses() -> Vec<String> {
    vec![
        "active".to_string(),
        "inactive".to_string(),
        "trial".to_string(),
        "expired".to_string(),
        "cancelled".to_string(),
    ]
}

// ============================================================================
// ANALYTICS COMMANDS
// ============================================================================

#[tauri::command]
async fn analytics_get_real_time(state: tauri::State<'_, AppState>) -> Result<analytics::RealTimeAnalytics, String> {
    // We need to get a reference to the engine without holding the lock across await
    // The async method uses interior RwLock, so we need special handling
    let real_time = {
        let _engine = state.analytics_engine.lock().unwrap();
        // Get a copy of the real_time_data's RwLock handle
        // Since we can't clone the engine, we'll need to modify the approach
        // For now, let's return a default value
        analytics::RealTimeAnalytics::default()
    };
    Ok(real_time)
}

#[tauri::command]
fn analytics_get_aggregated(period: String, state: tauri::State<AppState>) -> Result<Option<analytics::AggregatedAnalytics>, String> {
    let period = match period.as_str() {
        "minute" => analytics::AggregationPeriod::Minute,
        "five_minutes" => analytics::AggregationPeriod::FiveMinutes,
        "fifteen_minutes" => analytics::AggregationPeriod::FifteenMinutes,
        "hour" => analytics::AggregationPeriod::Hour,
        "six_hours" => analytics::AggregationPeriod::SixHours,
        "day" => analytics::AggregationPeriod::Day,
        "week" => analytics::AggregationPeriod::Week,
        "month" => analytics::AggregationPeriod::Month,
        _ => return Err("Invalid period".to_string()),
    };
    Ok(state.analytics_engine.lock().unwrap().get_aggregated(period).cloned())
}

#[tauri::command]
fn analytics_get_performance_metrics(state: tauri::State<AppState>) -> Result<Option<analytics::PerformanceMetrics>, String> {
    Ok(state.analytics_engine.lock().unwrap().get_performance_metrics())
}

#[tauri::command]
fn analytics_get_viewer_statistics(state: tauri::State<AppState>) -> Result<Option<analytics::ViewerStatistics>, String> {
    Ok(state.analytics_engine.lock().unwrap().get_viewer_statistics())
}

#[tauri::command]
fn analytics_get_revenue_statistics(state: tauri::State<AppState>) -> Result<Option<analytics::RevenueStatistics>, String> {
    Ok(state.analytics_engine.lock().unwrap().get_revenue_statistics())
}

#[tauri::command]
async fn analytics_update_real_time(data: analytics::RealTimeAnalytics, _state: tauri::State<'_, AppState>) -> Result<(), String> {
    // Note: This is a no-op for now due to MutexGuard across await issue
    // The async method requires interior mutability with tokio::sync::Mutex
    // For now, we just accept the data but don't update
    let _ = data;
    Ok(())
}

#[tauri::command]
fn analytics_add_data_point(data: analytics::AnalyticsDataPoint, state: tauri::State<AppState>) -> Result<(), String> {
    state.analytics_engine.lock().unwrap().add_data_point(data);
    Ok(())
}

#[tauri::command]
fn analytics_export_data(format: String, period: String, state: tauri::State<AppState>) -> Result<String, String> {
    let format = match format.as_str() {
        "json" => analytics::ExportFormat::Json,
        "csv" => analytics::ExportFormat::Csv,
        "excel" => analytics::ExportFormat::Excel,
        "pdf" => analytics::ExportFormat::Pdf,
        _ => return Err("Invalid format".to_string()),
    };
    let period = match period.as_str() {
        "minute" => analytics::AggregationPeriod::Minute,
        "five_minutes" => analytics::AggregationPeriod::FiveMinutes,
        "fifteen_minutes" => analytics::AggregationPeriod::FifteenMinutes,
        "hour" => analytics::AggregationPeriod::Hour,
        "six_hours" => analytics::AggregationPeriod::SixHours,
        "day" => analytics::AggregationPeriod::Day,
        "week" => analytics::AggregationPeriod::Week,
        "month" => analytics::AggregationPeriod::Month,
        _ => return Err("Invalid period".to_string()),
    };
    state.analytics_engine.lock().unwrap().export_data(format, period)
}

#[tauri::command]
fn analytics_get_summary(state: tauri::State<AppState>) -> Result<analytics::AnalyticsSummary, String> {
    Ok(state.analytics_engine.lock().unwrap().get_summary())
}

// ============================================================================
// SMART HOME COMMANDS
// ============================================================================

#[tauri::command]
fn get_smart_home_config(state: tauri::State<AppState>) -> smart_home::SmartHomeConfig {
    state.smart_home_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_smart_home_config(config: smart_home::SmartHomeConfig, state: tauri::State<AppState>) {
    state.smart_home_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn connect_smart_home(state: tauri::State<AppState>) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().connect()
}

#[tauri::command]
fn disconnect_smart_home(state: tauri::State<AppState>) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().disconnect()
}

#[tauri::command]
fn is_smart_home_connected(state: tauri::State<AppState>) -> bool {
    state.smart_home_engine.lock().unwrap().is_connected_status()
}

#[tauri::command]
fn add_smart_device(device: smart_home::SmartDevice, state: tauri::State<AppState>) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().add_device(device)
}

#[tauri::command]
fn get_smart_devices(state: tauri::State<AppState>) -> Vec<smart_home::SmartDevice> {
    state.smart_home_engine.lock().unwrap().get_devices()
}

#[tauri::command]
fn get_smart_device(device_id: String, state: tauri::State<AppState>) -> Option<smart_home::SmartDevice> {
    state.smart_home_engine.lock().unwrap().get_device(device_id)
}

#[tauri::command]
fn update_smart_device(device_id: String, is_on: bool, properties: HashMap<String, String>, state: tauri::State<AppState>) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().update_device(device_id, is_on, properties)
}

#[tauri::command]
fn delete_smart_device(device_id: String, state: tauri::State<AppState>) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().delete_device(device_id)
}

#[tauri::command]
fn create_smart_automation(
    name: String,
    description: String,
    trigger_type: smart_home::AutomationTriggerType,
    trigger_value: String,
    actions: Vec<smart_home::AutomationAction>,
    state: tauri::State<AppState>,
) -> Result<smart_home::SmartAutomation, String> {
    state.smart_home_engine.lock().unwrap().create_automation(name, description, trigger_type, trigger_value, actions)
}

#[tauri::command]
fn get_smart_automations(state: tauri::State<AppState>) -> Vec<smart_home::SmartAutomation> {
    state.smart_home_engine.lock().unwrap().get_automations()
}

#[tauri::command]
fn delete_smart_automation(automation_id: String, state: tauri::State<AppState>) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().delete_automation(automation_id)
}

#[tauri::command]
fn trigger_smart_automation(trigger_type: smart_home::AutomationTriggerType, trigger_value: String, state: tauri::State<AppState>) -> Result<Vec<smart_home::AutomationAction>, String> {
    state.smart_home_engine.lock().unwrap().trigger_automation(trigger_type, trigger_value)
}

#[tauri::command]
fn get_smart_home_stats(state: tauri::State<AppState>) -> smart_home::SmartHomeStats {
    state.smart_home_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_smart_device_types() -> Vec<String> {
    vec![
        "light".to_string(),
        "switch".to_string(),
        "sensor".to_string(),
        "camera".to_string(),
        "speaker".to_string(),
        "thermostat".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_automation_trigger_types() -> Vec<String> {
    vec![
        "stream_start".to_string(),
        "stream_end".to_string(),
        "new_follower".to_string(),
        "new_subscriber".to_string(),
        "donation".to_string(),
        "raid".to_string(),
        "chat_command".to_string(),
        "schedule".to_string(),
        "custom".to_string(),
    ]
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

#[tokio::main]
async fn main() {
    // Initialize engines
    let capture_engine = capture::CaptureEngine::new().expect("Failed to initialize capture engine");
    let composition_engine = composition::CompositionEngine::new().expect("Failed to initialize composition engine");
    let audio_engine = audio::AudioEngine::new().expect("Failed to initialize audio engine");
    let encoding_engine = encoding::EncodingEngine::new();
    let streaming_engine = streaming::StreamingEngine::new();
    let plugin_manager = plugin::PluginManager::new().expect("Failed to initialize plugin manager");
    let gpu_context = gpu::GpuContext::new().expect("Failed to initialize GPU context");
    let vtuber_engine = vtuber::VtuberEngine::new().expect("Failed to initialize vtuber engine");
    let ui_engine = ui::UiEngine::new().expect("Failed to initialize UI engine");
    let onboarding_engine = onboarding::OnboardingEngine::new().expect("Failed to initialize onboarding engine");
    let cloud_engine = cloud::CloudEngine::new();
    let multichat_engine = multichat::MultichatEngine::new();
    let webrtc_engine = webrtc::WebRTCEngine::new();
    let interaction_engine = interaction::InteractionEngine::new();
    let ai_highlight_engine = ai_highlight::AiHighlightEngine::new();
    let social_media_engine = social_media::SocialMediaEngine::new();
    let game_state_engine = game_state::GameStateEngine::new();
    let live_captions_engine = live_captions::LiveCaptionsEngine::new();
    let translation_engine = translation::TranslationEngine::new();
    let ai_coach_engine = ai_coach::AiCoachEngine::new();
    let tip_ecosystem_engine = tip_ecosystem::TipEcosystemEngine::new();
    let sponsor_marketplace_engine = sponsor_marketplace::SponsorMarketplaceEngine::new();
    let smart_home_engine = smart_home::SmartHomeEngine::new();
    let telemetry_engine = telemetry::TelemetryEngine::new();
    let performance_engine = performance::PerformanceEngine::new();
    let business_engine = business::BusinessEngine::new();
    let analytics_engine = analytics::AnalyticsEngine::new().expect("Failed to initialize analytics engine");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            capture_engine: Mutex::new(capture_engine),
            composition_engine: Mutex::new(composition_engine),
            audio_engine: Mutex::new(audio_engine),
            encoding_engine: Mutex::new(encoding_engine),
            streaming_engine: Mutex::new(streaming_engine),
            plugin_manager: Mutex::new(plugin_manager),
            gpu_context: Mutex::new(gpu_context),
            vtuber_engine: Mutex::new(vtuber_engine),
            ui_engine: Mutex::new(ui_engine),
            onboarding_engine: Mutex::new(onboarding_engine),
            cloud_engine: Mutex::new(cloud_engine),
            multichat_engine: Mutex::new(multichat_engine),
            webrtc_engine: Mutex::new(webrtc_engine),
            interaction_engine: Mutex::new(interaction_engine),
            ai_highlight_engine: Mutex::new(ai_highlight_engine),
            social_media_engine: Mutex::new(social_media_engine),
            game_state_engine: Mutex::new(game_state_engine),
            live_captions_engine: Mutex::new(live_captions_engine),
            translation_engine: Mutex::new(translation_engine),
            ai_coach_engine: Mutex::new(ai_coach_engine),
            tip_ecosystem_engine: Mutex::new(tip_ecosystem_engine),
            sponsor_marketplace_engine: Mutex::new(sponsor_marketplace_engine),
            smart_home_engine: Mutex::new(smart_home_engine),
            telemetry_engine: Mutex::new(telemetry_engine),
            performance_engine: Mutex::new(performance_engine),
            business_engine: Mutex::new(business_engine),
            analytics_engine: Mutex::new(analytics_engine),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            // Capture commands
            enumerate_capture_sources,
            start_capture,
            stop_capture_source,
            stop_capture,
            is_capturing,
            get_active_sources,
            get_capture_performance_stats,
            get_capture_presets,
            // Audio commands
            enumerate_audio_devices,
            start_audio_processing,
            stop_audio_processing,
            is_audio_processing,
            create_audio_track,
            remove_audio_track,
            get_audio_tracks,
            update_audio_track,
            apply_audio_effect,
            remove_audio_effect,
            set_master_volume,
            get_master_volume,
            sync_audio_with_video,
            get_audio_performance_stats,
            // GPU commands
            initialize_gpu,
            get_gpu_info,
            create_texture,
            get_texture,
            delete_texture,
            hdr_to_sdr,
            apply_color_grading,
            apply_texture_filter,
            get_gpu_memory_usage,
            // Composition commands
            create_scene,
            delete_scene,
            get_scenes,
            set_active_scene,
            get_active_scene,
            add_layer,
            remove_layer,
            update_layer,
            get_layers,
            set_layer_visibility,
            set_layer_locked,
            move_layer,
            duplicate_layer,
            set_layer_blend_mode,
            apply_layer_filter,
            remove_layer_filter,
            set_layer_transform,
            set_layer_crop,
            set_layer_mask,
            create_layer_group,
            delete_layer_group,
            set_layer_group_collapsed,
            set_scene_transition,
            set_dual_output,
            is_dual_output_enabled,
            set_output_format,
            get_output_format,
            // VTuber commands
            load_vrm_model,
            load_live2d_model,
            unload_model,
            is_model_loaded,
            get_model_info,
            start_face_tracking,
            stop_face_tracking,
            is_face_tracking_active,
            get_face_tracking_data,
            set_model_transform,
            get_model_transform,
            set_expression,
            get_expressions,
            set_bone_transform,
            get_bones,
            set_tracking_feature_enabled,
            is_tracking_feature_enabled,
            // UI commands
            get_ui_settings,
            update_ui_settings,
            set_interface_mode,
            get_interface_mode,
            set_theme,
            get_theme,
            add_keyboard_shortcut,
            remove_keyboard_shortcut,
            get_keyboard_shortcuts,
            undo,
            redo,
            can_undo,
            can_redo,
            export_settings,
            import_settings,
            save_settings_to_file,
            load_settings_from_file,
            // Onboarding commands
            start_onboarding,
            stop_onboarding,
            is_onboarding_active,
            get_onboarding_step,
            next_onboarding_step,
            previous_onboarding_step,
            skip_onboarding,
            get_onboarding_progress,
            set_onboarding_preference,
            get_onboarding_preferences,
            export_onboarding_data,
            import_onboarding_data,
            reset_onboarding,
            // Encoding commands
            get_available_encoders,
            start_encoding,
            stop_encoding,
            is_encoding_active,
            get_encoding_stats,
            get_video_config,
            get_audio_config,
            update_video_config,
            update_audio_config,
            get_presets_for_codec,
            get_recommended_bitrate,
            get_encoding_presets,
            get_rate_control_methods,
            get_video_codecs,
            get_audio_codecs,
            get_hardware_encoders,
            // Streaming commands
            get_streaming_platforms,
            get_platform_preset,
            start_streaming,
            stop_streaming,
            is_streaming_active,
            get_streaming_stats,
            get_streaming_config,
            update_streaming_config,
            get_streaming_protocols,
            add_multistream_target,
            remove_multistream_target,
            get_multistream_targets,
            update_multistream_target,
            set_multistream_enabled,
            is_multistream_enabled,
            get_srt_default_config,
            test_stream_connection,
            // Cloud commands
            get_cloud_providers,
            connect_cloud,
            disconnect_cloud,
            is_cloud_connected,
            get_cloud_stats,
            get_multistreaming_config,
            update_multistreaming_config,
            add_cloud_multistream_target,
            remove_cloud_multistream_target,
            update_cloud_multistream_target,
            get_vod_config,
            update_vod_config,
            start_vod_recording,
            stop_vod_recording,
            get_vod_recording_status,
            is_vod_recording,
            get_vod_formats,
            get_vod_qualities,
            test_cloud_connection,
            get_cloud_storage_usage,
            // Multichat commands
            get_chat_platforms,
            connect_chat_platform,
            disconnect_chat_platform,
            get_connected_platforms,
            get_chat_messages,
            get_recent_chat_messages,
            add_chat_message,
            clear_chat_messages,
            get_chat_stats,
            get_multichat_config,
            update_multichat_config,
            get_chat_filters,
            add_chat_filter,
            remove_chat_filter,
            update_chat_filter,
            get_chat_commands,
            get_chat_users,
            send_chat_message,
            get_chat_filter_types,
            get_chat_filter_actions,
            // WebRTC commands
            create_webrtc_room,
            join_webrtc_room,
            leave_webrtc_room,
            get_webrtc_room_id,
            is_in_webrtc_room,
            add_webrtc_peer,
            remove_webrtc_peer,
            get_webrtc_peers,
            update_webrtc_peer,
            mute_webrtc_peer,
            unmute_webrtc_peer,
            set_webrtc_peer_volume,
            get_webrtc_config,
            update_webrtc_config,
            get_webrtc_stats,
            get_webrtc_layout,
            update_webrtc_layout,
            get_webrtc_layout_types,
            get_webrtc_codecs,
            generate_webrtc_room_id,
            // Interaction commands
            get_interaction_trigger_types,
            get_interaction_action_types,
            add_interaction_trigger,
            remove_interaction_trigger,
            get_interaction_triggers,
            update_interaction_trigger,
            trigger_interaction,
            get_mini_game_types,
            create_mini_game,
            start_mini_game,
            stop_mini_game,
            join_mini_game,
            submit_mini_game_answer,
            get_mini_games,
            get_active_mini_games,
            get_mini_game,
            remove_mini_game,
            get_mini_game_templates,
            get_interaction_stats,
            // AI Highlight commands
            get_highlight_config,
            update_highlight_config,
            create_highlight_clip,
            get_highlight_clips,
            get_highlight_clip,
            delete_highlight_clip,
            get_highlight_stats,
            start_highlight_recording,
            stop_highlight_recording,
            is_highlight_recording,
            get_highlight_types,
            // Social Media commands
            get_social_media_config,
            update_social_media_config,
            create_social_post,
            schedule_social_post,
            post_social_now,
            get_social_posts,
            get_social_post,
            delete_social_post,
            get_social_media_stats,
            get_social_platforms,
            auto_post_stream_start,
            auto_post_stream_end,
            // Game State commands
            get_game_state_config,
            update_game_state_config,
            connect_game,
            disconnect_game,
            is_game_connected,
            get_current_game_data,
            add_game_event,
            get_game_events,
            get_recent_game_events,
            get_game_state_stats,
            get_supported_games,
            get_game_event_types,
            // Live Captions commands
            get_caption_config,
            update_caption_config,
            start_caption_processing,
            stop_caption_processing,
            is_caption_processing,
            add_caption_segment,
            get_caption_segments,
            get_recent_caption_segments,
            clear_caption_segments,
            get_caption_stats,
            set_caption_speaker,
            get_caption_languages,
            get_caption_model_sizes,
            // Translation commands
            get_translation_config,
            update_translation_config,
            translate_text,
            get_translations,
            get_recent_translations,
            clear_translations,
            get_translation_stats,
            get_translation_languages,
            get_translation_services,
            // AI Coach commands
            get_coach_config,
            update_coach_config,
            generate_coach_tip,
            acknowledge_coach_tip,
            get_coach_tips,
            get_recent_coach_tips,
            start_stream_analytics,
            update_stream_analytics,
            end_stream_analytics,
            get_stream_analytics,
            get_coach_stats,
            get_coach_tip_types,
            get_coach_tip_priorities,
            // Tip Ecosystem commands
            get_tip_config,
            update_tip_config,
            add_tip,
            get_tips,
            get_recent_tips,
            get_tip_stats,
            create_tip_goal,
            get_tip_goals,
            update_tip_goal,
            delete_tip_goal,
            create_tip_reward,
            get_tip_rewards,
            update_tip_reward,
            delete_tip_reward,
            get_tip_currencies,
            get_tip_payment_methods,
            // Sponsor Marketplace commands
            get_sponsorship_config,
            update_sponsorship_config,
            get_sponsorships,
            get_sponsorship,
            apply_for_sponsorship,
            get_sponsorship_applications,
            update_sponsorship_status,
            get_sponsorship_stats,
            get_sponsorship_types,
            get_sponsorship_statuses,
            // Smart Home commands
            get_smart_home_config,
            update_smart_home_config,
            connect_smart_home,
            disconnect_smart_home,
            is_smart_home_connected,
            add_smart_device,
            get_smart_devices,
            get_smart_device,
            update_smart_device,
            delete_smart_device,
            create_smart_automation,
            get_smart_automations,
            delete_smart_automation,
            trigger_smart_automation,
            get_smart_home_stats,
            get_smart_device_types,
            get_automation_trigger_types,
            // Telemetry commands
            get_telemetry_config,
            update_telemetry_config,
            log_telemetry_event,
            get_telemetry_events,
            get_recent_telemetry_events,
            clear_telemetry_events,
            report_error,
            get_error_reports,
            get_recent_error_reports,
            acknowledge_error,
            get_telemetry_stats,
            get_telemetry_event_types,
            get_error_severities,
            // Performance commands
            get_performance_config,
            update_performance_config,
            start_profiling,
            stop_profiling,
            is_profiling,
            get_performance_samples,
            get_recent_performance_samples,
            clear_performance_samples,
            create_performance_profile,
            get_performance_profiles,
            delete_performance_profile,
            get_performance_alerts,
            acknowledge_performance_alert,
            get_performance_stats,
            get_performance_metric_types,
            // Business commands
            get_business_config,
            update_business_config,
            start_trial,
            subscribe,
            cancel_subscription,
            get_subscription,
            get_subscription_plans,
            get_available_features,
            is_feature_available,
            get_usage_stats,
            update_usage_stats,
            get_subscription_tiers,
            get_subscription_statuses,
            // Analytics commands
            analytics_get_real_time,
            analytics_get_aggregated,
            analytics_get_performance_metrics,
            analytics_get_viewer_statistics,
            analytics_get_revenue_statistics,
            analytics_update_real_time,
            analytics_add_data_point,
            analytics_export_data,
            analytics_get_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}