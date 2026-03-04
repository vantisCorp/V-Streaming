#!/bin/bash

# V-Streaming SDK Generator Script
# This script generates client SDKs from the OpenAPI specification

set -e

OPENAPI_FILE="docs/api/openapi.yaml"
OUTPUT_DIR="docs/api/generated-sdks"

echo "🚀 V-Streaming SDK Generator"
echo "============================"

# Check if openapi-generator-cli is installed
if ! command -v openapi-generator-cli &> /dev/null; then
    echo "❌ openapi-generator-cli not found"
    echo "Please install it: npm install -g @openapitools/openapi-generator-cli"
    exit 1
fi

# Create output directory
mkdir -p $OUTPUT_DIR

# Generate TypeScript SDK
echo ""
echo "📦 Generating TypeScript SDK..."
openapi-generator-cli generate \
    -i $OPENAPI_FILE \
    -g typescript-axios \
    -o $OUTPUT_DIR/typescript \
    --additional-properties=npmName=v-streaming-api,npmVersion=0.1.0

echo "✅ TypeScript SDK generated at $OUTPUT_DIR/typescript"

# Generate Python SDK
echo ""
echo "📦 Generating Python SDK..."
openapi-generator-cli generate \
    -i $OPENAPI_FILE \
    -g python \
    -o $OUTPUT_DIR/python \
    --additional-properties=packageName=v_streaming_api,packageVersion=0.1.0

echo "✅ Python SDK generated at $OUTPUT_DIR/python"

# Generate Rust SDK
echo ""
echo "📦 Generating Rust SDK..."
openapi-generator-cli generate \
    -i $OPENAPI_FILE \
    -g rust \
    -o $OUTPUT_DIR/rust \
    --additional-properties=packageName=v-streaming-api,packageVersion=0.1.0

echo "✅ Rust SDK generated at $OUTPUT_DIR/rust"

echo ""
echo "🎉 All SDKs generated successfully!"
echo "Location: $OUTPUT_DIR"