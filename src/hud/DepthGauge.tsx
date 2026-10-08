import { useRef } from 'react';
import { formatDepth } from '../lib/format';
import type { Descent } from '../ocean/descent';
import { depthAt } from '../ocean/physics';
import { useDescentFrame } from '../ocean/useDescentFrame';
import { zoneAtDepth, type Zone } from '../ocean/zones';
import styles from './DepthGauge.module.css';

const MINOR_TICKS_PER_ZONE = 4;

interface DepthGaugeProps {
  descent: Descent;
  stops: readonly Zone[];
}

/** A dive-computer style depth scale. Zones are evenly spaced, not to scale. */
export function DepthGauge({ descent, stops }: DepthGaugeProps) {
  const marker = useRef<HTMLDivElement>(null);
  const travelled = useRef<HTMLDivElement>(null);
  const depth = useRef<HTMLSpanElement>(null);
  const zone = useRef<HTMLSpanElement>(null);
  const last = stops.length - 1;
  const at = (position: number) => `${(position / last) * 100}%`;

  useDescentFrame(descent, ({ position }) => {
    marker.current?.style.setProperty('top', at(position));
    travelled.current?.style.setProperty('height', at(position));
    const metres = depthAt(position, stops);
    if (depth.current) depth.current.textContent = formatDepth(metres);
    if (zone.current) zone.current.textContent = zoneAtDepth(metres, stops).name;
  });

  const minorTicks = stops
    .slice(1)
    .flatMap((_, segment) =>
      Array.from({ length: MINOR_TICKS_PER_ZONE }, (_, i) => segment + (i + 1) / (MINOR_TICKS_PER_ZONE + 1)),
    );

  return (
    <div className={styles.gauge} aria-hidden="true">
      <div className={styles.track} />
      <div ref={travelled} className={styles.travelled} />
      {minorTicks.map((position) => (
        <span key={position} className={styles.minorTick} style={{ top: at(position) }} />
      ))}
      <ol className={styles.scale}>
        {stops.map((stop, i) => (
          <li key={stop.id + i} className={styles.stop} style={{ top: at(i) }}>
            <span className={styles.stopLabel}>{formatDepth(stop.depth)}</span>
            <span className={styles.tick} />
          </li>
        ))}
      </ol>
      <div ref={marker} className={styles.marker}>
        <span className={styles.dot} />
        <span className={styles.readout}>
          <span ref={depth} className={styles.depth} />
          <span ref={zone} className={styles.zone} />
        </span>
      </div>
    </div>
  );
}
