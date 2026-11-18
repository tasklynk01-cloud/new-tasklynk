"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * TaskLynk High-Performance Laser-Fine 3D Silk Micro-Filament Engine
 * Optimized for lightning-fast initial paint, zero-lag 60 FPS GPU rendering & low memory footprint.
 */

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_is_dark;
  uniform float u_mode; // 0.0 = Hero, 1.0 = Purple Section, 2.0 = Light Section, 3.0 = Dark Footer
  varying vec2 v_uv;

  // 3D Rolling Surface Height Function Z(X, Y, t) - Optimized for 60fps
  float getSurfaceHeight(vec2 p, float t, vec2 mouse) {
    float w1 = sin(p.x * 2.6 + p.y * 1.9 - t * 1.2) * 0.36;
    float w2 = cos(p.x * 4.6 - p.y * 2.8 + t * 0.95) * 0.18;
    float w3 = sin(p.x * 8.2 + p.y * 5.6 - t * 1.5) * 0.09;
    return w1 + w2 + w3;
  }

  void main() {
    vec2 uv = v_uv;
    uv.y = 1.0 - uv.y;

    float t = u_time * 0.60;

    // 3D Perspective Oblique Camera Mapping
    vec2 p3D;
    if (u_mode > 2.5) {
      // Dark Footer Wave: Smooth sweeping horizon across the footer base
      p3D.x = (uv.x - 0.5) * 4.6 + sin(uv.y * 2.2) * 0.4;
      p3D.y = uv.y * 3.0 + (uv.x - 0.5) * 0.9;
    } else if (u_mode > 0.5 && u_mode < 1.5) {
      // Royal Purple Section
      p3D.x = (uv.x - 0.5) * 4.8 + sin(uv.y * 2.0) * 0.5;
      p3D.y = uv.y * 3.2 + (uv.x - 0.5) * 1.2;
    } else if (u_mode >= 1.5 && u_mode <= 2.5) {
      // Light Section Wave
      p3D.x = (uv.x - 0.5) * 4.2 + (uv.y - 0.5) * 1.4;
      p3D.y = uv.y * 3.4 + (uv.x - 0.5) * 0.8;
    } else {
      // Primary Hero Wave
      p3D.x = (uv.x - 0.55) * 4.4 + (uv.y - 0.4) * 1.5;
      p3D.y = uv.y * 3.8 + (uv.x - 0.5) * 0.8;
    }

    float h = getSurfaceHeight(p3D, t, u_mouse);

    // 3D Surface Normal for physical lighting
    float eps = 0.008;
    float hR = getSurfaceHeight(p3D + vec2(eps, 0.0), t, u_mouse);
    float hU = getSurfaceHeight(p3D + vec2(0.0, eps), t, u_mouse);
    vec3 N = normalize(vec3(-(hR - h) / eps * 0.7, -(hU - h) / eps * 0.7, 1.0));

    // High-density 3D Micro-lines
    float coord1 = (p3D.x * 42.0 + h * 28.0 + p3D.y * 8.0);
    float coord2 = (p3D.x * 110.0 + h * 70.0 + p3D.y * 20.0);
    float coord3 = (p3D.x * 260.0 + h * 150.0);

    float d1 = abs(fract(coord1) - 0.5);
    float d2 = abs(fract(coord2) - 0.5);
    float d3 = abs(fract(coord3) - 0.5);

    float line1 = 1.0 - smoothstep(0.0, 0.09, d1);
    float line2 = 1.0 - smoothstep(0.0, 0.07, d2);
    float line3 = 1.0 - smoothstep(0.0, 0.05, d3);

    float lineIntensity = line1 * 0.40 + line2 * 0.55 + line3 * 0.65;

    // 3D Lighting & Specular glints
    vec3 lightDir = normalize(vec3(0.60, 0.78, 0.85));
    vec3 viewDir = normalize(vec3(0.0, 0.3, 1.0));
    vec3 halfVec = normalize(lightDir + viewDir);

    float diff = max(dot(N, lightDir), 0.0);
    float spec = pow(max(dot(N, halfVec), 0.0), 32.0);
    float fresnel = pow(1.0 - max(dot(N, viewDir), 0.0), 2.0);

    // Color Palette
    vec3 colDeepOrange   = vec3(1.0, 0.42, 0.0);    // #FF6B00
    vec3 colHotEmber     = vec3(1.0, 0.22, 0.08);   // #FF3814
    vec3 colSunburstGold = vec3(1.0, 0.80, 0.18);   // #FFCC2E
    vec3 colVividMagenta = vec3(0.92, 0.18, 0.62);  // #EB2E9E
    vec3 colRoyalViolet  = vec3(0.58, 0.20, 0.92);  // Royal Purple
    vec3 colDeepPurpleBg = vec3(0.14, 0.06, 0.28);  // Deep Dark Violet
    vec3 colLaserWhite   = vec3(1.0, 1.0, 1.0);

    float altitude = clamp((h + 0.55) * 0.90, 0.0, 1.0);

    vec3 lineColor;
    if (altitude < 0.28) {
      lineColor = mix(colRoyalViolet, colVividMagenta, altitude / 0.28);
    } else if (altitude < 0.60) {
      lineColor = mix(colVividMagenta, colDeepOrange, (altitude - 0.28) / 0.32);
    } else if (altitude < 0.86) {
      lineColor = mix(colDeepOrange, colHotEmber, (altitude - 0.60) / 0.26);
    } else {
      lineColor = mix(colHotEmber, colSunburstGold, (altitude - 0.86) / 0.14);
    }

    vec3 litLines = lineColor * (0.95 + lineIntensity * 1.7);
    litLines += colLaserWhite * (spec * (0.80 + lineIntensity * 1.5));
    litLines += mix(colSunburstGold, colLaserWhite, 0.5) * (fresnel * 0.55);

    vec3 baseVeil = mix(colDeepPurpleBg, lineColor * 0.35, diff * 0.5 + 0.5);

    // Surface Coverage Calculation
    float surfaceCoverage;
    if (u_mode > 2.5) {
      // Darker Footer Mode: Sweeps across the bottom of the footer
      surfaceCoverage = exp(-pow((uv.y - 0.5) / 0.45, 2.0) * 1.2) * 0.85;
    } else if (u_mode > 0.5 && u_mode < 1.5) {
      surfaceCoverage = exp(-pow((uv.y - 0.5) / 0.48, 2.0) * 1.5) * 0.95;
    } else if (u_mode >= 1.5 && u_mode <= 2.5) {
      surfaceCoverage = 0.88 + 0.12 * sin(uv.x * 3.14159);
    } else {
      surfaceCoverage = exp(-pow((uv.x - (0.80 - uv.y * 0.50)) / 0.48, 2.0) * 2.4);
    }

    float alpha = surfaceCoverage * clamp(0.40 + lineIntensity * 0.60, 0.0, 1.0);

    float bgGlow1 = exp(-length(uv - vec2(0.85, 0.25)) * 2.5) * 0.35;
    float bgGlow2 = exp(-length(uv - vec2(0.35, 0.70)) * 2.6) * 0.30;
    vec3 glow = colDeepOrange * bgGlow1 + colRoyalViolet * bgGlow2;

    vec3 finalRgb = (litLines * (0.35 + lineIntensity * 0.65) + baseVeil * 0.40) + glow;
    float finalAlpha = clamp(alpha + (bgGlow1 + bgGlow2) * 0.45, 0.0, 0.95);

    if (u_mode > 2.5) {
      // Darker Footer Mode: Rich, dark, moody with glowing subtle amber/purple filaments
      finalRgb = mix(finalRgb * 0.85, vec3(0.12, 0.05, 0.24), 0.35);
      finalAlpha = clamp(finalAlpha * 0.65, 0.0, 0.75);
    } else if (u_mode > 0.5 && u_mode < 1.5) {
      finalRgb = mix(finalRgb, vec3(0.55, 0.15, 0.90), 0.25) * 1.25;
      finalAlpha = clamp(finalAlpha * 1.1, 0.0, 1.0);
    } else if (u_mode >= 1.5 && u_mode <= 2.5) {
      finalRgb = mix(litLines * 1.1, vec3(0.92, 0.38, 0.12), 0.25);
      finalAlpha = clamp(0.20 + lineIntensity * 0.45 + (bgGlow1 + bgGlow2) * 0.22, 0.15, 0.72);
    } else {
      if (u_is_dark < 0.5) {
        finalRgb = mix(finalRgb, vec3(1.0, 0.60, 0.25), 0.10);
        finalAlpha *= 0.92;
      } else {
        finalRgb *= 1.20;
        finalAlpha *= 0.95;
      }
    }

    gl_FragColor = vec4(finalRgb, finalAlpha);
  }
