use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// VTubing engine for .VRM and Live2D support with face tracking
pub struct VtuberEngine {
    is_active: Arc<Mutex<bool>>,
    models: Arc<Mutex<HashMap<usize, VtuberModel>>>,
    active_model_id: Arc<Mutex<Option<usize>>>,
    next_model_id: Arc<Mutex<usize>>,
    face_tracker: Arc<Mutex<Option<FaceTracker>>>,
    webcam_source: Arc<Mutex<Option<String>>>,
}

impl VtuberEngine {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            is_active: Arc::new(Mutex::new(false)),
            models: Arc::new(Mutex::new(HashMap::new())),
            active_model_id: Arc::new(Mutex::new(None)),
            next_model_id: Arc::new(Mutex::new(0)),
            face_tracker: Arc::new(Mutex::new(None)),
            webcam_source: Arc::new(Mutex::new(None)),
        })
    }

    /// Load a VRM model
    pub fn load_vrm_model(&self, path: String, name: String) -> Result<VtuberModel, String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let mut next_id = self.next_model_id.lock().map_err(|e| e.to_string())?;
        
        let model_id = *next_id;
        *next_id += 1;

        let model = VtuberModel {
            id: model_id,
            name,
            path: path.clone(),
            model_type: VtuberModelType::VRM,
            is_loaded: true,
            parameters: HashMap::new(),
            animations: HashMap::new(),
            expressions: HashMap::new(),
            current_expression: None,
            scale: 1.0,
            position: (0.0, 0.0),
            rotation: 0.0,
            visible: true,
            tracking_enabled: false,
            blend_shapes: HashMap::new(),
            bones: HashMap::new(),
        };

        models.insert(model_id, model.clone());
        Ok(model)
    }

    /// Load a Live2D model
    pub fn load_live2d_model(&self, path: String, name: String) -> Result<VtuberModel, String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let mut next_id = self.next_model_id.lock().map_err(|e| e.to_string())?;
        
        let model_id = *next_id;
        *next_id += 1;

        let model = VtuberModel {
            id: model_id,
            name,
            path: path.clone(),
            model_type: VtuberModelType::Live2D,
            is_loaded: true,
            parameters: HashMap::new(),
            animations: HashMap::new(),
            expressions: HashMap::new(),
            current_expression: None,
            scale: 1.0,
            position: (0.0, 0.0),
            rotation: 0.0,
            visible: true,
            tracking_enabled: false,
            blend_shapes: HashMap::new(),
            bones: HashMap::new(),
        };

        models.insert(model_id, model.clone());
        Ok(model)
    }

    /// Unload a model
    pub fn unload_model(&self, model_id: usize) -> Result<(), String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let mut active_id = self.active_model_id.lock().map_err(|e| e.to_string())?;
        
        if let Some(current) = *active_id {
            if current == model_id {
                *active_id = None;
            }
        }
        
        models.remove(&model_id).ok_or("Model not found")?;
        Ok(())
    }

    /// Get all loaded models
    pub fn get_models(&self) -> Result<Vec<VtuberModel>, String> {
        let models = self.models.lock().map_err(|e| e.to_string())?;
        Ok(models.values().cloned().collect())
    }

    /// Get a specific model
    pub fn get_model(&self, model_id: usize) -> Result<VtuberModel, String> {
        let models = self.models.lock().map_err(|e| e.to_string())?;
        models.get(&model_id).cloned().ok_or("Model not found".to_string())
    }

    /// Set active model
    pub fn set_active_model(&self, model_id: usize) -> Result<(), String> {
        let models = self.models.lock().map_err(|e| e.to_string())?;
        if !models.contains_key(&model_id) {
            return Err("Model not found".to_string());
        }
        
        let mut active_id = self.active_model_id.lock().map_err(|e| e.to_string())?;
        *active_id = Some(model_id);
        Ok(())
    }

    /// Get active model
    pub fn get_active_model(&self) -> Result<Option<VtuberModel>, String> {
        let active_id = self.active_model_id.lock().map_err(|e| e.to_string())?;
        if let Some(id) = *active_id {
            let models = self.models.lock().map_err(|e| e.to_string())?;
            Ok(models.get(&id).cloned())
        } else {
            Ok(None)
        }
    }

    /// Update model transform
    pub fn update_model_transform(&self, model_id: usize, scale: f32, position: (f32, f32), rotation: f32) -> Result<(), String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get_mut(&model_id).ok_or("Model not found")?;
        
        model.scale = scale;
        model.position = position;
        model.rotation = rotation;
        
        Ok(())
    }

    /// Set model visibility
    pub fn set_model_visibility(&self, model_id: usize, visible: bool) -> Result<(), String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get_mut(&model_id).ok_or("Model not found")?;
        
        model.visible = visible;
        Ok(())
    }

    /// Set model expression
    pub fn set_expression(&self, model_id: usize, expression_name: String) -> Result<(), String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get_mut(&model_id).ok_or("Model not found")?;
        
        if !model.expressions.contains_key(&expression_name) {
            return Err("Expression not found".to_string());
        }
        
        model.current_expression = Some(expression_name);
        Ok(())
    }

    /// Get model expressions
    pub fn get_expressions(&self, model_id: usize) -> Result<Vec<String>, String> {
        let models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get(&model_id).ok_or("Model not found")?;
        
        Ok(model.expressions.keys().cloned().collect())
    }

    /// Update blend shape parameter
    pub fn update_blend_shape(&self, model_id: usize, shape_name: String, value: f32) -> Result<(), String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get_mut(&model_id).ok_or("Model not found")?;
        
        model.blend_shapes.insert(shape_name, value);
        Ok(())
    }

    /// Get blend shapes
    pub fn get_blend_shapes(&self, model_id: usize) -> Result<HashMap<String, f32>, String> {
        let models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get(&model_id).ok_or("Model not found")?;
        
        Ok(model.blend_shapes.clone())
    }

    /// Update bone transform
    pub fn update_bone(&self, model_id: usize, bone_name: String, transform: BoneTransform) -> Result<(), String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get_mut(&model_id).ok_or("Model not found")?;
        
        model.bones.insert(bone_name, transform);
        Ok(())
    }

    /// Get bones
    pub fn get_bones(&self, model_id: usize) -> Result<HashMap<String, BoneTransform>, String> {
        let models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get(&model_id).ok_or("Model not found")?;
        
        Ok(model.bones.clone())
    }

    /// Initialize face tracking
    pub fn initialize_face_tracking(&self, webcam_device_id: String) -> Result<(), String> {
        let mut webcam_source = self.webcam_source.lock().map_err(|e| e.to_string())?;
        *webcam_source = Some(webcam_device_id);
        
        let mut tracker = self.face_tracker.lock().map_err(|e| e.to_string())?;
        *tracker = Some(FaceTracker {
            is_active: true,
            confidence_threshold: 0.7,
            smoothing_factor: 0.5,
            tracking_features: vec![
                TrackingFeature::HeadRotation,
                TrackingFeature::EyeGaze,
                TrackingFeature::Mouth,
                TrackingFeature::Eyebrows,
                TrackingFeature::Blink,
            ],
        });
        
        Ok(())
    }

    /// Stop face tracking
    pub fn stop_face_tracking(&self) -> Result<(), String> {
        let mut tracker = self.face_tracker.lock().map_err(|e| e.to_string())?;
        *tracker = None;
        
        let mut webcam_source = self.webcam_source.lock().map_err(|e| e.to_string())?;
        *webcam_source = None;
        
        Ok(())
    }

    /// Enable tracking for model
    pub fn enable_tracking(&self, model_id: usize) -> Result<(), String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get_mut(&model_id).ok_or("Model not found")?;
        
        model.tracking_enabled = true;
        Ok(())
    }

    /// Disable tracking for model
    pub fn disable_tracking(&self, model_id: usize) -> Result<(), String> {
        let mut models = self.models.lock().map_err(|e| e.to_string())?;
        let model = models.get_mut(&model_id).ok_or("Model not found")?;
        
        model.tracking_enabled = false;
        Ok(())
    }

    /// Get face tracking data
    pub fn get_face_tracking_data(&self) -> Result<Option<FaceTrackingData>, String> {
        let tracker = self.face_tracker.lock().map_err(|e| e.to_string())?;
        
        if tracker.is_some() {
            Ok(Some(FaceTrackingData {
                head_rotation: (0.0, 0.0, 0.0),
                head_position: (0.0, 0.0, 0.0),
                left_eye_gaze: (0.0, 0.0),
                right_eye_gaze: (0.0, 0.0),
                mouth_open: 0.0,
                mouth_shape: MouthShape::Neutral,
                left_eyebrow: 0.0,
                right_eyebrow: 0.0,
                left_blink: 0.0,
                right_blink: 0.0,
                confidence: 0.95,
                timestamp: std::time::SystemTime::now(),
            }))
        } else {
            Ok(None)
        }
    }

    /// Set tracking confidence threshold
    pub fn set_tracking_confidence(&self, threshold: f32) -> Result<(), String> {
        let mut tracker = self.face_tracker.lock().map_err(|e| e.to_string())?;
        
        if let Some(ref mut t) = *tracker {
            t.confidence_threshold = threshold;
        }
        
        Ok(())
    }

    /// Set tracking smoothing factor
    pub fn set_tracking_smoothing(&self, smoothing: f32) -> Result<(), String> {
        let mut tracker = self.face_tracker.lock().map_err(|e| e.to_string())?;
        
        if let Some(ref mut t) = *tracker {
            t.smoothing_factor = smoothing;
        }
        
        Ok(())
    }

    /// Enable/disable tracking feature
    pub fn set_tracking_feature(&self, feature: TrackingFeature, enabled: bool) -> Result<(), String> {
        let mut tracker = self.face_tracker.lock().map_err(|e| e.to_string())?;
        
        if let Some(ref mut t) = *tracker {
            if enabled {
                if !t.tracking_features.contains(&feature) {
                    t.tracking_features.push(feature);
                }
            } else {
                t.tracking_features.retain(|f| f != &feature);
            }
        }
        
        Ok(())
    }

    /// Get VTuber engine statistics
    pub fn get_vtuber_stats(&self) -> Result<VtuberStats, String> {
        let models = self.models.lock().map_err(|e| e.to_string())?;
        let active_id = self.active_model_id.lock().map_err(|e| e.to_string())?;
        let tracker = self.face_tracker.lock().map_err(|e| e.to_string())?;
        
        Ok(VtuberStats {
            total_models: models.len(),
            active_model_id: *active_id,
            face_tracking_enabled: tracker.is_some(),
            webcam_source: self.webcam_source.lock().map_err(|e| e.to_string())?.clone(),
        })
    }
}

