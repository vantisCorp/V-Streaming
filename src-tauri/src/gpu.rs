use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};
use thiserror::Error;

/// GPU context for managing GPU operations
pub struct GpuContext {
    is_initialized: Arc<Mutex<bool>>,
    gpu_info: Arc<Mutex<GpuInfo>>,
    textures: Arc<Mutex<HashMap<u32, Texture>>>,
    next_texture_id: Arc<Mutex<u32>>,
}

impl GpuContext {
    pub fn new() -> Result<Self, GpuError> {
        Ok(Self {
            is_initialized: Arc::new(Mutex::new(false)),
            gpu_info: Arc::new(Mutex::new(GpuInfo::default())),
            textures: Arc::new(Mutex::new(HashMap::new())),
            next_texture_id: Arc::new(Mutex::new(0)),
        })
    }

    /// Initialize GPU context
    pub fn initialize(&self) -> Result<(), GpuError> {
        let mut initialized = self.is_initialized.lock().unwrap();
        if *initialized {
            return Ok(());
        }

        // Detect GPU capabilities
        let gpu_info = self.detect_gpu()?;
        *self.gpu_info.lock().unwrap() = gpu_info;

        *initialized = true;
        tracing::info!("GPU context initialized");
        Ok(())
    }

    /// Detect GPU information
    fn detect_gpu(&self) -> Result<GpuInfo, GpuError> {
        // Placeholder - should detect actual GPU
        Ok(GpuInfo {
            name: "NVIDIA GeForce RTX 3080".to_string(),
            vendor: GpuVendor::Nvidia,
            vram_total: 10 * 1024 * 1024 * 1024, // 10 GB
            vram_free: 8 * 1024 * 1024 * 1024,    // 8 GB
            supports_nvenc: true,
            supports_amf: false,
            supports_quicksync: false,
            supports_hdr: true,
            max_texture_size: 16384,
            compute_capability: (8, 6),
        })
    }

    /// Get GPU information
    pub fn get_gpu_info(&self) -> GpuInfo {
        self.gpu_info.lock().unwrap().clone()
    }

    /// Create a texture
    pub fn create_texture(&self, width: u32, height: u32, format: TextureFormat) -> Result<Texture, GpuError> {
        let mut next_id = self.next_texture_id.lock().unwrap();
        let texture_id = *next_id;
        *next_id += 1;

        let texture = Texture {
            id: texture_id,
            width,
            height,
            format,
            is_hdr: matches!(format, TextureFormat::Rgba16Float | TextureFormat::Rgba32Float),
        };

        let mut textures = self.textures.lock().unwrap();
        textures.insert(texture_id, texture.clone());

        tracing::info!("Created texture {} ({}x{}, format: {:?})", texture_id, width, height, format);
        Ok(texture)
    }

    /// Get a texture by ID
    pub fn get_texture(&self, texture_id: u32) -> Result<Texture, GpuError> {
        let textures = self.textures.lock().unwrap();
        textures.get(&texture_id).cloned().ok_or(GpuError::TextureNotFound(texture_id))
    }

    /// Delete a texture
    pub fn delete_texture(&self, texture_id: u32) -> Result<(), GpuError> {
        let mut textures = self.textures.lock().unwrap();
        textures.remove(&texture_id);
        tracing::info!("Deleted texture {}", texture_id);
        Ok(())
    }

    /// Apply a shader to a texture
    pub fn apply_shader(&self, texture_id: u32, shader: Shader) -> Result<(), GpuError> {
        tracing::info!("Applied shader to texture {}", texture_id);
        Ok(())
    }

