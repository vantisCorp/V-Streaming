use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Composition engine for video composition and effects
pub struct CompositionEngine {
    is_active: Arc<Mutex<bool>>,
    scenes: Arc<Mutex<HashMap<usize, Scene>>>,
    active_scene_id: Arc<Mutex<Option<usize>>>,
    next_scene_id: Arc<Mutex<usize>>,
    next_layer_id: Arc<Mutex<usize>>,
    canvas_outputs: Arc<Mutex<CanvasOutputs>>,
}

impl CompositionEngine {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            is_active: Arc::new(Mutex::new(false)),
            scenes: Arc::new(Mutex::new(HashMap::new())),
            active_scene_id: Arc::new(Mutex::new(None)),
            next_scene_id: Arc::new(Mutex::new(0)),
            next_layer_id: Arc::new(Mutex::new(0)),
            canvas_outputs: Arc::new(Mutex::new(CanvasOutputs::default())),
        })
    }

    /// Create a new scene
    pub fn create_scene(&self, name: String) -> Result<Scene, String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let mut next_id = self.next_scene_id.lock().map_err(|e| e.to_string())?;
        
        let scene_id = *next_id;
        *next_id += 1;

        let scene = Scene {
            id: scene_id,
            name,
            layers: HashMap::new(),
            layer_groups: HashMap::new(),
            output_format: OutputFormat::Landscape { width: 1920, height: 1080 },
            background_color: (0, 0, 0, 255),
            transition: None,
            created_at: std::time::SystemTime::now(),
        };

        scenes.insert(scene_id, scene.clone());
        Ok(scene)
    }

    /// Delete a scene
    pub fn delete_scene(&self, scene_id: usize) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let mut active_id = self.active_scene_id.lock().map_err(|e| e.to_string())?;
        
        if let Some(current) = *active_id {
            if current == scene_id {
                *active_id = None;
            }
        }
        
        scenes.remove(&scene_id).ok_or("Scene not found")?;
        Ok(())
    }

    /// Get all scenes
    pub fn get_scenes(&self) -> Result<Vec<Scene>, String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        Ok(scenes.values().cloned().collect())
    }

    /// Get a specific scene
    pub fn get_scene(&self, scene_id: usize) -> Result<Scene, String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        scenes.get(&scene_id).cloned().ok_or("Scene not found".to_string())
    }

    /// Set active scene
    pub fn set_active_scene(&self, scene_id: usize) -> Result<(), String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        if !scenes.contains_key(&scene_id) {
            return Err("Scene not found".to_string());
        }
        
        let mut active_id = self.active_scene_id.lock().map_err(|e| e.to_string())?;
        *active_id = Some(scene_id);
        Ok(())
    }

    /// Get active scene
    pub fn get_active_scene(&self) -> Result<Option<Scene>, String> {
        let active_id = self.active_scene_id.lock().map_err(|e| e.to_string())?;
        if let Some(id) = *active_id {
            let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
            Ok(scenes.get(&id).cloned())
        } else {
            Ok(None)
        }
    }

    /// Add a layer to a scene
    pub fn add_layer(&self, scene_id: usize, layer: Layer) -> Result<Layer, String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let mut next_id = self.next_layer_id.lock().map_err(|e| e.to_string())?;
        
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        
        let layer_id = *next_id;
        *next_id += 1;

        let mut new_layer = layer;
        new_layer.id = layer_id;
        
        scene.layers.insert(layer_id, new_layer.clone());
        Ok(new_layer)
    }

    /// Remove a layer from a scene
    pub fn remove_layer(&self, scene_id: usize, layer_id: usize) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        
        scene.layers.remove(&layer_id).ok_or("Layer not found")?;
        Ok(())
    }

    /// Update a layer
    pub fn update_layer(&self, scene_id: usize, layer_id: usize, updates: LayerUpdate) -> Result<Layer, String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        
        let layer = scene.layers.get_mut(&layer_id).ok_or("Layer not found")?;
        
        if let Some(name) = updates.name {
            layer.name = name;
        }
        if let Some(position) = updates.position {
            layer.position = position;
        }
        if let Some(size) = updates.size {
            layer.size = size;
        }
        if let Some(opacity) = updates.opacity {
            layer.opacity = opacity;
        }
        if let Some(visible) = updates.visible {
            layer.visible = visible;
        }
        if let Some(rotation) = updates.rotation {
            layer.rotation = rotation;
        }
        if let Some(anchor_point) = updates.anchor_point {
            layer.anchor_point = anchor_point;
        }
        if let Some(blend_mode) = updates.blend_mode {
            layer.blend_mode = blend_mode;
        }
        if let Some(z_index) = updates.z_index {
            layer.z_index = z_index;
        }
        if let Some(filters) = updates.filters {
            layer.filters = filters;
        }
        if let Some(mask) = updates.mask {
            layer.mask = mask;
        }
        
        Ok(layer.clone())
    }

    /// Get all layers in a scene
    pub fn get_layers(&self, scene_id: usize) -> Result<Vec<Layer>, String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get(&scene_id).ok_or("Scene not found")?;
        
        let mut layers: Vec<_> = scene.layers.values().cloned().collect();
        layers.sort_by_key(|l| l.z_index);
        Ok(layers)
    }

    /// Duplicate a layer
    pub fn duplicate_layer(&self, scene_id: usize, layer_id: usize) -> Result<Layer, String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get(&scene_id).ok_or("Scene not found")?;
        
        let original = scene.layers.get(&layer_id).ok_or("Layer not found")?;
        let mut next_id = self.next_layer_id.lock().map_err(|e| e.to_string())?;
        
        let new_id = *next_id;
        *next_id += 1;

        let mut duplicated = original.clone();
        duplicated.id = new_id;
        duplicated.name = format!("{} (Copy)", duplicated.name);
        duplicated.position = (duplicated.position.0 + 20.0, duplicated.position.1 + 20.0);
        
        drop(scenes);
        drop(next_id);
        
        self.add_layer(scene_id, duplicated)
    }

    /// Create a layer group
    pub fn create_layer_group(&self, scene_id: usize, name: String, layer_ids: Vec<usize>) -> Result<LayerGroup, String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        
        let group_id = scene.layer_groups.len();
        
        // Verify all layers exist
        for layer_id in &layer_ids {
            if !scene.layers.contains_key(layer_id) {
                return Err(format!("Layer {} not found", layer_id));
            }
        }
        
        let group = LayerGroup {
            id: group_id,
            name,
            layer_ids,
            collapsed: false,
        };
        
        scene.layer_groups.insert(group_id, group.clone());
        Ok(group)
    }

    /// Delete a layer group
    pub fn delete_layer_group(&self, scene_id: usize, group_id: usize) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        
        scene.layer_groups.remove(&group_id).ok_or("Group not found")?;
        Ok(())
    }

    /// Get all layer groups in a scene
    pub fn get_layer_groups(&self, scene_id: usize) -> Result<Vec<LayerGroup>, String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get(&scene_id).ok_or("Scene not found")?;
        
        Ok(scene.layer_groups.values().cloned().collect())
    }

    /// Set scene output format
    pub fn set_output_format(&self, scene_id: usize, format: OutputFormat) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        
        scene.output_format = format;
        Ok(())
    }

    /// Set scene background color
    pub fn set_background_color(&self, scene_id: usize, color: (u8, u8, u8, u8)) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        
        scene.background_color = color;
        Ok(())
    }

    /// Set scene transition
    pub fn set_scene_transition(&self, scene_id: usize, transition: SceneTransition) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        
        scene.transition = Some(transition);
        Ok(())
    }

    /// Configure dual-output canvas
    pub fn configure_dual_output(&self, landscape: OutputFormat, portrait: OutputFormat) -> Result<(), String> {
        let mut outputs = self.canvas_outputs.lock().map_err(|e| e.to_string())?;
        
        outputs.landscape = Some(landscape);
        outputs.portrait = Some(portrait);
        outputs.dual_output_enabled = true;
        
        Ok(())
    }

    /// Get canvas outputs configuration
    pub fn get_canvas_outputs(&self) -> Result<CanvasOutputs, String> {
        let outputs = self.canvas_outputs.lock().map_err(|e| e.to_string())?;
        Ok(outputs.clone())
    }

    /// Enable/disable dual output
    pub fn set_dual_output_enabled(&self, enabled: bool) -> Result<(), String> {
        let mut outputs = self.canvas_outputs.lock().map_err(|e| e.to_string())?;
        outputs.dual_output_enabled = enabled;
        Ok(())
    }

    /// Compose scene to output
    pub fn compose_scene(&self, scene_id: usize) -> Result<ComposedFrame, String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get(&scene_id).ok_or("Scene not found")?;
        
        let mut layers: Vec<_> = scene.layers.values().cloned().collect();
        layers.sort_by_key(|l| l.z_index);
        
        Ok(ComposedFrame {
            scene_id,
            layers,
            output_format: scene.output_format.clone(),
            background_color: scene.background_color,
            timestamp: std::time::SystemTime::now(),
        })
    }

    /// Get composition statistics

    pub fn set_layer_visibility(&self, scene_id: usize, layer_id: usize, visible: bool) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        let layer = scene.layers.get_mut(&layer_id).ok_or("Layer not found")?;
        layer.visible = visible;
        Ok(())
    }

    pub fn set_layer_locked(&self, scene_id: usize, layer_id: usize, _locked: bool) -> Result<(), String> {
        // Layers don't have a locked field yet, but we accept the call
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get(&scene_id).ok_or("Scene not found")?;
        let _ = scene.layers.get(&layer_id).ok_or("Layer not found")?;
        // locked state would be stored if we add the field
        Ok(())
    }

    pub fn move_layer(&self, scene_id: usize, layer_id: usize, new_index: usize) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        let layer = scene.layers.get_mut(&layer_id).ok_or("Layer not found")?;
        layer.z_index = new_index as i32;
        Ok(())
    }

    pub fn set_layer_blend_mode(&self, scene_id: usize, layer_id: usize, blend_mode: BlendMode) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        let layer = scene.layers.get_mut(&layer_id).ok_or("Layer not found")?;
        layer.blend_mode = blend_mode;
        Ok(())
    }

    pub fn apply_layer_filter(&self, scene_id: usize, layer_id: usize, filter: Filter) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        let layer = scene.layers.get_mut(&layer_id).ok_or("Layer not found")?;
        layer.filters.push(filter);
        Ok(())
    }

    pub fn remove_layer_filter(&self, scene_id: usize, layer_id: usize, filter_index: usize) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        let layer = scene.layers.get_mut(&layer_id).ok_or("Layer not found")?;
        if filter_index >= layer.filters.len() {
            return Err("Filter index out of bounds".to_string());
        }
        layer.filters.remove(filter_index);
        Ok(())
    }

    pub fn set_layer_transform(&self, scene_id: usize, layer_id: usize, transform: LayerTransform) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        let layer = scene.layers.get_mut(&layer_id).ok_or("Layer not found")?;
        layer.position = transform.position;
        layer.size = transform.size;
        layer.rotation = transform.rotation;
        layer.anchor_point = transform.anchor_point;
        Ok(())
    }

    pub fn set_layer_crop(&self, scene_id: usize, layer_id: usize, _crop: LayerCrop) -> Result<(), String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get(&scene_id).ok_or("Scene not found")?;
        let _ = scene.layers.get(&layer_id).ok_or("Layer not found")?;
        // Crop would be applied to the layer source
        Ok(())
    }

    pub fn set_layer_mask(&self, scene_id: usize, layer_id: usize, mask: LayerMask) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        let layer = scene.layers.get_mut(&layer_id).ok_or("Layer not found")?;
        layer.mask = Some(mask);
        Ok(())
    }

    pub fn set_layer_group_collapsed(&self, scene_id: usize, group_id: usize, collapsed: bool) -> Result<(), String> {
        let mut scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let scene = scenes.get_mut(&scene_id).ok_or("Scene not found")?;
        let group = scene.layer_groups.get_mut(&group_id).ok_or("Layer group not found")?;
        group.collapsed = collapsed;
        Ok(())
    }

    pub fn get_composition_stats(&self) -> Result<CompositionStats, String> {
        let scenes = self.scenes.lock().map_err(|e| e.to_string())?;
        let active_id = self.active_scene_id.lock().map_err(|e| e.to_string())?;
        
        let total_layers: usize = scenes.values().map(|s| s.layers.len()).sum();
        let total_groups: usize = scenes.values().map(|s| s.layer_groups.len()).sum();
        
        Ok(CompositionStats {
            total_scenes: scenes.len(),
            active_scene_id: *active_id,
            total_layers,
            total_layer_groups: total_groups,
            dual_output_enabled: self.canvas_outputs.lock().map_err(|e| e.to_string())?.dual_output_enabled,
        })
    }
}