/// VTuber model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VtuberModel {
    pub id: usize,
    pub name: String,
    pub path: String,
    pub model_type: VtuberModelType,
    pub is_loaded: bool,
    pub parameters: HashMap<String, f32>,
    pub animations: HashMap<String, Animation>,
    pub expressions: HashMap<String, Expression>,
    pub current_expression: Option<String>,
    pub scale: f32,
    pub position: (f32, f32),
    pub rotation: f32,
    pub visible: bool,
    pub tracking_enabled: bool,
    pub blend_shapes: HashMap<String, f32>,
    pub bones: HashMap<String, BoneTransform>,
}

/// VTuber model type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum VtuberModelType {
    VRM,
    Live2D,
}

/// Animation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub name: String,
    pub duration_ms: u32,
    pub looped: bool,
}

/// Expression
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expression {
    pub name: String,
    pub blend_shapes: HashMap<String, f32>,
    pub parameters: HashMap<String, f32>,
}

/// Bone transform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoneTransform {
    pub position: (f32, f32, f32),
    pub rotation: (f32, f32, f32),
    pub scale: (f32, f32, f32),
}

/// Face tracker
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceTracker {
    pub is_active: bool,
    pub confidence_threshold: f32,
    pub smoothing_factor: f32,
    pub tracking_features: Vec<TrackingFeature>,
}