`;

interface WaveMeshProps {
  mode?: "hero" | "purple-section" | "light-section" | "footer" | "dark-footer";
  className?: string;
  heightClass?: string;
}

export function StripeGradientMesh({
  mode = "hero",
  className,
  heightClass = "h-[2600px]",
}: WaveMeshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let animationFrameId: number | null = null;
    let isVisible = true;
    let isTabActive = !document.hidden;

    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    const isDarkMode = () => document.documentElement.classList.contains("dark");

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false, // Turned off for maximum performance
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
      });
      if (gl) {
        gl.getExtension("OES_standard_derivatives");
      }
    } catch {
      gl = null;
    }

    const createShader = (glCtx: WebGLRenderingContext, type: number, source: string) => {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    };

    let posBuffer: WebGLBuffer | null = null;
    let uResolutionLoc: WebGLUniformLocation | null = null;
    let uTimeLoc: WebGLUniformLocation | null = null;
    let uMouseLoc: WebGLUniformLocation | null = null;
    let uIsDarkLoc: WebGLUniformLocation | null = null;
    let uModeLoc: WebGLUniformLocation | null = null;

    if (gl) {
      const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
      const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

      if (vertShader && fragShader) {
        program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vertShader);
          gl.attachShader(program, fragShader);
          gl.linkProgram(program);

          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);

            posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            const positions = new Float32Array([
              -1, -1,
               1, -1,
              -1,  1,
              -1,  1,
               1, -1,
               1,  1,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

            const aPosLoc = gl.getAttribLocation(program, "a_position");
            gl.enableVertexAttribArray(aPosLoc);
            gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

            uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
            uTimeLoc = gl.getUniformLocation(program, "u_time");
            uMouseLoc = gl.getUniformLocation(program, "u_mouse");
            uIsDarkLoc = gl.getUniformLocation(program, "u_is_dark");
            uModeLoc = gl.getUniformLocation(program, "u_mode");
          }
        }
      }
    }

    let bufferW = 0;
    let bufferH = 0;

    const handleResize = () => {
      if (!canvas || !container || !gl) return;
      const rect = container.getBoundingClientRect();
      // Cap DPR to 1.25 for super-smooth 60fps performance and instant loading on phones
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

      const w = Math.floor((rect.width || window.innerWidth) * dpr);
      const h = Math.floor((rect.height || window.innerHeight) * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        bufferW = w;
        bufferH = h;
        gl.viewport(0, 0, w, h);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    let mouseThrottled = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseThrottled) return;
      mouseThrottled = true;
      targetMouseX = e.clientX / window.innerWidth;
      targetMouseY = e.clientY / window.innerHeight;
      setTimeout(() => {
        mouseThrottled = false;
      }, 40);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const startTime = performance.now();
    let lastFrameTime = startTime;
    const targetInterval = 1000 / 60; // 60 FPS

    const render = (now: number) => {
      if (!isVisible || !isTabActive) {
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(render);

      const elapsed = now - lastFrameTime;
      if (elapsed < targetInterval - 1) return;
      lastFrameTime = now;

      const currentTime = (now - startTime) * 0.001;

      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      if (gl && program) {
        gl.useProgram(program);

        if (uResolutionLoc) gl.uniform2f(uResolutionLoc, bufferW, bufferH);
        if (uTimeLoc) gl.uniform1f(uTimeLoc, currentTime);
        if (uMouseLoc) gl.uniform2f(uMouseLoc, mouseX, mouseY);
        if (uIsDarkLoc) gl.uniform1f(uIsDarkLoc, isDarkMode() ? 1.0 : 0.0);
        
        let modeVal = 0.0;
        if (mode === "purple-section") modeVal = 1.0;
        else if (mode === "light-section") modeVal = 2.0;
        else if (mode === "footer" || mode === "dark-footer") modeVal = 3.0;
        if (uModeLoc) gl.uniform1f(uModeLoc, modeVal);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    };

    const startAnimation = () => {
      if (animationFrameId === null && isVisible && isTabActive) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      if (isTabActive) {
        startAnimation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startAnimation();
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(container);

    startAnimation();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      if (gl) {
        if (posBuffer) gl.deleteBuffer(posBuffer);
        if (program) gl.deleteProgram(program);
      }
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-0 w-full overflow-hidden",
        heightClass,
        className,
      )}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full opacity-100 block"
        style={{
          transform: "translate3d(0, 0, 0)",
          willChange: "transform",
        }}
      />
    </div>
  );
}

export default StripeGradientMesh;
