import { useRef, type RefObject } from 'react';
import { cx } from '../lib/cx';
import { formatDepth, formatPressure, formatSunlight, formatTemperature } from '../lib/format';
import type { Descent } from '../ocean/descent';
import { depthAt, pressureAtm, sunlightPercent, temperatureC } from '../ocean/physics';
import { useDescentFrame } from '../ocean/useDescentFrame';
import type { Zone } from '../ocean/zones';
import styles from './Telemetry.module.css';

interface TelemetryProps {
  descent: Descent;
  stops: readonly Zone[];
  variant: 'panel' | 'strip';
}

const write = (ref: RefObject<HTMLElement | null>, text: string) => {
  if (ref.current && ref.current.textContent !== text) ref.current.textContent = text;
};

/** Live readings for the current depth, derived from simple oceanographic models. */
export function Telemetry({ descent, stops, variant }: TelemetryProps) {
  const depth = useRef<HTMLElement>(null);
  const pressure = useRef<HTMLElement>(null);
  const temperature = useRef<HTMLElement>(null);
  const sunlight = useRef<HTMLElement>(null);

  useDescentFrame(descent, ({ position }) => {
    const metres = depthAt(position, stops);
    write(depth, formatDepth(metres));
    write(pressure, formatPressure(pressureAtm(metres)));
    write(temperature, formatTemperature(temperatureC(metres)));
    write(sunlight, formatSunlight(sunlightPercent(metres)));
  });

  return (
    <dl className={cx(styles.telemetry, styles[variant])}>
      <div className={cx(styles.item, styles.depth)}>
        <dt>Depth</dt>
        <dd ref={depth} />
      </div>
      <div className={styles.item}>
        <dt>Pressure</dt>
        <dd ref={pressure} />
      </div>
      <div className={styles.item}>
        <dt>
          <span className={styles.qualifier}>Water </span>temp.
        </dt>
        <dd ref={temperature} />
      </div>
      <div className={styles.item}>
        <dt>Sunlight</dt>
        <dd ref={sunlight} />
      </div>
    </dl>
  );
}