/// Scene configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub id: usize,
    pub name: String,
    pub layers: HashMap<usize, Layer>,
    pub layer_groups: HashMap<usize, LayerGroup>,
    pub output_format: OutputFormat,
    pub background_color: (u8, u8, u8, u8),
    pub transition: Option<SceneTransition>,
    pub created_at: std::time::SystemTime,
}

/// Video layer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer {
    pub id: usize,
    pub name: String,
    pub source: LayerSource,
    pub position: (f32, f32),
    pub size: (f32, f32),
    pub opacity: f32,
    pub visible: bool,
    pub rotation: f32,
    pub anchor_point: (f32, f32),
    pub blend_mode: BlendMode,
    pub z_index: i32,
    pub filters: Vec<Filter>,
    pub mask: Option<LayerMask>,
}

/// Layer update options
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LayerUpdate {
    pub name: Option<String>,
    pub position: Option<(f32, f32)>,
    pub size: Option<(f32, f32)>,
    pub opacity: Option<f32>,
    pub visible: Option<bool>,
    pub rotation: Option<f32>,
    pub anchor_point: Option<(f32, f32)>,
    pub blend_mode: Option<BlendMode>,
    pub z_index: Option<i32>,
    pub filters: Option<Vec<Filter>>,
    pub mask: Option<Option<LayerMask>>,
}

