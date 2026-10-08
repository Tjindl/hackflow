import { useCallback, useRef, useState } from 'react';
import { waterColorsAt } from './palette';
import { OceanRenderer, type OceanScene } from './renderer';
import { useDescentFrame } from './useDescentFrame';
import styles from './OceanBackground.module.css';

interface OceanBackgroundProps {
  scene: OceanScene;
  /** False when the user prefers reduced motion: a still frame is drawn per step instead. */
  animate: boolean;
}

export function OceanBackground({ scene, animate }: OceanBackgroundProps) {
  const [failed, setFailed] = useState(false);

  // A ref callback with cleanup ties the renderer's lifetime to the canvas element.
  const attachRenderer = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      let renderer: OceanRenderer;
      try {
        renderer = new OceanRenderer(canvas, scene, animate);
      } catch (error) {
        console.warn('[hackflow] WebGL ocean unavailable, using the CSS fallback.', error);
        setFailed(true);
        return;
      }
      renderer.start();
      return () => renderer.dispose();
    },
    [scene, animate],
  );

  if (failed) return <GradientOcean scene={scene} />;
  return <canvas ref={attachRenderer} className={styles.layer} aria-hidden="true" />;
}

/** The same water colours as the shader, without the lighting and sea life. */
function GradientOcean({ scene }: { scene: OceanScene }) {
  const ref = useRef<HTMLDivElement>(null);

  useDescentFrame(scene.descent, ({ position }) => {
    const { top, bottom } = waterColorsAt(scene.levelAt(position));
    ref.current?.style.setProperty('background', `linear-gradient(${top}, ${bottom})`);
  });

  return <div ref={ref} className={styles.layer} aria-hidden="true" />;
}
