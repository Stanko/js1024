float blob(vec3 p, float radius) {
  float baseDist = length(p) - radius;
  float displacement = sin(1.3 * p.x) * sin(1.3 * p.y) * sin(1.3 * p.z);

  // Return a shell of a displaced sphere
  return abs(baseDist + displacement) - 0.02;
}

float smin(float a, float b) {
  float k = 0.4; // Smoothness factor
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float scene(vec3 p) {
  float t = iTime;
  float time = (t * 0.8) + (sin(t) * 0.4);
  // Cache values to save a few characters
  float sinTime = sin(time) * 0.8;
  float cosTime = cos(time) * 0.8;

  // Metaballs
  float dist = blob(p - vec3(-sinTime * 0.3, cosTime, 0.0), 0.65);
  dist = smin(dist, blob(p - vec3(sinTime, cosTime * 0.4, sinTime * 0.4), 0.55));
  dist = smin(dist, blob(p - vec3(cosTime, cos(time * 0.5), 0.0), 0.35));
  dist = smin(dist, blob(p - vec3(-cosTime, sinTime, 0.3), 0.45));

  // Infinite boxes
  p.y = mod(p.y + 0.14 + sinTime * 0.1, 0.14);

  vec3 bounds = vec3(9.0, 0.07, 9.0);
  vec3 surface = abs(p) - bounds;
  float boxDist = length(max(surface, 0.0)) + min(max(surface.x, max(surface.y, surface.z)), 0.0);

  // Intersection of metaballs and boxes
  return max(dist, boxDist);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Alias for iResolution for minifying
  vec2 resolution = iResolution;

  // Pseudo random value used for the noisy texture and camera position
  float n = fract(sin(dot(fragCoord, vec2(12.9, 78.2))) * 378.5);

  // Camera setup
  // Camera position is animated for some pixels to create noise
  vec3 cameraOrigin = vec3(0, sin(n) * 0.25, 3);
  vec3 viewDir = normalize(-cameraOrigin);
  vec3 cameraRight = normalize(cross(vec3(0.0, 1.0, 0.0), viewDir));
  vec3 cameraUp = cross(viewDir, cameraRight);
  // Map pixel coordinates to [-0.5, 0.5] range
  vec2 uv = (fragCoord - 0.5 * resolution) / resolution.y;

  vec3 rayDir = normalize(uv.x * cameraRight + uv.y * cameraUp + viewDir);

  // Raymarching loop
  float travel = 0.0;
  float hitDistance = -1.0;
  vec3 hitPoint;
  float distToSurface;

  for(int i = 0; i < 99; i++) {
    hitPoint = cameraOrigin + travel * rayDir;
    distToSurface = scene(hitPoint);

    if(hitDistance < 0.0 && distToSurface < 0.001) {
      hitDistance = travel;
      break;
    }

    travel += distToSurface;

    // Miss
    if(travel > 99.9) {
      break;
    }
  }

  // Lighting
  vec3 lightDir = vec3(0.4, 0.6, 0.7);
  vec2 eps = vec2(0.001, 0.0);
  vec3 normal = normalize(vec3(scene(hitPoint + eps.xyy) - distToSurface, scene(hitPoint + eps.yxy) - distToSurface, scene(hitPoint + eps.yyx) - distToSurface));

  float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);
  float lighting = diffuse * diffuse;

  vec3 color = hitDistance > 0.0 ? vec3(0.25 + lighting * 0.75, 0.2 + lighting * 0.8, 0.3 + lighting * 0.7) : vec3(float(n > 0.992));
  fragColor = vec4(color + vec3(n > 0.8 ? -0.3 : 0.0), 1.0);
}