/// Layer source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LayerSource {
    Capture { source_id: String },
    Image { path: String },
    Text { 
        content: String, 
        font_size: u32,
        font_family: String,
        color: (u8, u8, u8, u8),
        stroke_color: Option<(u8, u8, u8, u8)>,
        stroke_width: Option<f32>,
    },
    Vtuber { 
        model_path: String,
        model_type: VtuberModelType,
    },
    Camera { device_id: String },
    Color { color: (u8, u8, u8, u8) },
    Video { path: String, looped: bool },
    WebBrowser { url: String, width: u32, height: u32 },
}

/// VTuber model type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VtuberModelType {
    VRM,
    Live2D,
}

/// Blend modes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BlendMode {
    Normal,
    Multiply,
    Screen,
    Overlay,
    Darken,
    Lighten,
    ColorDodge,
    ColorBurn,
    HardLight,
    SoftLight,
    Difference,
    Exclusion,
    Hue,
    Saturation,
    Color,
    Luminosity,
    Add,
    Subtract,
}

impl std::fmt::Display for BlendMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

/// Video filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Filter {
    ColorCorrection {
        brightness: f32,
        contrast: f32,
        saturation: f32,
        hue: f32,
    },
    Sharpen { amount: f32 },
    Blur { radius: f32 },
    GaussianBlur { radius: f32 },
    MotionBlur { angle: f32, distance: f32 },
    Lut { path: String, intensity: f32 },
    Mask { path: String, inverted: bool },
    ChromaKey { 
        color: (u8, u8, u8), 
        similarity: f32, 
        smoothness: f32,
        spill: f32,
    },
    Noise { amount: f32 },
    Vignette { amount: f32, radius: f32 },
    Pixelate { size: u32 },
    Distortion { type_: DistortionType, amount: f32 },
    Border { 
        color: (u8, u8, u8, u8), 
        width: f32,
        radius: f32,
    },
    Shadow {
        color: (u8, u8, u8, u8),
        offset_x: f32,
        offset_y: f32,
        blur: f32,
    },
    Glow {
        color: (u8, u8, u8, u8),
        radius: f32,
        intensity: f32,
    },
}