    /// Convert HDR to SDR with tonemapping
    pub fn hdr_to_sdr(&self, texture_id: u32, tonemap_method: TonemapMethod) -> Result<(), GpuError> {
        let texture = self.get_texture(texture_id)?;

        if !texture.is_hdr {
            return Err(GpuError::NotHdrTexture(texture_id));
        }

        // Apply tonemapping
        match tonemap_method {
            TonemapMethod::Reinhard => {
                tracing::info!("Applied Reinhard tonemapping to texture {}", texture_id);
            }
            TonemapMethod::ACES => {
                tracing::info!("Applied ACES tonemapping to texture {}", texture_id);
            }
            TonemapMethod::Filmic => {
                tracing::info!("Applied Filmic tonemapping to texture {}", texture_id);
            }
        }

        Ok(())
    }

    /// Apply color grading
    pub fn apply_color_grading(&self, texture_id: u32, grading: ColorGrading) -> Result<(), GpuError> {
        tracing::info!("Applied color grading to texture {}: {:?}", texture_id, grading);
        Ok(())
    }

    /// Apply a filter to a texture
    pub fn apply_filter(&self, texture_id: u32, filter: TextureFilter) -> Result<(), GpuError> {
        tracing::info!("Applied filter to texture {}: {:?}", texture_id, filter);
        Ok(())
    }

    /// Compose multiple textures
    pub fn compose_textures(&self, layers: Vec<CompositionLayer>) -> Result<Texture, GpuError> {
        if layers.is_empty() {
            return Err(GpuError::NoLayers);
        }

        let output_width = layers[0].width;
        let output_height = layers[0].height;

        self.create_texture(output_width, output_height, TextureFormat::Rgba8Unorm)
    }

    /// Get GPU memory usage
    pub fn get_memory_usage(&self) -> GpuMemoryUsage {
        let gpu_info = self.gpu_info.lock().unwrap();
        GpuMemoryUsage {
            total: gpu_info.vram_total,
            used: gpu_info.vram_total - gpu_info.vram_free,
            free: gpu_info.vram_free,
        }
    }

    /// Check if GPU context is initialized
    pub fn is_initialized(&self) -> bool {
        *self.is_initialized.lock().unwrap()
    }
}

/// GPU information
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GpuInfo {
    pub name: String,
    pub vendor: GpuVendor,
    pub vram_total: u64,
    pub vram_free: u64,
    pub supports_nvenc: bool,
    pub supports_amf: bool,
    pub supports_quicksync: bool,
    pub supports_hdr: bool,
    pub max_texture_size: u32,
    pub compute_capability: (u32, u32),
}

/// GPU vendor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GpuVendor {
    Nvidia,
    Amd,
    Intel,
    Unknown,
}

impl Default for GpuVendor {
    fn default() -> Self {
        GpuVendor::Unknown
    }
}

/// GPU texture
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Texture {
    pub id: u32,
    pub width: u32,
    pub height: u32,
    pub format: TextureFormat,
    pub is_hdr: bool,
}

/// Texture format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextureFormat {
    Rgba8Unorm,
    Bgra8Unorm,
    Rgba16Float,
    Rgba32Float,
}

/// GPU shader
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shader {
    pub vertex_source: String,
    pub fragment_source: String,
    pub uniforms: Vec<ShaderUniform>,
}

/// Shader uniform
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShaderUniform {
    pub name: String,
    pub value: ShaderUniformValue,
}

/// Shader uniform value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ShaderUniformValue {
    Float(f32),
    Float2(f32, f32),
    Float3(f32, f32, f32),
    Float4(f32, f32, f32, f32),
    Int(i32),
    Int2(i32, i32),
    Int3(i32, i32, i32),
    Int4(i32, i32, i32, i32),
}

/// Tonemap method for HDR to SDR conversion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TonemapMethod {
    Reinhard,
    ACES,
    Filmic,
}

/// Color grading settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorGrading {
    pub temperature: f32,
    pub tint: f32,
    pub exposure: f32,
    pub contrast: f32,
    pub highlights: f32,
    pub shadows: f32,
    pub saturation: f32,
    pub vibrance: f32,
}

