#include <common>
#include <logdepthbuf_pars_fragment>

uniform vec3 uSunDirection;
uniform vec3 uRayleighColor;
uniform vec3 uMieDustColor;
uniform float uAtmosphereIntensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDirection;

void main() {
  #include <logdepthbuf_fragment>

  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(vViewDirection);
  vec3 sunDir = normalize(uSunDirection);

  // Fresnel limb factor for back-face / outer atmospheric shell
  float viewDot = abs(dot(normal, viewDir));
  float rim = pow(clamp(1.0 - viewDot, 0.0, 1.0), 2.8);

  // Day-to-terminator illumination factor
  float sunOrientation = dot(normal, sunDir);
  float daySide = smoothstep(-0.35, 0.55, sunOrientation);
  float twilightZone = smoothstep(-0.4, 0.05, sunOrientation) * (1.0 - smoothstep(0.05, 0.5, sunOrientation));

  // Forward Mie scattering for fine iron-oxide Martian dust
  float cosTheta = dot(-viewDir, sunDir);
  float g = 0.62;
  float miePhase = (1.0 - g * g) / (4.0 * 3.14159265 * pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5));

  vec3 scatterColor = mix(uRayleighColor, uMieDustColor, clamp(twilightZone * 1.4 + rim * 0.6, 0.0, 1.0));
  scatterColor += uMieDustColor * miePhase * 0.35;

  float alpha = rim * (daySide * 0.88 + 0.12) * uAtmosphereIntensity;
  gl_FragColor = vec4(scatterColor * alpha * 1.4, clamp(alpha, 0.0, 0.92));
}