/// Distortion types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DistortionType {
    Wave,
    Ripple,
    Bulge,
    Pinch,
    Twirl,
}

/// Layer mask
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerMask {
    pub path: String,
    pub inverted: bool,
    pub feather: f32,
}

/// Layer group
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerGroup {
    pub id: usize,
    pub name: String,
    pub layer_ids: Vec<usize>,
    pub collapsed: bool,
}

/// Output format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OutputFormat {
    Landscape { width: u32, height: u32 }, // 16:9
    Portrait { width: u32, height: u32 },  // 9:16
    Square { width: u32, height: u32 },    // 1:1
    Custom { width: u32, height: u32 },
}

/// Scene transition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneTransition {
    pub type_: TransitionType,
    pub duration_ms: u32,
    pub easing: TransitionEasing,
}

/// Transition types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransitionType {
    Cut,
    Fade,
    Slide { direction: SlideDirection },
    Zoom,
    Wipe { direction: WipeDirection },
    Dissolve,
    Iris { shape: IrisShape },
}

/// Slide direction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SlideDirection {
    Left,
    Right,
    Up,
    Down,
}

/// Wipe direction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WipeDirection {
    Left,
    Right,
    Up,
    Down,
    Clockwise,
    CounterClockwise,
}

/// Iris shape
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IrisShape {
    Circle,
    Square,
    Diamond,
    Star,
}