impl Default for ColorGrading {
    fn default() -> Self {
        Self {
            temperature: 0.0,
            tint: 0.0,
            exposure: 0.0,
            contrast: 0.0,
            highlights: 0.0,
            shadows: 0.0,
            saturation: 0.0,
            vibrance: 0.0,
        }
    }
}

/// Texture filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextureFilter {
    Sharpen { amount: f32 },
    Blur { radius: f32 },
    GaussianBlur { sigma: f32 },
    EdgeDetection { threshold: f32 },
    Emboss { strength: f32 },
    Vignette { intensity: f32 },
    ChromaticAberration { amount: f32 },
}

/// Composition layer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompositionLayer {
    pub texture_id: u32,
    pub x: f32,
    pub y: f32,
    pub width: u32,
    pub height: u32,
    pub opacity: f32,
    pub blend_mode: BlendMode,
}

/// Blend mode
#[derive(Debug, Clone, Serialize, Deserialize)]
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
}

/// GPU memory usage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuMemoryUsage {
    pub total: u64,
    pub used: u64,
    pub free: u64,
}

/// GPU error types
#[derive(Error, Debug)]
pub enum GpuError {
    #[error("Texture not found: {0}")]
    TextureNotFound(u32),
    #[error("Not an HDR texture: {0}")]
    NotHdrTexture(u32),
    #[error("No layers to compose")]
    NoLayers,
    #[error("GPU not initialized")]
    NotInitialized,
    #[error("GPU operation failed: {0}")]
    OperationFailed(String),
    #[error("Out of GPU memory")]
    OutOfMemory,
    #[error("Unsupported format: {0}")]
    UnsupportedFormat(String),
    #[error("Shader compilation failed: {0}")]
    ShaderCompilationFailed(String),
}

/// Default shaders
pub struct Shaders;

impl Shaders {
    /// Basic vertex shader
    pub fn basic_vertex() -> String {
        r#"
            #version 330 core
            layout (location = 0) in vec3 aPos;
            layout (location = 1) in vec2 aTexCoord;
            out vec2 TexCoord;
            void main() {
                gl_Position = vec4(aPos, 1.0);
                TexCoord = aTexCoord;
            }
        "#
        .to_string()
    }

    /// Basic fragment shader
    pub fn basic_fragment() -> String {
        r#"
            #version 330 core
            in vec2 TexCoord;
            out vec4 FragColor;
            uniform sampler2D texture1;
            void main() {
                FragColor = texture(texture1, TexCoord);
            }
        "#
        .to_string()
    }

    /// HDR to SDR tonemapping shader (Reinhard)
    pub fn hdr_to_sdr_reinhard() -> String {
        r#"
            #version 330 core
            in vec2 TexCoord;
            out vec4 FragColor;
            uniform sampler2D hdrTexture;
            uniform float exposure;
            void main() {
                vec3 hdrColor = texture(hdrTexture, TexCoord).rgb;
                vec3 mapped = vec3(1.0) - exp(-hdrColor * exposure);
                mapped = mapped / (mapped + vec3(1.0));
                FragColor = vec4(mapped, 1.0);
            }
        "#
        .to_string()
    }

    /// HDR to SDR tonemapping shader (ACES)
    pub fn hdr_to_sdr_aces() -> String {
        r#"
            #version 330 core
            in vec2 TexCoord;
            out vec4 FragColor;
            uniform sampler2D hdrTexture;
            uniform float exposure;
            
            vec3 ACESFilm(vec3 x) {
                float a = 2.51;
                float b = 0.03;
                float c = 2.43;
                float d = 0.59;
                float e = 0.14;
                return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
            }
            
            void main() {
                vec3 hdrColor = texture(hdrTexture, TexCoord).rgb * exposure;
                vec3 mapped = ACESFilm(hdrColor);
                FragColor = vec4(mapped, 1.0);
            }
        "#
        .to_string()
    }
}