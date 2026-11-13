#include <common>
#include <logdepthbuf_pars_vertex>

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDirection;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vViewDirection = normalize(cameraPosition - worldPosition.xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
  #include <logdepthbuf_vertex>
}