/// Transition easing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransitionEasing {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
    EaseInQuad,
    EaseOutQuad,
    EaseInOutQuad,
    EaseInCubic,
    EaseOutCubic,
    EaseInOutCubic,
}

/// Canvas outputs configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CanvasOutputs {
    pub dual_output_enabled: bool,
    pub landscape: Option<OutputFormat>,
    pub portrait: Option<OutputFormat>,
}

/// Composed frame
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposedFrame {
    pub scene_id: usize,
    pub layers: Vec<Layer>,
    pub output_format: OutputFormat,
    pub background_color: (u8, u8, u8, u8),
    pub timestamp: std::time::SystemTime,
}

/// Composition statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompositionStats {
    pub total_scenes: usize,
    pub active_scene_id: Option<usize>,
    pub total_layers: usize,
    pub total_layer_groups: usize,
    pub dual_output_enabled: bool,
}


/// Layer transform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerTransform {
    pub position: (f32, f32),
    pub size: (f32, f32),
    pub rotation: f32,
    pub anchor_point: (f32, f32),
}

/// Layer crop
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerCrop {
    pub top: f32,
    pub bottom: f32,
    pub left: f32,
    pub right: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_composition_engine_creation() {
        let engine = CompositionEngine::new().unwrap();
        let scenes = engine.scenes.lock().unwrap();
        assert_eq!(scenes.len(), 0);
    }

    #[test]
    fn test_scene() {
        let scene = Scene {
            id: 0,
            name: "Main Scene".to_string(),
            layers: HashMap::new(),
            layer_groups: HashMap::new(),
            output_format: OutputFormat::Landscape { width: 1920, height: 1080 },
            background_color: (0, 0, 0, 255),
            transition: None,
            created_at: std::time::SystemTime::now(),
        };

        assert_eq!(scene.name, "Main Scene");
        assert_eq!(scene.background_color, (0, 0, 0, 255));
    }

    #[test]
    fn test_layer() {
        let layer = Layer {
            id: 0,
            name: "Video Layer".to_string(),
            source: LayerSource::Capture { source_id: "screen".to_string() },
            visible: true,
            position: (0.0, 0.0),
            size: (1920.0, 1080.0),
            rotation: 0.0,
            opacity: 1.0,
            anchor_point: (0.5, 0.5),
            blend_mode: BlendMode::Normal,
            z_index: 0,
            filters: vec![],
            mask: None,
        };

        assert_eq!(layer.name, "Video Layer");
        assert!(layer.visible);
    }

    #[test]
    fn test_filter() {
        let filter = Filter::Blur { radius: 5.0 };
        match filter {
            Filter::Blur { radius } => assert_eq!(radius, 5.0),
            _ => panic!("Expected Blur filter"),
        }
    }

    #[test]
    fn test_blend_mode() {
        assert_eq!(BlendMode::Normal.to_string(), "Normal");
        assert_eq!(BlendMode::Add.to_string(), "Add");
        assert_eq!(BlendMode::Multiply.to_string(), "Multiply");
    }

    #[test]
    fn test_output_format() {
        let format = OutputFormat::Landscape {
            width: 1920,
            height: 1080,
        };

        match format {
            OutputFormat::Landscape { width, height } => {
                assert_eq!(width, 1920);
                assert_eq!(height, 1080);
            }
            _ => panic!("Expected Landscape format"),
        }
    }

    #[test]
    fn test_scene_transition() {
        let transition = SceneTransition {
            type_: TransitionType::Fade,
            duration_ms: 500,
            easing: TransitionEasing::EaseInOut,
        };

        assert_eq!(transition.duration_ms, 500);
    }
}
