/**
 * Apple 2026 "Liquid Glass" Optical Refraction SVG Filter Definition.
 * Provides #liquid-glass-refract subtle feTurbulence + feDisplacementMap + specular rim optics.
 */
export function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="fixed w-0 h-0 pointer-events-none overflow-hidden"
    >
      <defs>
        <filter
          id="liquid-glass-refract"
          x="-8%"
          y="-8%"
          width="116%"
          height="116%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011 0.016"
            numOctaves={2}
            seed={7}
            result="refractNoise"
          />
          <feGaussianBlur in="refractNoise" stdDeviation="2.5" result="smoothNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="smoothNoise"
            scale={4}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feSpecularLighting
            in="smoothNoise"
            surfaceScale={2.2}
            specularConstant={0.45}
            specularExponent={28}
            lightingColor="#ffffff"
            result="specularRim"
          >
            <fePointLight x={180} y={-90} z={220} />
          </feSpecularLighting>
          <feComposite
            in="specularRim"
            in2="SourceAlpha"
            operator="in"
            result="clippedRim"
          />
          <feBlend in="displaced" in2="clippedRim" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