/// Tracking features
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TrackingFeature {
    HeadRotation,
    HeadPosition,
    EyeGaze,
    Mouth,
    Eyebrows,
    Blink,
    Cheeks,
    Nose,
}

/// Face tracking data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceTrackingData {
    pub head_rotation: (f32, f32, f32), // pitch, yaw, roll
    pub head_position: (f32, f32, f32),
    pub left_eye_gaze: (f32, f32),
    pub right_eye_gaze: (f32, f32),
    pub mouth_open: f32,
    pub mouth_shape: MouthShape,
    pub left_eyebrow: f32,
    pub right_eyebrow: f32,
    pub left_blink: f32,
    pub right_blink: f32,
    pub confidence: f32,
    pub timestamp: std::time::SystemTime,
}

/// Mouth shape
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MouthShape {
    Neutral,
    A,
    I,
    U,
    E,
    O,
    Smile,
    Sad,
    Angry,
    Surprised,
}

/// VTuber statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VtuberStats {
    pub total_models: usize,
    pub active_model_id: Option<usize>,
    pub face_tracking_enabled: bool,
    pub webcam_source: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vtuber_engine_creation() {
        let engine = VtuberEngine::new();
        assert_eq!(engine.models.len(), 0);
    }

    #[test]
    fn test_vtuber_model() {
        let model = VtuberModel {
            id: 0,
            name: "Test Model".to_string(),
            model_type: VtuberModelType::Live2D,
            file_path: "/path/to/model.json".to_string(),
            enabled: true,
        };

        assert_eq!(model.name, "Test Model");
        assert_eq!(model.model_type, VtuberModelType::Live2D);
    }

    #[test]
    fn test_animation() {
        let animation = Animation {
            name: "Idle".to_string(),
            duration_ms: 1000,
            loopable: true,
            blend_mode: BlendMode::Normal,
        };

        assert_eq!(animation.name, "Idle");
        assert!(animation.loopable);
    }

    #[test]
    fn test_expression() {
        let expression = Expression {
            name: "Happy".to_string(),
            intensity: 0.8,
            transition_duration_ms: 200,
        };

        assert_eq!(expression.name, "Happy");
        assert_eq!(expression.intensity, 0.8);
    }

    #[test]
    fn test_face_tracking_data() {
        let data = FaceTrackingData {
            head_rotation_x: 0.0,
            head_rotation_y: 0.0,
            head_rotation_z: 0.0,
            mouth_openness: 0.0,
            left_eyebrow: 0.0,
            right_eyebrow: 0.0,
            left_blink: 0.0,
            right_blink: 0.0,
            confidence: 0.95,
            timestamp: std::time::SystemTime::now(),
        };

        assert_eq!(data.confidence, 0.95);
    }

    #[test]
    fn test_mouth_shape() {
        let shape = MouthShape::Smile;
        assert_eq!(shape, MouthShape::Smile);
    }

    #[test]
    fn test_vtuber_model_type() {
        assert_eq!(VtuberModelType::Live2D.to_string(), "Live2D");
        assert_eq!(VtuberModelType::VRM.to_string(), "VRM");
    }
}
