#include <common>
#include <logdepthbuf_pars_fragment>

uniform float uTime;
uniform float uWarpFactor;
uniform vec3 uAccentColor;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

void main() {
  #include <logdepthbuf_fragment>

  vec2 uv = vUv - 0.5;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  float streakGrid = floor((angle + 3.14159265) * 48.0);
  float seed = hash21(vec2(streakGrid, 12.7));
  float speed = (0.4 + seed * 1.2) * (1.0 + uWarpFactor * 4.5);

  float radialWave = fract(dist * 2.5 - uTime * speed + seed);
  float streak = smoothstep(0.08, 0.0, abs(radialWave - 0.5)) * smoothstep(0.08, 0.45, dist);

  vec3 col = mix(vec3(0.45, 0.68, 1.0), uAccentColor, seed) * streak * uWarpFactor;
  float alpha = clamp(streak * uWarpFactor * 0.75, 0.0, 0.85);

  gl_FragColor = vec4(col, alpha);
}
