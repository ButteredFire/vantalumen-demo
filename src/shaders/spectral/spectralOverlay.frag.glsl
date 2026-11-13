// Fragment shader logic for blending between Optical RGB, Thermal IR (THEMIS), and MOLA Elevation modes
uniform sampler2D uAlbedoMap;
uniform sampler2D uThermalMap;
uniform sampler2D uMolaMap;
uniform float uThermalMix;
uniform float uMolaMix;

varying vec2 vUv;

void main() {
  vec4 rgbTex = texture2D(uAlbedoMap, vUv);
  vec4 irTex = texture2D(uThermalMap, vUv);
  vec4 molaTex = texture2D(uMolaMap, vUv);

  vec3 finalColor = mix(rgbTex.rgb, irTex.rgb, clamp(uThermalMix, 0.0, 1.0));
  finalColor = mix(finalColor, molaTex.rgb, clamp(uMolaMix, 0.0, 1.0));

  gl_FragColor = vec4(finalColor, 1.0);
}
